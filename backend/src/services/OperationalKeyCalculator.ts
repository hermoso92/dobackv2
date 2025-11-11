/**
 * 🔑 GENERADOR DE CLAVES OPERACIONALES
 *
 * Analiza datos de rotativo y genera claves operacionales correlacionando GPS + geocercas.
 *
 * CLAVES OPERACIONALES:
 * - Clave 0: TALLER - Parado en taller
 * - Clave 1: PARQUE - Operativo en parque
 * - Clave 2: EMERGENCIA - Salida en emergencia
 * - Clave 3: INCENDIO - En intervención
 * - Clave 5: REGRESO - Regreso al parque o fin de actuación fuera de parque
 *
 * @version 3.0
 * @date 2025-11-10
 */

import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { haversineDistance } from './parsers/gpsUtils';

const KEY_TYPE_NAMES: Record<number, string> = {
    0: 'TALLER',
    1: 'PARQUE',
    2: 'EMERGENCIA',
    3: 'INCENDIO',
    5: 'REGRESO'
};

const OPERATIONAL_TIME_ZONE = 'Europe/Madrid';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

export interface OperationalSegment {
    sessionId: string;
    clave: number;
    startTime: Date;
    endTime: Date;
}

interface NormalizedGeofence {
    id: string;
    name: string;
    tag: string | null;
    centerLat: number;
    centerLon: number;
    radiusMeters: number;
}

interface GeofenceContext {
    enParque: boolean;
    enTaller: boolean;
    distanciaParqueActual: number;
}

interface DeterminacionClaveContext {
    enParque: boolean;
    enTaller: boolean;
    enMovimiento: boolean;
    velocidadKmh: number;
    rotativoOn: boolean;
    estabaEnParque: boolean;
    estabaEnClave3: boolean;
    fueraParqueSegundos: number;
    tiempoParadoConRotativoOn: number;
    distanciaParqueActual: number;
    distanciaParqueAnterior: number;
}

type RawGeofence = {
    id: string;
    name: string;
    tag: string | null;
    geometry: unknown;
    geometryCenter: unknown;
    geometryRadius: number | null;
};

const MOVEMENT_SPEED_THRESHOLD_KMH = 5;
const EMERGENCY_SPEED_THRESHOLD_KMH = 1;
const INCENDIO_STOP_THRESHOLD_SECONDS = 180;
const REGRESO_METERS_THRESHOLD = 20;
const MISSION_GAP_MAX_SECONDS = 4 * 3600; // 4 horas

/**
 * Genera segmentos operacionales para una sesión con correlación GPS + geocercas
 * Detecta TODAS las claves (0-5) usando velocidad, posición y rotativo
 * @param sessionId - ID de la sesión
 * @returns Lista de segmentos generados
 */
