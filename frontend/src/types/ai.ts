// DTOs para el módulo de IA/Explicabilidad
export interface AIExplanationDTO {
    id: string;
    orgId: string;
    module: 'panel' | 'telemetry' | 'stability' | 'reports' | 'uploads';
    context: string;
    data: any;
    explanation: string;
    confidence: number; // 0-100
    references: AIReference[];
    suggestions: AISuggestion[];
    createdAt: string;
    expiresAt: string;
    metadata: AIMetadata;
}

export interface AIReference {
    type: 'kpi' | 'endpoint' | 'session' | 'event' | 'metric';
    id: string;
    name: string;
    value?: any;
    description?: string;
    url?: string;
}

export interface AISuggestion {
    id: string;
    type: 'alert' | 'geofence' | 'action' | 'investigation' | 'optimization' | 'maintenance' | 'training';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionable: boolean;
    actionUrl?: string;
    parameters?: Record<string, any>;
    confidence: number; // 0-100
    reasoning: string[];
    estimatedImpact: {
        metric: string;
        change: number; // percentage
        direction: 'increase' | 'decrease';
    }[];
    vehicleSpecific?: boolean;
    vehicleId?: string;
    vehicleName?: string;
    steps?: string[];
}

export interface AIMetadata {
    model: string;
    version: string;
    processingTime: number; // milliseconds
    tokensUsed: number;
    contextSize: number;
    dataPoints: number;
    analysisDepth: 'surface' | 'medium' | 'deep';
    language: string;
}

export interface AIChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        module?: string;
        context?: any;
        references?: AIReference[];
        suggestions?: AISuggestion[];
    };
}

export interface AIChatSession {
    id: string;
    orgId: string;
    userId: string;
    title: string;
    messages: AIChatMessage[];
    context: AIChatContext;
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'archived' | 'deleted';
}

export interface AIChatContext {
    currentModule?: string;
    filters?: Record<string, any>;
    selectedData?: any;
    conversationHistory?: string[];
    userPreferences?: {
        detailLevel: 'basic' | 'detailed' | 'expert';
        language: string;
        includeSuggestions: boolean;
        includeReferences: boolean;
    };
}

export interface AIAnalysisRequest {
    module: 'panel' | 'telemetry' | 'stability' | 'reports' | 'uploads';
    context: string;
    data: any;
    filters?: Record<string, any>;
    analysisType: 'trend' | 'anomaly' | 'comparison' | 'prediction' | 'optimization';
    depth: 'surface' | 'medium' | 'deep';
    includeSuggestions: boolean;
    language: string;
}

export interface AIAnalysisResponse {
    explanation: AIExplanationDTO;
    insights: AIInsight[];
    recommendations: AIRecommendation[];
    warnings: AIWarning[];
    nextSteps: string[];
}

export interface AIInsight {
    id: string;
    type: 'trend' | 'anomaly' | 'pattern' | 'correlation' | 'prediction';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    visualization?: {
        type: 'chart' | 'table' | 'map' | 'timeline';
        config: any;
    };
}

export interface AIRecommendation {
    id: string;
    category: 'performance' | 'safety' | 'efficiency' | 'maintenance' | 'optimization';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionable: boolean;
    estimatedEffort: 'low' | 'medium' | 'high';
    estimatedImpact: {
        metric: string;
        change: number;
        direction: 'increase' | 'decrease';
    }[];
    steps: string[];
    resources?: string[];
}

export interface AIWarning {
    id: string;
    type: 'data_quality' | 'performance' | 'safety' | 'compliance' | 'system';
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    affectedData?: any;
    resolution?: string;
    autoResolvable: boolean;
}

export interface AIPrediction {
    id: string;
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: string;
    factors: string[];
    scenario: 'optimistic' | 'realistic' | 'pessimistic';
    data: any;
}

export interface AIPattern {
    id: string;
    type: 'temporal' | 'spatial' | 'behavioral' | 'anomaly';
    title: string;
    description: string;
    frequency: number;
    confidence: number;
    examples: any[];
    conditions: string[];
    implications: string[];
}

export interface AIFilters {
    module?: 'panel' | 'telemetry' | 'stability' | 'reports' | 'uploads';
    analysisType?: 'trend' | 'anomaly' | 'comparison' | 'prediction' | 'optimization';
    confidence?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    from?: string;
    to?: string;
    includeSuggestions?: boolean;
}

export interface AIStats {
    totalExplanations: number;
    totalChatSessions: number;
    totalMessages: number;
    averageConfidence: number;
    topModules: {
        module: string;
        count: number;
        avgConfidence: number;
    }[];
    topInsights: {
        type: string;
        count: number;
        avgConfidence: number;
    }[];
    userSatisfaction: {
        rating: number;
        feedback: string;
    }[];
    performance: {
        averageResponseTime: number;
        successRate: number;
        errorRate: number;
    };
}

export interface AISettings {
    enabled: boolean;
    model: string;
    maxTokens: number;
    temperature: number;
    language: string;
    detailLevel: 'basic' | 'detailed' | 'expert';
    includeSuggestions: boolean;
    includeReferences: boolean;
    autoAnalysis: boolean;
    analysisInterval: number; // minutes
    cacheExpiration: number; // hours
    rateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    modules: {
        panel: boolean;
        telemetry: boolean;
        stability: boolean;
        reports: boolean;
        uploads: boolean;
    };
    features: {
        chat: boolean;
        explanations: boolean;
        suggestions: boolean;
        predictions: boolean;
        patterns: boolean;
    };
}

// Respuestas de API
export interface AIApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        processingTime?: number;
        tokensUsed?: number;
        confidence?: number;
    };
}

// Tipos para integración con otros módulos
export interface AIPanelIntegration {
    kpiId: string;
    explanation: string;
    suggestions: AISuggestion[];
    trends: AIInsight[];
    warnings: AIWarning[];
}

export interface AITelemetryIntegration {
    sessionId: string;
    explanation: string;
    patterns: AIPattern[];
    anomalies: AIInsight[];
    recommendations: AIRecommendation[];
}

export interface AIStabilityIntegration {
    sessionId: string;
    explanation: string;
    riskFactors: string[];
    recommendations: AIRecommendation[];
    predictions: AIPrediction[];
}

export interface AIReportsIntegration {
    reportId: string;
    explanation: string;
    insights: AIInsight[];
    recommendations: AIRecommendation[];
    executiveSummary: string;
}

export interface AIUploadsIntegration {
    batchId: string;
    explanation: string;
    qualityIssues: AIWarning[];
    suggestions: AISuggestion[];
    patterns: AIPattern[];
}

// Tipos para eventos en tiempo real
export interface AIRealtimeEvent {
    type: 'explanation_ready' | 'suggestion_generated' | 'warning_triggered' | 'analysis_complete';
    timestamp: string;
    data: {
        explanationId?: string;
        suggestionId?: string;
        warningId?: string;
        analysisId?: string;
        module?: string;
        context?: any;
    };
}
