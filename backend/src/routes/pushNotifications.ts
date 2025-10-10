/**
 * 📱 RUTAS DE NOTIFICACIONES PUSH - BOMBEROS MADRID
 * Endpoints para el sistema de notificaciones push en tiempo real
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationSubscription, PushNotification, pushNotificationService } from '../services/pushNotificationService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * POST /api/push-notifications/send
 * Envía una notificación push
 */
router.post('/send', async (req: Request, res: Response) => {
    try {
        const {
            title,
            body,
            type,
            priority,
            category,
            data,
            recipients,
            scheduling
        } = req.body;

        // Validar campos requeridos
        if (!title || !body || !type || !priority || !category) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: title, body, type, priority, category'
            });
        }

        // Validar tipos y prioridades
        const validTypes = ['EMERGENCY', 'ALERT', 'INFO', 'WARNING', 'CRITICAL'];
        const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        const validCategories = ['VEHICLE', 'ZONE', 'INCIDENT', 'SYSTEM', 'GENERAL'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Tipo inválido. Valores válidos: ${validTypes.join(', ')}`
            });
        }

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                error: `Prioridad inválida. Valores válidos: ${validPriorities.join(', ')}`
            });
        }

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: `Categoría inválida. Valores válidos: ${validCategories.join(', ')}`
            });
        }

        const notificationData: Omit<PushNotification, 'id' | 'delivery' | 'metadata'> = {
            title,
            body,
            type: type as PushNotification['type'],
            priority: priority as PushNotification['priority'],
            category: category as PushNotification['category'],
            data: data || {},
            recipients: recipients || {},
            scheduling: {
                immediate: true,
                maxRetries: 3,
                ...scheduling
            }
        };

        const notification = await pushNotificationService.sendNotification(notificationData);

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notificación enviada exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error enviando notificación push:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/push-notifications/send-template
 * Envía una notificación usando una plantilla
 */
router.post('/send-template', async (req: Request, res: Response) => {
    try {
        const { templateId, variables, recipients } = req.body;

        if (!templateId || !variables || !recipients) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: templateId, variables, recipients'
            });
        }

        const notification = await pushNotificationService.sendTemplateNotification(
            templateId,
            variables,
            recipients
        );

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notificación enviada usando plantilla exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error enviando notificación con plantilla:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/push-notifications
 * Obtiene todas las notificaciones
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            type,
            category,
            priority,
            status,
            limit = '50',
            offset = '0'
        } = req.query;

        let notifications = pushNotificationService.getAllNotifications();

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            notifications = notifications.filter(n => n.type === type.toUpperCase());
        }

        // Filtrar por categoría
        if (category && typeof category === 'string') {
            notifications = notifications.filter(n => n.category === category.toUpperCase());
        }

        // Filtrar por prioridad
        if (priority && typeof priority === 'string') {
            notifications = notifications.filter(n => n.priority === priority.toUpperCase());
        }

        // Filtrar por estado
        if (status && typeof status === 'string') {
            switch (status.toLowerCase()) {
                case 'sent':
                    notifications = notifications.filter(n => n.delivery.sent);
                    break;
                case 'delivered':
                    notifications = notifications.filter(n => n.delivery.delivered);
                    break;
                case 'failed':
                    notifications = notifications.filter(n => n.delivery.failed);
                    break;
                case 'pending':
                    notifications = notifications.filter(n => !n.delivery.sent);
                    break;
            }
        }

        // Ordenar por fecha de creación (más recientes primero)
        notifications.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedNotifications = notifications.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedNotifications,
            pagination: {
                total: notifications.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < notifications.length
            },
            filters: {
                type: type || 'all',
                category: category || 'all',
                priority: priority || 'all',
                status: status || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo notificaciones push:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/push-notifications/:notificationId
 * Obtiene una notificación específica
 */
router.get('/:notificationId', async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const notification = pushNotificationService.getNotification(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notificación no encontrada'
            });
        }

        res.json({
            success: true,
            data: notification,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo notificación ${req.params.notificationId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/push-notifications/templates
 * Obtiene todas las plantillas de notificaciones
 */
router.get('/templates', async (req: Request, res: Response) => {
    try {
        const { active, type, category } = req.query;

        let templates = pushNotificationService.getAllTemplates();

        // Filtrar por estado activo
        if (active !== undefined) {
            const isActive = active === 'true';
            templates = templates.filter(t => t.isActive === isActive);
        }

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            templates = templates.filter(t => t.type === type.toUpperCase());
        }

        // Filtrar por categoría
        if (category && typeof category === 'string') {
            templates = templates.filter(t => t.category === category.toUpperCase());
        }

        // Ordenar por nombre
        templates.sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            success: true,
            data: templates,
            filters: {
                active: active || 'all',
                type: type || 'all',
                category: category || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo plantillas de notificaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/push-notifications/subscriptions
 * Obtiene todas las suscripciones
 */
router.get('/subscriptions', async (req: Request, res: Response) => {
    try {
        const { userId, active, deviceType } = req.query;

        let subscriptions = pushNotificationService.getAllSubscriptions();

        // Filtrar por usuario
        if (userId && typeof userId === 'string') {
            subscriptions = subscriptions.filter(s => s.userId === userId);
        }

        // Filtrar por estado activo
        if (active !== undefined) {
            const isActive = active === 'true';
            subscriptions = subscriptions.filter(s => s.isActive === isActive);
        }

        // Filtrar por tipo de dispositivo
        if (deviceType && typeof deviceType === 'string') {
            subscriptions = subscriptions.filter(s => s.deviceType === deviceType.toUpperCase());
        }

        // Ordenar por fecha de creación (más recientes primero)
        subscriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.json({
            success: true,
            data: subscriptions,
            filters: {
                userId: userId || 'all',
                active: active || 'all',
                deviceType: deviceType || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo suscripciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/push-notifications/subscriptions
 * Registra una nueva suscripción
 */
router.post('/subscriptions', async (req: Request, res: Response) => {
    try {
        const {
            userId,
            deviceId,
            deviceType,
            pushToken,
            isActive = true,
            preferences
        } = req.body;

        if (!userId || !deviceId || !deviceType || !pushToken) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: userId, deviceId, deviceType, pushToken'
            });
        }

        // Validar tipo de dispositivo
        const validDeviceTypes = ['MOBILE', 'TABLET', 'DESKTOP', 'WEB'];
        if (!validDeviceTypes.includes(deviceType.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: `Tipo de dispositivo inválido. Valores válidos: ${validDeviceTypes.join(', ')}`
            });
        }

        const subscriptionData: Omit<NotificationSubscription, 'createdAt' | 'lastSeen'> = {
            userId,
            deviceId,
            deviceType: deviceType.toUpperCase() as NotificationSubscription['deviceType'],
            pushToken,
            isActive,
            preferences: preferences || {
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
            }
        };

        pushNotificationService.registerSubscription(subscriptionData);

        res.status(201).json({
            success: true,
            message: 'Suscripción registrada exitosamente',
            data: {
                userId,
                deviceId,
                deviceType: deviceType.toUpperCase()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error registrando suscripción:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/push-notifications/subscriptions/:userId/:deviceId
 * Desregistra una suscripción
 */
router.delete('/subscriptions/:userId/:deviceId', async (req: Request, res: Response) => {
    try {
        const { userId, deviceId } = req.params;

        const removed = pushNotificationService.unregisterSubscription(userId, deviceId);

        if (removed) {
            res.json({
                success: true,
                message: 'Suscripción desregistrada exitosamente',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }
    } catch (error) {
        logger.error(`Error desregistrando suscripción ${req.params.userId}/${req.params.deviceId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/push-notifications/stats
 * Obtiene estadísticas del servicio
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = pushNotificationService.getStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de notificaciones push:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/push-notifications/status
 * Obtiene el estado del servicio
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const stats = pushNotificationService.getStats();
        const subscriptions = pushNotificationService.getAllSubscriptions();

        res.json({
            success: true,
            data: {
                isRunning: true, // El servicio siempre está corriendo
                stats,
                activeSubscriptions: subscriptions.filter(s => s.isActive).length,
                totalSubscriptions: subscriptions.length,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estado del servicio de notificaciones push:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/push-notifications/test
 * Envía una notificación de prueba
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { userId, deviceId } = req.body;

        if (!userId || !deviceId) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: userId, deviceId'
            });
        }

        const notification = await pushNotificationService.sendTemplateNotification(
            'system_maintenance',
            {
                startTime: '14:00',
                endTime: '16:00'
            },
            {
                userIds: [userId],
                devices: [deviceId]
            }
        );

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notificación de prueba enviada exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error enviando notificación de prueba:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

export default router;
