import { Request, Response } from 'express';
import { AuditService } from '../../services/AuditService';
import { EventService } from '../../services/EventService';
import { NotificationService } from '../../services/NotificationService';
import { SessionService } from '../../services/SessionService';
import { StabilityAnalysisService } from '../../services/StabilityAnalysisService';
import { VehicleValidationService } from '../../services/VehicleValidationService';
import { StabilityUploadController } from '../StabilityUploadController';

jest.mock('../../services/StabilityAnalysisService');
jest.mock('../../services/EventService');
jest.mock('../../services/NotificationService');
jest.mock('../../services/StabilityProcessor');
jest.mock('../../services/SessionService');
jest.mock('../../services/VehicleValidationService');
jest.mock('../../services/AuditService');

describe('StabilityUploadController', () => {
    let controller: StabilityUploadController;
    let mockStabilityAnalysisService: jest.Mocked<StabilityAnalysisService>;
    let mockSessionService: jest.Mocked<SessionService>;
    let mockVehicleValidationService: jest.Mocked<VehicleValidationService>;
    let mockAuditService: jest.Mocked<AuditService>;
    let mockEventService: jest.Mocked<EventService>;
    let mockNotificationService: jest.Mocked<NotificationService>;
    let mockRequest: Request;
    let mockResponse: Response;

    beforeEach(() => {
        mockStabilityAnalysisService = {
            analyzeStabilityData: jest.fn().mockResolvedValue({
                metrics: {
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
                },
                events: []
            })
        } as any;

        mockSessionService = {
            validateSession: jest.fn().mockResolvedValue(true)
        } as any;

        mockVehicleValidationService = {
            validateVehicle: jest.fn().mockResolvedValue(true)
        } as any;

        mockAuditService = {
            logAction: jest.fn().mockResolvedValue(undefined)
        } as any;

        mockEventService = {
            createEvent: jest.fn().mockResolvedValue(undefined)
        } as any;

        mockNotificationService = {
            sendCriticalAlert: jest.fn().mockResolvedValue(undefined),
            sendWarning: jest.fn().mockResolvedValue(undefined)
        } as any;

        controller = new StabilityUploadController(
            mockStabilityAnalysisService,
            mockSessionService,
            mockVehicleValidationService,
            mockAuditService,
            mockEventService,
            mockNotificationService
        );

        mockRequest = {
            body: {
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id',
                measurements: [
                    {
                        timestamp: new Date().toISOString(),
                        roll: 0.1,
                        pitch: 0.2,
                        yaw: 0.3,
                        lateralAcc: 0.4,
                        verticalAcc: 0.5,
                        longitudinalAcc: 0.6,
                        loadDistribution: {
                            frontLeft: 0.25,
                            frontRight: 0.25,
                            rearLeft: 0.25,
                            rearRight: 0.25
                        }
                    }
                ]
            },
            file: {
                fieldname: 'file',
                originalname: 'test.csv',
                encoding: '7bit',
                mimetype: 'text/csv',
                buffer: Buffer.from('test'),
                size: 4
            } as Express.Multer.File,
            user: {
                id: 1,
                role: 'operator'
            }
        } as unknown as Request;

        const mockJson = jest.fn();
        const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockResponse = {
            status: mockStatus,
            json: mockJson
        } as unknown as Response;
    });

    describe('uploadStabilityData', () => {
        it('should successfully upload stability data', async () => {
            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Stability data uploaded successfully',
                    data: expect.any(Object)
                })
            );
            expect(mockAuditService.logAction).toHaveBeenCalled();
        });

        it('should return 400 if no file is provided', async () => {
            // Arrange
            mockRequest.file = undefined;

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No file uploaded'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should return 400 if vehicle validation fails', async () => {
            // Arrange
            mockVehicleValidationService.validateVehicle.mockResolvedValue(false);

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid vehicle'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should return 400 if session validation fails', async () => {
            // Arrange
            mockVehicleValidationService.validateVehicle.mockResolvedValue(true);
            mockSessionService.validateSession.mockResolvedValue(false);

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid session'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should return 500 if stability analysis fails', async () => {
            // Arrange
            mockVehicleValidationService.validateVehicle.mockResolvedValue(true);
            mockSessionService.validateSession.mockResolvedValue(true);
            mockStabilityAnalysisService.analyzeStabilityData.mockRejectedValue(new Error('Analysis error'));

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error analyzing stability data'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should handle invalid file type', async () => {
            // Arrange
            mockRequest.file = {
                ...mockRequest.file,
                mimetype: 'application/json'
            } as Express.Multer.File;

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid file type. Only CSV files are allowed'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should handle missing measurements in request body', async () => {
            // Arrange
            mockRequest.body = {
                vehicleId: 'test-vehicle-id',
                sessionId: 'test-session-id'
            };

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No measurements provided'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should handle invalid measurement data', async () => {
            // Arrange
            mockRequest.body.measurements = [{
                timestamp: new Date().toISOString(),
                roll: 'invalid', // Invalid type
                pitch: 0.2,
                yaw: 0.3,
                lateralAcc: 0.4,
                verticalAcc: 0.5,
                longitudinalAcc: 0.6,
                loadDistribution: {
                    frontLeft: 0.25,
                    frontRight: 0.25,
                    rearLeft: 0.25,
                    rearRight: 0.25
                }
            }];

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid measurement data'
            });
            expect(mockAuditService.logAction).not.toHaveBeenCalled();
        });

        it('should handle audit service errors', async () => {
            // Arrange
            mockVehicleValidationService.validateVehicle.mockResolvedValue(true);
            mockSessionService.validateSession.mockResolvedValue(true);
            mockStabilityAnalysisService.analyzeStabilityData.mockResolvedValue({
                metrics: {
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
                },
                events: []
            });
            mockAuditService.logAction.mockRejectedValue(new Error('Audit error'));

            // Act
            await controller.uploadStabilityData(mockRequest, mockResponse);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error logging audit action'
            });
        });
    });
}); 