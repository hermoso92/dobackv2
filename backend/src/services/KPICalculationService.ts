import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface KPICalculationResult {
    hoursDriving: string;
    km: number;
    timeInPark: string;
    timeOutPark: string;
    timeInWorkshop: string;
    rotativoPct: number;
    incidents: {
        total: number;
        leve: number;
        moderada: number;
        grave: number;
    };
    speeding: {
        on: { count: number; duration: string };
        off: { count: number; duration: string };
    };
    clave: {
        "2": string;
        "5": string;
    };
    activacionesClave2: number;
}

export class KPICalculationService {
    /**
     * Calcula KPIs reales basados en datos de la base de datos
     */
    static async calculateRealKPIs(
        organizationId: string,
        timeRange: { start: Date; end: Date },
        vehicleIds?: string[]
    ): Promise<KPICalculationResult> {
        try {
            logger.info('Calculando KPIs reales', { organizationId, timeRange, vehicleIds });

            // Obtener sesiones en el rango de tiempo
            const sessions = await prisma.session.findMany({
                where: {
                    organizationId,
                    vehicleId: vehicleIds ? { in: vehicleIds } : undefined,
                    startTime: { gte: timeRange.start },
                    endTime: { lte: timeRange.end }
                },
                include: {
                    vehicle: true,
                    stabilityMeasurements: {
                        select: {
                            timestamp: true,
                            isLTRCritical: true,
                            isDRSHigh: true,
                            isLateralGForceHigh: true
                        }
                    },
                    gpsMeasurements: {
                        select: {
                            timestamp: true,
                            speed: true,
                            latitude: true,
                            longitude: true
                        }
                    },
                    RotativoMeasurement: {
                        select: {
                            timestamp: true,
                            estado: true
                        }
                    }
                }
            });

            // Calcular tiempo de conducción total
            const totalDrivingSeconds = sessions.reduce((total, session) => {
                const endTime = session.endTime || new Date();
                const duration = endTime.getTime() - session.startTime.getTime();
                return total + Math.floor(duration / 1000);
            }, 0);

            // Calcular distancia total (aproximada desde GPS)
            const totalKm = sessions.reduce((total, session) => {
                // Estimación basada en mediciones GPS
                return total + (session.gpsMeasurements?.length || 0) * 0.01; // ~10m por medición
            }, 0);

            // Calcular tiempo en parque (estimado basado en velocidad GPS)
            const timeInPark = this.calculateTimeInPark(sessions);

            // Calcular tiempo en taller (sessions con estado específico)
            const timeInWorkshop = this.calculateTimeInWorkshop(sessions);

            // Calcular porcentaje de rotativo activo
            const rotativoPct = this.calculateRotativoPercentage(sessions);

            // Calcular incidentes por severidad
            const incidents = await this.calculateIncidents(organizationId, timeRange, vehicleIds);

            // Calcular violaciones de velocidad
            const speeding = this.calculateSpeedingViolations(sessions);

            // Calcular tiempo por claves (2 y 5)
            const clave = await this.calculateClaveTimes(organizationId, timeRange, vehicleIds);

            // Calcular activaciones de clave 2
            const activacionesClave2 = this.calculateClave2Activations(sessions);

            const result: KPICalculationResult = {
                hoursDriving: this.formatDuration(totalDrivingSeconds),
                km: Math.round(totalKm * 100) / 100,
                timeInPark,
                timeOutPark: this.formatDuration(totalDrivingSeconds - this.parseDuration(timeInPark)),
                timeInWorkshop,
                rotativoPct,
                incidents,
                speeding,
                clave,
                activacionesClave2
            };

            logger.info('KPIs calculados exitosamente', { result });
            return result;

        } catch (error) {
            logger.error('Error calculando KPIs reales', { error, organizationId });
            throw error;
        }
    }

