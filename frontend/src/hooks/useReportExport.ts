import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ReportsAPI } from '../api/reports';

interface UseReportExportOptions {
    onSuccess?: (result: any) => void;
    onError?: (error: Error) => void;
}

export const useReportExport = (options?: UseReportExportOptions) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const exportStabilityReport = async (config: any) => {
        setIsExporting(true);
        setExportProgress(0);

        try {
            toast.loading('Generando reporte de estabilidad...', { id: 'stability-report' });

            const result = await ReportsAPI.generateReport('stability', config, {});

            toast.dismiss('stability-report');
            toast.success('Reporte de estabilidad generado correctamente');

            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            toast.dismiss('stability-report');
            const errorMessage = error instanceof Error ? error.message : 'Error generando reporte';
            toast.error(errorMessage);
            options?.onError?.(error as Error);
            throw error;
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const exportTelemetryReport = async (config: any) => {
        setIsExporting(true);
        setExportProgress(0);

        try {
            toast.loading('Generando reporte de telemetría...', { id: 'telemetry-report' });

            const result = await ReportsAPI.generateReport('telemetry', config, {});

            toast.dismiss('telemetry-report');
            toast.success('Reporte de telemetría generado correctamente');

            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            toast.dismiss('telemetry-report');
            const errorMessage = error instanceof Error ? error.message : 'Error generando reporte';
            toast.error(errorMessage);
            options?.onError?.(error as Error);
            throw error;
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const exportKpiReport = async (config: any) => {
        setIsExporting(true);
        setExportProgress(0);

        try {
            toast.loading('Generando reporte de KPIs...', { id: 'kpi-report' });

            const result = await ReportsAPI.generateReport('panel', config, {});

            toast.dismiss('kpi-report');
            toast.success('Reporte de KPIs generado correctamente');

            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            toast.dismiss('kpi-report');
            const errorMessage = error instanceof Error ? error.message : 'Error generando reporte';
            toast.error(errorMessage);
            options?.onError?.(error as Error);
            throw error;
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const exportComparisonReport = async (sessionId1: string, sessionId2: string, config?: any) => {
        setIsExporting(true);
        setExportProgress(0);

        try {
            toast.loading('Generando reporte de comparación...', { id: 'comparison-report' });

            const result = await ReportsAPI.generateReport('comparative', config || {}, {});

            toast.dismiss('comparison-report');
            toast.success('Reporte de comparación generado correctamente');

            options?.onSuccess?.(result);
            return result;
        } catch (error) {
            toast.dismiss('comparison-report');
            const errorMessage = error instanceof Error ? error.message : 'Error generando reporte';
            toast.error(errorMessage);
            options?.onError?.(error as Error);
            throw error;
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const downloadReport = async (reportId: string) => {
        try {
            toast.loading('Descargando reporte...', { id: 'download-report' });

            await ReportsAPI.downloadReport(reportId);

            toast.dismiss('download-report');
            toast.success('Reporte descargado correctamente');
        } catch (error) {
            toast.dismiss('download-report');
            const errorMessage = error instanceof Error ? error.message : 'Error descargando reporte';
            toast.error(errorMessage);
            throw error;
        }
    };

    return {
        isExporting,
        exportProgress,
        exportStabilityReport,
        exportTelemetryReport,
        exportKpiReport,
        exportComparisonReport,
        downloadReport
    };
};
