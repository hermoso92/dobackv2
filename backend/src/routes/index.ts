import { Router } from 'express';
import { prisma } from '../config/prisma';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';
import {
    aiCacheMiddleware,
    dashboardCacheMiddleware,
    mapDataCacheMiddleware,
    processingCacheMiddleware
} from '../middleware/optimization';
import adminRoutes from './admin';
import aiRoutes from './ai';
// import alertEscalationRoutes from './alertEscalation';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import devicesRoutes from './devices';
// import emergencyDashboardRoutes from './emergencyDashboard';
// import emergencyReportsRoutes from './emergencyReports';
import eventRoutes from './event.routes';
import geofenceAlertsRoutes from './geofence-alerts';
import geofencesRoutes from './geofences';
// import geofencesAPIRoutes from './geofencesAPI';
import gestorDeEventosRouter from './gestorDeEventos';
import hotspotsRoutes from './hotspots';
// import intelligentAlertsRoutes from './intelligentAlerts';
import kpiCalculationRoutes from './kpiCalculation';
import kpiRoutes from './kpiRoutes';
// import advancedKPIRoutes from './advancedKPI';
import kpisOperationalRoutes from './kpis';
import kpisTempRoutes from './kpis-temp';
import mantenimientosRouter from './mantenimientos';
import observabilityRoutes from './observability';
import operationsRoutes from './operations';
// import operationalCostsRoutes from './operationalCosts';
// import operationalEfficiencyRoutes from './operationalEfficiency';
import organizationProcessorRoutes from './organizationProcessor';
import panelRoutes from './panel';
import parkKPIRoutes from './parkKPI';
import parksRoutes from './parks';
// import pushNotificationsRoutes from './pushNotifications';
import radarRoutes from './radar';
import reportsRoutes from './reports';
import simpleReportsRoutes from './simple-reports';
import speedAnalysisRoutes from './speedAnalysis';
import stabilityFiltersRoutes from './stabilityFilters';
// import responseTimeRoutes from './responseTime';
// import riskZoneAnalysisRoutes from './riskZoneAnalysis';
import { getGeofenceServices } from '../config/geofenceServices';
import alertsRoutes from './alerts';
import csvExportRoutes from './csvExport';
import diagnosticsRoutes from './diagnostics';
import fireStationsRoutes from './fireStations';
import generateEventsRoutes from './generateEvents';
import pdfExportRoutes from './pdfExport';
import processingTrackingRoutes from './processingTracking';
import sessionsUploadRoutes from './sessionsUpload';
import stabilityRoutes from './stability';
import stabilityEventsRoutes from './stabilityEvents';

// Rutas de módulos de emergencia - Bomberos Madrid
import { TelemetryV2Controller } from '../controllers/TelemetryV2Controller';
import { logger } from '../utils/logger';
import alertEscalationRoutes from './alertEscalation';
import emergencyDashboardRoutes from './emergencyDashboard';
import emergencyReportsRoutes from './emergencyReports';
import intelligentAlertsRoutes from './intelligentAlerts';
import operationalKeysRoutes from './operationalKeys';
import pushNotificationsRoutes from './pushNotifications';
import telemetryRoutes from './telemetry';
import telemetryV2Routes from './telemetry-v2';
import uploadRoutes from './upload';
import uploadUnifiedRoutes from './upload-unified';
import uploadsRoutes from './uploads';
import vehicleRoutes from './vehicles';
import zonesRoutes from './zones';

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de eventos (REST principal)
router.use('/events', eventRoutes);

// Rutas de eventos (usar gestorDeEventos como principal)
router.use('/eventos', gestorDeEventosRouter);

// Rutas de mantenimiento
router.use('/mantenimientos', mantenimientosRouter);

// Rutas de estabilidad
router.use('/stability', stabilityRoutes);

// Rutas de filtros de estabilidad
router.use('/stability-filters', stabilityFiltersRoutes);

// Rutas de análisis de velocidad
router.use('/speed', speedAnalysisRoutes);

// Rutas de puntos negros (hotspots)
router.use('/hotspots', hotspotsRoutes);

// Rutas de diagnóstico del dashboard
router.use('/diagnostics', diagnosticsRoutes);

// Rutas de control de dispositivos
router.use('/devices', devicesRoutes);

