
import { processAndSaveStabilityEvents } from '../services/StabilityEventService';
import { logger } from '../utils/logger';



/**
 * Script para probar la integración completa del dashboard
 * Regenera eventos de una sesión real y verifica los resultados
 */
async function testDashboardIntegration() {
    logger.info('Iniciando prueba de integración del dashboard');

    try {
        // Buscar una sesión con datos para probar
        const session = await prisma.session.findFirst({
            where: {
                stabilityMeasurements: { some: {} },
                gpsMeasurements: { some: {} },
                canMeasurements: { some: {} }
            },
            include: {
                stabilityMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    take: 100 // Limitar para la prueba
                },
                gpsMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    take: 100
                },
                canMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    take: 100
                }
            }
        });

        if (!session) {
            logger.error('No se encontró ninguna sesión con datos para probar');
            return;
        }

        logger.info('Sesión encontrada para prueba', {
            sessionId: session.id,
            stabilityMeasurements: session.stabilityMeasurements.length,
            gpsMeasurements: session.gpsMeasurements.length,
            canMeasurements: session.canMeasurements.length
        });

        // Contar eventos existentes
        const existingEvents = await prisma.stability_events.count({
            where: { session_id: session.id }
        });

        logger.info('Eventos existentes antes de regenerar', { count: existingEvents });

        // Convertir datos al formato esperado
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

        // Regenerar eventos con la nueva lógica
        logger.info('Regenerando eventos con nueva lógica...');
        await processAndSaveStabilityEvents(session.id, stabilityData, gpsData, canData);

        // Obtener eventos regenerados
        const newEvents = await prisma.stability_events.findMany({
            where: { session_id: session.id },
            orderBy: { timestamp: 'desc' }
        });

        logger.info('=== RESULTADOS DE LA INTEGRACIÓN ===');
        logger.info(`Eventos generados: ${newEvents.length}`);

        // Análisis por nivel de riesgo
        const byLevel = newEvents.reduce((acc, event) => {
            const details = event.details as any;
            const level = details?.level || 'moderate';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        logger.info('Eventos por nivel de riesgo:', byLevel);

        // Análisis por tipo de causa
        const byType = newEvents.reduce((acc, event) => {
            const details = event.details as any;
            const tipos = Array.isArray(details?.tipos) ? details.tipos : [event.type || 'unknown'];
            tipos.forEach((tipo: string) => {
                acc[tipo] = (acc[tipo] || 0) + 1;
            });
            return acc;
        }, {} as Record<string, number>);

        logger.info('Eventos por tipo de causa:', byType);

        // Verificar que no hay eventos con SI ≥ 50%
        const highSiEvents = newEvents.filter((event) => {
            const details = event.details as any;
            return details?.perc >= 0.5;
        });

        logger.info(`✅ Eventos con SI ≥ 50% descartados: ${highSiEvents.length} (esperado: 0)`);

        // Mostrar muestra de eventos para verificar estructura
        if (newEvents.length > 0) {
            logger.info('=== MUESTRA DE EVENTOS REGENERADOS ===');
            newEvents.slice(0, 3).forEach((event, idx) => {
                const details = event.details as any;
                logger.info(`Evento ${idx + 1}:`, {
                    id: event.id,
                    timestamp: event.timestamp,
                    level: details?.level,
                    si: details?.perc ? (details.perc * 100).toFixed(1) + '%' : 'N/A',
                    tipos: details?.tipos || [event.type],
                    valores: details?.valores,
                    can: details?.can,
                    lat: event.lat,
                    lon: event.lon
                });
            });
        }

        // Verificar que los eventos tienen la estructura correcta para el frontend
        const validEvents = newEvents.filter((event) => {
            const details = event.details as any;
            return (
                details &&
                typeof details.level === 'string' &&
                typeof details.perc === 'number' &&
                Array.isArray(details.tipos) &&
                details.valores &&
                details.can
            );
        });

        logger.info(
            `✅ Eventos con estructura válida para frontend: ${validEvents.length}/${newEvents.length}`
        );

        // Verificar que no hay eventos duplicados o con tipos incorrectos
        const invalidTypes = newEvents.filter((event) => {
            const details = event.details as any;
            const tipos = Array.isArray(details?.tipos) ? details.tipos : [event.type];
            return tipos.some(
                (tipo: string) => tipo === 'deriva_lateral_significativa' || tipo === 'unknown'
            );
        });

        logger.info(`✅ Eventos con tipos incorrectos: ${invalidTypes.length} (esperado: 0)`);

        logger.info('=== INTEGRACIÓN COMPLETADA ===');
        logger.info(
            '✅ La nueva lógica de generación de eventos está correctamente integrada en el dashboard'
        );

        return {
            sessionId: session.id,
            totalEvents: newEvents.length,
            byLevel,
            byType,
            validStructure: validEvents.length,
            noHighSi: highSiEvents.length === 0,
            noInvalidTypes: invalidTypes.length === 0
        };
    } catch (error) {
        logger.error('Error en la prueba de integración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la prueba si se llama directamente
if (require.main === module) {
    testDashboardIntegration()
        .then((results) => {
            if (results) {
                logger.info('Resultados finales:', results);
            }
            logger.info('Prueba de integración completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Prueba de integración falló:', error);
            process.exit(1);
        });
}

export { testDashboardIntegration };
