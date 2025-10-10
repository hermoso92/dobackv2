#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import path from 'path';
import { SmartDataProcessor } from '../src/services/SmartDataProcessor';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface SmartProcessingOptions {
    vehicleId?: string;
    date?: string;
    basePath?: string;
    reprocessCompleted?: boolean;
    reprocessFailed?: boolean;
    decodeCANFiles?: boolean;
    organizationId?: string;
}

async function runSmartProcessing(options: SmartProcessingOptions = {}) {
    try {
        logger.info('🧠 Iniciando procesamiento inteligente de datos...');

        // Obtener argumentos de línea de comandos
        const args = process.argv.slice(2);
        const vehicleId = options.vehicleId || args[0];
        const date = options.date || args[1] || new Date().toISOString().split('T')[0].replace(/-/g, '');
        const basePath = options.basePath || path.join(process.cwd(), 'data/datosDoback/CMadrid');
        const reprocessCompleted = options.reprocessCompleted || (args[2] === 'true');
        const reprocessFailed = options.reprocessFailed !== false;
        const decodeCANFiles = options.decodeCANFiles !== false;

        // Buscar organización CMadrid
        let organizationId = options.organizationId;
        if (!organizationId) {
            logger.info('🔍 Buscando organización CMadrid...');
            try {
                const organization = await prisma.organization.findFirst({
                    where: {
                        name: { contains: 'CMadrid', mode: 'insensitive' }
                    }
                });

                if (!organization) {
                    logger.error('❌ No se encontró la organización CMadrid');
                    process.exit(1);
                }

                organizationId = organization.id;
                logger.info(`✅ Organización encontrada: ${organization.name} (${organizationId})`);
            } catch (error) {
                logger.error('❌ Error buscando organización:', error);
                process.exit(1);
            }
        }

        // Si no se especifica vehículo, procesar todos
        if (!vehicleId) {
            logger.info('📋 Procesando todos los vehículos disponibles...');
            await processAllVehicles(organizationId, date, basePath, {
                reprocessCompleted,
                reprocessFailed,
                decodeCANFiles
            });
        } else {
            logger.info(`📋 Procesando vehículo específico: ${vehicleId}`);
            await processSingleVehicle(vehicleId, organizationId, date, basePath, {
                reprocessCompleted,
                reprocessFailed,
                decodeCANFiles
            });
        }

        logger.info('🎉 Procesamiento inteligente completado exitosamente');

    } catch (error) {
        logger.error('❌ Error en procesamiento inteligente:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function processAllVehicles(
    organizationId: string,
    date: string,
    basePath: string,
    config: {
        reprocessCompleted: boolean;
        reprocessFailed: boolean;
        decodeCANFiles: boolean;
    }
) {
    try {
        // Obtener todos los vehículos de la organización
        const vehicles = await prisma.vehicle.findMany({
            where: { organizationId },
            select: { id: true, name: true }
        });

        if (vehicles.length === 0) {
            logger.warn('⚠️ No se encontraron vehículos para procesar');
            return;
        }

        logger.info(`📋 Encontrados ${vehicles.length} vehículos para procesar`);

        // Procesar cada vehículo
        for (const vehicle of vehicles) {
            logger.info(`🚗 Procesando vehículo: ${vehicle.name} (${vehicle.id})`);

            try {
                await processSingleVehicle(
                    vehicle.id,
                    organizationId,
                    date,
                    basePath,
                    config
                );

                logger.info(`✅ Vehículo ${vehicle.name} procesado exitosamente`);

            } catch (error) {
                logger.error(`❌ Error procesando vehículo ${vehicle.name}:`, error);
                // Continuar con el siguiente vehículo
            }
        }

    } catch (error) {
        logger.error('❌ Error en procesamiento masivo:', error);
        throw error;
    }
}

async function processSingleVehicle(
    vehicleId: string,
    organizationId: string,
    date: string,
    basePath: string,
    config: {
        reprocessCompleted: boolean;
        reprocessFailed: boolean;
        decodeCANFiles: boolean;
    }
) {
    // Verificar que el vehículo existe
    const vehicle = await prisma.vehicle.findFirst({
        where: {
            id: vehicleId,
            organizationId
        },
        select: { id: true, name: true }
    });

    if (!vehicle) {
        throw new Error(`Vehículo ${vehicleId} no encontrado o no autorizado`);
    }

    // Determinar la ruta específica del vehículo
    const vehicleBasePath = path.join(basePath, vehicleId);

    // Verificar que la ruta existe
    try {
        await require('fs/promises').access(vehicleBasePath);
    } catch (error) {
        logger.warn(`⚠️ Ruta de datos no encontrada para vehículo ${vehicle.name}: ${vehicleBasePath}`);
        return;
    }

    // Crear procesador inteligente
    const processor = new SmartDataProcessor({
        organizationId,
        vehicleId: vehicle.id,
        date,
        basePath: vehicleBasePath,
        reprocessCompleted: config.reprocessCompleted,
        reprocessFailed: config.reprocessFailed,
        decodeCANFiles: config.decodeCANFiles
    });

    // Procesar archivos de forma inteligente
    const result = await processor.processSmartData();

    // Mostrar resultados
    logger.info(`📊 Resultados para ${vehicle.name}:`, {
        vehicleName: result.vehicleName,
        newFiles: result.newFiles,
        reprocessedFiles: result.reprocessedFiles,
        failedFiles: result.failedFiles,
        totalDataPoints: result.totalDataPoints,
        processingTime: `${(result.processingTime / 1000).toFixed(2)}s`
    });

    return result;
}

// Función para mostrar ayuda
function showHelp() {
    console.log(`
🧠 Procesamiento Inteligente de Datos - Doback Soft

USO:
  ts-node run-smart-processing.ts [VEHICULO] [FECHA] [REPROCESAR_COMPLETADOS]

PARÁMETROS:
  VEHICULO              ID del vehículo a procesar (opcional, si no se especifica procesa todos)
  FECHA                 Fecha en formato YYYYMMDD (opcional, por defecto hoy)
  REPROCESAR_COMPLETADOS true/false (opcional, por defecto false)

EJEMPLOS:
  # Procesar todos los vehículos de hoy
  ts-node run-smart-processing.ts

  # Procesar vehículo específico de hoy
  ts-node run-smart-processing.ts doback022

  # Procesar vehículo específico de una fecha
  ts-node run-smart-processing.ts doback022 20250115

  # Procesar vehículo específico con reprocesamiento de archivos completados
  ts-node run-smart-processing.ts doback022 20250115 true

CARACTERÍSTICAS:
  ✅ Procesamiento inteligente que evita reprocesamiento innecesario
  ✅ Decodificación CAN automática con timeout y retry
  ✅ Validación de integridad de archivos
  ✅ Transacciones atómicas con rollback automático
  ✅ Streaming optimizado para archivos grandes
  ✅ Manejo estructurado de errores con recuperación
  ✅ Monitoreo en tiempo real y métricas
  ✅ Gestión automática de recursos y memoria
  ✅ Configuración flexible por variables de entorno
  ✅ Backup automático y recuperación parcial

CONFIGURACIÓN:
  Las siguientes variables de entorno están disponibles:
  - DOBACK_MAX_FILE_SIZE: Tamaño máximo de archivo (default: 200MB)
  - DOBACK_CHUNK_SIZE: Tamaño de chunk para streaming (default: 32KB)
  - DOBACK_TIMEOUT: Timeout para operaciones (default: 30000ms)
  - DOBACK_MAX_RETRIES: Número máximo de reintentos (default: 3)
  - DOBACK_ENABLE_METRICS: Habilitar métricas (default: true)
  - DOBACK_ENABLE_CLEANUP: Habilitar cleanup automático (default: true)

ENDPOINTS API:
  - POST /api/smart-processing/process-vehicle
  - POST /api/smart-processing/process-all-vehicles
  - GET /api/smart-processing/stats
  - GET /api/smart-processing/health
`);
}

// Función principal
async function main() {
    const args = process.argv.slice(2);

    // Mostrar ayuda si se solicita
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }

    await runSmartProcessing();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { processAllVehicles, processSingleVehicle, runSmartProcessing };

