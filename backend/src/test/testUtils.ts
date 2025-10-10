import { PrismaClient } from '@prisma/client';

export const setupTestDatabase = async (prisma: PrismaClient) => {
    // Limpiar todas las tablas antes de cada test
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;

    for (const { name } of tables) {
        if (name !== '_prisma_migrations') {
            await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
        }
    }
};

export const teardownTestDatabase = async (prisma: PrismaClient) => {
    await prisma.$disconnect();
};

// Función helper para crear mocks de Prisma
export const createPrismaMock = () => {
    return {
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $transaction: jest.fn((callback) => callback()),
        $queryRaw: jest.fn(),
        $executeRaw: jest.fn()
    };
};

// Función helper para crear datos de prueba
export const createTestData = <T>(data: Partial<T>): T => {
    return {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
    } as T;
};
