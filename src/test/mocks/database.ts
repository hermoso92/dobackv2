import { Pool, PoolConnection } from 'mysql2/promise';
import { logger } from '../../utils/logger';

export class MockDatabase {
    private static instance: MockDatabase;
    private isConnected: boolean = true;

    private mockPool: Pool = {
        getConnection: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue([[], []]),
            beginTransaction: jest.fn().mockResolvedValue(undefined),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined)
        } as unknown as PoolConnection),
        query: jest.fn().mockResolvedValue([[], []]),
        end: jest.fn().mockResolvedValue(undefined)
    } as unknown as Pool;

    constructor() {
        logger.info('Mock database initialized');
    }

    public static getInstance(): MockDatabase {
        if (!MockDatabase.instance) {
            MockDatabase.instance = new MockDatabase();
        }
        return MockDatabase.instance;
    }

    public async getConnection(): Promise<PoolConnection> {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        return this.mockPool.getConnection();
    }

    public async query<T>(sql: string, values?: any[]): Promise<T> {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        return this.mockPool.query(sql, values) as unknown as T;
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
        this.isConnected = false;
        await this.mockPool.end();
    }

    // Métodos para testing
    public setMockQueryResult(result: any) {
        (this.mockPool.query as jest.Mock).mockResolvedValue([result, []]);
    }

    public setMockQueryError(error: Error) {
        (this.mockPool.query as jest.Mock).mockRejectedValue(error);
    }

    public setMockTransactionError(error: Error) {
        (this.mockPool.getConnection as jest.Mock).mockRejectedValue(error);
    }

    public clearMocks() {
        (this.mockPool.query as jest.Mock).mockClear();
        (this.mockPool.getConnection as jest.Mock).mockClear();
    }
} 