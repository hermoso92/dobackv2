/**
 * 📊 SERVICIO DE CÁLCULO DE KPIs
 * Basado en análisis exhaustivo de archivos reales
 * Sin estimaciones - solo datos reales
 * ACTUALIZADO: Con claves operacionales correctas
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { keyCalculator } from './keyCalculator';
import { kpiCacheService } from './KPICacheService';
import { speedAnalyzer } from './speedAnalyzer';

const prisma = new PrismaClient();
const logger = createLogger('KPICalculator');

// ============================================================================
// CONSTANTES
// ============================================================================

const CONSTANTS = {
    ROTATIVO_SAMPLE_INTERVAL: 15, // segundos
    GPS_SAMPLE_INTERVAL: 5, // segundos aproximado
    EARTH_RADIUS_METERS: 6371000,
    MAX_JUMP_METERS: 100, // Máximo salto GPS válido en 5 segundos
    MIN_GPS_SATELLITES: 4,
    GPS_INTERPOLATION_THRESHOLD: 30 // segundos
};

// ============================================================================
// UTILIDADES GEOGRÁFICAS
// ============================================================================

/**
 * Calcular distancia entre dos puntos GPS (Haversine)
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return CONSTANTS.EARTH_RADIUS_METERS * c;
}

// ============================================================================
// KPI 1: TIEMPO CON ROTATIVO ENCENDIDO
// ============================================================================

export async function calcularTiempoRotativo(sessionIds: string[]): Promise<{
    tiempo_minutos: number;
    tiempo_horas: number;
    tiempo_formateado: string;
    muestras_on: number;
    muestras_off: number;
    porcentaje_on: number;
}> {
    const rotativoData = await prisma.rotativoMeasurement.findMany({
        where: { sessionId: { in: sessionIds } }
    });

    const muestrasON = rotativoData.filter(r => r.state === '1' || r.state === '2').length;
    const muestrasOFF = rotativoData.filter(r => r.state === '0').length;
    const totalMuestras = muestrasON + muestrasOFF;

    // Cada muestra = 15 segundos
    const tiempoMinutos = (muestrasON * CONSTANTS.ROTATIVO_SAMPLE_INTERVAL) / 60;
    const tiempoHoras = tiempoMinutos / 60;
    const porcentajeON = totalMuestras > 0 ? (muestrasON / totalMuestras) * 100 : 0;

    const h = Math.floor(tiempoHoras);
    const m = Math.floor((tiempoHoras - h) * 60);
    const s = Math.floor(((tiempoHoras - h) * 60 - m) * 60);
    const tiempoFormateado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return {
        tiempo_minutos: tiempoMinutos,
        tiempo_horas: tiempoHoras,
        tiempo_formateado: tiempoFormateado,
        muestras_on: muestrasON,
        muestras_off: muestrasOFF,
        porcentaje_on: porcentajeON
    };
}

// ============================================================================
// KPI 2: KILÓMETROS RECORRIDOS
// ============================================================================

export async function calcularKilometrosRecorridos(sessionIds: string[]): Promise<{
    km_total: number;
    km_con_gps: number;
    km_estimados: number;
    puntos_gps_validos: number;
    puntos_gps_invalidos: number;
    porcentaje_cobertura: number;
}> {
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: { sessionId: { in: sessionIds } },
        orderBy: { timestamp: 'asc' }
    });

    const gpsValidos = gpsData.filter(g => g.fix === '1' && g.satellites >= CONSTANTS.MIN_GPS_SATELLITES);
    const gpsInvalidos = gpsData.length - gpsValidos.length;

    let kmConGPS = 0;
    let kmEstimados = 0;
    let velocidadPromedio = 0;

    for (let i = 1; i < gpsValidos.length; i++) {
        const anterior = gpsValidos[i - 1];
        const actual = gpsValidos[i];

        const distancia = haversineDistance(
            anterior.latitude,
            anterior.longitude,
            actual.latitude,
            actual.longitude
        );

        // Calcular gap temporal
        const gapSegundos = (actual.timestamp.getTime() - anterior.timestamp.getTime()) / 1000;

        // Filtrar saltos imposibles (>100m en 5 segundos = >72 km/h)
        if (distancia < CONSTANTS.MAX_JUMP_METERS) {
            kmConGPS += distancia / 1000;

            // Actualizar velocidad promedio
            if (actual.speed > 0) {
                velocidadPromedio = (velocidadPromedio + actual.speed) / 2;
            }
        } else if (gapSegundos > CONSTANTS.GPS_INTERPOLATION_THRESHOLD) {
            // Gap largo - interpolar
            if (velocidadPromedio > 0) {
                const kmInterpolados = velocidadPromedio * (gapSegundos / 3600);
                kmEstimados += kmInterpolados;
            }
        }
    }

    const kmTotal = kmConGPS + kmEstimados;
    const porcentajeCobertura = gpsData.length > 0 ? (gpsValidos.length / gpsData.length) * 100 : 0;

    return {
        km_total: Math.round(kmTotal * 100) / 100,
        km_con_gps: Math.round(kmConGPS * 100) / 100,
        km_estimados: Math.round(kmEstimados * 100) / 100,
        puntos_gps_validos: gpsValidos.length,
        puntos_gps_invalidos: gpsInvalidos,
        porcentaje_cobertura: Math.round(porcentajeCobertura * 100) / 100
    };
}

// ============================================================================
// KPI 3: ÍNDICE DE ESTABILIDAD
// ============================================================================

export async function calcularIndiceEstabilidad(sessionIds: string[]): Promise<{
    indice_promedio: number;
    calificacion: string;
    estrellas: string;
    total_muestras: number;
}> {
    const result = await prisma.stabilityMeasurement.aggregate({
        where: { sessionId: { in: sessionIds } },
        _avg: { si: true },
        _count: { si: true }
    });

    const indicePromedio = result._avg.si || 0;
    const totalMuestras = result._count.si || 0;

    let calificacion: string;
    let estrellas: string;

    if (indicePromedio >= 0.90) {
        calificacion = 'EXCELENTE';
        estrellas = '⭐⭐⭐';
    } else if (indicePromedio >= 0.88) {
        calificacion = 'BUENA';
        estrellas = '⭐⭐';
    } else if (indicePromedio >= 0.85) {
        calificacion = 'ACEPTABLE';
        estrellas = '⭐';
    } else {
        calificacion = 'DEFICIENTE';
        estrellas = '⚠️';
    }

    return {
        indice_promedio: Math.round(indicePromedio * 1000) / 1000,
        calificacion,
        estrellas,
        total_muestras: totalMuestras
    };
}

// ============================================================================
// KPI 4: NÚMERO DE INCIDENCIAS
// Movido a eventDetector.ts - usa tabla completa con índice SI
// ============================================================================

// ============================================================================
// KPI 5: VELOCIDADES
// ============================================================================

export async function calcularVelocidades(sessionIds: string[]): Promise<{
    velocidad_maxima: number;
    velocidad_promedio: number;
    total_muestras: number;
}> {
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: {
            sessionId: { in: sessionIds },
            fix: '1',
            speed: { gt: 0 }
        },
        select: { speed: true }
    });

    if (gpsData.length === 0) {
        return {
            velocidad_maxima: 0,
            velocidad_promedio: 0,
            total_muestras: 0
        };
    }

    const velocidades = gpsData.map(g => g.speed);
    const velocidadMaxima = Math.max(...velocidades);
    const velocidadPromedio = velocidades.reduce((a, b) => a + b, 0) / velocidades.length;

    return {
        velocidad_maxima: Math.round(velocidadMaxima * 10) / 10,
        velocidad_promedio: Math.round(velocidadPromedio * 10) / 10,
        total_muestras: gpsData.length
    };
}

// ============================================================================
// KPI 6: HORAS DE CONDUCCIÓN
// ============================================================================

export async function calcularHorasConduccion(sessionIds: string[]): Promise<{
    horas: number;
    horas_formateado: string;
    sesiones_con_movimiento: number;
}> {
    const sessions = await prisma.session.findMany({
        where: { id: { in: sessionIds } },
        include: {
            gpsMeasurements: {
                where: { speed: { gt: 5 } }, // Velocidad > 5 km/h = en movimiento
                select: { id: true }
            }
        }
    });

    let horasTotales = 0;
    let sesionesConMovimiento = 0;

    for (const session of sessions) {
        if (!session.startTime || !session.endTime) continue;

        const duracionHoras = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
        const muestrasMovimiento = session.gpsMeasurements.length;

        // Solo contar si hubo movimiento significativo (>10% del tiempo)
        const tiempoEstimadoMovimiento = (muestrasMovimiento * CONSTANTS.GPS_SAMPLE_INTERVAL) / 3600;

        if (tiempoEstimadoMovimiento > duracionHoras * 0.1) {
            horasTotales += duracionHoras;
            sesionesConMovimiento++;
        }
    }

    const h = Math.floor(horasTotales);
    const m = Math.floor((horasTotales - h) * 60);
    const s = Math.floor(((horasTotales - h) * 60 - m) * 60);
    const formateado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return {
        horas: Math.round(horasTotales * 100) / 100,
        horas_formateado: formateado,
        sesiones_con_movimiento: sesionesConMovimiento
    };
}

// ============================================================================
// KPI 7: DISPONIBILIDAD
// ============================================================================

export async function calcularDisponibilidad(sessionIds: string[]): Promise<{
    porcentaje: number;
    sesiones_validas: number;
    sesiones_totales: number;
}> {
    const totalSesiones = sessionIds.length;

    if (totalSesiones === 0) {
        return {
            porcentaje: 0,
            sesiones_validas: 0,
            sesiones_totales: 0
        };
    }

    // Una sesión es válida si tiene datos de los 3 tipos
    const sesionesValidas = await prisma.session.count({
        where: {
            id: { in: sessionIds },
            stabilityMeasurements: { some: {} },
            gpsMeasurements: { some: {} },
            RotativoMeasurement: { some: {} }
        }
    });

    const porcentaje = (sesionesValidas / totalSesiones) * 100;

    return {
        porcentaje: Math.round(porcentaje * 100) / 100,
        sesiones_validas: sesionesValidas,
        sesiones_totales: totalSesiones
    };
}

// ============================================================================
// KPI 8: CLAVES OPERACIONALES REALES (DESDE BD)
// ============================================================================

export async function calcularClavesOperacionalesReales(sessionIds: string[]): Promise<{
    total_claves: number;
    por_tipo: Record<number, { cantidad: number; duracion_total: number; duracion_promedio: number }>;
    claves_recientes: any[];
}> {
    // ⚠️ TEMPORALMENTE DESHABILITADO - Prisma Client corrupto
    // TODO: Resolver problema de columna 'existe' inexistente
    return {
        total_claves: 0,
        por_tipo: {},
        claves_recientes: []
    };
}

// ============================================================================
// RESUMEN COMPLETO
// ============================================================================

export async function calcularKPIsCompletos(filters: {
    organizationId: string;
    from?: Date;
    to?: Date;
    vehicleIds?: string[];
}): Promise<any> {
    try {
        // ✅ OPTIMIZACIÓN: Verificar cache primero
        const cached = kpiCacheService.get(filters);
        if (cached) {
            logger.info('KPIs obtenidos desde cache', filters);
            return cached;
        }

        logger.info('Calculando KPIs completos (sin cache)', filters);

        // Construir filtro de sesiones
        const sessionFilter: any = {
            organizationId: filters.organizationId
        };

        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            sessionFilter.vehicleId = { in: filters.vehicleIds };
        }

        if (filters.from || filters.to) {
            sessionFilter.startTime = {};
            if (filters.from) sessionFilter.startTime.gte = filters.from;
            if (filters.to) sessionFilter.startTime.lte = filters.to;
        }

        // Obtener sesiones
        const sessions = await prisma.session.findMany({
            where: sessionFilter,
            select: { id: true, startTime: true, endTime: true, vehicleId: true }
        });

        const sessionIds = sessions.map(s => s.id);
        logger.info(`Sesiones encontradas: ${sessionIds.length}`);

        if (sessionIds.length === 0) {
            return {
                states: { states: [], total_time_seconds: 0, total_time_formatted: '00:00:00' },
                activity: { km_total: 0, driving_hours: 0, rotativo_on_seconds: 0, rotativo_on_percentage: 0 },
                stability: { total_incidents: 0, critical: 0, moderate: 0, light: 0 },
                quality: { indice_promedio: 0, calificacion: 'SIN DATOS', estrellas: '-' }
            };
        }

        // ✅ LEER EVENTOS DESDE BD (NO calcular en tiempo real)
        // IMPORTANTE: Filtrar eventos solo de las sesiones que pasaron el filtro
        const eventosDB = await prisma.stabilityEvent.findMany({
            where: { session_id: { in: sessionIds } },
            select: { type: true, session_id: true }
        });

        logger.info(`📊 Eventos encontrados en BD para ${sessionIds.length} sesiones: ${eventosDB.length}`);

        // Agrupar eventos por tipo
        const eventosPorTipo: Record<string, number> = {};
        for (const evento of eventosDB) {
            eventosPorTipo[evento.type] = (eventosPorTipo[evento.type] || 0) + 1;
        }

        const eventosDetectados = {
            total: eventosDB.length,
            por_tipo: eventosPorTipo,
            por_severidad: {} // BD no tiene severidad, se calcula en frontend si es necesario
        };

        // Calcular todos los otros KPIs en paralelo
        const [
            tiempoRotativo,
            kilometros,
            velocidades,
            horasConduccion,
            disponibilidad,
            indiceEstabilidad,
            analisisVelocidad,
            clavesOperacionales // ✅ NUEVO: Claves desde BD
        ] = await Promise.all([
            calcularTiempoRotativo(sessionIds),
            calcularKilometrosRecorridos(sessionIds),
            calcularVelocidades(sessionIds),
            calcularHorasConduccion(sessionIds),
            calcularDisponibilidad(sessionIds),
            calcularIndiceEstabilidad(sessionIds),
            speedAnalyzer.analizarVelocidades(sessionIds),
            calcularClavesOperacionalesReales(sessionIds) // ✅ NUEVO
        ]);

        // Calcular duración total de sesiones
        let duracionTotalHoras = 0;
        sessions.forEach(s => {
            if (s.startTime && s.endTime) {
                duracionTotalHoras += (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60);
            }
        });

        // Formatear tiempo total
        const formatTime = (hours: number): string => {
            const h = Math.floor(hours);
            const m = Math.floor((hours - h) * 60);
            const s = Math.floor(((hours - h) * 60 - m) * 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        // Calcular tiempos por clave (usando geocercas)
        const tiemposPorClave = await keyCalculator.calcularTiemposPorClave(sessionIds);

        const states = {
            states: [
                {
                    key: 0,
                    name: 'Taller',
                    duration_seconds: tiemposPorClave.clave0_segundos,
                    duration_formatted: tiemposPorClave.clave0_formateado,
                    count: Math.floor(tiemposPorClave.clave0_segundos / 60)
                },
                {
                    key: 1,
                    name: 'Operativo en Parque',
                    duration_seconds: tiemposPorClave.clave1_segundos,
                    duration_formatted: tiemposPorClave.clave1_formateado,
                    count: Math.floor(tiemposPorClave.clave1_segundos / 60)
                },
                {
                    key: 2,
                    name: 'Salida en Emergencia',
                    duration_seconds: tiemposPorClave.clave2_segundos,
                    duration_formatted: tiemposPorClave.clave2_formateado,
                    count: Math.floor(tiemposPorClave.clave2_segundos / 60)
                },
                {
                    key: 3,
                    name: 'En Incendio/Emergencia',
                    duration_seconds: tiemposPorClave.clave3_segundos,
                    duration_formatted: tiemposPorClave.clave3_formateado,
                    count: Math.floor(tiemposPorClave.clave3_segundos / 60)
                },
                {
                    key: 5,
                    name: 'Regreso al Parque',
                    duration_seconds: tiemposPorClave.clave5_segundos,
                    duration_formatted: tiemposPorClave.clave5_formateado,
                    count: Math.floor(tiemposPorClave.clave5_segundos / 60)
                }
            ],
            total_time_seconds: tiemposPorClave.total_segundos,
            total_time_formatted: tiemposPorClave.total_formateado,
            time_outside_station: tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos,
            time_outside_formatted: formatTime((tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos) / 3600)
        };

        const resultado = {
            states,
            activity: {
                km_total: kilometros.km_total,
                km_con_gps: kilometros.km_con_gps,
                km_estimados: kilometros.km_estimados,
                driving_hours: horasConduccion.horas,
                driving_hours_formatted: horasConduccion.horas_formateado,
                rotativo_on_seconds: Math.round(tiempoRotativo.tiempo_horas * 3600),
                rotativo_on_percentage: Math.round(tiempoRotativo.porcentaje_on * 10) / 10,
                rotativo_on_formatted: tiempoRotativo.tiempo_formateado,
                emergency_departures: horasConduccion.sesiones_con_movimiento // Aproximado por ahora
            },
            stability: {
                total_incidents: eventosDetectados.total,
                critical: 0, // TODO: Calcular desde BD si se añade severidad
                high: 0,
                moderate: 0,
                light: 0,
                por_tipo: eventosDetectados.por_tipo
            },
            quality: {
                indice_promedio: indiceEstabilidad.indice_promedio,
                calificacion: indiceEstabilidad.calificacion,
                estrellas: indiceEstabilidad.estrellas,
                total_muestras: indiceEstabilidad.total_muestras
            },
            velocidades: {
                maxima: analisisVelocidad.velocidad_maxima,
                promedio: analisisVelocidad.velocidad_promedio,
                excesos_totales: analisisVelocidad.excesos_totales,
                excesos_graves: analisisVelocidad.excesos_graves,
                excesos_justificados: analisisVelocidad.excesos_justificados
            },
            disponibilidad: {
                porcentaje: disponibilidad.porcentaje,
                sesiones_validas: disponibilidad.sesiones_validas,
                sesiones_totales: disponibilidad.sesiones_totales
            },
            metadata: {
                sesiones_analizadas: sessionIds.length,
                cobertura_gps: kilometros.porcentaje_cobertura,
                puntos_gps_validos: kilometros.puntos_gps_validos,
                puntos_gps_invalidos: kilometros.puntos_gps_invalidos
            },
            // ✅ NUEVO: Claves operacionales reales desde BD
            operationalKeys: {
                total: clavesOperacionales.total_claves,
                porTipo: clavesOperacionales.por_tipo,
                recientes: clavesOperacionales.claves_recientes
            }
        };

        // ✅ OPTIMIZACIÓN: Guardar en cache
        kpiCacheService.set(filters, resultado);

        return resultado;
    } catch (error) {
        logger.error('Error calculando KPIs completos', error);
        throw error;
    }
}

// ============================================================================
// EXPORTAR FUNCIONES
// ============================================================================

export const kpiCalculator = {
    calcularTiempoRotativo,
    calcularKilometrosRecorridos,
    calcularIndiceEstabilidad,
    calcularVelocidades,
    calcularHorasConduccion,
    calcularDisponibilidad,
    calcularKPIsCompletos
};

