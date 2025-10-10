import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleService } from '../VehicleService';

describe('VehicleService', () => {
    let vehicleService: VehicleService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            vehicle: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                count: vi.fn()
            }
        };

        vehicleService = new VehicleService(mockPrisma as unknown as PrismaClient);
        vi.clearAllMocks();
    });

    describe('getAllVehicles', () => {
        it('debe obtener todos los vehículos de una organización', async () => {
            // Arrange
            const organizationId = 1;
            const expectedVehicles = [
                {
                    id: 1,
                    name: 'Vehículo 1',
                    identifier: 'VH001',
                    type: 'AMBULANCE',
                    organizationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    name: 'Vehículo 2',
                    identifier: 'VH002',
                    type: 'FIRE_TRUCK',
                    organizationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockPrisma.vehicle.findMany.mockResolvedValue(expectedVehicles);

            // Act
            const result = await vehicleService.getAllVehicles(organizationId);

            // Assert
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
                where: { organizationId },
                include: {
                    sessions: true,
                    events: true
                },
                orderBy: { createdAt: 'desc' }
            });
            expect(result).toEqual(expectedVehicles);
        });

        it('debe manejar error de base de datos', async () => {
            // Arrange
            const organizationId = 1;
            mockPrisma.vehicle.findMany.mockRejectedValue(new Error('Error de conexión'));

            // Act & Assert
            await expect(vehicleService.getAllVehicles(organizationId)).rejects.toThrow('Error de conexión');
        });
    });

    describe('getVehicleById', () => {
        it('debe obtener vehículo por ID', async () => {
            // Arrange
            const vehicleId = 1;
            const organizationId = 1;
            const expectedVehicle = {
                id: 1,
                name: 'Vehículo 1',
                identifier: 'VH001',
                type: 'AMBULANCE',
                organizationId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.vehicle.findUnique.mockResolvedValue(expectedVehicle);

            // Act
            const result = await vehicleService.getVehicleById(vehicleId, organizationId);

            // Assert
            expect(mockPrisma.vehicle.findUnique).toHaveBeenCalledWith({
                where: {
                    id: vehicleId,
                    organizationId
                },
                include: {
                    sessions: true,
                    events: true,
                    organization: true
                }
            });
            expect(result).toEqual(expectedVehicle);
        });

        it('debe retornar null si vehículo no existe', async () => {
            // Arrange
            const vehicleId = 999;
            const organizationId = 1;
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);

            // Act
            const result = await vehicleService.getVehicleById(vehicleId, organizationId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('createVehicle', () => {
        it('debe crear vehículo exitosamente', async () => {
            // Arrange
            const vehicleData = {
                name: 'Nuevo Vehículo',
                identifier: 'VH003',
                type: 'AMBULANCE',
                description: 'Vehículo de prueba',
                organizationId: 1
            };
            const expectedVehicle = {
                id: 3,
                ...vehicleData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.vehicle.create.mockResolvedValue(expectedVehicle);

            // Act
            const result = await vehicleService.createVehicle(vehicleData);

            // Assert
            expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
                data: vehicleData,
                include: {
                    organization: true
                }
            });
            expect(result).toEqual(expectedVehicle);
        });

        it('debe manejar error de identificador duplicado', async () => {
            // Arrange
            const vehicleData = {
                name: 'Vehículo Duplicado',
                identifier: 'VH001', // Ya existe
                type: 'AMBULANCE',
                organizationId: 1
            };

            mockPrisma.vehicle.create.mockRejectedValue(
                new Error('Unique constraint failed on the fields: (`identifier`)')
            );

            // Act & Assert
            await expect(vehicleService.createVehicle(vehicleData)).rejects.toThrow(
                'Identificador ya existe'
            );
        });
    });

    describe('updateVehicle', () => {
        it('debe actualizar vehículo exitosamente', async () => {
            // Arrange
            const vehicleId = 1;
            const updateData = {
                name: 'Vehículo Actualizado',
                description: 'Descripción actualizada'
            };
            const organizationId = 1;
            const expectedVehicle = {
                id: 1,
                name: 'Vehículo Actualizado',
                identifier: 'VH001',
                type: 'AMBULANCE',
                description: 'Descripción actualizada',
                organizationId: 1,
                updatedAt: new Date()
            };

            mockPrisma.vehicle.update.mockResolvedValue(expectedVehicle);

            // Act
            const result = await vehicleService.updateVehicle(vehicleId, updateData, organizationId);

            // Assert
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
                where: {
                    id: vehicleId,
                    organizationId
                },
                data: updateData,
                include: {
                    organization: true
                }
            });
            expect(result).toEqual(expectedVehicle);
        });

        it('debe manejar vehículo no encontrado', async () => {
            // Arrange
            const vehicleId = 999;
            const updateData = { name: 'Nuevo Nombre' };
            const organizationId = 1;

            mockPrisma.vehicle.update.mockRejectedValue(
                new Error('Record to update not found')
            );

            // Act & Assert
            await expect(vehicleService.updateVehicle(vehicleId, updateData, organizationId)).rejects.toThrow(
                'Vehículo no encontrado'
            );
        });
    });

    describe('deleteVehicle', () => {
        it('debe eliminar vehículo exitosamente', async () => {
            // Arrange
            const vehicleId = 1;
            const organizationId = 1;
            const expectedVehicle = {
                id: 1,
                name: 'Vehículo Eliminado',
                identifier: 'VH001',
                type: 'AMBULANCE',
                organizationId: 1
            };

            mockPrisma.vehicle.delete.mockResolvedValue(expectedVehicle);

            // Act
            const result = await vehicleService.deleteVehicle(vehicleId, organizationId);

            // Assert
            expect(mockPrisma.vehicle.delete).toHaveBeenCalledWith({
                where: {
                    id: vehicleId,
                    organizationId
                }
            });
            expect(result).toEqual(expectedVehicle);
        });

        it('debe manejar vehículo no encontrado para eliminación', async () => {
            // Arrange
            const vehicleId = 999;
            const organizationId = 1;

            mockPrisma.vehicle.delete.mockRejectedValue(
                new Error('Record to delete does not exist')
            );

            // Act & Assert
            await expect(vehicleService.deleteVehicle(vehicleId, organizationId)).rejects.toThrow(
                'Vehículo no encontrado'
            );
        });
    });

    describe('searchVehicles', () => {
        it('debe buscar vehículos por nombre o identificador', async () => {
            // Arrange
            const searchQuery = 'ambulancia';
            const organizationId = 1;
            const expectedVehicles = [
                {
                    id: 1,
                    name: 'Ambulancia 1',
                    identifier: 'AMB001',
                    type: 'AMBULANCE',
                    organizationId: 1
                }
            ];

            mockPrisma.vehicle.findMany.mockResolvedValue(expectedVehicles);

            // Act
            const result = await vehicleService.searchVehicles(searchQuery, organizationId);

            // Assert
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
                where: {
                    organizationId,
                    OR: [
                        { name: { contains: searchQuery, mode: 'insensitive' } },
                        { identifier: { contains: searchQuery, mode: 'insensitive' } }
                    ]
                },
                include: {
                    sessions: true,
                    events: true
                },
                orderBy: { name: 'asc' }
            });
            expect(result).toEqual(expectedVehicles);
        });

        it('debe retornar array vacío si no hay resultados', async () => {
            // Arrange
            const searchQuery = 'inexistente';
            const organizationId = 1;
            mockPrisma.vehicle.findMany.mockResolvedValue([]);

            // Act
            const result = await vehicleService.searchVehicles(searchQuery, organizationId);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getVehicleStats', () => {
        it('debe obtener estadísticas de vehículos', async () => {
            // Arrange
            const organizationId = 1;
            const expectedStats = {
                total: 10,
                byType: {
                    AMBULANCE: 5,
                    FIRE_TRUCK: 3,
                    POLICE: 2
                },
                active: 8,
                inactive: 2
            };

            // Mock de conteos
            mockPrisma.vehicle.count
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(5)  // AMBULANCE
                .mockResolvedValueOnce(3)  // FIRE_TRUCK
                .mockResolvedValueOnce(2)  // POLICE
                .mockResolvedValueOnce(8)  // active
                .mockResolvedValueOnce(2); // inactive

            // Act
            const result = await vehicleService.getVehicleStats(organizationId);

            // Assert
            expect(mockPrisma.vehicle.count).toHaveBeenCalledTimes(6);
            expect(result).toEqual(expectedStats);
        });
    });

    describe('getVehiclesByOrganization', () => {
        it('debe obtener vehículos por organización con paginación', async () => {
            // Arrange
            const organizationId = 1;
            const page = 1;
            const limit = 10;
            const expectedVehicles = [
                {
                    id: 1,
                    name: 'Vehículo 1',
                    identifier: 'VH001',
                    type: 'AMBULANCE',
                    organizationId: 1
                }
            ];

            mockPrisma.vehicle.findMany.mockResolvedValue(expectedVehicles);
            mockPrisma.vehicle.count.mockResolvedValue(25);

            // Act
            const result = await vehicleService.getVehiclesByOrganization(organizationId, page, limit);

            // Assert
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
                where: { organizationId },
                include: {
                    sessions: true,
                    events: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            });
            expect(result).toEqual({
                vehicles: expectedVehicles,
                pagination: {
                    page,
                    limit,
                    total: 25,
                    totalPages: 3
                }
            });
        });
    });

    describe('validateVehicleData', () => {
        it('debe validar datos de vehículo correctamente', () => {
            // Arrange
            const validData = {
                name: 'Vehículo Válido',
                identifier: 'VH001',
                type: 'AMBULANCE',
                organizationId: 1
            };

            // Act
            const result = vehicleService.validateVehicleData(validData);

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('debe detectar datos inválidos', () => {
            // Arrange
            const invalidData = {
                name: '',
                identifier: '',
                type: 'INVALID_TYPE',
                organizationId: 0
            };

            // Act
            const result = vehicleService.validateVehicleData(invalidData);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Nombre es requerido');
            expect(result.errors).toContain('Identificador es requerido');
            expect(result.errors).toContain('Tipo de vehículo no válido');
        });
    });
});
