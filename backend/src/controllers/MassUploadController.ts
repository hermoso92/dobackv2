
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';
import {
    parseCANFile,
    parseGPSFile,
    parseRotativoFile,
    parseStabilityFile,
    translateCANIfNeeded
} from '../utils/sessionParsers';



interface FileInfo {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
}

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

interface VehicleSession {
    vehicleId: string;
    vehicleName: string;
    date: string;
    files: {
        CAN?: FileInfo[];
        GPS?: FileInfo[];
        ESTABILIDAD?: FileInfo[];
        ROTATIVO?: FileInfo[];
    };
}

export class MassUploadController {
    async uploadMultipleFiles(req: AuthenticatedRequest, res: Response) {
        try {
            logger.info('Iniciando subida masiva de archivos', {
                files: req.files,
                user: req.user
            });

            if (!req.user?.organizationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Usuario no tiene organización asignada'
                });
            }

            const files = req.files as Record<string, FileInfo[]>;

            if (!files || Object.keys(files).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se encontraron archivos para subir'
                });
            }

            // Agrupar archivos por vehículo y sesión
            const vehicleSessions = this.groupFilesByVehicle(files);

            logger.info(`Archivos agrupados en ${vehicleSessions.length} sesiones de vehículos`);

            const results = [];
            let totalSessionsCreated = 0;
            let totalFilesProcessed = 0;

            // Procesar cada sesión de vehículo
            for (const session of vehicleSessions) {
                try {
                    const result = await this.processVehicleSession(
                        session,
                        req.user.organizationId,
                        req.user?.id
                    );
                    results.push(result);

                    if (result.success) {
                        totalSessionsCreated += result.sessionsCreated;
                        totalFilesProcessed += result.filesProcessed;
                    }
                } catch (error) {
                    logger.error(`Error procesando sesión ${session.vehicleName}:`, error);
                    results.push({
                        vehicleName: session.vehicleName,
                        success: false,
                        error: error instanceof Error ? error.message : 'Error desconocido',
                        sessionsCreated: 0,
                        filesProcessed: 0
                    });
                }
            }

            return res.json({
                success: true,
                message: `Procesamiento completado: ${totalSessionsCreated} sesiones creadas, ${totalFilesProcessed} archivos procesados`,
                results,
                summary: {
                    totalSessionsCreated,
                    totalFilesProcessed,
                    totalVehicles: vehicleSessions.length,
                    successfulVehicles: results.filter((r) => r.success).length
                }
            });
        } catch (error) {
            logger.error('Error en subida masiva:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    private groupFilesByVehicle(files: Record<string, FileInfo[]>): VehicleSession[] {
        const vehicleSessions: Map<string, VehicleSession> = new Map();

        // Procesar cada tipo de archivo
        for (const [fileType, fileList] of Object.entries(files)) {
            for (const file of fileList) {
                const fileInfo = this.extractFileInfo(file.originalname);

                if (!fileInfo) {
                    logger.warn(`No se pudo extraer información del archivo: ${file.originalname}`);
                    continue;
                }

                const { vehicleName, date } = fileInfo;
                const key = `${vehicleName}_${date}`;

                if (!vehicleSessions.has(key)) {
                    vehicleSessions.set(key, {
                        vehicleId: '', // Se asignará después
                        vehicleName,
                        date,
                        files: {}
                    });
                }

                const session = vehicleSessions.get(key)!;

                // Agrupar por tipo de archivo
                if (!session.files[fileType as keyof typeof session.files]) {
                    session.files[fileType as keyof typeof session.files] = [];
                }

                session.files[fileType as keyof typeof session.files]!.push(file);
            }
        }

        return Array.from(vehicleSessions.values());
    }

    private extractFileInfo(filename: string): { vehicleName: string; date: string } | null {
        // Patrón: TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>
        const match = filename.match(/_(DOBACK\d+)_(\d{8})_/);

        if (match) {
            const vehicleName = match[1].toLowerCase(); // doback022
            const dateStr = match[2];
            const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

            return { vehicleName, date };
        }

        return null;
    }

    private async processVehicleSession(
        session: VehicleSession,
        organizationId: string,
        userId?: string
    ) {
        logger.info(`Procesando sesión: ${session.vehicleName} - ${session.date}`);

        // Buscar o crear vehículo
        let vehicle = await prisma.vehicle.findFirst({
            where: {
                name: session.vehicleName,
                organizationId
            }
        });

        if (!vehicle) {
            logger.info(`Creando vehículo: ${session.vehicleName}`);
            vehicle = await prisma.vehicle.create({
                data: {
                    name: session.vehicleName,
                    organizationId,
                    type: 'TRUCK',
                    status: 'ACTIVE',
                    model: 'DOBACK',
                    licensePlate: session.vehicleName.toUpperCase(),
                    identifier: session.vehicleName
                }
            });
        }

        session.vehicleId = vehicle.id;

        let sessionsCreated = 0;
        let filesProcessed = 0;

        // Procesar cada tipo de archivo
        for (const [fileType, fileList] of Object.entries(session.files)) {
            if (!fileList || fileList.length === 0) continue;

            logger.info(`Procesando ${fileList.length} archivos de tipo ${fileType}`);

            for (const file of fileList) {
                try {
                    await this.processFile(file, fileType, session, organizationId);
                    filesProcessed++;
                } catch (error) {
                    logger.error(`Error procesando archivo ${file.originalname}:`, error);
                }
            }
        }

        // Crear sesión principal si hay datos
        if (filesProcessed > 0) {
            const mainSession = await prisma.session.create({
                data: {
                    vehicleId: vehicle.id,
                    userId: userId || 'system',
                    organizationId,
                    startTime: new Date(`${session.date}T00:00:00Z`),
                    endTime: new Date(`${session.date}T23:59:59Z`),
                    status: 'COMPLETED',
                    sessionNumber: 1,
                    sequence: 1
                }
            });

            sessionsCreated++;
            logger.info(`Sesión creada: ${mainSession.id} para ${session.vehicleName}`);
        }

        return {
            vehicleName: session.vehicleName,
            success: true,
            sessionsCreated,
            filesProcessed
        };
    }

    private async processFile(
        file: FileInfo,
        fileType: string,
        session: VehicleSession,
        organizationId: string
    ) {
        logger.info(`Procesando archivo: ${file.originalname} (${fileType})`);

        const descartes: Record<string, any[]> = {
            CAN: [],
            GPS: [],
            ESTABILIDAD: [],
            ROTATIVO: []
        };

        let parsedData: any[] = [];

        // Parsear según el tipo de archivo
        switch (fileType.toUpperCase()) {
            case 'CAN':
                // Si es archivo .txt, traducir automáticamente
                if (file.originalname.endsWith('.txt')) {
                    const translatedBuffer = translateCANIfNeeded(file.buffer);
                    parsedData = parseCANFile(translatedBuffer, descartes);
                } else {
                    parsedData = parseCANFile(file.buffer, descartes);
                }
                break;
            case 'GPS':
                parsedData = parseGPSFile(file.buffer, descartes);
                break;
            case 'ESTABILIDAD':
                parsedData = parseStabilityFile(file.buffer, descartes);
                break;
            case 'ROTATIVO':
                parsedData = parseRotativoFile(file.buffer, descartes);
                break;
            default:
                logger.warn(`Tipo de archivo no reconocido: ${fileType}`);
                return;
        }

        logger.info(`Archivo ${file.originalname} parseado: ${parsedData.length} registros`);

        // Guardar datos en la base de datos según el tipo
        await this.saveParsedData(parsedData, fileType, session, organizationId);
    }

    private async saveParsedData(
        data: any[],
        fileType: string,
        session: VehicleSession,
        organizationId: string
    ) {
        if (data.length === 0) return;

        // Buscar la sesión principal del vehículo para esta fecha
        const mainSession = await prisma.session.findFirst({
            where: {
                vehicleId: session.vehicleId,
                startTime: {
                    gte: new Date(`${session.date}T00:00:00Z`),
                    lt: new Date(`${session.date}T23:59:59Z`)
                }
            }
        });

        if (!mainSession) {
            logger.error(
                `No se encontró sesión principal para ${session.vehicleName} - ${session.date}`
            );
            return;
        }

        // Guardar según el tipo de datos
        switch (fileType.toUpperCase()) {
            case 'CAN':
                await this.saveCANData(data, mainSession.id);
                break;
            case 'GPS':
                await this.saveGPSData(data, mainSession.id);
                break;
            case 'ESTABILIDAD':
                await this.saveStabilityData(data, mainSession.id);
                break;
            case 'ROTATIVO':
                await this.saveRotativoData(data, mainSession.id);
                break;
        }
    }

    private async saveCANData(data: any[], sessionId: string) {
        const canInserts = data.map((item) => ({
            sessionId,
            timestamp: new Date(item.timestamp),
            engineRpm: item.engineRpm || 0,
            vehicleSpeed: item.vehicleSpeed || 0,
            fuelSystemStatus: item.fuelSystemStatus || 'UNKNOWN'
        }));

        await prisma.canMeasurement.createMany({
            data: canInserts,
            skipDuplicates: true
        });

        logger.info(`Guardados ${canInserts.length} registros CAN`);
    }

    private async saveGPSData(data: any[], sessionId: string) {
        const gpsInserts = data.map((item) => ({
            sessionId,
            timestamp: new Date(item.timestamp),
            latitude: item.latitude,
            longitude: item.longitude,
            altitude: item.altitude || 0,
            speed: item.speed || 0,
            satellites: item.satellites || 0,
            heading: item.heading || 0,
            accuracy: item.accuracy || 0
        }));

        await prisma.gpsMeasurement.createMany({
            data: gpsInserts,
            skipDuplicates: true
        });

        logger.info(`Guardados ${gpsInserts.length} registros GPS`);
    }

    private async saveStabilityData(data: any[], sessionId: string) {
        const stabilityInserts = data
            .filter((item) => {
                // Validar que todos los campos requeridos estén presentes
                const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                const hasAllFields = requiredFields.every(
                    (field) => item[field] !== undefined && item[field] !== null
                );

                if (!hasAllFields) {
                    logger.warn(
                        `⚠️ Datos de estabilidad incompletos en MassUpload, omitiendo: ${JSON.stringify(
                            item
                        )}`
                    );
                    return false;
                }

                return true;
            })
            .map((item) => ({
                sessionId,
                timestamp: new Date(item.timestamp),
                ax: Number(item.ax),
                ay: Number(item.ay),
                az: Number(item.az),
                gx: Number(item.gx),
                gy: Number(item.gy),
                gz: Number(item.gz),
                si: item.si ? Number(item.si) : 0,
                accmag: item.accmag ? Number(item.accmag) : 0
            }));

        if (stabilityInserts.length > 0) {
            await prisma.stabilityMeasurement.createMany({
                data: stabilityInserts,
                skipDuplicates: true
            });
        }

        logger.info(
            `Guardados ${stabilityInserts.length} registros de estabilidad (filtrados de ${data.length} total)`
        );
    }

    private async saveRotativoData(data: any[], sessionId: string) {
        const rotativoInserts = data.map((item) => ({
            sessionId,
            timestamp: new Date(item.timestamp),
            value: item.value || 0,
            state: item.status || 'UNKNOWN'
        }));

        await prisma.rotativoMeasurement.createMany({
            data: rotativoInserts,
            skipDuplicates: true
        });

        logger.info(`Guardados ${rotativoInserts.length} registros rotativos`);
    }
}
