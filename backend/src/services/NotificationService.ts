import { Event } from '@prisma/client';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface NotificationData {
    title: string;
    message: string;
    data?: Record<string, any>;
}

export class NotificationService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || 'user@example.com',
                pass: process.env.SMTP_PASS || 'password'
            }
        });
    }

    async sendNotification(event: Event): Promise<void> {
        try {
            logger.info('Notificación recibida', { event });
        } catch (error) {
            logger.error('Error sending notification', { error });
            throw error;
        }
    }

    async sendCriticalAlert(notification: NotificationData): Promise<void> {
        try {
            logger.info('Alerta crítica enviada', { notification });
        } catch (error) {
            logger.error('Error sending critical alert', { error });
            throw error;
        }
    }

    async sendWarning(notification: NotificationData): Promise<void> {
        try {
            logger.info('Warning enviada', { notification });
        } catch (error) {
            logger.error('Error sending warning', { error });
            throw error;
        }
    }

    async sendInfo(notification: NotificationData): Promise<void> {
        try {
            logger.info('Info enviada', { notification });
        } catch (error) {
            logger.error('Error sending info notification', { error });
            throw error;
        }
    }
}
