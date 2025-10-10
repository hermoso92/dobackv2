import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEventCreation() {
    try {
        console.log('🔍 Probando creación de evento...');

        // Primero, obtener un usuario existente
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('❌ No hay usuarios en la base de datos');
            return;
        }

        console.log('✅ Usuario encontrado:', user.email);

        // Datos de prueba
        const eventData = {
            nombre: 'Evento de Prueba desde Script',
            descripcion: 'Este es un evento de prueba creado desde script',
            tipo: 'TELEMETRIA',
            autoEvaluate: true,
            createdById: user.id
        };

        console.log('📤 Datos del evento:', eventData);

        // Crear el evento
        const evento = await prisma.gestorDeEvento.create({
            data: {
                name: eventData.nombre,
                description: eventData.descripcion,
                type: eventData.tipo as any,
                status: 'ACTIVE' as any,
                isPredefined: false,
                autoEvaluate: eventData.autoEvaluate,
                logicOperator: 'AND' as any,
                createdById: eventData.createdById
            },
            include: {
                createdBy: true
            }
        });

        console.log('✅ Evento creado exitosamente:');
        console.log('   ID:', evento.id);
        console.log('   Nombre:', evento.name);
        console.log('   AutoEvaluate:', evento.autoEvaluate);
        console.log('   Creado por:', evento.createdBy.email);

        // Eliminar el evento de prueba
        await prisma.gestorDeEvento.delete({
            where: { id: evento.id }
        });

        console.log('🗑️ Evento de prueba eliminado');
        console.log('🎉 ¡Prueba exitosa!');
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testEventCreation();
