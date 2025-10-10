import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { organizationMiddleware } from '../middleware/organizationMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
// const pdfController = new PDFExportController(prisma);

// Middleware de autenticación y organización
router.use(authenticate);
router.use(organizationMiddleware);

// Obtener lista de reportes
router.get('/', async (req, res) => {
    try {
        const { organizationId } = req.user!;
        const { limit = 50, offset = 0, type, status } = req.query;

        const where: any = {
            organizationId: organizationId
        };

        if (status) {
            where.status = status;
        }

        const reports = await prisma.report.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            take: Number(limit),
            skip: Number(offset),
            include: {
                User: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: reports.map(report => ({
                id: report.id,
                title: `Reporte ${report.id}`,
                type: 'dashboard',
                status: report.status.toLowerCase(),
                created_at: report.createdAt,
                created_by: report.User?.name || 'Sistema',
                file_path: report.filePath,
                file_size: report.sizeBytes,
                description: `Reporte generado el ${report.createdAt.toLocaleDateString('es-ES')}`,
                parameters: report.params,
                download_count: 0
            }))
        });
    } catch (error) {
        logger.error('Error obteniendo reportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Generar nuevo reporte
router.post('/generate', async (req, res) => {
    try {
        const { organizationId, id: userId } = req.user!;
        const { templateId, parameters } = req.body;

        if (!templateId) {
            return res.status(400).json({
                success: false,
                error: 'Template ID es requerido'
            });
        }

        // Crear registro de reporte
        const report = await prisma.report.create({
            data: {
                organizationId: organizationId,
                requestedById: userId,
                params: parameters || {},
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
                updatedAt: new Date()
            }
        });

        // Simular generación de reporte en segundo plano
        setImmediate(async () => {
            try {
                // Simular tiempo de procesamiento
                await new Promise(resolve => setTimeout(resolve, 3000));

                const fileName = `report_${templateId}_${Date.now()}.pdf`;
                const filePath = `generated/${fileName}`;
                const fileSize = Math.floor(Math.random() * 2000000) + 500000; // 500KB - 2.5MB

                // Actualizar reporte con archivo generado
                await prisma.report.update({
                    where: { id: report.id },
                    data: {
                        status: 'READY',
                        filePath: filePath,
                        sizeBytes: fileSize,
                        updatedAt: new Date()
                    }
                });

                logger.info('Reporte generado exitosamente', {
                    reportId: report.id,
                    templateId,
                    filePath
                });
            } catch (error) {
                logger.error('Error generando reporte:', error);

                // Marcar reporte como error
                await prisma.report.update({
                    where: { id: report.id },
                    data: {
                        status: 'FAILED',
                        updatedAt: new Date()
                    }
                });
            }
        });

        res.json({
            success: true,
            data: {
                id: report.id,
                message: 'Reporte en proceso de generación'
            }
        });
    } catch (error) {
        logger.error('Error iniciando generación de reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Descargar reporte
router.get('/:id/download', async (req, res) => {
    try {
        const { organizationId } = req.user!;
        const { id } = req.params;

        const report = await prisma.report.findFirst({
            where: {
                id,
                organizationId: organizationId,
                status: 'READY'
            }
        });

        if (!report || !report.filePath) {
            return res.status(404).json({
                success: false,
                error: 'Reporte no encontrado o no disponible'
            });
        }

        // Simular descarga de archivo
        res.json({
            success: true,
            message: 'Descarga simulada',
            filePath: report.filePath,
            fileName: `reporte_${report.id}.pdf`
        });

        logger.info('Reporte descargado', { reportId: id, userId: req.user!.id });
    } catch (error) {
        logger.error('Error descargando reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Eliminar reporte
router.delete('/:id', async (req, res) => {
    try {
        const { organizationId } = req.user!;
        const { id } = req.params;

        const report = await prisma.report.findFirst({
            where: {
                id,
                organizationId: organizationId
            }
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }

        // Eliminar registro de la base de datos
        await prisma.report.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Reporte eliminado exitosamente'
        });

        logger.info('Reporte eliminado', { reportId: id, userId: req.user!.id });
    } catch (error) {
        logger.error('Error eliminando reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de reportes
router.get('/stats', async (req, res) => {
    try {
        const { organizationId } = req.user!;

        const stats = await prisma.report.groupBy({
            by: ['status'],
            where: {
                organizationId: organizationId
            },
            _count: {
                id: true
            }
        });

        const totalReports = await prisma.report.count({
            where: {
                organizationId: organizationId
            }
        });

        res.json({
            success: true,
            data: {
                totalReports,
                totalDownloads: 0,
                byType: {
                    dashboard: stats.reduce((acc, stat) => {
                        if (!acc[stat.status]) {
                            acc[stat.status] = 0;
                        }
                        acc[stat.status] += stat._count.id || 0;
                        return acc;
                    }, {} as any)
                }
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de reportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;