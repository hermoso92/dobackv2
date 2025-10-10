import { logger } from '../utils/logger';

interface MetricData {
    name: string;
    value: number;
    timestamp: Date;
    labels?: Record<string, string>;
    type: 'COUNTER' | 'GAUGE' | 'HISTOGRAM' | 'SUMMARY';
}

interface HealthCheck {
    name: string;
    status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
    message?: string;
    lastChecked: Date;
    responseTime?: number;
}

interface SystemMetrics {
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
    uptime: number;
    timestamp: Date;
}

interface ProcessingMetrics {
    totalFilesProcessed: number;
    successfulFiles: number;
    failedFiles: number;
    totalDataPoints: number;
    averageProcessingTime: number;
    throughput: number; // files per minute
    errorRate: number; // percentage
}

export class MonitoringService {
    private metrics: Map<string, MetricData[]> = new Map();
    private healthChecks: Map<string, HealthCheck> = new Map();
    private processingMetrics: ProcessingMetrics = {
        totalFilesProcessed: 0,
        successfulFiles: 0,
        failedFiles: 0,
        totalDataPoints: 0,
        averageProcessingTime: 0,
        throughput: 0,
        errorRate: 0
    };

    private readonly METRICS_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 horas
    private cleanupTimer: NodeJS.Timer | null = null;

    constructor() {
        this.startMetricsCleanup();
        this.startHealthChecks();
    }

    /**
     * Registra una métrica
     */
    recordMetric(
        name: string,
        value: number,
        type: MetricData['type'] = 'GAUGE',
        labels?: Record<string, string>
    ): void {
        const metric: MetricData = {
            name,
            value,
            timestamp: new Date(),
            labels,
            type
        };

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        this.metrics.get(name)!.push(metric);

        logger.debug(`📊 Métrica registrada: ${name} = ${value}`, {
            type,
            labels,
            timestamp: metric.timestamp
        });
    }

    /**
     * Incrementa un contador
     */
    incrementCounter(name: string, labels?: Record<string, string>): void {
        const existing = this.getLatestMetric(name);
        const currentValue = existing ? existing.value : 0;
        this.recordMetric(name, currentValue + 1, 'COUNTER', labels);
    }

    /**
     * Actualiza métricas de procesamiento
     */
    updateProcessingMetrics(update: Partial<ProcessingMetrics>): void {
        Object.assign(this.processingMetrics, update);

        // Calcular métricas derivadas
        if (this.processingMetrics.totalFilesProcessed > 0) {
            this.processingMetrics.errorRate =
                (this.processingMetrics.failedFiles / this.processingMetrics.totalFilesProcessed) * 100;
        }

        // Registrar métricas individuales
        this.recordMetric('files_processed_total', this.processingMetrics.totalFilesProcessed, 'COUNTER');
        this.recordMetric('files_processed_successful', this.processingMetrics.successfulFiles, 'COUNTER');
        this.recordMetric('files_processed_failed', this.processingMetrics.failedFiles, 'COUNTER');
        this.recordMetric('data_points_total', this.processingMetrics.totalDataPoints, 'COUNTER');
        this.recordMetric('processing_time_average', this.processingMetrics.averageProcessingTime, 'GAUGE');
        this.recordMetric('throughput_files_per_minute', this.processingMetrics.throughput, 'GAUGE');
        this.recordMetric('error_rate_percentage', this.processingMetrics.errorRate, 'GAUGE');

        logger.info('📊 Métricas de procesamiento actualizadas', this.processingMetrics);
    }

    /**
     * Registra un health check
     */
    registerHealthCheck(
        name: string,
        checkFn: () => Promise<{ status: HealthCheck['status']; message?: string; responseTime?: number }>
    ): void {
        const healthCheck: HealthCheck = {
            name,
            status: 'UNHEALTHY',
            lastChecked: new Date()
        };

        this.healthChecks.set(name, healthCheck);

        // Ejecutar health check inmediatamente
        this.runHealthCheck(name, checkFn);

        logger.info(`🏥 Health check registrado: ${name}`);
    }

