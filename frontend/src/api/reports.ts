import { apiService } from '../services/api';
import {
    ComparativeReportData,
    PanelReportData,
    ReportFilters,
    ReportGenerationOptions,
    ReportJobDTO,
    ReportQueueStatus,
    ReportSchedule,
    ReportTemplate,
    StabilityReportData,
    TelemetryReportData
} from '../types/reports';
import { logger } from '../utils/logger';

// API para el módulo Reportes Avanzados
export class ReportsAPI {
    /**
     * Genera un reporte inmediato
     */
    static async generateReport(
        module: 'telemetry' | 'stability' | 'panel' | 'comparative',
        options: ReportGenerationOptions,
        filters: ReportFilters
    ): Promise<ReportJobDTO> {
        try {
            const response = await apiService.post<ReportJobDTO>('/api/reports/generate', {
                module,
                options,
                filters
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudo generar el reporte');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error generando reporte', { error, module, options, filters });
            throw error;
        }
    }

    /**
     * Obtiene el estado de un job de reporte
     */
    static async getReportJob(jobId: string): Promise<ReportJobDTO> {
        try {
            const response = await apiService.get<ReportJobDTO>(`/api/reports/jobs/${jobId}`);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo obtener el estado del reporte');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo estado del reporte', { error, jobId });
            throw error;
        }
    }

    /**
     * Obtiene la lista de jobs de reportes
     */
    static async getReportJobs(filters?: {
        status?: string;
        module?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }): Promise<ReportJobDTO[]> {
        try {
            const response = await apiService.get<ReportJobDTO[]>('/api/reports/jobs', {
                params: filters
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los reportes');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo lista de reportes', { error, filters });
            throw error;
        }
    }

    /**
     * Cancela un job de reporte
     */
    static async cancelReportJob(jobId: string): Promise<void> {
        try {
            const response = await apiService.delete(`/api/reports/jobs/${jobId}`);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo cancelar el reporte');
            }
        } catch (error) {
            logger.error('Error cancelando reporte', { error, jobId });
            throw error;
        }
    }

    /**
     * Descarga un reporte completado
     */
    static async downloadReport(jobId: string): Promise<Blob> {
        try {
            const response = await apiService.get(`/api/reports/jobs/${jobId}/download`, {
                responseType: 'blob'
            });

            return (response as any) as Blob;
        } catch (error) {
            logger.error('Error descargando reporte', { error, jobId });
            throw error;
        }
    }

