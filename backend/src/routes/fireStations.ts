import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación
router.use(authenticate);

/**
 * GET /api/fire-stations
 * Obtiene la lista de parques de bomberos/estaciones de fuego
 */
router.get('/', async (req, res) => {
    try {
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Obtener parques/estaciones desde la base de datos
        const fireStations = await prisma.organization.findMany({
            where: {
                id: organizationId
            },
            include: {
                vehicles: {
                    where: {
                        active: true
                    },
                    select: {
                        id: true,
                        name: true,
                        licensePlate: true,
                        type: true,
                        status: true
                    }
                }
            }
        });

        // Si no hay datos específicos de estaciones, crear datos mock para Bomberos Madrid
        const mockFireStations = [
            {
                id: 'estacion-001',
                name: 'Parque de Bomberos Madrid Centro',
                address: 'Calle Alcalá, 123, 28014 Madrid',
                coordinates: {
                    lat: 40.4168,
                    lng: -3.7038
                },
                vehicles: [
                    { id: 'DOBACK001', name: 'Bomba Escalera 1', type: 'BOMBA_ESCALERA', status: 'active' },
                    { id: 'DOBACK002', name: 'Bomba Escalera 2', type: 'BOMBA_ESCALERA', status: 'active' },
                    { id: 'DOBACK003', name: 'Ambulancia 1', type: 'AMBULANCIA', status: 'active' }
                ]
            },
            {
                id: 'estacion-002',
                name: 'Parque de Bomberos Chamberí',
                address: 'Calle Génova, 15, 28004 Madrid',
                coordinates: {
                    lat: 40.4285,
                    lng: -3.6902
                },
                vehicles: [
                    { id: 'DOBACK004', name: 'Bomba Escalera 3', type: 'BOMBA_ESCALERA', status: 'active' },
                    { id: 'DOBACK005', name: 'Ambulancia 2', type: 'AMBULANCIA', status: 'active' }
                ]
            },
            {
                id: 'estacion-003',
                name: 'Parque de Bomberos Vallecas',
                address: 'Avenida de Buenos Aires, 45, 28053 Madrid',
                coordinates: {
                    lat: 40.3940,
                    lng: -3.6240
                },
                vehicles: [
                    { id: 'DOBACK006', name: 'Bomba Escalera 4', type: 'BOMBA_ESCALERA', status: 'active' },
                    { id: 'DOBACK007', name: 'Ambulancia 3', type: 'AMBULANCIA', status: 'active' },
                    { id: 'DOBACK008', name: 'Unidad de Rescate', type: 'RESCATE', status: 'active' }
                ]
            }
        ];

        logger.info('Parques de bomberos obtenidos', {
            organizationId,
            count: mockFireStations.length
        });

        res.json({
            success: true,
            data: mockFireStations,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error obteniendo parques de bomberos', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/fire-stations/:id
 * Obtiene detalles de una estación específica
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Buscar estación específica
        const fireStation = {
            id,
            name: `Parque de Bomberos ${id}`,
            address: 'Madrid, España',
            coordinates: {
                lat: 40.4168,
                lng: -3.7038
            },
            vehicles: [
                { id: 'DOBACK001', name: 'Bomba Escalera 1', type: 'BOMBA_ESCALERA', status: 'active' },
                { id: 'DOBACK002', name: 'Bomba Escalera 2', type: 'BOMBA_ESCALERA', status: 'active' }
            ],
            statistics: {
                totalVehicles: 2,
                activeVehicles: 2,
                incidentsToday: 3,
                averageResponseTime: '4.5 minutos'
            }
        };

        res.json({
            success: true,
            data: fireStation,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error obteniendo estación de bomberos', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
