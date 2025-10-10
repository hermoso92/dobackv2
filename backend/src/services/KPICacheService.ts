/**
 * 📦 SERVICIO DE CACHÉ PARA KPIs
 * 
 * Optimiza performance de cálculos KPI evitando recalcular datos que no cambian frecuentemente.
 * 
 * Estrategia:
 * - Cache en memoria con TTL de 5 minutos
 * - Key basada en filtros (organizationId, vehicleIds, from, to)
 * - Invalidación automática en uploads
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('KPICache');

interface CacheEntry {
    data: any;
    timestamp: number;
    filters: string; // Hash de los filtros
}

export class KPICacheService {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly TTL = 5 * 60 * 1000; // 5 minutos

    /**
     * Genera key de cache basada en filtros
     */
    private generateCacheKey(filters: {
        organizationId: string;
        from?: Date;
        to?: Date;
        vehicleIds?: string[];
    }): string {
        const parts = [
            filters.organizationId,
            filters.from?.toISOString() || 'no-from',
            filters.to?.toISOString() || 'no-to',
            filters.vehicleIds?.sort().join(',') || 'all-vehicles'
        ];

        return parts.join('|');
    }

    /**
     * Obtener del caché si existe y es válido
     */
    get(filters: {
        organizationId: string;
        from?: Date;
        to?: Date;
        vehicleIds?: string[];
    }): any | null {
        const key = this.generateCacheKey(filters);
        const entry = this.cache.get(key);

        if (!entry) {
            logger.debug('Cache miss', { key });
            return null;
        }

        const age = Date.now() - entry.timestamp;

        if (age > this.TTL) {
            logger.debug('Cache expired', { key, age });
            this.cache.delete(key);
            return null;
        }

        logger.info('Cache hit', { key, age: `${age}ms` });
        return entry.data;
    }

    /**
     * Guardar en caché
     */
    set(
        filters: {
            organizationId: string;
            from?: Date;
            to?: Date;
            vehicleIds?: string[];
        },
        data: any
    ): void {
        const key = this.generateCacheKey(filters);

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            filters: key
        });

        logger.info('Datos guardados en cache', { key, size: this.cache.size });

        // Limpiar cache viejo
        this.cleanup();
    }

    /**
     * Invalidar cache de una organización
     */
    invalidate(organizationId: string): void {
        let deleted = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (key.startsWith(organizationId)) {
                this.cache.delete(key);
                deleted++;
            }
        }

        logger.info('Cache invalidado', { organizationId, deleted });
    }

    /**
     * Limpiar entradas expiradas
     */
    private cleanup(): void {
        const now = Date.now();
        let deleted = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.TTL) {
                this.cache.delete(key);
                deleted++;
            }
        }

        if (deleted > 0) {
            logger.debug('Cleanup ejecutado', { deleted, remaining: this.cache.size });
        }
    }

    /**
     * Limpiar todo el cache
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache limpiado completamente', { entriesDeleted: size });
    }

    /**
     * Estadísticas del cache
     */
    getStats(): {
        entries: number;
        oldestEntry: number | null;
        newestEntry: number | null;
        totalSize: number;
    } {
        if (this.cache.size === 0) {
            return {
                entries: 0,
                oldestEntry: null,
                newestEntry: null,
                totalSize: 0
            };
        }

        const now = Date.now();
        let oldest = now;
        let newest = 0;

        for (const entry of this.cache.values()) {
            if (entry.timestamp < oldest) oldest = entry.timestamp;
            if (entry.timestamp > newest) newest = entry.timestamp;
        }

        return {
            entries: this.cache.size,
            oldestEntry: now - oldest,
            newestEntry: now - newest,
            totalSize: this.cache.size
        };
    }
}

export const kpiCacheService = new KPICacheService();

