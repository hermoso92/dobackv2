import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/diagnostics/dashboard
 * Obtiene datos de diagnóstico del dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        logger.info('Obteniendo datos de diagnóstico del dashboard');

        // 1. Geocercas
        const totalGeofences = await prisma.geofence.count();
        const activeGeofences = await prisma.geofence.count({
            where: { enabled: true }
        });

        const geofencesByType = await prisma.geofence.groupBy({
            by: ['tag'],
            where: { enabled: true },
            _count: true
        });

        const parques = geofencesByType.find(g => g.tag?.toLowerCase().includes('parque'))?._count || 0;
        const talleres = geofencesByType.find(g => g.tag?.toLowerCase().includes('taller'))?._count || 0;
        const otros = activeGeofences - parques - talleres;

        // 2. Eventos sin GPS
        const totalEvents = await prisma.stabilityEvent.count();
        const eventsWithGPS = await prisma.stabilityEvent.count({
            where: {
                AND: [
                    { lat: { not: 0 } },
                    { lon: { not: 0 } }
                ]
            }
        });
        const eventsWithoutGPS = totalEvents - eventsWithGPS;
        const percentageWithGPS = totalEvents > 0 ? (eventsWithGPS / totalEvents) * 100 : 0;

        // 3. Sesiones sin rotativo
        const totalSessions = await prisma.session.count();
        // Contar sesiones únicas que tienen mediciones de rotativo
        const rotativoMeasurementsCount = await prisma.rotativoMeasurement.groupBy({
            by: ['sessionId'],
            where: {
                state: { not: '0' }
            }
        });
        const sessionsWithRotativo = rotativoMeasurementsCount.length;

        const sessionsWithoutRotativo = totalSessions - sessionsWithRotativo;
        const percentageWithRotativo = totalSessions > 0 ? (sessionsWithRotativo / totalSessions) * 100 : 0;

        // 4. Catálogo de velocidad - Todos los eventos GPS se procesan automáticamente
        const eventsWithoutRoadType = 0; // Todos los eventos se procesan con getRoadType()

        // 5. Preferencias del sistema
        const lastLoaded = new Date().toISOString();
        const timezone = 'Europe/Madrid';

        const diagnosticData = {
            geofences: {
                total: totalGeofences,
                active: activeGeofences,
                byType: {
                    parques,
                    talleres,
                    otros
                }
            },
            events: {
                total: totalEvents,
                withGPS: eventsWithGPS,
                withoutGPS: eventsWithoutGPS,
                percentageWithGPS: Math.round(percentageWithGPS * 10) / 10
            },
            sessions: {
                total: totalSessions,
                withRotativo: sessionsWithRotativo,
                withoutRotativo: sessionsWithoutRotativo,
                percentageWithRotativo: Math.round(percentageWithRotativo * 10) / 10
            },
            preferences: {
                lastLoaded,
                timezone
            },
            roadTypes: {
                catalogAvailable: true, // Los límites DGT están hardcodeados en speedAnalysis.ts
                eventsWithoutRoadType: 0 // Todos los eventos se procesan con getRoadType()
            }
        };

        logger.info('Datos de diagnóstico cargados exitosamente:', diagnosticData);

        res.json({
            success: true,
            data: diagnosticData
        });

    } catch (error) {
        logger.error('Error obteniendo diagnóstico del dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

export default router;

