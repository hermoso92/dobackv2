import { createMockLogger } from '../../test/utils';
import { RawStabilityData } from '../../types/stability';
import { ValidationService } from '../ValidationService';

describe('ValidationService', () => {
    let service: ValidationService;
    let mockLogger: any;

    beforeEach(() => {
        mockLogger = createMockLogger();
        service = new ValidationService();
    });

    describe('validateTelemetryData', () => {
        it('should validate correct telemetry data', () => {
            const data = {
                timestamp: new Date(),
                vehicleId: 'test-vehicle',
                speed: 60,
                engineRpm: 2000,
                fuelLevel: 75,
                temperature: 90,
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 667
                }
            };

            const result = service.validateTelemetryData(data);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid telemetry data', () => {
            const data = {
                timestamp: 'invalid-date',
                vehicleId: '',
                speed: -1,
                engineRpm: 'invalid',
                fuelLevel: 150,
                temperature: null,
                location: null
            };

            const result = service.validateTelemetryData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateStabilityData', () => {
        it('should validate correct stability data', () => {
            const data: RawStabilityData = {
                timestamp: Date.now(),
                roll: 5,
                pitch: 3,
                yaw: 1,
                acc_x: 0.1,
                acc_y: 0.2,
                acc_z: 9.81,
                load_fl: 0.25,
                load_fr: 0.25,
                load_rl: 0.25,
                load_rr: 0.25,
                lat: 40.4168,
                lon: -3.7038,
                alt: 667,
                vehicle_id: 'test-vehicle',
                session_id: 'test-session'
            };

            const result = service.validateStabilityData(data);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid stability data', () => {
            const data = {
                timestamp: 'invalid',
                roll: 'invalid',
                pitch: null,
                yaw: undefined,
                acc_x: NaN,
                acc_y: Infinity,
                acc_z: -Infinity,
                load_fl: -1,
                load_fr: 2,
                load_rl: null,
                load_rr: undefined,
                lat: 91,
                lon: 181,
                alt: NaN,
                vehicle_id: '',
                session_id: ''
            };

            const result = service.validateStabilityData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateUserData', () => {
        it('should validate correct user data', () => {
            const data = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'StrongPass123!',
                role: 'OPERATOR',
                organizationId: 1
            };

            const result = service.validateUserData(data);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid user data', () => {
            const data = {
                email: 'invalid-email',
                name: '',
                password: '123',
                role: 'INVALID_ROLE',
                organizationId: -1
            };

            const result = service.validateUserData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateVehicleData', () => {
        it('should validate correct vehicle data', () => {
            const data = {
                name: 'Test Vehicle',
                model: 'Test Model',
                plateNumber: 'TEST-001',
                organizationId: 1,
                status: 'ACTIVE'
            };

            const result = service.validateVehicleData(data);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid vehicle data', () => {
            const data = {
                name: '',
                model: null,
                plateNumber: '',
                organizationId: -1,
                status: 'INVALID_STATUS'
            };

            const result = service.validateVehicleData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
