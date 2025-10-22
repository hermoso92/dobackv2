/**
 * 🚦 SERVICIO DE ANÁLISIS DE VELOCIDADES
 * Límites específicos para camiones de bomberos
 */

import { createLogger } from '../utils/logger';
import { tomtomSpeedLimitsService } from './TomTomSpeedLimitsService';
import { prisma } from '../lib/prisma';

const logger = createLogger('SpeedAnalyzer');

// ============================================================================
// CONSTANTES - LÍMITES PARA CAMIONES
// ============================================================================

export const LIMITES_CAMIONES = {
    AUTOPISTA_AUTOVIA: 90,
    CARRETERA_ARCEN_PAVIMENTADO: 80,  // arcén ≥1.50m o varios carriles
    RESTO_VIAS_FUERA_POBLADO: 70,
    AUTOPISTA_URBANA: 90,
    CONVENCIONAL_SEPARACION_FISICA: 80,
    CONVENCIONAL_SIN_SEPARACION: 80,
    VIA_SIN_PAVIMENTAR: 30
};

// Sin tolerancia por emergencia: cualquier superación del límite es infracción
const TOLERANCIA_EMERGENCIA = 0;

// ============================================================================
// TIPOS
// ============================================================================

export type TipoVia = keyof typeof LIMITES_CAMIONES;

export interface ExcesoVelocidad {
    lat: number;
    lon: number;
    velocidad: number;
    limite: number;
    exceso: number;
    porcentajeExceso: number;
    tipoVia: TipoVia;
    rotativoOn: boolean;
    justificado: boolean;
    severidad: 'GRAVE' | 'MODERADA' | 'LEVE';
    timestamp: Date;
    vehicleId: string;
    sessionId: string;
}

// ============================================================================
// DETECCIÓN DE TIPO DE VÍA
// ============================================================================

/**
 * Determinar tipo de vía por velocidad observada (heurística conservadora)
 * Nota: Sustituir por integración con TomTom cuando esté disponible
 */
function detectarTipoVia(velocidadObservada?: number): TipoVia {
    const v = Number(velocidadObservada) || 0;
    if (v >= 100) return 'AUTOPISTA_AUTOVIA'; // límite base 90
    if (v >= 80) return 'CONVENCIONAL_SEPARACION_FISICA'; // límite base 80
    if (v >= 60) return 'RESTO_VIAS_FUERA_POBLADO'; // límite base 70
    return 'VIA_SIN_PAVIMENTAR'; // 30 km/h
}

// Resolver límite efectivo considerando rotativo y parque
function resolverLimiteVelocidad(
    tipoVia: TipoVia,
    rotativoOn: boolean,
    inPark: boolean
): number {
    if (inPark) return 20; // km/h dentro del parque
    const base = LIMITES_CAMIONES[tipoVia];
    // rotativoOn no añade tolerancia: se aplica el límite base siempre
    return base;
}

// Validar velocidad (km/h)
function esVelocidadValida(speed: number): boolean {
    if (!isFinite(speed)) return false;
    if (speed <= 0) return false;
    if (speed > 160) return false; // descartar outliers
    return true;
}

// Distancia euclídea aproximada en grados (para deduplicar localmente)
function distancia2(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dlat = lat1 - lat2;
    const dlon = lon1 - lon2;
    return dlat * dlat + dlon * dlon;
}

// ============================================================================
// ANÁLISIS DE VELOCIDADES
// ============================================================================

/**
 * Detectar excesos de velocidad en una sesión
 */
