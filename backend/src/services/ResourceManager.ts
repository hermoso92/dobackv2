import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface ResourceInfo {
    id: string;
    type: 'FILE' | 'DATABASE_CONNECTION' | 'STREAM' | 'TIMER' | 'LOCK' | 'PROCESSING';
    path?: string;
    createdAt: Date;
    lastAccessed: Date;
    size?: number;
    isActive: boolean;
}

interface CleanupConfig {
    maxFileAge: number; // milliseconds
    maxTempFiles: number;
    cleanupInterval: number; // milliseconds
    enableAutoCleanup: boolean;
    tempDirectories: string[];
    excludePatterns: string[];
}

export class ResourceManager {
    private readonly config: CleanupConfig = {
        maxFileAge: 24 * 60 * 60 * 1000, // 24 horas
        maxTempFiles: 1000,
        cleanupInterval: 60 * 60 * 1000, // 1 hora
        enableAutoCleanup: true,
        tempDirectories: [
            path.join(process.cwd(), 'backend/data/temp'),
            path.join(process.cwd(), 'backend/data/processed'),
            path.join(process.cwd(), 'backend/logs/temp')
        ],
        excludePatterns: [
            '*.log',
            '*.pid',
            '.gitignore',
            '.env'
        ]
    };

    private resources: Map<string, ResourceInfo> = new Map();
    private cleanupTimer: NodeJS.Timer | null = null;
    private isCleaningUp = false;

    constructor() {
        this.startAutoCleanup();
        this.setupProcessHandlers();
    }

    /**
     * Registra un recurso para tracking
     */
    registerResource(
        id: string,
        type: ResourceInfo['type'],
        path?: string,
        size?: number
    ): void {
        const resource: ResourceInfo = {
            id,
            type,
            path,
            createdAt: new Date(),
            lastAccessed: new Date(),
            size,
            isActive: true
        };

        this.resources.set(id, resource);

        logger.debug(`📝 Recurso registrado: ${id}`, {
            type,
            path,
            size
        });
    }

    /**
     * Actualiza el acceso a un recurso
     */
    updateResourceAccess(id: string): void {
        const resource = this.resources.get(id);
        if (resource) {
            resource.lastAccessed = new Date();
            this.resources.set(id, resource);
        }
    }

    /**
     * Marca un recurso como inactivo
     */
    deactivateResource(id: string): void {
        const resource = this.resources.get(id);
        if (resource) {
            resource.isActive = false;
            this.resources.set(id, resource);
            logger.debug(`🔴 Recurso desactivado: ${id}`);
        }
    }

    /**
     * Elimina un recurso del tracking
     */
    unregisterResource(id: string): void {
        const resource = this.resources.get(id);
        if (resource) {
            this.resources.delete(id);
            logger.debug(`🗑️ Recurso eliminado del tracking: ${id}`);
        }
    }

    /**
     * Ejecuta cleanup completo del sistema
     */
    async performFullCleanup(): Promise<{
        filesDeleted: number;
        bytesFreed: number;
        resourcesCleaned: number;
        errors: string[];
    }> {
        if (this.isCleaningUp) {
            logger.warn('⚠️ Cleanup ya está en progreso, saltando...');
            return {
                filesDeleted: 0,
                bytesFreed: 0,
                resourcesCleaned: 0,
                errors: ['Cleanup ya en progreso']
            };
        }

        this.isCleaningUp = true;
        const startTime = Date.now();

        logger.info('🧹 Iniciando cleanup completo del sistema');

        const result = {
            filesDeleted: 0,
            bytesFreed: 0,
            resourcesCleaned: 0,
            errors: [] as string[]
        };

        try {
            // 1. Cleanup de archivos temporales
            const fileCleanup = await this.cleanupTempFiles();
            result.filesDeleted += fileCleanup.filesDeleted;
            result.bytesFreed += fileCleanup.bytesFreed;
            result.errors.push(...fileCleanup.errors);

            // 2. Cleanup de recursos inactivos
            const resourceCleanup = await this.cleanupInactiveResources();
            result.resourcesCleaned += resourceCleanup;

            // 3. Cleanup de conexiones de base de datos
            await this.cleanupDatabaseConnections();

            // 4. Cleanup de streams abiertos
            await this.cleanupOpenStreams();

            // 5. Cleanup de timers
            await this.cleanupTimers();

            const processingTime = Date.now() - startTime;

            logger.info('✅ Cleanup completo finalizado', {
                processingTime,
                filesDeleted: result.filesDeleted,
                bytesFreed: this.formatBytes(result.bytesFreed),
                resourcesCleaned: result.resourcesCleaned,
                errors: result.errors.length
            });

        } catch (error) {
            logger.error('❌ Error en cleanup completo:', error);
            result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            this.isCleaningUp = false;
        }

        return result;
    }

