const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessionsStructure() {
    try {
        console.log('📅 VERIFICANDO ESTRUCTURA DE SESIONES:');
        console.log('=====================================');

        // Obtener sesiones recientes
        const sessions = await prisma.session.findMany({
            include: {
                vehicle: {
                    select: { name: true }
                }
            },
            orderBy: { startTime: 'desc' },
            take: 15
        });

        console.log('\n📊 SESIONES RECIENTES:');
        sessions.forEach((session, index) => {
            const date = new Date(session.startTime).toLocaleDateString('es-ES');
            console.log(`${index + 1}. ${session.vehicle?.name || 'N/A'} | ${date} | ID: ${session.id.substring(0, 8)}...`);
        });

        // Agrupar por vehículo y fecha
        console.log('\n🔍 ANÁLISIS POR VEHÍCULO Y FECHA:');
        const vehicleDateMap = {};
        
        sessions.forEach(session => {
            const vehicleName = session.vehicle?.name || 'Desconocido';
            const date = new Date(session.startTime).toLocaleDateString('es-ES');
            const key = `${vehicleName}_${date}`;
            
            if (!vehicleDateMap[key]) {
                vehicleDateMap[key] = [];
            }
            vehicleDateMap[key].push(session.id.substring(0, 8));
        });

        Object.entries(vehicleDateMap).forEach(([key, sessionIds]) => {
            const [vehicle, date] = key.split('_');
            if (sessionIds.length > 1) {
                console.log(`❌ ${vehicle} | ${date}: ${sessionIds.length} sesiones (${sessionIds.join(', ')})`);
            } else {
                console.log(`✅ ${vehicle} | ${date}: 1 sesión (${sessionIds[0]})`);
            }
        });

        // Verificar totales
        console.log('\n📊 ESTADÍSTICAS GENERALES:');
        const totalSessions = await prisma.session.count();
        const sessionsByVehicle = await prisma.session.groupBy({
            by: ['vehicleId'],
            _count: { id: true }
        });

        console.log(`Total de sesiones: ${totalSessions}`);
        console.log(`Sesiones por vehículo: ${sessionsByVehicle.length} vehículos diferentes`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSessionsStructure();

