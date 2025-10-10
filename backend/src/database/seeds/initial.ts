import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { VehicleStatus, VehicleType } from '../../types/enums';
import { logger } from '../../utils/logger';

export async function seedInitialData(prisma: PrismaClient) {
    try {
        // Crear organización por defecto
        const defaultOrg = await prisma.organization.create({
            data: {
                name: 'Cosigein',
                apiKey: randomUUID()
            }
        });

        logger.info('Organización creada:', defaultOrg);

        // Crear usuario administrador
        const adminUser = await prisma.user.create({
            data: {
                email: 'admin@cosigein.com',
                name: 'Administrador',
                password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9Uu', // 'admin123'
                role: 'ADMIN',
                organizationId: defaultOrg.id
            }
        });

        logger.info('Usuario administrador creado:', adminUser);

        // Crear vehículos de prueba
        const vehicles = [
            {
                name: 'DOBACK001',
                model: 'Doback',
                licensePlate: 'DOBACK001',
                identifier: 'DOBACK001',
                type: VehicleType.TRUCK,
                status: VehicleStatus.ACTIVE,
                organizationId: defaultOrg.id
            },
            {
                name: 'DOBACK002',
                model: 'Doback',
                licensePlate: 'DOBACK002',
                identifier: 'DOBACK002',
                type: VehicleType.TRUCK,
                status: VehicleStatus.ACTIVE,
                organizationId: defaultOrg.id
            },
            {
                name: 'DOBACK003',
                model: 'Doback',
                licensePlate: 'DOBACK003',
                identifier: 'DOBACK003',
                type: VehicleType.TRUCK,
                status: VehicleStatus.ACTIVE,
                organizationId: defaultOrg.id
            }
        ];

        for (const vehicle of vehicles) {
            const createdVehicle = await prisma.vehicle.create({
                data: vehicle
            });
            logger.info('Vehículo creado:', createdVehicle);
        }

        logger.info('Datos iniciales restaurados correctamente');
    } catch (error) {
        logger.error('Error restaurando datos iniciales:', error);
        throw error;
    }
}
