/**
 * 🪝 HOOK DE SUBIDA DE ARCHIVOS
 * 
 * Maneja la lógica de subida manual de archivos múltiples
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import { useRef, useState } from 'react';
import { FEATURE_FLAGS, isFeatureEnabled } from '../../../config/features';
import { apiService } from '../../../services/api';
import { logger } from '../../../utils/logger';

export interface UploadedFile {
    name: string;
    size: number;
    uploadDate: string;
    type: string;
}

export interface FileGroup {
    vehicleId: string;
    date: string;
    files: {
        [key: string]: {
            fileName: string;
            sessionsCount: number;
            measurementsCount: number;
            fileSize: number;
        };
    };
    totalSessions: number;
    totalMeasurements: number;
}

export interface UploadResult {
    totalFiles: number;
    vehicleGroups: number;
    results: FileGroup[];
    errors?: Array<{ file: string; error: string }>;
}

export function useFileUpload() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            // Validar formato de archivos
            const validFiles: File[] = [];
            const errors: string[] = [];

            files.forEach(file => {
                const fileNamePattern = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK\d+_\d{8}\.txt$/;
                if (fileNamePattern.test(file.name)) {
                    validFiles.push(file);
                } else {
                    errors.push(`Formato inválido: ${file.name}`);
                }
            });

            if (errors.length > 0) {
                setUploadError(errors.join(', '));
            } else {
                setSelectedFiles(prev => [...prev, ...validFiles]);
                setUploadError(null);
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
        setUploadResult(null);
        setUploadError(null);
    };

    const handleMultipleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadError(null);

        try {
            // ✅ Limpieza BD solo si feature flag está activo (testing/dev)
            if (isFeatureEnabled('allowDatabaseCleanup')) {
                logger.warn('🧹 [TESTING MODE] Limpiando base de datos antes de subir archivos...');
                try {
                    const cleanResponse = await apiService.post('/api/clean-all-sessions', {});
                    if (cleanResponse.success) {
                        logger.info('✅ Base de datos limpiada correctamente', cleanResponse.data);
                    }
                } catch (cleanError) {
                    logger.warn('⚠️ Error al limpiar base de datos, continuando...', cleanError);
                }
            }

            // Subir archivos
            logger.info('📤 Subiendo archivos...');
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await apiService.post('/api/upload/multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: FEATURE_FLAGS.uploadTimeoutMs
            });

            if (response.success) {
                setUploadResult(response.data as UploadResult);
                setSelectedFiles([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                logger.info('✅ Archivos subidos correctamente');
            } else {
                setUploadError(response.error || 'Error subiendo archivos');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Error de conexión';
            setUploadError(errorMessage);
            logger.error('Error al subir archivos:', error);
        } finally {
            setUploading(false);
        }
    };

    return {
        selectedFiles,
        uploading,
        uploadResult,
        uploadError,
        fileInputRef,
        handleFileSelect,
        removeFile,
        clearAllFiles,
        handleMultipleUpload
    };
}

