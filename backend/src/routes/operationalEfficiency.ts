/**
 * 📊 RUTAS DE ANÁLISIS DE EFICIENCIA OPERATIVA - BOMBEROS MADRID
 * Endpoints para análisis de eficiencia operativa de vehículos, personal y recursos
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { OperationalAnalysis, operationalEfficiencyService } from '../services/operationalEfficiencyService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * POST /api/operational-efficiency/analyze
 * Genera un análisis de eficiencia operativa
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const {
            type,
            entityId,
            entityName,
            startDate,
            endDate
        } = req.body;

        // Validar campos requeridos
        if (!type || !entityId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: type, entityId, startDate, endDate'
            });
        }

        // Validar tipo
        const validTypes = ['VEHICLE', 'PERSONNEL', 'ZONE', 'GENERAL'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Tipo inválido. Valores válidos: ${validTypes.join(', ')}`
            });
        }

        // Validar fechas
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({
                success: false,
                error: 'La fecha de inicio debe ser anterior a la fecha de fin'
            });
        }

        const analysis = await operationalEfficiencyService.generateOperationalAnalysis(
            type as OperationalAnalysis['type'],
            entityId,
            { start, end }
        );

        res.status(201).json({
            success: true,
            data: analysis,
            message: 'Análisis de eficiencia operativa generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando análisis de eficiencia operativa:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/analyses
 * Obtiene todos los análisis de eficiencia
 */
