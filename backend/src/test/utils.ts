import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { vi } from 'vitest';
import { EventSeverity, EventType, UserRole } from '../types/enums';

export const mockRequest = (data: any = {}): Partial<Request> => ({
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    headers: data.headers || {},
    user: data.user || null,
    ...data
});

export const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
};

export const generateTestToken = (userId = 1, role: UserRole = UserRole.OPERATOR): string => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

export const mockStabilityData = {
    id: '1',
    vehicleId: 'test-vehicle-id',
    sessionId: 'test-session-id',
    timestamp: new Date().toISOString(),
    roll: 15,
    pitch: 10,
    yaw: 5,
    lateralAcc: 0.8,
    longitudinalAcc: 0.7,
    verticalAcc: 0.9,
    loadDistribution: {
        frontLeft: 0.25,
        frontRight: 0.25,
        rearLeft: 0.25,
        rearRight: 0.25
    }
};

export const mockEvent = {
    id: 1,
    type: EventType.STABILITY_WARNING,
    severity: EventSeverity.HIGH,
    description: 'Test event',
    vehicleId: 1,
    organizationId: 1,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
};

// Mock de PrismaClient para tests
export const createMockPrisma = () => {
    return {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        organization: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        vehicle: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        session: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        event: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        eventVehicle: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn()
        },
        telemetry: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        rule: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        alarm: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        maintenanceRequest: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        auditLog: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        },
        $disconnect: vi.fn(),
        $connect: vi.fn(),
        $executeRaw: vi.fn(),
        $queryRaw: vi.fn(),
        $transaction: vi.fn()
    } as unknown as PrismaClient;
};

// Mock de logger para tests
export const createMockLogger = () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn()
});

// Funciones auxiliares para tests
export const testUtils = {
    // Funciones de limpieza
    clearDatabase: async (prisma: PrismaClient) => {
        const tables = [
            'users',
            'organizations',
            'vehicles',
            'sessions',
            'events',
            'telemetry',
            'rules',
            'alarms',
            'maintenance_requests',
            'audit_logs'
        ];

        for (const table of tables) {
            await prisma.$executeRaw`TRUNCATE TABLE ${table} CASCADE;`;
        }
    },

    // Funciones de validación
    isValidUUID: (uuid: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },
    isValidEmail: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    isValidDate: (date: Date) => {
        return date instanceof Date && !isNaN(date.getTime());
    }
};

export default {
    createMockPrisma,
    createMockLogger,
    testUtils
};
