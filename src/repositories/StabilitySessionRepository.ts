import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class StabilitySessionRepository {
    async createSession(data: any): Promise<void> {
        await prisma.session.create({ data });
    }

    async getSessionById(sessionId: string) {
        try {
            const session = await prisma.session.findUnique({ where: { id: sessionId } });
            return session;
        } catch (error) {
            logger.error('Error al obtener sesión de estabilidad', { error, sessionId });
            throw error;
        }
    }
} 