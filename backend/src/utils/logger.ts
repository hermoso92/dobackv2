import fs from 'fs';
import path from 'path';
import winston from 'winston';

// Configuración por defecto para tests
const defaultConfig = {
    log: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/test.log'
    }
};

// Crear directorio de logs si no existe
const logDir = path.dirname(defaultConfig.log.file);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para los logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Niveles de log personalizados
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Colores para los niveles de log
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

// Asignar colores a Winston
winston.addColors(colors);

// Formato personalizado
const format = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, ...meta } = info;

            // Filtrar solo información relevante y reducir verbosidad
            const relevantMeta = Object.entries(meta).reduce((acc, [key, value]) => {
                // Solo incluir campos esenciales
                if (['method', 'url', 'status', 'duration', 'error'].includes(key)) {
                    // Para errores, solo incluir el mensaje
                    if (key === 'error' && value instanceof Error) {
                        acc[key] = value.message;
                    } else {
                        acc[key] = value;
                    }
                }
                return acc;
            }, {} as Record<string, any>);

            let msg = `${level}: ${message}`;
            if (Object.keys(relevantMeta).length > 0) {
                msg += ` ${JSON.stringify(relevantMeta)}`;
            }
            return msg;
        }
    )
);

// Configuración de los transportes
const logTransports = [
    // Consola
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
                ({ level, message, ...metadata }) => {
                    let msg = `${level}: ${message}`;
                    if (Object.keys(metadata).length > 0) {
                        const relevantMeta = Object.entries(metadata).reduce((acc, [key, value]) => {
                            if (['method', 'url', 'status', 'duration', 'error'].includes(key)) {
                                if (key === 'error' && value instanceof Error) {
                                    acc[key] = value.message;
                                } else {
                                    acc[key] = value;
                                }
                            }
                            return acc;
                        }, {} as Record<string, any>);
                        if (Object.keys(relevantMeta).length > 0) {
                            msg += ` ${JSON.stringify(relevantMeta)}`;
                        }
                    }
                    return msg;
                }
            )
        )
    }),
    // Archivo
    new winston.transports.File({
        filename: defaultConfig.log.file,
        format: logFormat
    })
];

// Crear el logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports: logTransports,
    // Manejar excepciones no capturadas
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log'),
            format: logFormat
        })
    ],
    // Manejar rechazos de promesas no capturados
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log'),
            format: logFormat
        })
    ]
});

// Exportar una función para crear un logger con contexto
export const createLogger = (context: string) => {
    return {
        error: (message: string, ...args: any[]) => {
            logger.error(`[${context}] ${message}`, ...args);
        },
        warn: (message: string, ...args: any[]) => {
            logger.warn(`[${context}] ${message}`, ...args);
        },
        info: (message: string, ...args: any[]) => {
            // Solo loguear info si no es una petición OPTIONS o GET a rutas comunes
            const isCommonRequest = args[0]?.method === 'OPTIONS' ||
                (args[0]?.method === 'GET' &&
                    ['/api/auth/verify', '/api/dashboard/stats', '/api/vehicles'].includes(args[0]?.url));
            if (!isCommonRequest) {
                logger.info(`[${context}] ${message}`, ...args);
            }
        },
        debug: (message: string, ...args: any[]) => {
            // Solo loguear debug en desarrollo y para información crítica
            if (process.env.NODE_ENV !== 'production') {
                const isCritical = message.includes('Error') ||
                    message.includes('Exception') ||
                    message.includes('Failed');
                if (isCritical) {
                    logger.debug(`[${context}] ${message}`, ...args);
                }
            }
        }
    };
};

// Middleware de logging para Express
export const loggerMiddleware = (req: any, res: any, next: any) => {
    // Solo loguear peticiones no GET o con errores
    if (req.method !== 'GET' || res.statusCode >= 400) {
        logger.http(`${req.method} ${req.url}`);
    }
    next();
};

// Función para log de errores con contexto
export const logError = (message: string, error: any, context?: Record<string, any>) => {
    logger.error(message, {
        error: error instanceof Error ? error.message : error,
        ...context
    });
};

// Función para log de rendimiento
export const logPerformance = (
    operation: string,
    startTime: number,
    context?: Record<string, any>
) => {
    const duration = Date.now() - startTime;
    logger.info(`Performance: ${operation} took ${duration}ms`, context);
};

// Función para log de auditoría
export const logAudit = (
    userId: string,
    action: string,
    resource: string,
    details?: Record<string, any>
) => {
    logger.info('Audit Log', {
        userId,
        action,
        resource,
        timestamp: new Date().toISOString(),
        ...details
    });
};

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

export { logger };

// Logger para la aplicación

export const loggerApp = {
    info: (message: string, meta?: any) => {
        console.log(`[INFO] ${message}`, meta ? meta : '');
    },

    error: (message: string, meta?: any) => {
        console.error(`[ERROR] ${message}`, meta ? meta : '');
    },

    warn: (message: string, meta?: any) => {
        console.warn(`[WARN] ${message}`, meta ? meta : '');
    },

    debug: (message: string, meta?: any) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${message}`, meta ? meta : '');
        }
    }
};
