const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function uploadStabilityData() {
    try {
        console.log('🚒 Subiendo datos de estabilidad para Bomberos Madrid...');

        // Obtener vehículos de bomberos
        const vehicles = await prisma.vehicle.findMany({
            where: { organizationId: 'bomberos-madrid-001' }
        });

        if (vehicles.length === 0) {
            console.log('❌ No se encontraron vehículos de Bomberos Madrid');
            return;
        }

        console.log(`✅ Encontrados ${vehicles.length} vehículos de bomberos`);

        // Generar datos de estabilidad para cada vehículo
        const stabilityData = [];

        for (const vehicle of vehicles) {
            // Generar 5 sesiones de estabilidad por vehículo
            for (let i = 1; i <= 5; i++) {
                const sessionDate = new Date();
                sessionDate.setDate(sessionDate.getDate() - i);
                
                const sessionId = `stability-${vehicle.id}-${sessionDate.toISOString().split('T')[0]}`;
                
                // Datos de estabilidad realistas para vehículos de bomberos
                const ltr = 0.75 + Math.random() * 0.2; // 0.75 - 0.95
                const ssf = 1.0 + Math.random() * 0.5;  // 1.0 - 1.5
                const drs = 0.80 + Math.random() * 0.15; // 0.80 - 0.95

                stabilityData.push({
                    id: sessionId,
                    vehicleId: vehicle.id,
                    userId: 'jefe-bomberos-001',
                    startTime: new Date(sessionDate.getTime() + 8 * 60 * 60 * 1000), // 08:00
                    endTime: new Date(sessionDate.getTime() + 16 * 60 * 60 * 1000),  // 16:00
                    sessionNumber: i,
                    sequence: 1,
                    type: i % 2 === 0 ? 'EMERGENCY' : 'ROUTINE',
                    organizationId: 'bomberos-madrid-001',
                    parkId: 'parque-centro',
                    source: 'manual',
                    // Datos de estabilidad
                    ltr: Math.round(ltr * 100) / 100,
                    ssf: Math.round(ssf * 100) / 100,
                    drs: Math.round(drs * 100) / 100,
                    // Métricas adicionales
                    maxSpeed: 45 + Math.random() * 20, // 45-65 km/h
                    avgSpeed: 25 + Math.random() * 15, // 25-40 km/h
                    distance: 50 + Math.random() * 100, // 50-150 km
                    fuelConsumption: 15 + Math.random() * 10, // 15-25 L
                    // Eventos críticos
                    criticalEvents: Math.floor(Math.random() * 3), // 0-2 eventos
                    // Timestamps de eventos
                    events: [
                        {
                            timestamp: new Date(sessionDate.getTime() + 10 * 60 * 60 * 1000),
                            type: 'HARD_BRAKE',
                            severity: 'MEDIUM',
                            location: { lat: 40.4168, lng: -3.7038 }
                        },
                        {
                            timestamp: new Date(sessionDate.getTime() + 14 * 60 * 60 * 1000),
                            type: 'SPEED_EXCEEDED',
                            severity: 'LOW',
                            location: { lat: 40.4178, lng: -3.7048 }
                        }
                    ]
                });
            }
        }

        console.log(`📊 Generando ${stabilityData.length} sesiones de estabilidad...`);

        // Insertar datos de estabilidad
        for (const data of stabilityData) {
            try {
                // Crear sesión
                const session = await prisma.session.upsert({
                    where: { id: data.id },
                    update: {},
                    create: {
                        id: data.id,
                        vehicleId: data.vehicleId,
                        userId: data.userId,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        sessionNumber: data.sessionNumber,
                        sequence: data.sequence,
                        type: data.type,
                        organizationId: data.organizationId,
                        parkId: data.parkId,
                        source: data.source
                    }
                });

                // Crear eventos de estabilidad
                for (const event of data.events) {
                    await prisma.event.upsert({
                        where: { id: `event-${data.id}-${event.timestamp.getTime()}` },
                        update: {},
                        create: {
                            id: `event-${data.id}-${event.timestamp.getTime()}`,
                            type: 'GPS',
                            status: 'ACTIVE',
                            timestamp: event.timestamp,
                            data: {
                                latitude: event.location.lat,
                                longitude: event.location.lng,
                                severity: event.severity,
                                eventType: event.type,
                                vehicleId: data.vehicleId,
                                sessionId: data.id
                            },
                            displayData: {
                                message: `Evento de estabilidad: ${event.type}`,
                                location: `Lat: ${event.location.lat}, Lng: ${event.location.lng}`,
                                severity: event.severity
                            },
                            organizationId: data.organizationId
                        }
                    });
                }

                console.log(`✅ Sesión creada: ${data.id} (${data.type})`);
            } catch (error) {
                console.error(`❌ Error creando sesión ${data.id}:`, error.message);
            }
        }

        // Crear resumen de estabilidad
        const summary = {
            totalSessions: stabilityData.length,
            vehicles: vehicles.length,
            dateRange: {
                from: new Date(Math.min(...stabilityData.map(d => d.startTime.getTime()))),
                to: new Date(Math.max(...stabilityData.map(d => d.endTime.getTime())))
            },
            metrics: {
                avgLTR: stabilityData.reduce((sum, d) => sum + d.ltr, 0) / stabilityData.length,
                avgSSF: stabilityData.reduce((sum, d) => sum + d.ssf, 0) / stabilityData.length,
                avgDRS: stabilityData.reduce((sum, d) => sum + d.drs, 0) / stabilityData.length,
                totalEvents: stabilityData.reduce((sum, d) => sum + d.events.length, 0),
                criticalEvents: stabilityData.reduce((sum, d) => sum + d.criticalEvents, 0)
            }
        };

        console.log('\n🎉 Datos de estabilidad subidos exitosamente!\n');
        console.log('📋 Resumen:');
        console.log(`- Total de sesiones: ${summary.totalSessions}`);
        console.log(`- Vehículos: ${summary.vehicles}`);
        console.log(`- Rango de fechas: ${summary.dateRange.from.toDateString()} - ${summary.dateRange.to.toDateString()}`);
        console.log(`- LTR promedio: ${summary.metrics.avgLTR.toFixed(2)}`);
        console.log(`- SSF promedio: ${summary.metrics.avgSSF.toFixed(2)}`);
        console.log(`- DRS promedio: ${summary.metrics.avgDRS.toFixed(2)}`);
        console.log(`- Total de eventos: ${summary.metrics.totalEvents}`);
        console.log(`- Eventos críticos: ${summary.metrics.criticalEvents}`);
        console.log('\n✅ Script completado exitosamente');

    } catch (error) {
        console.error('❌ Error subiendo datos de estabilidad:', error);
        console.error('❌ Script falló:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

uploadStabilityData();
