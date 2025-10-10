import { Router } from 'express';
import { dbManager } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const isHealthy = await dbManager.healthCheck();
        if (isHealthy) {
            res.json({ status: 'healthy' });
        } else {
            res.status(503).json({ status: 'unhealthy' });
        }
    } catch (error) {
        logger.error('Health check failed', { error });
        res.status(500).json({ status: 'error', message: 'Health check failed' });
    }
});

export default router;
