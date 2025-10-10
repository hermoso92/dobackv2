import { logger } from '../utils/logger';

interface TimeoutConfig {
    defaultTimeout: number; // milliseconds
    fileOperations: number;
    databaseOperations: number;
    networkOperations: number;
    decodingOperations: number;
}

interface TimeoutResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    executionTime: number;
    timeoutMs: number;
}

export class TimeoutManager {
    private readonly config: TimeoutConfig = {
        defaultTimeout: 30000, // 30 segundos
        fileOperations: 60000, // 60 segundos para archivos grandes
        databaseOperations: 30000, // 30 segundos para BD
        networkOperations: 15000, // 15 segundos para red
        decodingOperations: 300000 // 5 minutos para decodificación CAN
    };

    /**
     * Ejecuta una operación con timeout automático
     */
    async executeWithTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs?: number,
        operationType: 'default' | 'file' | 'database' | 'network' | 'decoding' = 'default'
    ): Promise<TimeoutResult<T>> {
        const startTime = Date.now();
        const timeout = timeoutMs || this.getTimeoutForOperation(operationType);

        try {
            logger.debug(`⏱️ Ejecutando operación con timeout de ${timeout}ms`, {
                operationType,
                timeout
            });

            const result = await Promise.race([
                operation(),
                this.createTimeoutPromise<T>(timeout)
            ]);

            const executionTime = Date.now() - startTime;

            logger.debug(`✅ Operación completada en ${executionTime}ms`, {
                operationType,
                executionTime,
                timeout
            });

            return {
                success: true,
                data: result,
                executionTime,
                timeoutMs: timeout
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;

            if (this.isTimeoutError(error)) {
                logger.warn(`⏰ Operación timeout después de ${timeout}ms`, {
                    operationType,
                    executionTime,
                    timeout
                });

                return {
                    success: false,
                    error: `Timeout: operación tardó más de ${timeout}ms`,
                    executionTime,
                    timeoutMs: timeout
                };
            }

            logger.error(`❌ Error en operación`, {
                operationType,
                error: error instanceof Error ? error.message : 'Error desconocido',
                executionTime,
                timeout
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
                executionTime,
                timeoutMs: timeout
            };
        }
    }

    /**
     * Ejecuta múltiples operaciones en paralelo con timeout individual
     */
    async executeParallelWithTimeout<T>(
        operations: Array<{
            operation: () => Promise<T>;
            timeout?: number;
            operationType?: 'default' | 'file' | 'database' | 'network' | 'decoding';
            name?: string;
        }>
    ): Promise<Array<TimeoutResult<T> & { name?: string }>> {
        logger.info(`🔄 Ejecutando ${operations.length} operaciones en paralelo con timeout`);

        const promises = operations.map(async (op, index) => {
            const result = await this.executeWithTimeout(
                op.operation,
                op.timeout,
                op.operationType
            );

            return {
                ...result,
                name: op.name || `operation_${index}`
            };
        });

        const results = await Promise.all(promises);

        const successCount = results.filter(r => r.success).length;
        const timeoutCount = results.filter(r => !r.success && r.error?.includes('Timeout')).length;
        const errorCount = results.filter(r => !r.success && !r.error?.includes('Timeout')).length;

        logger.info(`✅ Operaciones paralelas completadas`, {
            total: operations.length,
            successful: successCount,
            timeouts: timeoutCount,
            errors: errorCount
        });

        return results;
    }

    /**
     * Ejecuta una operación con retry automático en caso de timeout
     */
    async executeWithTimeoutAndRetry<T>(
        operation: () => Promise<T>,
        timeoutMs?: number,
        maxRetries: number = 2,
        operationType: 'default' | 'file' | 'database' | 'network' | 'decoding' = 'default'
    ): Promise<TimeoutResult<T>> {
        let lastResult: TimeoutResult<T> | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            logger.info(`🔄 Intento ${attempt + 1}/${maxRetries + 1}`, {
                operationType,
                timeout: timeoutMs || this.getTimeoutForOperation(operationType)
            });

            lastResult = await this.executeWithTimeout(operation, timeoutMs, operationType);

            if (lastResult.success) {
                logger.info(`✅ Operación exitosa en intento ${attempt + 1}`, {
                    operationType,
                    totalAttempts: attempt + 1
                });
                break;
            }

            if (!this.isTimeoutError({ message: lastResult.error }) || attempt === maxRetries) {
                break;
            }

            // Esperar antes del siguiente intento
            const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
            logger.info(`⏳ Esperando ${backoffDelay}ms antes del siguiente intento`);
            await this.delay(backoffDelay);
        }

        return lastResult!;
    }

    /**
     * Crea una promesa que se rechaza después del timeout
     */
    private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`TIMEOUT_${timeoutMs}`));
            }, timeoutMs);
        });
    }

    /**
     * Obtiene el timeout apropiado para el tipo de operación
     */
    private getTimeoutForOperation(operationType: string): number {
        switch (operationType) {
            case 'file':
                return this.config.fileOperations;
            case 'database':
                return this.config.databaseOperations;
            case 'network':
                return this.config.networkOperations;
            case 'decoding':
                return this.config.decodingOperations;
            default:
                return this.config.defaultTimeout;
        }
    }

    /**
     * Determina si un error es de timeout
     */
    private isTimeoutError(error: any): boolean {
        if (!error) return false;

        const errorMessage = error.message || '';
        return errorMessage.includes('TIMEOUT_') ||
            errorMessage.toLowerCase().includes('timeout') ||
            errorMessage.includes('Timeout');
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Actualiza la configuración de timeouts
     */
    updateConfig(newConfig: Partial<TimeoutConfig>): void {
        Object.assign(this.config, newConfig);
        logger.info('⚙️ Configuración de timeouts actualizada', this.config);
    }

    /**
     * Obtiene la configuración actual
     */
    getConfig(): TimeoutConfig {
        return { ...this.config };
    }

    /**
     * Obtiene estadísticas de timeouts
     */
    getStats(): {
        totalOperations: number;
        successfulOperations: number;
        timeoutOperations: number;
        averageExecutionTime: number;
    } {
        // En una implementación real, esto mantendría estadísticas
        return {
            totalOperations: 0,
            successfulOperations: 0,
            timeoutOperations: 0,
            averageExecutionTime: 0
        };
    }
}

// Singleton instance
export const timeoutManager = new TimeoutManager();
