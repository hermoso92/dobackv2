import { VehicleService } from '../services/VehicleService';
import { logger } from '../utils/logger';

export class VehicleController {
    private vehicleService: VehicleService;

    constructor() {
        this.vehicleService = new VehicleService();
    }

    public createVehicle = async (req: Request, res: Response) => {
        try {
            logger.info('Acceso a ruta de vehículos: POST /', { timestamp: new Date().toLocaleTimeString() });

            if (!req.user?.organizationId) {
                logger.warn('Intento de crear vehículo sin organización');
                res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
                return;
            }

            const vehicleData = {
                name: req.body.name,
                model: req.body.model,
                licensePlate: req.body.licensePlate,
                brand: req.body.brand,
                type: req.body.type,
                status: req.body.status,
                organizationId: req.user.organizationId
            };

            logger.info('Creando nuevo vehículo', { data: vehicleData });

            const vehicle = await this.vehicleService.createVehicle(vehicleData);

            res.status(201).json({
                success: true,
                message: 'Vehículo creado exitosamente',
                data: vehicle
            });
        } catch (error) {
            logger.error('Error creating vehicle', { error });
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al crear el vehículo'
            });
        }
    };
} 