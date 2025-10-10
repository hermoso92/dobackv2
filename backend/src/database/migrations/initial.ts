import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export async function createInitialMigrations(prisma: PrismaClient) {
    try {
        // Crear organización por defecto
        const defaultOrg = await prisma.organization.create({
            data: {
                name: 'Default Organization',
                description: 'Default organization for testing'
            }
        });

        // Crear usuario administrador
        await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin User',
                password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9Uu', // 'admin123'
                role: 'ADMIN',
                organizationId: defaultOrg.id
            }
        });

        // Crear vehículo de prueba
        await prisma.vehicle.create({
            data: {
                name: 'Test Vehicle',
                model: 'Test Model',
                plateNumber: 'TEST-001',
                status: 'ACTIVE',
                organizationId: defaultOrg.id
            }
        });

        logger.info('Initial migrations completed successfully');
    } catch (error) {
        logger.error('Error running initial migrations', { error });
        throw error;
    }
}
