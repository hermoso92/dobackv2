import { Router } from 'express';
import multer from 'multer';
import { DataController } from '../controllers/dataController';
import { authenticate } from '../middleware/auth';

const router = Router();
const dataController = new DataController();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// Upload file
router.post(
    '/upload',
    authenticate,
    upload.single('file'),
    dataController.uploadFile.bind(dataController)
);

// Get sessions
router.get('/sessions', authenticate, dataController.getSessions.bind(dataController));

// Get session details
router.get(
    '/sessions/:sessionId',
    authenticate,
    dataController.getSessionDetails.bind(dataController)
);

export default router;
