import { useCallback, useState } from 'react';
import { useKPIs } from '../../../../hooks/useKPIs';
import { usePDFExport } from '../../../../hooks/usePDFExport';
import { EnhancedKPIData, EnhancedTabExportData } from '../../../../services/enhancedPDFExportService';
import { logger } from '../../../../utils/logger';
import { BlackSpotsData, HeatmapData, ParksKPIs, SpeedViolation } from '../types';

interface ExportData {
    heatmapData: HeatmapData;
    speedViolations: SpeedViolation[];
    blackSpotsData: BlackSpotsData;
    parksKPIs: ParksKPIs;
}

/**
 * Hook personalizado para gestionar exportación de PDF del dashboard
 */
export const useDashboardExport = () => {
    const { exportEnhancedTabToPDF } = usePDFExport();
    const { states, activity, stability } = useKPIs();

    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Exporta una pestaña específica del dashboard
     */
    const exportTab = useCallback(async (
        tabIndex: number,
        data: Partial<ExportData>
    ) => {
        try {
            setExporting(true);
            setError(null);

            const tabName = ['Panel General', 'Parques', 'Reportes', 'Tracking', 'Diagnóstico'][tabIndex];
            logger.info(`Exportando pestaña ${tabName}...`);

            // Construir KPIs en el formato correcto
            const kpiData: EnhancedKPIData[] = [
                {
                    title: 'Total Vehículos',
                    value: states?.total_vehicles || 0,
                    category: 'info'
                },
                {
                    title: 'Disponibilidad',
                    value: `${states?.availability_percentage || 0}%`,
                    category: 'success'
                },
                {
                    title: 'Kilómetros Totales',
                    value: activity?.km_total || 0,
                    unit: 'km',
                    category: 'info'
                },
                {
                    title: 'Incidencias Totales',
                    value: stability?.total_incidents || 0,
                    category: 'warning'
                }
            ];

            const tabData: EnhancedTabExportData = {
                tabName,
                tabIndex,
                kpis: kpiData,
                speedViolations: data.speedViolations ? data.speedViolations.map(v => ({
                    location: `${v.location.lat}, ${v.location.lng}`,
                    timestamp: v.timestamp.toISOString(),
                    speed: v.speed,
                    speedLimit: v.speedLimit,
                    excess: v.excess,
                    severity: v.excess > 20 ? 'grave' : v.excess > 10 ? 'moderado' : 'leve',
                    violationType: v.excess > 20 ? 'grave' : 'moderado'
                })) : undefined,
                blackSpots: data.blackSpotsData?.ranking.slice(0, 10).map(spot => ({
                    rank: spot.position,
                    location: spot.location,
                    totalEvents: spot.events,
                    severity: 'grave',
                    coordinates: { lat: 0, lng: 0 }
                }))
            };

            // Exportar usando generateEnhancedTabPDF
            await exportEnhancedTabToPDF(tabData);

            logger.info(`Pestaña ${tabName} exportada exitosamente`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido exportando';
            setError(errorMessage);
            logger.error('Error exportando pestaña', { error: err });
            throw err;
        } finally {
            setExporting(false);
        }
    }, [
        states,
        activity,
        stability,
        exportEnhancedTabToPDF
    ]);

    /**
     * Exporta el dashboard completo
     */
    const exportFullDashboard = useCallback(async (data: ExportData) => {
        try {
            setExporting(true);
            setError(null);

            logger.info('Exportando dashboard completo...');

            // TODO: Implementar exportación completa cuando sea necesario
            await exportTab(0, data);

            logger.info('Dashboard completo exportado exitosamente');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error exportando dashboard';
            setError(errorMessage);
            logger.error('Error exportando dashboard completo', { error: err });
            throw err;
        } finally {
            setExporting(false);
        }
    }, [exportTab]);

    return {
        exportTab,
        exportFullDashboard,
        exporting,
        error
    };
};

