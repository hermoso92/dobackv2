import { PrismaClient } from '@prisma/client';
import { AdvancedKPICalculationService } from '../src/services/AdvancedKPICalculationService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();
const kpiService = new AdvancedKPICalculationService();

async function recalculateAllKPIs() {
    try {
        logger.info('🔄 Iniciando recálculo completo de KPIs...');

        // 1. Eliminar todos los KPIs existentes
        logger.info('🗑️ Eliminando KPIs existentes...');
        const deletedCount = await prisma.advancedVehicleKPI.deleteMany({});
        logger.info(`✅ Eliminados ${deletedCount.count} KPIs existentes`);

        // 2. Obtener todas las organizaciones
        const organizations = await prisma.organization.findMany({
            select: { id: true, name: true }
        });

        logger.info(`📊 Organizaciones encontradas: ${organizations.length}`);

        for (const org of organizations) {
            logger.info(`🏢 Procesando organización: ${org.name} (${org.id})`);

            // 3. Obtener todos los vehículos de la organización
            const vehicles = await prisma.vehicle.findMany({
                where: { organizationId: org.id },
                select: { id: true, name: true, licensePlate: true }
            });

            logger.info(`🚗 Vehículos encontrados: ${vehicles.length}`);

            for (const vehicle of vehicles) {
                logger.info(`🔧 Procesando vehículo: ${vehicle.name} (${vehicle.licensePlate})`);

                // 4. Obtener todas las fechas con sesiones para este vehículo
                const sessions = await prisma.session.findMany({
                    where: { vehicleId: vehicle.id },
                    select: { startTime: true },
                    orderBy: { startTime: 'asc' }
                });

                if (sessions.length === 0) {
                    logger.info(`⚠️ No hay sesiones para el vehículo ${vehicle.name}`);
                    continue;
                }

                // 5. Agrupar sesiones por fecha
                const datesByDay = new Map<string, Date>();
                for (const session of sessions) {
                    const dateKey = session.startTime.toISOString().split('T')[0];
                    if (!datesByDay.has(dateKey)) {
                        datesByDay.set(dateKey, new Date(session.startTime));
                    }
                }

                logger.info(`📅 Fechas con sesiones: ${datesByDay.size}`);

                // 6. Recalcular KPIs para cada fecha
                let calculatedCount = 0;
                let errorCount = 0;

                for (const [dateKey, date] of datesByDay) {
                    try {
                        logger.info(`📊 Recalculando KPIs para ${vehicle.name} en ${dateKey}...`);

                        const kpiData = await kpiService.calculateAndStoreDailyKPIs(
                            vehicle.id,
                            date,
                            org.id
                        );

                        // Validar que los datos sean reales
                        if (validateKPIData(kpiData, vehicle.name, dateKey)) {
                            calculatedCount++;
                            logger.info(`✅ KPIs recalculados correctamente para ${vehicle.name} en ${dateKey}`);
                        } else {
                            logger.warn(`⚠️ KPIs con datos sospechosos para ${vehicle.name} en ${dateKey}`);
                            calculatedCount++;
                        }

                    } catch (error) {
                        errorCount++;
                        logger.error(`❌ Error recalculando KPIs para ${vehicle.name} en ${dateKey}:`, error);
                    }
                }

                logger.info(`📈 Resumen para ${vehicle.name}: ${calculatedCount} calculados, ${errorCount} errores`);
            }
        }

        // 7. Verificar resultados finales
        await verifyFinalResults();

        logger.info('🎉 Recálculo completo de KPIs finalizado');

    } catch (error) {
        logger.error('💥 Error en el recálculo de KPIs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Valida que los datos de KPI sean realistas
 */
function validateKPIData(kpiData: any, vehicleName: string, date: string): boolean {
    const issues: string[] = [];

    // Validar velocidades
    if (kpiData.maxVelocidadAlcanzada > 200) {
        issues.push(`Velocidad máxima muy alta: ${kpiData.maxVelocidadAlcanzada} km/h`);
    }

    if (kpiData.velocidadPromedio > 150) {
        issues.push(`Velocidad promedio muy alta: ${kpiData.velocidadPromedio} km/h`);
    }

    // Validar distancias
    if (kpiData.distanciaRecorrida > 1000) {
        issues.push(`Distancia muy alta: ${kpiData.distanciaRecorrida} km`);
    }

    // Validar tiempos
    const totalTime = kpiData.tiempoEnParque + kpiData.tiempoEnTaller + kpiData.tiempoFueraParque + kpiData.tiempoEnZonaSensible;
    if (totalTime > 1440) { // Más de 24 horas
        issues.push(`Tiempo total excesivo: ${totalTime} minutos`);
    }

    // Validar eventos
    if (kpiData.eventosCriticos > 100) {
        issues.push(`Demasiados eventos críticos: ${kpiData.eventosCriticos}`);
    }

    if (issues.length > 0) {
        logger.warn(`⚠️ Datos sospechosos para ${vehicleName} en ${date}:`, issues);
        return false;
    }

    return true;
}

async function verifyFinalResults() {
    try {
        logger.info('🔍 Verificando resultados finales...');

        // Estadísticas de todos los KPIs
        const stats = await prisma.advancedVehicleKPI.aggregate({
            _count: { id: true },
            _avg: {
                maxVelocidadAlcanzada: true,
                velocidadPromedio: true,
                distanciaRecorrida: true
            },
            _max: {
                maxVelocidadAlcanzada: true,
                velocidadPromedio: true,
                distanciaRecorrida: true
            }
        });

        logger.info('📊 Estadísticas finales de KPIs:');
        logger.info(`  - Total de KPIs: ${stats._count.id}`);
        logger.info(`  - Velocidad máxima promedio: ${stats._avg.maxVelocidadAlcanzada?.toFixed(2)} km/h`);
        logger.info(`  - Velocidad promedio: ${stats._avg.velocidadPromedio?.toFixed(2)} km/h`);
        logger.info(`  - Distancia promedio: ${stats._avg.distanciaRecorrida?.toFixed(2)} km`);
        logger.info(`  - Velocidad máxima registrada: ${stats._max.maxVelocidadAlcanzada?.toFixed(2)} km/h`);
        logger.info(`  - Distancia máxima registrada: ${stats._max.distanciaRecorrida?.toFixed(2)} km`);

        // Verificar si hay datos irreales
        const unrealisticSpeeds = await prisma.advancedVehicleKPI.count({
            where: { maxVelocidadAlcanzada: { gt: 200 } }
        });

        const unrealisticDistances = await prisma.advancedVehicleKPI.count({
            where: { distanciaRecorrida: { gt: 1000 } }
        });

        if (unrealisticSpeeds === 0 && unrealisticDistances === 0) {
            logger.info('✅ ¡Todos los KPIs tienen datos realistas!');
        } else {
            logger.warn(`⚠️ Aún hay ${unrealisticSpeeds} KPIs con velocidades irreales y ${unrealisticDistances} con distancias irreales`);
        }

    } catch (error) {
        logger.error('Error verificando resultados finales:', error);
    }
}

// Ejecutar el recálculo
recalculateAllKPIs().catch(console.error);