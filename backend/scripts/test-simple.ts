#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function testSimple() {
    try {
        logger.info('🧪 Iniciando prueba simple...');

        // 1. Verificar conexión a BD
        await prisma.$connect();
        logger.info('✅ Conexión a BD exitosa');

        // 2. Crear organización si no existe
        let org = await prisma.organization.findFirst({
            where: { id: 'CMadrid' }
        });

        if (!org) {
            org = await prisma.organization.create({
                data: {
                    id: 'CMadrid',
                    name: 'CMadrid',
                    apiKey: 'cmadrid-api-key-2025'
                }
            });
            logger.info('✅ Organización creada');
        } else {
            logger.info('ℹ️ Organización ya existe');
        }

        // 3. Crear vehículo de prueba
        let vehicle = await prisma.vehicle.findFirst({
            where: { name: 'DOBACK022' }
        });

        if (!vehicle) {
            vehicle = await prisma.vehicle.create({
                data: {
                    name: 'DOBACK022',
                    licensePlate: 'DOBACK022',
                    organizationId: 'CMadrid',
                    status: 'ACTIVE',
                    model: 'DOBACK',
                    identifier: 'DOBACK022',
                    type: 'VAN'
                }
            });
            logger.info('✅ Vehículo creado');
        } else {
            logger.info('ℹ️ Vehículo ya existe');
        }

        // 4. Listar archivos disponibles
        const fs = require('fs');
        const path = require('path');

        const dataPath = path.join(__dirname, '../data/datosDoback/CMadrid');

        if (fs.existsSync(dataPath)) {
            const vehicles = fs.readdirSync(dataPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            logger.info(`📁 Vehículos encontrados: ${vehicles.join(', ')}`);

            // Contar archivos por tipo
            let totalFiles = 0;
            const fileTypes = { GPS: 0, CAN: 0, ESTABILIDAD: 0, ROTATIVO: 0 };

            for (const vehicleDir of vehicles) {
                const vehiclePath = path.join(dataPath, vehicleDir);
                for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
                    const typePath = path.join(vehiclePath, dataType);
                    if (fs.existsSync(typePath)) {
                        const files = fs.readdirSync(typePath)
                            .filter(file => file.endsWith('.txt'));

                        const typeKey = dataType.toUpperCase() as keyof typeof fileTypes;
                        fileTypes[typeKey] += files.length;
                        totalFiles += files.length;
                    }
                }
            }

            logger.info('📊 Resumen de archivos:');
            logger.info(`  - GPS: ${fileTypes.GPS} archivos`);
            logger.info(`  - CAN: ${fileTypes.CAN} archivos`);
            logger.info(`  - ESTABILIDAD: ${fileTypes.ESTABILIDAD} archivos`);
            logger.info(`  - ROTATIVO: ${fileTypes.ROTATIVO} archivos`);
            logger.info(`  - Total: ${totalFiles} archivos`);

        } else {
            logger.error(`❌ Directorio no encontrado: ${dataPath}`);
        }

        logger.info('✅ Prueba simple completada');

    } catch (error) {
        logger.error('❌ Error en prueba simple:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    testSimple().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { testSimple };
