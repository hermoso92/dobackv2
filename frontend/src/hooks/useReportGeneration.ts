import { useState } from 'react';
import { downloadReport, generateReport } from '../services/reports';

export function useReportGeneration(token: string) {
    const [reportId, setReportId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestReport = async (params: any) => {
        setLoading(true);
        setError(null);
        setReportId(null);
        try {
            const result = await generateReport(params, token);
            setReportId(result.id || result.reportId);
        } catch (err: any) {
            setError(err.message || 'Error al generar informe');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!reportId) return;
        try {
            const blob = await downloadReport(reportId, token);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `informe_${reportId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Error al descargar informe');
        }
    };

    return { reportId, loading, error, requestReport, downloadReport: handleDownload };
} 