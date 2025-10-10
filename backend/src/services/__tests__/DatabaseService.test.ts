import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockLogger } from '../../test/utils';
import { DatabaseService } from '../DatabaseService';

// Mock de funciones de Prisma
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockTransaction = vi.fn();
const mockQueryRaw = vi.fn();
const mockExecuteRaw = vi.fn();

// Mock de PrismaClient
const mockPrismaClient = {
    $connect: mockConnect,
    $disconnect: mockDisconnect,
    $transaction: mockTransaction,
    $queryRaw: mockQueryRaw,
    $executeRaw: mockExecuteRaw
};

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrismaClient)
}));

describe('DatabaseService', () => {
    let service: DatabaseService;
    let mockLogger: any;

    beforeEach(() => {
        mockLogger = createMockLogger();
        service = new DatabaseService(mockPrismaClient as unknown as PrismaClient);
        vi.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect successfully to the database', async () => {
            // Arrange
            mockConnect.mockResolvedValue(undefined);

            // Act
            await service.connect();

            // Assert
            expect(mockConnect).toHaveBeenCalled();
        });

        it('should handle connection errors', async () => {
            // Arrange
            const error = new Error('Connection failed');
            mockConnect.mockRejectedValue(error);

            // Act & Assert
            await expect(service.connect()).rejects.toThrow('Connection failed');
        });
    });

    describe('disconnect', () => {
        it('should disconnect successfully from the database', async () => {
            // Arrange
            mockDisconnect.mockResolvedValue(undefined);

            // Act
            await service.disconnect();

            // Assert
            expect(mockDisconnect).toHaveBeenCalled();
        });

        it('should handle disconnection errors', async () => {
            // Arrange
            const error = new Error('Disconnection failed');
            mockDisconnect.mockRejectedValue(error);

            // Act & Assert
            await expect(service.disconnect()).rejects.toThrow('Disconnection failed');
        });
    });

    describe('transaction', () => {
        it('should execute transaction successfully', async () => {
            // Arrange
            const mockCallback = vi.fn().mockResolvedValue({ id: 1 });
            mockTransaction.mockImplementation((callback) => callback(mockPrismaClient));

            // Act
            const result = await service.transaction(mockCallback);

            // Assert
            expect(result).toEqual({ id: 1 });
            expect(mockTransaction).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(mockPrismaClient);
        });

        it('should rollback transaction on error', async () => {
            // Arrange
            const error = new Error('Transaction failed');
            const mockCallback = vi.fn().mockRejectedValue(error);
            mockTransaction.mockImplementation((callback) => callback(mockPrismaClient));

            // Act & Assert
            await expect(service.transaction(mockCallback)).rejects.toThrow('Transaction failed');
        });
    });

    describe('healthCheck', () => {
        it('should return healthy status when database is connected', async () => {
            // Arrange
            mockQueryRaw.mockResolvedValue([{ now: new Date() }]);

            // Act
            const result = await service.healthCheck();

            // Assert
            expect(result.status).toBe('healthy');
            expect(result.latency).toBeDefined();
            expect(result.lastChecked).toBeDefined();
        });

        it('should return unhealthy status when database check fails', async () => {
            // Arrange
            const error = new Error('Database check failed');
            mockQueryRaw.mockRejectedValue(error);

            // Act
            const result = await service.healthCheck();

            // Assert
            expect(result.status).toBe('unhealthy');
            expect(result.error).toBeDefined();
            expect(result.lastChecked).toBeDefined();
        });
    });

    describe('backup', () => {
        it('should create database backup successfully', async () => {
            // Arrange
            const mockData = { tables: ['users', 'vehicles'], records: 100 };
            mockQueryRaw.mockResolvedValue(mockData);

            // Act
            const result = await service.backup();

            // Assert
            expect(result.success).toBe(true);
            expect(result.timestamp).toBeDefined();
            expect(result.data).toEqual(mockData);
        });

        it('should handle backup failures', async () => {
            // Arrange
            const error = new Error('Backup failed');
            mockQueryRaw.mockRejectedValue(error);

            // Act
            const result = await service.backup();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('restore', () => {
        it('should restore database from backup successfully', async () => {
            // Arrange
            const backupData = { tables: ['users', 'vehicles'], records: 100 };
            mockExecuteRaw.mockResolvedValue(undefined);

            // Act
            const result = await service.restore(backupData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.timestamp).toBeDefined();
            expect(result.restoredTables).toEqual(backupData.tables);
        });

        it('should handle restore failures', async () => {
            // Arrange
            const error = new Error('Restore failed');
            const backupData = { tables: ['users', 'vehicles'], records: 100 };
            mockExecuteRaw.mockRejectedValue(error);

            // Act
            const result = await service.restore(backupData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });
    });
});
