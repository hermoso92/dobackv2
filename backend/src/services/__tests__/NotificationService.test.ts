import nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockLogger } from '../../test/utils';
import { Event, EventSeverity, EventType } from '../../types/domain';
import { NotificationService } from '../NotificationService';

// Mock de nodemailer
vi.mock('nodemailer', () => ({
    createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })
}));

describe('NotificationService', () => {
    let service: NotificationService;
    let mockTransporter: { sendMail: any };
    let mockLogger: any;

    beforeEach(() => {
        mockLogger = createMockLogger();
        mockTransporter = {
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
        };
        (nodemailer.createTransport as any).mockReturnValue(mockTransporter);
        service = new NotificationService();
        vi.clearAllMocks();
    });

    describe('sendNotification', () => {
        it('should send notification for critical event', async () => {
            // Arrange
            const event: Event = {
                id: '1',
                type: 'stability' as EventType,
                severity: 'critical' as EventSeverity,
                message: 'Critical stability issue detected',
                timestamp: new Date(),
                status: 'active',
                context: {
                    metrics: {
                        ltr: 0.9,
                        ssf: 1.1,
                        drs: 0.8,
                        rsc: 0.9
                    }
                },
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null
            };

            // Act
            await service.sendNotification(event);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('CRITICAL'),
                    html: expect.stringContaining('Critical stability issue detected')
                })
            );
        });

        it('should send notification for error event', async () => {
            // Arrange
            const event: Event = {
                id: '1',
                type: 'system' as EventType,
                severity: 'error' as EventSeverity,
                message: 'System error detected',
                timestamp: new Date(),
                status: 'active',
                context: {
                    error: {
                        code: 'ERR_001',
                        details: 'Database connection failed'
                    }
                },
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null
            };

            // Act
            await service.sendNotification(event);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('ERROR'),
                    html: expect.stringContaining('System error detected')
                })
            );
        });

        it('should not send notification for warning event', async () => {
            // Arrange
            const event: Event = {
                id: '1',
                type: 'stability' as EventType,
                severity: 'warning' as EventSeverity,
                message: 'Warning: High load transfer detected',
                timestamp: new Date(),
                status: 'active',
                context: {
                    metrics: {
                        ltr: 0.7,
                        ssf: 1.3,
                        drs: 1.1,
                        rsc: 1.1
                    }
                },
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null
            };

            // Act
            await service.sendNotification(event);

            // Assert
            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle email sending error', async () => {
            // Arrange
            const event: Event = {
                id: '1',
                type: 'stability' as EventType,
                severity: 'critical' as EventSeverity,
                message: 'Critical stability issue detected',
                timestamp: new Date(),
                status: 'active',
                context: {
                    metrics: {
                        ltr: 0.9,
                        ssf: 1.1,
                        drs: 0.8,
                        rsc: 0.9
                    }
                },
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null
            };

            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

            // Act & Assert
            await expect(service.sendNotification(event)).rejects.toThrow('SMTP error');
        });
    });

    describe('sendCriticalAlert', () => {
        it('should send critical alert', async () => {
            // Arrange
            const notification = {
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
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Critical Alert'),
                    html: expect.stringContaining('Critical stability issue detected')
                })
            );
        });

        it('should handle missing data in critical alert', async () => {
            // Arrange
            const notification = {
                title: 'Critical Alert',
                message: 'Critical stability issue detected',
                data: {}
            };

            // Act
            await service.sendCriticalAlert(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Critical Alert'),
                    html: expect.stringContaining('Critical stability issue detected')
                })
            );
        });
    });

    describe('sendWarning', () => {
        it('should send warning notification', async () => {
            // Arrange
            const notification = {
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
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Warning'),
                    html: expect.stringContaining('High load transfer detected')
                })
            );
        });

        it('should handle missing data in warning', async () => {
            // Arrange
            const notification = {
                title: 'Warning',
                message: 'High load transfer detected',
                data: {}
            };

            // Act
            await service.sendWarning(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Warning'),
                    html: expect.stringContaining('High load transfer detected')
                })
            );
        });
    });

    describe('sendInfo', () => {
        it('should send info notification', async () => {
            // Arrange
            const notification = {
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
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Information'),
                    html: expect.stringContaining('Session completed successfully')
                })
            );
        });

        it('should handle missing data in info notification', async () => {
            // Arrange
            const notification = {
                title: 'Information',
                message: 'Session completed successfully',
                data: {}
            };

            // Act
            await service.sendInfo(notification);

            // Assert
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: expect.stringContaining('Information'),
                    html: expect.stringContaining('Session completed successfully')
                })
            );
        });
    });
});
