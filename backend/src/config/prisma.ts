import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('PrismaClient');
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const isNewInstance = !globalForPrisma.prisma;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

if (isNewInstance) {
    logger.info('Prisma Client singleton inicializado');
    prisma.$connect().catch((error: any) => {
        logger.error('Error al conectar Prisma', { error: error.message });
    });
}

export async function disconnectPrisma() {
    try {
        await prisma.$disconnect();
        logger.info('Prisma desconectado exitosamente');
    } catch (error: any) {
        logger.error('Error al desconectar Prisma', { error: error.message });
    }
}

export default prisma;
