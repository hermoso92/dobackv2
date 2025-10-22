/**
 * Verificar que SOLO Rozas y Alcobendas son geocercas válidas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGeocercas() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🗺️  VERIFICACIÓN DE GEOCERCAS - SOLO ROZAS Y ALCOBENDAS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        const parks = await prisma.park.findMany({
            select: {
                id: true,
                name: true,
                geometry: true,
                organizationId: true
            }
        });

        console.log(`Total parques en BD: ${parks.length}\n`);

        const validParks = [];
        const invalidParks = [];

        parks.forEach(park => {
            const isValid = park.name.toLowerCase().includes('rozas') || 
                          park.name.toLowerCase().includes('alcobendas');
            
            if (isValid) {
                validParks.push(park);
            } else {
                invalidParks.push(park);
            }
        });

        console.log(`✅ PARQUES VÁLIDOS: ${validParks.length}\n`);
        validParks.forEach(p => {
            console.log(`   ${p.name}`);
            const geom = typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry;
            console.log(`     Tipo: ${geom.type}`);
            
            if (geom.type === 'Polygon') {
                const coords = geom.coordinates[0];
                const lats = coords.map(c => c[1]);
                const lons = coords.map(c => c[0]);
                const centerLat = lats.reduce((a,b) => a+b, 0) / lats.length;
                const centerLon = lons.reduce((a,b) => a+b, 0) / lons.length;
                console.log(`     Centro: [${centerLat.toFixed(6)}, ${centerLon.toFixed(6)}]`);
            }
            console.log('');
        });

        if (invalidParks.length > 0) {
            console.log(`❌ PARQUES INVÁLIDOS (DEBEN ELIMINARSE): ${invalidParks.length}\n`);
            invalidParks.forEach(p => {
                console.log(`   ${p.name} (ID: ${p.id.substring(0, 13)}...)`);
            });
            console.log('');
            console.log('ACCIÓN REQUERIDA: Eliminar estos parques de la BD\n');
        }

        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkGeocercas();

