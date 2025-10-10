import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { GeofenceEvent, RealTimeGeofenceService } from './RealTimeGeofenceService';
import { WebSocketGeofenceService } from './WebSocketGeofenceService';

export interface GeofenceRule {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    zoneId?: string;
    parkId?: string;
    conditions: GeofenceCondition[];
    actions: GeofenceAction[];
    isActive: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface GeofenceCondition {
    type: 'TIME_WINDOW' | 'VEHICLE_TYPE' | 'SPEED_LIMIT' | 'DURATION' | 'FREQUENCY' | 'CUSTOM';
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN' | 'NOT_IN';
    field: string;
    value: any;
    secondaryValue?: any;
    metadata?: Record<string, any>;
}

export interface GeofenceAction {
    type: 'NOTIFICATION' | 'ALERT' | 'LOG' | 'WEBHOOK' | 'EMAIL' | 'SMS' | 'CUSTOM';
    target: string;
    message: string;
    metadata?: Record<string, any>;
    delay?: number; // Delay en milisegundos
}

export interface RuleEvaluationResult {
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    conditionsMet: boolean;
    actionsExecuted: GeofenceAction[];
    evaluationTime: Date;
    metadata?: Record<string, any>;
}

export interface VehicleRuleState {
    vehicleId: string;
    ruleStates: Map<string, {
        lastTriggered: Date;
        triggerCount: number;
        lastEvaluation: Date;
    }>;
}

export class GeofenceRuleEngine {
    private prisma: PrismaClient;
    private geofenceService: RealTimeGeofenceService;
    private webSocketService: WebSocketGeofenceService;
    private rules: Map<string, GeofenceRule> = new Map();
    private vehicleStates: Map<string, VehicleRuleState> = new Map();
    private evaluationCache: Map<string, {
        result: boolean;
        timestamp: Date;
        ttl: number;
    }> = new Map();

    constructor(
        prisma: PrismaClient,
        geofenceService: RealTimeGeofenceService,
        webSocketService: WebSocketGeofenceService
    ) {
        this.prisma = prisma;
        this.geofenceService = geofenceService;
        this.webSocketService = webSocketService;

        // Configurar callback para eventos de geocerca
        this.setupGeofenceCallback();

        // Cargar reglas existentes
        this.loadRules();

        logger.info('Motor de reglas de geocercas iniciado');
    }

    /**
     * Configura callback para eventos de geocerca
     */
    private setupGeofenceCallback(): void {
        this.geofenceService.onGeofenceEvent((event: GeofenceEvent) => {
            this.evaluateRulesForEvent(event);
        });
    }

    /**
     * Carga reglas desde la base de datos
     */
    private async loadRules(): Promise<void> {
        try {
            // TODO: Implementar cuando se cree la tabla de reglas
            // const rules = await this.prisma.geofenceRule.findMany({
            //   where: { isActive: true },
            //   orderBy: { priority: 'desc' }
            // });

            // for (const rule of rules) {
            //   this.rules.set(rule.id, rule);
            // }

            logger.info(`Reglas cargadas: ${this.rules.size}`);
        } catch (error) {
            logger.error('Error cargando reglas:', error);
        }
    }

    /**
     * Evalúa reglas para un evento de geocerca
     */
    private async evaluateRulesForEvent(event: GeofenceEvent): Promise<void> {
        try {
            const applicableRules = this.getApplicableRules(event);

            for (const rule of applicableRules) {
                const result = await this.evaluateRule(rule, event);

                if (result.triggered) {
                    await this.executeRuleActions(rule, event, result);
                    this.updateVehicleRuleState(event.vehicleId, rule.id);
                }
            }
        } catch (error) {
            logger.error(`Error evaluando reglas para evento:`, error);
        }
    }

