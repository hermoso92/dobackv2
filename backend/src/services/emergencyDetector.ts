/**
 * 🚒 SERVICIO DE DETECCIÓN DE EMERGENCIAS
 * Detecta parques, clasifica sesiones y correlaciona salidas/vueltas
 */


import { createLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { haversineDistance } from './kpiCalculator';


const logger = createLogger('EmergencyDetector');

// ============================================================================
// CONSTANTES
// ============================================================================

const CONFIG = {
    RADIO_PARQUE_METROS: 100,
    GAP_MAX_MISMA_EMERGENCIA_MINUTOS: 30,
    DURACION_MIN_EMERGENCIA_MINUTOS: 2
};

// ============================================================================
// TIPOS
// ============================================================================

export type TipoSesion = 
    | 'SALIDA_EMERGENCIA'
    | 'VUELTA_EMERGENCIA'
    | 'RECORRIDO_COMPLETO'
    | 'TRASLADO'
    | 'PRUEBA'
    | 'DESCONOCIDO';

export interface ParqueBomberos {
    lat: number;
    lon: number;
    confianza: 'alta' | 'media' | 'baja';
    nombre?: string;
    id?: string;
}

export interface ClasificacionSesion {
    sessionId: string;
    tipo: TipoSesion;
    parqueOrigen?: ParqueBomberos;
    parqueDestino?: ParqueBomberos;
    salidaDesdeParque: boolean;
    llegadaAParque: boolean;
    rotativoEncendido: boolean;
    kmRecorridos: number;
    duracionMinutos: number;
}

export interface EmergenciaCompleta {
    salida: ClasificacionSesion;
    vuelta?: ClasificacionSesion;
    tiempoTotalMinutos: number;
    kmTotales: number;
    lugar: { lat: number; lon: number };
    completa: boolean;
}

// ============================================================================
// DETECCIÓN DE PARQUES
// ============================================================================

/**
 * Detecta si una ubicación está en un parque de bomberos (heurística)
 */
export async function detectarParqueHeuristica(
    sessionId: string
): Promise<ParqueBomberos | null> {
    // Obtener GPS de inicio y fin de sesión
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: { 
            sessionId,
            fix: '1',
            satellites: { gte: 4 }
        },
        orderBy: { timestamp: 'asc' },
        select: { latitude: true, longitude: true }
    });

    if (gpsData.length < 2) return null;

    const primerPunto = gpsData[0];
    const ultimoPunto = gpsData[gpsData.length - 1];

    // Si inicio y fin están cerca (<100m), probablemente es el parque
    const distancia = haversineDistance(
        primerPunto.latitude,
        primerPunto.longitude,
        ultimoPunto.latitude,
        ultimoPunto.longitude
    );

    if (distancia < CONFIG.RADIO_PARQUE_METROS * 2) {
        return {
            lat: (primerPunto.latitude + ultimoPunto.latitude) / 2,
            lon: (primerPunto.longitude + ultimoPunto.longitude) / 2,
            confianza: distancia < CONFIG.RADIO_PARQUE_METROS ? 'alta' : 'media'
        };
    }

    return null;
}

/**
 * Verifica si un punto está dentro de una geocerca de parque
 */
export async function puntoEstaEnParque(
    lat: number,
    lon: number,
    parkId?: string
): Promise<{ estaEnParque: boolean; parque?: any }> {
    // Si se proporciona parkId, verificar ese parque específico
    if (parkId) {
        const park = await prisma.park.findUnique({
            where: { id: parkId }
        });

        if (park && park.geometry) {
            const geometry = typeof park.geometry === 'string' 
                ? JSON.parse(park.geometry) 
                : park.geometry;

            // Si es un círculo
            if (geometry.type === 'circle' || geometry.type === 'Circle') {
                const distancia = haversineDistance(
                    lat, lon,
                    geometry.center.lat, geometry.center.lng
                );
                
                if (distancia <= geometry.radius) {
                    return { estaEnParque: true, parque: park };
                }
            }
        }
    }

    // Buscar en todos los parques de la organización
    const session = await prisma.session.findFirst({
        where: { id: { contains: '' } }, // Obtener organización
        select: { organizationId: true }
    });

    if (!session) return { estaEnParque: false };

    const parks = await prisma.park.findMany({
        where: { organizationId: session.organizationId }
    });

    for (const park of parks) {
        if (park.geometry) {
            const geometry = typeof park.geometry === 'string' 
                ? JSON.parse(park.geometry) 
                : park.geometry;

            if (geometry.type === 'circle' || geometry.type === 'Circle') {
                const distancia = haversineDistance(
                    lat, lon,
                    geometry.center.lat, geometry.center.lng
                );
                
                if (distancia <= geometry.radius) {
                    return { estaEnParque: true, parque: park };
                }
            }
        }
    }

    return { estaEnParque: false };
}

// ============================================================================
// CLASIFICACIÓN DE SESIONES
// ============================================================================

/**
 * Clasifica una sesión según su comportamiento
 */
