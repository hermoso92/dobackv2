const { PrismaClient } = require('@prisma/client');

async function quickTest() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 Iniciando prueba rápida...');
        
        // 1. Verificar conexión
        await prisma.$connect();
        console.log('✅ Conexión a BD exitosa');
        
        // 2. Crear organización
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
            console.log('✅ Organización creada');
        } else {
            console.log('ℹ️ Organización ya existe');
        }
        
        // 3. Crear vehículo
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
            console.log('✅ Vehículo creado');
        } else {
            console.log('ℹ️ Vehículo ya existe');
        }
        
        // 4. Verificar archivos
        const fs = require('fs');
        const path = require('path');
        
        const dataPath = path.join(__dirname, '../data/datosDoback/CMadrid');
        
        if (fs.existsSync(dataPath)) {
            const vehicles = fs.readdirSync(dataPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            console.log(`📁 Vehículos encontrados: ${vehicles.join(', ')}`);
            
            // Contar archivos
            let totalFiles = 0;
            const fileTypes = { GPS: 0, CAN: 0, ESTABILIDAD: 0, ROTATIVO: 0 };
            
            for (const vehicleDir of vehicles) {
                const vehiclePath = path.join(dataPath, vehicleDir);
                for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
                    const typePath = path.join(vehiclePath, dataType);
                    if (fs.existsSync(typePath)) {
                        const files = fs.readdirSync(typePath)
                            .filter(file => file.endsWith('.txt'));
                        
                        const typeKey = dataType.toUpperCase();
                        fileTypes[typeKey] += files.length;
                        totalFiles += files.length;
                    }
                }
            }
            
            console.log('📊 Resumen de archivos:');
            console.log(`  - GPS: ${fileTypes.GPS} archivos`);
            console.log(`  - CAN: ${fileTypes.CAN} archivos`);
            console.log(`  - ESTABILIDAD: ${fileTypes.ESTABILIDAD} archivos`);
            console.log(`  - ROTATIVO: ${fileTypes.ROTATIVO} archivos`);
            console.log(`  - Total: ${totalFiles} archivos`);
            
        } else {
            console.error(`❌ Directorio no encontrado: ${dataPath}`);
        }
        
        console.log('✅ Prueba rápida completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

quickTest();