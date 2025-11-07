import { apiService } from '../services/api';
import { ApiResponse } from '../types/api';

export interface SearchRelatedFilesRequest {
    vehicle: string;
    date: string;
    sequence: string;
}

export interface RemoteFileInfo {
    name: string;
    path: string;
    type?: string;
    lastModified?: string;
}

export const searchRelatedFiles = async (
    payload: SearchRelatedFilesRequest
): Promise<RemoteFileInfo[]> => {
    const response = await apiService.post<ApiResponse<RemoteFileInfo[]>>(
        '/api/sesion/search-related-files',
        payload
    );

    if (!response.success) {
        throw new Error(response.error || 'No se encontraron archivos relacionados');
    }

    return response.data as any;
};

export const downloadFile = async (path: string): Promise<File> => {
    const response = await fetch(`/api/sesion/download-file?path=${encodeURIComponent(path)}`, {
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('No se pudo descargar el archivo');
    }

    const blob = await response.blob();
    const fileName = path.split('/').pop() || 'archivo.dat';
    return new File([blob], fileName, {
        type: blob.type,
        lastModified: Date.now()
    });
};


