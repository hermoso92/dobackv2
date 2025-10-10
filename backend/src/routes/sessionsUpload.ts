import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { SessionsUploadController } from '../controllers/SessionsUploadController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

// Importar funciones del nuevo controlador
import {
    downloadFile,
    readFileHeader,
    searchRelatedFiles,
    testEndpoint
} from '../controllers/fileSearchController';

const router = Router();
const prisma = new PrismaClient();

// Esquema de validación para la subida de sesión
const sessionUploadSchema = z.object({
    vehicleId: z.string().min(1, 'El ID del vehículo es requerido')
});

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'sessions');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Aceptar archivos .txt y .csv
        if (
            file.mimetype === 'text/plain' ||
            file.mimetype === 'text/csv' ||
            file.originalname.endsWith('.txt') ||
            file.originalname.endsWith('.csv')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos .txt y .csv'));
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    }
});

const controller = new SessionsUploadController();

// Middleware de logging
router.use((req, res, next) => {
    logger.info('Acceso a ruta de subida de sesión:', {
        method: req.method,
        path: req.path,
        files: req.files,
        body: req.body
    });
    next();
});

// Rutas sin autenticación (deben ir antes del middleware de autenticación)
router.get('/test', testEndpoint);
router.post('/search-related-files', searchRelatedFiles);
router.get('/read-file-header', readFileHeader);
router.get('/download-file', downloadFile);

router.use(authenticate);

router.post(
    '/upload',
    upload.fields([
        { name: 'stabilityFile', maxCount: 1 },
        { name: 'canFile', maxCount: 1 },
        { name: 'gpsFile', maxCount: 1 },
        { name: 'rotativoFile', maxCount: 1 }
    ]),
    validate(sessionUploadSchema),
    controller.uploadSessionData.bind(controller)
);

// Eliminar sesión
router.delete('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { organizationId } = req.user!;

        // Verificar que la sesión pertenece a la organización del usuario
        const session = await prisma.session.findFirst({
            where: {
                id: sessionId,
                organizationId: organizationId || undefined
            }
        });

        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada' });
        }

        // Eliminar datos relacionados
        await prisma.$transaction([
            prisma.stabilityMeasurement.deleteMany({ where: { sessionId } }),
            prisma.canMeasurement.deleteMany({ where: { sessionId } }),
            prisma.gpsMeasurement.deleteMany({ where: { sessionId } }),
            prisma.stability_events.deleteMany({ where: { session_id: sessionId } }),
            prisma.session.delete({ where: { id: sessionId } })
        ]);

        logger.info(`Sesión eliminada: ${sessionId}`);
        return res.status(200).json({ message: 'Sesión eliminada correctamente' });
    } catch (error) {
        logger.error('Error eliminando sesión:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
