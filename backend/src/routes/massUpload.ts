import { Router } from 'express';
import multer from 'multer';
import { MassUploadController } from '../controllers/MassUploadController';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = new MassUploadController();

// Subida masiva de archivos - permite múltiples archivos de cada tipo
router.post(
    '/upload-multiple',
    authenticate,
    upload.fields([
        { name: 'CAN', maxCount: 50 }, // Hasta 50 archivos CAN
        { name: 'GPS', maxCount: 50 }, // Hasta 50 archivos GPS
        { name: 'ESTABILIDAD', maxCount: 50 }, // Hasta 50 archivos de estabilidad
        { name: 'ROTATIVO', maxCount: 50 } // Hasta 50 archivos rotativos
    ]),
    controller.uploadMultipleFiles.bind(controller)
);

export default router;
