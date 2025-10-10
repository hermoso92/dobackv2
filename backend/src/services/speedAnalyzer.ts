/**
 * 🚦 SERVICIO DE ANÁLISIS DE VELOCIDADES
 * Límites específicos para camiones de bomberos
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const prisma = new PrismaClient();
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

const TOLERANCIA_EMERGENCIA = 20; // km/h adicionales permitidos en emergencias

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
 * Determinar tipo de vía (simplificado - mejorar con TomTom API)
 */
function detectarTipoVia(velocidadMaximaZona?: number): TipoVia {
    // Por ahora usar detección simple basada en velocidad
    // TODO: Integrar con TomTom para obtener tipo real

    if (!velocidadMaximaZona) return 'CONVENCIONAL_SIN_SEPARACION';

    if (velocidadMaximaZona >= 100) return 'AUTOPISTA_AUTOVIA';
    if (velocidadMaximaZona >= 80) return 'CARRETERA_ARCEN_PAVIMENTADO';
    if (velocidadMaximaZona >= 50) return 'RESTO_VIAS_FUERA_POBLADO';
    return 'CONVENCIONAL_SIN_SEPARACION';
}

// ============================================================================
// ANÁLISIS DE VELOCIDADES
// ============================================================================

/**
 * Detectar excesos de velocidad en una sesión
 */
export async function detectarExcesosSesion(
    sessionId: string
): Promise<ExcesoVelocidad[]> {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            gpsMeasurements: {
                where: { fix: '1', satellites: { gte: 4 }, speed: { gt: 0 } },
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

    for (const gps of session.gpsMeasurements) {
        // Buscar estado de rotativo más cercano
        let rotativoOn = false;
        const timestampGPS = gps.timestamp.getTime();
        for (const [timestampRot, state] of Array.from(rotativoMap.entries())) {
            if (Math.abs(timestampRot - timestampGPS) < 30000) {
                rotativoOn = state === '1';
                break;
            }
        }

        // Determinar tipo de vía (simplificado)
        const tipoVia = detectarTipoVia();
        const limiteBase = LIMITES_CAMIONES[tipoVia];
        const limiteReal = limiteBase + (rotativoOn ? TOLERANCIA_EMERGENCIA : 0);

        // Detectar exceso
        if (gps.speed > limiteReal) {
            const exceso = gps.speed - limiteReal;
            const porcentajeExceso = (exceso / limiteReal) * 100;

            // Determinar severidad
            let severidad: 'GRAVE' | 'MODERADA' | 'LEVE';
            if (exceso > 30) severidad = 'GRAVE';
            else if (exceso > 15) severidad = 'MODERADA';
            else severidad = 'LEVE';

            // Justificado si es emergencia y exceso ≤20 km/h
            const justificado = rotativoOn && exceso <= TOLERANCIA_EMERGENCIA;

            excesos.push({
                lat: gps.latitude,
                lon: gps.longitude,
                velocidad: gps.speed,
                limite: limiteReal,
                exceso,
                porcentajeExceso,
                tipoVia,
                rotativoOn,
                justificado,
                severidad,
                timestamp: gps.timestamp,
                vehicleId: session.vehicle.id,
                sessionId: session.id
            });
        }
    }

    return excesos;
}

/**
 * Analizar velocidades de múltiples sesiones
 */
export async function analizarVelocidades(sessionIds: string[]): Promise<{
    excesos_totales: number;
    excesos_graves: number;
    excesos_justificados: number;
    velocidad_maxima: number;
    velocidad_promedio: number;
    excesos: ExcesoVelocidad[];
}> {
    const todosExcesos: ExcesoVelocidad[] = [];

    for (const sessionId of sessionIds) {
        const excesos = await detectarExcesosSesion(sessionId);
        todosExcesos.push(...excesos);
    }

    const excesosGraves = todosExcesos.filter(e => e.severidad === 'GRAVE').length;
    const excesosJustificados = todosExcesos.filter(e => e.justificado).length;

    // Calcular velocidades de todas las sesiones
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: {
            sessionId: { in: sessionIds },
            fix: '1',
            speed: { gt: 0 }
        },
        select: { speed: true }
    });

    const velocidades = gpsData.map(g => g.speed);
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

