import { createTransport } from 'nodemailer';
import { NotificationData } from '../types/notification';
import { logger } from '../utils/logger';

export class NotificationService {
    private transporter: any;

    constructor() {
        this.transporter = createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendCriticalAlert(notification: NotificationData): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.SMTP_TO,
                subject: `[CRITICAL] ${notification.title}`,
                html: this.generateEmailContent(notification)
            });

            logger.info('Critical alert sent', { notification });
        } catch (error) {
            logger.error('Error sending critical alert', { error, notification });
            throw error;
        }
    }

    async sendWarning(notification: NotificationData): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.SMTP_TO,
                subject: `[WARNING] ${notification.title}`,
                html: this.generateEmailContent(notification)
            });

            logger.info('Warning sent', { notification });
        } catch (error) {
            logger.error('Error sending warning', { error, notification });
            throw error;
        }
    }

    async sendInfo(notification: NotificationData): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.SMTP_TO,
                subject: `[INFO] ${notification.title}`,
                html: this.generateEmailContent(notification)
            });

            logger.info('Info notification sent', { notification });
        } catch (error) {
            logger.error('Error sending info notification', { error, notification });
            throw error;
        }
    }

    private generateEmailContent(notification: NotificationData): string {
        const { title, message, data } = notification;
        const timestamp = new Date().toISOString();

        return `
            <h1>${title}</h1>
            <p>${message}</p>
            <hr>
            <h2>Details</h2>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <hr>
            <p><small>Sent at: ${timestamp}</small></p>
        `;
    }
} 