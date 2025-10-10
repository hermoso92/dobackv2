// Tipos para el módulo Reportes Avanzados

export interface ReportJobDTO {
    id: string;
    orgId: string;
    createdBy: string;
    createdAt: string;
    scheduledAt?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    input: {
        module: 'telemetry' | 'stability' | 'panel' | 'comparative';
        params: {
            from: string;
            to: string;
            vehicleId?: string;
            sessionId?: string;
            includeHeatmap?: boolean;
            includeEvents?: boolean;
            includeKPIs?: boolean;
            compareOrgIds?: string[];
            template?: 'basic' | 'executive' | 'detailed';
        };
    };
    output?: {
        url: string;
        pages: number;
        sizeKB: number;
        downloadUrl?: string;
    };
    meta?: {
        compareOrgIds?: string[];
        range: {
            from: string;
            to: string;
        };
        template: string;
        processingTime?: number;
        errorMessage?: string;
    };
}

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    type: 'basic' | 'executive' | 'detailed' | 'comparative';
    sections: ReportSection[];
    defaultParams: Record<string, any>;
}

export interface ReportSection {
    id: string;
    name: string;
    type: 'kpis' | 'chart' | 'table' | 'map' | 'ai_analysis' | 'summary';
    config: {
        title?: string;
        dataSource?: string;
        chartType?: 'line' | 'bar' | 'pie' | 'heatmap';
        columns?: string[];
        filters?: Record<string, any>;
        aiPrompt?: string;
    };
    order: number;
    required: boolean;
}

export interface ReportSchedule {
    id: string;
    name: string;
    template: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    cronExpression?: string;
    recipients: string[];
    isActive: boolean;
    lastRun?: string;
    nextRun?: string;
    createdAt: string;
    createdBy: string;
}

export interface ComparativeReportData {
    organizations: Array<{
        id: string;
        name: string;
        data: {
            kpis: Record<string, number>;
            trends: Array<{
                metric: string;
                value: number;
                change: number;
            }>;
            events: Array<{
                type: string;
                count: number;
                severity: string;
            }>;
        };
    }>;
    comparison: {
        bestPerformer: string;
        worstPerformer: string;
        insights: string[];
        recommendations: string[];
    };
}

export interface AIAnalysis {
    summary: string;
    insights: Array<{
        type: 'trend' | 'anomaly' | 'recommendation' | 'warning';
        title: string;
        description: string;
        confidence: number;
        data: any;
    }>;
    recommendations: Array<{
        priority: 'low' | 'medium' | 'high' | 'critical';
        action: string;
        impact: string;
        effort: 'low' | 'medium' | 'high';
    }>;
    metrics: {
        totalEvents: number;
        criticalEvents: number;
        avgResponseTime: number;
        efficiencyScore: number;
    };
}

export interface ReportFilters {
    from: string;
    to: string;
    vehicleId?: string;
    sessionId?: string;
    organizationId?: string;
    template?: string;
    includeAI?: boolean;
    includeHeatmap?: boolean;
    includeEvents?: boolean;
    includeKPIs?: boolean;
}

export interface ReportGenerationOptions {
    template: 'basic' | 'executive' | 'detailed' | 'comparative';
    format: 'pdf' | 'excel' | 'csv';
    includeAI: boolean;
    includeHeatmap: boolean;
    includeEvents: boolean;
    includeKPIs: boolean;
    compareOrgIds?: string[];
    customSections?: string[];
    language: 'es' | 'en';
    timezone: string;
}

export interface ReportQueueStatus {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
    estimatedWaitTime: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Tipos para reportes específicos
export interface TelemetryReportData {
    session: {
        id: string;
        vehicleId: string;
        vehicleName: string;
        startedAt: string;
        endedAt?: string;
        duration: number;
        totalKm: number;
        avgSpeed: number;
        maxSpeed: number;
    };
    events: Array<{
        id: string;
        type: string;
        severity: string;
        timestamp: string;
        location: {
            lat: number;
            lng: number;
        };
        description: string;
    }>;
    kpis: {
        totalEvents: number;
        criticalEvents: number;
        speedingEvents: number;
        geofenceViolations: number;
        efficiencyScore: number;
    };
    heatmap?: {
        type: string;
        points: Array<{
            lat: number;
            lng: number;
            intensity: number;
        }>;
    };
    aiAnalysis?: AIAnalysis;
}

export interface StabilityReportData {
    session: {
        id: string;
        vehicleId: string;
        vehicleName: string;
        startedAt: string;
        endedAt?: string;
        duration: number;
    };
    metrics: {
        ltr: number;
        ssf: number;
        drs: number;
        stabilityScore: number;
    };
    events: Array<{
        id: string;
        type: string;
        severity: string;
        timestamp: string;
        value: number;
        threshold: number;
        description: string;
    }>;
    trends: Array<{
        metric: string;
        values: Array<{
            timestamp: string;
            value: number;
        }>;
    }>;
    aiAnalysis?: AIAnalysis;
}

export interface PanelReportData {
    period: {
        from: string;
        to: string;
    };
    kpis: {
        vehiclesActive: number;
        totalKm: number;
        totalEvents: number;
        efficiencyScore: number;
    };
    trends: Array<{
        metric: string;
        change: number;
        direction: 'up' | 'down' | 'stable';
        period: string;
    }>;
    topVehicles: Array<{
        vehicleId: string;
        vehicleName: string;
        score: number;
        events: number;
    }>;
    heatmap?: {
        type: string;
        points: Array<{
            lat: number;
            lng: number;
            intensity: number;
        }>;
    };
    aiAnalysis?: AIAnalysis;
}
