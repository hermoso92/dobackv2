/**
 * 🔑 ENDPOINTS API PARA CLAVES OPERACIONALES
 * 
 * Endpoints:
 * - GET /api/operational-keys/:sessionId - Claves de una sesión
 * - GET /api/operational-keys/summary - Resumen de claves por filtros
 * - GET /api/operational-keys/timeline - Timeline de claves
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const logger = createLogger('OperationalKeysAPI');

// ============================================================================
// GET /api/operational-keys/:sessionId
// Obtener claves de una sesión específica
// ============================================================================
router.get('/:sessionId', authenticate, async (req: Request, res: Response) => {
    try {
        // ⚠️ TEMPORALMENTE DESHABILITADO - Prisma Client corrupto
        // TODO: Resolver problema de Prisma operationalKey
        const { sessionId } = req.params;
        logger.warn(`Endpoint /:sessionId deshabilitado temporalmente para sesión ${sessionId}`);

        return res.json({
            sessionId,
            vehicleId: null,
            vehicleName: null,
            startTime: null,
            endTime: null,
            claves: []
        });

        /* CÓDIGO ORIGINAL COMENTADO:
        logger.info(`Obteniendo claves de sesión ${sessionId}`);

        // Verificar que la sesión existe y pertenece a la organización
        const sesion = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { vehicle: true }
        });

        if (!sesion) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        if (sesion.organizationId !== req.user?.organizationId) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        // Obtener claves
        const claves = await prisma.operationalKey.findMany({
            where: { sessionId },
            orderBy: { startTime: 'asc' }
        });

        logger.info(`Claves encontradas: ${claves.length}`);

        res.json({
            sessionId,
            vehicleId: sesion.vehicleId,
            vehicleName: sesion.vehicle.name,
            startTime: sesion.startTime,
            endTime: sesion.endTime,
            claves: claves.map(c => ({
                id: c.id,
                tipo: c.keyType,
                tipoNombre: c.keyTypeName,
                inicio: c.startTime,
                fin: c.endTime,
                duracionSegundos: c.duration,
                duracionMinutos: c.duration ? Math.round(c.duration / 60) : null,
                rotativoEncendido: c.rotativoState,
                geocerca: c.geofenceName,
                coordenadasInicio: c.startLat && c.startLon ? { lat: c.startLat, lon: c.startLon } : null,
                coordenadasFin: c.endLat && c.endLon ? { lat: c.endLat, lon: c.endLon } : null,
                detalles: c.details
            }))
        });
        */

    } catch (error: any) {
        logger.error('Error obteniendo claves de sesión', { error: error.message });
        res.status(500).json({ error: 'Error obteniendo claves operacionales' });
    }
});

// ============================================================================
// GET /api/operational-keys/summary
// Resumen de claves por filtros (vehículos, fechas)
// ============================================================================
router.get('/summary', authenticate, async (req: Request, res: Response) => {
    try {
        // ⚠️ TEMPORALMENTE DESHABILITADO - Prisma Client corrupto
        // TODO: Resolver problema de Prisma operationalKey
        logger.warn('Endpoint /summary deshabilitado temporalmente');

        return res.json({
            totalClaves: 0,
            porTipo: [],
            duracionTotal: 0,
            duracionTotalMinutos: 0,
            claveMasLarga: null,
            claveMasCorta: null
        });

        /* CÓDIGO ORIGINAL COMENTADO:
        const organizationId = req.user?.organizationId || 'default-org';
        const from = req.query.from as string;
        const to = req.query.to as string;

        const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
        const vehicleIds = vehicleIdsRaw
            ? (Array.isArray(vehicleIdsRaw) ? vehicleIdsRaw : [vehicleIdsRaw]) as string[]
            : undefined;

        logger.info('Obteniendo resumen de claves', { from, to, vehicleIds });

        // Construir filtros para sesiones
        const sessionFilters: any = { organizationId };

        if (vehicleIds && vehicleIds.length > 0) {
            sessionFilters.vehicleId = { in: vehicleIds };
        }

        if (from) {
            sessionFilters.startTime = { gte: new Date(from) };
        }

        if (to) {
            if (sessionFilters.startTime) {
                sessionFilters.startTime = { ...sessionFilters.startTime, lte: new Date(to) };
            } else {
                sessionFilters.startTime = { lte: new Date(to) };
            }
        }

        // Obtener sesiones
        const sesiones = await prisma.session.findMany({
            where: sessionFilters,
            select: { id: true }
        });

        const sessionIds = sesiones.map(s => s.id);

        if (sessionIds.length === 0) {
            return res.json({
                totalClaves: 0,
                porTipo: {},
                duracionTotal: 0,
                claveMasLarga: null,
                claveMasCorta: null
            });
        }

        // Obtener claves de esas sesiones
        const claves = await prisma.operationalKey.findMany({
            where: { sessionId: { in: sessionIds } },
            include: {
                session: {
                    include: { vehicle: true }
                }
            }
        });

        */

    } catch (error: any) {
        logger.error('Error obteniendo resumen de claves', { error: error.message });
        res.status(500).json({ error: 'Error obteniendo resumen de claves' });
    }
});