export async function generateOperationalSegments(sessionId: string): Promise<OperationalSegment[]> {
    logger.info('🔑 Generando segmentos operacionales con correlación GPS', { sessionId });

    // 1. Verificar si ya existen segmentos
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM operational_state_segments 
        WHERE "sessionId"::text = ${sessionId}
        LIMIT 1
    `;

    if (existing.length > 0) {
        logger.warn('⚠️ Segmentos ya existen para esta sesión, saltando creación', { sessionId });
        const existingSegments = await prisma.$queryRaw<Array<{
            clave: number;
            startTime: Date;
            endTime: Date;
        }>>`
            SELECT clave, "startTime", "endTime"
            FROM operational_state_segments
            WHERE "sessionId"::text = ${sessionId}
            ORDER BY "startTime" ASC
        `;

        return existingSegments.map(s => ({
            sessionId,
            clave: s.clave,
            startTime: s.startTime,
            endTime: s.endTime
        }));
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { organizationId: true }
    });

    if (!session?.organizationId) {
        logger.warn('⚠️ Sesión sin organización asociada', { sessionId });
        throw new Error('Sesión sin organización asociada');
    }

    const geofencesRaw = await prisma.geofence.findMany({
        where: {
            organizationId: session.organizationId,
            enabled: true
        },
        select: {
            id: true,
            name: true,
            tag: true,
            geometry: true,
            geometryCenter: true,
            geometryRadius: true
        }
    });

    const normalizedGeofences = normalizarGeocercas(geofencesRaw);
    const parques = normalizedGeofences.filter(g => g.tag === 'PARQUE');
    const talleres = normalizedGeofences.filter(g => g.tag === 'TALLER');

    logger.debug('📍 Geocercas normalizadas', {
        sessionId,
        parques: parques.length,
        talleres: talleres.length
    });

    // 2. Correlacionar rotativo con GPS usando SQL LATERAL (optimizado)
    logger.info('📊 Correlacionando rotativo con GPS usando SQL LATERAL...');
    
    const correlatedData = await prisma.$queryRaw<Array<{
        rot_timestamp: Date;
        rot_state: string;
        latitude: number;
        longitude: number;
        speed: number;
        gps_timestamp: Date;
    }>>`
        SELECT 
            r.timestamp as rot_timestamp,
            r.state as rot_state,
            gps.latitude,
            gps.longitude,
            gps.speed,
            gps.timestamp as gps_timestamp,
            ABS(EXTRACT(EPOCH FROM (r.timestamp - gps.timestamp))) as time_diff_sec
        FROM "RotativoMeasurement" r
        CROSS JOIN LATERAL (
            SELECT latitude, longitude, speed, timestamp
            FROM "GpsMeasurement"
            WHERE "sessionId" = ${sessionId}
            ORDER BY ABS(EXTRACT(EPOCH FROM (timestamp - r.timestamp)))
            LIMIT 1
        ) gps
        WHERE r."sessionId" = ${sessionId}
        ORDER BY r.timestamp ASC
    `;

    if (correlatedData.length === 0) {
        logger.warn('⚠️ Sin datos correlacionados para generar segmentos', { sessionId });
        throw new Error('Sin datos de rotativo o GPS');
    }

    logger.info(`📊 ${correlatedData.length} puntos correlacionados rotativo-GPS`);

    // 3. Generar segmentos con lógica completa (claves 0-5)
    const segments: OperationalSegment[] = [];
    let currentSegment: OperationalSegment | null = null;

    let estabaEnParque = false;
    let estabaEnClave3 = false;
    let distanciaParqueAnterior = Number.POSITIVE_INFINITY;
    let tiempoParadoConRotativoOn = 0;
    let fueraParqueSegundos = 0;
    let previousTimestamp: Date | null = null;

    for (const row of correlatedData) {
        const velocidad = Number(row.speed) || 0;
        const lat = Number(row.latitude) || 0;
        const lon = Number(row.longitude) || 0;
        const rotativoState = row.rot_state;
        const timestampActual: Date = row.rot_timestamp;

        const deltaSeconds = previousTimestamp
            ? Math.max(0, (timestampActual.getTime() - previousTimestamp.getTime()) / 1000)
            : 0;
        previousTimestamp = timestampActual;

        const geofenceContext = obtenerContextoGeocercas(lat, lon, parques, talleres);
        const enMovimiento = velocidad >= MOVEMENT_SPEED_THRESHOLD_KMH;
        const rotativoOn = rotativoState === '1' || rotativoState === '2';

        if (!enMovimiento && rotativoOn) {
            tiempoParadoConRotativoOn += deltaSeconds;
        } else {
            tiempoParadoConRotativoOn = 0;
        }

        if (!geofenceContext.enParque) {
            fueraParqueSegundos += deltaSeconds;
        } else {
            fueraParqueSegundos = 0;
        }

        const clave = determinarClavePrioritaria({
            enParque: geofenceContext.enParque,
            enTaller: geofenceContext.enTaller,
            enMovimiento,
            velocidadKmh: velocidad,
            rotativoOn,
            estabaEnParque,
            estabaEnClave3,
            fueraParqueSegundos,
            tiempoParadoConRotativoOn,
            distanciaParqueActual: geofenceContext.distanciaParqueActual,
            distanciaParqueAnterior
        });

        if (!currentSegment || currentSegment.clave !== clave) {
            if (currentSegment) {
                currentSegment.endTime = timestampActual;
                segments.push(currentSegment);
                logger.debug('🔚 Cerrando segmento operacional', {
                    sessionId,
                    clave: currentSegment.clave,
                    startTime: currentSegment.startTime,
                    endTime: currentSegment.endTime
                });
            }

            currentSegment = {
                sessionId,
                clave,
                startTime: timestampActual,
                endTime: timestampActual
            };

            logger.debug('🚦 Nuevo segmento operacional', {
                sessionId,
                clave,
                motivo: KEY_TYPE_NAMES[clave] || `CLAVE_${clave}`,
                enParque: geofenceContext.enParque,
                enTaller: geofenceContext.enTaller,
                enMovimiento,
                rotativoOn,
                fueraParqueSegundos,
                tiempoParadoConRotativoOn
            });
        } else {
            currentSegment.endTime = timestampActual;
        }

        estabaEnParque = geofenceContext.enParque;
        estabaEnClave3 = clave === 3;
        distanciaParqueAnterior = geofenceContext.distanciaParqueActual;
    }

    if (currentSegment) {
        segments.push(currentSegment);
    }

    logger.info(`✅ ${segments.length} segmentos generados con claves 0-5`);

    const segmentosNormalizados = segments.flatMap(segment => splitSegmentAcrossMidnights(segment));

    if (segmentosNormalizados.length !== segments.length) {
        logger.info('🕛 Segmentos ajustados a medianoche', {
            originales: segments.length,
            normalizados: segmentosNormalizados.length
        });
    }

    const segmentosValidos = segmentosNormalizados.filter(s => {
        const duracion = (s.endTime.getTime() - s.startTime.getTime()) / 1000;
        return duracion >= 5;
    });

    const segmentosInferidos = applyMissionInference(segmentosValidos);

    if (segmentosInferidos.length !== segmentosValidos.length) {
        logger.info('🧩 Segmentos inferidos añadidos', {
            originales: segmentosValidos.length,
            conInferencia: segmentosInferidos.length
        });
    }

    logger.info(`✅ ${segmentosInferidos.length} segmentos válidos (>= 5s)`);

    const segmentosOrdenados = sortSegmentsByStart(segmentosInferidos);

    const distribucion = segmentosOrdenados.reduce<Record<number, number>>((acc, s) => {
        acc[s.clave] = (acc[s.clave] || 0) + 1;
        return acc;
    }, {});
    logger.info('📊 Distribución de claves:', distribucion);

    if (segmentosOrdenados.length > 0) {
        for (const segment of segmentosOrdenados) {
            await prisma.$executeRaw`
                INSERT INTO operational_state_segments (id, "sessionId", clave, "startTime", "endTime", "durationSeconds", "createdAt", "updatedAt")
                VALUES (
                    (gen_random_uuid())::text, 
                    ${sessionId}, 
                    ${segment.clave}, 
                    ${segment.startTime}, 
                    ${segment.endTime},
                    EXTRACT(EPOCH FROM (${segment.endTime} - ${segment.startTime}))::int,
                    NOW(),
                    NOW()
                )
            `;
        }

        logger.info('✅ Segmentos operacionales guardados en BD', {
            sessionId,
            count: segmentosOrdenados.length
        });
    }

    return segmentosOrdenados;
}

function splitSegmentAcrossMidnights(segment: OperationalSegment): OperationalSegment[] {
    if (!segment.endTime || segment.endTime <= segment.startTime) {
        return [segment];
    }

    const boundaries = collectMidnightBoundaries(segment.startTime, segment.endTime);

    if (boundaries.length === 0) {
        return [segment];
    }

    const parts: OperationalSegment[] = [];
    let currentStart = segment.startTime;

    for (const boundary of boundaries) {
        if (boundary <= currentStart || boundary >= segment.endTime) {
            continue;
        }

        parts.push({
            sessionId: segment.sessionId,
            clave: segment.clave,
            startTime: currentStart,
            endTime: boundary
        });
        currentStart = boundary;
    }

    parts.push({
        sessionId: segment.sessionId,
        clave: segment.clave,
        startTime: currentStart,
        endTime: segment.endTime
    });

    return parts;
}

function collectMidnightBoundaries(start: Date, end: Date): Date[] {
    if (!end || end <= start) {
        return [];
    }

    const boundaries: Date[] = [];
    const startLocal = formatLocalDate(start);
    const endLocal = formatLocalDate(end);

    if (startLocal === endLocal) {
        return boundaries;
    }

    let cursorLocal = startLocal;

    while (true) {
        cursorLocal = incrementLocalDate(cursorLocal);
        const boundary = getUtcMidnightForLocalDate(cursorLocal);

        if (boundary >= end) {
            break;
        }

        if (boundary > start) {
            boundaries.push(boundary);
        }

        if (cursorLocal >= endLocal) {
            break;
        }
    }

    return boundaries;
}

function formatLocalDate(date: Date): string {
    return dateFormatter.format(date);
}

function incrementLocalDate(localDate: string): string {
    const [year, month, day] = localDate.split('-').map(Number);
    const tentative = new Date(Date.UTC(year, month - 1, day, 12));
    tentative.setUTCDate(tentative.getUTCDate() + 1);
    return dateFormatter.format(tentative);
}

function getUtcMidnightForLocalDate(localDate: string): Date {
    const [year, month, day] = localDate.split('-').map(Number);
    const approximateUtc = new Date(Date.UTC(year, month - 1, day));
    const offset = getTimezoneOffsetMilliseconds(approximateUtc);
    return new Date(approximateUtc.getTime() - offset);
}

function getTimezoneOffsetMilliseconds(date: Date): number {
    const parts = dateTimeFormatter.formatToParts(date);
    const map: Record<string, string> = {};

    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    }

    const year = Number(map.year);
    const month = Number(map.month);
    const day = Number(map.day);
    const hour = Number(map.hour);
    const minute = Number(map.minute);
    const second = Number(map.second);

    const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    return asUTC - date.getTime();
}

function normalizarGeocercas(geocercas: RawGeofence[]): NormalizedGeofence[] {
    const result: NormalizedGeofence[] = [];

    for (const geocerca of geocercas) {
        const geometry = parseJsonValue<any>(geocerca.geometry);
        const geometryCenter = parseJsonValue<any>(geocerca.geometryCenter);

        const { centerLat, centerLon, radiusMeters } = resolverCentroYRadio(
            geometry,
            geometryCenter,
            geocerca.geometryRadius
        );

        if (
            centerLat === null ||
            centerLon === null ||
            radiusMeters === null ||
            radiusMeters <= 0
        ) {
            continue;
        }

        result.push({
            id: geocerca.id,
            name: geocerca.name,
            tag: geocerca.tag ? geocerca.tag.toUpperCase() : null,
            centerLat,
            centerLon,
            radiusMeters
        });
    }

    return result;
}

function resolverCentroYRadio(
    geometry: any,
    geometryCenter: any,
    geometryRadius: number | null
): { centerLat: number | null; centerLon: number | null; radiusMeters: number | null } {
    const centro = extraerCentro(geometryCenter) || extraerCentro(geometry);
    if (!centro) {
        return { centerLat: null, centerLon: null, radiusMeters: null };
    }

    let radius = numeroValido(geometryRadius) ? Number(geometryRadius) : null;
    if (!numeroValido(radius)) {
        radius = extraerRadio(geometry);
    }

    if (!numeroValido(radius) && geometry) {
        radius = estimarRadioDesdeGeometria(geometry, centro);
    }

    if (!numeroValido(radius)) {
        return { centerLat: centro.lat, centerLon: centro.lon, radiusMeters: null };
    }

    return { centerLat: centro.lat, centerLon: centro.lon, radiusMeters: radius! };
}

function parseJsonValue<T>(valor: unknown): T | null {
    if (valor === null || valor === undefined) {
        return null;
    }
    if (typeof valor === 'string') {
        try {
            return JSON.parse(valor) as T;
        } catch (error) {
            logger.warn('⚠️ No se pudo parsear JSON de geocerca', { error });
            return null;
        }
    }

    return valor as T;
}

function extraerCentro(origen: any): { lat: number; lon: number } | null {
    if (!origen) {
        return null;
    }

    if (typeof origen.lat === 'number' && typeof origen.lon === 'number') {
        return { lat: origen.lat, lon: origen.lon };
    }

    if (typeof origen.lat === 'number' && typeof origen.lng === 'number') {
        return { lat: origen.lat, lon: origen.lng };
    }

    if (typeof origen.latitude === 'number' && typeof origen.longitude === 'number') {
        return { lat: origen.latitude, lon: origen.longitude };
    }

    if (Array.isArray(origen.coordinates)) {
        const coords = origen.coordinates;
        if (
            origen.type &&
            typeof origen.type === 'string' &&
            origen.type.toLowerCase() === 'point' &&
            coords.length === 2 &&
            numeroValido(coords[0]) &&
            numeroValido(coords[1])
        ) {
            const [lon, lat] = coords;
            return { lat, lon };
        }

        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            const centroPoligono = calcularCentroPoligono(coords[0]);
            if (centroPoligono) {
                return centroPoligono;
            }
        }
    }

    if (origen.center && typeof origen.center === 'object') {
        return extraerCentro(origen.center);
    }

    return null;
}

function calcularCentroPoligono(coordinates: any[]): { lat: number; lon: number } | null {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        return null;
    }

    let sumLat = 0;
    let sumLon = 0;
    let count = 0;

    for (const punto of coordinates) {
        if (Array.isArray(punto) && punto.length >= 2) {
            const lon = Number(punto[0]);
            const lat = Number(punto[1]);

            if (numeroValido(lon) && numeroValido(lat)) {
                sumLat += lat;
                sumLon += lon;
                count++;
            }
        }
    }

    if (count === 0) {
        return null;
    }

    return {
        lat: sumLat / count,
        lon: sumLon / count
    };
}

function extraerRadio(origen: any): number | null {
    if (!origen || typeof origen !== 'object') {
        return null;
    }

    if (numeroValido(origen.radius)) {
        return Number(origen.radius);
    }

    if (numeroValido(origen.radiusMeters)) {
        return Number(origen.radiusMeters);
    }

    if (origen.type && typeof origen.type === 'string' && origen.type.toLowerCase() === 'circle') {
        if (origen.center && numeroValido(origen.center.radius)) {
            return Number(origen.center.radius);
        }
    }

    return null;
}

function estimarRadioDesdeGeometria(geometry: any, centro: { lat: number; lon: number }): number | null {
    if (!geometry || !Array.isArray(geometry.coordinates)) {
        return null;
    }

    const coords = geometry.coordinates;
    const puntos = Array.isArray(coords[0]) && !numeroValido(coords[0][0])
        ? coords[0]
        : coords;

    let maxDistancia = 0;
    let encontrado = false;

    for (const punto of puntos) {
        if (Array.isArray(punto) && punto.length >= 2) {
            const lon = Number(punto[0]);
            const lat = Number(punto[1]);
            if (numeroValido(lon) && numeroValido(lat)) {
                const distancia = haversineDistance(centro.lat, centro.lon, lat, lon);
                if (distancia > maxDistancia) {
                    maxDistancia = distancia;
                    encontrado = true;
                }
            }
        }
    }

    return encontrado ? maxDistancia : null;
}

function numeroValido(valor: unknown): valor is number {
    return typeof valor === 'number' && Number.isFinite(valor);
}

function obtenerContextoGeocercas(
    lat: number,
    lon: number,
    parques: NormalizedGeofence[],
    talleres: NormalizedGeofence[]
): GeofenceContext {
    if (!coordenadaValida(lat, lon)) {
        return {
            enParque: false,
            enTaller: false,
            distanciaParqueActual: Number.POSITIVE_INFINITY
        };
    }

    let distanciaParqueActual = Number.POSITIVE_INFINITY;
    let enParque = false;

    for (const parque of parques) {
        const distancia = haversineDistance(lat, lon, parque.centerLat, parque.centerLon);
        if (distancia < distanciaParqueActual) {
            distanciaParqueActual = distancia;
        }
        if (distancia <= parque.radiusMeters) {
            enParque = true;
        }
    }

    let enTaller = false;
    for (const taller of talleres) {
        const distancia = haversineDistance(lat, lon, taller.centerLat, taller.centerLon);
        if (distancia <= taller.radiusMeters) {
            enTaller = true;
            break;
        }
    }

    return {
        enParque,
        enTaller,
        distanciaParqueActual
    };
}

function coordenadaValida(lat: number, lon: number): boolean {
    return numeroValido(lat) &&
        numeroValido(lon) &&
        lat !== 0 &&
        lon !== 0 &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180;
}

function determinarClavePrioritaria(contexto: DeterminacionClaveContext): number {
    // Prioridad 0 > 1 > 2 > 3 > 5
    if (contexto.enTaller && !contexto.enMovimiento && !contexto.rotativoOn) {
        return 0;
    }

    if (contexto.enParque && !contexto.enMovimiento && !contexto.rotativoOn) {
        return 1;
    }

    const velocidad = contexto.velocidadKmh ?? 0;

    if (
        contexto.rotativoOn &&
        velocidad >= EMERGENCY_SPEED_THRESHOLD_KMH &&
        (!contexto.enParque || !contexto.estabaEnParque)
    ) {
        return 2;
    }

    const acercamientoAlParque =
        contexto.enMovimiento &&
        !contexto.rotativoOn &&
        contexto.distanciaParqueAnterior !== Number.POSITIVE_INFINITY &&
        contexto.distanciaParqueActual < contexto.distanciaParqueAnterior - REGRESO_METERS_THRESHOLD;

    if (
        !contexto.enMovimiento &&
        contexto.rotativoOn &&
        !contexto.enParque &&
        contexto.tiempoParadoConRotativoOn >= INCENDIO_STOP_THRESHOLD_SECONDS &&
        contexto.fueraParqueSegundos >= INCENDIO_STOP_THRESHOLD_SECONDS
    ) {
        return 3;
    }

    if (acercamientoAlParque) {
        return 5;
    }

    if (
        !contexto.rotativoOn &&
        contexto.estabaEnClave3 &&
        !contexto.enParque
    ) {
        return 5;
    }

    return contexto.enParque ? 1 : 5;
}

/**
 * Estadísticas de segmentos de una sesión
 */
export async function getSegmentStats(sessionId: string): Promise<SegmentStats> {
    const segments = await prisma.$queryRaw<any[]>`
        SELECT clave, "startTime", "endTime"
        FROM operational_state_segments
        WHERE "sessionId"::text = ${sessionId}
    `;

    const stats: SegmentStats = {
        total: segments.length,
        byKey: {
            clave0: 0,
            clave1: 0,
            clave2: 0,
            clave3: 0,
            clave5: 0
        },
        totalDuration: 0
    };

    for (const segment of segments) {
        const duration = (segment.endTime.getTime() - segment.startTime.getTime()) / 1000;
        stats.totalDuration += duration;

        const key = `clave${segment.clave}` as keyof typeof stats.byKey;
        stats.byKey[key]++;
    }

    return stats;
}

interface SegmentStats {
    total: number;
    byKey: {
        clave0: number;
        clave1: number;
        clave2: number;
        clave3: number;
        clave5: number;
    };
    totalDuration: number;
}
/**
 * Convierte segmentos operacionales en OperationalKey
 * Enriquece con datos GPS y geocercas
 */
export async function convertSegmentsToOperationalKeys(sessionId: string): Promise<number> {
    logger.info('🔑 Convirtiendo segmentos a OperationalKeys', { sessionId });

    try {
        // Verificar si ya existen OperationalKeys para esta sesión
        const existingKeys = await prisma.operationalKey.count({
            where: { sessionId }
        });

        if (existingKeys > 0) {
            logger.info(`⚠️ Ya existen ${existingKeys} OperationalKeys para esta sesión`, { sessionId });
            return existingKeys;
        }

        // Obtener segmentos de la sesión
        const segments = await prisma.$queryRaw<any[]>`
            SELECT id, clave, "startTime", "endTime", "durationSeconds"
            FROM operational_state_segments
            WHERE "sessionId"::text = ${sessionId}
            ORDER BY "startTime" ASC
        `;

        if (segments.length === 0) {
            logger.warn('⚠️ No hay segmentos operacionales para convertir', { sessionId });
            return 0;
        }

        logger.info(`📊 Procesando ${segments.length} segmentos operacionales`);

        // Obtener primer y último punto GPS de la sesión para geocercas
        const gpsData = await prisma.gpsMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            select: { timestamp: true, latitude: true, longitude: true }
        });

        // Crear OperationalKeys a partir de los segmentos
        let created = 0;
        for (const segment of segments) {
            // Buscar coordenadas inicio/fin del segmento
            const startGps = gpsData.find(g =>
                Math.abs(g.timestamp.getTime() - segment.startTime.getTime()) < 10000 // 10 seg tolerancia
            );
            const endGps = gpsData.find(g =>
                Math.abs(g.timestamp.getTime() - segment.endTime.getTime()) < 10000
            );

            // Detectar geocerca en punto de inicio (si hay coordenadas)
            let geofenceId: string | null = null;
            let geofenceName: string | null = null;

            if (startGps) {
                const geofence = await prisma.$queryRaw<any[]>`
                    SELECT id, name FROM "Geofence"
                    WHERE ST_Contains(
                        geometry,
                        ST_SetSRID(ST_MakePoint(${startGps.longitude}, ${startGps.latitude}), 4326)
                    )
                    LIMIT 1
                `;

                if (geofence && geofence.length > 0) {
                    geofenceId = geofence[0].id;
                    geofenceName = geofence[0].name;
                }
            }

            // Determinar estado del rotativo en ese momento
            const rotativoMeasurement = await prisma.rotativoMeasurement.findFirst({
                where: {
                    sessionId,
                    timestamp: {
                        gte: segment.startTime,
                        lte: segment.endTime
                    }
                },
                orderBy: { timestamp: 'asc' }
            });

            const rotativoState = rotativoMeasurement ?
                (rotativoMeasurement.state === '1' || rotativoMeasurement.state === '2') : false;

            // Crear OperationalKey
            await prisma.operationalKey.create({
                data: {
                    sessionId,
                    keyType: segment.clave,
                    keyTypeName: KEY_TYPE_NAMES[segment.clave] || `CLAVE_${segment.clave}`,
                    startTime: segment.startTime,
                    endTime: segment.endTime,
                    duration: segment.durationSeconds || Math.floor((segment.endTime.getTime() - segment.startTime.getTime()) / 1000),
                    startLat: startGps?.latitude || null,
                    startLon: startGps?.longitude || null,
                    endLat: endGps?.latitude || null,
                    endLon: endGps?.longitude || null,
                    rotativoState,
                    geofenceId,
                    geofenceName,
                    details: {
                        segmentId: segment.id,
                        hasGPS: !!startGps,
                        hasGeofence: !!geofenceName
                    }
                }
            });

            created++;
        }

        logger.info(`✅ ${created} OperationalKeys creados exitosamente`, { sessionId });
        return created;

    } catch (error: any) {
        logger.error('Error convirtiendo segmentos a OperationalKeys', { sessionId, error: error.message });
        throw error;
    }
}

function applyMissionInference(segments: OperationalSegment[]): OperationalSegment[] {
    if (segments.length === 0) {
        return segments;
    }

    const ordered = sortSegmentsByStart(segments);
    const inferred: OperationalSegment[] = [];

    for (let i = 0; i < ordered.length - 1; i++) {
        const current = ordered[i];
        const next = ordered[i + 1];

        if (current.clave !== 2 || next.clave !== 5) {
            continue;
        }

        const gapMs = next.startTime.getTime() - current.endTime.getTime();
        if (gapMs <= 5000 || gapMs <= 0) {
            continue;
        }

        const gapSeconds = gapMs / 1000;
        if (gapSeconds > MISSION_GAP_MAX_SECONDS) {
            continue;
        }

        inferred.push({
            sessionId: current.sessionId,
            clave: 3,
            startTime: current.endTime,
            endTime: next.startTime
        });
    }

    if (inferred.length === 0) {
        return segments;
    }

    const combined = [...segments, ...inferred];
    return sortSegmentsByStart(combined).filter(segment => {
        const durationSeconds = (segment.endTime.getTime() - segment.startTime.getTime()) / 1000;
        return durationSeconds >= 5;
    });
}

function sortSegmentsByStart(segments: OperationalSegment[]): OperationalSegment[] {
    return [...segments].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

