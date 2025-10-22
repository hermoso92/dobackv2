
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { BulkProcessingService } from '../services/BulkProcessingService';
import { CabeceraScannerService } from '../services/CabeceraScannerService';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';


const bulkProcessingService = new BulkProcessingService();

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

// Definir el tipo localmente si no existe
type SessionFiles = {
    stabilityFile: string;
    canFile?: string;
    gpsFile?: string;
    rotativoFile?: string;
};

export class BulkDataProcessorController {
    /**
     * Obtiene una vista general de los datos disponibles en la carpeta datosDoback
     */
    async getDataOverview(req: AuthenticatedRequest, res: Response) {
        try {
            logger.info('📊 Obteniendo vista general de datos masivos', {
                user: req.user?.id,
                organizationId: req.user?.organizationId
            });

            if (!req.user?.organizationId) {
                return res.status(400).json({ error: 'Usuario no tiene organización asignada' });
            }

            // Obtener el name de la organización
            const org = await prisma.organization.findUnique({
                where: { id: req.user.organizationId },
                select: { name: true }
            });
            if (!org) {
                return res.status(404).json({ error: 'Organización no encontrada' });
            }
            const orgName = org.name;

            // Escanear la carpeta de datos
            const dataOverview = await bulkProcessingService.scanDataFolder();

            // Filtrar solo datos de la organización por name
            const userOrganizationData = (dataOverview.organizations as Record<string, { vehicles: Record<string, { sessions: Record<string, SessionFiles> }> }>)[orgName] || { vehicles: {} };

            // Obtener estadísticas
            const stats = {
                totalVehicles: Object.keys(userOrganizationData.vehicles).length,
                totalSessions: Object.values(userOrganizationData.vehicles).reduce((acc: number, vehicle: any) =>
                    acc + Object.keys(vehicle.sessions).length, 0),
                vehicles: Object.entries(userOrganizationData.vehicles).map(([vehicleName, vehicle]: [string, any]) => ({
                    name: vehicleName,
                    sessionsCount: Object.keys(vehicle.sessions).length,
                    sessions: Object.keys(vehicle.sessions).map((sessionKey: any) => {
                        const session: any = vehicle.sessions[sessionKey];
                        return {
                            key: sessionKey,
                            hasStability: !!session.stabilityFile,
                            hasCAN: !!session.canFile,
                            hasGPS: !!session.gpsFile,
                            hasRotativo: !!session.rotativoFile
                        };
                    })
                }))
            };

            logger.info('✅ Vista general de datos obtenida', {
                organizationName: orgName,
                stats
            });

            return res.status(200).json({
                success: true,
                data: {
                    organizationId: orgName,
                    stats,
                    availableOrganizations: Object.keys(dataOverview)
                }
            });

        } catch (error) {
            logger.error('Error obteniendo vista general de datos:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Procesa todos los datos de la organización del usuario
     */
    async processAllData(req: AuthenticatedRequest, res: Response) {
        try {
            logger.info('🚀 Iniciando procesamiento masivo de datos', {
                user: req.user?.id,
                organizationId: req.user?.organizationId
            });

            if (!req.user?.organizationId) {
                return res.status(400).json({ error: 'Usuario no tiene organización asignada' });
            }

            // Obtener el name de la organización
            const org = await prisma.organization.findUnique({
                where: { id: req.user.organizationId },
                select: { name: true }
            });
            if (!org) {
                return res.status(404).json({ error: 'Organización no encontrada' });
            }
            const orgName = org.name;

            // Escanear la carpeta de datos
            const dataOverview = await bulkProcessingService.scanDataFolder();
            const userOrganizationData = (dataOverview.organizations as Record<string, { vehicles: Record<string, { sessions: Record<string, SessionFiles> }> }>)[orgName];

            if (!userOrganizationData || Object.keys(userOrganizationData.vehicles).length === 0) {
                return res.status(404).json({
                    error: 'No se encontraron datos para procesar en esta organización',
                    organizationId: orgName
                });
            }

            const results = {
                totalVehicles: 0,
                totalSessions: 0,
                successfulSessions: 0,
                failedSessions: 0,
                vehiclesCreated: 0,
                vehiclesSkipped: 0,
                sessionsCreated: 0,
                sessionsSkipped: 0,
                errors: [] as string[],
                warnings: [] as string[],
                details: [] as any[]
            };

            // Procesar cada vehículo
            for (const [vehicleName, vehicleDataRaw] of Object.entries(userOrganizationData.vehicles)) {
                const vehicleData = vehicleDataRaw as { sessions: Record<string, SessionFiles> };
                logger.info(`🚗 Procesando vehículo: ${vehicleName}`, {
                    sessionsCount: Object.keys(vehicleData.sessions).length
                });

                results.totalVehicles++;

                // Verificar si el vehículo ya existe en la organización
                let vehicle = await prisma.vehicle.findFirst({
                    where: {
                        name: vehicleName,
                        organizationId: req.user!.organizationId
                    }
                });

                if (!vehicle) {
                    // Crear el vehículo
                    try {
                        vehicle = await prisma.vehicle.create({
                            data: {
                                name: vehicleName,
                                organizationId: req.user!.organizationId,
                                userId: req.user!.id,
                                model: 'Desconocido',
                                licensePlate: 'Sin matrícula',
                                identifier: vehicleName,
                                type: 'TRUCK',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        });
                        results.vehiclesCreated++;
                        logger.info(`✅ Vehículo creado: ${vehicleName} (${vehicle.id})`);
                    } catch (error) {
                        logger.error(`❌ Error creando vehículo ${vehicleName}:`, error);
                        results.errors.push(`Error creando vehículo ${vehicleName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        results.vehiclesSkipped++;
                        continue; // Saltar este vehículo
                    }
                } else {
                    results.vehiclesSkipped++;
                    logger.info(`⏭️ Vehículo ya existe: ${vehicleName} (${vehicle.id})`);
                }

                // Procesar cada sesión del vehículo
                for (const [sessionKey, sessionFilesRaw] of Object.entries(vehicleData.sessions)) {
                    const sessionFiles = sessionFilesRaw as SessionFiles;
                    logger.info(`📁 Procesando sesión: ${sessionKey}`, {
                        vehicleId: vehicle.id,
                        files: Object.keys(sessionFiles)
                    });

                    results.totalSessions++;

                    // Verificar si la sesión ya existe (por timestamp y vehículo)
                    const sessionExists = await this.checkSessionExists(vehicle.id, sessionFiles);
                    if (sessionExists) {
                        results.sessionsSkipped++;
                        logger.info(`⏭️ Sesión ya existe: ${sessionKey}`);
                        continue;
                    }

                    // Procesar la sesión usando el servicio
                    const processingResult = await bulkProcessingService.processSessionFromFiles(
                        vehicle.id,
                        sessionFiles,
                        req.user!
                    );

                    if (processingResult.success) {
                        results.successfulSessions++;
                        results.sessionsCreated++;
                        logger.info(`✅ Sesión procesada exitosamente: ${sessionKey}`, {
                            sessionId: processingResult.sessionId,
                            dataInserted: processingResult.dataInserted
                        });

                        results.details.push({
                            sessionKey,
                            vehicleName,
                            success: true,
                            sessionId: processingResult.sessionId,
                            sessionNumber: processingResult.sessionNumber,
                            dataInserted: processingResult.dataInserted,
                            eventsGenerated: processingResult.eventsGenerated,
                            corrections: processingResult.corrections
                        });
                    } else {
                        results.failedSessions++;
                        logger.error(`❌ Error procesando sesión ${sessionKey}:`, processingResult.error);

                        results.details.push({
                            sessionKey,
                            vehicleName,
                            success: false,
                            error: processingResult.error,
                            warnings: processingResult.warnings
                        });

                        if (processingResult.error) {
                            results.errors.push(`Sesión ${sessionKey}: ${processingResult.error}`);
                        }
                    }
                }
            }

            // Generar resumen final
            const summary = {
                organizationId: orgName,
                processingCompleted: true,
                timestamp: new Date().toISOString(),
                results
            };

            logger.info('🎉 Procesamiento masivo completado', {
                organizationId: orgName,
                summary: {
                    totalVehicles: results.totalVehicles,
                    totalSessions: results.totalSessions,
                    successfulSessions: results.successfulSessions,
                    failedSessions: results.failedSessions
                }
            });

            return res.status(200).json({
                success: true,
                message: 'Procesamiento masivo completado',
                summary
            });

        } catch (error) {
            logger.error('Error en procesamiento masivo:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Devuelve el emparejamiento de archivos que forman cada sesión detectada (solo agrupación, sin procesar ni insertar)
     */
    async getSessionFilePairing(req: AuthenticatedRequest, res: Response) {
        try {
            logger.info('🔎 Emparejamiento de cabeceras: obteniendo agrupación de archivos por sesión', {
                user: req.user?.id,
                organizationId: req.user?.organizationId
            });

            if (!req.user?.organizationId) {
                return res.status(400).json({ error: 'Usuario no tiene organización asignada' });
            }

            // Obtener el name de la organización
            const org = await prisma.organization.findUnique({
                where: { id: req.user.organizationId },
                select: { name: true }
            });
            if (!org) {
                return res.status(404).json({ error: 'Organización no encontrada' });
            }
            const orgName = org.name;

            // Escanear la carpeta de datos
            const dataOverview = await bulkProcessingService.scanDataFolder();
            const userOrganizationData = (dataOverview.organizations as Record<string, { vehicles: Record<string, { sessions: Record<string, SessionFiles> }> }>)[orgName] || { vehicles: {} };

            // Construir respuesta: para cada vehículo y sesión, mostrar los archivos que la componen
            const result: Record<string, any> = {};
            for (const [vehicleName, vehicleDataRaw] of Object.entries(userOrganizationData.vehicles)) {
                const vehicleData = vehicleDataRaw as { sessions: Record<string, SessionFiles> };
                result[vehicleName] = Object.entries(vehicleData.sessions).map(([sessionKey, sessionFiles]) => ({
                    sessionKey,
                    files: {
                        estabilidad: sessionFiles.stabilityFile || null,
                        can: sessionFiles.canFile || null,
                        gps: sessionFiles.gpsFile || null,
                        rotativo: sessionFiles.rotativoFile || null
                    }
                }));
            }

            return res.status(200).json({
                organization: orgName,
                pairing: result
            });
        } catch (error) {
            logger.error('Error obteniendo emparejamiento de cabeceras:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Devuelve el resumen de cabeceras de todos los archivos de datos (solo lectura de primera línea)
     */
    async getScanHeaders(req: AuthenticatedRequest, res: Response) {
        try {
            const orgName = req.user.organizationName;
            const allHeaders = CabeceraScannerService.scanHeaders();
            const orgHeaders = allHeaders[orgName] || {};
            res.json({ organization: orgName, headers: orgHeaders });
        } catch (error) {
            logger.error('Error escaneando cabeceras:', error);
            res.status(500).json({ error: 'Error escaneando cabeceras' });
        }
    }

    /**
     * Verifica si una sesión ya existe basándose en el rango temporal y vehículo
     */
    private async checkSessionExists(vehicleId: string, sessionFiles: any): Promise<boolean> {
        try {
            // Solo verificar si existe el archivo de estabilidad
            if (!sessionFiles.stabilityFile) {
                return false;
            }

            // Leer el archivo de estabilidad para obtener timestamps
            const fs = require('fs');
            const stabilityBuffer = fs.readFileSync(sessionFiles.stabilityFile);

            // Parsear solo para obtener timestamps
            const { parseStabilityFile } = require('../utils/sessionParsers');
            const descartes: Record<string, any[]> = { ESTABILIDAD: [] };
            const stabilityData = parseStabilityFile(stabilityBuffer, descartes);

            if (stabilityData.length === 0) {
                return false;
            }

            // Obtener rango temporal
            const timestamps = stabilityData.map(d => {
                const timestamp = typeof d.timestamp === 'string' ? new Date(d.timestamp) : d.timestamp;
                return timestamp.getTime();
            }).filter(Boolean);

            if (timestamps.length === 0) {
                return false;
            }

            const startTime = new Date(Math.min(...timestamps));
            const endTime = new Date(Math.max(...timestamps));

            // Buscar sesiones existentes en el mismo rango temporal
            const existingSession = await prisma.session.findFirst({
                where: {
                    vehicleId,
                    startTime: {
                        gte: new Date(startTime.getTime() - 5 * 60 * 1000), // 5 minutos antes
                        lte: new Date(startTime.getTime() + 5 * 60 * 1000)  // 5 minutos después
                    },
                    endTime: {
                        gte: new Date(endTime.getTime() - 5 * 60 * 1000),   // 5 minutos antes
                        lte: new Date(endTime.getTime() + 5 * 60 * 1000)    // 5 minutos después
                    }
                }
            });

            return !!existingSession;

        } catch (error) {
            logger.warn('Error verificando si sesión existe:', error);
            return false; // En caso de error, asumir que no existe
        }
    }
} 
