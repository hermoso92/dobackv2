import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function applyPerformanceIndexes() {
    try {
        logger.info('Iniciando aplicación de índices de rendimiento...');

        // Leer el archivo SQL de índices
        const indexPath = path.join(__dirname, '../prisma/migrations/add_performance_indexes.sql');
        const sqlContent = fs.readFileSync(indexPath, 'utf8');

        // Dividir el SQL en comandos individuales
        const commands = sqlContent
            .split(';')
            .map((cmd) => cmd.trim())
            .filter((cmd) => cmd.length > 0 && !cmd.startsWith('--'));

        logger.info(`Ejecutando ${commands.length} comandos de índices...`);

        // Ejecutar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            try {
                logger.info(
                    `Ejecutando comando ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`
                );
                await prisma.$executeRawUnsafe(command);
                logger.info(`Comando ${i + 1} ejecutado exitosamente`);
            } catch (error) {
                // Si el índice ya existe, continuar
                if (error instanceof Error && error.message.includes('already exists')) {
                    logger.warn(`Índice ya existe, continuando: ${command.substring(0, 50)}...`);
                } else {
                    logger.error(`Error ejecutando comando ${i + 1}:`, error);
                    throw error;
                }
            }
        }

        logger.info('Todos los índices de rendimiento aplicados exitosamente');

        // Verificar que los índices se crearon correctamente
        const indexes = await prisma.$queryRawUnsafe(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE indexname LIKE 'idx_%'
            ORDER BY tablename, indexname;
        `);

        logger.info('Índices creados:', indexes);
    } catch (error) {
        logger.error('Error aplicando índices de rendimiento:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    applyPerformanceIndexes()
        .then(() => {
            logger.info('Script de índices completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error en script de índices:', error);
            process.exit(1);
        });
}

export { applyPerformanceIndexes };
