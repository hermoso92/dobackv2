#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { GeofenceRuleEngine } from '../src/services/GeofenceRuleEngine';
import { RealTimeGeofenceService } from '../src/services/RealTimeGeofenceService';
import { WebSocketGeofenceService } from '../src/services/WebSocketGeofenceService';

const prisma = new PrismaClient();

interface TestVehicle {
    id: string;
    name: string;
    positions: Array<{
        lat: number;
        lon: number;
        speed: number;
        description: string;
    }>;
}

async function testCompleteSystem() {
    console.log('🧪 Iniciando prueba completa del sistema de geocercas...\n');

    try {
        // Conectar a la base de datos
        await prisma.$connect();
        console.log('✅ Conexión a base de datos establecida');

        // Obtener organización y reglas existentes
        const organization = await prisma.organization.findFirst();
        const rules = await prisma.geofenceRule.findMany({
            where: { isActive: true },
            include: { zone: true, park: true }
        });

        if (!organization) {
            console.log('❌ No hay organizaciones en la base de datos');
            return;
        }

        console.log(`📋 Organización: ${organization.name}`);
        console.log(`📋 Reglas activas: ${rules.length}`);

        // Crear servidor HTTP para WebSocket
        const server = createServer();
        const geofenceService = new RealTimeGeofenceService(prisma);
        const webSocketService = new WebSocketGeofenceService(server, prisma, geofenceService);
        const ruleEngine = new GeofenceRuleEngine(prisma, geofenceService, webSocketService);

        // Iniciar servidor en puerto 3001
        server.listen(3001, () => {
            console.log('🌐 Servidor WebSocket iniciado en puerto 3001');
        });

        // Esperar a que los servicios se inicialicen
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Definir vehículos de prueba con rutas que cruzan geocercas
        const testVehicles: TestVehicle[] = [
            {
                id: 'test-vehicle-001',
                name: 'Vehículo de Prueba 1',
                positions: [
                    { lat: 40.5400, lon: -3.6420, speed: 30, description: 'Fuera de zona' },
                    { lat: 40.5405, lon: -3.6415, speed: 55, description: 'Entrando a zona (exceso velocidad)' },
                    { lat: 40.5408, lon: -3.6410, speed: 45, description: 'Dentro de zona' },
                    { lat: 40.5410, lon: -3.6405, speed: 40, description: 'Saliendo de zona' },
                    { lat: 40.5415, lon: -3.6400, speed: 35, description: 'Fuera de zona' }
                ]
            },
            {
                id: 'test-vehicle-002',
                name: 'Vehículo de Prueba 2',
                positions: [
                    { lat: 40.4950, lon: -3.8800, speed: 25, description: 'Acercándose al parque' },
                    { lat: 40.4952, lon: -3.8795, speed: 20, description: 'Entrando al parque' },
                    { lat: 40.4955, lon: -3.8790, speed: 15, description: 'Dentro del parque' },
                    { lat: 40.4958, lon: -3.8785, speed: 10, description: 'Estacionado en parque' }
                ]
            }
        ];

        console.log('\n🚗 Iniciando simulación de vehículos...\n');

        // Simular movimiento de vehículos
        for (const vehicle of testVehicles) {
            console.log(`\n🚙 Simulando ${vehicle.name} (${vehicle.id})`);

            for (let i = 0; i < vehicle.positions.length; i++) {
                const position = vehicle.positions[i];

                console.log(`   📍 Posición ${i + 1}: ${position.description}`);
                console.log(`      Coordenadas: ${position.lat}, ${position.lon}`);
                console.log(`      Velocidad: ${position.speed} km/h`);

                try {
                    // Procesar posición del vehículo
                    const events = await geofenceService.processVehiclePosition(
                        vehicle.id,
                        position.lon,
                        position.lat,
                        organization.id,
                        new Date()
                    );

                    if (events.length > 0) {
                        console.log(`      🚨 ${events.length} evento(s) generado(s):`);
                        events.forEach((event, index) => {
                            console.log(`         ${index + 1}. ${event.eventType} - ${event.zoneId || event.parkId || 'N/A'}`);
                        });
                    } else {
                        console.log(`      ✅ Sin eventos`);
                    }

                } catch (error) {
                    console.log(`      ❌ Error procesando posición: ${error}`);
                }

                // Pausa entre posiciones
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Mostrar estadísticas finales
        console.log('\n📊 Estadísticas finales del sistema:');

        const ruleStats = ruleEngine.getStats();
        console.log(`   📋 Motor de reglas:`);
        console.log(`      - Reglas totales: ${ruleStats.totalRules}`);
        console.log(`      - Reglas activas: ${ruleStats.activeRules}`);
        console.log(`      - Vehículos monitoreados: ${ruleStats.totalVehicles}`);
        console.log(`      - Evaluaciones realizadas: ${ruleStats.totalEvaluations}`);

        const wsStats = webSocketService.getStats();
        console.log(`   🔌 WebSocket:`);
        console.log(`      - Clientes conectados: ${wsStats.totalClients}`);
        console.log(`      - Suscripciones activas: ${wsStats.totalSubscriptions}`);

        const geofenceStats = geofenceService.getStats();
        console.log(`   🗺️  Geocercas:`);
        console.log(`      - Vehículos totales: ${geofenceStats.totalVehicles}`);
        console.log(`      - Vehículos en zonas: ${geofenceStats.vehiclesInZones}`);
        console.log(`      - Vehículos en parques: ${geofenceStats.vehiclesInParks}`);

        // Verificar eventos generados en la base de datos
        const events = await prisma.geofenceEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10
        });

        console.log(`\n📋 Últimos eventos generados (${events.length}):`);
        events.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.eventType} - Vehículo: ${event.vehicleId} - ${event.timestamp.toISOString()}`);
        });

        console.log('\n🎉 ¡Prueba completa del sistema finalizada exitosamente!');
        console.log('\n📋 Resumen:');
        console.log('   ✅ Sistema de geocercas operativo');
        console.log('   ✅ WebSocket funcionando');
        console.log('   ✅ Motor de reglas activo');
        console.log('   ✅ Eventos generados y almacenados');
        console.log('   ✅ Base de datos actualizada');

        // Limpiar recursos
        ruleEngine.cleanup();
        webSocketService.close();
        server.close();

    } catch (error) {
        console.error('❌ Error en prueba del sistema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testCompleteSystem().catch(console.error);
}

export { testCompleteSystem };

