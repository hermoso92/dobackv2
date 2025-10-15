/**
 * 🧪 TEST DE FOREIGN KEYS
 * 
 * Verifica que podemos:
 * 1. Validar User y Organization
 * 2. Crear vehículo
 * 3. Crear sesión
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000002';

async function testForeignKeys() {
    console.log('🧪 TEST DE FOREIGN KEYS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // TEST 1: Validar User
        console.log('1️⃣  Validando User...');
        const user = await prisma.user.findUnique({
            where: { id: SYSTEM_USER_ID }
        });

        if (!user) {
            console.log('❌ Usuario SYSTEM no encontrado\n');
            return;
        }
        console.log(`✅ User encontrado: ${user.email}\n`);

        // TEST 2: Validar Organization
        console.log('2️⃣  Validando Organization...');
        const org = await prisma.organization.findUnique({
            where: { id: SYSTEM_ORG_ID }
        });

        if (!org) {
            console.log('❌ Organización SYSTEM no encontrada\n');
            return;
        }
        console.log(`✅ Organization encontrada: ${org.name}\n`);

        // TEST 3: Crear o encontrar vehículo
        console.log('3️⃣  Creando/encontrando vehículo TEST...');
        
        const testIdentifier = 'doback024';
        let vehicle = await prisma.vehicle.findFirst({
            where: { identifier: testIdentifier }
        });

        if (vehicle) {
            console.log(`✅ Vehículo ya existe: ${vehicle.identifier} (${vehicle.id})\n`);
        } else {
            console.log(`⚠️  Vehículo no existe, creando...`);
            
            vehicle = await prisma.vehicle.create({
                data: {
                    identifier: testIdentifier,
                    name: testIdentifier,
                    model: 'TEST',
                    licensePlate: `TEST-${testIdentifier}`,
                    organizationId: SYSTEM_ORG_ID,
                    type: 'OTHER',
                    status: 'ACTIVE',
                    updatedAt: new Date()
                }
            });

            console.log(`✅ Vehículo creado: ${vehicle.identifier} (${vehicle.id})\n`);
        }

        // TEST 4: Crear sesión de prueba
        console.log('4️⃣  Creando sesión de prueba...');
        
        const testStartTime = new Date('2025-09-30T09:33:37.000Z');
        
        // Verificar si ya existe
        const existingSession = await prisma.session.findFirst({
            where: {
                vehicleId: vehicle.id,
                startTime: testStartTime,
                organizationId: SYSTEM_ORG_ID
            }
        });

        if (existingSession) {
            console.log(`⚠️  Sesión de prueba ya existe (${existingSession.id})`);
            console.log(`   Eliminando para rehacer el test...\n`);
            
            await prisma.session.delete({
                where: { id: existingSession.id }
            });
        }

        const session = await prisma.session.create({
            data: {
                vehicleId: vehicle.id,
                userId: SYSTEM_USER_ID,
                organizationId: SYSTEM_ORG_ID,
                startTime: testStartTime,
                endTime: new Date('2025-09-30T10:38:25.000Z'),
                sessionNumber: 1,
                sequence: 1,
                source: 'TEST',
                parkId: null,
                zoneId: null,
                updatedAt: new Date()
            }
        });

        console.log(`✅ Sesión creada exitosamente:`);
        console.log(`   ID: ${session.id}`);
        console.log(`   Vehicle: ${testIdentifier}`);
        console.log(`   Start: ${session.startTime.toISOString()}`);
        console.log(`   End: ${session.endTime.toISOString()}\n`);

        // TEST 5: Limpiar sesión de prueba
        console.log('5️⃣  Limpiando sesión de prueba...');
        await prisma.session.delete({
            where: { id: session.id }
        });
        console.log('✅ Sesión de prueba eliminada\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📋 RESUMEN:\n');
        console.log('   • User SYSTEM: ✅ Válido');
        console.log('   • Organization SYSTEM: ✅ Válida');
        console.log('   • Crear vehículo: ✅ Funciona');
        console.log('   • Crear sesión: ✅ Funciona');
        console.log('   • Foreign keys: ✅ Todas correctas\n');

        console.log('🎉 El sistema está listo para procesar archivos\n');

        // Información del vehículo que quedó
        console.log('📝 NOTA: Vehículo de test quedó en BD:');
        console.log(`   Identifier: ${vehicle.identifier}`);
        console.log(`   ID: ${vehicle.id}\n`);

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testForeignKeys();

