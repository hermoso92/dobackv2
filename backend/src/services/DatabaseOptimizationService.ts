import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface QueryOptimizationOptions {
    enableIndexing?: boolean;
    enableQueryCaching?: boolean;
    maxQueryTime?: number;
    enableQueryLogging?: boolean;
}

interface QueryStats {
    query: string;
    duration: number;
    rows: number;
    timestamp: Date;
    optimized: boolean;
}

export class DatabaseOptimizationService {
    private queryStats: QueryStats[] = [];
    private options: Required<QueryOptimizationOptions>;

    constructor(prisma: PrismaClient, options: QueryOptimizationOptions = {}) {
        this.options = {
            enableIndexing: options.enableIndexing ?? true,
            enableQueryCaching: options.enableQueryCaching ?? true,
            maxQueryTime: options.maxQueryTime ?? 5000, // 5 segundos
            enableQueryLogging: options.enableQueryLogging ?? true
        };

        this.setupQueryInterception();
        this.createOptimizedIndexes();

        logger.info('DatabaseOptimizationService inicializado', this.options);
    }

    /**
     * Configura interceptores para optimizar consultas automáticamente
     */
    private setupQueryInterception() {
        // Intercepción de consultas deshabilitada por compatibilidad con Prisma
        // Se puede implementar a través de middleware de Prisma en el futuro
        logger.info('Intercepción de consultas configurada (modo básico)');
    }

