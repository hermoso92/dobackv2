import { UserRole } from '../types/enums';

interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export class ValidationService {
    constructor() {}

    public validateTelemetryData(data: any): ValidationResult {
        const errors: ValidationError[] = [];

        // Validar timestamp
        if (!this.isValidDate(data.timestamp)) {
            errors.push({
                field: 'timestamp',
                message: 'Invalid timestamp',
                value: data.timestamp
            });
        }

        // Validar vehicleId
        if (!data.vehicleId || typeof data.vehicleId !== 'string') {
            errors.push({
                field: 'vehicleId',
                message: 'Vehicle ID is required and must be a string',
                value: data.vehicleId
            });
        }

        // Validar velocidad
        if (typeof data.speed !== 'number' || data.speed < 0) {
            errors.push({
                field: 'speed',
                message: 'Speed must be a non-negative number',
                value: data.speed
            });
        }

        // Validar RPM del motor
        if (typeof data.engineRpm !== 'number' || data.engineRpm < 0) {
            errors.push({
                field: 'engineRpm',
                message: 'Engine RPM must be a non-negative number',
                value: data.engineRpm
            });
        }

        // Validar nivel de combustible
        if (typeof data.fuelLevel !== 'number' || data.fuelLevel < 0 || data.fuelLevel > 100) {
            errors.push({
                field: 'fuelLevel',
                message: 'Fuel level must be between 0 and 100',
                value: data.fuelLevel
            });
        }

        // Validar temperatura
        if (typeof data.temperature !== 'number') {
            errors.push({
                field: 'temperature',
                message: 'Temperature must be a number',
                value: data.temperature
            });
        }

        // Validar ubicación
        if (data.location) {
            if (!this.isValidLatitude(data.location.latitude)) {
                errors.push({
                    field: 'location.latitude',
                    message: 'Invalid latitude',
                    value: data.location.latitude
                });
            }
            if (!this.isValidLongitude(data.location.longitude)) {
                errors.push({
                    field: 'location.longitude',
                    message: 'Invalid longitude',
                    value: data.location.longitude
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public validateStabilityData(data: any): ValidationResult {
        const errors: ValidationError[] = [];

        // Validar timestamp
        if (!this.isValidTimestamp(data.timestamp)) {
            errors.push({
                field: 'timestamp',
                message: 'Invalid timestamp',
                value: data.timestamp
            });
        }

        // Validar ángulos
        if (!this.isValidAngle(data.roll)) {
            errors.push({
                field: 'roll',
                message: 'Invalid roll angle',
                value: data.roll
            });
        }

        if (!this.isValidAngle(data.pitch)) {
            errors.push({
                field: 'pitch',
                message: 'Invalid pitch angle',
                value: data.pitch
            });
        }

        if (!this.isValidAngle(data.yaw)) {
            errors.push({
                field: 'yaw',
                message: 'Invalid yaw angle',
                value: data.yaw
            });
        }

        // Validar aceleraciones
        if (!this.isValidAcceleration(data.acc_x)) {
            errors.push({
                field: 'acc_x',
                message: 'Invalid X acceleration',
                value: data.acc_x
            });
        }

        if (!this.isValidAcceleration(data.acc_y)) {
            errors.push({
                field: 'acc_y',
                message: 'Invalid Y acceleration',
                value: data.acc_y
            });
        }

        if (!this.isValidAcceleration(data.acc_z)) {
            errors.push({
                field: 'acc_z',
                message: 'Invalid Z acceleration',
                value: data.acc_z
            });
        }

        // Validar cargas
        if (!this.isValidLoad(data.load_fl)) {
            errors.push({
                field: 'load_fl',
                message: 'Invalid front-left load',
                value: data.load_fl
            });
        }

        if (!this.isValidLoad(data.load_fr)) {
            errors.push({
                field: 'load_fr',
                message: 'Invalid front-right load',
                value: data.load_fr
            });
        }

        if (!this.isValidLoad(data.load_rl)) {
            errors.push({
                field: 'load_rl',
                message: 'Invalid rear-left load',
                value: data.load_rl
            });
        }

        if (!this.isValidLoad(data.load_rr)) {
            errors.push({
                field: 'load_rr',
                message: 'Invalid rear-right load',
                value: data.load_rr
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public validateUserData(data: any): ValidationResult {
        const errors: ValidationError[] = [];

        // Validar email
        if (!this.isValidEmail(data.email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email address',
                value: data.email
            });
        }

        // Validar nombre
        if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
            errors.push({
                field: 'name',
                message: 'Name must be at least 2 characters long',
                value: data.name
            });
        }

        // Validar contraseña
        if (!this.isValidPassword(data.password)) {
            errors.push({
                field: 'password',
                message:
                    'Password must be at least 8 characters long and contain at least one number and one special character',
                value: data.password
            });
        }

        // Validar rol
        if (!Object.values(UserRole).includes(data.role)) {
            errors.push({
                field: 'role',
                message: 'Invalid user role',
                value: data.role
            });
        }

        // Validar organizationId
        if (!Number.isInteger(data.organizationId) || data.organizationId <= 0) {
            errors.push({
                field: 'organizationId',
                message: 'Organization ID must be a positive integer',
                value: data.organizationId
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public validateVehicleData(data: any): ValidationResult {
        const errors: ValidationError[] = [];

        // Validar nombre
        if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
            errors.push({
                field: 'name',
                message: 'Name must be at least 2 characters long',
                value: data.name
            });
        }

        // Validar modelo
        if (!data.model || typeof data.model !== 'string') {
            errors.push({
                field: 'model',
                message: 'Model is required and must be a string',
                value: data.model
            });
        }

        // Validar número de placa
        if (!this.isValidPlateNumber(data.plateNumber)) {
            errors.push({
                field: 'plateNumber',
                message: 'Invalid plate number format',
                value: data.plateNumber
            });
        }

        // Validar organizationId
        if (!Number.isInteger(data.organizationId) || data.organizationId <= 0) {
            errors.push({
                field: 'organizationId',
                message: 'Organization ID must be a positive integer',
                value: data.organizationId
            });
        }

        // Validar estado
        if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(data.status)) {
            errors.push({
                field: 'status',
                message: 'Invalid vehicle status',
                value: data.status
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private isValidDate(date: any): boolean {
        if (date instanceof Date) {
            return !isNaN(date.getTime());
        }
        return false;
    }

    private isValidTimestamp(timestamp: any): boolean {
        if (typeof timestamp === 'number') {
            return !isNaN(timestamp) && isFinite(timestamp);
        }
        return false;
    }

    private isValidLatitude(lat: any): boolean {
        return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
    }

    private isValidLongitude(lon: any): boolean {
        return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
    }

    private isValidAngle(angle: any): boolean {
        return typeof angle === 'number' && !isNaN(angle) && isFinite(angle);
    }

    private isValidAcceleration(acc: any): boolean {
        return typeof acc === 'number' && !isNaN(acc) && isFinite(acc);
    }

    private isValidLoad(load: any): boolean {
        return typeof load === 'number' && !isNaN(load) && load >= 0 && load <= 1;
    }

    private isValidEmail(email: any): boolean {
        if (typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPassword(password: any): boolean {
        if (typeof password !== 'string') return false;
        // Al menos 8 caracteres, una letra, un número y un carácter especial
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }

    private isValidPlateNumber(plateNumber: any): boolean {
        if (typeof plateNumber !== 'string') return false;
        // Formato básico: XXXX-999 o similar
        const plateRegex = /^[A-Z0-9]{4,8}(-[A-Z0-9]{2,4})?$/;
        return plateRegex.test(plateNumber);
    }
}
