import { Router } from 'express';
import multer from 'multer';
import { SessionsUploadController } from '../controllers/SessionsUploadController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = new SessionsUploadController();

router.post(
    '/upload',
    upload.fields([
        { name: 'stabilityFile', maxCount: 1 },
        { name: 'canFile', maxCount: 1 },
        { name: 'gpsFile', maxCount: 1 },
        { name: 'rotativoFile', maxCount: 1 },
    ]),
    controller.uploadSessionData.bind(controller)
);

export default router; 