// Rutas del dashboard
router.use('/dashboard', dashboardRoutes);

// Rutas de vehículos y telemetría
router.use('/vehicles', vehicleRoutes);
// router.use('/api/vehicles', vehicleRoutes); // Duplicado - ya está en línea 58
router.use('/telemetry', telemetryRoutes);
router.use('/telemetry-v2', telemetryV2Routes);

// Alias directo para /api/sessions -> /api/telemetry-v2/sessions
const telemetryV2Controller = new TelemetryV2Controller();
router.get('/sessions', authenticate, attachOrg, telemetryV2Controller.getSessions);
router.get('/sessions/ranking', authenticate, attachOrg, async (req, res) => {
    try {
        const orgId = (req as any).user?.organizationId || (req as any).orgId || req.query.organizationId as string;
        const limit = parseInt(req.query.limit as string) || 10;
        const metric = (req.query.metric as string) || 'events'; // events, distance, duration, speed
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const prismaModule = await import('../config/prisma');
        const prisma = prismaModule.prisma || prismaModule.default;

        logger.info('Obteniendo ranking de sesiones', {
            organizationId: orgId,
            metric,
            limit,
            user: (req as any).user,
            orgIdFromReq: (req as any).orgId
        });

        if (!orgId) {
            logger.error('No se pudo obtener organizationId');
            return res.status(400).json({ success: false, error: 'Organization ID requerido' });
        }

        // Construir filtros
        const whereClause: any = {
            organizationId: orgId
        };

        logger.info('Filtros construidos:', whereClause);

        // Filtro de vehículos
        if (vehicleIds && vehicleIds.length > 0) {
            whereClause.vehicleId = { in: vehicleIds };
        }

        // Filtro de fechas
        if (startDate || endDate) {
            whereClause.startTime = {};
            if (startDate) whereClause.startTime.gte = new Date(startDate);
            if (endDate) whereClause.startTime.lte = new Date(endDate);
        }

        // Obtener sesiones con conteo de eventos
        const sessions = await prisma.session.findMany({
            where: whereClause,
            include: {
                vehicle: {
                    select: { name: true }
                }
            },
            orderBy: { startTime: 'desc' },
            take: 1000 // Limitar para rendimiento
        });

        logger.info(`Sesiones encontradas: ${sessions.length}`, {
            whereClause: JSON.stringify(whereClause),
            firstSession: sessions[0] ? {
                id: sessions[0].id,
                vehicleId: sessions[0].vehicleId,
                organizationId: sessions[0].organizationId
            } : null
        });

        // Procesar sesiones con métricas
        const sessionsWithMetrics = await Promise.all(sessions.map(async (session) => {
            const duration = session.endTime && session.startTime
                ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000)
                : 0;

            const durationHours = duration / 3600;
            const durationFormatted = `${Math.floor(durationHours)}h ${Math.floor((duration % 3600) / 60)}m`;

            // Calcular distancia, velocidad promedio y máxima desde GPS
            const gpsPoints = await prisma.gpsMeasurement.findMany({
                where: { sessionId: session.id },
                select: { speed: true }
            });

            const avgSpeed = gpsPoints.length > 0
                ? gpsPoints.reduce((sum, p) => sum + (p.speed || 0), 0) / gpsPoints.length
                : 0;

            const maxSpeed = gpsPoints.length > 0
                ? Math.max(...gpsPoints.map(p => p.speed || 0))
                : 0;

            // Calcular distancia aproximada (basada en puntos GPS)
            const distance = duration > 0 ? (avgSpeed * duration / 3600) : 0;

            // Obtener eventos de estabilidad para esta sesión
            const eventCount = await prisma.stabilityEvent.count({
                where: { session_id: session.id }
            });

            return {
                id: session.id,
                vehicleId: session.vehicleId,
                vehicleName: session.vehicle?.name || session.vehicleId,
                startTime: session.startTime,
                endTime: session.endTime,
                duration,
                durationFormatted,
                distance,
                avgSpeed,
                maxSpeed,
                totalEvents: eventCount,
                status: session.status
            };
        }));

        // Ordenar según métrica
        let sortedSessions = [...sessionsWithMetrics];

        switch (metric) {
            case 'events':
                sortedSessions.sort((a, b) => b.totalEvents - a.totalEvents);
                break;
            case 'distance':
                sortedSessions.sort((a, b) => b.distance - a.distance);
                break;
            case 'duration':
                sortedSessions.sort((a, b) => b.duration - a.duration);
                break;
            case 'speed':
                sortedSessions.sort((a, b) => b.avgSpeed - a.avgSpeed);
                break;
            default:
                sortedSessions.sort((a, b) => b.totalEvents - a.totalEvents);
        }

        // Obtener detalles de eventos para el top ranking
        const topSessions = sortedSessions.slice(0, limit);

        const ranking = await Promise.all(topSessions.map(async (session, index) => {
            // Obtener eventos de esta sesión para clasificarlos
            const events = await prisma.stabilityEvent.findMany({
                where: { session_id: session.id },
                select: {
                    type: true
                }
            });

            // Clasificar eventos por severidad
            const mapSeverity = (eventType: string): string => {
                const criticalEvents = ['CURVA_PELIGROSA', 'FRENADA_BRUSCA', 'ACELERACION_BRUSCA', 'VUELCO'];
                const moderateEvents = ['CURVA_RAPIDA', 'FRENADO_MODERADO'];

                if (criticalEvents.includes(eventType)) return 'grave';
                if (moderateEvents.includes(eventType)) return 'moderada';
                return 'leve';
            };

            const grave = events.filter(e => mapSeverity(e.type) === 'grave').length;
            const moderada = events.filter(e => mapSeverity(e.type) === 'moderada').length;
            const leve = events.filter(e => mapSeverity(e.type) === 'leve').length;

            return {
                rank: index + 1,
                sessionId: session.id,
                vehicleName: session.vehicleName,
                vehicleId: session.vehicleId,
                startTime: session.startTime,
                duration: session.durationFormatted,
                distance: Math.round(session.distance * 10) / 10,
                avgSpeed: Math.round(session.avgSpeed * 10) / 10,
                maxSpeed: Math.round(session.maxSpeed * 10) / 10,
                totalEvents: session.totalEvents,
                grave,
                moderada,
                leve,
                status: session.status
            };
        }));

        logger.info(`Ranking generado: ${ranking.length} sesiones`);

        res.json({
            success: true,
            data: {
                ranking,
                total: sortedSessions.length,
                metric,
                filters: {
                    metric,
                    limit,
                    vehicleIds: vehicleIds || [],
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            }
        });

    } catch (error: any) {
        logger.error('Error obteniendo ranking de sesiones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});
router.get('/sessions/:id', authenticate, attachOrg, telemetryV2Controller.getSession);
router.get('/sessions/:id/points', authenticate, attachOrg, telemetryV2Controller.getSessionPoints);

// Endpoint completo de sesión con ruta, eventos y estadísticas (compatible con backup)
router.get('/session-route/:id', authenticate, attachOrg, async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = (req as any).orgId;

        // Obtener sesión con vehículo
        const session = await prisma.session.findFirst({
            where: { id, organizationId: orgId },
            include: { vehicle: true }
        });

        if (!session) {
            return res.status(404).json({ success: false, error: 'Sesión no encontrada' });
        }

        // Obtener puntos GPS
        const gpsPoints = await prisma.gpsMeasurement.findMany({
            where: { sessionId: id },
            orderBy: { timestamp: 'asc' }
        });

        // Obtener eventos de estabilidad usando SQL directo
        const stabilityEvents = await prisma.$queryRaw<any[]>`
            SELECT id, session_id, timestamp, lat, lon, type, severity, speed, "rotativoState", details, "keyType", "interpolatedGPS"
            FROM stability_events
            WHERE session_id = ${id}
            ORDER BY timestamp ASC
        `.catch(() => []) as any[];

        logger.info(`🔍 Encontrados ${stabilityEvents.length} eventos de estabilidad para sesión ${id}`);
        logger.info(`🔍 Encontrados ${gpsPoints.length} puntos GPS para sesión ${id}`);

        // Función para calcular distancia entre dos puntos GPS (fórmula de Haversine)
        function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
            const R = 6371000; // Radio de la Tierra en metros
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distancia en metros
        }

        // PASO 1: Filtrar coordenadas válidas por rango geográfico
        const validGpsPoints = gpsPoints.filter(gps => {
            // Filtrar coordenadas (0,0) que indican sin señal GPS
            if (gps.latitude === 0 && gps.longitude === 0) return false;

            // Filtrar coordenadas claramente inválidas
            if (Math.abs(gps.latitude) > 90 || Math.abs(gps.longitude) > 180) return false;

            // Filtrar coordenadas que están en España (rangos más amplios)
            if (gps.latitude >= 35 && gps.latitude <= 45 &&
                gps.longitude >= -10 && gps.longitude <= 5) return true;

            // Si no está en España, verificar si es una coordenada válida global
            if (gps.latitude >= -90 && gps.latitude <= 90 &&
                gps.longitude >= -180 && gps.longitude <= 180) {
                logger.warn(`⚠️ Coordenada fuera de España pero válida: lat=${gps.latitude}, lng=${gps.longitude}`);
                return true;
            }

            return false;
        });

        logger.info(`🔍 Coordenadas válidas por rango: ${validGpsPoints.length} de ${gpsPoints.length}`);

        // PASO 2: Filtrar puntos con "callejeado" (validación de continuidad de ruta)
        const MAX_DISTANCE_BETWEEN_POINTS = 2000; // 2km máximo entre puntos consecutivos (más realista)
        const MIN_POINTS_FOR_VALID_ROUTE = 5; // Mínimo 5 puntos para considerar ruta válida (reducido)
        const MAX_SPEED_KMH = 200; // Máxima velocidad realista en km/h (autopista)
        const MAX_ABSOLUTE_DISTANCE = 50000; // 50km máximo absoluto (filtra errores GPS masivos reales)
        const filteredRoutePoints: typeof gpsPoints = [];
        let skippedJumps = 0;
        let skippedSpeed = 0;
        let skippedMassiveErrors = 0;

        if (validGpsPoints.length > 0) {
            // Siempre incluir el primer punto
            filteredRoutePoints.push(validGpsPoints[0]);

            for (let i = 1; i < validGpsPoints.length; i++) {
                const prevPoint = filteredRoutePoints[filteredRoutePoints.length - 1];
                const currentPoint = validGpsPoints[i];

                // Calcular distancia entre el último punto aceptado y el actual
                const distance = calculateDistance(
                    prevPoint.latitude,
                    prevPoint.longitude,
                    currentPoint.latitude,
                    currentPoint.longitude
                );

                // Calcular tiempo entre puntos (en segundos)
                const timeDiff = Math.abs((currentPoint.timestamp.getTime() - prevPoint.timestamp.getTime()) / 1000);

                // Calcular velocidad (km/h)
                const speedKmh = timeDiff > 0 ? (distance / 1000) / (timeDiff / 3600) : 0;

                // Validaciones en cascada (más inteligente)
                const isMassiveError = distance > MAX_ABSOLUTE_DISTANCE;
                const isValidDistance = distance <= MAX_DISTANCE_BETWEEN_POINTS;
                const isValidSpeed = speedKmh <= MAX_SPEED_KMH;
                const hasValidTime = timeDiff <= 600; // Máximo 10 minutos entre puntos (más realista)

                // Filtrar errores GPS masivos primero
                if (isMassiveError) {
                    skippedMassiveErrors++;
                    logger.warn(`🚫 Error GPS masivo: ${distance.toFixed(0)}m (máx absoluto: ${MAX_ABSOLUTE_DISTANCE}m)`);
                }
                // Solo aceptar el punto si pasa todas las validaciones y no es error masivo
                else if (isValidDistance && isValidSpeed && hasValidTime) {
                    filteredRoutePoints.push(currentPoint);
                } else {
                    // Log detallado de por qué se rechazó el punto
                    if (!isValidDistance) {
                        skippedJumps++;
                        logger.warn(`⚠️ Salto GPS: ${distance.toFixed(0)}m (máx: ${MAX_DISTANCE_BETWEEN_POINTS}m)`);
                    }
                    if (!isValidSpeed) {
                        skippedSpeed++;
                        logger.warn(`⚠️ Velocidad irreal: ${speedKmh.toFixed(1)} km/h (máx: ${MAX_SPEED_KMH} km/h)`);
                    }
                }
            }
        }

        logger.info(`🔍 Puntos GPS filtrados: ${filteredRoutePoints.length} de ${gpsPoints.length}`);
        logger.info(`🔍 Saltos GPS filtrados: ${skippedJumps}`);
        logger.info(`🔍 Velocidades irrealistas filtradas: ${skippedSpeed}`);
        logger.info(`🔍 Errores GPS masivos filtrados: ${skippedMassiveErrors}`);

        // Si no hay suficientes puntos para una ruta válida, devolver error
        if (filteredRoutePoints.length < MIN_POINTS_FOR_VALID_ROUTE) {
            logger.warn(`❌ Ruta inválida: solo ${filteredRoutePoints.length} puntos (mínimo: ${MIN_POINTS_FOR_VALID_ROUTE})`);
            return res.json({
                success: true,
                data: {
                    route: [],
                    events: [],
                    session: {
                        vehicleName: session.vehicle?.name || 'Vehículo',
                        startTime: session.startTime,
                        endTime: session.endTime
                    },
                    stats: {
                        validRoutePoints: 0,
                        validEvents: 0,
                        totalGpsPoints: gpsPoints.length,
                        totalEvents: stabilityEvents.length,
                        skippedJumps: skippedJumps,
                        skippedSpeed: skippedSpeed,
                        skippedMassiveErrors: skippedMassiveErrors,
                        hasValidRoute: false,
                        maxDistanceBetweenPoints: MAX_DISTANCE_BETWEEN_POINTS,
                        minPointsRequired: MIN_POINTS_FOR_VALID_ROUTE
                    }
                }
            });
        }

        // Formatear respuesta completa
        const routeData = {
            route: filteredRoutePoints.map((p: any) => ({
                lat: p.latitude,
                lng: p.longitude,
                speed: p.speed || 0,
                timestamp: p.timestamp
            })),
            events: stabilityEvents.map((e: any) => {
                // Determinar severidad según tipo
                let severity = 'medium';
                if (e.type === 'rollover_imminent' || e.type === 'rollover_risk') {
                    severity = 'critical';
                } else if (e.type === 'dangerous_drift') {
                    severity = 'critical';
                } else if (e.type === 'abrupt_maneuver') {
                    severity = 'high';
                }

                return {
                    id: e.id,
                    lat: e.lat || 0,
                    lng: e.lon || 0,
                    type: e.type || 'unknown',
                    severity: severity,
                    timestamp: e.timestamp,
                    speed: e.speed || 0,
                    rotativoState: e.rotativoState || 0,
                    // Detalles del evento desde el JSON
                    ...e.details,
                    // Para compatibilidad con frontend (mapeo de nombres nuevos a antiguos)
                    isLTRCritical: e.details?.isRiesgoVuelco || false,
                    isDRSHigh: e.details?.isDerivaPeligrosa || false,
                    isLateralGForceHigh: e.details?.isManobraBrusca || false,
                    ax: e.details?.ax,
                    ay: e.details?.ay,
                    az: e.details?.az,
                    gx: e.details?.gx,
                    gy: e.details?.gy,
                    gz: e.details?.gz,
                    roll: e.details?.roll,
                    si: e.details?.si,
                    gpsTimeDiff: e.details?.gpsTimeDiff
                };
            }),
            session: {
                vehicleName: session.vehicle?.name || 'Vehículo',
                startTime: session.startTime,
                endTime: session.endTime
            },
            stats: {
                validRoutePoints: filteredRoutePoints.length,
                validEvents: stabilityEvents.length,
                totalGpsPoints: gpsPoints.length,
                totalEvents: stabilityEvents.length,
                skippedJumps: skippedJumps,
                skippedSpeed: skippedSpeed,
                skippedMassiveErrors: skippedMassiveErrors,
                hasValidRoute: filteredRoutePoints.length > 0,
                maxDistanceBetweenPoints: MAX_DISTANCE_BETWEEN_POINTS,
                minPointsRequired: MIN_POINTS_FOR_VALID_ROUTE
            }
        };

        res.json({ success: true, data: routeData });
    } catch (error: any) {
        logger.error('Error en /session-route/:id:', error);
        res.status(500).json({ success: false, error: 'Error cargando ruta de sesión' });
    }
});
router.use('/panel', panelRoutes);
router.use('/reports', reportsRoutes);
router.use('/simple-reports', simpleReportsRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/upload', uploadRoutes);
router.use('/upload-unified', uploadUnifiedRoutes); // NUEVO: Sistema unificado de subida
router.use('/ai', aiCacheMiddleware, aiRoutes);
router.use('/admin', adminRoutes);
router.use('/observability', observabilityRoutes);
router.use('/sesion', sessionsUploadRoutes);
router.use('/organization-processor', organizationProcessorRoutes);

// Rutas de radar
router.use('/radar', radarRoutes);

// Rutas de parques
router.use('/parks', parksRoutes);
router.use('/zones', zonesRoutes);
router.use('/geofences', geofencesRoutes);
router.use('/geofence-alerts', geofenceAlertsRoutes);

// Rutas de KPIs de parque
router.use('/park-kpi', parkKPIRoutes);

// Rutas de KPIs avanzados
// router.use('/advanced-kpi', advancedKPIRoutes);

// Rutas del dashboard ejecutivo con filtros globales (con caché)
router.get('/executive-dashboard', dashboardCacheMiddleware, (req, res) => {
    logger.info('🎯 Ejecutando endpoint executive-dashboard desde index');

    // Extraer filtros globales
    const filters = {
        vehicles: req.query.vehicles ? (req.query.vehicles as string).split(',') : [],
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        rotativo: req.query.rotativo as string,
        clave: req.query.clave ? (req.query.clave as string).split(',') : [],
        severity: req.query.severity ? (req.query.severity as string).split(',') : [],
        roadType: req.query.roadType ? (req.query.roadType as string).split(',') : [],
        sessionType: req.query.sessionType as string,
        organizationId: req.query.organizationId as string
    };

    logger.info('📊 Filtros aplicados al dashboard:', filters);

    // Datos mock con variación basada en filtros
    const baseData = {
        period: req.query.period || 'day',
        lastUpdate: new Date().toISOString(),
        organizationId: filters.organizationId || 'test-org',
        filtersApplied: filters,

        // Tiempos operativos (variar según filtros)
        timeInPark: 156.5 + (filters.vehicles.length * 10),
        timeOutOfPark: 43.2 + (filters.vehicles.length * 5),
        timeInParkWithRotary: filters.rotativo === 'on' ? 12.8 : (filters.rotativo === 'off' ? 0 : 12.8),
        timeInWorkshopWithRotary: 3.2,
        timeInEnclave5: filters.clave.includes('5') ? 8.5 : 0,
        timeInEnclave2: filters.clave.includes('2') ? 15.3 : 0,
        timeOutOfParkWithRotary: filters.rotativo === 'on' ? 28.7 : (filters.rotativo === 'off' ? 0 : 28.7),

        // Estados operativos
        vehiclesInPark: 12 + (filters.vehicles.length || 0),
        vehiclesOutOfPark: 8,
        vehiclesWithRotaryOn: filters.rotativo === 'on' ? 15 : (filters.rotativo === 'off' ? 0 : 15),
        vehiclesWithRotaryOff: filters.rotativo === 'off' ? 5 : (filters.rotativo === 'on' ? 0 : 5),
        vehiclesInWorkshop: 2,

        // Eventos e incidencias (filtrar por severidad)
        totalEvents: 47,
        criticalEvents: filters.severity.includes('G') ? 3 : 0,
        severeEvents: filters.severity.includes('M') ? 8 : 0,
        lightEvents: filters.severity.includes('L') ? 36 : 0,

        // Excesos y cumplimiento
        timeExcesses: 4,
        speedExcesses: 12,
        complianceRate: 94.2,

        // Métricas de estabilidad
        ltrScore: 8.7,
        ssfScore: 7.9,
        drsScore: 8.2,

        // Metadatos
        totalVehicles: 20,
        activeVehicles: 18,
        totalSessions: 25,

        // Información de filtros aplicados
        filtersInfo: {
            hasVehicleFilter: filters.vehicles.length > 0,
            hasDateFilter: !!(filters.startDate || filters.endDate),
            hasRotativoFilter: filters.rotativo !== 'all',
            hasClaveFilter: filters.clave.length < 4,
            hasSeverityFilter: filters.severity.length < 3,
            hasRoadTypeFilter: filters.roadType.length > 0
        }
    };

    res.json({
        success: true,
        data: baseData,
        message: 'Dashboard ejecutivo cargado exitosamente con filtros aplicados'
    });
});

// Endpoint para obtener tipos de vía (filtro del dashboard)
router.get('/road-types', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'autopista', name: 'Autopista' },
            { id: 'urbana', name: 'Vía Urbana' },
            { id: 'rural', name: 'Vía Rural' },
            { id: 'tunel', name: 'Túnel' },
            { id: 'especial', name: 'Vía Especial' }
        ]
    });
});

