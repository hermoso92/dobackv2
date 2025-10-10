import { Request, Response } from 'express';
import { StabilityAnalysisService } from '../../services/StabilityAnalysisService';
import { VehicleValidationService } from '../../services/VehicleValidationService';
import { mockRequest, mockResponse } from '../../test/utils';
import { EventSeverity, UserRole } from '../../types/enums';
import { StabilityUploadController } from '../StabilityUploadController';

describe('StabilityUploadController', () => {
    let controller: StabilityUploadController;
    let mockStabilityService: jest.Mocked<StabilityAnalysisService>;
    let mockVehicleService: jest.Mocked<VehicleValidationService>;

    beforeEach(() => {
        mockStabilityService = {
            analyzeData: jest.fn(),
            createOrUpdateSession: jest.fn()
        } as any;

        mockVehicleService = {
            validateVehicle: jest.fn(),
            validateVehicleForSession: jest.fn()
        } as any;

        controller = new StabilityUploadController(mockStabilityService, mockVehicleService);
    });

    describe('uploadStabilityData', () => {
        it('should successfully upload stability data', async () => {
            // Arrange
            const mockFile = {
                buffer: Buffer.from('test data'),
                originalname: 'test.csv'
            };

            const mockReq = mockRequest({
                file: mockFile,
                body: {
                    vehicleId: 'test-vehicle'
                },
                user: {
                    id: 1,
                    role: UserRole.OPERATOR,
                    organizationId: 1
                }
            });

            const mockRes = mockResponse();

            const mockAnalysisResult = {
                metrics: {
                    averageLTR: 0.8,
                    maxLoadTransfer: 0.9,
                    averageSSF: 1.2,
                    averageRSC: 1.1,
                    averageDRS: 0.95
                },
                events: [
                    {
                        type: 'stability',
                        severity: EventSeverity.HIGH,
                        message: 'High risk of rollover detected',
                        timestamp: new Date(),
                        vehicleId: 'test-vehicle',
                        context: {
                            metrics: {
                                ltr: 0.9,
                                ssf: 1.1,
                                rsc: 1.0,
                                drs: 0.9
                            }
                        }
                    }
                ]
            };

            mockStabilityService.analyzeData.mockResolvedValue(mockAnalysisResult);
            mockVehicleService.validateVehicle.mockResolvedValue(true);

            // Act
            await controller.uploadStabilityData(
                mockReq as Request,
                mockRes as Response,
                jest.fn()
            );

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockAnalysisResult
                })
            );
        });

        it('should return 400 if no file is provided', async () => {
            // Arrange
            const mockReq = mockRequest({
                body: {
                    vehicleId: 'test-vehicle'
                },
                user: {
                    id: 1,
                    role: UserRole.OPERATOR,
                    organizationId: 1
                }
            });

            const mockRes = mockResponse();

            // Act
            await controller.uploadStabilityData(
                mockReq as Request,
                mockRes as Response,
                jest.fn()
            );

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'No file provided'
                })
            );
        });

        it('should return 401 if no token is provided', async () => {
            // Arrange
            const mockReq = mockRequest({
                file: {
                    buffer: Buffer.from('test data'),
                    originalname: 'test.csv'
                },
                body: {
                    vehicleId: 'test-vehicle'
                }
            });

            const mockRes = mockResponse();

            // Act
            await controller.uploadStabilityData(
                mockReq as Request,
                mockRes as Response,
                jest.fn()
            );

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Authentication required'
                })
            );
        });

        it('should return 403 if user does not have required role', async () => {
            // Arrange
            const mockReq = mockRequest({
                file: {
                    buffer: Buffer.from('test data'),
                    originalname: 'test.csv'
                },
                body: {
                    vehicleId: 'test-vehicle'
                },
                user: {
                    id: 1,
                    role: 'guest',
                    organizationId: 1
                }
            });

            const mockRes = mockResponse();

            // Act
            await controller.uploadStabilityData(
                mockReq as Request,
                mockRes as Response,
                jest.fn()
            );

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Insufficient permissions'
                })
            );
        });

        it('should handle file processing errors', async () => {
            // Arrange
            const mockReq = mockRequest({
                file: {
                    buffer: Buffer.from('test data'),
                    originalname: 'test.csv'
                },
                body: {
                    vehicleId: 'test-vehicle'
                },
                user: {
                    id: 1,
                    role: UserRole.OPERATOR,
                    organizationId: 1
                }
            });

            const mockRes = mockResponse();

            mockStabilityService.analyzeData.mockRejectedValue(new Error('Processing error'));
            mockVehicleService.validateVehicle.mockResolvedValue(true);

            // Act
            await controller.uploadStabilityData(
                mockReq as Request,
                mockRes as Response,
                jest.fn()
            );

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Error processing stability data'
                })
            );
        });
    });
});
