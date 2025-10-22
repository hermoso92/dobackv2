import { Request, Response, Router } from 'express';
import multer from 'multer';
import { prisma } from '../config/prisma';
import { extractOrganizationId, requireAuth } from '../middleware/auth';
import { kpiCacheService } from '../services/KPICacheService';
import { unifiedFileProcessor } from '../services/UnifiedFileProcessor';
import { createLogger } from '../utils/logger';

const logger = createLogger('UploadUnified');
const router = Router();

// Configurar multer para subida de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB por archivo
    },
    fileFilter: (req, file, cb) => {
        // Validar extensión
        if (!file.originalname.endsWith('.txt')) {
            cb(new Error('Solo se permiten archivos .txt'));
            return;
        }

        // ✅ CORREGIDO: Validar nombre de archivo con sufijo de sesión opcional
        // Formatos válidos:
        // - TIPO_DOBACK###_YYYYMMDD.txt (una sesión por día)
        // - TIPO_DOBACK###_YYYYMMDD_###.txt (múltiples sesiones por día)
        // - TIPO_DOBACK###_RealTime.txt (actualización en tiempo real)
        const regex = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK\d{3}_(\d{8}(_\d+)?|RealTime)\.txt$/i;
        if (!regex.test(file.originalname)) {
            cb(new Error('Formato de archivo inválido. Debe ser: TIPO_DOBACK###_YYYYMMDD[_###].txt o TIPO_DOBACK###_RealTime.txt'));
            return;
        }

        cb(null, true);
    }
});

// Middleware de autenticación
router.use(requireAuth, extractOrganizationId);

/**
 * POST /api/upload/unified
 * Endpoint unificado para subida de archivos Doback
 * 
 * Acepta:
 * - Uno o múltiples archivos
 * - Agrupa automáticamente por vehículo y fecha
 * - Detecta sesiones múltiples
 * - Valida calidad de datos
 */
router.post('/unified', upload.array('files', 20), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron archivos'
            });
        }

        const organizationId = (req as any).organizationId;
        const userId = (req as any).user?.id;

        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere autenticación válida'
            });
        }

        logger.info(`Recibidos ${files.length} archivos para procesar`, {
            organizationId,
            userId,
            archivos: files.map(f => f.originalname)
        });

        // Convertir archivos a formato esperado por el procesador
        const archivos = files.map(f => ({
            nombre: f.originalname,
            buffer: f.buffer
        }));

        // Procesar con el procesador unificado
        const resultado = await unifiedFileProcessor.procesarArchivos(
            archivos,
            organizationId,
            userId
        );

        // ✅ NUEVO: Post-procesamiento automático
        if (resultado.sesionesCreadas > 0 && resultado.sessionIds && resultado.sessionIds.length > 0) {
            logger.info('🔄 Iniciando post-procesamiento automático...', {
                sessionCount: resultado.sessionIds.length
            });

            try {
                const { UploadPostProcessor } = await import('../services/upload/UploadPostProcessor');
                const postProcessResult = await UploadPostProcessor.process(resultado.sessionIds);

                // Añadir resultados del post-procesamiento a la respuesta
                (resultado as any).postProcessing = {
                    eventsGenerated: postProcessResult.eventsGenerated,
                    segmentsGenerated: postProcessResult.segmentsGenerated,
                    errors: postProcessResult.errors,
                    duration: postProcessResult.duration
                };

                // ✅ NUEVO: Construir sessionDetails con información de eventos
                if (postProcessResult.sessionDetails && postProcessResult.sessionDetails.length > 0) {
                    // Obtener información básica de las sesiones desde BD
                    const sessions = await prisma.session.findMany({
                        where: { id: { in: resultado.sessionIds } },
                        include: {
                            vehicle: { select: { identifier: true } }
                        }
                    });

                    // Mapear eventos por sesión
                    const eventsBySession = new Map(
                        postProcessResult.sessionDetails.map(s => [s.sessionId, s])
                    );

                    // Construir sessionDetails con eventos
                    (resultado as any).sessionDetails = sessions.map((session: any) => {
                        const eventInfo = eventsBySession.get(session.id);
                        const startTime = new Date(session.startTime);
                        const endTime = session.endTime ? new Date(session.endTime) : startTime;
                        const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

                        return {
                            sessionId: session.id,
                            sessionNumber: session.sequence,
                            vehicleIdentifier: session.vehicle?.identifier || 'Desconocido',
                            startTime: startTime.toISOString(),
                            endTime: endTime.toISOString(),
                            durationSeconds,
                            durationFormatted: formatDuration(durationSeconds),
                            status: 'CREADA',
                            reason: 'Sesión procesada correctamente',
                            measurements: 0, // Se puede calcular después si es necesario
                            eventsGenerated: eventInfo?.eventsGenerated || 0,
                            segmentsGenerated: eventInfo?.segmentsGenerated || 0,
                            events: eventInfo?.events || []
                        };
                    });
                }

                logger.info('✅ Post-procesamiento completado', {
                    eventsGenerated: postProcessResult.eventsGenerated,
                    segmentsGenerated: postProcessResult.segmentsGenerated,
                    duration: postProcessResult.duration
                });
            } catch (error: any) {
                logger.error('❌ Error en post-procesamiento:', error);
                // No fallar la respuesta completa, solo advertir
                if (!Array.isArray((resultado as any).warnings)) {
                    (resultado as any).warnings = [];
                }
                (resultado as any).warnings.push(`Post-procesamiento parcial: ${error.message}`);
            }
        }

        // Helper function for duration formatting
        function formatDuration(seconds: number): string {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        }

        // ✅ OPTIMIZACIÓN: Invalidar cache de KPIs después de subir datos nuevos
        if (resultado.sesionesCreadas > 0) {
            kpiCacheService.invalidate(organizationId);
            logger.info('Cache de KPIs invalidado después de upload', { organizationId });
        }

        // Responder con resultado detallado
        const statusCode = resultado.success ? 200 : 207; // 207 = Multi-Status (algunos éxitos, algunos errores)

        res.status(statusCode).json({
            success: resultado.success,
            message: `Procesamiento completado: ${resultado.sesionesCreadas} sesiones creadas`,
            totalSaved: resultado.sesionesCreadas,
            totalSkipped: 0,
            results: (resultado as any).sessionDetails ? [{
                vehicle: 'Varios',
                savedSessions: resultado.sesionesCreadas,
                skippedSessions: 0,
                sessionDetails: (resultado as any).sessionDetails
            }] : [],
            data: {
                sesionesCreadas: resultado.sesionesCreadas,
                sessionIds: resultado.sessionIds,
                archivosValidos: resultado.archivosValidos,
                archivosConProblemas: resultado.archivosConProblemas,
                estadisticas: resultado.estadisticas,
                problemas: resultado.problemas,
                postProcessing: (resultado as any).postProcessing,
                sessionDetails: (resultado as any).sessionDetails
            }
        });

    } catch (error: any) {
        logger.error('Error en upload unificado', { error: error.message });

        res.status(500).json({
            success: false,
            error: 'Error procesando archivos',
            message: error.message
        });
    }
});

/**
 * GET /api/upload/unified/quality/:sessionId
 * Obtiene las métricas de calidad de datos de una sesión
 */
router.get('/unified/quality/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const calidad = await prisma.dataQualityMetrics.findUnique({
            where: { sessionId }
        });

        if (!calidad) {
            return res.status(404).json({
                success: false,
                error: 'Métricas de calidad no encontradas'
            });
        }

        res.json({
            success: true,
            data: calidad
        });

    } catch (error: any) {
        logger.error('Error obteniendo métricas de calidad', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;

