/**
 * 🔍 RUTAS DE VERIFICACIÓN DE SESIONES
 * 
 * Endpoints para verificar y comparar sesiones generadas
 * con el análisis real
 * 
 * @version 1.0
 * @date 2025-10-11
 */

import { Router } from 'express';
import { extractOrganizationId, requireAuth } from '../middleware/auth';
import { sessionVerificationService } from '../services/SessionVerificationService';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('SessionVerificationRoutes');

router.use(requireAuth, extractOrganizationId);

/**
 * GET /api/sessions/verification/:vehicleIdentifier/:date
 * Genera reporte de verificación para un vehículo y fecha
 */
router.get('/verification/:vehicleIdentifier/:date', async (req, res) => {
    try {
        const { vehicleIdentifier, date } = req.params;

        const report = await sessionVerificationService.generateVerificationReport(
            vehicleIdentifier.toUpperCase(),
            date
        );

        res.send(report);

    } catch (error: any) {
        logger.error('Error generando reporte de verificación', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error generando reporte'
        });
    }
});

/**
 * GET /api/sessions/correlate/:vehicleIdentifier/:date
 * Obtiene sesiones correlacionadas por tiempo
 */
router.get('/correlate/:vehicleIdentifier/:date', async (req, res) => {
    try {
        const { vehicleIdentifier, date } = req.params;

        const correlatedSessions = await sessionVerificationService.correlateSessions(
            vehicleIdentifier.toUpperCase(),
            date
        );

        res.json({
            success: true,
            data: {
                vehicleIdentifier: vehicleIdentifier.toUpperCase(),
                date,
                totalSessions: correlatedSessions.length,
                sessions: correlatedSessions
            }
        });

    } catch (error: any) {
        logger.error('Error correlacionando sesiones', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error correlacionando sesiones'
        });
    }
});

export default router;

