import { logger } from '../utils/logger';

interface ConfigItem {
    key: string;
    value: string;
    description?: string;
    organizationId?: string;
    vehicleId?: string;
}

// Middleware de configuración (dummy, solo logging)
export const configMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('Configuración recibida', { body: req.body });
        (req as any).config = {};
        next();
    } catch (error) {
        next(error);
    }
}; 