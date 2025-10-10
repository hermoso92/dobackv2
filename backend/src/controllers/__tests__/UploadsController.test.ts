import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataValidationService } from '../../services/DataValidationService';
import { FileWatcherService } from '../../services/FileWatcherService';
import { UploadsController } from '../UploadsController';

// Mock de servicios
vi.mock('../../services/FileWatcherService');
vi.mock('../../services/DataValidationService');

describe('UploadsController', () => {
    let uploadsController: UploadsController;
    let mockFileWatcherService: any;
    let mockDataValidationService: any;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockFileWatcherService = {
            processFile: vi.fn(),
            validateFile: vi.fn(),
            getFileStatus: vi.fn(),
            getProcessingQueue: vi.fn()
        };

        mockDataValidationService = {
            validateStabilityData: vi.fn(),
            validateTelemetryData: vi.fn(),
            validateFileFormat: vi.fn()
        };

        (FileWatcherService as any).mockImplementation(() => mockFileWatcherService);
        (DataValidationService as any).mockImplementation(() => mockDataValidationService);

        uploadsController = new UploadsController();

        mockRequest = {
            body: {},
            params: {},
            query: {},
            file: undefined,
            files: undefined,
            user: { id: 1, organizationId: 1, role: 'ADMIN' },
            orgId: 1
        };

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        vi.clearAllMocks();
    });

    describe('uploadFile', () => {
        it('debe subir archivo exitosamente', async () => {
            // Arrange
            const mockFile = {
                fieldname: 'file',
                originalname: 'test_stability.txt',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('test data'),
                destination: '/uploads',
                filename: 'test_stability.txt',
                path: '/uploads/test_stability.txt'
            };

            const expectedResult = {
                id: 1,
                filename: 'test_stability.txt',
                originalName: 'test_stability.txt',
                size: 1024,
                status: 'PROCESSING',
                organizationId: 1,
                uploadedBy: 1
            };

            mockRequest.file = mockFile;
            mockDataValidationService.validateFileFormat.mockResolvedValue(true);
            mockFileWatcherService.processFile.mockResolvedValue(expectedResult);

            // Act
            await uploadsController.uploadFile(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockDataValidationService.validateFileFormat).toHaveBeenCalledWith(mockFile);
            expect(mockFileWatcherService.processFile).toHaveBeenCalledWith(mockFile, 1, 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedResult
            });
        });

        it('debe manejar error cuando no se proporciona archivo', async () => {
            // Arrange
            mockRequest.file = undefined;

            // Act
            await uploadsController.uploadFile(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'No se proporcionó archivo'
            });
        });

        it('debe manejar error de formato de archivo inválido', async () => {
            // Arrange
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.txt',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('test data')
            };

            mockRequest.file = mockFile;
            mockDataValidationService.validateFileFormat.mockResolvedValue(false);

            // Act
            await uploadsController.uploadFile(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Formato de archivo no válido'
            });
        });

        it('debe manejar error durante el procesamiento', async () => {
            // Arrange
            const mockFile = {
                fieldname: 'file',
                originalname: 'test_stability.txt',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('test data')
            };

            mockRequest.file = mockFile;
            mockDataValidationService.validateFileFormat.mockResolvedValue(true);
            mockFileWatcherService.processFile.mockRejectedValue(new Error('Error de procesamiento'));

            // Act
            await uploadsController.uploadFile(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Error interno del servidor'
            });
        });
    });

    describe('uploadMultipleFiles', () => {
        it('debe subir múltiples archivos exitosamente', async () => {
            // Arrange
            const mockFiles = [
                {
                    fieldname: 'files',
                    originalname: 'test1.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    size: 1024,
                    buffer: Buffer.from('test data 1')
                },
                {
                    fieldname: 'files',
                    originalname: 'test2.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    size: 2048,
                    buffer: Buffer.from('test data 2')
                }
            ];

            const expectedResults = [
                {
                    id: 1,
                    filename: 'test1.txt',
                    status: 'PROCESSING'
                },
                {
                    id: 2,
                    filename: 'test2.txt',
                    status: 'PROCESSING'
                }
            ];

            mockRequest.files = mockFiles;
            mockDataValidationService.validateFileFormat.mockResolvedValue(true);
            mockFileWatcherService.processFile
                .mockResolvedValueOnce(expectedResults[0])
                .mockResolvedValueOnce(expectedResults[1]);

            // Act
            await uploadsController.uploadMultipleFiles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockDataValidationService.validateFileFormat).toHaveBeenCalledTimes(2);
            expect(mockFileWatcherService.processFile).toHaveBeenCalledTimes(2);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedResults
            });
        });

        it('debe manejar error cuando no se proporcionan archivos', async () => {
            // Arrange
            mockRequest.files = undefined;

            // Act
            await uploadsController.uploadMultipleFiles(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'No se proporcionaron archivos'
            });
        });
    });

    describe('getFileStatus', () => {
        it('debe obtener estado de archivo exitosamente', async () => {
            // Arrange
            const fileId = '1';
            const expectedStatus = {
                id: 1,
                filename: 'test_stability.txt',
                status: 'COMPLETED',
                progress: 100,
                processedAt: new Date(),
                error: null
            };

            mockRequest.params = { id: fileId };
            mockFileWatcherService.getFileStatus.mockResolvedValue(expectedStatus);

            // Act
            await uploadsController.getFileStatus(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFileWatcherService.getFileStatus).toHaveBeenCalledWith(parseInt(fileId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedStatus
            });
        });

        it('debe manejar archivo no encontrado', async () => {
            // Arrange
            const fileId = '999';
            mockRequest.params = { id: fileId };
            mockFileWatcherService.getFileStatus.mockResolvedValue(null);

            // Act
            await uploadsController.getFileStatus(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Archivo no encontrado'
            });
        });
    });

    describe('getProcessingQueue', () => {
        it('debe obtener cola de procesamiento exitosamente', async () => {
            // Arrange
            const expectedQueue = [
                {
                    id: 1,
                    filename: 'test1.txt',
                    status: 'PENDING',
                    priority: 1,
                    createdAt: new Date()
                },
                {
                    id: 2,
                    filename: 'test2.txt',
                    status: 'PROCESSING',
                    priority: 2,
                    createdAt: new Date()
                }
            ];

            mockFileWatcherService.getProcessingQueue.mockResolvedValue(expectedQueue);

            // Act
            await uploadsController.getProcessingQueue(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFileWatcherService.getProcessingQueue).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedQueue
            });
        });
    });

    describe('validateFile', () => {
        it('debe validar archivo exitosamente', async () => {
            // Arrange
            const mockFile = {
                fieldname: 'file',
                originalname: 'test_stability.txt',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('test data')
            };

            const expectedValidation = {
                isValid: true,
                type: 'STABILITY',
                vehicleId: 'VH001',
                sessionDate: '2024-01-15',
                warnings: []
            };

            mockRequest.file = mockFile;
            mockDataValidationService.validateFileFormat.mockResolvedValue(true);
            mockDataValidationService.validateStabilityData.mockResolvedValue(expectedValidation);

            // Act
            await uploadsController.validateFile(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockDataValidationService.validateFileFormat).toHaveBeenCalledWith(mockFile);
            expect(mockDataValidationService.validateStabilityData).toHaveBeenCalledWith(mockFile);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedValidation
            });
        });

        it('debe manejar archivo inválido', async () => {
            // Arrange
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.txt',
                encoding: '7bit',
                mimetype: 'text/plain',
                size: 1024,
                buffer: Buffer.from('invalid data')
            };

            const expectedValidation = {
                isValid: false,
                errors: ['Formato de archivo no válido'],
                warnings: []
            };

            mockRequest.file = mockFile;
            mockDataValidationService.validateFileFormat.mockResolvedValue(false);

            // Act
            await uploadsController.validateFile(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedValidation
            });
        });
    });

    describe('retryProcessing', () => {
        it('debe reintentar procesamiento exitosamente', async () => {
            // Arrange
            const fileId = '1';
            const expectedResult = {
                id: 1,
                filename: 'test_stability.txt',
                status: 'PROCESSING'
            };

            mockRequest.params = { id: fileId };
            mockFileWatcherService.processFile.mockResolvedValue(expectedResult);

            // Act
            await uploadsController.retryProcessing(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFileWatcherService.processFile).toHaveBeenCalledWith(
                expect.objectContaining({ id: parseInt(fileId) }),
                1,
                1
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedResult
            });
        });
    });

    describe('cancelProcessing', () => {
        it('debe cancelar procesamiento exitosamente', async () => {
            // Arrange
            const fileId = '1';
            mockRequest.params = { id: fileId };
            mockFileWatcherService.cancelProcessing = vi.fn().mockResolvedValue(true);

            // Act
            await uploadsController.cancelProcessing(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFileWatcherService.cancelProcessing).toHaveBeenCalledWith(parseInt(fileId), 1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Procesamiento cancelado exitosamente'
            });
        });
    });
});
