import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();


/**
 * Calcula la distancia en metros entre dos puntos GPS usando la fórmula de Haversine
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Radio de la Tierra en metros

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

/**
 * Agrupa eventos por proximidad geográfica
 */
/**
 * MANDAMIENTO M5: Clustering con IDs únicos
 * Radio en metros, frecuencia = eventos distintos (no duplicados)
 */
function clusterEvents(events: any[], radiusMeters: number = 20): any[] {
    const clusters: any[] = [];
    const usedEvents = new Set<number>();

    events.forEach((event, i) => {
        if (usedEvents.has(i)) return;

        // ✅ MANDAMIENTO M5.2: Usar Set para IDs únicos
        const eventIds = new Set<string>();
        eventIds.add(event.id);

        // Crear nuevo cluster
        const cluster: any = {
            id: `cluster_${clusters.length}`,
            lat: event.lat,
            lng: event.lng,
            location: event.location || 'Ubicación desconocida',
            events: [event],
            severity_counts: {
                grave: event.severity === 'grave' ? 1 : 0,
                moderada: event.severity === 'moderada' ? 1 : 0,
                leve: event.severity === 'leve' ? 1 : 0
            },
            frequency: 1, // Se actualizará al final con eventIds.size
            vehicleIds: [event.vehicleId],
            lastOccurrence: event.timestamp,
            dominantSeverity: event.severity || 'leve'
        };

        usedEvents.add(i);

        // Buscar eventos cercanos
        events.forEach((otherEvent, j) => {
            if (usedEvents.has(j)) return;

            const distance = calculateDistance(
                event.lat,
                event.lng,
                otherEvent.lat,
                otherEvent.lng
            );

            // MANDAMIENTO M5.1: Radio en metros
            if (distance <= radiusMeters) {
                cluster.events.push(otherEvent);
                eventIds.add(otherEvent.id); // ✅ Añadir ID único

                const severity = otherEvent.severity || 'leve';
                cluster.severity_counts[severity as keyof typeof cluster.severity_counts] =
                    (cluster.severity_counts[severity as keyof typeof cluster.severity_counts] || 0) + 1;

                if (!cluster.vehicleIds.includes(otherEvent.vehicleId)) {
                    cluster.vehicleIds.push(otherEvent.vehicleId);
                }

                if (new Date(otherEvent.timestamp) > new Date(cluster.lastOccurrence)) {
                    cluster.lastOccurrence = otherEvent.timestamp;
                    cluster.location = otherEvent.location || cluster.location;
                }

                usedEvents.add(j);
            }
        });

        // Calcular centro del cluster (promedio de coordenadas)
        cluster.lat = cluster.events.reduce((sum: number, e: any) => sum + e.lat, 0) / cluster.events.length;
        cluster.lng = cluster.events.reduce((sum: number, e: any) => sum + e.lng, 0) / cluster.events.length;

        // ✅ MANDAMIENTO M5.2: Frecuencia = número de IDs únicos
        cluster.frequency = eventIds.size;

        // Determinar severidad dominante
        const maxSeverity = Object.entries(cluster.severity_counts)
            .reduce((max, [severity, count]) => (count as number) > max.count ? { severity, count: count as number } : max, { severity: 'leve', count: 0 });

        cluster.dominantSeverity = maxSeverity.severity;

        clusters.push(cluster);
    });

    return clusters;
}

/**
 * GET /api/hotspots/critical-points
 * Obtiene puntos negros (zonas críticas) con clustering
 * ACTUALIZADO: Usa eventDetector con índice SI
 */
