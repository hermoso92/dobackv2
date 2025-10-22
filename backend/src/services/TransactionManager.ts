
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';



interface TransactionOptions {
    timeout?: number; // milliseconds
    retries?: number;
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}

interface TransactionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    retryCount: number;
    executionTime: number;
}

export class TransactionManager {
    private readonly DEFAULT_TIMEOUT = 30000; // 30 segundos
    private readonly DEFAULT_RETRIES = 3;
    private readonly DEFAULT_ISOLATION = 'ReadCommitted' as const;

    /**
     * Ejecuta una operación dentro de una transacción atómica
     */
    async executeTransaction<T>(
        operation: (tx: any) => Promise<T>,
        options: TransactionOptions = {}
    ): Promise<TransactionResult<T>> {
        const startTime = Date.now();
        const timeout = options.timeout || this.DEFAULT_TIMEOUT;
        const maxRetries = options.retries || this.DEFAULT_RETRIES;
        const isolationLevel = options.isolationLevel || this.DEFAULT_ISOLATION;

        let lastError: Error | null = null;
        let retryCount = 0;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`🔄 Iniciando transacción (intento ${attempt + 1}/${maxRetries + 1})`, {
                    timeout,
                    isolationLevel,
                    attempt: attempt + 1
                });

                const result = await this.executeWithTimeout(
                    () => prisma.$transaction(operation, {
                        isolationLevel,
                        timeout
                    }),
                    timeout
                );

                const executionTime = Date.now() - startTime;

                logger.info(`✅ Transacción completada exitosamente`, {
                    executionTime,
                    retryCount,
                    attempt: attempt + 1
                });

                return {
                    success: true,
                    data: result,
                    retryCount,
                    executionTime
                };

            } catch (error) {
                lastError = error as Error;
                retryCount = attempt;

                logger.warn(`⚠️ Transacción falló (intento ${attempt + 1}/${maxRetries + 1})`, {
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    attempt: attempt + 1,
                    willRetry: attempt < maxRetries
                });

                // Si es el último intento o el error no es recuperable, no reintentar
                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    break;
                }

                // Esperar antes del siguiente intento (backoff exponencial)
                const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await this.delay(backoffDelay);
            }
        }

        const executionTime = Date.now() - startTime;

        logger.error(`❌ Transacción falló después de ${retryCount + 1} intentos`, {
            error: lastError?.message || 'Error desconocido',
            retryCount,
            executionTime
        });

        return {
            success: false,
            error: lastError?.message || 'Error desconocido en transacción',
            retryCount,
            executionTime
        };
    }

    /**
     * Ejecuta múltiples operaciones relacionadas en una sola transacción
     */
    async executeBatchTransaction<T>(
        operations: Array<(tx: any) => Promise<any>>,
        options: TransactionOptions = {}
    ): Promise<TransactionResult<T[]>> {
        const startTime = Date.now();
        const timeout = options.timeout || this.DEFAULT_TIMEOUT;
        const maxRetries = options.retries || this.DEFAULT_RETRIES;

        let lastError: Error | null = null;
        let retryCount = 0;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`🔄 Iniciando transacción batch (${operations.length} operaciones)`, {
                    timeout,
                    attempt: attempt + 1
                });

                const results = await this.executeWithTimeout(
                    () => prisma.$transaction(async (tx) => {
                        const batchResults = [];
                        for (const operation of operations) {
                            const result = await operation(tx);
                            batchResults.push(result);
                        }
                        return batchResults;
                    }, { timeout }),
                    timeout
                );

                const executionTime = Date.now() - startTime;

                logger.info(`✅ Transacción batch completada exitosamente`, {
                    operationsCount: operations.length,
                    executionTime,
                    retryCount
                });

                return {
                    success: true,
                    data: results,
                    retryCount,
                    executionTime
                };

            } catch (error) {
                lastError = error as Error;
                retryCount = attempt;

                logger.warn(`⚠️ Transacción batch falló (intento ${attempt + 1})`, {
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    operationsCount: operations.length,
                    willRetry: attempt < maxRetries
                });

                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    break;
                }

                const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await this.delay(backoffDelay);
            }
        }

        const executionTime = Date.now() - startTime;

        logger.error(`❌ Transacción batch falló después de ${retryCount + 1} intentos`, {
            error: lastError?.message || 'Error desconocido',
            operationsCount: operations.length,
            retryCount,
            executionTime
        });

        return {
            success: false,
            error: lastError?.message || 'Error desconocido en transacción batch',
            retryCount,
            executionTime
        };
    }

    /**
     * Ejecuta una operación con timeout
     */
    private async executeWithTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Operación timeout después de ${timeoutMs}ms`));
            }, timeoutMs);

            operation()
                .then(result => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Determina si un error es recuperable (debe reintentarse)
     */
    private isRetryableError(error: any): boolean {
        if (!error) return false;

        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';

        // Errores de conexión que pueden ser temporales
        const retryablePatterns = [
            'connection',
            'timeout',
            'network',
            'econnreset',
            'enotfound',
            'deadlock',
            'lock wait timeout',
            'serialization failure',
            'could not serialize access'
        ];

        // Códigos de error PostgreSQL que son recuperables
        const retryableCodes = [
            '40001', // serialization_failure
            '40P01', // deadlock_detected
            '55P03', // lock_not_available
            '08006', // connection_failure
            '08003', // connection_does_not_exist
        ];

        return retryablePatterns.some(pattern => errorMessage.includes(pattern)) ||
            retryableCodes.includes(errorCode);
    }

    /**
     * Delay helper para backoff exponencial
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtiene estadísticas de transacciones
     */
    async getTransactionStats(): Promise<{
        activeTransactions: number;
        totalTransactions: number;
        failedTransactions: number;
        averageExecutionTime: number;
    }> {
        // En una implementación real, esto consultaría métricas de la base de datos
        // Por ahora, retornamos valores simulados
        return {
            activeTransactions: 0,
            totalTransactions: 0,
            failedTransactions: 0,
            averageExecutionTime: 0
        };
    }

    /**
     * Limpia recursos y conexiones
     */
    async cleanup(): Promise<void> {
        try {
            await prisma.$disconnect();
            logger.info('🧹 TransactionManager cleanup completado');
        } catch (error) {
            logger.error('Error en cleanup de TransactionManager:', error);
        }
    }
}

// Singleton instance
export const transactionManager = new TransactionManager();
