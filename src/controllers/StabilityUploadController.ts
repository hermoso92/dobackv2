import { Request, Response } from 'express';
import { AuditService } from '../services/AuditService';
import { EventService } from '../services/EventService';
import { NotificationService } from '../services/NotificationService';
import { SessionService } from '../services/SessionService';
import { StabilityAnalysisService } from '../services/StabilityAnalysisService';
import { VehicleValidationService } from '../services/VehicleValidationService';
import { logger } from '../utils/logger';

export interface RequestWithUser extends Request {
    user?: {
        id: number;
        role: string;
    };
}

export class StabilityUploadController {
    constructor(
        private readonly stabilityAnalysisService: StabilityAnalysisService,
        private readonly sessionService: SessionService,
        private readonly vehicleValidationService: VehicleValidationService,
        private readonly auditService: AuditService,
        private readonly eventService: EventService,
        private readonly notificationService: NotificationService
    ) {}

    async uploadStabilityData(req: RequestWithUser, res: Response): Promise<void> {
        try {
            // Validar archivo
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
                return;
            }

            // Validar autenticación
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            // Validar permisos
            if (req.user.role !== 'operator') {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
                return;
            }

            // Procesar datos
            const result = await this.stabilityAnalysisService.analyzeStabilityData(JSON.parse(req.file.buffer.toString()));

            // Registrar acción
            await this.auditService.logAction({
                id: Date.now(),
                timestamp: new Date().toISOString(),
                userId: req.user.id,
                organizationId: 1,
                actionType: 'stability_data_upload',
                resourceType: 'stability_data',
                resourceId: req.file.originalname,
                requestMethod: req.method,
                requestPath: req.path,
                requestBody: {
                    filename: req.file.originalname,
                    size: req.file.size
                },
                statusCode: 201,
                ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '0.0.0.0',
                userAgent: req.headers['user-agent'] || '',
                createdAt: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Stability data uploaded successfully',
                data: result
            });
        } catch (error) {
            logger.error('Error uploading stability data', { error });

            res.status(500).json({
                success: false,
                message: 'Error processing stability data'
            });
        }
    }
} 