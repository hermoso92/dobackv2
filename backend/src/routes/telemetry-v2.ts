import { Router } from 'express';
import { TelemetryV2Controller } from '../controllers/TelemetryV2Controller';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const telemetryController = new TelemetryV2Controller();

// Endpoint de debug sin autenticación (TEMPORAL)
router.get('/debug-sessions', async (req, res) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const sessions = await prisma.session.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            include: {
                vehicle: {
                    select: {
                        name: true,
                        licensePlate: true
                    }
                },
                gpsMeasurements: {
                    select: {
                        latitude: true,
                        longitude: true,
                        speed: true,
                        timestamp: true
                    },
                    orderBy: {
                        timestamp: 'asc'
                    }
                },
                _count: {
                    select: {
                        gpsMeasurements: true
                    }
                }
            }
        });

        // Calcular distancia usando la nueva fórmula
        const sessionsWithDistance = sessions.map(session => {
            const points = session.gpsMeasurements || [];
            let totalDistance = 0;

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];

                // Filtrar puntos GPS inválidos
                if (prev.latitude === 0 && prev.longitude === 0) continue;
                if (curr.latitude === 0 && curr.longitude === 0) continue;
                if (prev.latitude < 35 || prev.latitude > 45) continue;
                if (curr.latitude < 35 || curr.latitude > 45) continue;
                if (prev.longitude < -10 || prev.longitude > 5) continue;
                if (curr.longitude < -10 || curr.longitude > 5) continue;

                // Calcular distancia usando fórmula de Haversine
                const R = 6371;
                const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
                const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                if (distance <= 10) {
                    totalDistance += distance;
                }
            }

            return {
                id: session.id,
                vehicleName: session.vehicle?.name || 'Desconocido',
                startTime: session.startTime,
                endTime: session.endTime,
                gpsPoints: session._count.gpsMeasurements,
                calculatedDistance: Math.round(totalDistance * 100) / 100,
                status: session.status
            };
        });

        res.json({
            success: true,
            sessions: sessionsWithDistance,
            totalSessions: sessions.length
        });

        await prisma.$disconnect();
    } catch (error) {
        logger.error('Error en debug-sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

// Endpoint de prueba para verificar autenticación
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'TelemetryV2 endpoint funcionando',
        user: req.user,
        orgId: req.orgId,
        timestamp: new Date().toISOString()
    });
});

// Endpoint de prueba sin autenticación para debugging
router.get('/debug-sessions', async (req, res) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const sessions = await prisma.session.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            include: {
                vehicle: {
                    select: {
                        name: true,
                        licensePlate: true
                    }
                },
                gpsMeasurements: {
                    select: {
                        latitude: true,
                        longitude: true,
                        speed: true,
                        timestamp: true
                    },
                    orderBy: {
                        timestamp: 'asc'
                    }
                },
                _count: {
                    select: {
                        gpsMeasurements: true
                    }
                }
            }
        });

        // Calcular distancia usando la nueva fórmula
        const sessionsWithDistance = sessions.map(session => {
            const points = session.gpsMeasurements || [];
            let totalDistance = 0;

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];

                // Filtrar puntos GPS inválidos
                if (prev.latitude === 0 && prev.longitude === 0) continue;
                if (curr.latitude === 0 && curr.longitude === 0) continue;
                if (prev.latitude < 35 || prev.latitude > 45) continue;
                if (curr.latitude < 35 || curr.latitude > 45) continue;
                if (prev.longitude < -10 || prev.longitude > 5) continue;
                if (curr.longitude < -10 || curr.longitude > 5) continue;

                // Calcular distancia usando fórmula de Haversine
                const R = 6371;
                const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
                const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                if (distance <= 10) {
                    totalDistance += distance;
                }
            }

            return {
                id: session.id,
                vehicleName: session.vehicle?.name || 'Desconocido',
                startTime: session.startTime,
                endTime: session.endTime,
                gpsPoints: session._count.gpsMeasurements,
                calculatedDistance: Math.round(totalDistance * 100) / 100,
                status: session.status
            };
        });

        res.json({
            success: true,
            sessions: sessionsWithDistance,
            totalSessions: sessions.length
        });

        await prisma.$disconnect();
    } catch (error) {
        logger.error('Error en debug-sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

// Rutas de sesiones de telemetría
router.get('/sessions', telemetryController.getSessions);
router.get('/sessions/:id', telemetryController.getSession);
router.get('/sessions/:id/points', telemetryController.getSessionPoints);

// Rutas de eventos
router.get('/events', telemetryController.getEvents);

// Rutas de geocercas (Radar)
router.get('/radar/geofences', telemetryController.getGeofences);
router.post('/radar/geofences', telemetryController.createGeofence);
router.put('/radar/geofences/:id', telemetryController.updateGeofence);
router.delete('/radar/geofences/:id', telemetryController.deleteGeofence);
router.post('/radar/webhook', telemetryController.processRadarWebhook);

// Rutas de exportación
router.post('/sessions/:id/export/csv', telemetryController.exportToCSV);
router.post('/sessions/:id/export/pdf', telemetryController.exportToPDF);

// Rutas de tiles de TomTom (proxy)
router.get('/tomtom/tiles/:style/:z/:x/:y', telemetryController.getTomTomTiles);

export default router;
