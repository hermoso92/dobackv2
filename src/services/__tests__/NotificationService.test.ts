import nodemailer from 'nodemailer';
import { NotificationData } from '../../types/notification';
import { NotificationService } from '../NotificationService';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
    }))
}));

describe('NotificationService', () => {
    let service: NotificationService;
    let mockTransporter: any;

    beforeEach(() => {
        // Mock environment variables
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test@test.com';
        process.env.SMTP_PASS = 'test-password';
        process.env.NOTIFICATION_EMAIL = 'notifications@test.com';

        // Create mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
        };

        // Mock nodemailer.createTransport
        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

        service = new NotificationService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendCriticalAlert', () => {
        it('should send critical alert', async () => {
            // Arrange
            const notification: NotificationData = {
                type: 'stability',
                title: 'Critical Alert',
                message: 'Critical stability issue detected',
                data: {
                    type: 'stability',
                    timestamp: new Date().toISOString(),
                    metrics: {
                        ltr: 0.9,
                        ssf: 1.1,
                        drs: 0.8,
                        rsc: 0.9
                    }
                }
            };

            // Act
            await service.sendCriticalAlert(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: expect.stringContaining('Critical Alert'),
                html: expect.stringContaining('Critical stability issue detected')
            }));
        });

        it('should handle missing data in critical alert', async () => {
            // Arrange
            const notification: NotificationData = {
                type: 'stability',
                title: 'Critical Alert',
                message: 'Critical stability issue detected',
                data: {}
            };

            // Act
            await service.sendCriticalAlert(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: expect.stringContaining('Critical Alert'),
                html: expect.stringContaining('Critical stability issue detected')
            }));
        });
    });

    describe('sendWarning', () => {
        it('should send warning notification', async () => {
            // Arrange
            const notification: NotificationData = {
                type: 'stability',
                title: 'Warning',
                message: 'High load transfer detected',
                data: {
                    type: 'stability',
                    timestamp: new Date().toISOString(),
                    metrics: {
                        ltr: 0.7,
                        ssf: 1.3,
                        drs: 1.1,
                        rsc: 1.1
                    }
                }
            };

            // Act
            await service.sendWarning(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: process.env.NOTIFICATION_EMAIL,
                to: process.env.NOTIFICATION_EMAIL,
                subject: expect.stringContaining('Warning'),
                html: expect.stringContaining('High load transfer detected')
            }));
        });

        it('should handle missing data in warning', async () => {
            // Arrange
            const notification: NotificationData = {
                type: 'stability',
                title: 'Warning',
                message: 'High load transfer detected',
                data: {}
            };

            // Act
            await service.sendWarning(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: process.env.NOTIFICATION_EMAIL,
                to: process.env.NOTIFICATION_EMAIL,
                subject: expect.stringContaining('Warning'),
                html: expect.stringContaining('High load transfer detected')
            }));
        });
    });

    describe('sendInfo', () => {
        it('should send info notification', async () => {
            // Arrange
            const notification: NotificationData = {
                type: 'session',
                title: 'Information',
                message: 'Session completed successfully',
                data: {
                    type: 'session',
                    timestamp: new Date().toISOString(),
                    sessionId: 'test-session-id'
                }
            };

            // Act
            await service.sendInfo(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: process.env.NOTIFICATION_EMAIL,
                to: process.env.NOTIFICATION_EMAIL,
                subject: expect.stringContaining('Information'),
                html: expect.stringContaining('Session completed successfully')
            }));
        });

        it('should handle missing data in info notification', async () => {
            // Arrange
            const notification: NotificationData = {
                type: 'session',
                title: 'Information',
                message: 'Session completed successfully',
                data: {}
            };

            // Act
            await service.sendInfo(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: process.env.NOTIFICATION_EMAIL,
                to: process.env.NOTIFICATION_EMAIL,
                subject: expect.stringContaining('Information'),
                html: expect.stringContaining('Session completed successfully')
            }));
        });
    });
}); 