
import { logger } from '../utils/logger';
import { seedInitialData } from './seeds/initial';

async function main() {
    

    try {
        // Limpiar la base de datos
        await prisma.$transaction([
            prisma.vehicle.deleteMany(),
            prisma.user.deleteMany(),
            prisma.organization.deleteMany()
        ]);

        logger.info('Base de datos limpiada');

        // Ejecutar seed
        await seedInitialData(prisma);

        logger.info('Seed completado exitosamente');
    } catch (error) {
        logger.error('Error ejecutando seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
