import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ProcessingLock {
    id: string;
    resourceId: string; // filePath o vehicleId
    resourceType: 'FILE' | 'VEHICLE' | 'SESSION';
    organizationId: string;
    processId: string;
    acquiredAt: Date;
    expiresAt: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'RELEASED';
}

export class ConcurrencyManager {
    private readonly LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.startCleanupTimer();
    }

    /**
     * Adquiere un lock para un recurso específico
     */
    async acquireLock(
        resourceId: string,
        resourceType: 'FILE' | 'VEHICLE' | 'SESSION',
        organizationId: string,
        processId: string = this.generateProcessId()
    ): Promise<{ success: boolean; lockId?: string; error?: string }> {
        try {
            // Limpiar locks expirados primero
            await this.cleanupExpiredLocks();

            // Verificar si ya existe un lock activo
            const existingLock = await this.findActiveLock(resourceId, resourceType, organizationId);

            if (existingLock) {
                logger.warn(`🔒 Lock ya existe para recurso ${resourceId}`, {
                    resourceType,
                    organizationId,
                    existingProcessId: existingLock.processId,
                    acquiredAt: existingLock.acquiredAt
                });

                return {
                    success: false,
                    error: `Recurso ${resourceId} ya está siendo procesado por otro proceso`
                };
            }

            // Crear nuevo lock
            const expiresAt = new Date(Date.now() + this.LOCK_TIMEOUT);
            const lockId = this.generateLockId();

            const lock: ProcessingLock = {
                id: lockId,
                resourceId,
                resourceType,
                organizationId,
                processId,
                acquiredAt: new Date(),
                expiresAt,
                status: 'ACTIVE'
            };

            // Guardar en base de datos (simulado con in-memory por ahora)
            // En producción, usar Redis o tabla de locks en PostgreSQL
            await this.saveLock(lock);

            logger.info(`🔒 Lock adquirido exitosamente`, {
                lockId,
                resourceId,
                resourceType,
                organizationId,
                processId,
                expiresAt
            });

            return {
                success: true,
                lockId
            };

        } catch (error) {
            logger.error(`Error adquiriendo lock para ${resourceId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Libera un lock específico
     */
    async releaseLock(lockId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const lock = await this.findLockById(lockId);

            if (!lock) {
                logger.warn(`Lock ${lockId} no encontrado`);
                return {
                    success: false,
                    error: 'Lock no encontrado'
                };
            }

            if (lock.status !== 'ACTIVE') {
                logger.warn(`Lock ${lockId} no está activo (status: ${lock.status})`);
                return {
                    success: false,
                    error: `Lock no está activo (status: ${lock.status})`
                };
            }

            // Marcar como liberado
            lock.status = 'RELEASED';
            await this.updateLock(lock);

            logger.info(`🔓 Lock liberado exitosamente`, {
                lockId,
                resourceId: lock.resourceId,
                resourceType: lock.resourceType
            });

            return { success: true };

        } catch (error) {
            logger.error(`Error liberando lock ${lockId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Renueva un lock existente
     */
    async renewLock(lockId: string, additionalTime?: number): Promise<{ success: boolean; error?: string }> {
        try {
            const lock = await this.findLockById(lockId);

            if (!lock) {
                return {
                    success: false,
                    error: 'Lock no encontrado'
                };
            }

            if (lock.status !== 'ACTIVE') {
                return {
                    success: false,
                    error: `Lock no está activo (status: ${lock.status})`
                };
            }

            // Verificar que no haya expirado
            if (new Date() > lock.expiresAt) {
                lock.status = 'EXPIRED';
                await this.updateLock(lock);
                return {
                    success: false,
                    error: 'Lock ha expirado'
                };
            }

            // Renovar tiempo de expiración
            const renewalTime = additionalTime || this.LOCK_TIMEOUT;
            lock.expiresAt = new Date(Date.now() + renewalTime);
            await this.updateLock(lock);

            logger.info(`🔄 Lock renovado`, {
                lockId,
                resourceId: lock.resourceId,
                newExpiresAt: lock.expiresAt
            });

            return { success: true };

        } catch (error) {
            logger.error(`Error renovando lock ${lockId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Verifica si un recurso está siendo procesado
     */
    async isResourceLocked(
        resourceId: string,
        resourceType: 'FILE' | 'VEHICLE' | 'SESSION',
        organizationId: string
    ): Promise<{ locked: boolean; lockInfo?: ProcessingLock }> {
        try {
            const lock = await this.findActiveLock(resourceId, resourceType, organizationId);

            if (lock && lock.status === 'ACTIVE' && new Date() < lock.expiresAt) {
                return {
                    locked: true,
                    lockInfo: lock
                };
            }

            return { locked: false };

        } catch (error) {
            logger.error(`Error verificando lock para ${resourceId}:`, error);
            return { locked: false };
        }
    }

    /**
     * Obtiene información de todos los locks activos
     */
    async getActiveLocks(organizationId?: string): Promise<ProcessingLock[]> {
        try {
            // En producción, consultar base de datos
            // Por ahora, retornar array vacío
            return [];
        } catch (error) {
            logger.error('Error obteniendo locks activos:', error);
            return [];
        }
    }

    /**
     * Limpia locks expirados
     */
    private async cleanupExpiredLocks(): Promise<void> {
        try {
            const now = new Date();
            // En producción, ejecutar query para marcar locks expirados
            logger.debug('🧹 Limpieza de locks expirados ejecutada');
        } catch (error) {
            logger.error('Error limpiando locks expirados:', error);
        }
    }

    /**
     * Inicia el timer de limpieza automática
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredLocks();
        }, this.CLEANUP_INTERVAL);
    }

    /**
     * Detiene el timer de limpieza
     */
    stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    // Métodos auxiliares privados

    private async findActiveLock(
        resourceId: string,
        resourceType: string,
        organizationId: string
    ): Promise<ProcessingLock | null> {
        // En producción, consultar base de datos
        // Por ahora, simular que no hay locks
        return null;
    }

    private async findLockById(lockId: string): Promise<ProcessingLock | null> {
        // En producción, consultar base de datos
        return null;
    }

    private async saveLock(lock: ProcessingLock): Promise<void> {
        // En producción, guardar en base de datos
        logger.debug(`Guardando lock ${lock.id}`);
    }

    private async updateLock(lock: ProcessingLock): Promise<void> {
        // En producción, actualizar en base de datos
        logger.debug(`Actualizando lock ${lock.id}`);
    }

    private generateLockId(): string {
        return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateProcessId(): string {
        return `process_${process.pid}_${Date.now()}`;
    }

    /**
     * Destructor para limpiar recursos
     */
    destroy(): void {
        this.stopCleanupTimer();
    }
}

// Singleton instance
export const concurrencyManager = new ConcurrencyManager();
