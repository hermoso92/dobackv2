import { Request, Response } from 'express';
import { CreateVehicleDto } from '../dtos/VehicleDto';
import { VehicleService } from '../services/VehicleService';
import { logger } from '../utils/logger';

export class VehicleController {
    private vehicleService: VehicleService;

    constructor() {
        this.vehicleService = new VehicleService();
    }

    public getVehicles = async (req: Request, res: Response) => {
        try {
            const organizationId = req.user?.organizationId;
            const userRole = req.user?.role;

            // Para usuarios ADMIN sin organización, devolver datos de prueba
            if (!organizationId && userRole === 'ADMIN') {
                logger.info('Usuario ADMIN sin organización - devolviendo datos de prueba', {
                    organizationId,
                    userRole,
                    userId: req.user?.id
                });
                const mockVehicles = [
                    {
                        id: 'mock-1',
                        name: 'Vehículo Demo 1',
                        plate: 'DEM-001',
                        model: 'Ford Transit',
                        brand: 'Ford',
                        type: 'CAR',
                        status: 'ACTIVE',
                        organizationId: null
                    },
                    {
                        id: 'mock-2',
                        name: 'Vehículo Demo 2',
                        plate: 'DEM-002',
                        model: 'Volkswagen Crafter',
                        brand: 'Volkswagen',
                        type: 'TRUCK',
                        status: 'ACTIVE',
                        organizationId: null
                    }
                ];

                return res.json({
                    success: true,
                    data: mockVehicles
                });
            }

            if (!organizationId) {
                logger.warn('Intento de acceso a vehículos sin organización', {
                    userId: req.user?.id,
                    role: req.user?.role
                });
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            logger.info('Obteniendo vehículos', { organizationId });
            const vehicles = await this.vehicleService.getVehicles(organizationId);
            logger.info(`Se obtuvieron ${vehicles.length} vehículos`);

            const vehiclesWithPlate = vehicles.map((vehicle) => ({
                ...vehicle,
                plate: vehicle.licensePlate || 'Sin matrícula'
            }));

            res.json({
                success: true,
                data: vehiclesWithPlate
            });
        } catch (error) {
            logger.error('Error al obtener vehículos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener vehículos'
            });
        }
    };

