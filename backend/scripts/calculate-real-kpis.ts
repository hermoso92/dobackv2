import { PrismaClient } from '@prisma/client';
import { AdvancedKPICalculationService } from '../src/services/AdvancedKPICalculationService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();
const kpiService = new AdvancedKPICalculationService();

async function calculateRealKPIs() {
    try {
        logger.info('🚀 Iniciando cálculo de KPIs reales...');

        // 1. Obtener todas las organizaciones
        const organizations = await prisma.organization.findMany({
            select: { id: true, name: true }
        });

        logger.info(`📊 Organizaciones encontradas: ${organizations.length}`);

        for (const org of organizations) {
            logger.info(`🏢 Procesando organización: ${org.name} (${org.id})`);

            // 2. Obtener todos los vehículos de la organización
            const vehicles = await prisma.vehicle.findMany({
                where: { organizationId: org.id },
                select: { id: true, name: true, licensePlate: true }
            });

            logger.info(`🚗 Vehículos encontrados: ${vehicles.length}`);

            for (const vehicle of vehicles) {
                logger.info(`🔧 Procesando vehículo: ${vehicle.name} (${vehicle.licensePlate})`);

                // 3. Obtener todas las fechas con sesiones para este vehículo
                const sessions = await prisma.session.findMany({
                    where: { vehicleId: vehicle.id },
                    select: { startTime: true },
                    orderBy: { startTime: 'asc' }
                });

                if (sessions.length === 0) {
                    logger.info(`⚠️ No hay sesiones para el vehículo ${vehicle.name}`);
                    continue;
                }

                // 4. Agrupar sesiones por fecha
                const datesByDay = new Map<string, Date>();
                for (const session of sessions) {
                    const dateKey = session.startTime.toISOString().split('T')[0];
                    if (!datesByDay.has(dateKey)) {
                        datesByDay.set(dateKey, new Date(session.startTime));
                    }
                }

                logger.info(`📅 Fechas con sesiones: ${datesByDay.size}`);

                // 5. Calcular KPIs para cada fecha
                let calculatedCount = 0;
                let errorCount = 0;

                for (const [dateKey, date] of datesByDay) {
                    try {
                        logger.info(`📊 Calculando KPIs para ${vehicle.name} en ${dateKey}...`);

                        const kpiData = await kpiService.calculateAndStoreDailyKPIs(
                            vehicle.id,
                            date,
                            org.id
                        );

                        // Validar que los datos sean reales
                        if (validateKPIData(kpiData, vehicle.name, dateKey)) {
                            calculatedCount++;
                            logger.info(`✅ KPIs calculados correctamente para ${vehicle.name} en ${dateKey}`);
                        } else {
                            logger.warn(`⚠️ KPIs con datos sospechosos para ${vehicle.name} en ${dateKey}`);
                            calculatedCount++;
                        }

                    } catch (error) {
                        errorCount++;
                        logger.error(`❌ Error calculando KPIs para ${vehicle.name} en ${dateKey}:`, error);
                    }
                }

                logger.info(`📈 Resumen para ${vehicle.name}: ${calculatedCount} calculados, ${errorCount} errores`);
            }
        }

        logger.info('🎉 Cálculo de KPIs reales completado');

    } catch (error) {
        logger.error('💥 Error en el cálculo de KPIs reales:', error);
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

// Ejecutar el script
calculateRealKPIs().catch(console.error);