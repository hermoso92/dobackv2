import { logger } from '../utils/logger';

interface ReportConfig {
    startDate: Date;
    endDate: Date;
    vehicleId?: string;
    organizationId?: string;
    type: 'stability' | 'maintenance' | 'activity';
}

// Middleware para generar reportes (dummy, solo logging)
export const reportGeneratorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: ReportConfig = {
            startDate: new Date(req.query.startDate as string),
            endDate: new Date(req.query.endDate as string),
            vehicleId: req.query.vehicleId as string,
            organizationId: req.query.organizationId as string,
            type: req.query.type as 'stability' | 'maintenance' | 'activity'
        };
        logger.info('Generando reporte', { config });
        (req as any).report = {};
        next();
    } catch (error) {
        next(error);
    }
}; 