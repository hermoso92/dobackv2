import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { StabilityMeasurementRepository } from '../repositories/StabilityMeasurementRepository';
import { StabilitySessionRepository } from '../repositories/StabilitySessionRepository';
import { StabilityAnalysisService } from '../services/StabilityAnalysisService';
import { VehicleValidationService } from '../services/VehicleValidationService';
import { StabilityMeasurements } from '../types/stability';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const uploadSchema = z.object({
    file: z.any().refine((file) => file && file.buffer, {
        message: 'File is required'
    })
});

export class StabilityUploadController {
    constructor(
        private readonly stabilityAnalysisService: StabilityAnalysisService,
        private readonly measurementRepository: StabilityMeasurementRepository,
        private readonly sessionRepository: StabilitySessionRepository,
        private readonly vehicleValidationService: VehicleValidationService
    ) {}

    public async uploadStabilityData(req: Request, res: Response): Promise<void> {
        try {
            logger.info('Iniciando subida de archivo de estabilidad', {
                filename: req.file?.originalname,
                size: req.file?.size
            });

            if (!req.file) {
                logger.warn('Intento de subida sin archivo');
                res.status(400).json({
                    success: false,
                    error: 'No se ha proporcionado ningún archivo'
                });
                return;
            }

            if (!req.user?.id) {
                logger.warn('Intento de subida sin autenticación');
                res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
                return;
            }

            // Validar el tipo de archivo
            const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
            if (!['txt', 'csv'].includes(fileExtension || '')) {
                logger.warn('Intento de subida de archivo con formato no permitido', {
                    filename: req.file.originalname
                });
                res.status(400).json({
                    success: false,
                    error: 'Solo se permiten archivos .txt y .csv'
                });
                return;
            }

            const fileContent = req.file.buffer.toString('utf-8');
            logger.info('Procesando archivo de estabilidad', {
                filename: req.file.originalname,
                size: req.file.size
            });

            // Extraer el vehicleId del archivo
            const rawVehicleId = this.extractVehicleIdFromFile(fileContent);
            if (!rawVehicleId || rawVehicleId.trim() === '') {
                logger.warn('No se pudo extraer el ID del vehículo del archivo');
                res.status(400).json({
                    success: false,
                    error: 'No se pudo extraer el ID del vehículo del archivo'
                });
                return;
            }

            const vehicleId = rawVehicleId.trim() as string;

            try {
                // Verificar si el vehículo existe
                const vehicle = await prisma.vehicle.findFirst({
                    where: {
                        name: vehicleId,
                        organizationId: req.user.organizationId
                    }
                });

                if (!vehicle) {
                    logger.warn('Vehículo no encontrado en la base de datos', { vehicleId });
                    res.status(404).json({
                        success: false,
                        error: `El vehículo ${vehicleId} no está registrado en la base de datos`
                    });
                    return;
                }

                // Validar el vehículo
                const validatedVehicle = await this.vehicleValidationService.validateVehicle(
                    vehicleId,
                    req.user.organizationId
                );

                // Parse the file content
                const measurements = this.stabilityAnalysisService.parseStabilityFile(fileContent);
                if (!measurements || measurements.length === 0) {
                    logger.warn('No se encontraron mediciones válidas en el archivo');
                    res.status(400).json({
                        success: false,
                        error: 'No se encontraron mediciones válidas en el archivo'
                    });
                    return;
                }

                // Analyze the data
                const { metrics, events } = await this.stabilityAnalysisService.analyzeData(
                    measurements
                );

                // Create or update session with the provided sessionId
                const session = await this.stabilityAnalysisService.createOrUpdateSession({
                    vehicleId: validatedVehicle.id,
                    sessionId: randomUUID(),
                    metrics,
                    events,
                    measurements
                });

                // Get the latest session number for this vehicle
                const latestSession = await prisma.session.findFirst({
                    where: { vehicleId: validatedVehicle.id },
                    orderBy: { sessionNumber: 'desc' }
                });

                const sessionNumber = latestSession ? latestSession.sessionNumber + 1 : 1;

                // Get start and end times from measurements
                const startTime = new Date(measurements[0].timestamp);
                const endTime = new Date(measurements[measurements.length - 1].timestamp);

                // Save session to database
                await this.sessionRepository.createSession({
                    id: session.id,
                    vehicleId: validatedVehicle.id,
                    type: 'ROUTINE',
                    status: 'ACTIVE',
                    startTime,
                    endTime,
                    userId: req.user.id,
                    sessionNumber,
                    sequence: 1
                });

                // Save measurements to database
                await this.measurementRepository.createMeasurements(
                    measurements.map((m) => ({ ...m, sessionId: session.id }))
                );

                logger.info('Datos de estabilidad procesados exitosamente', {
                    sessionId: session.id,
                    measurementsCount: measurements.length,
                    eventsCount: events.length
                });

                res.status(200).json({
                    success: true,
                    message: 'Datos de estabilidad subidos y procesados exitosamente',
                    data: session
                });
            } catch (error) {
                logger.error('Error procesando datos de estabilidad', { error });
                res.status(400).json({
                    success: false,
                    error: 'Error procesando datos de estabilidad',
                    details: error instanceof Error ? error.message : 'Error desconocido'
                });
            }
        } catch (error) {
            logger.error('Error en uploadStabilityData', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    private extractVehicleIdFromFile(content: string): string | null {
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('ESTABILIDAD;')) {
                const parts = line.split(';');
                if (parts.length >= 3) {
                    const id = parts[2].trim();
                    return id || null;
                }
            }
        }
        return null;
    }

    private async processFile(
        buffer: Buffer,
        vehicleId: string,
        sessionId?: string
    ): Promise<StabilityMeasurements[]> {
        const content = buffer.toString('utf-8');
        return this.stabilityAnalysisService.parseStabilityFile(content);
    }
}
