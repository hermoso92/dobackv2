import { logger } from '../utils/logger';

/**
 * Utilidades para formateo de fechas con zona horaria
 */

/**
 * Formatea una fecha con la zona horaria del usuario
 * @param date - Fecha a formatear
 * @param timezone - Zona horaria (opcional, usa la del sistema por defecto)
 * @returns Fecha formateada como string
 */
export const formatDateTZ = (date: string | Date, timezone?: string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
    }

    try {
        return dateObj.toLocaleString('es-ES', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        logger.error('Error formateando fecha:', error);
        return dateObj.toLocaleString('es-ES');
    }
};

/**
 * Formatea una fecha solo con la fecha (sin hora)
 * @param date - Fecha a formatear
 * @param timezone - Zona horaria (opcional)
 * @returns Fecha formateada como string
 */
export const formatDateOnly = (date: string | Date, timezone?: string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
    }

    try {
        return dateObj.toLocaleDateString('es-ES', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        logger.error('Error formateando fecha:', error);
        return dateObj.toLocaleDateString('es-ES');
    }
};

/**
 * Formatea una fecha solo con la hora (sin fecha)
 * @param date - Fecha a formatear
 * @param timezone - Zona horaria (opcional)
 * @returns Hora formateada como string
 */
export const formatTimeOnly = (date: string | Date, timezone?: string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Hora inválida';
    }

    try {
        return dateObj.toLocaleTimeString('es-ES', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        logger.error('Error formateando hora:', error);
        return dateObj.toLocaleTimeString('es-ES');
    }
};

/**
 * Obtiene la diferencia de tiempo entre dos fechas
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @returns Objeto con la diferencia en diferentes unidades
 */
export const getTimeDifference = (startDate: string | Date, endDate: string | Date) => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const diffMs = end.getTime() - start.getTime();

    return {
        milliseconds: diffMs,
        seconds: Math.floor(diffMs / 1000),
        minutes: Math.floor(diffMs / (1000 * 60)),
        hours: Math.floor(diffMs / (1000 * 60 * 60)),
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24))
    };
};

/**
 * Verifica si una fecha está dentro de un rango
 * @param date - Fecha a verificar
 * @param startDate - Fecha de inicio del rango
 * @param endDate - Fecha de fin del rango
 * @returns true si la fecha está dentro del rango
 */
export const isDateInRange = (
    date: string | Date,
    startDate: string | Date,
    endDate: string | Date
): boolean => {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    return checkDate >= start && checkDate <= end;
};

/**
 * Obtiene la fecha actual en formato ISO
 * @returns Fecha actual como string ISO
 */
export const getCurrentISODate = (): string => {
    return new Date().toISOString();
};

/**
 * Obtiene la fecha de hace N días
 * @param days - Número de días hacia atrás
 * @returns Fecha como string ISO
 */
export const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};