    /**
     * Cleanup de archivos temporales
     */
    private async cleanupTempFiles(): Promise<{
        filesDeleted: number;
        bytesFreed: number;
        errors: string[];
    }> {
        const result = {
            filesDeleted: 0,
            bytesFreed: 0,
            errors: [] as string[]
        };

        for (const tempDir of this.config.tempDirectories) {
            try {
                await fs.access(tempDir);
                const cleanupResult = await this.cleanupDirectory(tempDir);
                result.filesDeleted += cleanupResult.filesDeleted;
                result.bytesFreed += cleanupResult.bytesFreed;
                result.errors.push(...cleanupResult.errors);
            } catch (error) {
                // Directorio no existe, no es un error
                logger.debug(`Directorio temporal no existe: ${tempDir}`);
            }
        }

        return result;
    }

    /**
     * Cleanup de un directorio específico
     */
    private async cleanupDirectory(dirPath: string): Promise<{
        filesDeleted: number;
        bytesFreed: number;
        errors: string[];
    }> {
        const result = {
            filesDeleted: 0,
            bytesFreed: 0,
            errors: [] as string[]
        };

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const now = Date.now();

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                try {
                    // Verificar si el archivo debe ser excluido
                    if (this.shouldExcludeFile(entry.name)) {
                        continue;
                    }

                    if (entry.isFile()) {
                        const stats = await fs.stat(fullPath);
                        const age = now - stats.mtime.getTime();

                        // Eliminar archivos antiguos
                        if (age > this.config.maxFileAge) {
                            await fs.unlink(fullPath);
                            result.filesDeleted++;
                            result.bytesFreed += stats.size;

                            logger.debug(`🗑️ Archivo eliminado: ${entry.name}`, {
                                age: this.formatTime(age),
                                size: this.formatBytes(stats.size)
                            });
                        }
                    } else if (entry.isDirectory()) {
                        // Limpiar subdirectorios recursivamente
                        const subResult = await this.cleanupDirectory(fullPath);
                        result.filesDeleted += subResult.filesDeleted;
                        result.bytesFreed += subResult.bytesFreed;
                        result.errors.push(...subResult.errors);
                    }

                } catch (error) {
                    const errorMsg = `Error procesando ${entry.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
                    result.errors.push(errorMsg);
                    logger.warn(`⚠️ ${errorMsg}`);
                }
            }

        } catch (error) {
            const errorMsg = `Error accediendo directorio ${dirPath}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
            result.errors.push(errorMsg);
            logger.warn(`⚠️ ${errorMsg}`);
        }

        return result;
    }

    /**
     * Cleanup de recursos inactivos
     */
    private async cleanupInactiveResources(): Promise<number> {
        const now = Date.now();
        const maxAge = this.config.maxFileAge;
        let cleanedCount = 0;

        for (const [id, resource] of this.resources.entries()) {
            if (!resource.isActive) {
                const age = now - resource.lastAccessed.getTime();

                if (age > maxAge) {
                    // Limpiar archivos asociados
                    if (resource.type === 'FILE' && resource.path) {
                        try {
                            await fs.unlink(resource.path);
                            logger.debug(`🗑️ Archivo de recurso eliminado: ${resource.path}`);
                        } catch (error) {
                            logger.warn(`⚠️ Error eliminando archivo de recurso ${resource.path}:`, error);
                        }
                    }

                    this.resources.delete(id);
                    cleanedCount++;

                    logger.debug(`🧹 Recurso inactivo eliminado: ${id}`, {
                        type: resource.type,
                        age: this.formatTime(age)
                    });
                }
            }
        }

        return cleanedCount;
    }

