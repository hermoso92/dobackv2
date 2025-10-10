const { SmartDataProcessor } = require('./dist/services/SmartDataProcessor');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function runCompleteSmartProcessing() {
    try {
        console.log('🧠 Iniciando PROCESAMIENTO INTELIGENTE COMPLETO...');

        // Buscar organización CMadrid
        const organization = await prisma.organization.findFirst({
            where: {
                name: { contains: 'CMadrid', mode: 'insensitive' }
            }
        });

        if (!organization) {
            console.log('❌ No se encontró la organización CMadrid');
            return;
        }

        console.log(`✅ Organización encontrada: ${organization.name}`);

        // Obtener todos los vehículos de CMadrid
        const vehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: organization.id
            }
        });

        console.log(`🚗 Vehículos encontrados: ${vehicles.length}`);
        vehicles.forEach(vehicle => {
            console.log(`  - ${vehicle.name} (${vehicle.id})`);
        });

        const basePath = path.join(process.cwd(), 'data/datosDoback/CMadrid');
        
        // Procesar cada vehículo con el sistema inteligente
        for (const vehicle of vehicles) {
            console.log(`\n🔧 Procesando vehículo: ${vehicle.name}`);
            
            try {
                const processor = new SmartDataProcessor();
                
                const config = {
                    organizationId: organization.id,
                    vehicleId: vehicle.id,
                    date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
                    basePath: basePath,
                    reprocessCompleted: false,
                    reprocessFailed: true,
                    decodeCANFiles: true
                };

                const result = await processor.processVehicleSmart(config);
                
                console.log(`✅ ${vehicle.name} procesado:`);
                console.log(`  - Archivos nuevos: ${result.newFiles}`);
                console.log(`  - Archivos reprocesados: ${result.reprocessedFiles}`);
                console.log(`  - Archivos omitidos: ${result.skippedFiles}`);
                console.log(`  - Archivos fallidos: ${result.failedFiles}`);
                console.log(`  - Puntos de datos: ${result.totalDataPoints}`);
                console.log(`  - Tiempo: ${result.processingTime}ms`);
                
            } catch (error) {
                console.error(`❌ Error procesando ${vehicle.name}:`, error.message);
            }
        }

        console.log('\n🎉 Procesamiento inteligente completo finalizado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runCompleteSmartProcessing();
