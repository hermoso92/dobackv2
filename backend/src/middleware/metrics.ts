import { EventEmitter } from 'events';
import { NextFunction, Request, Response } from 'express';

interface MetricsConfig {
    interval?: number; // Intervalo de reporte en milisegundos
    prefix?: string; // Prefijo para las métricas
}

interface RequestMetrics {
    method: string;
    path: string;
    status: number;
    responseTime: number;
    timestamp: Date;
}

interface SystemMetrics {
    memory: {
        total: number;
        used: number;
        free: number;
    };
    cpu: {
        usage: number;
        loadAvg: number[];
    };
    uptime: number;
}

// Emisor de eventos para métricas
const metricsEmitter = new EventEmitter();

// Almacenamiento de métricas
const metrics = {
    requests: {
        total: 0,
        success: 0,
        error: 0,
        byMethod: {} as Record<string, number>,
        byPath: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
    },
    responseTime: {
        avg: 0,
        min: Infinity,
        max: 0,
        samples: [] as number[]
    },
    errors: {
        count: 0,
        byType: {} as Record<string, number>
    },
    system: {
        memory: {
            total: 0,
            used: 0,
            free: 0
        },
        cpu: {
            usage: 0,
            loadAvg: [0, 0, 0]
        },
        uptime: 0
    }
};

// Calcular estadísticas de tiempo de respuesta
const calculateResponseTimeStats = () => {
    const samples = metrics.responseTime.samples;
    if (samples.length === 0) return;

    metrics.responseTime.avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    metrics.responseTime.min = Math.min(...samples);
    metrics.responseTime.max = Math.max(...samples);

    // Mantener solo las últimas 1000 muestras
    if (samples.length > 1000) {
        metrics.responseTime.samples = samples.slice(-1000);
    }
};

// Actualizar métricas del sistema
const updateSystemMetrics = () => {
    const used = process.memoryUsage();
    metrics.system.memory = {
        total: used.heapTotal,
        used: used.heapUsed,
        free: used.heapTotal - used.heapUsed
    };

    metrics.system.cpu = {
        usage: process.cpuUsage().user / 1000000, // Convertir a segundos
        loadAvg: [0, 0, 0] // Valores por defecto
    };

    metrics.system.uptime = process.uptime();
};

// Middleware de métricas
export const metricsMiddleware = (config: MetricsConfig = {}) => {
    const interval = config.interval || 60000; // 1 minuto por defecto
    const prefix = config.prefix || 'app';

    // Actualizar métricas del sistema periódicamente
    setInterval(updateSystemMetrics, interval);

    return (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Capturar métricas al finalizar la respuesta
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            const requestMetrics: RequestMetrics = {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                responseTime,
                timestamp: new Date()
            };

            // Actualizar métricas
            metrics.requests.total++;
            metrics.requests.byMethod[req.method] =
                (metrics.requests.byMethod[req.method] || 0) + 1;
            metrics.requests.byPath[req.path] = (metrics.requests.byPath[req.path] || 0) + 1;
            metrics.requests.byStatus[res.statusCode] =
                (metrics.requests.byStatus[res.statusCode] || 0) + 1;

            if (res.statusCode >= 200 && res.statusCode < 400) {
                metrics.requests.success++;
            } else {
                metrics.requests.error++;
                metrics.errors.count++;
                const errorType = res.statusCode >= 500 ? 'server' : 'client';
                metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
            }

            metrics.responseTime.samples.push(responseTime);
            calculateResponseTimeStats();

            // Emitir evento de métricas
            metricsEmitter.emit('metrics', {
                prefix,
                timestamp: new Date(),
                request: requestMetrics,
                current: metrics
            });
        });

        next();
    };
};

// Middleware para exponer métricas
export const metricsEndpointMiddleware = (req: Request, res: Response) => {
    updateSystemMetrics();
    calculateResponseTimeStats();

    res.json({
        timestamp: new Date(),
        metrics: {
            requests: metrics.requests,
            responseTime: metrics.responseTime,
            errors: metrics.errors,
            system: metrics.system
        }
    });
};

// Suscribirse a eventos de métricas
export const onMetrics = (callback: (metrics: any) => void) => {
    metricsEmitter.on('metrics', callback);
    return () => metricsEmitter.off('metrics', callback);
};

// Obtener métricas actuales
export const getCurrentMetrics = () => {
    updateSystemMetrics();
    calculateResponseTimeStats();
    return {
        timestamp: new Date(),
        metrics: {
            requests: metrics.requests,
            responseTime: metrics.responseTime,
            errors: metrics.errors,
            system: metrics.system
        }
    };
};
