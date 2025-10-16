import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface VehicleState {
    timestamp: Date;
    lat: number;
    lon: number;
    speed: number;
    zone: 'parque' | 'taller' | 'fuera' | 'zona_sensible';
    rotativo: 'ON' | 'OFF';
    speedExceeded: boolean;
    speedExceededBy?: number;
}

interface AdvancedKPIData {
    // Estados básicos (en minutos)
    tiempoEnParque: number;
    tiempoEnTaller: number;
    tiempoFueraParque: number;
    tiempoEnZonaSensible: number;

    // Estados con rotativo (en minutos)
    tiempoEnParqueConRotativo: number;
    tiempoEnParqueSinRotativo: number;
    tiempoFueraParqueConRotativo: number;
    tiempoFueraParqueSinRotativo: number;
    tiempoEnTallerConRotativo: number;
    tiempoEnTallerSinRotativo: number;

    // Eventos por tipo
    eventosCriticos: number;
    eventosPeligrosos: number;
    eventosModerados: number;
    eventosLeves: number;

    // Eventos por ubicación
    eventosCriticosEnParque: number;
    eventosCriticosFueraParque: number;
    eventosCriticosEnTaller: number;
    eventosPeligrososEnParque: number;
    eventosPeligrososFueraParque: number;
    eventosPeligrososEnTaller: number;

    // Velocidad
    tiempoExcediendoVelocidad: number;
    tiempoExcediendoVelocidadEnParque: number;
    tiempoExcediendoVelocidadFueraParque: number;
    tiempoExcediendoVelocidadEnTaller: number;
    maxVelocidadAlcanzada: number;
    velocidadPromedio: number;

    // Detalles de velocidad
    excesosVelocidadLeves: number;
    excesosVelocidadModerados: number;
    excesosVelocidadGraves: number;
    excesosVelocidadMuyGraves: number;

    // Estadísticas adicionales
    totalPuntosGPS: number;
    totalTiempo: number;
    distanciaRecorrida: number;
    tiempoEnMovimiento: number;
    tiempoDetenido: number;

    // Claves operativas (compatibilidad)
    clave2Minutes: number;
    clave5Minutes: number;
    outOfParkMinutes: number;
    timeInWorkshop: number;
    eventsHigh: number;
    eventsModerate: number;
}

export class AdvancedKPICalculationService {

