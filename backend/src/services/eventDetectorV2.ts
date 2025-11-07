/**
 * 🚨 DETECTOR DE EVENTOS V2 - SISTEMA HÍBRIDO
 * 
 * Sistema de detección que combina:
 * 1. Filtro por SI < 0.50 (Índice de Estabilidad - sistema probado)
 * 2. Clasificación por tipo según fenómeno físico
 * 
 * FLUJO:
 * 1. SI < 0.50? → Generar evento
 * 2. Severidad por SI: GRAVE (<0.20), MODERADA (0.20-0.35), LEVE (0.35-0.50)
 * 3. Tipo por parámetros físicos:
 *    - MANIOBRA_BRUSCA: |gy| alto, roll bajo
 *    - INCLINACION_LATERAL_EXCESIVA: roll alto, dinámica baja
 *    - CURVA_VELOCIDAD_EXCESIVA: ay alto, roll moderado
 *    - RIESGO_VUELCO: si no coincide con ninguno (genérico)
 * 
 * @version 2.0
 * @date 2025-11-03
 */

import { prisma } from '../config/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('EventDetectorV2');

// ============================================================================
// CONFIGURACIÓN Y UMBRALES
// ============================================================================

/**
 * Configuración del detector
 * ⚠️ IMPORTANTE: Ajustar VENTANA_TAMAÑO_MEDICIONES según frecuencia de muestreo real
 */
const CONFIG = {
    // Tamaño de ventana temporal
    VENTANA_DURACION_SEGUNDOS: 1.0,
    VENTANA_TAMAÑO_MEDICIONES: 10, // ⚠️ AJUSTAR según frecuencia de muestreo real

    // Evento 1: Maniobra brusca (giro/volantazo)
    MANIOBRA_BRUSCA: {
        gy_moderada: 15,    // °/s - Velocidad angular roll (ω_roll)
        gy_grave: 25,       // °/s
        roll_max: 10        // ° - Ángulo máximo de roll
    },

    // Evento 2: Inclinación lateral excesiva (estático/cuasiestático)
    INCLINACION_EXCESIVA: {
        roll_moderada: 20,  // ° - Ángulo roll moderado
        roll_critica: 30,   // ° - Ángulo roll crítico
        ay_g_max: 0.10,     // g - Aceleración lateral máxima (baja = estático)
        gy_max: 3           // °/s - Velocidad angular máxima (baja = estático)
    },

    // Evento 3: Curva velocidad excesiva (dinámico)
    CURVA_VELOCIDAD: {
        ay_g_moderada: 0.30,    // g - Aceleración lateral moderada
        ay_g_grave: 0.40,       // g - Aceleración lateral grave
        roll_max: 20,           // ° - Ángulo roll máximo
        gy_max: 10,             // °/s - Velocidad angular máxima
        duracion_sostenida: 0.3 // s - Duración mínima sostenida
    },

    // Deduplicación
    VENTANA_DEDUPLICACION_MS: 3000, // 3 segundos

    // Correlación GPS
    VENTANA_GPS_MS: 30000 // ±30 segundos
};

const G = 9.81; // m/s² - Aceleración de la gravedad

// ============================================================================
// TIPOS
// ============================================================================

export type TipoEventoV2 =
    | 'MANIOBRA_BRUSCA'
    | 'INCLINACION_LATERAL_EXCESIVA'
    | 'CURVA_VELOCIDAD_EXCESIVA'
    | 'RIESGO_VUELCO'; // Genérico cuando no coincide con ninguno

export type SeveridadV2 = 'LEVE' | 'MODERADA' | 'GRAVE'; // Por SI, no por tipo

export interface MedicionEstabilidad {
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;  // ⚠️ Asumimos que gy = ω_roll (roll rate)
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    si: number;  // ⚠️ CRÍTICO: Índice de Estabilidad [0,1]
}