export async function clasificarSesion(sessionId: string): Promise<ClasificacionSesion> {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            gpsMeasurements: {
                where: { fix: '1', satellites: { gte: 4 } },
                orderBy: { timestamp: 'asc' }
            },
            RotativoMeasurement: true
        }
    });

    if (!session) {
        throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    // Valores por defecto
    const clasificacion: ClasificacionSesion = {
        sessionId,
        tipo: 'DESCONOCIDO',
        salidaDesdeParque: false,
        llegadaAParque: false,
        rotativoEncendido: false,
        kmRecorridos: 0,
        duracionMinutos: 0
    };

    // Calcular duración
    if (session.startTime && session.endTime) {
        clasificacion.duracionMinutos = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
    }

    // Determinar si rotativo estuvo encendido
    const muestrasRotativoON = session.RotativoMeasurement.filter(r => r.state === '1' || r.state === '2').length;
    const totalMuestrasRotativo = session.RotativoMeasurement.length;
    clasificacion.rotativoEncendido = totalMuestrasRotativo > 0 && (muestrasRotativoON / totalMuestrasRotativo) > 0.1;

    // Analizar GPS
    if (session.gpsMeasurements.length >= 2) {
        const primerPunto = session.gpsMeasurements[0];
        const ultimoPunto = session.gpsMeasurements[session.gpsMeasurements.length - 1];

        // Calcular KM recorridos
        for (let i = 1; i < session.gpsMeasurements.length; i++) {
            const distancia = haversineDistance(
                session.gpsMeasurements[i - 1].latitude,
                session.gpsMeasurements[i - 1].longitude,
                session.gpsMeasurements[i].latitude,
                session.gpsMeasurements[i].longitude
            );

            if (distancia < 100) { // Filtrar saltos imposibles
                clasificacion.kmRecorridos += distancia / 1000;
            }
        }

        // Detectar parques
        const parqueDetectado = await detectarParqueHeuristica(sessionId);
        
        // Verificar si sale/llega a parque
        if (parqueDetectado) {
            const distOrigen = haversineDistance(
                primerPunto.latitude,
                primerPunto.longitude,
                parqueDetectado.lat,
                parqueDetectado.lon
            );

            const distDestino = haversineDistance(
                ultimoPunto.latitude,
                ultimoPunto.longitude,
                parqueDetectado.lat,
                parqueDetectado.lon
            );

            clasificacion.salidaDesdeParque = distOrigen < CONFIG.RADIO_PARQUE_METROS;
            clasificacion.llegadaAParque = distDestino < CONFIG.RADIO_PARQUE_METROS;

            if (clasificacion.salidaDesdeParque) clasificacion.parqueOrigen = parqueDetectado;
            if (clasificacion.llegadaAParque) clasificacion.parqueDestino = parqueDetectado;
        }

        // Determinar tipo de sesión
        if (clasificacion.salidaDesdeParque && clasificacion.rotativoEncendido) {
            clasificacion.tipo = 'SALIDA_EMERGENCIA';
        } else if (clasificacion.llegadaAParque && !clasificacion.rotativoEncendido) {
            clasificacion.tipo = 'VUELTA_EMERGENCIA';
        } else if (clasificacion.salidaDesdeParque && clasificacion.llegadaAParque) {
            if (clasificacion.rotativoEncendido) {
                clasificacion.tipo = 'RECORRIDO_COMPLETO';
            } else {
                clasificacion.tipo = 'PRUEBA';
            }
        } else {
            clasificacion.tipo = 'TRASLADO';
        }
    }

    return clasificacion;
}

// ============================================================================
// CORRELACIÓN DE EMERGENCIAS
// ============================================================================

/**
 * Correlaciona sesiones de salida y vuelta para formar emergencias completas
 */
