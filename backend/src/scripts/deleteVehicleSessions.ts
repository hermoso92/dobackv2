
import { logger } from '../utils/logger';



async function deleteVehicleSessions(vehicleName: string) {
    try {
        // Primero encontramos el vehículo
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                name: vehicleName
            }
        });

        if (!vehicle) {
            logger.error('Vehículo no encontrado', { vehicleName });
            return;
        }

        // Encontramos todas las sesiones del vehículo
        const sessions = await prisma.session.findMany({
            where: {
                vehicleId: vehicle.id
            }
        });

        logger.info('Sesiones encontradas', { count: sessions.length, vehicleName });

        // Borramos todas las mediciones asociadas a las sesiones
        for (const session of sessions) {
            await prisma.stabilityMeasurement.deleteMany({
                where: {
                    sessionId: session.id
                }
            });

            await prisma.canMeasurement.deleteMany({
                where: {
                    sessionId: session.id
                }
            });

            await prisma.gpsMeasurement.deleteMany({
                where: {
                    sessionId: session.id
                }
            });

            await prisma.ejecucionEvento.deleteMany({
                where: {
                    sessionId: session.id
                }
            });

            await prisma.archivoSubido.deleteMany({
                where: {
                    sessionId: session.id
                }
            });

            await prisma.informeGenerado.deleteMany({
                where: {
                    sessionId: session.id
                }
            });

            await prisma.sugerenciaIA.deleteMany({
                where: {
                    sessionId: session.id
                }
            });
        }

        // Finalmente borramos las sesiones
        const deletedSessions = await prisma.session.deleteMany({
            where: {
                vehicleId: vehicle.id
            }
        });

        logger.info('Sesiones eliminadas', { count: deletedSessions.count, vehicleName });
    } catch (error) {
        logger.error('Error al eliminar sesiones', { error, vehicleName });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
deleteVehicleSessions('DOBACK002').catch((error) => {
    logger.error('Error en el script', { error });
    process.exit(1);
});
