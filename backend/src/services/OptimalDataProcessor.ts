import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { logger } from '../utils/logger';
import {
    CANData,
    CANStreamParser,
    GPSData,
    GPSStreamParser,
    RotativoData,
    RotativoStreamParser,
    StabilityData,
    StabilityStreamParser
} from '../utils/optimalParsers';
import { AdvancedKPICalculationService } from './AdvancedKPICalculationService';

export interface SessionFile {
    filePath: string;
    fileName: string;
    fileType: 'GPS' | 'CAN' | 'ESTABILIDAD' | 'ROTATIVO';
    size: number;
    lastModified: Date;
    sequence: number;
    vehicleId: string;
    date: string;
}

export interface CompleteSession {
    vehicleId: string;
    date: string;
    sequence: number;
    organizationId: string;
    files: {
        GPS: SessionFile[];
        CAN: SessionFile[];
        ESTABILIDAD: SessionFile[];
        ROTATIVO: SessionFile[];
    };
    temporalWindow: {
        start: Date;
        end: Date;
        duration: number; // en minutos
    };
}

export interface ProcessingStats {
    sessionsProcessed: number;
    sessionsFailed: number;
    totalFilesProcessed: number;
    totalDataPoints: {
        gps: number;
        stability: number;
        can: number;
        rotativo: number;
    };
    processingTime: number;
    errors: string[];
}

export class OptimalDataProcessor extends EventEmitter {
    private prisma: PrismaClient;
    private kpiService: AdvancedKPICalculationService;
    private isProcessing: boolean = false;
    private stats: ProcessingStats;
    private readonly MAX_TEMPORAL_WINDOW = 30; // minutos
    private readonly MIN_STABILITY_SIZE = 1024 * 1024; // 1MB
    private readonly BATCH_SIZE = 1000;

    constructor() {
        super();
        this.prisma = new PrismaClient();
        this.kpiService = new AdvancedKPICalculationService();
        this.stats = {
            sessionsProcessed: 0,
            sessionsFailed: 0,
            totalFilesProcessed: 0,
            totalDataPoints: { gps: 0, stability: 0, can: 0, rotativo: 0 },
            processingTime: 0,
            errors: []
        };
    }

    /**
     * Procesa todos los datos de un directorio de forma óptima
     */
    public async processAllData(basePath: string): Promise<ProcessingStats> {
        const startTime = Date.now();
        logger.info('🚀 Iniciando procesamiento óptimo de datos masivos...');

        try {
            // 1. Detectar todas las sesiones completas
            const sessions = await this.detectCompleteSessions(basePath);
            logger.info(`📊 Detectadas ${sessions.length} sesiones completas`);

            // 2. Procesar sesiones en paralelo (con límite de concurrencia)
            await this.processSessionsInParallel(sessions);

            this.stats.processingTime = Date.now() - startTime;
            logger.info(`✅ Procesamiento completado en ${this.stats.processingTime}ms`);

            return this.stats;

        } catch (error) {
            logger.error('❌ Error en procesamiento masivo:', error);
            this.stats.errors.push(`Error general: ${error}`);
            throw error;
        }
    }

    /**
     * Detecta sesiones completas escaneando el directorio
     */
    private async detectCompleteSessions(basePath: string): Promise<CompleteSession[]> {
        const sessions = new Map<string, CompleteSession>();

        // Escanear todos los archivos
        const allFiles = await this.scanAllFiles(basePath);

        // Agrupar por sesión (vehicleId_date_sequence)
        for (const file of allFiles) {
            const sessionKey = `${file.vehicleId}_${file.date}_${file.sequence}`;

            if (!sessions.has(sessionKey)) {
                sessions.set(sessionKey, {
                    vehicleId: file.vehicleId,
                    date: file.date,
                    sequence: file.sequence,
                    organizationId: 'CMadrid',
                    files: {
                        GPS: [],
                        CAN: [],
                        ESTABILIDAD: [],
                        ROTATIVO: []
                    },
                    temporalWindow: {
                        start: new Date(),
                        end: new Date(),
                        duration: 0
                    }
                });
            }

            const session = sessions.get(sessionKey)!;
            session.files[file.fileType].push(file);
        }

        // Filtrar sesiones completas y válidas
        const completeSessions: CompleteSession[] = [];

        for (const session of sessions.values()) {
            if (this.isSessionComplete(session) && this.validateTemporalWindow(session)) {
                completeSessions.push(session);
            }
        }

        return completeSessions;
    }

