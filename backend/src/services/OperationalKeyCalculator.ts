/**
 * 🔑 GENERADOR DE CLAVES OPERACIONALES
 * 
 * Analiza datos de rotativo y genera claves operacionales.
 * 
 * CLAVES OPERACIONALES:
 * - Clave 0: TALLER - Parado en taller
 * - Clave 1: PARQUE - Operativo en parque
 * - Clave 2: EMERGENCIA - Salida en emergencia
 * - Clave 3: INCENDIO - En incendio/emergencia
 * - Clave 5: REGRESO - Regreso al parque
 * 
 * @version 2.0
 * @date 2025-11-05
 */

import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const KEY_TYPE_NAMES: Record<number, string> = {
    0: 'TALLER',
    1: 'PARQUE',
    2: 'EMERGENCIA',
    3: 'INCENDIO',
    5: 'REGRESO'
};

export interface OperationalSegment {
    sessionId: string;
    clave: number;
    startTime: Date;
    endTime: Date;
}

/**
 * Genera segmentos operacionales para una sesión con correlación GPS + geocercas
 * Detecta TODAS las claves (0-5) usando velocidad, posición y rotativo
 * @param sessionId - ID de la sesión
 * @returns Lista de segmentos generados
 */
export async function generateOperationalSegments(sessionId: string): Promise<OperationalSegment[]> {
    logger.info('🔑 Generando segmentos operacionales con correlación GPS', { sessionId });

    // 1. Verificar si ya existen segmentos
    const existing = await prisma.$queryRaw`
        SELECT id FROM operational_state_segments 
        WHERE "sessionId"::text = ${sessionId}
        LIMIT 1
    ` as any[];

    if (existing.length > 0) {
        logger.warn('⚠️ Segmentos ya existen para esta sesión, saltando creación', { sessionId });
        // Retornar segmentos existentes
        const existingSegments = await prisma.$queryRaw`
            SELECT clave, "startTime", "endTime"
            FROM operational_state_segments
            WHERE "sessionId"::text = ${sessionId}
            ORDER BY "startTime" ASC
        ` as any[];
        
        return existingSegments.map((s: any) => ({
            sessionId,
            clave: s.clave,
            startTime: s.startTime,
            endTime: s.endTime
        }));
    }

    // 2. Correlacionar rotativo con GPS usando SQL LATERAL (optimizado)
    logger.info('📊 Correlacionando rotativo con GPS usando SQL LATERAL...');
    
    const correlatedData = await prisma.$queryRaw`
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
    ` as any[];

    if (correlatedData.length === 0) {
        logger.warn('⚠️ Sin datos correlacionados para generar segmentos', { sessionId });
        throw new Error('Sin datos de rotativo o GPS');
    }

    logger.info(`📊 ${correlatedData.length} puntos correlacionados rotativo-GPS`);

    // 3. Función simplificada para detectar si está en parque (sin importar emergencyDetector)
    async function estaEnParqueBase(lat: number, lon: number): Promise<boolean> {
        // Por ahora, retornar false para evitar dependencia de emergencyDetector
        // TODO: Implementar detección real de geocercas cuando se arregle emergencyDetector.ts
        return false;
    }

    // 4. Generar segmentos con lógica completa (claves 0-5)
    const segments: OperationalSegment[] = [];
    let currentSegment: OperationalSegment | null = null;

    // Cache de geocercas para evitar queries repetidas
    const parqueCache = new Map<string, boolean>();

    for (const row of correlatedData) {
        const velocidad = Number(row.speed) || 0;
        const lat = Number(row.latitude) || 0;
        const lon = Number(row.longitude) || 0;
        const rotativoState = row.rot_state;
        
        // Verificar si está en parque (con cache)
        const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
        let enParque = false;
        
        if (parqueCache.has(key)) {
            enParque = parqueCache.get(key)!;
        } else if (lat !== 0 && lon !== 0) {
            try {
                enParque = await estaEnParqueBase(lat, lon);
                parqueCache.set(key, enParque);
            } catch (e) {
                enParque = false;
                parqueCache.set(key, false);
            }
        }
        
        // Determinar clave con lógica completa (0-5)
        const clave = await determinarClaveCompleta(
            rotativoState,
            velocidad,
            enParque
        );

        // Generar segmento
        if (!currentSegment || currentSegment.clave !== clave) {
            // Cerrar segmento anterior
            if (currentSegment) {
                currentSegment.endTime = row.rot_timestamp;
                segments.push(currentSegment);
            }

            // Iniciar nuevo segmento
            currentSegment = {
                sessionId,
                clave,
                startTime: row.rot_timestamp,
                endTime: row.rot_timestamp
            };
        } else {
            // Extender segmento actual
            currentSegment.endTime = row.rot_timestamp;
        }
    }

    // Cerrar último segmento
    if (currentSegment) {
        segments.push(currentSegment);
    }

    logger.info(`✅ ${segments.length} segmentos generados con claves 0-5`);

    // 5. Filtrar segmentos muy cortos (< 5 segundos)
    const segmentosValidos = segments.filter(s => {
        const duracion = (s.endTime.getTime() - s.startTime.getTime()) / 1000;
        return duracion >= 5;
    });

    logger.info(`✅ ${segmentosValidos.length} segmentos válidos (>= 5s)`);

    // Log de distribución de claves detectadas
    const distribucion = segmentosValidos.reduce((acc: any, s) => {
        acc[s.clave] = (acc[s.clave] || 0) + 1;
        return acc;
    }, {});
    logger.info('📊 Distribución de claves:', distribucion);

    // 6. Guardar en BD
    if (segmentosValidos.length > 0) {
        for (const segment of segmentosValidos) {
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
            count: segmentosValidos.length
        });
    }

    return segmentosValidos;
}

