import { logger } from '../utils/logger';
import { apiService } from './api';

export interface PDFExportOptions {
    format?: 'pdf' | 'excel' | 'csv';
    includeCharts?: boolean;
    includeMaps?: boolean;
    includeEvents?: boolean;
    includeKPIs?: boolean;
    includeHeatmap?: boolean;
    includeRecommendations?: boolean;
    dateRange?: {
        start: string;
        end: string;
    };
    filters?: Record<string, any>;
    organizationId?: string;
}

export interface PDFExportResult {
    success: boolean;
    data?: Blob;
    url?: string;
    fileName?: string;
    error?: string;
}

export class PDFExportService {
    /**
     * Exporta datos del dashboard ejecutivo a PDF
     */
    static async exportDashboardPDF(options: PDFExportOptions = {}): Promise<PDFExportResult> {
        try {
            logger.info('Exportando dashboard a PDF', { options });

            const response = await apiService.post('/api/reports/dashboard-pdf', {
                type: 'executive_dashboard',
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `dashboard-ejecutivo-${new Date().toISOString().split('T')[0]}.pdf`;

                return {
                    success: true,
                    data: blob,
                    fileName
                };
            }

            throw new Error('No se pudo generar el PDF del dashboard');
        } catch (error) {
            logger.error('Error exportando dashboard a PDF', { error, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta datos de telemetría a PDF
     */
    static async exportTelemetryPDF(sessionId: string, options: PDFExportOptions = {}): Promise<PDFExportResult> {
        try {
            logger.info('Exportando telemetría a PDF', { sessionId, options });

            const response = await apiService.post(`/api/telemetry-v2/sessions/${sessionId}/export/pdf`, {
                includeHeatmap: options.includeHeatmap ?? true,
                includeEvents: options.includeEvents ?? true,
                includeKPIs: options.includeKPIs ?? true,
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `telemetria-sesion-${sessionId}-${new Date().toISOString().split('T')[0]}.pdf`;

                return {
                    success: true,
                    data: blob,
                    fileName
                };
            }

            throw new Error('No se pudo generar el PDF de telemetría');
        } catch (error) {
            logger.error('Error exportando telemetría a PDF', { error, sessionId, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta datos de estabilidad a PDF
     */
    static async exportStabilityPDF(sessionId: string, options: PDFExportOptions = {}): Promise<PDFExportResult> {
        try {
            logger.info('Exportando estabilidad a PDF', { sessionId, options });

            const response = await apiService.post(`/api/stability/export/${sessionId}`, {
                includeCharts: options.includeCharts ?? true,
                includeEvents: options.includeEvents ?? true,
                includeRecommendations: options.includeRecommendations ?? true,
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `estabilidad-sesion-${sessionId}-${new Date().toISOString().split('T')[0]}.pdf`;

                return {
                    success: true,
                    data: blob,
                    fileName
                };
            }

            throw new Error('No se pudo generar el PDF de estabilidad');
        } catch (error) {
            logger.error('Error exportando estabilidad a PDF', { error, sessionId, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta análisis de velocidad a PDF
     */
    static async exportSpeedAnalysisPDF(events: any[], options: PDFExportOptions = {}): Promise<PDFExportResult> {
        try {
            logger.info('Exportando análisis de velocidad a PDF', { eventsCount: events.length, options });

            const response = await apiService.post('/api/reports/speed-analysis-pdf', {
                events,
                includeCharts: options.includeCharts ?? true,
                includeMaps: options.includeMaps ?? true,
                includeRecommendations: options.includeRecommendations ?? true,
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `analisis-velocidad-${new Date().toISOString().split('T')[0]}.pdf`;

                return {
                    success: true,
                    data: blob,
                    fileName
                };
            }

            throw new Error('No se pudo generar el PDF de análisis de velocidad');
        } catch (error) {
            logger.error('Error exportando análisis de velocidad a PDF', { error, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta eventos a PDF
     */
    static async exportEventsPDF(events: any[], options: PDFExportOptions = {}): Promise<PDFExportResult> {
        try {
            logger.info('Exportando eventos a PDF', { eventsCount: events.length, options });

            const response = await apiService.post('/api/reports/events-pdf', {
                events,
                includeMaps: options.includeMaps ?? true,
                includeCharts: options.includeCharts ?? true,
                filters: options.filters,
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `eventos-${new Date().toISOString().split('T')[0]}.pdf`;

                return {
                    success: true,
                    data: blob,
                    fileName
                };
            }

            throw new Error('No se pudo generar el PDF de eventos');
        } catch (error) {
            logger.error('Error exportando eventos a PDF', { error, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Exporta KPIs avanzados a PDF
     */
    static async exportKPIsPDF(options: PDFExportOptions = {}): Promise<PDFExportResult> {
        try {
            logger.info('Exportando KPIs a PDF', { options });

            const response = await apiService.post('/api/reports/kpis-pdf', {
                includeCharts: options.includeCharts ?? true,
                includeRecommendations: options.includeRecommendations ?? true,
                dateRange: options.dateRange,
                filters: options.filters,
                ...options
            }, {
                responseType: 'blob'
            });

            if (response.success && response.data) {
                const blob = response.data as Blob;
                const fileName = `kpis-avanzados-${new Date().toISOString().split('T')[0]}.pdf`;

                return {
                    success: true,
                    data: blob,
                    fileName
                };
            }

            throw new Error('No se pudo generar el PDF de KPIs');
        } catch (error) {
            logger.error('Error exportando KPIs a PDF', { error, options });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Descarga un archivo PDF desde un blob
     */
    static downloadPDF(blob: Blob, fileName: string): void {
        try {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            logger.info('PDF descargado exitosamente', { fileName });
        } catch (error) {
            logger.error('Error descargando PDF', { error, fileName });
            throw error;
        }
    }

    /**
     * Abre un PDF en una nueva ventana
     */
    static openPDF(blob: Blob, fileName: string): void {
        try {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Limpiar URL después de un tiempo
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 10000);

            logger.info('PDF abierto en nueva ventana', { fileName });
        } catch (error) {
            logger.error('Error abriendo PDF', { error, fileName });
            throw error;
        }
    }
}
