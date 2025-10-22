import { useCallback, useState } from 'react';
import { enhancedPDFExportService, EnhancedTabExportData } from '../services/enhancedPDFExportService';
import { pdfExportService, TabExportData } from '../services/pdfExportService';
import { logger } from '../utils/logger';
import { useAuth } from './useAuth';
import { useGlobalFilters } from './useGlobalFilters';

export const usePDFExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const { filters } = useGlobalFilters();
    const { user } = useAuth();

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

    /**
     * Exporta una pestaña con el servicio mejorado
     */
    const exportEnhancedTabToPDF = useCallback(async (exportData: EnhancedTabExportData) => {
        try {
            setIsExporting(true);
            setExportError(null);

            // Agregar filtros globales y usuario al exportData
            exportData.filters = {
                ...exportData.filters,
                vehicle: filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles.join(', ') : undefined,
                dateRange: filters.dateRange?.start && filters.dateRange?.end ? {
                    start: new Date(filters.dateRange.start).toLocaleDateString('es-ES'),
                    end: new Date(filters.dateRange.end).toLocaleDateString('es-ES')
                } : undefined
            };

            exportData.generatedBy = user?.username || 'Usuario';

            await enhancedPDFExportService.generateEnhancedTabPDF(exportData);

            logger.info('PDF mejorado exportado exitosamente', { tabName: exportData.tabName });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al exportar PDF';
            setExportError(errorMessage);
            logger.error('Error exportando PDF mejorado', { error });
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, [filters, user]);

    /**
     * Captura elemento con el servicio mejorado (mayor calidad)
     */
    const captureElementEnhanced = useCallback(async (elementId: string, scale: number = 3): Promise<string | null> => {
        try {
            return await enhancedPDFExportService.captureElement(elementId, scale);
        } catch (error) {
            logger.error('Error capturando elemento mejorado', { elementId, error });
            return null;
        }
    }, []);

    /**
     * Exporta reporte individual de un vehículo
     */
    const exportVehicleReport = useCallback(async (vehicleData: {
        vehicleName: string;
        vehicleId: string;
        totalEvents: number;
        speedViolations: any[];
        stabilityEvents?: any[];
        period: { start: string; end: string };
        stats: {
            totalKm: number;
            totalHours: string;
            avgSpeed: number;
            rotativoPercentage: number;
        };
    }) => {
        try {
            setIsExporting(true);
            setExportError(null);

            await enhancedPDFExportService.generateVehicleReport(vehicleData);

            logger.info('PDF de vehiculo exportado exitosamente', { vehicleName: vehicleData.vehicleName });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al exportar vehiculo';
            setExportError(errorMessage);
            logger.error('Error exportando PDF de vehiculo', { error });
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, []);

    /**
     * Exporta reporte de recorrido completo con mapa
     */
    const exportRouteReport = useCallback(async (routeData: {
        sessionId: string;
        vehicleName: string;
        startTime: string;
        endTime: string;
        duration: string;
        distance: number;
        avgSpeed: number;
        maxSpeed: number;
        route: Array<{ lat: number; lng: number; speed: number; timestamp: Date }>;
        events: Array<{ id: string; lat: number; lng: number; type: string; severity: string; timestamp: Date; location?: string }>;
        stats: {
            validRoutePoints: number;
            validEvents: number;
            totalGpsPoints: number;
            totalEvents: number;
        };
        mapImage?: string;
    }) => {
        try {
            setIsExporting(true);
            setExportError(null);

            await enhancedPDFExportService.generateRouteReport(routeData);

            logger.info('PDF de recorrido exportado exitosamente', { sessionId: routeData.sessionId });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al exportar recorrido';
            setExportError(errorMessage);
            logger.error('Error exportando PDF de recorrido', { error });
            throw error;
        } finally {
            setIsExporting(false);
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
        exportToExcel,
        // Nuevas funciones mejoradas
        exportEnhancedTabToPDF,
        captureElementEnhanced,
        exportVehicleReport,
        exportRouteReport
    };
};