export interface EventoDetectadoV2 {
    tipo: TipoEventoV2;
    severidad: SeveridadV2; // ⚠️ Viene del SI, no del tipo
    subtipo?: 'ESTATICO' | 'DINAMICO';
    timestamp: Date;
    sessionId: string;
    si: number; // ⚠️ CRÍTICO: Siempre incluir SI original
    valores: {
        gy_max?: number;
        roll_max?: number;
        ay_g_max?: number;
        ay_g_promedio?: number;
        duracion_sostenida?: number;
    };
    descripcion: string;
    // GPS (se añade en correlación)
    lat?: number;
    lon?: number;
    speed?: number;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Clasificar severidad por SI según Mandamiento M3.2
 * @param si Índice de estabilidad en [0,1]
 * @returns Severidad o null si SI ≥ 0.50
 */
function clasificarSeveridadPorSI(si: number): SeveridadV2 | null {
    if (si >= 0.50) return null; // Sin evento
    if (si < 0.20) return 'GRAVE';
    if (si < 0.35) return 'MODERADA';
    return 'LEVE';
}

/**
 * Calcular aceleración lateral en g
 * @param ay_ms2 Aceleración lateral en m/s²
 * @returns Aceleración en g
 */
function calcularAyG(ay_ms2: number): number {
    return Math.abs(ay_ms2) / G;
}

/**
 * Calcular duración sostenida de una condición en ventana
 * @param ventana Array de mediciones
 * @param condicion Función que evalúa si la condición se cumple
 * @returns Duración en segundos
 */
function calcularDuracionSostenida(
    ventana: MedicionEstabilidad[],
    condicion: (m: MedicionEstabilidad) => boolean
): number {
    let duracionTotal = 0;
    let ultimoTimestamp: number | null = null;

    for (const medicion of ventana) {
        if (condicion(medicion)) {
            if (ultimoTimestamp !== null) {
                const dt = (medicion.timestamp.getTime() - ultimoTimestamp) / 1000; // segundos
                duracionTotal += dt;
            }
            ultimoTimestamp = medicion.timestamp.getTime();
        } else {
            // Condición se rompió, resetear
            ultimoTimestamp = null;
        }
    }

    return duracionTotal;
}

// ============================================================================
// DETECTORES DE EVENTOS
// ============================================================================

/**
 * Determinar tipo de evento según fenómeno físico
 * Se ejecuta DESPUÉS de confirmar que SI < 0.50
 * 
 * Prioridad:
 * 1. MANIOBRA_BRUSCA: |gy| alto, roll bajo
 * 2. INCLINACION_LATERAL_EXCESIVA: roll alto, dinámica baja
 * 3. CURVA_VELOCIDAD_EXCESIVA: ay alto, roll moderado
 * 4. RIESGO_VUELCO: ninguno de los anteriores (genérico)
 * 
 * @param ventana Array de mediciones de la ventana temporal
 * @returns Tipo de evento y valores relevantes
 */
function determinarTipoEvento(ventana: MedicionEstabilidad[]): {
    tipo: TipoEventoV2;
    subtipo?: 'ESTATICO' | 'DINAMICO';
    valores: any;
} {
    // Extraer estadísticas de la ventana
    const gy_max = Math.max(...ventana.map(m => Math.abs(m.gy)));
    const roll_max = Math.max(...ventana.map(m => Math.abs(m.roll)));
    const ay_g_max = Math.max(...ventana.map(m => calcularAyG(m.ay)));
    const ay_g_promedio = ventana.reduce((sum, m) => sum + calcularAyG(m.ay), 0) / ventana.length;

    // Duración sostenida de ay > 0.30g
    const duracion_sostenida = calcularDuracionSostenida(
        ventana,
        (m) => calcularAyG(m.ay) > CONFIG.CURVA_VELOCIDAD.ay_g_moderada
    );

    // PRIORIDAD 1: MANIOBRA_BRUSCA
    // Condiciones: |gy| > 15°/s y |roll| < 10°
    if (gy_max > CONFIG.MANIOBRA_BRUSCA.gy_moderada &&
        roll_max < CONFIG.MANIOBRA_BRUSCA.roll_max) {
        return {
            tipo: 'MANIOBRA_BRUSCA',
            valores: { gy_max, roll_max }
        };
    }

    // PRIORIDAD 2: INCLINACION_LATERAL_EXCESIVA
    // Condiciones: |roll| > 20° y dinámica baja (ay < 0.10g, gy < 3°/s)
    if (roll_max > CONFIG.INCLINACION_EXCESIVA.roll_moderada &&
        ay_g_promedio < CONFIG.INCLINACION_EXCESIVA.ay_g_max &&
        gy_max < CONFIG.INCLINACION_EXCESIVA.gy_max) {
        return {
            tipo: 'INCLINACION_LATERAL_EXCESIVA',
            subtipo: 'ESTATICO',
            valores: { roll_max, ay_g_promedio, gy_max }
        };
    }

    // PRIORIDAD 3: CURVA_VELOCIDAD_EXCESIVA
    // Condiciones: ay > 0.30g sostenida, roll < 20°, gy < 10°/s
    if (ay_g_max > CONFIG.CURVA_VELOCIDAD.ay_g_moderada &&
        roll_max < CONFIG.CURVA_VELOCIDAD.roll_max &&
        gy_max < CONFIG.CURVA_VELOCIDAD.gy_max &&
        duracion_sostenida >= CONFIG.CURVA_VELOCIDAD.duracion_sostenida) {
        return {
            tipo: 'CURVA_VELOCIDAD_EXCESIVA',
            subtipo: 'DINAMICO',
            valores: { ay_g_max, roll_max, gy_max, duracion_sostenida }
        };
    }

    // FALLBACK: RIESGO_VUELCO (genérico)
    // Evento detectado por SI pero no coincide con patrón específico
    return {
        tipo: 'RIESGO_VUELCO',
        valores: { roll_max, gy_max, ay_g_max }
    };
}

/**
 * Generar descripción del evento según tipo
 */
function generarDescripcion(tipo: TipoEventoV2, valores: any, si: number): string {
    const siPorcentaje = (si * 100).toFixed(1);

    switch (tipo) {
        case 'MANIOBRA_BRUSCA':
            return `Maniobra brusca (giro/volantazo): ωroll=${valores.gy_max.toFixed(1)}°/s, roll=${valores.roll_max.toFixed(1)}°, SI=${siPorcentaje}%`;

        case 'INCLINACION_LATERAL_EXCESIVA':
            return `Inclinación lateral excesiva (estático): roll=${valores.roll_max.toFixed(1)}°, ay=${valores.ay_g_promedio.toFixed(2)}g, SI=${siPorcentaje}%`;

        case 'CURVA_VELOCIDAD_EXCESIVA':
            return `Curva a velocidad excesiva: ay=${valores.ay_g_max.toFixed(2)}g, roll=${valores.roll_max.toFixed(1)}°, duración=${(valores.duracion_sostenida * 1000).toFixed(0)}ms, SI=${siPorcentaje}%`;

        case 'RIESGO_VUELCO':
            return `Riesgo de vuelco (genérico): roll=${valores.roll_max.toFixed(1)}°, ωroll=${valores.gy_max.toFixed(1)}°/s, ay=${valores.ay_g_max.toFixed(2)}g, SI=${siPorcentaje}%`;

        default:
            return `Evento de estabilidad: SI=${siPorcentaje}%`;
    }
}

// ============================================================================
// DETECTOR PRINCIPAL
// ============================================================================

/**
 * Detecta eventos en una sesión usando análisis de ventanas temporales
 * 
 * @param sessionId ID de la sesión a analizar
 * @returns Array de eventos detectados con GPS correlacionado
 */
export async function detectarEventosSesionV2(sessionId: string): Promise<EventoDetectadoV2[]> {
    try {
        logger.info(`🔍 Detectando eventos V2 para sesión ${sessionId}`);

        // 1. Cargar mediciones ordenadas por timestamp
        const mediciones = await prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            select: {
                timestamp: true,
                ax: true,
                ay: true,
                az: true,
                gx: true,
                gy: true,
                gz: true,
                roll: true,
                pitch: true,
                yaw: true,
                si: true // ⚠️ CRÍTICO: Necesitamos el SI
            }
        });

