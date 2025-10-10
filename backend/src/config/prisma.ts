import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query'
        },
        {
            emit: 'event',
            level: 'error'
        },
        {
            emit: 'event',
            level: 'info'
        },
        {
            emit: 'event',
            level: 'warn'
        }
    ]
});

export { prisma };

prisma.$on('query', (e) => {
    logger.info('Query Prisma', { query: e.query, params: e.params, duration: e.duration });
});

prisma.$on('error', (e) => {
    logger.error('Error Prisma', { error: e.message, target: e.target });
});
