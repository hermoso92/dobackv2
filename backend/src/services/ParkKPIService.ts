import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface ParkKPICalculationResult {
    totalClave2: number;
    totalClave5: number;
    totalEventsHigh: number;
    totalEventsModerate: number;
}

export class ParkKPIService {

    /**
     * Calcula los KPIs de un parque para una fecha específica
     */
    async calculateParkKPI(parkId: string, date: Date, organizationId: string): Promise<ParkKPICalculationResult> {
        logger.info(`[ParkKPI] Iniciando cálculo para parque ${parkId} en fecha ${date.toISOString().slice(0, 10)}`);

        try {
            // 1. Obtener todos los vehículos del parque
            const vehicles = await this.getParkVehicles(parkId, organizationId);

            if (vehicles.length === 0) {
                logger.info(`[ParkKPI] No hay vehículos en el parque ${parkId}`);
                return this.getEmptyParkKPI();
            }

            // 2. Obtener KPIs de todos los vehículos del parque para la fecha
            const vehicleKPIs = await this.getVehicleKPIs(vehicles.map(v => v.id), date);

            // 3. Calcular KPIs agregados del parque
            const parkKPIResult = this.calculateAggregatedKPIs(vehicleKPIs);

            // 4. Guardar resultado
            await this.saveParkKPI(parkId, date, parkKPIResult);

            logger.info(`[ParkKPI] KPI calculado exitosamente para parque ${parkId}:`, parkKPIResult);
            return parkKPIResult;

        } catch (error) {
            logger.error(`[ParkKPI] Error calculando KPI para parque ${parkId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todos los vehículos de un parque
     */
    private async getParkVehicles(parkId: string, organizationId: string) {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                organizationId,
                parkId
            },
            select: { id: true, name: true }
        });

        logger.info(`[ParkKPI] Vehículos encontrados en parque: ${vehicles.length}`, vehicles.map(v => v.name));
        return vehicles;
    }

    /**
     * Obtiene los KPIs de los vehículos para una fecha específica
     */
    private async getVehicleKPIs(vehicleIds: string[], date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const vehicleKPIs = await prisma.vehicleKPI.findMany({
            where: {
                vehicleId: { in: vehicleIds },
                date: { gte: startOfDay, lte: endOfDay }
            }
        });

        logger.info(`[ParkKPI] KPIs de vehículos encontrados: ${vehicleKPIs.length}`);
        return vehicleKPIs;
    }

    /**
     * Calcula los KPIs agregados del parque
     */
    private calculateAggregatedKPIs(vehicleKPIs: any[]): ParkKPICalculationResult {
        let totalClave2 = 0, totalClave5 = 0, totalEventsHigh = 0, totalEventsModerate = 0;

        for (const kpi of vehicleKPIs) {
            totalClave2 += kpi.clave2Minutes || 0;
            totalClave5 += kpi.clave5Minutes || 0;
            totalEventsHigh += kpi.eventsHigh || 0;
            totalEventsModerate += kpi.eventsModerate || 0;
        }

        const result: ParkKPICalculationResult = {
            totalClave2,
            totalClave5,
            totalEventsHigh,
            totalEventsModerate
        };

        logger.info(`[ParkKPI] KPIs agregados calculados:`, result);
        return result;
    }

    /**
     * Guarda el KPI del parque en la base de datos
     */
    private async saveParkKPI(parkId: string, date: Date, kpiData: ParkKPICalculationResult) {
        const existingKPI = await prisma.parkKPI.findFirst({
            where: { parkId, date }
        });

        if (existingKPI) {
            await prisma.parkKPI.update({
                where: { id: existingKPI.id },
                data: { ...kpiData, updatedAt: new Date() }
            });
            logger.info(`[ParkKPI] KPI actualizado para parque ${parkId}`);
        } else {
            await prisma.parkKPI.create({
                data: {
                    parkId,
                    date,
                    ...kpiData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            logger.info(`[ParkKPI] Nuevo KPI creado para parque ${parkId}`);
        }
    }

    /**
     * Retorna un KPI de parque vacío
     */
    private getEmptyParkKPI(): ParkKPICalculationResult {
        return {
            totalClave2: 0,
            totalClave5: 0,
            totalEventsHigh: 0,
            totalEventsModerate: 0
        };
    }

    /**
     * Calcula los KPIs de todos los parques de una organización
     */
    async calculateAllParksKPI(date: Date = new Date(), organizationId?: string) {
        const where: any = organizationId ? { organizationId } : {};
        const parks = await prisma.park.findMany({ where });

        logger.info(`[ParkKPI] Calculando KPIs para ${parks.length} parques`);

        for (const park of parks) {
            try {
                await this.calculateParkKPI(park.id, date, park.organizationId);
                logger.info(`✅ KPI calculado para parque ${park.name}`);
            } catch (error) {
                logger.error(`❌ Error calculando KPI para parque ${park.name}:`, error);
            }
        }
    }

    /**
     * Obtiene el KPI de un parque para una fecha específica
     */
    async getParkKPI(parkId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const kpi = await prisma.parkKPI.findFirst({
            where: {
                parkId,
                date: { gte: startOfDay, lte: endOfDay }
            },
            include: {
                park: {
                    select: { name: true }
                }
            }
        });

        return kpi;
    }
}

// Exportar instancia del servicio
export const parkKpiService = new ParkKPIService(); 