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
    // ✅ CORRECCIÓN: Umbrales actualizados después de fix escala 100x
    // Ahora ay viene en m/s², no en mg
    const aceleracionAlta = Math.abs(ay) > 3.0; // 3.0 m/s² (antes 300 mg)

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

    // ✅ CORRECCIÓN: Umbrales actualizados después de fix escala 100x
    if (Math.abs(ay) > 2.0 && si > 60 && Math.abs(roll) < 8) { // 2.0 m/s² (antes 200 mg)
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

    // ✅ CORRECCIÓN: ay ya viene en m/s² después de fix escala 100x
    const ay_ms2 = ay; // Ya no necesita conversión

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

        // Añadir lat/lon a cada evento buscando el GPS MÁS CERCANO en tiempo
        for (const evento of eventos) {
            const timestamp = evento.timestamp.getTime();

            // Buscar GPS MÁS CERCANO (no solo el primero dentro del rango)
            let gpsMatch = null;
            let minDiff = Infinity;

            for (const gps of gpsData) {
                const diff = Math.abs(gps.timestamp.getTime() - timestamp);
                if (diff < 30000 && diff < minDiff) { // Ventana de ±30 segundos
                    minDiff = diff;
                    gpsMatch = gps;
                }
            }

            if (gpsMatch) {
                evento.lat = gpsMatch.latitude;
                evento.lon = gpsMatch.longitude;
                // Velocidad en km/h (datos vienen en km/h)
                (evento.valores as any).velocity = gpsMatch.speed || 0;
                logger.debug(`GPS correlacionado para evento: diff=${minDiff}ms`);
            } else {
                logger.warn(`⚠️ No se encontró GPS para evento en ${evento.timestamp}`);
            }
        }

        // Filtro: descartar eventos que no tengan GPS correlacionado
        const antes = eventos.length;
        for (let i = eventos.length - 1; i >= 0; i--) {
            if (eventos[i].lat === undefined || eventos[i].lon === undefined) {
                logger.warn(`⚠️ Descartando evento ${eventos[i].tipo} sin GPS`);
                eventos.splice(i, 1);
            }
        }
        logger.info(`Eventos con GPS: ${eventos.length}/${antes} (descartados: ${antes - eventos.length})`);
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

/**
 * Genera eventos de estabilidad para una sesión completa
 * Wrapper para uso en post-procesamiento de upload
 * @param sessionId - ID de la sesión
 * @returns Lista de eventos detectados y guardados
 */
export async function generateStabilityEventsForSession(sessionId: string): Promise<EventoDetectado[]> {
    logger.info('🚨 Generando eventos de estabilidad para sesión', { sessionId });

    try {
        // 1. Obtener mediciones de estabilidad
        const measurements = await prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        });

        if (measurements.length === 0) {
            logger.warn('⚠️ Sin mediciones de estabilidad para generar eventos', { sessionId });
            return [];
        }

        logger.info(`📊 Analizando ${measurements.length} mediciones`);

        // 2. Detectar eventos
        const eventos: EventoDetectado[] = [];

        for (const measurement of measurements) {
            // Ejecutar detectores
            const riesgoVuelco = detectarRiesgoVuelco(measurement);
            if (riesgoVuelco) {
                riesgoVuelco.sessionId = sessionId;
                eventos.push(riesgoVuelco);
            }

            const vuelcoInminente = detectarVuelcoInminente(measurement);
            if (vuelcoInminente) {
                vuelcoInminente.sessionId = sessionId;
                eventos.push(vuelcoInminente);
            }

            const derivaPeligrosa = detectarDerivaPeligrosa(measurement);
            if (derivaPeligrosa) {
                derivaPeligrosa.sessionId = sessionId;
                eventos.push(derivaPeligrosa);
            }

            // Deriva lateral significativa ya está cubierta por deriva peligrosa

            const maniobraBrusca = detectarManiobraBrusca(measurement);
            if (maniobraBrusca) {
                maniobraBrusca.sessionId = sessionId;
                eventos.push(maniobraBrusca);
            }
        }

        logger.info(`✅ ${eventos.length} eventos detectados`);

        if (eventos.length === 0) {
            return [];
        }

        // 3. Cargar TODOS los datos de GPS y rotativo de la sesión (optimización)
        logger.info(`📡 Cargando datos GPS y rotativo para correlación...`);
        const [allGpsPoints, allRotativoPoints] = await Promise.all([
            prisma.gpsMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.rotativoMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            })
        ]);

        logger.info(`📡 Datos cargados: ${allGpsPoints.length} GPS, ${allRotativoPoints.length} Rotativo`);

        // Función auxiliar para encontrar el punto más cercano
        function findClosestPoint<T extends { timestamp: Date }>(
            points: T[],
            targetTime: Date,
            maxDiffMs: number
        ): T | null {
            if (points.length === 0) return null;

            let closest: T | null = null;
            let minDiff = Infinity;

            for (const point of points) {
                const diff = Math.abs(point.timestamp.getTime() - targetTime.getTime());
                if (diff < minDiff && diff <= maxDiffMs) {
                    minDiff = diff;
                    closest = point;
                }
            }

            return closest;
        }

        // 4. Correlacionar con GPS y obtener velocidad (max ±30 segundos)
        let gpsCorrelated = 0;
        for (const evento of eventos) {
            const closest = findClosestPoint(allGpsPoints, evento.timestamp, 30000);
            if (closest) {
                evento.lat = closest.latitude;
                evento.lon = closest.longitude;
                evento.valores.velocity = closest.speed;
                gpsCorrelated++;
            }
        }
        logger.info(`📍 GPS correlacionado en ${gpsCorrelated}/${eventos.length} eventos`);

        // 5. Correlacionar con estado del rotativo (max ±60 segundos)
        const stateMap: Record<string, number> = {
            'apagado': 0,
            'clave 2': 2,
            'clave 5': 5
        };

        let rotativoCorrelated = 0;
        for (const evento of eventos) {
            const closest = findClosestPoint(allRotativoPoints, evento.timestamp, 60000);
            if (closest) {
                evento.rotativo = closest.state !== 'apagado';
                (evento as any).rotativoState = stateMap[closest.state] || 0;
                rotativoCorrelated++;
            }
        }
        logger.info(`🔄 Rotativo correlacionado en ${rotativoCorrelated}/${eventos.length} eventos`);

        // 6. Obtener información de la sesión
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { vehicleId: true, organizationId: true }
        });

        if (!session) {
            throw new Error(`Sesión no encontrada: ${sessionId}`);
        }

        // 7. Verificar si ya existen eventos para esta sesión (usar snake_case)
        const existingCount = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) as count 
            FROM stability_events 
            WHERE session_id = ${sessionId}
        `;

        const count = parseInt((existingCount[0] as any).count);

        if (count > 0) {
            logger.warn('⚠️ Eventos ya existen para esta sesión, saltando creación', {
                sessionId,
                existingCount: count
            });
            return eventos;
        }

        // 8. Guardar eventos en BD con TODOS los campos
        for (const e of eventos) {
            const rotativoState = (e as any).rotativoState ?? null; // Usar ?? en lugar de || para permitir 0
            const speed = e.valores.velocity ?? null;
            const interpolatedGPS = !e.lat; // Si no hay GPS, marca como interpolado (aunque aquí es NULL)

            await prisma.$executeRaw`
                INSERT INTO stability_events (
                    id, session_id, timestamp, type, severity, details, 
                    lat, lon, speed, "rotativoState", "keyType", "interpolatedGPS"
                )
                VALUES (
                    (gen_random_uuid())::text,
                    ${sessionId},
                    ${e.timestamp},
                    ${e.tipo},
                    ${e.severidad},
                    ${JSON.stringify({
                ...e.valores,
                description: e.descripcion,
                rotativo: e.rotativo
            })}::jsonb,
                    ${e.lat ? parseFloat(e.lat.toString()) : null},
                    ${e.lon ? parseFloat(e.lon.toString()) : null},
                    ${speed},
                    ${rotativoState},
                    ${rotativoState},
                    ${interpolatedGPS}
                )
            `;
        }

        logger.info('✅ Eventos de estabilidad guardados en BD', {
            sessionId,
            count: eventos.length,
            breakdown: {
                critical: eventos.filter(e => e.severidad === 'GRAVE').length,
                moderate: eventos.filter(e => e.severidad === 'MODERADA').length,
                light: eventos.filter(e => e.severidad === 'LEVE').length
            }
        });

        return eventos;

    } catch (error: any) {
        logger.error('❌ Error generando eventos para sesión:', { sessionId, error: error.message });
        throw error;
    }
}

export const eventDetector = {
    detectarEventosSesion,
    detectarEventosMasivo,
    detectarYGuardarEventos,
    generateStabilityEventsForSession // Nueva función para post-processing
};

