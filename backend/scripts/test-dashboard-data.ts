import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function testDashboardData() {
    try {
        logger.info('🧪 Probando datos del dashboard...');

        // 1. Verificar que hay KPIs almacenados
        const kpiCount = await prisma.advancedVehicleKPI.count();
        logger.info(`📊 Total de KPIs almacenados: ${kpiCount}`);

        if (kpiCount === 0) {
            logger.error('❌ No hay KPIs almacenados en la base de datos');
            return;
        }

        // 2. Obtener un KPI de ejemplo
        const sampleKPI = await prisma.advancedVehicleKPI.findFirst({
            include: {
                vehicle: true
            }
        });

        if (!sampleKPI) {
            logger.error('❌ No se encontró ningún KPI de ejemplo');
            return;
        }

        logger.info(`🚗 KPI de ejemplo - Vehículo: ${sampleKPI.vehicle.name}`);
        logger.info(`📅 Fecha: ${sampleKPI.date.toISOString().split('T')[0]}`);

        // 3. Mostrar datos reales del KPI
        logger.info('📊 Datos reales del KPI:');
        logger.info(`  - Velocidad máxima: ${sampleKPI.maxVelocidadAlcanzada} km/h`);
        logger.info(`  - Velocidad promedio: ${sampleKPI.velocidadPromedio} km/h`);
        logger.info(`  - Distancia recorrida: ${sampleKPI.distanciaRecorrida} km`);
        logger.info(`  - Tiempo en parque: ${sampleKPI.tiempoEnParque} minutos`);
        logger.info(`  - Tiempo fuera de parque: ${sampleKPI.tiempoFueraParque} minutos`);
        logger.info(`  - Tiempo en taller: ${sampleKPI.tiempoEnTaller} minutos`);
        logger.info(`  - Eventos críticos: ${sampleKPI.eventosCriticos}`);
        logger.info(`  - Eventos peligrosos: ${sampleKPI.eventosPeligrosos}`);
        logger.info(`  - Total puntos GPS: ${sampleKPI.totalPuntosGPS}`);
        logger.info(`  - Tiempo total: ${sampleKPI.totalTiempo} minutos`);

        // 4. Verificar que los datos son realistas
        const isRealistic = validateKPIData(sampleKPI);

        if (isRealistic) {
            logger.info('✅ Los datos del KPI son realistas y correctos');
        } else {
            logger.warn('⚠️ Los datos del KPI contienen valores sospechosos');
        }

        // 5. Probar endpoint del dashboard
        await testDashboardEndpoint();

        logger.info('🎉 Prueba del dashboard completada exitosamente');

    } catch (error) {
        logger.error('💥 Error probando datos del dashboard:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function validateKPIData(kpi: any): boolean {
    const issues: string[] = [];

    // Validar velocidades
    if (kpi.maxVelocidadAlcanzada > 200) {
        issues.push(`Velocidad máxima muy alta: ${kpi.maxVelocidadAlcanzada} km/h`);
    }

    if (kpi.velocidadPromedio > 150) {
        issues.push(`Velocidad promedio muy alta: ${kpi.velocidadPromedio} km/h`);
    }

    // Validar distancias
    if (kpi.distanciaRecorrida > 1000) {
        issues.push(`Distancia muy alta: ${kpi.distanciaRecorrida} km`);
    }

    // Validar tiempos
    const totalTime = kpi.tiempoEnParque + kpi.tiempoEnTaller + kpi.tiempoFueraParque + kpi.tiempoEnZonaSensible;
    if (totalTime > 1440) { // Más de 24 horas
        issues.push(`Tiempo total excesivo: ${totalTime} minutos`);
    }

    if (issues.length > 0) {
        logger.warn('⚠️ Datos sospechosos encontrados:', issues);
        return false;
    }

    return true;
}

async function testDashboardEndpoint() {
    try {
        logger.info('🌐 Probando endpoint del dashboard...');

        // Simular llamada al endpoint del dashboard
        const response = await fetch('http://localhost:3001/api/advanced-kpis/dashboard-format?vehicleId=f0c2abab-dd54-44ca-b249-820e7c524efa&date=2025-07-07');

        if (response.ok) {
            const data = await response.json() as any;
            logger.info('✅ Endpoint del dashboard responde correctamente');
            logger.info(`📊 Datos recibidos: ${Object.keys(data).length} propiedades`);

            // Mostrar algunos datos clave
            if (data.kpiData) {
                logger.info('📈 Datos del KPI en el dashboard:');
                logger.info(`  - Velocidad máxima: ${data.kpiData.maxVelocidadAlcanzada} km/h`);
                logger.info(`  - Velocidad promedio: ${data.kpiData.velocidadPromedio} km/h`);
                logger.info(`  - Distancia: ${data.kpiData.distanciaRecorrida} km`);
                logger.info(`  - Tiempo fuera de parque: ${data.kpiData.tiempoFueraParque} minutos`);
            }
        } else {
            logger.error(`❌ Error en endpoint del dashboard: ${response.status} ${response.statusText}`);
        }

    } catch (error) {
        logger.warn('⚠️ No se pudo conectar al endpoint del dashboard (servidor puede no estar corriendo)');
    }
}

// Ejecutar la prueba
testDashboardData().catch(console.error);