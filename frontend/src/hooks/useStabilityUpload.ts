import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { StabilityUploadResponse } from '../types/stability';
import { logger } from '../utils/logger';

interface StabilityUploadParams {
    vehicleId: string;
    file: File;
    sessionId?: string;
}

export const useStabilityUpload = () => {
    return useMutation({
        mutationFn: async ({ vehicleId, file, sessionId }: StabilityUploadParams) => {
            logger.info('Iniciando subida de archivo de estabilidad', {
                vehicleId,
                fileName: file.name,
                fileSize: file.size,
                sessionId
            });

            const formData = new FormData();
            formData.append('vehicleId', vehicleId);
            formData.append('file', file);
            if (sessionId) {
                formData.append('sessionId', sessionId);
            }

            try {
                const response = await api.post<{ data: StabilityUploadResponse }>(
                    '/api/stability/upload',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                logger.info('Archivo subido exitosamente', {
                    response: response.data
                });

                return response.data;
            } catch (error) {
                logger.error('Error al subir archivo', {
                    error,
                    vehicleId,
                    fileName: file.name
                });
                throw error;
            }
        },
    });
}; 