    /**
     * Escanea todos los archivos en el directorio
     */
    private async scanAllFiles(basePath: string): Promise<SessionFile[]> {
        const files: SessionFile[] = [];

        const scanDirectory = async (dirPath: string) => {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.txt')) {
                    const fileInfo = this.analyzeFile(fullPath);
                    if (fileInfo) {
                        files.push(fileInfo);
                    }
                }
            }
        };

        await scanDirectory(basePath);
        return files;
    }

    /**
     * Analiza un archivo y extrae información de sesión
     */
    private analyzeFile(filePath: string): SessionFile | null {
        try {
            const fileName = path.basename(filePath);
            const stats = fs.statSync(filePath);

            // Parsear nombre: TIPO_DOBACKXXX_YYYYMMDD_SEQUENCE.txt
            const match = fileName.match(/^([A-Z_]+)_DOBACK(\d+)_(\d{8})_(\d+)\.txt$/);
            if (!match) return null;

            const [, fileTypeStr, vehicleIdNum, dateStr, sequenceStr] = match;
            const fileType = fileTypeStr as SessionFile['fileType'];

            // Filtrar archivos de estabilidad pequeños
            if (fileType === 'ESTABILIDAD' && stats.size < this.MIN_STABILITY_SIZE) {
                logger.warn(`⚠️ Archivo de estabilidad pequeño ignorado: ${fileName} (${stats.size} bytes)`);
                return null;
            }

            return {
                filePath,
                fileName,
                fileType,
                size: stats.size,
                lastModified: stats.mtime,
                sequence: parseInt(sequenceStr),
                vehicleId: `DOBACK${vehicleIdNum}`,
                date: dateStr
            };

        } catch (error) {
            logger.error(`❌ Error analizando archivo ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Verifica si una sesión está completa
     */
    private isSessionComplete(session: CompleteSession): boolean {
        // Debe tener al menos GPS o ESTABILIDAD
        const hasGPS = session.files.GPS.length > 0;
        const hasStability = session.files.ESTABILIDAD.length > 0;

        return hasGPS || hasStability;
    }

    /**
     * Valida la ventana temporal de una sesión
     */
    private validateTemporalWindow(session: CompleteSession): boolean {
        try {
            // Leer headers de archivos para obtener timestamps
            const timestamps: Date[] = [];

            for (const fileType of ['GPS', 'CAN', 'ESTABILIDAD', 'ROTATIVO'] as const) {
                for (const file of session.files[fileType]) {
                    const headerTimestamp = this.extractHeaderTimestamp(file);
                    if (headerTimestamp) {
                        timestamps.push(headerTimestamp);
                    }
                }
            }

            if (timestamps.length === 0) return false;

            // Calcular ventana temporal
            const start = new Date(Math.min(...timestamps.map(t => t.getTime())));
            const end = new Date(Math.max(...timestamps.map(t => t.getTime())));
            const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutos

            // Actualizar ventana temporal
            session.temporalWindow = { start, end, duration };

            // Validar que la ventana no sea demasiado grande
            return duration <= this.MAX_TEMPORAL_WINDOW;

        } catch (error) {
            logger.error(`❌ Error validando ventana temporal:`, error);
            return false;
        }
    }

    /**
     * Extrae timestamp del header de un archivo
     */
    private extractHeaderTimestamp(file: SessionFile): Date | null {
        try {
            const content = fs.readFileSync(file.filePath, 'utf8');
            const firstLine = content.split('\n')[0];

            // Parsear diferentes formatos de header
            if (file.fileType === 'GPS') {
                const match = firstLine.match(/GPS;(\d{8}) (\d{2}):(\d{2}):(\d{2});/);
                if (match) {
                    const [, date, hour, minute, second] = match;
                    const year = parseInt(date.substring(0, 4));
                    const month = parseInt(date.substring(4, 6));
                    const day = parseInt(date.substring(6, 8));
                    return new Date(year, month - 1, day, parseInt(hour), parseInt(minute), parseInt(second));
                }
            } else if (file.fileType === 'CAN') {
                const match = firstLine.match(/CAN;(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})(AM|PM);/);
                if (match) {
                    const [, day, month, year, hour, minute, second, ampm] = match;
                    let hour24 = parseInt(hour);
                    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
                    if (ampm === 'AM' && hour24 === 12) hour24 = 0;
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
                }
            } else if (file.fileType === 'ESTABILIDAD') {
                const match = firstLine.match(/ESTABILIDAD;(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})(AM|PM);/);
                if (match) {
                    const [, day, month, year, hour, minute, second, ampm] = match;
                    let hour24 = parseInt(hour);
                    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
                    if (ampm === 'AM' && hour24 === 12) hour24 = 0;
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
                }
            } else if (file.fileType === 'ROTATIVO') {
                const match = firstLine.match(/ROTATIVO;(\d{4})-(\d{2})-(\d{2});/);
                if (match) {
                    const [, year, month, day] = match;
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
            }

            return null;
        } catch (error) {
            logger.error(`❌ Error extrayendo timestamp de ${file.fileName}:`, error);
            return null;
        }
    }

    /**
     * Procesa sesiones en paralelo con límite de concurrencia
     */
    private async processSessionsInParallel(sessions: CompleteSession[]): Promise<void> {
        const CONCURRENCY_LIMIT = 5; // Procesar máximo 5 sesiones en paralelo

        for (let i = 0; i < sessions.length; i += CONCURRENCY_LIMIT) {
            const batch = sessions.slice(i, i + CONCURRENCY_LIMIT);

            await Promise.allSettled(
                batch.map(session => this.processSession(session))
            );

            // Log progreso
            const processed = Math.min(i + CONCURRENCY_LIMIT, sessions.length);
            logger.info(`📊 Progreso: ${processed}/${sessions.length} sesiones procesadas`);
        }
    }

    /**
     * Procesa una sesión completa de forma óptima
     */
    private async processSession(session: CompleteSession): Promise<void> {
        const sessionId = `${session.vehicleId}_${session.date}_${session.sequence}`;

        try {
            logger.info(`🔄 Procesando sesión: ${sessionId}`);

            // 1. Verificar que el vehículo existe
            const vehicle = await this.getVehicle(session.vehicleId, session.organizationId);
            if (!vehicle) {
                throw new Error(`Vehículo ${session.vehicleId} no encontrado`);
            }

            // 2. Procesar archivos en paralelo usando streaming
            const [gpsData, stabilityData, canData, rotativoData] = await Promise.all([
                this.processGPSFiles(session.files.GPS),
                this.processStabilityFiles(session.files.ESTABILIDAD),
                this.processCANFiles(session.files.CAN),
                this.processRotativoFiles(session.files.ROTATIVO)
            ]);

            // 3. Crear sesión en base de datos
            const dbSession = await this.createSession(vehicle.id, session);

            // 4. Insertar datos de forma atómica
            await this.insertSessionDataAtomically(dbSession.id, {
                gpsData,
                stabilityData,
                canData,
                rotativoData
            });

            // 5. Calcular KPIs
            await this.calculateKPIs(vehicle.id, session);

            this.stats.sessionsProcessed++;
            this.stats.totalFilesProcessed += this.countFilesInSession(session);
            this.stats.totalDataPoints.gps += gpsData.length;
            this.stats.totalDataPoints.stability += stabilityData.length;
            this.stats.totalDataPoints.can += canData.length;
            this.stats.totalDataPoints.rotativo += rotativoData.length;

            logger.info(`✅ Sesión procesada exitosamente: ${sessionId}`);

        } catch (error) {
            this.stats.sessionsFailed++;
            this.stats.errors.push(`Sesión ${sessionId}: ${error}`);
            logger.error(`❌ Error procesando sesión ${sessionId}:`, error);
        }
    }

    /**
     * Procesa archivos GPS usando streaming
     */
    private async processGPSFiles(files: SessionFile[]): Promise<GPSData[]> {
        const allData: GPSData[] = [];
        const parser = new GPSStreamParser();

        for (const file of files) {
            const data = await this.processFileStream(file, parser.parseLine.bind(parser));
            allData.push(...data);
        }

        return allData;
    }

    /**
     * Procesa archivos de estabilidad usando streaming
     */
    private async processStabilityFiles(files: SessionFile[]): Promise<StabilityData[]> {
        const allData: StabilityData[] = [];
        const parser = new StabilityStreamParser();

        for (const file of files) {
            const data = await this.processFileStream(file, parser.parseLine.bind(parser));
            allData.push(...data);
        }

        return allData;
    }

    /**
     * Procesa archivos CAN usando el decodificador existente
     */
    private async processCANFiles(files: SessionFile[]): Promise<CANData[]> {
        const allData: CANData[] = [];

        for (const file of files) {
            try {
                // Usar el decodificador CAN existente
                const decodedData = await this.decodeCANFile(file.filePath);
                allData.push(...decodedData);
            } catch (error) {
                logger.error(`❌ Error decodificando CAN ${file.fileName}:`, error);
            }
        }

        return allData;
    }

    /**
     * Procesa archivos rotativo usando streaming
     */
    private async processRotativoFiles(files: SessionFile[]): Promise<RotativoData[]> {
        const allData: RotativoData[] = [];
        const parser = new RotativoStreamParser();

        for (const file of files) {
            const data = await this.processFileStream(file, parser.parseLine.bind(parser));
            allData.push(...data);
        }

        return allData;
    }

    /**
     * Procesa un archivo usando streaming
     */
    private async processFileStream<T>(
        file: SessionFile,
        lineParser: (line: string, lineNumber: number) => T | null
    ): Promise<T[]> {
        const data: T[] = [];

        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(file.filePath, { encoding: 'utf8' });
            const rl = readline.createInterface({ input: stream });

            let lineNumber = 0;

            rl.on('line', (line) => {
                lineNumber++;

                // Saltar headers
                if (lineNumber === 1 && (line.includes(';') || line.includes(','))) {
                    return;
                }

                try {
                    const parsed = lineParser(line, lineNumber);
                    if (parsed) {
                        data.push(parsed);
                    }
                } catch (error) {
                    // Log error pero continúa procesando
                    if (lineNumber <= 10) { // Solo log primeros errores
                        logger.warn(`⚠️ Error parseando línea ${lineNumber} en ${file.fileName}: ${error}`);
                    }
                }
            });

            rl.on('close', () => {
                resolve(data);
            });

            rl.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Decodifica archivo CAN usando el decodificador existente
     */
    private async decodeCANFile(filePath: string): Promise<CANData[]> {
        return new Promise((resolve, reject) => {
            const python = spawn('python', [
                path.join(__dirname, '../../data/DECODIFICADOR CAN/decodificador_can_unificado.py'),
                filePath
            ]);

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    // Leer archivo _TRADUCIDO.csv generado
                    const translatedFile = filePath.replace('.txt', '_TRADUCIDO.csv');
                    this.parseTranslatedCANFile(translatedFile)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error(`Decodificador CAN falló: ${errorOutput}`));
                }
            });
        });
    }

    /**
     * Parsea archivo CAN traducido
     */
    private async parseTranslatedCANFile(filePath: string): Promise<CANData[]> {
        const parser = new CANStreamParser();
        const data: CANData[] = [];

        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
            const rl = readline.createInterface({ input: stream });

            let lineNumber = 0;

            rl.on('line', (line) => {
                lineNumber++;
                try {
                    const parsed = parser.parseLine(line, lineNumber);
                    if (parsed) {
                        data.push(parsed);
                    }
                } catch (error) {
                    // Log error pero continúa procesando
                    if (lineNumber <= 10) {
                        logger.warn(`⚠️ Error parseando CAN traducido línea ${lineNumber}: ${error}`);
                    }
                }
            });

            rl.on('close', () => {
                resolve(data);
            });

            rl.on('error', (error) => {
                reject(error);
            });
        });
    }


    /**
     * Obtiene vehículo de la base de datos
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
     * Crea sesión en la base de datos
     */
    private async createSession(vehicleId: string, session: CompleteSession) {
        const lastSession = await this.prisma.session.findFirst({
            where: { vehicleId },
            orderBy: { sessionNumber: 'desc' }
        });

        const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

        return await this.prisma.session.create({
            data: {
                vehicleId,
                userId: 'system',
                organizationId: session.organizationId,
                startTime: session.temporalWindow.start,
                endTime: session.temporalWindow.end,
                sessionNumber,
                sequence: session.sequence,
                source: 'optimal_processor'
            }
        });
    }

    /**
     * Inserta datos de sesión de forma atómica
     */
    private async insertSessionDataAtomically(sessionId: string, data: any): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            // Insertar GPS
            if (data.gpsData.length > 0) {
                await tx.gpsMeasurement.createMany({
                    data: data.gpsData.map((point: any) => ({
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
                        accuracy: point.accuracy || null
                    })),
                    skipDuplicates: true
                });
            }

            // Insertar estabilidad
            if (data.stabilityData.length > 0) {
                await tx.stabilityMeasurement.createMany({
                    data: data.stabilityData.map((point: any) => ({
                        sessionId,
                        timestamp: new Date(point.timestamp),
                        ax: Number(point.ax),
                        ay: Number(point.ay),
                        az: Number(point.az),
                        gx: Number(point.gx),
                        gy: Number(point.gy),
                        gz: Number(point.gz),
                        si: point.si ? Number(point.si) : 0,
                        accmag: point.accmag ? Number(point.accmag) : 0
                    })),
                    skipDuplicates: true
                });
            }

            // Insertar CAN
            if (data.canData.length > 0) {
                await tx.canMeasurement.createMany({
                    data: data.canData.map((point: any) => ({
                        sessionId,
                        timestamp: new Date(point.timestamp),
                        engineRpm: point.engineRpm,
                        vehicleSpeed: point.vehicleSpeed,
                        fuelSystemStatus: point.fuelSystemStatus
                    })),
                    skipDuplicates: true
                });
            }

            // Insertar rotativo
            if (data.rotativoData.length > 0) {
                await tx.rotativoMeasurement.createMany({
                    data: data.rotativoData.map((point: any) => ({
                        sessionId,
                        timestamp: new Date(point.timestamp),
                        state: point.state.toString()
                    })),
                    skipDuplicates: true
                });
            }
        });
    }

    /**
     * Calcula KPIs para la sesión
     */
    private async calculateKPIs(vehicleId: string, session: CompleteSession): Promise<void> {
        try {
            const sessionDate = new Date(session.date);
            await this.kpiService.calculateAndStoreDailyKPIs(vehicleId, sessionDate, session.organizationId);
        } catch (error) {
            logger.error(`⚠️ Error calculando KPIs para ${session.vehicleId}:`, error);
        }
    }

    /**
     * Cuenta archivos en una sesión
     */
    private countFilesInSession(session: CompleteSession): number {
        return session.files.GPS.length +
            session.files.CAN.length +
            session.files.ESTABILIDAD.length +
            session.files.ROTATIVO.length;
    }

    /**
     * Obtiene estadísticas del procesamiento
     */
    public getStats(): ProcessingStats {
        return { ...this.stats };
    }

    /**
     * Detiene el procesamiento
     */
    public async stop(): Promise<void> {
        this.isProcessing = false;
        await this.prisma.$disconnect();
    }
}