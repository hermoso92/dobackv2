/**
 * 🔍 SERVICIO DE VERIFICACIÓN DE SESIONES
 * 
 * Compara las sesiones generadas con el análisis real
 * y genera un reporte de validación
 * 
 * @version 1.0
 * @date 2025-10-11
 */

import { prisma } from '../config/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('SessionVerification');

interface SessionInfo {
    sessionId: string;
    sessionNumber: number;
    vehicleIdentifier: string;
    startTime: Date;
    endTime: Date | null;
    source: string;
    tipo: 'GPS' | 'ESTABILIDAD' | 'ROTATIVO';
    measurements: number;
}

interface CorrelatedSession {
    sessionNumber: number;
    startTime: Date;
    endTime: Date;
    estabilidad?: {
        sessionId: string;
        measurements: number;
        startTime: Date;
        endTime: Date;
    };
    gps?: {
        sessionId: string;
        measurements: number;
        startTime: Date;
        endTime: Date;
    };
    rotativo?: {
        sessionId: string;
        measurements: number;
        startTime: Date;
        endTime: Date;
    };
    hasAll3Types: boolean;
    status: 'COMPLETA' | 'PARCIAL' | 'INCOMPLETA';
    observaciones: string[];
}

export class SessionVerificationService {

    /**
     * Obtiene todas las sesiones de un vehículo y fecha
     */
    async getSessionsByVehicleAndDate(
        vehicleIdentifier: string,
        date: string // formato: YYYY-MM-DD
    ): Promise<SessionInfo[]> {
        try {
            const startOfDay = new Date(date + 'T00:00:00');
            const endOfDay = new Date(date + 'T23:59:59');

            const sessions = await prisma.session.findMany({
                where: {
                    vehicle: {
                        identifier: vehicleIdentifier
                    },
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    vehicle: {
                        select: {
                            identifier: true
                        }
                    },
                    gpsMeasurements: {
                        select: {
                            id: true
                        }
                    },
                    StabilityMeasurement: {
                        select: {
                            id: true
                        }
                    },
                    RotativoMeasurement: {
                        select: {
                            id: true
                        }
                    }
                },
                orderBy: {
                    startTime: 'asc'
                }
            });

            const sessionInfo: SessionInfo[] = [];

            for (const session of sessions) {
                // Determinar tipo basándose en qué mediciones tiene
                let tipo: 'GPS' | 'ESTABILIDAD' | 'ROTATIVO' = 'ROTATIVO';
                let measurements = session.RotativoMeasurement.length;

                if (session.gpsMeasurements.length > 0) {
                    tipo = 'GPS';
                    measurements = session.gpsMeasurements.length;
                } else if (session.StabilityMeasurement.length > 0) {
                    tipo = 'ESTABILIDAD';
                    measurements = session.StabilityMeasurement.length;
                }

                sessionInfo.push({
                    sessionId: session.id,
                    sessionNumber: session.sessionNumber,
                    vehicleIdentifier: session.vehicle.identifier,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    source: session.source,
                    tipo,
                    measurements
                });
            }

            return sessionInfo;

        } catch (error: any) {
            logger.error('Error obteniendo sesiones', { error: error.message });
            return [];
        }
    }