        if (mediciones.length < CONFIG.VENTANA_TAMAÑO_MEDICIONES) {
            logger.warn(`⚠️ Sesión ${sessionId} tiene pocas mediciones: ${mediciones.length} (mínimo: ${CONFIG.VENTANA_TAMAÑO_MEDICIONES})`);
            return [];
        }

        logger.info(`📊 Analizando ${mediciones.length} mediciones con ventanas de ${CONFIG.VENTANA_TAMAÑO_MEDICIONES} mediciones`);

        // 2. Análisis por ventanas deslizantes
        const eventos: EventoDetectadoV2[] = [];
        const ventanaSize = CONFIG.VENTANA_TAMAÑO_MEDICIONES;

        for (let i = 0; i <= mediciones.length - ventanaSize; i++) {
            const ventana = mediciones.slice(i, i + ventanaSize) as MedicionEstabilidad[];

            // ⚠️ PASO 1: FILTRO POR SI < 0.50 (Mandamiento M3.1)
            // Buscar el SI mínimo en la ventana
            const si_min = Math.min(...ventana.map(m => m.si));

            // Si SI >= 0.50 en toda la ventana, no hay evento
            if (si_min >= 0.50) {
                continue;
            }

            // ⚠️ PASO 2: CLASIFICAR SEVERIDAD POR SI (Mandamiento M3.2)
            const severidad = clasificarSeveridadPorSI(si_min);
            if (!severidad) continue; // No debería pasar, pero por seguridad

            // ⚠️ PASO 3: DETERMINAR TIPO DE EVENTO SEGÚN FENÓMENO FÍSICO
            const { tipo, subtipo, valores } = determinarTipoEvento(ventana);

            // Crear evento
            const evento: EventoDetectadoV2 = {
                tipo,
                severidad, // ← Viene del SI, no del tipo
                subtipo,
                timestamp: ventana[ventana.length - 1].timestamp,
                sessionId,
                si: si_min, // ⚠️ Guardar SI original
                valores,
                descripcion: generarDescripcion(tipo, valores, si_min)
            };

            eventos.push(evento);
        }

