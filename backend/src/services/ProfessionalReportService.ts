import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';
import { getStabilityEvents } from './StabilityEventService';

const prisma = new PrismaClient();

interface ReportConfig {
    sessionId: string;
    title?: string;
    includeClusterAnalysis: boolean;
    includeMaps: boolean;
    includeCharts: boolean;
    includeRecommendations: boolean;
    filters: {
        speedFilter?: 'all' | '40' | '60' | '80' | '100' | '120' | '140';
        rpmFilter?: 'all' | '1500' | '2000' | '2500';
        rotativoOnly?: boolean;
        selectedTypes?: string[];
        severityLevels?: ('critical' | 'danger' | 'moderate')[];
    };
}

interface ReportData {
    session: any;
    events: any[];
    clusters: any[];
    metrics: {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySeverity: Record<string, number>;
        averageSpeed: number;
        maxSpeed: number;
        avgStabilityIndex: number;
        sessionDuration: number;
        clusterReduction?: number;
    };
    recommendations: string[];
}

export class ProfessionalReportService {
    /**
     * Genera un reporte profesional en PDF
     */
    async generateProfessionalReport(
        config: ReportConfig
    ): Promise<{ filePath: string; size: number }> {
        try {
            logger.info('Iniciando generación de reporte profesional', {
                sessionId: config.sessionId,
                config
            });

            // 1. Recopilar datos
            const reportData = await this.gatherReportData(config);

            // 2. Generar PDF
            const { filePath, size } = await this.buildProfessionalPDF(reportData, config);

            logger.info('Reporte profesional generado exitosamente', {
                sessionId: config.sessionId,
                filePath,
                size,
                totalEvents: reportData.events.length,
                clusters: reportData.clusters.length
            });

            return { filePath, size };
        } catch (error) {
            logger.error('Error generando reporte profesional', {
                error,
                sessionId: config.sessionId
            });
            throw error;
        }
    }

