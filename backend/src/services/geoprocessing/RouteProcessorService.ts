import axios from 'axios';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { speedViolationPersistenceService } from '../SpeedViolationPersistenceService';
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
    persistedSpeedViolations?: number;
    confidence: number;
    qualityReport?: string;
    source: 'google' | 'osrm';
    googleRoute?: GoogleRouteSummary | null;
    osrm?: {
        distance: number;
        duration: number;
        confidence: number;
    };
}

export interface GoogleRouteSummary {
    distanceMeters: number;
    durationSeconds: number;
    encodedPolyline?: string;
    travelAdvisories?: string[];
    routeLabels?: string[];
    warnings?: string[];
}

const PROCESSING_VERSION = '2.0'; // ✅ Nueva versión con validación GPS

export class RouteProcessorService {
    private readonly routesApiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    private readonly googleRoutesApiKey = process.env.GOOGLE_ROUTES_API_KEY
        || process.env.GOOGLE_MAPS_API_KEY
        || process.env.GOOGLE_API_KEY
        || '';
    private readonly useGoogleRoutes = process.env.GOOGLE_ROUTES_ENABLED !== 'false';

    async processSession(sessionId: string, samplingRate: number = 1): Promise<ProcessedRoute> {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
            logger.info(`🗺️ Iniciando geoprocesamiento para sesión ${sessionId} (muestreo: 1/${samplingRate})`);

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

            // 6. Map-matching con OSRM (baseline)
            const matchedRoute = await osrmService.matchRoute(
                validPoints.map(p => ({
                    lat: p.lat,
                    lon: p.lon,
                    timestamp: p.timestamp
                }))
            );

            logger.info(`✅ Ruta matcheada: ${matchedRoute.distance.toFixed(2)}m, confianza: ${matchedRoute.confidence.toFixed(2)}`);

            // 6.1 Obtener ruta optimizada de Google (si está habilitado)
            const googleRoute = await this.getGoogleRoute(validPoints);

            if (googleRoute) {
                logger.info('✅ [Google Routes] Ruta calculada', {
                    distanceMeters: googleRoute.distanceMeters,
                    durationSeconds: googleRoute.durationSeconds,
                    polyline: googleRoute.encodedPolyline ? 'present' : 'missing'
                });
            }

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

            // 8. Detectar violaciones de velocidad (con muestreo)
            // Aplicar muestreo: tomar 1 punto cada N puntos
            const sampledPoints = validPoints.filter((_, index) => index % samplingRate === 0);

            logger.debug(`Muestreando puntos GPS para velocidad: ${sampledPoints.length}/${validPoints.length} (ratio: 1/${samplingRate})`);

            const speedViolations = await speedLimitService.detectViolations(
                sampledPoints.map(p => ({
                    lat: p.lat,
                    lon: p.lon,
                    timestamp: p.timestamp,
                    speed: p.speed
                })),
                'emergencia' // Tipo de vehículo: emergencia (bomberos)
            );

            logger.info(`✅ Detectadas ${speedViolations.length} violaciones de velocidad (sobre ${sampledPoints.length} puntos muestreados)`);

            const persistedViolations = await speedViolationPersistenceService.storeViolations(
                sessionId,
                session.organizationId,
                session.vehicleId,
                speedViolations
            );

            if (speedViolations.length > 0) {
                logger.info('🚨 Violaciones de velocidad procesadas', {
                    detected: speedViolations.length,
                    persisted: persistedViolations
                });
            }

            const finalDistance = googleRoute?.distanceMeters ?? matchedRoute.distance;
            const finalDuration = googleRoute?.durationSeconds ?? matchedRoute.duration;
            const geometryPayload = googleRoute
                ? {
                    source: 'google',
                    googlePolyline: googleRoute.encodedPolyline,
                    osrmGeometry: matchedRoute.geometry ?? null
                }
                : matchedRoute.geometry;

            // 6. Guardar resultados
            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    matcheddistance: finalDistance,
                    matchedduration: finalDuration,
                    matchedgeometry: geometryPayload ? JSON.stringify(geometryPayload) : null,
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

            // AL FINAL (antes del return):
            const duration = Date.now() - startTime;

            const processingDetails = {
                osrm: {
                    distance: matchedRoute.distance,
                    duration: matchedRoute.duration,
                    confidence: matchedRoute.confidence
                },
                google: googleRoute
                    ? {
                        distanceMeters: googleRoute.distanceMeters,
                        durationSeconds: googleRoute.durationSeconds,
                        encodedPolyline: googleRoute.encodedPolyline,
                        travelAdvisories: googleRoute.travelAdvisories,
                        routeLabels: googleRoute.routeLabels,
                        warnings: googleRoute.warnings
                    }
                    : null,
                geofenceEvents: geofenceEvents.length,
                speedViolationsDetected: speedViolations.length,
                speedViolationsPersisted: persistedViolations,
                processingTimeMs: duration
            };

            await prisma.$queryRaw`
                UPDATE processing_log
                SET finished_at = NOW(),
                    status = 'success',
                    details = ${JSON.stringify(processingDetails)}::jsonb
                WHERE id = ${logId}::uuid
            `;

            logger.info(`✅ Geoprocesamiento completado para sesión ${sessionId}`);

            return {
                sessionId,
                distance: finalDistance,
                duration: finalDuration,
                geofenceEvents: geofenceEvents.length,
                speedViolations: speedViolations.length,
                persistedSpeedViolations: persistedViolations,
                confidence: matchedRoute.confidence,
                qualityReport,
                source: googleRoute ? 'google' : 'osrm',
                googleRoute: googleRoute ?? null,
                osrm: {
                    distance: matchedRoute.distance,
                    duration: matchedRoute.duration,
                    confidence: matchedRoute.confidence
                }
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

    private async getGoogleRoute(points: GPSPoint[]): Promise<GoogleRouteSummary | null> {
        if (!this.useGoogleRoutes) {
            return null;
        }

        if (!this.googleRoutesApiKey) {
            logger.warn('⚠️ [Google Routes] API key no configurada, se mantiene cálculo OSRM');
            return null;
        }

        if (points.length < 2) {
            return null;
        }

        const origin = points[0];
        const destination = points[points.length - 1];
        const intermediates = this.buildIntermediateWaypoints(points);

        const body = {
            origin: {
                location: {
                    latLng: {
                        latitude: origin.lat,
                        longitude: origin.lon
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destination.lat,
                        longitude: destination.lon
                    }
                }
            },
            intermediates: intermediates.map((point) => ({
                location: {
                    latLng: {
                        latitude: point.lat,
                        longitude: point.lon
                    }
                }
            })),
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
            computeAlternativeRoutes: false,
            polylineQuality: 'HIGH_QUALITY',
            polylineEncoding: 'ENCODED_POLYLINE'
        };

        try {
            const response = await axios.post(
                this.routesApiUrl,
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.googleRoutesApiKey,
                        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.travelAdvisory.warnings.detailText,routes.travelAdvisory.warnings.warningCode,routes.routeLabels'
                    },
                    timeout: 10000
                }
            );

            const route = response.data?.routes?.[0];

            if (!route) {
                logger.warn('⚠️ [Google Routes] No se recibió ruta en la respuesta');
                return null;
            }

            const durationSeconds = route.duration ? this.parseGoogleDuration(route.duration) : 0;
            const warnings = Array.isArray(route.travelAdvisory?.warnings)
                ? route.travelAdvisory.warnings
                    .map((warning: any) => warning.detailText || warning.warningCode)
                    .filter((warning: string | undefined): warning is string => Boolean(warning))
                : undefined;

            return {
                distanceMeters: Number(route.distanceMeters ?? 0),
                durationSeconds,
                encodedPolyline: route.polyline?.encodedPolyline,
                travelAdvisories: warnings,
                routeLabels: Array.isArray(route.routeLabels) ? route.routeLabels : undefined,
                warnings
            };

        } catch (error: any) {
            logger.warn('⚠️ [Google Routes] Error calculando ruta', {
                message: error?.response?.data?.error?.message || error.message,
                status: error?.response?.status
            });
            return null;
        }
    }

    private buildIntermediateWaypoints(points: GPSPoint[]): GPSPoint[] {
        const GOOGLE_MAX_INTERMEDIATES = 23;

        if (points.length <= 2) {
            return [];
        }

        const step = Math.max(1, Math.floor(points.length / (GOOGLE_MAX_INTERMEDIATES + 1)));
        const intermediates: GPSPoint[] = [];

        for (let i = step; i < points.length - 1 && intermediates.length < GOOGLE_MAX_INTERMEDIATES; i += step) {
            intermediates.push(points[i]);
        }

        return intermediates;
    }

    private parseGoogleDuration(duration: string): number {
        const match = duration.match(/([0-9]+\.?[0-9]*)s/);
        if (!match) {
            logger.debug(`No se pudo parsear duración de Google Routes: ${duration}`);
            return 0;
        }

        return Number(match[1]);
    }
}

export const routeProcessorService = new RouteProcessorService();

