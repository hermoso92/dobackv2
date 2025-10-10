import { Request, Response, Router } from 'express';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';
import { CSVExportService } from '../services/CSVExportService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación y organización
router.use(authenticate);
router.use(attachOrg);

/**
 * POST /api/export/telemetry/csv
 * Exporta datos de telemetría a CSV
 */
router.post('/telemetry/csv', async (req: Request, res: Response) => {
    try {
        const {
            vehicleIds,
            startDate,
            endDate,
            includeGPS = true,
            includeCAN = true,
            includeStability = true,
            includeRotativo = true,
            includeEvents = true
        } = req.body;

        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        logger.info('Exportando telemetría a CSV', {
            organizationId,
            vehicleIds,
            startDate,
            endDate
        });

        // Validar fechas
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format'
            });
        }

        // Generar CSV
        const csvContent = await CSVExportService.exportTelemetryCSV({
            organizationId,
            vehicleIds,
            startDate: start,
            endDate: end,
            includeGPS,
            includeCAN,
            includeStability,
            includeRotativo,
            includeEvents
        });

        // Configurar headers para descarga
        const fileName = `telemetria-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

        // Enviar CSV
        res.send(csvContent);

        logger.info('CSV de telemetría exportado exitosamente', {
            fileName,
            size: csvContent.length,
            organizationId
        });

    } catch (error) {
        logger.error('Error exportando telemetría a CSV', { error, orgId: (req as any).orgId });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al generar CSV de telemetría'
        });
    }
});

/**
 * POST /api/export/session/csv/:sessionId
 * Exporta una sesión específica a CSV
 */
router.post('/session/csv/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        logger.info('Exportando sesión específica a CSV', { sessionId, organizationId });

        // Generar CSV
        const csvContent = await CSVExportService.exportSessionCSV(sessionId, {
            organizationId
        });

        // Configurar headers para descarga
        const fileName = `sesion-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

        // Enviar CSV
        res.send(csvContent);

        logger.info('CSV de sesión exportado exitosamente', {
            fileName,
            sessionId,
            size: csvContent.length
        });

    } catch (error) {
        logger.error('Error exportando sesión a CSV', { error, sessionId: req.params.sessionId, orgId: (req as any).orgId });

        if (error instanceof Error && error.message === 'Sesión no encontrada') {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al generar CSV de sesión'
        });
    }
});

/**
 * POST /api/export/events/csv
 * Exporta eventos a CSV
 */
router.post('/events/csv', async (req: Request, res: Response) => {
    try {
        const { vehicleIds, startDate, endDate } = req.body;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        logger.info('Exportando eventos a CSV', {
            organizationId,
            vehicleIds,
            startDate,
            endDate
        });

        // Validar fechas
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format'
            });
        }

        // Generar CSV
        const csvContent = await CSVExportService.exportEventsCSV({
            organizationId,
            vehicleIds,
            startDate: start,
            endDate: end
        });

        // Configurar headers para descarga
        const fileName = `eventos-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

        // Enviar CSV
        res.send(csvContent);

        logger.info('CSV de eventos exportado exitosamente', {
            fileName,
            size: csvContent.length,
            organizationId
        });

    } catch (error) {
        logger.error('Error exportando eventos a CSV', { error, orgId: (req as any).orgId });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al generar CSV de eventos'
        });
    }
});

export default router;
