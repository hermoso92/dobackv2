import winston, { format } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Formato personalizado para logs más concisos
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `${timestamp} ${level}: ${message} ${meta}`;
});

// Configuración del logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), colorize(), logFormat),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormat)
        })
    ]
});

// Interceptar logs de Express
const expressLogger = (req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url } = req;
        const { statusCode } = res;

        // Solo loguear errores y peticiones importantes
        if (statusCode >= 400 || method !== 'GET') {
            logger.info(`${method} ${url}`, {
                status: statusCode,
                duration: `${duration}ms`
            });
        }
    });
    next();
};

export { expressLogger, logger };
