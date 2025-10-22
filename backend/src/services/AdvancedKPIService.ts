
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';



interface VehicleState {
    timestamp: Date;
    lat: number;
    lon: number;
    speed: number;
    rotativo: 'ON' | 'OFF';
    zone: 'parque' | 'taller' | 'fuera' | 'zona_sensible';
    zoneName?: string;
    speedLimit?: number;
    speedExceeded: boolean;
    speedExceededBy?: number;
}

interface AdvancedKPICalculationResult {
    // Estados básicos
    tiempoEnParque: number;
    tiempoEnTaller: number;
    tiempoFueraParque: number;
    tiempoEnZonaSensible: number;

    // Estados con rotativo
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
    excesosVelocidadLeves: number; // 1-10 km/h sobre límite
    excesosVelocidadModerados: number; // 11-20 km/h sobre límite
    excesosVelocidadGraves: number; // 21-30 km/h sobre límite
    excesosVelocidadMuyGraves: number; // >30 km/h sobre límite

    // Estadísticas adicionales
    totalPuntosGPS: number;
    totalTiempo: number;
    distanciaRecorrida: number;
    tiempoEnMovimiento: number;
    tiempoDetenido: number;

    // Claves operativas (compatibilidad)
    clave2Minutes: number; // Rotativo ON fuera de parque
    clave5Minutes: number; // Rotativo OFF fuera de parque
    outOfParkMinutes: number;
    timeInWorkshop: number;
    eventsHigh: number;
    eventsModerate: number;
}

export class AdvancedKPIService {

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
     * Calcula KPIs avanzados de un vehículo para una fecha específica
     * Ahora usa el nuevo sistema de cálculo y almacenamiento
     */
    async calculateAdvancedVehicleKPI(vehicleId: string, date: Date, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para vehículo ${vehicleId} en fecha ${date.toISOString().slice(0, 10)}`);

        try {
            // Importar el nuevo servicio de cálculo
            const { AdvancedKPICalculationService } = await import('./AdvancedKPICalculationService');
            const kpiService = new AdvancedKPICalculationService();

            // Usar el nuevo servicio para calcular y almacenar KPIs
            const kpiData = await kpiService.calculateAndStoreDailyKPIs(vehicleId, date, organizationId);

            // Convertir al formato esperado por el frontend
            const result = this.convertToAdvancedKPICalculationResult(kpiData);

            logger.info(`[AdvancedKPI] KPI avanzado calculado exitosamente para vehículo ${vehicleId}`);
            return result;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para vehículo ${vehicleId}:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados de un vehículo para un rango de fechas
     */
    async calculateAdvancedVehicleKPIRange(vehicleId: string, startDate: Date, endDate: Date, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para vehículo ${vehicleId} en rango ${startDate.toISOString().slice(0, 10)} - ${endDate.toISOString().slice(0, 10)}`);

        try {
            // 1. Obtener zonas de la organización
            const zones = await this.getZones(organizationId);
            logger.info(`[AdvancedKPI] Zonas encontradas: ${zones.length}`);

            // 2. Obtener sesiones del vehículo en el rango de fechas
            const sessions = await this.getSessionsInRange(vehicleId, startDate, endDate);
            logger.info(`[AdvancedKPI] Sesiones encontradas en rango: ${sessions.length}`);

            if (sessions.length === 0) {
                logger.info(`[AdvancedKPI] No hay sesiones para el vehículo ${vehicleId} en el rango especificado`);
                return this.getEmptyAdvancedKPI();
            }

            // 3. Obtener datos de todas las sesiones
            const sessionData = await this.getSessionData(sessions.map(s => s.id));
            logger.info(`[AdvancedKPI] Datos obtenidos: GPS=${sessionData.gpsPoints.length}, Rotativo=${sessionData.rotativoEvents.length}, Estabilidad=${sessionData.stabilityEvents.length}`);

            // 4. Calcular estados del vehículo
            const vehicleStates = this.calculateVehicleStates(sessionData, zones);
            logger.info(`[AdvancedKPI] Estados calculados: ${vehicleStates.length}`);

            // 5. Calcular KPIs avanzados agregados
            const kpiResult = this.calculateAdvancedKPIs(vehicleStates, sessionData.stabilityEvents);

            // 6. Agregar información del rango
            kpiResult.totalTiempo = this.calculateTotalTimeInRange(startDate, endDate, kpiResult.totalTiempo);

            logger.info(`[AdvancedKPI] KPI avanzado calculado exitosamente para vehículo ${vehicleId} en rango`);
            return kpiResult;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para vehículo ${vehicleId} en rango:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados de un vehículo para todo el tiempo
     */
    async calculateAdvancedVehicleKPIAllTime(vehicleId: string, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para vehículo ${vehicleId} - todo el tiempo`);

        try {
            // 1. Obtener zonas de la organización
            const zones = await this.getZones(organizationId);
            logger.info(`[AdvancedKPI] Zonas encontradas: ${zones.length}`);

            // 2. Obtener todas las sesiones del vehículo
            const sessions = await this.getAllSessions(vehicleId);
            logger.info(`[AdvancedKPI] Total de sesiones encontradas: ${sessions.length}`);

            if (sessions.length === 0) {
                logger.info(`[AdvancedKPI] No hay sesiones para el vehículo ${vehicleId}`);
                return this.getEmptyAdvancedKPI();
            }

            // 3. Obtener datos de todas las sesiones
            const sessionData = await this.getSessionData(sessions.map(s => s.id));
            logger.info(`[AdvancedKPI] Datos obtenidos: GPS=${sessionData.gpsPoints.length}, Rotativo=${sessionData.rotativoEvents.length}, Estabilidad=${sessionData.stabilityEvents.length}`);

            // 4. Calcular estados del vehículo
            const vehicleStates = this.calculateVehicleStates(sessionData, zones);
            logger.info(`[AdvancedKPI] Estados calculados: ${vehicleStates.length}`);

            // 5. Calcular KPIs avanzados agregados
            const kpiResult = this.calculateAdvancedKPIs(vehicleStates, sessionData.stabilityEvents);

            // 6. Calcular estadísticas adicionales para todo el tiempo
            kpiResult.totalTiempo = this.calculateTotalTimeAllTime(sessions, kpiResult.totalTiempo);

            logger.info(`[AdvancedKPI] KPI avanzado calculado exitosamente para vehículo ${vehicleId} - todo el tiempo`);
            return kpiResult;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para vehículo ${vehicleId} - todo el tiempo:`, error);
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

        logger.info(`[AdvancedKPI] Zonas encontradas: ${zones.length}`, zones.map(z => ({ name: z.name, type: z.type })));
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

        logger.info(`[AdvancedKPI] Sesiones encontradas: ${sessions.length}`);
        return sessions;
    }

