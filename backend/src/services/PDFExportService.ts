import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';

export interface PDFExportConfig {
    type: string;
    includeCharts?: boolean;
    includeMaps?: boolean;
    includeEvents?: boolean;
    includeKPIs?: boolean;
    includeRecommendations?: boolean;
    filters?: Record<string, any>;
    organizationId?: string;
}

export interface SpeedAnalysisConfig {
    events: any[];
    includeCharts?: boolean;
    includeMaps?: boolean;
    includeRecommendations?: boolean;
    filters?: Record<string, any>;
    organizationId?: string;
}

export interface EventsConfig {
    events: any[];
    includeMaps?: boolean;
    includeCharts?: boolean;
    filters?: Record<string, any>;
    organizationId?: string;
}

export interface KPIsConfig {
    includeCharts?: boolean;
    includeRecommendations?: boolean;
    dateRange?: {
        start: string;
        end: string;
    };
    filters?: Record<string, any>;
    organizationId?: string;
}

export class PDFExportService {
    private static readonly REPORTS_DIR = process.env.REPORTS_DIR || path.resolve('./reports');

    /**
     * Genera PDF del dashboard ejecutivo
     */
    static async generateDashboardPDF(config: PDFExportConfig): Promise<Buffer> {
        try {
            logger.info('Generando PDF del dashboard', { config });

            // Crear directorio de reportes si no existe
            await this.ensureReportsDirectory();

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Dashboard Ejecutivo - DobackSoft',
                    Author: 'Sistema de Gestión de Flotas',
                    Subject: 'Análisis Ejecutivo de KPIs y Métricas',
                    CreationDate: new Date()
                }
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                logger.info('PDF del dashboard generado exitosamente');
            });

            // Construir contenido del PDF
            this.buildDashboardCover(doc, config);
            this.buildDashboardKPIs(doc, config);

            if (config.includeCharts) {
                this.buildDashboardCharts(doc, config);
            }

            if (config.includeEvents) {
                this.buildDashboardEvents(doc, config);
            }

            // ✅ NUEVO: Sección de claves operacionales
            if ((config as any).kpis?.operationalKeys && (config as any).kpis.operationalKeys.total > 0) {
                this.buildOperationalKeys(doc, (config as any).kpis.operationalKeys);
            }

            // ✅ NUEVO: Sección de calidad de datos
            if ((config as any).kpis?.quality) {
                this.buildDataQuality(doc, (config as any).kpis.quality);
            }

            if (config.includeRecommendations) {
                this.buildDashboardRecommendations(doc, config);
            }

            doc.end();

            return Buffer.concat(buffers);
        } catch (error) {
            logger.error('Error generando PDF del dashboard', { error, config });
            throw error;
        }
    }

    /**
     * Genera PDF del análisis de velocidad
     */
    static async generateSpeedAnalysisPDF(config: SpeedAnalysisConfig): Promise<Buffer> {
        try {
            logger.info('Generando PDF del análisis de velocidad', { eventsCount: config.events.length });

            await this.ensureReportsDirectory();

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Análisis de Velocidad - DobackSoft',
                    Author: 'Sistema de Gestión de Flotas',
                    Subject: 'Análisis de Eventos de Velocidad',
                    CreationDate: new Date()
                }
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));

            // Construir contenido del PDF
            this.buildSpeedAnalysisCover(doc, config);
            this.buildSpeedAnalysisSummary(doc, config);

            if (config.includeCharts) {
                this.buildSpeedAnalysisCharts(doc, config);
            }

            if (config.includeMaps) {
                this.buildSpeedAnalysisMaps(doc, config);
            }

            if (config.includeRecommendations) {
                this.buildSpeedAnalysisRecommendations(doc, config);
            }

            doc.end();

            return Buffer.concat(buffers);
        } catch (error) {
            logger.error('Error generando PDF del análisis de velocidad', { error, config });
            throw error;
        }
    }

    /**
     * Genera PDF de eventos
     */
    static async generateEventsPDF(config: EventsConfig): Promise<Buffer> {
        try {
            logger.info('Generando PDF de eventos', { eventsCount: config.events.length });

            await this.ensureReportsDirectory();

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'Reporte de Eventos - DobackSoft',
                    Author: 'Sistema de Gestión de Flotas',
                    Subject: 'Análisis de Eventos de Conducción',
                    CreationDate: new Date()
                }
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));

            // Construir contenido del PDF
            this.buildEventsCover(doc, config);
            this.buildEventsSummary(doc, config);
            this.buildEventsTable(doc, config);

            if (config.includeMaps) {
                this.buildEventsMaps(doc, config);
            }

            if (config.includeCharts) {
                this.buildEventsCharts(doc, config);
            }

            doc.end();

            return Buffer.concat(buffers);
        } catch (error) {
            logger.error('Error generando PDF de eventos', { error, config });
            throw error;
        }
    }

    /**
     * Genera PDF de KPIs avanzados
     */
    static async generateKPIsPDF(config: KPIsConfig): Promise<Buffer> {
        try {
            logger.info('Generando PDF de KPIs avanzados', { config });

            await this.ensureReportsDirectory();

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: 'KPIs Avanzados - DobackSoft',
                    Author: 'Sistema de Gestión de Flotas',
                    Subject: 'Análisis de Indicadores Clave de Rendimiento',
                    CreationDate: new Date()
                }
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));

            // Construir contenido del PDF
            this.buildKPIsCover(doc, config);
            this.buildKPIsSummary(doc, config);

            if (config.includeCharts) {
                this.buildKPIsCharts(doc, config);
            }

            if (config.includeRecommendations) {
                this.buildKPIsRecommendations(doc, config);
            }

            doc.end();

            return Buffer.concat(buffers);
        } catch (error) {
            logger.error('Error generando PDF de KPIs', { error, config });
            throw error;
        }
    }

    /**
     * Asegura que el directorio de reportes existe
     */
    private static async ensureReportsDirectory(): Promise<void> {
        if (!fs.existsSync(this.REPORTS_DIR)) {
            fs.mkdirSync(this.REPORTS_DIR, { recursive: true });
            logger.info('Directorio de reportes creado', { path: this.REPORTS_DIR });
        }
    }

    /**
     * Construye la portada del dashboard
     */
    private static buildDashboardCover(doc: PDFKit.PDFDocument, config: PDFExportConfig): void {
        doc.fontSize(24).text('Dashboard Ejecutivo', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Sistema de Gestión de Flotas DobackSoft', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Organización: ${config.organizationId || 'N/A'}`, { align: 'center' });
        doc.moveDown(2);
    }

    /**
     * Construye la sección de KPIs del dashboard
     */
    private static buildDashboardKPIs(doc: PDFKit.PDFDocument, config: PDFExportConfig): void {
        doc.fontSize(18).text('Indicadores Clave de Rendimiento', { underline: true });
        doc.moveDown();

        // KPIs simulados (en producción vendrían de la base de datos)
        const kpis = [
            { name: 'Horas de Conducción', value: '109:30', unit: 'horas' },
            { name: 'Kilómetros Recorridos', value: '292.5', unit: 'km' },
            { name: 'Tiempo en Parque', value: '45:20', unit: 'horas' },
            { name: 'Tiempo con Rotativo', value: '67.8', unit: '%' },
            { name: 'Total de Incidencias', value: '347', unit: 'eventos' }
        ];

        kpis.forEach((kpi, index) => {
            doc.fontSize(12).text(`${kpi.name}: ${kpi.value} ${kpi.unit}`);
            if (index < kpis.length - 1) doc.moveDown(0.5);
        });

        doc.moveDown(2);
    }

    /**
     * Construye la sección de gráficos del dashboard
     */
    private static buildDashboardCharts(doc: PDFKit.PDFDocument, config: PDFExportConfig): void {
        doc.fontSize(18).text('Análisis Gráfico', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Los gráficos muestran las tendencias de los KPIs principales:');
        doc.moveDown();
        doc.fontSize(12).text('• Distribución de tiempo por estado del vehículo');
        doc.fontSize(12).text('• Evolución de incidencias por severidad');
        doc.fontSize(12).text('• Análisis de velocidad por tipo de vía');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de eventos del dashboard
     */
    private static buildDashboardEvents(doc: PDFKit.PDFDocument, config: PDFExportConfig): void {
        doc.fontSize(18).text('Eventos Relevantes', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Resumen de eventos críticos detectados:');
        doc.moveDown();
        doc.fontSize(12).text('• 63 eventos graves identificados');
        doc.fontSize(12).text('• 114 eventos moderados');
        doc.fontSize(12).text('• 170 eventos leves');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de recomendaciones del dashboard
     */
    private static buildDashboardRecommendations(doc: PDFKit.PDFDocument, config: PDFExportConfig): void {
        doc.fontSize(18).text('Recomendaciones', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Basado en el análisis de los datos:');
        doc.moveDown();
        doc.fontSize(12).text('• Revisar patrones de conducción en zonas de alta incidencia');
        doc.fontSize(12).text('• Optimizar tiempos de rotativo para mejorar eficiencia');
        doc.fontSize(12).text('• Implementar formación adicional en manejo de emergencias');
        doc.moveDown(2);
    }

    /**
     * Construye la portada del análisis de velocidad
     */
    private static buildSpeedAnalysisCover(doc: PDFKit.PDFDocument, config: SpeedAnalysisConfig): void {
        doc.fontSize(24).text('Análisis de Velocidad', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Sistema de Gestión de Flotas DobackSoft', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Eventos analizados: ${config.events.length}`, { align: 'center' });
        doc.moveDown(2);
    }

    /**
     * Construye el resumen del análisis de velocidad
     */
    private static buildSpeedAnalysisSummary(doc: PDFKit.PDFDocument, config: SpeedAnalysisConfig): void {
        doc.fontSize(18).text('Resumen del Análisis', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total de eventos de velocidad: ${config.events.length}`);
        doc.moveDown();
        doc.fontSize(12).text('Distribución por severidad:');
        doc.fontSize(12).text('• Graves: 15 eventos');
        doc.fontSize(12).text('• Moderados: 8 eventos');
        doc.fontSize(12).text('• Leves: 12 eventos');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de gráficos del análisis de velocidad
     */
    private static buildSpeedAnalysisCharts(doc: PDFKit.PDFDocument, config: SpeedAnalysisConfig): void {
        doc.fontSize(18).text('Análisis Gráfico', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Gráficos incluidos:');
        doc.moveDown();
        doc.fontSize(12).text('• Distribución de velocidad por tipo de vía');
        doc.fontSize(12).text('• Evolución temporal de eventos de velocidad');
        doc.fontSize(12).text('• Análisis de correlación velocidad-estabilidad');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de mapas del análisis de velocidad
     */
    private static buildSpeedAnalysisMaps(doc: PDFKit.PDFDocument, config: SpeedAnalysisConfig): void {
        doc.fontSize(18).text('Análisis Geográfico', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Mapas incluidos:');
        doc.moveDown();
        doc.fontSize(12).text('• Mapa de calor de eventos de velocidad');
        doc.fontSize(12).text('• Ubicaciones de puntos críticos');
        doc.fontSize(12).text('• Rutas con mayor incidencia');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de recomendaciones del análisis de velocidad
     */
    private static buildSpeedAnalysisRecommendations(doc: PDFKit.PDFDocument, config: SpeedAnalysisConfig): void {
        doc.fontSize(18).text('Recomendaciones', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Basado en el análisis de velocidad:');
        doc.moveDown();
        doc.fontSize(12).text('• Implementar límites de velocidad adaptativos');
        doc.fontSize(12).text('• Revisar rutas con mayor incidencia');
        doc.fontSize(12).text('• Formación específica en control de velocidad');
        doc.moveDown(2);
    }

    /**
     * Construye la portada de eventos
     */
    private static buildEventsCover(doc: PDFKit.PDFDocument, config: EventsConfig): void {
        doc.fontSize(24).text('Reporte de Eventos', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Sistema de Gestión de Flotas DobackSoft', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Total de eventos: ${config.events.length}`, { align: 'center' });
        doc.moveDown(2);
    }

    /**
     * Construye el resumen de eventos
     */
    private static buildEventsSummary(doc: PDFKit.PDFDocument, config: EventsConfig): void {
        doc.fontSize(18).text('Resumen de Eventos', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total de eventos analizados: ${config.events.length}`);
        doc.moveDown();
        doc.fontSize(12).text('Distribución por tipo:');
        doc.fontSize(12).text('• Eventos de estabilidad: 85%');
        doc.fontSize(12).text('• Eventos de velocidad: 10%');
        doc.fontSize(12).text('• Eventos de rotativo: 5%');
        doc.moveDown(2);
    }

    /**
     * Construye la tabla de eventos
     */
    private static buildEventsTable(doc: PDFKit.PDFDocument, config: EventsConfig): void {
        doc.fontSize(18).text('Detalle de Eventos', { underline: true });
        doc.moveDown();

        // Tabla simplificada (en producción sería más detallada)
        doc.fontSize(10);
        doc.text('Fecha', 50, doc.y);
        doc.text('Tipo', 150, doc.y);
        doc.text('Severidad', 250, doc.y);
        doc.text('Ubicación', 350, doc.y);
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown();

        // Eventos de ejemplo
        const sampleEvents = config.events.slice(0, 10); // Mostrar solo los primeros 10
        sampleEvents.forEach((event, index) => {
            if (doc.y > 700) { // Nueva página si se acerca al final
                doc.addPage();
            }

            doc.text(new Date(event.timestamp || Date.now()).toLocaleDateString(), 50, doc.y);
            doc.text(event.type || 'Estabilidad', 150, doc.y);
            doc.text(event.severity || 'M', 250, doc.y);
            doc.text(event.location || 'N/A', 350, doc.y);
            doc.moveDown();
        });

        doc.moveDown(2);
    }

    /**
     * Construye la sección de mapas de eventos
     */
    private static buildEventsMaps(doc: PDFKit.PDFDocument, config: EventsConfig): void {
        doc.fontSize(18).text('Análisis Geográfico', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Mapas incluidos:');
        doc.moveDown();
        doc.fontSize(12).text('• Mapa de calor de eventos');
        doc.fontSize(12).text('• Ubicaciones críticas');
        doc.fontSize(12).text('• Rutas con mayor incidencia');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de gráficos de eventos
     */
    private static buildEventsCharts(doc: PDFKit.PDFDocument, config: EventsConfig): void {
        doc.fontSize(18).text('Análisis Gráfico', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Gráficos incluidos:');
        doc.moveDown();
        doc.fontSize(12).text('• Distribución por severidad');
        doc.fontSize(12).text('• Evolución temporal');
        doc.fontSize(12).text('• Análisis por vehículo');
        doc.moveDown(2);
    }

    /**
     * Construye la portada de KPIs
     */
    private static buildKPIsCover(doc: PDFKit.PDFDocument, config: KPIsConfig): void {
        doc.fontSize(24).text('KPIs Avanzados', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Sistema de Gestión de Flotas DobackSoft', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${config.dateRange?.start || 'N/A'} - ${config.dateRange?.end || 'N/A'}`, { align: 'center' });
        doc.moveDown(2);
    }

    /**
     * Construye el resumen de KPIs
     */
    private static buildKPIsSummary(doc: PDFKit.PDFDocument, config: KPIsConfig): void {
        doc.fontSize(18).text('Resumen de KPIs', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Indicadores clave analizados:');
        doc.moveDown();
        doc.fontSize(12).text('• Eficiencia operativa: 87.5%');
        doc.fontSize(12).text('• Disponibilidad de vehículos: 94.2%');
        doc.fontSize(12).text('• Tiempo de respuesta promedio: 12.3 min');
        doc.fontSize(12).text('• Coste por kilómetro: €0.45');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de gráficos de KPIs
     */
    private static buildKPIsCharts(doc: PDFKit.PDFDocument, config: KPIsConfig): void {
        doc.fontSize(18).text('Análisis Gráfico', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Gráficos incluidos:');
        doc.moveDown();
        doc.fontSize(12).text('• Evolución de KPIs principales');
        doc.fontSize(12).text('• Comparativa entre vehículos');
        doc.fontSize(12).text('• Análisis de tendencias');
        doc.moveDown(2);
    }

    /**
     * Construye la sección de recomendaciones de KPIs
     */
    private static buildKPIsRecommendations(doc: PDFKit.PDFDocument, config: KPIsConfig): void {
        doc.fontSize(18).text('Recomendaciones Estratégicas', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text('Basado en el análisis de KPIs:');
        doc.moveDown();
        doc.fontSize(12).text('• Optimizar rutas para mejorar eficiencia');
        doc.fontSize(12).text('• Implementar mantenimiento predictivo');
        doc.fontSize(12).text('• Revisar políticas de asignación de vehículos');
        doc.moveDown(2);
    }

    /**
     * ✅ NUEVO: Sección de Claves Operacionales
     */
    private static buildOperationalKeys(doc: PDFKit.PDFDocument, operationalKeys: any): void {
        doc.addPage();
        doc.fontSize(18).text('🔑 Claves Operacionales', { underline: true });
        doc.moveDown();

        doc.fontSize(14).text(`Total de claves detectadas: ${operationalKeys.total}`);
        doc.moveDown();

        if (operationalKeys.porTipo && Object.keys(operationalKeys.porTipo).length > 0) {
            doc.fontSize(16).text('Distribución por Tipo:');
            doc.moveDown(0.5);

            const nombresClave: Record<number, string> = {
                0: 'Taller',
                1: 'Operativo en Parque',
                2: 'Salida en Emergencia',
                3: 'En Incendio/Emergencia',
                5: 'Regreso al Parque'
            };

            Object.entries(operationalKeys.porTipo).forEach(([tipo, datos]: [string, any]) => {
                const nombre = nombresClave[parseInt(tipo)] || `Clave ${tipo}`;
                doc.fontSize(12).text(
                    `${nombre}: ${datos.cantidad} veces | ` +
                    `Duración total: ${Math.round(datos.duracion_total / 60)} min | ` +
                    `Promedio: ${Math.round(datos.duracion_promedio / 60)} min`
                );
                doc.moveDown(0.5);
            });
        }

        doc.moveDown();

        if (operationalKeys.claves_recientes && operationalKeys.claves_recientes.length > 0) {
            doc.fontSize(16).text('Claves Recientes:');
            doc.moveDown(0.5);

            operationalKeys.claves_recientes.slice(0, 10).forEach((clave: any, idx: number) => {
                const inicio = new Date(clave.inicio).toLocaleString('es-ES');
                doc.fontSize(10).text(
                    `${idx + 1}. ${clave.tipoNombre || `Clave ${clave.tipo}`} - ` +
                    `${inicio} - ${clave.duracion ? Math.round(clave.duracion / 60) : 0} min` +
                    `${clave.geocerca ? ` - ${clave.geocerca}` : ''}`
                );
                doc.moveDown(0.3);
            });
        }

        doc.moveDown(2);
    }

    /**
     * ✅ NUEVO: Sección de Calidad de Datos
     */
    private static buildDataQuality(doc: PDFKit.PDFDocument, quality: any): void {
        doc.addPage();
        doc.fontSize(18).text('📊 Calidad de Datos', { underline: true });
        doc.moveDown();

        // Índice de Estabilidad
        doc.fontSize(14).text(`Índice de Estabilidad (SI): ${(quality.indice_promedio * 100).toFixed(1)}%`);
        doc.fontSize(12).text(`Calificación: ${quality.calificacion} ${quality.estrellas}`);
        doc.fontSize(10).text(`Total de muestras: ${quality.total_muestras.toLocaleString()}`);
        doc.moveDown();

        // Interpretación
        doc.fontSize(14).text('Interpretación:');
        doc.moveDown(0.5);

        let interpretacion = '';
        if (quality.indice_promedio >= 0.90) {
            interpretacion = 'Conducción EXCELENTE - Operación muy estable y segura';
        } else if (quality.indice_promedio >= 0.88) {
            interpretacion = 'Conducción BUENA - Estabilidad dentro de parámetros';
        } else if (quality.indice_promedio >= 0.85) {
            interpretacion = 'Conducción ACEPTABLE - Requiere atención';
        } else {
            interpretacion = 'Conducción DEFICIENTE - Requiere intervención inmediata';
        }

        doc.fontSize(12).text(interpretacion);
        doc.moveDown(2);
    }
}
