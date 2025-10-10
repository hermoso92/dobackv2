import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

async function main() {
    const prisma = new PrismaClient();

    try {
        // Verificar conexión
        await prisma.$connect();
        logger.info('✅ Conexión a la base de datos establecida correctamente');

        // Ejecutar migraciones
        logger.info('🔄 Ejecutando migraciones...');
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        logger.info('✅ Tabla de migraciones creada/verificada');

        // Crear tablas si no existen
        logger.info('🔄 Creando tablas...');
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plate TEXT NOT NULL UNIQUE,
                model TEXT NOT NULL,
                brand TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS organizations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        logger.info('✅ Tablas creadas/verificadas');

        // Crear índices
        logger.info('🔄 Creando índices...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
            CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
        `;
        logger.info('✅ Índices creados correctamente');

        logger.info('✅ Base de datos inicializada correctamente');
    } catch (error) {
        logger.error('❌ Error al inicializar la base de datos:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
