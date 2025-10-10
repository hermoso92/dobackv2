import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function fixGPSData() {
    try {
        logger.info('🔧 Iniciando corrección de datos GPS...');

        // 1. Obtener puntos GPS con velocidades irreales
        const problematicPoints = await prisma.gpsMeasurement.findMany({
            where: {
                OR: [
                    { speed: { gt: 200 } },
                    { speed: { lt: 0 } }
                ]
            },
            include: {
                session: {
                    include: {
                        vehicle: true
                    }
                }
            },
            orderBy: { timestamp: 'asc' }
        });

        logger.info(`🚨 Puntos GPS problemáticos encontrados: ${problematicPoints.length}`);

        // 2. Corregir velocidades irreales
        let correctedCount = 0;

        for (const point of problematicPoints) {
            let correctedSpeed = point.speed;

            // Corregir velocidades > 200 km/h
            if (point.speed > 200) {
                // Calcular velocidad real basada en distancia y tiempo
                correctedSpeed = await calculateRealSpeed(point);

                if (correctedSpeed > 200) {
                    correctedSpeed = 120; // Límite máximo realista
                }
            }

            // Corregir velocidades negativas
            if (point.speed < 0) {
                correctedSpeed = 0;
            }

            // Actualizar en base de datos
            await prisma.gpsMeasurement.update({
                where: { id: point.id },
                data: { speed: correctedSpeed }
            });

            correctedCount++;

            if (correctedCount % 10 === 0) {
                logger.info(`✅ Corregidos ${correctedCount}/${problematicPoints.length} puntos`);
            }
        }

        logger.info(`🎉 Corrección completada: ${correctedCount} puntos corregidos`);

        // 3. Verificar resultados
        await verifyCorrection();

    } catch (error) {
        logger.error('💥 Error corrigiendo datos GPS:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function calculateRealSpeed(point: any): Promise<number> {
    try {
        // Obtener el punto GPS anterior
        const previousPoint = await prisma.gpsMeasurement.findFirst({
            where: {
                sessionId: point.sessionId,
                timestamp: { lt: point.timestamp }
            },
            orderBy: { timestamp: 'desc' }
        });

        if (!previousPoint) {
            return 0; // No hay punto anterior
        }

        // Calcular distancia usando fórmula de Haversine
        const distance = calculateDistance(
            previousPoint.latitude,
            previousPoint.longitude,
            point.latitude,
            point.longitude
        );

        // Calcular tiempo en horas
        const timeDiff = (point.timestamp.getTime() - previousPoint.timestamp.getTime()) / (1000 * 60 * 60);

        if (timeDiff <= 0) {
            return 0; // Tiempo inválido
        }

        // Calcular velocidad real en km/h
        const realSpeed = distance / timeDiff;

        return Math.min(realSpeed, 120); // Límite máximo de 120 km/h

    } catch (error) {
        logger.warn(`Error calculando velocidad real para punto ${point.id}:`, error);
        return 0;
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

async function verifyCorrection() {
    try {
        logger.info('🔍 Verificando corrección...');

        // Estadísticas después de la corrección
        const stats = await prisma.gpsMeasurement.aggregate({
            _count: { id: true },
            _avg: { speed: true },
            _max: { speed: true },
            _min: { speed: true }
        });

        const unrealisticCount = await prisma.gpsMeasurement.count({
            where: { speed: { gt: 200 } }
        });

        logger.info('📊 Estadísticas después de la corrección:');
        logger.info(`  - Total de puntos: ${stats._count.id}`);
        logger.info(`  - Velocidad promedio: ${stats._avg.speed?.toFixed(2)} km/h`);
        logger.info(`  - Velocidad máxima: ${stats._max.speed?.toFixed(2)} km/h`);
        logger.info(`  - Velocidad mínima: ${stats._min.speed?.toFixed(2)} km/h`);
        logger.info(`  - Velocidades irreales (>200 km/h): ${unrealisticCount}`);

        if (unrealisticCount === 0) {
            logger.info('✅ ¡Todos los datos GPS han sido corregidos!');
        } else {
            logger.warn(`⚠️ Aún quedan ${unrealisticCount} velocidades irreales`);
        }

    } catch (error) {
        logger.error('Error verificando corrección:', error);
    }
}

// Ejecutar la corrección
fixGPSData().catch(console.error);