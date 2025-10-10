import { config } from '../config/env';
import { ValidationError } from './errors';

// Validaciones de email
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateEmail = (email: string): void => {
    if (!isValidEmail(email)) {
        throw new ValidationError('Email inválido');
    }
};

// Validaciones de contraseña
export const isValidPassword = (password: string): boolean => {
    const minLength = config.security.passwordMinLength;
    const maxLength = config.security.passwordMaxLength;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
        password.length >= minLength &&
        password.length <= maxLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar
    );
};

export const validatePassword = (password: string): void => {
    if (!isValidPassword(password)) {
        throw new ValidationError(
            `La contraseña debe tener entre ${config.security.passwordMinLength} y ${config.security.passwordMaxLength} caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales`
        );
    }
};

// Validaciones de nombre
export const isValidName = (name: string): boolean => {
    const minLength = 2;
    const maxLength = 50;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;

    return name.length >= minLength && name.length <= maxLength && nameRegex.test(name);
};

export const validateName = (name: string): void => {
    if (!isValidName(name)) {
        throw new ValidationError(
            'El nombre debe tener entre 2 y 50 caracteres y solo puede contener letras, espacios, guiones y apóstrofes'
        );
    }
};

// Validaciones de placa de vehículo
export const isValidPlateNumber = (plate: string): boolean => {
    const plateRegex = /^[A-Z]{3}-\d{3}$/;
    return plateRegex.test(plate);
};

export const validatePlateNumber = (plate: string): void => {
    if (!isValidPlateNumber(plate)) {
        throw new ValidationError(
            'La placa debe tener el formato XXX-000 (tres letras mayúsculas, guión, tres números)'
        );
    }
};

// Validaciones de modelo de vehículo
export const isValidModel = (model: string): boolean => {
    const minLength = 2;
    const maxLength = 50;
    const modelRegex = /^[a-zA-Z0-9\s-]+$/;

    return model.length >= minLength && model.length <= maxLength && modelRegex.test(model);
};

export const validateModel = (model: string): void => {
    if (!isValidModel(model)) {
        throw new ValidationError(
            'El modelo debe tener entre 2 y 50 caracteres y solo puede contener letras, números, espacios y guiones'
        );
    }
};

// Validaciones de ID
export const isValidId = (id: string | number): boolean => {
    if (typeof id === 'string') {
        return /^\d+$/.test(id);
    }
    return Number.isInteger(id) && id > 0;
};

export const validateId = (id: string | number): void => {
    if (!isValidId(id)) {
        throw new ValidationError('ID inválido');
    }
};

// Validaciones de fecha
export const isValidDate = (date: string | Date): boolean => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateDate = (date: string | Date): void => {
    if (!isValidDate(date)) {
        throw new ValidationError('Fecha inválida');
    }
};

// Validaciones de coordenadas
export const isValidLatitude = (lat: number): boolean => {
    return lat >= -90 && lat <= 90;
};

export const isValidLongitude = (lng: number): boolean => {
    return lng >= -180 && lng <= 180;
};

export const validateCoordinates = (lat: number, lng: number): void => {
    if (!isValidLatitude(lat)) {
        throw new ValidationError('Latitud inválida');
    }
    if (!isValidLongitude(lng)) {
        throw new ValidationError('Longitud inválida');
    }
};

// Validaciones de telemetría
export const isValidTelemetryData = (data: any): boolean => {
    return (
        typeof data === 'object' &&
        data !== null &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        typeof data.speed === 'number' &&
        typeof data.acceleration === 'number' &&
        typeof data.temperature === 'number' &&
        typeof data.batteryLevel === 'number' &&
        isValidLatitude(data.latitude) &&
        isValidLongitude(data.longitude) &&
        data.speed >= 0 &&
        data.acceleration >= -10 &&
        data.acceleration <= 10 &&
        data.temperature >= -50 &&
        data.temperature <= 100 &&
        data.batteryLevel >= 0 &&
        data.batteryLevel <= 100
    );
};

export const validateTelemetryData = (data: any): void => {
    if (!isValidTelemetryData(data)) {
        throw new ValidationError('Datos de telemetría inválidos');
    }
};

// Validaciones de reglas
export const isValidRule = (rule: any): boolean => {
    return (
        typeof rule === 'object' &&
        rule !== null &&
        typeof rule.name === 'string' &&
        typeof rule.description === 'string' &&
        typeof rule.metric === 'string' &&
        typeof rule.threshold === 'number' &&
        typeof rule.condition === 'string' &&
        typeof rule.action === 'string' &&
        rule.name.length >= 2 &&
        rule.name.length <= 50 &&
        rule.description.length >= 2 &&
        rule.description.length <= 200 &&
        ['ltr', 'speed', 'acceleration', 'temperature', 'batteryLevel'].includes(rule.metric) &&
        ['>', '<', '>=', '<=', '==', '!='].includes(rule.condition) &&
        rule.action.length >= 2 &&
        rule.action.length <= 100
    );
};

export const validateRule = (rule: any): void => {
    if (!isValidRule(rule)) {
        throw new ValidationError('Regla inválida');
    }
};

// Validaciones de organización
export const isValidOrganization = (org: any): boolean => {
    return (
        typeof org === 'object' &&
        org !== null &&
        typeof org.name === 'string' &&
        typeof org.description === 'string' &&
        org.name.length >= 2 &&
        org.name.length <= 100 &&
        org.description.length >= 2 &&
        org.description.length <= 500
    );
};

export const validateOrganization = (org: any): void => {
    if (!isValidOrganization(org)) {
        throw new ValidationError('Datos de organización inválidos');
    }
};

// Validaciones de usuario
export const isValidUser = (user: any): boolean => {
    return (
        typeof user === 'object' &&
        user !== null &&
        typeof user.email === 'string' &&
        typeof user.name === 'string' &&
        typeof user.role === 'string' &&
        isValidEmail(user.email) &&
        isValidName(user.name) &&
        ['ADMIN', 'OPERATOR', 'VIEWER'].includes(user.role)
    );
};

export const validateUser = (user: any): void => {
    if (!isValidUser(user)) {
        throw new ValidationError('Datos de usuario inválidos');
    }
};

// Validaciones de vehículo
export const isValidVehicle = (vehicle: any): boolean => {
    return (
        typeof vehicle === 'object' &&
        vehicle !== null &&
        typeof vehicle.name === 'string' &&
        typeof vehicle.model === 'string' &&
        typeof vehicle.plateNumber === 'string' &&
        typeof vehicle.status === 'string' &&
        isValidName(vehicle.name) &&
        isValidModel(vehicle.model) &&
        isValidPlateNumber(vehicle.plateNumber) &&
        ['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(vehicle.status)
    );
};

export const validateVehicle = (vehicle: any): void => {
    if (!isValidVehicle(vehicle)) {
        throw new ValidationError('Datos de vehículo inválidos');
    }
};
