import { logger } from '../utils/logger';

interface User {
    id: string;
    role: string;
    organizationId: string;
}

// Middleware de permisos
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as User;
        if (!user || !roles.includes(user.role)) {
            logger.warn('Permiso denegado', { user, roles });
            return res.status(403).json({ error: 'Permiso denegado' });
        }
        next();
    };
}; 