import { PrismaClient } from '@prisma/client';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../middleware/error';
import {
    GetCurrentUserResponse,
    LogoutResponse,
    RefreshTokenResponse,
    TokenPayload,
    UserWithoutPassword,
    VerifyTokenResponse
} from '../types/auth';
import { comparePasswords } from '../utils/crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuthService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    public async login(email: string, password: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    name: true,
                    role: true,
                    organizationId: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!user) {
                throw new AppError('Credenciales inválidas', 401);
            }

            if (user.status !== 'ACTIVE') {
                throw new AppError('Usuario inactivo', 401);
            }

            const isValidPassword = await comparePasswords(password, user.password);
            if (!isValidPassword) {
                throw new AppError('Credenciales inválidas', 401);
            }

            const { password: _, ...userWithoutPassword } = user;

            const accessToken = this.generateToken({
                id: String(user.id),
                email: user.email,
                role: user.role,
                organizationId: user.organizationId ? String(user.organizationId) : ''
            });

            const refreshToken = this.generateToken(
                {
                    id: String(user.id),
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId ? String(user.organizationId) : ''
                },
                true
            );

            return {
                access_token: accessToken,
                refresh_token: refreshToken,
                user: userWithoutPassword
            };
        } catch (error) {
            throw error;
        }
    }

    private generateToken(payload: TokenPayload, isRefreshToken = false): string {
        const options: SignOptions = {
            expiresIn: isRefreshToken
                ? (config.jwt.refreshExpiresIn as any)
                : (config.jwt.expiresIn as any)
        };
        return jwt.sign(payload, config.jwt.secret, options);
    }

    async getCurrentUser(userId: string): Promise<GetCurrentUserResponse> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: String(userId) },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    organizationId: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!user) {
                throw new AppError('Usuario no encontrado', 404);
            }

            const userWithoutPassword: UserWithoutPassword = {
                id: String(user.id),
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId ? String(user.organizationId) : '',
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            return {
                success: true,
                data: userWithoutPassword
            };
        } catch (error) {
            throw error;
        }
    }

    async verifyToken(token: string): Promise<VerifyTokenResponse> {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
            const user = await prisma.user.findUnique({
                where: { id: String(decoded.id) },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    organizationId: true
                }
            });

            if (!user) {
                throw new AppError('Token inválido', 401);
            }

            return {
                success: true,
                valid: true,
                data: {
                    id: String(user.id),
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId ? String(user.organizationId) : ''
                }
            };
        } catch (error) {
            logger.error('Error al verificar token', { error });
            throw error;
        }
    }

    async logout(): Promise<LogoutResponse> {
        return {
            success: true,
            message: 'Logout exitoso'
        };
    }

    async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret) as TokenPayload;
            const user = await prisma.user.findUnique({
                where: { id: String(decoded.id) },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    organizationId: true,
                    name: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!user) {
                throw new AppError('Usuario no encontrado', 404);
            }

            // Generar nuevo access token
            const newAccessToken = this.generateToken({
                id: String(user.id),
                email: user.email,
                role: user.role,
                organizationId: user.organizationId ? String(user.organizationId) : ''
            });

            // Generar nuevo refresh token
            const newRefreshToken = this.generateToken(
                {
                    id: String(user.id),
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId ? String(user.organizationId) : ''
                },
                true
            );

            const { password: _, ...userWithoutPassword } = user as any;

            return {
                success: true,
                data: { 
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
                    user: userWithoutPassword
                }
            };
        } catch (error) {
            logger.error('Error al refrescar token', { error });
            throw error;
        }
    }
}