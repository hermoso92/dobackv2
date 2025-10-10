#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function setupOrganization() {
    try {
        logger.info('🏢 Configurando organización CMadrid...');

        // Verificar si la organización ya existe
        let organization = await prisma.organization.findFirst({
            where: { id: 'CMadrid' }
        });

        if (!organization) {
            // Crear la organización
            organization = await prisma.organization.create({
                data: {
                    id: 'CMadrid',
                    name: 'CMadrid',
                    apiKey: 'cmadrid-api-key-2025'
                }
            });
            logger.info('✅ Organización CMadrid creada exitosamente');
        } else {
            logger.info('ℹ️ Organización CMadrid ya existe');
        }

        // Verificar si hay un usuario admin
        let adminUser = await prisma.user.findFirst({
            where: {
                email: 'admin@cmadrid.com',
                organizationId: 'CMadrid'
            }
        });

        if (!adminUser) {
            // Crear usuario admin
            adminUser = await prisma.user.create({
                data: {
                    email: 'admin@cmadrid.com',
                    name: 'Administrador CMadrid',
                    password: 'admin123', // Password temporal
                    role: 'ADMIN',
                    organizationId: 'CMadrid'
                }
            });
            logger.info('✅ Usuario administrador creado');
        } else {
            logger.info('ℹ️ Usuario administrador ya existe');
        }

        logger.info('🎯 Configuración de organización completada');

    } catch (error) {
        logger.error('❌ Error configurando organización:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    setupOrganization().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { setupOrganization };

