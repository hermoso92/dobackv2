import axios from 'axios';
import { authService } from './auth';
import { logger } from '../utils/logger';
import { API_CONFIG } from '@/config/api';

export interface Report {
    id: string;
    organizationId: string;
    requestedById: string;
    filePath: string;
    sizeBytes: number;
    params: {
        sessionId: string;
        filters?: {
            speedFilter?: string;
            rpmFilter?: string;
            selectedTypes?: string[];
            rotativoOnly?: boolean;
        };
    };
    status: 'PENDING' | 'READY' | 'FAILED';
    expiresAt: string;
    sha256: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReportsResponse {
    items: Report[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateReportRequest {
    sessionId: string;
    filters?: {
        speedFilter?: string;
        rpmFilter?: string;
        selectedTypes?: string[];
        rotativoOnly?: boolean;
    };
}

class ReportService {
    private readonly basePath = '/api/reports';
    private readonly baseURL = `${API_CONFIG.BASE_URL}`;

    private async getAuthHeaders() {
        const token = authService.getToken() || 'test';
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Obtiene lista paginada de reportes
     */
    async getReports(page: number = 1, limit: number = 20): Promise<ReportsResponse> {
        try {
            const headers = await this.getAuthHeaders();
            const url = `${this.baseURL}${this.basePath}/history?page=${page}&limit=${limit}`;

            const response = await axios.get<ReportsResponse>(url, { headers });

            // El backend devuelve los datos directamente, no en un wrapper
            return response.data;
        } catch (error) {
            logger.error('Error obteniendo reportes:', error);
            throw new Error('Error obteniendo lista de reportes');
        }
    }

    /**
     * Crea un nuevo reporte
     */
    async createReport(request: CreateReportRequest): Promise<Report> {
        try {
            const headers = await this.getAuthHeaders();
            const url = `${this.baseURL}${this.basePath}/generate`;

            // El backend espera un formato específico
            const backendRequest = {
                module: 'panel',
                template: 'panel-overview',
                params: {
                    sessionId: request.sessionId,
                    ...request.filters
                },
                options: {
                    includeKPIs: true,
                    includeHeatmaps: true,
                    includeEmergencyData: true,
                    includeStatistics: true
                }
            };

            const response = await axios.post<{ success: boolean, data: any }>(url, backendRequest, { headers });

            if (!response.data.success) {
                throw new Error('Error en la respuesta del servidor');
            }

            // Mapear la respuesta del backend al formato esperado por el frontend
            const backendData = response.data.data;
            const report: Report = {
                id: backendData.id,
                organizationId: backendData.orgId,
                requestedById: backendData.createdBy,
                filePath: null,
                sizeBytes: 0,
                params: backendData.input,
                status: backendData.status === 'pending' ? 'PENDING' :
                    backendData.status === 'completed' ? 'READY' : 'FAILED',
                expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 días
                sha256: null,
                createdAt: backendData.createdAt,
                updatedAt: backendData.createdAt
            };

            return report;
        } catch (error) {
            logger.error('Error creando reporte:', error);
            throw new Error('Error creando nuevo reporte');
        }
    }

    /**
     * Descarga un reporte PDF
     */
    async downloadReport(reportId: string): Promise<void> {
        try {
            const headers = await this.getAuthHeaders();
            const url = `${this.baseURL}${this.basePath}/${reportId}/download`;

            const response = await axios.get(url, {
                headers,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `reporte-${reportId}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            logger.error('Error descargando reporte:', error);
            throw error;
        }
    }

    /**
     * Reintenta la generación de un reporte fallido
     */
    async retryReport(reportId: string): Promise<Report> {
        try {
            const headers = await this.getAuthHeaders();
            const url = `${this.baseURL}${this.basePath}/${reportId}/retry`;

            const response = await axios.post<Report>(url, {}, { headers });
            return response.data;
        } catch (error) {
            logger.error('Error reintentando reporte:', error);
            throw new Error('Error reintentando generación del reporte');
        }
    }

    /**
     * Abre un reporte en nueva ventana
     */
    async openReport(reportId: string): Promise<void> {
        try {
            const headers = await this.getAuthHeaders();
            const url = `${this.baseURL}${this.basePath}/${reportId}/file`;

            const response = await axios.get(url, {
                headers,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);

            // Abrir en nueva ventana
            window.open(blobUrl, '_blank');

            // Limpiar el blob URL después de un tiempo
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            logger.error('Error abriendo reporte:', error);
            throw error;
        }
    }

    /**
     * Formatea el tamaño del archivo
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Formatea la fecha de creación
     */
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Obtiene el color del estado
     */
    getStatusColor(status: string): 'success' | 'warning' | 'error' {
        switch (status) {
            case 'READY': return 'success';
            case 'PENDING': return 'warning';
            case 'FAILED': return 'error';
            default: return 'warning';
        }
    }

    /**
     * Traduce el estado al español
     */
    getStatusLabel(status: string): string {
        switch (status) {
            case 'READY': return 'Listo';
            case 'PENDING': return 'Generando';
            case 'FAILED': return 'Error';
            default: return status;
        }
    }
}

export const reportService = new ReportService(); 