    /**
     * Correlaciona sesiones por rango temporal
     */
    async correlateSessions(
        vehicleIdentifier: string,
        date: string
    ): Promise<CorrelatedSession[]> {
        try {
            const startOfDay = new Date(date + 'T00:00:00');
            const endOfDay = new Date(date + 'T23:59:59');

            // Obtener todas las sesiones del día
            const sessions = await prisma.session.findMany({
                where: {
                    vehicle: {
                        identifier: vehicleIdentifier
                    },
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    vehicle: true,
                    gpsMeasurements: true,
                    StabilityMeasurement: true,
                    RotativoMeasurement: true
                },
                orderBy: {
                    startTime: 'asc'
                }
            });

            // Agrupar por rango temporal
            const correlatedSessions: CorrelatedSession[] = [];
            const TOLERANCE_MS = 120 * 1000; // 120 segundos de tolerancia

            for (const session of sessions) {
                const startTime = session.startTime;
                const endTime = session.endTime || new Date(session.startTime.getTime() + 3600000);

                // Buscar sesión correlacionada existente
                let correlated = correlatedSessions.find(cs => {
                    const timeDiff = Math.abs(cs.startTime.getTime() - startTime.getTime());
                    return timeDiff <= TOLERANCE_MS;
                });

                if (!correlated) {
                    // Crear nueva sesión correlacionada
                    correlated = {
                        sessionNumber: correlatedSessions.length + 1,
                        startTime,
                        endTime,
                        hasAll3Types: false,
                        status: 'INCOMPLETA',
                        observaciones: []
                    };
                    correlatedSessions.push(correlated);
                }

                // Añadir datos según tipo
                const hasGPS = session.gpsMeasurements.length > 0;
                const hasEstabilidad = session.StabilityMeasurement.length > 0;
                const hasRotativo = session.RotativoMeasurement.length > 0;

                if (hasGPS) {
                    correlated.gps = {
                        sessionId: session.id,
                        measurements: session.gpsMeasurements.length,
                        startTime: session.startTime,
                        endTime: endTime
                    };
                }

                if (hasEstabilidad) {
                    correlated.estabilidad = {
                        sessionId: session.id,
                        measurements: session.StabilityMeasurement.length,
                        startTime: session.startTime,
                        endTime: endTime
                    };
                }

                if (hasRotativo) {
                    correlated.rotativo = {
                        sessionId: session.id,
                        measurements: session.RotativoMeasurement.length,
                        startTime: session.startTime,
                        endTime: endTime
                    };
                }

                // Actualizar rangos temporales
                if (endTime > correlated.endTime) {
                    correlated.endTime = endTime;
                }

                // Determinar estado
                correlated.hasAll3Types = !!(correlated.gps && correlated.estabilidad && correlated.rotativo);

                if (correlated.hasAll3Types) {
                    correlated.status = 'COMPLETA';
                } else if ((correlated.estabilidad && correlated.rotativo) ||
                    (correlated.gps && correlated.rotativo)) {
                    correlated.status = 'PARCIAL';
                    if (!correlated.gps) {
                        correlated.observaciones.push('sin GPS');
                    }
                } else {
                    correlated.status = 'INCOMPLETA';
                }
            }

            return correlatedSessions;

        } catch (error: any) {
            logger.error('Error correlacionando sesiones', { error: error.message });
            return [];
        }
    }

    /**
     * Genera reporte de verificación para un vehículo y fecha
     */
    async generateVerificationReport(
        vehicleIdentifier: string,
        date: string
    ): Promise<string> {
        const correlatedSessions = await this.correlateSessions(vehicleIdentifier, date);

        let report = `# 📊 REPORTE DE VERIFICACIÓN\n\n`;
        report += `**Vehículo:** ${vehicleIdentifier}\n`;
        report += `**Fecha:** ${date}\n`;
        report += `**Total sesiones correlacionadas:** ${correlatedSessions.length}\n\n`;
        report += `---\n\n`;

        for (const session of correlatedSessions) {
            report += `## Sesión ${session.sessionNumber}\n\n`;
            report += `**Inicio:** ${session.startTime.toLocaleTimeString('es-ES')}\n`;
            report += `**Fin:** ${session.endTime.toLocaleTimeString('es-ES')}\n`;
            report += `**Duración:** ${this.formatDuration(session.endTime.getTime() - session.startTime.getTime())}\n`;
            report += `**Estado:** ${session.status === 'COMPLETA' ? '✅' : session.status === 'PARCIAL' ? '⚠️' : '❌'} ${session.status}\n\n`;

            if (session.estabilidad) {
                report += `- ✅ **ESTABILIDAD:** ${session.estabilidad.measurements} mediciones\n`;
            } else {
                report += `- ❌ **ESTABILIDAD:** _sin registro_\n`;
            }

            if (session.gps) {
                report += `- ✅ **GPS:** ${session.gps.measurements} mediciones\n`;
            } else {
                report += `- ❌ **GPS:** _sin registro_\n`;
            }

            if (session.rotativo) {
                report += `- ✅ **ROTATIVO:** ${session.rotativo.measurements} mediciones\n`;
            } else {
                report += `- ❌ **ROTATIVO:** _sin registro_\n`;
            }

            if (session.observaciones.length > 0) {
                report += `\n**Observaciones:** ${session.observaciones.join(', ')}\n`;
            }

            report += `\n---\n\n`;
        }

        return report;
    }

    private formatDuration(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours} h ${minutes} m ${seconds} s`;
        } else if (minutes > 0) {
            return `${minutes} m ${seconds} s`;
        } else {
            return `${seconds} s`;
        }
    }
}

export const sessionVerificationService = new SessionVerificationService();

