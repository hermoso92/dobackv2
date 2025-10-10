// DTOs para el módulo de Observabilidad & QA
export interface LogEntryDTO {
    id: string;
    timestamp: string;
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    requestId?: string;
    orgId?: string;
    userId?: string;
    route?: string;
    method?: string;
    statusCode?: number;
    duration?: number; // milliseconds
    ipAddress?: string;
    userAgent?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    metadata?: Record<string, any>;
    tags?: string[];
}

export interface MetricDTO {
    id: string;
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    value: number;
    unit?: string;
    labels?: Record<string, string>;
    timestamp: string;
    description?: string;
}

export interface SystemMetricsDTO {
    timestamp: string;
    uptime: number; // seconds
    memory: {
        used: number; // MB
        total: number; // MB
        percentage: number;
    };
    cpu: {
        usage: number; // percentage
        load: number[];
    };
    disk: {
        used: number; // GB
        total: number; // GB
        percentage: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        connections: number;
    };
    database: {
        connections: number;
        maxConnections: number;
        queryTime: number; // average ms
        slowQueries: number;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number; // percentage
        size: number; // MB
    };
    queue: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
}

export interface HealthCheckDTO {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    duration?: number; // milliseconds
    lastCheck: string;
    details?: Record<string, any>;
}

export interface SystemHealthDTO {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number; // seconds
    version: string;
    environment: string;
    checks: HealthCheckDTO[];
    summary: {
        total: number;
        healthy: number;
        unhealthy: number;
        degraded: number;
    };
}

export interface AlertDTO {
    id: string;
    name: string;
    type: 'metric' | 'log' | 'health' | 'custom';
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'suppressed';
    message: string;
    description?: string;
    source: string;
    metric?: string;
    threshold?: number;
    currentValue?: number;
    triggeredAt: string;
    resolvedAt?: string;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    metadata?: Record<string, any>;
}

export interface TestResultDTO {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    status: 'passed' | 'failed' | 'skipped' | 'running';
    duration?: number; // milliseconds
    startedAt: string;
    completedAt?: string;
    coverage?: {
        lines: number;
        functions: number;
        branches: number;
        statements: number;
    };
    results?: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
    };
    errors?: Array<{
        test: string;
        message: string;
        stack?: string;
    }>;
    metadata?: Record<string, any>;
}

export interface TestSuiteDTO {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    status: 'passed' | 'failed' | 'running';
    duration?: number; // milliseconds
    startedAt: string;
    completedAt?: string;
    tests: TestResultDTO[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        coverage?: {
            lines: number;
            functions: number;
            branches: number;
            statements: number;
        };
    };
    environment: {
        nodeVersion: string;
        platform: string;
        arch: string;
        memory: number;
    };
    metadata?: Record<string, any>;
}

export interface PerformanceMetricsDTO {
    timestamp: string;
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number; // milliseconds
        p50: number; // milliseconds
        p95: number; // milliseconds
        p99: number; // milliseconds
    };
    endpoints: Array<{
        path: string;
        method: string;
        requests: number;
        averageResponseTime: number;
        errorRate: number;
    }>;
    database: {
        queries: number;
        averageQueryTime: number;
        slowQueries: number;
        connections: number;
    };
    cache: {
        operations: number;
        hitRate: number;
        averageResponseTime: number;
    };
    external: {
        apiCalls: number;
        averageResponseTime: number;
        errorRate: number;
    };
}

export interface ObservabilityFilters {
    level?: 'error' | 'warn' | 'info' | 'debug';
    orgId?: string;
    userId?: string;
    route?: string;
    from?: string;
    to?: string;
    search?: string;
    tags?: string[];
}

export interface ObservabilityStats {
    logs: {
        total: number;
        byLevel: Record<string, number>;
        byRoute: Array<{ route: string; count: number }>;
        errorRate: number;
        averageResponseTime: number;
    };
    metrics: {
        total: number;
        byType: Record<string, number>;
        topMetrics: Array<{ name: string; value: number; unit: string }>;
    };
    alerts: {
        total: number;
        active: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
    };
    tests: {
        total: number;
        passed: number;
        failed: number;
        coverage: number;
        lastRun?: string;
    };
    performance: {
        averageResponseTime: number;
        errorRate: number;
        throughput: number;
        uptime: number;
    };
}

export interface ObservabilitySettings {
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        format: 'json' | 'text';
        retention: number; // days
        maxSize: number; // MB
        compression: boolean;
        rotation: {
            enabled: boolean;
            maxFiles: number;
            maxSize: number; // MB
        };
    };
    metrics: {
        enabled: boolean;
        interval: number; // seconds
        retention: number; // days
        aggregation: {
            enabled: boolean;
            interval: number; // minutes
        };
    };
    alerts: {
        enabled: boolean;
        channels: Array<{
            type: 'email' | 'slack' | 'webhook';
            config: Record<string, any>;
        }>;
        rules: Array<{
            name: string;
            condition: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            enabled: boolean;
        }>;
    };
    healthchecks: {
        enabled: boolean;
        interval: number; // seconds
        timeout: number; // seconds
        checks: Array<{
            name: string;
            type: 'http' | 'database' | 'redis' | 'external';
            config: Record<string, any>;
            enabled: boolean;
        }>;
    };
    testing: {
        enabled: boolean;
        coverage: {
            threshold: number; // percentage
            enforce: boolean;
        };
        e2e: {
            enabled: boolean;
            browser: string;
            headless: boolean;
        };
        performance: {
            enabled: boolean;
            threshold: number; // milliseconds
        };
    };
}

// Respuestas de API
export interface ObservabilityApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        total?: number;
        limit?: number;
        offset?: number;
        filters?: ObservabilityFilters;
    };
}

// Tipos para eventos en tiempo real
export interface ObservabilityRealtimeEvent {
    type: 'log' | 'metric' | 'alert' | 'health' | 'test';
    timestamp: string;
    data: {
        id?: string;
        level?: string;
        message?: string;
        value?: number;
        status?: string;
        details?: any;
    };
}
