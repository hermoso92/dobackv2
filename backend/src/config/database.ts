import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';
import { config } from './env';

const poolConfig: PoolConfig = {
    connectionString: config.database.url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    logger.info('Connected to database');
});

pool.on('error', (err: Error) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;

export const dbManager = {
    async connect() {
        try {
            await pool.connect();
            logger.info('Database connection established');

            // Verificar la conexión con una consulta simple
            await pool.query('SELECT 1');
            logger.info('Database connection verified');
        } catch (error) {
            logger.error('Failed to connect to database', { error });
            throw error;
        }
    },
    async disconnect() {
        try {
            await pool.end();
            logger.info('Database connection closed');
        } catch (error) {
            logger.error('Error closing database connection', { error });
            throw error;
        }
    },
    async healthCheck() {
        try {
            // Verificar la conexión básica
            await pool.query('SELECT 1');
            logger.info('Basic database connection verified');

            // Verificar el estado del pool de conexiones
            const poolStatus = await pool.query<{ active_connections: string }[]>(`
        SELECT count(*)::text as active_connections 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
            logger.info('Database pool status:', {
                activeConnections: Number(poolStatus.rows[0]?.active_connections || 0)
            });

            // Verificar que podemos acceder a una tabla
            const tableCount = await pool.query<{ count: string }[]>(`
        SELECT COUNT(*)::text as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
            logger.info('Database tables accessible:', {
                tableCount: Number(tableCount.rows[0]?.count || 0)
            });

            return true;
        } catch (error) {
            logger.error('Database health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            return false;
        }
    }
};
