import { logger } from '../utils/logger';

interface AlertConfig {
    vehicleId?: string;
    organizationId?: string;
    type: 'stability' | 'maintenance' | 'system';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    threshold?: number;
}

// Middleware para procesar alertas (dummy, solo logging)
export const alertProcessorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: AlertConfig = req.body;
        logger.info('Procesando alerta', { config });
        // Simulación: no accede a reglas ni crea eventos reales
        (req as any).alerts = [];
        next();
    } catch (error) {
        next(error);
    }
}; 