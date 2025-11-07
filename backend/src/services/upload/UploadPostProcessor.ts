/**
 * 🔄 POST-PROCESSOR DE UPLOAD
 * 
 * Ejecuta tareas automáticas tras crear sesiones:
 * - Generar eventos de estabilidad
 * - Generar segmentos operacionales
 * - Invalidar cache de KPIs
 * 
 * @version 1.0
 * @date 2025-10-15
 */

import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { generateStabilityEventsForSession } from '../eventDetector';
import { geofenceDetectorService } from '../geoprocessing/GeofenceDetectorService';
import { kpiCacheService } from '../KPICacheService';
import { convertSegmentsToOperationalKeys, generateOperationalSegments } from '../OperationalKeyCalculator';

export interface SessionEventsSummary {
    sessionId: string;
    eventsGenerated: number;
    segmentsGenerated: number;
    events?: Array<{
        type: string;
        severity: string;
        timestamp: Date;
        lat?: number;
        lon?: number;
    }>;
    geofenceEvents?: number;
    routeDistance?: number;
    routeConfidence?: number;
    speedViolations?: number;
    gpsPoints?: number;
    stabilityMeasurements?: number;
}

export interface PostProcessingResult {
    sessionIds: string[];
    eventsGenerated: number;
    segmentsGenerated: number;
    errors: string[];
    duration: number;
    sessionDetails?: SessionEventsSummary[]; // ✅ NUEVO: Detalle por sesión
}

export class UploadPostProcessor {
    /**
     * Procesa una lista de sesiones recién creadas
     * @param sessionIds - IDs de sesiones a procesar
     * @returns Resultado del procesamiento
     */
    static async process(sessionIds: string[]): Promise<PostProcessingResult> {
        const startTime = Date.now();
        const results: PostProcessingResult = {
            sessionIds,
            eventsGenerated: 0,
            segmentsGenerated: 0,
            errors: [],
            duration: 0,
            sessionDetails: [] // ✅ NUEVO
        };

        logger.info(`🔄 Iniciando post-procesamiento de ${sessionIds.length} sesiones`, {
            sessionIds
        });

        if (sessionIds.length === 0) {
            logger.warn('⚠️ No hay sesiones para post-procesar');
            return results;
        }

        // Procesar cada sesión
        for (const sessionId of sessionIds) {
            try {
                const sessionSummary = await this.processSession(sessionId, results);
                if (sessionSummary) {
                    results.sessionDetails!.push(sessionSummary);
                }
            } catch (error: any) {
                logger.error(`❌ Error procesando sesión ${sessionId}:`, error);
                results.errors.push(`Sesión ${sessionId}: ${error.message}`);
            }
        }

        // Invalidar cache de KPIs para la organización
        try {
            await this.invalidateCache(sessionIds[0]);
        } catch (error: any) {
            logger.error('❌ Error invalidando cache:', error);
            results.errors.push(`Cache: ${error.message}`);
        }

        results.duration = Date.now() - startTime;

        logger.info(`✅ Post-procesamiento completado en ${results.duration}ms`, {
            eventsGenerated: results.eventsGenerated,
            segmentsGenerated: results.segmentsGenerated,
            errorsCount: results.errors.length
        });

        return results;
    }

