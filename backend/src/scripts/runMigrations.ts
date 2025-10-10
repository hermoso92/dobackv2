import { prisma } from '../config/database';
import { MigrationManager } from '../database/migrations';
import { createInitialMigrations } from '../database/migrations/initial';
import { logger } from '../utils/logger';

async function main() {
    try {
        const migrationManager = new MigrationManager(prisma);

        // Registrar migraciones
        migrationManager.registerMigration('initial', () => createInitialMigrations(prisma));

        // Ejecutar migraciones
        await migrationManager.runMigrations();

        logger.info('Migrations completed successfully');
    } catch (error) {
        logger.error('Error running migrations', { error });
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