    /**
     * Obtiene las plantillas de reportes disponibles
     */
    static async getReportTemplates(): Promise<ReportTemplate[]> {
        try {
            const response = await apiService.get<ReportTemplate[]>('/api/reports/templates');

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las plantillas');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo plantillas de reportes', { error });
            throw error;
        }
    }

    /**
     * Crea una nueva plantilla de reporte
     */
    static async createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> {
        try {
            const response = await apiService.post<ReportTemplate>('/api/reports/templates', template);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo crear la plantilla');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error creando plantilla de reporte', { error, template });
            throw error;
        }
    }

    /**
     * Actualiza una plantilla de reporte
     */
    static async updateReportTemplate(templateId: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> {
        try {
            const response = await apiService.put<ReportTemplate>(`/api/reports/templates/${templateId}`, template);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo actualizar la plantilla');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error actualizando plantilla de reporte', { error, templateId, template });
            throw error;
        }
    }

    /**
     * Elimina una plantilla de reporte
     */
    static async deleteReportTemplate(templateId: string): Promise<void> {
        try {
            const response = await apiService.delete(`/api/reports/templates/${templateId}`);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo eliminar la plantilla');
            }
        } catch (error) {
            logger.error('Error eliminando plantilla de reporte', { error, templateId });
            throw error;
        }
    }

    /**
     * Obtiene los reportes programados
     */
    static async getReportSchedules(): Promise<ReportSchedule[]> {
        try {
            const response = await apiService.get<ReportSchedule[]>('/api/reports/schedules');

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los reportes programados');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo reportes programados', { error });
            throw error;
        }
    }

    /**
     * Crea un nuevo reporte programado
     */
    static async createReportSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt'>): Promise<ReportSchedule> {
        try {
            const response = await apiService.post<ReportSchedule>('/api/reports/schedules', schedule);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo crear el reporte programado');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error creando reporte programado', { error, schedule });
            throw error;
        }
    }

    /**
     * Actualiza un reporte programado
     */
    static async updateReportSchedule(scheduleId: string, schedule: Partial<ReportSchedule>): Promise<ReportSchedule> {
        try {
            const response = await apiService.put<ReportSchedule>(`/api/reports/schedules/${scheduleId}`, schedule);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo actualizar el reporte programado');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error actualizando reporte programado', { error, scheduleId, schedule });
            throw error;
        }
    }

    /**
     * Elimina un reporte programado
     */
    static async deleteReportSchedule(scheduleId: string): Promise<void> {
        try {
            const response = await apiService.delete(`/api/reports/schedules/${scheduleId}`);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo eliminar el reporte programado');
            }
        } catch (error) {
            logger.error('Error eliminando reporte programado', { error, scheduleId });
            throw error;
        }
    }

    /**
     * Obtiene el estado de la cola de reportes
     */
    static async getQueueStatus(): Promise<ReportQueueStatus> {
        try {
            const response = await apiService.get<ReportQueueStatus>('/api/reports/queue/status');

            if (!response.success) {
                throw new Error(response.error || 'No se pudo obtener el estado de la cola');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo estado de la cola', { error });
            throw error;
        }
    }

    /**
     * Obtiene datos para reporte comparativo
     */
    static async getComparativeReportData(
        orgIds: string[],
        filters: ReportFilters
    ): Promise<ComparativeReportData> {
        try {
            const response = await apiService.post<ComparativeReportData>('/api/reports/comparative/data', {
                orgIds,
                filters
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los datos comparativos');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo datos comparativos', { error, orgIds, filters });
            throw error;
        }
    }

    /**
     * Obtiene datos para reporte de telemetría
     */
    static async getTelemetryReportData(
        sessionId: string,
        options: ReportGenerationOptions
    ): Promise<TelemetryReportData> {
        try {
            const response = await apiService.post<TelemetryReportData>('/api/reports/telemetry/data', {
                sessionId,
                options
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los datos de telemetría');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo datos de telemetría', { error, sessionId, options });
            throw error;
        }
    }

    /**
     * Obtiene datos para reporte de estabilidad
     */
    static async getStabilityReportData(
        sessionId: string,
        options: ReportGenerationOptions
    ): Promise<StabilityReportData> {
        try {
            const response = await apiService.post<StabilityReportData>('/api/reports/stability/data', {
                sessionId,
                options
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los datos de estabilidad');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo datos de estabilidad', { error, sessionId, options });
            throw error;
        }
    }

    /**
     * Obtiene datos para reporte del panel
     */
    static async getPanelReportData(
        filters: ReportFilters,
        options: ReportGenerationOptions
    ): Promise<PanelReportData> {
        try {
            const response = await apiService.post<PanelReportData>('/api/reports/panel/data', {
                filters,
                options
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los datos del panel');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo datos del panel', { error, filters, options });
            throw error;
        }
    }

    /**
     * Genera análisis IA para un reporte
     */
    static async generateAIAnalysis(
        module: string,
        data: any,
        prompt?: string
    ): Promise<{
        summary: string;
        insights: Array<{
            type: string;
            title: string;
            description: string;
            confidence: number;
        }>;
        recommendations: Array<{
            priority: string;
            action: string;
            impact: string;
            effort: string;
        }>;
    }> {
        try {
            const response = await apiService.post('/api/reports/ai/analyze', {
                module,
                data,
                prompt
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudo generar el análisis IA');
            }

            return response.data! as any;
        } catch (error) {
            logger.error('Error generando análisis IA', { error, module, data, prompt });
            throw error;
        }
    }

    /**
     * Obtiene el historial de reportes
     */
    static async getReportHistory(filters?: {
        module?: string;
        status?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        reports: ReportJobDTO[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const response = await apiService.get('/api/reports/history', {
                params: filters
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudo obtener el historial de reportes');
            }

            return response.data! as any;
        } catch (error) {
            logger.error('Error obteniendo historial de reportes', { error, filters });
            throw error;
        }
    }
}