export async function detectarExcesosSesion(
    sessionId: string,
    from?: Date | string,
    to?: Date | string
): Promise<ExcesoVelocidad[]> {

    const dateFrom = from ? new Date(from) : undefined;
    const dateTo = to ? new Date(to) : undefined;
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            // cambio aquí: incluir TODOS los puntos GPS en rango (sin filtrar por speed) para poder calcular velocidad por Haversine
            gpsMeasurements: {
                where: {
                    ...(dateFrom && dateTo ? { timestamp: { gte: dateFrom, lte: dateTo } } : {})
                },
                orderBy: { timestamp: 'asc' }
            },
            RotativoMeasurement: {
                orderBy: { timestamp: 'asc' }
            },
            vehicle: {
                select: { id: true }
            }
        }
    });

    if (!session) return [];

    const excesos: ExcesoVelocidad[] = [];

    // Crear mapa de estado rotativo
    const rotativoMap = new Map();
    session.RotativoMeasurement.forEach(r => {
        rotativoMap.set(r.timestamp.getTime(), r.state);
    });

    let ultimoExceso: ExcesoVelocidad | null = null;

    // Precomputar velocidades si faltan usando Haversine entre puntos consecutivos
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    for (let i = 0; i < session.gpsMeasurements.length; i++) {
        const gps = session.gpsMeasurements[i];
        const prev = i > 0 ? session.gpsMeasurements[i - 1] : null;
        // Buscar estado de rotativo más cercano
        let rotativoOn = false;
        const timestampGPS = gps.timestamp.getTime();
        for (const [timestampRot, state] of Array.from(rotativoMap.entries())) {
            if (Math.abs(timestampRot - timestampGPS) < 30000) {
                rotativoOn = state === '1';
                break;
            }
        }

        // Velocidad observada o calculada
        let speed = Number(gps.speed) || 0;
        if (!esVelocidadValida(speed) && prev) {
            const dtSec = Math.max(0, Math.floor((gps.timestamp.getTime() - prev.timestamp.getTime()) / 1000));
            if (dtSec > 0 && dtSec <= 120) {
                const dKm = haversineKm(prev.latitude as number, prev.longitude as number, gps.latitude as number, gps.longitude as number);
                const calcKmh = dKm * (3600 / dtSec);
                if (isFinite(calcKmh)) speed = calcKmh;
            }
        }
        // Obtener límite real desde TomTom (con caché/circuit breaker) y aplicar fallback estático si 0
        let limiteReal = 0;
        try {
            const limiteInfo = await tomtomSpeedLimitsService.obtenerLimiteVelocidad(gps.latitude, gps.longitude);
            limiteReal = Number(limiteInfo.speedLimit) || 0;
        } catch (e: any) {
            logger.warn('Fallo obteniendo límite TomTom, usando 0', { error: e?.message });
            limiteReal = 0;
        }
        if (!limiteReal || limiteReal <= 0) {
            const tipo = detectarTipoVia(speed);
            // No tenemos detección de parque aquí; asumir fuera de parque para no falsear a 20 km/h
            limiteReal = resolverLimiteVelocidad(tipo, rotativoOn, false);
        }

        // Detectar exceso
        if (!esVelocidadValida(speed)) continue;

        if (esVelocidadValida(speed) && speed > limiteReal) {
            const exceso = speed - limiteReal;
            const porcentajeExceso = (exceso / limiteReal) * 100;

            // Determinar severidad según normativa DGT
            let severidad: 'GRAVE' | 'MODERADA' | 'LEVE';
            if (exceso > 20) severidad = 'GRAVE';        // >20 km/h
            else if (exceso > 10) severidad = 'MODERADA'; // 10-20 km/h
            else severidad = 'LEVE';                      // 1-10 km/h

            // Justificado si es emergencia y exceso ≤20 km/h
            const justificado = rotativoOn && exceso <= TOLERANCIA_EMERGENCIA;

            const nuevo: ExcesoVelocidad = {
                lat: gps.latitude,
                lon: gps.longitude,
                velocidad: speed,
                limite: limiteReal,
                exceso,
                porcentajeExceso,
                tipoVia: detectarTipoVia(speed),
                rotativoOn,
                justificado,
                severidad,
                timestamp: gps.timestamp,
                vehicleId: session.vehicle.id,
                sessionId: session.id
            };

            // Deduplicación: dentro de 3s y proximidad ~50m (≈5e-4 deg, usar cuadrado ~2.5e-7)
            if (
                ultimoExceso &&
                Math.abs(nuevo.timestamp.getTime() - ultimoExceso.timestamp.getTime()) <= 3000 &&
                distancia2(nuevo.lat, nuevo.lon, ultimoExceso.lat, ultimoExceso.lon) < 2.5e-7
            ) {
                if (nuevo.exceso > ultimoExceso.exceso) {
                    excesos[excesos.length - 1] = nuevo;
                    ultimoExceso = nuevo;
                }
            } else {
                excesos.push(nuevo);
                ultimoExceso = nuevo;
            }
        }
    }

    return excesos;
}

/**
 * Analizar velocidades de múltiples sesiones
 */
export async function analizarVelocidades(sessionIds: string[], from?: Date | string, to?: Date | string): Promise<{
    excesos_totales: number;
    excesos_graves: number;
    excesos_justificados: number;
    velocidad_maxima: number;
    velocidad_promedio: number;
    excesos: ExcesoVelocidad[];
}> {
    const todosExcesos: ExcesoVelocidad[] = [];

    for (const sessionId of sessionIds) {
        const excesos = await detectarExcesosSesion(sessionId, from, to);
        todosExcesos.push(...excesos);
    }

    const excesosGraves = todosExcesos.filter(e => e.severidad === 'GRAVE').length;
    const excesosJustificados = todosExcesos.filter(e => e.justificado).length;

    // Calcular velocidades de todas las sesiones

    const gpsWhere: any = {
        sessionId: { in: sessionIds },
        speed: { gt: 0 }
    };
    if (from && to) {
        gpsWhere.timestamp = { gte: new Date(from), lte: new Date(to) };
    }
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: gpsWhere,
        select: { speed: true }
    });

    const velocidades = gpsData
        .map(g => Number(g.speed) || 0)
        .filter(s => esVelocidadValida(s));
    const velocidadMaxima = velocidades.length > 0 ? Math.max(...velocidades) : 0;
    const velocidadPromedio = velocidades.length > 0
        ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length
        : 0;

    return {
        excesos_totales: todosExcesos.length,
        excesos_graves: excesosGraves,
        excesos_justificados: excesosJustificados,
        velocidad_maxima: Math.round(velocidadMaxima * 10) / 10,
        velocidad_promedio: Math.round(velocidadPromedio * 10) / 10,
        excesos: todosExcesos
    };
}

// ============================================================================
// EXPORTAR
// ============================================================================

export const speedAnalyzer = {
    detectarExcesosSesion,
    analizarVelocidades,
    LIMITES_CAMIONES,
    TOLERANCIA_EMERGENCIA
};

