/**
 * 🚨 SERVICIO DE ALERTAS INTELIGENTES - BOMBEROS MADRID
 * Sistema de alertas específico para emergencias de bomberos
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { realTimeGPSService, VehicleStatus } from './realTimeGPSService';

export interface FireAlert {
    id: string;
    type: 'EMERGENCY_RESPONSE' | 'VEHICLE_OFFLINE' | 'HIGH_SPEED' | 'GEOFENCE_VIOLATION' | 'MAINTENANCE_DUE' | 'CRITICAL_EVENT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    vehicleId?: string;
    vehicleName?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    escalationLevel: number; // 0 = no escalado, 1-3 = niveles de escalamiento
    autoResolved: boolean;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}

export interface AlertRule {
    id: string;
    name: string;
    type: FireAlert['type'];
    conditions: {
        field: string;
        operator: 'gt' | 'lt' | 'eq' | 'contains' | 'between';
        value: any;
        threshold?: number;
    }[];
    severity: FireAlert['severity'];
    autoEscalate: boolean;
    escalateAfterMinutes: number;
    notificationChannels: ('EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK')[];
    enabled: boolean;
}

export interface EscalationPolicy {
    level: number;
    delayMinutes: number;
    notificationChannels: ('EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK')[];
    recipients: string[];
}

class IntelligentAlertsService extends EventEmitter {
    private alerts: Map<string, FireAlert> = new Map();
    private rules: Map<string, AlertRule> = new Map();
    private escalationPolicies: EscalationPolicy[] = [];
    private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL = 30000; // 30 segundos

    // Zonas de alto riesgo específicas de Madrid
    private readonly HIGH_RISK_ZONES = [
        {
            name: 'Centro Histórico',
            bounds: {
                north: 40.4250,
                south: 40.4050,
                east: -3.6900,
                west: -3.7200
            },
            riskLevel: 'HIGH'
        },
        {
            name: 'Zona Industrial Sur',
            bounds: {
                north: 40.3800,
                south: 40.3500,
                east: -3.6800,
                west: -3.7200
            },
            riskLevel: 'CRITICAL'
        },
        {
            name: 'Barrio de Salamanca',
            bounds: {
                north: 40.4350,
                south: 40.4150,
                east: -3.6800,
                west: -3.7000
            },
            riskLevel: 'MEDIUM'
        }
    ];

    constructor() {
        super();
        this.initializeRules();
        this.initializeEscalationPolicies();
    }

    /**
     * Inicializa las reglas de alerta específicas para bomberos
     */
    private initializeRules(): void {
        const rules: AlertRule[] = [
            {
                id: 'vehicle-offline-5min',
                name: 'Vehículo Offline 5+ minutos',
                type: 'VEHICLE_OFFLINE',
                conditions: [
                    {
                        field: 'lastSeen',
                        operator: 'lt',
                        value: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos
                    }
                ],
                severity: 'HIGH',
                autoEscalate: true,
                escalateAfterMinutes: 10,
                notificationChannels: ['PUSH', 'EMAIL'],
                enabled: true
            },
            {
                id: 'high-speed-urban',
                name: 'Velocidad Alta en Zona Urbana',
                type: 'HIGH_SPEED',
                conditions: [
                    {
                        field: 'speed',
                        operator: 'gt',
                        value: 80,
                        threshold: 80
                    },
                    {
                        field: 'inUrbanZone',
                        operator: 'eq',
                        value: true
                    }
                ],
                severity: 'MEDIUM',
                autoEscalate: false,
                escalateAfterMinutes: 15,
                notificationChannels: ['PUSH'],
                enabled: true
            },
            {
                id: 'emergency-response-active',
                name: 'Respuesta de Emergencia Activa',
                type: 'EMERGENCY_RESPONSE',
                conditions: [
                    {
                        field: 'emergencyStatus',
                        operator: 'eq',
                        value: 'ON_EMERGENCY'
                    },
                    {
                        field: 'speed',
                        operator: 'gt',
                        value: 20
                    }
                ],
                severity: 'CRITICAL',
                autoEscalate: true,
                escalateAfterMinutes: 5,
                notificationChannels: ['PUSH', 'SMS', 'EMAIL'],
                enabled: true
            },
            {
                id: 'high-risk-zone-entry',
                name: 'Entrada a Zona de Alto Riesgo',
                type: 'GEOFENCE_VIOLATION',
                conditions: [
                    {
                        field: 'inHighRiskZone',
                        operator: 'eq',
                        value: true
                    }
                ],
                severity: 'HIGH',
                autoEscalate: true,
                escalateAfterMinutes: 8,
                notificationChannels: ['PUSH', 'EMAIL'],
                enabled: true
            },
            {
                id: 'maintenance-due',
                name: 'Mantenimiento Vencido',
                type: 'MAINTENANCE_DUE',
                conditions: [
                    {
                        field: 'maintenanceDue',
                        operator: 'lt',
                        value: new Date()
                    }
                ],
                severity: 'MEDIUM',
                autoEscalate: false,
                escalateAfterMinutes: 60,
                notificationChannels: ['EMAIL'],
                enabled: true
            }
        ];

        rules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });

        logger.info(`🚨 Inicializadas ${rules.length} reglas de alerta para Bomberos Madrid`);
    }

    /**
     * Inicializa las políticas de escalamiento
     */
    private initializeEscalationPolicies(): void {
        this.escalationPolicies = [
            {
                level: 1,
                delayMinutes: 5,
                notificationChannels: ['PUSH'],
                recipients: ['operador@bomberosmadrid.es']
            },
            {
                level: 2,
                delayMinutes: 10,
                notificationChannels: ['PUSH', 'EMAIL'],
                recipients: ['operador@bomberosmadrid.es', 'supervisor@bomberosmadrid.es']
            },
            {
                level: 3,
                delayMinutes: 15,
                notificationChannels: ['PUSH', 'EMAIL', 'SMS'],
                recipients: ['operador@bomberosmadrid.es', 'supervisor@bomberosmadrid.es', 'jefe@bomberosmadrid.es']
            }
        ];
    }

    /**
     * Verifica si un vehículo está en zona urbana
     */
    private isInUrbanZone(latitude: number, longitude: number): boolean {
        // Madrid centro y zonas urbanas principales
        return latitude >= 40.35 && latitude <= 40.50 &&
            longitude >= -3.75 && longitude <= -3.65;
    }

    /**
     * Verifica si un vehículo está en zona de alto riesgo
     */
    private isInHighRiskZone(latitude: number, longitude: number): { inZone: boolean; zoneName?: string; riskLevel?: string } {
        for (const zone of this.HIGH_RISK_ZONES) {
            if (latitude >= zone.bounds.south && latitude <= zone.bounds.north &&
                longitude >= zone.bounds.west && longitude <= zone.bounds.east) {
                return {
                    inZone: true,
                    zoneName: zone.name,
                    riskLevel: zone.riskLevel
                };
            }
        }
        return { inZone: false };
    }

    /**
     * Evalúa las reglas de alerta para un vehículo
     */
    private evaluateVehicleRules(vehicle: VehicleStatus): FireAlert[] {
        const newAlerts: FireAlert[] = [];
        const now = new Date();

        for (const [ruleId, rule] of this.rules) {
            if (!rule.enabled) continue;

            let ruleTriggered = true;

            // Evaluar condiciones de la regla
            for (const condition of rule.conditions) {
                let fieldValue: any;

                switch (condition.field) {
                    case 'lastSeen':
                        fieldValue = vehicle.lastSeen;
                        break;
                    case 'speed':
                        fieldValue = vehicle.gpsData?.speed || 0;
                        break;
                    case 'emergencyStatus':
                        fieldValue = vehicle.emergencyStatus;
                        break;
                    case 'inUrbanZone':
                        fieldValue = vehicle.gpsData ? this.isInUrbanZone(vehicle.gpsData.latitude, vehicle.gpsData.longitude) : false;
                        break;
                    case 'inHighRiskZone':
                        const riskCheck = vehicle.gpsData ? this.isInHighRiskZone(vehicle.gpsData.latitude, vehicle.gpsData.longitude) : { inZone: false };
                        fieldValue = riskCheck.inZone;
                        break;
                    case 'maintenanceDue':
                        // Simular fecha de mantenimiento (en producción vendría de BD)
                        fieldValue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días desde ahora
                        break;
                    default:
                        ruleTriggered = false;
                        break;
                }

                // Evaluar operador
                switch (condition.operator) {
                    case 'gt':
                        if (typeof fieldValue !== 'number' || fieldValue <= condition.value) {
                            ruleTriggered = false;
                        }
                        break;
                    case 'lt':
                        if (typeof fieldValue !== 'number' && !(fieldValue instanceof Date) || fieldValue >= condition.value) {
                            ruleTriggered = false;
                        }
                        break;
                    case 'eq':
                        if (fieldValue !== condition.value) {
                            ruleTriggered = false;
                        }
                        break;
                    case 'contains':
                        if (typeof fieldValue !== 'string' || !fieldValue.includes(condition.value)) {
                            ruleTriggered = false;
                        }
                        break;
                }

                if (!ruleTriggered) break;
            }

            // Si la regla se activó, crear alerta
            if (ruleTriggered) {
                const alertId = `${ruleId}-${vehicle.vehicleId}-${now.getTime()}`;

                // Verificar si ya existe una alerta similar activa
                const existingAlert = Array.from(this.alerts.values())
                    .find(alert => alert.type === rule.type &&
                        alert.vehicleId === vehicle.vehicleId &&
                        !alert.acknowledged &&
                        !alert.autoResolved);

                if (!existingAlert) {
                    const alert: FireAlert = {
                        id: alertId,
                        type: rule.type,
                        severity: rule.severity,
                        title: rule.name,
                        description: this.generateAlertDescription(rule.type, vehicle),
                        vehicleId: vehicle.vehicleId,
                        vehicleName: vehicle.name,
                        location: vehicle.gpsData ? {
                            latitude: vehicle.gpsData.latitude,
                            longitude: vehicle.gpsData.longitude
                        } : undefined,
                        timestamp: now,
                        acknowledged: false,
                        escalationLevel: 0,
                        autoResolved: false,
                        metadata: {
                            ruleId,
                            speed: vehicle.gpsData?.speed,
                            emergencyStatus: vehicle.emergencyStatus
                        }
                    };

                    newAlerts.push(alert);
                    this.alerts.set(alertId, alert);

                    // Programar escalamiento si está habilitado
                    if (rule.autoEscalate) {
                        this.scheduleEscalation(alertId, rule.escalateAfterMinutes);
                    }

                    // Enviar notificaciones
                    this.sendNotifications(alert, rule.notificationChannels);

                    logger.warn(`🚨 Alerta generada: ${rule.name} para ${vehicle.name}`, {
                        alertId,
                        vehicleId: vehicle.vehicleId,
                        severity: rule.severity
                    });
                }
            }
        }

        return newAlerts;
    }

    /**
     * Genera descripción específica para el tipo de alerta
     */
    private generateAlertDescription(type: FireAlert['type'], vehicle: VehicleStatus): string {
        switch (type) {
            case 'VEHICLE_OFFLINE':
                return `El vehículo ${vehicle.name} (${vehicle.vehicleId}) no ha enviado datos GPS en los últimos 5 minutos. Verificar conectividad.`;

            case 'HIGH_SPEED':
                return `El vehículo ${vehicle.name} está circulando a ${vehicle.gpsData?.speed.toFixed(1)} km/h en zona urbana. Verificar si es emergencia activa.`;

            case 'EMERGENCY_RESPONSE':
                return `El vehículo ${vehicle.name} está respondiendo a una emergencia. Velocidad: ${vehicle.gpsData?.speed.toFixed(1)} km/h. Ubicación: ${vehicle.gpsData?.latitude.toFixed(4)}, ${vehicle.gpsData?.longitude.toFixed(4)}.`;

            case 'GEOFENCE_VIOLATION':
                const riskZone = vehicle.gpsData ? this.isInHighRiskZone(vehicle.gpsData.latitude, vehicle.gpsData.longitude) : { inZone: false };
                return `El vehículo ${vehicle.name} ha entrado en zona de alto riesgo: ${riskZone.zoneName || 'Desconocida'}. Nivel de riesgo: ${riskZone.riskLevel || 'Alto'}.`;

            case 'MAINTENANCE_DUE':
                return `El vehículo ${vehicle.name} tiene mantenimiento vencido. Programar revisión inmediata.`;

            default:
                return `Alerta del vehículo ${vehicle.name}: ${type}`;
        }
    }

    /**
     * Programa el escalamiento de una alerta
     */
    private scheduleEscalation(alertId: string, delayMinutes: number): void {
        const timer = setTimeout(() => {
            this.escalateAlert(alertId);
        }, delayMinutes * 60 * 1000);

        this.escalationTimers.set(alertId, timer);
    }

    /**
     * Escalada una alerta al siguiente nivel
     */
    private escalateAlert(alertId: string): void {
        const alert = this.alerts.get(alertId);
        if (!alert || alert.acknowledged || alert.autoResolved) {
            return;
        }

        const currentLevel = alert.escalationLevel;
        const nextLevel = currentLevel + 1;

        if (nextLevel <= this.escalationPolicies.length) {
            const policy = this.escalationPolicies[nextLevel - 1];

            alert.escalationLevel = nextLevel;

            // Enviar notificaciones de escalamiento
            this.sendEscalationNotifications(alert, policy);

            // Programar siguiente escalamiento
            if (nextLevel < this.escalationPolicies.length) {
                this.scheduleEscalation(alertId, policy.delayMinutes);
            }

            logger.warn(`🚨 Alerta escalada: ${alert.title} - Nivel ${nextLevel}`, {
                alertId,
                vehicleId: alert.vehicleId,
                escalationLevel: nextLevel
            });

            this.emit('alertEscalated', alert);
        }
    }

    /**
     * Envía notificaciones para una alerta
     */
    private sendNotifications(alert: FireAlert, channels: string[]): void {
        for (const channel of channels) {
            this.emit('notification', {
                channel,
                alert,
                message: `${alert.title}: ${alert.description}`
            });
        }
    }

    /**
     * Envía notificaciones de escalamiento
     */
    private sendEscalationNotifications(alert: FireAlert, policy: EscalationPolicy): void {
        for (const channel of policy.notificationChannels) {
            this.emit('notification', {
                channel,
                alert,
                message: `[ESCALAMIENTO NIVEL ${policy.level}] ${alert.title}: ${alert.description}`,
                recipients: policy.recipients
            });
        }
    }

    /**
     * Verifica alertas para todos los vehículos
     */
    private checkAllVehicles(): void {
        const vehicles = realTimeGPSService.getAllVehicles();
        let newAlertsCount = 0;

        vehicles.forEach(vehicle => {
            const newAlerts = this.evaluateVehicleRules(vehicle);
            newAlertsCount += newAlerts.length;

            newAlerts.forEach(alert => {
                this.emit('alertCreated', alert);
            });
        });

        // Auto-resolver alertas que ya no aplican
        this.autoResolveAlerts(vehicles);

        if (newAlertsCount > 0) {
            logger.info(`🚨 Verificación de alertas: ${newAlertsCount} nuevas alertas generadas`);
        }
    }

    /**
     * Auto-resuelve alertas que ya no aplican
     */
    private autoResolveAlerts(vehicles: VehicleStatus[]): void {
        const vehicleMap = new Map(vehicles.map(v => [v.vehicleId, v]));

        for (const [alertId, alert] of this.alerts) {
            if (alert.acknowledged || alert.autoResolved) continue;

            const vehicle = vehicleMap.get(alert.vehicleId!);
            if (!vehicle) continue;

            let shouldResolve = false;

            // Verificar si las condiciones de la alerta ya no se cumplen
            switch (alert.type) {
                case 'VEHICLE_OFFLINE':
                    if (vehicle.isActive && vehicle.lastSeen > new Date(Date.now() - 5 * 60 * 1000)) {
                        shouldResolve = true;
                    }
                    break;

                case 'HIGH_SPEED':
                    if (!vehicle.gpsData || vehicle.gpsData.speed <= 80 ||
                        !this.isInUrbanZone(vehicle.gpsData.latitude, vehicle.gpsData.longitude)) {
                        shouldResolve = true;
                    }
                    break;

                case 'EMERGENCY_RESPONSE':
                    if (vehicle.emergencyStatus !== 'ON_EMERGENCY' ||
                        !vehicle.gpsData || vehicle.gpsData.speed <= 20) {
                        shouldResolve = true;
                    }
                    break;
            }

            if (shouldResolve) {
                alert.autoResolved = true;
                alert.resolvedAt = new Date();

                // Cancelar escalamiento
                const timer = this.escalationTimers.get(alertId);
                if (timer) {
                    clearTimeout(timer);
                    this.escalationTimers.delete(alertId);
                }

                this.emit('alertResolved', alert);

                logger.info(`✅ Alerta auto-resuelta: ${alert.title} para ${alert.vehicleName}`, {
                    alertId,
                    vehicleId: alert.vehicleId
                });
            }
        }
    }

    /**
     * Inicia el monitoreo de alertas
     */
    public startMonitoring(): void {
        if (this.checkInterval) {
            logger.warn('🚨 Monitoreo de alertas ya está activo');
            return;
        }

        logger.info('🚨 Iniciando monitoreo de alertas inteligentes para Bomberos Madrid');

        // Verificación inicial
        this.checkAllVehicles();

        // Configurar verificación periódica
        this.checkInterval = setInterval(() => {
            this.checkAllVehicles();
        }, this.CHECK_INTERVAL);

        this.emit('monitoringStarted');
    }

    /**
     * Detiene el monitoreo
     */
    public stopMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;

            // Limpiar timers de escalamiento
            this.escalationTimers.forEach(timer => clearTimeout(timer));
            this.escalationTimers.clear();

            logger.info('🚨 Monitoreo de alertas detenido');
            this.emit('monitoringStopped');
        }
    }

    /**
     * Obtiene todas las alertas activas
     */
    public getActiveAlerts(): FireAlert[] {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.acknowledged && !alert.autoResolved)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Obtiene alertas por severidad
     */
    public getAlertsBySeverity(severity: FireAlert['severity']): FireAlert[] {
        return this.getActiveAlerts().filter(alert => alert.severity === severity);
    }

    /**
     * Reconoce una alerta
     */
    public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
        const alert = this.alerts.get(alertId);
        if (!alert || alert.acknowledged) {
            return false;
        }

        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();

        // Cancelar escalamiento
        const timer = this.escalationTimers.get(alertId);
        if (timer) {
            clearTimeout(timer);
            this.escalationTimers.delete(alertId);
        }

        this.emit('alertAcknowledged', alert);

        logger.info(`✅ Alerta reconocida: ${alert.title} por ${acknowledgedBy}`, {
            alertId,
            vehicleId: alert.vehicleId
        });

        return true;
    }

    /**
     * Obtiene estadísticas de alertas
     */
    public getAlertStats() {
        const allAlerts = Array.from(this.alerts.values());
        const activeAlerts = allAlerts.filter(alert => !alert.acknowledged && !alert.autoResolved);

        return {
            total: allAlerts.length,
            active: activeAlerts.length,
            acknowledged: allAlerts.filter(alert => alert.acknowledged).length,
            autoResolved: allAlerts.filter(alert => alert.autoResolved).length,
            bySeverity: {
                CRITICAL: activeAlerts.filter(alert => alert.severity === 'CRITICAL').length,
                HIGH: activeAlerts.filter(alert => alert.severity === 'HIGH').length,
                MEDIUM: activeAlerts.filter(alert => alert.severity === 'MEDIUM').length,
                LOW: activeAlerts.filter(alert => alert.severity === 'LOW').length
            },
            byType: {
                EMERGENCY_RESPONSE: activeAlerts.filter(alert => alert.type === 'EMERGENCY_RESPONSE').length,
                VEHICLE_OFFLINE: activeAlerts.filter(alert => alert.type === 'VEHICLE_OFFLINE').length,
                HIGH_SPEED: activeAlerts.filter(alert => alert.type === 'HIGH_SPEED').length,
                GEOFENCE_VIOLATION: activeAlerts.filter(alert => alert.type === 'GEOFENCE_VIOLATION').length,
                MAINTENANCE_DUE: activeAlerts.filter(alert => alert.type === 'MAINTENANCE_DUE').length
            }
        };
    }

    /**
     * Verifica si el servicio está activo
     */
    public isMonitoring(): boolean {
        return this.checkInterval !== null;
    }
}

// Instancia singleton
export const intelligentAlertsService = new IntelligentAlertsService();

// Auto-iniciar en producción
if (process.env.NODE_ENV === 'production') {
    intelligentAlertsService.startMonitoring();
}

export default intelligentAlertsService;
