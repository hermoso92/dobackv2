import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Interface para el estado de archivos de un vehículo
interface VehicleFileStatus {
    vehicleId: string;
    vehicleName: string;
    lastUploadDate: string | null;
    filesStatus: {
        estabilidad: boolean;
        can: boolean;
        gps: boolean;
        rotativo: boolean;
    };
    missingFiles: string[];
    isDisconnected: boolean;
    connectionStatus: 'connected' | 'partial' | 'disconnected';
}

// Interface para la respuesta del control de dispositivos
interface DeviceControlResponse {
    totalVehicles: number;
    connectedVehicles: number;
    partialVehicles: number;
    disconnectedVehicles: number;
    devices: VehicleFileStatus[];
}

/**
 * GET /api/devices/status
 * Obtiene el estado de todos los dispositivos y archivos subidos
 */
router.get('/status', async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId || 'default';

        logger.info('Obteniendo estado de dispositivos', { organizationId });

        // Obtener todos los vehículos de la organización
        const vehicles = await prisma.vehicle.findMany({
            where: { organizationId },
            select: {
                id: true,
                name: true,
                createdAt: true
            }
        });

        logger.info(`Encontrados ${vehicles.length} vehículos`, { organizationId });

        const devices: VehicleFileStatus[] = [];
        let connectedVehicles = 0;
        let partialVehicles = 0;
        let disconnectedVehicles = 0;

        // Para cada vehículo, verificar el estado de sus archivos
        for (const vehicle of vehicles) {
            const vehicleId = vehicle.id;

            // Obtener la última fecha de subida de cada tipo de archivo
            const lastUploads = await Promise.all([
                // Estabilidad
                prisma.session.findFirst({
                    where: {
                        vehicleId,
                        type: 'estabilidad'
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                }),
                // CAN
                prisma.session.findFirst({
                    where: {
                        vehicleId,
                        type: 'can'
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                }),
                // GPS
                prisma.session.findFirst({
                    where: {
                        vehicleId,
                        type: 'gps'
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                }),
                // Rotativo
                prisma.session.findFirst({
                    where: {
                        vehicleId,
                        type: 'rotativo'
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                })
            ]);

            const [estabilidad, can, gps, rotativo] = lastUploads;

            // Determinar el estado de cada archivo
            const filesStatus = {
                estabilidad: !!estabilidad,
                can: !!can,
                gps: !!gps,
                rotativo: !!rotativo
            };

            // Encontrar la fecha más reciente
            const uploadDates = [estabilidad, can, gps, rotativo]
                .filter(Boolean)
                .map(upload => upload!.createdAt);

            const lastUploadDate = uploadDates.length > 0
                ? new Date(Math.max(...uploadDates.map(d => d.getTime()))).toISOString()
                : null;

            // Determinar archivos faltantes
            const missingFiles: string[] = [];
            if (!filesStatus.estabilidad) missingFiles.push('Estabilidad');
            if (!filesStatus.can) missingFiles.push('CAN');
            if (!filesStatus.gps) missingFiles.push('GPS');
            if (!filesStatus.rotativo) missingFiles.push('Rotativo');

            // Determinar si está desconectado (>24h sin archivos)
            const isDisconnected = lastUploadDate
                ? (Date.now() - new Date(lastUploadDate).getTime()) > (24 * 60 * 60 * 1000)
                : true;

            // Determinar estado de conexión
            let connectionStatus: 'connected' | 'partial' | 'disconnected';
            if (isDisconnected) {
                connectionStatus = 'disconnected';
                disconnectedVehicles++;
            } else if (missingFiles.length === 0) {
                connectionStatus = 'connected';
                connectedVehicles++;
            } else {
                connectionStatus = 'partial';
                partialVehicles++;
            }

            devices.push({
                vehicleId,
                vehicleName: vehicle.name,
                lastUploadDate,
                filesStatus,
                missingFiles,
                isDisconnected,
                connectionStatus
            });

            logger.debug(`Vehículo ${vehicle.name}: ${connectionStatus}`, {
                vehicleId,
                filesStatus,
                missingFiles: missingFiles.length,
                isDisconnected
            });
        }

        const response: DeviceControlResponse = {
            totalVehicles: vehicles.length,
            connectedVehicles,
            partialVehicles,
            disconnectedVehicles,
            devices
        };

        logger.info('Estado de dispositivos obtenido', {
            total: response.totalVehicles,
            connected: response.connectedVehicles,
            partial: response.partialVehicles,
            disconnected: response.disconnectedVehicles
        });

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        logger.error('Error obteniendo estado de dispositivos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/devices/status/:vehicleId
 * Obtiene el estado detallado de un vehículo específico
 */
router.get('/status/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const organizationId = (req as any).user?.organizationId || 'default';

        logger.info('Obteniendo estado de vehículo específico', { vehicleId, organizationId });

        // Verificar que el vehículo pertenece a la organización
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId
            },
            select: {
                id: true,
                name: true,
                createdAt: true
            }
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehículo no encontrado'
            });
        }

        // Obtener historial de subidas de los últimos 7 días
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const uploadHistory = await prisma.session.findMany({
            where: {
                vehicleId,
                createdAt: { gte: sevenDaysAgo }
            },
            select: {
                id: true,
                type: true,
                createdAt: true,
                sessionNumber: true,
                measurementsCount: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Agrupar por tipo de archivo
        const uploadsByType = uploadHistory.reduce((acc, upload) => {
            if (!acc[upload.type]) {
                acc[upload.type] = [];
            }
            acc[upload.type].push({
                id: upload.id,
                sessionNumber: upload.sessionNumber,
                createdAt: upload.createdAt,
                measurementsCount: upload.measurementsCount
            });
            return acc;
        }, {} as Record<string, any[]>);

        res.json({
            success: true,
            data: {
                vehicle: {
                    id: vehicle.id,
                    name: vehicle.name,
                    createdAt: vehicle.createdAt
                },
                uploadHistory: uploadsByType,
                last7Days: uploadHistory.length,
                summary: {
                    estabilidad: uploadsByType.estabilidad?.length || 0,
                    can: uploadsByType.can?.length || 0,
                    gps: uploadsByType.gps?.length || 0,
                    rotativo: uploadsByType.rotativo?.length || 0
                }
            }
        });

    } catch (error) {
        logger.error('Error obteniendo estado de vehículo específico:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

export default router;