// Rutas de KPIs (con caché)
router.use('/kpi', dashboardCacheMiddleware, kpiRoutes);
router.use('/kpi-calculation', dashboardCacheMiddleware, kpiCalculationRoutes);
router.use('/kpis', kpisOperationalRoutes); // KPIs operativos (claves 0-5)
router.use('/kpis-temp', kpisTempRoutes); // KPIs temporales (para resolver problema de importación)

// Rutas de claves operacionales (NUEVO - FASE 4)
router.use('/operational-keys', operationalKeysRoutes);

// Rutas del Módulo de Operaciones (Eventos Críticos, Alertas, Mantenimiento)
router.use('/operations', operationsRoutes);

// Rutas del Módulo de Emergencias - Bomberos Madrid ✅ ACTIVADAS
router.use('/emergencies', emergencyDashboardRoutes);

// Rutas de Alertas Inteligentes - Bomberos Madrid ✅ ACTIVADAS
router.use('/intelligent-alerts', intelligentAlertsRoutes);

// Rutas de Reportes de Emergencias - Bomberos Madrid ✅ ACTIVADAS
router.use('/emergency-reports', emergencyReportsRoutes);

// Rutas de Análisis de Zonas de Riesgo - Bomberos Madrid
// router.use('/api/risk-zones', riskZoneAnalysisRoutes);

