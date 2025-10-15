/**
 * 🚨 SERVICIO DE DETECCIÓN DE EVENTOS DE ESTABILIDAD
 * Basado en tabla de eventos con índice SI
 * Última actualización: 14/Oct/2025 - Reglas de dominio + correlación GPS + deduplicación
 */

import { prisma } from '../config/prisma';
import { createLogger } from '../utils/logger';
const logger = createLogger('EventDetector');

// ============================================================================
// MANDAMIENTOS M3: UMBRALES Y CONFIGURACIÓN
// ============================================================================

/**
 * MANDAMIENTO M3.1: Solo generar eventos si SI < 0.50
 * MANDAMIENTO M3.2: Umbrales de severidad en [0,1]
 */
const UMBRALES = {
    EVENTO_MAXIMO: 0.50,    // Solo generar eventos si SI < 0.50
    GRAVE: 0.20,            // SI < 0.20
    MODERADA: 0.35,         // 0.20 ≤ SI < 0.35
    LEVE: 0.50              // 0.35 ≤ SI < 0.50
};

/**
 * Clasificar severidad por SI según Mandamiento M3.2
 * @param si - Índice de estabilidad en [0,1]
 * @returns Severidad o null si SI ≥ 0.50 (condición normal)
 */
function clasificarSeveridadPorSI(si: number): Severidad | null {
    if (si >= UMBRALES.EVENTO_MAXIMO) return null; // Sin evento
    if (si < UMBRALES.GRAVE) return 'GRAVE';
    if (si < UMBRALES.MODERADA) return 'MODERADA';
    return 'LEVE';
}

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
 * Condición: SI < 0.50 (pérdida general de estabilidad)
 * Criticidad: 🔴 < 0.20 | 🟠 0.20-0.35 | 🟡 0.35-0.50 | 🟢 ≥ 0.50
 * MANDAMIENTO M3
 */
function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0; // Ya en [0,1]

    const severidad = clasificarSeveridadPorSI(si);
    if (!severidad) return null; // SI ≥ 0.50 → sin evento

    return {
        tipo: 'RIESGO_VUELCO',
        severidad,
        timestamp: measurement.timestamp,
        valores: { si: measurement.si },
        descripcion: `Pérdida general de estabilidad (SI=${(si * 100).toFixed(1)}%)`
    };
}

/**
 * Detectar evento: Vuelco inminente
 * Condición: SI < 0.10 AND (roll > 10° OR gx > 30°/s)
 * Criticidad: 🔴 Grave (forzado independiente de SI)
 * MANDAMIENTO M3.5
 */
function detectarVuelcoInminente(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0; // Ya en [0,1]
    const roll = measurement.roll || 0;
    const gx = measurement.gx || 0;

    if (si < 0.10 && (Math.abs(roll) > 10 || Math.abs(gx) > 30)) {
        return {
            tipo: 'VUELCO_INMINENTE',
            severidad: 'GRAVE', // Forzado
            timestamp: measurement.timestamp,
            valores: { si: measurement.si, roll, gx },
            descripcion: `⚠️ VUELCO INMINENTE: SI=${(si * 100).toFixed(1)}%, Roll=${roll.toFixed(1)}°, gx=${gx.toFixed(1)}°/s`
        };
    }

    return null;
}

/**
 * Detectar evento: Deriva peligrosa
 * Condición: abs(gx) > 45°/s AND SI < 0.50
 * Criticidad: Por SI (M3.2) o GRAVE si sostenido >2s (M3.5)
 * MANDAMIENTO M3
 */
function detectarDerivaPeligrosa(measurement: any, sostenido: boolean = false): EventoDetectado | null {
    const gx = measurement.gx || 0;
    const si = measurement.si || 0; // Ya en [0,1]

    // DERIVA PELIGROSA: giro lateral fuerte + estabilidad BAJA
    if (Math.abs(gx) > 45) {
        // Clasificar por SI, pero forzar GRAVE si sostenido
        let severidad = sostenido ? 'GRAVE' : clasificarSeveridadPorSI(si);
        if (!severidad) return null; // SI ≥ 0.50 → sin evento

        return {
            tipo: 'DERIVA_PELIGROSA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { gx, si: measurement.si },
            descripcion: `Sobreviraje o pérdida de tracción: gx=${gx.toFixed(1)}°/s, SI=${(si * 100).toFixed(1)}%`
        };
    }

    return null;
}

/**
 * Detectar evento: Maniobra brusca
 * Condición: d(gx)/dt > 100°/s² OR |ay| > 3 m/s² (300 mg)
 * Criticidad: Por SI según M3.2
 * MANDAMIENTO M3
 */