    /**
     * Obtiene las sesiones de un vehículo en un rango de fechas
     */
    private async getSessionsInRange(vehicleId: string, startDate: Date, endDate: Date) {
        const startOfRange = new Date(startDate);
        startOfRange.setHours(0, 0, 0, 0);
        const endOfRange = new Date(endDate);
        endOfRange.setHours(23, 59, 59, 999);

        const sessions = await prisma.session.findMany({
            where: {
                vehicleId,
                startTime: { gte: startOfRange, lte: endOfRange }
            },
            select: { id: true, startTime: true, endTime: true }
        });

        logger.info(`[AdvancedKPI] Sesiones encontradas en rango: ${sessions.length}`);
        return sessions;
    }

    /**
     * Obtiene todas las sesiones de un vehículo
     */
    private async getAllSessions(vehicleId: string) {
        const sessions = await prisma.session.findMany({
            where: { vehicleId },
            select: { id: true, startTime: true, endTime: true },
            orderBy: { startTime: 'asc' }
        });

        logger.info(`[AdvancedKPI] Total de sesiones encontradas: ${sessions.length}`);
        return sessions;
    }

    /**
     * Obtiene todos los datos necesarios de las sesiones
     */
    private async getSessionData(sessionIds: string[]) {
        const [gpsPoints, rotativoEvents, stabilityEvents, canMeasurements] = await Promise.all([
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
            }),
            prisma.canMeasurement.findMany({
                where: { sessionId: { in: sessionIds } },
                orderBy: { timestamp: 'asc' }
            })
        ]);

        logger.info(`[AdvancedKPI] Datos obtenidos: GPS=${gpsPoints.length}, Rotativo=${rotativoEvents.length}, Estabilidad=${stabilityEvents.length}, CAN=${canMeasurements.length}`);

        return { gpsPoints, rotativoEvents, stabilityEvents, canMeasurements };
    }

    /**
     * Calcula los estados del vehículo en cada punto GPS
     */
    private calculateVehicleStates(sessionData: any, zones: any[]): VehicleState[] {
        const { gpsPoints, rotativoEvents, canMeasurements } = sessionData;
        const states: VehicleState[] = [];

        for (const gpsPoint of gpsPoints) {
            const rotativo = this.getRotativoState(gpsPoint.timestamp, rotativoEvents);
            const zone = this.getZoneForPoint(gpsPoint.latitude, gpsPoint.longitude, zones);
            const speed = gpsPoint.speed || 0;

            // Determinar límite de velocidad según zona
            let speedLimit = 50; // Por defecto
            if (zone?.type === 'parque') speedLimit = 20;
            else if (zone?.type === 'taller') speedLimit = 10;
            else if (zone?.type === 'zona_sensible') speedLimit = 30;

            const speedExceeded = speed > speedLimit;
            const speedExceededBy = speedExceeded ? speed - speedLimit : 0;

            states.push({
                timestamp: gpsPoint.timestamp,
                lat: gpsPoint.latitude,
                lon: gpsPoint.longitude,
                speed,
                rotativo,
                zone: zone?.type || 'fuera',
                zoneName: zone?.name,
                speedLimit,
                speedExceeded,
                speedExceededBy
            });
        }

        return states;
    }

    /**
     * Valida y corrige datos irrealistas
     */
    private validateAndCorrectData(result: AdvancedKPICalculationResult): AdvancedKPICalculationResult {
        // Límites realistas para validación
        const MAX_REALISTIC_SPEED = 200; // km/h - velocidad máxima realista
        const MAX_REALISTIC_DISTANCE_PER_DAY = 1000; // km - distancia máxima realista por día
        const MAX_REALISTIC_TIME_PER_DAY = 24 * 60; // minutos - tiempo máximo por día

        // Corregir velocidad máxima irrealista
        if (result.maxVelocidadAlcanzada > MAX_REALISTIC_SPEED) {
            logger.warn(`[AdvancedKPI] Velocidad máxima irrealista detectada: ${result.maxVelocidadAlcanzada} km/h, limitando a ${MAX_REALISTIC_SPEED} km/h`);
            result.maxVelocidadAlcanzada = MAX_REALISTIC_SPEED;
        }

        // Corregir velocidad promedio irrealista
        if (result.velocidadPromedio > MAX_REALISTIC_SPEED) {
            logger.warn(`[AdvancedKPI] Velocidad promedio irrealista detectada: ${result.velocidadPromedio} km/h, limitando a ${MAX_REALISTIC_SPEED} km/h`);
            result.velocidadPromedio = MAX_REALISTIC_SPEED;
        }

        // Corregir distancia irrealista
        if (result.distanciaRecorrida > MAX_REALISTIC_DISTANCE_PER_DAY) {
            logger.warn(`[AdvancedKPI] Distancia irrealista detectada: ${result.distanciaRecorrida} km, limitando a ${MAX_REALISTIC_DISTANCE_PER_DAY} km`);
            result.distanciaRecorrida = MAX_REALISTIC_DISTANCE_PER_DAY;
        }

        // Corregir tiempo total irrealista
        if (result.totalTiempo > MAX_REALISTIC_TIME_PER_DAY) {
            logger.warn(`[AdvancedKPI] Tiempo total irrealista detectado: ${result.totalTiempo} min, limitando a ${MAX_REALISTIC_TIME_PER_DAY} min`);
            result.totalTiempo = MAX_REALISTIC_TIME_PER_DAY;
        }

        // Validar coherencia de datos
        const tiempoTotalCalculado = result.tiempoEnParque + result.tiempoEnTaller + result.tiempoFueraParque + result.tiempoEnZonaSensible;
        if (Math.abs(tiempoTotalCalculado - result.totalTiempo) > 1) {
            logger.warn(`[AdvancedKPI] Inconsistencia en tiempo total detectada: calculado=${tiempoTotalCalculado}, reportado=${result.totalTiempo}`);
            result.totalTiempo = tiempoTotalCalculado;
        }

        return result;
    }

    /**
     * Calcula los KPIs avanzados basándose en los estados del vehículo
     */
    private calculateAdvancedKPIs(vehicleStates: VehicleState[], stabilityEvents: any[]): AdvancedKPICalculationResult {
        let tiempoEnParque = 0, tiempoEnTaller = 0, tiempoFueraParque = 0, tiempoEnZonaSensible = 0;
        let tiempoEnParqueConRotativo = 0, tiempoEnParqueSinRotativo = 0;
        let tiempoFueraParqueConRotativo = 0, tiempoFueraParqueSinRotativo = 0;
        let tiempoEnTallerConRotativo = 0, tiempoEnTallerSinRotativo = 0;
        let tiempoExcediendoVelocidad = 0, tiempoExcediendoVelocidadEnParque = 0;
        let tiempoExcediendoVelocidadFueraParque = 0, tiempoExcediendoVelocidadEnTaller = 0;
        let excesosVelocidadLeves = 0, excesosVelocidadModerados = 0;
        let excesosVelocidadGraves = 0, excesosVelocidadMuyGraves = 0;
        let maxVelocidadAlcanzada = 0, velocidadPromedio = 0;
        let tiempoEnMovimiento = 0, tiempoDetenido = 0;
        let distanciaRecorrida = 0;

        // Calcular tiempos por estado
        if (vehicleStates.length > 1) {
            for (let i = 0; i < vehicleStates.length - 1; i++) {
                const current = vehicleStates[i];
                const next = vehicleStates[i + 1];
                const intervalo = (next.timestamp.getTime() - current.timestamp.getTime()) / 60000; // minutos

                // Acumular velocidades
                maxVelocidadAlcanzada = Math.max(maxVelocidadAlcanzada, current.speed);
                velocidadPromedio += current.speed;

                // Determinar si está en movimiento
                if (current.speed > 5) {
                    tiempoEnMovimiento += intervalo;
                } else {
                    tiempoDetenido += intervalo;
                }

                // Acumular tiempos por zona
                switch (current.zone) {
                    case 'parque':
                        tiempoEnParque += intervalo;
                        if (current.rotativo === 'ON') {
                            tiempoEnParqueConRotativo += intervalo;
                        } else {
                            tiempoEnParqueSinRotativo += intervalo;
                        }
                        if (current.speedExceeded) {
                            tiempoExcediendoVelocidadEnParque += intervalo;
                        }
                        break;
                    case 'taller':
                        tiempoEnTaller += intervalo;
                        if (current.rotativo === 'ON') {
                            tiempoEnTallerConRotativo += intervalo;
                        } else {
                            tiempoEnTallerSinRotativo += intervalo;
                        }
                        if (current.speedExceeded) {
                            tiempoExcediendoVelocidadEnTaller += intervalo;
                        }
                        break;
                    case 'zona_sensible':
                        tiempoEnZonaSensible += intervalo;
                        break;
                    default:
                        tiempoFueraParque += intervalo;
                        if (current.rotativo === 'ON') {
                            tiempoFueraParqueConRotativo += intervalo;
                        } else {
                            tiempoFueraParqueSinRotativo += intervalo;
                        }
                        if (current.speedExceeded) {
                            tiempoExcediendoVelocidadFueraParque += intervalo;
                        }
                        break;
                }

                // Acumular excesos de velocidad
                if (current.speedExceeded && current.speedExceededBy !== undefined) {
                    tiempoExcediendoVelocidad += intervalo;

                    if (current.speedExceededBy <= 10) excesosVelocidadLeves++;
                    else if (current.speedExceededBy <= 20) excesosVelocidadModerados++;
                    else if (current.speedExceededBy <= 30) excesosVelocidadGraves++;
                    else excesosVelocidadMuyGraves++;
                }

                // Calcular distancia usando fórmula de Haversine
                const distance = this.calculateDistance(
                    current.lat, current.lon,
                    next.lat, next.lon
                );
                distanciaRecorrida += distance;
            }
        }

        // Calcular velocidad promedio
        velocidadPromedio = vehicleStates.length > 0 ? velocidadPromedio / vehicleStates.length : 0;

        // Calcular eventos por tipo y ubicación
        const eventStats = this.calculateEventStatistics(stabilityEvents, vehicleStates);

        const result: AdvancedKPICalculationResult = {
            // Estados básicos
            tiempoEnParque: Math.round(tiempoEnParque * 100) / 100,
            tiempoEnTaller: Math.round(tiempoEnTaller * 100) / 100,
            tiempoFueraParque: Math.round(tiempoFueraParque * 100) / 100,
            tiempoEnZonaSensible: Math.round(tiempoEnZonaSensible * 100) / 100,

            // Estados con rotativo
            tiempoEnParqueConRotativo: Math.round(tiempoEnParqueConRotativo * 100) / 100,
            tiempoEnParqueSinRotativo: Math.round(tiempoEnParqueSinRotativo * 100) / 100,
            tiempoFueraParqueConRotativo: Math.round(tiempoFueraParqueConRotativo * 100) / 100,
            tiempoFueraParqueSinRotativo: Math.round(tiempoFueraParqueSinRotativo * 100) / 100,
            tiempoEnTallerConRotativo: Math.round(tiempoEnTallerConRotativo * 100) / 100,
            tiempoEnTallerSinRotativo: Math.round(tiempoEnTallerSinRotativo * 100) / 100,

            // Eventos por tipo
            eventosCriticos: eventStats.eventosCriticos,
            eventosPeligrosos: eventStats.eventosPeligrosos,
            eventosModerados: eventStats.eventosModerados,
            eventosLeves: eventStats.eventosLeves,

            // Eventos por ubicación
            eventosCriticosEnParque: eventStats.eventosCriticosEnParque,
            eventosCriticosFueraParque: eventStats.eventosCriticosFueraParque,
            eventosCriticosEnTaller: eventStats.eventosCriticosEnTaller,
            eventosPeligrososEnParque: eventStats.eventosPeligrososEnParque,
            eventosPeligrososFueraParque: eventStats.eventosPeligrososFueraParque,
            eventosPeligrososEnTaller: eventStats.eventosPeligrososEnTaller,

            // Velocidad
            tiempoExcediendoVelocidad: Math.round(tiempoExcediendoVelocidad * 100) / 100,
            tiempoExcediendoVelocidadEnParque: Math.round(tiempoExcediendoVelocidadEnParque * 100) / 100,
            tiempoExcediendoVelocidadFueraParque: Math.round(tiempoExcediendoVelocidadFueraParque * 100) / 100,
            tiempoExcediendoVelocidadEnTaller: Math.round(tiempoExcediendoVelocidadEnTaller * 100) / 100,
            maxVelocidadAlcanzada: Math.round(maxVelocidadAlcanzada * 10) / 10,
            velocidadPromedio: Math.round(velocidadPromedio * 10) / 10,

            // Detalles de velocidad
            excesosVelocidadLeves,
            excesosVelocidadModerados,
            excesosVelocidadGraves,
            excesosVelocidadMuyGraves,

            // Estadísticas adicionales
            totalPuntosGPS: vehicleStates.length,
            totalTiempo: Math.round((tiempoEnParque + tiempoEnTaller + tiempoFueraParque + tiempoEnZonaSensible) * 100) / 100,
            distanciaRecorrida: Math.round(distanciaRecorrida * 100) / 100,
            tiempoEnMovimiento: Math.round(tiempoEnMovimiento * 100) / 100,
            tiempoDetenido: Math.round(tiempoDetenido * 100) / 100,

            // Claves operativas (compatibilidad)
            clave2Minutes: Math.round(tiempoFueraParqueConRotativo * 100) / 100,
            clave5Minutes: Math.round(tiempoFueraParqueSinRotativo * 100) / 100,
            outOfParkMinutes: Math.round(tiempoFueraParque * 100) / 100,
            timeInWorkshop: Math.round(tiempoEnTaller * 100) / 100,
            eventsHigh: eventStats.eventosCriticos + eventStats.eventosPeligrosos,
            eventsModerate: eventStats.eventosModerados
        };

        logger.info(`[AdvancedKPI] KPIs avanzados calculados:`, {
            tiempoEnParque: result.tiempoEnParque,
            tiempoEnTaller: result.tiempoEnTaller,
            tiempoFueraParque: result.tiempoFueraParque,
            eventosCriticos: result.eventosCriticos,
            eventosPeligrosos: result.eventosPeligrosos,
            maxVelocidadAlcanzada: result.maxVelocidadAlcanzada
        });

        // Aplicar validación y corrección de datos
        const validatedResult = this.validateAndCorrectData(result);

        return validatedResult;
    }

    /**
     * Calcula estadísticas de eventos por tipo y ubicación
     */
    private calculateEventStatistics(stabilityEvents: any[], vehicleStates: VehicleState[]) {
        let eventosCriticos = 0, eventosPeligrosos = 0, eventosModerados = 0, eventosLeves = 0;
        let eventosCriticosEnParque = 0, eventosCriticosFueraParque = 0, eventosCriticosEnTaller = 0;
        let eventosPeligrososEnParque = 0, eventosPeligrososFueraParque = 0, eventosPeligrososEnTaller = 0;

        for (const event of stabilityEvents) {
            const type = (event.type || '').toString().toLowerCase();
            const severity = this.getEventSeverity(type);

            // Contar por severidad
            switch (severity) {
                case 'critico':
                    eventosCriticos++;
                    break;
                case 'peligroso':
                    eventosPeligrosos++;
                    break;
                case 'moderado':
                    eventosModerados++;
                    break;
                case 'leve':
                    eventosLeves++;
                    break;
            }

            // Contar por ubicación
            const eventState = this.getVehicleStateAtTime(event.timestamp, vehicleStates);
            if (eventState) {
                switch (severity) {
                    case 'critico':
                        switch (eventState.zone) {
                            case 'parque':
                                eventosCriticosEnParque++;
                                break;
                            case 'taller':
                                eventosCriticosEnTaller++;
                                break;
                            default:
                                eventosCriticosFueraParque++;
                                break;
                        }
                        break;
                    case 'peligroso':
                        switch (eventState.zone) {
                            case 'parque':
                                eventosPeligrososEnParque++;
                                break;
                            case 'taller':
                                eventosPeligrososEnTaller++;
                                break;
                            default:
                                eventosPeligrososFueraParque++;
                                break;
                        }
                        break;
                }
            }
        }

        return {
            eventosCriticos,
            eventosPeligrosos,
            eventosModerados,
            eventosLeves,
            eventosCriticosEnParque,
            eventosCriticosFueraParque,
            eventosCriticosEnTaller,
            eventosPeligrososEnParque,
            eventosPeligrososFueraParque,
            eventosPeligrososEnTaller
        };
    }

    /**
     * Determina la severidad de un evento
     */
    private getEventSeverity(type: string): 'critico' | 'peligroso' | 'moderado' | 'leve' {
        if (type.includes('curva_brusca') || type.includes('punto_interes') || type.includes('critico')) {
            return 'critico';
        } else if (type.includes('peligroso') || type.includes('danger') || type.includes('high')) {
            return 'peligroso';
        } else if (type.includes('moderado') || type.includes('warning') || type.includes('moderate')) {
            return 'moderado';
        } else {
            return 'leve';
        }
    }

    /**
     * Obtiene el estado del vehículo en un momento específico
     */
    private getVehicleStateAtTime(timestamp: Date, vehicleStates: VehicleState[]): VehicleState | null {
        for (let i = vehicleStates.length - 1; i >= 0; i--) {
            if (vehicleStates[i].timestamp <= timestamp) {
                return vehicleStates[i];
            }
        }
        return vehicleStates[0] || null;
    }

    /**
     * Determina la zona para un punto GPS
     */
    private getZoneForPoint(lat: number, lon: number, zones: any[]): any | null {
        for (const zone of zones) {
            if (!zone.geometry || !zone.geometry.coordinates) continue;

            try {
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
                logger.warn(`[AdvancedKPI] Error verificando zona ${zone.id}:`, error);
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
     * Guarda el KPI avanzado en la base de datos
     */
    private async saveAdvancedVehicleKPI(vehicleId: string, date: Date, kpiData: AdvancedKPICalculationResult) {
        // Por ahora guardamos en VehicleKPI para compatibilidad
        // En el futuro se podría crear una tabla AdvancedVehicleKPI
        const existingKPI = await prisma.vehicleKPI.findFirst({
            where: { vehicleId, date }
        });

        const basicKPI = {
            clave2Minutes: kpiData.clave2Minutes,
            clave5Minutes: kpiData.clave5Minutes,
            outOfParkMinutes: kpiData.outOfParkMinutes,
            timeInWorkshop: kpiData.timeInWorkshop,
            eventsHigh: kpiData.eventsHigh,
            eventsModerate: kpiData.eventsModerate,
            updatedAt: new Date()
        };

        if (existingKPI) {
            await prisma.vehicleKPI.update({
                where: { id: existingKPI.id },
                data: basicKPI
            });
            logger.info(`[AdvancedKPI] KPI básico actualizado para vehículo ${vehicleId}`);
        } else {
            await prisma.vehicleKPI.create({
                data: {
                    vehicleId,
                    date,
                    ...basicKPI,
                    createdAt: new Date()
                }
            });
            logger.info(`[AdvancedKPI] Nuevo KPI básico creado para vehículo ${vehicleId}`);
        }

        // TODO: Guardar datos avanzados en tabla separada
        logger.info(`[AdvancedKPI] Datos avanzados calculados para vehículo ${vehicleId}:`, {
            tiempoEnParque: kpiData.tiempoEnParque,
            tiempoEnTaller: kpiData.tiempoEnTaller,
            tiempoFueraParque: kpiData.tiempoFueraParque,
            eventosCriticos: kpiData.eventosCriticos,
            eventosPeligrosos: kpiData.eventosPeligrosos,
            maxVelocidadAlcanzada: kpiData.maxVelocidadAlcanzada
        });
    }

    /**
     * Retorna un KPI avanzado vacío
     */
    private getEmptyAdvancedKPI(): AdvancedKPICalculationResult {
        return {
            tiempoEnParque: 0,
            tiempoEnTaller: 0,
            tiempoFueraParque: 0,
            tiempoEnZonaSensible: 0,
            tiempoEnParqueConRotativo: 0,
            tiempoEnParqueSinRotativo: 0,
            tiempoFueraParqueConRotativo: 0,
            tiempoFueraParqueSinRotativo: 0,
            tiempoEnTallerConRotativo: 0,
            tiempoEnTallerSinRotativo: 0,
            eventosCriticos: 0,
            eventosPeligrosos: 0,
            eventosModerados: 0,
            eventosLeves: 0,
            eventosCriticosEnParque: 0,
            eventosCriticosFueraParque: 0,
            eventosCriticosEnTaller: 0,
            eventosPeligrososEnParque: 0,
            eventosPeligrososFueraParque: 0,
            eventosPeligrososEnTaller: 0,
            tiempoExcediendoVelocidad: 0,
            tiempoExcediendoVelocidadEnParque: 0,
            tiempoExcediendoVelocidadFueraParque: 0,
            tiempoExcediendoVelocidadEnTaller: 0,
            maxVelocidadAlcanzada: 0,
            velocidadPromedio: 0,
            excesosVelocidadLeves: 0,
            excesosVelocidadModerados: 0,
            excesosVelocidadGraves: 0,
            excesosVelocidadMuyGraves: 0,
            totalPuntosGPS: 0,
            totalTiempo: 0,
            distanciaRecorrida: 0,
            tiempoEnMovimiento: 0,
            tiempoDetenido: 0,
            clave2Minutes: 0,
            clave5Minutes: 0,
            outOfParkMinutes: 0,
            timeInWorkshop: 0,
            eventsHigh: 0,
            eventsModerate: 0
        };
    }

    /**
     * Calcula el tiempo total en un rango de fechas
     */
    private calculateTotalTimeInRange(startDate: Date, endDate: Date, calculatedTime: number): number {
        const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const maxTimeInRange = daysInRange * 24 * 60; // minutos

        // Si el tiempo calculado es mayor al máximo posible en el rango, usar el máximo
        return Math.min(calculatedTime, maxTimeInRange);
    }

    /**
     * Calcula el tiempo total para todo el tiempo
     */
    private calculateTotalTimeAllTime(sessions: any[], calculatedTime: number): number {
        if (sessions.length === 0) return 0;

        // Calcular el tiempo total basado en las sesiones reales
        let totalSessionTime = 0;
        for (const session of sessions) {
            if (session.startTime && session.endTime) {
                const sessionDuration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60); // minutos
                totalSessionTime += sessionDuration;
            }
        }

        // Usar el menor entre el tiempo calculado y el tiempo real de sesiones
        return Math.min(calculatedTime, totalSessionTime);
    }

    /**
     * Calcula KPIs avanzados para múltiples vehículos en una fecha específica
     */
    async calculateAdvancedMultipleVehiclesKPI(vehicleIds: string[], date: Date, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para múltiples vehículos en fecha ${date.toISOString().slice(0, 10)}`);

        try {
            const allKPIs: AdvancedKPICalculationResult[] = [];

            // Calcular KPIs para cada vehículo
            for (const vehicleId of vehicleIds) {
                const kpi = await this.calculateAdvancedVehicleKPI(vehicleId, date, organizationId);
                allKPIs.push(kpi);
            }

            // Agregar todos los KPIs
            const aggregatedKPI = this.aggregateMultipleVehicleKPIs(allKPIs);

            logger.info(`[AdvancedKPI] KPI avanzado calculado exitosamente para ${vehicleIds.length} vehículos`);
            return aggregatedKPI;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para múltiples vehículos:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados para múltiples vehículos en un rango de fechas
     */
    async calculateAdvancedMultipleVehiclesKPIRange(vehicleIds: string[], startDate: Date, endDate: Date, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para múltiples vehículos en rango ${startDate.toISOString().slice(0, 10)} - ${endDate.toISOString().slice(0, 10)}`);

        try {
            const allKPIs: AdvancedKPICalculationResult[] = [];

            // Calcular KPIs para cada vehículo
            for (const vehicleId of vehicleIds) {
                const kpi = await this.calculateAdvancedVehicleKPIRange(vehicleId, startDate, endDate, organizationId);
                allKPIs.push(kpi);
            }

            // Agregar todos los KPIs
            const aggregatedKPI = this.aggregateMultipleVehicleKPIs(allKPIs);

            logger.info(`[AdvancedKPI] KPI avanzado calculado exitosamente para ${vehicleIds.length} vehículos en rango`);
            return aggregatedKPI;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para múltiples vehículos en rango:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados para múltiples vehículos para todo el tiempo
     */
    async calculateAdvancedMultipleVehiclesKPIAllTime(vehicleIds: string[], organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para múltiples vehículos - todo el tiempo`);

        try {
            const allKPIs: AdvancedKPICalculationResult[] = [];

            // Calcular KPIs para cada vehículo
            for (const vehicleId of vehicleIds) {
                const kpi = await this.calculateAdvancedVehicleKPIAllTime(vehicleId, organizationId);
                allKPIs.push(kpi);
            }

            // Agregar todos los KPIs
            const aggregatedKPI = this.aggregateMultipleVehicleKPIs(allKPIs);

            logger.info(`[AdvancedKPI] KPI avanzado calculado exitosamente para ${vehicleIds.length} vehículos - todo el tiempo`);
            return aggregatedKPI;

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para múltiples vehículos - todo el tiempo:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados para todos los vehículos en una fecha específica
     */
    async calculateAdvancedAllVehiclesKPI(date: Date, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para todos los vehículos en fecha ${date.toISOString().slice(0, 10)}`);

        try {
            // Obtener todos los vehículos de la organización
            const vehicles = await this.getAllVehicles(organizationId);
            const vehicleIds = vehicles.map(v => v.id);

            return await this.calculateAdvancedMultipleVehiclesKPI(vehicleIds, date, organizationId);

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para todos los vehículos:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados para todos los vehículos en un rango de fechas
     */
    async calculateAdvancedAllVehiclesKPIRange(startDate: Date, endDate: Date, organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para todos los vehículos en rango ${startDate.toISOString().slice(0, 10)} - ${endDate.toISOString().slice(0, 10)}`);

        try {
            // Obtener todos los vehículos de la organización
            const vehicles = await this.getAllVehicles(organizationId);
            const vehicleIds = vehicles.map(v => v.id);

            return await this.calculateAdvancedMultipleVehiclesKPIRange(vehicleIds, startDate, endDate, organizationId);

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para todos los vehículos en rango:`, error);
            throw error;
        }
    }

    /**
     * Calcula KPIs avanzados para todos los vehículos para todo el tiempo
     */
    async calculateAdvancedAllVehiclesKPIAllTime(organizationId: string): Promise<AdvancedKPICalculationResult> {
        logger.info(`[AdvancedKPI] Iniciando cálculo avanzado para todos los vehículos - todo el tiempo`);

        try {
            // Obtener todos los vehículos de la organización
            const vehicles = await this.getAllVehicles(organizationId);
            const vehicleIds = vehicles.map(v => v.id);

            return await this.calculateAdvancedMultipleVehiclesKPIAllTime(vehicleIds, organizationId);

        } catch (error) {
            logger.error(`[AdvancedKPI] Error calculando KPI avanzado para todos los vehículos - todo el tiempo:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todos los vehículos de una organización
     */
    private async getAllVehicles(organizationId: string) {
        const vehicles = await prisma.vehicle.findMany({
            where: { organizationId },
            select: { id: true, name: true }
        });

        logger.info(`[AdvancedKPI] Vehículos encontrados: ${vehicles.length}`);
        return vehicles;
    }

    /**
     * Agrega KPIs de múltiples vehículos
     */
    private aggregateMultipleVehicleKPIs(kpis: AdvancedKPICalculationResult[]): AdvancedKPICalculationResult {
        if (kpis.length === 0) {
            return this.getEmptyAdvancedKPI();
        }

        if (kpis.length === 1) {
            return kpis[0];
        }

        // Agregar todos los valores
        const aggregated: AdvancedKPICalculationResult = {
            // Estados básicos
            tiempoEnParque: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnParque, 0),
            tiempoEnTaller: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnTaller, 0),
            tiempoFueraParque: kpis.reduce((sum, kpi) => sum + kpi.tiempoFueraParque, 0),
            tiempoEnZonaSensible: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnZonaSensible, 0),

            // Estados con rotativo
            tiempoEnParqueConRotativo: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnParqueConRotativo, 0),
            tiempoEnParqueSinRotativo: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnParqueSinRotativo, 0),
            tiempoFueraParqueConRotativo: kpis.reduce((sum, kpi) => sum + kpi.tiempoFueraParqueConRotativo, 0),
            tiempoFueraParqueSinRotativo: kpis.reduce((sum, kpi) => sum + kpi.tiempoFueraParqueSinRotativo, 0),
            tiempoEnTallerConRotativo: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnTallerConRotativo, 0),
            tiempoEnTallerSinRotativo: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnTallerSinRotativo, 0),

            // Eventos por tipo
            eventosCriticos: kpis.reduce((sum, kpi) => sum + kpi.eventosCriticos, 0),
            eventosPeligrosos: kpis.reduce((sum, kpi) => sum + kpi.eventosPeligrosos, 0),
            eventosModerados: kpis.reduce((sum, kpi) => sum + kpi.eventosModerados, 0),
            eventosLeves: kpis.reduce((sum, kpi) => sum + kpi.eventosLeves, 0),

            // Eventos por ubicación
            eventosCriticosEnParque: kpis.reduce((sum, kpi) => sum + kpi.eventosCriticosEnParque, 0),
            eventosCriticosFueraParque: kpis.reduce((sum, kpi) => sum + kpi.eventosCriticosFueraParque, 0),
            eventosCriticosEnTaller: kpis.reduce((sum, kpi) => sum + kpi.eventosCriticosEnTaller, 0),
            eventosPeligrososEnParque: kpis.reduce((sum, kpi) => sum + kpi.eventosPeligrososEnParque, 0),
            eventosPeligrososFueraParque: kpis.reduce((sum, kpi) => sum + kpi.eventosPeligrososFueraParque, 0),
            eventosPeligrososEnTaller: kpis.reduce((sum, kpi) => sum + kpi.eventosPeligrososEnTaller, 0),

            // Velocidad
            tiempoExcediendoVelocidad: kpis.reduce((sum, kpi) => sum + kpi.tiempoExcediendoVelocidad, 0),
            tiempoExcediendoVelocidadEnParque: kpis.reduce((sum, kpi) => sum + kpi.tiempoExcediendoVelocidadEnParque, 0),
            tiempoExcediendoVelocidadFueraParque: kpis.reduce((sum, kpi) => sum + kpi.tiempoExcediendoVelocidadFueraParque, 0),
            tiempoExcediendoVelocidadEnTaller: kpis.reduce((sum, kpi) => sum + kpi.tiempoExcediendoVelocidadEnTaller, 0),
            maxVelocidadAlcanzada: Math.max(...kpis.map(kpi => kpi.maxVelocidadAlcanzada)),
            velocidadPromedio: kpis.reduce((sum, kpi) => sum + kpi.velocidadPromedio, 0) / kpis.length,

            // Detalles de velocidad
            excesosVelocidadLeves: kpis.reduce((sum, kpi) => sum + kpi.excesosVelocidadLeves, 0),
            excesosVelocidadModerados: kpis.reduce((sum, kpi) => sum + kpi.excesosVelocidadModerados, 0),
            excesosVelocidadGraves: kpis.reduce((sum, kpi) => sum + kpi.excesosVelocidadGraves, 0),
            excesosVelocidadMuyGraves: kpis.reduce((sum, kpi) => sum + kpi.excesosVelocidadMuyGraves, 0),

            // Estadísticas adicionales
            totalPuntosGPS: kpis.reduce((sum, kpi) => sum + kpi.totalPuntosGPS, 0),
            totalTiempo: kpis.reduce((sum, kpi) => sum + kpi.totalTiempo, 0),
            distanciaRecorrida: kpis.reduce((sum, kpi) => sum + kpi.distanciaRecorrida, 0),
            tiempoEnMovimiento: kpis.reduce((sum, kpi) => sum + kpi.tiempoEnMovimiento, 0),
            tiempoDetenido: kpis.reduce((sum, kpi) => sum + kpi.tiempoDetenido, 0),

            // Claves operativas (compatibilidad)
            clave2Minutes: kpis.reduce((sum, kpi) => sum + kpi.clave2Minutes, 0),
            clave5Minutes: kpis.reduce((sum, kpi) => sum + kpi.clave5Minutes, 0),
            outOfParkMinutes: kpis.reduce((sum, kpi) => sum + kpi.outOfParkMinutes, 0),
            timeInWorkshop: kpis.reduce((sum, kpi) => sum + kpi.timeInWorkshop, 0),
            eventsHigh: kpis.reduce((sum, kpi) => sum + kpi.eventsHigh, 0),
            eventsModerate: kpis.reduce((sum, kpi) => sum + kpi.eventsModerate, 0)
        };

        return aggregated;
    }

    /**
     * Convierte los datos del nuevo servicio al formato esperado por el frontend
     */
    private convertToAdvancedKPICalculationResult(kpiData: any): AdvancedKPICalculationResult {
        return {
            // Estados básicos
            tiempoEnParque: kpiData.tiempoEnParque || 0,
            tiempoEnTaller: kpiData.tiempoEnTaller || 0,
            tiempoFueraParque: kpiData.tiempoFueraParque || 0,
            tiempoEnZonaSensible: kpiData.tiempoEnZonaSensible || 0,

            // Estados con rotativo
            tiempoEnParqueConRotativo: kpiData.tiempoEnParqueConRotativo || 0,
            tiempoEnParqueSinRotativo: kpiData.tiempoEnParqueSinRotativo || 0,
            tiempoFueraParqueConRotativo: kpiData.tiempoFueraParqueConRotativo || 0,
            tiempoFueraParqueSinRotativo: kpiData.tiempoFueraParqueSinRotativo || 0,
            tiempoEnTallerConRotativo: kpiData.tiempoEnTallerConRotativo || 0,
            tiempoEnTallerSinRotativo: kpiData.tiempoEnTallerSinRotativo || 0,

            // Eventos por tipo
            eventosCriticos: kpiData.eventosCriticos || 0,
            eventosPeligrosos: kpiData.eventosPeligrosos || 0,
            eventosModerados: kpiData.eventosModerados || 0,
            eventosLeves: kpiData.eventosLeves || 0,

            // Eventos por ubicación
            eventosCriticosEnParque: kpiData.eventosCriticosEnParque || 0,
            eventosCriticosFueraParque: kpiData.eventosCriticosFueraParque || 0,
            eventosCriticosEnTaller: kpiData.eventosCriticosEnTaller || 0,
            eventosPeligrososEnParque: kpiData.eventosPeligrososEnParque || 0,
            eventosPeligrososFueraParque: kpiData.eventosPeligrososFueraParque || 0,
            eventosPeligrososEnTaller: kpiData.eventosPeligrososEnTaller || 0,

            // Velocidad
            tiempoExcediendoVelocidad: kpiData.tiempoExcediendoVelocidad || 0,
            tiempoExcediendoVelocidadEnParque: kpiData.tiempoExcediendoVelocidadEnParque || 0,
            tiempoExcediendoVelocidadFueraParque: kpiData.tiempoExcediendoVelocidadFueraParque || 0,
            tiempoExcediendoVelocidadEnTaller: kpiData.tiempoExcediendoVelocidadEnTaller || 0,
            maxVelocidadAlcanzada: kpiData.maxVelocidadAlcanzada || 0,
            velocidadPromedio: kpiData.velocidadPromedio || 0,

            // Detalles de velocidad
            excesosVelocidadLeves: kpiData.excesosVelocidadLeves || 0,
            excesosVelocidadModerados: kpiData.excesosVelocidadModerados || 0,
            excesosVelocidadGraves: kpiData.excesosVelocidadGraves || 0,
            excesosVelocidadMuyGraves: kpiData.excesosVelocidadMuyGraves || 0,

            // Estadísticas adicionales
            totalPuntosGPS: kpiData.totalPuntosGPS || 0,
            totalTiempo: kpiData.totalTiempo || 0,
            distanciaRecorrida: kpiData.distanciaRecorrida || 0,
            tiempoEnMovimiento: kpiData.tiempoEnMovimiento || 0,
            tiempoDetenido: kpiData.tiempoDetenido || 0,

            // Claves operativas (compatibilidad)
            clave2Minutes: kpiData.clave2Minutes || 0,
            clave5Minutes: kpiData.clave5Minutes || 0,
            outOfParkMinutes: kpiData.outOfParkMinutes || 0,
            timeInWorkshop: kpiData.timeInWorkshop || 0,
            eventsHigh: kpiData.eventsHigh || 0,
            eventsModerate: kpiData.eventsModerate || 0
        };
    }
}

// Exportar instancia del servicio
export const advancedKpiService = new AdvancedKPIService(); 
