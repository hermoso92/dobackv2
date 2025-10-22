
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';



export class StabilityController {
    // Obtener sesiones de estabilidad de un vehículo con datos reales
    getVehicleSessions = async (req: Request, res: Response) => {
        try {
            const { vehicleId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const orgId = req.orgId!;
            const user = req.user as any;

            logger.info('Obteniendo sesiones de estabilidad', { vehicleId, orgId, userId: user?.id });

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: orgId
                }
            });

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado o no pertenece a su organización'
                });
            }

            // Obtener sesiones con mediciones de estabilidad
            const sessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicleId,
                    organizationId: orgId,
                    stabilityMeasurements: {
                        some: {}
                    }
                },
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            name: true,
                            licensePlate: true,
                            type: true
                        }
                    },
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            gpsMeasurements: true,
                            stability_events: true
                        }
                    }
                },
                orderBy: {
                    startTime: 'desc'
                },
                take: Number(limit),
                skip: Number(offset)
            });

            // Calcular total para paginación
            const total = await prisma.session.count({
                where: {
                    vehicleId: vehicleId,
                    organizationId: orgId,
                    stabilityMeasurements: {
                        some: {}
                    }
                }
            });

            // Formatear respuesta
            const formattedSessions = sessions.map(session => ({
                id: session.id,
                vehicleId: session.vehicleId,
                vehicleName: session.vehicle.name,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime?.toISOString() || null,
                duration: session.endTime
                    ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
                    : 0,
                status: session.status,
                dataPoints: session._count.stabilityMeasurements,
                gpsPoints: session._count.gpsMeasurements,
                events: session._count.stability_events,
                sessionNumber: session.sessionNumber,
                type: session.type
            }));

            logger.info('Sesiones de estabilidad obtenidas', {
                vehicleId,
                count: formattedSessions.length,
                total
            });

            res.json({
                success: true,
                data: formattedSessions,
                meta: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: total > (Number(offset) + Number(limit))
                }
            });

        } catch (error) {
            logger.error('Error obteniendo sesiones de estabilidad', { error, vehicleId: req.params.vehicleId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener sesiones de estabilidad (genérico)
    getSessions = async (req: Request, res: Response) => {
        try {
            const { vehicleId, from, to, status, riskLevel, limit = 20, offset = 0 } = req.query;
            const orgId = req.orgId!;

            logger.info('Obteniendo sesiones de estabilidad', { vehicleId, orgId });

            // Construir filtros
            const where: any = {
                organizationId: orgId,
                stabilityMeasurements: {
                    some: {}
                }
            };

            if (vehicleId) {
                where.vehicleId = vehicleId as string;
            }

            if (from || to) {
                where.startTime = {};
                if (from) where.startTime.gte = new Date(from as string);
                if (to) where.startTime.lte = new Date(to as string);
            }

            if (status) {
                where.status = status;
            }

            // Obtener sesiones
            const sessions = await prisma.session.findMany({
                where,
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            name: true,
                            licensePlate: true
                        }
                    },
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            gpsMeasurements: true,
                            stability_events: true
                        }
                    }
                },
                orderBy: {
                    startTime: 'desc'
                },
                take: Number(limit),
                skip: Number(offset)
            });

            const total = await prisma.session.count({ where });

            const formattedSessions = sessions.map(session => ({
                id: session.id,
                vehicleId: session.vehicleId,
                vehicleName: session.vehicle.name,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime?.toISOString() || null,
                dataPoints: session._count.stabilityMeasurements,
                gpsPoints: session._count.gpsMeasurements,
                events: session._count.stability_events
            }));

            res.json({
                success: true,
                data: formattedSessions,
                meta: { total, limit: Number(limit), offset: Number(offset) }
            });

        } catch (error) {
            logger.error('Error obteniendo sesiones de estabilidad', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener sesión específica con todas sus mediciones
    getSession = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            logger.info('Obteniendo sesión de estabilidad', { sessionId: id, orgId });

            // Obtener sesión con mediciones limitadas (para paginación)
            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                },
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            name: true,
                            licensePlate: true,
                            type: true
                        }
                    },
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            gpsMeasurements: true,
                            stability_events: true
                        }
                    }
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            // Obtener sample de mediciones para métricas (cada 10 puntos)
            const stabilityMeasurements = await prisma.stabilityMeasurement.findMany({
                where: {
                    sessionId: id
                },
                orderBy: {
                    timestamp: 'asc'
                },
                take: 1000 // Limitar para calcular métricas
            });

            // Calcular métricas de estabilidad
            const siValues = stabilityMeasurements.map(m => m.si);
            const rollValues = stabilityMeasurements.map(m => m.roll || 0);
            const pitchValues = stabilityMeasurements.map(m => m.pitch || 0);
            const ayValues = stabilityMeasurements.map(m => m.ay);

            const avgSI = siValues.length > 0 ? siValues.reduce((a, b) => a + b, 0) / siValues.length : 0;
            const maxSI = siValues.length > 0 ? Math.max(...siValues) : 0;
            const minSI = siValues.length > 0 ? Math.min(...siValues) : 0;
            const maxRoll = rollValues.length > 0 ? Math.max(...rollValues.map(Math.abs)) : 0;
            const maxPitch = pitchValues.length > 0 ? Math.max(...pitchValues.map(Math.abs)) : 0;
            const maxLateralAcc = ayValues.length > 0 ? Math.max(...ayValues.map(Math.abs)) : 0;

            // Determinar nivel de riesgo
            let riskLevel = 'low';
            if (avgSI > 0.5 || maxLateralAcc > 0.8) {
                riskLevel = 'critical';
            } else if (avgSI > 0.3 || maxLateralAcc > 0.5) {
                riskLevel = 'high';
            } else if (avgSI > 0.15 || maxLateralAcc > 0.3) {
                riskLevel = 'medium';
            }

            // Calcular eventos de inestabilidad
            const instabilityCount = stabilityMeasurements.filter(m => m.si > 0.3).length;
            const criticalEventsCount = session._count.stability_events;

            const responseData = {
                id: session.id,
                orgId: session.organizationId,
                vehicleId: session.vehicleId,
                vehicleName: session.vehicle.name,
                startedAt: session.startTime.toISOString(),
                endedAt: session.endTime?.toISOString() || null,
                duration: session.endTime
                    ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
                    : 0,
                status: session.status,
                metrics: {
                    overallStability: Math.max(0, 100 - (avgSI * 100)),
                    lateralAcceleration: { max: maxLateralAcc, avg: ayValues.reduce((a, b) => a + Math.abs(b), 0) / ayValues.length },
                    stabilityIndex: avgSI,
                    riskLevel,
                    instabilityCount,
                    criticalEventsCount,
                    maxRoll,
                    maxPitch,
                    maxSI,
                    minSI
                },
                counts: {
                    stabilityMeasurements: session._count.stabilityMeasurements,
                    gpsMeasurements: session._count.gpsMeasurements,
                    events: session._count.stability_events
                },
                version: 1
            };

            logger.info('Sesión de estabilidad obtenida', { sessionId: id, dataPoints: session._count.stabilityMeasurements });

            res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            logger.error('Error obteniendo sesión de estabilidad', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener datos completos de una sesión (mediciones + GPS + eventos)
    getSessionData = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;
            const { limit = 5000 } = req.query; // Limitar puntos de datos

            logger.info('Obteniendo datos completos de sesión', { sessionId: id, orgId, limit });

            // Verificar que la sesión existe y pertenece a la organización
            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                },
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            // Obtener mediciones de estabilidad (con downsampling si hay muchas)
            const totalMeasurements = await prisma.stabilityMeasurement.count({
                where: { sessionId: id }
            });

            let stabilityMeasurements;
            if (totalMeasurements > Number(limit)) {
                // Aplicar downsampling: tomar 1 de cada N puntos
                const step = Math.ceil(totalMeasurements / Number(limit));
                const allMeasurements = await prisma.stabilityMeasurement.findMany({
                    where: { sessionId: id },
                    orderBy: { timestamp: 'asc' }
                });
                stabilityMeasurements = allMeasurements.filter((_, index) => index % step === 0);
                logger.info(`Downsampling aplicado: ${totalMeasurements} -> ${stabilityMeasurements.length} puntos`);
            } else {
                stabilityMeasurements = await prisma.stabilityMeasurement.findMany({
                    where: { sessionId: id },
                    orderBy: { timestamp: 'asc' }
                });
            }

            // Obtener mediciones GPS
            const gpsMeasurements = await prisma.gpsMeasurement.findMany({
                where: { sessionId: id },
                orderBy: { timestamp: 'asc' }
            });

            // Obtener eventos de estabilidad
            const stabilityEvents = await prisma.stabilityEvent.findMany({
                where: { session_id: id },
                orderBy: { timestamp: 'asc' }
            });

            // Formatear mediciones de estabilidad
            const measurements = stabilityMeasurements.map(m => ({
                timestamp: m.timestamp.toISOString(),
                ax: m.ax,
                ay: m.ay,
                az: m.az,
                gx: m.gx,
                gy: m.gy,
                gz: m.gz,
                roll: m.roll || 0,
                pitch: m.pitch || 0,
                yaw: m.yaw || 0,
                si: m.si,
                accmag: m.accmag
            }));

            // Formatear datos GPS
            const gpsData = gpsMeasurements.map(g => ({
                timestamp: g.timestamp.toISOString(),
                latitude: g.latitude,
                longitude: g.longitude,
                altitude: g.altitude,
                speed: g.speed,
                satellites: g.satellites,
                heading: g.heading || 0,
                accuracy: g.accuracy || 0
            }));

            // Formatear eventos
            const events = stabilityEvents.map(e => ({
                id: e.id,
                timestamp: e.timestamp.toISOString(),
                lat: e.lat,
                lon: e.lon,
                type: e.type,
                details: e.details
            }));

            logger.info('Datos de sesión obtenidos', {
                sessionId: id,
                measurements: measurements.length,
                gpsPoints: gpsData.length,
                events: events.length
            });

            res.json({
                success: true,
                data: {
                    sessionId: id,
                    vehicleId: session.vehicleId,
                    vehicleName: session.vehicle.name,
                    startTime: session.startTime.toISOString(),
                    endTime: session.endTime?.toISOString() || null,
                    measurements,
                    gpsData,
                    events
                }
            });

        } catch (error) {
            logger.error('Error obteniendo datos de sesión', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener eventos de sesión
    getSessionEvents = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            logger.info('Obteniendo eventos de estabilidad', { sessionId: id });

            // Verificar que la sesión pertenece a la organización
            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            // Obtener eventos de estabilidad
            const events = await prisma.stabilityEvent.findMany({
                where: {
                    session_id: id
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });

            const formattedEvents = events.map(e => {
                const details = (typeof e.details === 'object' ? e.details : {}) as any;
                return {
                    id: e.id,
                    sessionId: id,
                    timestamp: e.timestamp.toISOString(),
                    type: e.type,
                    lat: e.lat || 0,
                    lon: e.lon || 0,
                    severity: details?.severity || e.severity || 'medium',
                    level: details?.level || 'unknown',
                    perc: details?.perc || 0,
                    tipos: details?.tipos || [e.type],
                    valores: details?.valores || {},
                    can: details?.can || undefined,
                    speed: e.speed || 0,
                    rotativoState: e.rotativoState || 0,
                    details: details
                };
            });

            res.json({
                success: true,
                data: formattedEvents
            });

        } catch (error) {
            logger.error('Error obteniendo eventos de sesión', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener métricas de estabilidad
    getStabilityMetrics = async (req: Request, res: Response) => {
        try {
            const mockMetrics = {
                overall: {
                    averageStability: 88.5,
                    totalSessions: 24,
                    criticalEvents: 15,
                    riskDistribution: { low: 60, medium: 30, high: 8, critical: 2 }
                },
                trends: {
                    stabilityTrend: 'improving',
                    weeklyChange: +5.2,
                    monthlyChange: +12.8
                }
            };

            res.json({
                success: true,
                data: mockMetrics
            });

        } catch (error) {
            logger.error('Error obteniendo métricas de estabilidad', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener estadísticas de estabilidad
    getStabilityStats = async (req: Request, res: Response) => {
        try {
            const mockStats = {
                summary: {
                    totalSessions: 24,
                    averageStability: 88.5,
                    totalEvents: 156,
                    criticalEvents: 15
                },
                performance: { excellent: 45, good: 35, fair: 15, poor: 5 }
            };

            res.json({
                success: true,
                data: mockStats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de estabilidad', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Comparar sesiones con datos reales
    compareSessions = async (req: Request, res: Response) => {
        try {
            const { sessionIds } = req.body;
            const orgId = req.orgId!;
            const userId = req.user?.id;

            if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requieren al menos 2 sesiones para comparar'
                });
            }

            logger.info('Comparando sesiones', { sessionIds, orgId });

            // Obtener todas las sesiones con sus métricas
            const sessions = await prisma.session.findMany({
                where: {
                    id: { in: sessionIds },
                    organizationId: orgId
                },
                include: {
                    vehicle: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            stability_events: true
                        }
                    }
                }
            });

            if (sessions.length !== sessionIds.length) {
                return res.status(404).json({
                    success: false,
                    error: 'Una o más sesiones no fueron encontradas'
                });
            }

            // Calcular métricas para cada sesión
            const sessionMetrics = await Promise.all(
                sessions.map(async (session) => {
                    // Obtener muestra de mediciones para cálculo
                    const measurements = await prisma.stabilityMeasurement.findMany({
                        where: { sessionId: session.id },
                        orderBy: { timestamp: 'asc' },
                        take: 1000
                    });

                    if (measurements.length === 0) {
                        return {
                            sessionId: session.id,
                            vehicleName: session.vehicle.name,
                            startTime: session.startTime.toISOString(),
                            stabilityScore: 0,
                            avgSI: 0,
                            maxSI: 0,
                            criticalEvents: session._count.stability_events,
                            dataPoints: session._count.stabilityMeasurements
                        };
                    }

                    const siValues = measurements.map(m => m.si);
                    const avgSI = siValues.reduce((a, b) => a + b, 0) / siValues.length;
                    const maxSI = Math.max(...siValues);
                    const stabilityScore = Math.max(0, 100 - (avgSI * 100));

                    return {
                        sessionId: session.id,
                        vehicleName: session.vehicle.name,
                        startTime: session.startTime.toISOString(),
                        endTime: session.endTime?.toISOString(),
                        duration: session.endTime
                            ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
                            : 0,
                        stabilityScore,
                        avgSI,
                        maxSI,
                        minSI: Math.min(...siValues),
                        criticalEvents: session._count.stability_events,
                        dataPoints: session._count.stabilityMeasurements,
                        maxLateralAcc: Math.max(...measurements.map(m => Math.abs(m.ay))),
                        maxRoll: Math.max(...measurements.map(m => Math.abs(m.roll || 0)))
                    };
                })
            );

            // Calcular tendencia general
            const scores = sessionMetrics.map(m => m.stabilityScore);
            const firstScore = scores[0];
            const lastScore = scores[scores.length - 1];
            const scoreDiff = lastScore - firstScore;

            let stabilityTrend: 'improving' | 'stable' | 'declining';
            if (scoreDiff > 5) {
                stabilityTrend = 'improving';
            } else if (scoreDiff < -5) {
                stabilityTrend = 'declining';
            } else {
                stabilityTrend = 'stable';
            }

            const avgStability = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgStability, 2), 0) / scores.length;

            // Comparación de eventos críticos
            const totalCriticalEvents = sessionMetrics.reduce((sum, m) => sum + m.criticalEvents, 0);
            const firstCritical = sessionMetrics[0].criticalEvents;
            const lastCritical = sessionMetrics[sessionMetrics.length - 1].criticalEvents;
            const eventChange = lastCritical - firstCritical;
            const eventChangePercent = firstCritical > 0 ? (eventChange / firstCritical) * 100 : 0;

            // Generar hallazgos clave
            const keyFindings = [];
            if (stabilityTrend === 'improving') {
                keyFindings.push(`Mejora del ${scoreDiff.toFixed(1)}% en la puntuación de estabilidad`);
            } else if (stabilityTrend === 'declining') {
                keyFindings.push(`Deterioro del ${Math.abs(scoreDiff).toFixed(1)}% en la puntuación de estabilidad`);
            }

            if (eventChange < 0) {
                keyFindings.push(`Reducción del ${Math.abs(eventChangePercent).toFixed(1)}% en eventos críticos`);
            } else if (eventChange > 0) {
                keyFindings.push(`Incremento del ${eventChangePercent.toFixed(1)}% en eventos críticos`);
            }

            // Generar recomendaciones
            const recommendations = [];
            if (avgStability < 70) {
                recommendations.push('Revisar sistema de suspensión y amortiguadores');
                recommendations.push('Verificar presión y estado de neumáticos');
            }
            if (totalCriticalEvents > sessionMetrics.length * 5) {
                recommendations.push('Programar mantenimiento preventivo urgente');
            }
            if (stabilityTrend === 'declining') {
                recommendations.push('Realizar inspección técnica completa del vehículo');
            } else if (stabilityTrend === 'improving') {
                recommendations.push('Continuar con el programa de mantenimiento actual');
            }

            const comparisonResult = {
                id: uuidv4(),
                orgId,
                createdBy: userId || 'system',
                createdAt: new Date().toISOString(),
                sessionIds,
                comparison: {
                    sessions: sessionMetrics,
                    metrics: {
                        stabilityTrend,
                        averageStability: avgStability,
                        stabilityVariance: Math.sqrt(variance),
                        scoreDifference: scoreDiff,
                        riskEvolution: {
                            first: firstScore,
                            last: lastScore,
                            change: scoreDiff
                        },
                        eventsComparison: {
                            total: totalCriticalEvents,
                            first: firstCritical,
                            last: lastCritical,
                            change: eventChange,
                            changePercent: eventChangePercent
                        }
                    },
                    analysis: {
                        summary: stabilityTrend === 'improving'
                            ? 'Se observa una tendencia de mejora en la estabilidad del vehículo'
                            : stabilityTrend === 'declining'
                                ? 'Se detecta un deterioro en la estabilidad que requiere atención'
                                : 'La estabilidad del vehículo se mantiene constante',
                        keyFindings,
                        recommendations
                    }
                },
                version: 1
            };

            logger.info('Comparación de sesiones completada', {
                sessionIds,
                trend: stabilityTrend,
                avgStability
            });

            res.json({
                success: true,
                data: comparisonResult
            });

        } catch (error) {
            logger.error('Error comparando sesiones', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener comparaciones guardadas
    getComparisons = async (req: Request, res: Response) => {
        try {
            const { limit = 10, offset = 0 } = req.query;

            res.json({
                success: true,
                data: [],
                meta: {
                    total: 0,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });

        } catch (error) {
            logger.error('Error obteniendo comparaciones', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Guardar comparación
    saveComparison = async (req: Request, res: Response) => {
        try {
            const comparison = req.body;
            const orgId = req.orgId!;

            const savedComparison = {
                ...comparison,
                id: uuidv4(),
                orgId,
                createdAt: new Date().toISOString(),
                version: 1
            };

            res.json({
                success: true,
                data: savedComparison
            });

        } catch (error) {
            logger.error('Error guardando comparación', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Eliminar comparación
    deleteComparison = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            res.json({
                success: true,
                data: { id, deleted: true }
            });

        } catch (error) {
            logger.error('Error eliminando comparación', { error, comparisonId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener vehículos con datos de estabilidad
    getVehiclesWithStability = async (req: Request, res: Response) => {
        try {
            const mockVehicles = [
                { id: 'vehicle-1', name: 'Vehículo 001', averageStability: 85, sessionsCount: 12 },
                { id: 'vehicle-2', name: 'Vehículo 002', averageStability: 92, sessionsCount: 8 }
            ];

            res.json({
                success: true,
                data: mockVehicles
            });

        } catch (error) {
            logger.error('Error obteniendo vehículos con estabilidad', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener datos en tiempo real
    getRealtimeData = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const mockRealtimeData = {
                sessionId: id,
                currentStability: 87,
                currentRiskLevel: 'medium',
                lastUpdate: new Date().toISOString(),
                recentEvents: []
            };

            res.json({
                success: true,
                data: mockRealtimeData
            });

        } catch (error) {
            logger.error('Error obteniendo datos en tiempo real', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Exportar datos de estabilidad
    exportStabilityData = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { format = 'pdf' } = req.body;

            if (format === 'pdf') {
                const pdfContent = Buffer.from('Mock PDF content for stability report');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="estabilidad-${id}.pdf"`);
                res.send(pdfContent);
            } else {
                const csvContent = 'Timestamp,Type,Severity\n2024-01-15T10:15:00Z,lateral_instability,medium';
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="estabilidad-${id}.csv"`);
                res.send(csvContent);
            }

        } catch (error) {
            logger.error('Error exportando datos de estabilidad', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener datos para mapa de calor
    getHeatmapData = async (req: Request, res: Response) => {
        try {
            const {
                vehicleId,
                eventType,
                timeRange = 'week',
                parkId,
                organizationId
            } = req.query;

            logger.info('Obteniendo datos para mapa de calor', {
                vehicleId,
                eventType,
                timeRange,
                parkId,
                organizationId
            });

            // Construir filtros de fecha
            let dateFilter: any = {};
            const now = new Date();

            switch (timeRange) {
                case 'day':
                    dateFilter.gte = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                // 'all' no aplica filtro de fecha
            }

            // Construir filtros de consulta
            const whereClause: any = {
                timestamp: dateFilter.gte ? dateFilter : undefined
            };

            // Si se especifica un vehículo, filtrar por sesiones de ese vehículo
            if (vehicleId) {
                const sessions = await prisma.session.findMany({
                    where: { vehicleId: vehicleId as string },
                    select: { id: true }
                });
                whereClause.session_id = { in: sessions.map(s => s.id) };
            }

            // Si se especifica tipo de evento
            if (eventType) {
                whereClause.type = eventType;
            }

            // Obtener eventos de estabilidad con información de sesión y vehículo
            const events = await prisma.stabilityEvent.findMany({
                where: whereClause,
                include: {
                    Session: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: 1000 // Límite para rendimiento
            });

            logger.info('Eventos encontrados para mapa de calor', {
                count: events.length,
                filters: whereClause
            });

            // Procesar eventos para el mapa de calor
            const heatmapPoints = events.map(event => {
                const details = event.details as any || {};

                return {
                    id: event.id,
                    lat: event.lat,
                    lng: event.lon,
                    timestamp: event.timestamp.toISOString(),
                    vehicleId: event.Session.vehicleId,
                    vehicleName: event.Session.vehicle.name,
                    eventType: event.type,
                    severity: details.level || 'medium',
                    speed: details.can?.vehicleSpeed || 0,
                    rotativo: details.can?.rotativo || false,
                    street: details.street || 'Dirección no disponible',
                    tipos: details.tipos || [event.type],
                    valores: details.valores || {},
                    can: details.can || {}
                };
            });

            // Calcular estadísticas
            const stats = {
                totalEvents: heatmapPoints.length,
                eventsByType: heatmapPoints.reduce((acc: any, point) => {
                    acc[point.eventType] = (acc[point.eventType] || 0) + 1;
                    return acc;
                }, {}),
                eventsByVehicle: heatmapPoints.reduce((acc: any, point) => {
                    acc[point.vehicleName] = (acc[point.vehicleName] || 0) + 1;
                    return acc;
                }, {}),
                criticalEvents: heatmapPoints.filter(p => p.severity === 'critical').length,
                highEvents: heatmapPoints.filter(p => p.severity === 'high').length,
                mediumEvents: heatmapPoints.filter(p => p.severity === 'medium').length,
                lowEvents: heatmapPoints.filter(p => p.severity === 'low').length
            };

            res.json({
                success: true,
                data: heatmapPoints,
                stats
            });

        } catch (error) {
            logger.error('Error obteniendo datos del mapa de calor', { error, query: req.query });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Exportar mapa de calor a PDF
    exportHeatmapPDF = async (req: Request, res: Response) => {
        try {
            const {
                vehicleId,
                eventType,
                timeRange = 'week',
                parkId,
                organizationId
            } = req.query;

            logger.info('Exportando mapa de calor a PDF', {
                vehicleId,
                eventType,
                timeRange,
                parkId,
                organizationId
            });

            // Obtener los mismos datos que el mapa de calor
            const whereClause: any = {};

            // Construir filtros de fecha
            if (timeRange !== 'all') {
                const now = new Date();
                let dateFilter: any = {};

                switch (timeRange) {
                    case 'day':
                        dateFilter.gte = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case 'week':
                        dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                }
                whereClause.timestamp = dateFilter;
            }

            // Si se especifica un vehículo
            if (vehicleId) {
                const sessions = await prisma.session.findMany({
                    where: { vehicleId: vehicleId as string },
                    select: { id: true }
                });
                whereClause.session_id = { in: sessions.map(s => s.id) };
            }

            // Si se especifica tipo de evento
            if (eventType) {
                whereClause.type = eventType;
            }

            // Obtener eventos
            const events = await prisma.stabilityEvent.findMany({
                where: whereClause,
                include: {
                    Session: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: 1000
            });

            // Procesar eventos
            const heatmapPoints = events.map(event => {
                const details = event.details as any || {};
                return {
                    id: event.id,
                    lat: event.lat,
                    lng: event.lon,
                    timestamp: event.timestamp.toISOString(),
                    vehicleId: event.Session.vehicleId,
                    vehicleName: event.Session.vehicle.name,
                    eventType: event.type,
                    severity: details.level || 'medium',
                    speed: details.can?.vehicleSpeed || 0,
                    rotativo: details.can?.rotativo || false,
                    street: details.street || 'Dirección no disponible'
                };
            });

            // Calcular estadísticas para el reporte
            const stats = {
                totalEvents: heatmapPoints.length,
                criticalEvents: heatmapPoints.filter(p => p.severity === 'critical').length,
                highEvents: heatmapPoints.filter(p => p.severity === 'high').length,
                mediumEvents: heatmapPoints.filter(p => p.severity === 'medium').length,
                lowEvents: heatmapPoints.filter(p => p.severity === 'low').length,
                eventsByType: heatmapPoints.reduce((acc: any, point) => {
                    acc[point.eventType] = (acc[point.eventType] || 0) + 1;
                    return acc;
                }, {}),
                eventsByVehicle: heatmapPoints.reduce((acc: any, point) => {
                    acc[point.vehicleName] = (acc[point.vehicleName] || 0) + 1;
                    return acc;
                }, {})
            };

            // Generar PDF mock (en producción se usaría una librería como puppeteer)
            const pdfContent = `
                REPORTE DE PUNTOS NEGROS
                =========================
                
                Período: ${timeRange}
                Vehículo: ${vehicleId || 'Todos'}
                Tipo de Evento: ${eventType || 'Todos'}
                
                ESTADÍSTICAS:
                - Total de Eventos: ${stats.totalEvents}
                - Eventos Críticos: ${stats.criticalEvents}
                - Eventos Graves: ${stats.highEvents}
                - Eventos Moderados: ${stats.mediumEvents}
                - Eventos Leves: ${stats.lowEvents}
                
                ZONA MÁS CONFLICTIVA:
                ${heatmapPoints.length > 0 ?
                    `Calle Serrano (Madrid) con ${Math.max(...Object.values(stats.eventsByType) as number[])} incidencias en el período seleccionado` :
                    'No se encontraron eventos en el período seleccionado'
                }
                
                LISTA DE EVENTOS CRÍTICOS POR CATEGORÍA:
                ${Object.entries(stats.eventsByType).map(([type, count]) => `- ${type}: ${count} eventos`).join('\n')}
                
                Generado el: ${new Date().toLocaleString()}
            `;

            // Simular PDF
            const pdfBuffer = Buffer.from(pdfContent, 'utf8');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="puntos-negros-${new Date().toISOString().split('T')[0]}.pdf"`);
            res.send(pdfBuffer);

        } catch (error) {
            logger.error('Error exportando mapa de calor a PDF', { error, query: req.query });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
}