function detectarManiobraBrusca(measurement: any, gxAnterior?: number): EventoDetectado | null {
    const ay = measurement.ay || 0;
    const gx = measurement.gx || 0;
    const si = measurement.si || 0; // Ya en [0,1]

    // Cambio brusco en giroscopio o aceleración alta
    const cambioGx = gxAnterior !== undefined ? Math.abs(gx - gxAnterior) : 0;
    const aceleracionAlta = Math.abs(ay) > 300; // 300 mg = 3 m/s²

    if (cambioGx > 100 || aceleracionAlta) {
        const severidad = clasificarSeveridadPorSI(si);
        if (!severidad) return null; // SI ≥ 0.50 → sin evento

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
    // Para deduplicación: mantener último evento por tipo
    const ultimoEventoPorTipo: Record<string, EventoDetectado | undefined> = {};

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

        // Helper para deduplicar por tipo en ventana temporal
        const pushDeduplicado = (ev: EventoDetectado | null) => {
            const enriquecido = enriquecerEvento(ev);
            if (!enriquecido) return;
            const prev = ultimoEventoPorTipo[enriquecido.tipo];
            if (!prev) {
                ultimoEventoPorTipo[enriquecido.tipo] = enriquecido;
                eventos.push(enriquecido);
                return;
            }
            const dt = Math.abs(enriquecido.timestamp.getTime() - prev.timestamp.getTime());
            if (dt <= 3000) {
                // 3s: reemplazar si severidad es mayor
                const orden: Record<Severidad, number> = { GRAVE: 3, MODERADA: 2, LEVE: 1, NORMAL: 0 };
                if (orden[enriquecido.severidad] > orden[prev.severidad]) {
                    // sustituir el último del mismo tipo
                    const idx = eventos.lastIndexOf(prev);
                    if (idx >= 0) eventos[idx] = enriquecido;
                    ultimoEventoPorTipo[enriquecido.tipo] = enriquecido;
                }
            } else {
                ultimoEventoPorTipo[enriquecido.tipo] = enriquecido;
                eventos.push(enriquecido);
            }
        };

        // Prioridad: vuelco inminente > otros graves; aplicar deduplicación
        if (eventoVuelcoInminente) pushDeduplicado(eventoVuelcoInminente);
        else if (eventoRiesgoVuelco && eventoRiesgoVuelco.severidad === 'GRAVE') pushDeduplicado(eventoRiesgoVuelco);
        else if (eventoDerivaPeligrosa) pushDeduplicado(eventoDerivaPeligrosa);
        else if (eventoManiobraBrusca && eventoManiobraBrusca.severidad !== 'NORMAL') pushDeduplicado(eventoManiobraBrusca);
        else if (eventoCambioCarga) pushDeduplicado(eventoCambioCarga);
        else if (eventoZonaInestable) pushDeduplicado(eventoZonaInestable);
        // eventoCurvaEstable omitido para no saturar
    }

    logger.info(`Eventos detectados en sesión ${sessionId}: ${eventos.length}`);

    // Correlacionar eventos con coordenadas GPS y velocidad
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
                // Velocidad en km/h (datos vienen en km/h)
                (evento.valores as any).velocity = gpsMatch.speed || 0;
            }
        }

        // Filtro: descartar eventos que no tengan GPS correlacionado
        const antes = eventos.length;
        for (let i = eventos.length - 1; i >= 0; i--) {
            if (eventos[i].lat === undefined || eventos[i].lon === undefined) {
                eventos.splice(i, 1);
            }
        }
        logger.info(`Eventos con GPS: ${eventos.length}/${antes}`);
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

        // Guardar en BD (modelo correcto: stabilityEvent)
        // MANDAMIENTO M3.6: Persistir details.si SIEMPRE
        let guardados = 0;
        for (const evento of eventos) {
            // ✅ Validar que SI existe antes de guardar
            if (!evento.valores.si && evento.valores.si !== 0) {
                logger.warn(`⚠️ Evento sin SI, no se guardará: ${evento.tipo} en ${evento.timestamp}`);
                continue;
            }

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
                        // ✅ MANDAMIENTO M3.6: details SIEMPRE incluye si
                        details: {
                            si: evento.valores.si,          // ✅ OBLIGATORIO
                            ax: evento.valores.ax,
                            ay: evento.valores.ay,
                            az: evento.valores.az,
                            gx: evento.valores.gx,
                            gy: evento.valores.gy,
                            gz: evento.valores.gz,
                            roll: evento.valores.roll,
                            pitch: evento.valores.pitch,
                            // yaw: evento.valores.yaw, // Campo no disponible en el modelo
                            velocity: evento.valores.velocity,
                            cambioGx: evento.valores.cambioGx
                        }
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

