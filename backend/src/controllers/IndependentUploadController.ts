import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import path from 'path';
import { IndependentDataProcessor } from '../services/IndependentDataProcessor';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export class IndependentUploadController {
    /**
     * Procesa todos los archivos de un vehículo de forma independiente
     */
    async processVehicleData(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            logger.info('🚀 Iniciando procesamiento independiente de datos de vehículo', {
                body: req.body,
                user: req.user
            });

            const { vehicleId, date, basePath } = req.body;

            if (!vehicleId) {
                logger.warn('Intento de procesamiento sin vehicleId');
                res.status(400).json({ error: 'Falta vehicleId' });
                return;
            }

            if (!req.user?.organizationId) {
                logger.warn('Intento de procesamiento sin organizationId');
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: req.user.organizationId
                }
            });

            if (!vehicle) {
                logger.warn('Vehículo no encontrado o no autorizado', { vehicleId });
                res.status(404).json({ error: 'Vehículo no encontrado o no autorizado' });
                return;
            }

            // Determinar la ruta base de los archivos
            const finalBasePath = basePath || path.join(
                process.cwd(),
                'backend/data/datosDoback/CMadrid',
                vehicleId
            );

            // Verificar que la ruta existe
            try {
                await require('fs/promises').access(finalBasePath);
            } catch (error) {
                logger.error(`Ruta de datos no encontrada: ${finalBasePath}`);
                res.status(404).json({ error: 'Ruta de datos no encontrada' });
                return;
            }

            const targetDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');

            // Crear procesador independiente
            const processor = new IndependentDataProcessor({
                organizationId: req.user.organizationId,
                vehicleId: vehicle.id,
                date: targetDate,
                basePath: finalBasePath
            });

            // Procesar todos los archivos
            await processor.processAllFilesByType();

            // Obtener reporte de procesamiento
            const report = processor.getProcessingReport();

            logger.info('🎉 Procesamiento independiente completado exitosamente', {
                vehicleId: vehicle.name,
                report
            });

            res.status(200).json({
                success: true,
                message: 'Datos procesados exitosamente',
                data: {
                    vehicle: {
                        id: vehicle.id,
                        name: vehicle.name
                    },
                    processing: report,
                    date: targetDate
                }
            });

        } catch (error) {
            logger.error('Error en procesamiento independiente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Procesa todos los vehículos de una organización
     */
    async processAllVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            logger.info('🚀 Iniciando procesamiento independiente de todos los vehículos', {
                user: req.user
            });

            if (!req.user?.organizationId) {
                logger.warn('Intento de procesamiento sin organizationId');
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Obtener todos los vehículos de la organización
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: req.user.organizationId,
                    active: true
                }
            });

            if (vehicles.length === 0) {
                logger.warn('No se encontraron vehículos activos');
                res.status(404).json({ error: 'No se encontraron vehículos activos' });
                return;
            }

            const { date, basePath } = req.body;
            const targetDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
            const baseDataPath = basePath || path.join(process.cwd(), 'backend/data/datosDoback/CMadrid');

            const results = [];
            const errors = [];

            // Procesar cada vehículo
            for (const vehicle of vehicles) {
                try {
                    logger.info(`🔄 Procesando vehículo ${vehicle.name} (${vehicle.id})`);

                    const vehiclePath = path.join(baseDataPath, vehicle.id);

                    // Verificar que la ruta del vehículo existe
                    try {
                        await require('fs/promises').access(vehiclePath);
                    } catch (error) {
                        logger.warn(`Ruta de datos no encontrada para vehículo ${vehicle.id}: ${vehiclePath}`);
                        errors.push({
                            vehicleId: vehicle.id,
                            vehicleName: vehicle.name,
                            error: 'Ruta de datos no encontrada'
                        });
                        continue;
                    }

                    const processor = new IndependentDataProcessor({
                        organizationId: req.user.organizationId,
                        vehicleId: vehicle.id,
                        date: targetDate,
                        basePath: vehiclePath
                    });

                    await processor.processAllFilesByType();
                    const report = processor.getProcessingReport();

                    results.push({
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        success: true,
                        report
                    });

                    logger.info(`✅ Vehículo ${vehicle.name} procesado exitosamente`);

                } catch (error) {
                    logger.error(`Error procesando vehículo ${vehicle.name}:`, error);
                    errors.push({
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }
            }

            logger.info('🎉 Procesamiento masivo completado', {
                totalVehicles: vehicles.length,
                successful: results.length,
                failed: errors.length
            });

            res.status(200).json({
                success: true,
                message: 'Procesamiento masivo completado',
                data: {
                    summary: {
                        totalVehicles: vehicles.length,
                        successful: results.length,
                        failed: errors.length
                    },
                    results,
                    errors,
                    date: targetDate
                }
            });

        } catch (error) {
            logger.error('Error en procesamiento masivo:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene el estado del procesamiento de un vehículo
     */
    async getProcessingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { vehicleId } = req.params;

            if (!vehicleId) {
                res.status(400).json({ error: 'Falta vehicleId' });
                return;
            }

            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: req.user.organizationId
                }
            });

            if (!vehicle) {
                res.status(404).json({ error: 'Vehículo no encontrado o no autorizado' });
                return;
            }

            // Obtener sesiones recientes del vehículo
            const recentSessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicle.id,
                    organizationId: req.user.organizationId
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 10,
                include: {
                    _count: {
                        select: {
                            gpsMeasurements: true,
                            stabilityMeasurements: true,
                            canMeasurements: true,
                            rotativoMeasurements: true
                        }
                    }
                }
            });

            // Obtener estadísticas de datos
            const dataStats = await prisma.$transaction([
                prisma.gpsMeasurement.count({
                    where: {
                        session: {
                            vehicleId: vehicle.id,
                            organizationId: req.user.organizationId
                        }
                    }
                }),
                prisma.stabilityMeasurement.count({
                    where: {
                        session: {
                            vehicleId: vehicle.id,
                            organizationId: req.user.organizationId
                        }
                    }
                }),
                prisma.canMeasurement.count({
                    where: {
                        session: {
                            vehicleId: vehicle.id,
                            organizationId: req.user.organizationId
                        }
                    }
                }),
                prisma.rotativoMeasurement.count({
                    where: {
                        session: {
                            vehicleId: vehicle.id,
                            organizationId: req.user.organizationId
                        }
                    }
                })
            ]);

            const [gpsCount, stabilityCount, canCount, rotativoCount] = dataStats;

            res.status(200).json({
                success: true,
                data: {
                    vehicle: {
                        id: vehicle.id,
                        name: vehicle.name
                    },
                    statistics: {
                        totalGPSPoints: gpsCount,
                        totalStabilityPoints: stabilityCount,
                        totalCANPoints: canCount,
                        totalRotativoPoints: rotativoCount
                    },
                    recentSessions: recentSessions.map(session => ({
                        id: session.id,
                        sessionNumber: session.sessionNumber,
                        startTime: session.startTime,
                        endTime: session.endTime,
                        duration: session.endTime.getTime() - session.startTime.getTime(),
                        source: session.source,
                        dataCounts: session._count,
                        createdAt: session.createdAt
                    }))
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estado de procesamiento:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene estadísticas generales de procesamiento
     */
    async getProcessingStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Obtener estadísticas generales de la organización
            const stats = await prisma.$transaction([
                prisma.vehicle.count({
                    where: {
                        organizationId: req.user.organizationId,
                        active: true
                    }
                }),
                prisma.session.count({
                    where: {
                        organizationId: req.user.organizationId
                    }
                }),
                prisma.gpsMeasurement.count({
                    where: {
                        session: {
                            organizationId: req.user.organizationId
                        }
                    }
                }),
                prisma.stabilityMeasurement.count({
                    where: {
                        session: {
                            organizationId: req.user.organizationId
                        }
                    }
                }),
                prisma.canMeasurement.count({
                    where: {
                        session: {
                            organizationId: req.user.organizationId
                        }
                    }
                }),
                prisma.rotativoMeasurement.count({
                    where: {
                        session: {
                            organizationId: req.user.organizationId
                        }
                    }
                })
            ]);

            const [vehicleCount, sessionCount, gpsCount, stabilityCount, canCount, rotativoCount] = stats;

            // Obtener vehículos con más actividad
            const topVehicles = await prisma.session.groupBy({
                by: ['vehicleId'],
                where: {
                    organizationId: req.user.organizationId
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            });

            // Obtener información de los vehículos
            const vehicleIds = topVehicles.map(v => v.vehicleId);
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    id: { in: vehicleIds },
                    organizationId: req.user.organizationId
                },
                select: {
                    id: true,
                    name: true
                }
            });

            const topVehiclesWithNames = topVehicles.map(tv => {
                const vehicle = vehicles.find(v => v.id === tv.vehicleId);
                return {
                    vehicleId: tv.vehicleId,
                    vehicleName: vehicle?.name || 'Desconocido',
                    sessionCount: tv._count.id
                };
            });

            res.status(200).json({
                success: true,
                data: {
                    summary: {
                        totalVehicles: vehicleCount,
                        totalSessions: sessionCount,
                        totalDataPoints: gpsCount + stabilityCount + canCount + rotativoCount
                    },
                    dataBreakdown: {
                        gps: gpsCount,
                        stability: stabilityCount,
                        can: canCount,
                        rotativo: rotativoCount
                    },
                    topVehicles: topVehiclesWithNames
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
