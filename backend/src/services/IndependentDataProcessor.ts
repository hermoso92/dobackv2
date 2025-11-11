
import fs from 'fs/promises';
import { prisma } from '../lib/prisma';
import path from 'path';
import { logger } from '../utils/logger';
import {
    parseCANFile,
    parseGPSFile,
    parseRotativoFile,
    parseStabilityFile
} from '../utils/sessionParsers';



interface FileProcessingResult {
    success: boolean;
    dataCount: number;
    timeRange: { start: Date; end: Date } | null;
    errors: string[];
    fileName: string;
}

interface DataProcessorConfig {
    organizationId: string;
    vehicleId: string;
    date: string;
    basePath: string;
}

export class IndependentDataProcessor {
    private config: DataProcessorConfig;
    private processingLog: FileProcessingResult[] = [];

    constructor(config: DataProcessorConfig) {
        this.config = config;
    }

    /**
     * Procesa todos los archivos de un tipo específico de forma independiente
     */
    async processAllFilesByType(): Promise<void> {
        logger.info(`🚀 Iniciando procesamiento independiente para vehículo ${this.config.vehicleId}`, {
            organizationId: this.config.organizationId,
            date: this.config.date,
            basePath: this.config.basePath
        });

        // Procesar cada tipo de archivo independientemente
        await Promise.all([
            this.processCANFiles(),
            this.processStabilityFiles(),
            this.processGPSFiles(),
            this.processRotativoFiles()
        ]);

        // Crear sesiones dinámicas basadas en los datos procesados
        await this.createDynamicSessions();

        // Calcular KPIs
        await this.calculateKPIs();

        logger.info(`✅ Procesamiento independiente completado para vehículo ${this.config.vehicleId}`, {
            totalFilesProcessed: this.processingLog.length,
            successfulFiles: this.processingLog.filter(r => r.success).length,
            totalDataPoints: this.processingLog.reduce((sum, r) => sum + r.dataCount, 0)
        });
    }

    /**
     * Procesa todos los archivos CAN del día
     */
    private async processCANFiles(): Promise<void> {
        const canPath = path.join(this.config.basePath, 'CAN');

        try {
            const files = await this.getFilesByPattern(canPath, 'CAN_*.txt', 'CAN_*_TRADUCIDO.csv');
            logger.info(`📁 Encontrados ${files.length} archivos CAN para procesar`);

            for (const file of files) {
                await this.processCANFile(file);
            }
        } catch (error) {
            logger.error(`Error procesando archivos CAN: ${error}`);
        }
    }

    /**
     * Procesa todos los archivos de estabilidad del día
     */
    private async processStabilityFiles(): Promise<void> {
        const stabilityPath = path.join(this.config.basePath, 'estabilidad');

        try {
            const files = await this.getFilesByPattern(stabilityPath, 'ESTABILIDAD_*.txt');
            logger.info(`📁 Encontrados ${files.length} archivos de estabilidad para procesar`);

            for (const file of files) {
                await this.processStabilityFile(file);
            }
        } catch (error) {
            logger.error(`Error procesando archivos de estabilidad: ${error}`);
        }
    }

    /**
     * Procesa todos los archivos GPS del día
     */
    private async processGPSFiles(): Promise<void> {
        const gpsPath = path.join(this.config.basePath, 'GPS');

        try {
            const files = await this.getFilesByPattern(gpsPath, 'GPS_*.txt');
            logger.info(`📁 Encontrados ${files.length} archivos GPS para procesar`);

            for (const file of files) {
                await this.processGPSFile(file);
            }
        } catch (error) {
            logger.error(`Error procesando archivos GPS: ${error}`);
        }
    }

    /**
     * Procesa todos los archivos rotativos del día
     */
    private async processRotativoFiles(): Promise<void> {
        const rotativoPath = path.join(this.config.basePath, 'ROTATIVO');

        try {
            const files = await this.getFilesByPattern(rotativoPath, 'ROTATIVO_*.txt');
            logger.info(`📁 Encontrados ${files.length} archivos rotativos para procesar`);

            for (const file of files) {
                await this.processRotativoFile(file);
            }
        } catch (error) {
            logger.error(`Error procesando archivos rotativos: ${error}`);
        }
    }

    /**
     * Obtiene archivos que coincidan con los patrones especificados
     */
    private async getFilesByPattern(directory: string, ...patterns: string[]): Promise<string[]> {
        try {
            const files = await fs.readdir(directory);
            const matchingFiles: string[] = [];

            for (const file of files) {
                const fullPath = path.join(directory, file);
                const stat = await fs.stat(fullPath);

                if (stat.isFile()) {
                    for (const pattern of patterns) {
                        if (this.matchesPattern(file, pattern)) {
                            matchingFiles.push(fullPath);
                            break;
                        }
                    }
                }
            }

            return matchingFiles.sort();
        } catch (error) {
            logger.warn(`No se pudo leer directorio ${directory}: ${error}`);
            return [];
        }
    }

