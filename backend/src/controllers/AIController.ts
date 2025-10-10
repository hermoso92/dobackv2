import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../services/AIService';
import { AdvancedAIService } from '../services/AdvancedAIService';
import { logger } from '../utils/logger';

export class AIController {
    private advancedAIService = new AdvancedAIService();

    // Obtener explicaciones (análisis completo)
    getExplanations = async (req: Request, res: Response) => {
        try {
            const { days } = req.query;
            const orgId = req.orgId!;

            const daysNumber = days ? Number(days) : 30;
            const analysis = await aiService.analyzeStabilityData(orgId, daysNumber);

            // Formatear como explicaciones
            const explanations = [
                {
                    id: uuidv4(),
                    orgId,
                    module: 'stability',
                    context: 'Análisis de Estabilidad',
                    data: analysis.statistics,
                    explanation: `Análisis de ${analysis.statistics.totalSessions} sesiones en los últimos ${daysNumber} días. Se detectaron ${analysis.statistics.totalEvents} eventos con un promedio de ${analysis.statistics.avgEventsPerSession.toFixed(1)} eventos por sesión. Se identificaron ${analysis.patterns.length} patrones y se generaron ${analysis.recommendations.length} recomendaciones.`,
                    confidence: 90,
                    references: analysis.insights.map(i => ({
                        type: i.type,
                        id: i.id,
                        name: i.title,
                        description: i.description
                    })),
                    suggestions: analysis.recommendations.map(r => ({
                        id: r.id,
                        type: r.type,
                        title: r.title,
                        description: r.description,
                        priority: r.priority,
                        actionable: true,
                        confidence: r.confidence,
                        reasoning: r.steps || [],
                        estimatedImpact: []
                    })),
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    metadata: {
                        model: 'doback-ai-v1',
                        version: '1.0.0',
                        processingTime: 0,
                        tokensUsed: 0,
                        contextSize: analysis.statistics.totalEvents,
                        dataPoints: analysis.statistics.totalSessions,
                        analysisDepth: 'deep',
                        language: 'es'
                    }
                }
            ];

            res.json({
                success: true,
                data: explanations,
                meta: {
                    total: explanations.length,
                    patterns: analysis.patterns,
                    insights: analysis.insights,
                    recommendations: analysis.recommendations
                }
            });

        } catch (error) {
            logger.error('Error obteniendo explicaciones', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener explicación específica
    getExplanation = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            // Mock explanation para desarrollo
            const mockExplanation = {
                id,
                orgId,
                module: 'panel',
                context: 'KPI Analysis',
                data: { kpiId: 'kpi-1', value: 85, trend: 'up' },
                explanation: 'Los KPIs muestran una mejora del 15% en la eficiencia operativa. Esta tendencia positiva se debe principalmente a la optimización de rutas y la reducción de tiempos de inactividad.',
                confidence: 92,
                references: [
                    {
                        type: 'kpi',
                        id: 'kpi-1',
                        name: 'Eficiencia Operativa',
                        value: 85,
                        description: 'Métrica principal de rendimiento'
                    }
                ],
                suggestions: [
                    {
                        id: 'sugg-1',
                        type: 'optimization',
                        title: 'Optimizar rutas de vehículos',
                        description: 'Implementar algoritmo de optimización de rutas para reducir tiempos de viaje',
                        priority: 'medium',
                        actionable: true,
                        actionUrl: '/telemetria-v2',
                        confidence: 88,
                        reasoning: ['Reducción de 12% en tiempos de viaje', 'Ahorro de combustible estimado'],
                        estimatedImpact: [
                            { metric: 'Tiempo de viaje', change: -12, direction: 'decrease' },
                            { metric: 'Consumo de combustible', change: -8, direction: 'decrease' }
                        ]
                    }
                ],
                createdAt: '2024-01-15T10:00:00Z',
                expiresAt: '2024-01-22T10:00:00Z',
                metadata: {
                    model: 'gpt-4',
                    version: '1.0.0',
                    processingTime: 1250,
                    tokensUsed: 450,
                    contextSize: 1024,
                    dataPoints: 150,
                    analysisDepth: 'medium',
                    language: 'es'
                }
            };

            res.json({
                success: true,
                data: mockExplanation
            });

        } catch (error) {
            logger.error('Error obteniendo explicación', { error, explanationId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Generar explicación
    generateExplanation = async (req: Request, res: Response) => {
        try {
            const { module, context, data, filters, analysisType, depth, includeSuggestions, language } = req.body;
            const orgId = req.orgId!;
            const userId = req.user?.id!;

            // TODO: Implementar generación real de explicación con IA
            // const explanation = await aiService.generateExplanation({
            //     module, context, data, filters, analysisType, depth, includeSuggestions, language
            // });

            // Mock explanation para desarrollo
            const newExplanation = {
                id: uuidv4(),
                orgId,
                module,
                context,
                data,
                explanation: `Análisis de ${context} en el módulo ${module}. Los datos muestran tendencias interesantes que requieren atención. Se recomienda revisar las métricas clave y considerar las sugerencias proporcionadas.`,
                confidence: 85,
                references: [
                    {
                        type: 'kpi',
                        id: 'kpi-1',
                        name: 'Métrica Principal',
                        value: 75,
                        description: 'Métrica analizada'
                    }
                ],
                suggestions: includeSuggestions ? [
                    {
                        id: 'sugg-' + Date.now(),
                        type: 'optimization',
                        title: 'Optimización sugerida',
                        description: 'Mejora basada en el análisis de datos',
                        priority: 'medium',
                        actionable: true,
                        confidence: 80,
                        reasoning: ['Análisis de tendencias', 'Comparación histórica'],
                        estimatedImpact: [
                            { metric: 'Eficiencia', change: 10, direction: 'increase' }
                        ]
                    }
                ] : [],
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
                metadata: {
                    model: 'gpt-4',
                    version: '1.0.0',
                    processingTime: 1200,
                    tokensUsed: 400,
                    contextSize: 1024,
                    dataPoints: 100,
                    analysisDepth: depth || 'medium',
                    language: language || 'es'
                }
            };

            res.json({
                success: true,
                data: newExplanation,
                meta: {
                    processingTime: 1200,
                    tokensUsed: 400,
                    confidence: 85
                }
            });

        } catch (error) {
            logger.error('Error generando explicación', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Realizar análisis completo
    performAnalysis = async (req: Request, res: Response) => {
        try {
            const { module, context, data, filters, analysisType, depth, includeSuggestions, language } = req.body;
            const orgId = req.orgId!;

            logger.info('Iniciando análisis avanzado de IA', {
                orgId,
                module,
                context,
                analysisType,
                depth
            });

            // ✅ Implementación real con AdvancedAIService
            const analysis = await this.advancedAIService.generateAdvancedExplanation(
                orgId,
                module || 'general',
                context || 'análisis general',
                analysisType || 'comprehensive',
                depth || 'medium',
                language || 'es'
            );

            res.json({
                success: true,
                data: analysis,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error en análisis de IA', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al realizar análisis de IA'
            });
        }
    };

    // MÉTODO ANTERIOR CON MOCK (COMENTADO PARA REFERENCIA)
    performAnalysisOld = async (req: Request, res: Response) => {
        try {
            const { module, context, data, filters, analysisType, depth, includeSuggestions, language } = req.body;
            const orgId = req.orgId!;

            // Mock analysis para desarrollo
            const mockAnalysis = {
                explanation: {
                    id: uuidv4(),
                    orgId,
                    module,
                    context,
                    data,
                    explanation: `Análisis completo de ${context} en el módulo ${module}. Se han identificado patrones importantes y se proporcionan recomendaciones específicas.`,
                    confidence: 88,
                    references: [],
                    suggestions: [],
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    metadata: {
                        model: 'gpt-4',
                        version: '1.0.0',
                        processingTime: 2000,
                        tokensUsed: 600,
                        contextSize: 1024,
                        dataPoints: 200,
                        analysisDepth: depth || 'medium',
                        language: language || 'es'
                    }
                },
                insights: [
                    {
                        id: 'insight-1',
                        type: 'trend',
                        title: 'Tendencia positiva identificada',
                        description: 'Se observa una mejora constante en los indicadores clave',
                        confidence: 90,
                        impact: 'high',
                        data: { trend: 'up', value: 15 },
                        visualization: {
                            type: 'chart',
                            config: { type: 'line', data: [] }
                        }
                    }
                ],
                recommendations: [
                    {
                        id: 'rec-1',
                        category: 'optimization',
                        title: 'Optimizar procesos',
                        description: 'Implementar mejoras en los procesos actuales',
                        priority: 'medium',
                        actionable: true,
                        estimatedEffort: 'medium',
                        estimatedImpact: [
                            { metric: 'Eficiencia', change: 15, direction: 'increase' }
                        ],
                        steps: ['Paso 1', 'Paso 2', 'Paso 3'],
                        resources: ['Recurso 1', 'Recurso 2']
                    }
                ],
                warnings: [
                    {
                        id: 'warning-1',
                        type: 'performance',
                        severity: 'warning',
                        title: 'Rendimiento subóptimo',
                        description: 'Algunos indicadores muestran valores por debajo del objetivo',
                        affectedData: { metric: 'performance', value: 70 },
                        resolution: 'Revisar configuración y optimizar',
                        autoResolvable: false
                    }
                ],
                nextSteps: [
                    'Revisar métricas clave',
                    'Implementar recomendaciones',
                    'Monitorear progreso'
                ]
            };

            res.json({
                success: true,
                data: mockAnalysis,
                meta: {
                    processingTime: 2000,
                    tokensUsed: 600,
                    confidence: 88
                }
            });

        } catch (error) {
            logger.error('Error realizando análisis', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener sesiones de chat
    getChatSessions = async (req: Request, res: Response) => {
        try {
            const orgId = req.orgId!;
            const userId = req.user?.id!;

            // Mock sessions para desarrollo
            const mockSessions = [
                {
                    id: 'session-1',
                    orgId,
                    userId,
                    title: 'Análisis de excesos de velocidad',
                    messages: [],
                    context: {
                        currentModule: 'telemetry',
                        filters: { dateRange: 'last_week' },
                        userPreferences: {
                            detailLevel: 'detailed',
                            language: 'es',
                            includeSuggestions: true,
                            includeReferences: true
                        }
                    },
                    createdAt: '2024-01-15T10:00:00Z',
                    updatedAt: '2024-01-15T10:30:00Z',
                    status: 'active'
                }
            ];

            res.json({
                success: true,
                data: mockSessions
            });

        } catch (error) {
            logger.error('Error obteniendo sesiones de chat', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener sesión de chat específica
    getChatSession = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId!;

            // Mock session para desarrollo
            const mockSession = {
                id,
                orgId,
                userId: 'user-1',
                title: 'Análisis de excesos de velocidad',
                messages: [
                    {
                        id: 'msg-1',
                        sessionId: id,
                        role: 'user',
                        content: '¿Puedes explicarme por qué han subido los excesos de velocidad esta semana?',
                        timestamp: '2024-01-15T10:00:00Z'
                    },
                    {
                        id: 'msg-2',
                        sessionId: id,
                        role: 'assistant',
                        content: 'Los excesos de velocidad han aumentado un 18% esta semana, principalmente concentrados en la zona urbana. Esto se debe a: 1) Cambios en el tráfico por obras, 2) Nuevos conductores en la flota, 3) Rutas más largas por desvíos. Te recomiendo revisar las alertas de velocidad y considerar geocercas en zonas críticas.',
                        timestamp: '2024-01-15T10:01:00Z',
                        metadata: {
                            module: 'telemetry',
                            references: [
                                {
                                    type: 'event',
                                    id: 'event-1',
                                    name: 'Exceso de velocidad',
                                    description: 'Evento crítico detectado'
                                }
                            ],
                            suggestions: [
                                {
                                    id: 'sugg-2',
                                    type: 'geofence',
                                    title: 'Crear geocerca en zona urbana',
                                    description: 'Establecer límites de velocidad en áreas críticas',
                                    priority: 'high',
                                    actionable: true,
                                    confidence: 85,
                                    reasoning: ['Reducción de excesos en 25%', 'Mejora de seguridad'],
                                    estimatedImpact: [
                                        { metric: 'Excesos de velocidad', change: -25, direction: 'decrease' }
                                    ]
                                }
                            ]
                        }
                    }
                ],
                context: {
                    currentModule: 'telemetry',
                    filters: { dateRange: 'last_week' },
                    userPreferences: {
                        detailLevel: 'detailed',
                        language: 'es',
                        includeSuggestions: true,
                        includeReferences: true
                    }
                },
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:30:00Z',
                status: 'active'
            };

            res.json({
                success: true,
                data: mockSession
            });

        } catch (error) {
            logger.error('Error obteniendo sesión de chat', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Crear nueva sesión de chat
    createChatSession = async (req: Request, res: Response) => {
        try {
            const { title, context } = req.body;
            const orgId = req.orgId!;
            const userId = req.user?.id!;

            const newSession = {
                id: uuidv4(),
                orgId,
                userId,
                title: title || 'Nueva conversación',
                messages: [],
                context: context || {
                    userPreferences: {
                        detailLevel: 'detailed',
                        language: 'es',
                        includeSuggestions: true,
                        includeReferences: true
                    }
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active'
            };

            res.json({
                success: true,
                data: newSession
            });

        } catch (error) {
            logger.error('Error creando sesión de chat', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Enviar mensaje de chat
    sendChatMessage = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { content, context } = req.body;
            const orgId = req.orgId!;

            // Generar respuesta usando el servicio de IA
            const response = await aiService.generateChatResponse(orgId, content, context);

            const userMessage = {
                id: uuidv4(),
                sessionId: id,
                role: 'user' as const,
                content,
                timestamp: new Date().toISOString()
            };

            const aiResponse = {
                id: uuidv4(),
                sessionId: id,
                role: 'assistant' as const,
                content: response.text,
                timestamp: new Date().toISOString(),
                metadata: {
                    module: 'ai-analysis',
                    data: response.data,
                    references: response.data ? [
                        {
                            type: 'analysis',
                            id: 'analysis-' + Date.now(),
                            name: 'Análisis de Datos',
                            description: 'Basado en datos reales del sistema'
                        }
                    ] : [],
                    suggestions: response.suggestions || []
                }
            };

            res.json({
                success: true,
                data: aiResponse,
                meta: {
                    processingTime: 500,
                    dataSource: 'real'
                }
            });

        } catch (error) {
            logger.error('Error enviando mensaje de chat', { error, sessionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener recomendaciones específicas de vehículos
    getVehicleSpecificRecommendations = async (req: Request, res: Response) => {
        try {
            const orgId = req.orgId!;

            const recommendations = await aiService.generateVehicleSpecificRecommendations(orgId);

            res.json({
                success: true,
                data: recommendations,
                meta: {
                    total: recommendations.length,
                    vehicleSpecific: recommendations.filter(r => r.vehicleSpecific).length
                }
            });

        } catch (error) {
            logger.error('Error obteniendo recomendaciones específicas de vehículos', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Explicar sugerencia específica
    explainSuggestion = async (req: Request, res: Response) => {
        try {
            const { suggestionId } = req.params;
            const { context } = req.body;
            const orgId = req.orgId!;

            // Generar explicación detallada usando el servicio de IA
            const explanation = await aiService.explainSuggestion(orgId, suggestionId, context);

            res.json({
                success: true,
                data: explanation,
                meta: {
                    processingTime: 300,
                    suggestionId
                }
            });

        } catch (error) {
            logger.error('Error explicando sugerencia', { error, suggestionId: req.params.suggestionId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener predicciones
    getPredictions = async (req: Request, res: Response) => {
        try {
            const { metric, timeframe } = req.query;
            const orgId = req.orgId!;

            // Mock predictions para desarrollo
            const mockPredictions = [
                {
                    id: 'pred-1',
                    metric: metric as string || 'efficiency',
                    currentValue: 85,
                    predictedValue: 92,
                    confidence: 88,
                    timeframe: timeframe as string || 'next_week',
                    factors: ['Optimización de rutas', 'Reducción de inactividad'],
                    scenario: 'realistic',
                    data: { trend: 'up', volatility: 'low' }
                }
            ];

            res.json({
                success: true,
                data: mockPredictions
            });

        } catch (error) {
            logger.error('Error obteniendo predicciones', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener patrones
    getPatterns = async (req: Request, res: Response) => {
        try {
            const { days } = req.query;
            const orgId = req.orgId!;

            const daysNumber = days ? Number(days) : 30;
            const analysis = await aiService.analyzeStabilityData(orgId, daysNumber);

            res.json({
                success: true,
                data: analysis.patterns
            });

        } catch (error) {
            logger.error('Error obteniendo patrones', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Generar sugerencias
    generateSuggestions = async (req: Request, res: Response) => {
        try {
            const { module, context } = req.body;
            const orgId = req.orgId!;

            // Mock suggestions para desarrollo
            const mockSuggestions = [
                {
                    id: 'sugg-' + Date.now(),
                    type: 'optimization',
                    title: 'Optimización automática',
                    description: 'Sugerencia generada automáticamente basada en el contexto',
                    priority: 'medium',
                    actionable: true,
                    confidence: 80,
                    reasoning: ['Análisis de datos', 'Tendencias identificadas'],
                    estimatedImpact: [
                        { metric: 'Eficiencia', change: 10, direction: 'increase' }
                    ]
                }
            ];

            res.json({
                success: true,
                data: mockSuggestions
            });

        } catch (error) {
            logger.error('Error generando sugerencias', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Aplicar sugerencia
    applySuggestion = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { parameters } = req.body;
            const orgId = req.orgId!;

            // TODO: Implementar aplicación real de sugerencia
            // const result = await aiService.applySuggestion(id, parameters);

            const mockResult = {
                id: uuidv4(),
                suggestionId: id,
                status: 'applied',
                parameters,
                result: 'Sugerencia aplicada exitosamente',
                createdAt: new Date().toISOString()
            };

            res.json({
                success: true,
                data: mockResult
            });

        } catch (error) {
            logger.error('Error aplicando sugerencia', { error, suggestionId: req.params.id });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener explicación para módulo específico
    getModuleExplanation = async (req: Request, res: Response) => {
        try {
            const { module } = req.params;
            const { context } = req.body;
            const orgId = req.orgId!;

            // Mock explanation para desarrollo
            const mockExplanation = {
                id: uuidv4(),
                orgId,
                module,
                context,
                data: context,
                explanation: `Explicación específica para el módulo ${module}. Los datos analizados muestran patrones interesantes que requieren atención.`,
                confidence: 85,
                references: [],
                suggestions: [],
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                metadata: {
                    model: 'gpt-4',
                    version: '1.0.0',
                    processingTime: 1000,
                    tokensUsed: 350,
                    contextSize: 1024,
                    dataPoints: 100,
                    analysisDepth: 'medium',
                    language: 'es'
                }
            };

            res.json({
                success: true,
                data: mockExplanation
            });

        } catch (error) {
            logger.error('Error obteniendo explicación del módulo', { error, module: req.params.module });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener estadísticas de IA
    getAIStats = async (req: Request, res: Response) => {
        try {
            const orgId = req.orgId!;

            const stats = await aiService.getAIStats(orgId);

            res.json({
                success: true,
                data: {
                    ...stats,
                    totalChatSessions: 1,
                    averageConfidence: 90,
                    performance: {
                        averageResponseTime: 500,
                        successRate: 100,
                        errorRate: 0
                    }
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de IA', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Obtener configuración de IA
    getAISettings = async (req: Request, res: Response) => {
        try {
            const orgId = req.orgId!;

            // Mock settings para desarrollo
            const mockSettings = {
                enabled: true,
                model: 'gpt-4',
                maxTokens: 2000,
                temperature: 0.7,
                language: 'es',
                detailLevel: 'detailed',
                includeSuggestions: true,
                includeReferences: true,
                autoAnalysis: true,
                analysisInterval: 60,
                cacheExpiration: 24,
                rateLimit: {
                    requestsPerMinute: 10,
                    requestsPerHour: 100,
                    requestsPerDay: 1000
                },
                modules: {
                    panel: true,
                    telemetry: true,
                    stability: true,
                    reports: true,
                    uploads: true
                },
                features: {
                    chat: true,
                    explanations: true,
                    suggestions: true,
                    predictions: true,
                    patterns: true
                }
            };

            res.json({
                success: true,
                data: mockSettings
            });

        } catch (error) {
            logger.error('Error obteniendo configuración de IA', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // Actualizar configuración de IA
    updateAISettings = async (req: Request, res: Response) => {
        try {
            const settings = req.body;
            const orgId = req.orgId!;

            // TODO: Validar y guardar configuración
            // await aiService.updateSettings(orgId, settings);

            res.json({
                success: true,
                data: settings
            });

        } catch (error) {
            logger.error('Error actualizando configuración de IA', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    // NUEVO: Análisis optimizado en tiempo real
    getOptimizedAnalysis = async (req: Request, res: Response) => {
        try {
            const { timeWindow = '24h' } = req.query;
            const orgId = req.orgId!;

            const analysis = await aiService.getOptimizedAnalysis(orgId, timeWindow as any);

            res.json({
                success: true,
                data: analysis,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error en análisis optimizado', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error al realizar análisis optimizado'
            });
        }
    };

    // NUEVO: Generar explicación contextual específica
    generateContextualExplanation = async (req: Request, res: Response) => {
        try {
            const { module, context, analysisType = 'comprehensive', depth = 'medium', language = 'es' } = req.body;
            const orgId = req.orgId!;

            logger.info('Generando explicación contextual', {
                orgId,
                module,
                context,
                analysisType,
                depth
            });

            const explanation = await this.advancedAIService.generateAdvancedExplanation(
                orgId,
                module || 'general',
                context || 'análisis contextual',
                analysisType,
                depth,
                language
            );

            res.json({
                success: true,
                data: explanation,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error generando explicación contextual', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error al generar explicación contextual'
            });
        }
    };
}
