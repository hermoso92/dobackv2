import { PrismaClient } from '@prisma/client';
import {
    getStabilityEvents,
    processAndSaveStabilityEvents
} from '../src/services/StabilityEventService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function testCompleteFlow() {
    try {
        logger.info('Iniciando prueba del flujo completo de eventos de estabilidad...');

        // 1. Obtener una sesión de prueba
        const session = await prisma.session.findFirst({
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

        if (!session) {
            logger.error('No se encontró ninguna sesión con datos de estabilidad');
            return;
        }

        logger.info(`Usando sesión de prueba: ${session.id}`);

        // 2. Limpiar eventos existentes para esta sesión
        await prisma.stability_events.deleteMany({
            where: { session_id: session.id }
        });
        logger.info('Eventos existentes eliminados');

        // 3. Procesar eventos
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

        const gpsData = session.gpsMeasurements.map((measurement) => ({
            timestamp: measurement.timestamp.toISOString(),
            latitude: measurement.latitude,
            longitude: measurement.longitude,
            speed: measurement.speed
        }));

        const canData = session.canMeasurements.map((measurement) => ({
            timestamp: measurement.timestamp.toISOString(),
            engineRPM: measurement.engineRpm,
            vehicleSpeed: measurement.vehicleSpeed || 0,
            rotativo: measurement.engineRpm > 0
        }));

        await processAndSaveStabilityEvents(session.id, stabilityData, gpsData, canData);
        logger.info('Eventos procesados y guardados');

        // 4. Consultar eventos sin filtros
        const allEvents = await getStabilityEvents(session.id);
        logger.info(`Total de eventos sin filtros: ${allEvents.length}`);

        // 5. Consultar eventos con filtros
        const filteredEvents = await getStabilityEvents(session.id, {
            speedFilter: '60',
            rpmFilter: '1500',
            selectedTypes: ['critico', 'peligroso']
        });
        logger.info(
            `Eventos con filtros (velocidad>60, RPM>1500, tipos crítico/peligroso): ${filteredEvents.length}`
        );

        // 6. Mostrar estadísticas de tipos de eventos
        const eventTypes = new Map<string, number>();
        allEvents.forEach((event) => {
            event.tipos.forEach((tipo) => {
                eventTypes.set(tipo, (eventTypes.get(tipo) || 0) + 1);
            });
        });

        logger.info('Estadísticas de tipos de eventos:');
        eventTypes.forEach((count, tipo) => {
            logger.info(`  ${tipo}: ${count} eventos`);
        });

        // 7. Mostrar estadísticas de niveles
        const levels = new Map<string, number>();
        allEvents.forEach((event) => {
            levels.set(event.level, (levels.get(event.level) || 0) + 1);
        });

        logger.info('Estadísticas de niveles:');
        levels.forEach((count, level) => {
            logger.info(`  ${level}: ${count} eventos`);
        });

        // 8. Verificar que los eventos tienen todos los campos necesarios
        const sampleEvent = allEvents[0];
        if (sampleEvent) {
            logger.info('Ejemplo de evento:', {
                id: sampleEvent.id,
                timestamp: sampleEvent.timestamp,
                lat: sampleEvent.lat,
                lon: sampleEvent.lon,
                level: sampleEvent.level,
                perc: sampleEvent.perc,
                tipos: sampleEvent.tipos,
                valores: sampleEvent.valores,
                can: sampleEvent.can
            });
        }

        logger.info('Prueba del flujo completo completada exitosamente');
    } catch (error) {
        logger.error('Error en prueba del flujo completo', { error });
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testCompleteFlow()
        .then(() => {
            console.log('Script de prueba completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error en script de prueba:', error);
            process.exit(1);
        });
}

export { testCompleteFlow };
