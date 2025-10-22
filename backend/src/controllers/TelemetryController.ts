
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { readFile } from 'fs/promises';
import { OverspeedProcessorService } from '../services/OverspeedProcessorService';
import { StabilityAnalysisService } from '../services/StabilityAnalysisService';
import { CANFrame, GPSPoint, parseCANFile, parseGPSFile } from '../utils/fileParser';
import { logger } from '../utils/logger';



// Instancia mínima del servicio de estabilidad para reutilizar su parser.
// Se pasan objetos vacíos porque solo usaremos parseStabilityFile, el cual no
// depende de los servicios inyectados.
const stabilityService = new StabilityAnalysisService({} as any, {} as any, {} as any);

// Instancia del procesador de eventos de velocidad
const overspeedProcessor = new OverspeedProcessorService(prisma);

export class TelemetryController {
    async uploadTelemetryFiles(req: Request, res: Response) {
        try {
            logger.info('Iniciando subida de archivos de telemetría');
            logger.info('Request body:', req.body);
            logger.info('Request files:', req.files);

            if (
                !req.files ||
                !('gpsFile' in req.files) ||
                !('canFile' in req.files) ||
                !('stabilityFile' in req.files)
            ) {
                logger.error('Archivos no encontrados en la solicitud');
                return res.status(400).json({
                    success: false,
                    error: 'Se requieren archivos GPS, CAN y Estabilidad'
                });
            }

            const gpsFile = req.files['gpsFile'][0];
            const canFile = req.files['canFile'][0];
            const stabilityFile = req.files['stabilityFile'][0];
            const vehicleId = req.body.vehicleId;

            logger.info(
                `Archivos recibidos: GPS=${gpsFile.originalname}, CAN=${canFile.originalname}, STAB=${stabilityFile.originalname}, VehicleId=${vehicleId}`
            );
            logger.info(
                `Rutas de archivos: GPS=${gpsFile.path}, CAN=${canFile.path}, STAB=${stabilityFile.path}`
            );

            if (!vehicleId) {
                logger.error('ID de vehículo no proporcionado');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere el ID del vehículo'
                });
            }

