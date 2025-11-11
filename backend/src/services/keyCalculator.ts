import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    GPS_SAMPLE_INTERVAL: 1, // 1 segundo
    VELOCIDAD_PARADO: 5, // km/h
    TIEMPO_MIN_PARADO: 300 // 5 minutos en segundos
};

// ============================================================================
// TIPOS
// ============================================================================

interface TiemposPorClave {
    clave0_segundos: number;
    clave0_formateado: string;
    clave1_segundos: number;
    clave1_formateado: string;
    clave2_segundos: number;
    clave2_formateado: string;
    clave3_segundos: number;
    clave3_formateado: string;
    clave5_segundos: number;
    clave5_formateado: string;
    total_segundos: number;
    total_formateado: string;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

function crearTiemposVacios(): TiemposPorClave {
    return {
        clave0_segundos: 0,
        clave0_formateado: '00:00:00',
        clave1_segundos: 0,
        clave1_formateado: '00:00:00',
        clave2_segundos: 0,
        clave2_formateado: '00:00:00',
        clave3_segundos: 0,
        clave3_formateado: '00:00:00',
        clave5_segundos: 0,
        clave5_formateado: '00:00:00',
        total_segundos: 0,
        total_formateado: '00:00:00'
    };
}

// ============================================================================
// FUNCIÓN PRINCIPAL - USAR SEGMENTOS PERSISTIDOS
// ============================================================================

export async function calcularTiemposPorClave(
    sessionIds: string[],
    from?: Date | string,
    to?: Date | string
): Promise<TiemposPorClave> {
    try {
        const dateFrom = from ? new Date(from) : undefined;
        const dateTo = to ? new Date(to) : undefined;

        // Importar prisma dinámicamente

        // ✅ MANDAMIENTO M2: Usar segmentos persistidos en lugar de calcular en tiempo real
        const segmentosWhere: any = { sessionId: { in: sessionIds } };
        if (dateFrom && dateTo) {
            segmentosWhere.startTime = { gte: dateFrom, lte: dateTo };
        }

        // Usar consulta SQL directa debido a problemas con el modelo de Prisma
        let segmentos: any[];

        if (dateFrom && dateTo) {
            segmentos = await prisma.$queryRaw`
                SELECT clave, "startTime", "endTime" 
                FROM operational_state_segments 
                WHERE "sessionId"::text = ANY(${sessionIds}::text[])
                AND "startTime" >= ${dateFrom}::timestamp
                AND "startTime" <= ${dateTo}::timestamp
            `;
        } else {
            segmentos = await prisma.$queryRaw`
                SELECT clave, "startTime", "endTime" 
                FROM operational_state_segments 
                WHERE "sessionId"::text = ANY(${sessionIds}::text[])
            `;
        }

        if (segmentos.length === 0) {
            logger.warn('⚠️ No hay segmentos operacionales persistidos, retornando tiempos vacíos');
            return crearTiemposVacios();
        }

        logger.info(`📊 Procesando ${segmentos.length} segmentos operacionales`);

        // Calcular tiempos desde segmentos persistidos
        const tiempos = {
            clave0: 0,
            clave1: 0,
            clave2: 0,
            clave3: 0,
            clave5: 0
        } as Record<'clave0' | 'clave1' | 'clave2' | 'clave3' | 'clave5', number>;

        segmentos.forEach((segmento: any) => {
            const duracionSegundos = (segmento.endTime.getTime() - segmento.startTime.getTime()) / 1000;
            const clave = Number(segmento.clave);
            const key = clave === 4 ? 'clave5' : (`clave${clave}` as keyof typeof tiempos);

            if (!(key in tiempos)) {
                logger.warn('⚠️ Segmento con clave desconocida detectado, reasignando a clave5', {
                    clave,
                    sessionIds
                });
                tiempos.clave5 += duracionSegundos;
                return;
            }

            tiempos[key] += duracionSegundos;
        });

        logger.info('🔍 DEBUG: Tiempos por clave calculados:', {
            clave0: tiempos.clave0,
            clave1: tiempos.clave1,
            clave2: tiempos.clave2,
            clave3: tiempos.clave3,
            clave5: tiempos.clave5
        });

        const totalSegundos = tiempos.clave0 + tiempos.clave1 + tiempos.clave2 + tiempos.clave3 + tiempos.clave5;

        logger.info(`✅ Tiempos calculados desde segmentos: ${totalSegundos}s total`);

        return {
            clave0_segundos: tiempos.clave0,
            clave0_formateado: formatearTiempo(tiempos.clave0),
            clave1_segundos: tiempos.clave1,
            clave1_formateado: formatearTiempo(tiempos.clave1),
            clave2_segundos: tiempos.clave2,
            clave2_formateado: formatearTiempo(tiempos.clave2),
            clave3_segundos: tiempos.clave3,
            clave3_formateado: formatearTiempo(tiempos.clave3),
            clave5_segundos: tiempos.clave5,
            clave5_formateado: formatearTiempo(tiempos.clave5),
            total_segundos: totalSegundos,
            total_formateado: formatearTiempo(totalSegundos)
        };

    } catch (error) {
        logger.error('Error calculando tiempos por clave', error);
        return crearTiemposVacios();
    }
}
