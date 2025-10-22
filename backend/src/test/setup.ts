import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Mock de Prisma Client
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Mock del logger para tests
jest.mock('../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

// Mock de node-cron
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
    validate: jest.fn(() => true),
}));

// Mock de nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
}));

// Limpiar mocks antes de cada test
beforeEach(() => {
    mockReset(prismaMock);
});

// Timeout global para tests
jest.setTimeout(30000);

// Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

