import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/dobacksoft_test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

// Mock global de Prisma para tests unitarios
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
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
    }))
}));

// Mock de logger para evitar logs en tests
vi.mock('./src/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));

// Mock de servicios externos
vi.mock('./src/services/NotificationService', () => ({
    NotificationService: vi.fn().mockImplementation(() => ({
        sendEmail: vi.fn().mockResolvedValue(true),
        sendSMS: vi.fn().mockResolvedValue(true)
    }))
}));

// Configuración global de la base de datos de pruebas
let prisma: PrismaClient;

beforeAll(async () => {
    // Solo inicializar Prisma si estamos en tests de integración
    if (process.env.VITEST_TEST_TYPE === 'integration') {
        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });

        try {
            // Conectar a la base de datos de pruebas
            await prisma.$connect();
            console.log('✅ Conectado a base de datos de pruebas');

            // Limpiar base de datos antes de los tests
            await cleanupDatabase();
        } catch (error) {
            console.warn('⚠️  No se pudo conectar a la base de datos de pruebas:', error.message);
            console.log('ℹ️  Los tests unitarios continuarán sin base de datos');
        }
    }
});

afterAll(async () => {
    if (prisma && process.env.VITEST_TEST_TYPE === 'integration') {
        try {
            // Limpiar base de datos después de todos los tests
            await cleanupDatabase();
            await prisma.$disconnect();
        } catch (error) {
            console.warn('⚠️  Error al desconectar de la base de datos:', error.message);
        }
    }
});

afterEach(async () => {
    if (prisma && process.env.VITEST_TEST_TYPE === 'integration') {
        try {
            // Limpiar datos después de cada test
            await cleanupDatabase();
        } catch (error) {
            console.warn('⚠️  Error limpiando base de datos:', error.message);
        }
    }
});

async function cleanupDatabase() {
    if (!prisma) return;

    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

    const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');

    try {
        if (tables) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        }
    } catch (error) {
        console.log('Error cleaning database:', error);
    }
}

// Exportar instancia de Prisma para usar en tests
export { prisma };

