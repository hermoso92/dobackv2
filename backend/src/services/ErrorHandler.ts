import { logger } from '../utils/logger';

export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum ErrorCategory {
    FILE_SYSTEM = 'FILE_SYSTEM',
    DATABASE = 'DATABASE',
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    PROCESSING = 'PROCESSING',
    DECODING = 'DECODING',
    CONCURRENCY = 'CONCURRENCY',
    TIMEOUT = 'TIMEOUT',
    UNKNOWN = 'UNKNOWN'
}

export enum ErrorAction {
    RETRY = 'RETRY',
    SKIP = 'SKIP',
    ABORT = 'ABORT',
    CONTINUE = 'CONTINUE',
    NOTIFY = 'NOTIFY'
}

interface StructuredError {
    id: string;
    timestamp: Date;
    severity: ErrorSeverity;
    category: ErrorCategory;
    message: string;
    details?: any;
    context: {
        operation: string;
        filePath?: string;
        fileName?: string;
        lineNumber?: number;
        vehicleId?: string;
        organizationId?: string;
        sessionId?: string;
        userId?: string;
    };
    stack?: string;
    recovery: {
        action: ErrorAction;
        retryCount: number;
        maxRetries: number;
        canRecover: boolean;
    };
    metadata: {
        version: string;
        environment: string;
        service: string;
        requestId?: string;
    };
}

interface ErrorConfig {
    enableRecovery: boolean;
    maxRetries: number;
    retryDelay: number;
    enableNotifications: boolean;
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export class ErrorHandler {
    private readonly config: ErrorConfig = {
        enableRecovery: true,
        maxRetries: 3,
        retryDelay: 1000,
        enableNotifications: true,
        logLevel: 'ERROR'
    };

    private errorCounts: Map<string, number> = new Map();
    private errorHistory: StructuredError[] = [];
    private readonly MAX_HISTORY_SIZE = 1000;

    /**
     * Maneja un error de forma estructurada
     */
    handleError(
        error: Error | unknown,
        context: Partial<StructuredError['context']>,
        options: {
            severity?: ErrorSeverity;
            category?: ErrorCategory;
            action?: ErrorAction;
            details?: any;
            retryCount?: number;
        } = {}
    ): StructuredError {
        const structuredError = this.createStructuredError(
            error,
            context,
            options
        );

        // Incrementar contador de errores
        this.incrementErrorCount(structuredError);

        // Agregar a historial
        this.addToHistory(structuredError);

        // Ejecutar acción de recuperación
        this.executeRecoveryAction(structuredError);

        // Log estructurado
        this.logStructuredError(structuredError);

        // Notificaciones (si están habilitadas)
        if (this.config.enableNotifications && this.shouldNotify(structuredError)) {
            this.sendNotification(structuredError);
        }

        return structuredError;
    }

    /**
     * Maneja errores con retry automático
     */
    async handleErrorWithRetry<T>(
        operation: () => Promise<T>,
        context: Partial<StructuredError['context']>,
        options: {
            maxRetries?: number;
            retryDelay?: number;
            severity?: ErrorSeverity;
            category?: ErrorCategory;
        } = {}
    ): Promise<{ success: boolean; data?: T; error?: StructuredError }> {
        const maxRetries = options.maxRetries || this.config.maxRetries;
        let lastError: StructuredError | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();

                if (attempt > 0) {
                    logger.info(`✅ Operación exitosa después de ${attempt} reintentos`, {
                        operation: context.operation,
                        attempt
                    });
                }

                return { success: true, data: result };

            } catch (error) {
                lastError = this.handleError(error, context, {
                    severity: options.severity || ErrorSeverity.MEDIUM,
                    category: options.category || ErrorCategory.PROCESSING,
                    action: attempt < maxRetries ? ErrorAction.RETRY : ErrorAction.ABORT,
                    retryCount: attempt
                });

                if (attempt < maxRetries && lastError.recovery.canRecover) {
                    const delay = options.retryDelay || this.calculateRetryDelay(attempt);
                    logger.info(`⏳ Reintentando operación en ${delay}ms`, {
                        operation: context.operation,
                        attempt: attempt + 1,
                        maxRetries
                    });
                    await this.delay(delay);
                } else {
                    break;
                }
            }
        }

