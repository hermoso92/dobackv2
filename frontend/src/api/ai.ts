import { apiService } from '../services/api';
import {
    AIAnalysisRequest,
    AIAnalysisResponse,
    AIApiResponse,
    AIChatMessage,
    AIChatSession,
    AIExplanationDTO,
    AIFilters,
    AIPattern,
    AIPrediction,
    AISettings,
    AIStats
} from '../types/ai';
import { logger } from '../utils/logger';

export class AIAPI {
    // Obtener explicaciones
    static async getExplanations(filters: AIFilters = {}): Promise<AIExplanationDTO[]> {
        try {
            const response = await apiService.get<AIApiResponse<AIExplanationDTO[]>>(
                '/api/ai/explanations',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo explicaciones');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo explicaciones', { error, filters });
            throw error;
        }
    }

    // Obtener explicación específica
    static async getExplanation(explanationId: string): Promise<AIExplanationDTO> {
        try {
            const response = await apiService.get<AIApiResponse<AIExplanationDTO>>(
                `/api/ai/explanations/${explanationId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo explicación');
            }

            if (!response.data.data) {
                throw new Error('Explicación no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo explicación', { error, explanationId });
            throw error;
        }
    }

    // Generar explicación
    static async generateExplanation(request: AIAnalysisRequest): Promise<AIExplanationDTO> {
        try {
            const response = await apiService.post<AIApiResponse<AIExplanationDTO>>(
                '/api/ai/explanations/generate',
                request
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error generando explicación');
            }

            if (!response.data.data) {
                throw new Error('Error al generar la explicación');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error generando explicación', { error, request });
            throw error;
        }
    }

    // Análisis completo
    static async performAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        try {
            const response = await apiService.post<AIApiResponse<AIAnalysisResponse>>(
                '/api/ai/analyze',
                request
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error realizando análisis');
            }

            if (!response.data.data) {
                throw new Error('Error al realizar el análisis');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error realizando análisis', { error, request });
            throw error;
        }
    }

    // Obtener sesiones de chat
    static async getChatSessions(): Promise<AIChatSession[]> {
        try {
            const response = await apiService.get<AIApiResponse<AIChatSession[]>>(
                '/api/ai/chat/sessions'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo sesiones de chat');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo sesiones de chat', { error });
            throw error;
        }
    }

    // Obtener sesión de chat específica
    static async getChatSession(sessionId: string): Promise<AIChatSession> {
        try {
            const response = await apiService.get<AIApiResponse<AIChatSession>>(
                `/api/ai/chat/sessions/${sessionId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo sesión de chat');
            }

            if (!response.data.data) {
                throw new Error('Sesión de chat no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo sesión de chat', { error, sessionId });
            throw error;
        }
    }

    // Crear nueva sesión de chat
    static async createChatSession(title: string, context?: any): Promise<AIChatSession> {
        try {
            const response = await apiService.post<AIApiResponse<AIChatSession>>(
                '/api/ai/chat/sessions',
                { title, context }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error creando sesión de chat');
            }

            if (!response.data.data) {
                throw new Error('Error al crear la sesión de chat');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error creando sesión de chat', { error, title, context });
            throw error;
        }
    }

    // Enviar mensaje de chat
    static async sendChatMessage(sessionId: string, content: string, context?: any): Promise<AIChatMessage> {
        try {
            const response = await apiService.post<AIApiResponse<AIChatMessage>>(
                `/api/ai/chat/sessions/${sessionId}/messages`,
                { content, context }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error enviando mensaje');
            }

            if (!response.data.data) {
                throw new Error('Error al enviar el mensaje');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error enviando mensaje de chat', { error, sessionId, content });
            throw error;
        }
    }

    // Obtener predicciones
    static async getPredictions(metric: string, timeframe: string): Promise<AIPrediction[]> {
        try {
            const response = await apiService.get<AIApiResponse<AIPrediction[]>>(
                '/api/ai/predictions',
                { params: { metric, timeframe } }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo predicciones');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo predicciones', { error, metric, timeframe });
            throw error;
        }
    }

    // Obtener patrones
    static async getPatterns(module?: string, type?: string): Promise<AIPattern[]> {
        try {
            const response = await apiService.get<AIApiResponse<AIPattern[]>>(
                '/api/ai/patterns',
                { params: { module, type } }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo patrones');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo patrones', { error, module, type });
            throw error;
        }
    }

    // Obtener estadísticas de IA
    static async getAIStats(): Promise<AIStats> {
        try {
            const response = await apiService.get<AIApiResponse<AIStats>>(
                '/api/ai/stats'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo estadísticas de IA');
            }

            if (!response.data.data) {
                throw new Error('Estadísticas no encontradas');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de IA', { error });
            throw error;
        }
    }

    // Obtener configuración de IA
    static async getAISettings(): Promise<AISettings> {
        try {
            const response = await apiService.get<AIApiResponse<AISettings>>(
                '/api/ai/settings'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo configuración de IA');
            }

            if (!response.data.data) {
                throw new Error('Configuración no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo configuración de IA', { error });
            throw error;
        }
    }

    // Actualizar configuración de IA
    static async updateAISettings(settings: AISettings): Promise<AISettings> {
        try {
            const response = await apiService.put<AIApiResponse<AISettings>>(
                '/api/ai/settings',
                settings
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando configuración de IA');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la configuración');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando configuración de IA', { error, settings });
            throw error;
        }
    }

    // Generar sugerencias automáticas
    static async generateSuggestions(module: string, context: any): Promise<any[]> {
        try {
            const response = await apiService.post<AIApiResponse<any[]>>(
                '/api/ai/suggestions/generate',
                { module, context }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error generando sugerencias');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error generando sugerencias', { error, module, context });
            throw error;
        }
    }

    // Aplicar sugerencia
    static async applySuggestion(suggestionId: string, parameters?: Record<string, any>): Promise<any> {
        try {
            const response = await apiService.post<AIApiResponse<any>>(
                `/api/ai/suggestions/${suggestionId}/apply`,
                { parameters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error aplicando sugerencia');
            }

            if (!response.data.data) {
                throw new Error('Error al aplicar la sugerencia');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error aplicando sugerencia', { error, suggestionId, parameters });
            throw error;
        }
    }

    // Obtener explicación para módulo específico
    static async getModuleExplanation(module: string, context: any): Promise<AIExplanationDTO> {
        try {
            const response = await apiService.post<AIApiResponse<AIExplanationDTO>>(
                `/api/ai/modules/${module}/explain`,
                { context }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo explicación del módulo');
            }

            if (!response.data.data) {
                throw new Error('Error al obtener la explicación');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo explicación del módulo', { error, module, context });
            throw error;
        }
    }

    // Suscribirse a eventos en tiempo real
    static subscribeToAIEvents(_callback: (event: any) => void): () => void {
        // TODO: Implementar WebSocket para eventos en tiempo real
        logger.info('Suscribiéndose a eventos de IA');

        // Por ahora, retornar función de cleanup vacía
        return () => {
            logger.info('Desuscribiéndose de eventos de IA');
        };
    }
}
