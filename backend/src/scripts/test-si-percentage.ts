import { generateStabilityEvents } from '../services/StabilityEventService';
import { logger } from '../utils/logger';

/**
 * Script rápido para verificar la conversión del SI a porcentaje
 */
async function testSiPercentage() {
    logger.info('Verificando conversión del SI a porcentaje');

    // Datos de prueba con SI conocido (valores bajos = críticos)
    const testStabilityData = [
        {
            timestamp: '2024-01-01T10:00:00Z',
            si: 0.05,
            roll: 15,
            pitch: 5,
            ay: 0.3,
            gz: 0.05,
            time: 1704110400000
        }, // SI=0.05 → 95% crítico
        {
            timestamp: '2024-01-01T10:00:01Z',
            si: 0.15,
            roll: 8,
            pitch: 4,
            ay: 0.4,
            gz: 0.08,
            time: 1704110401000
        }, // SI=0.15 → 85% peligroso
        {
            timestamp: '2024-01-01T10:00:02Z',
            si: 0.35,
            roll: 6,
            pitch: 3,
            ay: 0.4,
            gz: 0.06,
            time: 1704110402000
        } // SI=0.35 → 65% moderado
    ];

    const testGpsData = [
        { timestamp: '2024-01-01T10:00:00Z', latitude: 40.4168, longitude: -3.7038, speed: 15 },
        { timestamp: '2024-01-01T10:00:01Z', latitude: 40.4169, longitude: -3.7039, speed: 18 },
        { timestamp: '2024-01-01T10:00:02Z', latitude: 40.417, longitude: -3.704, speed: 20 }
    ];

    const testCanData = [
        { timestamp: '2024-01-01T10:00:00Z', engineRPM: 2000, vehicleSpeed: 15, rotativo: true },
        { timestamp: '2024-01-01T10:00:01Z', engineRPM: 2200, vehicleSpeed: 18, rotativo: true },
        { timestamp: '2024-01-01T10:00:02Z', engineRPM: 2400, vehicleSpeed: 20, rotativo: true }
    ];

    try {
        const events = generateStabilityEvents(
            testStabilityData,
            testGpsData,
            testCanData,
            'test-si-percentage'
        );

        logger.info('=== VERIFICACIÓN DE CONVERSIÓN SI A PORCENTAJE ===');
        logger.info(`Total de eventos generados: ${events.length}`);

        events.forEach((event, idx) => {
            const originalSi = testStabilityData[idx].si;
            const expectedPercentage = Math.round(originalSi * 100); // Directo: 0=crítico, 1=estable

            logger.info(`Evento ${idx + 1}:`, {
                originalSi: `${(originalSi * 100).toFixed(1)}%`,
                storedPerc: `${event.perc}%`,
                expectedPerc: `${expectedPercentage}% (directo)`,
                conversionCorrect: event.perc === expectedPercentage,
                level: event.level,
                tipos: event.tipos,
                explanation: `SI=${originalSi} → ${expectedPercentage}% (${
                    expectedPercentage < 10
                        ? 'crítico'
                        : expectedPercentage < 30
                        ? 'peligroso'
                        : 'moderado'
                })`
            });
        });

        const allCorrect = events.every((event, idx) => {
            const expectedPercentage = Math.round(testStabilityData[idx].si * 100); // Directo
            return event.perc === expectedPercentage;
        });

        logger.info(`✅ Conversión correcta: ${allCorrect ? 'SÍ' : 'NO'}`);

        if (allCorrect) {
            logger.info('🎉 La conversión del SI a porcentaje funciona correctamente');
        } else {
            logger.error('❌ Error en la conversión del SI a porcentaje');
        }

        return allCorrect;
    } catch (error) {
        logger.error('Error en la prueba de conversión SI:', error);
        throw error;
    }
}

// Ejecutar la prueba si se llama directamente
if (require.main === module) {
    testSiPercentage()
        .then((success) => {
            if (success) {
                logger.info('Prueba de conversión SI completada exitosamente');
                process.exit(0);
            } else {
                logger.error('Prueba de conversión SI falló');
                process.exit(1);
            }
        })
        .catch((error) => {
            logger.error('Prueba de conversión SI falló:', error);
            process.exit(1);
        });
}

export { testSiPercentage };
