import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '../SessionService';

describe('SessionService', () => {
    let sessionService: SessionService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            session: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                count: vi.fn(),
                groupBy: vi.fn()
            }
        };

        sessionService = new SessionService(mockPrisma as unknown as PrismaClient);
        vi.clearAllMocks();
    });

    describe('getAllSessions', () => {
        it('debe obtener todas las sesiones de una organización', async () => {
            // Arrange
            const organizationId = 1;
            const expectedSessions = [
                {
                    id: 1,
                    vehicleId: 1,
                    startTime: new Date('2024-01-15T10:00:00Z'),
                    endTime: new Date('2024-01-15T12:00:00Z'),
                    duration: 7200,
                    status: 'COMPLETED',
                    organizationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    vehicleId: 2,
                    startTime: new Date('2024-01-15T14:00:00Z'),
                    endTime: new Date('2024-01-15T16:00:00Z'),
                    duration: 7200,
                    status: 'COMPLETED',
                    organizationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockPrisma.session.findMany.mockResolvedValue(expectedSessions);

            // Act
            const result = await sessionService.getAllSessions(organizationId);

            // Assert
            expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
                where: { organizationId },
                include: {
                    vehicle: true,
                    events: true
                },
                orderBy: { startTime: 'desc' }
            });
            expect(result).toEqual(expectedSessions);
        });

        it('debe manejar error de base de datos', async () => {
            // Arrange
            const organizationId = 1;
            mockPrisma.session.findMany.mockRejectedValue(new Error('Error de conexión'));

            // Act & Assert
            await expect(sessionService.getAllSessions(organizationId)).rejects.toThrow('Error de conexión');
        });
    });

    describe('getSessionById', () => {
        it('debe obtener sesión por ID', async () => {
            // Arrange
            const sessionId = 1;
            const organizationId = 1;
            const expectedSession = {
                id: 1,
                vehicleId: 1,
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T12:00:00Z'),
                duration: 7200,
                status: 'COMPLETED',
                organizationId: 1,
                metadata: {
                    totalEvents: 5,
                    criticalEvents: 1,
                    averageSpeed: 45.5
                }
            };

            mockPrisma.session.findUnique.mockResolvedValue(expectedSession);

            // Act
            const result = await sessionService.getSessionById(sessionId, organizationId);

            // Assert
            expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: sessionId,
                    organizationId
                },
                include: {
                    vehicle: true,
                    events: true
                }
            });
            expect(result).toEqual(expectedSession);
        });

        it('debe retornar null si sesión no existe', async () => {
            // Arrange
            const sessionId = 999;
            const organizationId = 1;
            mockPrisma.session.findUnique.mockResolvedValue(null);

            // Act
            const result = await sessionService.getSessionById(sessionId, organizationId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('createSession', () => {
        it('debe crear sesión exitosamente', async () => {
            // Arrange
            const sessionData = {
                vehicleId: 1,
                startTime: new Date('2024-01-15T10:00:00Z'),
                organizationId: 1,
                metadata: {
                    driver: 'Juan Pérez',
                    route: 'Ruta A'
                }
            };
            const expectedSession = {
                id: 3,
                ...sessionData,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.session.create.mockResolvedValue(expectedSession);

            // Act
            const result = await sessionService.createSession(sessionData);

            // Assert
            expect(mockPrisma.session.create).toHaveBeenCalledWith({
                data: sessionData,
                include: {
                    vehicle: true
                }
            });
            expect(result).toEqual(expectedSession);
        });

        it('debe manejar error de datos inválidos', async () => {
            // Arrange
            const sessionData = {
                vehicleId: 0,
                startTime: 'invalid-date',
                organizationId: 1
            };

            mockPrisma.session.create.mockRejectedValue(
                new Error('Invalid input')
            );

            // Act & Assert
            await expect(sessionService.createSession(sessionData)).rejects.toThrow('Invalid input');
        });
    });

    describe('updateSession', () => {
        it('debe actualizar sesión exitosamente', async () => {
            // Arrange
            const sessionId = 1;
            const updateData = {
                endTime: new Date('2024-01-15T12:00:00Z'),
                status: 'COMPLETED',
                metadata: {
                    totalEvents: 5,
                    criticalEvents: 1
                }
            };
            const organizationId = 1;
            const expectedSession = {
                id: 1,
                vehicleId: 1,
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T12:00:00Z'),
                duration: 7200,
                status: 'COMPLETED',
                organizationId: 1
            };

            mockPrisma.session.update.mockResolvedValue(expectedSession);

            // Act
            const result = await sessionService.updateSession(sessionId, updateData, organizationId);

            // Assert
            expect(mockPrisma.session.update).toHaveBeenCalledWith({
                where: {
                    id: sessionId,
                    organizationId
                },
                data: updateData,
                include: {
                    vehicle: true,
                    events: true
                }
            });
            expect(result).toEqual(expectedSession);
        });

        it('debe manejar sesión no encontrada', async () => {
            // Arrange
            const sessionId = 999;
            const updateData = { status: 'COMPLETED' };
            const organizationId = 1;

            mockPrisma.session.update.mockRejectedValue(
                new Error('Record to update not found')
            );

            // Act & Assert
            await expect(sessionService.updateSession(sessionId, updateData, organizationId)).rejects.toThrow(
                'Sesión no encontrada'
            );
        });
    });

    describe('getSessionsByVehicle', () => {
        it('debe obtener sesiones por vehículo', async () => {
            // Arrange
            const vehicleId = 1;
            const organizationId = 1;
            const expectedSessions = [
                {
                    id: 1,
                    vehicleId: 1,
                    startTime: new Date('2024-01-15T10:00:00Z'),
                    endTime: new Date('2024-01-15T12:00:00Z'),
                    duration: 7200,
                    status: 'COMPLETED',
                    organizationId: 1
                }
            ];

            mockPrisma.session.findMany.mockResolvedValue(expectedSessions);

            // Act
            const result = await sessionService.getSessionsByVehicle(vehicleId, organizationId);

            // Assert
            expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
                where: {
                    vehicleId,
                    organizationId
                },
                include: {
                    vehicle: true,
                    events: true
                },
                orderBy: { startTime: 'desc' }
            });
            expect(result).toEqual(expectedSessions);
        });
    });

    describe('getSessionsByDateRange', () => {
        it('debe obtener sesiones por rango de fechas', async () => {
            // Arrange
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';
            const organizationId = 1;
            const expectedSessions = [
                {
                    id: 1,
                    vehicleId: 1,
                    startTime: new Date('2024-01-15T10:00:00Z'),
                    endTime: new Date('2024-01-15T12:00:00Z'),
                    duration: 7200,
                    status: 'COMPLETED',
                    organizationId: 1
                }
            ];

            mockPrisma.session.findMany.mockResolvedValue(expectedSessions);

            // Act
            const result = await sessionService.getSessionsByDateRange(startDate, endDate, organizationId);

            // Assert
            expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId,
                    startTime: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                include: {
                    vehicle: true,
                    events: true
                },
                orderBy: { startTime: 'desc' }
            });
            expect(result).toEqual(expectedSessions);
        });
    });

    describe('getActiveSessions', () => {
        it('debe obtener sesiones activas', async () => {
            // Arrange
            const organizationId = 1;
            const expectedSessions = [
                {
                    id: 1,
                    vehicleId: 1,
                    startTime: new Date('2024-01-15T10:00:00Z'),
                    status: 'ACTIVE',
                    organizationId: 1
                }
            ];

            mockPrisma.session.findMany.mockResolvedValue(expectedSessions);

            // Act
            const result = await sessionService.getActiveSessions(organizationId);

            // Assert
            expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId,
                    status: 'ACTIVE'
                },
                include: {
                    vehicle: true,
                    events: true
                },
                orderBy: { startTime: 'desc' }
            });
            expect(result).toEqual(expectedSessions);
        });
    });

    describe('getSessionStats', () => {
        it('debe obtener estadísticas de sesiones', async () => {
            // Arrange
            const organizationId = 1;
            const expectedStats = {
                total: 100,
                byStatus: {
                    COMPLETED: 80,
                    ACTIVE: 15,
                    CANCELLED: 5
                },
                averageDuration: 7200,
                totalDuration: 720000,
                last24Hours: 10
            };

            // Mock de conteos
            mockPrisma.session.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(10); // last24Hours

            // Mock de groupBy
            mockPrisma.session.groupBy.mockResolvedValueOnce([
                { status: 'COMPLETED', _count: { status: 80 } },
                { status: 'ACTIVE', _count: { status: 15 } },
                { status: 'CANCELLED', _count: { status: 5 } }
            ]);

            // Mock de agregación
            mockPrisma.session.aggregate = vi.fn().mockResolvedValue({
                _avg: { duration: 7200 },
                _sum: { duration: 720000 }
            });

            // Act
            const result = await sessionService.getSessionStats(organizationId);

            // Assert
            expect(mockPrisma.session.count).toHaveBeenCalledTimes(2);
            expect(mockPrisma.session.groupBy).toHaveBeenCalledTimes(1);
            expect(mockPrisma.session.aggregate).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expectedStats);
        });
    });

    describe('endSession', () => {
        it('debe finalizar sesión exitosamente', async () => {
            // Arrange
            const sessionId = 1;
            const organizationId = 1;
            const endTime = new Date('2024-01-15T12:00:00Z');
            const expectedSession = {
                id: 1,
                vehicleId: 1,
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: endTime,
                duration: 7200,
                status: 'COMPLETED',
                organizationId: 1
            };

            mockPrisma.session.update.mockResolvedValue(expectedSession);

            // Act
            const result = await sessionService.endSession(sessionId, endTime, organizationId);

            // Assert
            expect(mockPrisma.session.update).toHaveBeenCalledWith({
                where: {
                    id: sessionId,
                    organizationId
                },
                data: {
                    endTime,
                    status: 'COMPLETED',
                    duration: expect.any(Number)
                },
                include: {
                    vehicle: true,
                    events: true
                }
            });
            expect(result).toEqual(expectedSession);
        });
    });

    describe('validateSessionData', () => {
        it('debe validar datos de sesión correctamente', () => {
            // Arrange
            const validData = {
                vehicleId: 1,
                startTime: new Date('2024-01-15T10:00:00Z'),
                organizationId: 1
            };

            // Act
            const result = sessionService.validateSessionData(validData);

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('debe detectar datos inválidos', () => {
            // Arrange
            const invalidData = {
                vehicleId: 0,
                startTime: 'invalid-date',
                organizationId: 0
            };

            // Act
            const result = sessionService.validateSessionData(invalidData);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('ID de vehículo es requerido');
            expect(result.errors).toContain('Fecha de inicio es requerida');
            expect(result.errors).toContain('ID de organización es requerido');
        });
    });
});