    /**
     * Verifica si un archivo coincide con un patrón
     */
    private matchesPattern(fileName: string, pattern: string): boolean {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
    }

    /**
     * Procesa un archivo CAN individual
     */
    private async processCANFile(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        logger.info(`🚗 Procesando archivo CAN: ${fileName}`);

        try {
            const buffer = await fs.readFile(filePath);
            const descartes: any = { CAN: [] };

            const canData = parseCANFile(buffer, descartes);

            if (canData.length === 0) {
                this.processingLog.push({
                    success: false,
                    dataCount: 0,
                    timeRange: null,
                    errors: ['No se encontraron datos válidos'],
                    fileName
                });
                return;
            }

            // Guardar datos CAN en la base de datos
            await this.saveCANData(canData, fileName);

            // Calcular rango temporal
            const timestamps = canData.map(d => this.parseTimestamp(d.timestamp));
            const timeRange = this.calculateTimeRange(timestamps);

            this.processingLog.push({
                success: true,
                dataCount: canData.length,
                timeRange,
                errors: [],
                fileName
            });

            logger.info(`✅ CAN procesado: ${canData.length} registros, ${descartes.CAN.length} descartados`);

        } catch (error) {
            logger.error(`Error procesando archivo CAN ${fileName}: ${error}`);
            this.processingLog.push({
                success: false,
                dataCount: 0,
                timeRange: null,
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                fileName
            });
        }
    }

    /**
     * Procesa un archivo de estabilidad individual
     */
    private async processStabilityFile(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        logger.info(`⚖️ Procesando archivo de estabilidad: ${fileName}`);

        try {
            const buffer = await fs.readFile(filePath);
            const descartes: any = { ESTABILIDAD: [] };

            const stabilityData = parseStabilityFile(buffer, descartes);

            if (stabilityData.length === 0) {
                this.processingLog.push({
                    success: false,
                    dataCount: 0,
                    timeRange: null,
                    errors: ['No se encontraron datos válidos'],
                    fileName
                });
                return;
            }

            // Guardar datos de estabilidad en la base de datos
            await this.saveStabilityData(stabilityData, fileName);

            // Calcular rango temporal
            const timestamps = stabilityData.map(d => new Date(d.timestamp));
            const timeRange = this.calculateTimeRange(timestamps);

            this.processingLog.push({
                success: true,
                dataCount: stabilityData.length,
                timeRange,
                errors: [],
                fileName
            });

            logger.info(`✅ Estabilidad procesada: ${stabilityData.length} registros, ${descartes.ESTABILIDAD.length} descartados`);

        } catch (error) {
            logger.error(`Error procesando archivo de estabilidad ${fileName}: ${error}`);
            this.processingLog.push({
                success: false,
                dataCount: 0,
                timeRange: null,
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                fileName
            });
        }
    }

    /**
     * Procesa un archivo GPS individual
     */
    private async processGPSFile(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        logger.info(`📍 Procesando archivo GPS: ${fileName}`);

        try {
            const buffer = await fs.readFile(filePath);
            const descartes: any = { GPS: [] };

            const gpsData = parseGPSFile(buffer, descartes);

            if (gpsData.length === 0) {
                this.processingLog.push({
                    success: false,
                    dataCount: 0,
                    timeRange: null,
                    errors: ['No se encontraron datos válidos'],
                    fileName
                });
                return;
            }

            // Guardar datos GPS en la base de datos
            await this.saveGPSData(gpsData, fileName);

            // Calcular rango temporal
            const timestamps = gpsData.map(d => d.timestamp);
            const timeRange = this.calculateTimeRange(timestamps);

            this.processingLog.push({
                success: true,
                dataCount: gpsData.length,
                timeRange,
                errors: [],
                fileName
            });

            logger.info(`✅ GPS procesado: ${gpsData.length} registros, ${descartes.GPS.length} descartados`);

        } catch (error) {
            logger.error(`Error procesando archivo GPS ${fileName}: ${error}`);
            this.processingLog.push({
                success: false,
                dataCount: 0,
                timeRange: null,
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                fileName
            });
        }
    }

