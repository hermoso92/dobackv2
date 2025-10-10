import { Request, Response } from 'express';
import { AppError } from '../middleware/error';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/NotificationService';
import { AuthRequest, AuthResponse } from '../types/auth';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class AuthController {
    private authService: AuthService;

    constructor() {
        const notificationService = new NotificationService();
        this.authService = new AuthService(notificationService);
    }

    public login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);

            logger.info('AuthController login result', {
                hasResult: !!result,
                hasData: !!result.data,
                resultKeys: Object.keys(result || {}),
                dataKeys: result.data ? Object.keys(result.data) : [],
                resultString: JSON.stringify(result)
            });

            res.json(result);
        } catch (error) {
            logger.error('Error en login', { error });
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        }
    };

    public verify = async (req: Request, res: Response) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                throw new AppError('Token no proporcionado', 401);
            }

            const result = await this.authService.verifyToken(token);

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            logger.error('Error en verificación de token', { error });
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        }
    };

    public register = async (req: Request, res: Response) => {
        try {
            const { email, password, name, role, organizationId } = req.body;

            if (!email || !password || !name || !role || !organizationId) {
                throw new ApiError(400, 'Todos los campos son requeridos');
            }

            const response = await this.authService.register({
                email,
                password,
                name,
                role,
                organizationId
            });

            res.status(201).json(response);
        } catch (error) {
            logger.error('Error en registro', {
                error,
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
            });

            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    data: null
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    data: null
                });
            }
        }
    };

    public forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            await this.authService.forgotPassword(email);

            res.json({
                success: true,
                message: 'Password reset instructions sent to email'
            });
        } catch (error) {
            logger.error('Error during forgot password', { error });
            throw error;
        }
    };

    public resetPassword = async (req: Request, res: Response) => {
        try {
            const { token, password } = req.body;
            await this.authService.resetPassword(token, password);

            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            logger.error('Error during password reset', { error });
            throw error;
        }
    };

    public verifyEmail = async (req: Request, res: Response) => {
        try {
            const { token } = req.params;
            await this.authService.verifyEmail(token);

            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            logger.error('Error during email verification', { error });
            throw error;
        }
    };

    public getCurrentUser = async (req: Request, res: Response) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }

            const result = await this.authService.getCurrentUser(req.user.id);
            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            logger.error('Error al obtener usuario actual', { error });
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        }
    };

    public updateCurrentUser = async (req: Request, res: Response) => {
        try {
            const userData = req.body;
            const user = await this.authService.updateUser(req.user!.id, userData);

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Error updating current user', { error });
            throw error;
        }
    };

    public updatePassword = async (req: Request, res: Response) => {
        try {
            const { currentPassword, newPassword } = req.body;
            await this.authService.updatePassword(req.user!.id, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            logger.error('Error updating password', { error });
            throw error;
        }
    };

    public logout = async (req: Request, res: Response) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            const result = await this.authService.logout(token || '');

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            logger.error('Error en logout', { error });
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        }
    };

    public refreshToken = async (req: Request, res: Response) => {
        try {
            const { refresh_token } = req.body;
            const result = await this.authService.refreshToken(refresh_token);

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            logger.error('Error en refresh token', { error });
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    details: error.details
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        }
    };

    public verifyToken = async (req: Request, res: Response) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new ApiError(401, 'Token no proporcionado');
            }

            const isValid = await this.authService.verifyToken(token);

            res.json({
                success: true,
                data: { valid: isValid }
            });
        } catch (error) {
            logger.error('Error al verificar token', { error });
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        }
    };

    public getSessions = async (req: Request, res: Response) => {
        try {
            const sessions = await this.authService.getUserSessions(req.user!.id);

            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            logger.error('Error getting user sessions', { error });
            throw error;
        }
    };

    public revokeSession = async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            await this.authService.revokeSession(req.user!.id, sessionId);

            res.json({
                success: true,
                message: 'Session revoked successfully'
            });
        } catch (error) {
            logger.error('Error revoking session', { error });
            throw error;
        }
    };

    public revokeAllSessions = async (req: Request, res: Response) => {
        try {
            await this.authService.revokeAllSessions(req.user!.id);

            res.json({
                success: true,
                message: 'All sessions revoked successfully'
            });
        } catch (error) {
            logger.error('Error revoking all sessions', { error });
            throw error;
        }
    };

    public getProfile = async (req: AuthRequest, res: Response<AuthResponse>) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const user = await this.authService.getProfile(req.user.userId);

            return res.json({
                success: true,
                data: {
                    user,
                    token: '' // No enviamos token en el perfil
                }
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            return res.status(404).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error al obtener el perfil'
            });
        }
    };
}
