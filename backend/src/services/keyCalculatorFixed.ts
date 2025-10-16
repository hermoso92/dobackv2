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
    clave4_segundos: number;
    clave4_formateado: string;
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
        clave4_segundos: 0,
        clave4_formateado: '00:00:00',
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
        const { prisma } = await import('../config/prisma');

        // ✅ MANDAMIENTO M2: Usar segmentos persistidos en lugar de calcular en tiempo real
        const segmentosWhere: any = { sessionId: { in: sessionIds } };
        if (dateFrom && dateTo) {
            segmentosWhere.startTime = { gte: dateFrom, lte: dateTo };
        }

        const segmentos = await prisma.operational_state_segments.findMany({
            where: segmentosWhere,
            select: { clave: true, startTime: true, endTime: true }
        });

        if (segmentos.length === 0) {
            logger.warn('No hay segmentos operacionales persistidos, retornando tiempos vacíos');
            return crearTiemposVacios();
        }

        // Calcular tiempos desde segmentos persistidos
        const tiempos = {
            clave0: 0, clave1: 0, clave2: 0, clave3: 0, clave4: 0, clave5: 0
        };

        segmentos.forEach((segmento: any) => {
            const duracionSegundos = (segmento.endTime.getTime() - segmento.startTime.getTime()) / 1000;
            tiempos[`clave${segmento.clave}` as keyof typeof tiempos] += duracionSegundos;
        });

        const totalSegundos = tiempos.clave0 + tiempos.clave1 + tiempos.clave2 + tiempos.clave3 + tiempos.clave4 + tiempos.clave5;

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
            clave4_segundos: tiempos.clave4,
            clave4_formateado: formatearTiempo(tiempos.clave4),
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