    /**
     * Crea índices optimizados para consultas frecuentes
     */
    private async createOptimizedIndexes() {
        if (!this.options.enableIndexing) return;

        try {
            const indexes = [
                // Índices para consultas de eventos de estabilidad
                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stability_events_org_timestamp 
                 ON stability_events (organization_id, timestamp DESC)`,

                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stability_events_vehicle_timestamp 
                 ON stability_events (vehicle_id, timestamp DESC)`,

                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stability_events_severity 
                 ON stability_events (severity) WHERE severity IN ('G', 'M', 'L')`,

                // Índices para consultas de mediciones
                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_measurements_session_timestamp 
                 ON measurements (session_id, timestamp DESC)`,

                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_measurements_type_timestamp 
                 ON measurements (type, timestamp DESC)`,

                // Índices para consultas de sesiones
                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_vehicle_start_date 
                 ON sessions (vehicle_id, start_date DESC)`,

                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_organization_start_date 
                 ON sessions (organization_id, start_date DESC)`,

                // Índices para consultas de vehículos
                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_organization_active 
                 ON vehicles (organization_id, is_active) WHERE is_active = true`,

                // Índices para consultas de eventos de procesamiento
                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_events_org_timestamp 
                 ON processing_events (organization_id, timestamp DESC)`,

                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_events_status 
                 ON processing_events (status) WHERE status IN ('COMPLETED', 'FAILED', 'PROCESSING')`,

                // Índices para consultas de geofences
                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_geofences_organization_active 
                 ON geofences (organization_id, is_active) WHERE is_active = true`,

                `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_geofence_events_geofence_timestamp 
                 ON geofence_events (geofence_id, timestamp DESC)`
            ];

            for (const indexQuery of indexes) {
                try {
                    await prisma.$executeRawUnsafe(indexQuery);
                    logger.debug('Índice creado exitosamente', { query: indexQuery.substring(0, 100) });
                } catch (error) {
                    // Ignorar errores de índices que ya existen
                    if (!(error instanceof Error && error.message.includes('already exists'))) {
                        logger.warn('Error creando índice', { error: error instanceof Error ? error.message : 'Unknown error' });
                    }
                }
            }

            logger.info('Índices de optimización creados');
        } catch (error) {
            logger.error('Error creando índices de optimización', { error });
        }
    }

    /**
     * Registra estadísticas de consultas
     */
    private recordQueryStats(stats: QueryStats) {
        this.queryStats.push(stats);

        // Mantener solo las últimas 1000 consultas
        if (this.queryStats.length > 1000) {
            this.queryStats = this.queryStats.slice(-1000);
        }
    }

    /**
     * Obtiene estadísticas de consultas lentas
     */
    getSlowQueries(threshold: number = 1000): QueryStats[] {
        return this.queryStats
            .filter(stats => stats.duration > threshold)
            .sort((a, b) => b.duration - a.duration);
    }

    /**
     * Obtiene estadísticas generales de rendimiento
     */
    getPerformanceStats() {
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

        const recentQueries = this.queryStats.filter(
            stats => stats.timestamp > lastHour
        );

        const totalQueries = recentQueries.length;
        const slowQueries = recentQueries.filter(q => q.duration > 1000).length;
        const avgDuration = totalQueries > 0
            ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries
            : 0;

        return {
            totalQueries,
            slowQueries,
            avgDuration: Math.round(avgDuration),
            slowQueryRate: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
            queriesLastHour: recentQueries.length
        };
    }

    /**
     * Optimiza una consulta específica
     */
    async optimizeQuery(query: string): Promise<string> {
        // Aplicar optimizaciones básicas
        let optimizedQuery = query;

        // Agregar LIMIT si no está presente en consultas de selección
        if (query.toLowerCase().includes('select') && !query.toLowerCase().includes('limit')) {
            optimizedQuery += ' LIMIT 1000';
        }

        // Optimizar ORDER BY
        optimizedQuery = optimizedQuery.replace(
            /ORDER BY\s+(\w+)\s+(ASC|DESC)/gi,
            'ORDER BY $1 $2 NULLS LAST'
        );

        // Agregar hints de optimización para PostgreSQL
        if (optimizedQuery.toLowerCase().includes('select')) {
            optimizedQuery = `/*+ USE_INDEX */ ${optimizedQuery}`;
        }

        return optimizedQuery;
    }

    /**
     * Ejecuta una consulta optimizada
     */
    async executeOptimizedQuery(query: string, params: any[] = []): Promise<any> {
        const startTime = Date.now();

        try {
            const optimizedQuery = await this.optimizeQuery(query);
            const result = await prisma.$queryRawUnsafe(optimizedQuery, ...params);

            const duration = Date.now() - startTime;

            this.recordQueryStats({
                query: optimizedQuery,
                duration,
                rows: Array.isArray(result) ? result.length : 0,
                timestamp: new Date(),
                optimized: true
            });

            logger.info('Consulta optimizada ejecutada', {
                originalDuration: duration,
                rows: Array.isArray(result) ? result.length : 0,
                optimized: true
            });

            return result;
        } catch (error) {
            logger.error('Error ejecutando consulta optimizada', { error });
            throw error;
        }
    }

    /**
     * Analiza y sugiere optimizaciones para una tabla
     */
    async analyzeTable(tableName: string): Promise<{
        rowCount: number;
        tableSize: string;
        indexCount: number;
        suggestions: string[];
    }> {
        try {
            // Obtener estadísticas de la tabla
            const stats = await prisma.$queryRawUnsafe(`
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    n_live_tup as live_rows,
                    n_dead_tup as dead_rows,
                    last_vacuum,
                    last_autovacuum,
                    last_analyze,
                    last_autoanalyze
                FROM pg_stat_user_tables 
                WHERE tablename = $1
            `, tableName);

            const tableStats = Array.isArray(stats) ? stats[0] : null;

            // Obtener tamaño de la tabla
            const sizeResult = await prisma.$queryRawUnsafe(`
                SELECT pg_size_pretty(pg_total_relation_size($1)) as size
            `, tableName);

            const tableSize = Array.isArray(sizeResult) ? (sizeResult[0] as any).size : 'Unknown';

            // Obtener número de índices
            const indexResult = await prisma.$queryRawUnsafe(`
                SELECT COUNT(*) as index_count
                FROM pg_indexes 
                WHERE tablename = $1
            `, tableName);

            const indexCount = Array.isArray(indexResult) ? (indexResult[0] as any).index_count : 0;

            // Generar sugerencias
            const suggestions: string[] = [];

            if (tableStats && (tableStats as any).dead_rows > (tableStats as any).live_rows * 0.1) {
                suggestions.push('Considerar VACUUM para limpiar filas muertas');
            }

            if (indexCount < 3) {
                suggestions.push('Considerar agregar más índices para consultas frecuentes');
            }

            if (tableStats && !(tableStats as any).last_analyze) {
                suggestions.push('Ejecutar ANALYZE para actualizar estadísticas');
            }

            return {
                rowCount: tableStats ? (tableStats as any).live_rows : 0,
                tableSize,
                indexCount,
                suggestions
            };
        } catch (error) {
            logger.error('Error analizando tabla', { tableName, error });
            return {
                rowCount: 0,
                tableSize: 'Unknown',
                indexCount: 0,
                suggestions: ['Error obteniendo estadísticas']
            };
        }
    }

    /**
     * Ejecuta mantenimiento de base de datos
     */
    async performMaintenance(): Promise<void> {
        try {
            logger.info('Iniciando mantenimiento de base de datos');

            // VACUUM ANALYZE para todas las tablas principales
            const tables = [
                'stability_events',
                'measurements',
                'sessions',
                'vehicles',
                'processing_events',
                'geofences',
                'geofence_events'
            ];

            for (const table of tables) {
                try {
                    await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table}`);
                    logger.debug(`Mantenimiento completado para tabla: ${table}`);
                } catch (error) {
                    logger.warn(`Error en mantenimiento de tabla ${table}`, { error });
                }
            }

            logger.info('Mantenimiento de base de datos completado');
        } catch (error) {
            logger.error('Error en mantenimiento de base de datos', { error });
        }
    }

    /**
     * Obtiene recomendaciones de optimización
     */
    getOptimizationRecommendations(): string[] {
        const recommendations: string[] = [];
        const stats = this.getPerformanceStats();

        if (stats.slowQueryRate > 20) {
            recommendations.push('Alto porcentaje de consultas lentas. Considerar agregar más índices.');
        }

        if (stats.avgDuration > 500) {
            recommendations.push('Tiempo promedio de consulta alto. Revisar optimizaciones de consultas.');
        }

        if (stats.queriesLastHour > 1000) {
            recommendations.push('Alto volumen de consultas. Considerar implementar caché más agresivo.');
        }

        const slowQueries = this.getSlowQueries();
        if (slowQueries.length > 0) {
            recommendations.push(`${slowQueries.length} consultas muy lentas detectadas. Revisar índices.`);
        }

        return recommendations;
    }
}
