import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { logger } from '../utils/logger';

// ===========================
// INTERFACES MEJORADAS
// ===========================

export interface EnhancedTabExportData {
    tabName: string;
    tabIndex: number;
    subtitle?: string;
    description?: string;

    // Datos principales
    kpis: EnhancedKPIData[];
    sections?: PDFSection[];

    // Elementos visuales
    mapData?: MapExportData;
    charts?: ChartData[];
    tables?: EnhancedTableData[];

    // Datos específicos por módulo
    speedViolations?: SpeedViolationDetail[];
    blackSpots?: BlackSpotDetail[];
    timelineEvents?: TimelineEvent[];

    // Metadatos
    filters?: FilterData;
    appliedFilters?: Record<string, string>;
    generatedBy?: string;
}

export interface EnhancedKPIData {
    title: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    description?: string; // Explicación detallada del KPI
    icon?: string; // Emoji o carácter
    colorClass?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    category?: 'success' | 'warning' | 'danger' | 'info';
}

export interface PDFSection {
    title: string;
    type: 'text' | 'list' | 'grid' | 'highlight' | 'analysis';
    content: string | string[] | Record<string, any>;
    icon?: string;
    colorAccent?: string;
}

export interface SpeedViolationDetail {
    timestamp: string;
    vehicleName: string;
    location: string;
    speed: number;
    speedLimit: number;
    excess: number;
    violationType: 'grave' | 'moderado' | 'leve';
    rotativoOn: boolean;
    roadType: string;
    coordinates?: { lat: number; lng: number };
}

export interface BlackSpotDetail {
    rank: number;
    location: string;
    totalEvents: number;
    grave: number;
    moderada: number;
    leve: number;
    frequency: number;
    dominantSeverity: string;
    coordinates?: { lat: number; lng: number };
}

export interface TimelineEvent {
    timestamp: string;
    type: string;
    severity: string;
    description: string;
    vehicleName?: string;
    location?: string;
}

export interface EnhancedTableData {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: any[][];
    columnWidths?: number[]; // Porcentajes de ancho para cada columna
    highlightRows?: number[]; // Índices de filas a resaltar
    footerText?: string;
}

export interface MapExportData {
    type: 'heatmap' | 'speed' | 'route' | 'hotspots';
    center: [number, number];
    zoom: number;
    points: number;
    image?: string;
    legend?: string[];
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'donut';
    title: string;
    subtitle?: string;
    data: any[];
    image?: string;
}

export interface FilterData {
    vehicle?: string;
    dateRange?: { start: string; end: string };
    organization?: string;
    company?: string;
}

// ===========================
// SERVICIO MEJORADO
// ===========================

class EnhancedPDFExportService {
    // Colores del tema
    private readonly colors = {
        primary: [30, 58, 138] as [number, number, number],
        secondary: [71, 85, 105] as [number, number, number],
        accent: [59, 130, 246] as [number, number, number],
        success: [34, 197, 94] as [number, number, number],
        warning: [251, 146, 60] as [number, number, number],
        danger: [239, 68, 68] as [number, number, number],
        info: [59, 130, 246] as [number, number, number],
        light: [248, 250, 252] as [number, number, number],
        border: [226, 232, 240] as [number, number, number],
        text: [15, 23, 42] as [number, number, number],
        textSecondary: [100, 116, 139] as [number, number, number]
    };

    /**
     * Captura un elemento HTML como imagen (alta calidad)
     */
    async captureElement(elementId: string, scale: number = 2): Promise<string | null> {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                logger.warn('Elemento no encontrado para captura', { elementId });
                return null;
            }

            const canvas = await html2canvas(element, {
                scale,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                removeContainer: true
            });