    /**
     * Cleanup de conexiones de base de datos
     */
    private async cleanupDatabaseConnections(): Promise<void> {
        // En una implementación real, esto limpiaría conexiones de BD
        logger.debug('🧹 Limpiando conexiones de base de datos');
    }

    /**
     * Cleanup de streams abiertos
     */
    private async cleanupOpenStreams(): Promise<void> {
        // En una implementación real, esto cerraría streams abiertos
        logger.debug('🧹 Limpiando streams abiertos');
    }

    /**
     * Cleanup de timers
     */
    private async cleanupTimers(): Promise<void> {
        // Limpiar timers huérfanos (esto es complejo en Node.js)
        logger.debug('🧹 Limpiando timers');
    }

    /**
     * Verifica si un archivo debe ser excluido del cleanup
     */
    private shouldExcludeFile(fileName: string): boolean {
        return this.config.excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(fileName);
            }
            return fileName === pattern;
        });
    }

    /**
     * Inicia el cleanup automático
     */
    private startAutoCleanup(): void {
        if (!this.config.enableAutoCleanup) {
            return;
        }

        this.cleanupTimer = setInterval(async () => {
            try {
                logger.info('🕐 Ejecutando cleanup automático');
                await this.performFullCleanup();
            } catch (error) {
                logger.error('❌ Error en cleanup automático:', error);
            }
        }, this.config.cleanupInterval);

        logger.info('🕐 Cleanup automático iniciado', {
            interval: this.formatTime(this.config.cleanupInterval)
        });
    }

    /**
     * Detiene el cleanup automático
     */
    stopAutoCleanup(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            logger.info('🛑 Cleanup automático detenido');
        }
    }

    /**
     * Configura handlers para cleanup al cerrar la aplicación
     */
    private setupProcessHandlers(): void {
        const cleanup = async () => {
            logger.info('🔄 Cerrando aplicación, ejecutando cleanup final...');
            this.stopAutoCleanup();
            await this.performFullCleanup();
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('exit', cleanup);
    }

    /**
     * Obtiene estadísticas de recursos
     */
    getResourceStats(): {
        totalResources: number;
        activeResources: number;
        inactiveResources: number;
        resourcesByType: Record<string, number>;
        totalSize: number;
    } {
        const stats = {
            totalResources: this.resources.size,
            activeResources: 0,
            inactiveResources: 0,
            resourcesByType: {} as Record<string, number>,
            totalSize: 0
        };

        for (const resource of this.resources.values()) {
            if (resource.isActive) {
                stats.activeResources++;
            } else {
                stats.inactiveResources++;
            }

            stats.resourcesByType[resource.type] = (stats.resourcesByType[resource.type] || 0) + 1;
            stats.totalSize += resource.size || 0;
        }

        return stats;
    }

    /**
     * Obtiene lista de recursos
     */
    getResources(): ResourceInfo[] {
        return Array.from(this.resources.values());
    }

    /**
     * Actualiza configuración
     */
    updateConfig(newConfig: Partial<CleanupConfig>): void {
        Object.assign(this.config, newConfig);
        logger.info('⚙️ Configuración de ResourceManager actualizada', this.config);
    }

    /**
     * Helper para formatear tiempo
     */
    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Helper para formatear bytes
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Destructor para limpiar recursos
     */
    destroy(): void {
        this.stopAutoCleanup();
        this.resources.clear();
        logger.info('🧹 ResourceManager destruido');
    }
}

// Singleton instance
export const resourceManager = new ResourceManager();
