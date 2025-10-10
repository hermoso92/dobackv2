/**
 * 🚨 SERVICIO DE DETECCIÓN DE EVENTOS DE ESTABILIDAD
 * Basado en tabla de eventos con índice SI
 * Última actualización: 10/Oct/2025 - Umbrales corregidos
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const prisma = new PrismaClient();
const logger = createLogger('EventDetector');

// ============================================================================
// TIPOS
// ============================================================================

export type TipoEvento =
    | 'RIESGO_VUELCO'
    | 'VUELCO_INMINENTE'
    | 'DERIVA_LATERAL_SIGNIFICATIVA'
    | 'DERIVA_PELIGROSA'
    | 'MANIOBRA_BRUSCA'
    | 'CURVA_ESTABLE'
    | 'CAMBIO_CARGA'
    | 'ZONA_INESTABLE';

export type Severidad = 'GRAVE' | 'MODERADA' | 'LEVE' | 'NORMAL';

export interface EventoDetectado {
    tipo: TipoEvento;
    severidad: Severidad;
    timestamp: Date;
    sessionId?: string;
    vehicleId?: string;
    lat?: number;
    lon?: number;
    valores: {
        si?: number;
        ax?: number;
        ay?: number;
        az?: number;
        gx?: number;
        gy?: number;
        gz?: number;
        roll?: number;
        pitch?: number;
        velocity?: number;
        cambioGx?: number;
    };
    descripcion: string;
    rotativo?: boolean;
}

// ============================================================================
// DETECCIÓN DE EVENTOS SEGÚN TABLA
// ============================================================================

/**
 * Detectar evento: Riesgo de vuelco
 * Condición: si < 30% (pérdida general de estabilidad)
 * Criticidad: 🔴 < 20% | 🟠 20-35% | 🟡 35-50% | 🟢 > 50%
 */
function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = (measurement.si || 0) * 100; // Convertir a porcentaje

    if (si < 30) {
        let severidad: Severidad;

        if (si < 20) severidad = 'GRAVE';
        else if (si >= 20 && si < 35) severidad = 'MODERADA';
        else if (si >= 35 && si < 50) severidad = 'LEVE';
        else severidad = 'NORMAL';

        return {
            tipo: 'RIESGO_VUELCO',
            severidad,
            timestamp: measurement.timestamp,
            valores: { si: measurement.si },
            descripcion: `Pérdida general de estabilidad (SI=${si.toFixed(1)}%)`
        };
    }

    return null;
}

/**
 * Detectar evento: Vuelco inminente
 * Condición: si < 10% AND (roll > 10° OR gx > 30°/s)
 * Criticidad: 🔴 Grave (fijo)
 */
function detectarVuelcoInminente(measurement: any): EventoDetectado | null {
    const si = (measurement.si || 0) * 100; // Convertir a porcentaje
    const roll = measurement.roll || 0;
    const gx = measurement.gx || 0;

    if (si < 10 && (Math.abs(roll) > 10 || Math.abs(gx) > 30)) {
        return {
            tipo: 'VUELCO_INMINENTE',
            severidad: 'GRAVE',
            timestamp: measurement.timestamp,
            valores: { si: measurement.si, roll, gx },
            descripcion: `⚠️ VUELCO INMINENTE: SI=${si.toFixed(1)}%, Roll=${roll.toFixed(1)}°, gx=${gx.toFixed(1)}°/s`
        };
    }

    return null;
}

/**
 * Detectar evento: Deriva peligrosa
 * Condición: abs(gx) > 45°/s AND si < 50% (CORREGIDO)
 * Criticidad: 🔴 si < 20% | 🟠 si 20-50%
 */
function detectarDerivaPeligrosa(measurement: any, sostenido: boolean = false): EventoDetectado | null {
    const gx = measurement.gx || 0;
    const si = (measurement.si || 0) * 100; // Convertir a porcentaje

    // DERIVA PELIGROSA: giro lateral fuerte + estabilidad BAJA (no alta)
    if (Math.abs(gx) > 45 && si < 50) {
        let severidad: Severidad;
        if (si < 20) severidad = 'GRAVE';
        else if (si >= 20 && si < 35) severidad = 'MODERADA';
        else severidad = 'LEVE';

        return {
            tipo: 'DERIVA_PELIGROSA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { gx, si: measurement.si },
            descripcion: `Sobreviraje o pérdida de tracción: gx=${gx.toFixed(1)}°/s, SI=${si.toFixed(1)}%`
        };
    }

    return null;
}

/**
 * Detectar evento: Maniobra brusca
 * Condición: d(gx)/dt > 100°/s² OR ay > 3 m/s² (300 mg)
 * Criticidad: 🔴 < 20% | 🟠 20-35% | 🟡 35-50% | 🟢 > 50%
 */