// Rutas de Tiempos de Respuesta - Bomberos Madrid
// router.use('/api/response-time', responseTimeRoutes);

// Rutas de Notificaciones Push - Bomberos Madrid ✅ ACTIVADAS
router.use('/push-notifications', pushNotificationsRoutes);

// Rutas de Escalamiento Automático de Alertas - Bomberos Madrid ✅ ACTIVADAS
router.use('/alert-escalation', alertEscalationRoutes);

// Rutas de Análisis de Eficiencia Operativa - Bomberos Madrid
// router.use('/api/operational-efficiency', operationalEfficiencyRoutes);

// Rutas de Reportes de Costos Operativos - Bomberos Madrid
// router.use('/api/operational-costs', operationalCostsRoutes);

// Rutas de API de Geofences - Bomberos Madrid
// router.use('/api/geofences', geofencesAPIRoutes);

// Rutas de exportación PDF
router.use('/pdf-export', pdfExportRoutes);

// Rutas de exportación CSV
router.use('/export', csvExportRoutes);

// Rutas de generación de eventos
router.use('/generate-events', generateEventsRoutes);

// Rutas de parques de bomberos
router.use('/fire-stations', fireStationsRoutes);

// Rutas de eventos de estabilidad
router.use('/stability-events', stabilityEventsRoutes);

