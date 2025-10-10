/**
 * 🏢 SCRIPT PARA CREAR GEOCERCAS DE PARQUES DE BOMBEROS
 * Crea las geocercas necesarias para keyCalculator
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// IDs reales del proyecto
const ORGANIZATION_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'; // CMadrid

// Parques de bomberos (coordenadas reales)
const PARQUES_BOMBEROS = [
    {
        name: 'Parque Alcobendas',
        identifier: 'PARK_ALCOBENDAS',
        type: 'PARQUE' as const,
        lat: 40.5419,
        lon: -3.6319,
        radio: 100, // metros
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-3.6329, 40.5409], // SW
                [-3.6309, 40.5409], // SE
                [-3.6309, 40.5429], // NE
                [-3.6329, 40.5429], // NW
                [-3.6329, 40.5409]  // Close polygon
            ]]
        }
    },
    {
        name: 'Parque Las Rozas',
        identifier: 'PARK_ROZAS',
        type: 'PARQUE' as const,
        lat: 40.4919,
        lon: -3.8738,
        radio: 100,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-3.8748, 40.4909],
                [-3.8728, 40.4909],
                [-3.8728, 40.4929],
                [-3.8748, 40.4929],
                [-3.8748, 40.4909]
            ]]
        }
    }
];

// Geocerca de taller (opcional, para Clave 0)
const TALLERES = [
    {
        name: 'Taller Principal',
        identifier: 'TALLER_PRINCIPAL',
        type: 'TALLER' as const,
        lat: 40.5200,
        lon: -3.6500,
        radio: 50,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-3.6505, 40.5195],
                [-3.6495, 40.5195],
                [-3.6495, 40.5205],
                [-3.6505, 40.5205],
                [-3.6505, 40.5195]
            ]]
        }
    }
];

async function crearGeocercasParques() {
    console.log('🏢 Creando geocercas de parques de bomberos...\n');

    try {
        // Verificar que la organización existe
        const org = await prisma.organization.findUnique({
            where: { id: ORGANIZATION_ID }
        });

        if (!org) {
            console.error('❌ Organización no encontrada:', ORGANIZATION_ID);
            return;
        }

        console.log(`✅ Organización encontrada: ${org.name}\n`);

        let creados = 0;
        let existentes = 0;

        // Crear parques
        console.log('📍 Creando parques de bomberos...');
        for (const parque of PARQUES_BOMBEROS) {
            try {
                // Verificar si ya existe
                const existing = await prisma.park.findFirst({
                    where: {
                        identifier: parque.identifier,
                        organizationId: ORGANIZATION_ID
                    }
                });

                if (existing) {
                    console.log(`  ⚠️  Ya existe: ${parque.name}`);
                    existentes++;
                    continue;
                }

                // Crear parque
                const park = await prisma.park.create({
                    data: {
                        name: parque.name,
                        identifier: parque.identifier,
                        geometry: parque.geometry,
                        geometry_postgis: JSON.stringify(parque.geometry),
                        organizationId: ORGANIZATION_ID
                    }
                });

                console.log(`  ✅ Creado: ${park.name} (${park.id})`);
                creados++;
            } catch (error) {
                console.error(`  ❌ Error creando ${parque.name}:`, error);
            }
        }

        // Crear geocercas genéricas para talleres
        console.log('\n🔧 Creando geocercas de talleres...');
        for (const taller of TALLERES) {
            try {
                // Verificar si ya existe
                const existing = await prisma.geofence.findFirst({
                    where: {
                        identifier: taller.identifier,
                        organizationId: ORGANIZATION_ID
                    }
                });

                if (existing) {
                    console.log(`  ⚠️  Ya existe: ${taller.name}`);
                    existentes++;
                    continue;
                }

                // Crear geocerca
                const geofence = await prisma.geofence.create({
                    data: {
                        name: taller.name,
                        identifier: taller.identifier,
                        type: taller.type,
                        geometry: taller.geometry,
                        radius: taller.radio,
                        organizationId: ORGANIZATION_ID,
                        isActive: true
                    }
                });

                console.log(`  ✅ Creado: ${geofence.name} (${geofence.id})`);
                creados++;
            } catch (error) {
                console.error(`  ❌ Error creando ${taller.name}:`, error);
            }
        }

        // Resumen
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN:');
        console.log(`  ✅ Geocercas creadas: ${creados}`);
        console.log(`  ⚠️  Ya existían: ${existentes}`);
        console.log(`  📍 Total de parques: ${PARQUES_BOMBEROS.length}`);
        console.log(`  🔧 Total de talleres: ${TALLERES.length}`);
        console.log('='.repeat(60));

        // Verificar geocercas creadas
        console.log('\n🔍 Verificando geocercas en BD...');
        
        const parks = await prisma.park.findMany({
            where: { organizationId: ORGANIZATION_ID },
            select: { id: true, name: true, identifier: true }
        });

        const geofences = await prisma.geofence.findMany({
            where: { organizationId: ORGANIZATION_ID, type: 'TALLER' },
            select: { id: true, name: true, identifier: true, type: true }
        });

        console.log(`\n✅ Parques en BD: ${parks.length}`);
        parks.forEach(p => console.log(`   - ${p.name} (${p.identifier})`));

        console.log(`\n✅ Geocercas en BD: ${geofences.length}`);
        geofences.forEach(g => console.log(`   - ${g.name} (${g.identifier}, tipo: ${g.type})`));

        console.log('\n🎉 Geocercas de parques creadas correctamente!\n');
        console.log('✅ keyCalculator ahora puede calcular las claves operativas (0,1,2,3,5)\n');

    } catch (error) {
        console.error('❌ Error fatal:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
crearGeocercasParques()
    .then(() => {
        console.log('✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });

