import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
// Tipos locales para el controlador
interface ReportJobDTO {
    id: string;
    orgId: string;
    createdBy: string;
    createdAt: string;
    scheduledAt?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    input: {
        module: 'telemetry' | 'stability' | 'panel' | 'comparative' | 'dashboard';
        template: string;
        params: Record<string, any>;
        options: Record<string, any>;
    };
    output?: {
        url: string;
        pages: number;
        sizeKB: number;
    };
    meta?: Record<string, any>;
}

interface ReportOutput {
    url: string;
    pages: number;
    sizeKB: number;
}

interface ReportTemplate {
    id: string;
    name: string;
    module: string;
    description: string;
    fields: string[];
    defaultOptions: Record<string, any>;
}

export class ReportsController {
    // Generar reporte inmediato
    generateReport = async (req: Request, res: Response) => {
        try {
            const { module, template, params, options } = req.body;
            const orgId = req.orgId!;
            const userId = req.user?.id!;

            // Validar entrada
            if (!module || !template) {
                return res.status(400).json({
                    success: false,
                    error: 'Módulo y plantilla son requeridos'
                });
            }

            // Crear job de reporte
            const jobId = uuidv4();
            const reportJob: ReportJobDTO = {
                id: jobId,
                orgId,
                createdBy: userId,
                createdAt: new Date().toISOString(),
                status: 'pending',
                input: {
                    module,
                    template,
                    params: params || {},
                    options: options || {}
                }
            };

            // Guardar en base de datos
            await prisma.report.create({
                data: {
                    id: jobId,
                    organizationId: orgId,
                    requestedById: userId,
                    status: 'PENDING',
                    params: JSON.stringify(reportJob.input),
                    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 días
                }
            });

            // Procesar reporte de forma asíncrona
            this.processReportAsync(jobId, reportJob);

            res.json({
                success: true,
                data: reportJob
            });

        } catch (error) {
            logger.error('Error generando reporte', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Programar reporte
    scheduleReport = async (req: Request, res: Response) => {
        try {
            const { module, template, params, options, schedule } = req.body;
            const orgId = req.orgId!;
            const userId = req.user?.id!;

            // Validar entrada
            if (!module || !template || !schedule) {
                return res.status(400).json({
                    success: false,
                    error: 'Módulo, plantilla y programación son requeridos'
                });
            }

            // Crear job de reporte programado
            const jobId = uuidv4();
            const reportJob: ReportJobDTO = {
                id: jobId,
                orgId,
                createdBy: userId,
                createdAt: new Date().toISOString(),
                scheduledAt: schedule.nextRun,
                status: 'pending',
                input: {
                    module,
                    template,
                    params: params || {},
                    options: options || {}
                },
                meta: {
                    schedule: {
                        pattern: schedule.pattern,
                        timezone: schedule.timezone,
                        recipients: schedule.recipients || []
                    }
                }
            };

            // Guardar en base de datos
            await prisma.report.create({
                data: {
                    id: jobId,
                    organizationId: orgId,
                    requestedById: userId,
                    status: 'PENDING',
                    params: JSON.stringify(reportJob.input),
                    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 días
                }
            });

            // TODO: Programar en BullMQ
            // await this.scheduleReportJob(jobId, schedule);

            res.json({
                success: true,
                data: reportJob
            });

        } catch (error) {
            logger.error('Error programando reporte', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener historial de reportes
    getReportHistory = async (req: Request, res: Response) => {
        try {
            const { module, status, from, to, search, limit = 20, offset = 0 } = req.query;
            const orgId = req.orgId!;

            // Construir filtros
            const where: any = { organizationId: orgId };

            if (module) {
                where.params = {
                    path: ['module'],
                    equals: module
                };
            }

            if (status) {
                where.status = status;
            }

            if (from || to) {
                where.createdAt = {};
                if (from) where.createdAt.gte = new Date(from as string);
                if (to) where.createdAt.lte = new Date(to as string);
            }

            if (search) {
                where.OR = [
                    { id: { contains: search as string } },
                    { requestedById: { contains: search as string } }
                ];
            }

            // Obtener reportes
            const [reports, total] = await Promise.all([
                prisma.report.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: Number(limit),
                    skip: Number(offset)
                }),
                prisma.report.count({ where })
            ]);

            // Transformar a DTOs
            const reportDTOs: ReportJobDTO[] = reports.map(report => ({
                id: report.id,
                orgId: report.organizationId,
                createdBy: report.requestedById,
                createdAt: report.createdAt.toISOString(),
                scheduledAt: undefined, // No hay campo scheduledAt en Report
                status: report.status.toLowerCase() as any,
                input: JSON.parse(report.params as string),
                output: report.filePath ? {
                    url: report.filePath,
                    pages: 1,
                    sizeKB: Math.round((report.sizeBytes || 0) / 1024)
                } : undefined,
                meta: undefined // No hay campo meta en Report
            }));

            res.json({
                success: true,
                data: {
                    reports: reportDTOs,
                    total,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });

        } catch (error) {
            logger.error('Error obteniendo historial de reportes', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener reporte específico
    getReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            const report = await prisma.report.findFirst({
                where: { id, organizationId: orgId }
            });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: 'Reporte no encontrado'
                });
            }

            const reportDTO: ReportJobDTO = {
                id: report.id,
                orgId: report.organizationId,
                createdBy: report.requestedById,
                createdAt: report.createdAt.toISOString(),
                scheduledAt: undefined,
                status: report.status.toLowerCase() as any,
                input: JSON.parse(report.params as string),
                output: report.filePath ? {
                    url: report.filePath,
                    pages: 1,
                    sizeKB: Math.round((report.sizeBytes || 0) / 1024)
                } : undefined,
                meta: undefined
            };

            res.json({
                success: true,
                data: reportDTO
            });

        } catch (error) {
            logger.error('Error obteniendo reporte', { error, id: req.params.id, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Descargar reporte
    downloadReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            const report = await prisma.report.findFirst({
                where: { id, organizationId: orgId, status: 'READY' }
            });

            if (!report || !report.filePath) {
                return res.status(404).json({
                    success: false,
                    error: 'Reporte no encontrado o no completado'
                });
            }

            const filePath = path.join(process.cwd(), 'reports', report.filePath);

            // Verificar que el archivo existe
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    error: 'Archivo de reporte no encontrado'
                });
            }

            // Enviar archivo
            res.download(filePath, `reporte-${id}.pdf`);

        } catch (error) {
            logger.error('Error descargando reporte', { error, id: req.params.id, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Cancelar reporte
    cancelReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            const report = await prisma.report.findFirst({
                where: { id, organizationId: orgId, status: { in: ['PENDING'] } }
            });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: 'Reporte no encontrado o no cancelable'
                });
            }

            // Actualizar estado
            await prisma.report.update({
                where: { id },
                data: { status: 'FAILED' } // No hay estado cancelled, usamos FAILED
            });

            // TODO: Cancelar job en BullMQ si está en cola

            res.json({
                success: true,
                data: { id, status: 'cancelled' }
            });

        } catch (error) {
            logger.error('Error cancelando reporte', { error, id: req.params.id, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener plantillas disponibles
    getTemplates = async (req: Request, res: Response) => {
        try {
            const { module } = req.query;
            const orgId = req.orgId!;

            // Plantillas predefinidas
            const templates: ReportTemplate[] = [
                {
                    id: 'telemetry-basic',
                    name: 'Reporte Básico de Telemetría',
                    module: 'telemetry',
                    description: 'Resumen de sesión con ruta y eventos',
                    fields: ['sessionId', 'includePoints', 'includeEvents'],
                    defaultOptions: {
                        includePoints: true,
                        includeEvents: true,
                        includeHeatmap: false
                    }
                },
                {
                    id: 'telemetry-executive',
                    name: 'Reporte Ejecutivo de Telemetría',
                    module: 'telemetry',
                    description: 'Análisis ejecutivo con KPIs y recomendaciones',
                    fields: ['sessionId', 'dateRange', 'includeKPIs', 'includeAI'],
                    defaultOptions: {
                        includeKPIs: true,
                        includeAI: true,
                        includeHeatmap: true
                    }
                },
                {
                    id: 'stability-basic',
                    name: 'Reporte Básico de Estabilidad',
                    module: 'stability',
                    description: 'Análisis de estabilidad con métricas',
                    fields: ['sessionId', 'includeMetrics', 'includeEvents'],
                    defaultOptions: {
                        includeMetrics: true,
                        includeEvents: true
                    }
                },
                {
                    id: 'panel-overview',
                    name: 'Resumen del Panel',
                    module: 'panel',
                    description: 'KPIs y estadísticas del panel',
                    fields: ['dateRange', 'includeKPIs', 'includeHeatmap'],
                    defaultOptions: {
                        includeKPIs: true,
                        includeHeatmap: true
                    }
                },
                {
                    id: 'comparative-multi-org',
                    name: 'Comparativo Multi-Organización',
                    module: 'comparative',
                    description: 'Comparación entre organizaciones',
                    fields: ['orgIds', 'dateRange', 'metrics'],
                    defaultOptions: {
                        metrics: ['km', 'events', 'efficiency']
                    }
                }
            ];

            // Filtrar por módulo si se especifica
            const filteredTemplates = module
                ? templates.filter(t => t.module === module)
                : templates;

            res.json({
                success: true,
                data: filteredTemplates
            });

        } catch (error) {
            logger.error('Error obteniendo plantillas', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener plantilla específica
    getTemplate = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            // Buscar plantilla por ID
            const templates: ReportTemplate[] = [
                {
                    id: 'telemetry-basic',
                    name: 'Reporte Básico de Telemetría',
                    module: 'telemetry',
                    description: 'Resumen de sesión con ruta y eventos',
                    fields: ['sessionId', 'includePoints', 'includeEvents'],
                    defaultOptions: {
                        includePoints: true,
                        includeEvents: true,
                        includeHeatmap: false
                    }
                },
                {
                    id: 'telemetry-executive',
                    name: 'Reporte Ejecutivo de Telemetría',
                    module: 'telemetry',
                    description: 'Análisis ejecutivo con KPIs y recomendaciones',
                    fields: ['sessionId', 'dateRange', 'includeKPIs', 'includeAI'],
                    defaultOptions: {
                        includeKPIs: true,
                        includeAI: true,
                        includeHeatmap: true
                    }
                },
                {
                    id: 'stability-basic',
                    name: 'Reporte Básico de Estabilidad',
                    module: 'stability',
                    description: 'Análisis de estabilidad con métricas',
                    fields: ['sessionId', 'includeMetrics', 'includeEvents'],
                    defaultOptions: {
                        includeMetrics: true,
                        includeEvents: true
                    }
                },
                {
                    id: 'panel-overview',
                    name: 'Resumen del Panel',
                    module: 'panel',
                    description: 'KPIs y estadísticas del panel',
                    fields: ['dateRange', 'includeKPIs', 'includeHeatmap'],
                    defaultOptions: {
                        includeKPIs: true,
                        includeHeatmap: true
                    }
                },
                {
                    id: 'comparative-multi-org',
                    name: 'Comparativo Multi-Organización',
                    module: 'comparative',
                    description: 'Comparación entre organizaciones',
                    fields: ['orgIds', 'dateRange', 'metrics'],
                    defaultOptions: {
                        metrics: ['km', 'events', 'efficiency']
                    }
                }
            ];

            const template = templates.find(t => t.id === id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Plantilla no encontrada'
                });
            }

            res.json({
                success: true,
                data: template
            });

        } catch (error) {
            logger.error('Error obteniendo plantilla', { error, id: req.params.id, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener estadísticas de reportes
    getReportStats = async (req: Request, res: Response) => {
        try {
            const { from, to } = req.query;
            const orgId = req.orgId!;

            // Construir filtros de fecha
            const where: any = { organizationId: orgId };
            if (from || to) {
                where.createdAt = {};
                if (from) where.createdAt.gte = new Date(from as string);
                if (to) where.createdAt.lte = new Date(to as string);
            }

            // Obtener estadísticas
            const [total, byStatus, byModule, recent] = await Promise.all([
                prisma.report.count({ where }),
                prisma.report.groupBy({
                    by: ['status'],
                    where,
                    _count: { status: true }
                }),
                prisma.report.groupBy({
                    by: ['params'],
                    where,
                    _count: { params: true }
                }),
                prisma.report.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: 5
                })
            ]);

            // Transformar estadísticas
            const stats = {
                total,
                byStatus: byStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {} as Record<string, number>),
                byModule: byModule.reduce((acc, item) => {
                    const params = JSON.parse(item.params as string);
                    const module = params.module || 'unknown';
                    acc[module] = (acc[module] || 0) + item._count.params;
                    return acc;
                }, {} as Record<string, number>),
                recent: recent.map(report => ({
                    id: report.id,
                    module: JSON.parse(report.params as string).module,
                    status: report.status,
                    createdAt: report.createdAt.toISOString()
                }))
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de reportes', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Procesar reporte de forma asíncrona
    private async processReportAsync(jobId: string, reportJob: ReportJobDTO) {
        try {
            logger.info('Iniciando procesamiento asíncrono de reporte', { jobId, module: reportJob.input.module });

            // Actualizar estado a procesando (no hay estado processing en ReportStatus)
            // await prisma.report.update({
            //     where: { id: jobId },
            //     data: { status: 'PROCESSING' }
            // });

            // Generar reporte PDF
            logger.info('Generando PDF del reporte', { jobId });
            const output = await this.generatePDF(reportJob);
            logger.info('PDF generado exitosamente', { jobId, output });

            // Actualizar con resultado
            await prisma.report.update({
                where: { id: jobId },
                data: {
                    status: 'READY',
                    filePath: output.url,
                    sizeBytes: output.sizeKB * 1024
                }
            });

            logger.info('Reporte generado exitosamente', { jobId, output });

        } catch (error) {
            logger.error('Error en procesamiento asíncrono', { error, jobId });

            // Actualizar con error
            await prisma.report.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED'
                }
            });

            logger.error('Error procesando reporte', { error, jobId });
        }
    }

    // Generar PDF usando Puppeteer
    private async generatePDF(reportJob: ReportJobDTO): Promise<ReportOutput> {
        const { module, template, params, options } = reportJob.input;

        logger.info('Iniciando generación de PDF', { module, template, jobId: reportJob.id });

        try {
            // Crear directorio de reportes si no existe
            const reportsDir = path.join(process.cwd(), 'reports');
            await fs.mkdir(reportsDir, { recursive: true });
            logger.info('Directorio de reportes creado', { reportsDir });

            // Generar HTML del reporte
            logger.info('Generando HTML del reporte', { module, template });
            const html = await this.generateReportHTML(module, template, params, options);
            logger.info('HTML generado exitosamente', { htmlLength: html.length });

            // Generar PDF
            logger.info('Iniciando Puppeteer');
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            logger.info('Browser lanzado exitosamente');

            const page = await browser.newPage();
            logger.info('Nueva página creada');

            await page.setContent(html, { waitUntil: 'networkidle0' });
            logger.info('Contenido HTML cargado en la página');

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                }
            });
            logger.info('PDF generado en buffer', { bufferSize: pdfBuffer.length });

            await browser.close();
            logger.info('Browser cerrado');

            // Guardar archivo
            const fileName = `reporte-${reportJob.id}.pdf`;
            const filePath = path.join(reportsDir, fileName);
            await fs.writeFile(filePath, pdfBuffer);
            logger.info('Archivo PDF guardado', { filePath });

            // Calcular tamaño
            const stats = await fs.stat(filePath);
            const sizeKB = Math.round(stats.size / 1024);

            const result = {
                url: fileName,
                pages: 1, // TODO: Calcular páginas reales
                sizeKB
            };

            logger.info('PDF generado exitosamente', { result });
            return result;

        } catch (error) {
            logger.error('Error en generación de PDF', { error, module, template, jobId: reportJob.id });
            throw error;
        }
    }

    // Generar reporte del dashboard (versión funcional)
    generateDashboardReport = async (req: Request, res: Response) => {
        try {
            console.log('📊 Generando reporte del dashboard...');
            const { filters, includeCharts = true, includeMaps = true } = req.body;

            // Datos de ejemplo
            const dashboardData = {
                organization: { name: 'Bomberos Madrid' },
                kpis: {
                    hoursDriving: '45:30',
                    km: 1250.5,
                    timeInPark: '120:45',
                    timeOutPark: '180:15',
                    timeInWorkshop: '15:30',
                    rotativoPct: 85.2,
                    incidents: { total: 12, leve: 8, moderada: 3, grave: 1 },
                    speeding: { on: { count: 5, duration: '02:30' }, off: { count: 3, duration: '01:45' } },
                    clave: { "2": '45:20', "5": '120:15' }
                },
                vehicles: [
                    { id: 'DOBACK001', name: 'Bomba Escalera 001', status: 'active', hoursActive: '08:30', km: 125.5, events: 2, lastUpdate: '2024-01-15 14:30' },
                    { id: 'DOBACK002', name: 'Bomba Escalera 002', status: 'maintenance', hoursActive: '06:15', km: 98.2, events: 0, lastUpdate: '2024-01-15 12:15' },
                    { id: 'DOBACK003', name: 'Bomba Escalera 003', status: 'active', hoursActive: '10:45', km: 156.8, events: 3, lastUpdate: '2024-01-15 15:45' }
                ]
            };

            // Formatear fecha actual
            const now = new Date();
            const reportDate = now.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // HTML del reporte
            const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Ejecutivo - Dashboard DobackSoft</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .footer { background: #1e293b; color: white; padding: 20px; text-align: center; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f8fafc; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte Ejecutivo</h1>
        <p>Dashboard DobackSoft - Análisis Integral</p>
    </div>
    
    <div class="content">
        <p><strong>Generado:</strong> ${reportDate}</p>
        <p><strong>Período:</strong> ${filters?.timePreset || 'Día actual'}</p>
        <p><strong>Alcance:</strong> ${filters?.scope || 'Todos los vehículos'}</p>
        <p><strong>Organización:</strong> ${dashboardData.organization?.name || 'DobackSoft'}</p>
        
        <h2>📊 Indicadores Clave de Rendimiento</h2>
        <div class="kpi">
            <h3>Horas de Conducción</h3>
            <p>${dashboardData.kpis?.hoursDriving || 'N/A'}</p>
        </div>
        <div class="kpi">
            <h3>Kilómetros Recorridos</h3>
            <p>${dashboardData.kpis?.km || 'N/A'} km</p>
        </div>
        <div class="kpi">
            <h3>Tiempo con Rotativo</h3>
            <p>${dashboardData.kpis?.rotativoPct || 'N/A'}%</p>
        </div>
        <div class="kpi">
            <h3>Total de Incidencias</h3>
            <p>${dashboardData.kpis?.incidents?.total || 'N/A'}</p>
        </div>
        
        <h2>🚛 Estado de Vehículos</h2>
        <table>
            <tr>
                <th>Vehículo</th>
                <th>Estado</th>
                <th>Tiempo Activo</th>
                <th>Km Recorridos</th>
                <th>Eventos</th>
            </tr>
            ${(dashboardData.vehicles || []).map(vehicle => `
                <tr>
                    <td>${vehicle.name}</td>
                    <td>${vehicle.status}</td>
                    <td>${vehicle.hoursActive}</td>
                    <td>${vehicle.km} km</td>
                    <td>${vehicle.events}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    
    <div class="footer">
        <p><strong>DobackSoft</strong></p>
        <p>Reporte generado automáticamente el ${reportDate}</p>
        <p>Sistema de Gestión de Flotas - StabilSafe V3</p>
    </div>
</body>
</html>`;

            // Crear directorio de reportes si no existe
            const reportsDir = path.join(process.cwd(), 'reports');
            await fs.mkdir(reportsDir, { recursive: true });

            // Guardar HTML
            const fileName = `reporte-dashboard-${Date.now()}.html`;
            const filePath = path.join(reportsDir, fileName);
            await fs.writeFile(filePath, html);

            console.log('✅ Reporte HTML generado exitosamente:', filePath);

            res.json({
                success: true,
                data: {
                    id: `report-${Date.now()}`,
                    fileName,
                    filePath,
                    message: 'Reporte generado exitosamente'
                }
            });

        } catch (error) {
            console.error('❌ Error generando reporte del dashboard:', error);
            res.status(500).json({
                success: false,
                error: `Error interno del servidor: ${error.message}`
            });
        }
    };

    // Generar HTML específico para reportes del dashboard (versión simplificada)
    private async generateDashboardReportHTML(params: any, options: any): Promise<string> {
        logger.info('Iniciando generación de HTML del dashboard', { params });

        try {
            const { filters, includeCharts = true, includeMaps = true } = params;

            // Obtener datos del dashboard
            logger.info('Obteniendo datos del dashboard', { filters });
            const dashboardData = await this.getDashboardDataForReport(filters);
            logger.info('Datos del dashboard obtenidos', { dashboardData });

            // Formatear fecha actual
            const now = new Date();
            const reportDate = now.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            logger.info('Generando HTML del reporte', { reportDate });

            // HTML simplificado para evitar errores
            const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Ejecutivo - Dashboard DobackSoft</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .footer { background: #1e293b; color: white; padding: 20px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte Ejecutivo</h1>
        <p>Dashboard DobackSoft - Análisis Integral</p>
    </div>
    
    <div class="content">
        <p><strong>Generado:</strong> ${reportDate}</p>
        <p><strong>Período:</strong> ${filters?.timePreset || 'Día actual'}</p>
        <p><strong>Alcance:</strong> ${filters?.scope || 'Todos los vehículos'}</p>
        <p><strong>Organización:</strong> ${dashboardData.organization?.name || 'DobackSoft'}</p>
        
        <h2>📊 Indicadores Clave de Rendimiento</h2>
        <div class="kpi">
            <h3>Horas de Conducción</h3>
            <p>${dashboardData.kpis?.hoursDriving || 'N/A'}</p>
        </div>
        <div class="kpi">
            <h3>Kilómetros Recorridos</h3>
            <p>${dashboardData.kpis?.km || 'N/A'} km</p>
        </div>
        <div class="kpi">
            <h3>Tiempo con Rotativo</h3>
            <p>${dashboardData.kpis?.rotativoPct || 'N/A'}%</p>
        </div>
        <div class="kpi">
            <h3>Total de Incidencias</h3>
            <p>${dashboardData.kpis?.incidents?.total || 'N/A'}</p>
        </div>
        
        <h2>🚛 Estado de Vehículos</h2>
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f8fafc;">
                <th style="padding: 10px;">Vehículo</th>
                <th style="padding: 10px;">Estado</th>
                <th style="padding: 10px;">Tiempo Activo</th>
                <th style="padding: 10px;">Km Recorridos</th>
                <th style="padding: 10px;">Eventos</th>
            </tr>
            ${(dashboardData.vehicles || []).map(vehicle => `
                <tr>
                    <td style="padding: 10px;">${vehicle.name}</td>
                    <td style="padding: 10px;">${vehicle.status}</td>
                    <td style="padding: 10px;">${vehicle.hoursActive}</td>
                    <td style="padding: 10px;">${vehicle.km} km</td>
                    <td style="padding: 10px;">${vehicle.events}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    
    <div class="footer">
        <p><strong>DobackSoft</strong></p>
        <p>Reporte generado automáticamente el ${reportDate}</p>
        <p>Sistema de Gestión de Flotas - StabilSafe V3</p>
    </div>
</body>
</html>`;

            logger.info('HTML del dashboard generado exitosamente', { htmlLength: html.length });
            return html;

        } catch (error) {
            logger.error('Error generando HTML del dashboard', { error, params });
            throw error;
        }
    }

    // Obtener datos del dashboard para el reporte
    private async getDashboardDataForReport(filters: any) {
        // Aquí se obtendrían los datos reales del dashboard
        // Por ahora retornamos datos de ejemplo
        return {
            organization: { name: 'Bomberos Madrid' },
            kpis: {
                hoursDriving: '45:30',
                km: 1250.5,
                timeInPark: '120:45',
                timeOutPark: '180:15',
                timeInWorkshop: '15:30',
                rotativoPct: 85.2,
                incidents: { total: 12, leve: 8, moderada: 3, grave: 1 },
                speeding: { on: { count: 5, duration: '02:30' }, off: { count: 3, duration: '01:45' } },
                clave: { "2": '45:20', "5": '120:15' }
            },
            vehicles: [
                { id: 'DOBACK001', name: 'Bomba Escalera 001', status: 'active', hoursActive: '08:30', km: 125.5, events: 2, lastUpdate: '2024-01-15 14:30' },
                { id: 'DOBACK002', name: 'Bomba Escalera 002', status: 'maintenance', hoursActive: '06:15', km: 98.2, events: 0, lastUpdate: '2024-01-15 12:15' },
                { id: 'DOBACK003', name: 'Bomba Escalera 003', status: 'active', hoursActive: '10:45', km: 156.8, events: 3, lastUpdate: '2024-01-15 15:45' }
            ]
        };
    }


    // Generar HTML del reporte
    private async generateReportHTML(module: string, template: string, params: any, options: any): Promise<string> {
        // Si es reporte del dashboard, usar plantilla específica
        if (module === 'dashboard' && template === 'executive_dashboard') {
            return this.generateDashboardReportHTML(params, options);
        }

        // HTML base del reporte
        const baseHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reporte - ${template}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { max-width: 200px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; color: #333; }
                    .subtitle { font-size: 16px; color: #666; margin-top: 10px; }
                    .section { margin-bottom: 30px; }
                    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                    .kpi-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
                    .kpi-value { font-size: 24px; font-weight: bold; color: #2196F3; }
                    .kpi-label { font-size: 14px; color: #666; margin-top: 5px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f2f2f2; font-weight: bold; }
                    .ai-block { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; }
                    .ai-title { font-weight: bold; color: #1976d2; margin-bottom: 10px; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">[LOGO DOBACK SOFT]</div>
                    <div class="title">Reporte de ${module}</div>
                    <div class="subtitle">Generado el ${new Date().toLocaleDateString()}</div>
                </div>
        `;

        // Contenido específico del módulo
        let content = '';

        switch (module) {
            case 'telemetry':
                content = await this.generateTelemetryContent(template, params, options);
                break;
            case 'stability':
                content = await this.generateStabilityContent(template, params, options);
                break;
            case 'panel':
                content = await this.generatePanelContent(template, params, options);
                break;
            case 'comparative':
                content = await this.generateComparativeContent(template, params, options);
                break;
            default:
                content = '<div class="section"><p>Módulo no soportado</p></div>';
        }

        // Bloque de IA si está habilitado
        let aiBlock = '';
        if (options.includeAI) {
            aiBlock = `
                <div class="ai-block">
                    <div class="ai-title">Análisis con IA</div>
                    <p>Los datos muestran patrones interesantes en el comportamiento del vehículo. 
                    Se recomienda revisar las áreas con mayor concentración de eventos críticos 
                    y considerar ajustes en las rutas para optimizar la eficiencia.</p>
                </div>
            `;
        }

        const footer = `
                <div class="footer">
                    <p>Reporte generado por Doback Soft - ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        return baseHTML + content + aiBlock + footer;
    }

    // Generar contenido para telemetría
    private async generateTelemetryContent(template: string, params: any, options: any): Promise<string> {
        let content = '<div class="section">';

        // Obtener datos reales de la base de datos
        const { from, to, vehicleId, sessionId } = params;

        // Construir filtros para la consulta
        const where: any = {};
        if (from && to) {
            where.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }
        if (vehicleId) {
            where.vehicleId = vehicleId;
        }
        if (sessionId) {
            where.id = sessionId;
        }

        // Obtener sesiones con datos reales
        const sessions = await prisma.session.findMany({
            where,
            include: {
                vehicle: true
            },
            orderBy: { startTime: 'desc' },
            take: 100 // Limitar para rendimiento
        });

        // Calcular estadísticas reales
        const totalKm = sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
        const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const avgSpeed = totalDuration > 0 ? (totalKm / (totalDuration / 3600)) : 0;

        if (template === 'telemetry-executive') {
            content += `
                <div class="section-title">Resumen Ejecutivo</div>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-value">${totalKm.toFixed(1)}</div>
                        <div class="kpi-label">Kilómetros Recorridos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${sessions.length}</div>
                        <div class="kpi-label">Sesiones</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${avgSpeed.toFixed(1)}</div>
                        <div class="kpi-label">Velocidad Promedio (km/h)</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${(totalDuration / 3600).toFixed(1)}</div>
                        <div class="kpi-label">Horas Totales</div>
                    </div>
                </div>
            `;
        }

        // Tabla de sesiones detalladas
        if (options.includeEvents && sessions.length > 0) {
            content += `
                <div class="section-title">Detalle de Sesiones</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehículo</th>
                            <th>Inicio</th>
                            <th>Duración</th>
                            <th>Distancia</th>
                            <th>Velocidad Prom.</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            sessions.slice(0, 20).forEach(session => {
                const duration = session.duration ? (session.duration / 3600).toFixed(1) : '0';
                const distance = session.distance ? session.distance.toFixed(1) : '0';
                const speed = session.duration && session.distance ?
                    (session.distance / (session.duration / 3600)).toFixed(1) : '0';

                content += `
                    <tr>
                        <td>${session.vehicle?.licensePlate || 'N/A'}</td>
                        <td>${new Date(session.startTime).toLocaleString('es-ES')}</td>
                        <td>${duration} h</td>
                        <td>${distance} km</td>
                        <td>${speed} km/h</td>
                    </tr>
                `;
            });

            content += `
                    </tbody>
                </table>
            `;
        }

        content += '</div>';
        return content;
    }

    // Generar contenido para estabilidad
    private async generateStabilityContent(template: string, params: any, options: any): Promise<string> {
        // Obtener datos reales de estabilidad
        const { from, to, vehicleId, sessionId } = params;

        // Construir filtros para la consulta
        const where: any = {};
        if (from && to) {
            where.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }
        if (vehicleId) {
            where.vehicleId = vehicleId;
        }
        if (sessionId) {
            where.id = sessionId;
        }

        // Obtener sesiones con datos de estabilidad
        const sessions = await prisma.session.findMany({
            where,
            include: {
                vehicle: true,
                stabilityMeasurements: true
            },
            orderBy: { startTime: 'desc' },
            take: 50
        });

        // Calcular estadísticas de estabilidad
        const totalSessions = sessions.length;
        const sessionsWithStability = sessions.filter(s => s.stabilityMeasurements && s.stabilityMeasurements.length > 0);
        const totalMeasurements = sessions.reduce((sum, s) => sum + (s.stabilityMeasurements?.length || 0), 0);

        // Calcular métricas promedio de estabilidad
        let avgLTR = 0, avgSSF = 0, avgDRS = 0;
        if (sessionsWithStability.length > 0) {
            const stabilityData = sessionsWithStability.flatMap(s => s.stabilityMeasurements || []);
            if (stabilityData.length > 0) {
                avgLTR = stabilityData.reduce((sum, m) => sum + (m.ltr || 0), 0) / stabilityData.length;
                avgSSF = stabilityData.reduce((sum, m) => sum + (m.ssf || 0), 0) / stabilityData.length;
                avgDRS = stabilityData.reduce((sum, m) => sum + (m.drs || 0), 0) / stabilityData.length;
            }
        }

        return `
            <div class="section">
                <div class="section-title">Análisis de Estabilidad</div>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-value">${totalSessions}</div>
                        <div class="kpi-label">Sesiones Analizadas</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${totalMeasurements}</div>
                        <div class="kpi-label">Mediciones Totales</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${avgLTR.toFixed(2)}</div>
                        <div class="kpi-label">LTR Promedio</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${avgSSF.toFixed(2)}</div>
                        <div class="kpi-label">SSF Promedio</div>
                    </div>
                </div>
                
                ${sessionsWithStability.length > 0 ? `
                <div class="section-title">Sesiones con Datos de Estabilidad</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehículo</th>
                            <th>Fecha</th>
                            <th>Mediciones</th>
                            <th>LTR Prom.</th>
                            <th>SSF Prom.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessionsWithStability.slice(0, 10).map(session => {
            const measurements = session.stabilityMeasurements || [];
            const avgSessionLTR = measurements.length > 0 ?
                measurements.reduce((sum, m) => sum + (m.ltr || 0), 0) / measurements.length : 0;
            const avgSessionSSF = measurements.length > 0 ?
                measurements.reduce((sum, m) => sum + (m.ssf || 0), 0) / measurements.length : 0;

            return `
                                <tr>
                                    <td>${session.vehicle?.licensePlate || 'N/A'}</td>
                                    <td>${new Date(session.startTime).toLocaleDateString('es-ES')}</td>
                                    <td>${measurements.length}</td>
                                    <td>${avgSessionLTR.toFixed(2)}</td>
                                    <td>${avgSessionSSF.toFixed(2)}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
                ` : '<p>No se encontraron datos de estabilidad para el período seleccionado.</p>'}
            </div>
        `;
    }

    // Generar contenido para panel
    private async generatePanelContent(template: string, params: any, options: any): Promise<string> {
        // Obtener datos reales del panel
        const { from, to, organizationId } = params;

        // Construir filtros para la consulta
        const where: any = {};
        if (from && to) {
            where.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }
        if (organizationId) {
            where.organizationId = organizationId;
        }

        // Obtener estadísticas generales
        const [sessions, vehicles, totalSessions, totalKm] = await Promise.all([
            prisma.session.findMany({
                where,
                include: {
                    vehicle: true
                },
                orderBy: { startTime: 'desc' },
                take: 50
            }),
            prisma.vehicle.findMany({
                where: organizationId ? { organizationId } : {},
                take: 100
            }),
            prisma.session.count({ where }),
            prisma.session.aggregate({
                where,
                _sum: { distance: true }
            })
        ]);

        // Calcular estadísticas
        const activeVehicles = new Set(sessions.map(s => s.vehicleId)).size;
        const totalVehicles = vehicles.length;
        const totalDistance = totalKm._sum.distance || 0;
        const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)) : 0;

        return `
            <div class="section">
                <div class="section-title">Resumen del Panel</div>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-value">${activeVehicles}</div>
                        <div class="kpi-label">Vehículos Activos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${totalVehicles}</div>
                        <div class="kpi-label">Total Vehículos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${totalDistance.toFixed(1)}</div>
                        <div class="kpi-label">KM Totales</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${totalSessions}</div>
                        <div class="kpi-label">Sesiones</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${(totalDuration / 3600).toFixed(1)}</div>
                        <div class="kpi-label">Horas Totales</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${avgSpeed.toFixed(1)}</div>
                        <div class="kpi-label">Vel. Promedio (km/h)</div>
                    </div>
                </div>
                
                ${sessions.length > 0 ? `
                <div class="section-title">Actividad Reciente</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehículo</th>
                            <th>Inicio</th>
                            <th>Duración</th>
                            <th>Distancia</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions.slice(0, 15).map(session => {
            const duration = session.duration ? (session.duration / 3600).toFixed(1) : '0';
            const distance = session.distance ? session.distance.toFixed(1) : '0';
            const status = session.endTime ? 'Completada' : 'En curso';

            return `
                                <tr>
                                    <td>${session.vehicle?.licensePlate || 'N/A'}</td>
                                    <td>${new Date(session.startTime).toLocaleString('es-ES')}</td>
                                    <td>${duration} h</td>
                                    <td>${distance} km</td>
                                    <td>${status}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
                ` : '<p>No se encontraron sesiones para el período seleccionado.</p>'}
            </div>
        `;
    }

    // Generar contenido comparativo
    private async generateComparativeContent(template: string, params: any, options: any): Promise<string> {
        // Obtener datos comparativos de organizaciones
        const { from, to, compareOrgIds } = params;

        if (!compareOrgIds || compareOrgIds.length < 2) {
            return `
                <div class="section">
                    <div class="section-title">Comparación Multi-Organización</div>
                    <p>Se requieren al menos 2 organizaciones para realizar la comparación.</p>
                </div>
            `;
        }

        // Construir filtros de fecha
        const dateFilter: any = {};
        if (from && to) {
            dateFilter.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        // Obtener datos de cada organización
        const orgData = await Promise.all(
            compareOrgIds.map(async (orgId: string) => {
                const [sessions, vehicles] = await Promise.all([
                    prisma.session.findMany({
                        where: {
                            ...dateFilter,
                            organizationId: orgId
                        },
                        include: { vehicle: true }
                    }),
                    prisma.vehicle.findMany({
                        where: { organizationId: orgId }
                    })
                ]);

                const totalKm = sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
                const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                const avgSpeed = totalDuration > 0 ? (totalKm / (totalDuration / 3600)) : 0;
                const activeVehicles = new Set(sessions.map(s => s.vehicleId)).size;

                return {
                    orgId,
                    sessions: sessions.length,
                    vehicles: vehicles.length,
                    activeVehicles,
                    totalKm,
                    totalDuration,
                    avgSpeed
                };
            })
        );

        // Obtener nombres de organizaciones
        const organizations = await prisma.organization.findMany({
            where: { id: { in: compareOrgIds } },
            select: { id: true, name: true }
        });

        const orgMap = organizations.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);

        return `
            <div class="section">
                <div class="section-title">Comparación Multi-Organización</div>
                <div class="kpi-grid">
                    ${orgData.map(data => `
                        <div class="kpi-card">
                            <div class="kpi-value">${orgMap[data.orgId] || data.orgId}</div>
                            <div class="kpi-label">Organización</div>
                        </div>
                    `).join('')}
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>Organización</th>
                            <th>Sesiones</th>
                            <th>Vehículos</th>
                            <th>Activos</th>
                            <th>KM Totales</th>
                            <th>Vel. Promedio</th>
                            <th>Horas Totales</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orgData.map(data => `
                            <tr>
                                <td>${orgMap[data.orgId] || data.orgId}</td>
                                <td>${data.sessions}</td>
                                <td>${data.vehicles}</td>
                                <td>${data.activeVehicles}</td>
                                <td>${data.totalKm.toFixed(1)} km</td>
                                <td>${data.avgSpeed.toFixed(1)} km/h</td>
                                <td>${(data.totalDuration / 3600).toFixed(1)} h</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Métodos específicos para Webfleet
    getWebfleetPreview = async (req: Request, res: Response) => {
        try {
            const { startDate, endDate, vehicleIds } = req.query;
            const orgId = req.orgId!;

            // Validar parámetros
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'startDate y endDate son requeridos'
                });
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            // Calcular duración en días
            const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            // Obtener sesiones del período
            const sessions = await prisma.session.findMany({
                where: {
                    organizationId: orgId,
                    startTime: {
                        gte: start,
                        lte: end
                    },
                    ...(vehicleIds && {
                        vehicleId: {
                            in: (vehicleIds as string).split(',')
                        }
                    })
                },
                include: {
                    vehicle: true
                }
            });

            // Agrupar por vehículo
            const vehicleStats = sessions.reduce((acc: any, session) => {
                const vehicleId = session.vehicleId;
                if (!acc[vehicleId]) {
                    acc[vehicleId] = {
                        id: vehicleId,
                        licensePlate: session.vehicle?.licensePlate || 'N/A',
                        model: session.vehicle?.model || 'N/A',
                        sessionsCount: 0
                    };
                }
                acc[vehicleId].sessionsCount++;
                return acc;
            }, {});

            const preview = {
                period: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    duration
                },
                summary: {
                    totalSessions: sessions.length,
                    vehiclesCount: Object.keys(vehicleStats).length,
                    vehicles: Object.values(vehicleStats)
                }
            };

            res.json({
                success: true,
                data: preview
            });

        } catch (error) {
            logger.error('Error obteniendo vista previa de Webfleet:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    generateWebfleetReport = async (req: Request, res: Response) => {
        try {
            const {
                startDate,
                endDate,
                vehicleIds,
                reportType,
                title,
                includeCriticalEvents,
                includeConsumptionAnalysis,
                fuelReferenceBase,
                minDistance,
                minDuration,
                includeGeocoding,
                eventTypesFilter,
                speedThreshold,
                consumptionThreshold
            } = req.body;

            const orgId = req.orgId!;
            const userId = req.user?.id!;

            // Validar parámetros requeridos
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'startDate y endDate son requeridos'
                });
            }

            const reportId = uuidv4();
            const fileName = `reporte_webfleet_${reportId}.pdf`;

            // Obtener datos para el reporte
            const start = new Date(startDate);
            const end = new Date(endDate);

            const sessions = await prisma.session.findMany({
                where: {
                    organizationId: orgId,
                    startTime: {
                        gte: start,
                        lte: end
                    },
                    ...(vehicleIds && vehicleIds.length > 0 && {
                        vehicleId: {
                            in: vehicleIds
                        }
                    }),
                    // Filtros de distancia y duración
                    ...(minDistance && {
                        distance: {
                            gte: minDistance
                        }
                    }),
                    ...(minDuration && {
                        duration: {
                            gte: minDuration * 60 // convertir minutos a segundos
                        }
                    })
                },
                include: {
                    vehicle: true
                },
                orderBy: {
                    startTime: 'desc'
                }
            });

            // Generar contenido del reporte
            const reportContent = await this.generateWebfleetContent({
                sessions,
                title: title || `Reporte Webfleet (${reportType})`,
                includeCriticalEvents,
                includeConsumptionAnalysis,
                fuelReferenceBase,
                includeGeocoding,
                speedThreshold,
                consumptionThreshold,
                startDate: start,
                endDate: end
            });

            // Generar PDF
            const pdfBuffer = await this.generateWebfleetPDF(reportContent, {
                title: title || 'Reporte Webfleet',
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            // Guardar archivo temporalmente
            const tempPath = path.join(process.cwd(), 'temp', fileName);
            await fs.mkdir(path.dirname(tempPath), { recursive: true });
            await fs.writeFile(tempPath, pdfBuffer);

            // Guardar metadatos en base de datos
            await prisma.report.create({
                data: {
                    id: reportId,
                    organizationId: orgId,
                    requestedById: userId,
                    status: 'READY',
                    filePath: fileName,
                    sizeBytes: pdfBuffer.length,
                    params: JSON.stringify({
                        type: 'webfleet',
                        startDate,
                        endDate,
                        vehicleIds,
                        reportType,
                        title,
                        includeCriticalEvents,
                        includeConsumptionAnalysis,
                        fuelReferenceBase
                    }),
                    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 días
                }
            });

            res.json({
                success: true,
                data: {
                    reportId,
                    fileName,
                    size: pdfBuffer.length,
                    sessionCount: sessions.length,
                    vehicleCount: new Set(sessions.map(s => s.vehicleId)).size
                }
            });

        } catch (error) {
            logger.error('Error generando reporte Webfleet:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando el reporte'
            });
        }
    };

    downloadWebfleetReport = async (req: Request, res: Response) => {
        try {
            const { reportId } = req.params;
            const orgId = req.orgId!;

            // Buscar el reporte en la base de datos
            const report = await prisma.report.findFirst({
                where: {
                    id: reportId,
                    organizationId: orgId,
                    status: 'READY'
                }
            });

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: 'Reporte no encontrado'
                });
            }

            const filePath = path.join(process.cwd(), 'temp', report.filePath || '');

            // Verificar que el archivo existe
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    error: 'Archivo no encontrado'
                });
            }

            // Leer y enviar el archivo
            const fileBuffer = await fs.readFile(filePath);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${report.filePath}"`);
            res.setHeader('Content-Length', fileBuffer.length);

            res.send(fileBuffer);

        } catch (error) {
            logger.error('Error descargando reporte Webfleet:', error);
            res.status(500).json({
                success: false,
                error: 'Error descargando el reporte'
            });
        }
    };

    // Generar contenido específico para Webfleet
    private async generateWebfleetContent(params: any): Promise<string> {
        const {
            sessions,
            title,
            includeCriticalEvents,
            includeConsumptionAnalysis,
            fuelReferenceBase,
            includeGeocoding,
            speedThreshold,
            consumptionThreshold,
            startDate,
            endDate
        } = params;

        let content = `
            <div class="report-header">
                <h1>${title}</h1>
                <div class="report-meta">
                    <p><strong>Período:</strong> ${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}</p>
                    <p><strong>Total de sesiones:</strong> ${sessions.length}</p>
                    <p><strong>Vehículos:</strong> ${new Set(sessions.map(s => s.vehicleId)).size}</p>
                </div>
            </div>
        `;

        // Resumen ejecutivo
        content += `
            <div class="section">
                <h2>Resumen Ejecutivo</h2>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-value">${sessions.length}</div>
                        <div class="kpi-label">Sesiones Totales</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${new Set(sessions.map((s: any) => s.vehicleId)).size}</div>
                        <div class="kpi-label">Vehículos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${sessions.reduce((sum: number, s: any) => sum + (s.distance || 0), 0).toFixed(1)} km</div>
                        <div class="kpi-label">Distancia Total</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-value">${sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 3600} h</div>
                        <div class="kpi-label">Tiempo Total</div>
                    </div>
                </div>
            </div>
        `;

        // Análisis por vehículo
        const vehicleStats = sessions.reduce((acc: any, session: any) => {
            const vehicleId = session.vehicleId;
            if (!acc[vehicleId]) {
                acc[vehicleId] = {
                    vehicle: session.vehicle,
                    sessions: [],
                    totalDistance: 0,
                    totalDuration: 0,
                    events: []
                };
            }
            acc[vehicleId].sessions.push(session);
            acc[vehicleId].totalDistance += session.distance || 0;
            acc[vehicleId].totalDuration += session.duration || 0;
            // acc[vehicleId].events.push(...(session.events || []));
            return acc;
        }, {});

        content += `
            <div class="section">
                <h2>Análisis por Vehículo</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Vehículo</th>
                            <th>Sesiones</th>
                            <th>Distancia (km)</th>
                            <th>Tiempo (h)</th>
                            <th>Eventos</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.values(vehicleStats).forEach((stats: any) => {
            content += `
                <tr>
                    <td>${stats.vehicle?.licensePlate || 'N/A'} - ${stats.vehicle?.model || 'N/A'}</td>
                    <td>${stats.sessions.length}</td>
                    <td>${stats.totalDistance.toFixed(1)}</td>
                    <td>${(stats.totalDuration / 3600).toFixed(1)}</td>
                    <td>0</td>
                </tr>
            `;
        });

        content += `
                    </tbody>
                </table>
            </div>
        `;

        // Eventos críticos si están incluidos
        if (includeCriticalEvents) {
            // const allEvents = sessions.flatMap((s: any) => s.events || []);
            // const criticalEvents = allEvents.filter((e: any) =>
            //     ['speed_violation', 'harsh_braking', 'harsh_acceleration', 'critical_instability'].includes(e.type)
            // );
            const criticalEvents: any[] = [];

            if (criticalEvents.length > 0) {
                content += `
                    <div class="section">
                        <h2>Eventos Críticos Detectados</h2>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha/Hora</th>
                                    <th>Vehículo</th>
                                    <th>Tipo</th>
                                    <th>Ubicación</th>
                                    <th>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                criticalEvents.slice(0, 50).forEach((event: any) => {
                    const session = sessions.find((s: any) => s.id === event.sessionId);
                    content += `
                        <tr>
                            <td>${new Date(event.timestamp).toLocaleString('es-ES')}</td>
                            <td>${session?.vehicle?.licensePlate || 'N/A'}</td>
                            <td>${event.type}</td>
                            <td>${event.latitude ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` : 'N/A'}</td>
                            <td>${JSON.stringify(event.data || {})}</td>
                        </tr>
                    `;
                });

                content += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        // Análisis de consumo si está incluido
        if (includeConsumptionAnalysis && fuelReferenceBase) {
            content += `
                <div class="section">
                    <h2>Análisis de Consumo de Combustible</h2>
                    <p><strong>Consumo de referencia:</strong> ${fuelReferenceBase} l/100km</p>
                    <div class="note">
                        <p>Nota: Este análisis se basa en el consumo de referencia proporcionado y las distancias recorridas.</p>
                    </div>
                </div>
            `;
        }

        return content;
    }

    // Generar PDF específico para Webfleet
    private async generateWebfleetPDF(content: string, options: any): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${options.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { max-width: 200px; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; color: #333; }
                    .subtitle { font-size: 16px; color: #666; margin-top: 10px; }
                    .section { margin-bottom: 30px; }
                    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                    .kpi-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
                    .kpi-value { font-size: 24px; font-weight: bold; color: #2196F3; }
                    .kpi-label { font-size: 14px; color: #666; margin-top: 5px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f2f2f2; font-weight: bold; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                ${content}
                <div class="footer">
                    <p>Reporte generado por Doback Soft - ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: options.format || 'A4',
            printBackground: true,
            margin: options.margin || {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    }
}
