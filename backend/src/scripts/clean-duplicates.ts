import { prisma } from '../lib/prisma';





// Función simple de logger para consola
const logger = {
    info: (message: string, meta?: any) => {
        console.log(`INFO: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, meta?: any) => {
        console.error(`ERROR: ${message}`, meta ? JSON.stringify(meta) : '');
    }
};

async function cleanDuplicates() {
    logger.info('Iniciando limpieza de datos duplicados');

    try {
        // 1. Obtener sesiones de estabilidad
        const sessions = await prisma.stabilitySession.findMany();

        if (sessions.length === 0) {
            logger.info('No se encontraron sesiones de estabilidad');
            return;
        }

        // 2. Para cada sesión, encontrar y eliminar duplicados
        for (const session of sessions) {
            logger.info(
                `Procesando sesión ID: ${session.id} del vehículo ID: ${session.vehicleId}`
            );

            // Obtener todas las mediciones para esta sesión
            const measurements = await prisma.measurement.findMany({
                where: {
                    sessionId: session.id.toString(),
                    vehicleId: session.vehicleId
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });

            logger.info(`Encontradas ${measurements.length} mediciones para la sesión`);

            // Verificar si hay duplicados
            const timestamps = new Set<string>();
            const duplicates: number[] = [];

            // Primera pasada: encontrar duplicados
            for (const measurement of measurements) {
                const timeKey = measurement.timestamp.toISOString();

                if (timestamps.has(timeKey)) {
                    // Es un duplicado, agregarlo a la lista a eliminar
                    // Eliminar los IDs más altos (los que probablemente fueron generados después)
                    if (measurement.id > 1000) {
                        duplicates.push(measurement.id);
                    }
                } else {
                    timestamps.add(timeKey);
                }
            }

            logger.info(`Encontrados ${duplicates.length} duplicados para eliminar`);

            // Eliminar duplicados
            if (duplicates.length > 0) {
                await prisma.measurement.deleteMany({
                    where: {
                        id: {
                            in: duplicates
                        }
                    }
                });
                logger.info(`Eliminados ${duplicates.length} duplicados`);
            }
        }

        logger.info('Proceso de limpieza completado con éxito');
    } catch (error) {
        logger.error('Error durante la limpieza de datos:', error);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
    cleanDuplicates()
        .then(() => {
            logger.info('Script finalizado');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error en script principal:', error);
            console.error(error);
            process.exit(1);
        });
}

export { cleanDuplicates };
