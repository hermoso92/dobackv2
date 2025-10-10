import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import fs from 'fs';
import { logger } from '../utils/logger';
import {
    parseCANFile,
    parseGPSFile,
    parseRotativoFile,
    parseStabilityFile,
    synchronizeTimestamps
} from '../utils/sessionParsers';
import { AdvancedKPICalculationService } from './AdvancedKPICalculationService';
import { FileInfo, FileWatcherService } from './FileWatcherService';
import { processAndSaveStabilityEvents } from './StabilityEventService';

export interface SessionGroup {
    vehicleId: string;
    date: string;
    files: {
        CAN: FileInfo[];
        GPS: FileInfo[];
        ESTABILIDAD: FileInfo[];
        ROTATIVO: FileInfo[];
    };
    organizationId: string;
}

export interface ProcessingResult {
    success: boolean;
    sessionId?: string;
    error?: string;
    filesProcessed: number;
    dataInserted: {
        gps: number;
        stability: number;
        can: number;
        rotativo: number;
    };
    kpisCalculated: boolean;
}

export class AutoSessionProcessor extends EventEmitter {
    private prisma: PrismaClient;
    private fileWatcher: FileWatcherService;
    private kpiService: AdvancedKPICalculationService;
    private isProcessing: boolean = false;
    private processingQueue: SessionGroup[] = [];

    constructor() {
        super();
        this.prisma = new PrismaClient();
        this.fileWatcher = new FileWatcherService();
        this.kpiService = new AdvancedKPICalculationService();
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.fileWatcher.on('fileDetected', this.handleFileDetected.bind(this));
        this.on('sessionProcessed', this.handleSessionProcessed.bind(this));
        this.on('sessionError', this.handleSessionError.bind(this));
    }

    /**
     * Inicia el procesamiento automático
     */
    public async startProcessing(basePath: string): Promise<void> {
        logger.info('🚀 Iniciando procesamiento automático de sesiones...');

        // Iniciar monitoreo de archivos
        this.fileWatcher.startWatching(basePath);

        // Procesar cola de archivos pendientes
        await this.processPendingFiles();

        logger.info('✅ Procesamiento automático iniciado');
    }

    /**
     * Detiene el procesamiento automático
     */
    public async stopProcessing(): Promise<void> {
        logger.info('🛑 Deteniendo procesamiento automático...');

        this.fileWatcher.stopWatching();
        this.isProcessing = false;

        await this.prisma.$disconnect();
        logger.info('✅ Procesamiento automático detenido');
    }

    /**
     * Maneja archivos detectados
     */
    private async handleFileDetected(fileInfo: FileInfo): Promise<void> {
        logger.info(`📄 Archivo detectado: ${fileInfo.fileName}`);

        // Agrupar archivos por vehículo y fecha
        await this.groupFiles(fileInfo);

        // Procesar si hay grupos completos
        await this.processCompleteGroups();
    }

    /**
     * Agrupa archivos por vehículo y fecha
     */
    private async groupFiles(fileInfo: FileInfo): Promise<void> {
        const groupKey = `${fileInfo.vehicleId}_${fileInfo.date}`;

        // Buscar grupo existente
        let group = this.processingQueue.find(g =>
            g.vehicleId === fileInfo.vehicleId && g.date === fileInfo.date
        );

        if (!group) {
            // Crear nuevo grupo
            group = {
                vehicleId: fileInfo.vehicleId,
                date: fileInfo.date,
                files: {
                    CAN: [],
                    GPS: [],
                    ESTABILIDAD: [],
                    ROTATIVO: []
                },
                organizationId: 'CMadrid' // Por ahora hardcodeado, después se puede hacer dinámico
            };
            this.processingQueue.push(group);
        }

        // Agregar archivo al grupo
        group.files[fileInfo.fileType].push(fileInfo);

        logger.info(`📁 Archivo agregado al grupo: ${groupKey} (${fileInfo.fileType})`);
    }

