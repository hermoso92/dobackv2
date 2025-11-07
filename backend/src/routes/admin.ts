/**
 * 🔐 ENDPOINTS ADMINISTRATIVOS
 * Solo accesibles por rol ADMIN
 * 
 * Endpoints:
 * - POST /api/admin/delete-all-data - Eliminar TODOS los datos de la organización
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createLogger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { kpiCacheService } from '../services/KPICacheService';

const router = Router();
const logger = createLogger('AdminAPI');

/**
 * POST /api/admin/delete-all-data
 * Elimina TODOS los datos de una organización
 * ⚠️ ACCIÓN IRREVERSIBLE - Para ADMIN o MANAGER
 */
router.post('/delete-all-data', authenticate, async (req: Request, res: Response) => {
    try {
        // Verificar que el usuario es ADMIN o MANAGER
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
            logger.warn(`⚠️ Intento de borrado total por usuario no autorizado: ${req.user?.id} (rol: ${req.user?.role})`);
            return res.status(403).json({ 
                success: false,
                error: 'Solo usuarios ADMIN o MANAGER pueden ejecutar esta acción' 
            });
        }

        const { confirmacion } = req.body;
        
        if (confirmacion !== 'ELIMINAR_TODO') {
            return res.status(400).json({ 
                success: false,
                error: 'Confirmación incorrecta. Debe enviar: confirmacion: "ELIMINAR_TODO"' 
            });
        }

        const orgId = req.user.organizationId;

        logger.warn(`🚨 BORRADO TOTAL DE DATOS iniciado`, {
            userId: req.user.id,
            userEmail: req.user.email,
            organizationId: orgId,
            timestamp: new Date().toISOString()
        });

        // Objeto para contar registros eliminados
        const deletedCounts = {
            sessions: 0,
            events: 0,
            segments: 0,
            gps: 0,
            can: 0,
            rotativo: 0,
            estabilidad: 0,
            operationalKeys: 0
        };

        // Usar transacción para seguridad (todo o nada)
        await prisma.$transaction(async (tx) => {
            // ORDEN CORRECTO: Eliminar tablas dependientes primero, padres al final

            // 1. Eliminar segmentos operacionales (dependen de Session)
            const seg = await tx.operational_state_segments.deleteMany({
                where: { 
                    Session: { organizationId: orgId } 
                }
            });
            deletedCounts.segments = seg.count;

            // 2. Eliminar OperationalKeys (tabla vieja, por si acaso)
            try {
                const opKeys = await tx.operationalKey.deleteMany({
                    where: { 
                        Session: { organizationId: orgId } 
                    }
                });
                deletedCounts.operationalKeys = opKeys.count;
            } catch (e) {
                logger.warn('No se pudieron eliminar OperationalKeys (tabla puede no existir)');
            }

            // 3. Eliminar eventos de estabilidad (dependen de Session)
            const evt = await tx.stability_events.deleteMany({
                where: { 
                    Session: { organizationId: orgId } 
                }
            });
            deletedCounts.events = evt.count;

            // 4. Eliminar mediciones GPS (dependen de Session)
            const gps = await tx.gpsMeasurement.deleteMany({
                where: { 
                    Session: { organizationId: orgId } 
                }
            });
            deletedCounts.gps = gps.count;

            // 5. Eliminar mediciones CAN (dependen de Session)
            const can = await tx.canMeasurement.deleteMany({
                where: { 
                    Session: { organizationId: orgId } 
                }
            });
            deletedCounts.can = can.count;

            // 6. Eliminar mediciones Rotativo (dependen de Session)
            const rot = await tx.rotativoMeasurement.deleteMany({
                where: { 
                    Session: { organizationId: orgId } 
                }
            });
            deletedCounts.rotativo = rot.count;

            // 7. Eliminar mediciones de Estabilidad (dependen de Session)
            const stb = await tx.stabilityMeasurement.deleteMany({
                where: { 
                    Session: { organizationId: orgId } 
                }
            });
            deletedCounts.estabilidad = stb.count;

            // 8. Eliminar sesiones (tabla padre, al final)
            const ses = await tx.session.deleteMany({
                where: { organizationId: orgId }
            });
            deletedCounts.sessions = ses.count;

            logger.warn(`✅ Borrado completado exitosamente:`, deletedCounts);
        });

        // Invalidar TODA la caché de KPIs
        try {
            await kpiCacheService.invalidateAllByOrg(orgId);
            logger.info('✅ Caché de KPIs invalidada');
        } catch (cacheError) {
            logger.error('Error invalidando caché (no crítico):', cacheError);
        }

        res.json({
            success: true,
            message: 'Todos los datos han sido eliminados exitosamente',
            deleted: deletedCounts
        });

    } catch (error: any) {
        logger.error('❌ Error ejecutando borrado total de datos:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false,
            error: 'Error al eliminar datos',
            details: error.message 
        });
    }
});

export default router;
