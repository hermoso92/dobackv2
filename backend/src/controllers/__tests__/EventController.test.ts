import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventService } from '../../services/EventService';
import { EventController } from '../EventController';

// Mock de EventService
vi.mock('../../services/EventService');

describe('EventController', () => {
    let eventController: EventController;
    let mockEventService: any;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockEventService = {
            getAllEvents: vi.fn(),
            getEventById: vi.fn(),
            createEvent: vi.fn(),
            updateEvent: vi.fn(),
            deleteEvent: vi.fn(),
            getEventsByVehicle: vi.fn(),
            getEventsBySession: vi.fn(),
            getEventsByDateRange: vi.fn(),
            getCriticalEvents: vi.fn(),
            getEventStats: vi.fn()
        };

        (EventService as any).mockImplementation(() => mockEventService);

        eventController = new EventController();

        mockRequest = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, organizationId: 1, role: 'ADMIN' },
            orgId: 1
        };

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        vi.clearAllMocks();
    });

    describe('getAllEvents', () => {
        it('debe obtener todos los eventos exitosamente', async () => {
            // Arrange
            const expectedEvents = [
                {
                    id: 1,
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1,
                    latitude: 40.4168,
                    longitude: -3.7038
                },
                {
                    id: 2,
                    type: 'SPEED_LIMIT_EXCEEDED',
                    severity: 'MEDIUM',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1,
                    latitude: 40.4168,
                    longitude: -3.7038
                }
            ];

            mockEventService.getAllEvents.mockResolvedValue(expectedEvents);

            // Act
            await eventController.getAllEvents(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getAllEvents).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvents
            });
        });

        it('debe manejar error al obtener eventos', async () => {
            // Arrange
            mockEventService.getAllEvents.mockRejectedValue(new Error('Error de base de datos'));

            // Act
            await eventController.getAllEvents(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Error interno del servidor'
            });
        });
    });

    describe('getEventById', () => {
        it('debe obtener evento por ID exitosamente', async () => {
            // Arrange
            const eventId = '1';
            const expectedEvent = {
                id: 1,
                type: 'OVERTURN',
                severity: 'HIGH',
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 1,
                latitude: 40.4168,
                longitude: -3.7038,
                details: {
                    speed: 45.5,
                    acceleration: 2.3,
                    roll: 15.2
                }
            };

            mockRequest.params = { id: eventId };
            mockEventService.getEventById.mockResolvedValue(expectedEvent);

            // Act
            await eventController.getEventById(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getEventById).toHaveBeenCalledWith(parseInt(eventId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvent
            });
        });

        it('debe manejar evento no encontrado', async () => {
            // Arrange
            const eventId = '999';
            mockRequest.params = { id: eventId };
            mockEventService.getEventById.mockResolvedValue(null);

            // Act
            await eventController.getEventById(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Evento no encontrado'
            });
        });
    });

    describe('createEvent', () => {
        it('debe crear evento exitosamente', async () => {
            // Arrange
            const eventData = {
                type: 'OVERTURN',
                severity: 'HIGH',
                vehicleId: 1,
                sessionId: 1,
                latitude: 40.4168,
                longitude: -3.7038,
                details: {
                    speed: 45.5,
                    acceleration: 2.3,
                    roll: 15.2
                }
            };
            const expectedEvent = {
                id: 3,
                ...eventData,
                timestamp: new Date(),
                organizationId: 1
            };

            mockRequest.body = eventData;
            mockEventService.createEvent.mockResolvedValue(expectedEvent);

            // Act
            await eventController.createEvent(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.createEvent).toHaveBeenCalledWith({
                ...eventData,
                organizationId: 1
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvent
            });
        });

        it('debe validar datos requeridos', async () => {
            // Arrange
            mockRequest.body = {};

            // Act
            await eventController.createEvent(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Tipo, severidad, vehículo y sesión son requeridos'
            });
        });
    });

    describe('getEventsByVehicle', () => {
        it('debe obtener eventos por vehículo exitosamente', async () => {
            // Arrange
            const vehicleId = '1';
            const expectedEvents = [
                {
                    id: 1,
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1
                }
            ];

            mockRequest.params = { vehicleId };
            mockEventService.getEventsByVehicle.mockResolvedValue(expectedEvents);

            // Act
            await eventController.getEventsByVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getEventsByVehicle).toHaveBeenCalledWith(parseInt(vehicleId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvents
            });
        });
    });

    describe('getEventsBySession', () => {
        it('debe obtener eventos por sesión exitosamente', async () => {
            // Arrange
            const sessionId = '1';
            const expectedEvents = [
                {
                    id: 1,
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1
                }
            ];

            mockRequest.params = { sessionId };
            mockEventService.getEventsBySession.mockResolvedValue(expectedEvents);

            // Act
            await eventController.getEventsBySession(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getEventsBySession).toHaveBeenCalledWith(parseInt(sessionId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvents
            });
        });
    });

    describe('getEventsByDateRange', () => {
        it('debe obtener eventos por rango de fechas exitosamente', async () => {
            // Arrange
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';
            const expectedEvents = [
                {
                    id: 1,
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    timestamp: new Date('2024-01-15'),
                    vehicleId: 1,
                    sessionId: 1
                }
            ];

            mockRequest.query = { startDate, endDate };
            mockEventService.getEventsByDateRange.mockResolvedValue(expectedEvents);

            // Act
            await eventController.getEventsByDateRange(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getEventsByDateRange).toHaveBeenCalledWith(
                startDate,
                endDate,
                1
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvents
            });
        });

        it('debe validar parámetros de fecha', async () => {
            // Arrange
            mockRequest.query = {};

            // Act
            await eventController.getEventsByDateRange(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Fecha de inicio y fin son requeridas'
            });
        });
    });

    describe('getCriticalEvents', () => {
        it('debe obtener eventos críticos exitosamente', async () => {
            // Arrange
            const expectedEvents = [
                {
                    id: 1,
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1
                }
            ];

            mockEventService.getCriticalEvents.mockResolvedValue(expectedEvents);

            // Act
            await eventController.getCriticalEvents(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getCriticalEvents).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvents
            });
        });
    });

    describe('getEventStats', () => {
        it('debe obtener estadísticas de eventos exitosamente', async () => {
            // Arrange
            const expectedStats = {
                total: 100,
                byType: {
                    OVERTURN: 20,
                    SPEED_LIMIT_EXCEEDED: 30,
                    HARD_BRAKING: 25,
                    SHARP_TURN: 25
                },
                bySeverity: {
                    HIGH: 15,
                    MEDIUM: 35,
                    LOW: 50
                },
                critical: 15,
                last24Hours: 10
            };

            mockEventService.getEventStats.mockResolvedValue(expectedStats);

            // Act
            await eventController.getEventStats(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.getEventStats).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedStats
            });
        });
    });

    describe('updateEvent', () => {
        it('debe actualizar evento exitosamente', async () => {
            // Arrange
            const eventId = '1';
            const updateData = {
                severity: 'MEDIUM',
                notes: 'Evento revisado'
            };
            const expectedEvent = {
                id: 1,
                type: 'OVERTURN',
                severity: 'MEDIUM',
                notes: 'Evento revisado',
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 1
            };

            mockRequest.params = { id: eventId };
            mockRequest.body = updateData;
            mockEventService.updateEvent.mockResolvedValue(expectedEvent);

            // Act
            await eventController.updateEvent(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.updateEvent).toHaveBeenCalledWith(
                parseInt(eventId),
                updateData,
                1
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedEvent
            });
        });
    });

    describe('deleteEvent', () => {
        it('debe eliminar evento exitosamente', async () => {
            // Arrange
            const eventId = '1';
            mockRequest.params = { id: eventId };
            mockEventService.deleteEvent.mockResolvedValue(true);

            // Act
            await eventController.deleteEvent(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockEventService.deleteEvent).toHaveBeenCalledWith(parseInt(eventId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Evento eliminado exitosamente'
            });
        });
    });
});
