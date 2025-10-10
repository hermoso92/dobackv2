import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export async function getParks(req: Request, res: Response) {
    try {
        const organizationId = (req as any).organizationId;
        const userRole = (req as any).user?.role;

        // Para usuarios ADMIN sin organización, devolver lista vacía
        if (!organizationId && userRole === 'ADMIN') {
            return res.json([]);
        }

        const parks = await prisma.park.findMany({
            where: { organizationId },
        });
        res.json(parks);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener parques' });
    }
}

export async function getPark(req: Request, res: Response) {
    try {
        const park = await prisma.park.findFirst({
            where: { id: req.params.id, organizationId: (req as any).organizationId },
        });
        if (!park) return res.status(404).json({ error: 'Parque no encontrado' });
        res.json(park);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener parque' });
    }
}

export async function createPark(req: Request, res: Response) {
    try {
        const park = await prisma.park.create({
            data: {
                ...req.body,
                organizationId: (req as any).organizationId,
            },
        });
        res.status(201).json(park);
    } catch (err) {
        res.status(400).json({ error: 'Error al crear parque' });
    }
}

export async function updatePark(req: Request, res: Response) {
    try {
        const park = await prisma.park.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(park);
    } catch (err) {
        res.status(400).json({ error: 'Error al actualizar parque' });
    }
}

export async function deletePark(req: Request, res: Response) {
    try {
        await prisma.park.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Error al eliminar parque' });
    }
} 