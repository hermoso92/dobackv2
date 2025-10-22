
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';



export async function getVehicles(req: Request, res: Response) {
    logger.info('\n\n🚨🚨🚨 VEHICLES CONTROLLER GET VEHICLES CALLED 🚨🚨🚨\n\n');
    try {
        const organizationId = (req as any).organizationId;
        const userRole = (req as any).user?.role;
        const { parkId } = req.query;

        // Para usuarios ADMIN sin organización, devolver lista vacía
        if (!organizationId && userRole === 'ADMIN') {
            return res.json({
                success: true,
                data: []
            });
        }

        const where: any = { organizationId };
        if (parkId) where.parkId = parkId;

        // Seleccionar explícitamente todos los campos incluyendo parkId
        const vehicles = await prisma.vehicle.findMany({
            where,
            select: {
                id: true,
                name: true,
                identifier: true, // Correcto: identifier existe en el schema
                licensePlate: true,
                parkId: true,
                type: true,
                status: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Adaptar al formato esperado por el frontend
        const vehiclesWithLocation = vehicles.map(vehicle => ({
            ...vehicle,
            dobackId: vehicle.identifier, // Mapear identifier a dobackId para compatibilidad
            plate: vehicle.licensePlate || 'Sin matrícula',
            location: null // No existe campo location, así que se pone null
        }));

        logger.info('🚗 [VEHICLES CONTROLLER] Devolviendo vehículos:', vehiclesWithLocation.length);
        logger.info('🚗 [VEHICLES CONTROLLER] Ejemplo con parkId:', {
            name: vehiclesWithLocation[0]?.name,
            parkId: vehiclesWithLocation[0]?.parkId
        });

        res.json({
            success: true,
            data: vehiclesWithLocation
        });
    } catch (err) {
        logger.error('Error obteniendo vehículos:', err);
        res.status(500).json({ success: false, error: 'Error al obtener vehículos' });
    }
}

export async function getVehicle(req: Request, res: Response) {
    try {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: req.params.id, organizationId: (req as any).organizationId },
        });
        if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
        res.json(vehicle);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener vehículo' });
    }
}

export async function createVehicle(req: Request, res: Response) {
    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                ...req.body,
                organizationId: (req as any).organizationId,
            },
        });
        res.status(201).json(vehicle);
    } catch (err) {
        res.status(400).json({ error: 'Error al crear vehículo' });
    }
}

export async function updateVehicle(req: Request, res: Response) {
    try {
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(vehicle);
    } catch (err) {
        res.status(400).json({ error: 'Error al actualizar vehículo' });
    }
}

export async function deleteVehicle(req: Request, res: Response) {
    try {
        await prisma.vehicle.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Error al eliminar vehículo' });
    }
} 
