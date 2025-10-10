import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AIAPI } from '../api/ai';
import { logger } from '../utils/logger';

export const useAIData = () => {
    const queryClient = useQueryClient();

    const useExplanations = (filters: any = {}) => {
        return useQuery({
            queryKey: ['ai-explanations', filters],
            queryFn: () => AIAPI.getExplanations(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useExplanation = (explanationId: string) => {
        return useQuery({
            queryKey: ['ai-explanation', explanationId],
            queryFn: () => AIAPI.getExplanation(explanationId),
            enabled: !!explanationId,
            staleTime: 10 * 60 * 1000, // 10 minutos
            gcTime: 30 * 60 * 1000, // 30 minutos
        });
    };

    const useChatSessions = () => {
        return useQuery({
            queryKey: ['ai-chat-sessions'],
            queryFn: () => AIAPI.getChatSessions(),
            staleTime: 2 * 60 * 1000, // 2 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useChatSession = (sessionId: string) => {
        return useQuery({
            queryKey: ['ai-chat-session', sessionId],
            queryFn: () => AIAPI.getChatSession(sessionId),
            enabled: !!sessionId,
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const usePredictions = (metric: string, timeframe: string) => {
        return useQuery({
            queryKey: ['ai-predictions', metric, timeframe],
            queryFn: () => AIAPI.getPredictions(metric, timeframe),
            enabled: !!metric && !!timeframe,
            staleTime: 10 * 60 * 1000, // 10 minutos
            gcTime: 30 * 60 * 1000, // 30 minutos
        });
    };

    const usePatterns = (module?: string, type?: string) => {
        return useQuery({
            queryKey: ['ai-patterns', module, type],
            queryFn: () => AIAPI.getPatterns(module, type),
            staleTime: 15 * 60 * 1000, // 15 minutos
            gcTime: 60 * 60 * 1000, // 1 hora
        });
    };

    const useAIStats = () => {
        return useQuery({
            queryKey: ['ai-stats'],
            queryFn: () => AIAPI.getAIStats(),
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useAISettings = () => {
        return useQuery({
            queryKey: ['ai-settings'],
            queryFn: () => AIAPI.getAISettings(),
            staleTime: 10 * 60 * 1000, // 10 minutos
            gcTime: 30 * 60 * 1000, // 30 minutos
        });
    };

    const useGenerateExplanation = () => {
        return useMutation({
            mutationFn: (request: any) => AIAPI.generateExplanation(request),
            onSuccess: (data) => {
                logger.info('Explicación generada exitosamente', { explanationId: data.id });
                queryClient.invalidateQueries({ queryKey: ['ai-explanations'] });
            },
            onError: (error) => {
                logger.error('Error generando explicación', { error });
            },
        });
    };

    const usePerformAnalysis = () => {
        return useMutation({
            mutationFn: (request: any) => AIAPI.performAnalysis(request),
            onSuccess: (data) => {
                logger.info('Análisis completado exitosamente', { analysisId: data.explanation.id });
                queryClient.invalidateQueries({ queryKey: ['ai-explanations'] });
            },
            onError: (error) => {
                logger.error('Error realizando análisis', { error });
            },
        });
    };

    const useCreateChatSession = () => {
        return useMutation({
            mutationFn: ({ title, context }: { title: string; context?: any }) =>
                AIAPI.createChatSession(title, context),
            onSuccess: (data) => {
                logger.info('Sesión de chat creada', { sessionId: data.id });
                queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
            },
            onError: (error) => {
                logger.error('Error creando sesión de chat', { error });
            },
        });
    };

    const useSendChatMessage = () => {
        return useMutation({
            mutationFn: ({ sessionId, content, context }: { sessionId: string; content: string; context?: any }) =>
                AIAPI.sendChatMessage(sessionId, content, context),
            onSuccess: (data, { sessionId }) => {
                logger.info('Mensaje enviado exitosamente', { messageId: data.id, sessionId });
                queryClient.invalidateQueries({ queryKey: ['ai-chat-session', sessionId] });
                queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
            },
            onError: (error) => {
                logger.error('Error enviando mensaje de chat', { error });
            },
        });
    };

    const useGenerateSuggestions = () => {
        return useMutation({
            mutationFn: ({ module, context }: { module: string; context: any }) =>
                AIAPI.generateSuggestions(module, context),
            onSuccess: (data) => {
                logger.info('Sugerencias generadas', { count: data.length });
            },
            onError: (error) => {
                logger.error('Error generando sugerencias', { error });
            },
        });
    };

    const useApplySuggestion = () => {
        return useMutation({
            mutationFn: ({ suggestionId, parameters }: { suggestionId: string; parameters?: Record<string, any> }) =>
                AIAPI.applySuggestion(suggestionId, parameters),
            onSuccess: (data) => {
                logger.info('Sugerencia aplicada exitosamente', { suggestionId: data.id });
                queryClient.invalidateQueries({ queryKey: ['ai-explanations'] });
            },
            onError: (error) => {
                logger.error('Error aplicando sugerencia', { error });
            },
        });
    };

    const useGetModuleExplanation = () => {
        return useMutation({
            mutationFn: ({ module, context }: { module: string; context: any }) =>
                AIAPI.getModuleExplanation(module, context),
            onSuccess: (data) => {
                logger.info('Explicación del módulo obtenida', { explanationId: data.id, module });
            },
            onError: (error) => {
                logger.error('Error obteniendo explicación del módulo', { error });
            },
        });
    };

    const useUpdateAISettings = () => {
        return useMutation({
            mutationFn: (settings: any) => AIAPI.updateAISettings(settings),
            onSuccess: (data) => {
                logger.info('Configuración de IA actualizada', { settings: data });
                queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
            },
            onError: (error) => {
                logger.error('Error actualizando configuración de IA', { error });
            },
        });
    };

    const invalidateAICache = () => {
        queryClient.invalidateQueries({ queryKey: ['ai-explanations'] });
        queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['ai-predictions'] });
        queryClient.invalidateQueries({ queryKey: ['ai-patterns'] });
        queryClient.invalidateQueries({ queryKey: ['ai-stats'] });
    };

    const invalidateExplanationCache = (explanationId: string) => {
        queryClient.invalidateQueries({ queryKey: ['ai-explanation', explanationId] });
        queryClient.invalidateQueries({ queryKey: ['ai-explanations'] });
    };

    const invalidateChatCache = (sessionId: string) => {
        queryClient.invalidateQueries({ queryKey: ['ai-chat-session', sessionId] });
        queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    };

    return {
        // Queries
        useExplanations,
        useExplanation,
        useChatSessions,
        useChatSession,
        usePredictions,
        usePatterns,
        useAIStats,
        useAISettings,

        // Mutations
        useGenerateExplanation,
        usePerformAnalysis,
        useCreateChatSession,
        useSendChatMessage,
        useGenerateSuggestions,
        useApplySuggestion,
        useGetModuleExplanation,
        useUpdateAISettings,

        // Utilities
        invalidateAICache,
        invalidateExplanationCache,
        invalidateChatCache,
    };
};
