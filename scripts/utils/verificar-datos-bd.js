/**
 * Script simple para verificar datos en BD usando el mismo Prisma que backend-final.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    log: ['error', 'warn']
});

async function main() {
    console.log('\n========================================');
    console.log('VERIFICACIÓN DE DATOS EN BASE DE DATOS');
    console.log('========================================\n');

    try {
        // 1. Contar tablas principales
        console.log('📊 CONTEO DE REGISTROS:\n');
        
        const sessionCount = await prisma.session.count().catch(() => 0);
        console.log(`Sessions: ${sessionCount}`);
        
        const vehicleCount = await prisma.vehicle.count().catch(() => 0);
        console.log(`Vehicles: ${vehicleCount}`);
        
        const rotativoCount = await prisma.rotativoMeasurement.count().catch(() => 0);
        console.log(`RotativoMeasurement: ${rotativoCount}`);
        
        const gpsCount = await prisma.gpsMeasurement.count().catch(() => 0);
        console.log(`GpsMeasurement: ${gpsCount}`);
        
        const eventsCount = await prisma.stability_events.count().catch(() => 0);
        console.log(`stability_events: ${eventsCount}`);
        
        const geofenceCount = await prisma.geofence.count().catch(() => 0);
        console.log(`Geofences: ${geofenceCount}\n`);

        // 2. Listar vehículos
        console.log('🚒 VEHÍCULOS:\n');
        const vehicles = await prisma.vehicle.findMany({
            select: { id: true, name: true, licensePlate: true }
        });
        vehicles.forEach(v => {
            console.log(`   • ${v.name} (${v.licensePlate}) - ${v.id}`);
        });
        console.log();

        // 3. Listar sesiones recientes
        console.log('📋 ÚLTIMAS 3 SESIONES:\n');
        const sessions = await prisma.session.findMany({
            take: 3,
            orderBy: { startTime: 'desc' },
            select: {
                id: true,
                vehicleId: true,
                startTime: true,
                endTime: true
            }
        });
        
        for (const s of sessions) {
            const rotCount = await prisma.rotativoMeasurement.count({ where: { sessionId: s.id } });
            const gpsCountSession = await prisma.gpsMeasurement.count({ where: { sessionId: s.id } });
            const eventsCountSession = await prisma.stability_events.count({ where: { sessionId: s.id } });
            
            console.log(`   Sesión: ${s.id}`);
            console.log(`   Inicio: ${s.startTime?.toISOString() || 'null'}`);
            console.log(`   Fin: ${s.endTime?.toISOString() || 'null'}`);
            console.log(`   Rotativo: ${rotCount} | GPS: ${gpsCountSession} | Eventos: ${eventsCountSession}\n`);
        }

        // 4. Verificar geocercas
        console.log('🗺️  GEOCERCAS:\n');
        const geofences = await prisma.geofence.findMany({
            select: { id: true, name: true, type: true }
        });
        
        if (geofences.length === 0) {
            console.log('   ⚠️  NO HAY GEOCERCAS CONFIGURADAS\n');
        } else {
            geofences.forEach(g => {
                console.log(`   • ${g.name} (${g.type})`);
            });
            console.log();
        }

        // 5. Análisis de una sesión con datos
        console.log('🔬 ANÁLISIS DE SESIÓN CON DATOS:\n');
        const sessionWithData = await prisma.session.findFirst({
            where: {
                RotativoMeasurement: { some: {} }
            },
            include: {
                vehicle: { select: { name: true } },
                RotativoMeasurement: {
                    take: 10,
                    orderBy: { timestamp: 'asc' },
                    select: { state: true, timestamp: true }
                }
            }
        });

        if (!sessionWithData) {
            console.log('   ⚠️  NO HAY SESIONES CON DATOS DE ROTATIVO\n');
        } else {
            console.log(`   Sesión: ${sessionWithData.id}`);
            console.log(`   Vehículo: ${sessionWithData.vehicle.name}`);
            console.log(`   Primeras 10 mediciones de rotativo:`);
            sessionWithData.RotativoMeasurement.forEach(r => {
                console.log(`      ${r.timestamp.toISOString()} - Clave ${r.state}`);
            });
            console.log();
        }

        console.log('========================================');
        console.log('VERIFICACIÓN COMPLETADA');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

