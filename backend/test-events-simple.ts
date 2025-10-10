import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEventDates() {
    try {
        console.log('🔍 Probando fechas reales en eventos...');

        // Obtener una sesión con datos
        const session = await prisma.session.findFirst({
            include: {
                gpsMeasurements: true,
                stabilityMeasurements: true,
                canMeasurements: true
            }
        });

        if (!session) {
            console.log('❌ No se encontraron sesiones');
            return;
        }

        console.log(`✅ Sesión encontrada: ${session.id}`);
        console.log(`📅 Fecha de inicio: ${session.startTime}`);

        // Simular datos con timestamp real
        let timestampReal = new Date(session.startTime);

        if (session.gpsMeasurements.length > 0) {
            const gpsTimestamp = new Date(session.gpsMeasurements[0].timestamp);
            timestampReal = gpsTimestamp;
            console.log(`🛰️  GPS timestamp: ${gpsTimestamp.toISOString()}`);
        }

        const datosPrueba = {
            sessionId: session.id,
            vehicleId: session.vehicleId,
            timestamp: timestampReal.toISOString(),
            speed: 60, // Velocidad que trigger un evento
            roll: 20 // Roll que trigger un evento
        };

        console.log('📊 Datos de prueba:', datosPrueba);

        // Crear una ejecución de prueba directamente
        const execution = await prisma.ejecucionEvento.create({
            data: {
                eventId: 'test-event-id',
                vehicleId: session.vehicleId,
                sessionId: session.id,
                data: datosPrueba,
                displayData: {
                    test: true,
                    timestamp: timestampReal.toISOString()
                },
                status: 'ACTIVE',
                triggeredAt: timestampReal // USAR FECHA REAL
            }
        });

        console.log('✅ Ejecución creada con fecha real:');
        console.log(`   ID: ${execution.id}`);
        console.log(`   Fecha del evento: ${execution.triggeredAt}`);
        console.log(
            `   Diferencia con ahora: ${
                Math.abs(new Date() - new Date(execution.triggeredAt)) / (1000 * 60 * 60)
            } horas`
        );

        // Limpiar la prueba
        await prisma.ejecucionEvento.delete({
            where: { id: execution.id }
        });

        console.log('🧹 Ejecución de prueba eliminada');
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testEventDates();
