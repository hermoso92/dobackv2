import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface NotificationConfig {
    recipients?: string[];
    message: string;
    delay?: number;
}

export class NotificationService {
    private pendingNotifications: Map<string, {
        timestamp: number;
        messages: string[];
        priority: number;
    }> = new Map();

    private priorities = {
        CRITICAL: 1,
        HIGH: 2,
        MEDIUM: 3,
        LOW: 4
    };

    private grouping = {
        time: 5000, // 5 seconds
        maxNotifications: 10
    };

    async createNotification(data: any) {
        return prisma.notification.create({ data });
    }

    async updateNotification(id: string, data: any) {
        return prisma.notification.update({ where: { id }, data });
    }

    async deleteNotification(id: string) {
        return prisma.notification.delete({ where: { id } });
    }

    async getNotification(id: string) {
        return prisma.notification.findUnique({ where: { id } });
    }

    async listNotifications(filters: any = {}) {
        return prisma.notification.findMany({ where: filters });
    }

    async markAsSent(id: string) {
        return prisma.notification.update({ where: { id }, data: { status: 'SENT', sentAt: new Date() } });
    }

    async markAsReceived(id: string) {
        return prisma.notification.update({ where: { id }, data: { status: 'RECEIVED', receivedAt: new Date() } });
    }

    async listByUser(userId: string) {
        return prisma.notification.findMany({ where: { userId } });
    }

    async listByType(type: string) {
        return prisma.notification.findMany({ where: { type } });
    }

    async send(config: NotificationConfig): Promise<void> {
        try {
            const key = this.generateGroupingKey(config);

            if (this.pendingNotifications.has(key)) {
                this.groupNotification(key, config);
            } else {
                this.createNewGrouping(key, config);
            }

            await this.processGroupedNotifications();
        } catch (error) {
            logger.error('Error sending notification', { error, config });
            throw error;
        }
    }

    private generateGroupingKey(config: NotificationConfig): string {
        return `${config.recipients?.join(',') || 'default'}`;
    }

    private groupNotification(key: string, config: NotificationConfig): void {
        const group = this.pendingNotifications.get(key)!;
        group.messages.push(config.message);

        if (group.messages.length >= this.grouping.maxNotifications) {
            this.sendGroupedNotification(key, group);
            this.pendingNotifications.delete(key);
        }
    }

    private createNewGrouping(key: string, config: NotificationConfig): void {
        this.pendingNotifications.set(key, {
            timestamp: Date.now(),
            messages: [config.message],
            priority: this.priorities.MEDIUM
        });
    }

    private async processGroupedNotifications(): Promise<void> {
        const now = Date.now();

        for (const [key, group] of this.pendingNotifications) {
            if (now - group.timestamp >= this.grouping.time) {
                await this.sendGroupedNotification(key, group);
                this.pendingNotifications.delete(key);
            }
        }
    }

    private async sendGroupedNotification(
        key: string,
        group: { messages: string[]; priority: number }
    ): Promise<void> {
        try {
            const recipients = key.split(',');
            const message = group.messages.join('\n');

            // Aquí implementar la lógica de envío real (email, SMS, push, etc.)
            logger.info('Sending grouped notification', {
                recipients,
                message,
                priority: group.priority
            });
        } catch (error) {
            logger.error('Error sending grouped notification', { error, key });
            throw error;
        }
    }
} 