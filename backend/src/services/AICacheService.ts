
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';



interface CacheEntry {
    id: string;
    key: string;
    data: any;
    expiresAt: Date;
    createdAt: Date;
}

export class AICacheService {
    private static readonly CACHE_TTL_HOURS = 24; // Cache válido por 24 horas
    private static readonly CACHE_TTL_MS = AICacheService.CACHE_TTL_HOURS * 60 * 60 * 1000;

    /**
     * Genera una clave de caché basada en los parámetros del análisis
     */
    private static generateCacheKey(organizationId: string, analysisType: string, params: any): string {
        const sortedParams = JSON.stringify(params, Object.keys(params).sort());
        return `${organizationId}:${analysisType}:${Buffer.from(sortedParams).toString('base64')}`;
    }

    /**
     * Obtiene datos del caché si están disponibles y no han expirado
     */
    static async getFromCache(organizationId: string, analysisType: string, params: any): Promise<any | null> {
        try {
            const cacheKey = this.generateCacheKey(organizationId, analysisType, params);

            // Buscar en SugerenciaIA (usando la tabla existente como caché)
            const cachedSuggestion = await prisma.sugerenciaIA.findFirst({
                where: {
                    vehicleId: null, // Usar vehicleId null para indicar caché general
                    tipo: `cache_${analysisType}`,
                    descripcion: cacheKey,
                    generadoEn: {
                        gte: new Date(Date.now() - this.CACHE_TTL_MS)
                    }
                }
            });

            if (cachedSuggestion) {
                logger.info('Datos obtenidos del caché', { organizationId, analysisType, cacheKey });
                return JSON.parse(cachedSuggestion.sugerencia);
            }

            return null;
        } catch (error) {
            logger.error('Error obteniendo del caché', { error, organizationId, analysisType });
            return null;
        }
    }

    /**
     * Guarda datos en el caché
     */
    static async saveToCache(organizationId: string, analysisType: string, params: any, data: any): Promise<void> {
        try {
            const cacheKey = this.generateCacheKey(organizationId, analysisType, params);

            // Limpiar caché expirado primero
            await this.clearExpiredCache();

            // Guardar en SugerenciaIA como caché
            await prisma.sugerenciaIA.create({
                data: {
                    tipo: `cache_${analysisType}`,
                    descripcion: cacheKey,
                    sugerencia: JSON.stringify(data),
                    generadoEn: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            logger.info('Datos guardados en caché', { organizationId, analysisType, cacheKey });
        } catch (error) {
            logger.error('Error guardando en caché', { error, organizationId, analysisType });
        }
    }

    /**
     * Limpia el caché expirado
     */
    static async clearExpiredCache(): Promise<void> {
        try {
            const expiredDate = new Date(Date.now() - this.CACHE_TTL_MS);

            const deleted = await prisma.sugerenciaIA.deleteMany({
                where: {
                    tipo: {
                        startsWith: 'cache_'
                    },
                    generadoEn: {
                        lt: expiredDate
                    }
                }
            });

            if (deleted.count > 0) {
                logger.info('Caché expirado limpiado', { deletedCount: deleted.count });
            }
        } catch (error) {
            logger.error('Error limpiando caché expirado', { error });
        }
    }

    /**
     * Invalida caché específico para una organización
     */
    static async invalidateCache(organizationId: string, analysisType?: string): Promise<void> {
        try {
            const whereClause: any = {
                tipo: {
                    startsWith: 'cache_'
                }
            };

            if (analysisType) {
                whereClause.tipo = `cache_${analysisType}`;
            }

            const deleted = await prisma.sugerenciaIA.deleteMany({
                where: whereClause
            });

            logger.info('Caché invalidado', { organizationId, analysisType, deletedCount: deleted.count });
        } catch (error) {
            logger.error('Error invalidando caché', { error, organizationId, analysisType });
        }
    }

    /**
     * Obtiene estadísticas del caché
     */
    static async getCacheStats(): Promise<any> {
        try {
            const totalCacheEntries = await prisma.sugerenciaIA.count({
                where: {
                    tipo: {
                        startsWith: 'cache_'
                    }
                }
            });

            const expiredCacheEntries = await prisma.sugerenciaIA.count({
                where: {
                    tipo: {
                        startsWith: 'cache_'
                    },
                    generadoEn: {
                        lt: new Date(Date.now() - this.CACHE_TTL_MS)
                    }
                }
            });

            const cacheByType = await prisma.sugerenciaIA.groupBy({
                by: ['tipo'],
                where: {
                    tipo: {
                        startsWith: 'cache_'
                    }
                },
                _count: {
                    id: true
                }
            });

            return {
                totalEntries: totalCacheEntries,
                expiredEntries: expiredCacheEntries,
                validEntries: totalCacheEntries - expiredCacheEntries,
                entriesByType: cacheByType.reduce((acc, group) => {
                    acc[group.tipo] = group._count.id;
                    return acc;
                }, {} as Record<string, number>),
                ttlHours: this.CACHE_TTL_HOURS
            };
        } catch (error) {
            logger.error('Error obteniendo estadísticas del caché', { error });
            return null;
        }
    }
}
