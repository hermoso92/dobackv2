// DTOs para el módulo de Estabilidad

// Alias para compatibilidad con código existente
export type StabilitySession = StabilitySessionDTO;
export type StabilityEvent = StabilityEventDTO;
export type StabilityEventType = StabilityEventDTO['type'];
export type StabilityDataPoint = {
    timestamp: string;
    time?: number;
    // Aceleraciones (en g)
    ax: number;
    ay: number;
    az: number;
    // Velocidades angulares (en °/s)
    gx: number;
    gy: number;
    gz: number;
    // Orientación (en grados)
    roll: number;
    pitch: number;
    yaw: number;
    // Métricas de estabilidad
    si: number;
    accmag: number;
    // Ubicación GPS (opcional)
    lat?: number;
    lon?: number;
    // Velocidad (opcional)
    speed?: number;
    // Campos adicionales opcionales (para compatibilidad con código existente)
    lateralAcceleration?: number;
    longitudinalAcceleration?: number;
    verticalAcceleration?: number;
    rpm?: number;
    temperature?: number;
    stabilityIndex?: number;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    instabilityCount?: number;
    criticalEventsCount?: number;
};

export type VariableGroup = {
    title: string;
    variables: Array<{
        key: string;
        label: string;
        unit: string;
        group: string;
    }>;
};

export type Alarm = {
    id: string;
    vehicleId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
    resolved: boolean;
};

export type DangerInfo = {
    level: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
};

export type TrendInfo = {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    confidence: number;
};

export type DatabaseStabilityData = {
    id: string;
    sessionId: string;
    timestamp: string;
    data: StabilityDataPoint;
};

export const STABILITY_CONFIG = {
    THRESHOLDS: {
        CRITICAL: 0.8,
        DANGER: 0.6,
        MODERATE: 0.4,
        LOW: 0.2
    },
    VARIABLES: {
        ROLL: 'roll',
        PITCH: 'pitch',
        YAW: 'yaw',
        LATERAL_ACCELERATION: 'lateralAcceleration',
        LONGITUDINAL_ACCELERATION: 'longitudinalAcceleration',
        VERTICAL_ACCELERATION: 'verticalAcceleration'
    }
};
export interface StabilitySessionDTO {
    id: string;
    orgId?: string;
    vehicleId: string;
    vehicleName?: string;
    startedAt?: string;
    startTime?: string; // Alias de startedAt para compatibilidad
    endedAt?: string;
    endTime?: string; // Alias de endedAt para compatibilidad
    duration?: number; // en segundos
    status?: 'active' | 'completed' | 'failed' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
    metrics?: StabilityMetrics;
    events?: StabilityEventDTO[];
    summary?: StabilitySummary;
    version?: number;
    // Campos adicionales para sesiones reales de la base de datos
    dataPoints?: number; // Número de mediciones de estabilidad
    gpsPoints?: number; // Número de puntos GPS
    sessionNumber?: number;
    type?: string;
    canData?: any[]; // Para filtrar sesiones CAN
}

export interface StabilityMetrics {
    // Métricas principales
    overallStability: number; // 0-100%
    lateralAcceleration: {
        max: number;
        avg: number;
        std: number;
    };
    longitudinalAcceleration: {
        max: number;
        avg: number;
        std: number;
    };
    verticalAcceleration: {
        max: number;
        avg: number;
        std: number;
    };

    // Métricas derivadas
    stabilityIndex: number; // Índice compuesto
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    instabilityCount: number;
    criticalEventsCount: number;

    // Timestamps de eventos
    firstInstability?: string;
    lastInstability?: string;
    peakInstability?: string;
}

export interface StabilityEventDTO {
    id: string;
    sessionId: string;
    timestamp: string;
    type: 'lateral_instability' | 'longitudinal_instability' | 'vertical_instability' | 'combined_instability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    duration: number; // en segundos
    maxAcceleration: number;
    location?: {
        lat: number;
        lng: number;
    };
    context?: {
        speed: number;
        heading: number;
        roadType?: string;
    };
    metadata?: Record<string, any>;
}

export interface StabilitySummary {
    totalDuration: number; // en segundos
    stabilityScore: number; // 0-100
    riskAssessment: string;
    recommendations: string[];
    topInstabilities: {
        type: string;
        count: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
    performance: {
        excellent: number; // % del tiempo
        good: number;
        fair: number;
        poor: number;
    };
}

export interface StabilityComparisonDTO {
    id: string;
    orgId: string;
    createdBy: string;
    createdAt: string;
    sessionIds: string[];
    comparison: {
        sessions: StabilitySessionDTO[];
        metrics: ComparisonMetrics;
        analysis: ComparisonAnalysis;
    };
    version: number;
}

export interface ComparisonMetrics {
    stabilityTrend: 'improving' | 'stable' | 'declining';
    averageStability: number;
    stabilityVariance: number;
    riskEvolution: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    performanceComparison: {
        sessionId: string;
        stabilityScore: number;
        riskLevel: string;
        improvement: number; // % vs primera sesión
    }[];
}

export interface ComparisonAnalysis {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    riskFactors: string[];
    improvementAreas: string[];
}

export interface StabilityFilters {
    vehicleId?: string;
    from?: string;
    to?: string;
    status?: 'active' | 'completed' | 'failed';
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    minStability?: number;
    maxStability?: number;
}

export interface StabilitySessionParams {
    vehicleId?: string;
    from?: string;
    to?: string;
    status?: 'active' | 'completed' | 'failed';
    limit?: number;
    offset?: number;
    sortBy?: 'startedAt' | 'stabilityScore' | 'riskLevel';
    sortOrder?: 'asc' | 'desc';
}

export interface StabilityComparisonParams {
    sessionIds: string[];
    includeAnalysis?: boolean;
    includeRecommendations?: boolean;
}

export interface StabilityExportOptions {
    format: 'pdf' | 'csv';
    includeMetrics?: boolean;
    includeEvents?: boolean;
    includeAnalysis?: boolean;
    includeRecommendations?: boolean;
    dateRange?: {
        from: string;
        to: string;
    };
}

// Tipos para la UI
export interface StabilityChartConfig {
    type: 'line' | 'bar' | 'scatter' | 'heatmap';
    metric: 'stability' | 'acceleration' | 'events' | 'risk';
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
    aggregation: 'raw' | '1m' | '5m' | '15m' | '1h';
    showEvents: boolean;
    showThresholds: boolean;
}

export interface StabilityViewState {
    selectedSession?: StabilitySessionDTO;
    selectedSessions: string[];
    chartConfig: StabilityChartConfig;
    filters: StabilityFilters;
    viewMode: 'single' | 'comparison' | 'overview';
    timeRange: {
        from: string;
        to: string;
    };
}

// Respuestas de API
export interface StabilityApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        total?: number;
        limit?: number;
        offset?: number;
    };
}

// Tipos para eventos en tiempo real
export interface StabilityRealtimeEvent {
    sessionId: string;
    timestamp: string;
    type: 'instability_detected' | 'session_completed' | 'risk_level_changed';
    data: {
        stability: number;
        riskLevel: string;
        event?: StabilityEventDTO;
    };
}