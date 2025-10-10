import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function cleanup() {
    try {
        logger.info('Iniciando limpieza de la base de datos...');

        // Eliminar datos en orden para respetar las restricciones de clave foránea
        await prisma.stabilityMeasurement.deleteMany({});
        await prisma.canMeasurement.deleteMany({});
        await prisma.gpsMeasurement.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.vehicle.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.organization.deleteMany({});

        logger.info('Limpieza completada exitosamente');
    } catch (error) {
        logger.error('Error durante la limpieza:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function cleanupTestUserAndVehicle() {
    // Eliminar mediciones asociadas a la sesión
    const vehicle = await prisma.vehicle.findUnique({ where: { licensePlate: 'doback003' } });
    const user = await prisma.user.findUnique({ where: { email: 'user005@example.com' } });

    if (vehicle) {
        await prisma.canMeasurement.deleteMany({ where: { session: { vehicleId: vehicle.id } } });
        await prisma.gpsMeasurement.deleteMany({ where: { session: { vehicleId: vehicle.id } } });
        await prisma.stabilityMeasurement.deleteMany({
            where: { session: { vehicleId: vehicle.id } }
        });
        await prisma.session.deleteMany({ where: { vehicleId: vehicle.id } });
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
    }
    if (user) {
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    }
    console.log('Usuario y vehículo de prueba eliminados.');
    await prisma.$disconnect();
}

// Ejecutar si se llama directamente
if (require.main === module) {
    cleanup().catch((error) => {
        logger.error('Error en el script de limpieza:', error);
        process.exit(1);
    });
}

cleanupTestUserAndVehicle();

export { cleanup };
