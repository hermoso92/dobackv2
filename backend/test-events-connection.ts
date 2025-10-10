import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('🔍 Probando conexión a la base de datos...');

        // Test basic connection
        const userCount = await prisma.user.count();
        console.log('✅ Conexión exitosa! Usuarios en BD:', userCount);

        // Test GestorDeEvento model
        console.log('\n🔍 Probando modelo GestorDeEvento...');
        const eventCount = await prisma.gestorDeEvento.count();
        console.log('✅ Eventos en BD:', eventCount);

        // List existing events
        const events = await prisma.gestorDeEvento.findMany({
            include: {
                conditions: true,
                vehicles: true,
                createdBy: true
            },
            take: 5
        });

        console.log('\n📋 Eventos existentes:');
        events.forEach((event) => {
            console.log(`- ${event.name} (autoEvaluate: ${event.autoEvaluate})`);
        });

        // Test creating a simple event
        console.log('\n🆕 Creando evento de prueba...');
        const testEvent = await prisma.gestorDeEvento.create({
            data: {
                name: 'Evento de Prueba F2',
                description: 'Prueba de funcionalidad autoEvaluate',
                type: 'STABILITY',
                status: 'ACTIVE',
                autoEvaluate: true,
                createdById: '123', // Usuario de prueba
                conditions: {
                    create: {
                        type: 'STABILITY',
                        variable: 'roll',
                        operator: 'GREATER_THAN',
                        value: 30.0,
                        unit: 'degrees'
                    }
                }
            },
            include: {
                conditions: true
            }
        });

        console.log('✅ Evento creado exitosamente:', testEvent.name);
        console.log('   ID:', testEvent.id);
        console.log('   autoEvaluate:', testEvent.autoEvaluate);

        return testEvent;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testConnection().catch(console.error);
