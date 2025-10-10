/**
 * ⏱️ SERVICIO DE TIEMPOS DE RESPUESTA - BOMBEROS MADRID
 * Analiza y monitorea los tiempos de respuesta de emergencias
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Tipos de datos para tiempos de respuesta
export interface ResponseTimeRecord {
    id: string;
    incidentId: string;
    vehicleId: string;
    zone: string;
    timestamp: Date;
    callReceived: Date;
    vehicleDispatched: Date;
    vehicleArrived: Date;
    incidentResolved: Date;
    times: {
        dispatchTime: number; // minutos desde llamada hasta despacho
        travelTime: number; // minutos desde despacho hasta llegada
        resolutionTime: number; // minutos desde llegada hasta resolución
        totalResponseTime: number; // minutos totales
    };
    metadata: {
        incidentType: 'FIRE' | 'RESCUE' | 'HAZMAT' | 'TRAFFIC' | 'MEDICAL' | 'OTHER';
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        weather: 'CLEAR' | 'RAIN' | 'SNOW' | 'FOG' | 'STORM';
        traffic: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
        distance: number; // km
        personnel: number;
        equipment: string[];
    };
    performance: {
        targetMet: boolean;
        targetTime: number;
        efficiency: number; // porcentaje
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
    };
}

export interface ResponseTimeStats {
    period: string;
    totalIncidents: number;
    averageResponseTime: number;
    medianResponseTime: number;
    fastestResponse: number;
    slowestResponse: number;
    targetCompliance: number; // porcentaje
    byZone: Array<{
        zone: string;
        averageTime: number;
        incidentCount: number;
        compliance: number;
    }>;
    byVehicle: Array<{
        vehicleId: string;
        averageTime: number;
        incidentCount: number;
        efficiency: number;
    }>;
    byTimeOfDay: Array<{
        hour: number;
        averageTime: number;
        incidentCount: number;
    }>;
    byDayOfWeek: Array<{
        day: string;
        averageTime: number;
        incidentCount: number;
    }>;
    trends: Array<{
        date: string;
        averageTime: number;
        incidentCount: number;
        compliance: number;
    }>;
    benchmarks: {
        industry: number;
        national: number;
        regional: number;
        target: number;
    };
}

export interface ResponseTimeAlert {
    id: string;
    type: 'SLOW_RESPONSE' | 'TARGET_MISSED' | 'TREND_DECLINING' | 'ZONE_ISSUE' | 'VEHICLE_ISSUE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    affectedEntity: {
        type: 'ZONE' | 'VEHICLE' | 'GENERAL';
        id: string;
        name: string;
    };
    metrics: {
        current: number;
        target: number;
        trend: number;
        benchmark: number;
    };
    recommendations: string[];
    timestamp: Date;
    acknowledged: boolean;
    resolved: boolean;
}

export interface PerformanceBenchmark {
    category: string;
    target: number;
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
    description: string;
}

class ResponseTimeService extends EventEmitter {
    private records: Map<string, ResponseTimeRecord> = new Map();
    private alerts: Map<string, ResponseTimeAlert> = new Map();
    private isMonitoring: boolean = false;
    private monitoringInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.initializeService();
    }

    private initializeService(): void {
        logger.info('⏱️ Inicializando servicio de tiempos de respuesta');
        this.loadSampleData();
        this.startMonitoring();
    }

    /**
     * Carga datos de ejemplo para demostración
     */
    private loadSampleData(): void {
        const zones = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];
        const incidentTypes = ['FIRE', 'RESCUE', 'HAZMAT', 'TRAFFIC', 'MEDICAL', 'OTHER'];
        const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const weather = ['CLEAR', 'RAIN', 'SNOW', 'FOG', 'STORM'];
        const traffic = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE'];

        // Generar 200 registros de ejemplo
        for (let i = 0; i < 200; i++) {
            const record = this.generateSampleRecord(i, zones, incidentTypes, severities, weather, traffic);
            this.records.set(record.id, record);
        }

        logger.info(`⏱️ Cargados ${this.records.size} registros de tiempos de respuesta`);
    }

    /**
     * Genera un registro de ejemplo
     */
    private generateSampleRecord(
        index: number,
        zones: string[],
        incidentTypes: string[],
        severities: string[],
        weather: string[],
        traffic: string[]
    ): ResponseTimeRecord {
        const id = `resp_${String(index + 1).padStart(4, '0')}`;
        const incidentId = `inc_${String(index + 1).padStart(4, '0')}`;
        const vehicleId = `DOBACK${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}`;
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)] as any;
        const severity = severities[Math.floor(Math.random() * severities.length)] as any;
        const weatherCondition = weather[Math.floor(Math.random() * weather.length)] as any;
        const trafficCondition = traffic[Math.floor(Math.random() * traffic.length)] as any;

        // Generar tiempos realistas basados en tipo de incidente y severidad
        const baseTime = this.getBaseResponseTime(incidentType, severity);
        const weatherMultiplier = this.getWeatherMultiplier(weatherCondition);
        const trafficMultiplier = this.getTrafficMultiplier(trafficCondition);

        const dispatchTime = Math.floor(Math.random() * 3) + 1; // 1-3 minutos
        const travelTime = Math.floor(baseTime * weatherMultiplier * trafficMultiplier * (0.5 + Math.random()));
        const resolutionTime = Math.floor(Math.random() * 60) + 10; // 10-70 minutos

        const totalResponseTime = dispatchTime + travelTime;

        const targetTime = this.getTargetTime(incidentType, severity);
        const efficiency = Math.min(100, (targetTime / totalResponseTime) * 100);
        const grade = this.getGrade(efficiency);

        const record: ResponseTimeRecord = {
            id,
            incidentId,
            vehicleId,
            zone,
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            callReceived: new Date(),
            vehicleDispatched: new Date(),
            vehicleArrived: new Date(),
            incidentResolved: new Date(),
            times: {
                dispatchTime,
                travelTime,
                resolutionTime,
                totalResponseTime
            },
            metadata: {
                incidentType,
                severity,
                weather: weatherCondition,
                traffic: trafficCondition,
                distance: Math.floor(Math.random() * 15) + 1,
                personnel: Math.floor(Math.random() * 10) + 3,
                equipment: ['Bomba', 'Escalera', 'Manguera', 'Equipo de Rescate']
            },
            performance: {
                targetMet: totalResponseTime <= targetTime,
                targetTime,
                efficiency,
                grade
            }
        };

        return record;
    }

    /**
     * Obtiene tiempo base de respuesta según tipo y severidad
     */
    private getBaseResponseTime(type: string, severity: string): number {
        const baseTimes = {
            'FIRE': { 'LOW': 8, 'MEDIUM': 6, 'HIGH': 4, 'CRITICAL': 3 },
            'RESCUE': { 'LOW': 10, 'MEDIUM': 8, 'HIGH': 5, 'CRITICAL': 4 },
            'HAZMAT': { 'LOW': 15, 'MEDIUM': 12, 'HIGH': 8, 'CRITICAL': 6 },
            'TRAFFIC': { 'LOW': 12, 'MEDIUM': 10, 'HIGH': 7, 'CRITICAL': 5 },
            'MEDICAL': { 'LOW': 6, 'MEDIUM': 5, 'HIGH': 4, 'CRITICAL': 3 },
            'OTHER': { 'LOW': 10, 'MEDIUM': 8, 'HIGH': 6, 'CRITICAL': 4 }
        };
        return baseTimes[type as keyof typeof baseTimes]?.[severity as keyof typeof baseTimes.FIRE] || 8;
    }

    /**
     * Obtiene multiplicador por condiciones climáticas
     */
    private getWeatherMultiplier(weather: string): number {
        const multipliers = {
            'CLEAR': 1.0,
            'RAIN': 1.2,
            'SNOW': 1.5,
            'FOG': 1.3,
            'STORM': 1.8
        };
        return multipliers[weather as keyof typeof multipliers] || 1.0;
    }

    /**
     * Obtiene multiplicador por condiciones de tráfico
     */
    private getTrafficMultiplier(traffic: string): number {
        const multipliers = {
            'LOW': 1.0,
            'MEDIUM': 1.3,
            'HIGH': 1.6,
            'SEVERE': 2.0
        };
        return multipliers[traffic as keyof typeof multipliers] || 1.0;
    }

    /**
     * Obtiene tiempo objetivo según tipo y severidad
     */
    private getTargetTime(type: string, severity: string): number {
        const targetTimes = {
            'FIRE': { 'LOW': 10, 'MEDIUM': 8, 'HIGH': 6, 'CRITICAL': 4 },
            'RESCUE': { 'LOW': 12, 'MEDIUM': 10, 'HIGH': 7, 'CRITICAL': 5 },
            'HAZMAT': { 'LOW': 20, 'MEDIUM': 15, 'HIGH': 10, 'CRITICAL': 8 },
            'TRAFFIC': { 'LOW': 15, 'MEDIUM': 12, 'HIGH': 9, 'CRITICAL': 6 },
            'MEDICAL': { 'LOW': 8, 'MEDIUM': 6, 'HIGH': 5, 'CRITICAL': 4 },
            'OTHER': { 'LOW': 12, 'MEDIUM': 10, 'HIGH': 8, 'CRITICAL': 6 }
        };
        return targetTimes[type as keyof typeof targetTimes]?.[severity as keyof typeof targetTimes.FIRE] || 10;
    }

    /**
     * Obtiene calificación basada en eficiencia
     */
    private getGrade(efficiency: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (efficiency >= 90) return 'A';
        if (efficiency >= 80) return 'B';
        if (efficiency >= 70) return 'C';
        if (efficiency >= 60) return 'D';
        return 'F';
    }

    /**
     * Genera estadísticas de tiempos de respuesta
     */
    async generateStats(period: string = 'month'): Promise<ResponseTimeStats> {
        const records = Array.from(this.records.values());
        const now = new Date();
        const startDate = this.getPeriodStartDate(period, now);

        // Filtrar registros por período
        const periodRecords = records.filter(record => record.timestamp >= startDate);

        if (periodRecords.length === 0) {
            throw new Error(`No hay registros para el período ${period}`);
        }

        // Calcular estadísticas generales
        const responseTimes = periodRecords.map(r => r.times.totalResponseTime);
        const averageResponseTime = responseTimes.reduce((acc, time) => acc + time, 0) / responseTimes.length;
        const medianResponseTime = this.calculateMedian(responseTimes);
        const fastestResponse = Math.min(...responseTimes);
        const slowestResponse = Math.max(...responseTimes);

        // Calcular cumplimiento de objetivos
        const targetMet = periodRecords.filter(r => r.performance.targetMet).length;
        const targetCompliance = (targetMet / periodRecords.length) * 100;

        // Estadísticas por zona
        const zoneStats = this.calculateZoneStats(periodRecords);

        // Estadísticas por vehículo
        const vehicleStats = this.calculateVehicleStats(periodRecords);

        // Estadísticas por hora del día
        const timeOfDayStats = this.calculateTimeOfDayStats(periodRecords);

        // Estadísticas por día de la semana
        const dayOfWeekStats = this.calculateDayOfWeekStats(periodRecords);

        // Tendencias temporales
        const trends = this.calculateTrends(periodRecords, period);

        // Benchmarks
        const benchmarks = this.getBenchmarks();

        const stats: ResponseTimeStats = {
            period,
            totalIncidents: periodRecords.length,
            averageResponseTime: Math.round(averageResponseTime * 10) / 10,
            medianResponseTime: Math.round(medianResponseTime * 10) / 10,
            fastestResponse,
            slowestResponse,
            targetCompliance: Math.round(targetCompliance * 10) / 10,
            byZone: zoneStats,
            byVehicle: vehicleStats,
            byTimeOfDay: timeOfDayStats,
            byDayOfWeek: dayOfWeekStats,
            trends,
            benchmarks
        };

        this.emit('statsGenerated', stats);

        logger.info(`⏱️ Estadísticas de tiempos de respuesta generadas para período ${period}`);
        return stats;
    }

    /**
     * Calcula estadísticas por zona
     */
    private calculateZoneStats(records: ResponseTimeRecord[]): Array<{
        zone: string;
        averageTime: number;
        incidentCount: number;
        compliance: number;
    }> {
        const zoneMap = new Map<string, ResponseTimeRecord[]>();

        records.forEach(record => {
            if (!zoneMap.has(record.zone)) {
                zoneMap.set(record.zone, []);
            }
            zoneMap.get(record.zone)!.push(record);
        });

        return Array.from(zoneMap.entries()).map(([zone, zoneRecords]) => {
            const averageTime = zoneRecords.reduce((acc, r) => acc + r.times.totalResponseTime, 0) / zoneRecords.length;
            const compliance = (zoneRecords.filter(r => r.performance.targetMet).length / zoneRecords.length) * 100;

            return {
                zone,
                averageTime: Math.round(averageTime * 10) / 10,
                incidentCount: zoneRecords.length,
                compliance: Math.round(compliance * 10) / 10
            };
        }).sort((a, b) => b.averageTime - a.averageTime);
    }

    /**
     * Calcula estadísticas por vehículo
     */
    private calculateVehicleStats(records: ResponseTimeRecord[]): Array<{
        vehicleId: string;
        averageTime: number;
        incidentCount: number;
        efficiency: number;
    }> {
        const vehicleMap = new Map<string, ResponseTimeRecord[]>();

        records.forEach(record => {
            if (!vehicleMap.has(record.vehicleId)) {
                vehicleMap.set(record.vehicleId, []);
            }
            vehicleMap.get(record.vehicleId)!.push(record);
        });

        return Array.from(vehicleMap.entries()).map(([vehicleId, vehicleRecords]) => {
            const averageTime = vehicleRecords.reduce((acc, r) => acc + r.times.totalResponseTime, 0) / vehicleRecords.length;
            const efficiency = vehicleRecords.reduce((acc, r) => acc + r.performance.efficiency, 0) / vehicleRecords.length;

            return {
                vehicleId,
                averageTime: Math.round(averageTime * 10) / 10,
                incidentCount: vehicleRecords.length,
                efficiency: Math.round(efficiency * 10) / 10
            };
        }).sort((a, b) => b.averageTime - a.averageTime);
    }

    /**
     * Calcula estadísticas por hora del día
     */
    private calculateTimeOfDayStats(records: ResponseTimeRecord[]): Array<{
        hour: number;
        averageTime: number;
        incidentCount: number;
    }> {
        const hourMap = new Map<number, ResponseTimeRecord[]>();

        records.forEach(record => {
            const hour = record.timestamp.getHours();
            if (!hourMap.has(hour)) {
                hourMap.set(hour, []);
            }
            hourMap.get(hour)!.push(record);
        });

        return Array.from(hourMap.entries()).map(([hour, hourRecords]) => {
            const averageTime = hourRecords.reduce((acc, r) => acc + r.times.totalResponseTime, 0) / hourRecords.length;

            return {
                hour,
                averageTime: Math.round(averageTime * 10) / 10,
                incidentCount: hourRecords.length
            };
        }).sort((a, b) => a.hour - b.hour);
    }

    /**
     * Calcula estadísticas por día de la semana
     */
    private calculateDayOfWeekStats(records: ResponseTimeRecord[]): Array<{
        day: string;
        averageTime: number;
        incidentCount: number;
    }> {
        const dayMap = new Map<string, ResponseTimeRecord[]>();
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        records.forEach(record => {
            const day = dayNames[record.timestamp.getDay()];
            if (!dayMap.has(day)) {
                dayMap.set(day, []);
            }
            dayMap.get(day)!.push(record);
        });

        return Array.from(dayMap.entries()).map(([day, dayRecords]) => {
            const averageTime = dayRecords.reduce((acc, r) => acc + r.times.totalResponseTime, 0) / dayRecords.length;

            return {
                day,
                averageTime: Math.round(averageTime * 10) / 10,
                incidentCount: dayRecords.length
            };
        }).sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));
    }

    /**
     * Calcula tendencias temporales
     */
    private calculateTrends(records: ResponseTimeRecord[], period: string): Array<{
        date: string;
        averageTime: number;
        incidentCount: number;
        compliance: number;
    }> {
        const dateMap = new Map<string, ResponseTimeRecord[]>();

        records.forEach(record => {
            const date = record.timestamp.toISOString().split('T')[0];
            if (!dateMap.has(date)) {
                dateMap.set(date, []);
            }
            dateMap.get(date)!.push(record);
        });

        return Array.from(dateMap.entries()).map(([date, dateRecords]) => {
            const averageTime = dateRecords.reduce((acc, r) => acc + r.times.totalResponseTime, 0) / dateRecords.length;
            const compliance = (dateRecords.filter(r => r.performance.targetMet).length / dateRecords.length) * 100;

            return {
                date,
                averageTime: Math.round(averageTime * 10) / 10,
                incidentCount: dateRecords.length,
                compliance: Math.round(compliance * 10) / 10
            };
        }).sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Obtiene benchmarks de la industria
     */
    private getBenchmarks(): ResponseTimeStats['benchmarks'] {
        return {
            industry: 8.5,
            national: 7.2,
            regional: 6.8,
            target: 6.0
        };
    }

    /**
     * Calcula la mediana de un array de números
     */
    private calculateMedian(numbers: number[]): number {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    }

    /**
     * Obtiene la fecha de inicio del período
     */
    private getPeriodStartDate(period: string, endDate: Date): Date {
        const start = new Date(endDate);

        switch (period.toLowerCase()) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setMonth(start.getMonth() - 1);
        }

        return start;
    }

    /**
     * Inicia el monitoreo automático
     */
    startMonitoring(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkForAlerts();
        }, 60000); // Verificar cada minuto

        logger.info('⏱️ Monitoreo de tiempos de respuesta iniciado');
    }

    /**
     * Detiene el monitoreo automático
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        logger.info('⏱️ Monitoreo de tiempos de respuesta detenido');
    }

    /**
     * Verifica si hay alertas que generar
     */
    private async checkForAlerts(): Promise<void> {
        try {
            const stats = await this.generateStats('week');

            // Verificar si el cumplimiento de objetivos está por debajo del 80%
            if (stats.targetCompliance < 80) {
                this.generateAlert('TARGET_MISSED', 'CRITICAL', {
                    current: stats.targetCompliance,
                    target: 80,
                    trend: stats.targetCompliance - 85, // Simulado
                    benchmark: stats.benchmarks.target
                });
            }

            // Verificar zonas con tiempos de respuesta altos
            stats.byZone.forEach(zone => {
                if (zone.averageTime > 10) {
                    this.generateAlert('ZONE_ISSUE', 'HIGH', {
                        current: zone.averageTime,
                        target: 8,
                        trend: zone.averageTime - 8,
                        benchmark: stats.benchmarks.target
                    }, 'ZONE', zone.zone, zone.zone);
                }
            });

        } catch (error) {
            logger.error('Error verificando alertas de tiempos de respuesta:', error);
        }
    }

    /**
     * Genera una alerta
     */
    private generateAlert(
        type: ResponseTimeAlert['type'],
        severity: ResponseTimeAlert['severity'],
        metrics: ResponseTimeAlert['metrics'],
        entityType: 'ZONE' | 'VEHICLE' | 'GENERAL' = 'GENERAL',
        entityId: string = 'general',
        entityName: string = 'Sistema General'
    ): void {
        const alert: ResponseTimeAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            title: this.getAlertTitle(type),
            description: this.getAlertDescription(type, metrics),
            affectedEntity: {
                type: entityType,
                id: entityId,
                name: entityName
            },
            metrics,
            recommendations: this.getAlertRecommendations(type, metrics),
            timestamp: new Date(),
            acknowledged: false,
            resolved: false
        };

        this.alerts.set(alert.id, alert);
        this.emit('alertGenerated', alert);

        logger.warn(`⏱️ Alerta de tiempo de respuesta generada: ${alert.title}`);
    }

    /**
     * Obtiene el título de la alerta
     */
    private getAlertTitle(type: ResponseTimeAlert['type']): string {
        const titles = {
            'SLOW_RESPONSE': 'Tiempo de Respuesta Lento',
            'TARGET_MISSED': 'Objetivo de Tiempo No Cumplido',
            'TREND_DECLINING': 'Tendencia Declinante en Tiempos',
            'ZONE_ISSUE': 'Problema en Zona Específica',
            'VEHICLE_ISSUE': 'Problema con Vehículo Específico'
        };
        return titles[type];
    }

    /**
     * Obtiene la descripción de la alerta
     */
    private getAlertDescription(type: ResponseTimeAlert['type'], metrics: ResponseTimeAlert['metrics']): string {
        const descriptions = {
            'SLOW_RESPONSE': `Tiempo de respuesta actual: ${metrics.current} minutos (objetivo: ${metrics.target} minutos)`,
            'TARGET_MISSED': `Cumplimiento de objetivos: ${metrics.current}% (objetivo: ${metrics.target}%)`,
            'TREND_DECLINING': `Tendencia: ${metrics.trend > 0 ? '+' : ''}${metrics.trend} minutos`,
            'ZONE_ISSUE': `Tiempo promedio en zona: ${metrics.current} minutos (objetivo: ${metrics.target} minutos)`,
            'VEHICLE_ISSUE': `Tiempo promedio del vehículo: ${metrics.current} minutos (objetivo: ${metrics.target} minutos)`
        };
        return descriptions[type];
    }

    /**
     * Obtiene recomendaciones para la alerta
     */
    private getAlertRecommendations(type: ResponseTimeAlert['type'], metrics: ResponseTimeAlert['metrics']): string[] {
        const recommendations = {
            'SLOW_RESPONSE': [
                'Revisar rutas de acceso',
                'Optimizar despacho de vehículos',
                'Verificar disponibilidad de personal'
            ],
            'TARGET_MISSED': [
                'Analizar causas de incumplimiento',
                'Implementar mejoras operativas',
                'Capacitar personal en eficiencia'
            ],
            'TREND_DECLINING': [
                'Investigar causas del deterioro',
                'Implementar medidas correctivas',
                'Monitorear mejoras continuamente'
            ],
            'ZONE_ISSUE': [
                'Evaluar acceso vehicular a la zona',
                'Coordinar con servicios de tráfico',
                'Considerar reubicación de recursos'
            ],
            'VEHICLE_ISSUE': [
                'Revisar estado del vehículo',
                'Evaluar capacitación del personal',
                'Optimizar asignación de rutas'
            ]
        };
        return recommendations[type];
    }

    /**
     * Obtiene todos los registros de tiempos de respuesta
     */
    getAllRecords(): ResponseTimeRecord[] {
        return Array.from(this.records.values());
    }

    /**
     * Obtiene un registro específico
     */
    getRecord(recordId: string): ResponseTimeRecord | undefined {
        return this.records.get(recordId);
    }

    /**
     * Obtiene todas las alertas
     */
    getAllAlerts(): ResponseTimeAlert[] {
        return Array.from(this.alerts.values());
    }

    /**
     * Obtiene alertas activas (no reconocidas ni resueltas)
     */
    getActiveAlerts(): ResponseTimeAlert[] {
        return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged && !alert.resolved);
    }

    /**
     * Reconoce una alerta
     */
    acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.acknowledged) {
            alert.acknowledged = true;
            this.emit('alertAcknowledged', { alert, acknowledgedBy });
            logger.info(`⏱️ Alerta ${alertId} reconocida por ${acknowledgedBy}`);
            return true;
        }
        return false;
    }

    /**
     * Resuelve una alerta
     */
    resolveAlert(alertId: string, resolvedBy: string): boolean {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            this.emit('alertResolved', { alert, resolvedBy });
            logger.info(`⏱️ Alerta ${alertId} resuelta por ${resolvedBy}`);
            return true;
        }
        return false;
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats() {
        const records = Array.from(this.records.values());
        const alerts = Array.from(this.alerts.values());

        return {
            totalRecords: records.length,
            totalAlerts: alerts.length,
            activeAlerts: alerts.filter(a => !a.acknowledged && !a.resolved).length,
            acknowledgedAlerts: alerts.filter(a => a.acknowledged && !a.resolved).length,
            resolvedAlerts: alerts.filter(a => a.resolved).length,
            isMonitoring: this.isMonitoring,
            averageResponseTime: records.length > 0
                ? records.reduce((acc, r) => acc + r.times.totalResponseTime, 0) / records.length
                : 0,
            targetCompliance: records.length > 0
                ? (records.filter(r => r.performance.targetMet).length / records.length) * 100
                : 0,
            lastRecord: records.length > 0
                ? Math.max(...records.map(r => r.timestamp.getTime()))
                : null
        };
    }
}

export const responseTimeService = new ResponseTimeService();
