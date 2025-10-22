
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';



export async function getZones(req: Request, res: Response) {
    try {
        const organizationId = (req as any).organizationId;
        const userRole = (req as any).user?.role;
        const includeCount = req.query.includeCount === 'true';

        // Para usuarios ADMIN sin organización, devolver lista vacía
        if (!organizationId && userRole === 'ADMIN') {
            return res.json({
                success: true,
                data: []
            });
        }

        const zones = await prisma.zone.findMany({
            where: { organizationId },
            ...(includeCount && {
                include: {
                    park: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            events: true,
                            sessions: true
                        }
                    }
                }
            })
        });

        res.json({
            success: true,
            data: zones,
            count: zones.length
        });
    } catch (err) {
        console.error('Error obteniendo zonas:', err);
        res.status(500).json({
            success: false,
            error: 'Error al obtener zonas'
        });
    }
}

export async function getZone(req: Request, res: Response) {
    try {
        const zone = await prisma.zone.findFirst({
            where: { id: req.params.id, organizationId: (req as any).organizationId },
        });
        if (!zone) return res.status(404).json({ error: 'Zona no encontrada' });
        res.json(zone);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener zona' });
    }
}

export async function createZone(req: Request, res: Response) {
    try {
        const zone = await prisma.zone.create({
            data: {
                ...req.body,
                organizationId: (req as any).organizationId,
            },
        });
        res.status(201).json(zone);
    } catch (err) {
        res.status(400).json({ error: 'Error al crear zona' });
    }
}

export async function updateZone(req: Request, res: Response) {
    try {
        const zone = await prisma.zone.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(zone);
    } catch (err) {
        res.status(400).json({ error: 'Error al actualizar zona' });
    }
}

export async function deleteZone(req: Request, res: Response) {
    try {
        await prisma.zone.delete({
            where: { id: req.params.id },
        });
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ error: 'Error al eliminar zona' });
    }
} 
