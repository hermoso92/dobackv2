/**
 * 🔑 ENDPOINTS API PARA CLAVES OPERACIONALES
 * 
 * Endpoints:
 * - GET /api/operational-keys/estados-summary - Resumen de estados para EstadosYTiemposTab
 * - GET /api/operational-keys/summary - Resumen de claves por filtros (OperationalKeysTab)
 * - GET /api/operational-keys/timeline - Timeline de claves
 * - GET /api/operational-keys/:sessionId - Claves de una sesión
 * 
 * IMPORTANTE: Las rutas específicas deben ir ANTES de la ruta dinámica (/:sessionId) 
 *             para evitar conflictos
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('OperationalKeysAPI');

// ============================================================================
// GET /api/operational-keys/estados-summary
// Resumen de estados operacionales para EstadosYTiemposTab
// ⚠️ DEBE IR ANTES DE /:sessionId
// ============================================================================
router.get('/estados-summary', authenticate, async (req: Request, res: Response) => {
    try {
        // ✅ Obtener prisma dinámicamente en runtime
        const prismaModule = require('../lib/prisma');
        const prisma = prismaModule.prisma || prismaModule.default;

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
                success: true,
                data: {
                    summary: {
                        totalSessions: 0,
                        totalDuration: 0,
                        byState: {}
                    },
                    events: [],
                    timeDistribution: []
                }
            });
        }

        // ✅ Obtener claves de esas sesiones (usando operational_state_segments, NO OperationalKey)
        const claves = await prisma.operational_state_segments.findMany({
            where: { sessionId: { in: sessionIds } }
        });

        // Mapeo de clave a estado
        const claveToState: Record<number, string> = {
            0: 'TALLER',
            1: 'PARQUE',
            2: 'EMERGENCIA',
            3: 'INCENDIO',
            4: 'SIN_DATOS',
            5: 'REGRESO'
        };

        // Calcular estadísticas por estado
        const byState: Record<string, { count: number; duration: number; percentage: number }> = {};
        let duracionTotal = 0;

        claves.forEach(clave => {
            const keyType = clave.clave;  // ✅ Cambiado de keyType a clave
            const durationSec = clave.durationSeconds || 0;  // ✅ Cambiado de duration a durationSeconds
            const stateName = claveToState[keyType] || 'OTRO';

            if (!byState[stateName]) {
                byState[stateName] = { count: 0, duration: 0, percentage: 0 };
            }

            byState[stateName].count++;
            byState[stateName].duration += durationSec;
            duracionTotal += durationSec;
        });

        // Calcular porcentajes
        Object.keys(byState).forEach(state => {
            byState[state].percentage = duracionTotal > 0
                ? (byState[state].duration / duracionTotal) * 100
                : 0;
        });

        // Distribución temporal (agrupado por fecha)
        const timeDistributionMap: Record<string, any> = {};

        claves.forEach(clave => {
            if (!clave.startTime) return;

            const date = new Date(clave.startTime).toISOString().split('T')[0];
            const stateName = claveToState[clave.clave] || 'OTRO';  // ✅ Cambiado
            const durationHours = (clave.durationSeconds || 0) / 3600;  // ✅ Cambiado

            if (!timeDistributionMap[date]) {
                timeDistributionMap[date] = {
                    date,
                    parque: 0,
                    taller: 0,
                    emergencia: 0,
                    incendio: 0,
                    regreso: 0
                };
            }

            const stateKey = stateName.toLowerCase();
            if (timeDistributionMap[date][stateKey] !== undefined) {
                timeDistributionMap[date][stateKey] += durationHours;
            }
        });

        const timeDistribution = Object.values(timeDistributionMap).sort((a: any, b: any) =>
            a.date.localeCompare(b.date)
        );

        // ✅ Obtener eventos detallados con información de sesión (desde operational_state_segments)
        const events = await prisma.operational_state_segments.findMany({
            where: { sessionId: { in: sessionIds } },
            include: {
                Session: {
                    include: { Vehicle: true }
                }
            },
            orderBy: { startTime: 'desc' },
            take: 100 // Limitar a los últimos 100 eventos
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalSessions: sessionIds.length,
                    totalDuration: duracionTotal,
                    byState
                },
                events: events.map(e => ({
                    id: e.id,
                    sessionId: e.sessionId,
                    vehicleName: e.Session.Vehicle.name,
                    vehicleId: e.Session.vehicleId,
                    state: claveToState[e.clave] || 'OTRO',  // ✅ Cambiado
                    keyType: e.clave,  // ✅ Cambiado
                    startTime: e.startTime,
                    endTime: e.endTime,
                    duration: e.durationSeconds,  // ✅ Cambiado
                    rotativoState: null,  // ✅ No existe en operational_state_segments
                    geofenceName: null  // ✅ No existe en operational_state_segments
                })),
                timeDistribution
            }
        });

    } catch (error: any) {
        logger.error('Error obteniendo resumen de estados', { error: error.message });
        res.status(500).json({ error: 'Error obteniendo resumen de estados' });
    }
});

// ============================================================================
// GET /api/operational-keys/summary
// Resumen de claves por filtros (formato original para OperationalKeysTab)
// ⚠️ DEBE IR ANTES DE /:sessionId
// ============================================================================
router.get('/summary', authenticate, async (req: Request, res: Response) => {
    try {
        // ✅ Obtener prisma dinámicamente en runtime
        const prismaModule = require('../lib/prisma');
        const prisma = prismaModule.prisma || prismaModule.default;

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
                porTipo: [],
                duracionTotal: 0,
                duracionTotalMinutos: 0,
                claveMasLarga: null,
                claveMasCorta: null
            });
        }

        // ✅ Obtener claves de esas sesiones (usando operational_state_segments)
        const claves = await prisma.operational_state_segments.findMany({
            where: { sessionId: { in: sessionIds } }
        });

        // Calcular estadísticas
        const porTipo: Record<number, { cantidad: number; duracionTotal: number }> = {};
        let duracionTotal = 0;
        let claveMasLarga: any = null;
        let claveMasCorta: any = null;

        claves.forEach(clave => {
            const keyType = clave.clave;  // ✅ Cambiado
            const durationSec = clave.durationSeconds || 0;  // ✅ Cambiado

            if (!porTipo[keyType]) {
                porTipo[keyType] = { cantidad: 0, duracionTotal: 0 };
            }

            porTipo[keyType].cantidad++;
            porTipo[keyType].duracionTotal += durationSec;
            duracionTotal += durationSec;

            if (!claveMasLarga || durationSec > (claveMasLarga.durationSeconds || 0)) {  // ✅ Cambiado
                claveMasLarga = clave;
            }

            if (!claveMasCorta || durationSec < (claveMasCorta.durationSeconds || 0)) {  // ✅ Cambiado
                claveMasCorta = clave;
            }
        });

        // Formatear respuesta
        const porTipoArray = Object.keys(porTipo).map(tipo => ({
            tipo: parseInt(tipo),
            cantidad: porTipo[parseInt(tipo)].cantidad,
            duracionTotal: porTipo[parseInt(tipo)].duracionTotal,
            duracionTotalMinutos: Math.round(porTipo[parseInt(tipo)].duracionTotal / 60),
            duracionPromedioMinutos: Math.round((porTipo[parseInt(tipo)].duracionTotal / porTipo[parseInt(tipo)].cantidad) / 60)
        }));

        res.json({
            totalClaves: claves.length,
            porTipo: porTipoArray,
            duracionTotal,
            duracionTotalMinutos: Math.round(duracionTotal / 60),
            claveMasLarga: claveMasLarga ? {
                tipo: claveMasLarga.clave,  // ✅ Cambiado
                duracionSegundos: claveMasLarga.durationSeconds || 0,  // ✅ Cambiado
                duracionMinutos: Math.round((claveMasLarga.durationSeconds || 0) / 60)  // ✅ Cambiado
            } : null,
            claveMasCorta: claveMasCorta ? {
                tipo: claveMasCorta.clave,  // ✅ Cambiado
                duracionSegundos: claveMasCorta.durationSeconds || 0,  // ✅ Cambiado
                duracionMinutos: Math.round((claveMasCorta.durationSeconds || 0) / 60)  // ✅ Cambiado
            } : null
        });

    } catch (error: any) {
        logger.error('Error obteniendo resumen de claves', { error: error.message });
        res.status(500).json({ error: 'Error obteniendo resumen de claves' });
    }
});

// ============================================================================
// GET /api/operational-keys/timeline
// Timeline de claves para visualización (gráfica Gantt)
// ⚠️ DEBE IR ANTES DE /:sessionId
// ============================================================================
router.get('/timeline', authenticate, async (req: Request, res: Response) => {
    try {
        // ✅ Obtener prisma dinámicamente en runtime (evita undefined en tiempo de carga)
        const { prisma } = require('../lib/prisma');

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

        // ✅ Obtener claves (usando operational_state_segments)
        const claves = await prisma.operational_state_segments.findMany({
            where: { sessionId: { in: sessionIds } },
            include: {
                Session: {
                    include: { Vehicle: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // Formatear para timeline
        const timeline = claves.map(c => {
            const metadata = (c.metadata as any) || {};  // ✅ Cambiado details → metadata
            return {
                id: c.id,
                sessionId: c.sessionId,
                vehiculo: c.Session.Vehicle.name,
                vehiculoId: c.Session.vehicleId,
                tipo: c.clave, // 0-5  // ✅ Cambiado
                inicio: c.startTime,
                fin: c.endTime,
                duracionMinutos: Math.round((c.durationSeconds || 0) / 60),  // ✅ Cambiado
                rotativoOn: metadata.rotativoOn || false,  // ✅ Desde metadata
                geocerca: null,  // ✅ No existe en operational_state_segments
                geofenceName: null,  // ✅ No existe en operational_state_segments
                color: getColorPorTipo(c.clave)  // ✅ Cambiado
            };
        });

        logger.info(`Timeline generado: ${timeline.length} claves`);

        res.json({ timeline });

    } catch (error: any) {
        logger.error('Error generando timeline', { error: error.message });
        res.status(500).json({ error: 'Error generando timeline' });
    }
});

// ============================================================================
// GET /api/operational-keys/:sessionId
// Obtener claves de una sesión específica
// ⚠️ DEBE IR AL FINAL (después de /summary y /timeline)
// ============================================================================
router.get('/:sessionId', authenticate, async (req: Request, res: Response) => {
    try {
        // ✅ Obtener prisma dinámicamente en runtime (evita undefined en tiempo de carga)
        const { prisma } = require('../lib/prisma');

        const { sessionId } = req.params;
        logger.info(`Obteniendo claves de sesión ${sessionId}`);

        // Verificar que la sesión existe y pertenece a la organización
        const sesion = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { Vehicle: true }
        });

        if (!sesion) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        if (sesion.organizationId !== req.user?.organizationId) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        // ✅ Obtener claves (usando operational_state_segments)
        const claves = await prisma.operational_state_segments.findMany({
            where: { sessionId },
            orderBy: { startTime: 'asc' }
        });

        logger.info(`Claves encontradas: ${claves.length}`);

        res.json({
            sessionId,
            vehicleId: sesion.vehicleId,
            vehicleName: sesion.Vehicle.name,
            startTime: sesion.startTime,
            endTime: sesion.endTime,
            claves: claves.map(c => {
                const metadata = (c.metadata as any) || {};  // ✅ Cambiado
                return {
                    id: c.id,
                    tipo: c.clave,  // ✅ Cambiado
                    inicio: c.startTime,
                    fin: c.endTime,
                    duracionSegundos: c.durationSeconds || 0,  // ✅ Cambiado
                    duracionMinutos: Math.round((c.durationSeconds || 0) / 60),  // ✅ Cambiado
                    rotativoEncendido: metadata.rotativoOn || false,  // ✅ Desde metadata
                    geocerca: null,  // ✅ No existe en operational_state_segments
                    geofenceName: null,  // ✅ No existe en operational_state_segments
                    coordenadasInicio: null,  // ✅ No existe en operational_state_segments
                    coordenadasFin: null,  // ✅ No existe en operational_state_segments
                    detalles: metadata || null  // ✅ Cambiado
                };
            })
        });

    } catch (error: any) {
        logger.error('Error obteniendo claves de sesión', { error: error.message });
        res.status(500).json({ error: 'Error obteniendo claves operacionales' });
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
