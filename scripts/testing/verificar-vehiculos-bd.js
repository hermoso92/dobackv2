/**
 * 🔍 VERIFICAR VEHÍCULOS EN BD
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarVehiculos() {
    console.log('🔍 VEHÍCULOS EN BASE DE DATOS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: {
                identifier: 'asc'
            }
        });

        console.log(`📊 Total vehículos: ${vehicles.length}\n`);

        for (const vehicle of vehicles) {
            const sessionCount = await prisma.session.count({
                where: {
                    vehicleId: vehicle.id
                }
            });

            console.log(`🚗 ${vehicle.identifier}:`);
            console.log(`   ID: ${vehicle.id}`);
            console.log(`   Name: ${vehicle.name}`);
            console.log(`   Organization: ${vehicle.organizationId}`);
            console.log(`   Sesiones: ${sessionCount}\n`);
        }

        // Contar sesiones totales
        const totalSessions = await prisma.session.count({});
        console.log(`📊 Total sesiones en BD: ${totalSessions}\n`);

        // Listar todas las sesiones con información del vehículo
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: {
                    select: {
                        identifier: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { startTime: 'asc' }
            ]
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 TODAS LAS SESIONES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Agrupar por vehículo
        const porVehiculo = {};
        sessions.forEach(s => {
            const vehiculo = s.Vehicle.identifier;
            if (!porVehiculo[vehiculo]) {
                porVehiculo[vehiculo] = [];
            }
            porVehiculo[vehiculo].push(s);
        });

        for (const [vehiculo, sesiones] of Object.entries(porVehiculo)) {
            console.log(`🚗 ${vehiculo.toUpperCase()} (${sesiones.length} sesiones):\n`);

            sesiones.slice(0, 10).forEach((s, i) => {
                const fecha = s.startTime.toISOString().split('T')[0];
                const [y, m, d] = fecha.split('-');
                const inicio = s.startTime.toTimeString().split(' ')[0];
                const fin = s.endTime ? s.endTime.toTimeString().split(' ')[0] : 'N/A';
                const durMin = s.endTime ? Math.round((s.endTime - s.startTime) / 1000 / 60) : 0;
                
                console.log(`   ${i + 1}. ${d}/${m}/${y}: ${inicio} → ${fin} (${durMin} min) - Sesión #${s.sessionNumber}`);
            });

            if (sesiones.length > 10) {
                console.log(`   ... y ${sesiones.length - 10} más`);
            }
            console.log();
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verificarVehiculos();

