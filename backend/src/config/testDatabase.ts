import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let testPrisma: PrismaClient;

export class TestDatabaseManager {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/dobacksoft_test'
                }
            }
        });
    }

    async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            logger.info('Conexión a base de datos de pruebas establecida');
        } catch (error) {
            logger.error('Error conectando a base de datos de pruebas:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.prisma.$disconnect();
            logger.info('Conexión a base de datos de pruebas cerrada');
        } catch (error) {
            logger.error('Error cerrando conexión a base de datos de pruebas:', error);
            throw error;
        }
    }

    async reset(): Promise<void> {
        try {
            // Obtener nombres de tablas
            const tablenames = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
                SELECT tablename FROM pg_tables WHERE schemaname='public'
            `;

            // Filtrar tablas de Prisma y crear comando TRUNCATE
            const tables = tablenames
                .map(({ tablename }) => tablename)
                .filter((name) => name !== '_prisma_migrations')
                .map((name) => `"public"."${name}"`)
                .join(', ');

            if (tables) {
                await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
                logger.info('Base de datos de pruebas limpiada');
            }
        } catch (error) {
            logger.error('Error limpiando base de datos de pruebas:', error);
            throw error;
        }
    }

    async seed(): Promise<void> {
        try {
            // Crear datos de prueba básicos
            const testOrganization = await this.prisma.organization.create({
                data: {
                    name: 'Organización de Pruebas',
                    apiKey: 'test-api-key-' + Date.now()
                }
            });

            logger.info('Datos de prueba creados', { organizationId: testOrganization.id });
        } catch (error) {
            logger.error('Error creando datos de prueba:', error);
            throw error;
        }
    }

    getPrisma(): PrismaClient {
        return this.prisma;
    }
}

export const testDbManager = new TestDatabaseManager();

export async function setupTestDatabase(): Promise<void> {
    try {
        await testDbManager.connect();
        await testDbManager.reset();
        await testDbManager.seed();
        logger.info('Base de datos de pruebas configurada correctamente');
    } catch (error) {
        logger.error('Error configurando base de datos de pruebas:', error);
        throw error;
    }
}

export async function teardownTestDatabase(): Promise<void> {
    try {
        await testDbManager.reset();
        await testDbManager.disconnect();
        logger.info('Base de datos de pruebas cerrada correctamente');
    } catch (error) {
        logger.error('Error cerrando base de datos de pruebas:', error);
        throw error;
    }
}

// Exportar instancia de Prisma para usar en tests
export { testDbManager as prisma };
