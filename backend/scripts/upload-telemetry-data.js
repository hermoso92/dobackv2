const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function uploadTelemetryData() {
    try {
        console.log('🚒 Subiendo datos de telemetría para Bomberos Madrid...');

        // Obtener vehículos de bomberos
        const vehicles = await prisma.vehicle.findMany({
            where: { organizationId: 'bomberos-madrid-001' }
        });

        if (vehicles.length === 0) {
            console.log('❌ No se encontraron vehículos de Bomberos Madrid');
            return;
        }

        console.log(`✅ Encontrados ${vehicles.length} vehículos de bomberos`);

        // Generar datos de telemetría para cada vehículo
        const telemetryData = [];

        for (const vehicle of vehicles) {
            // Generar 3 sesiones de telemetría por vehículo
            for (let i = 1; i <= 3; i++) {
                const sessionDate = new Date();
                sessionDate.setDate(sessionDate.getDate() - i);
                
                const sessionId = `telemetry-${vehicle.id}-${sessionDate.toISOString().split('T')[0]}`;
                
                // Generar puntos GPS para la ruta
                const gpsPoints = [];
                const startTime = new Date(sessionDate.getTime() + 8 * 60 * 60 * 1000); // 08:00
                const endTime = new Date(sessionDate.getTime() + 16 * 60 * 60 * 1000);  // 16:00
                
                // Generar 50 puntos GPS por sesión
                for (let j = 0; j < 50; j++) {
                    const pointTime = new Date(startTime.getTime() + (j * (endTime.getTime() - startTime.getTime()) / 50));
                    
                    // Simular ruta por Madrid
                    const baseLat = 40.4168;
                    const baseLng = -3.7038;
                    const lat = baseLat + (Math.random() - 0.5) * 0.01; // Variación de ~500m
                    const lng = baseLng + (Math.random() - 0.5) * 0.01; // Variación de ~500m
                    
                    gpsPoints.push({
                        timestamp: pointTime,
                        latitude: lat,
                        longitude: lng,
                        speed: 20 + Math.random() * 40, // 20-60 km/h
                        heading: Math.random() * 360, // 0-360 grados
                        altitude: 650 + Math.random() * 50, // 650-700m (altitud de Madrid)
                        accuracy: 2 + Math.random() * 3, // 2-5m precisión
                        // Datos CAN específicos para vehículos de bomberos
                        can: {
                            engineRPM: 1500 + Math.random() * 1000, // 1500-2500 RPM
                            fuelLevel: 20 + Math.random() * 60, // 20-80%
                            waterTankLevel: 50 + Math.random() * 40, // 50-90%
                            pumpPressure: 5 + Math.random() * 10, // 5-15 bar
                            ladderPosition: Math.random() * 30, // 0-30 metros
                            emergencyLights: Math.random() > 0.5,
                            sirenActive: Math.random() > 0.8
                        }
                    });
                }

                // Calcular métricas de la sesión
                const totalDistance = gpsPoints.reduce((sum, point, index) => {
                    if (index === 0) return 0;
                    const prevPoint = gpsPoints[index - 1];
                    const distance = calculateDistance(
                        prevPoint.latitude, prevPoint.longitude,
                        point.latitude, point.longitude
                    );
                    return sum + distance;
                }, 0);

                const avgSpeed = gpsPoints.reduce((sum, point) => sum + point.speed, 0) / gpsPoints.length;
                const maxSpeed = Math.max(...gpsPoints.map(point => point.speed));

                telemetryData.push({
                    id: sessionId,
                    vehicleId: vehicle.id,
                    userId: 'jefe-bomberos-001',
                    startTime: startTime,
                    endTime: endTime,
                    sessionNumber: i,
                    sequence: 1,
                    type: i % 2 === 0 ? 'EMERGENCY' : 'ROUTINE',
                    organizationId: 'bomberos-madrid-001',
                    parkId: 'parque-centro',
                    source: 'manual',
                    // Datos de telemetría
                    gpsPoints: gpsPoints,
                    totalDistance: totalDistance,
                    avgSpeed: avgSpeed,
                    maxSpeed: maxSpeed,
                    // Eventos de telemetría
                    events: [
                        {
                            timestamp: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
                            type: 'GEOFENCE_ENTER',
                            severity: 'LOW',
                            location: { lat: 40.4168, lng: -3.7038 },
                            description: 'Entrada a zona de cobertura'
                        },
                        {
                            timestamp: new Date(startTime.getTime() + 6 * 60 * 60 * 1000),
                            type: 'SPEED_EXCEEDED',
                            severity: 'MEDIUM',
                            location: { lat: 40.4178, lng: -3.7048 },
                            description: 'Velocidad excedida en zona urbana'
                        }
                    ]
                });
            }
        }

        console.log(`📊 Generando ${telemetryData.length} sesiones de telemetría...`);

        // Insertar datos de telemetría
        for (const data of telemetryData) {
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

                // Crear eventos de telemetría
                for (const event of data.events) {
                    await prisma.event.upsert({
                        where: { id: `telemetry-event-${data.id}-${event.timestamp.getTime()}` },
                        update: {},
                        create: {
                            id: `telemetry-event-${data.id}-${event.timestamp.getTime()}`,
                            type: 'GPS',
                            status: 'ACTIVE',
                            timestamp: event.timestamp,
                            data: {
                                latitude: event.location.lat,
                                longitude: event.location.lng,
                                severity: event.severity,
                                eventType: event.type,
                                vehicleId: data.vehicleId,
                                sessionId: data.id,
                                description: event.description
                            },
                            displayData: {
                                message: event.description,
                                location: `Lat: ${event.location.lat}, Lng: ${event.location.lng}`,
                                severity: event.severity
                            },
                            organizationId: data.organizationId
                        }
                    });
                }

                console.log(`✅ Sesión de telemetría creada: ${data.id} (${data.type})`);
            } catch (error) {
                console.error(`❌ Error creando sesión ${data.id}:`, error.message);
            }
        }

        // Crear resumen de telemetría
        const summary = {
            totalSessions: telemetryData.length,
            vehicles: vehicles.length,
            dateRange: {
                from: new Date(Math.min(...telemetryData.map(d => d.startTime.getTime()))),
                to: new Date(Math.max(...telemetryData.map(d => d.endTime.getTime())))
            },
            metrics: {
                totalDistance: telemetryData.reduce((sum, d) => sum + d.totalDistance, 0),
                avgSpeed: telemetryData.reduce((sum, d) => sum + d.avgSpeed, 0) / telemetryData.length,
                maxSpeed: Math.max(...telemetryData.map(d => d.maxSpeed)),
                totalEvents: telemetryData.reduce((sum, d) => sum + d.events.length, 0),
                totalGpsPoints: telemetryData.reduce((sum, d) => sum + d.gpsPoints.length, 0)
            }
        };

        console.log('\n🎉 Datos de telemetría subidos exitosamente!\n');
        console.log('📋 Resumen:');
        console.log(`- Total de sesiones: ${summary.totalSessions}`);
        console.log(`- Vehículos: ${summary.vehicles}`);
        console.log(`- Rango de fechas: ${summary.dateRange.from.toDateString()} - ${summary.dateRange.to.toDateString()}`);
        console.log(`- Distancia total: ${summary.metrics.totalDistance.toFixed(2)} km`);
        console.log(`- Velocidad promedio: ${summary.metrics.avgSpeed.toFixed(2)} km/h`);
        console.log(`- Velocidad máxima: ${summary.metrics.maxSpeed.toFixed(2)} km/h`);
        console.log(`- Total de eventos: ${summary.metrics.totalEvents}`);
        console.log(`- Puntos GPS: ${summary.metrics.totalGpsPoints}`);
        console.log('\n✅ Script completado exitosamente');

    } catch (error) {
        console.error('❌ Error subiendo datos de telemetría:', error);
        console.error('❌ Script falló:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Función para calcular distancia entre dos puntos GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

uploadTelemetryData();
