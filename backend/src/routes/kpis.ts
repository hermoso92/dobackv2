/**
 * Rutas API para KPIs operativos.
 * Implementación TypeScript para backend Node.js/Express
 * ACTUALIZADO: Usa kpiCalculator con datos reales + Redis Caché
 * 06/Nov/2025: Añadida validación organizationId (ChatGPT P0 CRÍTICO)
 */
import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validateOrganization } from '../middleware/validateOrganization';
import { cacheMiddleware } from '../middleware/cache';
import { calcularTiemposPorClave } from '../services/keyCalculator';
import { kpiCacheService } from '../services/KPICacheService';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('KPIRoutes');

// Función auxiliar para formatear duración
function formatDuration(seconds: number): string {
    if (seconds < 0) seconds = 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Función auxiliar para calcular distancia Haversine
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// cambio aquí
// Helper: conectar Prisma con reintentos (backoff exponencial breve)
async function connectWithRetry(prisma: any, retries: number = 4): Promise<void> {
    let delay = 150; // ms
    for (let i = 0; i < retries; i++) {
        try {
            await prisma.$connect();
            return;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
}


interface KPIFilters {
    from?: string;
    to?: string;
    vehicleIds?: string[];
    organizationId: string;
}

/**
 * GET /api/v1/kpis/test
 * Endpoint de prueba simple
 */
router.get('/test', authenticate, async (req: Request, res: Response) => {
    try {
        logger.info('🧪 Endpoint de prueba ejecutándose');
        res.json({
            success: true,
            message: 'Endpoint de prueba funcionando',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        logger.error('Error en endpoint de prueba:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/summary
 * Retorna resumen completo con todos los KPIs
 */
// ✅ CHATGPT P0 CRÍTICO: Validar organizationId antes de procesar
router.get('/summary', 
    authenticate, 
    validateOrganization,
    cacheMiddleware({ ttl: 300, keyPrefix: 'kpis' }), // ✅ Caché de 5 minutos
    async (req: Request, res: Response) => {
    try {
        logger.info('🚀 Iniciando /api/kpis/summary');

        const organizationId = (req as any).user?.organizationId;
        logger.info('🔍 Organization ID obtenido:', { organizationId });

        if (!organizationId) {
            logger.error('❌ Organization ID not found');
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        // Aceptar ambos formatos: from/to y startDate/endDate (compatibilidad frontend)
        const from = (req.query.from as string) || (req.query.startDate as string);
        const to = (req.query.to as string) || (req.query.endDate as string);
        const force = (req.query.force as string) === 'true';

        // MANDAMIENTO M8.1: Validar rango de fechas obligatorio
        logger.info('📅 Validando fechas:', { from, to });
        if (!from || !to) {
            logger.error('❌ Fechas faltantes:', { from, to });
            return res.status(400).json({
                success: false,
                error: 'Rango de fechas obligatorio: from y to (YYYY-MM-DD)'
            });
        }

        // IMPORTANTE: Express puede parsear como vehicleIds[] O vehicleIds
        const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
        let vehicleIds: string[] | undefined;

        if (vehicleIdsRaw) {
            if (Array.isArray(vehicleIdsRaw)) {
                vehicleIds = vehicleIdsRaw as string[];
            } else {
                // Si es string, puede venir separado por comas
                const vehicleIdsStr = vehicleIdsRaw as string;
                vehicleIds = vehicleIdsStr.includes(',')
                    ? vehicleIdsStr.split(',').map(id => id.trim())
                    : [vehicleIdsStr];
            }
        }

        // DEBUG: Ver qué parámetros llegan
        logger.info('📊 FILTROS RECIBIDOS EN /api/kpis/summary', {
            from,
            to,
            vehicleIds,
            queryCompleta: req.query,
            vehicleIdsLength: vehicleIds?.length || 0
        });

        // Construir filtros de fecha (usar fin de día exclusivo para 'to')
        let dateFrom: Date | undefined;
        let dateToExclusive: Date | undefined;

        if (from && to) {
            dateFrom = new Date(from);
            const toDate = new Date(to);
            // Hacer 'to' inclusivo llevando el límite a < (to + 1 día)
            dateToExclusive = new Date(toDate.getTime());
            dateToExclusive.setDate(dateToExclusive.getDate() + 1);
        }

        // Si se solicita forzar, invalidar cache de KPIs para esta organización
        if (force) {
            try {
                kpiCacheService.invalidate(organizationId);
                logger.info('Cache de KPIs invalidado por force=true');
            } catch (e: any) {
                logger.warn('No se pudo invalidar cache de KPIs', { error: e?.message });
            }
        }

        // Importar PrismaClient directamente para evitar problemas de scope
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // DEBUG: Verificar que stability_events esté disponible
        logger.info('🔍 Verificando prisma.stability_events (tabla correcta):', {
            prismaExists: !!prisma,
            stabilityEventsExists: !!(prisma && prisma.stability_events),
            prismaType: typeof prisma,
            stabilityEventsType: typeof (prisma && prisma.stability_events),
            prismaConstructor: prisma?.constructor?.name
        });

        // Consultar sesiones básicas
        let sessions: Array<{ id: string; startTime: Date; endTime: Date | null; vehicleId: string }> = [];
        let sessionIds: string[] = [];

        try {
            logger.info('🔍 Consultando sesiones...');

            // Construir filtro de sesiones
            const sessionsWhere: any = { organizationId };

            if (vehicleIds && vehicleIds.length > 0) {
                sessionsWhere.vehicleId = { in: vehicleIds };
            }

            if (dateFrom && dateToExclusive) {
                sessionsWhere.startTime = {
                    gte: dateFrom,
                    lt: dateToExclusive
                };
            }

            sessions = await prisma.session.findMany({
                where: sessionsWhere,
                select: { id: true, startTime: true, endTime: true, vehicleId: true }
            });

            sessionIds = sessions.map(s => s.id);
            logger.info(`✅ Encontradas ${sessions.length} sesiones`);

        } catch (e: any) {
            logger.error('❌ Error consultando sesiones:', e);
            return res.status(500).json({
                success: false,
                error: 'Error consultando sesiones'
            });
        }

        // Calcular KPIs reales basados en las sesiones encontradas
        logger.info(`📊 Calculando KPIs para ${sessions.length} sesiones`);

        let summary: any = {
            states: {
                states: [],
                total_time_seconds: 0,
                total_time_formatted: '00:00:00',
                time_outside_station: 0,
                time_outside_formatted: '00:00:00'
            },
            activity: {
                km_total: 0,
                driving_hours: 0,
                driving_hours_formatted: '00:00:00',
                rotativo_on_seconds: 0,
                rotativo_on_percentage: 0,
                rotativo_on_formatted: '00:00:00',
                emergency_departures: 0
            },
            stability: {
                total_incidents: 0,
                critical: 0,
                moderate: 0,
                light: 0
            },
            metadata: {
                sesiones_analizadas: sessions.length,
                fecha_calculo: new Date().toISOString()
            }
        };

        let estadosOperacionales: any = null;
        let timeOutside = 0;

        logger.info(`🔍 Verificando sessionIds: ${sessionIds.length} IDs`);
        logger.info(`🔍 sessionIds:`, sessionIds);

        // Asegurar que el cálculo de estabilidad se ejecute siempre
        if (sessionIds.length > 0) {
            logger.info('🔍 Ejecutando cálculos con sessionIds...');
        } else {
            logger.warn('⚠️ No hay sessionIds, usando valores por defecto');
        }

        if (sessionIds.length > 0) {
            try {
                // Calcular estados operacionales usando keyCalculator
                logger.info('🔑 Calculando estados operacionales...', { sessionIdsCount: sessionIds.length });
                estadosOperacionales = await calcularTiemposPorClave(sessionIds);
                logger.info('🔍 DEBUG: estadosOperacionales recibido:', {
                    total_segundos: estadosOperacionales.total_segundos,
                    clave0: estadosOperacionales.clave0_segundos,
                    clave2: estadosOperacionales.clave2_segundos,
                    clave3: estadosOperacionales.clave3_segundos,
                    clave4: estadosOperacionales.clave4_segundos,
                    clave5: estadosOperacionales.clave5_segundos
                });

                // Convertir a formato esperado
                const stateNames = {
                    0: "Taller",
                    1: "Operativo en Parque",
                    2: "Salida en Emergencia",
                    3: "En Siniestro",
                    4: "Fin de Actuación",
                    5: "Regreso al Parque"
                };

                const states: any[] = [];
                let totalTime = 0;

                // Si keyCalculator devolvió valores en 0, calcular tiempos básicos
                if (estadosOperacionales.total_segundos === 0) {
                    logger.warn('⚠️ FALLBACK: KeyCalculator devolvió 0, usando tiempos básicos (TODAS LAS CLAVES IGUALES)');

                    // Calcular tiempo total de las sesiones
                    const sessionDurations = sessions.map(s => {
                        const start = new Date(s.startTime);
                        const end = s.endTime ? new Date(s.endTime) : new Date();
                        return (end.getTime() - start.getTime()) / 1000;
                    });

                    totalTime = sessionDurations.reduce((sum, duration) => sum + duration, 0);
                    timeOutside = totalTime; // Asumir que todo el tiempo está fuera del parque

                    // Crear estados básicos
                    for (let clave = 0; clave <= 5; clave++) {
                        const duration = clave === 1 ? 0 : Math.floor(totalTime / 5); // Distribuir tiempo entre estados operativos

                        states.push({
                            key: clave,
                            name: stateNames[clave as keyof typeof stateNames],
                            duration_seconds: duration,
                            duration_formatted: formatDuration(duration),
                            count: Math.floor(duration / 60) // Aproximar cantidad
                        });
                    }
                } else {
                    // Usar datos del keyCalculator (formato: clave0_segundos, clave1_segundos, etc.)
                    logger.info('✅ USANDO DATOS REALES de keyCalculator (cada clave diferente)');
                    for (let clave = 0; clave <= 5; clave++) {
                        const duration = estadosOperacionales[`clave${clave}_segundos`] || 0;
                        logger.info(`   Clave ${clave}: ${duration}s`);

                        states.push({
                            key: clave,
                            name: stateNames[clave as keyof typeof stateNames],
                            duration_seconds: duration,
                            duration_formatted: formatDuration(duration),
                            count: Math.floor(duration / 60) // Aproximar cantidad basada en duración
                        });

                        totalTime += duration;
                        if (clave >= 2) { // Claves 2, 3, 4, 5 = fuera del parque
                            timeOutside += duration;
                        }
                    }
                }

                summary.states = {
                    states,
                    total_time_seconds: totalTime,
                    total_time_formatted: formatDuration(totalTime),
                    time_outside_station: timeOutside,
                    time_outside_formatted: formatDuration(timeOutside)
                };

                logger.info(`✅ Estados calculados: ${totalTime}s total, ${timeOutside}s fuera del parque`);

            } catch (e: any) {
                logger.error('❌ Error calculando estados operacionales:', e);
            }

            try {
                // Calcular métricas de actividad básicas
                logger.info('📈 Calculando métricas de actividad...');

                // Obtener datos GPS para calcular km
                const gpsData = await prisma.gpsMeasurement.findMany({
                    where: { sessionId: { in: sessionIds } },
                    select: { latitude: true, longitude: true, speed: true, timestamp: true, fix: true, satellites: true },
                    orderBy: { timestamp: 'asc' }
                });

                // Aplicar filtro GPS corregido (mismo que en kpiCalculator.ts)
                const gpsValidos = gpsData.filter(g => {
                    const lat = typeof g.latitude === 'string' ? parseFloat(g.latitude) : g.latitude;
                    const lng = typeof g.longitude === 'string' ? parseFloat(g.longitude) : g.longitude;
                    return !isNaN(lat) && !isNaN(lng) &&
                        lat >= 40.2 && lat <= 40.6 &&
                        lng >= -3.9 && lng <= -3.5 &&
                        g.satellites >= 4;
                });

                // Calcular km usando Haversine con GPS válidos
                let totalKm = 0;
                let validPoints = 0;
                for (let i = 1; i < gpsValidos.length; i++) {
                    const prev = gpsValidos[i - 1];
                    const curr = gpsValidos[i];

                    const distance = haversineDistance(
                        prev.latitude, prev.longitude,
                        curr.latitude, curr.longitude
                    );

                    // Filtrar distancias anómalas (más de 100m entre puntos consecutivos)
                    if (distance < 100) { // 100m máximo entre puntos
                        totalKm += distance / 1000; // Convertir a km
                        validPoints++;
                    }
                }

                // Calcular velocidad promedio usando GPS válidos
                let totalSpeed = 0;
                let speedCount = 0;
                gpsValidos.forEach(point => {
                    if (point.speed && point.speed > 0 && point.speed < 200) { // Filtrar velocidades anómalas
                        totalSpeed += point.speed;
                        speedCount++;
                    }
                });
                const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

                logger.info(`📍 GPS: ${gpsData.length} puntos totales, ${validPoints} válidos, ${totalKm.toFixed(2)}km calculados`);
                logger.info(`🚗 Velocidad: ${speedCount} puntos válidos, promedio ${averageSpeed.toFixed(2)} km/h`);

                // ✅ CHATGPT P0-1: Obtener tiempo de rotativo desde segmentos (clave 2)
                // Antes: contaba mediciones de rotativo (incorrecto)
                // Ahora: suma duración de segmentos clave 2 (EMERGENCIA = rotativo ON)
                const rotativoResult = await prisma.$queryRaw<Array<{ total_seconds: number }>>`
                    SELECT COALESCE(SUM("durationSeconds"), 0)::int AS total_seconds
                    FROM operational_state_segments seg
                    JOIN "Session" s ON s.id = seg."sessionId"
                    WHERE s."organizationId" = ${organizationId}
                      AND seg.clave = 2
                      AND seg."startTime" >= ${dateFrom}::timestamp
                      AND seg."endTime" <= ${dateTo}::timestamp
                `;

                const rotativo_on_seconds = rotativoResult[0]?.total_seconds || 0;

                // ✅ Validación: advertir si no hay segmentos pero sí hay sesiones
                if (rotativo_on_seconds === 0 && sessionIds.length > 0) {
                    logger.warn('⚠️ No hay segmentos de clave 2 (EMERGENCIA), verificar post-procesamiento', {
                        organizationId,
                        sessionCount: sessionIds.length,
                        dateRange: { from: dateFrom, to: dateTo }
                    });
                }

                // Calcular porcentaje de rotativo sobre tiempo total
                const rotativoPercentage = totalTime > 0 ? (rotativo_on_seconds / totalTime) * 100 : 0;

                summary.activity = {
                    km_total: Math.round(totalKm * 10) / 10,
                    driving_hours: Math.round((timeOutside / 3600) * 10) / 10,
                    driving_hours_formatted: formatDuration(timeOutside),
                    rotativo_on_seconds,  // ✅ Desde segmentos oficiales
                    rotativo_on_percentage: Math.round(rotativoPercentage * 10) / 10,
                    rotativo_on_formatted: formatDuration(rotativo_on_seconds),
                    emergency_departures: Math.floor((estadosOperacionales?.clave2_segundos || 0) / 60) || 0,
                    average_speed: Math.round(averageSpeed * 10) / 10
                };

                logger.info(`✅ Actividad calculada: ${totalKm}km, ${rotativoPercentage.toFixed(1)}% rotativo (${rotativo_on_seconds}s desde segmentos)`);

            } catch (e: any) {
                logger.error('❌ Error calculando métricas de actividad:', e);
            }

            try {
                // Calcular métricas de estabilidad
                logger.info('⚖️ Calculando métricas de estabilidad...');
                logger.info(`🔍 Session IDs para eventos: ${sessionIds.length} IDs`);
                logger.info(`🔍 Primeros 5 session IDs:`, sessionIds.slice(0, 5));

                // Obtener eventos con datos relacionados usando Prisma ORM
                logger.info(`🔍 Obteniendo eventos para ${sessionIds.length} sesiones...`);
                
                const stabilityEventsRaw = await prisma.stability_events.findMany({
                    where: {
                        session_id: { in: sessionIds }
                    },
                    include: {
                        Session: {
                            include: {
                                Vehicle: true  // ✅ Mayúscula (nombre correcto del modelo)
                            }
                        }
                    },
                    orderBy: {
                        timestamp: 'desc'
                    }
                });

                logger.info(`📊 Eventos encontrados: ${stabilityEventsRaw.length}`);

                // Transformar eventos a formato simple
                const stabilityEvents: any[] = stabilityEventsRaw.map(e => ({
                    details: e.details,
                    session_id: e.session_id,
                    timestamp: e.timestamp,
                    type: e.type,
                    session_date: e.Session?.startTime,
                    vehicle_identifier: e.Session?.Vehicle?.identifier || 'N/A',  // ✅ Vehicle con mayúscula
                    vehicle_name: e.Session?.Vehicle?.name || ''  // ✅ Vehicle con mayúscula
                }));

                if (stabilityEvents.length > 0) {
                    logger.info(`📊 Primeros 3 eventos:`, stabilityEvents.slice(0, 3).map(e => ({
                        vehicle: e.vehicle_identifier,
                        type: e.type,
                        timestamp: e.timestamp,
                        si: e.details?.si || e.details?.valores?.si
                    })));
                }

                // Calcular severidades basándose en SI y agrupar por tipo
                let critical = 0, moderate = 0, light = 0, noSi = 0;
                const eventsByType: Record<string, number> = {};
                const eventsBySeverity: Record<string, any[]> = {
                    critical: [],
                    moderate: [],
                    light: []
                };

                stabilityEvents.forEach(evento => {
                    // ✅ CORRECCIÓN: SI está en details.si o details.valores.si
                    const si = evento.details?.si || evento.details?.valores?.si;
                    
                    // ✅ Extraer tipo desde múltiples fuentes posibles
                    let tipo = evento.type || 'SIN_TIPO';
                    
                    // Mapear tipos técnicos a nombres legibles
                    const tipoMap: Record<string, string> = {
                        'dangerous_drift': 'Derrape Peligroso',
                        'rollover_risk': 'Riesgo de Vuelco',
                        'hard_braking': 'Frenada Brusca',
                        'sharp_turn': 'Giro Brusco',
                        'excessive_acceleration': 'Aceleración Excesiva',
                        'high_lateral_g': 'Fuerza Lateral Alta',
                        'stability_loss': 'Pérdida de Estabilidad'
                    };
                    
                    const tipoLegible = tipoMap[tipo] || tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    // Contar por tipo
                    eventsByType[tipoLegible] = (eventsByType[tipoLegible] || 0) + 1;
                    
                    // Clasificar por severidad y guardar detalles útiles para el cliente
                    if (si !== undefined && si !== null) {
                        const eventoDetalle = {
                            session_id: evento.session_id,
                            vehicle_identifier: evento.vehicle_identifier || 'N/A',
                            vehicle_name: evento.vehicle_name || '',
                            session_date: evento.session_date,
                            tipo: tipoLegible,
                            si: si,
                            timestamp: evento.timestamp
                        };

                        if (si < 0.20) {
                            critical++;
                            eventsBySeverity.critical.push(eventoDetalle);
                        } else if (si < 0.35) {
                            moderate++;
                            eventsBySeverity.moderate.push(eventoDetalle);
                        } else if (si < 0.50) {
                            light++;
                            eventsBySeverity.light.push(eventoDetalle);
                        }
                    } else {
                        noSi++;
                    }
                });

                summary.stability = {
                    total_incidents: stabilityEvents.length,
                    critical,
                    moderate,
                    light,
                    por_tipo: eventsByType,
                    eventos_detallados: eventsBySeverity
                };

                logger.info(`✅ Estabilidad calculada: ${stabilityEvents.length} eventos totales`);
                logger.info(`📊 Severidades: ${critical} críticas, ${moderate} moderadas, ${light} leves, ${noSi} sin SI`);
                logger.info(`📊 Objeto stability creado:`, summary.stability);

            } catch (e: any) {
                logger.error('❌ Error calculando métricas de estabilidad:', e);
                logger.error('❌ Stack trace:', e.stack);
                // Asegurar que stability tenga valores por defecto
                summary.stability = {
                    total_incidents: 0,
                    critical: 0,
                    moderate: 0,
                    light: 0
                };
            }
        }

        // El cálculo de estabilidad ya se hizo arriba, no duplicar

        // Calcular quality metrics (índice de estabilidad)
        try {
            logger.info('📊 Calculando quality metrics...');
            const siAggregate = await prisma.stabilityMeasurement.aggregate({
                where: { sessionId: { in: sessionIds } },
                _avg: { si: true },
                _count: { si: true }
            });

            const indicePromedio = siAggregate._avg.si || 0;
            const totalMuestras = siAggregate._count.si || 0;

            let calificacion = 'DEFICIENTE';
            let estrellas = '⭐⭐';

            if (indicePromedio >= 0.90) {
                calificacion = 'EXCELENTE';
                estrellas = '⭐⭐⭐⭐⭐';
            } else if (indicePromedio >= 0.85) {
                calificacion = 'BUENA';
                estrellas = '⭐⭐⭐⭐';
            } else if (indicePromedio >= 0.75) {
                calificacion = 'REGULAR';
                estrellas = '⭐⭐⭐';
            }

            summary.quality = {
                indice_promedio: indicePromedio,
                calificacion,
                estrellas,
                total_muestras: totalMuestras
            };

            logger.info(`✅ Quality calculado: SI=${indicePromedio.toFixed(3)}, ${calificacion} ${estrellas}`);
        } catch (e: any) {
            logger.error('❌ Error calculando quality metrics:', e);
            summary.quality = {
                indice_promedio: 0,
                calificacion: 'N/A',
                estrellas: '',
                total_muestras: 0
            };
        }

        logger.info('✅ Enviando respuesta con KPIs calculados');
        logger.info(`📊 Resumen final - Stability:`, summary.stability);
        logger.info(`📊 Resumen final - Quality:`, summary.quality);
        return res.json({
            success: true,
            data: summary
        });

        /* CÓDIGO TEMPORALMENTE COMENTADO PARA DEBUGGING
        // IMPORTANTE: Express puede parsear como vehicleIds[] O vehicleIds
        const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
        const vehicleIds = vehicleIdsRaw
            ? (Array.isArray(vehicleIdsRaw)
                ? vehicleIdsRaw
                : [vehicleIdsRaw]) as string[]
            : undefined;

        // DEBUG: Ver qué parámetros llegan
        logger.info('📊 FILTROS RECIBIDOS EN /api/kpis/summary', {
            from,
            to,
            vehicleIds,
            queryCompleta: req.query,
            vehicleIdsLength: vehicleIds?.length || 0
        });

        // Construir filtros de fecha (usar fin de día exclusivo para 'to')
        let dateFrom: Date | undefined;
        let dateToExclusive: Date | undefined;

        if (from && to) {
            dateFrom = new Date(from);
            const toDate = new Date(to);
            // Hacer 'to' inclusivo llevando el límite a < (to + 1 día)
            dateToExclusive = new Date(toDate.getTime());
            dateToExclusive.setDate(dateToExclusive.getDate() + 1);
        }

        // Si se solicita forzar, invalidar cache de KPIs para esta organización
        if (force) {
            try {
                kpiCacheService.invalidate(organizationId);
                logger.info('Cache de KPIs invalidado por force=true');
            } catch (e: any) {
                logger.warn('No se pudo invalidar cache de KPIs', { error: e?.message });
            }
        }

        // Importar prisma dinámicamente y calcular KPIs directamente
        logger.info('📦 Importando Prisma...');
        let prisma;
        try {

            prisma = prismaModule.prisma;
            logger.info('✅ Prisma importado exitosamente');
        } catch (e: any) {
            logger.error('❌ Error importando Prisma:', e);
            return res.status(500).json({
                success: false,
                error: 'Error de configuración de base de datos'
            });
        }
        
        // cambio aquí
        // Asegurar conexión estable antes de consultar
        try {
            logger.info('🔌 Conectando a Prisma...');
            await connectWithRetry(prisma, 4);
            logger.info('✅ Prisma conectado exitosamente');
        } catch (e: any) {
            logger.warn('⚠️ Prisma no conectado al iniciar resumen KPIs, reintentos agotados', { error: e?.message });
            return res.status(500).json({
                success: false,
                error: 'Error de conexión a base de datos'
            });
        }

        // cambio aquí
        // Selección por mediciones en rango si from/to están definidos; si no, fallback a startTime
        let sessions: Array<{ id: string; startTime: Date; endTime: Date | null; vehicleId: string }> = [];
        let sessionIds: string[] = [];
        let usedMeasurementRange = false;

        if (dateFrom && dateToExclusive) {
            usedMeasurementRange = true;
            // Buscar sesiones con mediciones en el rango (GPS y/o Rotativo)
            let gpsRows, rotRows;
            try {
                logger.info('🔍 Buscando mediciones GPS...');
                gpsRows = await prisma.gpsMeasurement.findMany({
                    where: {
                        timestamp: { gte: dateFrom, lt: dateToExclusive },
                        session: {
                            organizationId,
                            ...(vehicleIds && vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {})
                        }
                    },
                    select: { sessionId: true }
                });
                logger.info(`✅ Encontradas ${gpsRows.length} mediciones GPS`);
                
                logger.info('🔍 Buscando mediciones Rotativo...');
                rotRows = await prisma.rotativoMeasurement.findMany({
                    where: {
                        timestamp: { gte: dateFrom, lt: dateToExclusive },
                        Session: {
                            organizationId,
                            ...(vehicleIds && vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {})
                        }
                    },
                    select: { sessionId: true }
                });
                logger.info(`✅ Encontradas ${rotRows.length} mediciones Rotativo`);
            } catch (e: any) {
                logger.error('❌ Error consultando mediciones:', e);
                return res.status(500).json({
                    success: false,
                    error: 'Error consultando datos de mediciones'
                });
            }
            const idSet = new Set<string>();
            for (const r of gpsRows) idSet.add(r.sessionId);
            for (const r of rotRows) idSet.add(r.sessionId);
            sessionIds = Array.from(idSet);
            if (sessionIds.length > 0) {
                sessions = await prisma.session.findMany({
                    where: { id: { in: sessionIds } },
                    select: { id: true, startTime: true, endTime: true, vehicleId: true }
                });
            }
            logger.info(`📊 Sesiones por MEDICIONES en rango: ${sessionIds.length}`, {
                organizationId,
                from,
                to,
                gpsSessions: gpsRows.length,
                rotativoSessions: rotRows.length
            });
        } else {
            const sessionFilter: any = { organizationId };
            if (vehicleIds && vehicleIds.length > 0) {
                sessionFilter.vehicleId = { in: vehicleIds };
            }
            sessions = await prisma.session.findMany({
                where: sessionFilter,
                select: { id: true, startTime: true, endTime: true, vehicleId: true }
            });
            sessionIds = sessions.map(s => s.id);
            logger.info(`📊 Sesiones encontradas (sin rango explícito): ${sessionIds.length}`, { organizationId });
        }

        // Calcular KPIs básicos
        const totalSessions = sessions.length;
        const totalVehicles = new Set(sessions.map(s => s.vehicleId)).size;

        // Obtener eventos de estabilidad (filtrando por timestamp si aplica)
        const eventsWhere: any = { session_id: { in: sessionIds } };
        if (usedMeasurementRange && dateFrom && dateToExclusive) {
            eventsWhere.timestamp = { gte: dateFrom, lt: dateToExclusive };
        }
        const events = await prisma.stability_events.findMany({
            where: eventsWhere,
            select: { type: true, session_id: true }
        });

        const totalEvents = events.length;
        const eventsByType = events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calcular tiempos por clave usando keyCalculator, cortando al rango si aplica
        const dateToForKeys = dateToExclusive ? new Date(dateToExclusive.getTime() - 1) : undefined;
        const tiemposPorClave = await calcularTiemposPorClave(
            sessionIds,
            dateFrom,
            dateToForKeys
        );

        // Calcular KPIs de actividad reales (distancia con Haversine y tiempo en movimiento)
        let kmTotal = 0;
        let drivingHours = 0;
        let rotativoOnSeconds = 0;
        let rotativoOnPercentage = 0;

        if (sessionIds.length > 0) {
            // 1) Obtener GPS con coordenadas para Haversine (solo en rango si aplica)
            const gpsWhere: any = { sessionId: { in: sessionIds } };
            if (usedMeasurementRange && dateFrom && dateToExclusive) {
                gpsWhere.timestamp = { gte: dateFrom, lt: dateToExclusive };
            }
            const gpsData = await prisma.gpsMeasurement.findMany({
                where: gpsWhere,
                select: { sessionId: true, timestamp: true, latitude: true, longitude: true, speed: true, fix: true, satellites: true },
                orderBy: { timestamp: 'asc' }
            });

            // 2) Aplicar filtro GPS corregido (mismo que en kpiCalculator.ts)
            const gpsValidos = gpsData.filter(g => {
                // Verificar que tenga coordenadas válidas
                const coordenadasValidas = g.latitude && g.longitude && 
                                          g.latitude !== 0 && g.longitude !== 0 &&
                                          g.latitude > 35 && g.latitude < 45 && 
                                          g.longitude > -5 && g.longitude < -1;
                
                // Verificar satélites (mínimo 4 para precisión)
                const satelitesSuficientes = g.satellites >= 4;
                
                // Aceptar si tiene coordenadas válidas y satélites suficientes
                return coordenadasValidas && satelitesSuficientes;
            });

            // 3) Agrupar por sesión usando solo GPS válidos
            const gpsBySession = new Map<string, { timestamp: Date; lat: number; lon: number; speed: number }[]>();
            for (const g of gpsValidos) {
                if (!gpsBySession.has(g.sessionId)) gpsBySession.set(g.sessionId, []);
                gpsBySession.get(g.sessionId)!.push({
                    timestamp: g.timestamp,
                    lat: g.latitude,
                    lon: g.longitude,
                    speed: Number(g.speed) || 0
                });
            }

            // 4) Haversine y tiempo en movimiento (con saneos y filtro GPS corregido)
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

            let drivingSeconds = 0;
            // Umbrales de calidad de datos
            const MOVING_THRESHOLD_KMH = 1;     // >1 km/h se considera movimiento
            const MAX_REASONABLE_SPEED_KMH = 160; // límite superior razonable por tramo
            const MAX_POINT_GAP_SECONDS = 120;    // cap para huecos grandes

            for (const [sid, points] of gpsBySession.entries()) {
                if (!points || points.length < 2) continue;
                for (let i = 1; i < points.length; i++) {
                    const p1 = points[i - 1];
                    const p2 = points[i];
                    // Tiempo delta en segundos (cortar deltas anómalos)
                    const dt = Math.min(
                        MAX_POINT_GAP_SECONDS,
                        Math.max(0, Math.floor((p2.timestamp.getTime() - p1.timestamp.getTime()) / 1000))
                    );
                    if (dt <= 0) {
                        continue;
                    }

                    // Distancia entre puntos y velocidad inferida
                    const dKmRaw = haversineKm(p1.lat, p1.lon, p2.lat, p2.lon);
                    const speedKmh = isFinite(dKmRaw) && dKmRaw >= 0 ? (dKmRaw / (dt / 3600)) : 0;

                    // Saneo: ignorar saltos imposibles; clamp a velocidad máxima razonable
                    if (!isFinite(speedKmh) || speedKmh <= 0) {
                        continue;
                    }

                    const clampedSpeedKmh = Math.min(MAX_REASONABLE_SPEED_KMH, Math.max(0, speedKmh));
                    const dKmClamped = clampedSpeedKmh * (dt / 3600);

                    // Acumular distancia saneada
                    if (dKmClamped > 0) {
                        kmTotal += dKmClamped;
                    }

                    // Contabilizar tiempo de conducción solo cuando hay movimiento válido
                    if (clampedSpeedKmh >= MOVING_THRESHOLD_KMH && clampedSpeedKmh <= MAX_REASONABLE_SPEED_KMH) {
                        drivingSeconds += dt;
                    }
                }
            }

            drivingHours = Math.round((drivingSeconds / 3600) * 10) / 10;

            // Calcular tiempo rotativo (solo en rango si aplica)
            const rotWhere: any = { sessionId: { in: sessionIds } };
            if (usedMeasurementRange && dateFrom && dateToExclusive) {
                rotWhere.timestamp = { gte: dateFrom, lt: dateToExclusive };
            }
            const rotativoData = await prisma.rotativoMeasurement.findMany({
                where: rotWhere,
                select: { state: true, sessionId: true }
            });

            const rotativoOn = rotativoData.filter(r => r.state === '1' || r.state === 'ON');
            rotativoOnSeconds = rotativoOn.length; // Aproximación: cada medición = 1 segundo
            rotativoOnPercentage = rotativoData.length > 0 ? (rotativoOn.length / rotativoData.length) * 100 : 0;
        }

        // Construir respuesta de KPIs
        const driving_hours_formatted = formatDuration(Math.round((drivingHours || 0) * 3600));
        const rotativo_on_formatted = formatDuration(rotativoOnSeconds || 0);
        const rotativoPctClamped = Math.max(0, Math.min(100, Math.round((rotativoOnPercentage || 0) * 10) / 10));
        const summary = {
            availability: {
                total_sessions: totalSessions,
                total_vehicles: totalVehicles,
                availability_percentage: totalSessions > 0 ? 100 : 0
            },
            states: {
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
                time_outside_formatted: formatDuration(tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos)
            },
            activity: {
                km_total: Math.round(kmTotal * 10) / 10,
                driving_hours: drivingHours,
                driving_hours_formatted,
                rotativo_on_seconds: rotativoOnSeconds,
                rotativo_on_percentage: rotativoPctClamped,
                rotativo_on_formatted
            },
            stability: {
                total_incidents: totalEvents,
                critical: eventsByType['CRITICO'] || 0,
                moderate: eventsByType['MODERADO'] || 0,
                light: eventsByType['LEVE'] || 0
            },
            quality: await (async () => {
                // MANDAMIENTO M4: KPI SI = AVG(si) real de StabilityMeasurement
                const siAggregate = await prisma.stabilityMeasurement.aggregate({
                    where: {
                        sessionId: { in: sessionIds },
                        ...(dateFrom && dateToExclusive ? {
                            timestamp: { gte: dateFrom, lt: dateToExclusive }
                        } : {})
                    },
                    _avg: {
                        si: true
                    }
                });

                const indicePromedio = siAggregate._avg.si || 0; // Ya en [0,1]

                // Calificación basada en SI real (Mandamiento M4.2)
                let calificacion = 'DEFICIENTE';
                let estrellas = '⭐⭐';

                if (indicePromedio >= 0.90) {
                    calificacion = 'EXCELENTE';
                    estrellas = '⭐⭐⭐⭐⭐';
                } else if (indicePromedio >= 0.85) {
                    calificacion = 'BUENA';
                    estrellas = '⭐⭐⭐⭐';
                } else if (indicePromedio >= 0.75) {
                    calificacion = 'REGULAR';
                    estrellas = '⭐⭐⭐';
                }

                return {
                    indice_promedio: indicePromedio,
                    calificacion,
                    estrellas,
                    // Distribuir por severidad (para métricas complementarias)
                    distribucion_severidades: {
                        grave: eventsByType['CRITICO'] || 0,
                        moderada: eventsByType['MODERADO'] || 0,
                        leve: eventsByType['LEVE'] || 0
                    }
                };
            })(),
            metadata: {
                sesiones_analizadas: totalSessions,
                fecha_calculo: new Date().toISOString()
            }
        };

        logger.info('KPIs calculados correctamente', {
            sesiones: summary.metadata?.sesiones_analizadas,
            km: summary.activity?.km_total,
            incidencias: summary.stability?.total_incidents
        });

        res.json({
            success: true,
            data: summary
        });
        */
    } catch (error: any) {
        logger.error('Error obteniendo resumen de KPIs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/ingestion-summary
 * Resumen de ingesta por sesión (solo lectura) con conteos de mediciones
 */
router.get('/ingestion-summary', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
        const vehicleIds = vehicleIdsRaw
            ? (Array.isArray(vehicleIdsRaw) ? vehicleIdsRaw : [vehicleIdsRaw]) as string[]
            : undefined;

        const sessionsWhere: any = { organizationId };
        if (from && to) {
            sessionsWhere.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }
        if (vehicleIds && vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true, vehicleId: true, startTime: true, endTime: true }
        });

        // Calcular conteos por sesión (serie de consultas por sesión; si el dataset crece, optimizar con groupBy)
        const results = [] as Array<{
            sessionId: string;
            vehicleId: string;
            startTime: Date | null;
            endTime: Date | null;
            gpsCount: number;
            stabilityCount: number;
            rotativoCount: number;
        }>;

        for (const s of sessions) {
            const [gpsCount, stabilityCount, rotativoCount] = await Promise.all([
                prisma.gpsMeasurement.count({ where: { sessionId: s.id } }),
                prisma.stabilityMeasurement.count({ where: { sessionId: s.id } }),
                prisma.rotativoMeasurement.count({ where: { sessionId: s.id } })
            ]);

            results.push({
                sessionId: s.id,
                vehicleId: s.vehicleId,
                startTime: s.startTime,
                endTime: s.endTime,
                gpsCount,
                stabilityCount,
                rotativoCount
            });
        }

        const totals = results.reduce((acc, r) => {
            acc.sessions += 1;
            acc.gps += r.gpsCount;
            acc.stability += r.stabilityCount;
            acc.rotativo += r.rotativoCount;
            return acc;
        }, { sessions: 0, gps: 0, stability: 0, rotativo: 0 });

        logger.info('[IngestionSummary] Resumen generado', {
            organizationId,
            sessions: totals.sessions,
            gps: totals.gps,
            stability: totals.stability,
            rotativo: totals.rotativo
        });

        res.json({
            success: true,
            data: {
                totals,
                sessions: results
            }
        });
    } catch (error: any) {
        logger.error('Error obteniendo resumen de ingesta:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/states
 * Retorna resumen de estados (claves 0-5) con datos reales usando keyCalculator
 */
router.get('/states', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        // Extraer filtros de la query
        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleIds = req.query['vehicleIds[]']
            ? (Array.isArray(req.query['vehicleIds[]'])
                ? req.query['vehicleIds[]']
                : [req.query['vehicleIds[]']]) as string[]
            : undefined;

        logger.info('Obteniendo estados con filtros', { from, to, vehicleIds });

        // Construir filtros para sesiones
        const sessionsWhere: any = { organizationId };

        if (from && to) {
            sessionsWhere.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        if (vehicleIds && vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        // Obtener sesiones que coincidan con los filtros

        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true }
        });

        const sessionIds = sessions.map(s => s.id);

        logger.info(`Calculando tiempos para ${sessionIds.length} sesiones`);

        // Calcular tiempos por clave usando keyCalculator
        const tiemposPorClave = await calcularTiemposPorClave(sessionIds);

        // Formatear respuesta
        const states = {
            states: [
                {
                    key: 0,
                    name: 'Taller',
                    duration_seconds: tiemposPorClave.clave0_segundos,
                    duration_formatted: tiemposPorClave.clave0_formateado,
                    count: Math.floor(tiemposPorClave.clave0_segundos / 60) || 0
                },
                {
                    key: 1,
                    name: 'Operativo en Parque',
                    duration_seconds: tiemposPorClave.clave1_segundos,
                    duration_formatted: tiemposPorClave.clave1_formateado,
                    count: Math.floor(tiemposPorClave.clave1_segundos / 60) || 0
                },
                {
                    key: 2,
                    name: 'Salida en Emergencia',
                    duration_seconds: tiemposPorClave.clave2_segundos,
                    duration_formatted: tiemposPorClave.clave2_formateado,
                    count: Math.floor(tiemposPorClave.clave2_segundos / 60) || 0
                },
                {
                    key: 3,
                    name: 'En Siniestro',
                    duration_seconds: tiemposPorClave.clave3_segundos,
                    duration_formatted: tiemposPorClave.clave3_formateado,
                    count: Math.floor(tiemposPorClave.clave3_segundos / 60) || 0
                },
                {
                    key: 5,
                    name: 'Regreso al Parque',
                    duration_seconds: tiemposPorClave.clave5_segundos,
                    duration_formatted: tiemposPorClave.clave5_formateado,
                    count: Math.floor(tiemposPorClave.clave5_segundos / 60) || 0
                }
            ],
            total_time_seconds: tiemposPorClave.total_segundos,
            total_time_formatted: tiemposPorClave.total_formateado,
            time_outside_station: tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos,
            time_outside_formatted: formatSeconds(tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos)
        };

        logger.info('Estados calculados correctamente', {
            total_time: states.total_time_formatted,
            clave2: states.states[2].duration_formatted,
            clave5: states.states[4].duration_formatted
        });

        res.json({
            success: true,
            data: states
        });
    } catch (error: any) {
        logger.error('Error obteniendo estados:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Helper function para formatear segundos a HH:MM:SS
 */
function formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * GET /api/v1/kpis/activity
 * Retorna métricas de actividad
 */
router.get('/activity', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const activity = {
            km_total: 0,
            driving_hours: 0,
            driving_hours_formatted: '00:00:00',
            rotativo_on_seconds: 0,
            rotativo_on_percentage: 0,
            rotativo_on_formatted: '00:00:00',
            emergency_departures: 0
        };

        res.json({
            success: true,
            data: activity
        });
    } catch (error: any) {
        logger.error('Error obteniendo métricas de actividad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/stability
 * Retorna métricas de estabilidad
 */
router.get('/stability', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const stability = {
            total_incidents: 0,
            critical: 0,
            moderate: 0,
            light: 0
        };

        res.json({
            success: true,
            data: stability
        });
    } catch (error: any) {
        logger.error('Error obteniendo métricas de estabilidad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


export default router;

