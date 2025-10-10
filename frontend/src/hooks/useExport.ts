import { useCallback, useState } from 'react';
import { CSVExportOptions, CSVExportService } from '../services/csvExport';
import { PDFExportOptions, PDFExportService } from '../services/pdfExport';
import { logger } from '../utils/logger';

export interface ExportOptions {
    format: 'CSV' | 'PDF';
    includeGPS?: boolean;
    includeCAN?: boolean;
    includeStability?: boolean;
    includeRotativo?: boolean;
    includeEvents?: boolean;
    includeCharts?: boolean;
    includeMaps?: boolean;
    includeRecommendations?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    vehicleIds?: string[];
}

export interface UseExportReturn {
    isExporting: boolean;
    error: string | null;
    exportTelemetry: (options: ExportOptions) => Promise<void>;
    exportSession: (sessionId: string, options: ExportOptions) => Promise<void>;
    exportEvents: (options: ExportOptions) => Promise<void>;
    clearError: () => void;
}

export const useExport = (): UseExportReturn => {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const exportTelemetry = useCallback(async (options: ExportOptions) => {
        setIsExporting(true);
        setError(null);

        try {
            logger.info('Iniciando exportación de telemetría', { options });

            if (options.format === 'CSV') {
                const csvOptions: CSVExportOptions = {
                    vehicleIds: options.vehicleIds,
                    startDate: options.dateRange?.start,
                    endDate: options.dateRange?.end,
                    includeGPS: options.includeGPS,
                    includeCAN: options.includeCAN,
                    includeStability: options.includeStability,
                    includeRotativo: options.includeRotativo,
                    includeEvents: options.includeEvents
                };

                const result = await CSVExportService.exportTelemetryCSV(csvOptions);

                if (!result.success) {
                    throw new Error(result.error || 'Error exportando a CSV');
                }

                logger.info('Exportación CSV de telemetría completada', { fileName: result.fileName });
            } else if (options.format === 'PDF') {
                const pdfOptions: PDFExportOptions = {
                    includeCharts: options.includeCharts,
                    includeMaps: options.includeMaps,
                    includeEvents: options.includeEvents,
                    includeRecommendations: options.includeRecommendations,
                    dateRange: options.dateRange ? {
                        start: options.dateRange.start.toISOString(),
                        end: options.dateRange.end.toISOString()
                    } : undefined,
                    filters: {
                        vehicleIds: options.vehicleIds
                    }
                };

                const result = await PDFExportService.exportTelemetryPDF('', pdfOptions);

                if (!result.success) {
                    throw new Error(result.error || 'Error exportando a PDF');
                }

                logger.info('Exportación PDF de telemetría completada', { fileName: result.fileName });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido en exportación';
            setError(errorMessage);
            logger.error('Error en exportación de telemetría', { error: err, options });
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportSession = useCallback(async (sessionId: string, options: ExportOptions) => {
        setIsExporting(true);
        setError(null);

        try {
            logger.info('Iniciando exportación de sesión', { sessionId, options });

            if (options.format === 'CSV') {
                const csvOptions: CSVExportOptions = {
                    vehicleIds: options.vehicleIds,
                    includeGPS: options.includeGPS,
                    includeCAN: options.includeCAN,
                    includeStability: options.includeStability,
                    includeRotativo: options.includeRotativo,
                    includeEvents: options.includeEvents
                };

                const result = await CSVExportService.exportSessionCSV(sessionId, csvOptions);

                if (!result.success) {
                    throw new Error(result.error || 'Error exportando sesión a CSV');
                }

                logger.info('Exportación CSV de sesión completada', { sessionId, fileName: result.fileName });
            } else if (options.format === 'PDF') {
                const pdfOptions: PDFExportOptions = {
                    includeCharts: options.includeCharts,
                    includeMaps: options.includeMaps,
                    includeEvents: options.includeEvents,
                    includeRecommendations: options.includeRecommendations
                };

                const result = await PDFExportService.exportTelemetryPDF(sessionId, pdfOptions);

                if (!result.success) {
                    throw new Error(result.error || 'Error exportando sesión a PDF');
                }

                logger.info('Exportación PDF de sesión completada', { sessionId, fileName: result.fileName });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido en exportación';
            setError(errorMessage);
            logger.error('Error en exportación de sesión', { error: err, sessionId, options });
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportEvents = useCallback(async (options: ExportOptions) => {
        setIsExporting(true);
        setError(null);

        try {
            logger.info('Iniciando exportación de eventos', { options });

            if (options.format === 'CSV') {
                const csvOptions: CSVExportOptions = {
                    vehicleIds: options.vehicleIds,
                    startDate: options.dateRange?.start,
                    endDate: options.dateRange?.end
                };

                const result = await CSVExportService.exportEventsCSV(csvOptions);

                if (!result.success) {
                    throw new Error(result.error || 'Error exportando eventos a CSV');
                }

                logger.info('Exportación CSV de eventos completada', { fileName: result.fileName });
            } else if (options.format === 'PDF') {
                // Para PDF de eventos necesitamos obtener los eventos primero
                // Esto se implementaría según los datos disponibles
                const pdfOptions: PDFExportOptions = {
                    includeCharts: options.includeCharts,
                    includeMaps: options.includeMaps,
                    includeEvents: true,
                    includeRecommendations: options.includeRecommendations,
                    dateRange: options.dateRange ? {
                        start: options.dateRange.start.toISOString(),
                        end: options.dateRange.end.toISOString()
                    } : undefined,
                    filters: {
                        vehicleIds: options.vehicleIds
                    }
                };

                // Usar el servicio de exportación de eventos existente
                const result = await PDFExportService.exportEventsPDF([], pdfOptions);

                if (!result.success) {
                    throw new Error(result.error || 'Error exportando eventos a PDF');
                }

                logger.info('Exportación PDF de eventos completada', { fileName: result.fileName });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido en exportación';
            setError(errorMessage);
            logger.error('Error en exportación de eventos', { error: err, options });
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        isExporting,
        error,
        exportTelemetry,
        exportSession,
        exportEvents,
        clearError
    };
};