    /**
     * Ejecuta un health check específico
     */
    private async runHealthCheck(
        name: string,
        checkFn: () => Promise<{ status: HealthCheck['status']; message?: string; responseTime?: number }>
    ): Promise<void> {
        const startTime = Date.now();

        try {
            const result = await checkFn();
            const responseTime = Date.now() - startTime;

            const healthCheck = this.healthChecks.get(name)!;
            healthCheck.status = result.status;
            healthCheck.message = result.message;
            healthCheck.responseTime = responseTime;
            healthCheck.lastChecked = new Date();

            this.healthChecks.set(name, healthCheck);

            // Registrar métrica de health check
            this.recordMetric(`health_check_${name}`, responseTime, 'HISTOGRAM', {
                status: result.status
            });

            logger.debug(`🏥 Health check ejecutado: ${name}`, {
                status: result.status,
                responseTime,
                message: result.message
            });

        } catch (error) {
            const responseTime = Date.now() - startTime;

            const healthCheck = this.healthChecks.get(name)!;
            healthCheck.status = 'UNHEALTHY';
            healthCheck.message = error instanceof Error ? error.message : 'Error desconocido';
            healthCheck.responseTime = responseTime;
            healthCheck.lastChecked = new Date();

            this.healthChecks.set(name, healthCheck);

            logger.error(`🏥 Health check falló: ${name}`, {
                error: error instanceof Error ? error.message : 'Error desconocido',
                responseTime
            });
        }
    }

    /**
     * Obtiene métricas del sistema
     */
    getSystemMetrics(): SystemMetrics {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        return {
            memory: {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            },
            cpu: {
                usage: 0, // Esto requeriría librerías adicionales
                loadAverage: require('os').loadavg()
            },
            disk: {
                used: 0, // Esto requeriría librerías adicionales
                total: 0,
                percentage: 0
            },
            uptime,
            timestamp: new Date()
        };
    }

    /**
     * Obtiene métricas de procesamiento
     */
    getProcessingMetrics(): ProcessingMetrics {
        return { ...this.processingMetrics };
    }

    /**
     * Obtiene todas las métricas
     */
    getAllMetrics(): Record<string, MetricData[]> {
        const result: Record<string, MetricData[]> = {};
        for (const [name, metrics] of this.metrics.entries()) {
            result[name] = [...metrics];
        }
        return result;
    }

    /**
     * Obtiene métricas por nombre
     */
    getMetricsByName(name: string): MetricData[] {
        return this.metrics.get(name) || [];
    }

    /**
     * Obtiene la métrica más reciente por nombre
     */
    getLatestMetric(name: string): MetricData | null {
        const metrics = this.getMetricsByName(name);
        if (metrics.length === 0) return null;

        return metrics.reduce((latest, current) =>
            current.timestamp > latest.timestamp ? current : latest
        );
    }

    /**
     * Obtiene todos los health checks
     */
    getHealthChecks(): HealthCheck[] {
        return Array.from(this.healthChecks.values());
    }

    /**
     * Obtiene el estado general del sistema
     */
    getSystemHealth(): {
        status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
        healthChecks: HealthCheck[];
        systemMetrics: SystemMetrics;
        processingMetrics: ProcessingMetrics;
        summary: string;
    } {
        const healthChecks = this.getHealthChecks();
        const systemMetrics = this.getSystemMetrics();
        const processingMetrics = this.getProcessingMetrics();

        // Determinar estado general
        let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';

        const unhealthyChecks = healthChecks.filter(h => h.status === 'UNHEALTHY');
        const degradedChecks = healthChecks.filter(h => h.status === 'DEGRADED');

        if (unhealthyChecks.length > 0) {
            status = 'UNHEALTHY';
        } else if (degradedChecks.length > 0) {
            status = 'DEGRADED';
        }

        // Verificar métricas del sistema
        if (systemMetrics.memory.percentage > 90) {
            status = status === 'UNHEALTHY' ? 'UNHEALTHY' : 'DEGRADED';
        }

        if (processingMetrics.errorRate > 10) {
            status = status === 'UNHEALTHY' ? 'UNHEALTHY' : 'DEGRADED';
        }

        // Generar resumen
        const summary = this.generateHealthSummary(status, healthChecks, systemMetrics, processingMetrics);

        return {
            status,
            healthChecks,
            systemMetrics,
            processingMetrics,
            summary
        };
    }

