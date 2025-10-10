import { logger } from './logger';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['.txt', '.csv'];

export const validateFile = (file: File): void => {
    logger.info('Validando archivo', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validar tipo
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }
};

export const validateVehicleId = (vehicleId: string): void => {
    logger.info('Validando ID de vehículo', { vehicleId });

    if (!vehicleId) {
        throw new Error('El ID del vehículo es requerido');
    }

    // Validar formato (ejemplo: DOBACK001)
    const vehicleIdRegex = /^[A-Z]{2,}\d{3}$/;
    if (!vehicleIdRegex.test(vehicleId)) {
        throw new Error('El ID del vehículo debe tener el formato correcto (ejemplo: DOBACK001)');
    }
}; 