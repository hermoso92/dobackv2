import { ValidationError } from '../../types/domain';
import { StabilityMeasurements } from '../../types/stability';
import { DataValidationService } from '../DataValidationService';

describe('DataValidationService', () => {
    let service: DataValidationService;

    beforeEach(() => {
        service = new DataValidationService();
    });

    describe('validateStabilityData', () => {
        it('should validate valid stability data', () => {
            // Arrange
            const data: StabilityMeasurements = {
                id: '1',
                timestamp: new Date(),
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                },
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            };

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should invalidate data with missing required fields', () => {
            // Arrange
            const data = {
                id: '1',
                timestamp: new Date(),
                // Missing roll, pitch, yaw
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                },
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            } as StabilityMeasurements;

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual({
                field: 'roll',
                message: 'Roll angle is required',
                code: 'REQUIRED_FIELD'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'pitch',
                message: 'Pitch angle is required',
                code: 'REQUIRED_FIELD'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'yaw',
                message: 'Yaw angle is required',
                code: 'REQUIRED_FIELD'
            } as ValidationError);
        });

        it('should invalidate data with out of range values', () => {
            // Arrange
            const data: StabilityMeasurements = {
                id: '1',
                timestamp: new Date(),
                roll: 100, // Too high
                pitch: -100, // Too low
                yaw: 200, // Too high
                lateralAcc: 5, // Too high
                verticalAcc: -5, // Too low
                longitudinalAcc: 10, // Too high
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                },
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            };

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual({
                field: 'roll',
                message: 'Roll angle must be between -45 and 45 degrees',
                code: 'RANGE_ERROR'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'pitch',
                message: 'Pitch angle must be between -45 and 45 degrees',
                code: 'RANGE_ERROR'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'yaw',
                message: 'Yaw angle must be between -180 and 180 degrees',
                code: 'RANGE_ERROR'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'lateralAcc',
                message: 'Lateral acceleration must be between -2 and 2 g',
                code: 'RANGE_ERROR'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'verticalAcc',
                message: 'Vertical acceleration must be between -2 and 2 g',
                code: 'RANGE_ERROR'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'longitudinalAcc',
                message: 'Longitudinal acceleration must be between -2 and 2 g',
                code: 'RANGE_ERROR'
            } as ValidationError);
        });

        it('should invalidate data with invalid load distribution', () => {
            // Arrange
            const data: StabilityMeasurements = {
                id: '1',
                timestamp: new Date(),
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 1.5, // Sum > 1
                    frontRight: 1.5,
                    rearLeft: 1.5,
                    rearRight: 1.5
                },
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            };

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual({
                field: 'loadDistribution',
                message: 'Load distribution values must sum to 1',
                code: 'INVALID_DISTRIBUTION'
            } as ValidationError);
        });

        it('should invalidate data with NaN values', () => {
            // Arrange
            const data: StabilityMeasurements = {
                id: '1',
                timestamp: new Date(),
                roll: NaN,
                pitch: NaN,
                yaw: NaN,
                lateralAcc: NaN,
                verticalAcc: NaN,
                longitudinalAcc: NaN,
                loadDistribution: {
                    frontLeft: NaN,
                    frontRight: NaN,
                    rearLeft: NaN,
                    rearRight: NaN
                },
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            };

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual({
                field: 'measurements',
                message: 'Invalid measurement values',
                code: 'INVALID_VALUE'
            } as ValidationError);
        });

        it('should invalidate data with missing IDs', () => {
            // Arrange
            const data: StabilityMeasurements = {
                id: '1',
                timestamp: new Date(),
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                },
                vehicleId: '', // Empty vehicle ID
                sessionId: '' // Empty session ID
            };

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual({
                field: 'vehicleId',
                message: 'Vehicle ID is required',
                code: 'REQUIRED_FIELD'
            } as ValidationError);
            expect(result.errors).toContainEqual({
                field: 'sessionId',
                message: 'Session ID is required',
                code: 'REQUIRED_FIELD'
            } as ValidationError);
        });

        it('should invalidate data with future timestamp', () => {
            // Arrange
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

            const data: StabilityMeasurements = {
                id: '1',
                timestamp: futureDate,
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                },
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            };

            // Act
            const result = service.validateStabilityData(data);

            // Assert
            expect(result.isValid).toBe(false);
            expect(result.errors).toContainEqual({
                field: 'timestamp',
                message: 'Timestamp cannot be in the future',
                code: 'INVALID_TIMESTAMP'
            } as ValidationError);
        });
    });
});
