import { config } from 'dotenv';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { logger } from '../utils/logger';

config();

export class Database {
    private pool: Pool;
    private static instance: Database;
    private isConnected: boolean = false;

    constructor() {
        this.pool = createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'DobackSoft',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        this.initialize();
    }

    private async initialize() {
        try {
            // Verificar conexión
            const connection = await this.pool.getConnection();
            this.isConnected = true;
            connection.release();
            logger.info('Database connection established successfully');
        } catch (error) {
            logger.error('Error connecting to database', { error });
            this.isConnected = false;
            // No cerramos el proceso, permitimos reintentos
        }
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async getConnection(): Promise<PoolConnection> {
        if (!this.isConnected) {
            await this.initialize();
        }
        return this.pool.getConnection();
    }

    public async query<T>(sql: string, values?: any[]): Promise<T> {
        try {
            if (!this.isConnected) {
                await this.initialize();
            }

            const [results] = await this.pool.query(sql, values);
            return results as T;
        } catch (error) {
            logger.error('Error executing query', { error, sql, values });
            throw error;
        }
    }

    public async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    public async end(): Promise<void> {
        try {
            await this.pool.end();
            this.isConnected = false;
            logger.info('Database connection closed successfully');
        } catch (error) {
            logger.error('Error closing database connection', { error });
            throw error;
        }
    }
} 