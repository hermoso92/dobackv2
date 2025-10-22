import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    latency?: number;
    lastChecked: Date;
    error?: string;
}

interface BackupResult {
    success: boolean;
    timestamp: Date;
    data?: any;
    error?: string;
}

interface RestoreResult {
    success: boolean;
    timestamp: Date;
    restoredTables?: string[];
    error?: string;
}

export class DatabaseService {
    constructor(private prisma: PrismaClient) {}

    async connect(): Promise<void> {
        try {
            await prisma.$connect();
            logger.info('Database connected successfully');
        } catch (error) {
            logger.error('Database connection failed', { error });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await prisma.$disconnect();
            logger.info('Database disconnected successfully');
        } catch (error) {
            logger.error('Database disconnection failed', { error });
            throw error;
        }
    }

    async transaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
        try {
            const result = await prisma.$transaction(callback);
            return result;
        } catch (error) {
            logger.error('Transaction failed', { error });
            throw error;
        }
    }

    async healthCheck(): Promise<HealthCheckResult> {
        const startTime = Date.now();
        try {
            await prisma.$queryRaw`SELECT NOW()`;
            const latency = Date.now() - startTime;

            return {
                status: 'healthy',
                latency,
                lastChecked: new Date()
            };
        } catch (error) {
            logger.error('Database health check failed', { error });
            return {
                status: 'unhealthy',
                lastChecked: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async backup(): Promise<BackupResult> {
        try {
            // Obtener lista de tablas
            const tables = await prisma.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `;

            // Obtener datos de cada tabla
            const data: Record<string, any> = {};
            for (const table of tables as any[]) {
                const tableName = table.table_name;
                const records = await prisma.$queryRaw`
                    SELECT * FROM "${tableName}"
                `;
                data[tableName] = records;
            }

            return {
                success: true,
                timestamp: new Date(),
                data
            };
        } catch (error) {
            logger.error('Database backup failed', { error });
            return {
                success: false,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async restore(backupData: any): Promise<RestoreResult> {
        try {
            const restoredTables: string[] = [];

            await this.transaction(async (prisma) => {
                // Restaurar cada tabla
                for (const [tableName, records] of Object.entries(backupData)) {
                    // Limpiar tabla existente
                    await prisma.$executeRaw`TRUNCATE TABLE "${tableName}" CASCADE`;

                    // Insertar registros
                    if (Array.isArray(records) && records.length > 0) {
                        const columns = Object.keys(records[0]);
                        const values = records.map((record) => columns.map((col) => record[col]));

                        // Construir consulta de inserción
                        const placeholders = values[0].map((_, i) => `$${i + 1}`).join(', ');
                        await prisma.$executeRaw`
                            INSERT INTO "${tableName}" (${columns.join(', ')})
                            VALUES (${placeholders})
                        `;

                        restoredTables.push(tableName);
                    }
                }
            });

            return {
                success: true,
                timestamp: new Date(),
                restoredTables
            };
        } catch (error) {
            logger.error('Database restore failed', { error });
            return {
                success: false,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async migrate(): Promise<void> {
        try {
            // Ejecutar migraciones pendientes
            await prisma.$executeRaw`SELECT prisma_migrate()`;
            logger.info('Database migrations completed successfully');
        } catch (error) {
            logger.error('Database migration failed', { error });
            throw error;
        }
    }

    async seed(): Promise<void> {
        try {
            // Ejecutar seeds
            await prisma.$executeRaw`SELECT prisma_seed()`;
            logger.info('Database seeding completed successfully');
        } catch (error) {
            logger.error('Database seeding failed', { error });
            throw error;
        }
    }

    async reset(): Promise<void> {
        try {
            // Resetear la base de datos
            await prisma.$executeRaw`DROP SCHEMA public CASCADE`;
            await prisma.$executeRaw`CREATE SCHEMA public`;
            logger.info('Database reset completed successfully');
        } catch (error) {
            logger.error('Database reset failed', { error });
            throw error;
        }
    }

    async vacuum(): Promise<void> {
        try {
            // Optimizar la base de datos
            await prisma.$executeRaw`VACUUM ANALYZE`;
            logger.info('Database vacuum completed successfully');
        } catch (error) {
            logger.error('Database vacuum failed', { error });
            throw error;
        }
    }

    async getStats(): Promise<any> {
        try {
            // Obtener estadísticas de la base de datos
            const stats = await prisma.$queryRaw`
                SELECT 
                    schemaname,
                    tablename,
                    n_live_tup as row_count,
                    pg_size_pretty(pg_total_relation_size('"' || schemaname || '"."' || tablename || '"')) as total_size
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC
            `;

            return stats;
        } catch (error) {
            logger.error('Failed to get database stats', { error });
            throw error;
        }
    }
}
