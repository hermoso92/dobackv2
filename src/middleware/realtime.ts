import { logger } from '../utils/logger';

interface RealtimeConfig {
    type: 'stability' | 'telemetry' | 'event' | 'all';
    vehicleId?: string;
    organizationId?: string;
}

// Middleware para manejar conexiones WebSocket (dummy, solo logging)
export const realtimeMiddleware = (ws: any, req: Request) => {
    try {
        const config: RealtimeConfig = {
            type: req.query.type as 'stability' | 'telemetry' | 'event' | 'all',
            vehicleId: req.query.vehicleId as string,
            organizationId: req.query.organizationId as string
        };
        logger.info('Conexión WebSocket recibida', { config });
        // Simulación: no almacena conexiones reales
    } catch (error) {
        logger.error('Error en WebSocket', { error });
    }
}; 