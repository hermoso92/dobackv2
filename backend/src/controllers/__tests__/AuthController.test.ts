import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/AuthService';
import { NotificationService } from '../../services/NotificationService';
import { AuthController } from '../AuthController';

// Mock de AuthService
vi.mock('../../services/AuthService');
vi.mock('../../services/NotificationService');

describe('AuthController', () => {
    let authController: AuthController;
    let mockAuthService: any;
    let mockNotificationService: any;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockNotificationService = {
            sendEmail: vi.fn(),
            sendSMS: vi.fn()
        };

        mockAuthService = {
            login: vi.fn(),
            register: vi.fn(),
            validateToken: vi.fn(),
            changePassword: vi.fn(),
            resetPassword: vi.fn(),
            refreshToken: vi.fn()
        };

        (AuthService as any).mockImplementation(() => mockAuthService);
        (NotificationService as any).mockImplementation(() => mockNotificationService);

        authController = new AuthController();

        mockRequest = {
            body: {},
            headers: {},
            user: undefined
        };

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            cookie: vi.fn().mockReturnThis()
        };

        vi.clearAllMocks();
    });

    describe('login', () => {
        it('debe hacer login exitoso con credenciales válidas', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            const expectedResult = {
                token: 'jwt-token',
                user: {
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'OPERATOR',
                    organizationId: 1
                }
            };

            mockRequest.body = loginData;
            mockAuthService.login.mockResolvedValue(expectedResult);

            // Act
            await authController.login(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockAuthService.login).toHaveBeenCalledWith(
                loginData.email,
                loginData.password
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedResult
            });
        });

        it('debe manejar error de credenciales inválidas', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            mockRequest.body = loginData;
            mockAuthService.login.mockRejectedValue(new Error('Credenciales inválidas'));

            // Act
            await authController.login(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Credenciales inválidas'
            });
        });

        it('debe validar datos de entrada requeridos', async () => {
            // Arrange
            mockRequest.body = {};

            // Act
            await authController.login(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        });
    });

    describe('register', () => {
        it('debe registrar usuario exitosamente', async () => {
            // Arrange
            const registerData = {
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123',
                role: 'OPERATOR',
                organizationId: 1
            };
            const expectedResult = {
                id: 2,
                email: 'newuser@example.com',
                name: 'New User',
                role: 'OPERATOR',
                organizationId: 1
            };

            mockRequest.body = registerData;
            mockAuthService.register.mockResolvedValue(expectedResult);

            // Act
            await authController.register(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedResult
            });
        });

        it('debe manejar error de email duplicado', async () => {
            // Arrange
            const registerData = {
                email: 'existing@example.com',
                name: 'Existing User',
                password: 'password123',
                role: 'OPERATOR',
                organizationId: 1
            };

            mockRequest.body = registerData;
            mockAuthService.register.mockRejectedValue(new Error('Email ya registrado'));

            // Act
            await authController.register(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Email ya registrado'
            });
        });
    });

    describe('changePassword', () => {
        it('debe cambiar contraseña exitosamente', async () => {
            // Arrange
            const changePasswordData = {
                currentPassword: 'oldpassword',
                newPassword: 'newpassword'
            };

            mockRequest.body = changePasswordData;
            mockRequest.user = { id: 1 };
            mockAuthService.changePassword.mockResolvedValue(true);

            // Act
            await authController.changePassword(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockAuthService.changePassword).toHaveBeenCalledWith(
                1,
                changePasswordData.currentPassword,
                changePasswordData.newPassword
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Contraseña cambiada exitosamente'
            });
        });

        it('debe manejar error de contraseña actual incorrecta', async () => {
            // Arrange
            const changePasswordData = {
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword'
            };

            mockRequest.body = changePasswordData;
            mockRequest.user = { id: 1 };
            mockAuthService.changePassword.mockRejectedValue(new Error('Contraseña actual incorrecta'));

            // Act
            await authController.changePassword(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        });
    });

    describe('resetPassword', () => {
        it('debe resetear contraseña exitosamente', async () => {
            // Arrange
            const resetData = {
                email: 'test@example.com'
            };

            mockRequest.body = resetData;
            mockAuthService.resetPassword.mockResolvedValue(true);

            // Act
            await authController.resetPassword(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetData.email);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Contraseña temporal enviada por email'
            });
        });

        it('debe manejar error de usuario no encontrado', async () => {
            // Arrange
            const resetData = {
                email: 'nonexistent@example.com'
            };

            mockRequest.body = resetData;
            mockAuthService.resetPassword.mockRejectedValue(new Error('Usuario no encontrado'));

            // Act
            await authController.resetPassword(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Usuario no encontrado'
            });
        });
    });

    describe('logout', () => {
        it('debe hacer logout exitosamente', async () => {
            // Act
            await authController.logout(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.cookie).toHaveBeenCalledWith('token', '', {
                expires: new Date(0),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Logout exitoso'
            });
        });
    });

    describe('validateToken', () => {
        it('debe validar token exitosamente', async () => {
            // Arrange
            const tokenData = {
                userId: 1,
                email: 'test@example.com',
                role: 'OPERATOR',
                organizationId: 1
            };

            mockRequest.headers = { authorization: 'Bearer valid-token' };
            mockAuthService.validateToken.mockResolvedValue(tokenData);

            // Act
            await authController.validateToken(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: tokenData
            });
        });

        it('debe manejar token inválido', async () => {
            // Arrange
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            mockAuthService.validateToken.mockRejectedValue(new Error('Token inválido'));

            // Act
            await authController.validateToken(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Token inválido'
            });
        });
    });
});
