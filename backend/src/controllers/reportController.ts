// @ts-nocheck
import { Request, Response } from 'express';
import { CreateReportDto } from '../dtos/create-report.dto';
import { ReportService } from '../services/reportService';
import { logger } from '../utils/logger';

// Listar reportes
export const listReportsHandler = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20 } = req.query as any;
        const result = await ReportService.listReports(
            req.user!.organizationId,
            Number(page),
            Number(limit)
        );
        res.json(result);
    } catch (error) {
        logger.error('Error listando reportes', { error });
        res.status(500).json({ error: 'Error listando reportes' });
    }
};

// Crear nuevo reporte (enqueue)
export const createReportHandler = async (req: Request, res: Response) => {
    try {
        const dto = req.body as CreateReportDto;
        if (!dto.sessionId) return res.status(400).json({ error: 'sessionId requerido' });
        const report = await ReportService.enqueueReport(
            { id: req.user!.id as string, organizationId: req.user!.organizationId as string },
            dto
        );
        res.status(202).json(report);
    } catch (error) {
        logger.error('Error creando reporte', { error });
        res.status(500).json({ error: 'Error creando reporte' });
    }
};

// Descargar archivo PDF
export const downloadReportHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const stream = await ReportService.getReportFileStream(req.user!.organizationId, id);
        if (!stream) {
            return res.status(404).end();
        }
        res.setHeader('Content-Type', 'application/pdf');
        stream.pipe(res);
    } catch (error) {
        logger.error('Error descargando reporte', { error });
        res.status(500).json({ error: 'Error descargando reporte' });
    }
};

// Reintentar generación
export const retryReportHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const report = await ReportService.retryReport(req.user!.organizationId, id);
        res.json(report);
    } catch (error) {
        logger.error('Error reintentando reporte', { error });
        res.status(500).json({ error: 'Error reintentando reporte' });
    }
};

// Health-check del servicio de reportes
export const healthHandler = async (_req: Request, res: Response) => {
    res.status(200).end();
};
