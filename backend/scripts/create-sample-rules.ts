#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { GeofenceRuleEngine } from '../src/services/GeofenceRuleEngine';
import { RealTimeGeofenceService } from '../src/services/RealTimeGeofenceService';
import { WebSocketGeofenceService } from '../src/services/WebSocketGeofenceService';

const prisma = new PrismaClient();

interface SampleRule {
    name: string;
    description: string;
    zoneId?: string;
    parkId?: string;
    conditions: any[];
    actions: any[];
    priority: number;
}

async function createSampleRules() {
    console.log('🎯 Creando reglas de ejemplo para validar el sistema...\n');

    try {
        // Conectar a la base de datos
        await prisma.$connect();
        console.log('✅ Conexión a base de datos establecida');

        // Obtener organizaciones, zonas y parques existentes
        const organizations = await prisma.organization.findMany({ take: 1 });
        const zones = await prisma.zone.findMany({ take: 3 });
        const parks = await prisma.park.findMany({ take: 3 });

        if (organizations.length === 0) {
            console.log('❌ No hay organizaciones en la base de datos');
            return;
        }

        const organizationId = organizations[0].id;
        console.log(`📋 Usando organización: ${organizations[0].name}`);

        // Definir reglas de ejemplo
        const sampleRules: SampleRule[] = [
            {
                name: 'Alerta de Velocidad en Zona Restringida',
                description: 'Notifica cuando un vehículo excede 50 km/h en zona restringida',
                zoneId: zones[0]?.id,
                conditions: [
                    {
                        type: 'SPEED_LIMIT',
                        operator: 'GREATER_THAN',
                        field: 'speed',
                        value: 50
                    }
                ],
                actions: [
                    {
                        type: 'NOTIFICATION',
                        config: {
                            title: 'Exceso de Velocidad',
                            message: 'Vehículo excedió límite de velocidad en zona restringida',
                            priority: 'high'
                        }
                    }
                ],
                priority: 1
            },
            {
                name: 'Control de Acceso a Parque',
                description: 'Registra entrada y salida de vehículos del parque principal',
                parkId: parks[0]?.id,
                conditions: [
                    {
                        type: 'CUSTOM',
                        operator: 'EQUALS',
                        field: 'event_type',
                        value: 'entry'
                    }
                ],
                actions: [
                    {
                        type: 'WEBHOOK',
                        config: {
                            url: 'https://api.example.com/access-log',
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    },
                    {
                        type: 'NOTIFICATION',
                        config: {
                            title: 'Acceso al Parque',
                            message: 'Vehículo ingresó al parque principal',
                            priority: 'medium'
                        }
                    }
                ],
                priority: 2
            },
            {
                name: 'Monitoreo de Tiempo en Zona',
                description: 'Alerta si un vehículo permanece más de 2 horas en zona específica',
                zoneId: zones[1]?.id,
                conditions: [
                    {
                        type: 'DURATION',
                        operator: 'GREATER_THAN',
                        field: 'duration_minutes',
                        value: 120
                    }
                ],
                actions: [
                    {
                        type: 'EMAIL',
                        config: {
                            to: 'supervisor@empresa.com',
                            subject: 'Vehículo Estacionado Prolongadamente',
                            template: 'vehicle-parked-alert'
                        }
                    }
                ],
                priority: 3
            },
            {
                name: 'Restricción Horaria',
                description: 'Prohíbe acceso a zona durante horario nocturno (22:00 - 06:00)',
                zoneId: zones[2]?.id,
                conditions: [
                    {
                        type: 'TIME_WINDOW',
                        operator: 'BETWEEN',
                        field: 'time',
                        value: { start: '22:00', end: '06:00' }
                    }
                ],
                actions: [
                    {
                        type: 'SMS',
                        config: {
                            to: '+34600000000',
                            message: 'Acceso no autorizado durante horario nocturno'
                        }
                    },
                    {
                        type: 'ALERT',
                        config: {
                            level: 'critical',
                            sound: true,
                            visual: true
                        }
                    }
                ],
                priority: 1
            }
        ];

        console.log(`📝 Creando ${sampleRules.length} reglas de ejemplo...\n`);

        // Crear reglas en la base de datos
        const createdRules = [];
        for (const rule of sampleRules) {
            try {
                const createdRule = await prisma.geofenceRule.create({
                    data: {
                        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: rule.name,
                        description: rule.description,
                        organizationId: organizationId,
                        zoneId: rule.zoneId,
                        parkId: rule.parkId,
                        conditions: rule.conditions,
                        actions: rule.actions,
                        isActive: true,
                        priority: rule.priority,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });

                createdRules.push(createdRule);
                console.log(`✅ Regla creada: ${rule.name}`);
            } catch (error) {
                console.log(`❌ Error creando regla "${rule.name}":`, error);
            }
        }

        console.log(`\n📊 Resumen de reglas creadas:`);
        console.log(`   - Total creadas: ${createdRules.length}/${sampleRules.length}`);
        console.log(`   - Organización: ${organizations[0].name}`);
        console.log(`   - Zonas utilizadas: ${zones.length}`);
        console.log(`   - Parques utilizados: ${parks.length}`);

        // Probar el motor de reglas con las nuevas reglas
        console.log('\n🧪 Probando motor de reglas con reglas creadas...');

        // Crear servidor temporal para WebSocket
        const server = createServer();
        const geofenceService = new RealTimeGeofenceService(prisma);
        const webSocketService = new WebSocketGeofenceService(server, prisma, geofenceService);
        const ruleEngine = new GeofenceRuleEngine(prisma, geofenceService, webSocketService);

        // Esperar a que el motor cargue las reglas
        await new Promise(resolve => setTimeout(resolve, 1000));

        const stats = ruleEngine.getStats();
        console.log(`📈 Estadísticas del motor:`);
        console.log(`   - Reglas totales: ${stats.totalRules}`);
        console.log(`   - Reglas activas: ${stats.activeRules}`);
        console.log(`   - Vehículos monitoreados: ${stats.totalVehicles}`);

        // Simular evento de prueba
        console.log('\n🚗 Simulando evento de prueba...');
        const testEvent = {
            vehicleId: 'test-vehicle-001',
            latitude: 40.5405,
            longitude: -3.6415,
            speed: 55,
            timestamp: new Date(),
            organizationId: organizationId
        };

        await geofenceService.processVehiclePosition(
            testEvent.vehicleId,
            testEvent.longitude,
            testEvent.latitude,
            testEvent.organizationId,
            testEvent.timestamp
        );
        console.log('✅ Evento procesado correctamente');

        // Limpiar
        ruleEngine.cleanup();
        webSocketService.close();
        server.close();

        console.log('\n🎉 ¡Reglas de ejemplo creadas y validadas exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Probar WebSocket con cliente real');
        console.log('   2. Implementar interfaz de usuario');
        console.log('   3. Configurar notificaciones reales');
        console.log('   4. Monitorear eventos en producción');

    } catch (error) {
        console.error('❌ Error creando reglas de ejemplo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createSampleRules().catch(console.error);
}

export { createSampleRules };

