export class DataValidationService {
    validateStabilityData(data: any): any {
        const errors: any[] = [];
        // Validar campos básicos presentes
        if (isNaN(data.roll)) {
            errors.push({ field: 'roll', message: 'Valor inválido', code: 'INVALID_VALUE' });
        }
        if (isNaN(data.pitch)) {
            errors.push({ field: 'pitch', message: 'Valor inválido', code: 'INVALID_VALUE' });
        }
        if (isNaN(data.yaw)) {
            errors.push({ field: 'yaw', message: 'Valor inválido', code: 'INVALID_VALUE' });
        }
        if (isNaN(data.lateralAcc)) {
            errors.push({ field: 'lateralAcc', message: 'Valor inválido', code: 'INVALID_VALUE' });
        }
        if (isNaN(data.verticalAcc)) {
            errors.push({ field: 'verticalAcc', message: 'Valor inválido', code: 'INVALID_VALUE' });
        }
        if (isNaN(data.longitudinalAcc)) {
            errors.push({
                field: 'longitudinalAcc',
                message: 'Valor inválido',
                code: 'INVALID_VALUE'
            });
        }
        return { isValid: errors.length === 0, errors };
    }
}