// Rutas de sistema de alertas
router.use('/alerts', alertsRoutes);

// Rutas de reportes
router.use('/reports', reportsRoutes);

// Rutas de tracking de procesamiento (con caché)
router.use('/processing', processingCacheMiddleware, processingTrackingRoutes);

// Rutas de geocercas y reglas (con caché)
try {
    const { geofenceRulesRouter, realTimeGeofenceRouter } = getGeofenceServices();
    router.use('/geofence-rules', mapDataCacheMiddleware, geofenceRulesRouter);
    router.use('/real-time-geofence', mapDataCacheMiddleware, realTimeGeofenceRouter);
    logger.info('✅ Rutas de geocercas activadas');
} catch (error) {
    logger.warn('⚠️ Servicios de geocercas no disponibles:', error);
}

// Confirmación de rutas activadas
logger.info('🚒 Módulos de Emergencias activados:');
logger.info('  ✅ Dashboard de Emergencias: /api/emergencies');
logger.info('  ✅ Alertas Inteligentes: /api/intelligent-alerts');
logger.info('  ✅ Reportes de Emergencias: /api/emergency-reports');
logger.info('  ✅ Notificaciones Push: /api/push-notifications');
logger.info('  ✅ Escalamiento de Alertas: /api/alert-escalation');
logger.info('  ✅ Parques de Bomberos: /api/fire-stations');
logger.info('  ✅ Eventos de Estabilidad: /api/stability-events');
logger.info('  ✅ Sistema de Alertas: /api/alerts');
logger.info('  ✅ KPIs Operativos: /api/v1/kpis');
logger.info('  ✅ Ranking de Sesiones: /api/sessions/ranking');


