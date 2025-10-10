import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { logger } from '../utils/logger';

export interface TabExportData {
    tabName: string;
    tabIndex: number;
    kpis: KPIData[];
    mapData?: MapExportData;
    charts?: ChartData[];
    tables?: TableData[];
    filters?: FilterData;
    appliedFilters?: Record<string, string>; // Filtros aplicados en formato legible
}

export interface KPIData {
    title: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    colorClass?: string;
}

export interface MapExportData {
    type: 'heatmap' | 'speed' | 'route';
    center: [number, number];
    zoom: number;
    points: any[];
    image?: string; // Base64 de captura de mapa
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: any[];
    image?: string; // Base64 de captura de gráfico
}

export interface TableData {
    title: string;
    headers: string[];
    rows: any[][];
}

export interface FilterData {
    vehicle?: string;
    dateRange?: { start: string; end: string };
    organization?: string;
    company?: string;
}

class PDFExportService {
    /**
     * Captura un elemento HTML como imagen
     */
    async captureElement(elementId: string): Promise<string | null> {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                logger.warn('Elemento no encontrado para captura', { elementId });
                return null;
            }

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            return canvas.toDataURL('image/png');
        } catch (error) {
            logger.error('Error capturando elemento', { elementId, error });
            return null;
        }
    }

    /**
     * Captura múltiples elementos HTML como imágenes
     */
    async captureElements(elementIds: string[]): Promise<{ [key: string]: string }> {
        const captures: { [key: string]: string } = {};

        for (const id of elementIds) {
            const image = await this.captureElement(id);
            if (image) {
                captures[id] = image;
            }
        }

        return captures;
    }

    /**
     * Genera PDF de una pestaña específica
     */
    async generateTabPDF(exportData: TabExportData): Promise<void> {
        try {
            logger.info('Generando PDF de pestaña', { tabName: exportData.tabName });

            // Crear PDF en formato A4
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - (2 * margin);
            let yPosition = margin;

            // Función para agregar nueva página si es necesario
            const checkPageBreak = (requiredHeight: number) => {
                if (yPosition + requiredHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                    return true;
                }
                return false;
            };

            // === PORTADA ===
            // Logo y título
            pdf.setFontSize(24);
            pdf.setTextColor(30, 58, 138); // Azul DobackSoft
            pdf.text('StabilSafe V3', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;

            pdf.setFontSize(16);
            pdf.setTextColor(71, 85, 105); // Gris
            pdf.text('Reporte de Dashboard', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // Nombre de la pestaña
            pdf.setFontSize(20);
            pdf.setTextColor(15, 23, 42);
            pdf.text(exportData.tabName, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // Fecha y hora de generación
            pdf.setFontSize(10);
            pdf.setTextColor(100, 116, 139);
            const now = new Date();
            pdf.text(
                `Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`,
                pageWidth / 2,
                yPosition,
                { align: 'center' }
            );
            yPosition += 10;

            // Filtros aplicados
            if (exportData.filters) {
                pdf.setFontSize(9);
                pdf.setTextColor(71, 85, 105);

                if (exportData.filters.vehicle) {
                    pdf.text(`Vehículo: ${exportData.filters.vehicle}`, pageWidth / 2, yPosition, { align: 'center' });
                    yPosition += 5;
                }

                if (exportData.filters.dateRange) {
                    pdf.text(
                        `Período: ${exportData.filters.dateRange.start} - ${exportData.filters.dateRange.end}`,
                        pageWidth / 2,
                        yPosition,
                        { align: 'center' }
                    );
                    yPosition += 5;
                }

                if (exportData.filters.company) {
                    pdf.text(`Empresa: ${exportData.filters.company}`, pageWidth / 2, yPosition, { align: 'center' });
                    yPosition += 5;
                }
            }

            yPosition += 10;

            // Línea separadora
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 15;

            // === KPIs ===
            if (exportData.kpis && exportData.kpis.length > 0) {
                pdf.setFontSize(14);
                pdf.setTextColor(15, 23, 42);
                pdf.text('Métricas Principales', margin, yPosition);
                yPosition += 8;

                // Dibujar KPIs en grid
                const kpisPerRow = 2;
                const kpiWidth = contentWidth / kpisPerRow - 5;
                const kpiHeight = 25;

                for (let i = 0; i < exportData.kpis.length; i++) {
                    const kpi = exportData.kpis[i];
                    if (!kpi) continue;

                    const col = i % kpisPerRow;
                    const row = Math.floor(i / kpisPerRow);
                    const xPos = margin + col * (kpiWidth + 10);
                    const kpiYPos = yPosition + row * (kpiHeight + 5);

                    checkPageBreak(kpiHeight + 5);

                    // Fondo del KPI
                    pdf.setFillColor(248, 250, 252);
                    pdf.roundedRect(xPos, kpiYPos, kpiWidth, kpiHeight, 3, 3, 'F');

                    // Título del KPI
                    pdf.setFontSize(9);
                    pdf.setTextColor(71, 85, 105);
                    pdf.text(kpi.title, xPos + 3, kpiYPos + 5);

                    // Valor del KPI
                    pdf.setFontSize(16);
                    pdf.setTextColor(15, 23, 42);
                    const valueText = `${kpi.value}${kpi.unit ? ' ' + kpi.unit : ''}`;
                    pdf.text(valueText, xPos + 3, kpiYPos + 15);

                    // Subtítulo
                    if (kpi.subtitle) {
                        pdf.setFontSize(7);
                        pdf.setTextColor(100, 116, 139);
                        const maxWidth = kpiWidth - 6;
                        const subtitleLines = pdf.splitTextToSize(kpi.subtitle, maxWidth);
                        pdf.text(subtitleLines, xPos + 3, kpiYPos + 20);
                    }
                }

                yPosition += Math.ceil(exportData.kpis.length / kpisPerRow) * (kpiHeight + 5) + 10;
            }

            // === MAPA ===
            if (exportData.mapData && exportData.mapData.image) {
                checkPageBreak(100);

                pdf.setFontSize(14);
                pdf.setTextColor(15, 23, 42);
                pdf.text(`Mapa - ${exportData.mapData.type}`, margin, yPosition);
                yPosition += 8;

                // Agregar imagen del mapa
                try {
                    const mapHeight = 120;
                    pdf.addImage(
                        exportData.mapData.image,
                        'PNG',
                        margin,
                        yPosition,
                        contentWidth,
                        mapHeight
                    );
                    yPosition += mapHeight + 10;

                    // Información del mapa
                    pdf.setFontSize(9);
                    pdf.setTextColor(100, 116, 139);
                    pdf.text(
                        `Centro: [${exportData.mapData.center[0].toFixed(4)}, ${exportData.mapData.center[1].toFixed(4)}] | Zoom: ${exportData.mapData.zoom} | Puntos: ${exportData.mapData.points.length}`,
                        margin,
                        yPosition
                    );
                    yPosition += 10;
                } catch (error) {
                    logger.error('Error agregando imagen de mapa al PDF', { error });
                }
            }

            // === GRÁFICOS ===
            if (exportData.charts && exportData.charts.length > 0) {
                for (const chart of exportData.charts) {
                    checkPageBreak(80);

                    pdf.setFontSize(12);
                    pdf.setTextColor(15, 23, 42);
                    pdf.text(chart.title, margin, yPosition);
                    yPosition += 8;

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
                }
            }

            // === TABLAS ===
            if (exportData.tables && exportData.tables.length > 0) {
                for (const table of exportData.tables) {
                    checkPageBreak(60);

                    pdf.setFontSize(12);
                    pdf.setTextColor(15, 23, 42);
                    pdf.text(table.title, margin, yPosition);
                    yPosition += 8;

                    // Dibujar tabla
                    const colWidth = contentWidth / table.headers.length;
                    const rowHeight = 7;

                    // Headers
                    pdf.setFillColor(241, 245, 249);
                    pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');
                    pdf.setFontSize(8);
                    pdf.setTextColor(71, 85, 105);

                    table.headers.forEach((header, i) => {
                        pdf.text(
                            header,
                            margin + i * colWidth + 2,
                            yPosition + 5
                        );
                    });
                    yPosition += rowHeight;

                    // Rows
                    pdf.setTextColor(15, 23, 42);
                    const maxRows = Math.min(table.rows.length, 20); // Limitar a 20 filas

                    for (let r = 0; r < maxRows; r++) {
                        checkPageBreak(rowHeight);

                        const row = table.rows[r];
                        if (row) {
                            row.forEach((cell: any, c: number) => {
                                pdf.text(
                                    String(cell),
                                    margin + c * colWidth + 2,
                                    yPosition + 5
                                );
                            });
                        }
                        yPosition += rowHeight;
                    }

                    if (table.rows.length > maxRows) {
                        pdf.setFontSize(8);
                        pdf.setTextColor(100, 116, 139);
                        pdf.text(
                            `... y ${table.rows.length - maxRows} filas más`,
                            margin,
                            yPosition + 3
                        );
                        yPosition += 8;
                    }

                    yPosition += 5;
                }
            }

            // === PIE DE PÁGINA ===
            const totalPages = pdf.internal.pages.length - 1;
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(150, 150, 150);
                pdf.text(
                    `Página ${i} de ${totalPages}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                pdf.text(
                    'StabilSafe V3 - DobackSoft',
                    pageWidth - margin,
                    pageHeight - 10,
                    { align: 'right' }
                );
            }

            // Guardar PDF
            const fileName = `${exportData.tabName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            logger.info('PDF generado exitosamente', { tabName: exportData.tabName, fileName });
        } catch (error) {
            logger.error('Error generando PDF', { error });
            throw error;
        }
    }

    /**
     * Exporta el dashboard completo (todas las pestañas)
     */
    async generateFullDashboardPDF(tabsData: TabExportData[]): Promise<void> {
        try {
            logger.info('Generando PDF completo del dashboard', { tabs: tabsData.length });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 15;
            let yPosition = margin;

            // Portada
            pdf.setFontSize(28);
            pdf.setTextColor(30, 58, 138);
            pdf.text('StabilSafe V3', pageWidth / 2, yPosition + 30, { align: 'center' });

            pdf.setFontSize(18);
            pdf.setTextColor(71, 85, 105);
            pdf.text('Reporte Completo del Dashboard', pageWidth / 2, yPosition + 45, { align: 'center' });

            pdf.setFontSize(10);
            pdf.setTextColor(100, 116, 139);
            const now = new Date();
            pdf.text(
                `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`,
                pageWidth / 2,
                yPosition + 55,
                { align: 'center' }
            );

            // Índice
            pdf.addPage();
            yPosition = margin;
            pdf.setFontSize(16);
            pdf.setTextColor(15, 23, 42);
            pdf.text('Índice de Contenidos', margin, yPosition);
            yPosition += 10;

            pdf.setFontSize(10);
            tabsData.forEach((tab, index) => {
                pdf.setTextColor(71, 85, 105);
                pdf.text(`${index + 1}. ${tab.tabName}`, margin + 5, yPosition);
                yPosition += 7;
            });

            // Generar cada pestaña en páginas separadas
            for (const tab of tabsData) {
                pdf.addPage();
                pdf.setFontSize(14);
                pdf.setTextColor(15, 23, 42);
                pdf.text(tab.tabName, margin, yPosition);
                yPosition += 10;
                // Aquí se puede reutilizar la lógica de generateTabPDF
                // pero escribiendo directamente en el PDF existente
            }

            // Guardar
            const fileName = `Dashboard_Completo_${now.toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            logger.info('PDF completo generado exitosamente', { fileName });
        } catch (error) {
            logger.error('Error generando PDF completo', { error });
            throw error;
        }
    }

    /**
     * Exporta datos tabulares a CSV
     */
    exportToCSV(data: any[], filename: string): void {
        try {
            if (!data || data.length === 0) {
                logger.warn('No hay datos para exportar a CSV');
                return;
            }

            // Obtener headers
            const headers = Object.keys(data[0]);

            // Crear CSV
            let csv = headers.join(',') + '\n';

            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // Escapar comillas y comas
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csv += values.join(',') + '\n';
            });

            // Descargar
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            logger.info('CSV exportado exitosamente', { filename });
        } catch (error) {
            logger.error('Error exportando CSV', { error });
            throw error;
        }
    }

    /**
     * Exporta datos a Excel
     */
    async exportToExcel(data: any[], filename: string): Promise<void> {
        // Esta función requiere la librería xlsx
        // Por ahora exportamos como CSV
        this.exportToCSV(data, filename);
    }
}

export const pdfExportService = new PDFExportService();

