import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                config: {
                    select: {
                        language: true,
                        timezone: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const settings = {
            language: user.config?.language ?? 'es',
            theme: 'light',
            timezone: user.config?.timezone ?? 'Europe/Madrid'
        };

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            organization: user.organization,
            settings
        });
    } catch (error) {
        logger.error('Error obteniendo perfil de usuario', { error });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
