import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

interface ExportParams {
    sessionId: string;
    filters?: {
        speedFilter?: 'all' | '40' | '60' | '80' | '100' | '120' | '140';
        rpmFilter?: 'all' | '1500' | '2000' | '2500';
        rotativoOnly?: boolean;
        selectedTypes?: string[];
    };
}

export const useStabilityExport = () => {
    return useMutation({
        mutationFn: async (params: ExportParams) => {
            // 1. Crear reporte (devuelve 202 Accepted)
            const createResponse = await api.post('/api/reports', params);
            const reportId = createResponse.data.id;

            // 2. Esperar y descargar el archivo con polling optimizado
            const maxAttempts = 60; // 60 segundos máximo
            const initialDelay = 2000; // Esperar 2 segundos antes del primer intento
            const pollInterval = 3000; // Polling cada 3 segundos

            // Esperar inicialmente
            await new Promise(resolve => setTimeout(resolve, initialDelay));

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                    const downloadResponse = await api.get(`/api/reports/${reportId}/file`, {
                        responseType: 'blob',
                    });
                    return downloadResponse.data;
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        // Reporte aún no está listo, esperar antes del siguiente intento
                        if (attempt < maxAttempts - 1) {
                            await new Promise(resolve => setTimeout(resolve, pollInterval));
                        }
                        continue;
                    }
                    throw error;
                }
            }
            throw new Error('Timeout: el reporte no se generó en el tiempo esperado (60 segundos)');
        },
    });
}; 