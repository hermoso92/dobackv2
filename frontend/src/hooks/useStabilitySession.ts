import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface StabilitySessionResponse {
    success: boolean;
    data: {
        sessionId: string;
        vehicleId: string;
        startTime: string;
        endTime: string;
        measurements: Array<{
            timestamp: string;
            ax: number;
            ay: number;
            az: number;
            gx: number;
            gy: number;
            gz: number;
            roll: number;
            pitch: number;
            yaw: number;
            timeantwifi: number;
            usciclo1: number;
            usciclo2: number;
            usciclo3: number;
            usciclo4: number;
            usciclo5: number;
            si: number;
            accmag: number;
            microsds: number;
        }>;
    };
}

export const useStabilitySession = (sessionId: string) => {
    return useQuery({
        queryKey: ['stability-session', sessionId],
        queryFn: async () => {
            const response = await api.get<StabilitySessionResponse>(
                `/api/stability/session/${sessionId}/data`
            );

            // Procesar los datos para la gráfica
            const processedData = {
                ...response.data,
                data: {
                    ...response.data.data,
                    measurements: response.data.data.measurements.map(m => ({
                        ...m,
                        timestamp: new Date(m.timestamp).getTime(),
                        ltr: m.metrics?.ltr || 0,
                        ssf: m.metrics?.ssf || 0,
                        drs: m.metrics?.drs || 0,
                        roll: m.roll || 0,
                        pitch: m.pitch || 0,
                        yaw: m.yaw || 0,
                        ax: m.ax || 0,
                        ay: m.ay || 0,
                        az: m.az || 0,
                        gx: m.gx || 0,
                        gy: m.gy || 0,
                        gz: m.gz || 0,
                        accmag: m.accmag || 0,
                        si: m.si || 0
                    }))
                }
            };

            logger.info('Datos procesados:', {
                totalMeasurements: processedData.data.measurements.length,
                firstTimestamp: new Date(processedData.data.measurements[0]?.timestamp).toLocaleString(),
                lastTimestamp: new Date(processedData.data.measurements[processedData.data.measurements.length - 1]?.timestamp).toLocaleString()
            });

            return processedData;
        },
        enabled: !!sessionId,
    });
}; 