        return { success: false, error: lastError! };
    }

    /**
     * Crea un error estructurado
     */
    private createStructuredError(
        error: Error | unknown,
        context: Partial<StructuredError['context']>,
        options: {
            severity?: ErrorSeverity;
            category?: ErrorCategory;
            action?: ErrorAction;
            details?: any;
            retryCount?: number;
        }
    ): StructuredError {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        return {
            id: this.generateErrorId(),
            timestamp: new Date(),
            severity: options.severity || this.determineSeverity(errorObj),
            category: options.category || this.determineCategory(errorObj),
            message: errorObj.message,
            details: options.details,
            context: {
                operation: context.operation || 'unknown',
                filePath: context.filePath,
                fileName: context.fileName,
                lineNumber: context.lineNumber,
                vehicleId: context.vehicleId,
                organizationId: context.organizationId,
                sessionId: context.sessionId,
                userId: context.userId
            },
            stack: errorObj.stack,
            recovery: {
                action: options.action || this.determineRecoveryAction(errorObj),
                retryCount: options.retryCount || 0,
                maxRetries: this.config.maxRetries,
                canRecover: this.canRecover(errorObj)
            },
            metadata: {
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                service: 'doback-processing',
                requestId: this.generateRequestId()
            }
        };
    }

    /**
     * Determina la severidad del error
     */
    private determineSeverity(error: Error): ErrorSeverity {
        const message = error.message.toLowerCase();

        if (message.includes('timeout') || message.includes('connection')) {
            return ErrorSeverity.HIGH;
        }

        if (message.includes('file not found') || message.includes('permission denied')) {
            return ErrorSeverity.MEDIUM;
        }

        if (message.includes('validation') || message.includes('format')) {
            return ErrorSeverity.LOW;
        }

        if (message.includes('critical') || message.includes('fatal')) {
            return ErrorSeverity.CRITICAL;
        }

        return ErrorSeverity.MEDIUM;
    }

    /**
     * Determina la categoría del error
     */
    private determineCategory(error: Error): ErrorCategory {
        const message = error.message.toLowerCase();

        if (message.includes('file') || message.includes('directory')) {
            return ErrorCategory.FILE_SYSTEM;
        }

        if (message.includes('database') || message.includes('connection') || message.includes('query')) {
            return ErrorCategory.DATABASE;
        }

        if (message.includes('network') || message.includes('http') || message.includes('fetch')) {
            return ErrorCategory.NETWORK;
        }

        if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
            return ErrorCategory.VALIDATION;
        }

        if (message.includes('decode') || message.includes('parse')) {
            return ErrorCategory.DECODING;
        }

        if (message.includes('timeout')) {
            return ErrorCategory.TIMEOUT;
        }

        if (message.includes('lock') || message.includes('concurrent')) {
            return ErrorCategory.CONCURRENCY;
        }

        return ErrorCategory.PROCESSING;
    }

    /**
     * Determina la acción de recuperación
     */
    private determineRecoveryAction(error: Error): ErrorAction {
        const category = this.determineCategory(error);

        switch (category) {
            case ErrorCategory.TIMEOUT:
            case ErrorCategory.NETWORK:
                return ErrorAction.RETRY;

            case ErrorCategory.VALIDATION:
                return ErrorAction.SKIP;

            case ErrorCategory.DATABASE:
                return ErrorAction.RETRY;

            case ErrorCategory.FILE_SYSTEM:
                return ErrorAction.CONTINUE;

            default:
                return ErrorAction.CONTINUE;
        }
    }

    /**
     * Determina si el error puede ser recuperado
     */
    private canRecover(error: Error): boolean {
        const message = error.message.toLowerCase();

        // Errores no recuperables
        if (message.includes('fatal') ||
            message.includes('critical') ||
            message.includes('out of memory') ||
            message.includes('permission denied')) {
            return false;
        }

        return true;
    }

    /**
     * Ejecuta la acción de recuperación
     */
    private executeRecoveryAction(error: StructuredError): void {
        if (!this.config.enableRecovery) {
            return;
        }

        switch (error.recovery.action) {
            case ErrorAction.RETRY:
                logger.info(`🔄 Preparando reintento para error ${error.id}`, {
                    operation: error.context.operation,
                    retryCount: error.recovery.retryCount
                });
                break;

            case ErrorAction.SKIP:
                logger.warn(`⏭️ Saltando operación debido a error ${error.id}`, {
                    operation: error.context.operation,
                    reason: error.message
                });
                break;

            case ErrorAction.ABORT:
                logger.error(`🛑 Abortando procesamiento debido a error crítico ${error.id}`, {
                    operation: error.context.operation,
                    reason: error.message
                });
                break;

            case ErrorAction.CONTINUE:
                logger.info(`▶️ Continuando procesamiento después de error ${error.id}`, {
                    operation: error.context.operation
                });
                break;
        }
    }

    /**
     * Log estructurado del error
     */
    private logStructuredError(error: StructuredError): void {
        const logData = {
            errorId: error.id,
            severity: error.severity,
            category: error.category,
            message: error.message,
            context: error.context,
            recovery: error.recovery,
            timestamp: error.timestamp.toISOString()
        };

        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                logger.error(`🚨 ERROR CRÍTICO: ${error.message}`, logData);
                break;

            case ErrorSeverity.HIGH:
                logger.error(`❌ ERROR ALTO: ${error.message}`, logData);
                break;

            case ErrorSeverity.MEDIUM:
                logger.warn(`⚠️ ERROR MEDIO: ${error.message}`, logData);
                break;

            case ErrorSeverity.LOW:
                logger.info(`ℹ️ ERROR BAJO: ${error.message}`, logData);
                break;
        }
    }

    /**
     * Determina si debe enviar notificación
     */
    private shouldNotify(error: StructuredError): boolean {
        return error.severity === ErrorSeverity.CRITICAL ||
            error.severity === ErrorSeverity.HIGH ||
            (error.recovery.retryCount >= error.recovery.maxRetries);
    }

    /**
     * Envía notificación (implementación básica)
     */
    private sendNotification(error: StructuredError): void {
        logger.info(`📧 Enviando notificación para error ${error.id}`, {
            severity: error.severity,
            category: error.category,
            operation: error.context.operation
        });

        // Aquí se implementaría el envío real de notificaciones
        // (email, Slack, Discord, etc.)
    }

    /**
     * Incrementa el contador de errores
     */
    private incrementErrorCount(error: StructuredError): void {
        const key = `${error.category}-${error.severity}`;
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);
    }

    /**
     * Agrega error al historial
     */
    private addToHistory(error: StructuredError): void {
        this.errorHistory.push(error);

        // Mantener solo los últimos N errores
        if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
            this.errorHistory.shift();
        }
    }

    /**
     * Calcula el delay para retry con backoff exponencial
     */
    private calculateRetryDelay(attempt: number): number {
        const baseDelay = this.config.retryDelay;
        return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Máximo 30 segundos
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Genera ID único para error
     */
    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Genera ID único para request
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtiene estadísticas de errores
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByCategory: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        recentErrors: StructuredError[];
    } {
        const errorsByCategory: Record<string, number> = {};
        const errorsBySeverity: Record<string, number> = {};

        for (const [key, count] of this.errorCounts.entries()) {
            const [category, severity] = key.split('-');
            errorsByCategory[category] = (errorsByCategory[category] || 0) + count;
            errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + count;
        }

        return {
            totalErrors: this.errorHistory.length,
            errorsByCategory,
            errorsBySeverity,
            recentErrors: this.errorHistory.slice(-10) // Últimos 10 errores
        };
    }

    /**
     * Actualiza configuración
     */
    updateConfig(newConfig: Partial<ErrorConfig>): void {
        Object.assign(this.config, newConfig);
        logger.info('⚙️ Configuración de ErrorHandler actualizada', this.config);
    }

    /**
     * Limpia el historial de errores
     */
    clearHistory(): void {
        this.errorHistory = [];
        this.errorCounts.clear();
        logger.info('🧹 Historial de errores limpiado');
    }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