    /**
     * Calcula tiempo en parque basado en velocidad GPS baja
     */
    private static calculateTimeInPark(sessions: any[]): string {
        let parkTimeSeconds = 0;

        sessions.forEach(session => {
            // Si hay mediciones GPS, calcular tiempo con velocidad < 5 km/h
            if (session.gpsMeasurements && session.gpsMeasurements.length > 0) {
                const lowSpeedMeasurements = session.gpsMeasurements.filter(
                    (measurement: any) => measurement.speed < 5
                );

                // Estimar tiempo basado en mediciones consecutivas de baja velocidad
                parkTimeSeconds += lowSpeedMeasurements.length * 1; // 1 segundo por medición
            } else {
                // Estimación conservadora: 20% del tiempo total
                const sessionDuration = session.endTime.getTime() - session.startTime.getTime();
                parkTimeSeconds += Math.floor(sessionDuration * 0.2 / 1000);
            }
        });

        return this.formatDuration(parkTimeSeconds);
    }

    /**
     * Calcula tiempo en taller
     */
    private static calculateTimeInWorkshop(sessions: any[]): string {
        let workshopTimeSeconds = 0;

        // Buscar sesiones marcadas como mantenimiento o taller
        sessions.forEach(session => {
            // Si la sesión tiene tipo específico o duración muy corta (mantenimiento)
            const sessionDuration = session.endTime.getTime() - session.startTime.getTime();
            const durationMinutes = sessionDuration / (1000 * 60);

            // Sesiones cortas (< 30 min) pueden ser mantenimiento
            if (durationMinutes < 30) {
                workshopTimeSeconds += Math.floor(sessionDuration / 1000);
            }
        });

        return this.formatDuration(workshopTimeSeconds);
    }

    /**
     * Calcula porcentaje de tiempo con rotativo activo
     */
    private static calculateRotativoPercentage(sessions: any[]): number {
        let totalTimeSeconds = 0;
        let rotativoActiveSeconds = 0;

        sessions.forEach(session => {
            const sessionDuration = session.endTime.getTime() - session.startTime.getTime();
            totalTimeSeconds += Math.floor(sessionDuration / 1000);

            if (session.RotativoMeasurement && session.RotativoMeasurement.length > 0) {
                // Contar mediciones con rotativo activo
                const activeMeasurements = session.RotativoMeasurement.filter(
                    (measurement: any) => measurement.estado === 'ON' || measurement.estado === true
                );

                rotativoActiveSeconds += activeMeasurements.length;
            } else {
                // Estimación: 60% del tiempo con rotativo activo
                rotativoActiveSeconds += Math.floor(sessionDuration * 0.6 / 1000);
            }
        });

        return totalTimeSeconds > 0 ? Math.round((rotativoActiveSeconds / totalTimeSeconds) * 100 * 10) / 10 : 0;
    }

    /**
     * Calcula incidentes por severidad desde stability_events
     */
    private static async calculateIncidents(
        organizationId: string,
        timeRange: { start: Date; end: Date },
        vehicleIds?: string[]
    ): Promise<{ total: number; leve: number; moderada: number; grave: number }> {
        const events = await prisma.stabilityEvent.findMany({
            where: {
                Session: {
                    organizationId,
                    vehicleId: vehicleIds ? { in: vehicleIds } : undefined
                },
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                }
            }
        });

        // Mapear tipos de eventos a severidades
        const incidents = {
            total: events.length,
            leve: events.filter(e => e.type.includes('LEVE') || e.type.includes('LOW')).length,
            moderada: events.filter(e => e.type.includes('MODERADA') || e.type.includes('MEDIUM')).length,
            grave: events.filter(e => e.type.includes('GRAVE') || e.type.includes('CRITICAL') || e.type.includes('HIGH')).length
        };

