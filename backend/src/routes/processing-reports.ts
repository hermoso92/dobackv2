/**
 * 📊 RUTAS DE REPORTES DE PROCESAMIENTO
 * 
 * Endpoints para gestionar reportes de procesamiento
 */

import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { ProcessingReportService } from '../services/ProcessingReportService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/processing-reports/latest
 * Obtener el último reporte de procesamiento
 */
router.get('/latest', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;

        // ✅ Solo filtrar por organizationId (no por userId) para permitir acceso compartido
        const report = await ProcessingReportService.getLastReport(organizationId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró ningún reporte de procesamiento'
            });
        }

        res.json({
            success: true,
            report
        });
    } catch (error: any) {
        logger.error(`Error obteniendo último reporte: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/processing-reports
 * Obtener todos los reportes de procesamiento
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const organizationId = (req as any).user.organizationId;
        const limit = parseInt(req.query.limit as string) || 10;

        const reports = await ProcessingReportService.getAllReports(userId, organizationId, limit);

        res.json({
            success: true,
            reports
        });
    } catch (error: any) {
        logger.error(`Error obteniendo reportes: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/processing-reports/status/:id
 * Consultar el estado de un reporte en procesamiento
 * ⚠️ DEBE IR ANTES DE /:id para evitar conflictos de rutas
 */
router.get('/status/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const reportId = req.params.id;

        // ✅ Solo filtrar por organizationId (no por userId) para permitir acceso compartido
        const report = await prisma.processingReport.findFirst({
            where: {
                id: reportId,
                organizationId
            },
            select: {
                id: true,
                status: true,
                totalFiles: true,
                totalSessions: true,
                totalOmitted: true,
                startTime: true,
                endTime: true,
                duration: true,
                errorMessage: true,
                reportData: true,
                createdAt: true
            }
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        res.json({
            success: true,
            report
        });
    } catch (error: any) {
        logger.error(`Error obteniendo estado del reporte: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/processing-reports/:id
 * Obtener un reporte específico por ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const organizationId = (req as any).user.organizationId;
        const reportId = req.params.id;

        const report = await ProcessingReportService.getReportById(reportId, userId, organizationId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        res.json({
            success: true,
            report
        });
    } catch (error: any) {
        logger.error(`Error obteniendo reporte: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/processing-reports/:id
 * Eliminar un reporte
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const organizationId = (req as any).user.organizationId;
        const reportId = req.params.id;

        await ProcessingReportService.deleteReport(reportId, userId, organizationId);

        res.json({
            success: true,
            message: 'Reporte eliminado correctamente'
        });
    } catch (error: any) {
        logger.error(`Error eliminando reporte: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