    /**
     * Procesa un archivo rotativo individual
     */
    private async processRotativoFile(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        logger.info(`🔄 Procesando archivo rotativo: ${fileName}`);

        try {
            const buffer = await fs.readFile(filePath);
            const descartes: any = { ROTATIVO: [] };

            const rotativoData = parseRotativoFile(buffer, descartes);

            if (rotativoData.length === 0) {
                this.processingLog.push({
                    success: false,
                    dataCount: 0,
                    timeRange: null,
                    errors: ['No se encontraron datos válidos'],
                    fileName
                });
                return;
            }

            // Guardar datos rotativos en la base de datos
            await this.saveRotativoData(rotativoData, fileName);

            // Calcular rango temporal
            const timestamps = rotativoData.map(d => this.parseTimestamp(d.timestamp));
            const timeRange = this.calculateTimeRange(timestamps);

            this.processingLog.push({
                success: true,
                dataCount: rotativoData.length,
                timeRange,
                errors: [],
                fileName
            });

            logger.info(`✅ Rotativo procesado: ${rotativoData.length} registros, ${descartes.ROTATIVO.length} descartados`);

        } catch (error) {
            logger.error(`Error procesando archivo rotativo ${fileName}: ${error}`);
            this.processingLog.push({
                success: false,
                dataCount: 0,
                timeRange: null,
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                fileName
            });
        }
    }

