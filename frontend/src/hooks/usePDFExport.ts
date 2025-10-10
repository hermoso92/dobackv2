import { useCallback, useState } from 'react';
import { pdfExportService, TabExportData } from '../services/pdfExportService';
import { logger } from '../utils/logger';
import { useGlobalFilters } from './useGlobalFilters';

export const usePDFExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const { filters } = useGlobalFilters();

    /**
     * Exporta una pestaña específica a PDF
     */
    const exportTabToPDF = useCallback(async (exportData: TabExportData) => {
        try {
            setIsExporting(true);
            setExportError(null);

            // Agregar filtros globales al exportData
            exportData.filters = {
                ...exportData.filters,
                vehicle: filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles.join(', ') : undefined,
                dateRange: filters.dateRange?.start && filters.dateRange?.end ? {
                    start: new Date(filters.dateRange.start).toLocaleDateString('es-ES'),
                    end: new Date(filters.dateRange.end).toLocaleDateString('es-ES')
                } : undefined
            };

            await pdfExportService.generateTabPDF(exportData);

            logger.info('PDF exportado exitosamente', { tabName: exportData.tabName });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al exportar PDF';
            setExportError(errorMessage);
            logger.error('Error exportando PDF', { error });
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, [filters]);

    /**
     * Exporta el dashboard completo a PDF
     */
    const exportFullDashboard = useCallback(async (tabsData: TabExportData[]) => {
        try {
            setIsExporting(true);
            setExportError(null);

            // Agregar filtros a todas las pestañas
            const tabsWithFilters = tabsData.map(tab => ({
                ...tab,
                filters: {
                    ...tab.filters,
                    vehicle: filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles.join(', ') : undefined,
                    dateRange: filters.dateRange?.start && filters.dateRange?.end ? {
                        start: new Date(filters.dateRange.start).toLocaleDateString('es-ES'),
                        end: new Date(filters.dateRange.end).toLocaleDateString('es-ES')
                    } : undefined
                }
            }));

            await pdfExportService.generateFullDashboardPDF(tabsWithFilters);

            logger.info('Dashboard completo exportado exitosamente');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al exportar dashboard completo';
            setExportError(errorMessage);
            logger.error('Error exportando dashboard completo', { error });
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, [filters]);

    /**
     * Captura un elemento HTML y lo prepara para exportación
     */
    const captureElement = useCallback(async (elementId: string): Promise<string | null> => {
        try {
            return await pdfExportService.captureElement(elementId);
        } catch (error) {
            logger.error('Error capturando elemento', { elementId, error });
            return null;
        }
    }, []);

    /**
     * Captura múltiples elementos HTML
     */
    const captureElements = useCallback(async (elementIds: string[]): Promise<{ [key: string]: string }> => {
        try {
            return await pdfExportService.captureElements(elementIds);
        } catch (error) {
            logger.error('Error capturando elementos', { elementIds, error });
            return {};
        }
    }, []);

    /**
     * Exporta datos a CSV
     */
    const exportToCSV = useCallback((data: any[], filename: string) => {
        try {
            pdfExportService.exportToCSV(data, filename);
            logger.info('Datos exportados a CSV', { filename });
        } catch (error) {
            logger.error('Error exportando a CSV', { error });
            throw error;
        }
    }, []);

    /**
     * Exporta datos a Excel
     */
    const exportToExcel = useCallback(async (data: any[], filename: string) => {
        try {
            await pdfExportService.exportToExcel(data, filename);
            logger.info('Datos exportados a Excel', { filename });
        } catch (error) {
            logger.error('Error exportando a Excel', { error });
            throw error;
        }
    }, []);

    return {
        isExporting,
        exportError,
        exportTabToPDF,
        exportFullDashboard,
        captureElement,
        captureElements,
        exportToCSV,
        exportToExcel
    };
};
