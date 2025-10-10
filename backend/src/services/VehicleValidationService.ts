import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class VehicleValidationService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    public async validateVehicle(
        vehicleId: string,
        organizationId: string
    ): Promise<{ id: string }> {
        try {
            logger.info('Validando vehículo', { vehicleId, organizationId });

            // Buscar el vehículo en la base de datos
            const vehicle = await this.prisma.vehicle.findFirst({
                where: {
                    name: vehicleId,
                    organizationId: organizationId
                },
                select: {
                    id: true
                }
            });

            if (!vehicle) {
                logger.warn('Vehículo no encontrado', { vehicleId, organizationId });
                throw new Error(`Vehículo no encontrado: ${vehicleId}`);
            }

            logger.info('Vehículo validado exitosamente', { vehicleId, id: vehicle.id });
            return vehicle;
        } catch (error) {
            logger.error('Error validando vehículo', { error, vehicleId, organizationId });
            throw error;
        }
    }

    private isValidVehicleId(vehicleId: string): boolean {
        return /^[a-zA-Z0-9-]+$/.test(vehicleId);
    }

    public async validateVehicleForSession(
        vehicleId: string,
        organizationId: string
    ): Promise<{
        vehicle: { id: string };
        canStartSession: boolean;
        reason?: string;
    }> {
        try {
            const vehicle = await this.validateVehicle(vehicleId, organizationId);

            // Check if vehicle has any active sessions
            const activeSession = await this.prisma.session.findFirst({
                where: {
                    vehicleId: vehicle.id,
                    status: 'ACTIVE'
                }
            });

            if (activeSession) {
                return {
                    vehicle,
                    canStartSession: false,
                    reason: 'El vehículo ya tiene una sesión activa'
                };
            }

            return {
                vehicle,
                canStartSession: true
            };
        } catch (error) {
            logger.error('Error validando vehículo para sesión', {
                error,
                vehicleId,
                organizationId
            });
            throw error;
        }
    }
}
