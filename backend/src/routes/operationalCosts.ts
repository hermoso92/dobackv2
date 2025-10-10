/**
 * 💰 RUTAS DE REPORTES DE COSTOS OPERATIVOS - BOMBEROS MADRID
 * Endpoints para análisis y reportes de costos operativos
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { CostAnalysis, CostRecord, operationalCostsService } from '../services/operationalCostsService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * POST /api/operational-costs/analyze
 * Genera un análisis de costos operativos
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
        const validTypes = ['VEHICLE', 'PERSONNEL', 'ZONE', 'DEPARTMENT', 'ORGANIZATION'];
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

        const analysis = await operationalCostsService.generateCostAnalysis(
            type as CostAnalysis['type'],
            entityId,
            { start, end }
        );

        res.status(201).json({
            success: true,
            data: analysis,
            message: 'Análisis de costos operativos generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando análisis de costos operativos:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/analyses
 * Obtiene todos los análisis de costos
 */
router.get('/analyses', async (req: Request, res: Response) => {
    try {
        const {
            type,
            entityId,
            limit = '50',
            offset = '0'
        } = req.query;

        let analyses = operationalCostsService.getAllCostAnalyses();

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
        logger.error('Error obteniendo análisis de costos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/analyses/:analysisId
 * Obtiene un análisis específico
 */
router.get('/analyses/:analysisId', async (req: Request, res: Response) => {
    try {
        const { analysisId } = req.params;
        const analysis = operationalCostsService.getCostAnalysis(analysisId);

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
 * GET /api/operational-costs/categories
 * Obtiene todas las categorías de costos
 */
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const { type, active } = req.query;

        let categories = operationalCostsService.getAllCostCategories();

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            categories = categories.filter(c => c.type === type.toUpperCase());
        }

        // Filtrar por estado activo (todos están activos por defecto)
        if (active !== undefined) {
            const isActive = active === 'true';
            // En este caso, todos están activos, pero se puede implementar lógica de filtrado
        }

        // Ordenar por nombre
        categories.sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            success: true,
            data: categories,
            filters: {
                type: type || 'all',
                active: active || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo categorías de costos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/categories/:categoryId
 * Obtiene una categoría específica
 */
router.get('/categories/:categoryId', async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.params;
        const categories = operationalCostsService.getAllCostCategories();
        const category = categories.find(c => c.id === categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            data: category,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo categoría ${req.params.categoryId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/records
 * Obtiene todos los registros de costos
 */
router.get('/records', async (req: Request, res: Response) => {
    try {
        const {
            category,
            subcategory,
            entityId,
            entityType,
            paymentStatus,
            startDate,
            endDate,
            limit = '50',
            offset = '0'
        } = req.query;

        let records = operationalCostsService.getAllCostRecords();

        // Filtrar por categoría
        if (category && typeof category === 'string') {
            records = records.filter(r => r.category === category);
        }

        // Filtrar por subcategoría
        if (subcategory && typeof subcategory === 'string') {
            records = records.filter(r => r.subcategory === subcategory);
        }

        // Filtrar por entidad
        if (entityId && typeof entityId === 'string') {
            records = records.filter(r => r.entityId === entityId);
        }

        // Filtrar por tipo de entidad
        if (entityType && typeof entityType === 'string') {
            records = records.filter(r => r.entityType === entityType.toUpperCase());
        }

        // Filtrar por estado de pago
        if (paymentStatus && typeof paymentStatus === 'string') {
            records = records.filter(r => r.paymentStatus === paymentStatus.toUpperCase());
        }

        // Filtrar por rango de fechas
        if (startDate && typeof startDate === 'string') {
            const start = new Date(startDate);
            records = records.filter(r => r.date >= start);
        }

        if (endDate && typeof endDate === 'string') {
            const end = new Date(endDate);
            records = records.filter(r => r.date <= end);
        }

        // Ordenar por fecha (más recientes primero)
        records.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedRecords = records.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedRecords,
            pagination: {
                total: records.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < records.length
            },
            filters: {
                category: category || 'all',
                subcategory: subcategory || 'all',
                entityId: entityId || 'all',
                entityType: entityType || 'all',
                paymentStatus: paymentStatus || 'all',
                startDate: startDate || 'all',
                endDate: endDate || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo registros de costos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/stats
 * Obtiene estadísticas del servicio
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = operationalCostsService.getStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de costos operativos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/status
 * Obtiene el estado del servicio
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const stats = operationalCostsService.getStats();
        const analyses = operationalCostsService.getAllCostAnalyses();

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
        logger.error('Error obteniendo estado del servicio de costos operativos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/summary
 * Obtiene resumen de costos
 */
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const { period = 'month' } = req.query;

        const stats = operationalCostsService.getStats();
        const analyses = operationalCostsService.getAllCostAnalyses();

        // Calcular resumen por período
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás

        const recentAnalyses = analyses.filter(a => a.metadata.generatedAt >= startDate);

        const summary = {
            period,
            totalCosts: stats.totalCosts,
            totalRecords: stats.totalRecords,
            totalAnalyses: stats.totalAnalyses,
            byCategory: stats.byCategory,
            byEntity: stats.byEntity,
            byPaymentStatus: stats.byPaymentStatus,
            averageCostPerRecord: stats.averageCostPerRecord,
            recentAnalyses: recentAnalyses.length,
            costTrends: {
                total: stats.totalCosts,
                change: Math.random() * 20 - 10, // Simulado
                direction: Math.random() > 0.5 ? 'INCREASING' : 'DECREASING'
            },
            topCostDrivers: Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => ({
                    category,
                    amount: Math.round(amount * 100) / 100,
                    percentage: Math.round((amount / stats.totalCosts) * 100 * 100) / 100
                })),
            recommendations: [
                'Revisar costos de combustible',
                'Optimizar mantenimiento preventivo',
                'Evaluar eficiencia de personal'
            ]
        };

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo resumen de costos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operational-costs/trends
 * Obtiene tendencias de costos
 */
router.get('/trends', async (req: Request, res: Response) => {
    try {
        const { period = 'month', entityId, category } = req.query;

        const records = operationalCostsService.getAllCostRecords();

        // Filtrar por entidad si se especifica
        let filteredRecords = records;
        if (entityId && typeof entityId === 'string') {
            filteredRecords = records.filter(r => r.entityId === entityId);
        }

        // Filtrar por categoría si se especifica
        if (category && typeof category === 'string') {
            filteredRecords = filteredRecords.filter(r => r.category === category);
        }

        // Generar tendencias mensuales
        const monthlyTrends = this.generateMonthlyTrends(filteredRecords);

        const trends = {
            period,
            entityId: entityId || 'all',
            category: category || 'all',
            monthlyTrends,
            summary: {
                totalCosts: filteredRecords.reduce((sum, r) => sum + r.amount, 0),
                averageMonthly: monthlyTrends.reduce((sum, m) => sum + m.total, 0) / monthlyTrends.length,
                trend: this.calculateTrend(monthlyTrends),
                volatility: this.calculateVolatility(monthlyTrends)
            }
        };

        res.json({
            success: true,
            data: trends,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo tendencias de costos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/operational-costs/test
 * Prueba el sistema con un análisis de ejemplo
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { type = 'VEHICLE', entityId = 'DOBACK027' } = req.body;

        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const analysis = await operationalCostsService.generateCostAnalysis(
            type as CostAnalysis['type'],
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

// Métodos auxiliares privados
function generateMonthlyTrends(records: CostRecord[]): Array<{
    month: string;
    total: number;
    byCategory: { [category: string]: number };
}> {
    const monthlyData: { [month: string]: { total: number; byCategory: { [category: string]: number } } } = {};

    records.forEach(record => {
        const month = record.date.toISOString().substr(0, 7); // YYYY-MM

        if (!monthlyData[month]) {
            monthlyData[month] = { total: 0, byCategory: {} };
        }

        monthlyData[month].total += record.amount;
        monthlyData[month].byCategory[record.category] = (monthlyData[month].byCategory[record.category] || 0) + record.amount;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        total: Math.round(data.total * 100) / 100,
        byCategory: data.byCategory
    })).sort((a, b) => a.month.localeCompare(b.month));
}

function calculateTrend(monthlyTrends: Array<{ month: string; total: number }>): string {
    if (monthlyTrends.length < 2) return 'STABLE';

    const recent = monthlyTrends.slice(-3); // Últimos 3 meses
    const older = monthlyTrends.slice(-6, -3); // 3 meses anteriores

    if (recent.length === 0 || older.length === 0) return 'STABLE';

    const recentAvg = recent.reduce((sum, m) => sum + m.total, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.total, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'INCREASING';
    if (change < -10) return 'DECREASING';
    return 'STABLE';
}

function calculateVolatility(monthlyTrends: Array<{ month: string; total: number }>): number {
    if (monthlyTrends.length < 2) return 0;

    const values = monthlyTrends.map(m => m.total);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return Math.round((standardDeviation / mean) * 100 * 100) / 100; // Coeficiente de variación
}

export default router;
