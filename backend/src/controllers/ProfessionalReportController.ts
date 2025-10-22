
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import { professionalReportService } from '../services/ProfessionalReportService';
import { logger } from '../utils/logger';



export class ProfessionalReportController {
    /**
     * Genera un reporte profesional
     * POST /api/reports/professional
     */
    async generateProfessionalReport(req: Request, res: Response) {
        try {
            const {
                sessionId,
                title,
                includeClusterAnalysis = true,
                includeMaps = true,
                includeCharts = true,
                includeRecommendations = true,
                filters = {},
                clusteringOptions = { enabled: true }
            } = req.body;

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: 'sessionId es requerido'
                });
            }

            logger.info('Generando reporte profesional', {
                sessionId,
                includeClusterAnalysis,
                filters,
                clusteringOptions
            });

            const config = {
                sessionId,
                title,
                includeClusterAnalysis,
                includeMaps,
                includeCharts,
                includeRecommendations,
                filters,
                clusteringOptions
            };

            const { filePath, size } = await professionalReportService.generateProfessionalReport(
                config
            );

            res.json({
                success: true,
                data: {
                    reportId: path.basename(filePath, '.pdf'),
                    fileName: path.basename(filePath),
                    filePath,
                    size,
                    downloadUrl: `/api/reports/professional/download/${path.basename(
                        filePath,
                        '.pdf'
                    )}`,
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error generando reporte profesional', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Descarga un reporte profesional
     * GET /api/reports/professional/download/:reportId
     */
    async downloadProfessionalReport(req: Request, res: Response) {
        try {
            const { reportId } = req.params;

            if (!reportId) {
                logger.warn('Intento de descarga sin reportId', {
                    userId: req.user?.id || 'desconocido'
                });
                return res.status(400).json({
                    success: false,
                    message: 'reportId es requerido'
                });
            }

            // Construcción robusta del path absoluto (sin duplicar 'backend')
            const REPORTS_DIR = process.env.REPORTS_DIR || path.join(__dirname, '../../reports');
            const filePath = path.join(REPORTS_DIR, `${reportId}.pdf`);

            // Log de depuración robusto
            const fileExists = fs.existsSync(filePath);
            logger.info(
                '[DESCARGA PDF] reportId:',
                reportId,
                '| filePath:',
                filePath,
                '| exists:',
                fileExists
            );

            // Log de intento de descarga
            logger.info('Intento de descarga de reporte profesional', {
                userId: req.user?.id || 'desconocido',
                reportId,
                filePath,
                fileExists
            });

            // Verificar que el archivo existe
            if (!fs.existsSync(filePath)) {
                logger.warn('Archivo de reporte no encontrado en descarga', { reportId, filePath });
                return res.status(404).json({
                    success: false,
                    message: 'Reporte no encontrado'
                });
            }

            // Log de auditoría (F3)
            const userId = req.user?.id || 'desconocido';
            const organizationId = req.user?.organizationId || 'desconocido';
            logger.info('Descarga de reporte profesional', {
                userId,
                organizationId,
                reportId,
                timestamp: new Date().toISOString(),
                action: 'download_report_pdf'
            });

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="reporte-profesional-${reportId}.pdf"`
            );

            // Enviar archivo
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

            fileStream.on('error', (error) => {
                logger.error('Error enviando archivo PDF', { error, filePath });
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error enviando archivo'
                    });
                }
            });

            logger.info('Reporte profesional descargado', { reportId, filePath });
        } catch (error) {
            logger.error('Error descargando reporte profesional', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtiene vista previa de un reporte (metadatos)
     * GET /api/reports/professional/preview/:sessionId
     */
    async getReportPreview(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const {
                speedFilter = 'all',
                rpmFilter = 'all',
                selectedTypes = [],
                clusteringEnabled = true
            } = req.query;

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    message: 'sessionId es requerido'
                });
            }

            // Simular la recopilación de datos para preview
            const config = {
                sessionId,
                title: 'Vista Previa',
                includeClusterAnalysis: clusteringEnabled === 'true',
                includeMaps: true,
                includeCharts: true,
                includeRecommendations: true,
                filters: {
                    speedFilter: speedFilter as string,
                    rpmFilter: rpmFilter as string,
                    selectedTypes: Array.isArray(selectedTypes) ? selectedTypes : [selectedTypes]
                },
                clusteringOptions: {
                    enabled: clusteringEnabled === 'true'
                }
            };

            // Obtener datos para preview sin generar PDF
            const reportData = await (professionalReportService as any).gatherReportData(config);

            res.json({
                success: true,
                data: {
                    sessionId,
                    sessionInfo: {
                        vehicle: reportData.session.vehicle?.licensePlate || 'N/A',
                        startTime: reportData.session.startTime,
                        endTime: reportData.session.endTime,
                        duration: Math.round(reportData.metrics.sessionDuration / 60)
                    },
                    metrics: reportData.metrics,
                    eventsSummary: {
                        totalEvents: reportData.events.length,
                        eventsByType: reportData.metrics.eventsByType,
                        eventsBySeverity: reportData.metrics.eventsBySeverity
                    },
                    clusteringSummary: config.clusteringOptions.enabled
                        ? {
                              totalClusters: reportData.clusters.length,
                              reductionPercentage: reportData.metrics.clusterReduction
                          }
                        : null,
                    recommendations: reportData.recommendations,
                    estimatedPages: this.calculateEstimatedPages(reportData, config),
                    filters: config.filters
                }
            });
        } catch (error) {
            logger.error('Error obteniendo preview del reporte', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Lista reportes profesionales generados
     * GET /api/reports/professional/list
     */
    async listProfessionalReports(req: Request, res: Response) {
        try {
            const REPORTS_DIR = process.env.REPORTS_DIR || path.resolve('./reports');
            const organizationId = req.user?.organizationId;

            logger.info('Iniciando listado de reportes profesionales', {
                REPORTS_DIR,
                organizationId,
                dirExists: fs.existsSync(REPORTS_DIR)
            });

            if (!fs.existsSync(REPORTS_DIR)) {
                logger.warn('Directorio de reportes no existe', { REPORTS_DIR });
                return res.json({
                    success: true,
                    data: []
                });
            }

            const allFiles = fs.readdirSync(REPORTS_DIR);
            logger.info('Archivos encontrados en directorio', {
                totalFiles: allFiles.length,
                files: allFiles
            });

            const files = allFiles.filter(
                (file) => file.startsWith('professional-report-') && file.endsWith('.pdf')
            );
            logger.info('Archivos de reportes profesionales filtrados', {
                professionalFiles: files.length,
                files: files
            });

            if (files.length === 0) {
                logger.warn('No se encontraron archivos de reportes profesionales');
                return res.json({
                    success: true,
                    data: []
                });
            }

            // Extraer todos los sessionIds UUID completos de los archivos
            const sessionIdMap = new Set<string>();
            for (const file of files) {
                const sessionIdMatch = file.match(/professional-report-([0-9a-fA-F\-]{36})-/);
                if (sessionIdMatch) sessionIdMap.add(sessionIdMatch[1]);
            }
            const sessionIds = Array.from(sessionIdMap);
            logger.info('SessionIds extraídos de archivos', { sessionIds });
            // Consultar la base de datos para mapear sessionId -> organizationId
            const sessions = await prisma.session.findMany({
                where: { id: { in: sessionIds } },
                select: { id: true, organizationId: true }
            });
            logger.info('Sesiones encontradas en BD', { sessions, sessionsFound: sessions.length });

            const sessionOrgMap = Object.fromEntries(
                (sessions as any[]).map((s: any) => [s.id, s.organizationId])
            );

            // Filtrar archivos por organizationId
            const filteredFiles = files.filter((file) => {
                // Extraer el UUID completo del sessionId
                const sessionIdMatch = file.match(/professional-report-([0-9a-fA-F\-]{36})-/);
                const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
                const fileOrgId = sessionId ? sessionOrgMap[sessionId] : null;
                const matches = sessionId && fileOrgId === organizationId;

                logger.info('Evaluando archivo', {
                    file,
                    sessionId,
                    fileOrgId,
                    userOrgId: organizationId,
                    matches
                });

                return matches;
            });

            logger.info('Archivos filtrados por organización', {
                filteredCount: filteredFiles.length,
                filteredFiles: filteredFiles
            });

            const result = filteredFiles
                .map((file) => {
                    const filePath = path.join(REPORTS_DIR, file);
                    const stats = fs.statSync(filePath);
                    const reportId = path.basename(file, '.pdf');
                    const sessionIdMatch = file.match(/professional-report-([^-]+)-/);
                    const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
                    return {
                        reportId,
                        fileName: file,
                        sessionId,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime,
                        downloadUrl: `/api/reports/professional/download/${reportId}`
                    };
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            logger.info('Resultado final', {
                resultCount: result.length,
                result: result
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error listando reportes profesionales', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Elimina un reporte profesional
     * DELETE /api/reports/professional/:reportId
     */
    async deleteProfessionalReport(req: Request, res: Response) {
        try {
            const { reportId } = req.params;

            if (!reportId) {
                return res.status(400).json({
                    success: false,
                    message: 'reportId es requerido'
                });
            }

            const REPORTS_DIR = process.env.REPORTS_DIR || path.resolve('./reports');
            const filePath = path.join(REPORTS_DIR, `${reportId}.pdf`);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Reporte no encontrado'
                });
            }

            fs.unlinkSync(filePath);

            logger.info('Reporte profesional eliminado', { reportId, filePath });

            res.json({
                success: true,
                message: 'Reporte eliminado exitosamente'
            });
        } catch (error) {
            logger.error('Error eliminando reporte profesional', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Calcula el número estimado de páginas del reporte
     */
    private calculateEstimatedPages(reportData: any, config: any): number {
        let pages = 1; // Portada
        pages += 1; // Resumen ejecutivo

        if (config.includeClusterAnalysis && reportData.clusters.length > 0) {
            pages += 1; // Análisis de clustering
        }

        pages += 1; // Análisis de eventos
        pages += 1; // Recomendaciones
        pages += 1; // Apéndice técnico

        // Páginas adicionales por volumen de datos
        if (reportData.events.length > 100) {
            pages += Math.ceil(reportData.events.length / 100);
        }

        if (reportData.clusters.length > 10) {
            pages += Math.ceil(reportData.clusters.length / 10);
        }

        return pages;
    }
}

export const professionalReportController = new ProfessionalReportController();