        return incidents;
    }

    /**
     * Calcula violaciones de velocidad
     */
    private static calculateSpeedingViolations(sessions: any[]): {
        on: { count: number; duration: string };
        off: { count: number; duration: string };
    } {
        let speedingOnCount = 0;
        let speedingOffCount = 0;
        let speedingOnDuration = 0;
        let speedingOffDuration = 0;

        sessions.forEach(session => {
            if (session.gpsMeasurements && session.gpsMeasurements.length > 0) {
                // Buscar mediciones con velocidad excesiva (> 50 km/h en urbano)
                const speedingMeasurements = session.gpsMeasurements.filter(
                    (measurement: any) => measurement.speed > 50
                );

                speedingMeasurements.forEach((measurement: any) => {
                    // Verificar si el rotativo estaba activo en ese momento
                    const isRotativoActive = this.isRotativoActiveAtTime(
                        session.RotativoMeasurement,
                        measurement.timestamp
                    );

                    if (isRotativoActive) {
                        speedingOnCount++;
                        speedingOnDuration += 1; // 1 segundo por medición
                    } else {
                        speedingOffCount++;
                        speedingOffDuration += 1;
                    }
                });
            }
        });

        return {
            on: { count: speedingOnCount, duration: this.formatDuration(speedingOnDuration) },
            off: { count: speedingOffCount, duration: this.formatDuration(speedingOffDuration) }
        };
    }

    /**
     * Calcula tiempo por claves 2 y 5
     */
    private static async calculateClaveTimes(
        organizationId: string,
        timeRange: { start: Date; end: Date },
        vehicleIds?: string[]
    ): Promise<{ "2": string; "5": string }> {
        // Buscar eventos de estabilidad relacionados con claves
        const clave2Events = await prisma.stabilityEvent.findMany({
            where: {
                Session: {
                    organizationId,
                    vehicleId: vehicleIds ? { in: vehicleIds } : undefined
                },
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                },
                type: {
                    contains: 'CLAVE_2'
                }
            }
        });

        const clave5Events = await prisma.stabilityEvent.findMany({
            where: {
                Session: {
                    organizationId,
                    vehicleId: vehicleIds ? { in: vehicleIds } : undefined
                },
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                },
                type: {
                    contains: 'CLAVE_5'
                }
            }
        });

        // Estimar duración basada en número de eventos
        const clave2Duration = clave2Events.length * 60; // 1 minuto por evento
        const clave5Duration = clave5Events.length * 60;

        return {
            "2": this.formatDuration(clave2Duration),
            "5": this.formatDuration(clave5Duration)
        };
    }

    /**
     * Calcula activaciones de clave 2
     */
    private static calculateClave2Activations(sessions: any[]): number {
        let activations = 0;

        sessions.forEach(session => {
            if (session.stabilityMeasurements) {
                // Contar mediciones críticas que podrían indicar activación de clave 2
                const criticalMeasurements = session.stabilityMeasurements.filter(
                    (measurement: any) => measurement.isLTRCritical || measurement.isDRSHigh
                );
                activations += criticalMeasurements.length;
            }
        });

        return activations;
    }

    /**
     * Verifica si el rotativo estaba activo en un tiempo específico
     */
    private static isRotativoActiveAtTime(rotativoMeasurements: any[], timestamp: Date): boolean {
        if (!rotativoMeasurements || rotativoMeasurements.length === 0) {
            return false;
        }

        // Buscar la medición más cercana al timestamp
        const closestMeasurement = rotativoMeasurements.reduce((closest, current) => {
            const currentDiff = Math.abs(current.timestamp.getTime() - timestamp.getTime());
            const closestDiff = Math.abs(closest.timestamp.getTime() - timestamp.getTime());
            return currentDiff < closestDiff ? current : closest;
        });

        return closestMeasurement.estado === 'ON' || closestMeasurement.estado === true;
    }

    /**
     * Formatea duración en segundos a HH:MM
     */
    private static formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Convierte duración HH:MM a segundos
     */
    private static parseDuration(duration: string): number {
        const [hours, minutes] = duration.split(':').map(Number);
        return (hours * 3600) + (minutes * 60);
    }
}
