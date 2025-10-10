import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface ProcessingConfig {
    maxFileSize: number;
    chunkSize: number;
    maxMemoryUsage: number;
    timeoutMs: number;
    maxRetries: number;
    retryDelay: number;
    concurrentStreams: number;
}

interface DatabaseConfig {
    connectionTimeout: number;
    queryTimeout: number;
    maxConnections: number;
    retryAttempts: number;
}

interface MonitoringConfig {
    enableMetrics: boolean;
    enableHealthChecks: boolean;
    metricsRetentionMs: number;
    healthCheckInterval: number;
}

interface CleanupConfig {
    enableAutoCleanup: boolean;
    maxFileAge: number;
    cleanupInterval: number;
    maxTempFiles: number;
}

interface SystemConfig {
    processing: ProcessingConfig;
    database: DatabaseConfig;
    monitoring: MonitoringConfig;
    cleanup: CleanupConfig;
    environment: string;
    logLevel: string;
    enableDebug: boolean;
}

export class ConfigurationManager {
    private config: SystemConfig;
    private configPath: string;
    private lastModified: Date | null = null;

    constructor() {
        this.configPath = this.getConfigPath();
        this.config = this.getDefaultConfig();
        // Temporalmente deshabilitado para debug
        // this.startConfigWatcher();
        // Cargar configuración de forma asíncrona
        this.initializeConfig();
    }

    private async initializeConfig(): Promise<void> {
        await this.loadConfiguration();
    }

    /**
     * Carga la configuración desde archivo y variables de entorno
     */
    private async loadConfiguration(): Promise<void> {
        try {
            // Cargar desde archivo si existe
            await this.loadFromFile();

            // Aplicar variables de entorno
            this.applyEnvironmentVariables();

            logger.info('⚙️ Configuración cargada exitosamente', {
                configPath: this.configPath,
                environment: this.config.environment,
                logLevel: this.config.logLevel
            });

        } catch (error) {
            logger.warn('⚠️ Error cargando configuración, usando valores por defecto:', error);
        }
    }

    /**
     * Carga configuración desde archivo
     */
    private async loadFromFile(): Promise<void> {
        try {
            await fs.access(this.configPath);
            const fileContent = await fs.readFile(this.configPath, 'utf-8');
            const fileConfig = JSON.parse(fileContent);

            // Merge con configuración por defecto
            this.config = this.mergeConfigs(this.config, fileConfig);

            const stats = await fs.stat(this.configPath);
            this.lastModified = stats.mtime;

            logger.info(`📁 Configuración cargada desde archivo: ${this.configPath}`);

        } catch (error) {
            logger.debug(`📁 Archivo de configuración no encontrado: ${this.configPath}`);
        }
    }

    /**
     * Aplica variables de entorno a la configuración
     */
    private applyEnvironmentVariables(): void {
        const envMappings = {
            // Sistema
            'DOBACK_ENVIRONMENT': 'environment',
            'DOBACK_LOG_LEVEL': 'logLevel',
            'DOBACK_DEBUG': 'enableDebug',

            // Procesamiento
            'DOBACK_MAX_FILE_SIZE': 'processing.maxFileSize',
            'DOBACK_CHUNK_SIZE': 'processing.chunkSize',
            'DOBACK_MAX_MEMORY': 'processing.maxMemoryUsage',
            'DOBACK_TIMEOUT': 'processing.timeoutMs',
            'DOBACK_MAX_RETRIES': 'processing.maxRetries',
            'DOBACK_RETRY_DELAY': 'processing.retryDelay',
            'DOBACK_CONCURRENT_STREAMS': 'processing.concurrentStreams',

            // Base de datos
            'DOBACK_DB_TIMEOUT': 'database.connectionTimeout',
            'DOBACK_DB_QUERY_TIMEOUT': 'database.queryTimeout',
            'DOBACK_DB_MAX_CONNECTIONS': 'database.maxConnections',
            'DOBACK_DB_RETRY_ATTEMPTS': 'database.retryAttempts',

            // Monitoreo
            'DOBACK_ENABLE_METRICS': 'monitoring.enableMetrics',
            'DOBACK_ENABLE_HEALTH_CHECKS': 'monitoring.enableHealthChecks',
            'DOBACK_METRICS_RETENTION': 'monitoring.metricsRetentionMs',
            'DOBACK_HEALTH_CHECK_INTERVAL': 'monitoring.healthCheckInterval',

            // Cleanup
            'DOBACK_ENABLE_CLEANUP': 'cleanup.enableAutoCleanup',
            'DOBACK_MAX_FILE_AGE': 'cleanup.maxFileAge',
            'DOBACK_CLEANUP_INTERVAL': 'cleanup.cleanupInterval',
            'DOBACK_MAX_TEMP_FILES': 'cleanup.maxTempFiles'
        };

        for (const [envVar, configPath] of Object.entries(envMappings)) {
            const value = process.env[envVar];
            if (value !== undefined) {
                this.setConfigValue(configPath, this.parseEnvValue(value));
            }
        }

        logger.info('🌍 Variables de entorno aplicadas a la configuración');
    }