/**
 * POST /api/clean-all-sessions
 * Endpoint para limpiar/eliminar todas las sesiones de la base de datos
 * CUIDADO: Esta operación es destructiva y no se puede deshacer
 */
router.post('/clean-all-sessions', authenticate, async (req, res) => {
    try {
        const prismaModule = await import('../config/prisma');
        const prisma = prismaModule.prisma || prismaModule.default;

        logger.warn('⚠️ Iniciando limpieza de base de datos - OPERACIÓN DESTRUCTIVA');
        logger.warn('⚠️ Esta acción eliminará TODAS las sesiones de TODAS las organizaciones');

        // ✅ Obtener conteo REAL (sin filtros) antes de eliminar
        const sessionCount = await prisma.session.count({});
        const stabilityEventCount = await prisma.stabilityEvent.count({});
        const gpsCount = await prisma.gpsMeasurement.count({});
        const rotativoCount = await prisma.rotativoMeasurement.count({});
        const stabilityMeasurementCount = await prisma.stabilityMeasurement.count({});

        logger.info(`📊 Elementos a eliminar (TODAS las organizaciones): ${sessionCount} sesiones, ${stabilityEventCount} eventos, ${gpsCount} GPS, ${rotativoCount} rotativo, ${stabilityMeasurementCount} estabilidad`);

        // ✅ Eliminar en orden correcto (por dependencias foreign keys)
        logger.info('🗑️ Eliminando datos relacionados...');

        await prisma.stabilityEvent.deleteMany({});
        logger.info('  ✓ StabilityEvent eliminados');

        await prisma.gpsMeasurement.deleteMany({});
        logger.info('  ✓ GpsMeasurement eliminados');

        await prisma.stabilityMeasurement.deleteMany({});
        logger.info('  ✓ StabilityMeasurement eliminados');

        await prisma.rotativoMeasurement.deleteMany({});
        logger.info('  ✓ RotativoMeasurement eliminados');

        await prisma.canMeasurement.deleteMany({});
        logger.info('  ✓ CanMeasurement eliminados');

        await prisma.dataQualityMetrics.deleteMany({});
        logger.info('  ✓ DataQualityMetrics eliminados');

        await prisma.operationalKey.deleteMany({});
        logger.info('  ✓ OperationalKey eliminados');

        // Por último, eliminar sesiones
        await prisma.session.deleteMany({});
        logger.info('  ✓ Session eliminadas');

        // ✅ Verificar que todo fue eliminado
        const sessionsRemaining = await prisma.session.count();
        const gpsRemaining = await prisma.gpsMeasurement.count();
        const stabilityRemaining = await prisma.stabilityMeasurement.count();
        const rotativoRemaining = await prisma.rotativoMeasurement.count();

        if (sessionsRemaining > 0 || gpsRemaining > 0 || stabilityRemaining > 0 || rotativoRemaining > 0) {
            logger.warn(`⚠️ Datos restantes: ${sessionsRemaining} sesiones, ${gpsRemaining} GPS, ${stabilityRemaining} estabilidad, ${rotativoRemaining} rotativo`);
        } else {
            logger.info('✅ Verificado: 0 datos restantes en BD');
        }

        logger.info('✅ Base de datos limpiada exitosamente');

        res.json({
            success: true,
            data: {
                message: 'Base de datos limpiada exitosamente',
                deleted: {
                    sessions: sessionCount,
                    stabilityEvents: stabilityEventCount,
                    stabilityMeasurements: stabilityMeasurementCount,
                    gpsPoints: gpsCount,
                    rotativoMeasurements: rotativoCount
                },
                remaining: {
                    sessions: sessionsRemaining,
                    gpsPoints: gpsRemaining,
                    stabilityMeasurements: stabilityRemaining,
                    rotativoMeasurements: rotativoRemaining
                }
            }
        });

    } catch (error: any) {
        logger.error('❌ Error limpiando base de datos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al limpiar base de datos',
            details: error.message
        });
    }
});

export default router;
