import { Pool } from 'pg';
import { logger } from '../../utils/logger';

const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
};

export const pool = mockPool as unknown as Pool;

export const executeQuery = jest.fn();
export const executeTransaction = jest.fn();
export const getClient = jest.fn().mockResolvedValue(mockPool);

export const db = {
    query: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue({ affectedRows: 1 }),
    transaction: jest.fn().mockImplementation(async (callback) => {
        try {
            const result = await callback();
            return result;
        } catch (error) {
            logger.error('Error in transaction', { error });
            throw error;
        }
    }),
    release: jest.fn(),
    end: jest.fn()
};

export const connect = jest.fn().mockResolvedValue(db);
export const disconnect = jest.fn().mockResolvedValue(undefined);
export const executeQuery = jest.fn().mockImplementation(async (query, params) => {
    try {
        return await db.query(query, params);
    } catch (error) {
        logger.error('Error executing query', { error, query, params });
        throw error;
    }
}); 