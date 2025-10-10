import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export class MigrationManager {
    private prisma: PrismaClient;
    private migrations: Map<string, () => Promise<void>>;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        this.migrations = new Map();
    }

    public registerMigration(name: string, migration: () => Promise<void>) {
        this.migrations.set(name, migration);
    }

    public async runMigrations() {
        try {
            // Crear tabla de migraciones si no existe
            await this.prisma.$executeRaw`
                CREATE TABLE IF NOT EXISTS migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Obtener migraciones ejecutadas
            const executedMigrations = await this.prisma.$queryRaw<{ name: string }[]>`
                SELECT name FROM migrations
            `;

            const executedNames = new Set(executedMigrations.map((m) => m.name));

            // Ejecutar migraciones pendientes
            for (const [name, migration] of this.migrations) {
                if (!executedNames.has(name)) {
                    logger.info(`Running migration: ${name}`);
                    await migration();
                    await this.prisma.$executeRaw`
                        INSERT INTO migrations (name) VALUES (${name})
                    `;
                    logger.info(`Migration completed: ${name}`);
                }
            }

            logger.info('All migrations completed successfully');
        } catch (error) {
            logger.error('Error running migrations', { error });
            throw error;
        }
    }
}
