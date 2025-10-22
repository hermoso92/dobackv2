import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Cargar variables de entorno desde config.env
// El archivo config.env está en la raíz del proyecto (../../config.env desde src/config/)
dotenv.config({ path: path.join(__dirname, '../../config.env') });

// También intentar cargar desde .env si existe
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('9998'),

    // Database
    DATABASE_URL: z.string(),

    // JWT
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default('1h'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:5174'),

    // Application
    APP_NAME: z.string().default('DobackSoft'),
    APP_VERSION: z.string().default('2.0.0'),
    APP_URL: z.string().default('http://localhost:9998'),

    // Server
    SERVER_TIMEOUT: z.string().transform(Number).default('180000'), // 3 minutos para KPIs

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    // Security
    RATE_LIMIT_WINDOW: z.string().transform(Number).default('3600000'),
    RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

    // Redis
    REDIS_URL: z.string().optional(),

    // Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().transform(Number).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    // Storage
    STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),

    // Features
    ENABLE_REGISTRATION: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    ENABLE_EMAIL_VERIFICATION: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    ENABLE_2FA: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    ENABLE_SOCIAL_LOGIN: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),

    // Development
    ENABLE_SWAGGER: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    ENABLE_GRAPHIQL: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),

    // Testing
    TEST_DATABASE_URL: z.string().optional(),
    TEST_REDIS_URL: z.string().optional(),

    // Performance
    ENABLE_CACHE: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    CACHE_TTL: z.string().transform(Number).default('3600'),

    // Session
    SESSION_SECRET: z.string().default('your-secret-key'),
    SESSION_TTL: z.string().transform(Number).default('86400'),

    // API Documentation
    API_PREFIX: z.string().default('/api'),

    // Error Reporting
    ENABLE_ERROR_REPORTING: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    ERROR_REPORTING_SERVICE: z.string().optional(),

    // Feature Flags
    ENABLE_FEATURE_X: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    ENABLE_FEATURE_Y: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),

    // Development Security
    ENABLE_CSRF: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    ENABLE_XSS_PROTECTION: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    ENABLE_CONTENT_SECURITY_POLICY: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),

    // Database Migrations
    ENABLE_AUTO_MIGRATIONS: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    MIGRATIONS_PATH: z.string().default('./prisma/migrations'),

    // Frontend Development
    REACT_APP_API_URL: z.string().default('http://localhost:9998/api'),
    REACT_APP_ENV: z.string().default('development'),

    // Backend Development
    ENABLE_DEBUG_MODE: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    ENABLE_QUERY_LOGGING: z
        .string()
        .transform((val) => val === 'true')
        .default('true')
});

const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        logger.error('Error al validar variables de entorno', { error });
        process.exit(1);
    }
};

const env = parseEnv();

// Configuración de la aplicación
const appConfig = {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    url: env.APP_URL,
    env: env.NODE_ENV
};

// Configuración de la base de datos
const dbConfig = {
    url: env.DATABASE_URL
};

// Configuración de JWT
const jwtConfig = {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
};

// Configuración de CORS
const corsConfig = {
    origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'Pragma'
    ],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Request-Id']
};

// Configuración de logging
const loggingConfig = {
    level: env.LOG_LEVEL
};

// Configuración de rate limiting
const rateLimitConfig = {
    windowMs: env.RATE_LIMIT_WINDOW,
    max: env.RATE_LIMIT_MAX
};

// Configuración de seguridad
const securityConfig = {
    bcryptRounds: 10,
    jwtSecret: env.JWT_SECRET || 'your-secret-key',
    rateLimit: rateLimitConfig
};

// Configuración de telemetría
const telemetryConfig = {
    enabled: process.env.TELEMETRY_ENABLED === 'true',
    endpoint: process.env.TELEMETRY_ENDPOINT
};

// Configuración de alertas
const alertsConfig = {
    email: {
        enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
        from: process.env.EMAIL_FROM || 'alerts@DobackSoft.com',
        to: process.env.EMAIL_TO || 'admin@DobackSoft.com'
    },
    slack: {
        enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL
    }
};

// Configuración de mantenimiento
const maintenanceConfig = {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    message: process.env.MAINTENANCE_MESSAGE || 'El sistema está en mantenimiento'
};

