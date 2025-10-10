#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function verifyVehiclesForOptimalProcessor() {
    try {
        logger.info('🔍 Verificando vehículos para el procesador óptimo...');
        
        const basePath = path.join(__dirname, '../data/datosDoback/CMadrid');
        
        if (!fs.existsSync(basePath)) {
            logger.error(`❌ Directorio no encontrado: ${basePath}`);
            process.exit(1);
        }
        
        // Obtener vehículos del directorio
        const vehicleDirs = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        logger.info(`🚗 Vehículos encontrados en directorio: ${vehicleDirs.join(', ')}`);
        
        // Obtener vehículos de la base de datos
        const dbVehicles = await prisma.vehicle.findMany({
            where: { organizationId: 'CMadrid' },
            select: { id: true, name: true, licensePlate: true, status: true }
        });
        
        logger.info(`📊 Vehículos en base de datos: ${dbVehicles.length}`);
        
        // Verificar correspondencia
        const missingVehicles: string[] = [];
        const extraVehicles: string[] = [];
        
        for (const vehicleDir of vehicleDirs) {
            const dbVehicle = dbVehicles.find(v => v.name === vehicleDir);
            if (!dbVehicle) {
                missingVehicles.push(vehicleDir);
            }
        }
        
        for (const dbVehicle of dbVehicles) {
            if (!vehicleDirs.includes(dbVehicle.name)) {
                extraVehicles.push(dbVehicle.name);
            }
        }
        
        // Crear vehículos faltantes
        if (missingVehicles.length > 0) {
            logger.info(`➕ Creando ${missingVehicles.length} vehículos faltantes...`);
            
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
        }
        
        // Mostrar resumen
        logger.info('📋 Resumen de verificación:');
        logger.info(`  - Vehículos en directorio: ${vehicleDirs.length}`);
        logger.info(`  - Vehículos en BD: ${dbVehicles.length}`);
        logger.info(`  - Vehículos creados: ${missingVehicles.length}`);
        logger.info(`  - Vehículos extra en BD: ${extraVehicles.length}`);
        
        if (extraVehicles.length > 0) {
            logger.warn(`⚠️ Vehículos en BD sin archivos: ${extraVehicles.join(', ')}`);
        }
        
        logger.info('✅ Verificación de vehículos completada');
        
    } catch (error) {
        logger.error('❌ Error verificando vehículos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    verifyVehiclesForOptimalProcessor().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { verifyVehiclesForOptimalProcessor };