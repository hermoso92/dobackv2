import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminService } from '../AdminService';

// Mock de Prisma
const mockPrisma = {
    user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    organization: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    vehicle: {
        count: vi.fn()
    },
    session: {
        count: vi.fn()
    }
};

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma)
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

describe('AdminService', () => {
    let adminService: AdminService;

    beforeEach(() => {
        adminService = new AdminService();
        vi.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create user successfully', async () => {
            // Arrange
            const userData = {
                email: 'admin@test.com',
                name: 'Admin User',
                role: 'ADMIN' as any,
                organizationId: 'org-123',
                password: 'hashedPassword123'
            };

            const expectedUser = {
                id: 'user-123',
                email: userData.email,
                name: userData.name,
                role: userData.role,
                organizationId: userData.organizationId,
                password: userData.password,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.user.create.mockResolvedValue(expectedUser);

            // Act
            const result = await adminService.createUser(userData);

            // Assert
            expect(result).toEqual(expectedUser);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: userData
            });
        });

        it('should handle database errors', async () => {
            // Arrange
            const userData = {
                email: 'admin@test.com',
                name: 'Admin User',
                role: 'ADMIN' as any,
                organizationId: 'org-123',
                password: 'hashedPassword123'
            };

            const error = new Error('Database connection failed');
            mockPrisma.user.create.mockRejectedValue(error);

            // Act & Assert
            await expect(adminService.createUser(userData)).rejects.toThrow('Database connection failed');
        });
    });

    describe('getUsersByOrganization', () => {
        it('should get users by organization successfully', async () => {
            // Arrange
            const organizationId = 'org-123';
            const expectedUsers = [
                {
                    id: 'user-1',
                    email: 'user1@test.com',
                    name: 'User 1',
                    role: 'OPERATOR' as any,
                    organizationId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'user-2',
                    email: 'user2@test.com',
                    name: 'User 2',
                    role: 'MANAGER' as any,
                    organizationId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockPrisma.user.findMany.mockResolvedValue(expectedUsers);

            // Act
            const result = await adminService.getUsersByOrganization(organizationId);

            // Assert
            expect(result).toEqual(expectedUsers);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: { organizationId }
            });
        });

        it('should return empty array when no users found', async () => {
            // Arrange
            const organizationId = 'org-nonexistent';
            mockPrisma.user.findMany.mockResolvedValue([]);

            // Act
            const result = await adminService.getUsersByOrganization(organizationId);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('createOrganization', () => {
        it('should create organization successfully', async () => {
            // Arrange
            const orgData = {
                name: 'Test Organization',
                description: 'Test organization description',
                apiKey: 'api-key-123'
            };

            const expectedOrganization = {
                id: 'org-123',
                name: orgData.name,
                description: orgData.description,
                apiKey: orgData.apiKey,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.organization.create.mockResolvedValue(expectedOrganization);

            // Act
            const result = await adminService.createOrganization(orgData);

            // Assert
            expect(result).toEqual(expectedOrganization);
            expect(mockPrisma.organization.create).toHaveBeenCalledWith({
                data: orgData
            });
        });

        it('should create organization without description', async () => {
            // Arrange
            const orgData = {
                name: 'Test Organization',
                apiKey: 'api-key-123'
            };

            const expectedOrganization = {
                id: 'org-123',
                name: orgData.name,
                description: null,
                apiKey: orgData.apiKey,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.organization.create.mockResolvedValue(expectedOrganization);

            // Act
            const result = await adminService.createOrganization(orgData);

            // Assert
            expect(result).toEqual(expectedOrganization);
        });
    });

    describe('getOrganizationById', () => {
        it('should get organization by ID successfully', async () => {
            // Arrange
            const organizationId = 'org-123';
            const expectedOrganization = {
                id: organizationId,
                name: 'Test Organization',
                description: 'Test description',
                apiKey: 'api-key-123',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.organization.findUnique.mockResolvedValue(expectedOrganization);

            // Act
            const result = await adminService.getOrganizationById(organizationId);

            // Assert
            expect(result).toEqual(expectedOrganization);
            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
                where: { id: organizationId }
            });
        });

        it('should return null when organization not found', async () => {
            // Arrange
            const organizationId = 'org-nonexistent';
            mockPrisma.organization.findUnique.mockResolvedValue(null);

            // Act
            const result = await adminService.getOrganizationById(organizationId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('updateOrganization', () => {
        it('should update organization successfully', async () => {
            // Arrange
            const organizationId = 'org-123';
            const updateData = {
                name: 'Updated Organization Name',
                description: 'Updated description'
            };

            const expectedOrganization = {
                id: organizationId,
                name: updateData.name,
                description: updateData.description,
                apiKey: 'api-key-123',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.organization.update.mockResolvedValue(expectedOrganization);

            // Act
            const result = await adminService.updateOrganization(organizationId, updateData);

            // Assert
            expect(result).toEqual(expectedOrganization);
            expect(mockPrisma.organization.update).toHaveBeenCalledWith({
                where: { id: organizationId },
                data: updateData
            });
        });

        it('should handle organization not found', async () => {
            // Arrange
            const organizationId = 'org-nonexistent';
            const updateData = {
                name: 'Updated Name'
            };

            mockPrisma.organization.update.mockRejectedValue(new Error('Record not found'));

            // Act & Assert
            await expect(adminService.updateOrganization(organizationId, updateData)).rejects.toThrow('Record not found');
        });
    });

    describe('deleteOrganization', () => {
        it('should delete organization successfully', async () => {
            // Arrange
            const organizationId = 'org-123';
            const expectedOrganization = {
                id: organizationId,
                name: 'Test Organization',
                description: 'Test description',
                apiKey: 'api-key-123',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.organization.delete.mockResolvedValue(expectedOrganization);

            // Act
            const result = await adminService.deleteOrganization(organizationId);

            // Assert
            expect(result).toEqual(expectedOrganization);
            expect(mockPrisma.organization.delete).toHaveBeenCalledWith({
                where: { id: organizationId }
            });
        });

        it('should handle organization not found for deletion', async () => {
            // Arrange
            const organizationId = 'org-nonexistent';
            mockPrisma.organization.delete.mockRejectedValue(new Error('Record not found'));

            // Act & Assert
            await expect(adminService.deleteOrganization(organizationId)).rejects.toThrow('Record not found');
        });
    });

    describe('getAllOrganizations', () => {
        it('should get all organizations successfully', async () => {
            // Arrange
            const expectedOrganizations = [
                {
                    id: 'org-1',
                    name: 'Organization 1',
                    description: 'Description 1',
                    apiKey: 'api-key-1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'org-2',
                    name: 'Organization 2',
                    description: 'Description 2',
                    apiKey: 'api-key-2',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockPrisma.organization.findMany.mockResolvedValue(expectedOrganizations);

            // Act
            const result = await adminService.getAllOrganizations();

            // Assert
            expect(result).toEqual(expectedOrganizations);
            expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' }
            });
        });

        it('should return empty array when no organizations found', async () => {
            // Arrange
            mockPrisma.organization.findMany.mockResolvedValue([]);

            // Act
            const result = await adminService.getAllOrganizations();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getSystemStats', () => {
        it('should get system statistics successfully', async () => {
            // Arrange
            const mockStats = {
                totalUsers: 10,
                totalOrganizations: 3,
                totalVehicles: 25,
                totalSessions: 150
            };

            mockPrisma.user.count.mockResolvedValue(mockStats.totalUsers);
            mockPrisma.organization.count.mockResolvedValue(mockStats.totalOrganizations);
            mockPrisma.vehicle.count.mockResolvedValue(mockStats.totalVehicles);
            mockPrisma.session.count.mockResolvedValue(mockStats.totalSessions);

            // Act
            const result = await adminService.getSystemStats();

            // Assert
            expect(result).toEqual(mockStats);
            expect(mockPrisma.user.count).toHaveBeenCalled();
            expect(mockPrisma.organization.count).toHaveBeenCalled();
            expect(mockPrisma.vehicle.count).toHaveBeenCalled();
            expect(mockPrisma.session.count).toHaveBeenCalled();
        });
    });
});
