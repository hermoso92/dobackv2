/**
 * 🧪 TEST CON COORDENADAS REALES DE RADAR.COM
 * Usa las coordenadas exactas de las geocercas configuradas
 */

require('dotenv').config({ path: 'config.env' });
const fetch = require('node-fetch');

const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

// COORDENADAS REALES DE LAS GEOCERCAS CONFIGURADAS EN RADAR.COM
const COORDENADAS_REALES = [
    // Dentro de Parque Las Rozas (Radio: 194m)
    { lat: 40.5202, lon: -3.8841, nombre: '📍 Centro Parque Las Rozas' },
    { lat: 40.5210, lon: -3.8850, nombre: '📍 Dentro Parque Las Rozas (+100m)' },
    
    // Dentro de Parque Alcobendas (Radio: 71m)
    { lat: 40.5355, lon: -3.6183, nombre: '📍 Centro Parque Alcobendas' },
    { lat: 40.5360, lon: -3.6190, nombre: '📍 Dentro Parque Alcobendas (+50m)' },
    
    // Fuera de geocercas
    { lat: 40.4153, lon: -3.7074, nombre: '❌ Plaza Mayor Madrid (fuera)' }
];

async function testContextAPI() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST DE CONTEXT API CON COORDENADAS REALES');
    console.log('='.repeat(80));

    let dentroParque = 0;
    let fueraGeocercas = 0;

    for (const coords of COORDENADAS_REALES) {
        console.log(`\n${coords.nombre}`);
        console.log(`   Lat: ${coords.lat}, Lon: ${coords.lon}`);

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
                console.log(`   ✅ DENTRO de geocerca:`);
                context.geofences.forEach((g) => {
                    console.log(`      → ${g.description} (tag: ${g.tag})`);
                });
                dentroParque++;
            } else {
                console.log(`   ℹ️  FUERA de geocercas`);
                fueraGeocercas++;
            }

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADOS');
    console.log('='.repeat(80));
    console.log(`✅ Puntos DENTRO de parques: ${dentroParque}`);
    console.log(`ℹ️  Puntos FUERA de geocercas: ${fueraGeocercas}`);

    if (dentroParque >= 4) {
        console.log('\n✅ ¡RADAR.COM FUNCIONANDO CORRECTAMENTE!');
        console.log('   El sistema detecta correctamente cuando un vehículo está');
        console.log('   dentro de un parque de bomberos.');
    } else {
        console.warn('\n⚠️  Context API no detecta correctamente las geocercas');
        console.warn('   Verifica el radio de las geocercas en Radar.com');
    }

    console.log('\n');
}

testContextAPI().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});

