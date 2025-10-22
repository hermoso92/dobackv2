
import { EventService } from '../../services/EventService';
import { NotificationService } from '../../services/NotificationService';
import { StabilityAnalysisService } from '../../services/StabilityAnalysisService';
import { StabilityProcessor } from '../../services/StabilityProcessor';
import { EventSeverity } from '../../types/enums';

describe('StabilityAnalysisService', () => {
    let service: StabilityAnalysisService;
    let mockStabilityProcessor: jest.Mocked<StabilityProcessor>;
    let mockEventService: jest.Mocked<EventService>;
    let mockNotificationService: jest.Mocked<NotificationService>;
    let prisma: PrismaClient;

    beforeEach(() => {
        mockStabilityProcessor = {
            processData: jest.fn(),
            calculateLTR: jest.fn(),
            calculateSSF: jest.fn(),
            calculateDRS: jest.fn(),
            calculateRSC: jest.fn(),
            calculateLoadTransfer: jest.fn()
        } as any;

        mockEventService = {
            createEvent: jest.fn(),
            handleEvent: jest.fn(),
            handleEvents: jest.fn()
        } as any;

        mockNotificationService = {
            sendCriticalAlert: jest.fn(),
            sendWarningAlert: jest.fn()
        } as any;

        prisma = new PrismaClient();

        service = new StabilityAnalysisService(
            mockStabilityProcessor,
            mockEventService,
            mockNotificationService
        );
    });

    afterEach(async () => {
        await prisma.$disconnect();
    });

    describe('analyzeData', () => {
        it('should analyze stability data and return metrics and events', async () => {
            // Arrange
            const measurements = [
                {
                    id: '1',
                    timestamp: new Date(),
                    vehicleId: 'test-vehicle-id',
                    sessionId: 'test-session-id',
                    roll: 15,
                    pitch: 10,
                    yaw: 5,
                    lateralAcc: 0.8,
                    longitudinalAcc: 0.7,
                    verticalAcc: 0.9,
                    loadDistribution: {
                        frontLeft: 0.25,
                        frontRight: 0.25,
                        rearLeft: 0.25,
                        rearRight: 0.25
                    }
                }
            ];

            const mockMetrics = {
                ltr: 0.8,
                ssf: 1.2,
                drs: 0.9,
                rsc: 1.1,
                loadTransfer: 0.7
            };

            const mockEvent = {
                type: 'stability_warning',
                severity: EventSeverity.HIGH,
                message: 'High risk of rollover detected',
                context: {
                    metrics: mockMetrics
                }
            };

            mockStabilityProcessor.processData.mockResolvedValue(mockMetrics);
            mockEventService.createEvent.mockResolvedValue(mockEvent);

            // Act
            const result = await service.analyzeData(measurements);

            // Assert
            expect(mockStabilityProcessor.processData).toHaveBeenCalledWith(measurements);
            expect(mockEventService.createEvent).toHaveBeenCalled();
            expect(result).toEqual({
                metrics: mockMetrics,
                events: [mockEvent]
            });
        });

        it('should handle empty measurements array', async () => {
            // Arrange
            const measurements: any[] = [];

            mockStabilityProcessor.processData.mockResolvedValue({
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                loadTransfer: 0
            });

            // Act
            const result = await service.analyzeData(measurements);

            // Assert
            expect(mockStabilityProcessor.processData).toHaveBeenCalledWith(measurements);
            expect(mockEventService.createEvent).not.toHaveBeenCalled();
            expect(result).toEqual({
                metrics: {
                    ltr: 0,
                    ssf: 0,
                    drs: 0,
                    rsc: 0,
                    loadTransfer: 0
                },
                events: []
            });
        });

        it('should handle invalid measurements', async () => {
            // Arrange
            const invalidMeasurements = [
                {
                    id: '1',
                    timestamp: new Date(),
                    vehicleId: 'test-vehicle-id',
                    sessionId: 'test-session-id'
                    // Missing required fields
                }
            ];

            mockStabilityProcessor.processData.mockRejectedValue(new Error('Invalid measurements'));

            // Act & Assert
            await expect(service.analyzeData(invalidMeasurements)).rejects.toThrow(
                'Invalid measurements'
            );
        });

        it('should handle service errors', async () => {
            // Arrange
            const measurements = [
                {
                    id: '1',
                    timestamp: new Date(),
                    vehicleId: 'test-vehicle-id',
                    sessionId: 'test-session-id',
                    roll: 15,
                    pitch: 10,
                    yaw: 5,
                    lateralAcc: 0.8,
                    longitudinalAcc: 0.7,
                    verticalAcc: 0.9,
                    loadDistribution: {
                        frontLeft: 0.25,
                        frontRight: 0.25,
                        rearLeft: 0.25,
                        rearRight: 0.25
                    }
                }
            ];

            mockStabilityProcessor.processData.mockRejectedValue(new Error('Service error'));

            // Act & Assert
            await expect(service.analyzeData(measurements)).rejects.toThrow('Service error');
        });

        it('should create critical event for high risk metrics', async () => {
            // Arrange
            const measurements = [
                {
                    id: '1',
                    timestamp: new Date(),
                    vehicleId: 'test-vehicle-id',
                    sessionId: 'test-session-id',
                    roll: 15,
                    pitch: 10,
                    yaw: 5,
                    lateralAcc: 0.8,
                    longitudinalAcc: 0.7,
                    verticalAcc: 0.9,
                    loadDistribution: {
                        frontLeft: 0.25,
                        frontRight: 0.25,
                        rearLeft: 0.25,
                        rearRight: 0.25
                    }
                }
            ];

            const mockMetrics = {
                ltr: 0.9,
                ssf: 0.9,
                drs: 0.8,
                rsc: 0.9,
                loadTransfer: 0.8
            };

            const mockEvent = {
                type: 'stability_warning',
                severity: EventSeverity.CRITICAL,
                message: 'Critical rollover risk detected',
                context: {
                    metrics: mockMetrics
                }
            };

            mockStabilityProcessor.processData.mockResolvedValue(mockMetrics);
            mockEventService.createEvent.mockResolvedValue(mockEvent);

            // Act
            const result = await service.analyzeData(measurements);

            // Assert
            expect(result.events[0].severity).toBe(EventSeverity.CRITICAL);
            expect(result.events[0].message).toBe('Critical rollover risk detected');

            // Verify specific values with toBeCloseTo
            expect(result.metrics.ltr).toBeCloseTo(0.9);
            expect(result.metrics.ssf).toBeCloseTo(0.9);
            expect(result.metrics.drs).toBeCloseTo(0.8);
            expect(result.metrics.rsc).toBeCloseTo(0.9);
            expect(result.metrics.loadTransfer).toBeCloseTo(0.8);
        });

        it('should create warning event for medium risk metrics', async () => {
            // Arrange
            const measurements = [
                {
                    id: '1',
                    timestamp: new Date(),
                    vehicleId: 'test-vehicle-id',
                    sessionId: 'test-session-id',
                    roll: 10,
                    pitch: 8,
                    yaw: 3,
                    lateralAcc: 0.6,
                    longitudinalAcc: 0.5,
                    verticalAcc: 0.7,
                    loadDistribution: {
                        frontLeft: 0.25,
                        frontRight: 0.25,
                        rearLeft: 0.25,
                        rearRight: 0.25
                    }
                }
            ];

            const mockMetrics = {
                ltr: 0.7,
                ssf: 1.3,
                drs: 1.1,
                rsc: 1.1,
                loadTransfer: 0.6
            };

            const mockEvent = {
                type: 'stability_warning',
                severity: EventSeverity.HIGH,
                message: 'High load transfer detected',
                context: {
                    metrics: mockMetrics
                }
            };

            mockStabilityProcessor.processData.mockResolvedValue(mockMetrics);
            mockEventService.createEvent.mockResolvedValue(mockEvent);

            // Act
            const result = await service.analyzeData(measurements);

            // Assert
            expect(result.events[0].severity).toBe(EventSeverity.HIGH);
            expect(result.events[0].message).toBe('High load transfer detected');

            // Verify specific values with toBeCloseTo
            expect(result.metrics.ltr).toBeCloseTo(0.7);
            expect(result.metrics.ssf).toBeCloseTo(1.3);
            expect(result.metrics.drs).toBeCloseTo(1.1);
            expect(result.metrics.rsc).toBeCloseTo(1.1);
            expect(result.metrics.loadTransfer).toBeCloseTo(0.6);
        });
    });

    describe('createOrUpdateSession', () => {
        it('should create a new session', async () => {
            // Arrange
            const sessionData = {
                vehicleId: 'test-vehicle-id',
                startTime: new Date(),
                status: 'ACTIVE'
            };

            jest.spyOn(prisma.session, 'create').mockResolvedValue({
                id: 1,
                ...sessionData,
                endTime: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Act
            const result = await service.createOrUpdateSession(sessionData);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.vehicleId).toBe(sessionData.vehicleId);
            expect(result.status).toBe(sessionData.status);
        });

        it('should update an existing session', async () => {
            // Arrange
            const sessionData = {
                id: 1,
                vehicleId: 'test-vehicle-id',
                startTime: new Date(),
                endTime: new Date(),
                status: 'COMPLETED'
            };

            jest.spyOn(prisma.session, 'update').mockResolvedValue({
                ...sessionData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Act
            const result = await service.createOrUpdateSession(sessionData);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(sessionData.id);
            expect(result.status).toBe(sessionData.status);
            expect(result.endTime).toBeDefined();
        });
    });
});
