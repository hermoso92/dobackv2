/**
 * 🪝 HOOK DE PROCESAMIENTO AUTOMÁTICO
 * 
 * Maneja la lógica de procesamiento automático de archivos de CMadrid
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import { useEffect, useRef, useState } from 'react';
import { FEATURE_FLAGS } from '../../../config/features';
import { apiService } from '../../../services/api';
import { logger } from '../../../utils/logger';

export function useAutoProcess() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);

    // Refs para cleanup
    const mountedRef = useRef(true);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleAutoProcess = async () => {
        // Rate limiting
        const lastProcessing = localStorage.getItem('lastProcessingTimestamp');
        if (lastProcessing) {
            const timeSince = Date.now() - parseInt(lastProcessing);
            if (timeSince < FEATURE_FLAGS.processingRateLimitMs) {
                const minutesLeft = Math.ceil((FEATURE_FLAGS.processingRateLimitMs - timeSince) / 60000);
                setError(`⏱️ Rate limit: Espera ${minutesLeft} minutos antes de procesar nuevamente`);
                return;
            }
        }

        setIsProcessing(true);
        setError(null);
        setResults(null);
        setProgress(0);

        try {
            logger.info('🚀 Iniciando procesamiento automático...');
            localStorage.setItem('lastProcessingTimestamp', Date.now().toString());

            // Leer config
            const savedConfig = localStorage.getItem('uploadConfig');
            const uploadConfig = savedConfig ? JSON.parse(savedConfig) : null;

            setProgress(10);

            const response = await apiService.post('/api/upload/process-all-cmadrid', {
                config: uploadConfig
            });

            if (response.success && (response.data as any)?.reportId) {
                const reportId = (response.data as any).reportId;
                logger.info(`📝 Procesamiento iniciado con reportId: ${reportId}`);

                setProgress(20);

                // Polling
                pollIntervalRef.current = setInterval(async () => {
                    if (!mountedRef.current) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        return;
                    }

                    try {
                        const statusResponse = await apiService.get(`/api/processing-reports/status/${reportId}`);

                        if (statusResponse.success && (statusResponse as any).report) {
                            const report = (statusResponse as any).report;

                            if (report.status === 'COMPLETED') {
                                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                setProgress(100);
                                setResults(report.reportData);
                                setShowReportModal(true);
                                logger.info('✅ Procesamiento completado');
                            } else if (report.status === 'FAILED') {
                                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                setError(report.errorMessage || 'Error en el procesamiento');
                                setProgress(0);
                            } else if (report.status === 'PROCESSING') {
                                setProgress(prev => Math.min(prev + 5, 90));
                            }
                        }
                    } catch (error) {
                        logger.error('Error en polling:', error);
                    }
                }, 5000);

                // Timeout de seguridad
                timeoutRef.current = setTimeout(() => {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    if (mountedRef.current && results === null) {
                        setError('Timeout: El procesamiento está tardando más de lo esperado.');
                        setIsProcessing(false);
                    }
                }, 900000); // 15 min

            } else if (response.success) {
                setProgress(100);
                setResults(response.data);
                setShowReportModal(true);
                localStorage.setItem('lastProcessingReport', JSON.stringify(response.data));
            } else {
                setError(response.error || 'Error en el procesamiento automático');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Error de conexión';
            setError(errorMessage);
            logger.error('Error en procesamiento automático:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewLastReport = async () => {
        try {
            const response = await apiService.get('/api/processing-reports/latest');
            if (response.success && (response as any).report) {
                setResults((response as any).report);
                setShowReportModal(true);
            } else {
                setError('No se encontró ningún reporte previo');
            }
        } catch (error: any) {
            setError(error?.message || 'Error al cargar el reporte');
        }
    };

    return {
        isProcessing,
        progress,
        results,
        error,
        showReportModal,
        setShowReportModal,
        handleAutoProcess,
        handleViewLastReport
    };
}

