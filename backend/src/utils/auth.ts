import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import {
    EmailVerificationTokenPayload,
    PasswordResetTokenPayload,
    RefreshTokenPayload,
    TokenPayload,
    UserRole
} from '../types/auth';
import { AuthenticationError } from './errors';
import { logger } from './logger';

// Función para generar un token JWT
export const generateToken = (payload: TokenPayload): string => {
    try {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });
    } catch (error) {
        logger.error('Error al generar token:', error);
        throw new AuthenticationError('Error al generar token');
    }
};

// Función para verificar un token JWT
export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
        logger.error('Error al verificar token:', error);
        throw new AuthenticationError('Token inválido o expirado');
    }
};

// Función para hashear una contraseña
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
        return bcrypt.hash(password, salt);
    } catch (error) {
        logger.error('Error al hashear contraseña:', error);
        throw new AuthenticationError('Error al procesar la contraseña');
    }
};

// Función para comparar una contraseña con su hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return bcrypt.compare(password, hash);
    } catch (error) {
        logger.error('Error al comparar contraseñas:', error);
        throw new AuthenticationError('Error al verificar la contraseña');
    }
};

// Función para extraer el token del header de autorización
export const extractTokenFromHeader = (authHeader: string): string => {
    if (!authHeader) {
        throw new AuthenticationError('No se proporcionó token de autenticación');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
        throw new AuthenticationError('Formato de token inválido');
    }

    return token;
};

// Función para verificar si un usuario tiene un rol específico
export const hasRole = (userRoles: UserRole[], requiredRoles: UserRole[]): boolean => {
    return userRoles.some((role) => requiredRoles.includes(role));
};

// Función para verificar si un usuario tiene acceso a un recurso
export const hasAccess = (
    userRoles: UserRole[],
    resourceOwnerId: number,
    userId: number
): boolean => {
    // Los administradores tienen acceso a todo
    if (hasRole(userRoles, ['ADMIN'])) {
        return true;
    }

    // Los operadores tienen acceso a sus propios recursos
    if (hasRole(userRoles, ['OPERATOR'])) {
        return resourceOwnerId === userId;
    }

    // Los visualizadores solo pueden ver
    return hasRole(userRoles, ['VIEWER']);
};

// Función para generar un token de refresco
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
    try {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: '7d' // Los tokens de refresco duran 7 días
        });
    } catch (error) {
        logger.error('Error al generar token de refresco:', error);
        throw new AuthenticationError('Error al generar token de refresco');
    }
};

// Función para verificar un token de refresco
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    try {
        return jwt.verify(token, config.jwt.secret) as RefreshTokenPayload;
    } catch (error) {
        logger.error('Error al verificar token de refresco:', error);
        throw new AuthenticationError('Token de refresco inválido o expirado');
    }
};

// Función para generar un token de restablecimiento de contraseña
export const generatePasswordResetToken = (payload: PasswordResetTokenPayload): string => {
    try {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: '1h' // Los tokens de restablecimiento duran 1 hora
        });
    } catch (error) {
        logger.error('Error al generar token de restablecimiento:', error);
        throw new AuthenticationError('Error al generar token de restablecimiento');
    }
};

// Función para verificar un token de restablecimiento de contraseña
export const verifyPasswordResetToken = (token: string): PasswordResetTokenPayload => {
    try {
        return jwt.verify(token, config.jwt.secret) as PasswordResetTokenPayload;
    } catch (error) {
        logger.error('Error al verificar token de restablecimiento:', error);
        throw new AuthenticationError('Token de restablecimiento inválido o expirado');
    }
};

// Función para generar un token de verificación de email
export const generateEmailVerificationToken = (payload: EmailVerificationTokenPayload): string => {
    try {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: '24h' // Los tokens de verificación duran 24 horas
        });
    } catch (error) {
        logger.error('Error al generar token de verificación:', error);
        throw new AuthenticationError('Error al generar token de verificación');
    }
};

// Función para verificar un token de verificación de email
export const verifyEmailVerificationToken = (token: string): EmailVerificationTokenPayload => {
    try {
        return jwt.verify(token, config.jwt.secret) as EmailVerificationTokenPayload;
    } catch (error) {
        logger.error('Error al verificar token de verificación:', error);
        throw new AuthenticationError('Token de verificación inválido o expirado');
    }
};