export async function correlacionarEmergencias(
    sessionIds: string[]
): Promise<EmergenciaCompleta[]> {
    logger.info(`Correlacionando emergencias para ${sessionIds.length} sesiones`);

    // Clasificar todas las sesiones
    const clasificaciones = await Promise.all(
        sessionIds.map(id => clasificarSesion(id))
    );

    // Obtener sesiones completas para timestamps
    const sessions = await prisma.session.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, startTime: true, endTime: true }
    });

    const sessionMap = new Map(sessions.map(s => [s.id, s]));

    const salidas = clasificaciones.filter(c => c.tipo === 'SALIDA_EMERGENCIA');
    const vueltas = clasificaciones.filter(c => c.tipo === 'VUELTA_EMERGENCIA');

    const emergencias: EmergenciaCompleta[] = [];

    // Correlacionar salidas con vueltas
    for (const salida of salidas) {
        const sessionSalida = sessionMap.get(salida.sessionId);
        if (!sessionSalida || !sessionSalida.endTime) continue;

        // Buscar vuelta correspondiente (dentro de 30 minutos después)
        const vuelta = vueltas.find(v => {
            const sessionVuelta = sessionMap.get(v.sessionId);
            if (!sessionVuelta || !sessionVuelta.startTime) return false;

            const gapMinutos = (sessionVuelta.startTime.getTime() - sessionSalida.endTime!.getTime()) / (1000 * 60);
            
            return gapMinutos >= 0 && gapMinutos <= CONFIG.GAP_MAX_MISMA_EMERGENCIA_MINUTOS;
        });

        if (vuelta) {
            const sessionVuelta = sessionMap.get(vuelta.sessionId)!;
            
            emergencias.push({
                salida,
                vuelta,
                tiempoTotalMinutos: (sessionVuelta.endTime!.getTime() - sessionSalida.startTime.getTime()) / (1000 * 60),
                kmTotales: salida.kmRecorridos + vuelta.kmRecorridos,
                lugar: {
                    lat: salida.parqueOrigen?.lat || 0,
                    lon: salida.parqueOrigen?.lon || 0
                },
                completa: true
            });
        } else {
            // Salida sin vuelta correlacionada
            emergencias.push({
                salida,
                tiempoTotalMinutos: salida.duracionMinutos,
                kmTotales: salida.kmRecorridos,
                lugar: {
                    lat: salida.parqueOrigen?.lat || 0,
                    lon: salida.parqueOrigen?.lon || 0
                },
                completa: false
            });
        }
    }

    logger.info(`Emergencias detectadas: ${emergencias.length} (${emergencias.filter(e => e.completa).length} completas)`);

    return emergencias;
}

// ============================================================================
// ANÁLISIS DE OPERACIONES
// ============================================================================

/**
 * Analiza patrones operacionales de un vehículo
 */
export async function analizarOperacionesVehiculo(
    vehicleId: string,
    from?: Date,
    to?: Date
): Promise<{
    total_emergencias: number;
    emergencias_completas: number;
    emergencias_incompletas: number;
    tiempo_promedio_emergencia: number;
    km_promedio_emergencia: number;
    parques_detectados: ParqueBomberos[];
}> {
    // Obtener sesiones del vehículo
    const sessionFilter: any = { vehicleId };
    if (from || to) {
        sessionFilter.startTime = {};
        if (from) sessionFilter.startTime.gte = from;
        if (to) sessionFilter.startTime.lte = to;
    }

    const sessions = await prisma.session.findMany({
        where: sessionFilter,
        select: { id: true }
    });

    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length === 0) {
        return {
            total_emergencias: 0,
            emergencias_completas: 0,
            emergencias_incompletas: 0,
            tiempo_promedio_emergencia: 0,
            km_promedio_emergencia: 0,
            parques_detectados: []
        };
    }

    // Correlacionar emergencias
    const emergencias = await correlacionarEmergencias(sessionIds);

    // Calcular promedios
    const emergenciasCompletas = emergencias.filter(e => e.completa);
    const tiempoPromedio = emergenciasCompletas.length > 0
        ? emergenciasCompletas.reduce((sum, e) => sum + e.tiempoTotalMinutos, 0) / emergenciasCompletas.length
        : 0;
    
    const kmPromedio = emergenciasCompletas.length > 0
        ? emergenciasCompletas.reduce((sum, e) => sum + e.kmTotales, 0) / emergenciasCompletas.length
        : 0;

    // Detectar parques únicos
    const parquesMap = new Map<string, ParqueBomberos>();
    emergencias.forEach(e => {
        if (e.salida.parqueOrigen) {
            const key = `${e.salida.parqueOrigen.lat.toFixed(5)}_${e.salida.parqueOrigen.lon.toFixed(5)}`;
            if (!parquesMap.has(key)) {
                parquesMap.set(key, e.salida.parqueOrigen);
            }
        }
    });

    return {
        total_emergencias: emergencias.length,
        emergencias_completas: emergenciasCompletas.length,
        emergencias_incompletas: emergencias.length - emergenciasCompletas.length,
        tiempo_promedio_emergencia: Math.round(tiempoPromedio * 10) / 10,
        km_promedio_emergencia: Math.round(kmPromedio * 100) / 100,
        parques_detectados: Array.from(parquesMap.values())
    };
}

// ============================================================================
// ACTUALIZAR SESSION EN BD
// ============================================================================

/**
 * Actualiza una sesión con su clasificación
 */
export async function actualizarClasificacionSesion(
    clasificacion: ClasificacionSesion
): Promise<void> {
    try {
        await prisma.session.update({
            where: { id: clasificacion.sessionId },
            data: {
                type: clasificacion.tipo as any, // Mapear a SessionType del schema
                parkId: clasificacion.parqueOrigen?.id || clasificacion.parqueDestino?.id
            }
        });

        logger.info(`Sesión ${clasificacion.sessionId} actualizada: ${clasificacion.tipo}`);
    } catch (error) {
        logger.error(`Error actualizando sesión ${clasificacion.sessionId}`, error);
    }
}

// ============================================================================
// EXPORTAR
// ============================================================================

export const emergencyDetector = {
    detectarParqueHeuristica,
    puntoEstaEnParque,
    clasificarSesion,
    correlacionarEmergencias,
    analizarOperacionesVehiculo,
    actualizarClasificacionSesion
};

