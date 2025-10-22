import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { geofenceDetectorService } from './GeofenceDetectorService';
import { GPSPoint, gpsValidationService } from './GPSValidationService';
import { osrmService } from './OSRMService';
import { speedLimitService } from './SpeedLimitService';

export interface ProcessedRoute {
    sessionId: string;
    distance: number;
    duration: number;
    geofenceEvents: number;
    speedViolations: number;
    confidence: number;
    qualityReport?: string;
}

const PROCESSING_VERSION = '2.0'; // ✅ Nueva versión con validación GPS

export class RouteProcessorService {
    async processSession(sessionId: string): Promise<ProcessedRoute> {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
            logger.info(`🗺️ Iniciando geoprocesamiento para sesión ${sessionId}`);

            // Crear registro de auditoría
            const logResult = await prisma.$queryRaw<Array<{ id: string }>>`
                INSERT INTO processing_log (session_id, processing_type, version, status)
                VALUES (${sessionId}, 'geoprocessing', ${PROCESSING_VERSION}, 'processing')
                RETURNING id
            `;
            logId = logResult[0].id;

            // 1. Obtener datos básicos de la sesión UNA SOLA VEZ
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                select: {
                    id: true,
                    vehicleId: true,
                    organizationId: true
                }
            });

            if (!session) {
                throw new Error(`Sesión ${sessionId} no encontrada`);
            }

            // 2. Obtener puntos GPS
            const gpsPointsRaw = await prisma.gpsMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' },
                select: {
                    latitude: true,
                    longitude: true,
                    timestamp: true,
                    speed: true,
                    altitude: true,
                    satellites: true,
                    hdop: true,
                }
            });

            if (gpsPointsRaw.length < 2) {
                throw new Error('No hay suficientes puntos GPS');
            }

            // 3. Convertir a formato GPSPoint y validar
            const gpsPoints: GPSPoint[] = gpsPointsRaw.map(p => ({
                lat: p.latitude,
                lon: p.longitude,
                timestamp: p.timestamp,
                speed: p.speed,
                altitude: p.altitude || undefined,
                satellites: p.satellites || undefined,
                hdop: p.hdop || undefined,
            }));

            // 4. Validar y filtrar puntos GPS
            const validPoints = gpsValidationService.filterValidPoints(gpsPoints);

            if (validPoints.length < 2) {
                throw new Error(`No hay suficientes puntos GPS válidos (${validPoints.length}/${gpsPoints.length})`);
            }

            // 5. Generar reporte de calidad
            const qualityMetrics = gpsValidationService.validateSequence(gpsPoints);
            const qualityReport = gpsValidationService.generateQualityReport(qualityMetrics, sessionId);
            logger.info(qualityReport);

            logger.debug(`Filtrados ${gpsPoints.length - validPoints.length} puntos GPS inválidos`);
            logger.debug(`Procesando ${validPoints.length} puntos GPS válidos`);

            // 6. Map-matching con OSRM
            const matchedRoute = await osrmService.matchRoute(
                validPoints.map(p => ({
                    lat: p.lat,
                    lon: p.lon,
                    timestamp: p.timestamp
                }))
            );

            logger.info(`✅ Ruta matcheada: ${matchedRoute.distance.toFixed(2)}m, confianza: ${matchedRoute.confidence.toFixed(2)}`);

            // 7. Detectar eventos de geocerca
            const geofenceEvents = await geofenceDetectorService.detectGeofenceEvents(
                sessionId,
                validPoints.map(p => ({
                    lat: p.lat,
                    lon: p.lon,
                    timestamp: p.timestamp
                }))
            );

            logger.info(`✅ Detectados ${geofenceEvents.length} eventos de geocerca`);

            // 8. Detectar violaciones de velocidad
            const speedViolations = await speedLimitService.detectViolations(
                validPoints.map(p => ({
                    lat: p.lat,
                    lon: p.lon,
                    timestamp: p.timestamp,
                    speed: p.speed
                })),
                'emergencia' // Tipo de vehículo: emergencia (bomberos)
            );

            logger.info(`✅ Detectadas ${speedViolations.length} violaciones de velocidad`);

            // 6. Guardar resultados
            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    matcheddistance: matchedRoute.distance,
                    matchedduration: matchedRoute.duration,
                    matchedgeometry: matchedRoute.geometry ? JSON.stringify(matchedRoute.geometry) : null,
                    matchedconfidence: matchedRoute.confidence,
                    processingversion: PROCESSING_VERSION
                }
            });

            // 7. Guardar eventos de geocerca
            for (const event of geofenceEvents) {
                await prisma.geofenceEvent.create({
                    data: {
                        geofenceId: event.geofenceId,
                        vehicleId: session.vehicleId, // Ya cargado
                        organizationId: session.organizationId, // Ya cargado
                        type: event.type,
                        timestamp: event.timestamp,
                        latitude: event.lat,
                        longitude: event.lon
                    }
                });
            }

            // 8. Guardar violaciones de velocidad (si las hay)
            if (speedViolations.length > 0) {
                logger.info(`Guardando ${speedViolations.length} violaciones de velocidad`);
                // TODO: Crear tabla de violaciones de velocidad si no existe
                // Por ahora solo logueamos
                for (const violation of speedViolations) {
                    logger.debug(`Violación: ${violation.speed.toFixed(1)} km/h (límite: ${violation.speedLimit} km/h, exceso: ${violation.excess.toFixed(1)} km/h)`);
                }
            }

            // AL FINAL (antes del return):
            const duration = Date.now() - startTime;

            await prisma.$queryRaw`
                UPDATE processing_log
                SET finished_at = NOW(),
                    status = 'success',
                    details = ${JSON.stringify({
                distance: matchedRoute.distance,
                duration: matchedRoute.duration,
                geofenceEvents: geofenceEvents.length,
                speedViolations: speedViolations.length,
                confidence: matchedRoute.confidence,
                processingTimeMs: duration
            })}::jsonb
                WHERE id = ${logId}::uuid
            `;

            logger.info(`✅ Geoprocesamiento completado para sesión ${sessionId}`);

            return {
                sessionId,
                distance: matchedRoute.distance,
                duration: matchedRoute.duration,
                geofenceEvents: geofenceEvents.length,
                speedViolations: speedViolations.length,
                confidence: matchedRoute.confidence,
                qualityReport: qualityReport
            };

        } catch (error: any) {
            logger.error(`Error procesando sesión ${sessionId}:`, error);

            // Actualizar log con error
            if (logId) {
                await prisma.$queryRaw`
                    UPDATE processing_log
                    SET finished_at = NOW(),
                        status = 'failed',
                        error_message = ${error.message}
                    WHERE id = ${logId}::uuid
                `;
            }

            throw error;
        }
    }
}

export const routeProcessorService = new RouteProcessorService();

