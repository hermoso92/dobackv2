import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const events = await prisma.event.findMany({
            where: { organizationId },
            take: 50,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: events });
    } catch (error) {
        logger.error('Error obteniendo eventos', { error });
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

export default router;
