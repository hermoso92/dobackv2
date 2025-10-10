import { NextFunction, Request, Response } from 'express';

/**
 * Middleware para validar los datos de una sesión
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { vehicleId, startTime, endTime, status, description } = req.body;

        // Validar vehicleId
        if (!vehicleId || typeof vehicleId !== 'number') {
            return res
                .status(400)
                .json({ message: 'El ID del vehículo es requerido y debe ser un número' });
        }

        // Validar startTime
        if (startTime && !isValidDate(startTime)) {
            return res
                .status(400)
                .json({ message: 'La fecha de inicio debe ser una fecha válida' });
        }

        // Validar endTime si está presente
        if (endTime && !isValidDate(endTime)) {
            return res.status(400).json({ message: 'La fecha de fin debe ser una fecha válida' });
        }

        // Validar que endTime sea posterior a startTime si ambos están presentes
        if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
            return res
                .status(400)
                .json({ message: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }

        // Validar status si está presente
        if (status && !['pending', 'active', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                message: 'El estado debe ser: pending, active, completed o cancelled',
                valid_statuses: ['pending', 'active', 'completed', 'cancelled']
            });
        }

        // Validar description si está presente
        if (description && (typeof description !== 'string' || description.length > 500)) {
            return res
                .status(400)
                .json({ message: 'La descripción debe ser un texto de máximo 500 caracteres' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error de validación en los datos de la sesión' });
    }
};

/**
 * Verifica si una cadena es una fecha válida
 * @param dateString Cadena de fecha a validar
 * @returns boolean
 */
const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};
