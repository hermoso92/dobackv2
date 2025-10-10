import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', (req, res) => {
    try {
        res.send('<html><body><h1>Backend está funcionando correctamente</h1></body></html>');
    } catch (error) {
        logger.error('Test endpoint failed', { error });
        res.status(500).json({ status: 'error', message: 'Test endpoint failed' });
    }
});

export default router;