            return canvas.toDataURL('image/png', 0.95);
        } catch (error) {
            logger.error('Error capturando elemento', { elementId, error });
            return null;
        }
    }

    /**
     * Genera PDF mejorado con diseño profesional
     */
    async generateEnhancedTabPDF(exportData: EnhancedTabExportData): Promise<void> {
        try {
            logger.info('Generando PDF mejorado', { tabName: exportData.tabName });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - (2 * margin);
            let yPosition = margin;

            // ===== PORTADA MEJORADA =====
            yPosition = this.renderEnhancedCover(pdf, exportData, pageWidth, yPosition);

            // ===== ÍNDICE (si hay secciones múltiples) =====
            if (this.shouldAddIndex(exportData)) {
                pdf.addPage();
                yPosition = margin;
                yPosition = this.renderIndex(pdf, exportData, margin, yPosition);
            }

            // ===== PÁGINA PRINCIPAL =====
            pdf.addPage();
            yPosition = margin;

            // Función auxiliar para saltos de página
            const checkPageBreak = (requiredHeight: number): boolean => {
                if (yPosition + requiredHeight > pageHeight - margin - 15) {
                    pdf.addPage();
                    yPosition = margin;
                    return true;
                }
                return false;
            };

            // ===== RESUMEN EJECUTIVO =====
            yPosition = this.renderExecutiveSummary(pdf, exportData, margin, contentWidth, yPosition, checkPageBreak);

            // ===== KPIS DETALLADOS =====
            if (exportData.kpis && exportData.kpis.length > 0) {
                checkPageBreak(60);
                yPosition = this.renderEnhancedKPIs(pdf, exportData.kpis, margin, contentWidth, yPosition, checkPageBreak);
            }

            // ===== CONTENIDO ESPECÍFICO POR MÓDULO =====
            if (exportData.speedViolations && exportData.speedViolations.length > 0) {
                checkPageBreak(80);
                yPosition = this.renderSpeedViolationsSection(pdf, exportData.speedViolations, margin, contentWidth, yPosition, checkPageBreak);
            }

            if (exportData.blackSpots && exportData.blackSpots.length > 0) {
                checkPageBreak(80);
                yPosition = this.renderBlackSpotsSection(pdf, exportData.blackSpots, margin, contentWidth, yPosition, checkPageBreak);
            }

            // ===== MAPA =====
            if (exportData.mapData && exportData.mapData.image) {
                checkPageBreak(130);
                yPosition = this.renderMap(pdf, exportData.mapData, margin, contentWidth, yPosition);
            }

            // ===== SECCIONES PERSONALIZADAS =====
            if (exportData.sections && exportData.sections.length > 0) {
                for (const section of exportData.sections) {
                    checkPageBreak(40);
                    yPosition = this.renderSection(pdf, section, margin, contentWidth, yPosition, checkPageBreak);
                }
            }

            // ===== TABLAS MEJORADAS =====
            if (exportData.tables && exportData.tables.length > 0) {
                for (const table of exportData.tables) {
                    checkPageBreak(60);
                    yPosition = this.renderEnhancedTable(pdf, table, margin, contentWidth, yPosition, checkPageBreak);
                }
            }

            // ===== GRÁFICAS =====
            if (exportData.charts && exportData.charts.length > 0) {
                for (const chart of exportData.charts) {
                    checkPageBreak(90);
                    yPosition = this.renderChart(pdf, chart, margin, contentWidth, yPosition);
                }
            }

            // ===== PIE DE PÁGINA EN TODAS LAS PÁGINAS =====
            this.addFooterToAllPages(pdf, exportData, pageWidth, pageHeight, margin);

            // ===== GUARDAR PDF =====
            const fileName = this.generateFileName(exportData);
            pdf.save(fileName);

            logger.info('PDF mejorado generado exitosamente', { tabName: exportData.tabName, fileName });
        } catch (error) {
            logger.error('Error generando PDF mejorado', { error });
            throw error;
        }
    }

    // ===========================
    // MÉTODOS DE RENDERIZADO
    // ===========================

    private renderEnhancedCover(pdf: jsPDF, exportData: EnhancedTabExportData, pageWidth: number, yPosition: number): number {
        // Fondo de header
        pdf.setFillColor(...this.colors.primary);
        pdf.rect(0, 0, pageWidth, 60, 'F');

            // Logo y título principal
            pdf.setFontSize(32);
            pdf.setTextColor(255, 255, 255);
            pdf.text('Doback Soft', pageWidth / 2, yPosition + 15, { align: 'center' });
            
            pdf.setFontSize(14);
            pdf.text('Sistema de Analisis de Flota', pageWidth / 2, yPosition + 25, { align: 'center' });

        yPosition += 45;

        // Nombre del módulo en área blanca
        yPosition += 25;
        pdf.setFontSize(28);
        pdf.setTextColor(...this.colors.text);
        pdf.text(exportData.tabName, pageWidth / 2, yPosition, { align: 'center' });

        // Subtítulo si existe
        if (exportData.subtitle) {
            yPosition += 10;
            pdf.setFontSize(14);
            pdf.setTextColor(...this.colors.secondary);
            pdf.text(exportData.subtitle, pageWidth / 2, yPosition, { align: 'center' });
        }

        // Descripción
        if (exportData.description) {
            yPosition += 15;
            pdf.setFontSize(10);
            pdf.setTextColor(...this.colors.textSecondary);
            const descLines = pdf.splitTextToSize(exportData.description, pageWidth - 60);
            pdf.text(descLines, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += descLines.length * 5;
        }

        yPosition += 20;

        // Fecha y hora destacada
        const now = new Date();
        pdf.setFillColor(...this.colors.light);
        pdf.roundedRect(pageWidth / 2 - 45, yPosition, 90, 15, 3, 3, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...this.colors.secondary);
        pdf.text('Fecha de Generacion', pageWidth / 2, yPosition + 6, { align: 'center' });
        
        pdf.setFontSize(9);
        pdf.setTextColor(...this.colors.textSecondary);
        pdf.text(
            `${now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} - ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            pageWidth / 2,
            yPosition + 12,
            { align: 'center' }
        );

        yPosition += 25;

        // Filtros aplicados en caja destacada
        if (exportData.filters && (exportData.filters.vehicle || exportData.filters.dateRange || exportData.filters.company)) {
            pdf.setFillColor(239, 246, 255); // Azul claro
            pdf.roundedRect(15, yPosition, pageWidth - 30, 35, 3, 3, 'F');
            
            pdf.setFontSize(11);
            pdf.setTextColor(...this.colors.primary);
            pdf.text('FILTROS APLICADOS', 20, yPosition + 7);
            
            pdf.setFontSize(9);
            pdf.setTextColor(...this.colors.text);
            let filterY = yPosition + 14;

            if (exportData.filters.vehicle) {
                pdf.text(`- Vehiculo: ${exportData.filters.vehicle}`, 20, filterY);
                filterY += 5;
            }

            if (exportData.filters.dateRange) {
                pdf.text(`- Periodo: ${exportData.filters.dateRange.start} - ${exportData.filters.dateRange.end}`, 20, filterY);
                filterY += 5;
            }

            if (exportData.filters.company) {
                pdf.text(`- Empresa: ${exportData.filters.company}`, 20, filterY);
            }

            yPosition += 42;
        }

        return yPosition;
    }

    private shouldAddIndex(exportData: EnhancedTabExportData): boolean {
        const sectionsCount = (exportData.sections?.length || 0) +
            (exportData.speedViolations?.length || 0 > 0 ? 1 : 0) +
            (exportData.blackSpots?.length || 0 > 0 ? 1 : 0) +
            (exportData.tables?.length || 0) +
            (exportData.charts?.length || 0);
        return sectionsCount > 3;
    }

    private renderIndex(pdf: jsPDF, exportData: EnhancedTabExportData, margin: number, yPosition: number): number {
        pdf.setFontSize(18);
        pdf.setTextColor(...this.colors.text);
        pdf.text('INDICE DE CONTENIDOS', margin, yPosition);
        
        yPosition += 12;
        pdf.setDrawColor(...this.colors.border);
        pdf.line(margin, yPosition, pdf.internal.pageSize.getWidth() - margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(...this.colors.secondary);

        let indexNum = 1;

        // KPIs
        if (exportData.kpis && exportData.kpis.length > 0) {
            pdf.text(`${indexNum}. Metricas Principales`, margin + 3, yPosition);
            yPosition += 6;
            indexNum++;
        }

        // Contenido específico
        if (exportData.speedViolations && exportData.speedViolations.length > 0) {
            pdf.text(`${indexNum}. Analisis de Excesos de Velocidad`, margin + 3, yPosition);
            yPosition += 6;
            indexNum++;
        }

        if (exportData.blackSpots && exportData.blackSpots.length > 0) {
            pdf.text(`${indexNum}. Ranking de Puntos Negros`, margin + 3, yPosition);
            yPosition += 6;
            indexNum++;
        }

        // Mapas
        if (exportData.mapData) {
            pdf.text(`${indexNum}. Visualizacion Geografica`, margin + 3, yPosition);
            yPosition += 6;
            indexNum++;
        }

        // Secciones personalizadas
        if (exportData.sections) {
            exportData.sections.forEach(section => {
                // Remover emojis del título
                const cleanTitle = this.removeEmojis(section.title);
                pdf.text(`${indexNum}. ${cleanTitle}`, margin + 3, yPosition);
                yPosition += 6;
                indexNum++;
            });
        }

        return yPosition;
    }

    // Método helper para remover emojis y caracteres especiales
    private removeEmojis(text: string): string {
        // Remover emojis, mantener solo texto ASCII extendido
        return text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F900}-\u{1F9FF}|\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
    }

    private renderExecutiveSummary(
        pdf: jsPDF,
        exportData: EnhancedTabExportData,
        margin: number,
        contentWidth: number,
        yPosition: number,
        checkPageBreak: (height: number) => boolean
    ): number {
        // Caja de resumen ejecutivo
        pdf.setFillColor(254, 249, 235); // Amarillo suave
        pdf.roundedRect(margin, yPosition, contentWidth, 30, 3, 3, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(...this.colors.warning);
        pdf.text('RESUMEN EJECUTIVO', margin + 5, yPosition + 7);
        
        pdf.setFontSize(9);
        pdf.setTextColor(...this.colors.text);
        
        // Generar resumen basado en los datos
        const summary = this.generateExecutiveSummary(exportData);
        const summaryLines = pdf.splitTextToSize(summary, contentWidth - 10);
        pdf.text(summaryLines, margin + 5, yPosition + 14);
        
        yPosition += 35;
        return yPosition;
    }

    private generateExecutiveSummary(exportData: EnhancedTabExportData): string {
        const kpiCount = exportData.kpis?.length || 0;

        let summary = `Este reporte contiene ${kpiCount} métricas principales`;

        if (exportData.speedViolations && exportData.speedViolations.length > 0) {
            const graveCount = exportData.speedViolations.filter(v => v.violationType === 'grave').length;
            summary += ` y análisis de ${exportData.speedViolations.length} excesos de velocidad`;
            if (graveCount > 0) {
                summary += ` (${graveCount} graves)`;
            }
        }

        if (exportData.blackSpots && exportData.blackSpots.length > 0) {
            summary += `, incluyendo ${exportData.blackSpots.length} puntos críticos identificados`;
        }

        summary += '. Los datos reflejan el estado actual del sistema según los filtros aplicados.';

        return summary;
    }

    private renderEnhancedKPIs(
        pdf: jsPDF,
        kpis: EnhancedKPIData[],
        margin: number,
        contentWidth: number,
        yPosition: number,
        checkPageBreak: (height: number) => boolean
    ): number {
        // Título de sección
        pdf.setFontSize(16);
        pdf.setTextColor(...this.colors.text);
        pdf.text('METRICAS PRINCIPALES', margin, yPosition);
        yPosition += 10;

        // Renderizar cada KPI con su explicación
        kpis.forEach((kpi) => {
            checkPageBreak(40);

            // Caja del KPI
            const kpiHeight = kpi.description ? 35 : 25;

            // Color de borde según categoría
            let borderColor = this.colors.info;
            if (kpi.category === 'success') borderColor = this.colors.success;
            if (kpi.category === 'warning') borderColor = this.colors.warning;
            if (kpi.category === 'danger') borderColor = this.colors.danger;

            // Fondo
            pdf.setFillColor(...this.colors.light);
            pdf.roundedRect(margin, yPosition, contentWidth, kpiHeight, 2, 2, 'F');

            // Borde izquierdo de color
            pdf.setFillColor(...borderColor);
            pdf.rect(margin, yPosition, 3, kpiHeight);

            // Indicador visual de categoría (cuadrado de color)
            if (kpi.category) {
                const catColor = kpi.category === 'success' ? this.colors.success :
                                kpi.category === 'warning' ? this.colors.warning :
                                kpi.category === 'danger' ? this.colors.danger :
                                this.colors.info;
                pdf.setFillColor(...catColor);
                pdf.circle(margin + 8, yPosition + 5, 2, 'F');
            }

            // Título
            pdf.setFontSize(10);
            pdf.setTextColor(...this.colors.secondary);
            pdf.text(kpi.title, margin + 13, yPosition + 7);

            // Valor
            pdf.setFontSize(18);
            pdf.setTextColor(...this.colors.text);
            const valueText = `${kpi.value}${kpi.unit ? ' ' + kpi.unit : ''}`;
            pdf.text(valueText, margin + 13, yPosition + 17);

            // Tendencia (si existe)
            if (kpi.trend && kpi.trendValue) {
                const trendIcon = kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→';
                const trendColor = kpi.trend === 'up' ? this.colors.success :
                    kpi.trend === 'down' ? this.colors.danger : this.colors.textSecondary;

                pdf.setFontSize(10);
                pdf.setTextColor(...trendColor);
                pdf.text(`${trendIcon} ${kpi.trendValue}`, contentWidth + margin - 25, yPosition + 17, { align: 'right' });
            }

            // Explicación (si existe)
            if (kpi.description) {
                pdf.setFontSize(8);
                pdf.setTextColor(...this.colors.textSecondary);
                const descLines = pdf.splitTextToSize(kpi.description, contentWidth - 20);
                pdf.text(descLines, margin + 15, yPosition + 23);
            }

            yPosition += kpiHeight + 5;
        });

        yPosition += 5;
        return yPosition;
    }

    private renderSpeedViolationsSection(
        pdf: jsPDF,
        violations: SpeedViolationDetail[],
        margin: number,
        contentWidth: number,
        yPosition: number,
        checkPageBreak: (height: number) => boolean
    ): number {
        // Título de sección
        pdf.setFillColor(...this.colors.danger);
        pdf.rect(margin, yPosition, contentWidth, 8, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text('ANALISIS DE EXCESOS DE VELOCIDAD', margin + 5, yPosition + 6);
        yPosition += 12;

        // Estadísticas rápidas
        const graveCount = violations.filter(v => v.violationType === 'grave').length;
        const moderadoCount = violations.filter(v => v.violationType === 'moderado').length;
        const leveCount = violations.filter(v => v.violationType === 'leve').length;
        const avgExcess = violations.reduce((sum, v) => sum + v.excess, 0) / violations.length;

        // Caja de estadísticas
        pdf.setFillColor(254, 242, 242); // Rojo suave
        pdf.roundedRect(margin, yPosition, contentWidth, 25, 2, 2, 'F');
        
        pdf.setFontSize(9);
        pdf.setTextColor(...this.colors.text);
        pdf.text(`Total de Excesos Detectados: ${violations.length}`, margin + 5, yPosition + 6);
        pdf.text(`GRAVES: ${graveCount}  |  MODERADOS: ${moderadoCount}  |  LEVES: ${leveCount}`, margin + 5, yPosition + 12);
        pdf.text(`Exceso Promedio: ${avgExcess.toFixed(2)} km/h`, margin + 5, yPosition + 18);
        pdf.text(`Con Rotativo Activo: ${violations.filter(v => v.rotativoOn).length}`, margin + 5, yPosition + 24);
        
        yPosition += 30;

        // Tabla de excesos (top 10)
        const topViolations = violations.slice(0, 10);

        pdf.setFontSize(11);
        pdf.setTextColor(...this.colors.text);
        pdf.text('Top 10 Excesos de Velocidad', margin, yPosition);
        yPosition += 7;

        // Headers de tabla
        const colWidths = [20, 50, 25, 25, 30];
        const headers = ['Hora', 'Ubicación', 'Velocidad', 'Límite', 'Exceso'];

        pdf.setFillColor(...this.colors.primary);
        pdf.rect(margin, yPosition, contentWidth, 7, 'F');

        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);

        let xPos = margin + 2;
        headers.forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 5);
            xPos += colWidths[i] || 30;
        });

        yPosition += 7;

        // Filas
        pdf.setFontSize(7);
        topViolations.forEach((violation, idx) => {
            checkPageBreak(7);

            // Color de fondo alternado
            if (idx % 2 === 0) {
                pdf.setFillColor(...this.colors.light);
                pdf.rect(margin, yPosition, contentWidth, 7, 'F');
            }

            // Color del texto según severidad
            let textColor = this.colors.text;
            if (violation.violationType === 'grave') textColor = this.colors.danger;
            else if (violation.violationType === 'moderado') textColor = this.colors.warning;

            pdf.setTextColor(...textColor);

            xPos = margin + 2;

            // Hora
            const time = new Date(violation.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            pdf.text(time, xPos, yPosition + 5);
            xPos += colWidths[0] || 20;

            // Ubicación (truncada)
            pdf.setTextColor(...this.colors.text);
            const location = violation.location.length > 30 ? violation.location.substring(0, 27) + '...' : violation.location;
            pdf.text(location, xPos, yPosition + 5);
            xPos += colWidths[1] || 50;

            // Velocidad
            pdf.text(`${violation.speed} km/h`, xPos, yPosition + 5);
            xPos += colWidths[2] || 25;

            // Límite
            pdf.text(`${violation.speedLimit} km/h`, xPos, yPosition + 5);
            xPos += colWidths[3] || 25;

            // Exceso
            pdf.setTextColor(...textColor);
            pdf.text(`+${violation.excess.toFixed(2)} km/h`, xPos, yPosition + 5);

            yPosition += 7;
        });

        if (violations.length > 10) {
            yPosition += 3;
            pdf.setFontSize(8);
            pdf.setTextColor(...this.colors.textSecondary);
            pdf.text(`... y ${violations.length - 10} excesos más`, margin, yPosition);
            yPosition += 5;
        }

        yPosition += 10;
        return yPosition;
    }

    private renderBlackSpotsSection(
        pdf: jsPDF,
        blackSpots: BlackSpotDetail[],
        margin: number,
        contentWidth: number,
        yPosition: number,
        checkPageBreak: (height: number) => boolean
    ): number {
        // Título de sección
        pdf.setFillColor(...this.colors.warning);
        pdf.rect(margin, yPosition, contentWidth, 8, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text('RANKING DE PUNTOS NEGROS', margin + 5, yPosition + 6);
        yPosition += 12;

        // Estadísticas
        const totalEvents = blackSpots.reduce((sum, spot) => sum + spot.totalEvents, 0);
        const totalGrave = blackSpots.reduce((sum, spot) => sum + spot.grave, 0);
        const totalModerada = blackSpots.reduce((sum, spot) => sum + spot.moderada, 0);
        const totalLeve = blackSpots.reduce((sum, spot) => sum + spot.leve, 0);

        pdf.setFillColor(255, 243, 224); // Naranja suave
        pdf.roundedRect(margin, yPosition, contentWidth, 20, 2, 2, 'F');
        
        pdf.setFontSize(9);
        pdf.setTextColor(...this.colors.text);
        pdf.text(`Zonas Criticas Identificadas: ${blackSpots.length}`, margin + 5, yPosition + 6);
        pdf.text(`Total de Eventos: ${totalEvents}`, margin + 5, yPosition + 12);
        pdf.text(`GRAVES: ${totalGrave}  |  MODERADOS: ${totalModerada}  |  LEVES: ${totalLeve}`, margin + 5, yPosition + 18);
        
        yPosition += 25;

        // Renderizar cada punto negro
        blackSpots.slice(0, 10).forEach((spot) => {
            checkPageBreak(25);

            // Caja del punto negro
            const boxHeight = 22;

            // Color según ranking
            let medalColor: [number, number, number] = this.colors.textSecondary;
            let rankText = `#${spot.rank}`;
            let rankBgColor: [number, number, number] = this.colors.light;
            
            if (spot.rank === 1) { 
                rankText = '#1';
                medalColor = [255, 215, 0]; 
                rankBgColor = [255, 251, 230];
            }
            else if (spot.rank === 2) { 
                rankText = '#2';
                medalColor = [192, 192, 192]; 
                rankBgColor = [248, 248, 248];
            }
            else if (spot.rank === 3) { 
                rankText = '#3';
                medalColor = [205, 127, 50]; 
                rankBgColor = [255, 245, 235];
            }

            pdf.setFillColor(...rankBgColor);
            pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'F');

            // Badge de ranking
            pdf.setFillColor(...medalColor);
            pdf.circle(margin + 8, yPosition + 8, 5, 'F');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text(rankText, margin + 8, yPosition + 10, { align: 'center' });

            // Ubicación
            pdf.setFontSize(10);
            pdf.setTextColor(...this.colors.text);
            const locText = spot.location.length > 45 ? spot.location.substring(0, 42) + '...' : spot.location;
            pdf.text(locText, margin + 18, yPosition + 7);

            // Total eventos
            pdf.setFontSize(8);
            pdf.setTextColor(...this.colors.secondary);
            pdf.text(`Total: ${spot.totalEvents} eventos`, margin + 18, yPosition + 13);

            // Distribución por severidad
            pdf.setFontSize(7);
            pdf.text(`GRAVES: ${spot.grave}  |  MODERADOS: ${spot.moderada}  |  LEVES: ${spot.leve}`, margin + 18, yPosition + 18);

            yPosition += boxHeight + 3;
        });

        yPosition += 5;
        return yPosition;
    }

    private renderMap(
        pdf: jsPDF,
        mapData: MapExportData,
        margin: number,
        contentWidth: number,
        yPosition: number
    ): number {
        pdf.setFillColor(...this.colors.info);
        pdf.rect(margin, yPosition, contentWidth, 8, 'F');
        pdf.setFontSize(13);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`VISUALIZACION GEOGRAFICA - ${this.getMapTypeLabel(mapData.type)}`, margin + 5, yPosition + 6);
        yPosition += 12;

        if (mapData.image) {
            try {
                const mapHeight = 110;

                // Borde del mapa
                pdf.setDrawColor(...this.colors.border);
                pdf.setLineWidth(0.5);
                pdf.rect(margin, yPosition, contentWidth, mapHeight);

                // Imagen del mapa
                pdf.addImage(
                    mapData.image,
                    'PNG',
                    margin + 1,
                    yPosition + 1,
                    contentWidth - 2,
                    mapHeight - 2
                );

                yPosition += mapHeight + 5;

                // Información del mapa
                pdf.setFontSize(8);
                pdf.setTextColor(...this.colors.textSecondary);
                pdf.text(
                    `Centro: [${mapData.center[0].toFixed(4)}, ${mapData.center[1].toFixed(4)}] | Zoom: ${mapData.zoom} | Puntos: ${mapData.points}`,
                    margin,
                    yPosition
                );
                yPosition += 5;

                // Leyenda (si existe)
                if (mapData.legend && mapData.legend.length > 0) {
                    pdf.setFontSize(8);
                    pdf.setTextColor(...this.colors.text);
                    pdf.text('LEYENDA:', margin, yPosition);
                    yPosition += 5;
                    
                    mapData.legend.forEach(item => {
                        pdf.setFontSize(7);
                        pdf.setTextColor(...this.colors.textSecondary);
                        const cleanItem = this.removeEmojis(item);
                        pdf.text(`- ${cleanItem}`, margin + 3, yPosition);
                        yPosition += 4;
                    });
                }

                yPosition += 5;
            } catch (error) {
                logger.error('Error agregando mapa al PDF', { error });
            }
        }

        return yPosition;
    }

    private getMapTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'heatmap': 'Mapa de Calor',
            'speed': 'Excesos de Velocidad',
            'route': 'Recorridos',
            'hotspots': 'Puntos Críticos'
        };
        return labels[type] || type;
    }

    private renderSection(
        pdf: jsPDF,
        section: PDFSection,
        margin: number,
        contentWidth: number,
        yPosition: number,
        checkPageBreak: (height: number) => boolean
    ): number {
        // Título de sección
        pdf.setFontSize(13);
        pdf.setTextColor(...this.colors.text);
        const cleanTitle = this.removeEmojis(section.title);
        const titleText = cleanTitle.toUpperCase();
        pdf.text(titleText, margin, yPosition);
        yPosition += 8;

        // Contenido según tipo
        pdf.setFontSize(9);
        pdf.setTextColor(...this.colors.secondary);

        if (section.type === 'text' && typeof section.content === 'string') {
            const cleanContent = this.removeEmojis(section.content);
            const lines = pdf.splitTextToSize(cleanContent, contentWidth);
            pdf.text(lines, margin + 3, yPosition);
            yPosition += lines.length * 5 + 5;
        } else if (section.type === 'list' && Array.isArray(section.content)) {
            section.content.forEach(item => {
                checkPageBreak(6);
                const cleanItem = this.removeEmojis(item);
                pdf.text(`- ${cleanItem}`, margin + 5, yPosition);
                yPosition += 5;
            });
            yPosition += 3;
        }

        return yPosition;
    }

    private renderEnhancedTable(
        pdf: jsPDF,
        table: EnhancedTableData,
        margin: number,
        contentWidth: number,
        yPosition: number,
        checkPageBreak: (height: number) => boolean
    ): number {
        // Título de tabla
        pdf.setFontSize(12);
        pdf.setTextColor(...this.colors.text);
        pdf.text(table.title, margin, yPosition);
        yPosition += 7;

        if (table.subtitle) {
            pdf.setFontSize(9);
            pdf.setTextColor(...this.colors.textSecondary);
            pdf.text(table.subtitle, margin, yPosition);
            yPosition += 5;
        }

        // Calcular anchos de columnas
        const colWidths = table.columnWidths ||
            Array(table.headers.length).fill(contentWidth / table.headers.length);
        const rowHeight = 7;

        // Headers
        pdf.setFillColor(...this.colors.primary);
        pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');

        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);

        let xPos = margin + 2;
        table.headers.forEach((header, i) => {
            pdf.text(header, xPos, yPosition + 5);
            xPos += colWidths[i];
        });

        yPosition += rowHeight;

        // Filas
        const maxRows = Math.min(table.rows.length, 15);
        pdf.setFontSize(7);

        for (let r = 0; r < maxRows; r++) {
            checkPageBreak(rowHeight);

            const row = table.rows[r];
            if (!row) continue; // Saltar si la fila no existe

            const isHighlighted = table.highlightRows?.includes(r);

            // Fondo
            if (isHighlighted) {
                pdf.setFillColor(255, 251, 235); // Amarillo suave
            } else if (r % 2 === 0) {
                pdf.setFillColor(...this.colors.light);
            } else {
                pdf.setFillColor(255, 255, 255);
            }
            pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');

            pdf.setTextColor(...this.colors.text);
            xPos = margin + 2;

            row.forEach((cell, c) => {
                const cellText = String(cell);
                const truncated = cellText.length > 30 ? cellText.substring(0, 27) + '...' : cellText;
                pdf.text(truncated, xPos, yPosition + 5);
                xPos += colWidths[c] || 30;
            });

            yPosition += rowHeight;
        }

        // Nota de más filas
        if (table.rows.length > maxRows) {
            yPosition += 2;
            pdf.setFontSize(7);
            pdf.setTextColor(...this.colors.textSecondary);
            pdf.text(`... y ${table.rows.length - maxRows} filas más`, margin, yPosition);
            yPosition += 5;
        }

        // Footer de tabla
        if (table.footerText) {
            yPosition += 2;
            pdf.setFontSize(7);
            pdf.setTextColor(...this.colors.textSecondary);
            pdf.text(table.footerText, margin, yPosition);
            yPosition += 5;
        }

        yPosition += 5;
        return yPosition;
    }

    private renderChart(
        pdf: jsPDF,
        chart: ChartData,
        margin: number,
        contentWidth: number,
        yPosition: number
    ): number {
        pdf.setFontSize(12);
        pdf.setTextColor(...this.colors.text);
        pdf.text(chart.title, margin, yPosition);
        yPosition += 7;

        if (chart.subtitle) {
            pdf.setFontSize(9);
            pdf.setTextColor(...this.colors.textSecondary);
            pdf.text(chart.subtitle, margin, yPosition);
            yPosition += 5;
        }

        if (chart.image) {
            try {
                const chartHeight = 70;
                pdf.addImage(
                    chart.image,
                    'PNG',
                    margin,
                    yPosition,
                    contentWidth,
                    chartHeight
                );
                yPosition += chartHeight + 10;
            } catch (error) {
                logger.error('Error agregando gráfico al PDF', { error });
            }
        }

        return yPosition;
    }

    private addFooterToAllPages(
        pdf: jsPDF,
        exportData: EnhancedTabExportData,
        pageWidth: number,
        pageHeight: number,
        margin: number
    ): void {
        const totalPages = pdf.internal.pages.length - 1;

        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Línea superior del footer
            pdf.setDrawColor(...this.colors.border);
            pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            // Número de página
            pdf.setFontSize(8);
            pdf.setTextColor(...this.colors.textSecondary);
            pdf.text(
                `Página ${i} de ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );

            // Marca de agua
            pdf.setTextColor(200, 200, 200);
            pdf.text(
                'Doback Soft V3',
                pageWidth - margin,
                pageHeight - 10,
                { align: 'right' }
            );

            // Usuario generador (si existe)
            if (exportData.generatedBy) {
                pdf.text(
                    `Generado por: ${exportData.generatedBy}`,
                    margin,
                    pageHeight - 10
                );
            }
        }
    }

    private generateFileName(exportData: EnhancedTabExportData): string {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = (now.toTimeString().split(' ')[0] || '00-00-00').replace(/:/g, '-');
        const tabName = exportData.tabName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        
        return `DobackSoft_${tabName}_${dateStr}_${timeStr}.pdf`;
    }
}

export const enhancedPDFExportService = new EnhancedPDFExportService();

