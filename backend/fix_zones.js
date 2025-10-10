const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixZones() {
    try {
        console.log('🔧 Corrigiendo zonas problemáticas...\n');
        
        // 1. Verificar zonas actuales
        const zones = await prisma.zone.findMany();
        console.log(`📊 Zonas encontradas: ${zones.length}`);
        
        zones.forEach(zone => {
            console.log(`  - ${zone.name || 'Sin nombre'} (${zone.type}) - ${zone.id}`);
        });
        
        // 2. Eliminar zonas problemáticas (sin nombre o con datos corruptos)
        const problematicZones = zones.filter(zone => 
            !zone.name || 
            zone.name.includes('GMT') || 
            zone.name.includes('2025') ||
            zone.geometry === null ||
            !zone.geometry.coordinates
        );
        
        if (problematicZones.length > 0) {
            console.log(`\n🗑️ Eliminando ${problematicZones.length} zonas problemáticas...`);
            
            for (const zone of problematicZones) {
                console.log(`  - Eliminando: ${zone.name || 'Sin nombre'} (${zone.id})`);
                await prisma.zone.delete({
                    where: { id: zone.id }
                });
            }
        }
        
        // 3. Verificar zonas restantes
        const remainingZones = await prisma.zone.findMany();
        console.log(`\n✅ Zonas restantes: ${remainingZones.length}`);
        
        remainingZones.forEach(zone => {
            console.log(`  - ${zone.name} (${zone.type}) - ${zone.organizationId}`);
        });
        
        // 4. Crear zonas de ejemplo si no hay suficientes
        if (remainingZones.length < 2) {
            console.log('\n➕ Creando zonas de ejemplo...');
            
            const organizations = await prisma.organization.findMany();
            if (organizations.length > 0) {
                const org = organizations[0];
                
                // Parque de ejemplo
                await prisma.zone.create({
                    data: {
                        name: 'Parque Central',
                        type: 'parque',
                        organizationId: org.id,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [-3.7038, 40.4168], // Madrid centro
                                [-3.7038, 40.4268],
                                [-3.6938, 40.4268],
                                [-3.6938, 40.4168],
                                [-3.7038, 40.4168]
                            ]]
                        }
                    }
                });
                
                // Taller de ejemplo
                await prisma.zone.create({
                    data: {
                        name: 'Taller Principal',
                        type: 'taller',
                        organizationId: org.id,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [-3.7138, 40.4068],
                                [-3.7138, 40.4168],
                                [-3.7038, 40.4168],
                                [-3.7038, 40.4068],
                                [-3.7138, 40.4068]
                            ]]
                        }
                    }
                });
                
                console.log('  ✅ Zonas de ejemplo creadas');
            }
        }
        
        // 5. Verificación final
        const finalZones = await prisma.zone.findMany();
        console.log(`\n🎯 Verificación final: ${finalZones.length} zonas válidas`);
        
        finalZones.forEach(zone => {
            console.log(`  - ${zone.name} (${zone.type}) - ${zone.organizationId}`);
        });
        
        console.log('\n✅ Corrección de zonas completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixZones(); 