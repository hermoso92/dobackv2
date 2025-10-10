import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';

export const useProcessStabilityEvents = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const response = await api.post(`/api/stability/events/process-session/${sessionId}`);
            return response.data;
        },
        onSuccess: (data, sessionId) => {
            logger.info('Eventos de estabilidad procesados', {
                sessionId,
                eventsCount: data.eventsCount,
                message: data.message
            });

            // Invalidar la caché de eventos para esta sesión
            queryClient.invalidateQueries({
                queryKey: ['stability-events', sessionId]
            });
        },
        onError: (error, sessionId) => {
            logger.error('Error al procesar eventos de estabilidad', {
                error,
                sessionId
            });
        }
    });
}; 