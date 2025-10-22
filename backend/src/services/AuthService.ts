import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../lib/prisma'; // ? SINGLETON DE PRISMA
import {
    AuthResponse,
    LoginCredentials,
    TokenPayload,
    UserData,
    UserRole,
    UserWithoutPassword
} from '../types/auth';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { AuditService } from './AuditService';
import { NotificationService } from './NotificationService';
import { UserService } from './UserService';

export class AuthService {
    private readonly JWT_SECRET: string;
    private readonly JWT_EXPIRES_IN: string;
    private readonly JWT_REFRESH_EXPIRES_IN: string;
    private readonly BCRYPT_ROUNDS: number;
    private readonly userService: UserService;
    private notificationService: NotificationService;
    private auditService: AuditService;

    constructor(notificationService: NotificationService) {
        // ? Asignar prisma en el constructor para evitar ReferenceError por orden de carga
        this.notificationService = notificationService;
        this.auditService = new AuditService();
        this.JWT_SECRET = config.jwt.secret;
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
        this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        this.BCRYPT_ROUNDS = config.security.bcryptRounds;
        this.userService = new UserService();
    }

    public async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const user = await prisma.user.findUnique({
                where: { email: credentials.email }
            });

            if (!user) {
                throw new ApiError(401, 'Credenciales inv�lidas');
            }

            const isValidPassword = await bcrypt.compare(credentials.password, user.password);
            if (!isValidPassword) {
                throw new ApiError(401, 'Credenciales inv�lidas');
            }

            const tokens = this.generateTokens(user);
            await this.auditService.logActivity(user.id, 'USER_LOGIN', 'Login exitoso');

            const result = {
                success: true,
                data: {
                    user: this.sanitizeUser(user),
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken
                }
            };

            logger.info('Login result', {
                hasData: !!result.data,
                hasUser: !!result.data.user,
                hasAccessToken: !!result.data.access_token,
                hasRefreshToken: !!result.data.refresh_token
            });