    /**
     * Procesa grupos completos de archivos
     */
    private async processCompleteGroups(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        const completeGroups = this.processingQueue.filter(group =>
            this.isGroupComplete(group)
        );

        if (completeGroups.length === 0) {
            return;
        }

        this.isProcessing = true;

        for (const group of completeGroups) {
            try {
                await this.processSessionGroup(group);
            } catch (error) {
                logger.error(`❌ Error procesando grupo ${group.vehicleId}_${group.date}:`, error);
                this.emit('sessionError', group, error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Verifica si un grupo está completo para procesamiento
     */
    private isGroupComplete(group: SessionGroup): boolean {
        // Un grupo está completo si tiene al menos GPS o ESTABILIDAD
        return group.files.GPS.length > 0 || group.files.ESTABILIDAD.length > 0;
    }

    /**
     * Procesa un grupo de archivos como sesión
     */
    private async processSessionGroup(group: SessionGroup): Promise<ProcessingResult> {
        logger.info(`🔄 Procesando grupo: ${group.vehicleId}_${group.date}`);

        try {
            // Obtener vehículo
            const vehicle = await this.getVehicle(group.vehicleId, group.organizationId);
            if (!vehicle) {
                throw new Error(`Vehículo ${group.vehicleId} no encontrado`);
            }

            // Procesar archivos
            const processedData = await this.processFiles(group);

            // Crear sesión
            const session = await this.createSession(vehicle.id, group.organizationId, processedData);

            // Insertar datos en la base de datos
            await this.insertSessionData(session.id, processedData);

            // Generar eventos de estabilidad
            if (processedData.stabilityData.length > 0) {
                await processAndSaveStabilityEvents(session.id);
            }

            // Calcular KPIs avanzados
            let kpisCalculated = false;
            try {
                const sessionDate = new Date(group.date);
                await this.kpiService.calculateAndStoreDailyKPIs(vehicle.id, sessionDate, group.organizationId);
                kpisCalculated = true;
                logger.info(`📊 KPIs calculados para ${group.vehicleId} en ${group.date}`);
            } catch (kpiError) {
                logger.error(`⚠️ Error calculando KPIs para ${group.vehicleId}:`, kpiError);
            }

            // Marcar archivos como procesados
            this.markFilesAsProcessed(group, session.id);

            const result: ProcessingResult = {
                success: true,
                sessionId: session.id,
                filesProcessed: this.countFilesInGroup(group),
                dataInserted: {
                    gps: processedData.gpsData.length,
                    stability: processedData.stabilityData.length,
                    can: processedData.canData.length,
                    rotativo: processedData.rotativoData.length
                },
                kpisCalculated
            };

            this.emit('sessionProcessed', group, result);
            logger.info(`✅ Grupo procesado exitosamente: ${group.vehicleId}_${group.date}`);

            return result;

        } catch (error) {
            logger.error(`❌ Error procesando grupo ${group.vehicleId}_${group.date}:`, error);

            const result: ProcessingResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
                filesProcessed: 0,
                dataInserted: { gps: 0, stability: 0, can: 0, rotativo: 0 },
                kpisCalculated: false
            };

            this.emit('sessionError', group, result);
            return result;
        }
    }

    /**
     * Obtiene un vehículo por ID y organización
     */
    private async getVehicle(vehicleId: string, organizationId: string) {
        return await this.prisma.vehicle.findFirst({
            where: {
                name: vehicleId,
                organizationId: organizationId
            }
        });
    }

    /**
     * Procesa archivos de un grupo
     */
    private async processFiles(group: SessionGroup): Promise<{
        gpsData: any[];
        stabilityData: any[];
        canData: any[];
        rotativoData: any[];
    }> {
        const descartes: Record<string, any[]> = {
            CAN: [],
            GPS: [],
            ESTABILIDAD: [],
            ROTATIVO: []
        };

        // Procesar archivos GPS
        const gpsData: any[] = [];
        for (const fileInfo of group.files.GPS) {
            try {
                const buffer = fs.readFileSync(fileInfo.filePath);
                const data = parseGPSFile(buffer, descartes);
                gpsData.push(...data);
                logger.info(`📍 Procesados ${data.length} puntos GPS de ${fileInfo.fileName}`);
            } catch (error) {
                logger.error(`❌ Error procesando GPS ${fileInfo.fileName}:`, error);
            }
        }

        // Procesar archivos de estabilidad
        const stabilityData: any[] = [];
        for (const fileInfo of group.files.ESTABILIDAD) {
            try {
                const buffer = fs.readFileSync(fileInfo.filePath);
                const data = parseStabilityFile(buffer, descartes);
                stabilityData.push(...data);
                logger.info(`⚖️ Procesados ${data.length} puntos de estabilidad de ${fileInfo.fileName}`);
            } catch (error) {
                logger.error(`❌ Error procesando estabilidad ${fileInfo.fileName}:`, error);
            }
        }

        // Procesar archivos CAN
        const canData: any[] = [];
        for (const fileInfo of group.files.CAN) {
            try {
                const buffer = fs.readFileSync(fileInfo.filePath);
                const data = parseCANFile(buffer, descartes);
                canData.push(...data);
                logger.info(`🚗 Procesados ${data.length} frames CAN de ${fileInfo.fileName}`);
            } catch (error) {
                logger.error(`❌ Error procesando CAN ${fileInfo.fileName}:`, error);
            }
        }

        // Procesar archivos rotativo
        const rotativoData: any[] = [];
        for (const fileInfo of group.files.ROTATIVO) {
            try {
                const buffer = fs.readFileSync(fileInfo.filePath);
                const data = parseRotativoFile(buffer, descartes);
                rotativoData.push(...data);
                logger.info(`🔄 Procesados ${data.length} puntos rotativo de ${fileInfo.fileName}`);
            } catch (error) {
                logger.error(`❌ Error procesando rotativo ${fileInfo.fileName}:`, error);
            }
        }

        // Sincronizar timestamps entre GPS y estabilidad
        const { gpsData: syncedGpsData, stabilityData: syncedStabilityData } =
            synchronizeTimestamps(gpsData, stabilityData);

        return {
            gpsData: syncedGpsData,
            stabilityData: syncedStabilityData,
            canData,
            rotativoData
        };
    }

    /**
     * Crea una sesión en la base de datos
     */
    private async createSession(vehicleId: string, organizationId: string, data: any) {
        // Obtener timestamps globales
        let minTimestamp: number | null = null;
        let maxTimestamp: number | null = null;

        const allData = [data.gpsData, data.stabilityData, data.canData, data.rotativoData];
        for (const arr of allData) {
            for (const d of arr) {
                const ts = this.getTimestamp(d.timestamp);
                if (!isNaN(ts)) {
                    if (minTimestamp === null || ts < minTimestamp) minTimestamp = ts;
                    if (maxTimestamp === null || ts > maxTimestamp) maxTimestamp = ts;
                }
            }
        }

        if (minTimestamp === null || maxTimestamp === null) {
            throw new Error('No se encontraron timestamps válidos en los datos');
        }

        const startTime = new Date(minTimestamp);
        const endTime = new Date(maxTimestamp);

        // Obtener el último número de sesión
        const lastSession = await this.prisma.session.findFirst({
            where: { vehicleId },
            orderBy: { sessionNumber: 'desc' }
        });

        const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

        // Crear sesión
        const session = await this.prisma.session.create({
            data: {
                vehicleId,
                userId: 'system', // Usuario del sistema
                organizationId,
                startTime,
                endTime,
                sessionNumber,
                sequence: 1,
                updatedAt: new Date(),
                source: 'automatic'
            }
        });

        logger.info(`✅ Sesión creada: ${session.id} (${sessionNumber})`);
        return session;
    }

    /**
     * Inserta datos de la sesión en la base de datos
     */
    private async insertSessionData(sessionId: string, data: any): Promise<void> {
        // Insertar datos GPS
        if (data.gpsData.length > 0) {
            logger.info(`📍 Insertando ${data.gpsData.length} puntos GPS`);

            for (let i = 0; i < data.gpsData.length; i += 1000) {
                const batch = data.gpsData.slice(i, i + 1000).map((point: any) => ({
                    sessionId,
                    timestamp: point.timestamp,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    altitude: point.altitude,
                    speed: point.speed,
                    satellites: point.satellites || 0,
                    hdop: point.hdop || null,
                    fix: point.fix?.toString() || null,
                    heading: point.heading || null,
                    accuracy: point.accuracy || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                await this.prisma.gpsMeasurement.createMany({
                    data: batch,
                    skipDuplicates: true
                });
            }
        }

        // Insertar datos de estabilidad
        if (data.stabilityData.length > 0) {
            logger.info(`⚖️ Insertando ${data.stabilityData.length} puntos de estabilidad`);

            for (let i = 0; i < data.stabilityData.length; i += 1000) {
                const batch = data.stabilityData
                    .slice(i, i + 1000)
                    .filter((point: any) => {
                        const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                        return requiredFields.every(field =>
                            point[field] !== undefined && point[field] !== null
                        );
                    })
                    .map((point: any) => ({
                        sessionId,
                        timestamp: new Date(point.timestamp),
                        ax: Number(point.ax),
                        ay: Number(point.ay),
                        az: Number(point.az),
                        gx: Number(point.gx),
                        gy: Number(point.gy),
                        gz: Number(point.gz),
                        si: point.si ? Number(point.si) : 0,
                        accmag: point.accmag ? Number(point.accmag) : 0,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));

                if (batch.length > 0) {
                    await this.prisma.stabilityMeasurement.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                }
            }
        }

        // Insertar datos CAN
        if (data.canData.length > 0) {
            logger.info(`🚗 Insertando ${data.canData.length} frames CAN`);

            for (let i = 0; i < data.canData.length; i += 1000) {
                const batch = data.canData.slice(i, i + 1000).map((point: any) => ({
                    sessionId,
                    timestamp: typeof point.timestamp === 'string'
                        ? this.parseTimestamp(point.timestamp)
                        : new Date(point.timestamp),
                    engineRpm: point.engineRpm,
                    vehicleSpeed: point.vehicleSpeed,
                    fuelSystemStatus: point.fuelSystemStatus,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                await this.prisma.canMeasurement.createMany({
                    data: batch,
                    skipDuplicates: true
                });
            }
        }

        // Insertar datos rotativo
        if (data.rotativoData.length > 0) {
            logger.info(`🔄 Insertando ${data.rotativoData.length} puntos rotativo`);

            for (let i = 0; i < data.rotativoData.length; i += 1000) {
                const batch = data.rotativoData.slice(i, i + 1000).map((point: any) => ({
                    sessionId,
                    timestamp: typeof point.timestamp === 'string'
                        ? this.parseTimestamp(point.timestamp)
                        : point.timestamp,
                    state: point.state.toString(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                await this.prisma.rotativoMeasurement.createMany({
                    data: batch,
                    skipDuplicates: true
                });
            }
        }
    }

    /**
     * Marca archivos como procesados
     */
    private markFilesAsProcessed(group: SessionGroup, sessionId: string): void {
        for (const fileType of ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'] as const) {
            for (const fileInfo of group.files[fileType]) {
                this.fileWatcher.emit('fileProcessed', fileInfo, sessionId);
            }
        }
    }

    /**
     * Cuenta archivos en un grupo
     */
    private countFilesInGroup(group: SessionGroup): number {
        return group.files.CAN.length +
            group.files.GPS.length +
            group.files.ESTABILIDAD.length +
            group.files.ROTATIVO.length;
    }

    /**
     * Procesa archivos pendientes
     */
    private async processPendingFiles(): Promise<void> {
        const pendingFiles = this.fileWatcher.getPendingFiles();

        if (pendingFiles.length > 0) {
            logger.info(`📋 Procesando ${pendingFiles.length} archivos pendientes...`);

            for (const fileInfo of pendingFiles) {
                await this.groupFiles(fileInfo);
            }

            await this.processCompleteGroups();
        }
    }

    /**
     * Maneja sesiones procesadas exitosamente
     */
    private handleSessionProcessed(group: SessionGroup, result: ProcessingResult): void {
        logger.info(`✅ Sesión procesada: ${group.vehicleId}_${group.date} (${result.sessionId})`);

        // Remover grupo de la cola
        const index = this.processingQueue.findIndex(g =>
            g.vehicleId === group.vehicleId && g.date === group.date
        );
        if (index !== -1) {
            this.processingQueue.splice(index, 1);
        }
    }

    /**
     * Maneja errores de procesamiento
     */
    private handleSessionError(group: SessionGroup, error: any): void {
        logger.error(`❌ Error en sesión: ${group.vehicleId}_${group.date}`, error);
    }

    /**
     * Obtiene timestamp como número
     */
    private getTimestamp(timestamp: string | Date): number {
        if (timestamp instanceof Date) {
            return timestamp.getTime();
        } else {
            return this.parseTimestamp(timestamp).getTime();
        }
    }

    /**
     * Parsea timestamps en múltiples formatos
     */
    private parseTimestamp(timestampStr: string): Date {
        try {
            const date = new Date(timestampStr);
            if (!isNaN(date.getTime())) {
                return date;
            }

            // dd/mm/yyyy hh:mm:ss
            const match1 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
            if (match1) {
                const [, day, month, year, hour, minute, second] = match1;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
            }

            // dd/mm/yyyy hh:mm:ssAM/PM
            const match2 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/);
            if (match2) {
                const [, day, month, year, hour, minute, second, ampm] = match2;
                let hour24 = parseInt(hour);
                if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
                if (ampm === 'AM' && hour24 === 12) hour24 = 0;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
            }

            return new Date();
        } catch (error) {
            logger.warn(`⚠️ Error parseando timestamp: "${timestampStr}"`);
            return new Date();
        }
    }

    /**
     * Obtiene estadísticas del procesamiento
     */
    public getStats(): {
        isProcessing: boolean;
        queueLength: number;
        fileWatcherStats: any;
    } {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.processingQueue.length,
            fileWatcherStats: this.fileWatcher.getStats()
        };
    }
}