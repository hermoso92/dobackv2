import { TelemetryService } from '../services/TelemetryService';
import { logger } from '../utils/logger';

interface TelemetryRequestBody {
    vehicleId: string;
    canData: string[][];
    gpsData: string[][];
}

interface TelemetryParams {
    sessionId?: string;
    vehicleId?: string;
}

interface TelemetryQuery {
    startTime?: string;
    endTime?: string;
}

export class TelemetryController {
    private telemetryService: TelemetryService;

    constructor() {
        this.telemetryService = new TelemetryService();
    }

    public async processTelemetryData(req: Request, res: Response): Promise<void> {
        try {
            const body = req.body as unknown as TelemetryRequestBody;
            const { vehicleId, canData, gpsData } = body;

            if (!vehicleId || !canData || !gpsData) {
                res.status(400).json({
                    success: false,
                    error: 'Faltan datos requeridos'
                });
                return;
            }

            const result = await this.telemetryService.processTelemetryData(
                vehicleId,
                canData,
                gpsData
            );

            if (!result.success) {
                res.status(400).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            logger.error('Error en el controlador de telemetría', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    public async getSession(req: Request, res: Response): Promise<void> {
        try {
            const params = req.params as unknown as TelemetryParams;
            const { sessionId } = params;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'ID de sesión requerido'
                });
                return;
            }

            const result = await this.telemetryService.getSession(sessionId);

            if (!result.success) {
                res.status(404).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            logger.error('Error recuperando sesión de telemetría', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    public async getVehicleSessions(req: Request, res: Response): Promise<void> {
        try {
            const params = req.params as unknown as TelemetryParams;
            const query = req.query as unknown as TelemetryQuery;
            const { vehicleId } = params;
            const { startTime, endTime } = query;

            if (!vehicleId || !startTime || !endTime) {
                res.status(400).json({
                    success: false,
                    error: 'Parámetros requeridos faltantes'
                });
                return;
            }

            const result = await this.telemetryService.getVehicleSessions(
                vehicleId,
                new Date(startTime),
                new Date(endTime)
            );

            if (!result.success) {
                res.status(404).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error) {
            logger.error('Error recuperando sesiones de telemetría', { error });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
} 