router.get('/critical-points', async (req, res) => {
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

        logger.info('Obteniendo puntos críticos con eventDetector', { organizationId, severityFilter, minFrequency, clusterRadius, from, to, vehicleIds });

        const { prisma } = await import('../config/prisma');

        // ✅ LEER EVENTOS DESDE BD filtrando por timestamp, organización y vehículos
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
        } else if (vehicleIds && vehicleIds.length > 0) {
            eventosDB = await prisma.$queryRaw`
                SELECT 
                    se.id, se.lat, se.lon, se.timestamp, se.type, se.details, se."rotativoState",
                    s."vehicleId", v.name as "vehicleName", v.identifier as "vehicleIdentifier"
                FROM stability_events se
                JOIN "Session" s ON se."session_id" = s.id
                JOIN "Vehicle" v ON s."vehicleId" = v.id
                WHERE se.lat != 0 AND se.lon != 0
                AND s."organizationId" = ${organizationId}
                AND s."vehicleId" = ANY(${vehicleIds})
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

        logger.info(`📍 Eventos encontrados en BD: ${eventosDB.length}`);

        // Convertir eventos a formato del endpoint
        const eventos = eventosDB.map(e => {
            const details = e.details as any || {};
            // ✅ CORREGIDO: El SI está en details.valores.si, no en details.si
            const si = details.valores?.si || details.si || 0;

            // Calcular severidad basada en SI
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
                eventType: e.type,
                severity,
                si,
                rotativo: e.rotativoState === 1,
                location: `${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`,
                descripcion: e.type
            };
        });

        logger.info(`📍 Eventos procesados: ${eventos.length}`);

        // Aplicar filtro de rotativo
        let filteredEvents = eventos;
        if (rotativoFilter !== 'all') {
            if (rotativoFilter === 'on') {
                filteredEvents = eventos.filter(e => e.rotativo);
            } else if (rotativoFilter === 'off') {
                filteredEvents = eventos.filter(e => !e.rotativo);
            }
        }

        // Aplicar filtro de severidad
        if (severityFilter !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.severity === severityFilter);
        }

        // Realizar clustering (o forzar modo individual)
        let clusters = mode === 'single' ? [] : clusterEvents(filteredEvents, clusterRadius);

        // Filtrar por frecuencia mínima (si hay clustering)
        let filteredClusters = mode === 'single'
            ? []
            : clusters.filter(cluster => cluster.frequency >= minFrequency);

        // Fallback: si no hay clusters pero sí eventos, mostrar eventos individuales como clusters
        if ((filteredClusters.length === 0 || mode === 'single') && filteredEvents.length > 0) {
            logger.warn('[Hotspots] Sin clusters con los parámetros actuales; usando fallback de eventos individuales', {
                filteredEvents: filteredEvents.length,
                clusterRadius,
                minFrequency
            });

            filteredClusters = filteredEvents.map((e, idx) => ({
                id: `single_${idx}`,
                lat: e.lat,
                lng: e.lng,
                location: e.location,
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
            }));
        }

        // Fallback 2: si no hay eventos de estabilidad, intentar con excesos de velocidad como puntos críticos
        if (eventos.length === 0 && filteredClusters.length === 0) {
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

        logger.info(`Clusters creados: ${filteredClusters.length} de ${eventos.length} eventos`);

        res.json({
            success: true,
            data: {
                clusters: filteredClusters,
                total_events: eventos.length,
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
 */
router.get('/ranking', async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string || 'default-org';
        const limit = parseInt(req.query.limit as string) || 10;
        const severityFilter = req.query.severity as string || 'all';
        const rotativoFilter = req.query.rotativoOn as string || 'all';
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        logger.info('Obteniendo ranking de hotspots con eventDetector', { organizationId, limit });

        const { prisma } = await import('../config/prisma');

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

        logger.info(`📍 Buscando eventos para ranking en ${sessionIds.length} sesiones`);

        // ✅ LEER EVENTOS DESDE BD (NO recalcular)
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

        logger.info(`📍 Eventos encontrados para ranking: ${eventosDB.length}`);

        // Convertir eventos a formato del endpoint
        const eventos = eventosDB.map(e => {
            const details = e.details as any || {};
            // ✅ CORREGIDO: El SI está en details.valores.si, no en details.si
            const si = details.valores?.si || details.si || 0;

            // Calcular severidad basada en SI
            let severity = 'leve';
            if (si < 0.20) severity = 'grave';
            else if (si < 0.35) severity = 'moderada';

            return {
                lat: e.lat,
                lng: e.lon,
                severity,
                timestamp: e.timestamp,
                eventType: e.type,
                rotativo: e.rotativoState === 1,
                location: `${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`
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