        logger.info(`✅ Eventos detectados (antes de deduplicación): ${eventos.length}`);

        // 3. Deduplicar eventos muy cercanos
        const eventosDedupe = deduplicarEventos(eventos, CONFIG.VENTANA_DEDUPLICACION_MS);
        logger.info(`🔄 Eventos después de deduplicación: ${eventosDedupe.length}`);

        // 4. Correlacionar con GPS
        await correlacionarConGPS(eventosDedupe, sessionId);

        // 5. Filtrar eventos sin GPS
        const eventosConGPS = eventosDedupe.filter(e => e.lat && e.lon);
        logger.info(`📍 Eventos con GPS: ${eventosConGPS.length}/${eventosDedupe.length}`);

        // 6. Estadísticas finales
        const stats = {
            total: eventosConGPS.length,
            MANIOBRA_BRUSCA: eventosConGPS.filter(e => e.tipo === 'MANIOBRA_BRUSCA').length,
            INCLINACION_LATERAL_EXCESIVA: eventosConGPS.filter(e => e.tipo === 'INCLINACION_LATERAL_EXCESIVA').length,
            CURVA_VELOCIDAD_EXCESIVA: eventosConGPS.filter(e => e.tipo === 'CURVA_VELOCIDAD_EXCESIVA').length,
            RIESGO_VUELCO: eventosConGPS.filter(e => e.tipo === 'RIESGO_VUELCO').length,
            LEVE: eventosConGPS.filter(e => e.severidad === 'LEVE').length,
            MODERADA: eventosConGPS.filter(e => e.severidad === 'MODERADA').length,
            GRAVE: eventosConGPS.filter(e => e.severidad === 'GRAVE').length
        };

        logger.info(`📈 Estadísticas finales:`, stats);

        return eventosConGPS;

    } catch (error: any) {
        logger.error(`❌ Error detectando eventos V2: ${error.message}`);
        throw error;
    }
}

/**
 * Deduplicar eventos del mismo tipo en ventana temporal
 * Mantiene el evento de mayor severidad dentro de la ventana
 * 
 * @param eventos Array de eventos detectados
 * @param ventanaMs Ventana temporal en milisegundos
 * @returns Array de eventos deduplicados
 */
function deduplicarEventos(eventos: EventoDetectadoV2[], ventanaMs: number): EventoDetectadoV2[] {
    const resultado: EventoDetectadoV2[] = [];
    const ultimoPorTipo: Map<TipoEventoV2, EventoDetectadoV2> = new Map();

    for (const evento of eventos) {
        const ultimo = ultimoPorTipo.get(evento.tipo);

        if (!ultimo) {
            // Primer evento de este tipo
            ultimoPorTipo.set(evento.tipo, evento);
            resultado.push(evento);
        } else {
            const dt = evento.timestamp.getTime() - ultimo.timestamp.getTime();

            if (dt > ventanaMs) {
                // Fuera de ventana, es un nuevo evento
                ultimoPorTipo.set(evento.tipo, evento);
                resultado.push(evento);
            } else {
                // Dentro de ventana, mantener el de mayor severidad
                const ordenSeveridad: Record<SeveridadV2, number> = {
                    GRAVE: 3,
                    MODERADA: 2,
                    LEVE: 1
                };

                if (ordenSeveridad[evento.severidad] > ordenSeveridad[ultimo.severidad]) {
                    // Reemplazar el último con el de mayor severidad
                    const idx = resultado.indexOf(ultimo);
                    if (idx >= 0) {
                        resultado[idx] = evento;
                    }
                    ultimoPorTipo.set(evento.tipo, evento);
                }
                // Si la severidad es menor o igual, ignorar este evento (ya tenemos uno mejor)
            }
        }
    }

    return resultado;
}

