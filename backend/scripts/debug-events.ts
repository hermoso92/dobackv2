import { PrismaClient } from '@prisma/client';
import { processAndSaveStabilityEvents } from '../src/services/StabilityEventService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function debugStabilityEvents(sessionId: string) {
    try {
        logger.info('Iniciando debug de eventos de estabilidad', { sessionId });

        // 1. Verificar que la sesión existe
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
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
            logger.error('Sesión no encontrada', { sessionId });
            return;
        }

        logger.info('Datos de sesión encontrados', {
            sessionId,
            stabilityMeasurements: session.stabilityMeasurements.length,
            gpsMeasurements: session.gpsMeasurements.length,
            canMeasurements: session.canMeasurements.length
        });

        // 2. Analizar datos de estabilidad
        const stabilityStats = {
            total: session.stabilityMeasurements.length,
            withSi: session.stabilityMeasurements.filter((m) => m.si !== null && m.si !== undefined)
                .length,
            withRoll: session.stabilityMeasurements.filter(
                (m) => m.roll !== null && m.roll !== undefined
            ).length,
            withAy: session.stabilityMeasurements.filter((m) => m.ay !== null && m.ay !== undefined)
                .length,
            withGz: session.stabilityMeasurements.filter((m) => m.gz !== null && m.gz !== undefined)
                .length,
            siRanges: {
                critical: session.stabilityMeasurements.filter((m) => m.si && m.si < 0.2).length,
                danger: session.stabilityMeasurements.filter(
                    (m) => m.si && m.si >= 0.2 && m.si < 0.4
                ).length,
                moderate: session.stabilityMeasurements.filter(
                    (m) => m.si && m.si >= 0.4 && m.si < 0.7
                ).length,
                safe: session.stabilityMeasurements.filter((m) => m.si && m.si >= 0.7).length
            },
            rollEvents: session.stabilityMeasurements.filter(
                (m) => m.roll && (m.roll > 30 || m.roll < -30)
            ).length,
            yawEvents: session.stabilityMeasurements.filter(
                (m) => m.gz && (m.gz > 25 || m.gz < -25)
            ).length,
            accelEvents: session.stabilityMeasurements.filter(
                (m) => m.ay && (m.ay > 2.5 || m.ay < -2.5)
            ).length
        };

        logger.info('Estadísticas de datos de estabilidad', stabilityStats);

        // 3. Verificar eventos existentes
        const existingEvents = await prisma.stability_events.findMany({
            where: { session_id: sessionId }
        });

        logger.info('Eventos existentes en BBDD', {
            count: existingEvents.length,
            events: existingEvents.map((e) => ({
                id: e.id,
                timestamp: e.timestamp,
                type: e.type,
                level: (e.details as any)?.level
            }))
        });

        // 4. Procesar eventos nuevamente
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

        // 5. Eliminar eventos existentes y reprocesar
        if (existingEvents.length > 0) {
            await prisma.stability_events.deleteMany({
                where: { session_id: sessionId }
            });
            logger.info('Eventos existentes eliminados');
        }

        // 6. Procesar eventos con nuevos umbrales
        await processAndSaveStabilityEvents(sessionId, stabilityData, gpsData, canData);

        // 7. Verificar eventos generados
        const newEvents = await prisma.stability_events.findMany({
            where: { session_id: sessionId },
            orderBy: { timestamp: 'desc' }
        });

        logger.info('Eventos generados con nuevos umbrales', {
            count: newEvents.length,
            events: newEvents.map((e) => ({
                id: e.id,
                timestamp: e.timestamp,
                type: e.type,
                level: (e.details as any)?.level,
                perc: (e.details as any)?.perc
            }))
        });
    } catch (error) {
        logger.error('Error en debug de eventos', { error });
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se proporciona un sessionId como argumento
const sessionId = process.argv[2];
if (sessionId) {
    debugStabilityEvents(sessionId);
} else {
    logger.error('Debe proporcionar un sessionId como argumento');
    process.exit(1);
}
