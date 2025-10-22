import { PrismaClient, SessionStatus, SessionType, StabilityMeasurement } from '@prisma/client';
import { logger } from '../utils/logger';

class SessionRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Encuentra sesiones por vehicleId
     * @param vehicleId ID del vehículo
     * @returns Promise con array de sesiones
     */
    async findSessionsByVehicle(vehicleId: string) {
        try {
            return await prisma.session.findMany({
                where: { vehicleId },
                orderBy: {
                    startTime: 'desc'
                }
            });
        } catch (error) {
            logger.error('Error finding sessions by vehicle', { error });
            throw error;
        }
    }

    /**
     * Encuentra sesiones por vehicleId y organizationId
     * @param vehicleId ID del vehículo (opcional)
     * @param organizationId ID de la organización
     * @returns Promise con array de sesiones
     */
    async findSessionsByVehicleAndOrganization(
        vehicleId: string | undefined,
        organizationId: string
    ) {
        try {
            return await prisma.session.findMany({
                where: {
                    ...(vehicleId && { vehicleId }),
                    organizationId
                },
                orderBy: {
                    startTime: 'desc'
                }
            });
        } catch (error) {
            logger.error('Error finding sessions by vehicle and organization', {
                error,
                vehicleId,
                organizationId
            });
            throw error;
        }
    }

    /**
     * Encuentra una sesión activa por ID
     * @param id ID de la sesión
     * @returns Promise con la sesión o null si no existe
     */
    async findActiveSession(id: string) {
        try {
            return await prisma.session.findFirst({
                where: {
                    id,
                    status: 'ACTIVE'
                }
            });
        } catch (error) {
            logger.error('Error finding active session', { error });
            throw error;
        }
    }

    /**
     * Encuentra una sesión por ID (cualquier status)
     * @param id ID de la sesión
     * @returns Promise con la sesión o null si no existe
     */
    async findSessionById(id: string) {
        try {
            return await prisma.session.findUnique({
                where: { id }
            });
        } catch (error) {
            logger.error('Error finding session by id', { error });
            throw error;
        }
    }

    /**
     * Encuentra una sesión por ID y organizationId
     * @param id ID de la sesión
     * @param organizationId ID de la organización
     * @returns Promise con la sesión o null si no existe
     */
    async findSessionByIdAndOrganization(id: string, organizationId: string) {
        try {
            return await prisma.session.findFirst({
                where: {
                    id,
                    organizationId
                }
            });
        } catch (error) {
            logger.error('Error finding session by id and organization', {
                error,
                id,
                organizationId
            });
            throw error;
        }
    }

    /**
     * Crea una nueva sesión
     * @param data Datos de la sesión
     * @returns Promise con la sesión creada
     */
    async createSession(data: any) {
        try {
            return await prisma.session.create({
                data
            });
        } catch (error) {
            logger.error('Error creating session', { error });
            throw error;
        }
    }

    /**
     * Actualiza una sesión existente
     * @param data Datos a actualizar con ID
     * @returns Promise con la sesión actualizada
     */
    async updateSession(data: {
        id: string;
        status?: SessionStatus;
        type?: SessionType;
        vehicleId?: string;
    }) {
        try {
            const { id, ...updateData } = data;
            return await prisma.session.update({
                where: { id },
                data: updateData
            });
        } catch (error) {
            logger.error('Error updating session', { error });
            throw error;
        }
    }

    /**
     * Elimina una sesión por su ID
     * @param id ID de la sesión
     * @returns Promise con la sesión eliminada
     */
    async deleteSession(id: string) {
        try {
            // Primero eliminamos los registros relacionados
            await prisma.stabilityMeasurement.deleteMany({
                where: { sessionId: id }
            });

            await prisma.canMeasurement.deleteMany({
                where: { sessionId: id }
            });

            await prisma.gpsMeasurement.deleteMany({
                where: { sessionId: id }
            });

            await prisma.ejecucionEvento.deleteMany({
                where: { sessionId: id }
            });

            await prisma.archivoSubido.deleteMany({
                where: { sessionId: id }
            });

            await prisma.informeGenerado.deleteMany({
                where: { sessionId: id }
            });

            await prisma.sugerenciaIA.deleteMany({
                where: { sessionId: id }
            });

            // Finalmente eliminamos la sesión
            return await prisma.session.delete({
                where: { id }
            });
        } catch (error) {
            logger.error('Error deleting session', { error });
            throw error;
        }
    }

    /**
     * Finaliza una sesión
     * @param id ID de la sesión
     * @param endTime Fecha de finalización
     * @returns Promise con la sesión actualizada
     */
    async endSession(id: string, endTime: Date) {
        try {
            return await prisma.session.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    endTime
                }
            });
        } catch (error) {
            logger.error('Error ending session', { error });
            throw error;
        }
    }

    /**
     * Obtiene eventos del vehículo filtrados por varios criterios
     * @param vehicleId ID del vehículo
     * @param filters Filtros para los eventos
     * @returns Promise con array de eventos
     */
    async getVehicleEvents(vehicleId: string, filters: any) {
        try {
            const { startDate, endDate, type, severity } = filters;

            return await prisma.ejecucionEvento.findMany({
                where: {
                    vehicleId,
                    ...(type && { event: { type } }),
                    ...(severity && { event: { severity } }),
                    ...(startDate && { triggeredAt: { gte: startDate } }),
                    ...(endDate && { triggeredAt: { lte: endDate } })
                },
                include: {
                    event: true
                },
                orderBy: {
                    triggeredAt: 'desc'
                }
            });
        } catch (error) {
            logger.error('Error getting vehicle events', { error, vehicleId });
            throw error;
        }
    }

    /**
     * Obtiene métricas del vehículo en un rango de fechas
     * @param vehicleId ID del vehículo
     * @param startDate Fecha inicial opcional
     * @param endDate Fecha final opcional
     * @returns Promise con métricas del vehículo
     */
    async getVehicleMetrics(vehicleId: string, startDate?: Date, endDate?: Date) {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    vehicleId,
                    ...(startDate && { startTime: { gte: startDate } }),
                    ...(endDate && { startTime: { lte: endDate } })
                },
                orderBy: {
                    startTime: 'desc'
                },
                include: {
                    stabilityMeasurements: true
                }
            });

            const metrics = {
                ssf: 0,
                ltr: 0,
                drs: 0,
                rsc: 0,
                sessions: sessions.length
            };

            if (sessions.length > 0) {
                let validMetricsSessions = 0;

                for (const session of sessions) {
                    if (session.stabilityMeasurements && session.stabilityMeasurements.length > 0) {
                        const measurements = session.stabilityMeasurements;
                        metrics.ssf +=
                            measurements.reduce(
                                (sum: number, m: StabilityMeasurement) => sum + (m.roll || 0),
                                0
                            ) / measurements.length;
                        metrics.ltr +=
                            measurements.reduce(
                                (sum: number, m: StabilityMeasurement) => sum + (m.pitch || 0),
                                0
                            ) / measurements.length;
                        metrics.drs +=
                            measurements.reduce(
                                (sum: number, m: StabilityMeasurement) => sum + (m.yaw || 0),
                                0
                            ) / measurements.length;
                        metrics.rsc +=
                            measurements.reduce(
                                (sum: number, m: StabilityMeasurement) => sum + (m.accmag || 0),
                                0
                            ) / measurements.length;
                        validMetricsSessions++;
                    }
                }

                if (validMetricsSessions > 0) {
                    metrics.ssf /= validMetricsSessions;
                    metrics.ltr /= validMetricsSessions;
                    metrics.drs /= validMetricsSessions;
                    metrics.rsc /= validMetricsSessions;
                }
            }

            return metrics;
        } catch (error) {
            logger.error('Error getting vehicle metrics', { error, vehicleId });
            throw error;
        }
    }

    /**
     * Obtiene los datos de estabilidad de una sesión
     * @param sessionId ID de la sesión
     * @returns Promise con datos procesados de estabilidad
     */
    async getSessionStability(sessionId: string) {
        try {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    stabilityMeasurements: true
                }
            });

            if (!session) {
                throw new Error('Session not found');
            }

            return this.processStabilityData(session.stabilityMeasurements);
        } catch (error) {
            logger.error('Error getting session stability', { error, sessionId });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de la sesión para el reporte
     * @param sessionId ID de la sesión
     * @returns Promise con estadísticas de la sesión
     */
    async getSessionStatistics(sessionId: string) {
        try {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    stabilityMeasurements: true,
                    eventExecutions: true
                }
            });

            if (!session) {
                throw new Error('Session not found');
            }

            const events = session.eventExecutions.length;
            const metrics = this.processStabilityData(session.stabilityMeasurements);

            return {
                id: session.id,
                vehicleId: session.vehicleId,
                date: session.startTime,
                duration: session.endTime
                    ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)
                    : 0,
                status: session.status,
                events,
                metrics,
                riskLevel: this.calculateRiskLevel(metrics),
                summary: {
                    stablePercentage: 85,
                    criticalEvents: 2,
                    recommendations: [
                        'Revisar sistema de suspensión',
                        'Verificar distribución de carga'
                    ]
                }
            };
        } catch (error) {
            logger.error('Error getting session statistics', { error, sessionId });
            throw error;
        }
    }

    /**
     * Calcula el nivel de riesgo basado en métricas
     * @param metrics Métricas de estabilidad
     * @returns Nivel de riesgo
     */
    private calculateRiskLevel(metrics: any): 'low' | 'medium' | 'high' | 'critical' {
        if (!metrics) return 'medium';

        const { ltr = 0, ssf = 0, drs = 0 } = metrics;

        if (ltr > 0.7 || ssf < 0.8 || drs < 0.5) return 'critical';
        if (ltr > 0.5 || ssf < 1.0 || drs < 0.7) return 'high';
        if (ltr > 0.3 || ssf < 1.2 || drs < 0.9) return 'medium';
        return 'low';
    }

    /**
     * Procesa los datos de estabilidad para calcular métricas
     * @param measurements Datos de estabilidad
     * @returns Métricas calculadas
     */
    private processStabilityData(measurements: StabilityMeasurement[]) {
        if (!measurements || measurements.length === 0) {
            return {
                ssf: 0,
                ltr: 0,
                drs: 0,
                rsc: 0
            };
        }

        return {
            ssf:
                measurements.reduce(
                    (sum: number, m: StabilityMeasurement) => sum + (m.roll || 0),
                    0
                ) / measurements.length,
            ltr:
                measurements.reduce(
                    (sum: number, m: StabilityMeasurement) => sum + (m.pitch || 0),
                    0
                ) / measurements.length,
            drs:
                measurements.reduce(
                    (sum: number, m: StabilityMeasurement) => sum + (m.yaw || 0),
                    0
                ) / measurements.length,
            rsc:
                measurements.reduce(
                    (sum: number, m: StabilityMeasurement) => sum + (m.accmag || 0),
                    0
                ) / measurements.length
        };
    }
}

export { SessionRepository };
