/**
 * 📈 SERVICIO DE ESCALAMIENTO AUTOMÁTICO DE ALERTAS - BOMBEROS MADRID
 * Sistema inteligente de escalamiento de alertas basado en severidad y tiempo
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { pushNotificationService } from './pushNotificationService';

// Tipos de datos para escalamiento de alertas
export interface EscalationRule {
    id: string;
    name: string;
    description: string;
    conditions: {
        alertTypes: string[];
        severities: string[];
        timeThresholds: {
            [severity: string]: number; // minutos
        };
        zones?: string[];
        vehicles?: string[];
    };
    escalation: {
        levels: EscalationLevel[];
        maxLevel: number;
        autoEscalate: boolean;
    };
    isActive: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EscalationLevel {
    level: number;
    name: string;
    description: string;
    timeThreshold: number; // minutos desde la alerta original
    actions: EscalationAction[];
    notifications: EscalationNotification[];
    recipients: {
        roles: string[];
        userIds: string[];
        channels: string[];
    };
}

export interface EscalationAction {
    type: 'NOTIFICATION' | 'EMAIL' | 'SMS' | 'CALL' | 'SYSTEM_ACTION' | 'LOG';
    config: {
        template?: string;
        message?: string;
        recipients?: string[];
        systemAction?: string;
        logLevel?: string;
        [key: string]: any;
    };
    delay: number; // segundos de retraso
    retry: {
        enabled: boolean;
        maxAttempts: number;
        interval: number; // segundos
    };
}

export interface EscalationNotification {
    type: 'PUSH' | 'EMAIL' | 'SMS' | 'WEBHOOK';
    template: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    data: { [key: string]: any };
}

export interface EscalatedAlert {
    id: string;
    originalAlertId: string;
    ruleId: string;
    currentLevel: number;
    maxLevel: number;
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED' | 'FAILED';
    escalationHistory: EscalationEvent[];
    metadata: {
        alertType: string;
        severity: string;
        zone?: string;
        vehicleId?: string;
        createdAt: Date;
        lastEscalated: Date;
        acknowledgedBy?: string;
        resolvedBy?: string;
        acknowledgedAt?: Date;
        resolvedAt?: Date;
    };
    nextEscalation?: Date;
    autoEscalate: boolean;
}

export interface EscalationEvent {
    id: string;
    level: number;
    action: string;
    status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'SKIPPED';
    executedAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    details: { [key: string]: any };
}

export interface EscalationStats {
    totalEscalated: number;
    activeEscalations: number;
    resolvedEscalations: number;
    failedEscalations: number;
    byLevel: { [level: number]: number };
    byRule: { [ruleId: string]: number };
    byStatus: {
        ACTIVE: number;
        ACKNOWLEDGED: number;
        RESOLVED: number;
        ESCALATED: number;
        FAILED: number;
    };
    averageResolutionTime: number; // minutos
    escalationRate: number; // porcentaje
}

class AlertEscalationService extends EventEmitter {
    private rules: Map<string, EscalationRule> = new Map();
    private escalatedAlerts: Map<string, EscalatedAlert> = new Map();
    private isRunning: boolean = false;
    private escalationInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.initializeService();
    }

    private initializeService(): void {
        logger.info('📈 Inicializando servicio de escalamiento automático de alertas');
        this.loadDefaultRules();
        this.startService();
    }

    /**
     * Carga reglas de escalamiento por defecto
     */
    private loadDefaultRules(): void {
        const defaultRules: EscalationRule[] = [
            {
                id: 'critical_emergency_escalation',
                name: 'Escalamiento de Emergencias Críticas',
                description: 'Escalamiento automático para emergencias críticas',
                conditions: {
                    alertTypes: ['EMERGENCY', 'CRITICAL'],
                    severities: ['CRITICAL', 'HIGH'],
                    timeThresholds: {
                        'CRITICAL': 2, // 2 minutos
                        'HIGH': 5      // 5 minutos
                    },
                    zones: ['centro-historico', 'zona-industrial-sur'],
                    vehicles: []
                },
                escalation: {
                    levels: [
                        {
                            level: 1,
                            name: 'Notificación Inicial',
                            description: 'Notificación a operadores de turno',
                            timeThreshold: 2,
                            actions: [
                                {
                                    type: 'NOTIFICATION',
                                    config: {
                                        template: 'critical_alert',
                                        message: 'Emergencia crítica detectada'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 3,
                                        interval: 30
                                    }
                                }
                            ],
                            notifications: [
                                {
                                    type: 'PUSH',
                                    template: 'critical_alert',
                                    priority: 'URGENT',
                                    data: {}
                                }
                            ],
                            recipients: {
                                roles: ['OPERATOR', 'SUPERVISOR'],
                                userIds: [],
                                channels: ['push', 'email']
                            }
                        },
                        {
                            level: 2,
                            name: 'Escalamiento a Supervisión',
                            description: 'Notificación a supervisores y jefes de turno',
                            timeThreshold: 5,
                            actions: [
                                {
                                    type: 'NOTIFICATION',
                                    config: {
                                        template: 'escalation_supervisor',
                                        message: 'Escalamiento a supervisión requerido'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 3,
                                        interval: 30
                                    }
                                },
                                {
                                    type: 'EMAIL',
                                    config: {
                                        template: 'escalation_email',
                                        recipients: ['supervisor@bomberos-madrid.es']
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 2,
                                        interval: 60
                                    }
                                }
                            ],
                            notifications: [
                                {
                                    type: 'PUSH',
                                    template: 'escalation_supervisor',
                                    priority: 'URGENT',
                                    data: {}
                                },
                                {
                                    type: 'EMAIL',
                                    template: 'escalation_email',
                                    priority: 'HIGH',
                                    data: {}
                                }
                            ],
                            recipients: {
                                roles: ['SUPERVISOR', 'MANAGER'],
                                userIds: [],
                                channels: ['push', 'email']
                            }
                        },
                        {
                            level: 3,
                            name: 'Escalamiento a Dirección',
                            description: 'Notificación a dirección y autoridades',
                            timeThreshold: 10,
                            actions: [
                                {
                                    type: 'NOTIFICATION',
                                    config: {
                                        template: 'escalation_director',
                                        message: 'Escalamiento a dirección requerido'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 3,
                                        interval: 30
                                    }
                                },
                                {
                                    type: 'CALL',
                                    config: {
                                        template: 'escalation_call',
                                        recipients: ['+34912345678']
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 2,
                                        interval: 120
                                    }
                                }
                            ],
                            notifications: [
                                {
                                    type: 'PUSH',
                                    template: 'escalation_director',
                                    priority: 'URGENT',
                                    data: {}
                                }
                            ],
                            recipients: {
                                roles: ['MANAGER', 'ADMIN'],
                                userIds: [],
                                channels: ['push', 'call']
                            }
                        }
                    ],
                    maxLevel: 3,
                    autoEscalate: true
                },
                isActive: true,
                priority: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'response_time_escalation',
                name: 'Escalamiento por Tiempos de Respuesta',
                description: 'Escalamiento cuando los tiempos de respuesta exceden objetivos',
                conditions: {
                    alertTypes: ['WARNING', 'ALERT'],
                    severities: ['HIGH', 'MEDIUM'],
                    timeThresholds: {
                        'HIGH': 10,   // 10 minutos
                        'MEDIUM': 15  // 15 minutos
                    },
                    zones: [],
                    vehicles: []
                },
                escalation: {
                    levels: [
                        {
                            level: 1,
                            name: 'Alerta de Tiempo',
                            description: 'Notificación de tiempo de respuesta lento',
                            timeThreshold: 10,
                            actions: [
                                {
                                    type: 'NOTIFICATION',
                                    config: {
                                        template: 'response_time_alert',
                                        message: 'Tiempo de respuesta excede objetivo'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 2,
                                        interval: 60
                                    }
                                }
                            ],
                            notifications: [
                                {
                                    type: 'PUSH',
                                    template: 'response_time_alert',
                                    priority: 'HIGH',
                                    data: {}
                                }
                            ],
                            recipients: {
                                roles: ['OPERATOR', 'SUPERVISOR'],
                                userIds: [],
                                channels: ['push']
                            }
                        },
                        {
                            level: 2,
                            name: 'Escalamiento Operativo',
                            description: 'Notificación a supervisión operativa',
                            timeThreshold: 15,
                            actions: [
                                {
                                    type: 'NOTIFICATION',
                                    config: {
                                        template: 'response_time_escalation',
                                        message: 'Escalamiento por tiempo de respuesta'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 2,
                                        interval: 60
                                    }
                                }
                            ],
                            notifications: [
                                {
                                    type: 'PUSH',
                                    template: 'response_time_escalation',
                                    priority: 'HIGH',
                                    data: {}
                                }
                            ],
                            recipients: {
                                roles: ['SUPERVISOR', 'MANAGER'],
                                userIds: [],
                                channels: ['push', 'email']
                            }
                        }
                    ],
                    maxLevel: 2,
                    autoEscalate: true
                },
                isActive: true,
                priority: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'vehicle_issue_escalation',
                name: 'Escalamiento de Problemas de Vehículos',
                description: 'Escalamiento para problemas con vehículos específicos',
                conditions: {
                    alertTypes: ['WARNING', 'ALERT'],
                    severities: ['MEDIUM', 'HIGH'],
                    timeThresholds: {
                        'HIGH': 5,    // 5 minutos
                        'MEDIUM': 10  // 10 minutos
                    },
                    zones: [],
                    vehicles: ['DOBACK027', 'DOBACK028'] // Vehículos críticos
                },
                escalation: {
                    levels: [
                        {
                            level: 1,
                            name: 'Alerta de Vehículo',
                            description: 'Notificación de problema con vehículo',
                            timeThreshold: 5,
                            actions: [
                                {
                                    type: 'NOTIFICATION',
                                    config: {
                                        template: 'vehicle_issue_alert',
                                        message: 'Problema detectado con vehículo'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 2,
                                        interval: 60
                                    }
                                },
                                {
                                    type: 'SYSTEM_ACTION',
                                    config: {
                                        systemAction: 'MARK_VEHICLE_MAINTENANCE',
                                        vehicleId: '${vehicleId}'
                                    },
                                    delay: 0,
                                    retry: {
                                        enabled: true,
                                        maxAttempts: 1,
                                        interval: 30
                                    }
                                }
                            ],
                            notifications: [
                                {
                                    type: 'PUSH',
                                    template: 'vehicle_issue_alert',
                                    priority: 'HIGH',
                                    data: {}
                                }
                            ],
                            recipients: {
                                roles: ['OPERATOR', 'MECHANIC'],
                                userIds: [],
                                channels: ['push']
                            }
                        }
                    ],
                    maxLevel: 1,
                    autoEscalate: true
                },
                isActive: true,
                priority: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        defaultRules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });

        logger.info(`📈 Cargadas ${defaultRules.length} reglas de escalamiento`);
    }

    /**
     * Inicia el servicio de escalamiento
     */
    startService(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.escalationInterval = setInterval(() => {
            this.processEscalations();
        }, 30000); // Verificar cada 30 segundos

        logger.info('📈 Servicio de escalamiento automático iniciado');
    }

    /**
     * Detiene el servicio de escalamiento
     */
    stopService(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.escalationInterval) {
            clearInterval(this.escalationInterval);
            this.escalationInterval = null;
        }

        logger.info('📈 Servicio de escalamiento automático detenido');
    }

    /**
     * Procesa una nueva alerta para escalamiento
     */
    async processAlert(alert: {
        id: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        zone?: string;
        vehicleId?: string;
        timestamp: Date;
    }): Promise<EscalatedAlert | null> {
        // Buscar reglas aplicables
        const applicableRules = this.findApplicableRules(alert);

        if (applicableRules.length === 0) {
            logger.info(`📈 No hay reglas de escalamiento aplicables para alerta ${alert.id}`);
            return null;
        }

        // Usar la regla con mayor prioridad
        const rule = applicableRules[0];

        // Crear escalamiento
        const escalatedAlert: EscalatedAlert = {
            id: `escalated_${alert.id}_${Date.now()}`,
            originalAlertId: alert.id,
            ruleId: rule.id,
            currentLevel: 0,
            maxLevel: rule.escalation.maxLevel,
            status: 'ACTIVE',
            escalationHistory: [],
            metadata: {
                alertType: alert.type,
                severity: alert.severity,
                zone: alert.zone,
                vehicleId: alert.vehicleId,
                createdAt: new Date(),
                lastEscalated: new Date()
            },
            nextEscalation: this.calculateNextEscalation(rule, 1),
            autoEscalate: rule.escalation.autoEscalate
        };

        this.escalatedAlerts.set(escalatedAlert.id, escalatedAlert);

        // Ejecutar nivel inicial
        await this.executeEscalationLevel(escalatedAlert, 1);

        this.emit('alertEscalated', escalatedAlert);

        logger.info(`📈 Alerta ${alert.id} escalada usando regla ${rule.id}`);
        return escalatedAlert;
    }

    /**
     * Encuentra reglas aplicables para una alerta
     */
    private findApplicableRules(alert: any): EscalationRule[] {
        const applicableRules: EscalationRule[] = [];

        for (const rule of this.rules.values()) {
            if (!rule.isActive) continue;

            // Verificar tipo de alerta
            if (!rule.conditions.alertTypes.includes(alert.type)) continue;

            // Verificar severidad
            if (!rule.conditions.severities.includes(alert.severity)) continue;

            // Verificar zona (si se especifica)
            if (rule.conditions.zones && rule.conditions.zones.length > 0) {
                if (!alert.zone || !rule.conditions.zones.includes(alert.zone)) continue;
            }

            // Verificar vehículo (si se especifica)
            if (rule.conditions.vehicles && rule.conditions.vehicles.length > 0) {
                if (!alert.vehicleId || !rule.conditions.vehicles.includes(alert.vehicleId)) continue;
            }

            applicableRules.push(rule);
        }

        // Ordenar por prioridad (menor número = mayor prioridad)
        return applicableRules.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Procesa escalamientos pendientes
     */
    private async processEscalations(): Promise<void> {
        const now = new Date();

        for (const escalatedAlert of this.escalatedAlerts.values()) {
            if (escalatedAlert.status !== 'ACTIVE') continue;
            if (!escalatedAlert.nextEscalation) continue;
            if (escalatedAlert.nextEscalation > now) continue;

            // Es hora de escalar
            const nextLevel = escalatedAlert.currentLevel + 1;

            if (nextLevel > escalatedAlert.maxLevel) {
                // Máximo nivel alcanzado
                escalatedAlert.status = 'ESCALATED';
                escalatedAlert.nextEscalation = undefined;
                this.emit('escalationCompleted', escalatedAlert);
                continue;
            }

            await this.executeEscalationLevel(escalatedAlert, nextLevel);
        }
    }

    /**
     * Ejecuta un nivel de escalamiento
     */
    private async executeEscalationLevel(escalatedAlert: EscalatedAlert, level: number): Promise<void> {
        const rule = this.rules.get(escalatedAlert.ruleId);
        if (!rule) return;

        const escalationLevel = rule.escalation.levels.find(l => l.level === level);
        if (!escalationLevel) return;

        // Crear evento de escalamiento
        const event: EscalationEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            level,
            action: `Escalamiento a nivel ${level}`,
            status: 'PENDING',
            details: {
                levelName: escalationLevel.name,
                description: escalationLevel.description
            }
        };

        try {
            // Ejecutar acciones
            for (const action of escalationLevel.actions) {
                await this.executeAction(action, escalatedAlert);
            }

            // Enviar notificaciones
            for (const notification of escalationLevel.notifications) {
                await this.sendNotification(notification, escalatedAlert);
            }

            event.status = 'EXECUTED';
            event.executedAt = new Date();

            // Actualizar estado del escalamiento
            escalatedAlert.currentLevel = level;
            escalatedAlert.metadata.lastEscalated = new Date();
            escalatedAlert.nextEscalation = this.calculateNextEscalation(rule, level + 1);
            escalatedAlert.escalationHistory.push(event);

            this.emit('escalationLevelExecuted', {
                escalatedAlert,
                level,
                event
            });

            logger.info(`📈 Escalamiento ${escaledAlert.id} ejecutado en nivel ${level}`);

        } catch (error) {
            event.status = 'FAILED';
            event.failedAt = new Date();
            event.failureReason = error instanceof Error ? error.message : 'Error desconocido';
            escalatedAlert.escalationHistory.push(event);

            logger.error(`📈 Error ejecutando escalamiento ${escaledAlert.id} nivel ${level}:`, error);
        }
    }

    /**
     * Ejecuta una acción de escalamiento
     */
    private async executeAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        // Simular retraso si se especifica
        if (action.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
        }

        switch (action.type) {
            case 'NOTIFICATION':
                await this.executeNotificationAction(action, escalatedAlert);
                break;
            case 'EMAIL':
                await this.executeEmailAction(action, escalatedAlert);
                break;
            case 'SMS':
                await this.executeSMSAction(action, escalatedAlert);
                break;
            case 'CALL':
                await this.executeCallAction(action, escalatedAlert);
                break;
            case 'SYSTEM_ACTION':
                await this.executeSystemAction(action, escalatedAlert);
                break;
            case 'LOG':
                await this.executeLogAction(action, escalatedAlert);
                break;
            default:
                logger.warn(`📈 Tipo de acción no soportado: ${action.type}`);
        }
    }

    /**
     * Ejecuta acción de notificación
     */
    private async executeNotificationAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        // Simular envío de notificación
        logger.info(`📈 Enviando notificación: ${action.config.message}`);

        // En producción, aquí se enviaría la notificación real
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    /**
     * Ejecuta acción de email
     */
    private async executeEmailAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        // Simular envío de email
        logger.info(`📈 Enviando email a: ${action.config.recipients?.join(', ')}`);

        // En producción, aquí se enviaría el email real
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * Ejecuta acción de SMS
     */
    private async executeSMSAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        // Simular envío de SMS
        logger.info(`📈 Enviando SMS a: ${action.config.recipients?.join(', ')}`);

        // En producción, aquí se enviaría el SMS real
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    /**
     * Ejecuta acción de llamada
     */
    private async executeCallAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        // Simular llamada telefónica
        logger.info(`📈 Realizando llamada a: ${action.config.recipients?.join(', ')}`);

        // En producción, aquí se realizaría la llamada real
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    /**
     * Ejecuta acción del sistema
     */
    private async executeSystemAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        const systemAction = action.config.systemAction;

        switch (systemAction) {
            case 'MARK_VEHICLE_MAINTENANCE':
                logger.info(`📈 Marcando vehículo ${escaledAlert.metadata.vehicleId} para mantenimiento`);
                break;
            case 'ACTIVATE_EMERGENCY_PROTOCOL':
                logger.info('📈 Activando protocolo de emergencia');
                break;
            case 'NOTIFY_AUTHORITIES':
                logger.info('📈 Notificando a autoridades');
                break;
            default:
                logger.warn(`📈 Acción del sistema no reconocida: ${systemAction}`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    /**
     * Ejecuta acción de log
     */
    private async executeLogAction(action: EscalationAction, escalatedAlert: EscalatedAlert): Promise<void> {
        const logLevel = action.config.logLevel || 'INFO';
        logger.info(`📈 Log [${logLevel}]: Escalamiento ${escaledAlert.id} - ${action.config.message}`);
    }

    /**
     * Envía notificación de escalamiento
     */
    private async sendNotification(notification: EscalationNotification, escalatedAlert: EscalatedAlert): Promise<void> {
        try {
            const notificationData = {
                title: `Escalamiento Nivel ${escaledAlert.currentLevel}`,
                body: notification.data.message || 'Escalamiento automático ejecutado',
                type: 'CRITICAL' as const,
                priority: notification.priority,
                category: 'SYSTEM' as const,
                data: {
                    ...notification.data,
                    escalatedAlertId: escalatedAlert.id,
                    originalAlertId: escalatedAlert.originalAlertId,
                    currentLevel: escalatedAlert.currentLevel,
                    maxLevel: escalatedAlert.maxLevel
                },
                recipients: {
                    roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'],
                    userIds: [],
                    devices: [],
                    channels: ['push']
                },
                scheduling: {
                    immediate: true,
                    maxRetries: 2
                }
            };

            await pushNotificationService.sendNotification(notificationData);

        } catch (error) {
            logger.error(`📈 Error enviando notificación de escalamiento:`, error);
        }
    }

    /**
     * Calcula el próximo escalamiento
     */
    private calculateNextEscalation(rule: EscalationRule, nextLevel: number): Date | undefined {
        if (nextLevel > rule.escalation.maxLevel) return undefined;

        const nextEscalationLevel = rule.escalation.levels.find(l => l.level === nextLevel);
        if (!nextEscalationLevel) return undefined;

        const now = new Date();
        return new Date(now.getTime() + nextEscalationLevel.timeThreshold * 60 * 1000);
    }

    /**
     * Reconoce un escalamiento
     */
    acknowledgeEscalation(escalatedAlertId: string, acknowledgedBy: string): boolean {
        const escalatedAlert = this.escalatedAlerts.get(escalatedAlertId);
        if (!escaledAlert || escalatedAlert.status !== 'ACTIVE') {
            return false;
        }

        escalatedAlert.status = 'ACKNOWLEDGED';
        escalatedAlert.metadata.acknowledgedBy = acknowledgedBy;
        escalatedAlert.metadata.acknowledgedAt = new Date();
        escalatedAlert.nextEscalation = undefined;

        this.emit('escalationAcknowledged', { escalatedAlert, acknowledgedBy });

        logger.info(`📈 Escalamiento ${escaledAlertId} reconocido por ${acknowledgedBy}`);
        return true;
    }

    /**
     * Resuelve un escalamiento
     */
    resolveEscalation(escalatedAlertId: string, resolvedBy: string): boolean {
        const escalatedAlert = this.escalatedAlerts.get(escalatedAlertId);
        if (!escaledAlert || escalatedAlert.status === 'RESOLVED') {
            return false;
        }

        escalatedAlert.status = 'RESOLVED';
        escalatedAlert.metadata.resolvedBy = resolvedBy;
        escalatedAlert.metadata.resolvedAt = new Date();
        escalatedAlert.nextEscalation = undefined;

        this.emit('escalationResolved', { escalatedAlert, resolvedBy });

        logger.info(`📈 Escalamiento ${escaledAlertId} resuelto por ${resolvedBy}`);
        return true;
    }

    /**
     * Obtiene todos los escalamientos
     */
    getAllEscalations(): EscalatedAlert[] {
        return Array.from(this.escalatedAlerts.values());
    }

    /**
     * Obtiene un escalamiento específico
     */
    getEscalation(escalatedAlertId: string): EscalatedAlert | undefined {
        return this.escalatedAlerts.get(escalatedAlertId);
    }

    /**
     * Obtiene todas las reglas
     */
    getAllRules(): EscalationRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Obtiene una regla específica
     */
    getRule(ruleId: string): EscalationRule | undefined {
        return this.rules.get(ruleId);
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats(): EscalationStats {
        const escalations = Array.from(this.escalatedAlerts.values());

        const byLevel: { [level: number]: number } = {};
        const byRule: { [ruleId: string]: number } = {};

        escalations.forEach(escalation => {
            byLevel[escalation.currentLevel] = (byLevel[escalation.currentLevel] || 0) + 1;
            byRule[escalation.ruleId] = (byRule[escalation.ruleId] || 0) + 1;
        });

        const resolvedEscalations = escalations.filter(e => e.status === 'RESOLVED');
        const averageResolutionTime = resolvedEscalations.length > 0
            ? resolvedEscalations.reduce((acc, e) => {
                if (e.metadata.resolvedAt && e.metadata.createdAt) {
                    return acc + (e.metadata.resolvedAt.getTime() - e.metadata.createdAt.getTime()) / (1000 * 60);
                }
                return acc;
            }, 0) / resolvedEscalations.length
            : 0;

        return {
            totalEscalated: escalations.length,
            activeEscalations: escalations.filter(e => e.status === 'ACTIVE').length,
            resolvedEscalations: escalations.filter(e => e.status === 'RESOLVED').length,
            failedEscalations: escalations.filter(e => e.status === 'FAILED').length,
            byLevel,
            byRule,
            byStatus: {
                ACTIVE: escalations.filter(e => e.status === 'ACTIVE').length,
                ACKNOWLEDGED: escalations.filter(e => e.status === 'ACKNOWLEDGED').length,
                RESOLVED: escalations.filter(e => e.status === 'RESOLVED').length,
                ESCALATED: escalations.filter(e => e.status === 'ESCALATED').length,
                FAILED: escalations.filter(e => e.status === 'FAILED').length
            },
            averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
            escalationRate: escalations.length > 0
                ? (escalations.filter(e => e.status === 'ESCALATED').length / escalations.length) * 100
                : 0
        };
    }
}

export const alertEscalationService = new AlertEscalationService();
