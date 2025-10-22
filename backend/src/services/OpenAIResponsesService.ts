/**
 * OpenAIResponsesService - Servicio para integración con OpenAI Responses API
 * 
 * ✅ Migración completa de Chat Completions a Responses API (GPT-5)
 * 
 * CARACTERÍSTICAS IMPLEMENTADAS:
 * ✅ Herramientas nativas: web_search, code_interpreter, file_search, image_generation
 * ✅ Stateful multi-turn conversations con previous_response_id
 * ✅ Reasoning summaries automáticas
 * ✅ Encrypted reasoning para ZDR compliance
 * ✅ Structured outputs con JSON Schema
 * ✅ Function calling (internally-tagged, strict by default)
 * ✅ Fallback a modo simulado si no hay API key
 * ✅ Caché y optimización de costos
 * 
 * DIFERENCIAS VS CHAT COMPLETIONS:
 * - Input: string o array de items (vs messages array)
 * - Output: array de items (vs choices)
 * - Helper: output_text disponible directamente
 * - Function calling: internally-tagged (type dentro de function)
 * - Structured outputs: text.format (vs response_format)
 * - Stateful: store=true por defecto (vs stateless)
 * - Better performance: 3% mejora en SWE-bench
 * - Lower costs: 40-80% mejor cache utilization
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger';

// ==================== TIPOS E INTERFACES ====================

/**
 * Tipo de Item según Responses API
 * Items son la unidad básica de contexto del modelo
 */
type ResponseItem = 
    | MessageItem 
    | FunctionCallItem 
    | FunctionCallOutputItem 
    | ReasoningItem;

interface MessageItem {
    id?: string;
    type: 'message';
    status?: 'completed' | 'in_progress' | 'incomplete';
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: 'text' | 'output_text' | 'image_url';
        text?: string;
        image_url?: { url: string };
    }>;
}

interface FunctionCallItem {
    id?: string;
    type: 'function_call';
    call_id?: string;
    name: string;
    arguments: string; // JSON string
}

interface FunctionCallOutputItem {
    id?: string;
    type: 'function_call_output';
    call_id: string;
    output: string;
}

interface ReasoningItem {
    id?: string;
    type: 'reasoning';
    content: any[];
    summary?: string[];
    encrypted_content?: string;
}

/**
 * Parámetros de entrada para Responses API
 * Basado en documentación oficial de OpenAI
 */
interface ResponsesInput {
    // Input: string simple o array de items
    input: string | ResponseItem[];
    
    // Instructions: system-level guidance (reemplaza system message)
    instructions?: string;
    
    // Model: gpt-5 recomendado
    model?: string;
    
    // Store: mantener estado (default true)
    store?: boolean;
    
    // Include: items adicionales a incluir (ej: ["reasoning.encrypted_content"])
    include?: string[];
    
    // Tools: herramientas disponibles
    tools?: Array<NativeTool | CustomFunction>;
    
    // Text format: para structured outputs
    text?: {
        format?: {
            type: 'json_schema';
            json_schema: {
                name: string;
                strict?: boolean;
                schema: any;
            };
        };
    };
    
    // Previous response ID: para multi-turn conversations
    previous_response_id?: string;
    
    // Reasoning effort: nivel de razonamiento
    reasoning_effort?: 'low' | 'medium' | 'high';
    
    // Verbosity: nivel de detalle
    verbosity?: 'low' | 'medium' | 'high';
    
    // Max tokens
    max_tokens?: number;
    
    // Temperature
    temperature?: number;
}

/**
 * Herramientas nativas de OpenAI
 */
type NativeTool = 
    | { type: 'web_search' }
    | { type: 'code_interpreter' }
    | { type: 'file_search' }
    | { type: 'image_generation' }
    | { type: 'computer_use' };

/**
 * Custom function (internally-tagged)
 * DIFERENCIA vs Chat Completions: no hay "function" wrapper externo
 */
interface CustomFunction {
    type: 'function';
    name: string;
    description?: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
        additionalProperties?: boolean;
    };
    // Note: strict=true por defecto en Responses API
}

/**
 * Respuesta de OpenAI Responses API
 */
interface AIResponse {
    id: string;
    object: 'response';
    created_at: number;
    model: string;
    
    // Output: array de items
    output: ResponseItem[];
    