            // Verificar que el vehículo existe y pertenece a la organización del usuario
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.error('Usuario sin organizationId intenta subir telemetría');
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere organizationId'
                });
            }

            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: organizationId
                }
            });

            if (!vehicle) {
                logger.error(
                    `Vehículo no encontrado o no autorizado: ${vehicleId} para organización ${organizationId}`
                );
                return res.status(404).json({
                    success: false,
                    error: 'Vehículo no encontrado'
                });
            }

            // Parsear archivos
            logger.info('Iniciando parseo de archivos');
            const gpsData = await parseGPSFile(gpsFile.path);
            const canData = await parseCANFile(canFile.path);

            const stabilityContent = await readFile(stabilityFile.path, 'utf-8');
            const stabilityData = stabilityService.parseStabilityFile(stabilityContent);

            logger.info(
                `Archivos parseados: ${gpsData.length} puntos GPS, ${canData.length} frames CAN, ${stabilityData.length} mediciones de estabilidad`
            );

            // Verificar que tenemos datos válidos
            if (gpsData.length === 0) {
                logger.error('No se encontraron datos GPS válidos');
                return res.status(400).json({
                    success: false,
                    error: 'No se encontraron datos GPS válidos'
                });
            }

            if (stabilityData.length === 0) {
                logger.error('No se encontraron datos de Estabilidad válidos');
                return res.status(400).json({
                    success: false,
                    error: 'No se encontraron datos de Estabilidad válidos'
                });
            }

            // Obtener timestamps globales usando los tres conjuntos
            const firstTimes = [
                gpsData[0]?.timestamp,
                canData[0]?.timestamp,
                stabilityData[0]?.timestamp
            ].filter(Boolean) as Date[];
            const lastTimes = [
                gpsData[gpsData.length - 1]?.timestamp,
                canData[canData.length - 1]?.timestamp,
                stabilityData[stabilityData.length - 1]?.timestamp
            ].filter(Boolean) as Date[];

            const startTimestamp = new Date(Math.min(...firstTimes.map((t) => t.getTime())));
            const endTimestamp = new Date(Math.max(...lastTimes.map((t) => t.getTime())));

            logger.info(`Timestamps: start=${startTimestamp}, end=${endTimestamp}`);

            // Crear nueva sesión
            logger.info('Creando nueva sesión');

            if (!req.user || !req.user.id) {
                logger.error('Usuario no autenticado');
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
            }

            // Obtener el último número de sesión para este vehículo
            const lastSession = await prisma.session.findFirst({
                where: { vehicleId },
                orderBy: { sessionNumber: 'desc' }
            });

            const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

            // Validar que el usuario tiene organizationId
            if (!req.user.organizationId) {
                logger.error('Usuario sin organizationId al crear sesión');
                return res.status(400).json({
                    success: false,
                    error: 'Usuario sin organización válida'
                });
            }

            const session = await prisma.session.create({
                data: {
                    vehicleId,
                    userId: req.user.id,
                    organizationId: req.user.organizationId,
                    startTime: startTimestamp,
                    endTime: endTimestamp,
                    sessionNumber,
                    sequence: 1,
                    type: 'ROUTINE',
                    status: 'COMPLETED'
                }
            });

            // Guardar datos GPS en GpsMeasurement
            logger.info('Guardando datos GPS');
            await prisma.gpsMeasurement.createMany({
                data: gpsData.map((point: GPSPoint) => ({
                    sessionId: session.id,
                    timestamp: new Date(point.timestamp),
                    latitude: point.latitude,
                    longitude: point.longitude,
                    altitude: point.altitude,
                    speed: point.speed,
                    satellites: point.satellites,
                    heading: point.heading,
                    accuracy: point.accuracy
                }))
            });

            // Guardar datos CAN en CanMeasurement
            logger.info('Guardando datos CAN');
            await prisma.canMeasurement.createMany({
                data: canData.map((frame: CANFrame) => ({
                    sessionId: session.id,
                    timestamp: new Date(frame.timestamp),
                    engineRpm: frame.engineRPM,
                    vehicleSpeed: frame.vehicleSpeed,
                    throttlePosition: frame.throttlePosition,
                    brakePressure: frame.brakePressure,
                    steeringAngle: frame.steeringAngle,
                    temperature: frame.engineTemperature,
                    gearPosition: frame.gearPosition,
                    absActive: frame.absActive,
                    espActive: frame.espActive,
                    fuelSystemStatus: frame.fuelLevel
                }))
            });

            // Guardar datos de Estabilidad
            logger.info('Guardando datos de Estabilidad');

            const validStabilityData = stabilityData
                .filter((m) => {
                    // Validar que todos los campos requeridos estén presentes
                    const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                    const hasAllFields = requiredFields.every(
                        (field) => (m as any)[field] !== undefined && (m as any)[field] !== null
                    );

                    if (!hasAllFields) {
                        logger.warn(
                            `⚠️ Datos de estabilidad incompletos en Telemetry, omitiendo: ${JSON.stringify(
                                m
                            )}`
                        );
                        return false;
                    }

                    return true;
                })
                .map((m) => ({
                    sessionId: session.id,
                    timestamp: new Date(m.timestamp),
                    ax: Number(m.ax),
                    ay: Number(m.ay),
                    az: Number(m.az),
                    gx: Number(m.gx),
                    gy: Number(m.gy),
                    gz: Number(m.gz),
                    roll: m.roll ? Number(m.roll) : null,
                    pitch: m.pitch ? Number(m.pitch) : null,
                    yaw: m.yaw ? Number(m.yaw) : null,
                    usciclo1: m.usciclo1 ? Number(m.usciclo1) : 0,
                    usciclo2: m.usciclo2 ? Number(m.usciclo2) : 0,
                    usciclo3: m.usciclo3 ? Number(m.usciclo3) : 0,
                    usciclo4: m.usciclo4 ? Number(m.usciclo4) : 0,
                    usciclo5: m.usciclo5 ? Number(m.usciclo5) : 0,
                    si: m.si ? Number(m.si) : 0,
                    accmag: m.accmag ? Number(m.accmag) : 0,
                    microsds: m.microsds ? Number(m.microsds) : 0,
                    timeantwifi: m.timeantwifi ? Number(m.timeantwifi) : 0
                }));

            if (validStabilityData.length > 0) {
                await prisma.stabilityMeasurement.createMany({
                    data: validStabilityData
                });
                logger.info(
                    `Guardados ${validStabilityData.length} registros de estabilidad (filtrados de ${stabilityData.length} total)`
                );
            } else {
                logger.warn('No hay datos de estabilidad válidos para guardar');
            }

            logger.info('Archivos procesados correctamente');

            // Procesar eventos de velocidad automáticamente
            try {
                logger.info('Iniciando procesamiento de eventos de velocidad');
                const overspeedEvents = await overspeedProcessor.processSession(session.id);
                logger.info(
                    `Procesamiento de velocidad completado: ${overspeedEvents} eventos generados`
                );
            } catch (overspeedError) {
                logger.error('Error procesando eventos de velocidad (no crítico):', overspeedError);
                // No fallar la subida completa por un error en el procesamiento de velocidad
            }

            // Nota: Los eventos de estabilidad se procesan manualmente desde el dashboard
            // usando el endpoint POST /api/stability/events/process-session/:sessionId
            logger.info(
                'Sesión creada. Los eventos de estabilidad se pueden procesar desde el dashboard.'
            );

            return res.status(200).json({
                success: true,
                data: {
                    sessionId: session.id,
                    message: 'Archivos procesados correctamente'
                }
            });
        } catch (error) {
            logger.error('Error al procesar archivos de telemetría:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al procesar los archivos'
            });
        }
    }

    async processTelemetryData(req: Request, res: Response) {
        try {
            // Implementación del procesamiento de datos de telemetría
            return res.status(200).json({
                success: true,
                message: 'Datos procesados correctamente'
            });
        } catch (error) {
            logger.error('Error al procesar datos de telemetría:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al procesar los datos'
            });
        }
    }

    async getVehicleSessions(req: Request, res: Response) {
        try {
            const { vehicleId } = req.params;
            const { startTime, endTime, startDate, endDate } = req.query;
            const organizationId = req.user?.organizationId;

            // Debug logging
            logger.info('🔍 Debug getVehicleSessions:', {
                vehicleId,
                hasUser: !!req.user,
                userId: req.user?.id,
                userEmail: req.user?.email,
                userRole: req.user?.role,
                organizationId: req.user?.organizationId,
                fullUser: req.user
            });

            // Usar startTime/endTime o startDate/endDate como fallback
            const start = startTime || startDate;
            const end = endTime || endDate;

            logger.info(`Obteniendo sesiones para vehículo ${vehicleId}`, {
                startTime: start,
                endTime: end,
                organizationId
            });

            // Validar organizationId
            if (!organizationId) {
                logger.warn('❌ Intento de acceso a sesiones de vehículo sin organización', {
                    hasUser: !!req.user,
                    userKeys: req.user ? Object.keys(req.user) : 'no user',
                    userValues: req.user
                });
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: vehicleId },
                select: { organizationId: true }
            });

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }

            if (vehicle.organizationId !== organizationId) {
                logger.warn(`Intento de acceso no autorizado a sesiones del vehículo ${vehicleId}`);
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            // Primero verificar todas las sesiones existentes para este vehículo
            const allSessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicleId
                }
            });
            logger.info(
                `Total de sesiones en la base de datos para el vehículo ${vehicleId}: ${allSessions.length}`
            );

            // Construir filtros de tiempo solo si existen
            const timeFilters: any = {};
            if (start) {
                try {
                    timeFilters.gte = new Date(start as string);
                } catch (error) {
                    logger.warn(`Fecha de inicio inválida: ${start}`);
                }
            }
            if (end) {
                try {
                    timeFilters.lte = new Date(end as string);
                } catch (error) {
                    logger.warn(`Fecha de fin inválida: ${end}`);
                }
            }

            // Obtener las sesiones con el filtro de tiempo (solo si hay filtros)
            const sessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicleId,
                    ...(Object.keys(timeFilters).length > 0 ? { startTime: timeFilters } : {})
                },
                orderBy: {
                    startTime: 'desc'
                },
                include: {
                    gpsMeasurements: true,
                    canMeasurements: true
                }
            });

            logger.info(`Sesiones encontradas: ${sessions.length}`);

            // Transformar las sesiones para incluir los datos GPS
            const transformedSessions = sessions.map((session) => ({
                id: session.id,
                vehicleId: session.vehicleId,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime?.toISOString() || null,
                status: session.status,
                gpsData: session.gpsMeasurements.map((measurement) => ({
                    timestamp: measurement.timestamp.toISOString(),
                    latitude: measurement.latitude,
                    longitude: measurement.longitude,
                    altitude: measurement.altitude,
                    speed: measurement.speed,
                    heading: measurement.heading,
                    satellites: measurement.satellites,
                    accuracy: measurement.accuracy
                })),
                canData: (() => {
                    const map = new Map<string, any>();
                    for (const frame of session.canMeasurements) {
                        const ts = frame.timestamp.toISOString();
                        const obj = map.get(ts) || {
                            timestamp: ts,
                            engineRPM: null,
                            vehicleSpeed: null,
                            fuelLevel: null,
                            engineTemperature: null,
                            throttlePosition: null,
                            brakePressure: null,
                            steeringAngle: null,
                            gearPosition: null,
                            absActive: frame.absActive,
                            espActive: frame.espActive
                        };

                        if (frame.engineRpm && frame.engineRpm > 0)
                            obj.engineRPM = Number(frame.engineRpm);
                        if (frame.vehicleSpeed && frame.vehicleSpeed > 0)
                            obj.vehicleSpeed = Number(frame.vehicleSpeed);
                        if (frame.fuelSystemStatus) obj.fuelLevel = Number(frame.fuelSystemStatus);
                        if (frame.temperature) obj.engineTemperature = Number(frame.temperature);
                        if (frame.throttlePosition)
                            obj.throttlePosition = Number(frame.throttlePosition);
                        if (frame.brakePressure) obj.brakePressure = Number(frame.brakePressure);
                        if (frame.steeringAngle) obj.steeringAngle = Number(frame.steeringAngle);
                        if (frame.gearPosition) obj.gearPosition = Number(frame.gearPosition);
                        map.set(ts, obj);
                    }
                    return Array.from(map.values())
                        .filter((f) => f.engineRPM !== null || f.vehicleSpeed !== null)
                        .sort(
                            (a, b) =>
                                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                        );
                })()
            }));

            return res.status(200).json({
                success: true,
                data: transformedSessions
            });
        } catch (error) {
            logger.error('Error al obtener sesiones:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener las sesiones'
            });
        }
    }

    async getVehicleAlarms(req: Request, res: Response) {
        try {
            const { vehicleId } = req.params;
            const { startTime, endTime } = req.query;

            logger.info(
                `Obteniendo eventos para vehículo ${vehicleId} entre ${startTime} y ${endTime}`
            );

            const events = await prisma.gestorDeEvento.findMany({
                where: {
                    vehicles: {
                        some: {
                            id: vehicleId
                        }
                    },
                    // @ts-ignore - el campo 'severity' existe en la tabla aunque no esté tipado en Prisma
                    severity: {
                        in: ['WARNING', 'CRITICAL']
                    }
                },
                include: {
                    executions: {
                        where: {
                            vehicleId,
                            triggeredAt: {
                                gte: new Date(startTime as string),
                                lte: new Date(endTime as string)
                            }
                        }
                    }
                }
            });

            return res.status(200).json({
                success: true,
                data: events
            });
        } catch (error) {
            logger.error('Error al obtener eventos:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener los eventos'
            });
        }
    }
}
