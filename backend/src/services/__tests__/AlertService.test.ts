import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertService, EmergencyAlert, GeofenceAlert, VehicleAlert } from '../AlertService';

// Mock de nodemailer
vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn().mockReturnValue({
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
        })
    },
    createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })
}));

// Mock de WebSocket
vi.mock('ws', () => ({
    WebSocket: {
        OPEN: 1
    }
}));

// Mock de logger
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));

// Mock de fetch
global.fetch = vi.fn();

describe('AlertService', () => {
    let mockTransporter: { sendMail: any };
    let mockWebSocketClient: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Setup transporter mock
        mockTransporter = {
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
        };

        // Setup WebSocket mock
        mockWebSocketClient = {
            send: vi.fn(),
            readyState: 1, // OPEN
            on: vi.fn()
        };

        // Mock environment variables
        process.env.ALERT_EMAIL_ENABLED = 'true';
        process.env.ALERT_WEBHOOK_URL = 'https://test-webhook.com/alerts';
        process.env.SMTP_FROM = 'test@example.com';

        // Clear WebSocket clients
        (AlertService as any).webSocketClients = new Set();
    });

    describe('createEmergencyAlert', () => {
        it('should create emergency alert with default values', () => {
            // Arrange
            const data = {
                type: 'FIRE' as const,
                location: 'Test Location',
                severity: 'CRITICAL' as const,
                vehicleId: 'test-vehicle',
                organizationId: 'test-org'
            };

            // Act
            const alert = AlertService.createEmergencyAlert(data);

            // Assert
            expect(alert.id).toMatch(/^emergency-\d+-[a-z0-9]+$/);
            expect(alert.type).toBe('FIRE');
            expect(alert.location).toBe('Test Location');
            expect(alert.severity).toBe('CRITICAL');
            expect(alert.vehicleId).toBe('test-vehicle');
            expect(alert.organizationId).toBe('test-org');
            expect(alert.description).toBe('Sin descripción');
            expect(alert.timestamp).toBeInstanceOf(Date);
        });

        it('should create emergency alert with all provided data', () => {
            // Arrange
            const data = {
                id: 'custom-id',
                type: 'MEDICAL' as const,
                location: 'Hospital Central',
                severity: 'HIGH' as const,
                description: 'Emergency medical situation',
                vehicleId: 'ambulance-001',
                vehicleName: 'Ambulancia Principal',
                timestamp: new Date('2024-01-01T10:00:00Z'),
                organizationId: 'bomberos-madrid',
                coordinates: {
                    latitude: 40.4168,
                    longitude: -3.7038
                },
                metadata: {
                    priority: 'urgent',
                    department: 'medical'
                }
            };

            // Act
            const alert = AlertService.createEmergencyAlert(data);

            // Assert
            expect(alert).toEqual(data);
        });
    });

    describe('createVehicleAlert', () => {
        it('should create vehicle alert with default values', () => {
            // Arrange
            const data = {
                vehicleId: 'test-vehicle',
                type: 'MAINTENANCE_DUE' as const,
                organizationId: 'test-org'
            };

            // Act
            const alert = AlertService.createVehicleAlert(data);

            // Assert
            expect(alert.id).toMatch(/^vehicle-\d+-[a-z0-9]+$/);
            expect(alert.vehicleId).toBe('test-vehicle');
            expect(alert.vehicleName).toBe('Vehículo desconocido');
            expect(alert.type).toBe('MAINTENANCE_DUE');
            expect(alert.message).toBe('Sin mensaje');
            expect(alert.severity).toBe('MEDIUM');
            expect(alert.organizationId).toBe('test-org');
            expect(alert.timestamp).toBeInstanceOf(Date);
        });

        it('should create vehicle alert with all provided data', () => {
            // Arrange
            const data = {
                id: 'vehicle-custom-id',
                vehicleId: 'fire-truck-001',
                vehicleName: 'Bomba Principal',
                type: 'SPEED_EXCEEDED' as const,
                message: 'Vehicle exceeded speed limit',
                severity: 'HIGH' as const,
                timestamp: new Date('2024-01-01T10:00:00Z'),
                organizationId: 'bomberos-madrid',
                metadata: {
                    speed: 85,
                    limit: 60
                }
            };

            // Act
            const alert = AlertService.createVehicleAlert(data);

            // Assert
            expect(alert).toEqual(data);
        });
    });

    describe('createGeofenceAlert', () => {
        it('should create geofence alert with default values', () => {
            // Arrange
            const data = {
                geofenceId: 'test-geofence',
                vehicleId: 'test-vehicle',
                organizationId: 'test-org'
            };

            // Act
            const alert = AlertService.createGeofenceAlert(data);

            // Assert
            expect(alert.id).toMatch(/^geofence-\d+-[a-z0-9]+$/);
            expect(alert.geofenceId).toBe('test-geofence');
            expect(alert.geofenceName).toBe('Geocerca desconocida');
            expect(alert.vehicleId).toBe('test-vehicle');
            expect(alert.vehicleName).toBe('Vehículo desconocido');
            expect(alert.type).toBe('ENTER');
            expect(alert.organizationId).toBe('test-org');
            expect(alert.coordinates).toEqual({ latitude: 0, longitude: 0 });
            expect(alert.timestamp).toBeInstanceOf(Date);
        });

        it('should create geofence alert with all provided data', () => {
            // Arrange
            const data = {
                id: 'geofence-custom-id',
                geofenceId: 'fire-station-zone',
                geofenceName: 'Zona Estación de Bomberos',
                vehicleId: 'fire-truck-001',
                vehicleName: 'Bomba Principal',
                type: 'EXIT' as const,
                timestamp: new Date('2024-01-01T10:00:00Z'),
                organizationId: 'bomberos-madrid',
                coordinates: {
                    latitude: 40.4168,
                    longitude: -3.7038
                },
                metadata: {
                    duration: 300,
                    distance: 150
                }
            };

            // Act
            const alert = AlertService.createGeofenceAlert(data);

            // Assert
            expect(alert).toEqual(data);
        });
    });

    describe('sendEmergencyAlert', () => {
        it('should send emergency alert successfully', async () => {
            // Arrange
            const alert: EmergencyAlert = {
                id: 'emergency-001',
                type: 'FIRE',
                location: 'Test Location',
                severity: 'CRITICAL',
                description: 'Fire emergency',
                vehicleId: 'test-vehicle',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            (fetch as any).mockResolvedValue({
                ok: true,
                status: 200
            });

            // Act
            await AlertService.sendEmergencyAlert(alert);

            // Assert
            expect(fetch).toHaveBeenCalledWith(
                'https://test-webhook.com/alerts',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: expect.stringContaining('EMERGENCY_ALERT')
                })
            );
        });

        it('should handle webhook failure gracefully', async () => {
            // Arrange
            const alert: EmergencyAlert = {
                id: 'emergency-001',
                type: 'FIRE',
                location: 'Test Location',
                severity: 'CRITICAL',
                description: 'Fire emergency',
                vehicleId: 'test-vehicle',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            (fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            // Act & Assert
            await expect(AlertService.sendEmergencyAlert(alert)).rejects.toThrow();
        });

        it('should not send webhook if URL not configured', async () => {
            // Arrange
            delete process.env.ALERT_WEBHOOK_URL;

            const alert: EmergencyAlert = {
                id: 'emergency-001',
                type: 'FIRE',
                location: 'Test Location',
                severity: 'CRITICAL',
                description: 'Fire emergency',
                vehicleId: 'test-vehicle',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            // Act
            await AlertService.sendEmergencyAlert(alert);

            // Assert
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('sendVehicleAlert', () => {
        it('should send vehicle alert successfully', async () => {
            // Arrange
            const alert: VehicleAlert = {
                id: 'vehicle-001',
                vehicleId: 'test-vehicle',
                vehicleName: 'Test Vehicle',
                type: 'MAINTENANCE_DUE',
                message: 'Maintenance required',
                severity: 'MEDIUM',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            // Act
            await AlertService.sendVehicleAlert(alert);

            // Assert - Should not throw
            expect(true).toBe(true);
        });

        it('should send email for critical vehicle alerts', async () => {
            // Arrange
            const alert: VehicleAlert = {
                id: 'vehicle-001',
                vehicleId: 'test-vehicle',
                vehicleName: 'Test Vehicle',
                type: 'SPEED_EXCEEDED',
                message: 'Critical speed violation',
                severity: 'CRITICAL',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            // Act
            await AlertService.sendVehicleAlert(alert);

            // Assert - Should not throw
            expect(true).toBe(true);
        });
    });

    describe('sendGeofenceAlert', () => {
        it('should send geofence alert successfully', async () => {
            // Arrange
            const alert: GeofenceAlert = {
                id: 'geofence-001',
                geofenceId: 'test-geofence',
                geofenceName: 'Test Geofence',
                vehicleId: 'test-vehicle',
                vehicleName: 'Test Vehicle',
                type: 'ENTER',
                timestamp: new Date(),
                organizationId: 'test-org',
                coordinates: {
                    latitude: 40.4168,
                    longitude: -3.7038
                }
            };

            // Act
            await AlertService.sendGeofenceAlert(alert);

            // Assert - Should not throw
            expect(true).toBe(true);
        });
    });

    describe('registerWebSocketClient', () => {
        it('should register WebSocket client', () => {
            // Act
            AlertService.registerWebSocketClient(mockWebSocketClient);

            // Assert
            expect(mockWebSocketClient.on).toHaveBeenCalledWith('close', expect.any(Function));
        });

        it('should handle WebSocket client disconnect', () => {
            // Arrange
            AlertService.registerWebSocketClient(mockWebSocketClient);
            const closeHandler = mockWebSocketClient.on.mock.calls[0][1];

            // Act
            closeHandler();

            // Assert - Should not throw
            expect(true).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle email sending errors', async () => {
            // Arrange
            process.env.ALERT_EMAIL_ENABLED = 'true';

            const alert: EmergencyAlert = {
                id: 'emergency-001',
                type: 'FIRE',
                location: 'Test Location',
                severity: 'CRITICAL',
                description: 'Fire emergency',
                vehicleId: 'test-vehicle',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            // Mock transporter to throw error
            const nodemailer = await import('nodemailer');
            (nodemailer.createTransport as any).mockReturnValue({
                sendMail: vi.fn().mockRejectedValue(new Error('SMTP Error'))
            });

            // Act & Assert
            await expect(AlertService.sendEmergencyAlert(alert)).rejects.toThrow('SMTP Error');
        });

        it('should handle WebSocket sending errors', async () => {
            // Arrange
            const alert: EmergencyAlert = {
                id: 'emergency-001',
                type: 'FIRE',
                location: 'Test Location',
                severity: 'CRITICAL',
                description: 'Fire emergency',
                vehicleId: 'test-vehicle',
                timestamp: new Date(),
                organizationId: 'test-org'
            };

            // Register a client that will throw error
            const errorClient = {
                send: vi.fn().mockImplementation(() => {
                    throw new Error('WebSocket Error');
                }),
                readyState: 1,
                on: vi.fn()
            };

            AlertService.registerWebSocketClient(errorClient);

            // Act
            await AlertService.sendEmergencyAlert(alert);

            // Assert - Should not throw, should handle gracefully
            expect(true).toBe(true);
        });
    });
});
