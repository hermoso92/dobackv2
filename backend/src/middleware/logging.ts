import { EventEmitter } from 'events';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface LogConfig {
    level?: string;
    format?: string;
    directory?: string;
    maxFiles?: number;
    maxSize?: number;
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context: Record<string, any>;
}

// Emisor de eventos para logs
const logEmitter = new EventEmitter();

// Configuración por defecto
const defaultConfig: LogConfig = {
    level: 'info',
    format: 'json',
    directory: 'logs',
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024 // 5MB
};

// Crear directorio de logs si no existe
const ensureLogDirectory = async (directory: string) => {
    try {
        await fs.access(directory);
    } catch {
        await fs.mkdir(directory, { recursive: true });
    }
};

// Rotar archivos de log
const rotateLogFiles = async (config: LogConfig) => {
    const directory = config.directory || defaultConfig.directory!;
    const maxFiles = config.maxFiles || defaultConfig.maxFiles!;
    const maxSize = config.maxSize || defaultConfig.maxSize!;

    try {
        const files = await fs.readdir(directory);
        const logFiles = files.filter((f) => f.endsWith('.log'));

        for (const file of logFiles) {
            const filePath = path.join(directory, file);
            const stats = await fs.stat(filePath);

            if (stats.size > maxSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const newPath = path.join(directory, `${file}.${timestamp}`);
                await fs.rename(filePath, newPath);

                // Eliminar archivos antiguos si exceden el límite
                if (logFiles.length > maxFiles) {
                    const oldFiles = logFiles
                        .map((f) => ({
                            name: f,
                            time: fs.stat(path.join(directory, f)).then((s) => s.mtime.getTime())
                        }))
                        .sort((a, b) => (a.time > b.time ? 1 : -1))
                        .slice(0, logFiles.length - maxFiles);

                    for (const oldFile of oldFiles) {
                        await fs.unlink(path.join(directory, oldFile.name));
                    }
                }
            }
        }
    } catch (error) {
        logger.error('Error rotando archivos de log', { error });
    }
};

// Middleware de logging
export const loggingMiddleware = (config: LogConfig = defaultConfig) => {
    const directory = config.directory || defaultConfig.directory!;

    // Asegurar directorio de logs y configurar rotación
    ensureLogDirectory(directory);
    setInterval(() => rotateLogFiles(config), 60000); // Verificar cada minuto

    return async (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Capturar logs al finalizar la respuesta
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;

            // Solo loguear si es un error o una petición no GET importante
            const shouldLog =
                res.statusCode >= 400 ||
                (req.method !== 'GET' &&
                    !req.path.includes('/api/auth/verify') &&
                    !req.path.includes('/api/dashboard/stats') &&
                    !req.path.includes('/api/health'));

            if (shouldLog) {
                const logEntry: LogEntry = {
                    timestamp: new Date().toISOString(),
                    level: res.statusCode >= 400 ? 'error' : 'info',
                    message: `${req.method} ${req.path} ${res.statusCode} ${responseTime}ms`,
                    context: {
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode,
                        responseTime,
                        userId: (req as any).user?.id || 'anonymous'
                    }
                };

                // Emitir evento de log
                logEmitter.emit('log', logEntry);

                // Escribir log según el formato
                if (config.format === 'json') {
                    logger.log(logEntry.level, logEntry.message, logEntry.context);
                } else {
                    logger.log(logEntry.level, `[${logEntry.timestamp}] ${logEntry.message}`);
                }
            }
        });

        next();
    };
};

// Middleware para logs de errores
export const errorLoggingMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: error.message,
        context: {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userId: (req as any).user?.id,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        }
    };

    // Emitir evento de log
    logEmitter.emit('log', logEntry);

    // Registrar error
    logger.error(logEntry.message, logEntry.context);

    next(error);
};

// Suscribirse a eventos de log
export const onLog = (callback: (log: LogEntry) => void) => {
    logEmitter.on('log', callback);
    return () => logEmitter.off('log', callback);
};

// Obtener logs
export const getLogs = async (options: {
    level?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}) => {
    const directory = defaultConfig.directory!;
    const files = await fs.readdir(directory);
    const logFiles = files.filter((f) => f.endsWith('.log'));

    let logs: LogEntry[] = [];

    for (const file of logFiles) {
        const content = await fs.readFile(path.join(directory, file), 'utf-8');
        const entries = content
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line));

        logs = logs.concat(entries);
    }

    // Filtrar y ordenar logs
    return logs
        .filter((log) => {
            if (options.level && log.level !== options.level) return false;
            if (options.startDate && new Date(log.timestamp) < options.startDate) return false;
            if (options.endDate && new Date(log.timestamp) > options.endDate) return false;
            return true;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(options.offset || 0, (options.offset || 0) + (options.limit || 100));
};
