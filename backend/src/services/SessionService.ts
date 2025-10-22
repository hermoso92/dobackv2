import { PrismaClient, SessionStatus, SessionType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';



export class SessionService {
    async createSession(sessionData: {
        vehicleId: string;
        userId: string;
        startTime: Date;
        endTime?: Date | null;
        sequence: number;
        sessionNumber: number;
        status?: SessionStatus;
        type?: SessionType;
        organizationId: string;
    }) {
        try {
            const session = await prisma.session.create({
                data: {
                    vehicleId: sessionData.vehicleId,
                    userId: sessionData.userId,
                    startTime: sessionData.startTime,
                    endTime: sessionData.endTime,
                    sequence: sessionData.sequence,
                    sessionNumber: sessionData.sessionNumber,
                    status: sessionData.status || SessionStatus.ACTIVE,
                    type: sessionData.type || SessionType.ROUTINE,
                    organizationId: sessionData.organizationId
                }
            });
            return session;
        } catch (error) {
            logger.error('Error creating session', { sessionData, error });
            throw error;
        }
    }
}
