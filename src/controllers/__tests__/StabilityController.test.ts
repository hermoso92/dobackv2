import { StabilityMeasurementsRepository } from '../../repositories/StabilityMeasurementsRepository';
import { StabilityAnalysisService } from '../../services/StabilityAnalysisService';
import { StabilityMeasurement } from '../../types/stability';
import { ApiError } from '../../utils/ApiError';
import { StabilityController } from '../StabilityController';

jest.mock('../../services/StabilityAnalysisService');
jest.mock('../../repositories/StabilityMeasurementsRepository');

describe('StabilityController', () => {
    let controller: StabilityController;
    let mockAnalysisService: jest.Mocked<StabilityAnalysisService>;
    let mockMeasurementRepository: jest.Mocked<StabilityMeasurementsRepository>;
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockAnalysisService = new StabilityAnalysisService() as jest.Mocked<StabilityAnalysisService>;
        mockMeasurementRepository = new StabilityMeasurementsRepository({} as any) as jest.Mocked<StabilityMeasurementsRepository>;
        controller = new StabilityController(mockAnalysisService, mockMeasurementRepository);

        mockRequest = {
            params: { sessionId: 'test-session' },
            file: {
                buffer: Buffer.from('test data'),
                originalname: 'test.csv',
                mimetype: 'text/csv'
            }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
            setHeader: jest.fn()
        };

        mockNext = jest.fn();
    });

    describe('uploadData', () => {
        it('should upload and process data successfully', async () => {
            const mockMeasurements: StabilityMeasurement[] = [{
                timestamp: new Date(),
                roll: 5,
                pitch: 2,
                yaw: 0,
                lateralAcc: 0.3,
                verticalAcc: 0.1,
                longitudinalAcc: 0.2,
                loadDistribution: {
                    frontLeft: 1000,
                    frontRight: 1000,
                    rearLeft: 1000,
                    rearRight: 1000
                },
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 0
                }
            }];

            mockMeasurementRepository.processFile.mockResolvedValueOnce(mockMeasurements);
            mockMeasurementRepository.saveBatch.mockResolvedValueOnce();
            mockAnalysisService.analyzeStabilityData.mockResolvedValueOnce({
                metrics: {},
                events: [],
                recommendations: []
            });

            await controller.uploadData(mockRequest, mockResponse);

            expect(mockMeasurementRepository.processFile).toHaveBeenCalledWith(mockRequest.file);
            expect(mockMeasurementRepository.saveBatch).toHaveBeenCalledWith(mockMeasurements);
            expect(mockAnalysisService.analyzeStabilityData).toHaveBeenCalledWith(mockMeasurements);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Object)
            });
        });

        it('should throw error when no file is uploaded', async () => {
            mockRequest.file = undefined;

            await controller.uploadData(mockRequest, mockResponse);

            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        });
    });

    describe('getMetrics', () => {
        it('should get metrics successfully', async () => {
            const mockMeasurements: StabilityMeasurement[] = [{
                timestamp: new Date(),
                roll: 5,
                pitch: 2,
                yaw: 0,
                lateralAcc: 0.3,
                verticalAcc: 0.1,
                longitudinalAcc: 0.2,
                loadDistribution: {
                    frontLeft: 1000,
                    frontRight: 1000,
                    rearLeft: 1000,
                    rearRight: 1000
                },
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 0
                }
            }];

            mockMeasurementRepository.findBySession.mockResolvedValueOnce(mockMeasurements);
            mockAnalysisService.analyzeStabilityData.mockResolvedValueOnce({
                metrics: { ltr: 0.5 },
                events: [],
                recommendations: []
            });

            await controller.getMetrics(mockRequest, mockResponse);

            expect(mockMeasurementRepository.findBySession).toHaveBeenCalledWith('test-session');
            expect(mockAnalysisService.analyzeStabilityData).toHaveBeenCalledWith(mockMeasurements);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: { ltr: 0.5 }
            });
        });
    });

    describe('getEvents', () => {
        it('should get events successfully', async () => {
            const mockMeasurements: StabilityMeasurement[] = [{
                timestamp: new Date(),
                roll: 5,
                pitch: 2,
                yaw: 0,
                lateralAcc: 0.3,
                verticalAcc: 0.1,
                longitudinalAcc: 0.2,
                loadDistribution: {
                    frontLeft: 1000,
                    frontRight: 1000,
                    rearLeft: 1000,
                    rearRight: 1000
                },
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 0
                }
            }];

            const mockEvents = [{
                type: 'warning',
                timestamp: new Date(),
                description: 'Test event',
                metrics: {}
            }];

            mockMeasurementRepository.findBySession.mockResolvedValueOnce(mockMeasurements);
            mockAnalysisService.analyzeStabilityData.mockResolvedValueOnce({
                metrics: {},
                events: mockEvents,
                recommendations: []
            });

            await controller.getEvents(mockRequest, mockResponse);

            expect(mockMeasurementRepository.findBySession).toHaveBeenCalledWith('test-session');
            expect(mockAnalysisService.analyzeStabilityData).toHaveBeenCalledWith(mockMeasurements);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockEvents
            });
        });
    });

    describe('generateAnalysis', () => {
        it('should generate complete analysis successfully', async () => {
            const mockMeasurements: StabilityMeasurement[] = [{
                timestamp: new Date(),
                roll: 5,
                pitch: 2,
                yaw: 0,
                lateralAcc: 0.3,
                verticalAcc: 0.1,
                longitudinalAcc: 0.2,
                loadDistribution: {
                    frontLeft: 1000,
                    frontRight: 1000,
                    rearLeft: 1000,
                    rearRight: 1000
                },
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 0
                }
            }];

            const mockAnalysis = {
                metrics: { ltr: 0.5 },
                events: [{
                    type: 'warning',
                    timestamp: new Date(),
                    description: 'Test event',
                    metrics: {}
                }],
                recommendations: [{
                    type: 'immediate',
                    priority: 'high',
                    message: 'Test recommendation',
                    action: 'Test action'
                }]
            };

            mockMeasurementRepository.findBySession.mockResolvedValueOnce(mockMeasurements);
            mockAnalysisService.analyzeStabilityData.mockResolvedValueOnce(mockAnalysis);

            await controller.generateAnalysis(mockRequest, mockResponse);

            expect(mockMeasurementRepository.findBySession).toHaveBeenCalledWith('test-session');
            expect(mockAnalysisService.analyzeStabilityData).toHaveBeenCalledWith(mockMeasurements);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    metrics: mockAnalysis.metrics,
                    events: mockAnalysis.events,
                    recommendations: expect.any(Array)
                }
            });
        });
    });

    describe('exportCSV', () => {
        it('should export data as CSV successfully', async () => {
            const mockMeasurements: StabilityMeasurement[] = [{
                timestamp: new Date('2024-01-01T00:00:00Z'),
                roll: 5,
                pitch: 2,
                yaw: 0,
                lateralAcc: 0.3,
                verticalAcc: 0.1,
                longitudinalAcc: 0.2,
                loadDistribution: {
                    frontLeft: 1000,
                    frontRight: 1000,
                    rearLeft: 1000,
                    rearRight: 1000
                },
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 0
                }
            }];

            mockMeasurementRepository.findBySession.mockResolvedValueOnce(mockMeasurements);

            await controller.exportCSV(mockRequest, mockResponse);

            expect(mockMeasurementRepository.findBySession).toHaveBeenCalledWith('test-session');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename=stability-test-session.csv'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith(expect.any(String));
        });
    });

    describe('exportJSON', () => {
        it('should export data as JSON successfully', async () => {
            const mockMeasurements: StabilityMeasurement[] = [{
                timestamp: new Date(),
                roll: 5,
                pitch: 2,
                yaw: 0,
                lateralAcc: 0.3,
                verticalAcc: 0.1,
                longitudinalAcc: 0.2,
                loadDistribution: {
                    frontLeft: 1000,
                    frontRight: 1000,
                    rearLeft: 1000,
                    rearRight: 1000
                },
                location: {
                    latitude: 40.4168,
                    longitude: -3.7038,
                    altitude: 0
                }
            }];

            const mockAnalysis = {
                metrics: { ltr: 0.5 },
                events: [],
                recommendations: []
            };

            mockMeasurementRepository.findBySession.mockResolvedValueOnce(mockMeasurements);
            mockAnalysisService.analyzeStabilityData.mockResolvedValueOnce(mockAnalysis);

            await controller.exportJSON(mockRequest, mockResponse);

            expect(mockMeasurementRepository.findBySession).toHaveBeenCalledWith('test-session');
            expect(mockAnalysisService.analyzeStabilityData).toHaveBeenCalledWith(mockMeasurements);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    measurements: mockMeasurements,
                    analysis: mockAnalysis
                }
            });
        });
    });
}); 