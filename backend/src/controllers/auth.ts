import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error';
import { AuthService } from '../services/auth';
import {
    GetCurrentUserResponse,
    LogoutRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    VerifyTokenRequest,
    VerifyTokenResponse
} from '../types/auth';
import { logger } from '../utils/logger';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            logger.debug('Iniciando proceso de login', {
                body: req.body,
                contentType: req.headers['content-type'],
                method: req.method,
                path: req.path
            });

            const { email, password } = req.body;

            // Intentar el login
            const result = await this.authService.login(email, password);

            logger.info('Login exitoso', { email });
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error en login', {
                error,
                body: req.body,
                contentType: req.headers['content-type']
            });
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

    verify = async (
        req: Request<{}, {}, VerifyTokenRequest>,
        res: Response<VerifyTokenResponse>
    ) => {
        try {
            const authHeader = req.headers.authorization;
            logger.info('Verificando token', {
                hasAuthHeader: !!authHeader,
                method: req.method,
                path: req.path,
                headers: req.headers
            });

            if (!authHeader) {
                logger.warn('No se encontró header de autorización');
                return res.status(401).json({
                    success: false,
                    valid: false,
                    error: 'No se proporcionó token de autenticación'
                });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                logger.warn('Token mal formateado en header');
                return res.status(401).json({
                    success: false,
                    valid: false,
                    error: 'Token mal formateado'
                });
            }

            logger.info('Token extraído del header', { token: token.substring(0, 20) + '...' });

            const result = await this.authService.verifyToken(token);
            logger.info('Resultado de verificación de token', { result });

            res.json(result);
        } catch (error) {
            logger.error('Error al verificar token', { error });
            res.status(401).json({
                success: false,
                valid: false,
                error: 'Error al verificar el token'
            });
        }
    };

    refreshToken = async (
        req: Request<{}, {}, RefreshTokenRequest>,
        res: Response<RefreshTokenResponse>
    ) => {
        try {
            const { refreshToken } = req.body;
            const result = await this.authService.refreshToken(refreshToken);

            res.json(result);
        } catch (error) {
            logger.error('Error en refresh token', { error });

            if (error instanceof AppError) {
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

    logout = async (req: Request<{}, {}, LogoutRequest>, res: Response<LogoutResponse>) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                const result = await this.authService.logout(token);
                res.json(result);
            } else {
                res.json({
                    success: true,
                    message: 'Logout exitoso'
                });
            }
        } catch (error) {
            logger.error('Error en logout', { error });
            res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión',
                error: 'Error interno del servidor'
            });
        }
    };

    getCurrentUser = async (req: Request, res: Response<GetCurrentUserResponse>) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
            }

            const result = await this.authService.getCurrentUser(req.user.id);
            res.json(result);
        } catch (error) {
            logger.error('Error al obtener usuario actual', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
}

export const authController = new AuthController();
