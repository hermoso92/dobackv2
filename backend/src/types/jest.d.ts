import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: jest.Mocked<PrismaClient>;
    namespace NodeJS {
        interface Global {
            prisma: jest.Mocked<PrismaClient>;
        }
    }
}
