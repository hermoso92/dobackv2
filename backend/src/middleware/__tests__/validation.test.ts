import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRequest, mockResponse } from '../../test/utils';
import { eventSchema, organizationSchema, sessionSchema, userSchema, validate, vehicleSchema } from '../validation';

// Mock de logger
vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));

describe('Validation Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe('validate middleware', () => {
        it('should pass validation with valid data', () => {
            // Arrange
            req.body = {
                name: 'Test Vehicle',
                licensePlate: 'ABC-123',
                model: 'Model X',
                brand: 'Test Brand',
                type: 'CAR'
            };

            // Act
            validate(vehicleSchema)(req as Request, res as Response, next);

            // Assert
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should fail validation with invalid data', () => {
            // Arrange
            req.body = {
                name: '', // Invalid: empty name
                licensePlate: 'invalid-plate', // Invalid: lowercase
                model: 'Model X',
                brand: 'Test Brand',
                type: 'INVALID_TYPE' // Invalid: not in enum
            };

            // Act
            validate(vehicleSchema)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Datos de entrada inválidos',
                details: expect.any(String)
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should fail validation with missing required fields', () => {
            // Arrange
            req.body = {
                name: 'Test Vehicle'
                // Missing required fields: licensePlate, model, brand, type
            };

            // Act
            validate(vehicleSchema)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Datos de entrada inválidos',
                details: expect.any(String)
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('vehicleSchema', () => {
        it('should validate correct vehicle data', () => {
            // Arrange
            const validVehicleData = {
                name: 'Fire Truck 001',
                licensePlate: 'ABC-123',
                model: 'Model X',
                brand: 'Test Brand',
                type: 'TRUCK',
                status: 'ACTIVE'
            };

            // Act
            const { error } = vehicleSchema.validate(validVehicleData);

            // Assert
            expect(error).toBeUndefined();
        });

        it('should reject invalid license plate format', () => {
            // Arrange
            const invalidVehicleData = {
                name: 'Fire Truck 001',
                licensePlate: 'abc-123', // Invalid: lowercase
                model: 'Model X',
                brand: 'Test Brand',
                type: 'TRUCK'
            };

            // Act
            const { error } = vehicleSchema.validate(invalidVehicleData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('licensePlate');
        });

        it('should reject invalid vehicle type', () => {
            // Arrange
            const invalidVehicleData = {
                name: 'Fire Truck 001',
                licensePlate: 'ABC-123',
                model: 'Model X',
                brand: 'Test Brand',
                type: 'INVALID_TYPE'
            };

            // Act
            const { error } = vehicleSchema.validate(invalidVehicleData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('type');
        });

        it('should accept optional status field', () => {
            // Arrange
            const validVehicleData = {
                name: 'Fire Truck 001',
                licensePlate: 'ABC-123',
                model: 'Model X',
                brand: 'Test Brand',
                type: 'TRUCK',
                status: 'MAINTENANCE'
            };

            // Act
            const { error } = vehicleSchema.validate(validVehicleData);

            // Assert
            expect(error).toBeUndefined();
        });
    });

    describe('sessionSchema', () => {
        it('should validate correct session data', () => {
            // Arrange
            const validSessionData = {
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                startTime: '2024-01-01T10:00:00Z',
                endTime: '2024-01-01T12:00:00Z',
                type: 'ROUTINE',
                sessionNumber: 1,
                sequence: 1
            };

            // Act
            const { error } = sessionSchema.validate(validSessionData);

            // Assert
            expect(error).toBeUndefined();
        });

        it('should reject invalid UUID for vehicleId', () => {
            // Arrange
            const invalidSessionData = {
                vehicleId: 'invalid-uuid',
                startTime: '2024-01-01T10:00:00Z',
                type: 'ROUTINE',
                sessionNumber: 1,
                sequence: 1
            };

            // Act
            const { error } = sessionSchema.validate(invalidSessionData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('vehicleId');
        });

        it('should reject invalid date format', () => {
            // Arrange
            const invalidSessionData = {
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                startTime: 'invalid-date',
                type: 'ROUTINE',
                sessionNumber: 1,
                sequence: 1
            };

            // Act
            const { error } = sessionSchema.validate(invalidSessionData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('startTime');
        });

        it('should reject endTime before startTime', () => {
            // Arrange
            const invalidSessionData = {
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                startTime: '2024-01-01T12:00:00Z',
                endTime: '2024-01-01T10:00:00Z', // Before startTime
                type: 'ROUTINE',
                sessionNumber: 1,
                sequence: 1
            };

            // Act
            const { error } = sessionSchema.validate(invalidSessionData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('endTime');
        });

        it('should reject negative session number', () => {
            // Arrange
            const invalidSessionData = {
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                startTime: '2024-01-01T10:00:00Z',
                type: 'ROUTINE',
                sessionNumber: -1, // Invalid: negative
                sequence: 1
            };

            // Act
            const { error } = sessionSchema.validate(invalidSessionData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('sessionNumber');
        });
    });

    describe('eventSchema', () => {
        it('should validate correct event data', () => {
            // Arrange
            const validEventData = {
                type: 'GPS',
                status: 'ACTIVE',
                severity: 'HIGH',
                description: 'Test event',
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T10:00:00Z'
            };

            // Act
            const { error } = eventSchema.validate(validEventData);

            // Assert
            expect(error).toBeUndefined();
        });

        it('should reject invalid event type', () => {
            // Arrange
            const invalidEventData = {
                type: 'INVALID_TYPE',
                status: 'ACTIVE',
                severity: 'HIGH',
                description: 'Test event',
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T10:00:00Z'
            };

            // Act
            const { error } = eventSchema.validate(invalidEventData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('type');
        });

        it('should reject invalid severity level', () => {
            // Arrange
            const invalidEventData = {
                type: 'GPS',
                status: 'ACTIVE',
                severity: 'INVALID_SEVERITY',
                description: 'Test event',
                vehicleId: '123e4567-e89b-12d3-a456-426614174000',
                timestamp: '2024-01-01T10:00:00Z'
            };

            // Act
            const { error } = eventSchema.validate(invalidEventData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('severity');
        });
    });

    describe('userSchema', () => {
        it('should validate correct user data', () => {
            // Arrange
            const validUserData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'SecurePassword123!',
                role: 'ADMIN',
                organizationId: '123e4567-e89b-12d3-a456-426614174000'
            };

            // Act
            const { error } = userSchema.validate(validUserData);

            // Assert
            expect(error).toBeUndefined();
        });

        it('should reject invalid email format', () => {
            // Arrange
            const invalidUserData = {
                email: 'invalid-email',
                name: 'Test User',
                password: 'SecurePassword123!',
                role: 'ADMIN',
                organizationId: '123e4567-e89b-12d3-a456-426614174000'
            };

            // Act
            const { error } = userSchema.validate(invalidUserData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('email');
        });

        it('should reject weak password', () => {
            // Arrange
            const invalidUserData = {
                email: 'test@example.com',
                name: 'Test User',
                password: '123', // Too weak
                role: 'ADMIN',
                organizationId: '123e4567-e89b-12d3-a456-426614174000'
            };

            // Act
            const { error } = userSchema.validate(invalidUserData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('password');
        });

        it('should reject invalid role', () => {
            // Arrange
            const invalidUserData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'SecurePassword123!',
                role: 'INVALID_ROLE',
                organizationId: '123e4567-e89b-12d3-a456-426614174000'
            };

            // Act
            const { error } = userSchema.validate(invalidUserData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('role');
        });
    });

    describe('organizationSchema', () => {
        it('should validate correct organization data', () => {
            // Arrange
            const validOrganizationData = {
                name: 'Test Organization',
                description: 'Test organization description',
                apiKey: 'api-key-123'
            };

            // Act
            const { error } = organizationSchema.validate(validOrganizationData);

            // Assert
            expect(error).toBeUndefined();
        });

        it('should reject empty organization name', () => {
            // Arrange
            const invalidOrganizationData = {
                name: '', // Invalid: empty
                description: 'Test organization description',
                apiKey: 'api-key-123'
            };

            // Act
            const { error } = organizationSchema.validate(invalidOrganizationData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('name');
        });

        it('should accept organization without description', () => {
            // Arrange
            const validOrganizationData = {
                name: 'Test Organization',
                apiKey: 'api-key-123'
                // description is optional
            };

            // Act
            const { error } = organizationSchema.validate(validOrganizationData);

            // Assert
            expect(error).toBeUndefined();
        });

        it('should reject invalid API key format', () => {
            // Arrange
            const invalidOrganizationData = {
                name: 'Test Organization',
                description: 'Test organization description',
                apiKey: 'invalid api key with spaces' // Invalid: contains spaces
            };

            // Act
            const { error } = organizationSchema.validate(invalidOrganizationData);

            // Assert
            expect(error).toBeDefined();
            expect(error?.details[0].message).toContain('apiKey');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty request body', () => {
            // Arrange
            req.body = {};

            // Act
            validate(vehicleSchema)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Datos de entrada inválidos',
                details: expect.any(String)
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle null request body', () => {
            // Arrange
            req.body = null;

            // Act
            validate(vehicleSchema)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Datos de entrada inválidos',
                details: expect.any(String)
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle undefined request body', () => {
            // Arrange
            req.body = undefined;

            // Act
            validate(vehicleSchema)(req as Request, res as Response, next);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Datos de entrada inválidos',
                details: expect.any(String)
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
