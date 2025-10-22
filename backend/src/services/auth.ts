import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface LoginResponse {
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        organizationId: string;
        status: string;
    };
    message?: string;
}

interface VerifyTokenResponse {
    success: boolean;
    data?: {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            organizationId: string;
        };
        token: string;
    };
    message?: string;
}

interface RefreshTokenResponse {
    success: boolean;
    data?: {
        access_token: string;
        refresh_token: string;
    };
    message?: string;
}

export class AuthService {
    private jwtSecret: string;
    private jwtExpiresIn: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'DobackSoft-jwt-secret-key-cosigein';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            // Buscar usuario por email
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    organization: true
                }
            });

            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Verificar contraseña
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Contraseña incorrecta'
                };
            }

            // Verificar que el usuario esté activo
            if (user.status !== 'ACTIVE') {
                return {
                    success: false,
                    message: 'Usuario inactivo'
                };
            }

            // Generar tokens
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            };

            const access_token = jwt.sign(tokenPayload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn
            });

            const refresh_token = jwt.sign(tokenPayload, this.jwtSecret, {
                expiresIn: '7d'
            });

            logger.info(`Usuario ${email} inició sesión correctamente`);

            return {
                success: true,
                access_token,
                refresh_token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organizationId,
                    status: user.status
                }
            };
        } catch (error: any) {
            logger.error('Error en login:', error);
            return {
                success: false,
                message: 'Error al iniciar sesión'
            };
        }
    }

    async verifyToken(token: string): Promise<VerifyTokenResponse> {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as any;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || user.status !== 'ACTIVE') {
                return {
                    success: false,
                    message: 'Token inválido o usuario inactivo'
                };
            }

            return {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        organizationId: user.organizationId
                    },
                    token
                }
            };
        } catch (error: any) {
            logger.error('Error verificando token:', error);
            return {
                success: false,
                message: 'Token inválido'
            };
        }
    }

    async refreshToken(refresh_token: string): Promise<RefreshTokenResponse> {
        try {
            const decoded = jwt.verify(refresh_token, this.jwtSecret) as any;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user || user.status !== 'ACTIVE') {
                return {
                    success: false,
                    message: 'Usuario no encontrado o inactivo'
                };
            }

            // Generar nuevos tokens
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            };

            const new_access_token = jwt.sign(tokenPayload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn
            });

            const new_refresh_token = jwt.sign(tokenPayload, this.jwtSecret, {
                expiresIn: '7d'
            });

            return {
                success: true,
                data: {
                    access_token: new_access_token,
                    refresh_token: new_refresh_token
                }
            };
        } catch (error: any) {
            logger.error('Error refrescando token:', error);
            return {
                success: false,
                message: 'Error al refrescar token'
            };
        }
    }
}

export const authService = new AuthService();

