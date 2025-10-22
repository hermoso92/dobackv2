
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import { webfleetStyleReportService } from '../services/WebfleetStyleReportService';
import { logger } from '../utils/logger';



export class WebfleetReportController {
    /**
     * Genera un reporte estilo Webfleet Solutions
     * POST /api/reports/webfleet
     */
    async generateWebfleetReport(req: Request, res: Response) {
        console.log('=== INICIO WEBFLEET REPORT ===');
        console.log('Body:', req.body);
        console.log('User:', (req as any).user);

        try {
            const {
                startDate,
                endDate,
                vehicleIds = [],
                reportType = 'detailed',
                title,
                includeCriticalEvents = true,
                includeConsumptionAnalysis = true,
                fuelReferenceBase = 7.5
            } = req.body;

            console.log('Datos parseados:', {
                startDate,
                endDate,
                vehicleIds,
                reportType
            });

            // Validaciones básicas
            if (!startDate || !endDate) {
                console.log('ERROR: Fechas faltantes');
                return res.status(400).json({
                    success: false,
                    message: 'startDate y endDate son requeridos'
                });
            }

            // Obtener organizationId del usuario autenticado
            const organizationId = (req as any).user?.organizationId;
            if (!organizationId) {
                console.log('ERROR: organizationId faltante');
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado o sin organización'
                });
            }

            console.log('OrganizationId:', organizationId);

