import { PrismaClient } from '@prisma/client';
import { processAndSaveStabilityEvents } from '../src/services/StabilityEventService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function populateStabilityEvents() {
    try {
        logger.info('Iniciando población de eventos de estabilidad...');

        // Obtener todas las sesiones que tienen datos de estabilidad
        const sessions = await prisma.session.findMany({
            where: {
                stabilityMeasurements: {
                    some: {}
                }
            },
            include: {
                stabilityMeasurements: {
                    orderBy: { timestamp: 'asc' }
                },
                gpsMeasurements: {
                    orderBy: { timestamp: 'asc' }
                },
                canMeasurements: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        logger.info(`Encontradas ${sessions.length} sesiones con datos de estabilidad`);

        for (const session of sessions) {
            try {
                logger.info(`Procesando sesión ${session.id}...`);

                // Convertir datos de estabilidad al formato esperado
                const stabilityData = session.stabilityMeasurements.map((measurement) => ({
                    timestamp: measurement.timestamp.toISOString(),
                    si: measurement.si,
                    roll: measurement.roll || 0,
                    pitch: measurement.pitch || 0,
                    ay: measurement.ay,
                    gz: measurement.gz,
                    time: measurement.timestamp.getTime(),
                    accmag: measurement.accmag
                }));

                // Convertir datos GPS al formato esperado
                const gpsData = session.gpsMeasurements.map((measurement) => ({
                    timestamp: measurement.timestamp.toISOString(),
                    latitude: measurement.latitude,
                    longitude: measurement.longitude,
                    speed: measurement.speed
                }));

                // Convertir datos CAN al formato esperado
                const canData = session.canMeasurements.map((measurement) => ({
                    timestamp: measurement.timestamp.toISOString(),
                    engineRPM: measurement.engineRpm,
                    vehicleSpeed: measurement.vehicleSpeed || 0,
                    rotativo: measurement.engineRpm > 0
                }));

                // Procesar y guardar eventos
                await processAndSaveStabilityEvents(session.id, stabilityData, gpsData, canData);

                logger.info(`Sesión ${session.id} procesada correctamente`);
            } catch (error) {
                logger.error(`Error procesando sesión ${session.id}`, { error });
            }
        }

        logger.info('Población de eventos de estabilidad completada');
    } catch (error) {
        logger.error('Error en población de eventos de estabilidad', { error });
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    populateStabilityEvents()
        .then(() => {
            console.log('Script completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error en script:', error);
            process.exit(1);
        });
}

export { populateStabilityEvents };