    /**
     * Guarda datos CAN en la base de datos
     */
    private async saveCANData(canData: any[], fileName: string): Promise<void> {
        // Crear sesión temporal para estos datos
        const timeRange = this.calculateTimeRange(canData.map(d => this.parseTimestamp(d.timestamp)));

        const session = await this.createOrGetSession('can', timeRange, fileName);

        // Insertar datos en lotes
        for (let i = 0; i < canData.length; i += 1000) {
            const batch = canData.slice(i, i + 1000).map((data) => ({
                sessionId: session.id,
                timestamp: this.parseTimestamp(data.timestamp),
                engineRpm: data.engineRpm,
                vehicleSpeed: data.vehicleSpeed,
                fuelSystemStatus: data.fuelSystemStatus,
                sourceFile: fileName,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await prisma.canMeasurement.createMany({
                data: batch,
                skipDuplicates: true
            });
        }
    }

    /**
     * Guarda datos de estabilidad en la base de datos
     */
    private async saveStabilityData(stabilityData: any[], fileName: string): Promise<void> {
        const timeRange = this.calculateTimeRange(stabilityData.map(d => new Date(d.timestamp)));

        const session = await this.createOrGetSession('stability', timeRange, fileName);

        // Insertar datos en lotes
        for (let i = 0; i < stabilityData.length; i += 1000) {
            const batch = stabilityData.slice(i, i + 1000).map((data) => ({
                sessionId: session.id,
                timestamp: new Date(data.timestamp),
                ax: Number(data.ax),
                ay: Number(data.ay),
                az: Number(data.az),
                gx: Number(data.gx),
                gy: Number(data.gy),
                gz: Number(data.gz),
                si: normalizeUploadedSi(data.si),
                accmag: data.accmag ? Number(data.accmag) : 0,
                sourceFile: fileName,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await prisma.stabilityMeasurement.createMany({
                data: batch,
                skipDuplicates: true
            });
        }
    }

    /**
     * Guarda datos GPS en la base de datos
     */
    private async saveGPSData(gpsData: any[], fileName: string): Promise<void> {
        const timeRange = this.calculateTimeRange(gpsData.map(d => d.timestamp));

        const session = await this.createOrGetSession('gps', timeRange, fileName);

        // Insertar datos en lotes
        for (let i = 0; i < gpsData.length; i += 1000) {
            const batch = gpsData.slice(i, i + 1000).map((data) => ({
                sessionId: session.id,
                timestamp: data.timestamp,
                latitude: data.latitude,
                longitude: data.longitude,
                altitude: data.altitude,
                speed: data.speed,
                satellites: data.satellites || 0,
                hdop: data.hdop || null,
                fix: data.fix?.toString() || null,
                heading: data.heading || null,
                accuracy: data.accuracy || null,
                sourceFile: fileName,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await prisma.gpsMeasurement.createMany({
                data: batch,
                skipDuplicates: true
            });
        }
    }

    /**
     * Guarda datos rotativos en la base de datos
     */
    private async saveRotativoData(rotativoData: any[], fileName: string): Promise<void> {
        const timeRange = this.calculateTimeRange(rotativoData.map(d => this.parseTimestamp(d.timestamp)));

        const session = await this.createOrGetSession('rotativo', timeRange, fileName);

        // Insertar datos en lotes
        for (let i = 0; i < rotativoData.length; i += 1000) {
            const batch = rotativoData.slice(i, i + 1000).map((data) => ({
                sessionId: session.id,
                timestamp: this.parseTimestamp(data.timestamp),
                state: data.state.toString(),
                sourceFile: fileName,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            await prisma.rotativoMeasurement.createMany({
                data: batch,
                skipDuplicates: true
            });
        }
    }

    /**
     * Crea o obtiene una sesión para los datos
     */
    private async createOrGetSession(dataType: string, timeRange: { start: Date; end: Date } | null, fileName: string) {
        if (!timeRange) {
            throw new Error('No se puede crear sesión sin rango temporal válido');
        }

        // Buscar sesión existente que se superponga con este rango temporal
        const existingSession = await prisma.session.findFirst({
            where: {
                vehicleId: this.config.vehicleId,
                organizationId: this.config.organizationId,
                startTime: { lte: timeRange.end },
                endTime: { gte: timeRange.start }
            }
        });

        if (existingSession) {
            // Actualizar rango temporal si es necesario
            const newStartTime = new Date(Math.min(existingSession.startTime.getTime(), timeRange.start.getTime()));
            const newEndTime = new Date(Math.max(existingSession.endTime.getTime(), timeRange.end.getTime()));

            return await prisma.session.update({
                where: { id: existingSession.id },
                data: {
                    startTime: newStartTime,
                    endTime: newEndTime,
                    updatedAt: new Date()
                }
            });
        }

        // Crear nueva sesión
        const sessionNumber = await this.getNextSessionNumber();

        return await prisma.session.create({
            data: {
                vehicleId: this.config.vehicleId,
                organizationId: this.config.organizationId,
                startTime: timeRange.start,
                endTime: timeRange.end,
                sessionNumber,
                sequence: 1,
                source: 'independent_processing',
                metadata: {
                    dataType,
                    fileName,
                    processingDate: this.config.date
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    }

    /**
     * Obtiene el siguiente número de sesión para el vehículo
     */
    private async getNextSessionNumber(): Promise<number> {
        const lastSession = await prisma.session.findFirst({
            where: {
                vehicleId: this.config.vehicleId,
                organizationId: this.config.organizationId
            },
            orderBy: { sessionNumber: 'desc' }
        });

        return lastSession ? lastSession.sessionNumber + 1 : 1;
    }

    /**
     * Crea sesiones dinámicas basadas en los datos procesados
     */
    private async createDynamicSessions(): Promise<void> {
        logger.info(`🔄 Creando sesiones dinámicas para vehículo ${this.config.vehicleId}`);

        // Esta función se implementará en el siguiente paso
        // Por ahora, las sesiones se crean automáticamente en saveXXXData
    }

    /**
     * Calcula KPIs para el vehículo
     */
    private async calculateKPIs(): Promise<void> {
        logger.info(`📊 Calculando KPIs para vehículo ${this.config.vehicleId}`);

        try {
            const { calculateVehicleKPI } = require('./calculateVehicleKPI');
            await calculateVehicleKPI(this.config.vehicleId, new Date(this.config.date), this.config.organizationId);
            logger.info('✅ KPIs calculados correctamente');
        } catch (error) {
            logger.error('Error calculando KPIs:', error);
        }
    }

    /**
     * Parsea un timestamp en diferentes formatos
     */
    private parseTimestamp(timestamp: string | Date): Date {
        if (timestamp instanceof Date) {
            return timestamp;
        }

        try {
            // Intentar parsing directo
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date;
            }

            // Parsear formato DD/MM/YYYY HH:mm:ss
            const match = timestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/);
            if (match) {
                const [, day, month, year, hour, minute, second] = match;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
            }

            logger.warn(`No se pudo parsear timestamp: ${timestamp}`);
            return new Date();
        } catch (error) {
            logger.warn(`Error parseando timestamp: ${timestamp}`);
            return new Date();
        }
    }

    /**
     * Calcula el rango temporal de un array de fechas
     */
    private calculateTimeRange(timestamps: Date[]): { start: Date; end: Date } | null {
        if (timestamps.length === 0) {
            return null;
        }

        const validTimestamps = timestamps.filter(ts => !isNaN(ts.getTime()));
        if (validTimestamps.length === 0) {
            return null;
        }

        const start = new Date(Math.min(...validTimestamps.map(ts => ts.getTime())));
        const end = new Date(Math.max(...validTimestamps.map(ts => ts.getTime())));

        return { start, end };
    }

    /**
     * Obtiene el reporte de procesamiento
     */
    public getProcessingReport(): {
        totalFiles: number;
        successfulFiles: number;
        failedFiles: number;
        totalDataPoints: number;
        files: FileProcessingResult[];
    } {
        return {
            totalFiles: this.processingLog.length,
            successfulFiles: this.processingLog.filter(r => r.success).length,
            failedFiles: this.processingLog.filter(r => !r.success).length,
            totalDataPoints: this.processingLog.reduce((sum, r) => sum + r.dataCount, 0),
            files: this.processingLog
        };
    }
}
