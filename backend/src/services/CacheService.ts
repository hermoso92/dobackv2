import { logger } from '../utils/logger';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    hits: number;
    lastAccessed: number;
}

interface CacheOptions {
    ttl?: number; // Time to live en milisegundos
    maxSize?: number; // Máximo número de entradas
    maxMemory?: number; // Máximo uso de memoria en bytes
}

export interface CacheStats {
    totalEntries: number;
    hits: number;
    misses: number;
    hitRate: number;
    totalSize: number;
    memoryUsage: number;
}

export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private stats = {
        hits: 0,
        misses: 0
    };
    private options: Required<CacheOptions>;

    constructor(options: CacheOptions = {}) {
        this.options = {
            ttl: options.ttl || 5 * 60 * 1000, // 5 minutos por defecto
            maxSize: options.maxSize || 1000, // 1000 entradas por defecto
            maxMemory: options.maxMemory || 100 * 1024 * 1024 // 100MB por defecto
        };

        // Limpiar caché expirado cada minuto
        setInterval(() => {
            this.cleanup();
        }, 60 * 1000);

        logger.info('CacheService inicializado', {
            ttl: this.options.ttl,
            maxSize: this.options.maxSize,
            maxMemory: this.options.maxMemory
        });
    }

    /**
     * Obtiene un valor del caché
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        const now = Date.now();

        // Verificar si ha expirado
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        // Actualizar estadísticas de acceso
        entry.hits++;
        entry.lastAccessed = now;
        this.stats.hits++;

        return entry.data;
    }

    /**
     * Almacena un valor en el caché
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const now = Date.now();
        const expiresAt = now + (ttl || this.options.ttl);

        // Verificar límite de tamaño
        if (this.cache.size >= this.options.maxSize) {
            this.evictOldest();
        }

        // Verificar límite de memoria
        if (this.getMemoryUsage() >= this.options.maxMemory) {
            this.evictLeastUsed();
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiresAt,
            hits: 0,
            lastAccessed: now
        };

        this.cache.set(key, entry);
    }

    /**
     * Verifica si una clave existe en el caché
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        if (now > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Elimina una entrada del caché
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Limpia todas las entradas expiradas
     */
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`Cache cleanup: ${cleaned} entradas eliminadas`);
        }
    }

    /**
     * Limpia todo el caché
     */
    clear(): void {
        this.cache.clear();
        this.stats.hits = 0;
        this.stats.misses = 0;
        logger.info('Cache limpiado completamente');
    }

    /**
     * Obtiene estadísticas del caché
     */
    getStats(): CacheStats {
        const totalEntries = this.cache.size;
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

        return {
            totalEntries,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate,
            totalSize: this.getMemoryUsage(),
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Obtiene información detallada de las entradas del caché
     */
    getEntries(): Array<{
        key: string;
        size: number;
        hits: number;
        age: number;
        expiresIn: number;
    }> {
        const now = Date.now();

        return Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            size: JSON.stringify(entry.data).length,
            hits: entry.hits,
            age: now - entry.timestamp,
            expiresIn: entry.expiresAt - now
        }));
    }

    /**
     * Elimina las entradas más antiguas cuando se alcanza el límite de tamaño
     */
    private evictOldest(): void {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toDelete = entries.slice(0, Math.floor(this.options.maxSize * 0.1)); // Eliminar 10%

        for (const [key] of toDelete) {
            this.cache.delete(key);
        }

        logger.debug(`Cache eviction: ${toDelete.length} entradas antiguas eliminadas`);
    }

    /**
     * Elimina las entradas menos utilizadas cuando se alcanza el límite de memoria
     */
    private evictLeastUsed(): void {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].hits - b[1].hits);

        const toDelete = entries.slice(0, Math.floor(entries.length * 0.2)); // Eliminar 20%

        for (const [key] of toDelete) {
            this.cache.delete(key);
        }

        logger.debug(`Cache eviction: ${toDelete.length} entradas menos utilizadas eliminadas`);
    }

    /**
     * Calcula el uso de memoria aproximado
     */
    private getMemoryUsage(): number {
        let totalSize = 0;

        for (const [key, entry] of this.cache.entries()) {
            totalSize += key.length;
            totalSize += JSON.stringify(entry.data).length;
            totalSize += 100; // Overhead aproximado por entrada
        }

        return totalSize;
    }
}

// Instancias globales de caché para diferentes tipos de datos
export const dashboardCache = new CacheService({
    ttl: 2 * 60 * 1000, // 2 minutos
    maxSize: 100,
    maxMemory: 50 * 1024 * 1024 // 50MB
});

export const processingCache = new CacheService({
    ttl: 1 * 60 * 1000, // 1 minuto
    maxSize: 200,
    maxMemory: 30 * 1024 * 1024 // 30MB
});

export const mapDataCache = new CacheService({
    ttl: 5 * 60 * 1000, // 5 minutos
    maxSize: 50,
    maxMemory: 100 * 1024 * 1024 // 100MB
});

export const aiCache = new CacheService({
    ttl: 10 * 60 * 1000, // 10 minutos
    maxSize: 50,
    maxMemory: 20 * 1024 * 1024 // 20MB
});

// Función para obtener estadísticas de todos los caches
export function getAllCacheStats() {
    return {
        dashboard: dashboardCache.getStats(),
        processing: processingCache.getStats(),
        mapData: mapDataCache.getStats(),
        ai: aiCache.getStats(),
        total: {
            entries: dashboardCache.getStats().totalEntries +
                processingCache.getStats().totalEntries +
                mapDataCache.getStats().totalEntries +
                aiCache.getStats().totalEntries,
            memoryUsage: dashboardCache.getStats().memoryUsage +
                processingCache.getStats().memoryUsage +
                mapDataCache.getStats().memoryUsage +
                aiCache.getStats().memoryUsage
        }
    };
}

// Función para limpiar todos los caches
export function clearAllCaches() {
    dashboardCache.clear();
    processingCache.clear();
    mapDataCache.clear();
    aiCache.clear();
    logger.info('Todos los caches han sido limpiados');
}