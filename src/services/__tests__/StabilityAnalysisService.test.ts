import { EventSeverity, EventStatus, EventType } from '../../types/event';
import { StabilityEvent, StabilityMeasurement, StabilityMetrics } from '../../types/stability';
import { EventService } from '../EventService';
import { NotificationService } from '../NotificationService';
import { StabilityAnalysisService } from '../StabilityAnalysisService';
import { StabilityProcessor } from '../StabilityProcessor';

jest.mock('../EventService');
jest.mock('../NotificationService');
jest.mock('../StabilityProcessor');

describe('StabilityAnalysisService', () => {
    let service: StabilityAnalysisService;
    let mockStabilityProcessor: jest.Mocked<StabilityProcessor>;
    let mockEventService: jest.Mocked<EventService>;
    let mockNotificationService: jest.Mocked<NotificationService>;

    beforeEach(() => {
        mockStabilityProcessor = {
            calculateLTR: jest.fn().mockReturnValue(0.5),
            calculateSSF: jest.fn().mockReturnValue(1.5),
            calculateDRS: jest.fn().mockReturnValue(1.2),
            calculateRSC: jest.fn().mockReturnValue(1.3),
            calculateLoadTransfer: jest.fn().mockReturnValue(0.3)
        } as any;

        mockEventService = {
            createEvent: jest.fn().mockResolvedValue(undefined),
            getEvents: jest.fn().mockResolvedValue([]),
            updateEventStatus: jest.fn().mockResolvedValue(undefined)
        } as any;

        mockNotificationService = {
            sendCriticalAlert: jest.fn().mockResolvedValue(undefined),
            sendWarning: jest.fn().mockResolvedValue(undefined),
            sendInfo: jest.fn().mockResolvedValue(undefined)
        } as any;

        service = new StabilityAnalysisService(
            mockEventService,
            mockNotificationService,
            mockStabilityProcessor
        );
    });

    describe('analyzeStabilityData', () => {
        it('should analyze stability data and return metrics and events', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
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
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                }
            }];

            const mockMetrics = {
                ltr: 0.5,
                ssf: 1.5,
                drs: 1.2,
                rsc: 1.3,
                loadTransfer: 0.3,
                rollAngle: 0.5,
                pitchAngle: 0.3,
                yawAngle: 0.1,
                lateralAcceleration: 0.2,
                verticalAcceleration: 0.4,
                longitudinalAcceleration: 0.6
            };

            // Act
            const result = await service.analyzeStabilityData(mockMeasurements);

            // Assert
            expect(result).toEqual({
                metrics: mockMetrics,
                events: []
            });

            expect(mockStabilityProcessor.calculateLTR).toHaveBeenCalledWith(mockMeasurements[0].loadDistribution);
            expect(mockStabilityProcessor.calculateSSF).toHaveBeenCalledWith(1.8, 0.6);
            expect(mockStabilityProcessor.calculateDRS).toHaveBeenCalledWith(1.5, 0.2);
            expect(mockStabilityProcessor.calculateRSC).toHaveBeenCalledWith(1.5, 0.2);
            expect(mockStabilityProcessor.calculateLoadTransfer).toHaveBeenCalledWith(mockMeasurements[0].loadDistribution);
        });

        it('should handle empty measurements array', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [];

            const mockMetrics = {
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                loadTransfer: 0,
                rollAngle: 0,
                pitchAngle: 0,
                yawAngle: 0,
                lateralAcceleration: 0,
                verticalAcceleration: 0,
                longitudinalAcceleration: 0
            };

            // Act
            const result = await service.analyzeStabilityData(mockMeasurements);

            // Assert
            expect(result).toEqual({
                metrics: mockMetrics,
                events: []
            });
        });

        it('should handle invalid measurements', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
                id: '1',
                timestamp: '2025-05-04T14:20:22.588Z',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                roll: 0,
                pitch: 0,
                yaw: 0,
                lateralAcc: 0,
                verticalAcc: 0,
                longitudinalAcc: 0,
                loadDistribution: {
                    frontLeft: 0,
                    frontRight: 0,
                    rearLeft: 0,
                    rearRight: 0
                }
            }];

            mockStabilityProcessor.calculateLTR.mockImplementation(() => {
                throw new Error('Invalid measurements');
            });

            // Act & Assert
            await expect(service.analyzeStabilityData(mockMeasurements)).rejects.toThrow('Invalid measurements');
            expect(mockEventService.createEvent).not.toHaveBeenCalled();
        });

        it('should handle invalid load distribution', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
                id: '1',
                timestamp: '2025-05-04T14:20:22.593Z',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 1.5,
                    frontRight: 1.5,
                    rearLeft: 1.5,
                    rearRight: 1.5
                }
            }];

            mockStabilityProcessor.calculateLTR.mockImplementation(() => {
                throw new Error('Invalid load distribution');
            });

            // Act & Assert
            await expect(service.analyzeStabilityData(mockMeasurements)).rejects.toThrow('Invalid load distribution');
            expect(mockEventService.createEvent).not.toHaveBeenCalled();
        });

        it('should generate critical event for high LTR', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
                id: '1',
                timestamp: '2025-05-04T14:20:22.552Z',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.4,
                    frontRight: 0.4,
                    rearLeft: 0.1,
                    rearRight: 0.1
                }
            }];

            const mockMetrics: StabilityMetrics = {
                ltr: 0.9, // Critical LTR
                ssf: 1.5,
                drs: 1.2,
                rsc: 1.3,
                loadTransfer: 0.3,
                rollAngle: 0.5,
                pitchAngle: 0.3,
                yawAngle: 0.1,
                lateralAcceleration: 0.2,
                verticalAcceleration: 0.4,
                longitudinalAcceleration: 0.6
            };

            mockStabilityProcessor.calculateLTR.mockReturnValue(0.9);
            mockStabilityProcessor.calculateSSF.mockReturnValue(1.5);
            mockStabilityProcessor.calculateDRS.mockReturnValue(1.2);
            mockStabilityProcessor.calculateRSC.mockReturnValue(1.3);
            mockStabilityProcessor.calculateLoadTransfer.mockReturnValue(0.3);

            const mockEvent: StabilityEvent = {
                id: '1',
                type: EventType.STABILITY,
                severity: EventSeverity.CRITICAL,
                status: EventStatus.ACTIVE,
                message: 'Riesgo crítico de vuelco detectado',
                timestamp: mockMeasurements[0].timestamp,
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null,
                context: {
                    metrics: mockMetrics
                }
            };

            mockEventService.createEvent.mockResolvedValue(mockEvent);

            // Act
            const result = await service.analyzeStabilityData(mockMeasurements);

            // Assert
            expect(result.events[0].severity).toBe(EventSeverity.CRITICAL);
            expect(result.events[0].message).toBe('Riesgo crítico de vuelco detectado');
            expect(mockNotificationService.sendCriticalAlert).toHaveBeenCalled();
        });

        it('should generate warning event for moderate LTR', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
                id: '1',
                timestamp: '2025-05-04T14:20:22.552Z',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.35,
                    frontRight: 0.35,
                    rearLeft: 0.15,
                    rearRight: 0.15
                }
            }];

            const mockMetrics: StabilityMetrics = {
                ltr: 0.7, // Warning LTR
                ssf: 1.5,
                drs: 1.2,
                rsc: 1.3,
                loadTransfer: 0.3,
                rollAngle: 0.5,
                pitchAngle: 0.3,
                yawAngle: 0.1,
                lateralAcceleration: 0.2,
                verticalAcceleration: 0.4,
                longitudinalAcceleration: 0.6
            };

            mockStabilityProcessor.calculateLTR.mockReturnValue(0.7);
            mockStabilityProcessor.calculateSSF.mockReturnValue(1.5);
            mockStabilityProcessor.calculateDRS.mockReturnValue(1.2);
            mockStabilityProcessor.calculateRSC.mockReturnValue(1.3);
            mockStabilityProcessor.calculateLoadTransfer.mockReturnValue(0.3);

            const mockEvent: StabilityEvent = {
                id: '1',
                type: EventType.STABILITY,
                severity: EventSeverity.WARNING,
                status: EventStatus.ACTIVE,
                message: 'Alta transferencia de carga detectada',
                timestamp: mockMeasurements[0].timestamp,
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null,
                context: {
                    metrics: mockMetrics
                }
            };

            mockEventService.createEvent.mockResolvedValue(mockEvent);

            // Act
            const result = await service.analyzeStabilityData(mockMeasurements);

            // Assert
            expect(result.events[0].severity).toBe(EventSeverity.WARNING);
            expect(result.events[0].message).toBe('Alta transferencia de carga detectada');
            expect(mockNotificationService.sendWarning).toHaveBeenCalled();
        });

        it('should handle notification service errors', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
                id: '1',
                timestamp: '2025-05-04T14:20:22.552Z',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.4,
                    frontRight: 0.4,
                    rearLeft: 0.1,
                    rearRight: 0.1
                }
            }];

            mockStabilityProcessor.calculateLTR.mockReturnValue(0.9);
            mockStabilityProcessor.calculateSSF.mockReturnValue(1.5);
            mockStabilityProcessor.calculateDRS.mockReturnValue(1.2);
            mockStabilityProcessor.calculateRSC.mockReturnValue(1.3);
            mockStabilityProcessor.calculateLoadTransfer.mockReturnValue(0.3);

            mockNotificationService.sendCriticalAlert.mockRejectedValue(new Error('Notification error'));

            // Act & Assert
            await expect(service.analyzeStabilityData(mockMeasurements))
                .rejects
                .toThrow('Notification error');
        });

        it('should handle multiple events for different metrics', async () => {
            // Arrange
            const mockMeasurements: StabilityMeasurement[] = [{
                id: '1',
                timestamp: '2025-05-04T14:20:22.552Z',
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                roll: 0.5,
                pitch: 0.3,
                yaw: 0.1,
                lateralAcc: 0.2,
                verticalAcc: 0.4,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.4,
                    frontRight: 0.4,
                    rearLeft: 0.1,
                    rearRight: 0.1
                }
            }];

            const mockMetrics: StabilityMetrics = {
                ltr: 0.9, // Critical LTR
                ssf: 0.9, // Critical SSF
                drs: 0.8, // Warning DRS
                rsc: 0.8, // Warning RSC
                loadTransfer: 0.3,
                rollAngle: 0.5,
                pitchAngle: 0.3,
                yawAngle: 0.1,
                lateralAcceleration: 0.2,
                verticalAcceleration: 0.4,
                longitudinalAcceleration: 0.6
            };

            mockStabilityProcessor.calculateLTR.mockReturnValue(0.9);
            mockStabilityProcessor.calculateSSF.mockReturnValue(0.9);
            mockStabilityProcessor.calculateDRS.mockReturnValue(0.8);
            mockStabilityProcessor.calculateRSC.mockReturnValue(0.8);
            mockStabilityProcessor.calculateLoadTransfer.mockReturnValue(0.3);

            const mockEvents: StabilityEvent[] = [
                {
                    id: '1',
                    type: EventType.STABILITY,
                    severity: EventSeverity.CRITICAL,
                    status: EventStatus.ACTIVE,
                    message: 'Riesgo crítico de vuelco detectado',
                    timestamp: mockMeasurements[0].timestamp,
                    acknowledged: false,
                    acknowledgedBy: null,
                    acknowledgedAt: null,
                    context: {
                        metrics: mockMetrics
                    }
                },
                {
                    id: '2',
                    type: EventType.STABILITY,
                    severity: EventSeverity.WARNING,
                    status: EventStatus.ACTIVE,
                    message: 'Estabilidad dinámica comprometida',
                    timestamp: mockMeasurements[0].timestamp,
                    acknowledged: false,
                    acknowledgedBy: null,
                    acknowledgedAt: null,
                    context: {
                        metrics: mockMetrics
                    }
                }
            ];

            mockEventService.createEvent
                .mockResolvedValueOnce(mockEvents[0])
                .mockResolvedValueOnce(mockEvents[1]);

            // Act
            const result = await service.analyzeStabilityData(mockMeasurements);

            // Assert
            expect(result.events).toHaveLength(2);
            expect(result.events[0].severity).toBe(EventSeverity.CRITICAL);
            expect(result.events[1].severity).toBe(EventSeverity.WARNING);
            expect(mockNotificationService.sendCriticalAlert).toHaveBeenCalled();
            expect(mockNotificationService.sendWarning).toHaveBeenCalled();
        });
    });
}); 