/**
 * Correlacionar eventos con GPS más cercano (±30s)
 * Modifica el array de eventos in-place añadiendo lat, lon, speed
 * 
 * @param eventos Array de eventos a correlacionar
 * @param sessionId ID de la sesión
 */
async function correlacionarConGPS(eventos: EventoDetectadoV2[], sessionId: string): Promise<void> {
    if (eventos.length === 0) return;

    logger.info(`📡 Correlacionando ${eventos.length} eventos con GPS...`);

    // Cargar todos los puntos GPS de la sesión
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        select: {
            timestamp: true,
            latitude: true,
            longitude: true,
            speed: true
        }
    });

    if (gpsData.length === 0) {
        logger.warn(`⚠️ No hay datos GPS para sesión ${sessionId}`);
        return;
    }

    logger.info(`📡 Cargados ${gpsData.length} puntos GPS`);

    // Correlacionar cada evento con el GPS más cercano
    let correlacionados = 0;

    for (const evento of eventos) {
        let closestGPS = null;
        let minDiff = Infinity;

        for (const gps of gpsData) {
            const diff = Math.abs(gps.timestamp.getTime() - evento.timestamp.getTime());
            if (diff < CONFIG.VENTANA_GPS_MS && diff < minDiff) {
                minDiff = diff;
                closestGPS = gps;
            }
        }

        if (closestGPS) {
            evento.lat = closestGPS.latitude;
            evento.lon = closestGPS.longitude;
            evento.speed = closestGPS.speed;
            correlacionados++;
        } else {
            logger.warn(`⚠️ No se encontró GPS para evento ${evento.tipo} en ${evento.timestamp}`);
        }
    }

    logger.info(`✅ GPS correlacionado en ${correlacionados}/${eventos.length} eventos`);
}

/**
 * Guardar eventos en base de datos
 * 
 * @param eventos Array de eventos a guardar
 * @returns Número de eventos guardados exitosamente
 */
export async function guardarEventosV2(eventos: EventoDetectadoV2[]): Promise<number> {
    if (eventos.length === 0) {
        logger.info('No hay eventos para guardar');
        return 0;
    }

    logger.info(`💾 Guardando ${eventos.length} eventos en BD...`);

    let guardados = 0;
    let duplicados = 0;
    let errores = 0;

    for (const evento of eventos) {
        try {
            await prisma.stability_events.create({
                data: {
                    session_id: evento.sessionId,
                    timestamp: evento.timestamp,
                    type: evento.tipo,
                    severity: evento.severidad,
                    lat: evento.lat || null,
                    lon: evento.lon || null,
                    speed: evento.speed || null,
                    details: {
                        si: evento.si, // ⚠️ MANDAMIENTO M3.6: SI obligatorio
                        ...evento.valores,
                        subtipo: evento.subtipo,
                        description: evento.descripcion
                    }
                }
            });
            guardados++;
        } catch (error: any) {
            if (error.code === 'P2002') {
                // Evento duplicado (ya existe)
                duplicados++;
            } else {
                logger.error(`❌ Error guardando evento: ${error.message}`);
                errores++;
            }
        }
    }

    logger.info(`✅ Guardados: ${guardados}, Duplicados: ${duplicados}, Errores: ${errores}`);

    return guardados;
}

/**
 * Función completa: detectar y guardar eventos
 * 
 * @param sessionId ID de la sesión
 * @returns Objeto con total detectado y guardados
 */
export async function detectarYGuardarEventosV2(sessionId: string): Promise<{
    total: number;
    guardados: number;
}> {
    const eventos = await detectarEventosSesionV2(sessionId);
    const guardados = await guardarEventosV2(eventos);

    return {
        total: eventos.length,
        guardados
    };
}

// ============================================================================
// EXPORTAR
// ============================================================================

export const eventDetectorV2 = {
    detectarEventosSesionV2,
    guardarEventosV2,
    detectarYGuardarEventosV2,
    // Exportar funciones auxiliares para testing
    _internal: {
        clasificarSeveridadPorSI,
        determinarTipoEvento,
        generarDescripcion
    }
};

