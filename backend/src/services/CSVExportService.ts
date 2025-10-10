import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface CSVExportOptions {
    organizationId: string;
    vehicleIds?: string[];
    startDate?: Date;
    endDate?: Date;
    includeGPS?: boolean;
    includeCAN?: boolean;
    includeStability?: boolean;
    includeRotativo?: boolean;
    includeEvents?: boolean;
}

export class CSVExportService {
    /**
     * Exporta datos de telemetría a CSV
     */
    static async exportTelemetryCSV(options: CSVExportOptions): Promise<string> {
        try {
            logger.info('Exportando datos de telemetría a CSV', { options });

            const { organizationId, vehicleIds, startDate, endDate, includeGPS, includeCAN, includeStability, includeRotativo } = options;

            // Obtener sesiones
            const sessions = await prisma.session.findMany({
                where: {
                    organizationId,
                    vehicleId: vehicleIds ? { in: vehicleIds } : undefined,
                    startTime: startDate ? { gte: startDate } : undefined,
                    endTime: endDate ? { lte: endDate } : undefined
                },
                include: {
                    vehicle: true,
                    gpsMeasurements: includeGPS ? {
                        select: {
                            timestamp: true,
                            latitude: true,
                            longitude: true,
                            speed: true,
                            heading: true,
                            altitude: true
                        }
                    } : false,
                    canMeasurements: includeCAN ? {
                        select: {
                            timestamp: true,
                            engineRPM: true,
                            vehicleSpeed: true,
                            throttlePosition: true,
                            brakePedal: true,
                            steeringAngle: true
                        }
                    } : false,
                    stabilityMeasurements: includeStability ? {
                        select: {
                            timestamp: true,
                            lateralAcceleration: true,
                            longitudinalAcceleration: true,
                            verticalAcceleration: true,
                            rollAngle: true,
                            pitchAngle: true,
                            yawRate: true,
                            isLTRCritical: true,
                            isDRSHigh: true,
                            isLateralGForceHigh: true
                        }
                    } : false,
                    rotativoMeasurements: includeRotativo ? {
                        select: {
                            timestamp: true,
                            estado: true,
                            velocidad: true
                        }
                    } : false,
                    stability_events: includeEvents ? {
                        select: {
                            timestamp: true,
                            type: true,
                            lat: true,
                            lon: true,
                            details: true
                        }
                    } : false
                }
            });

            // Generar CSV
            let csvContent = '';

            // Encabezados principales
            csvContent += 'Sesion_ID,Vehiculo_ID,Vehiculo_Nombre,Inicio_Sesion,Fin_Sesion,Duracion_Segundos,Distancia_KM,Estado\n';

            // Datos de sesiones
            sessions.forEach(session => {
                const startTime = session.startTime.toISOString();
                const endTime = session.endTime ? session.endTime.toISOString() : '';
                const duration = session.endTime ?
                    Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000) : 0;
                const distance = session.distance || 0;

                csvContent += `"${session.id}","${session.vehicleId}","${session.vehicle?.name || ''}","${startTime}","${endTime}",${duration},${distance},"${session.status}"\n`;
            });

            // Separador para mediciones
            csvContent += '\n\n=== MEDICIONES GPS ===\n';
            if (includeGPS) {
                csvContent += 'Sesion_ID,Timestamp,Latitud,Longitud,Velocidad,Heading,Altitud\n';
                sessions.forEach(session => {
                    session.gpsMeasurements?.forEach(measurement => {
                        csvContent += `"${session.id}","${measurement.timestamp.toISOString()}",${measurement.latitude},${measurement.longitude},${measurement.speed || 0},${measurement.heading || 0},${measurement.altitude || 0}\n`;
                    });
                });
            }

            // Mediciones CAN
            if (includeCAN) {
                csvContent += '\n\n=== MEDICIONES CAN ===\n';
                csvContent += 'Sesion_ID,Timestamp,RPM,Motor_Velocidad,Posicion_Acelerador,Pedal_Freno,Angulo_Volante\n';
                sessions.forEach(session => {
                    session.canMeasurements?.forEach(measurement => {
                        csvContent += `"${session.id}","${measurement.timestamp.toISOString()}",${measurement.engineRPM || 0},${measurement.vehicleSpeed || 0},${measurement.throttlePosition || 0},${measurement.brakePedal || 0},${measurement.steeringAngle || 0}\n`;
                    });
                });
            }

            // Mediciones de estabilidad
            if (includeStability) {
                csvContent += '\n\n=== MEDICIONES ESTABILIDAD ===\n';
                csvContent += 'Sesion_ID,Timestamp,Aceleracion_Lateral,Aceleracion_Longitudinal,Aceleracion_Vertical,Angulo_Roll,Angulo_Pitch,Yaw_Rate,LTR_Critico,DRS_Alto,Fuerza_G_Lateral\n';
                sessions.forEach(session => {
                    session.stabilityMeasurements?.forEach(measurement => {
                        csvContent += `"${session.id}","${measurement.timestamp.toISOString()}",${measurement.lateralAcceleration || 0},${measurement.longitudinalAcceleration || 0},${measurement.verticalAcceleration || 0},${measurement.rollAngle || 0},${measurement.pitchAngle || 0},${measurement.yawRate || 0},${measurement.isLTRCritical ? 1 : 0},${measurement.isDRSHigh ? 1 : 0},${measurement.isLateralGForceHigh ? 1 : 0}\n`;
                    });
                });
            }

            // Mediciones de rotativo
            if (includeRotativo) {
                csvContent += '\n\n=== MEDICIONES ROTATIVO ===\n';
                csvContent += 'Sesion_ID,Timestamp,Estado,Velocidad\n';
                sessions.forEach(session => {
                    session.rotativoMeasurements?.forEach(measurement => {
                        csvContent += `"${session.id}","${measurement.timestamp.toISOString()}","${measurement.estado}",${measurement.velocidad || 0}\n`;
                    });
                });
            }

            // Eventos de estabilidad
            if (includeEvents) {
                csvContent += '\n\n=== EVENTOS ESTABILIDAD ===\n';
                csvContent += 'Sesion_ID,Timestamp,Tipo,Latitud,Longitud,Detalles\n';
                sessions.forEach(session => {
                    session.stability_events?.forEach(event => {
                        const details = typeof event.details === 'object' ?
                            JSON.stringify(event.details) :
                            (event.details || '');
                        csvContent += `"${session.id}","${event.timestamp.toISOString()}","${event.type}",${event.lat},${event.lon},"${details}"\n`;
                    });
                });
            }

            logger.info('CSV de telemetría generado exitosamente', {
                sessionsCount: sessions.length,
                csvLength: csvContent.length
            });

            return csvContent;

        } catch (error) {
            logger.error('Error exportando telemetría a CSV', { error, options });
            throw error;
        }
    }

    /**
     * Exporta datos de una sesión específica a CSV
     */
    static async exportSessionCSV(sessionId: string, options: Partial<CSVExportOptions> = {}): Promise<string> {
        try {
            logger.info('Exportando sesión específica a CSV', { sessionId, options });

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    vehicle: true,
                    gpsMeasurements: {
                        select: {
                            timestamp: true,
                            latitude: true,
                            longitude: true,
                            speed: true,
                            heading: true,
                            altitude: true
                        }
                    },
                    canMeasurements: {
                        select: {
                            timestamp: true,
                            engineRPM: true,
                            vehicleSpeed: true,
                            throttlePosition: true,
                            brakePedal: true,
                            steeringAngle: true
                        }
                    },
                    stabilityMeasurements: {
                        select: {
                            timestamp: true,
                            lateralAcceleration: true,
                            longitudinalAcceleration: true,
                            verticalAcceleration: true,
                            rollAngle: true,
                            pitchAngle: true,
                            yawRate: true,
                            isLTRCritical: true,
                            isDRSHigh: true,
                            isLateralGForceHigh: true
                        }
                    },
                    rotativoMeasurements: {
                        select: {
                            timestamp: true,
                            estado: true,
                            velocidad: true
                        }
                    },
                    stability_events: {
                        select: {
                            timestamp: true,
                            type: true,
                            lat: true,
                            lon: true,
                            details: true
                        }
                    }
                }
            });

            if (!session) {
                throw new Error('Sesión no encontrada');
            }

            let csvContent = '';

            // Información de la sesión
            csvContent += '=== INFORMACION DE SESION ===\n';
            csvContent += `ID,${session.id}\n`;
            csvContent += `Vehiculo,${session.vehicle?.name || session.vehicleId}\n`;
            csvContent += `Inicio,${session.startTime.toISOString()}\n`;
            csvContent += `Fin,${session.endTime ? session.endTime.toISOString() : 'En curso'}\n`;
            csvContent += `Estado,${session.status}\n`;
            csvContent += `Tipo,${session.type}\n`;
            csvContent += `Origen,${session.source}\n\n`;

            // Mediciones GPS
            if (session.gpsMeasurements && session.gpsMeasurements.length > 0) {
                csvContent += '=== MEDICIONES GPS ===\n';
                csvContent += 'Timestamp,Latitud,Longitud,Velocidad,Heading,Altitud\n';
                session.gpsMeasurements.forEach(measurement => {
                    csvContent += `${measurement.timestamp.toISOString()},${measurement.latitude},${measurement.longitude},${measurement.speed || 0},${measurement.heading || 0},${measurement.altitude || 0}\n`;
                });
                csvContent += '\n';
            }

            // Mediciones CAN
            if (session.canMeasurements && session.canMeasurements.length > 0) {
                csvContent += '=== MEDICIONES CAN ===\n';
                csvContent += 'Timestamp,RPM,Motor_Velocidad,Posicion_Acelerador,Pedal_Freno,Angulo_Volante\n';
                session.canMeasurements.forEach(measurement => {
                    csvContent += `${measurement.timestamp.toISOString()},${measurement.engineRPM || 0},${measurement.vehicleSpeed || 0},${measurement.throttlePosition || 0},${measurement.brakePedal || 0},${measurement.steeringAngle || 0}\n`;
                });
                csvContent += '\n';
            }

            // Mediciones de estabilidad
            if (session.stabilityMeasurements && session.stabilityMeasurements.length > 0) {
                csvContent += '=== MEDICIONES ESTABILIDAD ===\n';
                csvContent += 'Timestamp,Aceleracion_Lateral,Aceleracion_Longitudinal,Aceleracion_Vertical,Angulo_Roll,Angulo_Pitch,Yaw_Rate,LTR_Critico,DRS_Alto,Fuerza_G_Lateral\n';
                session.stabilityMeasurements.forEach(measurement => {
                    csvContent += `${measurement.timestamp.toISOString()},${measurement.lateralAcceleration || 0},${measurement.longitudinalAcceleration || 0},${measurement.verticalAcceleration || 0},${measurement.rollAngle || 0},${measurement.pitchAngle || 0},${measurement.yawRate || 0},${measurement.isLTRCritical ? 1 : 0},${measurement.isDRSHigh ? 1 : 0},${measurement.isLateralGForceHigh ? 1 : 0}\n`;
                });
                csvContent += '\n';
            }

            // Mediciones de rotativo
            if (session.rotativoMeasurements && session.rotativoMeasurements.length > 0) {
                csvContent += '=== MEDICIONES ROTATIVO ===\n';
                csvContent += 'Timestamp,Estado,Velocidad\n';
                session.rotativoMeasurements.forEach(measurement => {
                    csvContent += `${measurement.timestamp.toISOString()},${measurement.estado},${measurement.velocidad || 0}\n`;
                });
                csvContent += '\n';
            }

            // Eventos de estabilidad
            if (session.stability_events && session.stability_events.length > 0) {
                csvContent += '=== EVENTOS ESTABILIDAD ===\n';
                csvContent += 'Timestamp,Tipo,Latitud,Longitud,Detalles\n';
                session.stability_events.forEach(event => {
                    const details = typeof event.details === 'object' ?
                        JSON.stringify(event.details) :
                        (event.details || '');
                    csvContent += `${event.timestamp.toISOString()},${event.type},${event.lat},${event.lon},"${details}"\n`;
                });
            }

            logger.info('CSV de sesión generado exitosamente', {
                sessionId,
                csvLength: csvContent.length
            });

            return csvContent;

        } catch (error) {
            logger.error('Error exportando sesión a CSV', { error, sessionId });
            throw error;
        }
    }

    /**
     * Exporta datos de eventos a CSV
     */
    static async exportEventsCSV(options: CSVExportOptions): Promise<string> {
        try {
            logger.info('Exportando eventos a CSV', { options });

            const { organizationId, vehicleIds, startDate, endDate } = options;

            const events = await prisma.stabilityEvent.findMany({
                where: {
                    Session: {
                        organizationId,
                        vehicleId: vehicleIds ? { in: vehicleIds } : undefined
                    },
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    Session: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            let csvContent = '';

            // Encabezados
            csvContent += 'Evento_ID,Sesion_ID,Vehiculo_ID,Vehiculo_Nombre,Timestamp,Tipo,Latitud,Longitud,Detalles\n';

            // Datos de eventos
            events.forEach(event => {
                const details = typeof event.details === 'object' ?
                    JSON.stringify(event.details) :
                    (event.details || '');

                csvContent += `"${event.id}","${event.session_id}","${event.Session?.vehicleId || ''}","${event.Session?.vehicle?.name || ''}","${event.timestamp.toISOString()}","${event.type}",${event.lat},${event.lon},"${details}"\n`;
            });

            logger.info('CSV de eventos generado exitosamente', {
                eventsCount: events.length,
                csvLength: csvContent.length
            });

            return csvContent;

        } catch (error) {
            logger.error('Error exportando eventos a CSV', { error, options });
            throw error;
        }
    }
}