    /**
     * Parsea valores de variables de entorno
     */
    private parseEnvValue(value: string): any {
        // Boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Number
        if (!isNaN(Number(value))) return Number(value);

        // String
        return value;
    }

    /**
     * Establece un valor de configuración por ruta
     */
    private setConfigValue(path: string, value: any): void {
        const keys = path.split('.');
        let current: any = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Obtiene la ruta del archivo de configuración
     */
    private getConfigPath(): string {
        const configDir = path.join(process.cwd(), 'backend/config');
        return path.join(configDir, 'doback-config.json');
    }

    /**
     * Obtiene configuración por defecto
     */
    private getDefaultConfig(): SystemConfig {
        return {
            processing: {
                maxFileSize: 200 * 1024 * 1024, // 200MB
                chunkSize: 32 * 1024, // 32KB
                maxMemoryUsage: 100 * 1024 * 1024, // 100MB
                timeoutMs: 30000, // 30 segundos
                maxRetries: 3,
                retryDelay: 1000, // 1 segundo
                concurrentStreams: 3
            },
            database: {
                connectionTimeout: 10000, // 10 segundos
                queryTimeout: 30000, // 30 segundos
                maxConnections: 10,
                retryAttempts: 3
            },
            monitoring: {
                enableMetrics: true,
                enableHealthChecks: true,
                metricsRetentionMs: 24 * 60 * 60 * 1000, // 24 horas
                healthCheckInterval: 5 * 60 * 1000 // 5 minutos
            },
            cleanup: {
                enableAutoCleanup: true,
                maxFileAge: 24 * 60 * 60 * 1000, // 24 horas
                cleanupInterval: 60 * 60 * 1000, // 1 hora
                maxTempFiles: 1000
            },
            environment: process.env.NODE_ENV || 'development',
            logLevel: process.env.LOG_LEVEL || 'info',
            enableDebug: process.env.NODE_ENV === 'development'
        };
    }

    /**
     * Fusiona dos configuraciones
     */
    private mergeConfigs(defaultConfig: any, fileConfig: any): any {
        const result = { ...defaultConfig };

        for (const key in fileConfig) {
            if (typeof fileConfig[key] === 'object' && fileConfig[key] !== null && !Array.isArray(fileConfig[key])) {
                result[key] = this.mergeConfigs(defaultConfig[key] || {}, fileConfig[key]);
            } else {
                result[key] = fileConfig[key];
            }
        }

        return result;
    }

    /**
     * Inicia el watcher de archivos de configuración
     */
    private startConfigWatcher(): void {
        // En una implementación real, esto usaría fs.watch para detectar cambios
        // Por simplicidad, verificamos cambios cada minuto
        setInterval(async () => {
            try {
                await fs.access(this.configPath);
                const stats = await fs.stat(this.configPath);

                if (this.lastModified && stats.mtime > this.lastModified) {
                    logger.info('📁 Archivo de configuración modificado, recargando...');
                    await this.loadFromFile();
                    this.applyEnvironmentVariables();
                    this.lastModified = stats.mtime;

                    // Notificar cambios a otros servicios
                    this.notifyConfigChange();
                }
            } catch (error) {
                // Archivo no existe, no es un error
            }
        }, 60000); // Cada minuto
    }

    /**
     * Notifica cambios de configuración
     */
    private notifyConfigChange(): void {
        logger.info('🔄 Configuración actualizada, notificando servicios...');
        // En una implementación real, esto notificaría a otros servicios
        // para que actualicen su configuración
    }

    /**
     * Obtiene toda la configuración
     */
    getConfig(): SystemConfig {
        return { ...this.config };
    }

    /**
     * Obtiene configuración de procesamiento
     */
    getProcessingConfig(): ProcessingConfig {
        return { ...this.config.processing };
    }

    /**
     * Obtiene configuración de base de datos
     */
    getDatabaseConfig(): DatabaseConfig {
        return { ...this.config.database };
    }

    /**
     * Obtiene configuración de monitoreo
     */
    getMonitoringConfig(): MonitoringConfig {
        return { ...this.config.monitoring };
    }

    /**
     * Obtiene configuración de cleanup
     */
    getCleanupConfig(): CleanupConfig {
        return { ...this.config.cleanup };
    }

    /**
     * Obtiene un valor de configuración por ruta
     */
    getConfigValue(path: string): any {
        const keys = path.split('.');
        let current: any = this.config;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Actualiza configuración en tiempo de ejecución
     */
    updateConfig(updates: Partial<SystemConfig>): void {
        this.config = this.mergeConfigs(this.config, updates);
        logger.info('⚙️ Configuración actualizada en tiempo de ejecución', updates);
    }

    /**
     * Guarda configuración en archivo
     */
    async saveConfig(): Promise<void> {
        try {
            const configDir = path.dirname(this.configPath);
            await fs.mkdir(configDir, { recursive: true });

            const configJson = JSON.stringify(this.config, null, 2);
            await fs.writeFile(this.configPath, configJson, 'utf-8');

            const stats = await fs.stat(this.configPath);
            this.lastModified = stats.mtime;

            logger.info(`💾 Configuración guardada en: ${this.configPath}`);

        } catch (error) {
            logger.error('❌ Error guardando configuración:', error);
            throw error;
        }
    }

    /**
     * Valida la configuración actual
     */
    validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validar configuración de procesamiento
        if (this.config.processing.maxFileSize <= 0) {
            errors.push('maxFileSize debe ser mayor que 0');
        }

        if (this.config.processing.chunkSize <= 0) {
            errors.push('chunkSize debe ser mayor que 0');
        }

        if (this.config.processing.maxMemoryUsage <= 0) {
            errors.push('maxMemoryUsage debe ser mayor que 0');
        }

        if (this.config.processing.timeoutMs <= 0) {
            errors.push('timeoutMs debe ser mayor que 0');
        }

        if (this.config.processing.maxRetries < 0) {
            errors.push('maxRetries no puede ser negativo');
        }

        // Validar configuración de base de datos
        if (this.config.database.connectionTimeout <= 0) {
            errors.push('database.connectionTimeout debe ser mayor que 0');
        }

        if (this.config.database.queryTimeout <= 0) {
            errors.push('database.queryTimeout debe ser mayor que 0');
        }

        if (this.config.database.maxConnections <= 0) {
            errors.push('database.maxConnections debe ser mayor que 0');
        }

        // Validar entorno
        const validEnvironments = ['development', 'staging', 'production'];
        if (!validEnvironments.includes(this.config.environment)) {
            errors.push(`environment debe ser uno de: ${validEnvironments.join(', ')}`);
        }

        // Validar log level
        const validLogLevels = ['error', 'warn', 'info', 'debug'];
        if (!validLogLevels.includes(this.config.logLevel)) {
            errors.push(`logLevel debe ser uno de: ${validLogLevels.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Obtiene información de configuración
     */
    getConfigInfo(): {
        configPath: string;
        lastModified: Date | null;
        environment: string;
        logLevel: string;
        enableDebug: boolean;
        validation: { valid: boolean; errors: string[] };
    } {
        return {
            configPath: this.configPath,
            lastModified: this.lastModified,
            environment: this.config.environment,
            logLevel: this.config.logLevel,
            enableDebug: this.config.enableDebug,
            validation: this.validateConfig()
        };
    }

    /**
     * Genera archivo de configuración de ejemplo
     */
    async generateExampleConfig(): Promise<void> {
        const examplePath = path.join(path.dirname(this.configPath), 'doback-config.example.json');
        const exampleConfig = this.getDefaultConfig();

        // Añadir comentarios en el JSON (no estándar, pero útil para documentación)
        const exampleJson = JSON.stringify(exampleConfig, null, 2)
            .replace(/"/g, '// ')
            .replace(/^\/\/ /gm, '// ');

        await fs.writeFile(examplePath, exampleJson, 'utf-8');
        logger.info(`📝 Archivo de configuración de ejemplo generado: ${examplePath}`);
    }
}

// Singleton instance
export const configurationManager = new ConfigurationManager();
