/**
 * 🗺️ RUTAS DE ANÁLISIS DE ZONAS DE RIESGO - BOMBEROS MADRID
 * Endpoints para análisis y evaluación de zonas de alto riesgo
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { riskZoneAnalysisService } from '../services/riskZoneAnalysisService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/risk-zones
 * Obtiene todas las zonas de riesgo
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { riskLevel, type, limit = '50', offset = '0' } = req.query;

        let zones = riskZoneAnalysisService.getAllRiskZones();

        // Filtrar por nivel de riesgo
        if (riskLevel && typeof riskLevel === 'string') {
            zones = zones.filter(zone => zone.riskLevel === riskLevel.toUpperCase());
        }

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            zones = zones.filter(zone => zone.type === type.toUpperCase());
        }

        // Ordenar por score de riesgo (mayor a menor)
        zones.sort((a, b) => b.riskScore - a.riskScore);

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedZones = zones.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedZones,
            pagination: {
                total: zones.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < zones.length
            },
            filters: {
                riskLevel: riskLevel || 'all',
                type: type || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo zonas de riesgo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/:zoneId
 * Obtiene una zona de riesgo específica
 */
router.get('/:zoneId', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const zone = riskZoneAnalysisService.getRiskZone(zoneId);

        if (!zone) {
            return res.status(404).json({
                success: false,
                error: 'Zona de riesgo no encontrada'
            });
        }

        res.json({
            success: true,
            data: zone,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo zona de riesgo ${req.params.zoneId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/risk-zones/:zoneId/analyze
 * Analiza el riesgo de una zona específica
 */
router.post('/:zoneId/analyze', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;

        const analysis = await riskZoneAnalysisService.analyzeZoneRisk(zoneId);

        res.status(201).json({
            success: true,
            data: analysis,
            message: 'Análisis de riesgo completado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error analizando zona de riesgo ${req.params.zoneId}:`, error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/risk-zones/compare
 * Compara múltiples zonas de riesgo
 */
router.post('/compare', async (req: Request, res: Response) => {
    try {
        const { zoneIds } = req.body;

        if (!zoneIds || !Array.isArray(zoneIds) || zoneIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren al menos 2 IDs de zona para comparar'
            });
        }

        const comparison = await riskZoneAnalysisService.compareZones(zoneIds);

        res.status(201).json({
            success: true,
            data: comparison,
            message: 'Comparación de zonas completada exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error comparando zonas de riesgo:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/:zoneId/analyses
 * Obtiene análisis históricos de una zona
 */
router.get('/:zoneId/analyses', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const { limit = '20', offset = '0' } = req.query;

        const analyses = riskZoneAnalysisService.getAnalysesByZone(zoneId);

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedAnalyses = analyses.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedAnalyses,
            pagination: {
                total: analyses.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < analyses.length
            },
            zoneId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo análisis de zona ${req.params.zoneId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/stats
 * Obtiene estadísticas de zonas de riesgo
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = riskZoneAnalysisService.getStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de zonas de riesgo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/types
 * Obtiene los tipos de zonas disponibles
 */
router.get('/types', async (req: Request, res: Response) => {
    try {
        const zoneTypes = [
            {
                type: 'RESIDENTIAL',
                name: 'Residencial',
                description: 'Zonas principalmente residenciales',
                icon: '🏠',
                color: '#4CAF50'
            },
            {
                type: 'COMMERCIAL',
                name: 'Comercial',
                description: 'Zonas con alta actividad comercial',
                icon: '🏪',
                color: '#2196F3'
            },
            {
                type: 'INDUSTRIAL',
                name: 'Industrial',
                description: 'Zonas industriales con materiales peligrosos',
                icon: '🏭',
                color: '#FF9800'
            },
            {
                type: 'HISTORICAL',
                name: 'Histórica',
                description: 'Zonas con edificios históricos',
                icon: '🏛️',
                color: '#9C27B0'
            },
            {
                type: 'MIXED',
                name: 'Mixta',
                description: 'Zonas con usos mixtos',
                icon: '🏙️',
                color: '#607D8B'
            }
        ];

        res.json({
            success: true,
            data: zoneTypes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo tipos de zonas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/risk-levels
 * Obtiene los niveles de riesgo disponibles
 */
router.get('/risk-levels', async (req: Request, res: Response) => {
    try {
        const riskLevels = [
            {
                level: 'LOW',
                name: 'Bajo',
                description: 'Riesgo bajo - Menos de 25 puntos',
                color: '#4CAF50',
                threshold: 25
            },
            {
                level: 'MEDIUM',
                name: 'Medio',
                description: 'Riesgo medio - 25-50 puntos',
                color: '#FFC107',
                threshold: 50
            },
            {
                level: 'HIGH',
                name: 'Alto',
                description: 'Riesgo alto - 50-75 puntos',
                color: '#FF9800',
                threshold: 75
            },
            {
                level: 'CRITICAL',
                name: 'Crítico',
                description: 'Riesgo crítico - Más de 75 puntos',
                color: '#F44336',
                threshold: 100
            }
        ];

        res.json({
            success: true,
            data: riskLevels,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo niveles de riesgo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/:zoneId/incidents
 * Obtiene incidentes históricos de una zona
 */
router.get('/:zoneId/incidents', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const { type, severity, limit = '50', offset = '0' } = req.query;

        const zone = riskZoneAnalysisService.getRiskZone(zoneId);

        if (!zone) {
            return res.status(404).json({
                success: false,
                error: 'Zona de riesgo no encontrada'
            });
        }

        let incidents = zone.historicalIncidents;

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            incidents = incidents.filter(incident => incident.type === type.toUpperCase());
        }

        // Filtrar por severidad
        if (severity && typeof severity === 'string') {
            incidents = incidents.filter(incident => incident.severity === severity.toUpperCase());
        }

        // Ordenar por fecha (más recientes primero)
        incidents.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedIncidents = incidents.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedIncidents,
            pagination: {
                total: incidents.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < incidents.length
            },
            filters: {
                type: type || 'all',
                severity: severity || 'all'
            },
            zoneId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo incidentes de zona ${req.params.zoneId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/:zoneId/factors
 * Obtiene factores de riesgo de una zona
 */
router.get('/:zoneId/factors', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;
        const { category, severity } = req.query;

        const zone = riskZoneAnalysisService.getRiskZone(zoneId);

        if (!zone) {
            return res.status(404).json({
                success: false,
                error: 'Zona de riesgo no encontrada'
            });
        }

        let factors = zone.riskFactors;

        // Filtrar por categoría
        if (category && typeof category === 'string') {
            factors = factors.filter(factor => factor.category === category.toUpperCase());
        }

        // Filtrar por severidad
        if (severity && typeof severity === 'string') {
            factors = factors.filter(factor => factor.severity === severity.toUpperCase());
        }

        // Ordenar por peso (mayor a menor)
        factors.sort((a, b) => b.weight - a.weight);

        res.json({
            success: true,
            data: factors,
            filters: {
                category: category || 'all',
                severity: severity || 'all'
            },
            zoneId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo factores de riesgo de zona ${req.params.zoneId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/risk-zones/:zoneId/infrastructure
 * Obtiene información de infraestructura de una zona
 */
router.get('/:zoneId/infrastructure', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.params;

        const zone = riskZoneAnalysisService.getRiskZone(zoneId);

        if (!zone) {
            return res.status(404).json({
                success: false,
                error: 'Zona de riesgo no encontrada'
            });
        }

        res.json({
            success: true,
            data: zone.infrastructure,
            zoneId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo infraestructura de zona ${req.params.zoneId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
