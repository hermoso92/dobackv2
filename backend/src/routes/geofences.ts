import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { GeofenceData, geofenceService } from '../services/GeofenceService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const router = express.Router();

// Endpoint de prueba sin autenticación (temporal)
router.get('/test', async (req: Request, res: Response) => {
    try {
        console.log('🧪 Endpoint de prueba llamado');

        // Obtener todas las geocercas sin filtro de organización
        const allGeofences = await prisma.geofence.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Total de geocercas en DB: ${allGeofences.length}`);

        res.json({
            success: true,
            data: allGeofences,
            count: allGeofences.length,
            message: 'Endpoint de prueba - sin autenticación'
        });
    } catch (error) {
        console.error('❌ Error en endpoint de prueba:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Endpoint para crear datos reales de geofences (temporal)
router.post('/create-real-data', async (req: Request, res: Response) => {
    try {
        console.log('🚨 Creando geofences reales para Bomberos Madrid...');

        // Datos reales de geofences para Bomberos Madrid
        const realGeofences = [
            {
                name: "Parque de Bomberos Central - Puerta del Sol",
                description: "Estación central de bomberos en Puerta del Sol, Madrid",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                geometry: {
                    type: "Circle",
                    center: [40.4168, -3.7038],
                    radius: 150
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7038, 40.4168]
                },
                geometryRadius: 150,
                tag: "CENTRAL"
            },
            {
                name: "Parque de Bomberos Chamberí",
                description: "Estación de bomberos en el distrito de Chamberí",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.7000, 40.4350],
                        [-3.6950, 40.4350],
                        [-3.6950, 40.4300],
                        [-3.7000, 40.4300],
                        [-3.7000, 40.4350]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6975, 40.4325]
                },
                tag: "CHAMBERI"
            },
            {
                name: "Zona de Alto Riesgo - Gran Vía",
                description: "Área comercial de alto riesgo en Gran Vía con alta densidad de población",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.7100, 40.4200],
                        [-3.7050, 40.4200],
                        [-3.7050, 40.4150],
                        [-3.7100, 40.4150],
                        [-3.7100, 40.4200]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7075, 40.4175]
                },
                tag: "GRAN_VIA"
            },
            {
                name: "Parque de Bomberos Vallecas",
                description: "Estación de bomberos en Vallecas, zona residencial",
                type: "RECTANGLE",
                mode: "CAR",
                enabled: true,
                live: true,
                geometry: {
                    type: "Rectangle",
                    bounds: {
                        north: 40.3650,
                        south: 40.3600,
                        east: -3.6200,
                        west: -3.6250
                    }
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6225, 40.3625]
                },
                tag: "VALLECAS"
            },
            {
                name: "Zona Industrial - Carabanchel",
                description: "Área industrial con riesgo de incendios químicos",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                geometry: {
                    type: "Circle",
                    center: [40.3850, -3.7200],
                    radius: 200
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7200, 40.3850]
                },
                geometryRadius: 200,
                tag: "CARABANCHEL"
            }
        ];

        // Obtener la organización de Bomberos Madrid
        let organization = await prisma.organization.findFirst({
            where: {
                name: {
                    contains: 'Bomberos',
                    mode: 'insensitive'
                }
            }
        });

        if (!organization) {
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid',
                    description: 'Cuerpo de Bomberos del Ayuntamiento de Madrid',
                    type: 'FIRE_DEPARTMENT',
                    settings: {
                        timezone: 'Europe/Madrid',
                        language: 'es',
                        theme: 'light'
                    }
                }
            });
        }

        // Eliminar geofences existentes
        await prisma.geofence.deleteMany({
            where: { organizationId: organization.id }
        });

        // Crear nuevas geofences
        const createdGeofences = [];
        for (const geofenceData of realGeofences) {
            const geofence = await prisma.geofence.create({
                data: {
                    name: geofenceData.name,
                    description: geofenceData.description,
                    type: geofenceData.type,
                    mode: geofenceData.mode,
                    enabled: geofenceData.enabled,
                    live: geofenceData.live,
                    geometry: geofenceData.geometry,
                    geometryCenter: geofenceData.geometryCenter,
                    geometryRadius: geofenceData.geometryRadius,
                    tag: geofenceData.tag,
                    organizationId: organization.id
                }
            });
            createdGeofences.push(geofence);
        }

        res.json({
            success: true,
            data: createdGeofences,
            count: createdGeofences.length,
            message: `Geofences reales creadas exitosamente para ${organization.name}`
        });

    } catch (error) {
        console.error('❌ Error creando geofences reales:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Middleware de autenticación para todas las rutas siguientes
router.use(requireAuth);

/**
 * GET /api/geofences
 * Obtener todas las geocercas de la organización del usuario
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        const geofences = await geofenceService.getGeofencesByOrganization(organizationId);

        res.json({
            success: true,
            data: geofences,
            count: geofences.length
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error obteniendo geocercas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/:id
 * Obtener una geocerca específica por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;

        const geofence = await geofenceService.getGeofenceById(id);

        if (!geofence) {
            return res.status(404).json({
                success: false,
                error: 'Geocerca no encontrada'
            });
        }

        // Verificar que la geocerca pertenece a la organización del usuario
        if (geofence.organizationId !== organizationId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para acceder a esta geocerca'
            });
        }

        res.json({
            success: true,
            data: geofence
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error obteniendo geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofences
 * Crear una nueva geocerca
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const geofenceData: GeofenceData = {
            ...req.body,
            organizationId
        };

        // Validaciones básicas
        if (!geofenceData.name) {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la geocerca es requerido'
            });
        }

        if (!geofenceData.geometry) {
            return res.status(400).json({
                success: false,
                error: 'La geometría de la geocerca es requerida'
            });
        }

        const geofence = await geofenceService.createGeofence(geofenceData);

        res.status(201).json({
            success: true,
            data: geofence,
            message: 'Geocerca creada exitosamente'
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error creando geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/geofences/:id
 * Actualizar una geocerca existente
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;

        // Verificar que la geocerca existe y pertenece a la organización
        const existingGeofence = await geofenceService.getGeofenceById(id);
        if (!existingGeofence) {
            return res.status(404).json({
                success: false,
                error: 'Geocerca no encontrada'
            });
        }

        if (existingGeofence.organizationId !== organizationId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para modificar esta geocerca'
            });
        }

        const updateData = req.body;
        const geofence = await geofenceService.updateGeofence(id, updateData);

        res.json({
            success: true,
            data: geofence,
            message: 'Geocerca actualizada exitosamente'
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error actualizando geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/geofences/:id
 * Eliminar una geocerca
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;

        // Verificar que la geocerca existe y pertenece a la organización
        const existingGeofence = await geofenceService.getGeofenceById(id);
        if (!existingGeofence) {
            return res.status(404).json({
                success: false,
                error: 'Geocerca no encontrada'
            });
        }

        if (existingGeofence.organizationId !== organizationId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar esta geocerca'
            });
        }

        await geofenceService.deleteGeofence(id);

        res.json({
            success: true,
            message: 'Geocerca eliminada exitosamente'
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error eliminando geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofences/import-radar
 * Importar geocerca desde radar.com
 */
router.post('/import-radar', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const radarData = req.body;

        if (!radarData._id || !radarData.description) {
            return res.status(400).json({
                success: false,
                error: 'Datos de radar.com incompletos'
            });
        }

        const geofence = await geofenceService.importFromRadar(radarData, organizationId);

        res.status(201).json({
            success: true,
            data: geofence,
            message: 'Geocerca importada desde radar.com exitosamente'
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error importando geocerca desde radar.com:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/events
 * Obtener todos los eventos de geocerca de la organización
 */
router.get('/events', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { vehicleId, geofenceId, type, limit = '100' } = req.query;

        const where: any = {
            organizationId
        };

        if (vehicleId) {
            where.vehicleId = vehicleId as string;
        }

        if (geofenceId) {
            where.geofenceId = geofenceId as string;
        }

        if (type) {
            where.type = type as string;
        }

        const events = await prisma.geofenceEvent.findMany({
            where,
            include: {
                geofence: {
                    select: {
                        id: true,
                        name: true,
                        tag: true,
                        type: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit as string)
        });

        res.json({
            success: true,
            data: events,
            count: events.length
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error obteniendo eventos de geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/events/:vehicleId
 * Obtener eventos de geocerca para un vehículo específico
 */
router.get('/events/:vehicleId', async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const organizationId = (req as any).user.organizationId;
        const { from, to } = req.query;

        let fromDate: Date | undefined;
        let toDate: Date | undefined;

        if (from) {
            fromDate = new Date(from as string);
        }
        if (to) {
            toDate = new Date(to as string);
        }

        const events = await geofenceService.getGeofenceEventsByVehicle(
            vehicleId,
            organizationId,
            fromDate,
            toDate
        );

        res.json({
            success: true,
            data: events,
            count: events.length
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error obteniendo eventos de geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/events
 * Obtener eventos de geocercas (todos o filtrados)
 */
router.get('/events', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const limit = parseInt(req.query.limit as string) || 100;
        const today = req.query.today === 'true';

        let whereClause: any = {
            geofence: {
                organizationId
            }
        };

        // Si se pide solo eventos de hoy
        if (today) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            whereClause.timestamp = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const events = await prisma.geofenceEvent.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                geofence: true,
                vehicle: {
                    select: {
                        id: true,
                        name: true,
                        dobackId: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error obteniendo eventos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofences/process-gps
 * Procesar puntos GPS y detectar eventos de geocerca
 */
router.post('/process-gps', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { vehicleId, gpsPoints } = req.body;

        if (!vehicleId || !gpsPoints || !Array.isArray(gpsPoints)) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId y gpsPoints son requeridos'
            });
        }

        await geofenceService.processGPSPoints(vehicleId, organizationId, gpsPoints);

        res.json({
            success: true,
            message: 'Puntos GPS procesados exitosamente'
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error procesando puntos GPS:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/check-point/:id
 * Verificar si un punto está dentro de una geocerca
 */
router.get('/check-point/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.query;
        const organizationId = (req as any).user.organizationId;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'latitude y longitude son requeridos'
            });
        }

        // Verificar que la geocerca pertenece a la organización
        const geofence = await geofenceService.getGeofenceById(id);
        if (!geofence || geofence.organizationId !== organizationId) {
            return res.status(404).json({
                success: false,
                error: 'Geocerca no encontrada'
            });
        }

        const isInside = await geofenceService.isPointInsideGeofence(
            id,
            parseFloat(latitude as string),
            parseFloat(longitude as string)
        );

        res.json({
            success: true,
            data: {
                isInside,
                geofenceName: geofence.name
            }
        });
    } catch (error) {
        logger.error('[GeofenceAPI] Error verificando punto en geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