    /**
     * Recopila todos los datos necesarios para el reporte
     */
    private async gatherReportData(config: ReportConfig): Promise<ReportData> {
        const { sessionId, filters } = config;

        // Obtener sesión
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                vehicle: true,
                gpsMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    select: { timestamp: true, latitude: true, longitude: true, speed: true }
                },
                stabilityMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    select: { timestamp: true, si: true }
                },
                canMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    select: { timestamp: true, engineRpm: true }
                }
            }
        });

        if (!session) {
            throw new Error(`Sesión ${sessionId} no encontrada`);
        }

        // Obtener eventos con filtros
        const events = await getStabilityEvents(sessionId, filters);

        // Calcular métricas
        const metrics = await this.calculateMetrics(session, events);

        // Generar recomendaciones
        const recommendations = this.generateRecommendations(events, metrics);

        return {
            session,
            events,
            clusters: [],
            metrics,
            recommendations
        };
    }

    /**
     * Calcula métricas del reporte
     */
    private async calculateMetrics(session: any, events: any[]) {
        // Métricas de eventos
        const eventsByType = events.reduce((acc, event) => {
            event.tipos.forEach((tipo: string) => {
                acc[tipo] = (acc[tipo] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>);

        const eventsBySeverity = events.reduce((acc, event) => {
            const severity = event.level || 'moderate';
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Métricas de velocidad
        const speeds = session.gpsMeasurements.map((gps: any) => gps.speed);
        const averageSpeed =
            speeds.length > 0
                ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length
                : 0;
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

        // Métricas de estabilidad
        const stabilityValues = session.stabilityMeasurements.map((s: any) => s.si);
        const avgStabilityIndex =
            stabilityValues.length > 0
                ? stabilityValues.reduce((a: number, b: number) => a + b, 0) /
                  stabilityValues.length
                : 0;

        // Duración de sesión
        const sessionDuration = session.endTime
            ? (session.endTime.getTime() - session.startTime.getTime()) / 1000
            : 0;

        return {
            totalEvents: events.length,
            eventsByType,
            eventsBySeverity,
            averageSpeed,
            maxSpeed,
            avgStabilityIndex,
            sessionDuration
        };
    }

    /**
     * Genera recomendaciones basadas en los datos
     */
    private generateRecommendations(events: any[], metrics: any): string[] {
        const recommendations: string[] = [];

        // Recomendaciones por velocidad
        if (metrics.maxSpeed > 120) {
            recommendations.push(
                'Se detectaron velocidades excesivas. Revisar políticas de velocidad máxima.'
            );
        }

        // Recomendaciones por eventos críticos
        const criticalEvents = metrics.eventsBySeverity.critical || 0;
        if (criticalEvents > 10) {
            recommendations.push(
                `${criticalEvents} eventos críticos detectados. Requiere atención inmediata.`
            );
        }

        // Recomendaciones por estabilidad
        if (metrics.avgStabilityIndex < 0.5) {
            recommendations.push(
                'Índice de estabilidad bajo. Revisar condiciones de la ruta y estilo de conducción.'
            );
        }

        if (recommendations.length === 0) {
            recommendations.push(
                'Sesión dentro de parámetros normales. Mantener estándares de conducción.'
            );
        }

        return recommendations;
    }

    /**
     * Construye el PDF profesional
     */
    private async buildProfessionalPDF(
        data: ReportData,
        config: ReportConfig
    ): Promise<{ filePath: string; size: number }> {
        const REPORTS_DIR = process.env.REPORTS_DIR || path.resolve('./reports');

        // Asegurar que el directorio existe
        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }

        const fileName = `professional-report-${data.session.id}-${Date.now()}.pdf`;
        const filePath = path.join(REPORTS_DIR, fileName);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: config.title || `Reporte de Sesión ${data.session.sessionNumber}`,
                        Author: 'Doback Soft - Sistema de Gestión de Flotas',
                        Subject: 'Análisis de Estabilidad y Eventos de Conducción',
                        CreationDate: new Date()
                    }
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Construir secciones del reporte
                this.buildCoverPage(doc, data, config);
                this.buildExecutiveSummary(doc, data);

                this.buildEventAnalysis(doc, data);
                this.buildRecommendations(doc, data);
                this.buildTechnicalAppendix(doc, data);

                doc.end();

                stream.on('finish', () => {
                    const stats = fs.statSync(filePath);
                    resolve({ filePath, size: stats.size });
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Construye la portada del reporte
     */
    private buildCoverPage(doc: PDFKit.PDFDocument, data: ReportData, config: ReportConfig) {
        // Header con logo
        doc.fontSize(24).fillColor('#2C3E50').text('DOBACK SOFT', 50, 80, { align: 'center' });

        doc.fontSize(16)
            .fillColor('#7F8C8D')
            .text('Sistema de Gestión de Flotas', 50, 110, { align: 'center' });

        // Línea decorativa
        doc.moveTo(50, 140).lineTo(545, 140).strokeColor('#3498DB').lineWidth(2).stroke();

        // Título principal
        doc.fontSize(28)
            .fillColor('#2C3E50')
            .text(config.title || 'REPORTE DE ANÁLISIS', 50, 200, { align: 'center' });

        doc.fontSize(18)
            .fillColor('#34495E')
            .text('Estabilidad y Eventos de Conducción', 50, 240, { align: 'center' });

        // Información de la sesión
        const sessionBox = {
            x: 150,
            y: 320,
            width: 295,
            height: 180
        };

        doc.rect(sessionBox.x, sessionBox.y, sessionBox.width, sessionBox.height)
            .strokeColor('#BDC3C7')
            .lineWidth(1)
            .stroke();

        doc.fontSize(14)
            .fillColor('#2C3E50')
            .text('INFORMACIÓN DE LA SESIÓN', sessionBox.x + 20, sessionBox.y + 20);

        doc.fontSize(12)
            .fillColor('#34495E')
            .text(
                `Vehículo: ${
                    data.session.vehicle?.licensePlate || data.session.vehicle?.name || 'N/A'
                }`,
                sessionBox.x + 20,
                sessionBox.y + 50
            )
            .text(
                `Inicio: ${data.session.startTime.toLocaleString('es-ES')}`,
                sessionBox.x + 20,
                sessionBox.y + 70
            )
            .text(
                `Duración: ${Math.round(data.metrics.sessionDuration / 60)} minutos`,
                sessionBox.x + 20,
                sessionBox.y + 90
            )
            .text(
                `Total eventos: ${data.metrics.totalEvents}`,
                sessionBox.x + 20,
                sessionBox.y + 110
            );

        // Fecha de generación
        doc.fontSize(10)
            .fillColor('#7F8C8D')
            .text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 50, 750, {
                align: 'center'
            });
    }

    /**
     * Construye el resumen ejecutivo
     */
    private buildExecutiveSummary(doc: PDFKit.PDFDocument, data: ReportData) {
        doc.addPage();

        doc.fontSize(20).fillColor('#2C3E50').text('RESUMEN EJECUTIVO', 50, 80);

        doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#3498DB').lineWidth(1).stroke();

        // Métricas clave en cajas
        const metrics = [
            {
                label: 'Velocidad Máxima',
                value: `${data.metrics.maxSpeed.toFixed(1)} km/h`,
                color: '#E74C3C'
            },
            {
                label: 'Velocidad Promedio',
                value: `${data.metrics.averageSpeed.toFixed(1)} km/h`,
                color: '#F39C12'
            },
            {
                label: 'Índice Estabilidad',
                value: `${(data.metrics.avgStabilityIndex * 100).toFixed(1)}%`,
                color: '#27AE60'
            },
            {
                label: 'Eventos Críticos',
                value: `${data.metrics.eventsBySeverity.critical || 0}`,
                color: '#E74C3C'
            }
        ];

        metrics.forEach((metric, index) => {
            const x = 50 + (index % 2) * 250;
            const y = 140 + Math.floor(index / 2) * 80;

            doc.rect(x, y, 200, 60)
                .fillColor(metric.color)
                .fillOpacity(0.1)
                .fill()
                .strokeColor(metric.color)
                .lineWidth(1)
                .stroke();

            doc.fillColor(metric.color)
                .fillOpacity(1)
                .fontSize(24)
                .text(metric.value, x + 10, y + 10, { width: 180, align: 'center' });

            doc.fillColor('#2C3E50')
                .fontSize(10)
                .text(metric.label, x + 10, y + 40, { width: 180, align: 'center' });
        });

        // Distribución por severidad
        doc.fillColor('#2C3E50')
            .fontSize(14)
            .text('Distribución de Eventos por Severidad', 50, 320);

        const severityY = 350;
        Object.entries(data.metrics.eventsBySeverity).forEach(([severity, count], index) => {
            const color =
                severity === 'critical' ? '#E74C3C' : severity === 'danger' ? '#F39C12' : '#27AE60';

            doc.fillColor(color)
                .fontSize(12)
                .text(`${severity.toUpperCase()}: ${count} eventos`, 70, severityY + index * 25);
        });
    }

    /**
     * Construye el análisis de eventos
     */
    private buildEventAnalysis(doc: PDFKit.PDFDocument, data: ReportData) {
        doc.addPage();

        doc.fontSize(20).fillColor('#2C3E50').text('ANÁLISIS DETALLADO DE EVENTOS', 50, 80);

        doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#3498DB').lineWidth(1).stroke();

        // Tabla de eventos por tipo
        doc.fontSize(14).fillColor('#2C3E50').text('Distribución por Tipo de Evento', 50, 130);

        const eventTypes = Object.entries(data.metrics.eventsByType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        let y = 160;
        eventTypes.forEach(([type, count]) => {
            const percentage = ((count / data.metrics.totalEvents) * 100).toFixed(1);

            doc.fontSize(11)
                .fillColor('#2C3E50')
                .text(type.replace(/_/g, ' ').toUpperCase(), 60, y, { width: 250 })
                .text(`${count} eventos (${percentage}%)`, 320, y, { width: 200 });

            y += 20;
        });

        // Eventos más recientes
        if (data.events.length > 0) {
            doc.fontSize(14)
                .fillColor('#2C3E50')
                .text('Últimos 10 Eventos Detectados', 50, y + 30);

            const recentEvents = data.events
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10);

            y += 60;
            recentEvents.forEach((event, index) => {
                if (y > 700) {
                    doc.addPage();
                    y = 80;
                }

                const timestamp = new Date(event.timestamp).toLocaleString('es-ES');
                const tipos = event.tipos.join(', ');

                doc.fontSize(9)
                    .fillColor('#34495E')
                    .text(`${index + 1}. ${timestamp} - ${tipos}`, 60, y)
                    .text(
                        `Coordenadas: ${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}`,
                        60,
                        y + 12
                    );

                y += 30;
            });
        }
    }

    /**
     * Construye las recomendaciones
     */
    private buildRecommendations(doc: PDFKit.PDFDocument, data: ReportData) {
        doc.addPage();

        doc.fontSize(20).fillColor('#2C3E50').text('RECOMENDACIONES', 50, 80);

        doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#3498DB').lineWidth(1).stroke();

        data.recommendations.forEach((recommendation, index) => {
            const y = 140 + index * 40;

            doc.fontSize(12)
                .fillColor('#E74C3C')
                .text(`${index + 1}.`, 60, y)
                .fillColor('#2C3E50')
                .text(recommendation, 80, y, { width: 465, align: 'justify' });
        });
    }

    /**
     * Construye el apéndice técnico
     */
    private buildTechnicalAppendix(doc: PDFKit.PDFDocument, data: ReportData) {
        doc.addPage();

        doc.fontSize(20).fillColor('#2C3E50').text('APÉNDICE TÉCNICO', 50, 80);

        doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#3498DB').lineWidth(1).stroke();

        // Parámetros de análisis
        doc.fontSize(14).fillColor('#2C3E50').text('Parámetros de Análisis', 50, 130);

        doc.fontSize(10)
            .fillColor('#34495E')
            .text('• Algoritmo de clustering: DBSCAN modificado', 60, 160)
            .text('• Radio espacial: 50 metros', 60, 175)
            .text('• Ventana temporal: 30 segundos', 60, 190)
            .text(
                '• Umbrales de estabilidad: Crítico <30%, Peligroso 30-60%, Moderado >60%',
                60,
                205
            )
            .text('• Límites de velocidad: Basados en normativa española', 60, 220);

        // Metadatos de sesión
        doc.fontSize(14).fillColor('#2C3E50').text('Metadatos de Sesión', 50, 260);

        doc.fontSize(10)
            .fillColor('#34495E')
            .text(`ID de Sesión: ${data.session.id}`, 60, 290)
            .text(`Vehículo ID: ${data.session.vehicleId}`, 60, 305)
            .text(`Puntos GPS: ${data.session.gpsMeasurements?.length || 0}`, 60, 320)
            .text(
                `Mediciones de estabilidad: ${data.session.stabilityMeasurements?.length || 0}`,
                60,
                335
            )
            .text(`Datos CAN: ${data.session.canMeasurements?.length || 0}`, 60, 350);
    }
}

// Instancia singleton
export const professionalReportService = new ProfessionalReportService();
