import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

interface NotificationData {
    userId: number;
    type: string;
    title: string;
    message: string;
    data?: any;
}

// Cola de notificaciones
const notificationQueue: NotificationData[] = [];

// Procesar notificaciones en segundo plano
setInterval(async () => {
    while (notificationQueue.length > 0) {
        const notification = notificationQueue.shift();
        if (notification) {
            try {
                await sendNotification(notification);
            } catch (error) {
                logger.error('Error enviando notificación', { error, notification });
            }
        }
    }
}, 5000);

// Enviar notificación
const sendNotification = async (notification: NotificationData) => {
    try {
        // Aquí iría la lógica para enviar la notificación
        // Por ejemplo, usando WebSocket, email, SMS, etc.
        logger.info('Notificación enviada', { notification });
    } catch (error) {
        logger.error('Error enviando notificación', { error, notification });
        throw error;
    }
};

// Middleware para notificaciones de eventos
export const eventNotificationMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const originalSend = res.send;

    res.send = function (body) {
        try {
            if (req.method === 'POST' && req.path.includes('/events')) {
                const event = JSON.parse(body);

                // Notificar eventos críticos
                if (event.severity === 'HIGH') {
                    notificationQueue.push({
                        userId: event.userId,
                        type: 'EVENT_CRITICAL',
                        title: 'Evento Crítico',
                        message: event.description,
                        data: event
                    });
                }

                // Notificar eventos de estabilidad
                if (event.type === 'STABILITY_WARNING') {
                    notificationQueue.push({
                        userId: event.userId,
                        type: 'STABILITY_ALERT',
                        title: 'Alerta de Estabilidad',
                        message: event.description,
                        data: event
                    });
                }
            }
        } catch (error) {
            logger.error('Error procesando notificación de evento', { error });
        }

        return originalSend.call(this, body);
    };

    next();
};

// Middleware para notificaciones de mantenimiento
export const maintenanceNotificationMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const originalSend = res.send;

    res.send = function (body) {
        try {
            if (req.method === 'POST' && req.path.includes('/maintenance')) {
                const maintenance = JSON.parse(body);

                notificationQueue.push({
                    userId: maintenance.userId,
                    type: 'MAINTENANCE_REQUIRED',
                    title: 'Mantenimiento Requerido',
                    message: maintenance.description,
                    data: maintenance
                });
            }
        } catch (error) {
            logger.error('Error procesando notificación de mantenimiento', { error });
        }

        return originalSend.call(this, body);
    };

    next();
};

// Middleware para notificaciones de sistema
export const systemNotificationMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const originalSend = res.send;

    res.send = function (body) {
        try {
            if (req.method === 'POST' && req.path.includes('/system')) {
                const systemEvent = JSON.parse(body);

                notificationQueue.push({
                    userId: systemEvent.userId,
                    type: 'SYSTEM_ALERT',
                    title: 'Alerta del Sistema',
                    message: systemEvent.description,
                    data: systemEvent
                });
            }
        } catch (error) {
            logger.error('Error procesando notificación del sistema', { error });
        }

        return originalSend.call(this, body);
    };

    next();
};
