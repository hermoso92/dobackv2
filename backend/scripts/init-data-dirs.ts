import { PrismaClient } from '@prisma/client';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../src/utils/logger';

const logger = createLogger('InitDataDirs');
const prisma = new PrismaClient();

async function createDirectoryStructure() {
    try {
        // Get all organizations
        const organizations = await prisma.organization.findMany({
            include: {
                vehicles: true
            }
        });

        for (const org of organizations) {
            // Create organization directory
            const orgPath = join(process.cwd(), 'data', 'organizations', org.id);
            await mkdir(orgPath, { recursive: true });
            logger.info(`Created organization directory: ${orgPath}`);

            // Create vehicle directories
            for (const vehicle of org.vehicles) {
                const vehiclePath = join(orgPath, 'vehicles', vehicle.licensePlate);
                await mkdir(vehiclePath, { recursive: true });
                logger.info(`Created vehicle directory: ${vehiclePath}`);

                // Create type directories for today
                const today = new Date();
                const datePath = join(
                    vehiclePath,
                    today.getFullYear().toString() +
                        (today.getMonth() + 1).toString().padStart(2, '0') +
                        today.getDate().toString().padStart(2, '0')
                );

                const types = ['stability', 'gps', 'can'];
                for (const type of types) {
                    const typePath = join(datePath, type);
                    await mkdir(typePath, { recursive: true });
                    logger.info(`Created type directory: ${typePath}`);
                }
            }
        }

        logger.info('Directory structure created successfully');
    } catch (error) {
        logger.error('Error creating directory structure:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createDirectoryStructure().catch(console.error);
