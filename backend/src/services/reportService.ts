import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ReportService {
    /**
     * Genera un reporte PDF de estabilidad
     */
    static async generateStabilityReport(params: {
        sessionIds?: string[];
        vehicleIds?: string[];
        dateRange?: { from: string; to: string };
        includeCharts?: boolean;
        includeMaps?: boolean;
        organizationId: string;
    }): Promise<{ reportId: string; downloadUrl: string; filename: string; size: number }> {
        try {
            logger.info('Generando reporte de estabilidad', params);

            // Obtener datos de sesiones
            const sessions = await this.getStabilitySessions(params);
            
            // Generar HTML del reporte
            const html = this.generateStabilityReportHTML(sessions, params);
            
            // Convertir HTML a PDF
            const pdfBuffer = await this.htmlToPdf(html);
            
            // Generar ID único para el reporte
            const reportId = `stability-${Date.now()}`;
            const filename = `reporte_estabilidad_${new Date().toISOString().split('T')[0]}.pdf`;
            
            // En un entorno real, guardarías el PDF en S3 o sistema de archivos
            // Por ahora, simulamos el tamaño
            const size = pdfBuffer.length;

            logger.info('Reporte de estabilidad generado exitosamente', { reportId, size });

            return {
                reportId,
                downloadUrl: `/api/reports/${reportId}/file`,
                filename,
                size
            };

        } catch (error) {
            logger.error('Error generando reporte de estabilidad', error);
            throw new Error('Error generando reporte de estabilidad');
        }
    }

    /**
     * Obtiene sesiones de estabilidad
     */
    private static async getStabilitySessions(params: any) {
        const where: any = { organizationId: params.organizationId };
        
        if (params.sessionIds?.length) {
            where.id = { in: params.sessionIds };
        }
        
        if (params.vehicleIds?.length) {
            where.vehicleId = { in: params.vehicleIds };
        }
        
        if (params.dateRange) {
            where.startTime = {
                gte: new Date(params.dateRange.from),
                lte: new Date(params.dateRange.to)
            };
        }

        return await prisma.session.findMany({
            where,
            include: {
                vehicle: true,
                user: true
            },
            orderBy: { startTime: 'desc' }
        });
    }

    /**
     * Genera HTML para reporte de estabilidad
     */
    private static generateStabilityReportHTML(sessions: any[], params: any): string {
        const currentDate = new Date().toLocaleDateString('es-ES');
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Estabilidad - DobackSoft</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                .title { font-size: 20px; margin: 10px 0; }
                .date { color: #666; }
                .section { margin: 20px 0; }
                .section h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .metric { display: inline-block; margin: 10px 20px 10px 0; }
                .metric-value { font-size: 18px; font-weight: bold; color: #2563eb; }
                .metric-label { font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">DobackSoft</div>
                <div class="title">Reporte de Estabilidad</div>
                <div class="date">Generado el ${currentDate}</div>
            </div>

            <div class="section">
                <h3>Resumen de Sesiones</h3>
                <p>Total de sesiones: ${sessions.length}</p>
                <p>Período: ${params.dateRange ? `${params.dateRange.from} - ${params.dateRange.to}` : 'Todos los períodos'}</p>
            </div>

            <div class="section">
                <h3>Métricas de Estabilidad</h3>
                <div class="metric">
                    <div class="metric-value">${sessions.length}</div>
                    <div class="metric-label">Sesiones Analizadas</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${sessions.filter(s => s.endTime).length}</div>
                    <div class="metric-label">Sesiones Completadas</div>
                </div>
            </div>

            <div class="section">
                <h3>Detalle de Sesiones</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Vehículo</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Fin</th>
                            <th>Duración</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions.map(session => `
                            <tr>
                                <td>${session.vehicle?.name || 'N/A'}</td>
                                <td>${new Date(session.startTime).toLocaleString('es-ES')}</td>
                                <td>${session.endTime ? new Date(session.endTime).toLocaleString('es-ES') : 'En curso'}</td>
                                <td>${session.endTime ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) + ' min' : 'N/A'}</td>
                                <td>${session.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <p style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
                    Reporte generado por DobackSoft - Sistema de Análisis de Estabilidad
                </p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Convierte HTML a PDF usando Puppeteer
     */
    private static async htmlToPdf(html: string): Promise<Buffer> {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
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
            
            return pdfBuffer;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}