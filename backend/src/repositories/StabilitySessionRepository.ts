import { PrismaClient } from '@prisma/client';
import { StabilitySession } from '../types/stability';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class StabilitySessionRepository {
    async createSession(data: {
        id: string;
        vehicleId: string;
        type: string;
        status: string;
        startTime: Date;
        endTime: Date;
        userId: string;
        sessionNumber: number;
        sequence: number;
    }): Promise<void> {
        await prisma.session.create({
            data: {
                id: data.id,
                vehicleId: data.vehicleId,
                type: data.type,
                status: data.status,
                startTime: data.startTime,
                endTime: data.endTime,
                userId: data.userId,
                sessionNumber: data.sessionNumber,
                sequence: data.sequence
            }
        });
    }

    async findByVehicleId(vehicleId: string): Promise<StabilitySession[]> {
        return prisma.session.findMany({
            where: { vehicleId },
            orderBy: { startTime: 'desc' }
        });
    }

    async findById(id: string): Promise<StabilitySession | null> {
        return prisma.session.findUnique({
            where: { id }
        });
    }

    async getSessionsByVehicle(vehicleId: string) {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    vehicleId,
                    type: 'ROUTINE' as SessionType
                },
                include: {
                    stabilityMeasurements: true
                },
                orderBy: {
                    startTime: 'desc'
                }
            });

            return sessions;
        } catch (error) {
            logger.error('Error al obtener sesiones de estabilidad', { error, vehicleId });
            throw error;
        }
    }

    async getSessionById(sessionId: string) {
        try {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    stabilityMeasurements: true
                }
            });

            return session;
        } catch (error) {
            logger.error('Error al obtener sesión de estabilidad', { error, sessionId });
            throw error;
        }
    }

    async updateSession(
        sessionId: string,
        data: {
            status?: SessionStatus;
            endTime?: Date;
        }
    ) {
        try {
            const result = await prisma.session.update({
                where: { id: sessionId },
                data
            });

            logger.info('Sesión de estabilidad actualizada', { sessionId: result.id });
            return result;
        } catch (error) {
            logger.error('Error al actualizar sesión de estabilidad', { error, sessionId });
            throw error;
        }
    }

    async deleteSession(sessionId: string) {
        try {
            const result = await prisma.session.delete({
                where: { id: sessionId }
            });

            logger.info('Sesión de estabilidad eliminada', { sessionId: result.id });
            return result;
        } catch (error) {
            logger.error('Error al eliminar sesión de estabilidad', { error, sessionId });
            throw error;
        }
    }
}