router.get('/analyses', async (req: Request, res: Response) => {
    try {
        const {
            type,
            entityId,
            limit = '50',
            offset = '0'
        } = req.query;

        let analyses = operationalEfficiencyService.getAllAnalyses();

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            analyses = analyses.filter(a => a.type === type.toUpperCase());
        }

        // Filtrar por entidad
        if (entityId && typeof entityId === 'string') {
            analyses = analyses.filter(a => a.entityId === entityId);
        }

        // Ordenar por fecha de generación (más recientes primero)
        analyses.sort((a, b) => b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime());

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
            filters: {
                type: type || 'all',
                entityId: entityId || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo análisis de eficiencia:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/analyses/:analysisId
 * Obtiene un análisis específico
 */
router.get('/analyses/:analysisId', async (req: Request, res: Response) => {
    try {
        const { analysisId } = req.params;
        const analysis = operationalEfficiencyService.getAnalysis(analysisId);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: 'Análisis no encontrado'
            });
        }

        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo análisis ${req.params.analysisId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/analyses/type/:type
 * Obtiene análisis por tipo
 */
router.get('/analyses/type/:type', async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const { limit = '50', offset = '0' } = req.query;

        // Validar tipo
        const validTypes = ['VEHICLE', 'PERSONNEL', 'ZONE', 'GENERAL'];
        if (!validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: `Tipo inválido. Valores válidos: ${validTypes.join(', ')}`
            });
        }

        let analyses = operationalEfficiencyService.getAnalysesByType(type.toUpperCase() as OperationalAnalysis['type']);

        // Ordenar por fecha de generación (más recientes primero)
        analyses.sort((a, b) => b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime());

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
            type: type.toUpperCase(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo análisis por tipo ${req.params.type}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/analyses/entity/:entityId
 * Obtiene análisis por entidad
 */
router.get('/analyses/entity/:entityId', async (req: Request, res: Response) => {
    try {
        const { entityId } = req.params;
        const { limit = '50', offset = '0' } = req.query;

        let analyses = operationalEfficiencyService.getAnalysesByEntity(entityId);

        // Ordenar por fecha de generación (más recientes primero)
        analyses.sort((a, b) => b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime());

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
            entityId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo análisis por entidad ${req.params.entityId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/benchmarks
 * Obtiene todos los benchmarks de eficiencia
 */
router.get('/benchmarks', async (req: Request, res: Response) => {
    try {
        const { category, metric } = req.query;

        let benchmarks = operationalEfficiencyService.getAllBenchmarks();

        // Filtrar por categoría
        if (category && typeof category === 'string') {
            benchmarks = benchmarks.filter(b => b.category.toLowerCase().includes(category.toLowerCase()));
        }

        // Filtrar por métrica
        if (metric && typeof metric === 'string') {
            benchmarks = benchmarks.filter(b => b.metric.toLowerCase().includes(metric.toLowerCase()));
        }

        // Ordenar por categoría y métrica
        benchmarks.sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
            return a.metric.localeCompare(b.metric);
        });

        res.json({
            success: true,
            data: benchmarks,
            filters: {
                category: category || 'all',
                metric: metric || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo benchmarks de eficiencia:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/benchmarks/:category/:metric
 * Obtiene un benchmark específico
 */
router.get('/benchmarks/:category/:metric', async (req: Request, res: Response) => {
    try {
        const { category, metric } = req.params;
        const benchmarkKey = `${category}_${metric}`;

        // Buscar benchmark por clave
        const benchmarks = operationalEfficiencyService.getAllBenchmarks();
        const benchmark = benchmarks.find(b =>
            b.category.toLowerCase() === category.toLowerCase() &&
            b.metric.toLowerCase() === metric.toLowerCase()
        );

        if (!benchmark) {
            return res.status(404).json({
                success: false,
                error: 'Benchmark no encontrado'
            });
        }

        res.json({
            success: true,
            data: benchmark,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo benchmark ${req.params.category}/${req.params.metric}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/stats
 * Obtiene estadísticas del servicio
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = operationalEfficiencyService.getStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de eficiencia operativa:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/status
 * Obtiene el estado del servicio
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const stats = operationalEfficiencyService.getStats();
        const analyses = operationalEfficiencyService.getAllAnalyses();

        res.json({
            success: true,
            data: {
                isRunning: true,
                stats,
                recentAnalyses: analyses
                    .sort((a, b) => b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime())
                    .slice(0, 5),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estado del servicio de eficiencia operativa:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/top-performers
 * Obtiene los mejores rendimientos
 */
router.get('/top-performers', async (req: Request, res: Response) => {
    try {
        const { type, limit = '10' } = req.query;

        let analyses = operationalEfficiencyService.getAllAnalyses();

        // Filtrar por tipo si se especifica
        if (type && typeof type === 'string') {
            analyses = analyses.filter(a => a.type === type.toUpperCase());
        }

        // Ordenar por score de eficiencia (mayor a menor)
        analyses.sort((a, b) => b.analysis.currentPerformance.efficiencyScore - a.analysis.currentPerformance.efficiencyScore);

        // Aplicar límite
        const limitNum = parseInt(limit as string);
        const topPerformers = analyses.slice(0, limitNum);

        res.json({
            success: true,
            data: topPerformers.map(analysis => ({
                id: analysis.id,
                entityId: analysis.entityId,
                entityName: analysis.entityName,
                type: analysis.type,
                efficiencyScore: analysis.analysis.currentPerformance.efficiencyScore,
                grade: analysis.analysis.currentPerformance.grade,
                period: analysis.period,
                generatedAt: analysis.metadata.generatedAt
            })),
            count: topPerformers.length,
            filters: {
                type: type || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo mejores rendimientos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-efficiency/under-performers
 * Obtiene los rendimientos deficientes
 */
router.get('/under-performers', async (req: Request, res: Response) => {
    try {
        const { type, limit = '10' } = req.query;

        let analyses = operationalEfficiencyService.getAllAnalyses();

        // Filtrar por tipo si se especifica
        if (type && typeof type === 'string') {
            analyses = analyses.filter(a => a.type === type.toUpperCase());
        }

        // Ordenar por score de eficiencia (menor a mayor)
        analyses.sort((a, b) => a.analysis.currentPerformance.efficiencyScore - b.analysis.currentPerformance.efficiencyScore);

        // Aplicar límite
        const limitNum = parseInt(limit as string);
        const underPerformers = analyses.slice(0, limitNum);

        res.json({
            success: true,
            data: underPerformers.map(analysis => ({
                id: analysis.id,
                entityId: analysis.entityId,
                entityName: analysis.entityName,
                type: analysis.type,
                efficiencyScore: analysis.analysis.currentPerformance.efficiencyScore,
                grade: analysis.analysis.currentPerformance.grade,
                period: analysis.period,
                generatedAt: analysis.metadata.generatedAt,
                criticalIssues: analysis.insights.criticalIssues
            })),
            count: underPerformers.length,
            filters: {
                type: type || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo rendimientos deficientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/operational-efficiency/test
 * Prueba el sistema con un análisis de ejemplo
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { type = 'VEHICLE', entityId = 'DOBACK027' } = req.body;

        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const analysis = await operationalEfficiencyService.generateOperationalAnalysis(
            type as OperationalAnalysis['type'],
            entityId,
            { start: startDate, end: now }
        );

        res.status(201).json({
            success: true,
            data: analysis,
            message: 'Análisis de prueba generado exitosamente',
            testParams: {
                type,
                entityId,
                startDate: startDate.toISOString(),
                endDate: now.toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando análisis de prueba:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

export default router;
