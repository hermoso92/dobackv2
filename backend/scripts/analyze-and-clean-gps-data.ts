import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface GPSDataIssue {
    id: string;
    vehicleId: string;
    sessionId: string;
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    issue: string;
    severity: 'critical' | 'warning' | 'info';
}

async function analyzeAndCleanGPSData() {
    try {
        logger.info('🔍 Iniciando análisis de datos GPS...');

        // 1. Obtener todos los datos GPS
        const gpsData = await prisma.gpsMeasurement.findMany({
            include: {
                session: {
                    include: {
                        vehicle: true
                    }
                }
            },
            orderBy: { timestamp: 'asc' }
        });

        logger.info(`📊 Total de puntos GPS encontrados: ${gpsData.length}`);

        // 2. Analizar problemas
        const issues: GPSDataIssue[] = [];

        for (const point of gpsData) {
            const pointIssues: string[] = [];
            let severity: 'critical' | 'warning' | 'info' = 'info';

            // Validar coordenadas
            if (point.latitude < -90 || point.latitude > 90) {
                pointIssues.push(`Latitud inválida: ${point.latitude}`);
                severity = 'critical';
            }

            if (point.longitude < -180 || point.longitude > 180) {
                pointIssues.push(`Longitud inválida: ${point.longitude}`);
                severity = 'critical';
            }

            // Validar velocidad
            if (point.speed > 200) {
                pointIssues.push(`Velocidad irreal: ${point.speed} km/h`);
                severity = severity === 'critical' ? 'critical' : 'warning';
            }

            if (point.speed < 0) {
                pointIssues.push(`Velocidad negativa: ${point.speed} km/h`);
                severity = 'critical';
            }

            // Validar timestamp
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

            if (point.timestamp < oneYearAgo || point.timestamp > oneYearFromNow) {
                pointIssues.push(`Timestamp inválido: ${point.timestamp.toISOString()}`);
                severity = severity === 'critical' ? 'critical' : 'warning';
            }

            if (pointIssues.length > 0) {
                issues.push({
                    id: point.id,
                    vehicleId: point.session.vehicleId,
                    sessionId: point.sessionId,
                    timestamp: point.timestamp,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    speed: point.speed,
                    issue: pointIssues.join(', '),
                    severity
                });
            }
        }

        // 3. Mostrar resumen de problemas
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        const warningIssues = issues.filter(i => i.severity === 'warning');
        const infoIssues = issues.filter(i => i.severity === 'info');

        logger.info(`🚨 Problemas críticos: ${criticalIssues.length}`);
        logger.info(`⚠️ Advertencias: ${warningIssues.length}`);
        logger.info(`ℹ️ Informativos: ${infoIssues.length}`);

        // 4. Mostrar ejemplos de problemas críticos
        if (criticalIssues.length > 0) {
            logger.info('📋 Ejemplos de problemas críticos:');
            criticalIssues.slice(0, 5).forEach(issue => {
                logger.info(`  - Vehículo ${issue.vehicleId}: ${issue.issue}`);
            });
        }

        // 5. Estadísticas de velocidad
        const speeds = gpsData.map(p => p.speed).filter(s => s > 0);
        const maxSpeed = Math.max(...speeds);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const unrealisticSpeeds = speeds.filter(s => s > 200).length;

        logger.info(`📈 Estadísticas de velocidad:`);
        logger.info(`  - Velocidad máxima: ${maxSpeed.toFixed(2)} km/h`);
        logger.info(`  - Velocidad promedio: ${avgSpeed.toFixed(2)} km/h`);
        logger.info(`  - Velocidades irreales (>200 km/h): ${unrealisticSpeeds}`);

        // 6. Estadísticas de coordenadas
        const latitudes = gpsData.map(p => p.latitude);
        const longitudes = gpsData.map(p => p.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        logger.info(`🌍 Estadísticas de coordenadas:`);
        logger.info(`  - Latitud: ${minLat.toFixed(6)} a ${maxLat.toFixed(6)}`);
        logger.info(`  - Longitud: ${minLon.toFixed(6)} a ${maxLon.toFixed(6)}`);

        // 7. Proponer correcciones
        logger.info('🔧 Correcciones propuestas:');

        if (unrealisticSpeeds > 0) {
            logger.info(`  - Limpiar ${unrealisticSpeeds} puntos con velocidad > 200 km/h`);
        }

        if (criticalIssues.length > 0) {
            logger.info(`  - Corregir ${criticalIssues.length} puntos con coordenadas inválidas`);
        }

        // 8. Crear script de limpieza
        await createCleanupScript(issues);

        logger.info('✅ Análisis completado');

    } catch (error) {
        logger.error('💥 Error en el análisis de datos GPS:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function createCleanupScript(issues: GPSDataIssue[]) {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    let cleanupScript = `-- Script de limpieza de datos GPS corruptos
-- Generado automáticamente el ${new Date().toISOString()}

-- Eliminar puntos GPS con coordenadas inválidas
DELETE FROM "GpsMeasurement" WHERE id IN (
${criticalIssues.map(i => `    '${i.id}'`).join(',\n')}
);

-- Actualizar velocidades irreales a un valor máximo realista
UPDATE "GpsMeasurement" 
SET speed = 120 
WHERE speed > 200;

-- Actualizar velocidades negativas a 0
UPDATE "GpsMeasurement" 
SET speed = 0 
WHERE speed < 0;

-- Estadísticas después de la limpieza
SELECT 
    COUNT(*) as total_points,
    AVG(speed) as avg_speed,
    MAX(speed) as max_speed,
    MIN(latitude) as min_lat,
    MAX(latitude) as max_lat,
    MIN(longitude) as min_lon,
    MAX(longitude) as max_lon
FROM "GpsMeasurement";
`;

    // Guardar script
    const fs = require('fs');
    const path = require('path');
    const scriptPath = path.join(__dirname, 'cleanup-gps-data.sql');

    fs.writeFileSync(scriptPath, cleanupScript);

    logger.info(`📝 Script de limpieza creado: ${scriptPath}`);
    logger.info(`   - ${criticalIssues.length} puntos críticos a eliminar`);
    logger.info(`   - ${warningIssues.length} puntos con advertencias`);
}

// Ejecutar el análisis
analyzeAndCleanGPSData().catch(console.error);