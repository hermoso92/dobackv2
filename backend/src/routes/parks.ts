/**
 * 🏢 RUTAS DE PARQUES - BOMBEROS MADRID
 * API REST completa para gestión de parques
 */

import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(requireAuth);

/**
 * GET /api/parks
 * Listar todos los parques de la organización
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const includeCount = req.query.includeCount === 'true';

        const parks = await prisma.park.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' },
            ...(includeCount && {
                include: {
                    _count: {
                        select: {
                            vehicles: true,
                            zones: true
                        }
                    }
                }
            })
        });

        res.json({
            success: true,
            data: parks,
            count: parks.length
        });
    } catch (error) {
        logger.error('[ParksAPI] Error listando parques:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/parks/:id
 * Obtener un parque específico
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;

        const park = await prisma.park.findFirst({
            where: {
                id,
                organizationId
            },
            include: {
                vehicles: true,
                zones: true,
                _count: {
                    select: {
                        vehicles: true,
                        zones: true,
                        sessions: true
                    }
                }
            }
        });

        if (!park) {
            return res.status(404).json({
                success: false,
                error: 'Parque no encontrado'
            });
        }

        res.json({
            success: true,
            data: park
        });
    } catch (error) {
        logger.error('[ParksAPI] Error obteniendo parque:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/parks
 * Crear un nuevo parque
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { name, identifier, geometry, geometryPostgis } = req.body;

        // Validaciones
        if (!name || !identifier || !geometry) {
            return res.status(400).json({
                success: false,
                error: 'name, identifier y geometry son requeridos'
            });
        }

        // Verificar que el identifier sea único
        const existing = await prisma.park.findFirst({
            where: {
                identifier,
                organizationId
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe un parque con ese identificador'
            });
        }

        const park = await prisma.park.create({
            data: {
                name,
                identifier,
                geometry,
                geometry_postgis: geometryPostgis || JSON.stringify(geometry),
                organizationId
            }
        });

        logger.info(`[ParksAPI] Parque creado: ${park.id} - ${park.name}`);

        res.status(201).json({
            success: true,
            data: park,
            message: 'Parque creado exitosamente'
        });
    } catch (error) {
        logger.error('[ParksAPI] Error creando parque:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/parks/:id
 * Actualizar un parque
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;
        const { name, identifier, geometry, geometryPostgis } = req.body;

        // Verificar que el parque existe y pertenece a la organización
        const existing = await prisma.park.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Parque no encontrado'
            });
        }

        // Si se cambia el identifier, verificar que sea único
        if (identifier && identifier !== existing.identifier) {
            const duplicate = await prisma.park.findFirst({
                where: {
                    identifier,
                    organizationId,
                    id: { not: id }
                }
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe un parque con ese identificador'
                });
            }
        }

        const park = await prisma.park.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(identifier && { identifier }),
                ...(geometry && {
                    geometry,
                    geometry_postgis: geometryPostgis || JSON.stringify(geometry)
                })
            }
        });

        logger.info(`[ParksAPI] Parque actualizado: ${park.id}`);

        res.json({
            success: true,
            data: park,
            message: 'Parque actualizado exitosamente'
        });
    } catch (error) {
        logger.error('[ParksAPI] Error actualizando parque:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/parks/:id
 * Eliminar un parque
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;

        // Verificar que el parque existe y pertenece a la organización
        const existing = await prisma.park.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Parque no encontrado'
            });
        }

        // Desvincular vehículos del parque
        await prisma.vehicle.updateMany({
            where: { parkId: id },
            data: { parkId: null }
        });

        // Eliminar el parque
        await prisma.park.delete({
            where: { id }
        });

        logger.info(`[ParksAPI] Parque eliminado: ${id}`);

        res.json({
            success: true,
            message: 'Parque eliminado exitosamente'
        });
    } catch (error) {
        logger.error('[ParksAPI] Error eliminando parque:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
