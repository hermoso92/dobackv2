/**
 * ✅ TEST FINAL DE RADAR.COM
 * Verifica que la integración funciona correctamente
 */

require('dotenv').config({ path: 'config.env' });
const fetch = require('node-fetch');

const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

// Coordenadas EXACTAS del centro de las geocercas configuradas
const PRUEBAS = [
    {
        nombre: 'Centro Parque Las Rozas',
        lat: 40.5202177500439,
        lon: -3.8841334864808306,
        esperado: 'parque',
        descripcionEsperada: 'Parque Las Rozas'
    },
    {
        nombre: 'Centro Parque Alcobendas',
        lat: 40.53553949812811,
        lon: -3.618328905581324,
        esperado: 'parque',
        descripcionEsperada: 'Parque Alcobendas'
    },
    {
        nombre: 'Plaza Mayor Madrid',
        lat: 40.4153,
        lon: -3.7074,
        esperado: null,
        descripcionEsperada: null
    }
];

async function testRadarFinal() {
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST FINAL DE INTEGRACIÓN RADAR.COM');
    console.log('='.repeat(80));

    let exitosos = 0;
    let fallidos = 0;

    for (const prueba of PRUEBAS) {
        console.log(`\n📍 ${prueba.nombre}`);
        console.log(`   Lat: ${prueba.lat}, Lon: ${prueba.lon}`);

        try {
            const response = await fetch(
                `${RADAR_BASE_URL}/context?coordinates=${prueba.lat},${prueba.lon}`,
                {
                    headers: { 'Authorization': RADAR_SECRET_KEY }
                }
            );

            if (!response.ok) {
                console.error(`   ❌ Error ${response.status}`);
                fallidos++;
                continue;
            }

            const data = await response.json();
            const geofences = data?.context?.geofences || [];

            if (prueba.esperado === null) {
                // Se espera que esté FUERA
                if (geofences.length === 0) {
                    console.log(`   ✅ CORRECTO: Fuera de geocercas (como se esperaba)`);
                    exitosos++;
                } else {
                    console.log(`   ❌ FALLIDO: Se encontró en geocerca ${geofences[0].description}`);
                    fallidos++;
                }
            } else {
                // Se espera que esté DENTRO
                if (geofences.length > 0) {
                    const geocerca = geofences[0];
                    if (geocerca.tag === prueba.esperado) {
                        console.log(`   ✅ CORRECTO: Dentro de "${geocerca.description}" (tag: ${geocerca.tag})`);
                        exitosos++;
                    } else {
                        console.log(`   ❌ FALLIDO: Tag incorrecto. Esperado "${prueba.esperado}", obtenido "${geocerca.tag}"`);
                        fallidos++;
                    }
                } else {
                    console.log(`   ❌ FALLIDO: No se detectó la geocerca esperada "${prueba.descripcionEsperada}"`);
                    fallidos++;
                }
            }

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            fallidos++;
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(80));
    console.log(`✅ Tests exitosos: ${exitosos}`);
    console.log(`❌ Tests fallidos: ${fallidos}`);

    if (fallidos === 0) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
        console.log('\n✅ Radar.com está 100% funcional y configurado correctamente');
        console.log('\n🚀 El sistema ahora usará Radar.com para:');
        console.log('   • Detectar cuando un vehículo entra/sale del parque');
        console.log('   • Calcular Clave 0 (Taller)');
        console.log('   • Calcular Clave 1 (Operativo en parque)');
        console.log('   • Calcular Clave 2 (Salida de emergencia)');
        console.log('   • Calcular Clave 5 (Regreso al parque)');
        console.log('\n💡 Beneficios:');
        console.log('   • KPIs más precisos basados en geocercas reales');
        console.log('   • Detección automática de entrada/salida de bases');
        console.log('   • Sin necesidad de mantener polígonos en la BD local');
        return true;
    } else {
        console.error('\n⚠️  ALGUNOS TESTS FALLARON');
        console.error('   Verifica las coordenadas y la configuración en Radar.com');
        return false;
    }
}

testRadarFinal()
    .then(exito => process.exit(exito ? 0 : 1))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

