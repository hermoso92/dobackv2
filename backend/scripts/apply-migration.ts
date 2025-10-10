import { PrismaClient } from '@prisma/client';
import { createLogger } from '../src/utils/logger';

const logger = createLogger('Migration');
const prisma = new PrismaClient();

async function applyMigration() {
    try {
        logger.info('Iniciando migración...');

        // Verificar conexión a la base de datos
        await prisma.$connect();
        logger.info('Conexión a la base de datos establecida');

        // Verificar tablas existentes
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        logger.info('Tablas existentes:', tables);

        // Aplicar migración usando Prisma Client
        await prisma.$transaction(async (tx) => {
            // Actualizar Session
            await tx.session.updateMany({
                data: {
                    status: 'ACTIVE'
                }
            });
            logger.info('Tabla Session actualizada');

            // Actualizar StabilityMeasurement
            await tx.stabilityMeasurement.updateMany({
                data: {
                    isDRSHigh: false,
                    isLTRCritical: false,
                    isLateralGForceHigh: false
                }
            });
            logger.info('Tabla StabilityMeasurement actualizada');

            // Actualizar GpsMeasurement
            await tx.gpsMeasurement.updateMany({
                data: {
                    quality: 0
                }
            });
            logger.info('Tabla GpsMeasurement actualizada');

            // Actualizar CanMeasurement
            await tx.canMeasurement.updateMany({
                data: {
                    temperature: 0
                }
            });
            logger.info('Tabla CanMeasurement actualizada');
        });

        logger.info('Migración completada exitosamente');

        // Verificar cambios
        const sessionCount = await prisma.session.count();
        const stabilityCount = await prisma.stabilityMeasurement.count();
        const gpsCount = await prisma.gpsMeasurement.count();
        const canCount = await prisma.canMeasurement.count();

        logger.info('Conteo de registros:', {
            session: sessionCount,
            stability: stabilityCount,
            gps: gpsCount,
            can: canCount
        });
    } catch (error) {
        logger.error('Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar migración
applyMigration()
    .then(() => {
        logger.info('Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Error en el proceso:', error);
        process.exit(1);
    });