// ============================================================================
// GET /api/operational-keys/timeline
// Timeline de claves para visualización (gráfica Gantt)
// ============================================================================
router.get('/timeline', authenticate, async (req: Request, res: Response) => {
    try {
        // ⚠️ TEMPORALMENTE DESHABILITADO - Prisma Client corrupto
        // TODO: Resolver problema de Prisma operationalKey
        logger.warn('Endpoint /timeline deshabilitado temporalmente');

        return res.json({ timeline: [] });

        /* CÓDIGO ORIGINAL COMENTADO:
        const organizationId = req.user?.organizationId || 'default-org';
        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleId = req.query.vehicleId as string;

        logger.info('Obteniendo timeline de claves', { from, to, vehicleId });

        // Construir filtros
        const sessionFilters: any = { organizationId };

        if (vehicleId) {
            sessionFilters.vehicleId = vehicleId;
        }

        if (from && to) {
            sessionFilters.startTime = { gte: new Date(from), lte: new Date(to) };
        }

        // Obtener sesiones
        const sesiones = await prisma.session.findMany({
            where: sessionFilters,
            select: { id: true },
            orderBy: { startTime: 'asc' }
        });

        const sessionIds = sesiones.map(s => s.id);

        if (sessionIds.length === 0) {
            return res.json({ timeline: [] });
        }

        // Obtener claves
        const claves = await prisma.operationalKey.findMany({
            where: { sessionId: { in: sessionIds } },
            include: {
                session: {
                    include: { vehicle: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // Formatear para timeline
        const timeline = claves.map(c => ({
            id: c.id,
            sessionId: c.sessionId,
            vehiculo: c.session.vehicle.name,
            vehiculoId: c.session.vehicleId,
            tipo: c.keyType,
            tipoNombre: c.keyTypeName,
            inicio: c.startTime,
            fin: c.endTime,
            duracionMinutos: c.duration ? Math.round(c.duration / 60) : null,
            rotativoOn: c.rotativoState,
            geocerca: c.geofenceName,
            color: getColorPorTipo(c.keyType)
        }));

        logger.info(`Timeline generado: ${timeline.length} claves`);

        res.json({ timeline });
        */

    } catch (error: any) {
        logger.error('Error generando timeline', { error: error.message });
        res.status(500).json({ error: 'Error generando timeline' });
    }
});

// ============================================================================
// HELPERS
// ============================================================================

function getColorPorTipo(keyType: number): string {
    const colores: Record<number, string> = {
        0: '#9CA3AF', // TALLER - Gris
        1: '#3B82F6', // PARQUE - Azul
        2: '#EF4444', // EMERGENCIA - Rojo
        3: '#F59E0B', // INCENDIO - Naranja
        5: '#10B981'  // REGRESO - Verde
    };

    return colores[keyType] || '#6B7280';
}

export default router;

