import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from './logger';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
    organizationId: string;
}

export const generateToken = (user: TokenPayload, isRefreshToken = false): string => {
    try {
        const secret = isRefreshToken ? config.jwt.refreshSecret : config.jwt.secret;
        const expiresIn = isRefreshToken ? config.jwt.refreshExpiresIn : config.jwt.expiresIn;

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId
        };

        return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
    } catch (error) {
        logger.error('Error al generar token', { error });
        throw new Error('Error al generar token');
    }
};

export const verifyToken = (token: string, isRefreshToken = false): TokenPayload => {
    try {
        const secret = isRefreshToken ? config.jwt.refreshSecret : config.jwt.secret;
        return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
        logger.error('Error al verificar token', { error });
        throw new Error('Token inválido o expirado');
    }
};