/**
 * Determina la clave operacional con lógica completa (claves 0-5)
 * Usa rotativo + velocidad + ubicación para detección precisa
 * 
 * @param rotativoState - Estado del rotativo ('0', '1', '2')
 * @param velocidad - Velocidad en km/h del GPS correlacionado
 * @param enParque - Si está dentro de geocerca de parque
 * @returns Clave operacional (0-5)
 */
async function determinarClaveCompleta(
    rotativoState: string,
    velocidad: number,
    enParque: boolean
): Promise<number> {
    const rotativoOn = rotativoState === '1' || rotativoState === '2';
    const enMovimiento = velocidad >= 5; // km/h umbral para considerar movimiento

    // ============================================================================
    // REGLAS DE DOMINIO BOMBEROS (CLAVES 0-5)
    // ============================================================================

    // CLAVE 0: TALLER - Mantenimiento/fuera de servicio
    // En parque + parado + rotativo puede estar ON o OFF
    if (enParque && !enMovimiento && rotativoOn) {
        return 0; // TALLER (en parque, parado, con algún sistema activo)
    }

    // CLAVE 1: PARQUE - Disponible en base, listo para salida
    // En parque + parado + rotativo OFF
    if (enParque && !enMovimiento && !rotativoOn) {
        return 1; // PARQUE (operativo en base, esperando)
    }

    // CLAVE 2: EMERGENCIA - Desplazamiento a incidente (IDA)
    // Movimiento + rotativo ON
    if (enMovimiento && rotativoOn) {
        return 2; // EMERGENCIA (yendo hacia el incidente)
    }

    // CLAVE 3: INCENDIO - En intervención directa (EN INCIDENCIA)
    // Parado + rotativo ON (fuera del parque)
    if (!enMovimiento && rotativoOn && !enParque) {
        return 3; // INCENDIO (parado en la incidencia, trabajando)
    }

    // CLAVE 5: REGRESO - Retorno a base (VUELTA)
    // Movimiento + rotativo OFF
    if (enMovimiento && !rotativoOn) {
        return 5; // REGRESO (volviendo a la base)
    }

    // CLAVE 4: SIN DATOS / Indeterminado
    // Cualquier otro caso (gap temporal, datos inválidos, etc.)
    return 4; // SIN DATOS
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
            clave4: 0,
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
        clave4: number;
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