function detectarManiobraBrusca(measurement: any, gxAnterior?: number): EventoDetectado | null {
    const ay = measurement.ay || 0;
    const gx = measurement.gx || 0;
    const si = (measurement.si || 0) * 100; // Convertir a porcentaje

    // Cambio brusco en giroscopio o aceleración alta
    const cambioGx = gxAnterior !== undefined ? Math.abs(gx - gxAnterior) : 0;
    const aceleracionAlta = Math.abs(ay) > 300; // 300 mg = 3 m/s²

    if (cambioGx > 100 || aceleracionAlta) {
        let severidad: Severidad;

        if (si < 20) severidad = 'GRAVE';
        else if (si >= 20 && si < 35) severidad = 'MODERADA';
        else if (si >= 35 && si < 50) severidad = 'LEVE';
        else severidad = 'NORMAL';

        return {
            tipo: 'MANIOBRA_BRUSCA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { ay, gx, si: measurement.si },
            descripcion: `Frenazo o cambio violento: ay=${ay.toFixed(0)}mg, Δgx=${cambioGx.toFixed(0)}°/s², SI=${si.toFixed(1)}%`
        };
    }

    return null;
}

/**
 * Detectar evento: Curva estable
 * Condición: ay > 2 m/s² (200mg) AND si > 60% AND roll < 8°
 * Criticidad: 🟢 Normal (maniobra controlada y segura)
 */
function detectarCurvaEstable(measurement: any): EventoDetectado | null {
    const ay = measurement.ay || 0;
    const si = (measurement.si || 0) * 100; // Convertir a porcentaje
    const roll = measurement.roll || 0;

    if (Math.abs(ay) > 200 && si > 60 && Math.abs(roll) < 8) { // 200 mg = 2 m/s²
        return {
            tipo: 'CURVA_ESTABLE',
            severidad: 'NORMAL',
            timestamp: measurement.timestamp,
            valores: { ay, si: measurement.si, roll },
            descripcion: `✅ Curva controlada: ay=${ay.toFixed(0)}mg, SI=${si.toFixed(1)}%, Roll=${roll.toFixed(1)}°`
        };
    }

    return null;
}

/**
 * Detectar evento: Cambio de carga
 * Condición: Δroll > 10% AND Δsi > 10% AND si < 50%
 * Criticidad: 🟡 Leve | 🟠 Moderada si afecta al SI
 * REGLA: Solo detectar cuando SI resultante < 50%
 */
function detectarCambioCarga(measurement: any, anterior: any): EventoDetectado | null {
    if (!anterior) return null;

    const roll = measurement.roll || 0;
    const rollAnterior = anterior.roll || 0;
    const si = (measurement.si || 0) * 100;
    const siAnterior = (anterior.si || 0) * 100;

    // FILTRO GLOBAL: Solo detectar cuando SI < 50%
    if (si >= 50) return null;

    const cambioRoll = Math.abs((roll - rollAnterior) / (rollAnterior || 1)) * 100;
    const cambioSI = Math.abs((si - siAnterior) / (siAnterior || 1)) * 100;

    if (cambioRoll > 10 && cambioSI > 10) {
        const severidad: Severidad = cambioSI > 20 ? 'MODERADA' : 'LEVE';

        return {
            tipo: 'CAMBIO_CARGA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { roll, si: measurement.si },
            descripcion: `Modificación centro de gravedad: ΔRoll=${cambioRoll.toFixed(1)}%, ΔSI=${cambioSI.toFixed(1)}%`
        };
    }

    return null;
}

/**
 * Detectar evento: Deriva lateral significativa
 * Condición: abs(yaw_rate - ay/v) > 0.15 AND si < 50%
 * Criticidad: 🔴 < 20% | 🟠 20-35% | 🟡 35-50%
 * REGLA: Solo detectar cuando SI < 50%
 */
function detectarDerivaLateral(measurement: any, velocity: number = 0): EventoDetectado | null {
    const ay = measurement.ay || 0;
    const gz = measurement.gz || 0; // yaw_rate (velocidad angular en Z)
    const si = (measurement.si || 0) * 100; // Convertir a porcentaje

    // FILTRO GLOBAL: Solo detectar eventos cuando SI < 50%
    if (si >= 50 || velocity < 5) return null;

    // Convertir ay de mg a m/s²
    const ay_ms2 = ay / 1000 * 9.81;

    // Convertir velocidad de km/h a m/s
    const v_ms = velocity / 3.6;

    // Calcular diferencia entre yaw_rate real y esperado
    const yaw_esperado = ay_ms2 / (v_ms || 1);
    const diferencia = Math.abs(gz - yaw_esperado);

    if (diferencia > 0.15) {
        let severidad: Severidad;
        if (si < 20) severidad = 'GRAVE';
        else if (si >= 20 && si < 35) severidad = 'MODERADA';
        else severidad = 'LEVE';

        return {
            tipo: 'DERIVA_LATERAL_SIGNIFICATIVA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { ay, gz, velocity, si: measurement.si },
            descripcion: `Deslizamiento lateral: Δ=${diferencia.toFixed(3)}, SI=${si.toFixed(1)}%`
        };
    }

    return null;
}