            const config = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                vehicleIds: vehicleIds.length > 0 ? vehicleIds : undefined,
                organizationId,
                reportType,
                title: title || `Informe de viajes (${reportType})`,
                includeCriticalEvents,
                includeConsumptionAnalysis,
                fuelReferenceBase
            };

            console.log('Configuración del reporte:', config);

            // Generar el reporte real usando el servicio
            console.log('Generando reporte con WebfleetStyleReportService...');
            const { filePath, size } = await webfleetStyleReportService.generateWebfleetStyleReport(
                config
            );
            console.log('Reporte PDF generado:', { filePath, size });

            console.log('Intentando guardar en BD...');
            const report = await prisma.report.create({
                data: {
                    filePath,
                    sizeBytes: size,
                    params: config as any,
                    status: 'READY',
                    sha256: '',
                    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                    organization: {
                        connect: { id: organizationId }
                    },
                    requestedBy: {
                        connect: { id: (req as any).user?.id }
                    }
                }
            });

            console.log('Reporte guardado:', report.id);

            res.json({
                success: true,
                data: {
                    reportId: report.id,
                    fileName: path.basename(filePath),
                    filePath: filePath,
                    size: size,
                    downloadUrl: `/api/reports/webfleet/download/${report.id}`,
                    generatedAt: new Date().toISOString(),
                    config: config
                }
            });
        } catch (error: any) {
            console.error('ERROR en generateWebfleetReport:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Descarga un reporte estilo Webfleet por ID
     * GET /api/reports/webfleet/download/:reportId
     */
    async downloadWebfleetReport(req: Request, res: Response) {
        try {
            console.log('=== DESCARGA WEBFLEET REPORT ===');
            console.log('ReportId:', req.params.reportId);

            const { reportId } = req.params;
            const organizationId = (req as any).user?.organizationId;

            if (!organizationId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            console.log('Buscando reporte en BD...');
            const report = await prisma.report.findFirst({
                where: {
                    id: reportId,
                    organizationId
                }
            });

            if (!report) {
                console.log('Reporte no encontrado');
                return res.status(404).json({
                    success: false,
                    message: 'Reporte no encontrado'
                });
            }

            console.log('Reporte encontrado:', {
                id: report.id,
                filePath: report.filePath,
                size: report.sizeBytes
            });

            const filePath = report.filePath;
            if (!filePath || !fs.existsSync(filePath)) {
                console.log('Archivo no existe:', filePath);
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado'
                });
            }

            console.log('Enviando archivo...');

            // Configurar headers para descarga
            const fileName = path.basename(filePath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            // Leer el archivo y enviarlo
            const fileContent = fs.readFileSync(filePath);
            res.setHeader('Content-Length', fileContent.length);

            res.send(fileContent);

            console.log('Archivo enviado exitosamente');
        } catch (error: any) {
            console.error('ERROR en downloadWebfleetReport:', error);
            res.status(500).json({
                success: false,
                message: 'Error descargando el reporte',
                error: error.message
            });
        }
    }

    /**
     * Lista reportes estilo Webfleet
     * GET /api/reports/webfleet
     */
    async listWebfleetReports(req: Request, res: Response) {
        try {
            const organizationId = (req as any).user?.organizationId;
            const { page = 1, limit = 10 } = req.query;

            if (!organizationId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const skip = (Number(page) - 1) * Number(limit);

            const [reports, total] = await Promise.all([
                prisma.report.findMany({
                    where: {
                        organizationId
                        // Filtrar solo reportes estilo Webfleet (se puede añadir un campo type)
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit),
                    select: {
                        id: true,
                        filePath: true,
                        sizeBytes: true,
                        status: true,
                        createdAt: true,
                        expiresAt: true,
                        params: true
                    }
                }),
                prisma.report.count({
                    where: { organizationId }
                })
            ]);

            const formattedReports = reports.map((report) => ({
                id: report.id,
                fileName: path.basename(report.filePath),
                size: report.sizeBytes,
                status: report.status,
                createdAt: report.createdAt,
                expiresAt: report.expiresAt,
                config: report.params,
                downloadUrl: `/api/reports/webfleet/download/${report.id}`
            }));

            res.json({
                success: true,
                data: {
                    reports: formattedReports,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error) {
            logger.error('Error listando reportes estilo Webfleet', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Elimina un reporte estilo Webfleet
     * DELETE /api/reports/webfleet/:reportId
     */
    async deleteWebfleetReport(req: Request, res: Response) {
        try {
            const { reportId } = req.params;
            const organizationId = (req as any).user?.organizationId;

            if (!organizationId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const report = await prisma.report.findFirst({
                where: {
                    id: reportId,
                    organizationId
                }
            });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Reporte no encontrado'
                });
            }

            // Eliminar archivo físico si existe
            if (fs.existsSync(report.filePath)) {
                try {
                    fs.unlinkSync(report.filePath);
                    logger.info('Archivo físico de reporte eliminado', {
                        reportId,
                        filePath: report.filePath
                    });
                } catch (fileError) {
                    logger.warn('Error eliminando archivo físico', {
                        reportId,
                        filePath: report.filePath,
                        error: fileError
                    });
                }
            }

            // Eliminar registro de base de datos
            await prisma.report.delete({
                where: { id: reportId }
            });

            logger.info('Reporte estilo Webfleet eliminado', {
                reportId,
                organizationId
            });

            res.json({
                success: true,
                message: 'Reporte eliminado exitosamente'
            });
        } catch (error) {
            logger.error('Error eliminando reporte estilo Webfleet', {
                error,
                reportId: req.params.reportId
            });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtiene vista previa de datos para reporte estilo Webfleet
     * GET /api/reports/webfleet/preview
     */
    async getWebfleetReportPreview(req: Request, res: Response) {
        try {
            const { startDate, endDate, vehicleIds } = req.query;
            const organizationId = (req as any).user?.organizationId;

            if (!organizationId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate y endDate son requeridos'
                });
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            // Construir filtro de vehículos
            const vehicleFilter = vehicleIds
                ? { id: { in: (vehicleIds as string).split(',') } }
                : {};

            // Obtener estadísticas de sesiones
            const sessionsCount = await prisma.session.count({
                where: {
                    organizationId,
                    startTime: { gte: start, lte: end },
                    ...(vehicleIds ? { vehicleId: { in: (vehicleIds as string).split(',') } } : {})
                }
            });

            // Obtener vehículos afectados
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId,
                    ...vehicleFilter,
                    sessions: {
                        some: {
                            startTime: { gte: start, lte: end }
                        }
                    }
                },
                select: {
                    id: true,
                    licensePlate: true,
                    model: true,
                    _count: {
                        select: {
                            sessions: {
                                where: {
                                    startTime: { gte: start, lte: end }
                                }
                            }
                        }
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    period: {
                        startDate: start.toISOString(),
                        endDate: end.toISOString(),
                        duration: Math.ceil(
                            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                        )
                    },
                    summary: {
                        totalSessions: sessionsCount,
                        vehiclesCount: vehicles.length,
                        vehicles: vehicles.map((v) => ({
                            id: v.id,
                            licensePlate: v.licensePlate,
                            model: v.model,
                            sessionsCount: v._count.sessions
                        }))
                    }
                }
            });
        } catch (error) {
            logger.error('Error obteniendo vista previa de reporte Webfleet', { error });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

export const webfleetReportController = new WebfleetReportController();
