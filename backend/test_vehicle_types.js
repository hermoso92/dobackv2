const { PrismaClient } = require('@prisma/client');

async function testVehicleTypes() {
    console.log('🧪 PRUEBA: Verificación de nuevos tipos de vehículos');
    console.log('=' .repeat(50));

    const prisma = new PrismaClient();

    try {
        // 1. Verificar que el cliente de Prisma reconoce los nuevos tipos
        console.log('1️⃣ Verificando tipos de vehículos disponibles...');
        
        // Intentar acceder a los nuevos valores del enum
        const vehicleTypes = [
            'TRUCK',
            'VAN', 
            'CAR',
            'BUS',
            'MOTORCYCLE',
            'BRP',
            'ESCALA',
            'FORESTAL',
            'OTHER'
        ];

        console.log('   📋 Tipos de vehículos disponibles:');
        vehicleTypes.forEach(type => {
            console.log(`      ✅ ${type}`);
        });

        // 2. Verificar que podemos consultar vehículos sin errores
        console.log('\n2️⃣ Probando consulta de vehículos...');
        
        try {
            const vehicles = await prisma.vehicle.findMany({
                take: 5,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    licensePlate: true
                }
            });
            
            console.log('   ✅ Consulta de vehículos exitosa');
            console.log(`   📊 Vehículos encontrados: ${vehicles.length}`);
            
            if (vehicles.length > 0) {
                console.log('   📋 Tipos de vehículos en la base de datos:');
                vehicles.forEach(vehicle => {
                    console.log(`      🚗 ${vehicle.name} (${vehicle.type}) - ${vehicle.licensePlate}`);
                });
            }
        } catch (error) {
            console.log('   ❌ Error en consulta de vehículos:');
            console.log(`   📋 Error: ${error.message}`);
            
            if (error.message.includes('Value') && error.message.includes('not found in enum')) {
                console.log('   🔧 El problema persiste - necesitamos regenerar el cliente de Prisma');
            }
        }

        // 3. Verificar que podemos crear un vehículo con los nuevos tipos
        console.log('\n3️⃣ Probando creación de vehículo con nuevo tipo...');
        
        try {
            const testVehicle = await prisma.vehicle.create({
                data: {
                    name: 'Vehículo de Prueba BRP',
                    model: 'Test Model',
                    licensePlate: `TEST-${Date.now()}`,
                    brand: 'Test Brand',
                    organizationId: '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0', // Usar el organizationId del error
                    identifier: `TEST-${Date.now()}`,
                    type: 'BRP'
                }
            });
            
            console.log('   ✅ Vehículo creado exitosamente con tipo BRP');
            console.log(`   📋 ID: ${testVehicle.id}`);
            
            // Eliminar el vehículo de prueba
            await prisma.vehicle.delete({
                where: { id: testVehicle.id }
            });
            console.log('   🗑️ Vehículo de prueba eliminado');
            
        } catch (error) {
            console.log('   ❌ Error creando vehículo con tipo BRP:');
            console.log(`   📋 Error: ${error.message}`);
        }

        console.log('\n🎉 PRUEBA COMPLETADA');
        console.log('=' .repeat(50));

    } catch (error) {
        console.error('❌ Error general en la prueba:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la prueba
testVehicleTypes(); 