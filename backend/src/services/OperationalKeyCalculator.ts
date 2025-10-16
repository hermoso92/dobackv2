/**
 * 🔑 GENERADOR DE SEGMENTOS OPERACIONALES
 * 
 * Analiza datos de rotativo y genera segmentos por clave operacional.
 * 
 * CLAVES OPERACIONALES:
 * - Clave 0: Parado con motor apagado
 * - Clave 1: Motor encendido, parado
 * - Clave 2: En movimiento con rotativo ON (actividad operativa)
 * - Clave 3: En movimiento con rotativo OFF (traslado)
 * - Clave 4-5: Reservados
 * 
 * @version 1.0
 * @date 2025-10-15
 */

import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface OperationalSegment {
    sessionId: string;
    clave: number;
    startTime: Date;
    endTime: Date;
}

/**
 * Genera segmentos operacionales para una sesión
 * @param sessionId - ID de la sesión
 * @returns Lista de segmentos generados
 */
export async function generateOperationalSegments(sessionId: string): Promise<OperationalSegment[]> {
    logger.info('🔑 Generando segmentos operacionales', { sessionId });

    // 1. Obtener mediciones de rotativo
    const rotativoData = await prisma.rotativoMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });

    if (rotativoData.length === 0) {
        logger.warn('⚠️ Sin datos de rotativo para generar segmentos', { sessionId });
        throw new Error('Sin datos de rotativo');
    }

    logger.info(`📊 Procesando ${rotativoData.length} mediciones de rotativo`);

    // 2. Generar segmentos basados en cambios de estado
    const segments: OperationalSegment[] = [];
    let currentSegment: OperationalSegment | null = null;

    for (let i = 0; i < rotativoData.length; i++) {
        const measurement = rotativoData[i];
        const clave = determinarClave(measurement.state);

        if (!currentSegment || currentSegment.clave !== clave) {
            // Cerrar segmento anterior
            if (currentSegment) {
                currentSegment.endTime = measurement.timestamp;
                segments.push(currentSegment);
            }

            // Iniciar nuevo segmento
            currentSegment = {
                sessionId,
                clave,
                startTime: measurement.timestamp,
                endTime: measurement.timestamp
            };
        } else {
            // Extender segmento actual
            currentSegment.endTime = measurement.timestamp;
        }
    }

    // Cerrar último segmento
    if (currentSegment) {
        segments.push(currentSegment);
    }

    logger.info(`✅ ${segments.length} segmentos detectados`);

    // 3. Filtrar segmentos muy cortos (< 5 segundos)
    const segmentosValidos = segments.filter(s => {
        const duracion = (s.endTime.getTime() - s.startTime.getTime()) / 1000;
        return duracion >= 5;
    });

    logger.info(`✅ ${segmentosValidos.length} segmentos válidos (>= 5s)`);

    // 4. Guardar en BD
    if (segmentosValidos.length > 0) {
        // Verificar si ya existen segmentos para esta sesión
        const existing = await prisma.$queryRaw`
            SELECT id FROM operational_state_segments 
            WHERE "sessionId"::text = ${sessionId}
            LIMIT 1
        `;

        if ((existing as any[]).length > 0) {
            logger.warn('⚠️ Segmentos ya existen para esta sesión, saltando creación', {
                sessionId
            });
            return segmentosValidos;
        }

        // Usar raw query para insertar
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
 * Determina la clave operacional según el estado del rotativo
 * @param rotativoState - Estado del rotativo ('0', '1', '2')
 * @returns Clave operacional (0-5)
 */
function determinarClave(rotativoState: string): number {
    // Mapeo simplificado:
    // - Rotativo ON (1, 2) → Clave 2 (en movimiento con rotativo)
    // - Rotativo OFF (0) → Clave 3 (en movimiento sin rotativo)

    // TODO: Mejorar lógica con datos CAN (velocidad, motor, etc.)
    // Para determinar claves 0, 1, 4, 5

    if (rotativoState === '1' || rotativoState === '2') {
        return 2; // En movimiento con rotativo ON
    }

    return 3; // En movimiento sin rotativo
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
