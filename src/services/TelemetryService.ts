import * as csv from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TelemetryResult, TelemetrySession } from '../types/telemetry';
import { logger } from '../utils/logger';
import { TelemetryProcessorService } from './TelemetryProcessorService';

export class TelemetryService {
    private processor: TelemetryProcessorService;
    private dataDir: string;

    constructor() {
        this.processor = new TelemetryProcessorService();
        this.dataDir = path.join(process.cwd(), 'data');
    }

    public async processTelemetryData(
        vehicleId: string,
        canData: string[][],
        gpsData: string[][]
    ): Promise<TelemetryResult> {
        try {
            const sessionId = uuidv4();
            const processedCANData = canData.map(data => ({
                ...this.processor.processRawCANData(data),
                vehicleId,
                sessionId
            }));

            const processedGPSData = gpsData.map(data => ({
                ...this.processor.processRawGPSData(data),
                vehicleId,
                sessionId
            }));

            const metrics = this.processor.calculateMetrics(processedCANData, processedGPSData);

            const session: TelemetrySession = {
                id: sessionId,
                vehicleId,
                startTime: processedCANData[0].timestamp,
                endTime: processedCANData[processedCANData.length - 1].timestamp,
                canData: processedCANData,
                gpsData: processedGPSData,
                metrics
            };

            // Guardar sesión en archivos CSV
            await this.saveSession(session);

            return {
                success: true,
                data: session
            };
        } catch (error) {
            logger.error('Error procesando datos de telemetría', { error, vehicleId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    public async getSession(sessionId: string): Promise<TelemetryResult> {
        try {
            const session = await this.loadSession(sessionId);
            if (!session) {
                return {
                    success: false,
                    error: 'Sesión no encontrada'
                };
            }

            return {
                success: true,
                data: session
            };
        } catch (error) {
            logger.error('Error recuperando sesión de telemetría', { error, sessionId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    public async getVehicleSessions(
        vehicleId: string,
        startTime: Date,
        endTime: Date
    ): Promise<TelemetryResult> {
        try {
            const sessions = await this.loadVehicleSessions(vehicleId, startTime, endTime);
            return {
                success: true,
                data: sessions[0] // Devolver la primera sesión por ahora
            };
        } catch (error) {
            logger.error('Error recuperando sesiones de telemetría', { error, vehicleId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    private async saveSession(session: TelemetrySession): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const canFilename = `${session.id}_CAN_${session.vehicleId}_${timestamp}.csv`;
        const gpsFilename = `${session.id}_GPS_${session.vehicleId}_${timestamp}.csv`;

        // Guardar datos CAN
        const canData = session.canData.map(data => [
            data.timestamp.toISOString(),
            data.speed.toString(),
            data.inclination.toString(),
            data.load.toString(),
            data.temperature.toString()
        ]);
        await this.writeCSV(path.join(this.dataDir, canFilename), canData);

        // Guardar datos GPS
        const gpsData = session.gpsData.map(data => [
            data.timestamp.toISOString(),
            data.latitude.toString(),
            data.longitude.toString(),
            data.altitude.toString(),
            data.speed.toString(),
            data.heading.toString(),
            data.satellites.toString(),
            data.hdop.toString()
        ]);
        await this.writeCSV(path.join(this.dataDir, gpsFilename), gpsData);
    }

    private async loadSession(sessionId: string): Promise<TelemetrySession | null> {
        try {
            const files = await fs.promises.readdir(this.dataDir);
            const sessionFiles = files.filter(file => file.startsWith(sessionId));

            if (sessionFiles.length === 0) {
                return null;
            }

            const canFile = sessionFiles.find(file => file.includes('_CAN_'));
            const gpsFile = sessionFiles.find(file => file.includes('_GPS_'));

            if (!canFile || !gpsFile) {
                return null;
            }

            const canData = await this.readCSV(path.join(this.dataDir, canFile));
            const gpsData = await this.readCSV(path.join(this.dataDir, gpsFile));

            const vehicleId = canFile.split('_')[2];
            const processedCANData = canData.map(data => ({
                ...this.processor.processRawCANData(data),
                vehicleId,
                sessionId
            }));

            const processedGPSData = gpsData.map(data => ({
                ...this.processor.processRawGPSData(data),
                vehicleId,
                sessionId
            }));

            const metrics = this.processor.calculateMetrics(processedCANData, processedGPSData);

            return {
                id: sessionId,
                vehicleId,
                startTime: processedCANData[0].timestamp,
                endTime: processedCANData[processedCANData.length - 1].timestamp,
                canData: processedCANData,
                gpsData: processedGPSData,
                metrics
            };
        } catch (error) {
            logger.error('Error cargando sesión', { error, sessionId });
            return null;
        }
    }

    private async loadVehicleSessions(
        vehicleId: string,
        startTime: Date,
        endTime: Date
    ): Promise<TelemetrySession[]> {
        try {
            const files = await fs.promises.readdir(this.dataDir);
            const vehicleFiles = files.filter(file => file.includes(`_${vehicleId}_`));
            const sessions = new Set<string>();

            // Obtener IDs de sesiones únicas
            vehicleFiles.forEach(file => {
                const sessionId = file.split('_')[0];
                sessions.add(sessionId);
            });

            // Cargar cada sesión
            const loadedSessions = await Promise.all(
                Array.from(sessions).map(sessionId => this.loadSession(sessionId))
            );

            // Filtrar sesiones por rango de tiempo
            return loadedSessions
                .filter((session): session is TelemetrySession =>
                    session !== null &&
                    new Date(session.startTime) >= startTime &&
                    new Date(session.endTime) <= endTime
                );
        } catch (error) {
            logger.error('Error cargando sesiones de vehículo', { error, vehicleId });
            return [];
        }
    }

    private async writeCSV(filepath: string, data: string[][]): Promise<void> {
        const csvContent = data.map(row => row.join(',')).join('\n');
        await fs.promises.writeFile(filepath, csvContent, 'utf8');
    }

    private async readCSV(filepath: string): Promise<string[][]> {
        const fileContent = await fs.promises.readFile(filepath, 'utf8');
        return new Promise((resolve, reject) => {
            csv.parse(fileContent, {
                skip_empty_lines: true
            }, (err: Error | null, data: string[][]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
} 