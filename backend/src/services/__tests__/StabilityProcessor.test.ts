import { createMockLogger } from '../../test/utils';
import { StabilityMeasurements } from '../../types/stability';
import { StabilityProcessor } from '../StabilityProcessor';

describe('StabilityProcessor', () => {
    let processor: StabilityProcessor;
    let mockLogger: any;

    beforeEach(() => {
        mockLogger = createMockLogger();
        processor = new StabilityProcessor();
    });

    describe('processMeasurements', () => {
        it('should process valid measurements', () => {
            // Arrange
            const measurements: StabilityMeasurements[] = [
                {
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 'test-session',
                    accelerometer: {
                        x: 0.1,
                        y: 0.2,
                        z: 9.81
                    },
                    gyroscope: {
                        x: 0.01,
                        y: 0.02,
                        z: 0.03
                    },
                    location: {
                        latitude: 0,
                        longitude: 0,
                        altitude: 0
                    },
                    loadCells: {
                        frontLeft: 0.3,
                        frontRight: 0.3,
                        rearLeft: 0.2,
                        rearRight: 0.2
                    }
                }
            ];

            // Act
            const result = processor.processMeasurements(measurements);

            // Assert
            expect(result).toBeDefined();
            expect(result.ltr).toBeCloseTo(0.2, 2);
            expect(result.ssf).toBeCloseTo(1.5, 2);
            expect(result.drs).toBeCloseTo(1.2, 2);
            expect(result.rsc).toBeCloseTo(1.3, 2);
            expect(result.rollAngle).toBeCloseTo(1.17, 2); // atan2(0.2, 9.81) * 180/π
            expect(result.pitchAngle).toBeCloseTo(0.58, 2); // atan2(-0.1, sqrt(0.2² + 9.81²)) * 180/π
            expect(result.lateralAcceleration).toBeCloseTo(0.02, 2); // 0.2/9.81
            expect(result.longitudinalAcceleration).toBeCloseTo(0.01, 2); // 0.1/9.81
            expect(result.verticalAcceleration).toBeCloseTo(0, 2); // (9.81 - 9.81)/9.81
            expect(result.loadTransfer).toBeCloseTo(0.2, 2);
        });

        it('should handle empty measurements array', () => {
            // Arrange
            const measurements: StabilityMeasurements[] = [];

            // Act
            const result = processor.processMeasurements(measurements);

            // Assert
            expect(result).toEqual({
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                rollAngle: 0,
                pitchAngle: 0,
                lateralAcceleration: 0,
                longitudinalAcceleration: 0,
                verticalAcceleration: 0,
                loadTransfer: 0
            });
        });

        it('should handle invalid measurements', () => {
            // Arrange
            const measurements: StabilityMeasurements[] = [
                {
                    timestamp: new Date(),
                    vehicleId: 1,
                    sessionId: 'test-session',
                    accelerometer: {
                        x: NaN,
                        y: NaN,
                        z: NaN
                    },
                    gyroscope: {
                        x: NaN,
                        y: NaN,
                        z: NaN
                    },
                    location: {
                        latitude: 0,
                        longitude: 0,
                        altitude: 0
                    },
                    loadCells: {
                        frontLeft: NaN,
                        frontRight: NaN,
                        rearLeft: NaN,
                        rearRight: NaN
                    }
                }
            ];

            // Act
            const result = processor.processMeasurements(measurements);

            // Assert
            expect(result).toEqual({
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                rollAngle: 0,
                pitchAngle: 0,
                lateralAcceleration: 0,
                longitudinalAcceleration: 0,
                verticalAcceleration: 0,
                loadTransfer: 0
            });
        });
    });

    describe('calculateLTR', () => {
        it('should calculate Load Transfer Ratio correctly', () => {
            // Arrange
            const measurement: StabilityMeasurements = {
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 'test-session',
                accelerometer: {
                    x: 0.1,
                    y: 0.2,
                    z: 9.81
                },
                gyroscope: {
                    x: 0.01,
                    y: 0.02,
                    z: 0.03
                },
                location: {
                    latitude: 0,
                    longitude: 0,
                    altitude: 0
                },
                loadCells: {
                    frontLeft: 0.3,
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            };

            // Act
            const result = processor.calculateLTR(measurement);

            // Assert
            expect(result).toBeCloseTo(0.2, 2);
        });
    });

    describe('calculateSSF', () => {
        it('should calculate Static Stability Factor correctly', () => {
            // Arrange
            const measurement: StabilityMeasurements = {
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 'test-session',
                accelerometer: {
                    x: 0.1,
                    y: 0.2,
                    z: 9.81
                },
                gyroscope: {
                    x: 0.01,
                    y: 0.02,
                    z: 0.03
                },
                location: {
                    latitude: 0,
                    longitude: 0,
                    altitude: 0
                },
                loadCells: {
                    frontLeft: 0.3,
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            };

            // Act
            const result = processor.calculateSSF(measurement);

            // Assert
            expect(result).toBeCloseTo(1.5, 2);
        });
    });

    describe('calculateDRS', () => {
        it('should calculate Dynamic Rollover Stability correctly', () => {
            // Arrange
            const measurement: StabilityMeasurements = {
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 'test-session',
                accelerometer: {
                    x: 0.1,
                    y: 0.2,
                    z: 9.81
                },
                gyroscope: {
                    x: 0.01,
                    y: 0.02,
                    z: 0.03
                },
                location: {
                    latitude: 0,
                    longitude: 0,
                    altitude: 0
                },
                loadCells: {
                    frontLeft: 0.3,
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            };

            // Act
            const result = processor.calculateDRS(measurement);

            // Assert
            expect(result).toBeCloseTo(1.2, 2);
        });
    });

    describe('calculateRSC', () => {
        it('should calculate Rollover Stability Coefficient correctly', () => {
            // Arrange
            const measurement: StabilityMeasurements = {
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 'test-session',
                accelerometer: {
                    x: 0.1,
                    y: 0.2,
                    z: 9.81
                },
                gyroscope: {
                    x: 0.01,
                    y: 0.02,
                    z: 0.03
                },
                location: {
                    latitude: 0,
                    longitude: 0,
                    altitude: 0
                },
                loadCells: {
                    frontLeft: 0.3,
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            };

            // Act
            const result = processor.calculateRSC(measurement);

            // Assert
            expect(result).toBeCloseTo(1.3, 2);
        });
    });

    describe('calculateLoadTransfer', () => {
        it('should calculate load transfer correctly', () => {
            // Arrange
            const measurement: StabilityMeasurements = {
                timestamp: new Date(),
                vehicleId: 1,
                sessionId: 'test-session',
                accelerometer: {
                    x: 0.1,
                    y: 0.2,
                    z: 9.81
                },
                gyroscope: {
                    x: 0.01,
                    y: 0.02,
                    z: 0.03
                },
                location: {
                    latitude: 0,
                    longitude: 0,
                    altitude: 0
                },
                loadCells: {
                    frontLeft: 0.3,
                    frontRight: 0.3,
                    rearLeft: 0.2,
                    rearRight: 0.2
                }
            };

            // Act
            const result = processor.calculateLoadTransfer(measurement);

            // Assert
            expect(result).toBeCloseTo(0.2, 2);
        });
    });
});
