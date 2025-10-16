/**
 * 🔐 VALIDADOR: FOREIGN KEYS
 * 
 * Valida que los IDs de usuario, organización y vehículo existan en la BD
 * ANTES de intentar crear sesiones, evitando errores de foreign key constraint.
 */

import { prisma } from '../../../lib/prisma';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('ForeignKeyValidator');

export class ForeignKeyValidator {
    /**
     * Valida que un usuario existe en la BD
     */
    static async validateUser(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                logger.error(`Usuario no encontrado: ${userId}`);
                return false;
            }

            logger.info(`✅ Usuario validado: ${user.email}`);
            return true;
        } catch (error: any) {
            logger.error(`Error validando usuario: ${error.message}`);
            return false;
        }
    }

    /**
     * Valida que una organización existe en la BD
     */
    static async validateOrganization(organizationId: string): Promise<boolean> {
        try {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId }
            });

            if (!org) {
                logger.error(`Organización no encontrada: ${organizationId}`);
                return false;
            }

            logger.info(`✅ Organización validada: ${org.name}`);
            return true;
        } catch (error: any) {
            logger.error(`Error validando organización: ${error.message}`);
            return false;
        }
    }

    /**
     * Valida que un vehículo existe en la BD
     */
    static async validateVehicle(vehicleId: string): Promise<boolean> {
        try {
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: vehicleId }
            });

            if (!vehicle) {
                logger.error(`Vehículo no encontrado: ${vehicleId}`);
                return false;
            }

            logger.info(`✅ Vehículo validado: ${vehicle.identifier}`);
            return true;
        } catch (error: any) {
            logger.error(`Error validando vehículo: ${error.message}`);
            return false;
        }
    }

    /**
     * Valida todas las foreign keys necesarias para crear una sesión
     */
    static async validateAll(
        userId: string,
        organizationId: string,
        vehicleId?: string
    ): Promise<{
        valid: boolean;
        errors: string[];
    }> {
        const errors: string[] = [];

        // Validar usuario
        const userValid = await this.validateUser(userId);
        if (!userValid) {
            errors.push(`Usuario inválido: ${userId}`);
        }

        // Validar organización
        const orgValid = await this.validateOrganization(organizationId);
        if (!orgValid) {
            errors.push(`Organización inválida: ${organizationId}`);
        }

        // Validar vehículo (opcional)
        if (vehicleId) {
            const vehicleValid = await this.validateVehicle(vehicleId);
            if (!vehicleValid) {
                errors.push(`Vehículo inválido: ${vehicleId}`);
            }
        }

        const valid = errors.length === 0;

        if (valid) {
            logger.info('✅ Todas las foreign keys son válidas');
        } else {
            logger.error(`❌ Errores de validación: ${errors.join(', ')}`);
        }

        return { valid, errors };
    }

    /**
     * Busca o crea un vehículo por identificador
     */
    static async getOrCreateVehicle(
        identifier: string,
        organizationId: string
    ): Promise<string> {
        // Primero buscar
        let vehicle = await prisma.vehicle.findFirst({
            where: { identifier }
        });

        if (vehicle) {
            logger.info(`Vehículo encontrado: ${identifier} (${vehicle.id})`);
            return vehicle.id;
        }

        // Si no existe, crear
        logger.warn(`Vehículo ${identifier} no existe, creando...`);

        vehicle = await prisma.vehicle.create({
            data: {
                identifier,
                name: identifier,
                model: 'UNKNOWN',
                licensePlate: `PENDING-${identifier}`,
                organizationId,
                type: 'OTHER',
                status: 'ACTIVE',
                updatedAt: new Date() // ✅ REQUERIDO: Campo updatedAt obligatorio
            }
        });

        logger.info(`✅ Vehículo creado: ${identifier} (${vehicle.id})`);
        return vehicle.id;
    }
}

