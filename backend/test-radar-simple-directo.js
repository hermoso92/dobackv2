/**
 * 🧪 TEST DIRECTO DE RADAR.COM (Sin compilar TypeScript)
 * Prueba directa con fetch a Radar.io API
 */

require('dotenv').config({ path: 'config.env' });
const fetch = require('node-fetch');

const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

// Coordenadas de prueba (Madrid - zona de bomberos)
const COORDENADAS_PRUEBA = [
    { lat: 40.5379, lon: -3.6408, nombre: 'Parque Alcobendas (aprox.)' },
    { lat: 40.4913, lon: -3.8739, nombre: 'Parque Las Rozas (aprox.)' },
    { lat: 40.4153, lon: -3.7074, nombre: 'Plaza Mayor Madrid (fuera)' }
];

async function testRadarAPI() {
    console.log('\n' + '='.repeat(80));
    console.log('🚒 TEST DIRECTO DE RADAR.COM - BOMBEROS MADRID');
    console.log('='.repeat(80));

    // Verificar API Key
    console.log('\n📋 1. Verificando configuración...');
    if (!RADAR_SECRET_KEY) {
        console.error('❌ RADAR_SECRET_KEY no configurada en config.env');
        return;
    }
    console.log('✅ RADAR_SECRET_KEY:', RADAR_SECRET_KEY.substring(0, 25) + '...');

    // Test 1: Obtener geocercas
    console.log('\n🗺️  2. Obteniendo geocercas configuradas...');
    try {
        const response = await fetch(`${RADAR_BASE_URL}/geofences`, {
            headers: {
                'Authorization': RADAR_SECRET_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error ${response.status}:`, errorText);
            
            if (response.status === 401) {
                console.error('\n💡 Error 401: API Key inválida o expirada');
                console.error('   Verifica que RADAR_SECRET_KEY en config.env sea correcta');
            }
            return;
        }

        const data = await response.json();
        
        if (data && data.geofences) {
            console.log(`✅ Geocercas obtenidas: ${data.geofences.length}`);
            
            // Agrupar por tag
            const porTag = {};
            data.geofences.forEach(g => {
                const tag = g.tag || 'sin-tag';
                if (!porTag[tag]) porTag[tag] = [];
                porTag[tag].push(g);
            });

            console.log('\n📊 Geocercas por tag:');
            Object.entries(porTag).forEach(([tag, lista]) => {
                console.log(`\n   ${tag.toUpperCase()}: ${lista.length} geocerca(s)`);
                lista.forEach(g => {
                    console.log(`      ✓ ${g.description || g.externalId}`);
                    if (g.geometryCenter) {
                        const [lng, lat] = g.geometryCenter.coordinates;
                        console.log(`        Centro: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
                    }
                    if (g.geometryRadius) {
                        console.log(`        Radio: ${g.geometryRadius}m`);
                    }
                });
            });

            // Verificar que existan geocercas de parque y taller
            console.log('\n✅ Verificación de configuración:');
            if (porTag['parque']) {
                console.log(`   ✓ ${porTag['parque'].length} geocerca(s) de PARQUE configuradas`);
            } else {
                console.warn('   ⚠️  NO hay geocercas con tag "parque"');
            }
            
            if (porTag['taller']) {
                console.log(`   ✓ ${porTag['taller'].length} geocerca(s) de TALLER configuradas`);
            } else {
                console.warn('   ⚠️  NO hay geocercas con tag "taller"');
            }

        } else {
            console.warn('⚠️  No se obtuvieron geocercas');
        }

    } catch (error) {
        console.error('❌ Error obteniendo geocercas:', error.message);
        return;
    }

    // Test 2: Context API - Verificar puntos
    console.log('\n' + '='.repeat(80));
    console.log('📍 3. Probando Context API con coordenadas de prueba');
    console.log('='.repeat(80));

    for (const coords of COORDENADAS_PRUEBA) {
        console.log(`\n📍 ${coords.nombre}`);
        console.log(`   Coordenadas: [${coords.lat}, ${coords.lon}]`);

        try {
            const response = await fetch(
                `${RADAR_BASE_URL}/context?coordinates=${coords.lat},${coords.lon}`,
                {
                    headers: {
                        'Authorization': RADAR_SECRET_KEY
                    }
                }
            );

            if (!response.ok) {
                console.error(`   ❌ Error ${response.status}`);
                continue;
            }

            const context = await response.json();

            if (context && context.geofences && context.geofences.length > 0) {
                console.log(`   ✅ DENTRO de geocerca(s):`);
                context.geofences.forEach((g, i) => {
                    console.log(`      ${i + 1}. ${g.description}`);
                    console.log(`         Tag: ${g.tag}`);
                    console.log(`         ID: ${g._id}`);
                });
            } else {
                console.log(`   ℹ️  FUERA de todas las geocercas`);
            }

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    // Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN');
    console.log('='.repeat(80));
    console.log('\n✅ Radar.com está conectado y funcionando');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Asegúrate de que las geocercas de los parques de bomberos');
    console.log('      estén configuradas en Radar.com con tag="parque"');
    console.log('   2. Si hay talleres, configúralos con tag="taller"');
    console.log('   3. Ajusta las coordenadas de COORDENADAS_PRUEBA en este script');
    console.log('      para que coincidan con tus parques reales');
    console.log('\n🚀 El sistema usará Radar.com para calcular:');
    console.log('   - Clave 0: Tiempo en taller');
    console.log('   - Clave 1: Tiempo operativo en parque');
    console.log('   - Clave 2: Salida de emergencia desde parque');
    console.log('   - Clave 5: Regreso al parque');
    console.log('\n');
}

// Ejecutar test
testRadarAPI().catch(error => {
    console.error('\n❌ Error ejecutando test:', error);
    process.exit(1);
});

