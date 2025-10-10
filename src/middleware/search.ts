import { logger } from '../utils/logger';

interface SearchConfig {
    query: string;
    type: 'vehicle' | 'event' | 'session' | 'all';
    organizationId?: string;
    limit?: number;
    offset?: number;
}

// Middleware de búsqueda (dummy, solo logging)
export const searchMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: SearchConfig = {
            query: req.query.q as string,
            type: req.query.type as 'vehicle' | 'event' | 'session' | 'all',
            organizationId: req.query.organizationId as string,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };
        logger.info('Búsqueda recibida', { config });
        (req as any).searchResults = [];
        next();
    } catch (error) {
        next(error);
    }
}; 