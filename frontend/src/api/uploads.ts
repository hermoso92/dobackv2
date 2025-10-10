import { apiService } from '../services/api';
import {
    UploadApiResponse,
    UploadBatchDTO,
    UploadBatchParams,
    UploadConfig,
    UploadFilters,
    UploadProgress,
    UploadSettings,
    UploadStats,
    VehicleCreationAssistant
} from '../types/uploads';
import { logger } from '../utils/logger';

export class UploadsAPI {
    // Obtener lotes de subida
    static async getBatches(params: UploadBatchParams = {}): Promise<UploadBatchDTO[]> {
        try {
            const response = await apiService.get<UploadApiResponse<UploadBatchDTO[]>>(
                '/api/uploads/batches',
                { params }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo lotes de subida');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo lotes de subida', { error, params });
            throw error;
        }
    }

    // Obtener lote específico
    static async getBatch(batchId: string): Promise<UploadBatchDTO> {
        try {
            const response = await apiService.get<UploadApiResponse<UploadBatchDTO>>(
                `/api/uploads/batches/${batchId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo lote de subida');
            }

            if (!response.data.data) {
                throw new Error('Lote no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo lote de subida', { error, batchId });
            throw error;
        }
    }

    // Crear nuevo lote de subida
    static async createBatch(config: UploadConfig): Promise<UploadBatchDTO> {
        try {
            const response = await apiService.post<UploadApiResponse<UploadBatchDTO>>(
                '/api/uploads/batches',
                config
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error creando lote de subida');
            }

            if (!response.data.data) {
                throw new Error('Error al crear el lote de subida');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error creando lote de subida', { error, config });
            throw error;
        }
    }

    // Iniciar procesamiento de lote
    static async startBatch(batchId: string): Promise<void> {
        try {
            const response = await apiService.post<UploadApiResponse<void>>(
                `/api/uploads/batches/${batchId}/start`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error iniciando procesamiento');
            }
        } catch (error) {
            logger.error('Error iniciando procesamiento de lote', { error, batchId });
            throw error;
        }
    }

    // Cancelar lote
    static async cancelBatch(batchId: string): Promise<void> {
        try {
            const response = await apiService.post<UploadApiResponse<void>>(
                `/api/uploads/batches/${batchId}/cancel`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error cancelando lote');
            }
        } catch (error) {
            logger.error('Error cancelando lote', { error, batchId });
            throw error;
        }
    }

    // Reintentar archivo fallido
    static async retryFile(batchId: string, fileId: string): Promise<void> {
        try {
            const response = await apiService.post<UploadApiResponse<void>>(
                `/api/uploads/batches/${batchId}/files/${fileId}/retry`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error reintentando archivo');
            }
        } catch (error) {
            logger.error('Error reintentando archivo', { error, batchId, fileId });
            throw error;
        }
    }

    // Descartar archivo
    static async discardFile(batchId: string, fileId: string): Promise<void> {
        try {
            const response = await apiService.post<UploadApiResponse<void>>(
                `/api/uploads/batches/${batchId}/files/${fileId}/discard`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error descartando archivo');
            }
        } catch (error) {
            logger.error('Error descartando archivo', { error, batchId, fileId });
            throw error;
        }
    }

    // Obtener progreso de lote
    static async getBatchProgress(batchId: string): Promise<UploadProgress> {
        try {
            const response = await apiService.get<UploadApiResponse<UploadProgress>>(
                `/api/uploads/batches/${batchId}/progress`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo progreso');
            }

            if (!response.data.data) {
                throw new Error('Progreso no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo progreso de lote', { error, batchId });
            throw error;
        }
    }

    // Obtener estadísticas de subidas
    static async getUploadStats(filters: UploadFilters = {}): Promise<UploadStats> {
        try {
            const response = await apiService.get<UploadApiResponse<UploadStats>>(
                '/api/uploads/stats',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo estadísticas');
            }

            if (!response.data.data) {
                throw new Error('Estadísticas no encontradas');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de subidas', { error, filters });
            throw error;
        }
    }

    // Obtener configuración de subidas
    static async getUploadSettings(): Promise<UploadSettings> {
        try {
            const response = await apiService.get<UploadApiResponse<UploadSettings>>(
                '/api/uploads/settings'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo configuración');
            }

            if (!response.data.data) {
                throw new Error('Configuración no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo configuración de subidas', { error });
            throw error;
        }
    }

    // Actualizar configuración de subidas
    static async updateUploadSettings(settings: UploadSettings): Promise<UploadSettings> {
        try {
            const response = await apiService.put<UploadApiResponse<UploadSettings>>(
                '/api/uploads/settings',
                settings
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando configuración');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la configuración');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando configuración de subidas', { error, settings });
            throw error;
        }
    }

    // Obtener patrones de archivo
    static async getFilePatterns(): Promise<any[]> {
        try {
            const response = await apiService.get<UploadApiResponse<any[]>>(
                '/api/uploads/patterns'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo patrones');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo patrones de archivo', { error });
            throw error;
        }
    }

    // Crear patrón de archivo
    static async createFilePattern(pattern: any): Promise<any> {
        try {
            const response = await apiService.post<UploadApiResponse<any>>(
                '/api/uploads/patterns',
                pattern
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error creando patrón');
            }

            if (!response.data.data) {
                throw new Error('Error al crear el patrón');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error creando patrón de archivo', { error, pattern });
            throw error;
        }
    }

    // Actualizar patrón de archivo
    static async updateFilePattern(patternId: string, pattern: any): Promise<any> {
        try {
            const response = await apiService.put<UploadApiResponse<any>>(
                `/api/uploads/patterns/${patternId}`,
                pattern
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando patrón');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar el patrón');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando patrón de archivo', { error, patternId, pattern });
            throw error;
        }
    }

    // Eliminar patrón de archivo
    static async deleteFilePattern(patternId: string): Promise<void> {
        try {
            const response = await apiService.delete<UploadApiResponse<void>>(
                `/api/uploads/patterns/${patternId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error eliminando patrón');
            }
        } catch (error) {
            logger.error('Error eliminando patrón de archivo', { error, patternId });
            throw error;
        }
    }

    // Asistente para crear vehículo
    static async getVehicleCreationAssistant(filename: string, content?: any): Promise<VehicleCreationAssistant> {
        try {
            const response = await apiService.post<UploadApiResponse<VehicleCreationAssistant>>(
                '/api/uploads/vehicle-assistant',
                { filename, content }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo asistente de vehículo');
            }

            if (!response.data.data) {
                throw new Error('Asistente no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo asistente de vehículo', { error, filename });
            throw error;
        }
    }

    // Crear vehículo desde asistente
    static async createVehicleFromAssistant(assistant: VehicleCreationAssistant): Promise<any> {
        try {
            const response = await apiService.post<UploadApiResponse<any>>(
                '/api/uploads/vehicle-assistant/create',
                assistant
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error creando vehículo');
            }

            if (!response.data.data) {
                throw new Error('Error al crear el vehículo');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error creando vehículo desde asistente', { error, assistant });
            throw error;
        }
    }

    // Probar conexión FTP
    static async testFTPConnection(config: any): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiService.post<UploadApiResponse<{ success: boolean; message: string }>>(
                '/api/uploads/test-ftp',
                config
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error probando conexión FTP');
            }

            if (!response.data.data) {
                throw new Error('Error en la prueba de conexión');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error probando conexión FTP', { error, config });
            throw error;
        }
    }

    // Escanear directorio local
    static async scanLocalDirectory(directory: string): Promise<any[]> {
        try {
            const response = await apiService.post<UploadApiResponse<any[]>>(
                '/api/uploads/scan-local',
                { directory }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error escaneando directorio');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error escaneando directorio local', { error, directory });
            throw error;
        }
    }

    // Suscribirse a eventos en tiempo real
    static subscribeToUploadEvents(callback: (event: any) => void): () => void {
        // TODO: Implementar WebSocket para eventos en tiempo real
        logger.info('Suscribiéndose a eventos de subida');

        // Por ahora, retornar función de cleanup vacía
        return () => {
            logger.info('Desuscribiéndose de eventos de subida');
        };
    }
}