    public getVehicleById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const vehicle = await this.vehicleService.getVehicleDetails(id);

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }

            if (vehicle.organizationId !== organizationId) {
                logger.warn(`Intento de acceso no autorizado al vehículo ${id}`);
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            res.json({
                success: true,
                data: vehicle
            });
        } catch (error) {
            logger.error('Error al obtener vehículo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener vehículo'
            });
        }
    };

    public createVehicle = async (req: Request, res: Response) => {
        try {
            logger.info('Acceso a ruta de vehículos: POST /', {
                timestamp: new Date().toLocaleTimeString()
            });

            if (!req.user?.organizationId) {
                logger.warn('Intento de crear vehículo sin organización');
                res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
                return;
            }

            const vehicleData: CreateVehicleDto = {
                name: req.body.name,
                model: req.body.model,
                licensePlate: req.body.licensePlate || req.body.plate,
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

    public updateVehicle = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { plate, ...restData } = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de actualizar vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            // Verificar que el vehículo pertenece a la organización
            const existingVehicle = await this.vehicleService.getVehicleDetails(id);
            if (!existingVehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }

            if (existingVehicle.organizationId !== organizationId) {
                logger.warn(`Intento de actualizar vehículo no autorizado: ${id}`);
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const vehicle = await this.vehicleService.updateVehicle(id, {
                ...restData,
                licensePlate: plate
            });

            res.json({
                success: true,
                data: vehicle
            });
        } catch (error) {
            logger.error('Error updating vehicle', { error });
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    };

    public deleteVehicle = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de eliminar vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            // Verificar que el vehículo pertenece a la organización
            const existingVehicle = await this.vehicleService.getVehicleDetails(id);
            if (!existingVehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }

            if (existingVehicle.organizationId !== organizationId) {
                logger.warn(`Intento de eliminar vehículo no autorizado: ${id}`);
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            await this.vehicleService.deleteVehicle(id);

            res.json({
                success: true,
                message: 'Vehículo eliminado correctamente'
            });
        } catch (error) {
            logger.error('Error deleting vehicle', { error });
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    };

    public getVehicleStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a estado de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const status = await this.vehicleService.getVehicleStatus(id);
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Error getting vehicle status', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener el estado del vehículo'
            });
        }
    };

    public getVehicleTelemetry = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const telemetry = await this.vehicleService.getVehicleTelemetry(id);

            res.json({
                success: true,
                data: telemetry
            });
        } catch (error) {
            logger.error('Error getting vehicle telemetry', { error });
            throw error;
        }
    };

    public getVehicleStability = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const stability = await this.vehicleService.getVehicleStability(id);

            res.json({
                success: true,
                data: stability
            });
        } catch (error) {
            logger.error('Error getting vehicle stability', { error });
            throw error;
        }
    };

    public getVehicleEvents = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a eventos de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const events = await this.vehicleService.getVehicleEvents(id);
            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            logger.error('Error getting vehicle events', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener los eventos del vehículo'
            });
        }
    };

    public getVehicleSessions = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a sesiones de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await this.vehicleService.getVehicleDetails(id);
            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }

            if (vehicle.organizationId !== organizationId) {
                logger.warn(`Intento de acceso no autorizado a sesiones del vehículo ${id}`);
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }

            const sessions = await this.vehicleService.getVehicleSessions(id, {
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined
            });

            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            logger.error('Error getting vehicle sessions', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener las sesiones del vehículo'
            });
        }
    };

    public activateVehicle = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de activar vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            await this.vehicleService.activateVehicle(id);
            res.json({
                success: true,
                message: 'Vehículo activado exitosamente'
            });
        } catch (error) {
            logger.error('Error activating vehicle', { error });
            res.status(500).json({
                success: false,
                message: 'Error al activar el vehículo'
            });
        }
    };

    public deactivateVehicle = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de desactivar vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            await this.vehicleService.deactivateVehicle(id);
            res.json({
                success: true,
                message: 'Vehículo desactivado exitosamente'
            });
        } catch (error) {
            logger.error('Error deactivating vehicle', { error });
            res.status(500).json({
                success: false,
                message: 'Error al desactivar el vehículo'
            });
        }
    };

    public getVehicleConfig = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a configuración de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const config = await this.vehicleService.getVehicleConfig(id);
            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            logger.error('Error getting vehicle config', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener la configuración del vehículo'
            });
        }
    };

    public updateVehicleConfig = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const configData = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de actualizar configuración de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const config = await this.vehicleService.updateVehicleConfig(id, configData);
            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            logger.error('Error updating vehicle config', { error });
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la configuración del vehículo'
            });
        }
    };

    public enableVehicleTelemetry = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de habilitar telemetría de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            await this.vehicleService.enableVehicleTelemetry(id);
            res.json({
                success: true,
                message: 'Telemetría del vehículo habilitada exitosamente'
            });
        } catch (error) {
            logger.error('Error enabling vehicle telemetry', { error });
            res.status(500).json({
                success: false,
                message: 'Error al habilitar la telemetría del vehículo'
            });
        }
    };

    public disableVehicleTelemetry = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de deshabilitar telemetría de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            await this.vehicleService.disableVehicleTelemetry(id);
            res.json({
                success: true,
                message: 'Telemetría del vehículo deshabilitada exitosamente'
            });
        } catch (error) {
            logger.error('Error disabling vehicle telemetry', { error });
            res.status(500).json({
                success: false,
                message: 'Error al deshabilitar la telemetría del vehículo'
            });
        }
    };

    public getVehicleMaintenance = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a mantenimiento de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const maintenance = await this.vehicleService.getVehicleMaintenance(id);
            res.json({
                success: true,
                data: maintenance
            });
        } catch (error) {
            logger.error('Error getting vehicle maintenance', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener el mantenimiento del vehículo'
            });
        }
    };

    public scheduleVehicleMaintenance = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const maintenanceData = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de programar mantenimiento de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const maintenance = await this.vehicleService.scheduleVehicleMaintenance(
                id,
                maintenanceData
            );
            res.json({
                success: true,
                data: maintenance
            });
        } catch (error) {
            logger.error('Error scheduling vehicle maintenance', { error });
            res.status(500).json({
                success: false,
                message: 'Error al programar el mantenimiento del vehículo'
            });
        }
    };

    public updateVehicleMaintenance = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const maintenanceData = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de actualizar mantenimiento de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const maintenance = await this.vehicleService.updateVehicleMaintenance(
                id,
                maintenanceData
            );
            res.json({
                success: true,
                data: maintenance
            });
        } catch (error) {
            logger.error('Error updating vehicle maintenance', { error });
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el mantenimiento del vehículo'
            });
        }
    };

    public deleteVehicleMaintenance = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de eliminar mantenimiento de vehículo sin organización');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            await this.vehicleService.deleteVehicleMaintenance(id);
            res.json({
                success: true,
                message: 'Mantenimiento del vehículo eliminado exitosamente'
            });
        } catch (error) {
            logger.error('Error deleting vehicle maintenance', { error });
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el mantenimiento del vehículo'
            });
        }
    };

    public getVehicleStabilityReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn(
                    'Intento de acceso a reporte de estabilidad de vehículo sin organización'
                );
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const report = await this.vehicleService.getVehicleStabilityReport(id);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting vehicle stability report', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener el reporte de estabilidad del vehículo'
            });
        }
    };

    public getVehiclePerformanceReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn(
                    'Intento de acceso a reporte de rendimiento de vehículo sin organización'
                );
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const report = await this.vehicleService.getVehiclePerformanceReport(id);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting vehicle performance report', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener el reporte de rendimiento del vehículo'
            });
        }
    };

    public getVehicleMaintenanceReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn(
                    'Intento de acceso a reporte de mantenimiento de vehículo sin organización'
                );
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const report = await this.vehicleService.getVehicleMaintenanceReport(id);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting vehicle maintenance report', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener el reporte de mantenimiento del vehículo'
            });
        }
    };

    public getVehicleCustomReport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const reportParams = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn(
                    'Intento de acceso a reporte personalizado de vehículo sin organización'
                );
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere una organización'
                });
            }

            const report = await this.vehicleService.getVehicleCustomReport(id, reportParams);
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Error getting vehicle custom report', { error });
            res.status(500).json({
                success: false,
                message: 'Error al obtener el reporte personalizado del vehículo'
            });
        }
    };
}
