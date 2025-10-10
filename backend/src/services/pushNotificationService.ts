/**
 * 📱 SERVICIO DE NOTIFICACIONES PUSH - BOMBEROS MADRID
 * Sistema de notificaciones en tiempo real para alertas críticas
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Tipos de datos para notificaciones push
export interface PushNotification {
    id: string;
    title: string;
    body: string;
    type: 'EMERGENCY' | 'ALERT' | 'INFO' | 'WARNING' | 'CRITICAL';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    category: 'VEHICLE' | 'ZONE' | 'INCIDENT' | 'SYSTEM' | 'GENERAL';
    data: {
        incidentId?: string;
        vehicleId?: string;
        zoneId?: string;
        alertId?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        actionUrl?: string;
        [key: string]: any;
    };
    recipients: {
        userIds?: string[];
        roles?: string[];
        devices?: string[];
        channels?: string[];
    };
    scheduling: {
        immediate: boolean;
        scheduledAt?: Date;
        expiresAt?: Date;
        retryCount?: number;
        maxRetries?: number;
    };
    delivery: {
        sent: boolean;
        delivered: boolean;
        failed: boolean;
        sentAt?: Date;
        deliveredAt?: Date;
        failedAt?: Date;
        failureReason?: string;
        retryAttempts: number;
    };
    metadata: {
        createdBy: string;
        createdAt: Date;
        organizationId: string;
        source: string;
        tags: string[];
    };
}

export interface NotificationTemplate {
    id: string;
    name: string;
    type: PushNotification['type'];
    category: PushNotification['category'];
    title: string;
    body: string;
    priority: PushNotification['priority'];
    variables: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationSubscription {
    userId: string;
    deviceId: string;
    deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'WEB';
    pushToken: string;
    isActive: boolean;
    preferences: {
        emergency: boolean;
        alerts: boolean;
        info: boolean;
        warning: boolean;
        critical: boolean;
        categories: {
            vehicle: boolean;
            zone: boolean;
            incident: boolean;
            system: boolean;
            general: boolean;
        };
        quietHours: {
            enabled: boolean;
            start: string; // HH:MM
            end: string; // HH:MM
            timezone: string;
        };
    };
    createdAt: Date;
    lastSeen: Date;
}

export interface NotificationStats {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    byType: {
        EMERGENCY: number;
        ALERT: number;
        INFO: number;
        WARNING: number;
        CRITICAL: number;
    };
    byCategory: {
        VEHICLE: number;
        ZONE: number;
        INCIDENT: number;
        SYSTEM: number;
        GENERAL: number;
    };
    byPriority: {
        LOW: number;
        NORMAL: number;
        HIGH: number;
        URGENT: number;
    };
    activeSubscriptions: number;
    failedDeliveries: number;
    retryAttempts: number;
}

class PushNotificationService extends EventEmitter {
    private notifications: Map<string, PushNotification> = new Map();
    private templates: Map<string, NotificationTemplate> = new Map();
    private subscriptions: Map<string, NotificationSubscription> = new Map();
    private isRunning: boolean = false;
    private retryQueue: string[] = [];
    private retryInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.initializeService();
    }

    private initializeService(): void {
        logger.info('📱 Inicializando servicio de notificaciones push');
        this.loadDefaultTemplates();
        this.loadSampleSubscriptions();
        this.startService();
    }

    /**
     * Carga plantillas de notificaciones por defecto
     */
    private loadDefaultTemplates(): void {
        const defaultTemplates: NotificationTemplate[] = [
            {
                id: 'emergency_vehicle_deployed',
                name: 'Vehículo Desplegado en Emergencia',
                type: 'EMERGENCY',
                category: 'VEHICLE',
                title: '🚨 EMERGENCIA: Vehículo {vehicleId} desplegado',
                body: 'Vehículo {vehicleId} desplegado en {zone} para {incidentType}. Tiempo estimado: {eta} minutos.',
                priority: 'URGENT',
                variables: ['vehicleId', 'zone', 'incidentType', 'eta'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'critical_alert',
                name: 'Alerta Crítica',
                type: 'CRITICAL',
                category: 'ALERT',
                title: '⚠️ ALERTA CRÍTICA: {title}',
                body: '{description}. Zona afectada: {zone}. Acción requerida inmediatamente.',
                priority: 'URGENT',
                variables: ['title', 'description', 'zone'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'response_time_alert',
                name: 'Alerta de Tiempo de Respuesta',
                type: 'WARNING',
                category: 'INCIDENT',
                title: '⏱️ Tiempo de respuesta lento',
                body: 'Tiempo de respuesta en {zone}: {responseTime} minutos (objetivo: {target} minutos)',
                priority: 'HIGH',
                variables: ['zone', 'responseTime', 'target'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'system_maintenance',
                name: 'Mantenimiento del Sistema',
                type: 'INFO',
                category: 'SYSTEM',
                title: '🔧 Mantenimiento programado',
                body: 'El sistema estará en mantenimiento de {startTime} a {endTime}. Servicios críticos seguirán funcionando.',
                priority: 'NORMAL',
                variables: ['startTime', 'endTime'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'zone_risk_update',
                name: 'Actualización de Riesgo de Zona',
                type: 'INFO',
                category: 'ZONE',
                title: '🗺️ Actualización de riesgo en {zone}',
                body: 'Nivel de riesgo actualizado a {riskLevel} en {zone}. {recommendations}',
                priority: 'NORMAL',
                variables: ['zone', 'riskLevel', 'recommendations'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });

        logger.info(`📱 Cargadas ${defaultTemplates.length} plantillas de notificaciones`);
    }

    /**
     * Carga suscripciones de ejemplo
     */
    private loadSampleSubscriptions(): void {
        const sampleSubscriptions: NotificationSubscription[] = [
            {
                userId: 'admin_user',
                deviceId: 'device_001',
                deviceType: 'MOBILE',
                pushToken: 'sample_push_token_001',
                isActive: true,
                preferences: {
                    emergency: true,
                    alerts: true,
                    info: true,
                    warning: true,
                    critical: true,
                    categories: {
                        vehicle: true,
                        zone: true,
                        incident: true,
                        system: true,
                        general: true
                    },
                    quietHours: {
                        enabled: false,
                        start: '22:00',
                        end: '07:00',
                        timezone: 'Europe/Madrid'
                    }
                },
                createdAt: new Date(),
                lastSeen: new Date()
            },
            {
                userId: 'manager_user',
                deviceId: 'device_002',
                deviceType: 'DESKTOP',
                pushToken: 'sample_push_token_002',
                isActive: true,
                preferences: {
                    emergency: true,
                    alerts: true,
                    info: false,
                    warning: true,
                    critical: true,
                    categories: {
                        vehicle: true,
                        zone: true,
                        incident: true,
                        system: false,
                        general: false
                    },
                    quietHours: {
                        enabled: true,
                        start: '20:00',
                        end: '08:00',
                        timezone: 'Europe/Madrid'
                    }
                },
                createdAt: new Date(),
                lastSeen: new Date()
            }
        ];

        sampleSubscriptions.forEach(subscription => {
            this.subscriptions.set(`${subscription.userId}_${subscription.deviceId}`, subscription);
        });

        logger.info(`📱 Cargadas ${sampleSubscriptions.length} suscripciones de ejemplo`);
    }

    /**
     * Inicia el servicio de notificaciones
     */
    startService(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startRetryProcessor();

        logger.info('📱 Servicio de notificaciones push iniciado');
    }

    /**
     * Detiene el servicio de notificaciones
     */
    stopService(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }

        logger.info('📱 Servicio de notificaciones push detenido');
    }

    /**
     * Envía una notificación push
     */
    async sendNotification(notification: Omit<PushNotification, 'id' | 'delivery' | 'metadata'>): Promise<PushNotification> {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullNotification: PushNotification = {
            ...notification,
            id,
            delivery: {
                sent: false,
                delivered: false,
                failed: false,
                retryAttempts: 0
            },
            metadata: {
                createdBy: 'system',
                createdAt: new Date(),
                organizationId: 'bomberos-madrid',
                source: 'push-notification-service',
                tags: [notification.type, notification.category, notification.priority]
            }
        };

        this.notifications.set(id, fullNotification);

        try {
            await this.processNotification(fullNotification);
        } catch (error) {
            logger.error(`Error enviando notificación ${id}:`, error);
            fullNotification.delivery.failed = true;
            fullNotification.delivery.failedAt = new Date();
            fullNotification.delivery.failureReason = error instanceof Error ? error.message : 'Error desconocido';

            // Agregar a cola de reintentos si no se ha excedido el límite
            if (fullNotification.delivery.retryAttempts < (fullNotification.scheduling.maxRetries || 3)) {
                this.retryQueue.push(id);
            }
        }

        this.emit('notificationSent', fullNotification);

        logger.info(`📱 Notificación enviada: ${id} - ${fullNotification.title}`);
        return fullNotification;
    }

    /**
     * Procesa una notificación para envío
     */
    private async processNotification(notification: PushNotification): Promise<void> {
        // Verificar si es inmediata o programada
        if (!notification.scheduling.immediate && notification.scheduling.scheduledAt) {
            const now = new Date();
            if (notification.scheduling.scheduledAt > now) {
                // Programar para más tarde
                setTimeout(() => {
                    this.processNotification(notification);
                }, notification.scheduling.scheduledAt.getTime() - now.getTime());
                return;
            }
        }

        // Verificar expiración
        if (notification.scheduling.expiresAt && notification.scheduling.expiresAt < new Date()) {
            throw new Error('Notificación expirada');
        }

        // Obtener destinatarios
        const recipients = this.getRecipients(notification.recipients);

        if (recipients.length === 0) {
            throw new Error('No hay destinatarios válidos');
        }

        // Enviar a cada destinatario
        const deliveryPromises = recipients.map(recipient =>
            this.sendToRecipient(notification, recipient)
        );

        await Promise.allSettled(deliveryPromises);

        // Marcar como enviada
        notification.delivery.sent = true;
        notification.delivery.sentAt = new Date();
    }

    /**
     * Obtiene la lista de destinatarios
     */
    private getRecipients(recipients: PushNotification['recipients']): NotificationSubscription[] {
        let subscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.isActive);

        // Filtrar por IDs de usuario
        if (recipients.userIds && recipients.userIds.length > 0) {
            subscriptions = subscriptions.filter(sub =>
                recipients.userIds!.includes(sub.userId)
            );
        }

        // Filtrar por roles (simulado - en producción vendría de la base de datos)
        if (recipients.roles && recipients.roles.length > 0) {
            // Por simplicidad, asumimos que todos los usuarios tienen los roles necesarios
            // En producción esto se consultaría desde la base de datos de usuarios
        }

        // Filtrar por dispositivos
        if (recipients.devices && recipients.devices.length > 0) {
            subscriptions = subscriptions.filter(sub =>
                recipients.devices!.includes(sub.deviceId)
            );
        }

        return subscriptions;
    }

    /**
     * Envía notificación a un destinatario específico
     */
    private async sendToRecipient(
        notification: PushNotification,
        recipient: NotificationSubscription
    ): Promise<void> {
        // Verificar preferencias del usuario
        if (!this.shouldSendToUser(notification, recipient)) {
            return;
        }

        // Verificar horas silenciosas
        if (this.isInQuietHours(recipient)) {
            // Para notificaciones urgentes, enviar de todas formas
            if (notification.priority !== 'URGENT' && notification.type !== 'EMERGENCY') {
                return;
            }
        }

        // Simular envío de notificación push
        await this.simulatePushDelivery(notification, recipient);
    }

    /**
     * Verifica si se debe enviar la notificación al usuario
     */
    private shouldSendToUser(
        notification: PushNotification,
        recipient: NotificationSubscription
    ): boolean {
        const prefs = recipient.preferences;

        // Verificar tipo de notificación
        switch (notification.type) {
            case 'EMERGENCY':
                return prefs.emergency;
            case 'ALERT':
                return prefs.alerts;
            case 'INFO':
                return prefs.info;
            case 'WARNING':
                return prefs.warning;
            case 'CRITICAL':
                return prefs.critical;
            default:
                return false;
        }
    }

    /**
     * Verifica si está en horas silenciosas
     */
    private isInQuietHours(recipient: NotificationSubscription): boolean {
        if (!recipient.preferences.quietHours.enabled) {
            return false;
        }

        const now = new Date();
        const currentTime = now.toLocaleTimeString('es-ES', {
            hour12: false,
            timeZone: recipient.preferences.quietHours.timezone
        });

        const start = recipient.preferences.quietHours.start;
        const end = recipient.preferences.quietHours.end;

        // Lógica simple para horas silenciosas (asume que no cruzan medianoche)
        return currentTime >= start && currentTime <= end;
    }

    /**
     * Simula el envío de una notificación push
     */
    private async simulatePushDelivery(
        notification: PushNotification,
        recipient: NotificationSubscription
    ): Promise<void> {
        // Simular latencia de red
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Simular tasa de éxito del 95%
        const success = Math.random() > 0.05;

        if (success) {
            notification.delivery.delivered = true;
            notification.delivery.deliveredAt = new Date();
            recipient.lastSeen = new Date();

            this.emit('notificationDelivered', {
                notification,
                recipient: recipient.userId,
                deviceId: recipient.deviceId
            });
        } else {
            throw new Error('Falló la entrega de la notificación push');
        }
    }

    /**
     * Inicia el procesador de reintentos
     */
    private startRetryProcessor(): void {
        this.retryInterval = setInterval(() => {
            this.processRetryQueue();
        }, 30000); // Procesar cada 30 segundos
    }

    /**
     * Procesa la cola de reintentos
     */
    private async processRetryQueue(): Promise<void> {
        if (this.retryQueue.length === 0) return;

        const toRetry = this.retryQueue.splice(0, 10); // Procesar máximo 10 a la vez

        for (const notificationId of toRetry) {
            const notification = this.notifications.get(notificationId);
            if (!notification) continue;

            notification.delivery.retryAttempts++;
            notification.delivery.failed = false;
            notification.delivery.failureReason = undefined;

            try {
                await this.processNotification(notification);
                logger.info(`📱 Reintento exitoso para notificación ${notificationId}`);
            } catch (error) {
                notification.delivery.failed = true;
                notification.delivery.failedAt = new Date();
                notification.delivery.failureReason = error instanceof Error ? error.message : 'Error desconocido';

                // Si no se ha excedido el límite de reintentos, volver a agregar a la cola
                if (notification.delivery.retryAttempts < (notification.scheduling.maxRetries || 3)) {
                    this.retryQueue.push(notificationId);
                } else {
                    logger.error(`📱 Notificación ${notificationId} falló definitivamente después de ${notification.delivery.retryAttempts} intentos`);
                }
            }
        }
    }

    /**
     * Envía notificación usando una plantilla
     */
    async sendTemplateNotification(
        templateId: string,
        variables: { [key: string]: string },
        recipients: PushNotification['recipients']
    ): Promise<PushNotification> {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Plantilla ${templateId} no encontrada`);
        }

        if (!template.isActive) {
            throw new Error(`Plantilla ${templateId} está inactiva`);
        }

        // Reemplazar variables en el título y cuerpo
        let title = template.title;
        let body = template.body;

        template.variables.forEach(variable => {
            const value = variables[variable] || `{${variable}}`;
            title = title.replace(new RegExp(`{${variable}}`, 'g'), value);
            body = body.replace(new RegExp(`{${variable}}`, 'g'), value);
        });

        const notification: Omit<PushNotification, 'id' | 'delivery' | 'metadata'> = {
            title,
            body,
            type: template.type,
            priority: template.priority,
            category: template.category,
            data: variables,
            recipients,
            scheduling: {
                immediate: true,
                maxRetries: 3
            }
        };

        return await this.sendNotification(notification);
    }

    /**
     * Registra una suscripción de dispositivo
     */
    registerSubscription(subscription: Omit<NotificationSubscription, 'createdAt' | 'lastSeen'>): void {
        const key = `${subscription.userId}_${subscription.deviceId}`;
        const fullSubscription: NotificationSubscription = {
            ...subscription,
            createdAt: new Date(),
            lastSeen: new Date()
        };

        this.subscriptions.set(key, fullSubscription);
        this.emit('subscriptionRegistered', fullSubscription);

        logger.info(`📱 Suscripción registrada: ${key}`);
    }

    /**
     * Desregistra una suscripción de dispositivo
     */
    unregisterSubscription(userId: string, deviceId: string): boolean {
        const key = `${userId}_${deviceId}`;
        const removed = this.subscriptions.delete(key);

        if (removed) {
            this.emit('subscriptionUnregistered', { userId, deviceId });
            logger.info(`📱 Suscripción desregistrada: ${key}`);
        }

        return removed;
    }

    /**
     * Obtiene todas las notificaciones
     */
    getAllNotifications(): PushNotification[] {
        return Array.from(this.notifications.values());
    }

    /**
     * Obtiene una notificación específica
     */
    getNotification(notificationId: string): PushNotification | undefined {
        return this.notifications.get(notificationId);
    }

    /**
     * Obtiene todas las plantillas
     */
    getAllTemplates(): NotificationTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * Obtiene todas las suscripciones
     */
    getAllSubscriptions(): NotificationSubscription[] {
        return Array.from(this.subscriptions.values());
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats(): NotificationStats {
        const notifications = Array.from(this.notifications.values());
        const subscriptions = Array.from(this.subscriptions.values());

        const totalSent = notifications.length;
        const totalDelivered = notifications.filter(n => n.delivery.delivered).length;
        const totalFailed = notifications.filter(n => n.delivery.failed).length;
        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

        return {
            totalSent,
            totalDelivered,
            totalFailed,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            byType: {
                EMERGENCY: notifications.filter(n => n.type === 'EMERGENCY').length,
                ALERT: notifications.filter(n => n.type === 'ALERT').length,
                INFO: notifications.filter(n => n.type === 'INFO').length,
                WARNING: notifications.filter(n => n.type === 'WARNING').length,
                CRITICAL: notifications.filter(n => n.type === 'CRITICAL').length
            },
            byCategory: {
                VEHICLE: notifications.filter(n => n.category === 'VEHICLE').length,
                ZONE: notifications.filter(n => n.category === 'ZONE').length,
                INCIDENT: notifications.filter(n => n.category === 'INCIDENT').length,
                SYSTEM: notifications.filter(n => n.category === 'SYSTEM').length,
                GENERAL: notifications.filter(n => n.category === 'GENERAL').length
            },
            byPriority: {
                LOW: notifications.filter(n => n.priority === 'LOW').length,
                NORMAL: notifications.filter(n => n.priority === 'NORMAL').length,
                HIGH: notifications.filter(n => n.priority === 'HIGH').length,
                URGENT: notifications.filter(n => n.priority === 'URGENT').length
            },
            activeSubscriptions: subscriptions.filter(s => s.isActive).length,
            failedDeliveries: totalFailed,
            retryAttempts: notifications.reduce((acc, n) => acc + n.delivery.retryAttempts, 0)
        };
    }
}

export const pushNotificationService = new PushNotificationService();
