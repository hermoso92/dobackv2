import { LoadDistribution, StabilityMeasurement } from '../../types/stability';
import { StabilityProcessor } from '../StabilityProcessor';

describe('StabilityProcessor', () => {
    let processor: StabilityProcessor;

    beforeEach(() => {
        processor = new StabilityProcessor();
    });

    describe('processMeasurements', () => {
        it('should process measurements correctly', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [{
                id: '1',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                timestamp: new Date().toISOString(),
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.3,
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            }];

            // Act
            const result = await processor.processMeasurements(measurements);

            // Assert
            expect(result).toEqual({
                rollAngle: 0.5,
                pitchAngle: 0.3,
                yawAngle: 0.1,
                lateralAcceleration: 0.2,
                verticalAcceleration: 0.4,
                longitudinalAcceleration: 0.6,
                ltr: expect.closeTo(0.2, 5),
                ssf: expect.closeTo(1.5, 5),
                drs: expect.closeTo(1.2, 5),
                rsc: expect.closeTo(1.3, 5),
                loadTransfer: expect.closeTo(0.2, 5)
            });
        });

        it('should handle empty measurements array', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [];

            // Act
            const result = await processor.processMeasurements(measurements);

            // Assert
            expect(result).toEqual({
                rollAngle: 0,
                pitchAngle: 0,
                yawAngle: 0,
                lateralAcceleration: 0,
                verticalAcceleration: 0,
                longitudinalAcceleration: 0,
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                loadTransfer: 0
            });
        });

        it('should handle measurements with zero values', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [{
                id: '1',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                timestamp: new Date().toISOString(),
                roll: 0,
                pitch: 0,
                yaw: 0,
                lateralAcc: 0,
                verticalAcc: 0,
                longitudinalAcc: 0,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                }
            }];

            // Act
            const result = await processor.processMeasurements(measurements);

            // Assert
            expect(result).toEqual({
                rollAngle: 0,
                pitchAngle: 0,
                yawAngle: 0,
                lateralAcceleration: 0,
                verticalAcceleration: 0,
                longitudinalAcceleration: 0,
                ltr: 0,
                ssf: expect.closeTo(1.5, 5),
                drs: expect.closeTo(1.5, 5),
                rsc: expect.closeTo(1.5, 5),
                loadTransfer: 0
            });
        });

        it('should handle measurements with extreme values', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [{
                id: '1',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                timestamp: new Date().toISOString(),
                roll: 45,
                pitch: 45,
                yaw: 180,
                lateralAcc: 2,
                verticalAcc: 2,
                longitudinalAcc: 2,
                loadDistribution: {
                    frontLeft: 0.5,
                    frontRight: 0.5,
                    rearLeft: 0,
                    rearRight: 0
                }
            }];

            // Act
            const result = await processor.processMeasurements(measurements);

            // Assert
            expect(result).toEqual({
                rollAngle: 45,
                pitchAngle: 45,
                yawAngle: 180,
                lateralAcceleration: 2,
                verticalAcceleration: 2,
                longitudinalAcceleration: 2,
                ltr: expect.closeTo(1, 5),
                ssf: expect.closeTo(1.5, 5),
                drs: expect.closeTo(0.5, 5),
                rsc: expect.closeTo(0.75, 5),
                loadTransfer: expect.closeTo(1, 5)
            });
        });

        it('should handle invalid load distribution values', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [{
                id: '1',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                timestamp: new Date().toISOString(),
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: -0.1,  // Invalid negative value
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            }];

            // Act & Assert
            await expect(processor.processMeasurements(measurements))
                .rejects
                .toThrow('Invalid load distribution values');
        });

        it('should handle NaN values in measurements', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [{
                id: '1',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                timestamp: new Date().toISOString(),
                roll: NaN,
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
                }
            }];

            // Act & Assert
            await expect(processor.processMeasurements(measurements))
                .rejects
                .toThrow('Invalid measurement values');
        });

        it('should handle null values in measurements', async () => {
            // Arrange
            const measurements: StabilityMeasurement[] = [{
                id: '1',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                timestamp: new Date().toISOString(),
                roll: null as any,
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
                }
            }];

            // Act & Assert
            await expect(processor.processMeasurements(measurements))
                .rejects
                .toThrow('Invalid measurement values');
        });
    });

    describe('calculateLTR', () => {
        it('should calculate Load Transfer Ratio correctly', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.3,
                frontRight: 0.3,
                rearLeft: 0.2,
                rearRight: 0.2
            };

            // Act
            const result = processor.calculateLTR(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0.2, 5); // (0.3 + 0.3 - 0.2 - 0.2) / (0.3 + 0.3 + 0.2 + 0.2)
        });

        it('should handle empty measurements array', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0,
                frontRight: 0,
                rearLeft: 0,
                rearRight: 0
            };

            // Act
            const result = processor.calculateLTR(loadDistribution);

            // Assert
            expect(result).toBe(0);
        });

        it('should handle extreme values', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 1,
                frontRight: 1,
                rearLeft: 0,
                rearRight: 0
            };

            // Act
            const result = processor.calculateLTR(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(1, 5);
        });

        it('should calculate LTR correctly for balanced load', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.25,
                frontRight: 0.25,
                rearLeft: 0.25,
                rearRight: 0.25
            };

            // Act
            const result = processor.calculateLTR(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0, 5);
        });

        it('should calculate LTR correctly for front-heavy load', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.3,
                frontRight: 0.3,
                rearLeft: 0.2,
                rearRight: 0.2
            };

            // Act
            const result = processor.calculateLTR(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0.2, 5);
        });

        it('should calculate LTR correctly for side-heavy load', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.4,
                frontRight: 0.1,
                rearLeft: 0.4,
                rearRight: 0.1
            };

            // Act
            const result = processor.calculateLTR(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0.6, 5);
        });
    });

    describe('calculateSSF', () => {
        it('should calculate Static Stability Factor correctly', () => {
            // Arrange
            const trackWidth = 1.8; // meters
            const cgHeight = 0.6; // meters

            // Act
            const result = processor.calculateSSF(trackWidth, cgHeight);

            // Assert
            expect(result).toBeCloseTo(1.5, 5); // trackWidth / (2 * cgHeight) = 1.8 / (2 * 0.6)
        });

        it('should handle zero values', () => {
            // Arrange
            const trackWidth = 0;
            const cgHeight = 0;

            // Act
            const result = processor.calculateSSF(trackWidth, cgHeight);

            // Assert
            expect(result).toBe(0);
        });

        it('should handle extreme values', () => {
            // Arrange
            const trackWidth = 3;
            const cgHeight = 0.5;

            // Act
            const result = processor.calculateSSF(trackWidth, cgHeight);

            // Assert
            expect(result).toBeCloseTo(3, 5); // 3 / (2 * 0.5) = 3
        });

        it('should calculate SSF correctly for standard vehicle', () => {
            // Act
            const result = processor.calculateSSF(1.8, 0.6);

            // Assert
            expect(result).toBeCloseTo(1.5, 5);
        });

        it('should handle zero track width', () => {
            // Act & Assert
            expect(() => processor.calculateSSF(0, 0.6))
                .toThrow('Invalid track width or CG height');
        });

        it('should handle zero CG height', () => {
            // Act & Assert
            expect(() => processor.calculateSSF(1.8, 0))
                .toThrow('Invalid track width or CG height');
        });
    });

    describe('calculateDRS', () => {
        it('should calculate Dynamic Rollover Stability correctly', () => {
            // Arrange
            const ssf = 1.5;
            const lateralAcceleration = 0.2; // g

            // Act
            const result = processor.calculateDRS(ssf, lateralAcceleration);

            // Assert
            expect(result).toBeCloseTo(1.2, 5); // ssf * (1 - lateralAcceleration)
        });

        it('should handle zero values', () => {
            // Arrange
            const ssf = 0;
            const lateralAcceleration = 0;

            // Act
            const result = processor.calculateDRS(ssf, lateralAcceleration);

            // Assert
            expect(result).toBe(0);
        });

        it('should handle extreme values', () => {
            // Arrange
            const ssf = 2;
            const lateralAcceleration = 0.5;

            // Act
            const result = processor.calculateDRS(ssf, lateralAcceleration);

            // Assert
            expect(result).toBeCloseTo(1.33, 2); // 2 / (1 + 0.5)
        });

        it('should calculate DRS correctly for stable conditions', () => {
            // Act
            const result = processor.calculateDRS(1.5, 0.2);

            // Assert
            expect(result).toBeCloseTo(1.2, 5);
        });

        it('should calculate DRS correctly for unstable conditions', () => {
            // Act
            const result = processor.calculateDRS(1.5, 0.8);

            // Assert
            expect(result).toBeCloseTo(0.7, 5);
        });

        it('should handle extreme lateral acceleration', () => {
            // Act
            const result = processor.calculateDRS(1.5, 2.0);

            // Assert
            expect(result).toBeCloseTo(0.5, 5);
        });
    });

    describe('calculateRSC', () => {
        it('should calculate Roll Stability Control correctly', () => {
            // Arrange
            const ssf = 1.5;
            const lateralAcceleration = 0.2; // g

            // Act
            const result = processor.calculateRSC(ssf, lateralAcceleration);

            // Assert
            expect(result).toBeCloseTo(1.3, 5); // ssf * (1 + lateralAcceleration)
        });

        it('should handle zero values', () => {
            // Arrange
            const ssf = 0;
            const lateralAcceleration = 0;

            // Act
            const result = processor.calculateRSC(ssf, lateralAcceleration);

            // Assert
            expect(result).toBe(0);
        });

        it('should handle extreme values', () => {
            // Arrange
            const ssf = 2;
            const lateralAcceleration = 0.5;

            // Act
            const result = processor.calculateRSC(ssf, lateralAcceleration);

            // Assert
            expect(result).toBeCloseTo(1.6, 5); // 2 / (1 + 0.5 * 0.5)
        });

        it('should calculate RSC correctly for stable conditions', () => {
            // Act
            const result = processor.calculateRSC(1.5, 0.2);

            // Assert
            expect(result).toBeCloseTo(1.3, 5);
        });

        it('should calculate RSC correctly for unstable conditions', () => {
            // Act
            const result = processor.calculateRSC(1.5, 0.8);

            // Assert
            expect(result).toBeCloseTo(0.7, 5);
        });

        it('should handle extreme lateral acceleration', () => {
            // Act
            const result = processor.calculateRSC(1.5, 2.0);

            // Assert
            expect(result).toBeCloseTo(0.5, 5);
        });
    });

    describe('calculateLoadTransfer', () => {
        it('should calculate load transfer correctly', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.3,
                frontRight: 0.3,
                rearLeft: 0.2,
                rearRight: 0.2
            };

            // Act
            const result = processor.calculateLoadTransfer(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0.2, 5); // |((0.3 + 0.3) - (0.2 + 0.2)) / (0.3 + 0.3 + 0.2 + 0.2)|
        });

        it('should handle empty measurements array', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0,
                frontRight: 0,
                rearLeft: 0,
                rearRight: 0
            };

            // Act
            const result = processor.calculateLoadTransfer(loadDistribution);

            // Assert
            expect(result).toBe(0);
        });

        it('should handle extreme values', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 1,
                frontRight: 1,
                rearLeft: 0,
                rearRight: 0
            };

            // Act
            const result = processor.calculateLoadTransfer(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(1, 5);
        });

        it('should calculate load transfer correctly for balanced load', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.25,
                frontRight: 0.25,
                rearLeft: 0.25,
                rearRight: 0.25
            };

            // Act
            const result = processor.calculateLoadTransfer(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0, 5);
        });

        it('should calculate load transfer correctly for front-heavy load', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.3,
                frontRight: 0.3,
                rearLeft: 0.2,
                rearRight: 0.2
            };

            // Act
            const result = processor.calculateLoadTransfer(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0.2, 5);
        });

        it('should calculate load transfer correctly for side-heavy load', () => {
            // Arrange
            const loadDistribution: LoadDistribution = {
                frontLeft: 0.4,
                frontRight: 0.1,
                rearLeft: 0.4,
                rearRight: 0.1
            };

            // Act
            const result = processor.calculateLoadTransfer(loadDistribution);

            // Assert
            expect(result).toBeCloseTo(0.6, 5);
        });
    });
}); 