    /**
     * Procesa una sesión individual
     * @returns Resumen de eventos y segmentos generados para esta sesión
     */
    private static async processSession(
        sessionId: string,
        results: PostProcessingResult
    ): Promise<SessionEventsSummary | null> {
        logger.info(`📊 Procesando sesión ${sessionId}`);

        const summary: SessionEventsSummary = {
            sessionId,
            eventsGenerated: 0,
            segmentsGenerated: 0,
            events: [],
            geofenceEvents: 0,
            routeDistance: 0,
            routeConfidence: 0,
            speedViolations: 0,
            gpsPoints: 0,
            stabilityMeasurements: 0
        };

        // 1. Obtener conteo de mediciones
        try {
            const [gpsCount, stabilityCount] = await Promise.all([
                prisma.gpsMeasurement.count({ where: { sessionId } }),
                prisma.stabilityMeasurement.count({ where: { sessionId } })
            ]);
            summary.gpsPoints = gpsCount;
            summary.stabilityMeasurements = stabilityCount;
        } catch (error: any) {
            logger.warn(`⚠️ Error obteniendo conteo de mediciones: ${error.message}`);
        }

        // 2. Generar eventos de estabilidad
        try {
            const events = await generateStabilityEventsForSession(sessionId);
            results.eventsGenerated += events.length;
            summary.eventsGenerated = events.length;

            // ✅ Logging adicional para diagnosticar eventos
            logger.info(`📊 Generación de eventos para ${sessionId}:`, {
                eventos_detectados: events.length,
                tiene_eventos: events.length > 0
            });

            // ✅ NUEVO: Obtener los eventos guardados de la BD para incluir en el resumen
            const savedEvents = await prisma.$queryRaw<Array<{
                type: string;
                severity: string;
                timestamp: Date;
                lat: number | null;
                lon: number | null;
            }>>`
                SELECT type, severity, timestamp, lat, lon
                FROM stability_events
                WHERE session_id = ${sessionId}
                ORDER BY timestamp ASC
                LIMIT 10
            `;

            logger.info(`📋 Eventos recuperados de BD para sesión ${sessionId}:`, {
                count: savedEvents.length,
                totalDetected: events.length
            });

            summary.events = savedEvents.map(e => ({
                type: e.type,
                severity: e.severity,
                timestamp: e.timestamp,
                lat: e.lat || undefined,
                lon: e.lon || undefined
            }));

            logger.info(`✅ Eventos generados para sesión ${sessionId}:`, {
                count: events.length
            });
        } catch (error: any) {
            logger.error(`❌ Error generando eventos para sesión ${sessionId}:`, error);
            throw new Error(`Eventos: ${error.message}`);
        }

        // 3. Generar segmentos operacionales
        try {
            const segments = await generateOperationalSegments(sessionId);
            results.segmentsGenerated += segments.length;
            summary.segmentsGenerated = segments.length;
            logger.info(`✅ Segmentos generados para sesión ${sessionId}:`, {
                count: segments.length
            });

            // 3.1 Convertir segmentos a OperationalKeys (DESACTIVADO - tabla obsoleta)
            // ✅ Los KPIs ahora leen directamente de operational_state_segments
            // ❌ La tabla operationalKey es obsoleta y causaba errores PostGIS
            /*
            try {
                const keysCreated = await convertSegmentsToOperationalKeys(sessionId);
                logger.info(`✅ ${keysCreated} OperationalKeys creados para sesión ${sessionId}`);
            } catch (keyError: any) {
                logger.error(`❌ Error convirtiendo segmentos a OperationalKeys: ${keyError.message}`);
                // No fallar todo el proceso si esto falla
            }
            */
            logger.info(`✅ Segmentos guardados en operational_state_segments (conversión a operationalKey desactivada)`);
        } catch (error: any) {
            logger.error(`❌ Error generando segmentos para sesión ${sessionId}:`, error);
            // No fallar si no hay datos de rotativo
            if (!error.message.includes('Sin datos de rotativo')) {
                throw new Error(`Segmentos: ${error.message}`);
            }
        }

        // 4. ✅ DETECCIÓN DE GEOCERCAS (HABILITADO)
        // Detecta eventos de entrada/salida de geocercas
        // NO requiere TomTom API, usa solo PostGIS + Turf.js
        try {
            logger.debug(`🗺️ Ejecutando detección de geocercas para sesión ${sessionId}`);

            // Obtener puntos GPS de la sesión
            const gpsPoints = await prisma.gpsMeasurement.findMany({
                where: { sessionId },
                select: {
                    latitude: true,
                    longitude: true,
                    timestamp: true
                },
                orderBy: { timestamp: 'asc' }
            });

            if (gpsPoints.length === 0) {
                logger.debug(`⏭️ No hay puntos GPS para detectar geocercas en sesión ${sessionId}`);
            } else {
                // Detectar eventos de geocerca
                const geofenceEvents = await geofenceDetectorService.detectGeofenceEvents(
                    sessionId,
                    gpsPoints.map(p => ({
                        lat: p.latitude,
                        lon: p.longitude,
                        timestamp: p.timestamp
                    }))
                );

                // Guardar eventos en BD
                const session = await prisma.session.findUnique({
                    where: { id: sessionId },
                    select: { vehicleId: true, organizationId: true }
                });

                if (session) {
                    for (const event of geofenceEvents) {
                        await prisma.$executeRaw`
                            INSERT INTO "GeofenceEvent" (
                                id, "geofenceId", "vehicleId", "organizationId",
                                type, timestamp, latitude, longitude, status, "updatedAt"
                            ) VALUES (
                                (gen_random_uuid())::text,
                                ${event.geofenceId},
                                ${session.vehicleId},
                                ${session.organizationId},
                                ${event.type}::text::"GeofenceEventType",
                                ${event.timestamp},
                                ${event.lat},
                                ${event.lon},
                                'ACTIVE'::"GeofenceEventStatus",
                                NOW()
                            )
                        `;
                    }
                }

                summary.geofenceEvents = geofenceEvents.length;
                logger.info(`✅ Geocercas OK: ${geofenceEvents.length} eventos detectados en sesión ${sessionId}`);
            }
        } catch (geoError: any) {
            logger.warn(`⚠️ Error en detección de geocercas: ${geoError.message}`);
            // No fallar el procesamiento completo si falla geocercas
        }

        return summary;
    }

    /**
     * Invalida el cache de KPIs para la organización
     */
    private static async invalidateCache(sessionId: string): Promise<void> {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { organizationId: true }
        });

        if (!session) {
            logger.warn(`⚠️ Sesión no encontrada para invalidar cache: ${sessionId}`);
            return;
        }

        kpiCacheService.invalidate(session.organizationId);
        logger.info('✅ Cache de KPIs invalidado', {
            organizationId: session.organizationId
        });
    }
}