    /**
     * Genera un resumen de salud del sistema
     */
    private generateHealthSummary(
        status: string,
        healthChecks: HealthCheck[],
        systemMetrics: SystemMetrics,
        processingMetrics: ProcessingMetrics
    ): string {
        const parts = [`Estado: ${status}`];

        // Health checks
        const healthyCount = healthChecks.filter(h => h.status === 'HEALTHY').length;
        parts.push(`Health Checks: ${healthyCount}/${healthChecks.length} saludables`);

        // Memoria
        parts.push(`Memoria: ${systemMetrics.memory.percentage.toFixed(1)}% utilizada`);

        // Procesamiento
        parts.push(`Archivos procesados: ${processingMetrics.totalFilesProcessed}`);
        parts.push(`Tasa de error: ${processingMetrics.errorRate.toFixed(1)}%`);

        return parts.join(' | ');
    }

    /**
     * Inicia el cleanup automático de métricas
     */
    private startMetricsCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupOldMetrics();
        }, 60 * 60 * 1000); // Cada hora

        logger.info('🧹 Cleanup automático de métricas iniciado');
    }

    /**
     * Limpia métricas antiguas
     */
    private cleanupOldMetrics(): void {
        const cutoff = new Date(Date.now() - this.METRICS_RETENTION_MS);
        let totalCleaned = 0;

        for (const [name, metrics] of this.metrics.entries()) {
            const beforeCount = metrics.length;
            const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);

            if (filteredMetrics.length !== beforeCount) {
                this.metrics.set(name, filteredMetrics);
                totalCleaned += beforeCount - filteredMetrics.length;
            }
        }

        if (totalCleaned > 0) {
            logger.info(`🧹 Limpieza de métricas: ${totalCleaned} métricas antiguas eliminadas`);
        }
    }

    /**
     * Inicia health checks automáticos
     */
    private startHealthChecks(): void {
        // Health check básico del sistema
        this.registerHealthCheck('system', async () => {
            const systemMetrics = this.getSystemMetrics();

            if (systemMetrics.memory.percentage > 95) {
                return { status: 'UNHEALTHY', message: 'Uso de memoria crítico' };
            }

            if (systemMetrics.memory.percentage > 85) {
                return { status: 'DEGRADED', message: 'Uso de memoria alto' };
            }

            return { status: 'HEALTHY', message: 'Sistema funcionando normalmente' };
        });

        // Health check de procesamiento
        this.registerHealthCheck('processing', async () => {
            const processingMetrics = this.getProcessingMetrics();

            if (processingMetrics.errorRate > 20) {
                return { status: 'UNHEALTHY', message: 'Tasa de error crítica' };
            }

            if (processingMetrics.errorRate > 10) {
                return { status: 'DEGRADED', message: 'Tasa de error elevada' };
            }

            return { status: 'HEALTHY', message: 'Procesamiento funcionando bien' };
        });

        // Ejecutar health checks cada 5 minutos
        setInterval(() => {
            for (const [name, healthCheck] of this.healthChecks.entries()) {
                // En una implementación real, esto ejecutaría la función de check
                logger.debug(`🏥 Ejecutando health check: ${name}`);
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Obtiene estadísticas de métricas
     */
    getMetricsStats(): {
        totalMetrics: number;
        metricsByType: Record<string, number>;
        oldestMetric: Date | null;
        newestMetric: Date | null;
    } {
        let totalMetrics = 0;
        const metricsByType: Record<string, number> = {};
        let oldestMetric: Date | null = null;
        let newestMetric: Date | null = null;

        for (const metrics of this.metrics.values()) {
            totalMetrics += metrics.length;

            for (const metric of metrics) {
                metricsByType[metric.type] = (metricsByType[metric.type] || 0) + 1;

                if (!oldestMetric || metric.timestamp < oldestMetric) {
                    oldestMetric = metric.timestamp;
                }

                if (!newestMetric || metric.timestamp > newestMetric) {
                    newestMetric = metric.timestamp;
                }
            }
        }

        return {
            totalMetrics,
            metricsByType,
            oldestMetric,
            newestMetric
        };
    }

    /**
     * Destructor para limpiar recursos
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        this.metrics.clear();
        this.healthChecks.clear();

        logger.info('🧹 MonitoringService destruido');
    }
}

// Singleton instance
export const monitoringService = new MonitoringService();
