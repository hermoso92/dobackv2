import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../types/enums';
import { AuthService } from '../AuthService';

// Mock de bcrypt
vi.mock('bcrypt', () => ({
    hash: vi.fn(),
    compare: vi.fn()
}));

// Mock de jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    sign: vi.fn(),
    verify: vi.fn()
}));

describe('AuthService', () => {
    let service: AuthService;
    let mockLogger: any;
    let mockPrismaClient: any;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword123',
        role: UserRole.OPERATOR,
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn()
        };
        mockPrismaClient = {
            user: {
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn()
            }
        };
        service = new AuthService(mockPrismaClient as unknown as PrismaClient);
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(true);
            (jwt.sign as any).mockReturnValue('test-token');

            // Act
            const result = await service.login('test@example.com', 'password123');

            // Assert
            expect(result).toEqual({
                token: 'test-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: mockUser.role,
                    organizationId: mockUser.organizationId
                }
            });
            expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
        });

        it('should throw error when user is not found', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.login('nonexistent@example.com', 'password123')).rejects.toThrow(
                'Usuario no encontrado'
            );
        });

        it('should throw error with invalid password', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(false);

            // Act & Assert
            await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Contraseña incorrecta'
            );
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            // Arrange
            const registerData = {
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123',
                role: UserRole.OPERATOR,
                organizationId: 1
            };

            (bcrypt.hash as any).mockResolvedValue('hashedPassword123');
            mockPrismaClient.user.create.mockResolvedValue({
                id: 2,
                ...registerData,
                password: 'hashedPassword123',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Act
            const result = await service.register(registerData);

            // Assert
            expect(result).toEqual({
                id: 2,
                email: registerData.email,
                name: registerData.name,
                role: registerData.role,
                organizationId: registerData.organizationId
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
            expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
                data: {
                    ...registerData,
                    password: 'hashedPassword123'
                }
            });
        });

        it('should throw error when email already exists', async () => {
            // Arrange
            const registerData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'password123',
                role: UserRole.OPERATOR,
                organizationId: 1
            };

            mockPrismaClient.user.create.mockRejectedValue(
                new Error('Unique constraint failed on the fields: (`email`)')
            );

            // Act & Assert
            await expect(service.register(registerData)).rejects.toThrow(
                'El correo electrónico ya está registrado'
            );
        });
    });

    describe('validateToken', () => {
        it('should successfully validate a valid token', async () => {
            // Arrange
            const decodedToken = {
                userId: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
                organizationId: mockUser.organizationId
            };
            (jwt.verify as any).mockReturnValue(decodedToken);

            // Act
            const result = await service.validateToken('valid-token');

            // Assert
            expect(result).toEqual(decodedToken);
            expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
        });

        it('should throw error with invalid token', async () => {
            // Arrange
            (jwt.verify as any).mockImplementation(() => {
                throw new Error('Token inválido');
            });

            // Act & Assert
            await expect(service.validateToken('invalid-token')).rejects.toThrow('Token inválido');
        });
    });

    describe('changePassword', () => {
        it('should successfully change password', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(true);
            (bcrypt.hash as any).mockResolvedValue('newHashedPassword');
            mockPrismaClient.user.update.mockResolvedValue({
                ...mockUser,
                password: 'newHashedPassword'
            });

            // Act
            await service.changePassword(1, 'currentPassword', 'newPassword');

            // Assert
            expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 }
            });
            expect(bcrypt.compare).toHaveBeenCalledWith('currentPassword', mockUser.password);
            expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
            expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { password: 'newHashedPassword' }
            });
        });

        it('should throw error with incorrect current password', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(false);

            // Act & Assert
            await expect(service.changePassword(1, 'wrongPassword', 'newPassword')).rejects.toThrow(
                'Contraseña actual incorrecta'
            );
        });
    });

    describe('resetPassword', () => {
        it('should successfully reset password', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.hash as any).mockResolvedValue('tempHashedPassword');
            mockPrismaClient.user.update.mockResolvedValue({
                ...mockUser,
                password: 'tempHashedPassword'
            });

            // Act
            await service.resetPassword('test@example.com');

            // Assert
            expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
            expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { password: 'tempHashedPassword' }
            });
        });

        it('should throw error for non-existent user', async () => {
            // Arrange
            mockPrismaClient.user.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.resetPassword('nonexistent@example.com')).rejects.toThrow(
                'Usuario no encontrado'
            );
        });
    });
});
