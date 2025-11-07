
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma, withPrismaReconnect } from '../lib/prisma'; // ✅ SINGLETON DE PRISMA + WRAPPER
import { TokenPayload, UserRole } from '../types/auth';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { AppError } from './error';



interface AuthConfig {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    saltRounds: number;
}

interface DecodedToken extends JwtPayload {
    userId: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                organizationId: string;
            };
            organization?: {
                id: string;
                name: string;
            };
        }
    }
}

// Configuración por defecto
const defaultConfig: AuthConfig = {
    secret: config.jwt.secret,
    expiresIn: config.jwt.expiresIn,
    refreshExpiresIn: config.jwt.refreshExpiresIn,
    saltRounds: 10
};

// Generar token JWT
const generateToken = (payload: TokenPayload, expiresIn: string = defaultConfig.expiresIn): string => {
    const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    return jwt.sign(payload, defaultConfig.secret, options);
};

// Verificar token JWT
const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, defaultConfig.secret) as TokenPayload;
    } catch (error) {
        throw new ApiError(401, 'Token inválido');
    }
};

// Middleware de autenticación
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Permitir solicitudes OPTIONS sin autenticación (CORS preflight)
        if (req.method === 'OPTIONS') {
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('Token de autorización no proporcionado o formato incorrecto');
            return res.status(401).json({ error: 'Token de autorización requerido' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            logger.warn('Token vacío en header de autorización');
            return res.status(401).json({ error: 'Token vacío' });
        }

        // Verificar el token JWT
        const decoded = verifyToken(token) as TokenPayload;

        // Buscar el usuario en la base de datos para validar que existe y está activo
        // ✅ WRAPPED con withPrismaReconnect para manejar desconexiones
        const user = await withPrismaReconnect(() => prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                Organization: true
            }
        }));

        if (!user) {
            logger.warn('Usuario no encontrado', { userId: decoded.id });
            return res.status(401).json({ error: 'Usuario no válido' });
        }

        if (user.status !== 'ACTIVE') {
            logger.warn('Usuario inactivo', { userId: decoded.id, status: user.status });
            return res.status(401).json({ error: 'Usuario inactivo' });
        }

        // Establecer la información del usuario en el request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || decoded.organizationId
        };

        logger.info('Usuario autenticado correctamente', {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: req.user.organizationId
        });

        if (user.Organization) {
            req.organization = {
                id: user.Organization.id,
                name: user.Organization.name
            };
        }

        logger.info('Usuario autenticado correctamente', {
            userId: user.id,
            email: user.email,
            organizationId: req.user.organizationId
        });

        next();
    } catch (error) {
        if (error instanceof Error && error.message === 'Token inválido o expirado') {
            logger.warn('Token JWT inválido o expirado');
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        logger.error('Error en autenticación', { error });
        res.status(401).json({ error: 'Error de autenticación' });
    }
};

// Middleware de autorización
export const authorize = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new AppError('Usuario no autenticado', 401);
        }

        const hasRole = roles.includes(req.user.role);
        if (!hasRole) {
            throw new AppError('No tiene permisos para realizar esta acción', 403);
        }

        next();
    };
};

// Middleware de autenticación básica
export const basicAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            throw new AppError('Autenticación básica requerida', 401);
        }

        const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
            .toString()
            .split(':');

        // ✅ WRAPPED con withPrismaReconnect para manejar desconexiones
        const user = await withPrismaReconnect(() => prisma.user.findUnique({
            where: { email }
        }));

        if (!user || !await bcrypt.compare(password, user.password)) {
            throw new AppError('Credenciales inválidas', 401);
        }

        (req as any).user = {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            organizationId: user.organizationId !== null && user.organizationId !== undefined ? String(user.organizationId) : ''
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware de autenticación API Key
export const apiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            throw new AppError('API Key requerida', 401);
        }

        const organization = await prisma.organization.findFirst({
            where: { apiKey: apiKey as string }
        });

        if (!organization) {
            throw new AppError('API Key inválida', 401);
        }

        (req as any).organization = organization;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware de autenticación OAuth
export const oauthMiddleware = (provider: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                throw new AppError('Token OAuth requerido', 401);
            }

            // Aquí iría la validación con el proveedor OAuth
            // Por ahora solo verificamos que exista el token

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Funciones de utilidad
export const hashPassword = async (password: string, saltRounds: number = defaultConfig.saltRounds!) => {
    return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
};

export const generateAuthTokens = (user: TokenPayload) => {
    return {
        accessToken: generateToken(user, defaultConfig.expiresIn),
        refreshToken: generateToken(user, defaultConfig.refreshExpiresIn)
    };
};

export const checkOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { organizacionId } = req.params;

        if (req.user.role === 'ADMIN') {
            return next();
        }

        if (req.user.organizationId !== organizacionId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    } catch (error) {
        logger.error('Organization check error', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware para verificar JWT y añadir usuario a req.user
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    // Permitir solicitudes OPTIONS sin autenticación (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        (req as any).user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Middleware para extraer organizationId del usuario autenticado
export function extractOrganizationId(req: Request, res: Response, next: NextFunction) {
    // Permitir solicitudes OPTIONS sin autenticación (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const user = (req as any).user;

    // Para usuarios ADMIN sin organización, permitir acceso
    if (!user || (!user.organizationId && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Organización no encontrada en el token' });
    }

    (req as any).organizationId = user.organizationId;
    next();
}

// Middleware para permitir solo a ADMIN
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Permiso denegado: solo ADMIN' });
    }
    next();
} 