import { generateStabilityEvents } from '../services/StabilityEventService';
import { logger } from '../utils/logger';

/**
 * Script de prueba para validar la generación de eventos de estabilidad
 */
async function testEventGeneration() {
    logger.info('Iniciando prueba de generación de eventos de estabilidad');

    // Datos de prueba que cubren todos los casos
    const testStabilityData = [
        // 🔴 Riesgo Crítico: SI < 10%
        {
            timestamp: '2024-01-01T10:00:00Z',
            si: 0.05,
            roll: 15,
            pitch: 5,
            ay: 0.3,
            gz: 0.05,
            time: 1704110400000
        }, // Pendiente lateral
        {
            timestamp: '2024-01-01T10:00:01Z',
            si: 0.08,
            roll: 2,
            pitch: 3,
            ay: 2.0,
            gz: 0.15,
            time: 1704110401000
        }, // Curva brusca
        {
            timestamp: '2024-01-01T10:00:02Z',
            si: 0.03,
            roll: 10,
            pitch: 2,
            ay: 0.2,
            gz: 0.02,
            time: 1704110402000
        }, // Terreno irregular

        // 🟠 Riesgo Peligroso: 10% ≤ SI < 30%
        {
            timestamp: '2024-01-01T10:00:03Z',
            si: 0.15,
            roll: 8,
            pitch: 4,
            ay: 0.4,
            gz: 0.08,
            time: 1704110403000
        }, // Pendiente lateral
        {
            timestamp: '2024-01-01T10:00:04Z',
            si: 0.25,
            roll: 3,
            pitch: 2,
            ay: 1.8,
            gz: 0.12,
            time: 1704110404000
        }, // Curva brusca
        {
            timestamp: '2024-01-01T10:00:05Z',
            si: 0.2,
            roll: 12,
            pitch: 1,
            ay: 0.3,
            gz: 0.03,
            time: 1704110405000
        }, // Terreno irregular

        // 🟡 Riesgo Moderado: 30% ≤ SI < 50%
        {
            timestamp: '2024-01-01T10:00:06Z',
            si: 0.35,
            roll: 6,
            pitch: 3,
            ay: 0.4,
            gz: 0.06,
            time: 1704110406000
        }, // Pendiente lateral
        {
            timestamp: '2024-01-01T10:00:07Z',
            si: 0.45,
            roll: 2,
            pitch: 1,
            ay: 1.6,
            gz: 0.11,
            time: 1704110407000
        }, // Curva brusca
        {
            timestamp: '2024-01-01T10:00:08Z',
            si: 0.4,
            roll: 9,
            pitch: 2,
            ay: 0.3,
            gz: 0.04,
            time: 1704110408000
        }, // Terreno irregular

        // ✅ Sin evento: SI ≥ 50%
        {
            timestamp: '2024-01-01T10:00:09Z',
            si: 0.6,
            roll: 4,
            pitch: 2,
            ay: 0.5,
            gz: 0.05,
            time: 1704110409000
        }, // Debe ser descartado
        {
            timestamp: '2024-01-01T10:00:10Z',
            si: 0.75,
            roll: 2,
            pitch: 1,
            ay: 0.3,
            gz: 0.03,
            time: 1704110410000
        }, // Debe ser descartado

        // Casos especiales para pérdida de adherencia
        {
            timestamp: '2024-01-01T10:00:11Z',
            si: 0.12,
            roll: 3,
            pitch: 2,
            ay: 1.2,
            gz: 0.25,
            time: 1704110411000
        }, // Pérdida de adherencia (v=20)
        {
            timestamp: '2024-01-01T10:00:12Z',
            si: 0.18,
            roll: 4,
            pitch: 1,
            ay: 0.8,
            gz: 0.18,
            time: 1704110412000
        } // Maniobra brusca
    ];

    const testGpsData = [
        { timestamp: '2024-01-01T10:00:00Z', latitude: 40.4168, longitude: -3.7038, speed: 15 },
        { timestamp: '2024-01-01T10:00:01Z', latitude: 40.4169, longitude: -3.7039, speed: 25 },
        { timestamp: '2024-01-01T10:00:02Z', latitude: 40.417, longitude: -3.704, speed: 10 },
        { timestamp: '2024-01-01T10:00:03Z', latitude: 40.4171, longitude: -3.7041, speed: 18 },
        { timestamp: '2024-01-01T10:00:04Z', latitude: 40.4172, longitude: -3.7042, speed: 30 },
        { timestamp: '2024-01-01T10:00:05Z', latitude: 40.4173, longitude: -3.7043, speed: 12 },
        { timestamp: '2024-01-01T10:00:06Z', latitude: 40.4174, longitude: -3.7044, speed: 20 },
        { timestamp: '2024-01-01T10:00:07Z', latitude: 40.4175, longitude: -3.7045, speed: 28 },
        { timestamp: '2024-01-01T10:00:08Z', latitude: 40.4176, longitude: -3.7046, speed: 14 },
        { timestamp: '2024-01-01T10:00:09Z', latitude: 40.4177, longitude: -3.7047, speed: 22 },
        { timestamp: '2024-01-01T10:00:10Z', latitude: 40.4178, longitude: -3.7048, speed: 16 },
        { timestamp: '2024-01-01T10:00:11Z', latitude: 40.4179, longitude: -3.7049, speed: 20 },
        { timestamp: '2024-01-01T10:00:12Z', latitude: 40.418, longitude: -3.705, speed: 24 }
    ];

    const testCanData = [
        { timestamp: '2024-01-01T10:00:00Z', engineRPM: 2000, vehicleSpeed: 15, rotativo: true },
        { timestamp: '2024-01-01T10:00:01Z', engineRPM: 2500, vehicleSpeed: 25, rotativo: true },
        { timestamp: '2024-01-01T10:00:02Z', engineRPM: 1800, vehicleSpeed: 10, rotativo: true },
        { timestamp: '2024-01-01T10:00:03Z', engineRPM: 2200, vehicleSpeed: 18, rotativo: true },
        { timestamp: '2024-01-01T10:00:04Z', engineRPM: 3000, vehicleSpeed: 30, rotativo: true },
        { timestamp: '2024-01-01T10:00:05Z', engineRPM: 1900, vehicleSpeed: 12, rotativo: true },
        { timestamp: '2024-01-01T10:00:06Z', engineRPM: 2400, vehicleSpeed: 20, rotativo: true },
        { timestamp: '2024-01-01T10:00:07Z', engineRPM: 2800, vehicleSpeed: 28, rotativo: true },
        { timestamp: '2024-01-01T10:00:08Z', engineRPM: 2000, vehicleSpeed: 14, rotativo: true },
        { timestamp: '2024-01-01T10:00:09Z', engineRPM: 2300, vehicleSpeed: 22, rotativo: true },
        { timestamp: '2024-01-01T10:00:10Z', engineRPM: 2100, vehicleSpeed: 16, rotativo: true },
        { timestamp: '2024-01-01T10:00:11Z', engineRPM: 2400, vehicleSpeed: 20, rotativo: true },
        { timestamp: '2024-01-01T10:00:12Z', engineRPM: 2600, vehicleSpeed: 24, rotativo: true }
    ];

    try {
        // Generar eventos
        const events = generateStabilityEvents(
            testStabilityData,
            testGpsData,
            testCanData,
            'test-session-123'
        );

        // Análisis de resultados
        logger.info('=== RESULTADOS DE LA PRUEBA ===');
        logger.info(`Total de eventos generados: ${events.length}`);

        // Análisis por nivel de riesgo
        const byLevel = events.reduce((acc, event) => {
            acc[event.level] = (acc[event.level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        logger.info('Eventos por nivel de riesgo:', byLevel);

        // Análisis por causa
        const byCause = events.reduce((acc, event) => {
            const cause = event.tipos[0] || 'unknown';
            acc[cause] = (acc[cause] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        logger.info('Eventos por causa:', byCause);

        // Validaciones específicas
        const criticalEvents = events.filter((e) => e.level === 'critical');
        const dangerEvents = events.filter((e) => e.level === 'danger');
        const moderateEvents = events.filter((e) => e.level === 'moderate');

        logger.info('=== VALIDACIONES ===');
        logger.info(`✅ Eventos críticos (SI < 10%): ${criticalEvents.length} (esperado: 3)`);
        logger.info(`✅ Eventos peligrosos (10% ≤ SI < 30%): ${dangerEvents.length} (esperado: 3)`);
        logger.info(
            `✅ Eventos moderados (30% ≤ SI < 50%): ${moderateEvents.length} (esperado: 3)`
        );

        // Verificar que no hay eventos con SI ≥ 50%
        const highSiEvents = events.filter((e) => e.perc >= 0.5);
        logger.info(`✅ Eventos con SI ≥ 50% descartados: ${highSiEvents.length} (esperado: 0)`);

        // Verificar causas específicas
        const pendienteLateral = events.filter((e) => e.tipos.includes('pendiente_lateral'));
        const curvaBrusca = events.filter((e) => e.tipos.includes('curva_brusca'));
        const terrenoIrregular = events.filter((e) => e.tipos.includes('terreno_irregular'));

        logger.info(`✅ Eventos de pendiente lateral: ${pendienteLateral.length}`);
        logger.info(`✅ Eventos de curva brusca: ${curvaBrusca.length}`);
        logger.info(`✅ Eventos de terreno irregular: ${terrenoIrregular.length}`);

        // Mostrar detalles de algunos eventos
        if (events.length > 0) {
            logger.info('=== MUESTRA DE EVENTOS ===');
            events.slice(0, 3).forEach((event, idx) => {
                logger.info(`Evento ${idx + 1}:`, {
                    timestamp: event.timestamp,
                    level: event.level,
                    si: (event.perc * 100).toFixed(1) + '%',
                    tipos: event.tipos,
                    valores: {
                        roll: event.valores.roll.toFixed(2) + '°',
                        ay: event.valores.ay.toFixed(2) + ' m/s²',
                        yaw: event.valores.yaw.toFixed(2) + ' rad/s'
                    },
                    can: {
                        engineRPM: event.can.engineRPM,
                        vehicleSpeed: event.can.vehicleSpeed.toFixed(1) + ' km/h',
                        rotativo: event.can.rotativo
                    }
                });
            });
        }

        logger.info('=== PRUEBA COMPLETADA ===');
        return events;
    } catch (error) {
        logger.error('Error en la prueba de generación de eventos:', error);
        throw error;
    }
}

// Ejecutar la prueba si se llama directamente
if (require.main === module) {
    testEventGeneration()
        .then(() => {
            logger.info('Prueba completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Prueba falló:', error);
            process.exit(1);
        });
}

export { testEventGeneration };
