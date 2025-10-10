import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const dashboardController = new DashboardController();
const prisma = new PrismaClient();

// Middleware de autenticación para todas las rutas del dashboard
router.use(authenticate);

// Middleware de logging para todas las rutas del dashboard
router.use((req, res, next) => {
    logger.info(`[Dashboard] ${req.method} ${req.path}`, {
        query: req.query,
        params: req.params,
        user: req.user
    });
    next();
});

// Endpoint temporal para listar todos los vehicleId de VehicleKPI
router.get('/metrics/vehicles-ids', async (req, res) => {
    try {
        const kpis = await prisma.vehicleKPI.findMany({ select: { vehicleId: true } });
        const vehicleIds = kpis.map(kpi => kpi.vehicleId);
        res.json({ vehicleIds });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener vehicleIds', details: error });
    }
});

// Endpoint para obtener el KPI de un vehículo por vehicleId
router.get('/metrics/vehicles/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const kpi = await prisma.vehicleKPI.findFirst({
            where: { vehicleId },
            orderBy: { date: 'desc' }
        });
        if (!kpi) {
            return res.status(404).json({ error: 'No KPI found' });
        }
        res.json(kpi);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener KPI', details: error });
    }
});

// Ruta para obtener estadísticas generales con filtros globales
router.get('/stats', async (req, res) => {
    try {
        // Aplicar filtros globales si están presentes
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

        logger.info('Dashboard stats with filters:', filters);
        await dashboardController.getStats(req, res);
    } catch (error) {
        logger.error('Error en ruta /stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

// Ruta para obtener estadísticas de vehículos
router.get('/vehicles', async (req, res) => {
    try {
        await dashboardController.getVehicleStats(req, res);
    } catch (error) {
        logger.error('Error en ruta /vehicles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

// Ruta para obtener sesiones recientes
router.get('/sessions', async (req, res) => {
    try {
        await dashboardController.getRecentSessions(req, res);
    } catch (error) {
        logger.error('Error en ruta /sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

// Ruta para obtener alarmas por tipo
router.get('/alarms', async (req, res) => {
    try {
        await dashboardController.getAlarmsByType(req, res);
    } catch (error) {
        logger.error('Error en ruta /alarms:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

export default router;
