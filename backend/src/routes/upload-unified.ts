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

        // Validar nombre de archivo
        const regex = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK\d{3}_\d{8}\.txt$/i;
        if (!regex.test(file.originalname)) {
            cb(new Error('Formato de archivo inválido. Debe ser: TIPO_DOBACK###_YYYYMMDD.txt'));
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
            data: {
                sesionesCreadas: resultado.sesionesCreadas,
                sessionIds: resultado.sessionIds,
                archivosValidos: resultado.archivosValidos,
                archivosConProblemas: resultado.archivosConProblemas,
                estadisticas: resultado.estadisticas,
                problemas: resultado.problemas
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

