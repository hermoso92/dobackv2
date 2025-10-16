import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface KPICalculationResult {
    clave2Minutes: number;
    clave5Minutes: number;
    outOfParkMinutes: number;
    timeInWorkshop: number;
    eventsHigh: number;
    eventsModerate: number;
}

export class KPIService {

    /**
     * Calcula los KPIs de un vehículo para una fecha específica
     */
    async calculateVehicleKPI(vehicleId: string, date: Date, organizationId: string): Promise<KPICalculationResult> {
        logger.info(`[KPI] Iniciando cálculo para vehículo ${vehicleId} en fecha ${date.toISOString().slice(0, 10)}`);

        try {
            // 1. Obtener zonas de la organización
            const zones = await this.getZones(organizationId);

            // 2. Obtener sesiones del vehículo en la fecha
            const sessions = await this.getSessions(vehicleId, date);

            if (sessions.length === 0) {
                logger.info(`[KPI] No hay sesiones para el vehículo ${vehicleId} en la fecha ${date.toISOString().slice(0, 10)}`);
                return this.getEmptyKPI();
            }

            // 3. Obtener datos de la sesión
            const sessionData = await this.getSessionData(sessions.map(s => s.id));

            // 4. Calcular KPIs
            const kpiResult = await this.calculateKPIs(sessionData, zones);

            // 5. Guardar resultado
            await this.saveVehicleKPI(vehicleId, date, kpiResult);

            logger.info(`[KPI] KPI calculado exitosamente para vehículo ${vehicleId}:`, kpiResult);
            return kpiResult;

        } catch (error) {
            logger.error(`[KPI] Error calculando KPI para vehículo ${vehicleId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene las zonas de una organización
     */
    private async getZones(organizationId: string) {
        const zones = await prisma.zone.findMany({
            where: { organizationId },
            select: { id: true, name: true, type: true, geometry: true }
        });

        logger.info(`[KPI] Zonas encontradas: ${zones.length}`, zones.map(z => ({ name: z.name, type: z.type })));
        return zones;
    }

    /**
     * Obtiene las sesiones de un vehículo en una fecha
     */
    private async getSessions(vehicleId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await prisma.session.findMany({
            where: {
                vehicleId,
                startTime: { gte: startOfDay, lte: endOfDay }
            },
            select: { id: true, startTime: true, endTime: true }
        });

        logger.info(`[KPI] Sesiones encontradas: ${sessions.length}`);
        return sessions;
    }

    /**
     * Obtiene todos los datos necesarios de las sesiones
     */
    private async getSessionData(sessionIds: string[]) {
        const [gpsPoints, rotativoEvents, stabilityEvents] = await Promise.all([
            prisma.gpsMeasurement.findMany({
                where: { sessionId: { in: sessionIds } },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.rotativoMeasurement.findMany({
                where: { sessionId: { in: sessionIds } },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.stability_events.findMany({
                where: { session_id: { in: sessionIds } },
                orderBy: { timestamp: 'asc' }
            })
        ]);

        logger.info(`[KPI] Datos obtenidos: GPS=${gpsPoints.length}, Rotativo=${rotativoEvents.length}, Estabilidad=${stabilityEvents.length}`);

        return { gpsPoints, rotativoEvents, stabilityEvents };
    }

    /**
     * Calcula los KPIs basándose en los datos de la sesión
     */
    private async calculateKPIs(sessionData: any, zones: any[]): Promise<KPICalculationResult> {
        const { gpsPoints, rotativoEvents, stabilityEvents } = sessionData;

        let tiempoEnParque = 0, tiempoEnTaller = 0, tiempoFueraParque = 0;
        let clave2Minutes = 0, clave5Minutes = 0;

        // Calcular tiempos por ubicación
        if (gpsPoints.length > 1) {
            for (let i = 0; i < gpsPoints.length - 1; i++) {
                const p1 = gpsPoints[i];
                const p2 = gpsPoints[i + 1];
                const intervalo = (p2.timestamp.getTime() - p1.timestamp.getTime()) / 60000; // minutos

                const zona = this.getZoneForPoint(p1.latitude, p1.longitude, zones);
                const rotativo = this.getRotativoState(p1.timestamp, rotativoEvents);
                const fueraDelParque = !zona || (zona.type !== 'parque' && zona.type !== 'taller');

                // Acumular tiempos por zona
                if (zona?.type === 'taller') {
                    tiempoEnTaller += intervalo;
                } else if (zona?.type === 'parque') {
                    tiempoEnParque += intervalo;
                } else {
                    tiempoFueraParque += intervalo;
                }

                // Calcular claves
                if (rotativo === 'ON' && fueraDelParque) {
                    clave2Minutes += intervalo;
                } else if (rotativo === 'OFF' && fueraDelParque) {
                    clave5Minutes += intervalo;
                }
            }
        }

        // Calcular eventos
        const { eventsHigh, eventsModerate } = this.calculateEvents(stabilityEvents);

        const result: KPICalculationResult = {
            clave2Minutes: Math.round(clave2Minutes),
            clave5Minutes: Math.round(clave5Minutes),
            outOfParkMinutes: Math.round(tiempoFueraParque),
            timeInWorkshop: Math.round(tiempoEnTaller),
            eventsHigh,
            eventsModerate
        };

        logger.info(`[KPI] Resultados calculados:`, result);
        return result;
    }

    /**
     * Determina la zona para un punto GPS
     */
    private getZoneForPoint(lat: number, lon: number, zones: any[]): any | null {
        for (const zone of zones) {
            if (!zone.geometry || !zone.geometry.coordinates) continue;

            try {
                // Verificación simple: si el punto está dentro del bounding box de la zona
                const coords = zone.geometry.coordinates[0];
                if (coords && coords.length >= 4) {
                    const minLon = Math.min(...coords.map((c: number[]) => c[0]));
                    const maxLon = Math.max(...coords.map((c: number[]) => c[0]));
                    const minLat = Math.min(...coords.map((c: number[]) => c[1]));
                    const maxLat = Math.max(...coords.map((c: number[]) => c[1]));

                    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
                        return zone;
                    }
                }
            } catch (error) {
                logger.warn(`[KPI] Error verificando zona ${zone.id}:`, error);
            }
        }
        return null;
    }

    /**
     * Obtiene el estado del rotativo para un timestamp
     */
    private getRotativoState(timestamp: Date, rotativoEvents: any[]): 'ON' | 'OFF' {
        let state: 'ON' | 'OFF' = 'OFF';

        for (const event of rotativoEvents) {
            if (event.timestamp <= timestamp) {
                // Normalizar el estado
                if (typeof event.state === 'number') {
                    state = event.state === 1 ? 'ON' : 'OFF';
                } else {
                    state = (event.state === 'ON' || event.state === '1' || event.state === 'true') ? 'ON' : 'OFF';
                }
            } else {
                break;
            }
        }

        return state;
    }

    /**
     * Calcula los eventos críticos y moderados
     */
    private calculateEvents(stabilityEvents: any[]): { eventsHigh: number, eventsModerate: number } {
        let eventsHigh = 0, eventsModerate = 0;

        for (const event of stabilityEvents) {
            const type = (event.type || '').toString().toLowerCase();

            // Clasificar eventos
            if (type.includes('curva_brusca') || type.includes('punto_interes') || type.includes('critico')) {
                eventsHigh++;
            } else if (type.includes('moderado') || type.includes('warning')) {
                eventsModerate++;
            }
        }

        return { eventsHigh, eventsModerate };
    }

    /**
     * Guarda el KPI calculado en la base de datos
     */
    private async saveVehicleKPI(vehicleId: string, date: Date, kpiData: KPICalculationResult) {
        const existingKPI = await prisma.vehicleKPI.findFirst({
            where: { vehicleId, date }
        });

        if (existingKPI) {
            await prisma.vehicleKPI.update({
                where: { id: existingKPI.id },
                data: { ...kpiData, updatedAt: new Date() }
            });
            logger.info(`[KPI] KPI actualizado para vehículo ${vehicleId}`);
        } else {
            await prisma.vehicleKPI.create({
                data: {
                    vehicleId,
                    date,
                    ...kpiData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            logger.info(`[KPI] Nuevo KPI creado para vehículo ${vehicleId}`);
        }
    }

    /**
     * Retorna un KPI vacío
     */
    private getEmptyKPI(): KPICalculationResult {
        return {
            clave2Minutes: 0,
            clave5Minutes: 0,
            outOfParkMinutes: 0,
            timeInWorkshop: 0,
            eventsHigh: 0,
            eventsModerate: 0
        };
    }

    /**
     * Calcula los KPIs de todos los vehículos de una organización
     */
    async calculateAllVehiclesKPI(date: Date = new Date(), organizationId?: string) {
        const where: any = organizationId ? { organizationId } : {};
        const vehicles = await prisma.vehicle.findMany({ where });

        logger.info(`[KPI] Calculando KPIs para ${vehicles.length} vehículos`);

        for (const vehicle of vehicles) {
            try {
                await this.calculateVehicleKPI(vehicle.id, date, vehicle.organizationId);
                logger.info(`✅ KPI calculado para vehículo ${vehicle.name}`);
            } catch (error) {
                logger.error(`❌ Error calculando KPI para vehículo ${vehicle.name}:`, error);
            }
        }
    }
}

// Exportar instancia del servicio
export const kpiService = new KPIService();

// Funciones de compatibilidad para mantener la API existente
export async function calculateVehicleKPI(vehicleId: string, date: Date, organizationId: string) {
    return kpiService.calculateVehicleKPI(vehicleId, date, organizationId);
}

export async function calculateAllVehiclesKPI(date: Date = new Date(), organizationId?: string) {
    return kpiService.calculateAllVehiclesKPI(date, organizationId);
} 