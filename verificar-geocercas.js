/**
 * Verificar geocercas existentes en BD
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarGeocercas() {
    console.log('\n🗺️  VERIFICANDO GEOCERCAS EXISTENTES\n');
    
    try {
        const zones = await prisma.zone.findMany({
            select: {
                id: true,
                name: true,
                type: true,
                geometry: true,
                organizationId: true,
                createdAt: true
            }
        });

        console.log(`📊 Total de geocercas: ${zones.length}\n`);

        if (zones.length === 0) {
            console.log('⚠️  NO HAY GEOCERCAS CREADAS\n');
            return;
        }

        // Agrupar por tipo
        const porTipo = {};
        zones.forEach(z => {
            if (!porTipo[z.type]) porTipo[z.type] = [];
            porTipo[z.type].push(z);
        });

        for (const [tipo, lista] of Object.entries(porTipo)) {
            console.log(`\n📍 TIPO: ${tipo} (${lista.length})\n`);
            
            lista.forEach(z => {
                console.log(`   🏷️  ${z.name}`);
                console.log(`       ID: ${z.id}`);
                
                if (z.geometry) {
                    try {
                        const geom = typeof z.geometry === 'string' 
                            ? JSON.parse(z.geometry) 
                            : z.geometry;
                        
                        if (geom.type === 'circle' && geom.center) {
                            console.log(`       Centro: ${geom.center.lat}, ${geom.center.lng || geom.center.lon}`);
                            console.log(`       Radio: ${geom.radius}m`);
                        } else if (geom.type === 'polygon' && geom.coordinates) {
                            console.log(`       Polígono con ${geom.coordinates.length} puntos`);
                        }
                    } catch (e) {
                        console.log(`       Geometría: ${JSON.stringify(z.geometry).substring(0, 50)}...`);
                    }
                }
                
                console.log(`       Creada: ${z.createdAt.toISOString().split('T')[0]}\n`);
            });
        }

        // Verificar parques específicamente
        const parques = zones.filter(z => z.type === 'PARK' || z.type === 'park' || z.name.toLowerCase().includes('parque'));
        
        if (parques.length > 0) {
            console.log(`\n✅ PARQUES DETECTADOS: ${parques.length}`);
            console.log('   Sistema puede usar geocercas para detectar estados\n');
        } else {
            console.log(`\n⚠️  NO HAY PARQUES DE BOMBEROS DEFINIDOS`);
            console.log('   Estados 1 (En Parque) no se validarán geográficamente\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarGeocercas();
