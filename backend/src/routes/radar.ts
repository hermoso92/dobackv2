import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// GET /api/radar/geofences - Obtener geocercas de Radar
router.get('/geofences', async (req, res) => {
    try {
        const userRole = req.user?.role;
        const organizationId = req.user?.organizationId;

        // Para usuarios ADMIN sin organización, devolver lista vacía
        if (!organizationId && userRole === 'ADMIN') {
            return res.json({
                success: true,
                data: []
            });
        }

        // Para usuarios con organización, buscar geocercas reales
        // TODO: Implementar búsqueda real de geocercas
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        logger.error('Error obteniendo geocercas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST /api/radar/geofences - Crear nueva geocerca
router.post('/geofences', async (req, res) => {
    try {
        const userRole = req.user?.role;
        const organizationId = req.user?.organizationId;

        if (!organizationId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Se requiere organización para crear geocercas'
            });
        }

        // TODO: Implementar creación real de geocercas
        res.status(201).json({
            success: true,
            data: {
                id: 'new-geofence-' + Date.now(),
                ...req.body,
                organizationId: organizationId || null
            }
        });
    } catch (error) {
        logger.error('Error creando geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;