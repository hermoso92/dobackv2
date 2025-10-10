/**
 * Verificar si las geocercas de parques tienen coordenadas válidas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarCoordenadasParques() {
    console.log('\n🗺️  VERIFICACIÓN DE GEOCERCAS DE PARQUES\n');
    
    try {
        const parques = await prisma.zone.findMany({
            where: {
                type: 'PARK'
            },
            select: {
                id: true,
                name: true,
                geometry: true
            }
        });

        console.log(`📊 Parques encontrados: ${parques.length}\n`);

        if (parques.length === 0) {
            console.log('❌ NO HAY PARQUES DE BOMBEROS DEFINIDOS');
            console.log('\n⚠️  SIN GEOCERCAS NO SE PUEDEN CALCULAR:');
            console.log('   - Tiempo en parque');
            console.log('   - Tiempo fuera de parque');
            console.log('   - Detección de salidas/regresos');
            console.log('   - Clave 2 y Clave 5\n');
            return;
        }

        for (const parque of parques) {
            console.log(`📍 ${parque.name}`);
            console.log(`   ID: ${parque.id}`);
            
            try {
                const geom = typeof parque.geometry === 'string' 
                    ? JSON.parse(parque.geometry) 
                    : parque.geometry;
                
                console.log(`   Tipo: ${geom.type || 'NO DEFINIDO'}`);
                
                if (geom.type === 'circle') {
                    console.log(`   Centro: ${geom.center?.lat}, ${geom.center?.lng || geom.center?.lon}`);
                    console.log(`   Radio: ${geom.radius}m`);
                    
                    if (!geom.center || !geom.center.lat || (!geom.center.lng && !geom.center.lon) || !geom.radius) {
                        console.log(`   ❌ GEOCERCA INCOMPLETA - Faltan coordenadas`);
                    } else {
                        console.log(`   ✅ Geocerca válida y utilizable`);
                        
                        // Enlace a Google Maps
                        const lat = geom.center.lat;
                        const lng = geom.center.lng || geom.center.lon;
                        console.log(`   🗺️  Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
                    }
                } else if (geom.type === 'polygon') {
                    console.log(`   Vértices: ${geom.coordinates?.length || 0}`);
                    
                    if (!geom.coordinates || geom.coordinates.length < 3) {
                        console.log(`   ❌ POLÍGONO INVÁLIDO - Mínimo 3 vértices`);
                    } else {
                        console.log(`   ✅ Polígono válido`);
                        
                        // Mostrar primeros 3 vértices
                        console.log(`   Vértices:`);
                        geom.coordinates.slice(0, 3).forEach((v, i) => {
                            console.log(`      ${i + 1}: ${v.lat}, ${v.lng || v.lon}`);
                        });
                        if (geom.coordinates.length > 3) {
                            console.log(`      ... y ${geom.coordinates.length - 3} más`);
                        }
                    }
                } else {
                    console.log(`   ❌ TIPO DESCONOCIDO: ${geom.type}`);
                }
                
            } catch (error) {
                console.log(`   ❌ ERROR parseando geometry: ${error.message}`);
            }
            
            console.log();
        }

        // Resumen
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('📋 RESUMEN:\n');
        
        const validas = parques.filter(p => {
            try {
                const geom = typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry;
                if (geom.type === 'circle') {
                    return geom.center && geom.center.lat && (geom.center.lng || geom.center.lon) && geom.radius;
                } else if (geom.type === 'polygon') {
                    return geom.coordinates && geom.coordinates.length >= 3;
                }
                return false;
            } catch {
                return false;
            }
        });

        console.log(`   Total parques: ${parques.length}`);
        console.log(`   Geocercas válidas: ${validas.length}`);
        console.log(`   Geocercas inválidas: ${parques.length - validas.length}`);
        
        if (validas.length > 0) {
            console.log(`\n   ✅ Sistema puede detectar salidas/regresos de parques`);
            console.log(`   ✅ Se pueden calcular Clave 2 y Clave 5 correctamente\n`);
        } else {
            console.log(`\n   ❌ NO SE PUEDE USAR LÓGICA DE BOMBEROS SIN GEOCERCAS VÁLIDAS`);
            console.log(`   ⚠️  Necesitas configurar las geocercas de los parques\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarCoordenadasParques();