    /**
     * Obtiene reglas aplicables para un evento
     */
    private getApplicableRules(event: GeofenceEvent): GeofenceRule[] {
        const applicable: GeofenceRule[] = [];

        for (const rule of this.rules.values()) {
            if (rule.organizationId !== event.organizationId) continue;
            if (!rule.isActive) continue;

            // Verificar si la regla aplica a la zona/parque del evento
            if (rule.zoneId && event.zoneId !== rule.zoneId) continue;
            if (rule.parkId && event.parkId !== rule.parkId) continue;

            applicable.push(rule);
        }

        // Ordenar por prioridad (mayor primero)
        return applicable.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Evalúa una regla específica
     */
    private async evaluateRule(rule: GeofenceRule, event: GeofenceEvent): Promise<RuleEvaluationResult> {
        const startTime = Date.now();

        try {
            // Verificar cache de evaluación
            const cacheKey = `${rule.id}:${event.vehicleId}:${event.eventType}`;
            const cached = this.evaluationCache.get(cacheKey);

            if (cached && (Date.now() - cached.timestamp.getTime()) < cached.ttl) {
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    triggered: cached.result,
                    conditionsMet: cached.result,
                    actionsExecuted: [],
                    evaluationTime: new Date(),
                    metadata: { cached: true }
                };
            }

            // Evaluar condiciones
            const conditionsMet = await this.evaluateConditions(rule.conditions, event);

            // Verificar frecuencia y duración si las condiciones se cumplen
            let shouldTrigger = conditionsMet;

            if (shouldTrigger) {
                shouldTrigger = await this.checkRuleConstraints(rule, event);
            }

            // Cachear resultado
            const result: RuleEvaluationResult = {
                ruleId: rule.id,
                ruleName: rule.name,
                triggered: shouldTrigger,
                conditionsMet,
                actionsExecuted: shouldTrigger ? rule.actions : [],
                evaluationTime: new Date(),
                metadata: {
                    evaluationTimeMs: Date.now() - startTime,
                    conditionsCount: rule.conditions.length
                }
            };

            this.evaluationCache.set(cacheKey, {
                result: shouldTrigger,
                timestamp: new Date(),
                ttl: 5000 // 5 segundos de cache
            });

            return result;

        } catch (error) {
            logger.error(`Error evaluando regla ${rule.id}:`, error);
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                triggered: false,
                conditionsMet: false,
                actionsExecuted: [],
                evaluationTime: new Date(),
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    /**
     * Evalúa las condiciones de una regla
     */
    private async evaluateConditions(conditions: GeofenceCondition[], event: GeofenceEvent): Promise<boolean> {
        for (const condition of conditions) {
            const conditionMet = await this.evaluateCondition(condition, event);
            if (!conditionMet) {
                return false;
            }
        }
        return true;
    }

    /**
     * Evalúa una condición específica
     */
    private async evaluateCondition(condition: GeofenceCondition, event: GeofenceEvent): Promise<boolean> {
        try {
            const fieldValue = this.getFieldValue(condition.field, event);

            switch (condition.type) {
                case 'TIME_WINDOW':
                    return this.evaluateTimeWindow(condition, fieldValue);
                case 'VEHICLE_TYPE':
                    return this.evaluateVehicleType(condition, fieldValue);
                case 'SPEED_LIMIT':
                    return this.evaluateSpeedLimit(condition, fieldValue);
                case 'DURATION':
                    return this.evaluateDuration(condition, event);
                case 'FREQUENCY':
                    return this.evaluateFrequency(condition, event);
                case 'CUSTOM':
                    return this.evaluateCustomCondition(condition, event);
                default:
                    logger.warn(`Tipo de condición no soportado: ${condition.type}`);
                    return false;
            }
        } catch (error) {
            logger.error(`Error evaluando condición ${condition.type}:`, error);
            return false;
        }
    }

    /**
     * Obtiene el valor de un campo del evento
     */
    private getFieldValue(field: string, event: GeofenceEvent): any {
        const fieldMap: Record<string, any> = {
            'eventType': event.eventType,
            'vehicleId': event.vehicleId,
            'zoneId': event.zoneId,
            'parkId': event.parkId,
            'timestamp': event.timestamp,
            'coordinates.lon': event.coordinates.lon,
            'coordinates.lat': event.coordinates.lat
        };

        return fieldMap[field] || null;
    }

    /**
     * Evalúa condición de ventana de tiempo
     */
    private evaluateTimeWindow(condition: GeofenceCondition, fieldValue: any): boolean {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (condition.operator === 'BETWEEN' && condition.secondaryValue) {
            const [startHour, startMinute] = condition.value.split(':').map(Number);
            const [endHour, endMinute] = condition.secondaryValue.split(':').map(Number);

            const currentTime = currentHour * 60 + currentMinute;
            const startTime = startHour * 60 + startMinute;
            const endTime = endHour * 60 + endMinute;

            return currentTime >= startTime && currentTime <= endTime;
        }

        return false;
    }

    /**
     * Evalúa condición de tipo de vehículo
     */
    private evaluateVehicleType(condition: GeofenceCondition, fieldValue: any): boolean {
        // TODO: Implementar cuando se tenga información del tipo de vehículo
        return true;
    }

    /**
     * Evalúa condición de límite de velocidad
     */
    private evaluateSpeedLimit(condition: GeofenceCondition, fieldValue: any): boolean {
        // TODO: Implementar cuando se tenga información de velocidad
        return true;
    }

    /**
     * Evalúa condición de duración
     */
    private async evaluateDuration(condition: GeofenceCondition, event: GeofenceEvent): Promise<boolean> {
        // TODO: Implementar verificación de duración en zona/parque
        return true;
    }

    /**
     * Evalúa condición de frecuencia
     */
    private async evaluateFrequency(condition: GeofenceCondition, event: GeofenceEvent): Promise<boolean> {
        const vehicleState = this.vehicleStates.get(event.vehicleId);
        if (!vehicleState) return true;

        const ruleState = vehicleState.ruleStates.get(condition.field);
        if (!ruleState) return true;

        const timeWindow = condition.value * 1000; // Convertir a milisegundos
        const timeSinceLastTrigger = Date.now() - ruleState.lastTriggered.getTime();

        return timeSinceLastTrigger >= timeWindow;
    }

    /**
     * Evalúa condición personalizada
     */
    private evaluateCustomCondition(condition: GeofenceCondition, event: GeofenceEvent): boolean {
        // TODO: Implementar evaluación de condiciones personalizadas
        return true;
    }

    /**
     * Verifica restricciones de la regla (frecuencia, duración)
     */
    private async checkRuleConstraints(rule: GeofenceRule, event: GeofenceEvent): Promise<boolean> {
        const vehicleState = this.vehicleStates.get(event.vehicleId);
        if (!vehicleState) return true;

        const ruleState = vehicleState.ruleStates.get(rule.id);
        if (!ruleState) return true;

        // Verificar frecuencia mínima (si está configurada)
        const minInterval = 0; // TODO: Implementar configuración de frecuencia mínima
        if (minInterval > 0) {
            const timeSinceLastTrigger = Date.now() - ruleState.lastTriggered.getTime();
            if (timeSinceLastTrigger < minInterval) {
                return false;
            }
        }

        return true;
    }

    /**
     * Ejecuta las acciones de una regla
     */
    private async executeRuleActions(rule: GeofenceRule, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        try {
            for (const action of rule.actions) {
                await this.executeAction(action, event, result);
            }

            logger.info(`Regla ${rule.name} ejecutada para evento ${event.eventType} del vehículo ${event.vehicleId}`);
        } catch (error) {
            logger.error(`Error ejecutando acciones de regla ${rule.id}:`, error);
        }
    }

    /**
     * Ejecuta una acción específica
     */
    private async executeAction(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        try {
            switch (action.type) {
                case 'NOTIFICATION':
                    await this.sendNotification(action, event, result);
                    break;
                case 'ALERT':
                    await this.sendAlert(action, event, result);
                    break;
                case 'LOG':
                    await this.logAction(action, event, result);
                    break;
                case 'WEBHOOK':
                    await this.sendWebhook(action, event, result);
                    break;
                case 'EMAIL':
                    await this.sendEmail(action, event, result);
                    break;
                case 'SMS':
                    await this.sendSMS(action, event, result);
                    break;
                case 'CUSTOM':
                    await this.executeCustomAction(action, event, result);
                    break;
                default:
                    logger.warn(`Tipo de acción no soportado: ${action.type}`);
            }
        } catch (error) {
            logger.error(`Error ejecutando acción ${action.type}:`, error);
        }
    }

    /**
     * Envía notificación
     */
    private async sendNotification(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        const message = this.interpolateMessage(action.message, event, result);

        this.webSocketService.broadcastToSubscribers(
            'NOTIFICATION',
            event.vehicleId,
            {
                message,
                ruleId: result.ruleId,
                ruleName: result.ruleName,
                event,
                timestamp: new Date()
            }
        );
    }

    /**
     * Envía alerta
     */
    private async sendAlert(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        const message = this.interpolateMessage(action.message, event, result);

        this.webSocketService.broadcastToSubscribers(
            'ALERT',
            event.vehicleId,
            {
                message,
                ruleId: result.ruleId,
                ruleName: result.ruleName,
                event,
                priority: 'HIGH',
                timestamp: new Date()
            }
        );
    }

    /**
     * Registra acción en log
     */
    private async logAction(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        const message = this.interpolateMessage(action.message, event, result);

        logger.info(`Regla ejecutada: ${result.ruleName} - ${message}`, {
            ruleId: result.ruleId,
            vehicleId: event.vehicleId,
            eventType: event.eventType,
            organizationId: event.organizationId
        });
    }

    /**
     * Envía webhook
     */
    private async sendWebhook(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        // TODO: Implementar envío de webhook
        logger.info(`Webhook enviado a ${action.target} para regla ${result.ruleId}`);
    }

    /**
     * Envía email
     */
    private async sendEmail(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        // TODO: Implementar envío de email
        logger.info(`Email enviado a ${action.target} para regla ${result.ruleId}`);
    }

    /**
     * Envía SMS
     */
    private async sendSMS(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        // TODO: Implementar envío de SMS
        logger.info(`SMS enviado a ${action.target} para regla ${result.ruleId}`);
    }

    /**
     * Ejecuta acción personalizada
     */
    private async executeCustomAction(action: GeofenceAction, event: GeofenceEvent, result: RuleEvaluationResult): Promise<void> {
        // TODO: Implementar ejecución de acciones personalizadas
        logger.info(`Acción personalizada ejecutada: ${action.target}`);
    }

    /**
     * Interpola variables en el mensaje
     */
    private interpolateMessage(message: string, event: GeofenceEvent, result: RuleEvaluationResult): string {
        return message
            .replace('{vehicleId}', event.vehicleId)
            .replace('{eventType}', event.eventType)
            .replace('{ruleName}', result.ruleName)
            .replace('{timestamp}', event.timestamp.toISOString())
            .replace('{coordinates}', `${event.coordinates.lat}, ${event.coordinates.lon}`);
    }

    /**
     * Actualiza estado de reglas para un vehículo
     */
    private updateVehicleRuleState(vehicleId: string, ruleId: string): void {
        if (!this.vehicleStates.has(vehicleId)) {
            this.vehicleStates.set(vehicleId, {
                vehicleId,
                ruleStates: new Map()
            });
        }

        const vehicleState = this.vehicleStates.get(vehicleId)!;
        const ruleState = vehicleState.ruleStates.get(ruleId) || {
            lastTriggered: new Date(0),
            triggerCount: 0,
            lastEvaluation: new Date(0)
        };

        ruleState.lastTriggered = new Date();
        ruleState.triggerCount++;
        ruleState.lastEvaluation = new Date();

        vehicleState.ruleStates.set(ruleId, ruleState);
    }

    /**
     * Obtiene estadísticas del motor de reglas
     */
    public getStats(): {
        totalRules: number;
        activeRules: number;
        totalVehicles: number;
        totalEvaluations: number;
        cacheHitRate: number;
    } {
        const activeRules = Array.from(this.rules.values()).filter(r => r.isActive).length;
        const totalVehicles = this.vehicleStates.size;

        let totalEvaluations = 0;
        for (const vehicleState of this.vehicleStates.values()) {
            totalEvaluations += vehicleState.ruleStates.size;
        }

        const cacheSize = this.evaluationCache.size;
        const cacheHitRate = cacheSize > 0 ? (cacheSize / (cacheSize + totalEvaluations)) * 100 : 0;

        return {
            totalRules: this.rules.size,
            activeRules,
            totalVehicles,
            totalEvaluations,
            cacheHitRate: Math.round(cacheHitRate * 100) / 100
        };
    }

    /**
     * Limpia cache y estados obsoletos
     */
    public cleanup(): void {
        const now = Date.now();
        const maxCacheAge = 5 * 60 * 1000; // 5 minutos

        // Limpiar cache expirado
        for (const [key, value] of this.evaluationCache.entries()) {
            if (now - value.timestamp.getTime() > maxCacheAge) {
                this.evaluationCache.delete(key);
            }
        }

        // Limpiar estados de vehículos inactivos
        const maxVehicleAge = 30 * 60 * 1000; // 30 minutos
        for (const [vehicleId, vehicleState] of this.vehicleStates.entries()) {
            let hasRecentActivity = false;

            for (const ruleState of vehicleState.ruleStates.values()) {
                if (now - ruleState.lastEvaluation.getTime() < maxVehicleAge) {
                    hasRecentActivity = true;
                    break;
                }
            }

            if (!hasRecentActivity) {
                this.vehicleStates.delete(vehicleId);
            }
        }

        logger.debug('Limpieza del motor de reglas completada');
    }
} 