import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
});

interface QueryEvent {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
}

// Handle connection errors
prisma.$on('query', (e: QueryEvent) => {
    console.log('Query: ' + e.query);
    console.log('Duration: ' + e.duration + 'ms');
});

// Handle disconnection
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
