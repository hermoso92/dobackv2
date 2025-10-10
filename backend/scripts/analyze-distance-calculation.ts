import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function analyzeDistanceCalculation() {
    try {
        logger.info('🔍 Analizando cálculo de distancias...');

        // Obtener datos GPS de una sesión específica
        const session = await prisma.session.findFirst({
            where: {
                vehicle: {
                    name: { contains: 'Test' }
                }
            },
            include: {
                gpsMeasurements: {
                    orderBy: { timestamp: 'asc' },
                    take: 10 // Solo los primeros 10 puntos
                }
            }
        });

        if (!session) {
            logger.error('No se encontró sesión de prueba');
            return;
        }

        logger.info(`📊 Analizando sesión: ${session.id}`);
        logger.info(`📅 Fecha: ${session.startTime.toISOString().split('T')[0]}`);
        logger.info(`🚗 Vehículo: ${session.vehicleId}`);
        logger.info(`📍 Puntos GPS: ${session.gpsMeasurements.length}`);

        // Analizar distancias entre puntos consecutivos
        let totalDistance = 0;
        let maxDistance = 0;
        let minDistance = Infinity;
        let unrealisticDistances = 0;

        for (let i = 0; i < session.gpsMeasurements.length - 1; i++) {
            const current = session.gpsMeasurements[i];
            const next = session.gpsMeasurements[i + 1];

            const distance = calculateDistance(
                current.latitude,
                current.longitude,
                next.latitude,
                next.longitude
            );

            totalDistance += distance;
            maxDistance = Math.max(maxDistance, distance);
            minDistance = Math.min(minDistance, distance);

            if (distance > 10) { // Más de 10 km entre puntos consecutivos
                unrealisticDistances++;
                logger.warn(`📍 Distancia irreal entre puntos ${i} y ${i + 1}: ${distance.toFixed(2)} km`);
                logger.warn(`   Punto ${i}: ${current.latitude}, ${current.longitude} (${current.timestamp.toISOString()})`);
                logger.warn(`   Punto ${i + 1}: ${next.latitude}, ${next.longitude} (${next.timestamp.toISOString()})`);

                // Calcular tiempo entre puntos
                const timeDiff = (next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60); // minutos
                logger.warn(`   Tiempo entre puntos: ${timeDiff.toFixed(2)} minutos`);

                if (timeDiff > 0) {
                    const speed = (distance * 1000) / (timeDiff * 60); // km/h
                    logger.warn(`   Velocidad calculada: ${speed.toFixed(2)} km/h`);
                }
            }
        }

        logger.info('📈 Estadísticas de distancia:');
        logger.info(`  - Distancia total: ${totalDistance.toFixed(2)} km`);
        logger.info(`  - Distancia máxima entre puntos: ${maxDistance.toFixed(2)} km`);
        logger.info(`  - Distancia mínima entre puntos: ${minDistance.toFixed(2)} km`);
        logger.info(`  - Distancias irreales (>10 km): ${unrealisticDistances}`);
        logger.info(`  - Distancia promedio entre puntos: ${(totalDistance / (session.gpsMeasurements.length - 1)).toFixed(2)} km`);

        // Analizar intervalos de tiempo
        const timeIntervals = [];
        for (let i = 0; i < session.gpsMeasurements.length - 1; i++) {
            const current = session.gpsMeasurements[i];
            const next = session.gpsMeasurements[i + 1];
            const timeDiff = (next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60); // minutos
            timeIntervals.push(timeDiff);
        }

        const avgTimeInterval = timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length;
        const maxTimeInterval = Math.max(...timeIntervals);
        const minTimeInterval = Math.min(...timeIntervals);

        logger.info('⏰ Estadísticas de tiempo:');
        logger.info(`  - Intervalo promedio: ${avgTimeInterval.toFixed(2)} minutos`);
        logger.info(`  - Intervalo máximo: ${maxTimeInterval.toFixed(2)} minutos`);
        logger.info(`  - Intervalo mínimo: ${minTimeInterval.toFixed(2)} minutos`);

        // Identificar el problema
        if (unrealisticDistances > 0) {
            logger.warn('🚨 PROBLEMA IDENTIFICADO: Distancias irreales entre puntos GPS consecutivos');
            logger.warn('   Posibles causas:');
            logger.warn('   1. Datos GPS con saltos temporales grandes');
            logger.warn('   2. Puntos GPS faltantes en el medio');
            logger.warn('   3. Errores en la fórmula de Haversine');
            logger.warn('   4. Coordenadas GPS corruptas');
        }

    } catch (error) {
        logger.error('💥 Error analizando distancias:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Ejecutar el análisis
analyzeDistanceCalculation().catch(console.error);