            return result;
        } catch (error) {
            logger.error('Error en login', { error });
            throw error;
        }
    }

    public async refreshToken(refreshToken: string): Promise<AuthResponse> {
        try {
            const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as TokenPayload;
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user) {
                throw new ApiError(401, 'Usuario no encontrado');
            }

            const tokens = this.generateTokens(user);
            await this.auditService.logActivity(user.id, 'USER_LOGIN', 'Token refrescado');

            return {
                success: true,
                data: {
                    user: this.sanitizeUser(user),
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken
                }
            };
        } catch (error) {
            logger.error('Error al refrescar token', { error });
            throw new ApiError(401, 'Token de refresco inv�lido o expirado');
        }
    }

    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            organizationId: user.organizationId
        };

        const accessToken = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN
        } as SignOptions);

        const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_REFRESH_EXPIRES_IN
        } as SignOptions);

        return { accessToken, refreshToken };
    }

    public async verifyToken(token: string): Promise<boolean> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            return !!user;
        } catch (error) {
            logger.error('Error al verificar token', { error });
            return false;
        }
    }

    public async logout(userId: string): Promise<void> {
        try {
            await this.auditService.logActivity(userId, 'USER_LOGOUT', 'Logout exitoso');
        } catch (error) {
            logger.error('Error en logout', { error });
            throw error;
        }
    }

    async validateToken(token: string): Promise<TokenPayload> {
        try {
            logger.debug('Validando token', { tokenPreview: token.substring(0, 20) + '...' });

            if (!token) {
                throw new ApiError(401, 'Token no proporcionado');
            }

            const decoded = jwt.verify(token, this.JWT_SECRET);
            logger.debug('Token verificado', { decoded });

            if (!decoded || typeof decoded !== 'object') {
                logger.error('Token decodificado no es un objeto v�lido', { decoded });
                throw new ApiError(401, 'Token inv�lido: formato incorrecto');
            }

            const payload = decoded as TokenPayload;

            // Validaciones adicionales del payload
            if (!payload.id) {
                logger.error('Token no contiene ID de usuario', { payload });
                throw new ApiError(401, 'Token inv�lido: no contiene ID de usuario');
            }

            if (!payload.email) {
                logger.error('Token no contiene email', { payload });
                throw new ApiError(401, 'Token inv�lido: no contiene email');
            }

            if (!payload.role) {
                logger.error('Token no contiene rol', { payload });
                throw new ApiError(401, 'Token inv�lido: no contiene rol');
            }

            // Verificar si el usuario a�n existe
            const user = await prisma.user.findUnique({
                where: { id: payload.id }
            });

            if (!user) {
                logger.error('Usuario no encontrado', { userId: payload.id });
                throw new ApiError(401, 'Token inv�lido: usuario no encontrado');
            }

            // Verificar si el usuario est� activo
            if (user.status !== 'ACTIVE') {
                logger.error('Usuario inactivo', { userId: payload.id });
                throw new ApiError(401, 'Token inv�lido: usuario inactivo');
            }

            logger.debug('Token validado exitosamente', { userId: payload.id });
            return payload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                logger.error('Token expirado', { error });
                throw new ApiError(401, 'Token expirado');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                logger.error('Error de JWT', { error });
                throw new ApiError(401, 'Token inv�lido: error de formato');
            }
            logger.error('Error validando token', {
                error,
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
            });
            throw new ApiError(401, 'Token inv�lido');
        }
    }

    async verifyPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
        try {
            logger.debug('Verificando permisos', { userId, requiredPermissions });

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                logger.error('Usuario no encontrado', { userId });
                throw new ApiError(404, 'Usuario no encontrado');
            }

            if (!user.role) {
                logger.error('Usuario no tiene rol asignado', { userId });
                throw new ApiError(403, 'Usuario no tiene rol asignado');
            }

            // Verificar permisos basados en el rol
            const rolePermissions = this.getRolePermissions(user.role);
            const hasAllPermissions = requiredPermissions.every((permission) =>
                rolePermissions.includes(permission)
            );

            if (!hasAllPermissions) {
                logger.warn('Permisos insuficientes', {
                    userId,
                    requiredPermissions,
                    rolePermissions
                });
                throw new ApiError(403, 'Permisos insuficientes');
            }

            logger.debug('Permisos verificados exitosamente', { userId });
            return true;
        } catch (error) {
            logger.error('Error verificando permisos', {
                error,
                userId,
                requiredPermissions
            });
            throw error;
        }
    }

    private getRolePermissions(role: UserRole): string[] {
        // Mapeo de roles a permisos
        const rolePermissions: Record<UserRole, string[]> = {
            ADMIN: [
                'read:all',
                'write:all',
                'delete:all',
                'manage:users',
                'manage:roles',
                'manage:permissions'
            ],
            OPERATOR: ['read:all', 'write:own', 'delete:own', 'manage:own'],
            USER: ['read:own', 'write:own'],
            VIEWER: ['read:own']
        };

        return rolePermissions[role] || [];
    }

    async getUserFromToken(token: string): Promise<Omit<User, 'password'>> {
        try {
            logger.debug('Iniciando verificaci�n de token', {
                tokenPreview: token.substring(0, 20) + '...'
            });

            const decoded = await this.validateToken(token);
            logger.debug('Token decodificado', { decoded });

            if (!decoded) {
                logger.error('Token decodificado es null o undefined');
                throw new ApiError(401, 'Token inv�lido o malformado');
            }

            if (!decoded.id) {
                logger.error('Token no contiene ID de usuario', { decoded });
                throw new ApiError(401, 'Token inv�lido: no contiene ID de usuario');
            }

            logger.debug('Buscando usuario en base de datos', { userId: decoded.id });

            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.id
                },
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
                logger.error('Usuario no encontrado en base de datos', { userId: decoded.id });
                throw new ApiError(404, 'Usuario no encontrado');
            }

            if (user.status !== 'ACTIVE') {
                logger.error('Usuario inactivo', { userId: decoded.id, status: user.status });
                throw new ApiError(401, 'Usuario inactivo');
            }

            logger.debug('Usuario encontrado y verificado', { userId: user.id, email: user.email });
            return user;
        } catch (error) {
            logger.error('Error al obtener usuario del token', {
                error,
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new ApiError(404, 'Usuario no encontrado');
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw new ApiError(401, 'Contrase�a actual incorrecta');
            }

            const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            // Notificar al usuario del cambio de contrase�a
            await this.notificationService.sendPasswordChangeNotification(user.email);
        } catch (error) {
            logger.error('Error changing password', { error, userId });
            throw error;
        }
    }

    async resetPassword(token: string): Promise<void> {
        try {
            const verification = await prisma.$queryRaw<{ userId: string }[]>`
                SELECT user_id as "userId" FROM email_verification_tokens
                WHERE token = ${token} AND expires_at > NOW()
                LIMIT 1
            `;

            if (!verification?.length) {
                throw new ApiError(400, 'Token de verificaci�n inv�lido o expirado');
            }

            await prisma.$executeRaw`
                DELETE FROM email_verification_tokens WHERE token = ${token}
            `;
        } catch (error) {
            logger.error('Error verifying email', { error, token });
            throw error;
        }
    }

    async verifyEmail(token: string): Promise<void> {
        try {
            const verification = await prisma.$queryRaw<{ userId: string }[]>`
                SELECT user_id as "userId" FROM email_verification_tokens
                WHERE token = ${token} AND expires_at > NOW()
                LIMIT 1
            `;

            if (!verification?.length) {
                throw new ApiError(400, 'Token de verificaci�n inv�lido o expirado');
            }

            await prisma.$executeRaw`
                DELETE FROM email_verification_tokens WHERE token = ${token}
            `;
        } catch (error) {
            logger.error('Error verifying email', { error, token });
            throw error;
        }
    }

    async register(data: {
        email: string;
        name: string;
        password: string;
        role: UserRole;
        organizationId: string;
    }): Promise<AuthResponse> {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                throw new ApiError(400, 'El email ya est� registrado');
            }

            const hashedPassword = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    password: hashedPassword,
                    role: data.role,
                    organizationId: data.organizationId
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    organizationId: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            const userData: UserData = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as UserRole,
                organizationId: user.organizationId ?? undefined,
                status: 'ACTIVE',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            const payload: TokenPayload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as UserRole,
                organizationId: user.organizationId ?? undefined
            };

            const token = jwt.sign(payload, this.JWT_SECRET, {
                expiresIn: this.JWT_EXPIRES_IN
            } as SignOptions);

            await this.auditService.logActivity(
                user.id,
                'REGISTER',
                `Usuario ${user.email} se ha registrado`
            );

            return {
                success: true,
                data: {
                    user: userData,
                    token
                }
            };
        } catch (error) {
            logger.error('Error during registration', { error, email: data.email });
            throw error;
        }
    }

    async forgotPassword(email: string): Promise<void> {
        try {
            // Verificar si el usuario existe
            const result = await prisma.$queryRaw<{ id: string }[]>`
                SELECT id FROM users WHERE email = ${email}
            `;
            const users = Array.isArray(result) ? result : [];
            if (users.length === 0) {
                // No revelar si el email existe
                return;
            }
            const user = users[0];
            // Generar token de reset
            const resetToken = this.generateResetToken();
            await this.saveResetToken(user.id, resetToken);
            // Enviar email
            await this.notificationService.sendPasswordResetEmail(email, resetToken);
        } catch (error) {
            logger.error('Error during forgot password', { error, email });
            throw error;
        }
    }

    async getCurrentUser(userId: string): Promise<UserData> {
        try {
            const result = await prisma.$queryRaw<User[]>`
                SELECT * FROM users WHERE id = ${userId}::uuid
            `;
            const users = Array.isArray(result) ? result : [];
            if (users.length === 0) {
                throw ApiError.notFound('User not found');
            }
            return this.sanitizeUser(users[0]) as UserData;
        } catch (error) {
            logger.error('Error getting current user', { error, userId });
            throw error;
        }
    }

    async updateUser(userId: string, userData: Partial<UserData>): Promise<UserData> {
        try {
            const allowedFields = ['firstName', 'lastName', 'preferences'];
            const updates: string[] = [];
            const values: any[] = [];

            for (const [key, value] of Object.entries(userData)) {
                if (allowedFields.includes(key)) {
                    updates.push(`${this.toSnakeCase(key)} = ?`);
                    values.push(typeof value === 'object' ? JSON.stringify(value) : value);
                }
            }

            if (updates.length === 0) {
                throw ApiError.badRequest('No valid fields to update');
            }

            values.push(userId);

            await prisma.$executeRaw`
                UPDATE users SET ${updates.join(', ')} WHERE id = ${values[values.length - 1]}::uuid
            `;

            return await this.getCurrentUser(userId);
        } catch (error) {
            logger.error('Error updating user', { error, userId, userData });
            throw error;
        }
    }

    async updatePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        try {
            // Verificar contrase�a actual
            const result = await prisma.$queryRaw<{ password: string }[]>`
                SELECT password FROM users WHERE id = ${userId}::uuid
            `;
            const users = Array.isArray(result) ? result : [];
            if (users.length === 0) {
                throw ApiError.notFound('User not found');
            }
            const isValid = await bcrypt.compare(currentPassword, users[0].password);
            if (!isValid) {
                throw ApiError.badRequest('Current password is incorrect');
            }
            // Actualizar contrase�a
            const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
            await prisma.$executeRaw`
                UPDATE users SET password = ${hashedPassword} WHERE id = ${userId}::uuid
            `;
        } catch (error) {
            logger.error('Error updating password', { error, userId });
            throw error;
        }
    }

    async getUserSessions(userId: string): Promise<any[]> {
        try {
            const result = await prisma.$queryRaw<any[]>`
                SELECT 
                    id,
                    device_info,
                    ip_address,
                    last_activity,
                    created_at
                FROM user_sessions
                WHERE user_id = ${userId}
                ORDER BY last_activity DESC
            `;
            return Array.isArray(result) ? result : [];
        } catch (error) {
            logger.error('Error getting user sessions', { error, userId });
            throw error;
        }
    }

    async revokeSession(userId: string, sessionId: string): Promise<void> {
        try {
            await prisma.$executeRaw`
                DELETE FROM user_sessions WHERE id = ${sessionId}::uuid AND user_id = ${userId}::uuid
            `;
        } catch (error) {
            logger.error('Error revoking session', { error, userId, sessionId });
            throw error;
        }
    }

    async revokeAllSessions(userId: string): Promise<void> {
        try {
            await prisma.$executeRaw`
                DELETE FROM user_sessions WHERE user_id = ${userId}
            `;
        } catch (error) {
            logger.error('Error revoking all sessions', { error, userId });
            throw error;
        }
    }

    private generateAccessToken(user: User): string {
        const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            organizationId: user.organizationId ?? undefined
        };
        return jwt.sign(
            payload,
            this.JWT_SECRET as string,
            {
                expiresIn: this.JWT_EXPIRES_IN
            } as SignOptions
        );
    }

    private generateRefreshToken(user: User): string {
        return crypto.randomBytes(40).toString('hex');
    }

    private generateVerificationToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private generateResetToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private async saveRefreshToken(userId: string, token: string): Promise<void> {
        await prisma.$executeRaw`
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES (${userId}, ${token}, DATE_ADD(NOW(), INTERVAL 7 DAY))
        `;
    }

    private async saveVerificationToken(userId: string, token: string): Promise<void> {
        await prisma.$executeRaw`
            INSERT INTO email_verification_tokens (user_id, token, expires_at)
            VALUES (${userId}, ${token}, NOW() + INTERVAL '24 hours')
        `;
    }

    private async saveResetToken(userId: string, token: string): Promise<void> {
        // Implementa el guardado del token de reset en la tabla adecuada
        // Ejemplo: await prisma.passwordResetToken.create({ data: { userId, token, expiresAt } });
    }

    private async sendVerificationEmail(email: string, token: string): Promise<void> {
        try {
            await this.notificationService.sendVerificationEmail(email, token);
        } catch (error) {
            logger.error('Error enviando email de verificaci�n', { error, email });
            throw new ApiError(500, 'Error enviando email de verificaci�n');
        }
    }

    private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        try {
            await this.notificationService.sendPasswordResetEmail(email, token);
        } catch (error) {
            logger.error('Error enviando email de reset de contrase�a', { error, email });
            throw new ApiError(500, 'Error enviando email de reset de contrase�a');
        }
    }

    private sanitizeUser(user: User): UserWithoutPassword {
        const { password, ...userWithoutPassword } = user;
        const sanitizedUser: UserWithoutPassword = {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            name: userWithoutPassword.name,
            role: userWithoutPassword.role,
            organizationId: userWithoutPassword.organizationId || null,
            status: userWithoutPassword.status,
            createdAt: userWithoutPassword.createdAt,
            updatedAt: userWithoutPassword.updatedAt
        };
        return sanitizedUser;
    }

    private toSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    }
}
