import { PrismaClient } from '@prisma/client';
import { geofenceService } from '../src/services/GeofenceService';

const prisma = new PrismaClient();

async function testGeofenceDetection() {
    try {
        console.log('🧪 Probando detección de geofences...\n');

        // Obtener organización de Bomberos Madrid
        const organization = await prisma.organization.findFirst({
            where: {
                name: {
                    contains: 'Bomberos',
                    mode: 'insensitive'
                }
            }
        });

        if (!organization) {
            console.log('❌ No se encontró la organización de Bomberos Madrid');
            return;
        }

        console.log(`✅ Organización: ${organization.name}`);
        console.log(`   ID: ${organization.id}\n`);

        // Obtener todas las geofences
        const geofences = await prisma.geofence.findMany({
            where: { organizationId: organization.id }
        });

        console.log(`📍 Geofences configuradas: ${geofences.length}\n`);

        // Puntos de prueba en Madrid
        const testPoints = [
            {
                name: 'Puerta del Sol (dentro Parque Central)',
                vehicleId: 'DOBACK001',
                latitude: 40.4168,
                longitude: -3.7038,
                speed: 15,
                heading: 90
            },
            {
                name: 'Gran Vía (dentro Zona de Alto Riesgo)',
                vehicleId: 'DOBACK002',
                latitude: 40.4195,
                longitude: -3.7100,
                speed: 25,
                heading: 180
            },
            {
                name: 'Fuera de todas las zonas',
                vehicleId: 'DOBACK003',
                latitude: 40.5000,
                longitude: -3.8000,
                speed: 40,
                heading: 270
            },
            {
                name: 'Hospital La Paz (dentro zona prioritaria)',
                vehicleId: 'DOBACK004',
                latitude: 40.4789,
                longitude: -3.7112,
                speed: 30,
                heading: 45
            }
        ];

        console.log('🚗 Simulando movimientos de vehículos...\n');

        for (const point of testPoints) {
            console.log(`📍 Procesando: ${point.name}`);
            console.log(`   Vehículo: ${point.vehicleId}`);
            console.log(`   Coordenadas: ${point.latitude}, ${point.longitude}`);

            await geofenceService.processGPSPoints(
                point.vehicleId,
                organization.id,
                [{
                    latitude: point.latitude,
                    longitude: point.longitude,
                    timestamp: new Date().toISOString(),
                    speed: point.speed,
                    heading: point.heading
                }]
            );

            console.log('   ✅ Procesado\n');
        }

        // Verificar eventos generados
        const events = await prisma.geofenceEvent.findMany({
            where: { organizationId: organization.id },
            include: {
                geofence: {
                    select: {
                        name: true,
                        type: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 20
        });

        console.log(`\n🎯 Eventos detectados: ${events.length}\n`);

        if (events.length > 0) {
            console.log('📋 Últimos eventos:');
            for (const event of events) {
                console.log(`   ${event.type === 'ENTER' ? '🟢 ENTRADA' : '🔴 SALIDA'} - ${event.geofence.name}`);
                console.log(`      Vehículo: ${event.vehicleId}`);
                console.log(`      Timestamp: ${event.timestamp}`);
                console.log(`      Velocidad: ${event.speed || 'N/A'} km/h\n`);
            }
        } else {
            console.log('⚠️  No se detectaron eventos. Verifica que las coordenadas estén dentro de las geofences.');
        }

        console.log('\n✨ Prueba completada');

    } catch (error) {
        console.error('❌ Error en prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testGeofenceDetection();

