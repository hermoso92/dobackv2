import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function verifyVehicles() {
    try {
        logger.info('🔍 Verificando vehículos en la base de datos...');

        // Obtener vehículos de la base de datos
        const vehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: 'CMadrid'
            },
            select: {
                id: true,
                name: true,
                licensePlate: true,
                organizationId: true
            }
        });

        logger.info(`📊 Vehículos encontrados en la base de datos: ${vehicles.length}`);

        for (const vehicle of vehicles) {
            logger.info(`🚗 ${vehicle.name} (${vehicle.licensePlate || 'Sin matrícula'}) - ID: ${vehicle.id}`);
        }

        // Buscar vehículos en los archivos
        const basePath = path.join(process.cwd(), 'data', 'datosDoback', 'CMadrid');

        if (!fs.existsSync(basePath)) {
            logger.error(`❌ Directorio no encontrado: ${basePath}`);
            return;
        }

        const vehicleDirs = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('doback'))
            .map(dirent => dirent.name);

        logger.info(`📁 Directorios de vehículos encontrados: ${vehicleDirs.length}`);

        for (const dir of vehicleDirs) {
            logger.info(`📂 ${dir}`);
        }

        // Verificar que los vehículos de los archivos existen en la base de datos
        const missingVehicles: string[] = [];

        for (const dir of vehicleDirs) {
            const vehicleName = dir.toUpperCase(); // doback022 -> DOBACK022
            const exists = vehicles.some(v => v.name === vehicleName);

            if (!exists) {
                missingVehicles.push(vehicleName);
            }
        }

        if (missingVehicles.length > 0) {
            logger.warn(`⚠️ Vehículos en archivos pero no en la base de datos: ${missingVehicles.join(', ')}`);

            // Crear vehículos faltantes
            logger.info('🔧 Creando vehículos faltantes...');

            for (const vehicleName of missingVehicles) {
                try {
                    const vehicle = await prisma.vehicle.create({
                        data: {
                            name: vehicleName,
                            licensePlate: vehicleName,
                            organizationId: 'CMadrid',
                            status: 'ACTIVE',
                            model: 'DOBACK',
                            identifier: vehicleName,
                            type: 'VAN'
                        }
                    });

                    logger.info(`✅ Vehículo creado: ${vehicleName} (ID: ${vehicle.id})`);
                } catch (error) {
                    logger.error(`❌ Error creando vehículo ${vehicleName}:`, error);
                }
            }
        } else {
            logger.info('✅ Todos los vehículos de los archivos existen en la base de datos');
        }

        // Verificar que los vehículos de la base de datos tienen archivos
        const vehiclesWithoutFiles: string[] = [];

        for (const vehicle of vehicles) {
            const vehicleDir = vehicle.name.toLowerCase(); // DOBACK022 -> doback022
            const dirPath = path.join(basePath, vehicleDir);

            if (!fs.existsSync(dirPath)) {
                vehiclesWithoutFiles.push(vehicle.name);
            }
        }

        if (vehiclesWithoutFiles.length > 0) {
            logger.warn(`⚠️ Vehículos en la base de datos pero sin archivos: ${vehiclesWithoutFiles.join(', ')}`);
        } else {
            logger.info('✅ Todos los vehículos de la base de datos tienen archivos');
        }

        logger.info('🎉 Verificación completada');

    } catch (error) {
        logger.error('💥 Error en la verificación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la verificación
verifyVehicles().catch(console.error);