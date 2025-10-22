import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Niveles de log personalizados
const customLevels = {
    levels: {
        critical: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
    },
    colors: {
        critical: 'red bold',
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
    },
};

// Formato personalizado con contexto adicional
const detailedFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json(),
    winston.format.printf((info) => {
        const { timestamp, level, message, metadata, ...rest } = info;

        const context = {
            timestamp,
            level,
            message,
            ...rest,
        };

        // Añadir contexto adicional si está disponible
        if (metadata) {
            if (metadata.userId) context.userId = metadata.userId;
            if (metadata.organizationId) context.organizationId = metadata.organizationId;
            if (metadata.requestId) context.requestId = metadata.requestId;
            if (metadata.stack) context.stack = metadata.stack;
        }

        return JSON.stringify(context);
    })
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf((info) => {
        const { timestamp, level, message, userId, organizationId, requestId, ...rest } = info;

        let output = `[${timestamp}] ${level}: ${message}`;

        // Añadir contexto si está disponible
        const context = [];
        if (userId) context.push(`userId=${userId}`);
        if (organizationId) context.push(`orgId=${organizationId}`);
        if (requestId) context.push(`reqId=${requestId}`);

        if (context.length > 0) {
            output += ` (${context.join(', ')})`;
        }

        // Añadir datos adicionales si existen
        const extraKeys = Object.keys(rest).filter(k => !['level', 'message', 'timestamp', 'stack'].includes(k));
        if (extraKeys.length > 0) {
            const extra: any = {};
            extraKeys.forEach(k => extra[k] = rest[k]);
            output += `\n    ${JSON.stringify(extra, null, 2)}`;
        }

        return output;
    })
);

// Transporte para archivos con rotación diaria
const fileRotateTransport = new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: detailedFormat,
    level: 'debug',
});

// Transporte para errores críticos
const criticalFileTransport = new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'critical-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '90d',
    format: detailedFormat,
    level: 'error',
});

// Crear logger mejorado
const detailedLogger = winston.createLogger({
    levels: customLevels.levels,
    transports: [
        // Consola (solo en desarrollo)
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),
        // Archivo con rotación
        fileRotateTransport,
        // Archivo de errores críticos
        criticalFileTransport,
    ],
    exitOnError: false,
});

// Añadir colores a winston
winston.addColors(customLevels.colors);

// Interfaz para contexto adicional
export interface LogContext {
    userId?: string;
    organizationId?: string;
    requestId?: string;
    [key: string]: any;
}

// Clase wrapper para facilitar el uso
export class DetailedLogger {
    private context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = context;
    }

    // Métodos con contexto
    critical(message: string, meta?: any) {
        detailedLogger.log('critical', message, { ...this.context, ...meta });
    }

    error(message: string, meta?: any) {
        detailedLogger.error(message, { ...this.context, ...meta });
    }

    warn(message: string, meta?: any) {
        detailedLogger.warn(message, { ...this.context, ...meta });
    }

    info(message: string, meta?: any) {
        detailedLogger.info(message, { ...this.context, ...meta });
    }

    debug(message: string, meta?: any) {
        detailedLogger.debug(message, { ...this.context, ...meta });
    }

    // Crear un logger hijo con contexto adicional
    child(additionalContext: LogContext): DetailedLogger {
        return new DetailedLogger({ ...this.context, ...additionalContext });
    }

    // Actualizar contexto
    setContext(context: LogContext) {
        this.context = { ...this.context, ...context };
    }
}

// Logger por defecto
export const logger = new DetailedLogger();

// Exportar también el logger de winston para compatibilidad
export default detailedLogger;

