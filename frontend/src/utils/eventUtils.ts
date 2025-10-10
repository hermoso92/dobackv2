import { EventSeverity } from '../types/events';
import { logger } from '../utils/logger';
/**
 * Mapea la severidad del backend al frontend
 * @param backendSeverity Severidad recibida del backend
 * @returns Severidad mapeada al enum del frontend
 */
export function mapBackendSeverity(severity: string): EventSeverity {
    logger.debug('Mapeando severidad del backend:', { severity });
    switch (severity.toUpperCase()) {
        case 'INFO':
            return EventSeverity.INFO;
        case 'WARNING':
            return EventSeverity.WARNING;
        case 'CRITICAL':
            return EventSeverity.CRITICAL;
        default:
            logger.warn('Severidad no reconocida, usando WARNING por defecto', { severity });
            return EventSeverity.WARNING;
    }
}

/**
 * Mapea la severidad del frontend al backend
 * @param frontendSeverity Severidad del frontend
 * @returns Severidad mapeada al formato del backend
 */
export const mapFrontendSeverity = (frontendSeverity: EventSeverity): string => {
    logger.debug('Mapeando severidad al backend:', { frontendSeverity });
    switch (frontendSeverity) {
        case EventSeverity.INFO:
            return 'INFO';
        case EventSeverity.WARNING:
            return 'WARNING';
        case EventSeverity.CRITICAL:
            return 'CRITICAL';
        default:
            logger.warn('Severidad no reconocida, usando WARNING por defecto', { frontendSeverity });
            return 'WARNING';
    }
}; 