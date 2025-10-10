import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function checkCanData() {
    try {
        logger.info('Verificando datos CAN en la base de datos...');

        // Verificar sesiones con datos CAN
        const sessionsWithCan = await prisma.session.findMany({
            include: {
                canMeasurements: {
                    take: 5
                }
            }
        });

        logger.info('Sesiones encontradas:', {
            totalSessions: sessionsWithCan.length,
            sessionsWithCanData: sessionsWithCan.filter((s) => s.canMeasurements.length > 0).length
        });

        // Verificar eventos con datos CAN
        const eventsWithCan = await prisma.stability_events.findMany({
            take: 5
        });

        logger.info('Eventos encontrados:', {
            totalEvents: await prisma.stability_events.count(),
            sampleEvents: eventsWithCan.map((event) => {
                const details = event.details as any;
                return {
                    id: event.id,
                    sessionId: event.session_id,
                    hasDetails: !!details,
                    hasCanData: !!details?.can,
                    canData: details?.can
                };
            })
        });

        // Mostrar una sesión con datos CAN si existe
        const sessionWithCan = sessionsWithCan.find((s) => s.canMeasurements.length > 0);
        if (sessionWithCan) {
            logger.info('Ejemplo de sesión con datos CAN:', {
                sessionId: sessionWithCan.id,
                canMeasurementsCount: sessionWithCan.canMeasurements.length,
                sampleCanData: sessionWithCan.canMeasurements.slice(0, 3).map((m) => ({
                    timestamp: m.timestamp,
                    engineRpm: m.engineRpm,
                    vehicleSpeed: m.vehicleSpeed
                }))
            });

            // Verificar si esta sesión tiene eventos
            const eventsForSession = await prisma.stability_events.findMany({
                where: { session_id: sessionWithCan.id },
                take: 5
            });

            logger.info('Eventos para la sesión con datos CAN:', {
                sessionId: sessionWithCan.id,
                totalEvents: await prisma.stability_events.count({
                    where: { session_id: sessionWithCan.id }
                }),
                sampleEvents: eventsForSession.map((event) => {
                    const details = event.details as any;
                    return {
                        id: event.id,
                        hasDetails: !!details,
                        hasCanData: !!details?.can,
                        canData: details?.can
                    };
                })
            });
        } else {
            logger.warn('No se encontraron sesiones con datos CAN');
        }
    } catch (error) {
        logger.error('Error verificando datos CAN', { error });
        throw error;
    }
}

// Función principal
async function main() {
    try {
        await checkCanData();
        console.log('Verificación completada');
    } catch (error) {
        console.error('Error en verificación:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main();
}

export { checkCanData };