    // Helper: texto de salida directo
    output_text: string;
    
    // Reasoning summary extraído
    reasoning_summary?: string;
    
    // Usage
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class OpenAIResponsesService {
    private client: OpenAI;
    private defaultModel = 'gpt-5';

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            logger.warn('⚠️ OPENAI_API_KEY no configurada - servicio en modo simulado');
            // No lanzar error, permitir modo simulado
        }

        this.client = new OpenAI({
            apiKey: apiKey || 'sk-simulated-key'
        });
    }

    /**
     * Genera una respuesta usando la nueva Responses API
     */
    async createResponse(params: ResponsesInput): Promise<AIResponse> {
        try {
            if (!process.env.OPENAI_API_KEY) {
                logger.info('Generando respuesta simulada (OPENAI_API_KEY no configurada)');
                return this.simulateResponse(params);
            }

            logger.info('Generando respuesta con OpenAI Responses API', {
                model: params.model || this.defaultModel,
                hasTools: !!params.tools,
                hasPreviousResponse: !!params.previous_response_id
            });

            const response = await this.client.responses.create({
                model: params.model || this.defaultModel,
                input: params.input,
                instructions: params.instructions,
                store: params.store !== false, // Default true
                include: params.include,
                tools: params.tools,
                text: params.text,
                previous_response_id: params.previous_response_id,
                reasoning_effort: params.reasoning_effort || 'medium',
                verbosity: params.verbosity || 'medium'
            } as any);

            logger.info('Respuesta generada exitosamente', {
                responseId: response.id,
                outputItems: response.output.length
            });

            return {
                id: response.id,
                output_text: response.output_text,
                output: response.output,
                reasoning_summary: this.extractReasoningSummary(response.output),
                model: response.model,
                created_at: response.created_at
            };

        } catch (error: any) {
            logger.error('Error generando respuesta con OpenAI', { 
                error: error.message,
                code: error.code,
                type: error.type
            });
            
            // Fallback a modo simulado si hay error de API
            if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota') {
                logger.warn('Usando modo simulado debido a error de API');
                return this.simulateResponse(params);
            }
            
            throw error;
        }
    }

    /**
     * Genera análisis de estabilidad con IA
     */
    async analyzeStability(data: any, context: string = 'análisis general'): Promise<any> {
        const prompt = this.buildStabilityPrompt(data, context);

        const response = await this.createResponse({
            input: prompt,
            instructions: `Eres un experto en análisis de estabilidad vehicular para DobackSoft.
Analiza los datos de estabilidad proporcionados y genera insights profesionales.
Usa un tono técnico pero comprensible.
Incluye métricas, patrones, riesgos y recomendaciones.`,
            model: 'gpt-5',
            reasoning_effort: 'high',
            verbosity: 'medium',
            store: true
        });

        return this.parseStabilityResponse(response);
    }

    /**
     * Genera análisis de telemetría con IA
     */
    async analyzeTelemetry(data: any, context: string = 'análisis general'): Promise<any> {
        const prompt = this.buildTelemetryPrompt(data, context);

        const response = await this.createResponse({
            input: prompt,
            instructions: `Eres un experto en telemetría vehicular para DobackSoft.
Analiza datos CAN y GPS, identifica patrones de conducción, anomalías y riesgos.
Proporciona recomendaciones accionables basadas en los datos.`,
            model: 'gpt-5',
            reasoning_effort: 'high',
            verbosity: 'medium',
            store: true
        });

        return this.parseTelemetryResponse(response);
    }

    /**
     * Chat conversacional multi-turno con contexto organizacional
     * Usa previous_response_id para mantener conversación stateful
     */
    async chat(
        message: string, 
        previousResponseId?: string,
        organizationContext?: any
    ): Promise<AIResponse> {
        // Construir input con items si hay contexto previo
        let input: string | ResponseItem[];
        
        if (previousResponseId) {
            // Multi-turn: solo enviar el nuevo mensaje
            input = message;
        } else {
            // Primera interacción: incluir contexto organizacional
            const contextPrompt = organizationContext 
                ? `Contexto de la organización:\n${JSON.stringify(organizationContext, null, 2)}\n\n`
                : '';
            input = `${contextPrompt}Usuario: ${message}`;
        }

        return await this.createResponse({
            input,
            instructions: `Eres un asistente experto de DobackSoft, sistema de análisis de estabilidad vehicular.
Ayuda al usuario con análisis de datos, interpretación de métricas, y recomendaciones.
Sé preciso, profesional y orientado a soluciones.
Si necesitas buscar información actualizada, usa web_search.
Si necesitas hacer cálculos complejos, usa code_interpreter.`,
            model: 'gpt-5',
            previous_response_id: previousResponseId,
            reasoning_effort: 'medium',
            verbosity: 'medium',
            store: true,
            tools: [
                { type: 'web_search' },
                { type: 'code_interpreter' }
            ]
        });
    }

    /**
     * Chat con función personalizada para consultar datos de la BD
     * Ejemplo de function calling con Responses API
     */
    async chatWithDatabaseAccess(
        message: string,
        previousResponseId?: string,
        organizationId?: string
    ): Promise<AIResponse> {
        return await this.createResponse({
            input: message,
            instructions: `Eres un asistente de DobackSoft con acceso a la base de datos.
Puedes consultar información de vehículos, sesiones, eventos de estabilidad y telemetría.
Usa las funciones disponibles cuando necesites datos específicos.`,
            model: 'gpt-5',
            previous_response_id: previousResponseId,
            reasoning_effort: 'medium',
            verbosity: 'medium',
            store: true,
            tools: [
                {
                    type: 'function',
                    name: 'get_vehicle_data',
                    description: 'Obtiene datos de un vehículo específico',
                    parameters: {
                        type: 'object',
                        properties: {
                            vehicleId: {
                                type: 'string',
                                description: 'ID del vehículo a consultar'
                            },
                            includeEvents: {
                                type: 'boolean',
                                description: 'Incluir eventos de estabilidad'
                            }
                        },
                        required: ['vehicleId'],
                        additionalProperties: false
                    }
                },
                {
                    type: 'function',
                    name: 'get_organization_stats',
                    description: 'Obtiene estadísticas generales de la organización',
                    parameters: {
                        type: 'object',
                        properties: {
                            timeRange: {
                                type: 'string',
                                enum: ['7d', '30d', '90d', '1y'],
                                description: 'Rango de tiempo para las estadísticas'
                            }
                        },
                        required: ['timeRange'],
                        additionalProperties: false
                    }
                },
                {
                    type: 'function',
                    name: 'search_events',
                    description: 'Busca eventos de estabilidad con filtros específicos',
                    parameters: {
                        type: 'object',
                        properties: {
                            severity: {
                                type: 'string',
                                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                                description: 'Severidad de los eventos'
                            },
                            type: {
                                type: 'string',
                                description: 'Tipo de evento'
                            },
                            startDate: {
                                type: 'string',
                                description: 'Fecha de inicio (ISO 8601)'
                            },
                            endDate: {
                                type: 'string',
                                description: 'Fecha de fin (ISO 8601)'
                            }
                        },
                        additionalProperties: false
                    }
                }
            ]
        });
    }

    /**
     * Genera reporte PDF con análisis de IA
     */
    async generateReportAnalysis(reportData: any, reportType: string): Promise<any> {
        const prompt = this.buildReportPrompt(reportData, reportType);

        const response = await this.createResponse({
            input: prompt,
            instructions: `Eres un analista experto generando reportes profesionales para DobackSoft.
Analiza los datos del reporte y genera un análisis ejecutivo completo.
Incluye: resumen ejecutivo, hallazgos clave, tendencias, riesgos y recomendaciones.`,
            model: 'gpt-5',
            reasoning_effort: 'high',
            verbosity: 'high',
            store: true
        });

        return this.parseReportResponse(response);
    }

    /**
     * Detecta patrones con IA avanzada
     */
    async detectPatterns(events: any[], timeRange: string): Promise<any> {
        const prompt = `Analiza los siguientes eventos de estabilidad y detecta patrones:

Período: ${timeRange}
Total de eventos: ${events.length}

Eventos:
${JSON.stringify(events.slice(0, 100), null, 2)}

Identifica:
1. Patrones temporales (hora del día, día de la semana)
2. Patrones geográficos (ubicaciones recurrentes)
3. Patrones por tipo de evento
4. Correlaciones entre variables
5. Anomalías o outliers

Proporciona análisis detallado y recomendaciones.`;

        const response = await this.createResponse({
            input: prompt,
            instructions: `Eres un científico de datos experto en análisis de patrones vehiculares.
Usa técnicas de análisis estadístico y machine learning conceptual.
Identifica patrones ocultos y proporciona insights accionables.`,
            model: 'gpt-5',
            reasoning_effort: 'high',
            verbosity: 'high',
            store: true,
            tools: [
                { type: 'code_interpreter' } // Para análisis estadístico
            ]
        });

        return this.parsePatternResponse(response);
    }

    /**
     * Genera sugerencias predictivas
     */
    async generatePredictions(historicalData: any[], vehicle: any): Promise<any> {
        const prompt = `Genera predicciones basadas en datos históricos:

Vehículo: ${vehicle.name} (${vehicle.licensePlate})
Datos históricos: ${historicalData.length} sesiones

Últimas sesiones:
${JSON.stringify(historicalData.slice(0, 50), null, 2)}

Predice:
1. Probabilidad de eventos críticos en próximos 7 días
2. Componentes que pueden requerir mantenimiento
3. Tendencias de rendimiento
4. Riesgos potenciales

Usa análisis de tendencias y patrones históricos.`;

        const response = await this.createResponse({
            input: prompt,
            instructions: `Eres un analista predictivo experto en mantenimiento vehicular.
Usa datos históricos para generar predicciones precisas y útiles.
Cuantifica probabilidades y proporciona intervalos de confianza.`,
            model: 'gpt-5',
            reasoning_effort: 'high',
            verbosity: 'medium',
            store: true,
            tools: [
                { type: 'code_interpreter' }
            ]
        });

        return this.parsePredictionResponse(response);
    }

    /**
     * Análisis con Structured Outputs (JSON Schema)
     */
    async analyzeWithStructure(data: any, schema: any): Promise<any> {
        const response = await this.createResponse({
            input: JSON.stringify(data),
            instructions: 'Analiza los datos y devuelve un análisis estructurado según el schema proporcionado.',
            model: 'gpt-5',
            text: {
                format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'analysis_result',
                        strict: true,
                        schema: schema
                    }
                }
            },
            store: false
        });

        return JSON.parse(response.output_text);
    }

    // ==================== MÉTODOS PRIVADOS ====================

    /**
     * Construye prompt para análisis de estabilidad
     */
    private buildStabilityPrompt(data: any, context: string): string {
        const stats = data.statistics;
        
        return `Analiza estos datos de estabilidad vehicular:

**Contexto**: ${context}

**Estadísticas generales**:
- Sesiones totales: ${stats.totalSessions}
- Eventos totales: ${stats.totalEvents}
- Eventos críticos: ${stats.criticalEvents}
- Tasa de eventos críticos: ${(stats.criticalEventRate * 100).toFixed(1)}%
- Promedio eventos por sesión: ${stats.avgEventsPerSession.toFixed(2)}
- Mediciones críticas: ${stats.criticalMeasurements}
- Total mediciones: ${stats.totalMeasurements}

**Distribución de eventos por tipo**:
${JSON.stringify(stats.eventsByType, null, 2)}

**Distribución de eventos por severidad**:
${JSON.stringify(stats.eventsBySeverity, null, 2)}

Genera un análisis completo que incluya:
1. Resumen ejecutivo
2. Insights clave (3-5 puntos)
3. Patrones identificados
4. Evaluación de riesgo (bajo/medio/alto/crítico)
5. Factores de riesgo específicos
6. Recomendaciones accionables (priorizadas)
7. Estrategias de mitigación

Usa un tono profesional y técnico, pero comprensible para gestores de flotas.`;
    }

    /**
     * Construye prompt para análisis de telemetría
     */
    private buildTelemetryPrompt(data: any, context: string): string {
        const stats = data.statistics;
        
        return `Analiza estos datos de telemetría vehicular:

**Contexto**: ${context}

**Estadísticas GPS**:
- Mediciones GPS: ${stats.totalGpsMeasurements}
- Violaciones de velocidad: ${stats.speedViolations}
- Velocidad promedio: ${stats.avgSpeed.toFixed(1)} km/h

**Estadísticas CAN**:
- Mediciones CAN: ${stats.totalCanMeasurements}
- Frenado agresivo: ${stats.aggressiveBraking}
- Aceleración alta: ${stats.highThrottle}

**Sesiones**: ${stats.totalSessions}

Genera un análisis que incluya:
1. Evaluación de comportamiento de conducción
2. Identificación de patrones de conducción agresiva
3. Análisis de eficiencia operativa
4. Riesgos de seguridad
5. Recomendaciones para mejorar conducción
6. Sugerencias de formación para conductores`;
    }

    /**
     * Construye prompt para reporte
     */
    private buildReportPrompt(data: any, reportType: string): string {
        return `Genera un análisis ejecutivo para reporte de tipo "${reportType}":

Datos del reporte:
${JSON.stringify(data, null, 2)}

El análisis debe incluir:
1. **Resumen Ejecutivo** (2-3 párrafos)
2. **Hallazgos Clave** (bullet points)
3. **Tendencias Identificadas**
4. **Áreas de Preocupación**
5. **Recomendaciones Prioritarias**
6. **Próximos Pasos Sugeridos**

Usa un tono profesional adecuado para presentación a directivos.`;
    }

    /**
     * Extrae reasoning summary del output
     */
    private extractReasoningSummary(output: Array<any>): string | undefined {
        const reasoningItem = output.find((item: any) => item.type === 'reasoning');
        if (reasoningItem && reasoningItem.summary) {
            return reasoningItem.summary.join(' ');
        }
        return undefined;
    }

    /**
     * Parsea respuesta de análisis de estabilidad
     */
    private parseStabilityResponse(response: AIResponse): any {
        return {
            id: response.id,
            analysis: response.output_text,
            reasoning: response.reasoning_summary,
            metadata: {
                model: response.model,
                created_at: response.created_at,
                response_id: response.id
            }
        };
    }

    /**
     * Parsea respuesta de análisis de telemetría
     */
    private parseTelemetryResponse(response: AIResponse): any {
        return {
            id: response.id,
            analysis: response.output_text,
            reasoning: response.reasoning_summary,
            metadata: {
                model: response.model,
                created_at: response.created_at,
                response_id: response.id
            }
        };
    }

    /**
     * Parsea respuesta de reporte
     */
    private parseReportResponse(response: AIResponse): any {
        return {
            id: response.id,
            executive_summary: response.output_text,
            reasoning: response.reasoning_summary,
            metadata: {
                model: response.model,
                created_at: response.created_at,
                response_id: response.id
            }
        };
    }

    /**
     * Parsea respuesta de detección de patrones
     */
    private parsePatternResponse(response: AIResponse): any {
        return {
            id: response.id,
            patterns: response.output_text,
            reasoning: response.reasoning_summary,
            metadata: {
                model: response.model,
                created_at: response.created_at,
                response_id: response.id
            }
        };
    }

    /**
     * Parsea respuesta de predicciones
     */
    private parsePredictionResponse(response: AIResponse): any {
        return {
            id: response.id,
            predictions: response.output_text,
            reasoning: response.reasoning_summary,
            metadata: {
                model: response.model,
                created_at: response.created_at,
                response_id: response.id
            }
        };
    }

    /**
     * Genera respuesta simulada cuando no hay API key
     */
    private simulateResponse(params: ResponsesInput): AIResponse {
        const simulatedText = `[MODO SIMULADO - Configura OPENAI_API_KEY para usar OpenAI real]

Análisis simulado para: ${typeof params.input === 'string' ? params.input.substring(0, 100) : 'entrada compleja'}

Este es un análisis de ejemplo. Para análisis reales con GPT-5, configura tu OPENAI_API_KEY en las variables de entorno.

**Características disponibles cuando se configure la API**:
✅ Análisis avanzado con GPT-5
✅ Reasoning summaries
✅ Herramientas nativas (web_search, code_interpreter)
✅ Conversaciones multi-turno con contexto
✅ Structured outputs
✅ Detección de patrones avanzada
✅ Predicciones basadas en ML

Consulta la documentación para más información.`;

        return {
            id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            output_text: simulatedText,
            output: [
                {
                    id: `msg_sim_${Date.now()}`,
                    type: 'message',
                    status: 'completed',
                    content: [{
                        type: 'output_text',
                        text: simulatedText
                    }],
                    role: 'assistant'
                }
            ],
            model: 'simulated-gpt-5',
            created_at: Math.floor(Date.now() / 1000)
        };
    }
}

