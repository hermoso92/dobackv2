import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface SessionConfig {
    timeout?: number; // Tiempo de inactividad en milisegundos
    maxSessions?: number; // Máximo número de sesiones por usuario
    cleanupInterval?: number; // Intervalo de limpieza en milisegundos
}

interface SessionData {
    id: string;
    userId: number;
    organizationId: number;
    lastActivity: Date;
    data: any;
}

// Almacenamiento de sesiones
const sessions = new Map<string, SessionData>();

// Configuración por defecto
const defaultConfig: SessionConfig = {
    timeout: 30 * 60 * 1000, // 30 minutos
    maxSessions: 5,
    cleanupInterval: 5 * 60 * 1000 // 5 minutos
};

// Limpiar sesiones inactivas
const cleanupSessions = (timeout: number) => {
    const now = new Date();
    sessions.forEach((session, id) => {
        const inactiveTime = now.getTime() - session.lastActivity.getTime();
        if (inactiveTime > timeout) {
            sessions.delete(id);
            logger.info('Sesión eliminada por inactividad', { sessionId: id });
        }
    });
};

// Middleware de sesión
export const sessionMiddleware = (config: SessionConfig = defaultConfig) => {
    const timeout = config.timeout || defaultConfig.timeout!;
    const maxSessions = config.maxSessions || defaultConfig.maxSessions!;
    const cleanupInterval = config.cleanupInterval || defaultConfig.cleanupInterval!;

    // Configurar limpieza periódica
    setInterval(() => cleanupSessions(timeout), cleanupInterval);

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const sessionId = req.headers['session-id'] as string;
            const userId = (req as any).user?.id;
            const organizationId = (req as any).user?.organizationId;

            if (!userId || !organizationId) {
                return next(new AppError(401, 'Usuario no autenticado'));
            }

            if (sessionId && sessions.has(sessionId)) {
                // Actualizar sesión existente
                const session = sessions.get(sessionId)!;
                session.lastActivity = new Date();
                (req as any).session = session;
            } else {
                // Verificar límite de sesiones
                const userSessions = Array.from(sessions.values()).filter(
                    (s) => s.userId === userId
                );

                if (userSessions.length >= maxSessions) {
                    // Eliminar la sesión más antigua
                    const oldestSession = userSessions.sort(
                        (a, b) => a.lastActivity.getTime() - b.lastActivity.getTime()
                    )[0];
                    sessions.delete(oldestSession.id);
                    logger.info('Sesión antigua eliminada por límite', {
                        sessionId: oldestSession.id
                    });
                }

                // Crear nueva sesión
                const newSessionId = `${userId}-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                const newSession: SessionData = {
                    id: newSessionId,
                    userId,
                    organizationId,
                    lastActivity: new Date(),
                    data: {}
                };

                sessions.set(newSessionId, newSession);
                (req as any).session = newSession;

                // Establecer header de sesión
                res.setHeader('Session-Id', newSessionId);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware para datos de sesión
export const sessionDataMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session) {
        return next(new AppError(401, 'Sesión no encontrada'));
    }

    // Métodos para manejar datos de sesión
    (req as any).sessionData = {
        get: (key: string) => session.data[key],
        set: (key: string, value: any) => {
            session.data[key] = value;
            session.lastActivity = new Date();
        },
        delete: (key: string) => {
            delete session.data[key];
            session.lastActivity = new Date();
        },
        clear: () => {
            session.data = {};
            session.lastActivity = new Date();
        }
    };

    next();
};

// Middleware para verificar sesión activa
export const requireActiveSession = (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session) {
        return next(new AppError(401, 'Sesión no encontrada'));
    }

    const inactiveTime = Date.now() - session.lastActivity.getTime();
    if (inactiveTime > defaultConfig.timeout!) {
        sessions.delete(session.id);
        return next(new AppError(401, 'Sesión expirada'));
    }

    next();
};

// Obtener todas las sesiones activas
export const getActiveSessions = (userId?: number) => {
    const activeSessions = Array.from(sessions.values());
    return userId ? activeSessions.filter((s) => s.userId === userId) : activeSessions;
};

// Eliminar sesión
export const deleteSession = (sessionId: string) => {
    const deleted = sessions.delete(sessionId);
    if (deleted) {
        logger.info('Sesión eliminada manualmente', { sessionId });
    }
    return deleted;
};

// Eliminar todas las sesiones de un usuario
export const deleteUserSessions = (userId: number) => {
    let count = 0;
    sessions.forEach((session, id) => {
        if (session.userId === userId) {
            sessions.delete(id);
            count++;
        }
    });
    if (count > 0) {
        logger.info('Sesiones de usuario eliminadas', { userId, count });
    }
    return count;
};
