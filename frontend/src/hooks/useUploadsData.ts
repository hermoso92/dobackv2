import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadsAPI } from '../api/uploads';
import { logger } from '../utils/logger';

export const useUploadsData = () => {
    const queryClient = useQueryClient();

    const useUploadBatches = (params: any = {}) => {
        return useQuery({
            queryKey: ['upload-batches', params],
            queryFn: () => UploadsAPI.getBatches(params),
            staleTime: 2 * 60 * 1000, // 2 minutos
            cacheTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const useUploadBatch = (batchId: string) => {
        return useQuery({
            queryKey: ['upload-batch', batchId],
            queryFn: () => UploadsAPI.getBatch(batchId),
            enabled: !!batchId,
            staleTime: 1 * 60 * 1000, // 1 minuto
            cacheTime: 3 * 60 * 1000, // 3 minutos
        });
    };

    const useUploadStats = (filters: any = {}) => {
        return useQuery({
            queryKey: ['upload-stats', filters],
            queryFn: () => UploadsAPI.getUploadStats(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useUploadSettings = () => {
        return useQuery({
            queryKey: ['upload-settings'],
            queryFn: () => UploadsAPI.getUploadSettings(),
            staleTime: 10 * 60 * 1000, // 10 minutos
            cacheTime: 30 * 60 * 1000, // 30 minutos
        });
    };

    const useFilePatterns = () => {
        return useQuery({
            queryKey: ['file-patterns'],
            queryFn: () => UploadsAPI.getFilePatterns(),
            staleTime: 10 * 60 * 1000, // 10 minutos
            cacheTime: 30 * 60 * 1000, // 30 minutos
        });
    };

    const useBatchProgress = (batchId: string) => {
        return useQuery({
            queryKey: ['upload-batch-progress', batchId],
            queryFn: () => UploadsAPI.getBatchProgress(batchId),
            enabled: !!batchId,
            refetchInterval: 2000, // Refrescar cada 2 segundos
            staleTime: 0, // Siempre considerar stale
            cacheTime: 1 * 60 * 1000, // 1 minuto
        });
    };

    const useCreateBatch = () => {
        return useMutation({
            mutationFn: (config: any) => UploadsAPI.createBatch(config),
            onSuccess: (data) => {
                logger.info('Lote de subida creado exitosamente', { batchId: data.id });
                queryClient.invalidateQueries({ queryKey: ['upload-batches'] });
                queryClient.invalidateQueries({ queryKey: ['upload-stats'] });
            },
            onError: (error) => {
                logger.error('Error creando lote de subida', { error });
            },
        });
    };

    const useStartBatch = () => {
        return useMutation({
            mutationFn: (batchId: string) => UploadsAPI.startBatch(batchId),
            onSuccess: (_, batchId) => {
                logger.info('Procesamiento de lote iniciado', { batchId });
                queryClient.invalidateQueries({ queryKey: ['upload-batch', batchId] });
                queryClient.invalidateQueries({ queryKey: ['upload-batch-progress', batchId] });
            },
            onError: (error) => {
                logger.error('Error iniciando procesamiento de lote', { error });
            },
        });
    };

    const useCancelBatch = () => {
        return useMutation({
            mutationFn: (batchId: string) => UploadsAPI.cancelBatch(batchId),
            onSuccess: (_, batchId) => {
                logger.info('Lote cancelado exitosamente', { batchId });
                queryClient.invalidateQueries({ queryKey: ['upload-batch', batchId] });
                queryClient.invalidateQueries({ queryKey: ['upload-batches'] });
            },
            onError: (error) => {
                logger.error('Error cancelando lote', { error });
            },
        });
    };

    const useRetryFile = () => {
        return useMutation({
            mutationFn: ({ batchId, fileId }: { batchId: string; fileId: string }) =>
                UploadsAPI.retryFile(batchId, fileId),
            onSuccess: (_, { batchId, fileId }) => {
                logger.info('Archivo reintentado exitosamente', { batchId, fileId });
                queryClient.invalidateQueries({ queryKey: ['upload-batch', batchId] });
            },
            onError: (error) => {
                logger.error('Error reintentando archivo', { error });
            },
        });
    };

    const useDiscardFile = () => {
        return useMutation({
            mutationFn: ({ batchId, fileId }: { batchId: string; fileId: string }) =>
                UploadsAPI.discardFile(batchId, fileId),
            onSuccess: (_, { batchId, fileId }) => {
                logger.info('Archivo descartado exitosamente', { batchId, fileId });
                queryClient.invalidateQueries({ queryKey: ['upload-batch', batchId] });
            },
            onError: (error) => {
                logger.error('Error descartando archivo', { error });
            },
        });
    };

    const useUpdateUploadSettings = () => {
        return useMutation({
            mutationFn: (settings: any) => UploadsAPI.updateUploadSettings(settings),
            onSuccess: (data) => {
                logger.info('Configuración de subidas actualizada', { settings: data });
                queryClient.invalidateQueries({ queryKey: ['upload-settings'] });
            },
            onError: (error) => {
                logger.error('Error actualizando configuración de subidas', { error });
            },
        });
    };

    const useCreateFilePattern = () => {
        return useMutation({
            mutationFn: (pattern: any) => UploadsAPI.createFilePattern(pattern),
            onSuccess: (data) => {
                logger.info('Patrón de archivo creado', { patternId: data.id });
                queryClient.invalidateQueries({ queryKey: ['file-patterns'] });
            },
            onError: (error) => {
                logger.error('Error creando patrón de archivo', { error });
            },
        });
    };

    const useUpdateFilePattern = () => {
        return useMutation({
            mutationFn: ({ patternId, pattern }: { patternId: string; pattern: any }) =>
                UploadsAPI.updateFilePattern(patternId, pattern),
            onSuccess: (data) => {
                logger.info('Patrón de archivo actualizado', { patternId: data.id });
                queryClient.invalidateQueries({ queryKey: ['file-patterns'] });
            },
            onError: (error) => {
                logger.error('Error actualizando patrón de archivo', { error });
            },
        });
    };

    const useDeleteFilePattern = () => {
        return useMutation({
            mutationFn: (patternId: string) => UploadsAPI.deleteFilePattern(patternId),
            onSuccess: (_, patternId) => {
                logger.info('Patrón de archivo eliminado', { patternId });
                queryClient.invalidateQueries({ queryKey: ['file-patterns'] });
            },
            onError: (error) => {
                logger.error('Error eliminando patrón de archivo', { error });
            },
        });
    };

    const useVehicleCreationAssistant = () => {
        return useMutation({
            mutationFn: ({ filename, content }: { filename: string; content?: any }) =>
                UploadsAPI.getVehicleCreationAssistant(filename, content),
            onSuccess: (data) => {
                logger.info('Asistente de vehículo obtenido', { filename: data.suggestedVehicle.name });
            },
            onError: (error) => {
                logger.error('Error obteniendo asistente de vehículo', { error });
            },
        });
    };

    const useCreateVehicleFromAssistant = () => {
        return useMutation({
            mutationFn: (assistant: any) => UploadsAPI.createVehicleFromAssistant(assistant),
            onSuccess: (data) => {
                logger.info('Vehículo creado desde asistente', { vehicleId: data.id });
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            },
            onError: (error) => {
                logger.error('Error creando vehículo desde asistente', { error });
            },
        });
    };

    const useTestFTPConnection = () => {
        return useMutation({
            mutationFn: (config: any) => UploadsAPI.testFTPConnection(config),
            onSuccess: (data) => {
                logger.info('Conexión FTP probada', { success: data.success });
            },
            onError: (error) => {
                logger.error('Error probando conexión FTP', { error });
            },
        });
    };

    const useScanLocalDirectory = () => {
        return useMutation({
            mutationFn: (directory: string) => UploadsAPI.scanLocalDirectory(directory),
            onSuccess: (data) => {
                logger.info('Directorio local escaneado', { filesFound: data.length });
            },
            onError: (error) => {
                logger.error('Error escaneando directorio local', { error });
            },
        });
    };

    const invalidateUploadsCache = () => {
        queryClient.invalidateQueries({ queryKey: ['upload-batches'] });
        queryClient.invalidateQueries({ queryKey: ['upload-stats'] });
        queryClient.invalidateQueries({ queryKey: ['file-patterns'] });
    };

    const invalidateBatchCache = (batchId: string) => {
        queryClient.invalidateQueries({ queryKey: ['upload-batch', batchId] });
        queryClient.invalidateQueries({ queryKey: ['upload-batch-progress', batchId] });
    };

    return {
        // Queries
        useUploadBatches,
        useUploadBatch,
        useUploadStats,
        useUploadSettings,
        useFilePatterns,
        useBatchProgress,

        // Mutations
        useCreateBatch,
        useStartBatch,
        useCancelBatch,
        useRetryFile,
        useDiscardFile,
        useUpdateUploadSettings,
        useCreateFilePattern,
        useUpdateFilePattern,
        useDeleteFilePattern,
        useVehicleCreationAssistant,
        useCreateVehicleFromAssistant,
        useTestFTPConnection,
        useScanLocalDirectory,

        // Utilities
        invalidateUploadsCache,
        invalidateBatchCache,
    };
};