/**
 * Detectar evento: Zona inestable
 * Condición: Variaciones rápidas en gz y picos en gx AND si < 50%
 * Criticidad: 🟡 Leve (aviso de terreno irregular)
 * REGLA: Solo detectar cuando SI < 50%
 */
function detectarZonaInestable(measurements: any[]): EventoDetectado | null {
    if (measurements.length < 5) return null;

    // Analizar últimos 5 puntos
    const ultimos5 = measurements.slice(-5);
    const ultimaMedicion = measurements[measurements.length - 1];
    const si = (ultimaMedicion.si || 0) * 100;

    // FILTRO GLOBAL: Solo detectar cuando SI < 50%
    if (si >= 50) return null;

    const variacionesGz = ultimos5.map((m, i) =>
        i > 0 ? Math.abs(m.gz - ultimos5[i - 1].gz) : 0
    );
    const maxVariacionGz = Math.max(...variacionesGz);
    const picosGx = ultimos5.filter(m => Math.abs(m.gx) > 20).length;

    if (maxVariacionGz > 50 && picosGx >= 3) {
        return {
            tipo: 'ZONA_INESTABLE',
            severidad: 'LEVE',
            timestamp: ultimaMedicion.timestamp,
            valores: { gz: ultimaMedicion.gz, gx: ultimaMedicion.gx, si: ultimaMedicion.si },
            descripcion: `Terreno irregular o vibraciones intensas (Δgz=${maxVariacionGz.toFixed(1)}°/s, SI=${si.toFixed(1)}%)`
        };
    }

    return null;
}

// ============================================================================
// DETECTOR PRINCIPAL
// ============================================================================

/**
 * Detecta todos los eventos en un conjunto de mediciones
 * ACTUALIZADO: Incluye lat/lon y metadata de sesión
 */
export async function detectarEventosSesion(sessionId: string): Promise<EventoDetectado[]> {
    // Obtener información de la sesión
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { vehicleId: true }
    });

    if (!session) {
        logger.warn(`Sesión no encontrada: ${sessionId}`);
        return [];
    }

    const measurements = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });

    // Obtener mediciones de rotativo para correlacionar
    const rotativoMeasurements = await prisma.rotativoMeasurement.findMany({
        where: { sessionId },
        select: { timestamp: true, state: true }
    });

    const eventos: EventoDetectado[] = [];
    const buffer: any[] = [];

    for (let i = 0; i < measurements.length; i++) {
        const m = measurements[i];
        const anterior = i > 0 ? measurements[i - 1] : null;

        buffer.push(m);
        if (buffer.length > 5) buffer.shift();

        // Buscar estado de rotativo más cercano temporalmente
        const rotativoState = rotativoMeasurements.find(
            r => Math.abs(r.timestamp.getTime() - m.timestamp.getTime()) < 5000
        );

        // Detectar cada tipo de evento
        const eventoVuelcoInminente = detectarVuelcoInminente(m);
        const eventoRiesgoVuelco = detectarRiesgoVuelco(m);
        const eventoDerivaPeligrosa = detectarDerivaPeligrosa(m);
        const eventoManiobraBrusca = detectarManiobraBrusca(m, anterior?.gx);
        const eventoCurvaEstable = detectarCurvaEstable(m);
        const eventoCambioCarga = anterior ? detectarCambioCarga(m, anterior) : null;
        const eventoZonaInestable = buffer.length === 5 ? detectarZonaInestable(buffer) : null;

        // Función helper para enriquecer eventos con datos de sesión
        // NOTA: lat/lon se añadirán después mediante correlación con GPS
        const enriquecerEvento = (evento: EventoDetectado | null): EventoDetectado | null => {
            if (!evento) return null;
            return {
                ...evento,
                sessionId,
                vehicleId: session.vehicleId,
                rotativo: rotativoState ? parseInt(rotativoState.state.toString()) > 0 : false
            };
        };

        // Prioridad: vuelco inminente > otros eventos graves
        if (eventoVuelcoInminente) {
            const enriquecido = enriquecerEvento(eventoVuelcoInminente);
            if (enriquecido) eventos.push(enriquecido);
        } else if (eventoRiesgoVuelco && eventoRiesgoVuelco.severidad === 'GRAVE') {
            const enriquecido = enriquecerEvento(eventoRiesgoVuelco);
            if (enriquecido) eventos.push(enriquecido);
        } else if (eventoDerivaPeligrosa) {
            const enriquecido = enriquecerEvento(eventoDerivaPeligrosa);
            if (enriquecido) eventos.push(enriquecido);
        } else if (eventoManiobraBrusca && eventoManiobraBrusca.severidad !== 'NORMAL') {
            const enriquecido = enriquecerEvento(eventoManiobraBrusca);
            if (enriquecido) eventos.push(enriquecido);
        } else if (eventoCambioCarga) {
            const enriquecido = enriquecerEvento(eventoCambioCarga);
            if (enriquecido) eventos.push(enriquecido);
        } else if (eventoZonaInestable) {
            const enriquecido = enriquecerEvento(eventoZonaInestable);
            if (enriquecido) eventos.push(enriquecido);
        } else if (eventoCurvaEstable) {
            // Eventos positivos (conducción correcta)
            // const enriquecido = enriquecerEvento(eventoCurvaEstable);
            // if (enriquecido) eventos.push(enriquecido); // Comentado - no saturar con eventos normales
        }
    }

    logger.info(`Eventos detectados en sesión ${sessionId}: ${eventos.length}`);

    // Correlacionar eventos con coordenadas GPS
    if (eventos.length > 0) {
        const gpsData = await prisma.gpsMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        });

        // Añadir lat/lon a cada evento buscando el GPS más cercano en tiempo
        for (const evento of eventos) {
            const timestamp = evento.timestamp.getTime();

            // Buscar GPS más cercano (±5 segundos)
            const gpsMatch = gpsData.find(gps => {
                const diff = Math.abs(gps.timestamp.getTime() - timestamp);
                return diff < 5000; // 5 segundos
            });

            if (gpsMatch) {
                evento.lat = gpsMatch.latitude;
                evento.lon = gpsMatch.longitude;
            }
        }
    }

    return eventos;
}