    /**
     * Calcula y almacena KPIs avanzados para un vehículo en una fecha específica
     */
    async calculateAndStoreDailyKPIs(vehicleId: string, date: Date, organizationId: string): Promise<AdvancedKPIData> {
        try {
            logger.info(`[AdvancedKPI] Iniciando cálculo de KPIs para vehículo ${vehicleId} en fecha ${date.toISOString().split('T')[0]}`);

            // 1. Verificar si ya existe un KPI calculado para esta fecha
            const existingKPI = await prisma.advancedVehicleKPI.findFirst({
                where: { vehicleId, date }
            });

            if (existingKPI && existingKPI.isValid) {
                logger.info(`[AdvancedKPI] KPI ya existe y es válido para vehículo ${vehicleId} en fecha ${date.toISOString().split('T')[0]}`);
                return this.mapToKPIData(existingKPI);
            }

            // 2. Obtener sesiones del día
            const sessions = await this.getSessionsForDate(vehicleId, date);
            if (sessions.length === 0) {
                logger.info(`[AdvancedKPI] No hay sesiones para vehículo ${vehicleId} en fecha ${date.toISOString().split('T')[0]}`);
                return this.getEmptyKPIData();
            }

            // 3. Obtener datos de las sesiones
            const sessionData = await this.getSessionData(sessions.map(s => s.id));

            // 4. Obtener zonas de la organización
            const zones = await this.getZones(organizationId);

            // 5. Calcular estados del vehículo
            const vehicleStates = this.calculateVehicleStates(sessionData, zones);

            // 6. Calcular KPIs
            const kpiData = this.calculateKPIs(vehicleStates, sessionData.stabilityEvents);

            // 7. Almacenar en base de datos
            await this.storeKPIData(vehicleId, date, organizationId, kpiData);

            logger.info(`[AdvancedKPI] KPIs calculados y almacenados exitosamente para vehículo ${vehicleId}`);
            return kpiData;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPIs para vehículo ${vehicleId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene KPIs almacenados para un vehículo en una fecha
     */
    async getStoredKPIs(vehicleId: string, date: Date): Promise<AdvancedKPIData | null> {
        try {
            const kpi = await prisma.advancedVehicleKPI.findFirst({
                where: { vehicleId, date }
            });

            if (!kpi) {
                return null;
            }

            return this.mapToKPIData(kpi);
        } catch (error) {
            logger.error(`[AdvancedKPI] Error obteniendo KPIs almacenados:`, error);
            throw error;
        }
    }

    /**
     * Obtiene KPIs para múltiples vehículos en un rango de fechas
     */
    async getMultipleVehiclesKPIs(vehicleIds: string[], startDate: Date, endDate: Date, organizationId: string): Promise<AdvancedKPIData[]> {
        try {
            const kpis = await prisma.advancedVehicleKPI.findMany({
                where: {
                    vehicleId: { in: vehicleIds },
                    date: { gte: startDate, lte: endDate },
                    organizationId,
                    isValid: true
                },
                orderBy: [{ vehicleId: 'asc' }, { date: 'asc' }]
            });

            return kpis.map(kpi => this.mapToKPIData(kpi));
        } catch (error) {
            logger.error(`[AdvancedKPI] Error obteniendo KPIs de múltiples vehículos:`, error);
            throw error;
        }
    }

    /**
     * Obtiene sesiones para una fecha específica
     */
    private async getSessionsForDate(vehicleId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await prisma.session.findMany({
            where: {
                vehicleId,
                startTime: { gte: startOfDay, lte: endOfDay }
            },
            select: { id: true, startTime: true, endTime: true }
        });
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

        // Filtrar y validar datos GPS
        const validGPSPoints = this.validateAndFilterGPSData(gpsPoints);

        logger.info(`[AdvancedKPI] Datos GPS: ${gpsPoints.length} originales, ${validGPSPoints.length} válidos`);

        return { gpsPoints: validGPSPoints, rotativoEvents, stabilityEvents };
    }

    /**
     * Valida y filtra datos GPS para eliminar valores irreales
     */
    private validateAndFilterGPSData(gpsPoints: any[]): any[] {
        return gpsPoints.filter(point => {
            // Validar coordenadas
            if (point.latitude < -90 || point.latitude > 90) {
                logger.warn(`[AdvancedKPI] Punto GPS con latitud inválida: ${point.latitude}`);
                return false;
            }

            if (point.longitude < -180 || point.longitude > 180) {
                logger.warn(`[AdvancedKPI] Punto GPS con longitud inválida: ${point.longitude}`);
                return false;
            }

            // Validar velocidad
            if (point.speed > 200) {
                logger.warn(`[AdvancedKPI] Punto GPS con velocidad irreal: ${point.speed} km/h`);
                return false;
            }

            if (point.speed < 0) {
                logger.warn(`[AdvancedKPI] Punto GPS con velocidad negativa: ${point.speed} km/h`);
                return false;
            }

            // Validar timestamp
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

            if (point.timestamp < oneYearAgo || point.timestamp > oneYearFromNow) {
                logger.warn(`[AdvancedKPI] Punto GPS con timestamp inválido: ${point.timestamp.toISOString()}`);
                return false;
            }

            return true;
        });
    }

    /**
     * Obtiene las zonas de una organización
     */
    private async getZones(organizationId: string) {
        return await prisma.zone.findMany({
            where: { organizationId },
            select: { id: true, name: true, type: true, geometry: true }
        });
    }

    /**
     * Calcula los estados del vehículo basándose en los datos GPS y rotativo
     */
    private calculateVehicleStates(sessionData: any, zones: any[]): VehicleState[] {
        const states: VehicleState[] = [];

        // Procesar cada punto GPS
        for (let i = 0; i < sessionData.gpsPoints.length; i++) {
            const gps = sessionData.gpsPoints[i];
            const zone = this.determineZone(gps.latitude, gps.longitude, zones);
            const rotativo = this.getRotativoState(gps.timestamp, sessionData.rotativoEvents);

            // Calcular velocidad real basada en distancia y tiempo
            let realSpeed = gps.speed;
            if (i > 0) {
                const previousGps = sessionData.gpsPoints[i - 1];
                const calculatedSpeed = this.calculateRealSpeed(previousGps, gps);

                // Usar la velocidad calculada si es más realista
                if (calculatedSpeed > 0 && calculatedSpeed < 200) {
                    realSpeed = calculatedSpeed;
                }
            }

            const speedExceeded = this.checkSpeedExceeded(realSpeed, zone);
            const speedExceededBy = speedExceeded ? this.calculateSpeedExceededBy(realSpeed, zone) : undefined;

            states.push({
                timestamp: gps.timestamp,
                lat: gps.latitude,
                lon: gps.longitude,
                speed: realSpeed,
                zone,
                rotativo,
                speedExceeded,
                speedExceededBy
            });
        }

        return states;
    }

    /**
     * Calcula la velocidad real basada en distancia y tiempo entre dos puntos GPS
     */
    private calculateRealSpeed(previousGps: any, currentGps: any): number {
        try {
            // Calcular distancia
            const distance = this.calculateDistance(
                previousGps.latitude,
                previousGps.longitude,
                currentGps.latitude,
                currentGps.longitude
            );

            // Calcular tiempo en horas
            const timeDiff = (currentGps.timestamp.getTime() - previousGps.timestamp.getTime()) / (1000 * 60 * 60);

            if (timeDiff <= 0) {
                return 0; // Tiempo inválido
            }

            // Si el intervalo es muy grande (>30 minutos), no calcular velocidad
            if (timeDiff > 0.5) { // 30 minutos
                logger.warn(`[AdvancedKPI] Intervalo de tiempo muy grande: ${timeDiff.toFixed(2)} horas, saltando cálculo de velocidad`);
                return 0;
            }

            // Calcular velocidad real en km/h
            const realSpeed = distance / timeDiff;

            // Limitar a valores realistas
            return Math.min(Math.max(realSpeed, 0), 200);

        } catch (error) {
            logger.warn(`[AdvancedKPI] Error calculando velocidad real:`, error);
            return 0;
        }
    }

    /**
     * Determina la zona basándose en las coordenadas GPS
     */
    private determineZone(lat: number, lon: number, zones: any[]): 'parque' | 'taller' | 'fuera' | 'zona_sensible' {
        // Implementar lógica de geocercas usando PostGIS
        // Por ahora, lógica simplificada
        for (const zone of zones) {
            if (zone.type === 'PARK' && this.isPointInZone(lat, lon, zone.geometry)) {
                return 'parque';
            }
            if (zone.type === 'WORKSHOP' && this.isPointInZone(lat, lon, zone.geometry)) {
                return 'taller';
            }
            if (zone.type === 'SENSITIVE' && this.isPointInZone(lat, lon, zone.geometry)) {
                return 'zona_sensible';
            }
        }
        return 'fuera';
    }

    /**
     * Verifica si un punto está dentro de una zona (simplificado)
     */
    private isPointInZone(lat: number, lon: number, geometry: any): boolean {
        // Implementar lógica PostGIS real
        // Por ahora, retornar false para simplificar
        return false;
    }

    /**
     * Obtiene el estado del rotativo en un timestamp específico
     */
    private getRotativoState(timestamp: Date, rotativoEvents: any[]): 'ON' | 'OFF' {
        let state: 'ON' | 'OFF' = 'OFF';

        for (const event of rotativoEvents) {
            if (event.timestamp <= timestamp) {
                state = event.state as 'ON' | 'OFF';
            } else {
                break;
            }
        }

        return state;
    }

    /**
     * Verifica si se excedió la velocidad
     */
    private checkSpeedExceeded(speed: number, zone: string): boolean {
        const limits = {
            parque: 20,
            taller: 10,
            zona_sensible: 30,
            fuera: 80
        };

        return speed > (limits[zone as keyof typeof limits] || 80);
    }

    /**
     * Calcula cuánto se excedió la velocidad
     */
    private calculateSpeedExceededBy(speed: number, zone: string): number {
        const limits = {
            parque: 20,
            taller: 10,
            zona_sensible: 30,
            fuera: 80
        };

        return speed - (limits[zone as keyof typeof limits] || 80);
    }

    /**
     * Calcula los KPIs basándose en los estados del vehículo
     */
    private calculateKPIs(vehicleStates: VehicleState[], stabilityEvents: any[]): AdvancedKPIData {
        const kpi: AdvancedKPIData = {
            // Inicializar todos los valores en 0
            tiempoEnParque: 0, tiempoEnTaller: 0, tiempoFueraParque: 0, tiempoEnZonaSensible: 0,
            tiempoEnParqueConRotativo: 0, tiempoEnParqueSinRotativo: 0,
            tiempoFueraParqueConRotativo: 0, tiempoFueraParqueSinRotativo: 0,
            tiempoEnTallerConRotativo: 0, tiempoEnTallerSinRotativo: 0,
            eventosCriticos: 0, eventosPeligrosos: 0, eventosModerados: 0, eventosLeves: 0,
            eventosCriticosEnParque: 0, eventosCriticosFueraParque: 0, eventosCriticosEnTaller: 0,
            eventosPeligrososEnParque: 0, eventosPeligrososFueraParque: 0, eventosPeligrososEnTaller: 0,
            tiempoExcediendoVelocidad: 0, tiempoExcediendoVelocidadEnParque: 0,
            tiempoExcediendoVelocidadFueraParque: 0, tiempoExcediendoVelocidadEnTaller: 0,
            maxVelocidadAlcanzada: 0, velocidadPromedio: 0,
            excesosVelocidadLeves: 0, excesosVelocidadModerados: 0, excesosVelocidadGraves: 0, excesosVelocidadMuyGraves: 0,
            totalPuntosGPS: vehicleStates.length, totalTiempo: 0, distanciaRecorrida: 0,
            tiempoEnMovimiento: 0, tiempoDetenido: 0,
            clave2Minutes: 0, clave5Minutes: 0, outOfParkMinutes: 0, timeInWorkshop: 0,
            eventsHigh: 0, eventsModerate: 0
        };

        if (vehicleStates.length === 0) {
            return kpi;
        }

        // Calcular tiempos por estado
        for (let i = 0; i < vehicleStates.length - 1; i++) {
            const current = vehicleStates[i];
            const next = vehicleStates[i + 1];
            const intervalMinutes = (next.timestamp.getTime() - current.timestamp.getTime()) / 60000;

            // Solo procesar intervalos de tiempo razonables (máximo 30 minutos)
            if (intervalMinutes > 30) {
                logger.warn(`[AdvancedKPI] Saltando intervalo de tiempo muy grande: ${intervalMinutes.toFixed(2)} minutos`);
                continue;
            }

            // Actualizar velocidades
            kpi.maxVelocidadAlcanzada = Math.max(kpi.maxVelocidadAlcanzada, current.speed);
            kpi.velocidadPromedio += current.speed;

            // Determinar si está en movimiento
            if (current.speed > 5) {
                kpi.tiempoEnMovimiento += intervalMinutes;
            } else {
                kpi.tiempoDetenido += intervalMinutes;
            }

            // Acumular tiempos por zona
            switch (current.zone) {
                case 'parque':
                    kpi.tiempoEnParque += intervalMinutes;
                    if (current.rotativo === 'ON') {
                        kpi.tiempoEnParqueConRotativo += intervalMinutes;
                    } else {
                        kpi.tiempoEnParqueSinRotativo += intervalMinutes;
                    }
                    if (current.speedExceeded) {
                        kpi.tiempoExcediendoVelocidadEnParque += intervalMinutes;
                    }
                    break;
                case 'taller':
                    kpi.tiempoEnTaller += intervalMinutes;
                    if (current.rotativo === 'ON') {
                        kpi.tiempoEnTallerConRotativo += intervalMinutes;
                    } else {
                        kpi.tiempoEnTallerSinRotativo += intervalMinutes;
                    }
                    if (current.speedExceeded) {
                        kpi.tiempoExcediendoVelocidadEnTaller += intervalMinutes;
                    }
                    break;
                case 'zona_sensible':
                    kpi.tiempoEnZonaSensible += intervalMinutes;
                    break;
                default:
                    kpi.tiempoFueraParque += intervalMinutes;
                    if (current.rotativo === 'ON') {
                        kpi.tiempoFueraParqueConRotativo += intervalMinutes;
                    } else {
                        kpi.tiempoFueraParqueSinRotativo += intervalMinutes;
                    }
                    if (current.speedExceeded) {
                        kpi.tiempoExcediendoVelocidadFueraParque += intervalMinutes;
                    }
                    break;
            }

            // Acumular excesos de velocidad
            if (current.speedExceeded && current.speedExceededBy !== undefined) {
                kpi.tiempoExcediendoVelocidad += intervalMinutes;

                if (current.speedExceededBy <= 10) kpi.excesosVelocidadLeves++;
                else if (current.speedExceededBy <= 20) kpi.excesosVelocidadModerados++;
                else if (current.speedExceededBy <= 30) kpi.excesosVelocidadGraves++;
                else kpi.excesosVelocidadMuyGraves++;
            }

            // Calcular distancia solo para intervalos razonables
            const distance = this.calculateDistance(
                current.lat, current.lon,
                next.lat, next.lon
            );

            // Solo sumar distancias razonables (máximo 10 km entre puntos)
            if (distance <= 10) {
                kpi.distanciaRecorrida += distance;
            } else {
                logger.warn(`[AdvancedKPI] Saltando distancia irreal: ${distance.toFixed(2)} km entre puntos consecutivos`);
            }
        }

        // Calcular velocidad promedio
        if (vehicleStates.length > 0) {
            kpi.velocidadPromedio = kpi.velocidadPromedio / vehicleStates.length;
        }

        // Calcular tiempo total
        kpi.totalTiempo = kpi.tiempoEnParque + kpi.tiempoEnTaller + kpi.tiempoFueraParque + kpi.tiempoEnZonaSensible;

        // Procesar eventos de estabilidad
        this.processStabilityEvents(stabilityEvents, kpi);

        // Calcular claves operativas
        kpi.clave2Minutes = kpi.tiempoFueraParqueConRotativo;
        kpi.clave5Minutes = kpi.tiempoFueraParqueSinRotativo;
        kpi.outOfParkMinutes = kpi.tiempoFueraParque;
        kpi.timeInWorkshop = kpi.tiempoEnTaller;
        kpi.eventsHigh = kpi.eventosCriticos + kpi.eventosPeligrosos;
        kpi.eventsModerate = kpi.eventosModerados;

        return kpi;
    }

    /**
     * Procesa eventos de estabilidad
     */
    private processStabilityEvents(stabilityEvents: any[], kpi: AdvancedKPIData) {
        for (const event of stabilityEvents) {
            switch (event.type) {
                case 'CRITICAL':
                    kpi.eventosCriticos++;
                    // Determinar ubicación del evento (simplificado)
                    kpi.eventosCriticosFueraParque++;
                    break;
                case 'DANGEROUS':
                    kpi.eventosPeligrosos++;
                    kpi.eventosPeligrososFueraParque++;
                    break;
                case 'MODERATE':
                    kpi.eventosModerados++;
                    break;
                case 'MINOR':
                    kpi.eventosLeves++;
                    break;
            }
        }
    }

    /**
     * Calcula la distancia entre dos puntos usando la fórmula de Haversine
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en km
    }

    /**
     * Convierte grados a radianes
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Almacena los datos de KPI en la base de datos
     */
    private async storeKPIData(vehicleId: string, date: Date, organizationId: string, kpiData: AdvancedKPIData) {
        const existingKPI = await prisma.advancedVehicleKPI.findFirst({
            where: { vehicleId, date }
        });

        const data = {
            vehicleId,
            date,
            organizationId,
            ...kpiData,
            calculatedAt: new Date(),
            isValid: true,
            calculationVersion: '1.0',
            updatedAt: new Date()
        };

        if (existingKPI) {
            await prisma.advancedVehicleKPI.update({
                where: { id: existingKPI.id },
                data
            });
            logger.info(`[AdvancedKPI] KPI actualizado para vehículo ${vehicleId} en fecha ${date.toISOString().split('T')[0]}`);
        } else {
            await prisma.advancedVehicleKPI.create({
                data: {
                    ...data,
                    createdAt: new Date()
                }
            });
            logger.info(`[AdvancedKPI] Nuevo KPI creado para vehículo ${vehicleId} en fecha ${date.toISOString().split('T')[0]}`);
        }
    }

    /**
     * Mapea los datos de la base de datos a la interfaz AdvancedKPIData
     */
    private mapToKPIData(kpi: any): AdvancedKPIData {
        return {
            tiempoEnParque: kpi.tiempoEnParque,
            tiempoEnTaller: kpi.tiempoEnTaller,
            tiempoFueraParque: kpi.tiempoFueraParque,
            tiempoEnZonaSensible: kpi.tiempoEnZonaSensible,
            tiempoEnParqueConRotativo: kpi.tiempoEnParqueConRotativo,
            tiempoEnParqueSinRotativo: kpi.tiempoEnParqueSinRotativo,
            tiempoFueraParqueConRotativo: kpi.tiempoFueraParqueConRotativo,
            tiempoFueraParqueSinRotativo: kpi.tiempoFueraParqueSinRotativo,
            tiempoEnTallerConRotativo: kpi.tiempoEnTallerConRotativo,
            tiempoEnTallerSinRotativo: kpi.tiempoEnTallerSinRotativo,
            eventosCriticos: kpi.eventosCriticos,
            eventosPeligrosos: kpi.eventosPeligrosos,
            eventosModerados: kpi.eventosModerados,
            eventosLeves: kpi.eventosLeves,
            eventosCriticosEnParque: kpi.eventosCriticosEnParque,
            eventosCriticosFueraParque: kpi.eventosCriticosFueraParque,
            eventosCriticosEnTaller: kpi.eventosCriticosEnTaller,
            eventosPeligrososEnParque: kpi.eventosPeligrososEnParque,
            eventosPeligrososFueraParque: kpi.eventosPeligrososFueraParque,
            eventosPeligrososEnTaller: kpi.eventosPeligrososEnTaller,
            tiempoExcediendoVelocidad: kpi.tiempoExcediendoVelocidad,
            tiempoExcediendoVelocidadEnParque: kpi.tiempoExcediendoVelocidadEnParque,
            tiempoExcediendoVelocidadFueraParque: kpi.tiempoExcediendoVelocidadFueraParque,
            tiempoExcediendoVelocidadEnTaller: kpi.tiempoExcediendoVelocidadEnTaller,
            maxVelocidadAlcanzada: Number(kpi.maxVelocidadAlcanzada),
            velocidadPromedio: Number(kpi.velocidadPromedio),
            excesosVelocidadLeves: kpi.excesosVelocidadLeves,
            excesosVelocidadModerados: kpi.excesosVelocidadModerados,
            excesosVelocidadGraves: kpi.excesosVelocidadGraves,
            excesosVelocidadMuyGraves: kpi.excesosVelocidadMuyGraves,
            totalPuntosGPS: kpi.totalPuntosGPS,
            totalTiempo: kpi.totalTiempo,
            distanciaRecorrida: Number(kpi.distanciaRecorrida),
            tiempoEnMovimiento: kpi.tiempoEnMovimiento,
            tiempoDetenido: kpi.tiempoDetenido,
            clave2Minutes: kpi.clave2Minutes,
            clave5Minutes: kpi.clave5Minutes,
            outOfParkMinutes: kpi.outOfParkMinutes,
            timeInWorkshop: kpi.timeInWorkshop,
            eventsHigh: kpi.eventsHigh,
            eventsModerate: kpi.eventsModerate
        };
    }

    /**
     * Retorna un KPI vacío
     */
    private getEmptyKPIData(): AdvancedKPIData {
        return {
            tiempoEnParque: 0, tiempoEnTaller: 0, tiempoFueraParque: 0, tiempoEnZonaSensible: 0,
            tiempoEnParqueConRotativo: 0, tiempoEnParqueSinRotativo: 0,
            tiempoFueraParqueConRotativo: 0, tiempoFueraParqueSinRotativo: 0,
            tiempoEnTallerConRotativo: 0, tiempoEnTallerSinRotativo: 0,
            eventosCriticos: 0, eventosPeligrosos: 0, eventosModerados: 0, eventosLeves: 0,
            eventosCriticosEnParque: 0, eventosCriticosFueraParque: 0, eventosCriticosEnTaller: 0,
            eventosPeligrososEnParque: 0, eventosPeligrososFueraParque: 0, eventosPeligrososEnTaller: 0,
            tiempoExcediendoVelocidad: 0, tiempoExcediendoVelocidadEnParque: 0,
            tiempoExcediendoVelocidadFueraParque: 0, tiempoExcediendoVelocidadEnTaller: 0,
            maxVelocidadAlcanzada: 0, velocidadPromedio: 0,
            excesosVelocidadLeves: 0, excesosVelocidadModerados: 0, excesosVelocidadGraves: 0, excesosVelocidadMuyGraves: 0,
            totalPuntosGPS: 0, totalTiempo: 0, distanciaRecorrida: 0,
            tiempoEnMovimiento: 0, tiempoDetenido: 0,
            clave2Minutes: 0, clave5Minutes: 0, outOfParkMinutes: 0, timeInWorkshop: 0,
            eventsHigh: 0, eventsModerate: 0
        };
    }
}