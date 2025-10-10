import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReportsAPI } from '../api/reports';
import {
    ComparativeReportData,
    PanelReportData,
    ReportFilters,
    ReportGenerationOptions,
    ReportSchedule,
    ReportTemplate,
    StabilityReportData,
    TelemetryReportData
} from '../types/reports';

// Hook para gestionar reportes avanzados
export const useReports = () => {
    const queryClient = useQueryClient();

    // Query para obtener jobs de reportes
    const useReportJobs = (filters?: {
        status?: string;
        module?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }) => {
        return useQuery({
            queryKey: ['reports', 'jobs', filters],
            queryFn: () => ReportsAPI.getReportJobs(filters),
            staleTime: 30 * 1000, // 30 segundos
            refetchInterval: 10 * 1000, // 10 segundos para jobs en progreso
        });
    };

    // Query para obtener un job específico
    const useReportJob = (jobId: string) => {
        return useQuery({
            queryKey: ['reports', 'job', jobId],
            queryFn: () => ReportsAPI.getReportJob(jobId),
            staleTime: 5 * 1000, // 5 segundos
            refetchInterval: (data) => {
                // Solo refetch si el job está en progreso
                return data?.status === 'processing' || data?.status === 'pending' ? 5 * 1000 : false;
            },
            enabled: !!jobId,
        });
    };

    // Query para obtener plantillas de reportes
    const useReportTemplates = () => {
        return useQuery({
            queryKey: ['reports', 'templates'],
            queryFn: () => ReportsAPI.getReportTemplates(),
            staleTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Query para obtener reportes programados
    const useReportSchedules = () => {
        return useQuery({
            queryKey: ['reports', 'schedules'],
            queryFn: () => ReportsAPI.getReportSchedules(),
            staleTime: 1 * 60 * 1000, // 1 minuto
        });
    };

    // Query para obtener estado de la cola
    const useQueueStatus = () => {
        return useQuery({
            queryKey: ['reports', 'queue', 'status'],
            queryFn: () => ReportsAPI.getQueueStatus(),
            staleTime: 10 * 1000, // 10 segundos
            refetchInterval: 30 * 1000, // 30 segundos
        });
    };

    // Query para obtener historial de reportes
    const useReportHistory = (filters?: {
        module?: string;
        status?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }) => {
        return useQuery({
            queryKey: ['reports', 'history', filters],
            queryFn: () => ReportsAPI.getReportHistory(filters),
            staleTime: 1 * 60 * 1000, // 1 minuto
        });
    };

    // Mutation para generar reporte
    const useGenerateReport = () => {
        return useMutation({
            mutationFn: ({
                module,
                options,
                filters
            }: {
                module: 'telemetry' | 'stability' | 'panel' | 'comparative';
                options: ReportGenerationOptions;
                filters: ReportFilters;
            }) => ReportsAPI.generateReport(module, options, filters),
            onSuccess: () => {
                // Invalidar queries relacionadas
                queryClient.invalidateQueries({ queryKey: ['reports', 'jobs'] });
                queryClient.invalidateQueries({ queryKey: ['reports', 'queue'] });
            },
        });
    };

    // Mutation para cancelar reporte
    const useCancelReport = () => {
        return useMutation({
            mutationFn: (jobId: string) => ReportsAPI.cancelReportJob(jobId),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'jobs'] });
                queryClient.invalidateQueries({ queryKey: ['reports', 'queue'] });
            },
        });
    };

    // Mutation para descargar reporte
    const useDownloadReport = () => {
        return useMutation({
            mutationFn: (jobId: string) => ReportsAPI.downloadReport(jobId),
        });
    };

    // Mutation para crear plantilla
    const useCreateTemplate = () => {
        return useMutation({
            mutationFn: (template: Omit<ReportTemplate, 'id'>) => ReportsAPI.createReportTemplate(template),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
            },
        });
    };

    // Mutation para actualizar plantilla
    const useUpdateTemplate = () => {
        return useMutation({
            mutationFn: ({ templateId, template }: { templateId: string; template: Partial<ReportTemplate> }) =>
                ReportsAPI.updateReportTemplate(templateId, template),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
            },
        });
    };

    // Mutation para eliminar plantilla
    const useDeleteTemplate = () => {
        return useMutation({
            mutationFn: (templateId: string) => ReportsAPI.deleteReportTemplate(templateId),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'templates'] });
            },
        });
    };

    // Mutation para crear reporte programado
    const useCreateSchedule = () => {
        return useMutation({
            mutationFn: (schedule: Omit<ReportSchedule, 'id' | 'createdAt'>) => ReportsAPI.createReportSchedule(schedule),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'schedules'] });
            },
        });
    };

    // Mutation para actualizar reporte programado
    const useUpdateSchedule = () => {
        return useMutation({
            mutationFn: ({ scheduleId, schedule }: { scheduleId: string; schedule: Partial<ReportSchedule> }) =>
                ReportsAPI.updateReportSchedule(scheduleId, schedule),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'schedules'] });
            },
        });
    };

    // Mutation para eliminar reporte programado
    const useDeleteSchedule = () => {
        return useMutation({
            mutationFn: (scheduleId: string) => ReportsAPI.deleteReportSchedule(scheduleId),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['reports', 'schedules'] });
            },
        });
    };

    // Mutation para generar análisis IA
    const useGenerateAIAnalysis = () => {
        return useMutation({
            mutationFn: ({ module, data, prompt }: { module: string; data: any; prompt?: string }) =>
                ReportsAPI.generateAIAnalysis(module, data, prompt),
        });
    };

    // Funciones para obtener datos específicos de reportes
    const getComparativeReportData = async (orgIds: string[], filters: ReportFilters): Promise<ComparativeReportData> => {
        return ReportsAPI.getComparativeReportData(orgIds, filters);
    };

    const getTelemetryReportData = async (sessionId: string, options: ReportGenerationOptions): Promise<TelemetryReportData> => {
        return ReportsAPI.getTelemetryReportData(sessionId, options);
    };

    const getStabilityReportData = async (sessionId: string, options: ReportGenerationOptions): Promise<StabilityReportData> => {
        return ReportsAPI.getStabilityReportData(sessionId, options);
    };

    const getPanelReportData = async (filters: ReportFilters, options: ReportGenerationOptions): Promise<PanelReportData> => {
        return ReportsAPI.getPanelReportData(filters, options);
    };

    // Función para refrescar todos los datos
    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
    };

    return {
        // Queries
        useReportJobs,
        useReportJob,
        useReportTemplates,
        useReportSchedules,
        useQueueStatus,
        useReportHistory,

        // Mutations
        useGenerateReport,
        useCancelReport,
        useDownloadReport,
        useCreateTemplate,
        useUpdateTemplate,
        useDeleteTemplate,
        useCreateSchedule,
        useUpdateSchedule,
        useDeleteSchedule,
        useGenerateAIAnalysis,

        // Functions
        getComparativeReportData,
        getTelemetryReportData,
        getStabilityReportData,
        getPanelReportData,
        refreshAll,
    };
};
