import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, authenticateToken, hashPassword, requireRole, verifyPassword } from '../auth';

// Mock de Prisma
const mockPrisma = {
    user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    organization: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
};

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma)
}));

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

// Mock de logger
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));

// Mock de config
vi.mock('../../config/env', () => ({
    config: {
        jwt: {
            secret: 'test-secret',
            expiresIn: '1h',
            refreshExpiresIn: '7d'
        }
    }
}));

// Mock functions
const mockRequest = (data: any = {}): Partial<Request> => ({
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    headers: data.headers || {},
    user: data.user || null,
    ...data
});

const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
};

describe('Auth Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe('authenticateToken', () => {
        it('should authenticate valid token successfully', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123',
                name: 'Test User',
                password: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const mockOrganization = {
                id: 'org-123',
                name: 'Test Organization',
                description: 'Test Description',
                apiKey: 'api-key-123',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const decodedToken = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123'
            };

            (jwt.verify as any).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);

            req.headers = {
                authorization: 'Bearer valid-token'
            };

            // Act
            await authenticateToken(req as Request, res as Response, next);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(req.user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
                organizationId: mockUser.organizationId
            });
            expect(req.organization).toEqual({
                id: mockOrganization.id,
                name: mockOrganization.name
            });
            expect(next).toHaveBeenCalled();
        });

        it('should reject request with missing token', async () => {
            // Arrange
            req.headers = {};

            // Act
            await authenticateToken(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Token de acceso requerido'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token format', async () => {
            // Arrange
            req.headers = {
                authorization: 'InvalidFormat'
            };

            // Act
            await authenticateToken(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Formato de token inválido'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token', async () => {
            // Arrange
            (jwt.verify as any).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            req.headers = {
                authorization: 'Bearer invalid-token'
            };

            // Act
            await authenticateToken(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Token inválido'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request when user not found', async () => {
            // Arrange
            const decodedToken = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123'
            };

            (jwt.verify as any).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(null);

            req.headers = {
                authorization: 'Bearer valid-token'
            };

            // Act
            await authenticateToken(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Usuario no encontrado'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject request when organization not found', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123',
                name: 'Test User',
                password: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const decodedToken = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123'
            };

            (jwt.verify as any).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.organization.findUnique.mockResolvedValue(null);

            req.headers = {
                authorization: 'Bearer valid-token'
            };

            // Act
            await authenticateToken(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Organización no encontrada'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('requireRole', () => {
        beforeEach(() => {
            req.user = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123'
            };
        });

        it('should allow access for required role', () => {
            // Arrange
            const requiredRoles = ['ADMIN', 'MANAGER'];

            // Act
            requireRole(requiredRoles)(req as Request, res as Response, next);

            // Assert
            expect(next).toHaveBeenCalled();
        });

        it('should deny access for insufficient role', () => {
            // Arrange
            req.user!.role = 'OPERATOR';
            const requiredRoles = ['ADMIN', 'MANAGER'];

            // Act
            requireRole(requiredRoles)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Permisos insuficientes'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should deny access when user not authenticated', () => {
            // Arrange
            delete req.user;
            const requiredRoles = ['ADMIN'];

            // Act
            requireRole(requiredRoles)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Usuario no autenticado'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('hashPassword', () => {
        it('should hash password successfully', async () => {
            // Arrange
            const password = 'plainPassword123';
            const hashedPassword = 'hashedPassword123';
            (bcrypt.hash as any).mockResolvedValue(hashedPassword);

            // Act
            const result = await hashPassword(password);

            // Assert
            expect(result).toBe(hashedPassword);
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        });

        it('should handle hashing errors', async () => {
            // Arrange
            const password = 'plainPassword123';
            const error = new Error('Hashing failed');
            (bcrypt.hash as any).mockRejectedValue(error);

            // Act & Assert
            await expect(hashPassword(password)).rejects.toThrow('Hashing failed');
        });
    });

    describe('verifyPassword', () => {
        it('should verify correct password successfully', async () => {
            // Arrange
            const password = 'plainPassword123';
            const hashedPassword = 'hashedPassword123';
            (bcrypt.compare as any).mockResolvedValue(true);

            // Act
            const result = await verifyPassword(password, hashedPassword);

            // Assert
            expect(result).toBe(true);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should reject incorrect password', async () => {
            // Arrange
            const password = 'wrongPassword';
            const hashedPassword = 'hashedPassword123';
            (bcrypt.compare as any).mockResolvedValue(false);

            // Act
            const result = await verifyPassword(password, hashedPassword);

            // Assert
            expect(result).toBe(false);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should handle verification errors', async () => {
            // Arrange
            const password = 'plainPassword123';
            const hashedPassword = 'hashedPassword123';
            const error = new Error('Verification failed');
            (bcrypt.compare as any).mockRejectedValue(error);

            // Act & Assert
            await expect(verifyPassword(password, hashedPassword)).rejects.toThrow('Verification failed');
        });
    });

    describe('auth middleware integration', () => {
        it('should handle complete authentication flow', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123',
                name: 'Test User',
                password: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const mockOrganization = {
                id: 'org-123',
                name: 'Test Organization',
                description: 'Test Description',
                apiKey: 'api-key-123',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const decodedToken = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'ADMIN',
                organizationId: 'org-123'
            };

            (jwt.verify as any).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);

            req.headers = {
                authorization: 'Bearer valid-token'
            };

            // Act
            await auth(req as Request, res as Response, next);

            // Assert
            expect(req.user).toBeDefined();
            expect(req.organization).toBeDefined();
            expect(next).toHaveBeenCalled();
        });

        it('should handle authentication errors gracefully', async () => {
            // Arrange
            (jwt.verify as any).mockImplementation(() => {
                throw new Error('Token expired');
            });

            req.headers = {
                authorization: 'Bearer expired-token'
            };

            // Act
            await auth(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Token inválido'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
