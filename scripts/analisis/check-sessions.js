// Script rápido para verificar sesiones en BD
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const sessionCount = await prisma.session.count();
        const measurementCount = await prisma.measurement.count();
        
        console.log(`\n=== ESTADO DE LA BASE DE DATOS ===`);
        console.log(`Sesiones: ${sessionCount}`);
        console.log(`Mediciones: ${measurementCount}`);
        
        if (sessionCount > 0) {
            // Buscar DOBACK024 del 30/09/2025
            const doback024 = await prisma.session.findMany({
                where: {
                    vehicle: {
                        vehicleIdentifier: 'DOBACK024'
                    },
                    startTime: {
                        gte: new Date('2025-09-30T00:00:00Z'),
                        lt: new Date('2025-10-01T00:00:00Z')
                    }
                },
                include: {
                    vehicle: { select: { vehicleIdentifier: true } },
                    _count: { select: { measurements: true } }
                },
                orderBy: { sessionNumber: 'asc' }
            });
            
            console.log(`\nDOBACK024 - 30/09/2025:`);
            console.log(`  Sesiones encontradas: ${doback024.length}`);
            console.log(`  Sesiones esperadas: 2`);
            
            if (doback024.length > 0) {
                console.log(`\n  Detalle:`);
                doback024.forEach(s => {
                    const start = s.startTime.toISOString().substr(11, 8);
                    const end = s.endTime.toISOString().substr(11, 8);
                    console.log(`    Sesion ${s.sessionNumber}: ${start} - ${end} (${s._count.measurements} mediciones)`);
                });
            }
            
            if (doback024.length === 2) {
                console.log(`\n[EXITO] Sistema funciona correctamente!`);
            } else {
                console.log(`\n[FALLO] Se esperaban 2 sesiones, se encontraron ${doback024.length}`);
            }
        }
        
        console.log(`===================================\n`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

