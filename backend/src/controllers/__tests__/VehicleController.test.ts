import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleService } from '../../services/VehicleService';
import { VehicleController } from '../VehicleController';

// Mock de VehicleService
vi.mock('../../services/VehicleService');

describe('VehicleController', () => {
    let vehicleController: VehicleController;
    let mockVehicleService: any;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockVehicleService = {
            getAllVehicles: vi.fn(),
            getVehicleById: vi.fn(),
            createVehicle: vi.fn(),
            updateVehicle: vi.fn(),
            deleteVehicle: vi.fn(),
            getVehiclesByOrganization: vi.fn(),
            searchVehicles: vi.fn(),
            getVehicleStats: vi.fn()
        };

        (VehicleService as any).mockImplementation(() => mockVehicleService);

        vehicleController = new VehicleController();

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

    describe('getAllVehicles', () => {
        it('debe obtener todos los vehículos exitosamente', async () => {
            // Arrange
            const expectedVehicles = [
                {
                    id: 1,
                    name: 'Vehículo 1',
                    identifier: 'VH001',
                    type: 'AMBULANCE',
                    organizationId: 1
                },
                {
                    id: 2,
                    name: 'Vehículo 2',
                    identifier: 'VH002',
                    type: 'FIRE_TRUCK',
                    organizationId: 1
                }
            ];

            mockVehicleService.getAllVehicles.mockResolvedValue(expectedVehicles);

            // Act
            await vehicleController.getAllVehicles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.getAllVehicles).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedVehicles
            });
        });

        it('debe manejar error al obtener vehículos', async () => {
            // Arrange
            mockVehicleService.getAllVehicles.mockRejectedValue(new Error('Error de base de datos'));

            // Act
            await vehicleController.getAllVehicles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Error interno del servidor'
            });
        });
    });

    describe('getVehicleById', () => {
        it('debe obtener vehículo por ID exitosamente', async () => {
            // Arrange
            const vehicleId = '1';
            const expectedVehicle = {
                id: 1,
                name: 'Vehículo 1',
                identifier: 'VH001',
                type: 'AMBULANCE',
                organizationId: 1
            };

            mockRequest.params = { id: vehicleId };
            mockVehicleService.getVehicleById.mockResolvedValue(expectedVehicle);

            // Act
            await vehicleController.getVehicleById(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.getVehicleById).toHaveBeenCalledWith(parseInt(vehicleId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedVehicle
            });
        });

        it('debe manejar vehículo no encontrado', async () => {
            // Arrange
            const vehicleId = '999';
            mockRequest.params = { id: vehicleId };
            mockVehicleService.getVehicleById.mockResolvedValue(null);

            // Act
            await vehicleController.getVehicleById(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Vehículo no encontrado'
            });
        });
    });

    describe('createVehicle', () => {
        it('debe crear vehículo exitosamente', async () => {
            // Arrange
            const vehicleData = {
                name: 'Nuevo Vehículo',
                identifier: 'VH003',
                type: 'AMBULANCE',
                description: 'Vehículo de prueba'
            };
            const expectedVehicle = {
                id: 3,
                ...vehicleData,
                organizationId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.body = vehicleData;
            mockVehicleService.createVehicle.mockResolvedValue(expectedVehicle);

            // Act
            await vehicleController.createVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.createVehicle).toHaveBeenCalledWith({
                ...vehicleData,
                organizationId: 1
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedVehicle
            });
        });

        it('debe validar datos requeridos', async () => {
            // Arrange
            mockRequest.body = {};

            // Act
            await vehicleController.createVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Nombre e identificador son requeridos'
            });
        });

        it('debe manejar error de identificador duplicado', async () => {
            // Arrange
            const vehicleData = {
                name: 'Vehículo Duplicado',
                identifier: 'VH001', // Ya existe
                type: 'AMBULANCE'
            };

            mockRequest.body = vehicleData;
            mockVehicleService.createVehicle.mockRejectedValue(new Error('Identificador ya existe'));

            // Act
            await vehicleController.createVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Identificador ya existe'
            });
        });
    });

    describe('updateVehicle', () => {
        it('debe actualizar vehículo exitosamente', async () => {
            // Arrange
            const vehicleId = '1';
            const updateData = {
                name: 'Vehículo Actualizado',
                description: 'Descripción actualizada'
            };
            const expectedVehicle = {
                id: 1,
                name: 'Vehículo Actualizado',
                identifier: 'VH001',
                type: 'AMBULANCE',
                description: 'Descripción actualizada',
                organizationId: 1
            };

            mockRequest.params = { id: vehicleId };
            mockRequest.body = updateData;
            mockVehicleService.updateVehicle.mockResolvedValue(expectedVehicle);

            // Act
            await vehicleController.updateVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.updateVehicle).toHaveBeenCalledWith(
                parseInt(vehicleId),
                updateData,
                1
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedVehicle
            });
        });

        it('debe manejar vehículo no encontrado para actualización', async () => {
            // Arrange
            const vehicleId = '999';
            const updateData = { name: 'Nuevo Nombre' };

            mockRequest.params = { id: vehicleId };
            mockRequest.body = updateData;
            mockVehicleService.updateVehicle.mockResolvedValue(null);

            // Act
            await vehicleController.updateVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Vehículo no encontrado'
            });
        });
    });

    describe('deleteVehicle', () => {
        it('debe eliminar vehículo exitosamente', async () => {
            // Arrange
            const vehicleId = '1';
            mockRequest.params = { id: vehicleId };
            mockVehicleService.deleteVehicle.mockResolvedValue(true);

            // Act
            await vehicleController.deleteVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.deleteVehicle).toHaveBeenCalledWith(parseInt(vehicleId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Vehículo eliminado exitosamente'
            });
        });

        it('debe manejar vehículo no encontrado para eliminación', async () => {
            // Arrange
            const vehicleId = '999';
            mockRequest.params = { id: vehicleId };
            mockVehicleService.deleteVehicle.mockResolvedValue(false);

            // Act
            await vehicleController.deleteVehicle(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Vehículo no encontrado'
            });
        });
    });

    describe('searchVehicles', () => {
        it('debe buscar vehículos exitosamente', async () => {
            // Arrange
            const searchQuery = 'ambulancia';
            const expectedVehicles = [
                {
                    id: 1,
                    name: 'Ambulancia 1',
                    identifier: 'AMB001',
                    type: 'AMBULANCE',
                    organizationId: 1
                }
            ];

            mockRequest.query = { q: searchQuery };
            mockVehicleService.searchVehicles.mockResolvedValue(expectedVehicles);

            // Act
            await vehicleController.searchVehicles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.searchVehicles).toHaveBeenCalledWith(searchQuery, 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedVehicles
            });
        });

        it('debe manejar búsqueda sin resultados', async () => {
            // Arrange
            const searchQuery = 'inexistente';
            mockRequest.query = { q: searchQuery };
            mockVehicleService.searchVehicles.mockResolvedValue([]);

            // Act
            await vehicleController.searchVehicles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: [],
                message: 'No se encontraron vehículos'
            });
        });
    });

    describe('getVehicleStats', () => {
        it('debe obtener estadísticas de vehículos exitosamente', async () => {
            // Arrange
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

            mockVehicleService.getVehicleStats.mockResolvedValue(expectedStats);

            // Act
            await vehicleController.getVehicleStats(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockVehicleService.getVehicleStats).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedStats
            });
        });
    });
});