/**
 * Detecta eventos en múltiples sesiones
 */
export async function detectarEventosMasivo(sessionIds: string[]): Promise<{
    total: number;
    por_tipo: Record<TipoEvento, number>;
    por_severidad: Record<Severidad, number>;
    eventos: EventoDetectado[];
}> {
    const todosEventos: EventoDetectado[] = [];

    for (const sessionId of sessionIds) {
        const eventos = await detectarEventosSesion(sessionId);
        todosEventos.push(...eventos);
    }

    // Agrupar por tipo
    const porTipo: any = {};
    const porSeveridad: any = { GRAVE: 0, MODERADA: 0, LEVE: 0, NORMAL: 0 };

    todosEventos.forEach(e => {
        porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
        porSeveridad[e.severidad]++;
    });

    return {
        total: todosEventos.length,
        por_tipo: porTipo,
        por_severidad: porSeveridad,
        eventos: todosEventos
    };
}

// ============================================================================
// EXPORTAR
// ============================================================================

/**
 * Detecta y GUARDA eventos en la BD para una sesión
 */
async function detectarYGuardarEventos(sessionId: string): Promise<{ total: number; guardados: number }> {
    try {
        logger.info(`Detectando y guardando eventos para sesión ${sessionId}`);

        // Detectar eventos
        const eventos = await detectarEventosSesion(sessionId);

        if (eventos.length === 0) {
            logger.info(`No se detectaron eventos para sesión ${sessionId}`);
            return { total: 0, guardados: 0 };
        }

        // Guardar en BD
        let guardados = 0;
        for (const evento of eventos) {
            try {
                await prisma.stabilityEvent.create({
                    data: {
                        session_id: sessionId,
                        timestamp: evento.timestamp,
                        type: evento.tipo,
                        lat: evento.lat || 0,
                        lon: evento.lon || 0,
                        speed: evento.valores.velocity || 0,
                        rotativoState: evento.rotativo ? 1 : 0,
                        details: evento.valores
                    }
                });
                guardados++;
            } catch (error: any) {
                // Ignorar duplicados
                if (!error.code || error.code !== 'P2002') {
                    logger.error(`Error guardando evento: ${error.message}`);
                }
            }
        }

        logger.info(`Guardados ${guardados} eventos de ${eventos.length} detectados para sesión ${sessionId}`);
        return { total: eventos.length, guardados };

    } catch (error: any) {
        logger.error(`Error en detectarYGuardarEventos: ${error.message}`);
        throw error;
    }
}

export const eventDetector = {
    detectarEventosSesion,
    detectarEventosMasivo,
    detectarYGuardarEventos
};

