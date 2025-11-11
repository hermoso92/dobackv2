import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validateOrganization } from '../middleware/validateOrganization';
import { logger } from '../utils/logger';

const router = Router();


/**
 * FASE 2: Clustering nativo PostGIS con ST_ClusterDBSCAN
 * Reemplaza clustering O(n²) JavaScript con query eficiente en DB
 * Beneficio: O(n log n) performance, cálculo en PostgreSQL
 */
async function clusterEventsPostGIS(
    organizationId: string,
    radiusMeters: number = 20,
    filters: {
        from?: string;
        to?: string;
        vehicleIds?: string[];
        severity?: string;
        rotativo?: string;
    } = {}
): Promise<any[]> {
    const { from, to, vehicleIds, severity, rotativo } = filters;

    // Construir WHERE dinámico
    const conditions: Prisma.Sql[] = [
        Prisma.sql`se.geog IS NOT NULL`,
        Prisma.sql`s."organizationId" = ${organizationId}`
    ];

    if (from && to) {
        conditions.push(Prisma.sql`se.timestamp >= ${new Date(from).toISOString()}`);
        conditions.push(Prisma.sql`se.timestamp <= ${new Date(to).toISOString()}`);
    }

    if (vehicleIds && vehicleIds.length > 0) {
        const vehicleIdList = Prisma.join(
            vehicleIds.map(id => Prisma.sql`${id}`),
            Prisma.sql`, `
        );
        conditions.push(Prisma.sql`s."vehicleId" IN (${vehicleIdList})`);
    }

    if (severity && severity !== 'all') {
        conditions.push(Prisma.sql`se.severity = ${severity.toUpperCase()}`);
    }

    if (rotativo && rotativo !== 'all') {
        const rotativoValue = rotativo === 'on' ? 1 : 0;
        conditions.push(Prisma.sql`COALESCE(se."rotativoState", 0) = ${rotativoValue}`);
    }

    const whereClause = Prisma.join(conditions, Prisma.sql` AND `);
    const safeRadiusMeters = Math.max(5, Math.min(2000, Number.isFinite(radiusMeters) ? radiusMeters : 30));

    // Query PostGIS con ST_ClusterDBSCAN
    const clusteredEvents = await prisma.$queryRaw<any>(Prisma.sql`
        WITH event_data AS (
            SELECT 
                se.id,
                se.lat,
                se.lon,
                se.geog,
                ST_Transform(se.geog::geometry, 3857) as geom_3857,
                se.timestamp,
                se.type,
                se.details,
                se."rotativoState",
                se.severity,
                s."vehicleId",
                v.name as "vehicleName",
                v.identifier as "vehicleIdentifier"
            FROM stability_events se
            JOIN "Session" s ON se."session_id" = s.id
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            WHERE ${whereClause}
        ),
        clustered AS (
            SELECT 
                *,
                ST_ClusterDBSCAN(geom_3857, eps := ${safeRadiusMeters}, minpoints := 1) OVER () as cluster_id
            FROM event_data
        )
        SELECT 
            cluster_id,
            ST_Y(ST_Centroid(ST_Collect(geog::geometry))::geography::geometry) as lat,
            ST_X(ST_Centroid(ST_Collect(geog::geometry))::geography::geometry) as lng,
            array_agg(DISTINCT id) as event_ids,
            COUNT(DISTINCT id) as frequency,
            MAX(timestamp) as last_occurrence,
            array_agg(DISTINCT "vehicleId") as vehicle_ids,
            SUM(CASE WHEN severity = 'CRÍTICA' OR severity = 'GRAVE' THEN 1 ELSE 0 END)::int as grave_count,
            SUM(CASE WHEN severity = 'MODERADA' THEN 1 ELSE 0 END)::int as moderada_count,
            SUM(CASE WHEN severity = 'LEVE' THEN 1 ELSE 0 END)::int as leve_count,
            jsonb_agg(jsonb_build_object(
                'id', id,
                'lat', lat,
                'lng', lon,
                'timestamp', timestamp,
                'severity', severity,
                'type', type,
                'rotativoState', "rotativoState",
                'vehicleId', "vehicleId",
                'vehicleName', "vehicleName",
                'details', details
            )) as events
        FROM clustered
        WHERE cluster_id IS NOT NULL
        GROUP BY cluster_id
        ORDER BY frequency DESC, last_occurrence DESC
    `);

    // Transformar a formato esperado por el endpoint
    return clusteredEvents.map((cluster, idx) => {
        // Determinar severidad dominante
        let dominantSeverity = 'leve';
        if (cluster.grave_count > 0) dominantSeverity = 'grave';
        else if (cluster.moderada_count > 0) dominantSeverity = 'moderada';

        return {
            id: `postgis_cluster_${cluster.cluster_id || idx}`,
            lat: parseFloat(cluster.lat),
            lng: parseFloat(cluster.lng),
            location: `${parseFloat(cluster.lat).toFixed(4)}, ${parseFloat(cluster.lng).toFixed(4)}`,
            events: cluster.events || [],
            severity_counts: {
                grave: cluster.grave_count || 0,
                moderada: cluster.moderada_count || 0,
                leve: cluster.leve_count || 0
            },
            frequency: parseInt(cluster.frequency) || 0,
            vehicleIds: cluster.vehicle_ids || [],
            lastOccurrence: cluster.last_occurrence,
            dominantSeverity
        };
    });
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // Radio de la Tierra en metros

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function clusterEvents(events: any[], radiusMeters: number = 20): any[] {
    const clusters: any[] = [];
    const visited = new Set<number>();

    const normalizeSeverity = (value: any): 'grave' | 'moderada' | 'leve' => {
        const normalized = (value ?? 'leve').toString().toLowerCase();
        if (normalized.includes('grave') || normalized.includes('criti')) {
            return 'grave';
        }
        if (normalized.includes('moder')) {
            return 'moderada';
        }
        return 'leve';
    };

    for (let i = 0; i < events.length; i++) {
        if (visited.has(i)) continue;

        const seed = events[i];
        if (!seed || !Number.isFinite(seed.lat) || !Number.isFinite(seed.lng)) {
            visited.add(i);
            continue;
        }

        const queue: number[] = [i];
        const clusterIndices: number[] = [];

        while (queue.length > 0) {
            const currentIdx = queue.pop()!;
            if (visited.has(currentIdx)) continue;

            const current = events[currentIdx];
            if (!current || !Number.isFinite(current.lat) || !Number.isFinite(current.lng)) {
                visited.add(currentIdx);
                continue;
            }

            visited.add(currentIdx);
            clusterIndices.push(currentIdx);

            for (let j = 0; j < events.length; j++) {
                if (visited.has(j)) continue;
                const candidate = events[j];
                if (!candidate || !Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) {
                    continue;
                }

                const distance = haversineDistanceMeters(current.lat, current.lng, candidate.lat, candidate.lng);
                if (distance <= radiusMeters) {
                    queue.push(j);
                }
            }
        }

        if (clusterIndices.length === 0) {
            continue;
        }

        const clusterEventsList = clusterIndices.map(idx => events[idx]);
        const severityCounts = { grave: 0, moderada: 0, leve: 0 };
        const vehicleIdsSet = new Set<string>();

        let lastOccurrence: string | Date | undefined;

        clusterEventsList.forEach(ev => {
            const severity = normalizeSeverity(ev.severity);
            severityCounts[severity] += 1;

            if (ev.vehicleId) {
                vehicleIdsSet.add(ev.vehicleId);
            }

            if (ev.timestamp) {
                const currentTs = new Date(ev.timestamp).getTime();
                const lastTs = lastOccurrence ? new Date(lastOccurrence).getTime() : -Infinity;
                if (currentTs > lastTs) {
                    lastOccurrence = ev.timestamp;
                }
            }
        });

        let dominantSeverity: 'grave' | 'moderada' | 'leve' = 'leve';
        if (severityCounts.grave > 0) {
            dominantSeverity = 'grave';
        } else if (severityCounts.moderada > 0) {
            dominantSeverity = 'moderada';
        }

        const centroidLat = clusterEventsList.reduce((acc, ev) => acc + Number(ev.lat || 0), 0) / clusterEventsList.length;
        const centroidLng = clusterEventsList.reduce((acc, ev) => acc + Number(ev.lng || ev.lon || 0), 0) / clusterEventsList.length;

        clusters.push({
            id: `cluster_${clusters.length}`,
            lat: centroidLat,
            lng: centroidLng,
            location: `${centroidLat.toFixed(4)}, ${centroidLng.toFixed(4)}`,
            events: clusterEventsList,
            severity_counts: severityCounts,
            frequency: clusterEventsList.length,
            vehicleIds: Array.from(vehicleIdsSet),
            lastOccurrence,
            dominantSeverity
        });
    }

    return clusters;
}

/**
 * DEPRECATED: Fallback clustering JavaScript (solo para eventos sin geog)
 * Se mantiene por compatibilidad hasta migración geography completa
 */
function clusterEventsFallback(events: any[], radiusMeters: number = 20): any[] {
    return clusterEvents(events, radiusMeters);
}

/**
 * GET /api/hotspots/critical-points
 * Obtiene puntos negros (zonas críticas) con clustering
 * ACTUALIZADO: Usa eventDetector con índice SI
 * 06/Nov/2025: Añadida validación organizationId (ChatGPT P0 CRÍTICO)
 */
router.get('/critical-points', authenticate, validateOrganization, async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string || 'default-org';
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const severityFilter = req.query.severity as string || 'all';
        const minFrequency = Number.isFinite(parseInt(req.query.minFrequency as string))
            ? parseInt(req.query.minFrequency as string)
            : 2; // default más estricto para reducir ruido
        const rotativoFilter = req.query.rotativoOn as string || 'all';
        const clusterRadius = Number.isFinite(parseFloat(req.query.clusterRadius as string))
            ? parseFloat(req.query.clusterRadius as string)
            : 30; // default más amplio para agrupar mejor
        // Aceptar ambos formatos: from/to y startDate/endDate
        const from = (req.query.from as string) || (req.query.startDate as string);
        const to = (req.query.to as string) || (req.query.endDate as string);
        const mode = (req.query.mode as string) || 'cluster'; // 'cluster' | 'single'

        logger.info('Obteniendo puntos críticos con PostGIS clustering', { organizationId, severityFilter, minFrequency, clusterRadius, from, to, vehicleIds });

        // FASE 2: Usar clustering PostGIS nativo (mucho más eficiente)
        let filteredClusters: any[] = [];
        let eventosProcesados: any[] = [];

        if (mode !== 'single') {
            try {
                // Intentar clustering PostGIS (requiere columna geog poblada)
                filteredClusters = await clusterEventsPostGIS(
                    organizationId,
                    clusterRadius,
                    {
                        from,
                        to,
                        vehicleIds,
                        severity: severityFilter !== 'all' ? severityFilter : undefined,
                        rotativo: rotativoFilter
                    }
                );

                // Filtrar por frecuencia mínima
                filteredClusters = filteredClusters.filter(cluster => cluster.frequency >= minFrequency);

                eventosProcesados = filteredClusters.flatMap(cluster => Array.isArray(cluster.events) ? cluster.events : []);

                logger.info(`Clusters PostGIS generados: ${filteredClusters.length}`);
            } catch (error) {
                logger.warn('Error en clustering PostGIS, usando fallback JavaScript', { error });

                // Fallback: cargar eventos manualmente si falla PostGIS
                let eventosDB;
                if (from && to && vehicleIds && vehicleIds.length > 0) {
                    eventosDB = await prisma.$queryRaw`
                        SELECT 
                            se.id, se.lat, se.lon, se.timestamp, se.type, se.details, se."rotativoState",
                            s."vehicleId", v.name as "vehicleName", v.identifier as "vehicleIdentifier"
                        FROM stability_events se
                        JOIN "Session" s ON se."session_id" = s.id
                        JOIN "Vehicle" v ON s."vehicleId" = v.id
                        WHERE se.lat != 0 AND se.lon != 0
                        AND s."organizationId" = ${organizationId}
                        AND se.timestamp >= ${new Date(from)} AND se.timestamp <= ${new Date(to)}
                        AND s."vehicleId" = ANY(${vehicleIds})
                    ` as any[];
                } else if (from && to) {
                    eventosDB = await prisma.$queryRaw`
                        SELECT 
                            se.id, se.lat, se.lon, se.timestamp, se.type, se.details, se."rotativoState",
                            s."vehicleId", v.name as "vehicleName", v.identifier as "vehicleIdentifier"
                        FROM stability_events se
                        JOIN "Session" s ON se."session_id" = s.id
                        JOIN "Vehicle" v ON s."vehicleId" = v.id
                        WHERE se.lat != 0 AND se.lon != 0
                        AND s."organizationId" = ${organizationId}
                        AND se.timestamp >= ${new Date(from)} AND se.timestamp <= ${new Date(to)}
                    ` as any[];
                } else {
                    eventosDB = await prisma.$queryRaw`
                        SELECT 
                            se.id, se.lat, se.lon, se.timestamp, se.type, se.details, se."rotativoState",
                            s."vehicleId", v.name as "vehicleName", v.identifier as "vehicleIdentifier"
                        FROM stability_events se
                        JOIN "Session" s ON se."session_id" = s.id
                        JOIN "Vehicle" v ON s."vehicleId" = v.id
                        WHERE se.lat != 0 AND se.lon != 0
                        AND s."organizationId" = ${organizationId}
                    ` as any[];
                }

                const eventos = eventosDB.map(e => {
                    const details = e.details as any || {};
                    const si = details.valores?.si || details.si || 0;
                    let severity = 'leve';
                    if (si < 0.20) severity = 'grave';
                    else if (si < 0.35) severity = 'moderada';

                    return {
                        id: e.id,
                        lat: e.lat,
                        lng: e.lon,
                        timestamp: e.timestamp.toISOString(),
                        vehicleId: e.vehicleId,
                        vehicleName: e.vehicleName || e.vehicleIdentifier || 'unknown',
                        type: e.type,
                        severity,
                        rotativo: e.rotativoState === 1,
                        location: `${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`
                    };
                });

                // Aplicar filtros
                let filteredEvents = eventos;
                if (rotativoFilter !== 'all') {
                    filteredEvents = filteredEvents.filter(e =>
                        rotativoFilter === 'on' ? e.rotativo : !e.rotativo
                    );
                }
                if (severityFilter !== 'all') {
                    filteredEvents = filteredEvents.filter(e => e.severity === severityFilter);
                }

                // Usar fallback clustering
                const clusters = clusterEventsFallback(filteredEvents, clusterRadius);
                filteredClusters = clusters.filter(cluster => cluster.frequency >= minFrequency);
                eventosProcesados = filteredEvents;
            }
        }

        // Modo single: si se fuerza modo individual, convertir clusters en eventos individuales
        if (mode === 'single' && filteredClusters.length > 0) {
            const singleEvents: any[] = [];
            filteredClusters.forEach(cluster => {
                cluster.events.forEach((e: any, idx: number) => {
                    singleEvents.push({
                        id: `single_${cluster.id}_${idx}`,
                        lat: e.lat,
                        lng: e.lng,
                        location: e.location || `${e.lat}, ${e.lng}`,
                        events: [e],
                        severity_counts: {
                            grave: e.severity === 'grave' ? 1 : 0,
                            moderada: e.severity === 'moderada' ? 1 : 0,
                            leve: e.severity === 'leve' ? 1 : 0
                        },
                        frequency: 1,
                        vehicleIds: [e.vehicleId],
                        lastOccurrence: e.timestamp,
                        dominantSeverity: e.severity
                    });
                });
            });
            filteredClusters = singleEvents;
        }

        // Fallback: si no hay clusters, intentar con excesos de velocidad como puntos críticos
        if (filteredClusters.length === 0) {
            try {
                const { analizarVelocidades } = await import('../services/speedAnalyzer');
                // Mantener compatibilidad: si no hay eventos, no forzamos análisis fuera del alcance de la función
                const analisis = await analizarVelocidades([]);
                const excesos = analisis.excesos || [];

                logger.info('[Hotspots] Usando excesos de velocidad como eventos críticos de fallback', { total: excesos.length });

                const eventosVel = excesos.map((ex: any) => ({
                    id: ex.id || `${ex.sessionId}_${ex.timestamp}`,
                    lat: ex.lat,
                    lng: ex.lon || ex.lng,
                    timestamp: new Date(ex.timestamp).toISOString(),
                    vehicleId: ex.vehicleId,
                    vehicleName: ex.vehicleName || ex.vehicleId,
                    eventType: 'EXCESO_VELOCIDAD',
                    severity: ex.excess > 20 ? 'grave' : 'leve',
                    si: 0,
                    rotativo: !!ex.justificado,
                    location: `${Number(ex.lat).toFixed(4)}, ${Number(ex.lon || ex.lng).toFixed(4)}`
                })).filter((e: any) => Number.isFinite(e.lat) && Number.isFinite(e.lng));

                const clustersVel = clusterEvents(eventosVel, Math.max(20, clusterRadius));
                filteredClusters = clustersVel.length > 0 ? clustersVel : eventosVel.map((e: any, idx: number) => ({
                    id: `speed_${idx}`,
                    lat: e.lat,
                    lng: e.lng,
                    location: e.location,
                    events: [e],
                    severity_counts: {
                        grave: e.severity === 'grave' ? 1 : 0,
                        moderada: 0,
                        leve: e.severity === 'leve' ? 1 : 0
                    },
                    frequency: 1,
                    vehicleIds: [e.vehicleId],
                    lastOccurrence: e.timestamp,
                    dominantSeverity: e.severity
                }));

                eventosProcesados = eventosVel;

            } catch (fallbackErr) {
                logger.error('[Hotspots] Error en fallback de velocidad:', fallbackErr);
            }
        }

        // Ordenar por frecuencia y severidad
        filteredClusters.sort((a, b) => {
            const severityWeight: Record<string, number> = { grave: 3, moderada: 2, leve: 1, normal: 0 };
            const aWeight = a.frequency * (severityWeight[a.dominantSeverity] || 1);
            const bWeight = b.frequency * (severityWeight[b.dominantSeverity] || 1);
            return bWeight - aWeight;
        });

        const totalEventos = eventosProcesados.length;
        logger.info(`Clusters creados: ${filteredClusters.length} de ${totalEventos} eventos procesados`);

        res.json({
            success: true,
            data: {
                clusters: filteredClusters,
                total_events: totalEventos,
                totalClusters: filteredClusters.length,
                filters: {
                    severity: severityFilter,
                    minFrequency,
                    rotativo: rotativoFilter,
                    clusterRadius,
                    mode
                }
            }
        });

    } catch (error) {
        logger.error('Error obteniendo puntos críticos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/hotspots/ranking
 * Obtiene ranking de zonas críticas ordenadas por frecuencia y gravedad
 * ACTUALIZADO: Usa eventDetector con índice SI
 * 06/Nov/2025: Añadida validación organizationId (ChatGPT P0 CRÍTICO)
 */
router.get('/ranking', authenticate, validateOrganization, async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string || 'default-org';
        const limit = parseInt(req.query.limit as string) || 10;
        const severityFilter = req.query.severity as string || 'all';
        const rotativoFilter = req.query.rotativoOn as string || 'all';
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        logger.info('Obteniendo ranking de hotspots con eventDetector', { organizationId, limit });

        // Construir filtros para sesiones
        const sessionsWhere: any = { organizationId };

        if (vehicleIds && vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        if (startDate || endDate) {
            sessionsWhere.startTime = {};
            if (startDate) sessionsWhere.startTime.gte = new Date(startDate);
            if (endDate) sessionsWhere.startTime.lte = new Date(endDate);
        }

        // Obtener sesiones filtradas
        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true, vehicleId: true },
            take: 100 // Limitar para performance
        });

        const sessionIds = sessions.map(s => s.id);

        logger.info(`Buscando eventos para ranking en ${sessionIds.length} sesiones`);

        // LEER EVENTOS DESDE BD (NO recalcular)
        const eventosDB = await prisma.$queryRaw`
            SELECT 
                se.id, se.lat, se.lon, se.timestamp, se.type, se.details, se."rotativoState",
                s."vehicleId", v.name as "vehicleName", v.identifier as "vehicleIdentifier"
            FROM stability_events se
            JOIN "Session" s ON se."session_id" = s.id
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            WHERE se.lat != 0 AND se.lon != 0
            AND se."session_id" = ANY(${sessionIds})
        ` as any[];

        logger.info(`Eventos encontrados para ranking: ${eventosDB.length}`);

        // Convertir eventos a formato del endpoint
        const eventos = eventosDB.map(e => {
            const details = e.details as any || {};
            // CORREGIDO: El SI está en details.valores.si, no en details.si
            const si = details.valores?.si || details.si || 0;
            const roll = details.valores?.roll || details.roll || 0;
            const ay = details.valores?.ay || details.ay || 0;
            const gx = details.valores?.gx || details.gx || 0;
            const speed = details.valores?.speed || details.speed || 0;

            // Calcular severidad basada en SI
            let severity = 'leve';
            if (si < 0.20) severity = 'grave';
            else if (si < 0.35) severity = 'moderada';

            return {
                lat: e.lat,
                lng: e.lon,
                severity,
                timestamp: e.timestamp,
                type: e.type, // ✅ Cambiado de eventType a type
                eventType: e.type, // ✅ Mantener para compatibilidad
                si,
                roll,
                ay,
                gx,
                speed,
                rotativo: e.rotativoState === 1,
                rotativoState: e.rotativoState,
                location: `${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`,
                details // ✅ Incluir detalles completos
            };
        });

        // Aplicar filtros
        let filteredEvents = eventos;

        if (severityFilter !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.severity === severityFilter);
        }

        if (rotativoFilter === 'on') {
            filteredEvents = filteredEvents.filter(e => e.rotativo === true);
        } else if (rotativoFilter === 'off') {
            filteredEvents = filteredEvents.filter(e => e.rotativo === false);
        }

        // Clustering con radio más amplio para ranking
        const clusters = clusterEvents(filteredEvents, 50);

        // Ordenar por peso (frecuencia * severidad)
        clusters.sort((a, b) => {
            const severityWeight: Record<string, number> = { grave: 3, moderada: 2, leve: 1, normal: 0 };
            const aWeight = a.frequency * (severityWeight[a.dominantSeverity] || 1);
            const bWeight = b.frequency * (severityWeight[b.dominantSeverity] || 1);
            return bWeight - aWeight;
        });

        // Generar ranking limitado
        const ranking = clusters.slice(0, limit).map((cluster, index) => ({
            rank: index + 1,
            location: cluster.location,
            totalEvents: cluster.frequency,
            grave: cluster.severity_counts.grave,
            moderada: cluster.severity_counts.moderada,
            leve: cluster.severity_counts.leve,
            lat: cluster.lat,
            lng: cluster.lng,
            lastOccurrence: cluster.lastOccurrence
        }));

        logger.info(`Ranking generado: ${ranking.length} zonas críticas de ${clusters.length} clusters`);

        res.json({
            success: true,
            data: {
                ranking,
                total: clusters.length
            }
        });

    } catch (error) {
        logger.error('Error obteniendo ranking de hotspots:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

export default router;