// Validar configuración crítica
if (jwtConfig.secret === 'your-secret-key') {
    logger.warn(
        'Se está utilizando la clave JWT por defecto. Por favor, configure JWT_SECRET en las variables de entorno.'
    );
}

// Configuración del servidor
const serverConfig = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    host: process.env.HOST || 'localhost',
    timeout: env.SERVER_TIMEOUT
};

// Configuración de logging
const logConfig = {
    level: env.LOG_LEVEL,
    file: process.env.LOG_FILE || 'logs/app.log'
};

// Configuración de WebSocket
const wsConfig = {
    port: parseInt(process.env.WS_PORT || '3001', 10)
};

// Configuración de Redis
const redisConfig = {
    url: env.REDIS_URL
};

// Configuración de email
const emailConfig = {
    smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
};

// Configuración de storage
const storageConfig = {
    type: env.STORAGE_TYPE,
    s3: {
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        accessKey: env.S3_ACCESS_KEY,
        secretKey: env.S3_SECRET_KEY
    }
};

// Configuración de features
const featuresConfig = {
    registration: env.ENABLE_REGISTRATION,
    emailVerification: env.ENABLE_EMAIL_VERIFICATION,
    twoFactorAuth: env.ENABLE_2FA,
    socialLogin: env.ENABLE_SOCIAL_LOGIN
};

// Configuración de desarrollo
const developmentConfig = {
    swagger: env.ENABLE_SWAGGER,
    graphiql: env.ENABLE_GRAPHIQL
};

// Configuración de testing
const testingConfig = {
    databaseUrl: env.TEST_DATABASE_URL,
    redisUrl: env.TEST_REDIS_URL
};

// Configuración de performance
const performanceConfig = {
    cache: {
        enabled: env.ENABLE_CACHE,
        ttl: env.CACHE_TTL
    }
};

// Configuración de sesión
const sessionConfig = {
    secret: env.SESSION_SECRET,
    ttl: env.SESSION_TTL
};

// Configuración de API
const apiConfig = {
    version: env.APP_VERSION,
    prefix: env.API_PREFIX
};

// Configuración de error reporting
const errorReportingConfig = {
    enabled: env.ENABLE_ERROR_REPORTING,
    service: env.ERROR_REPORTING_SERVICE
};

// Configuración de feature flags
const featureFlagsConfig = {
    featureX: env.ENABLE_FEATURE_X,
    featureY: env.ENABLE_FEATURE_Y
};

// Configuración de seguridad de desarrollo
const developmentSecurityConfig = {
    csrf: env.ENABLE_CSRF,
    xssProtection: env.ENABLE_XSS_PROTECTION,
    contentSecurityPolicy: env.ENABLE_CONTENT_SECURITY_POLICY
};

// Configuración de migraciones
const migrationsConfig = {
    auto: env.ENABLE_AUTO_MIGRATIONS,
    path: env.MIGRATIONS_PATH
};

// Configuración de frontend
const frontendConfig = {
    apiUrl: env.REACT_APP_API_URL,
    env: env.REACT_APP_ENV
};

// Configuración de backend
const backendConfig = {
    debug: env.ENABLE_DEBUG_MODE,
    queryLogging: env.ENABLE_QUERY_LOGGING
};

// Exportar configuración
export const config = {
    app: appConfig,
    database: dbConfig,
    jwt: jwtConfig,
    server: serverConfig,
    log: logConfig,
    ws: wsConfig,
    cors: corsConfig,
    rateLimit: rateLimitConfig,
    security: {
        ...securityConfig,
        ...developmentSecurityConfig
    },
    telemetry: telemetryConfig,
    alerts: alertsConfig,
    maintenance: maintenanceConfig,
    email: emailConfig,
    redis: redisConfig,
    storage: storageConfig,
    features: featuresConfig,
    development: developmentConfig,
    testing: testingConfig,
    performance: performanceConfig,
    session: sessionConfig,
    api: apiConfig,
    errorReporting: errorReportingConfig,
    featureFlags: featureFlagsConfig,
    migrations: migrationsConfig,
    frontend: frontendConfig,
    backend: backendConfig
} as const;

export default config;
