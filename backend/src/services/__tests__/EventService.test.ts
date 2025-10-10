import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventService } from '../EventService';

describe('EventService', () => {
    let eventService: EventService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            event: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                count: vi.fn(),
                groupBy: vi.fn()
            }
        };

        eventService = new EventService(mockPrisma as unknown as PrismaClient);
        vi.clearAllMocks();
    });

    describe('getAllEvents', () => {
        it('debe obtener todos los eventos de una organización', async () => {
            // Arrange
            const organizationId = 1;
            const expectedEvents = [
                {
                    id: 1,
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1,
                    latitude: 40.4168,
                    longitude: -3.7038,
                    organizationId: 1
                },
                {
                    id: 2,
                    type: 'SPEED_LIMIT_EXCEEDED',
                    severity: 'MEDIUM',
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 1,
                    latitude: 40.4168,
                    longitude: -3.7038,
                    organizationId: 1
                }
            ];

            mockPrisma.event.findMany.mockResolvedValue(expectedEvents);

            // Act
            const result = await eventService.getAllEvents(organizationId);

            // Assert
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                where: { organizationId },
                include: {
                    vehicle: true,
                    session: true
                },
                orderBy: { timestamp: 'desc' }
            });
            expect(result).toEqual(expectedEvents);
        });

        it('debe manejar error de base de datos', async () => {
            // Arrange
            const organizationId = 1;
            mockPrisma.event.findMany.mockRejectedValue(new Error('Error de conexión'));

            // Act & Assert
            await expect(eventService.getAllEvents(organizationId)).rejects.toThrow('Error de conexión');
        });
    });

    describe('getEventById', () => {
        it('debe obtener evento por ID', async () => {
            // Arrange
            const eventId = 1;
            const organizationId = 1;
            const expectedEvent = {
                id: 1,
                type: 'OVERTURN',
                severity: 'HIGH',
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 1,
                latitude: 40.4168,
                longitude: -3.7038,
                organizationId: 1,
                details: {
                    speed: 45.5,
                    acceleration: 2.3,
                    roll: 15.2
                }
            };

            mockPrisma.event.findUnique.mockResolvedValue(expectedEvent);

            // Act
            const result = await eventService.getEventById(eventId, organizationId);

            // Assert
            expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
                where: {
                    id: eventId,
                    organizationId
                },
                include: {
                    vehicle: true,
                    session: true
                }
            });
            expect(result).toEqual(expectedEvent);
        });

        it('debe retornar null si evento no existe', async () => {
            // Arrange
            const eventId = 999;
            const organizationId = 1;
            mockPrisma.event.findUnique.mockResolvedValue(null);

            // Act
            const result = await eventService.getEventById(eventId, organizationId);

            // Assert
            expect(result).toBeNull();
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
                organizationId: 1,
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
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.event.create.mockResolvedValue(expectedEvent);

            // Act
            const result = await eventService.createEvent(eventData);

            // Assert
            expect(mockPrisma.event.create).toHaveBeenCalledWith({
                data: eventData,
                include: {
                    vehicle: true,
                    session: true
                }
            });
            expect(result).toEqual(expectedEvent);
        });

        it('debe manejar error de datos inválidos', async () => {
            // Arrange
            const eventData = {
                type: 'INVALID_TYPE',
                severity: 'INVALID_SEVERITY',
                vehicleId: 1,
                sessionId: 1,
                organizationId: 1
            };

            mockPrisma.event.create.mockRejectedValue(
                new Error('Invalid input')
            );

            // Act & Assert
            await expect(eventService.createEvent(eventData)).rejects.toThrow('Invalid input');
        });
    });

    describe('getEventsByVehicle', () => {
        it('debe obtener eventos por vehículo', async () => {
            // Arrange
            const vehicleId = 1;
            const organizationId = 1;
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

            mockPrisma.event.findMany.mockResolvedValue(expectedEvents);

            // Act
            const result = await eventService.getEventsByVehicle(vehicleId, organizationId);

            // Assert
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                where: {
                    vehicleId,
                    organizationId
                },
                include: {
                    vehicle: true,
                    session: true
                },
                orderBy: { timestamp: 'desc' }
            });
            expect(result).toEqual(expectedEvents);
        });
    });

    describe('getEventsBySession', () => {
        it('debe obtener eventos por sesión', async () => {
            // Arrange
            const sessionId = 1;
            const organizationId = 1;
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

            mockPrisma.event.findMany.mockResolvedValue(expectedEvents);

            // Act
            const result = await eventService.getEventsBySession(sessionId, organizationId);

            // Assert
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                where: {
                    sessionId,
                    organizationId
                },
                include: {
                    vehicle: true,
                    session: true
                },
                orderBy: { timestamp: 'asc' }
            });
            expect(result).toEqual(expectedEvents);
        });
    });

    describe('getEventsByDateRange', () => {
        it('debe obtener eventos por rango de fechas', async () => {
            // Arrange
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';
            const organizationId = 1;
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

            mockPrisma.event.findMany.mockResolvedValue(expectedEvents);

            // Act
            const result = await eventService.getEventsByDateRange(startDate, endDate, organizationId);

            // Assert
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId,
                    timestamp: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                include: {
                    vehicle: true,
                    session: true
                },
                orderBy: { timestamp: 'desc' }
            });
            expect(result).toEqual(expectedEvents);
        });
    });

    describe('getCriticalEvents', () => {
        it('debe obtener eventos críticos', async () => {
            // Arrange
            const organizationId = 1;
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

            mockPrisma.event.findMany.mockResolvedValue(expectedEvents);

            // Act
            const result = await eventService.getCriticalEvents(organizationId);

            // Assert
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId,
                    severity: 'HIGH'
                },
                include: {
                    vehicle: true,
                    session: true
                },
                orderBy: { timestamp: 'desc' }
            });
            expect(result).toEqual(expectedEvents);
        });
    });

    describe('getEventStats', () => {
        it('debe obtener estadísticas de eventos', async () => {
            // Arrange
            const organizationId = 1;
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

            // Mock de conteos
            mockPrisma.event.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(15)  // critical
                .mockResolvedValueOnce(10); // last24Hours

            // Mock de groupBy
            mockPrisma.event.groupBy
                .mockResolvedValueOnce([
                    { type: 'OVERTURN', _count: { type: 20 } },
                    { type: 'SPEED_LIMIT_EXCEEDED', _count: { type: 30 } },
                    { type: 'HARD_BRAKING', _count: { type: 25 } },
                    { type: 'SHARP_TURN', _count: { type: 25 } }
                ])
                .mockResolvedValueOnce([
                    { severity: 'HIGH', _count: { severity: 15 } },
                    { severity: 'MEDIUM', _count: { severity: 35 } },
                    { severity: 'LOW', _count: { severity: 50 } }
                ]);

            // Act
            const result = await eventService.getEventStats(organizationId);

            // Assert
            expect(mockPrisma.event.count).toHaveBeenCalledTimes(3);
            expect(mockPrisma.event.groupBy).toHaveBeenCalledTimes(2);
            expect(result).toEqual(expectedStats);
        });
    });

    describe('updateEvent', () => {
        it('debe actualizar evento exitosamente', async () => {
            // Arrange
            const eventId = 1;
            const updateData = {
                severity: 'MEDIUM',
                notes: 'Evento revisado'
            };
            const organizationId = 1;
            const expectedEvent = {
                id: 1,
                type: 'OVERTURN',
                severity: 'MEDIUM',
                notes: 'Evento revisado',
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 1,
                organizationId: 1
            };

            mockPrisma.event.update.mockResolvedValue(expectedEvent);

            // Act
            const result = await eventService.updateEvent(eventId, updateData, organizationId);

            // Assert
            expect(mockPrisma.event.update).toHaveBeenCalledWith({
                where: {
                    id: eventId,
                    organizationId
                },
                data: updateData,
                include: {
                    vehicle: true,
                    session: true
                }
            });
            expect(result).toEqual(expectedEvent);
        });

        it('debe manejar evento no encontrado', async () => {
            // Arrange
            const eventId = 999;
            const updateData = { severity: 'MEDIUM' };
            const organizationId = 1;

            mockPrisma.event.update.mockRejectedValue(
                new Error('Record to update not found')
            );

            // Act & Assert
            await expect(eventService.updateEvent(eventId, updateData, organizationId)).rejects.toThrow(
                'Evento no encontrado'
            );
        });
    });

    describe('deleteEvent', () => {
        it('debe eliminar evento exitosamente', async () => {
            // Arrange
            const eventId = 1;
            const organizationId = 1;
            const expectedEvent = {
                id: 1,
                type: 'OVERTURN',
                severity: 'HIGH',
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 1,
                organizationId: 1
            };

            mockPrisma.event.delete.mockResolvedValue(expectedEvent);

            // Act
            const result = await eventService.deleteEvent(eventId, organizationId);

            // Assert
            expect(mockPrisma.event.delete).toHaveBeenCalledWith({
                where: {
                    id: eventId,
                    organizationId
                }
            });
            expect(result).toEqual(expectedEvent);
        });

        it('debe manejar evento no encontrado para eliminación', async () => {
            // Arrange
            const eventId = 999;
            const organizationId = 1;

            mockPrisma.event.delete.mockRejectedValue(
                new Error('Record to delete does not exist')
            );

            // Act & Assert
            await expect(eventService.deleteEvent(eventId, organizationId)).rejects.toThrow(
                'Evento no encontrado'
            );
        });
    });

    describe('validateEventData', () => {
        it('debe validar datos de evento correctamente', () => {
            // Arrange
            const validData = {
                type: 'OVERTURN',
                severity: 'HIGH',
                vehicleId: 1,
                sessionId: 1,
                latitude: 40.4168,
                longitude: -3.7038,
                organizationId: 1
            };

            // Act
            const result = eventService.validateEventData(validData);

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('debe detectar datos inválidos', () => {
            // Arrange
            const invalidData = {
                type: 'INVALID_TYPE',
                severity: 'INVALID_SEVERITY',
                vehicleId: 0,
                sessionId: 0,
                latitude: 200, // Latitud inválida
                longitude: 200, // Longitud inválida
                organizationId: 0
            };

            // Act
            const result = eventService.validateEventData(invalidData);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Tipo de evento no válido');
            expect(result.errors).toContain('Severidad no válida');
            expect(result.errors).toContain('ID de vehículo es requerido');
            expect(result.errors).toContain('ID de sesión es requerido');
            expect(result.errors).toContain('Latitud no válida');
            expect(result.errors).toContain('Longitud no válida');
        });
    });
});