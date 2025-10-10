/**
 * TEST DE INTEGRACIÓN RADAR.COM
 * Verificar que la API funciona correctamente
 */

import { radarIntegration } from './src/services/radarIntegration';
import { createLogger } from './src/utils/logger';

const logger = createLogger('TestRadar');

async function testRadarIntegration() {
    console.log('\n' + '='.repeat(80));
    console.log('🗺️  TEST DE INTEGRACIÓN RADAR.COM');
    console.log('='.repeat(80) + '\n');

    try {
        // Coordenadas de prueba (Parque Alcobendas según tus datos)
        const testPoints = [
            { name: 'Dentro Parque Alcobendas', lat: 40.5353, lon: -3.6183 },
            { name: 'Dentro Parque Las Rozas', lat: 40.5202, lon: -3.8841 },
            { name: 'Fuera de parques (Madrid centro)', lat: 40.4168, lon: -3.7038 },
            { name: 'Coordenada aleatoria', lat: 40.5000, lon: -3.7000 }
        ];

        console.log('📍 PROBANDO PUNTOS:\n');

        for (const point of testPoints) {
            console.log(`   Testing: ${point.name}`);
            console.log(`   Coordenadas: ${point.lat}, ${point.lon}`);

            try {
                const resultado = await radarIntegration.verificarEnParque(point.lat, point.lon);

                console.log(`   Resultado: ${resultado.enParque ? '✅ EN PARQUE' : '❌ FUERA'}`);
                if (resultado.enParque) {
                    console.log(`   Parque: ${resultado.nombreParque}`);
                }
                console.log('');

            } catch (error: any) {
                console.log(`   ❌ ERROR: ${error.message}\n`);
            }
        }

        console.log('-'.repeat(80));
        console.log('\n📊 OBTENIENDO TODAS LAS GEOCERCAS:\n');

        const geocercas = await radarIntegration.obtenerGeocercasRadar();
        console.log(`   Total geocercas: ${geocercas.length}\n`);

        if (geocercas.length > 0) {
            geocercas.forEach((g: any, i: number) => {
                console.log(`   ${i + 1}. ${g.description} (${g.externalId})`);
                console.log(`      Tag: ${g.tag}`);
                console.log(`      Tipo: ${g.type}`);
                console.log(`      Centro: ${g.geometryCenter?.coordinates || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('   ⚠️  No se encontraron geocercas');
        }

        console.log('='.repeat(80));
        console.log('✅ TEST COMPLETADO');
        console.log('='.repeat(80) + '\n');

        console.log('💡 NEXT STEPS:');
        console.log('   1. Si ves geocercas listadas → Radar.com funciona ✅');
        console.log('   2. Si ves errores de autenticación → Verifica RADAR_SECRET_KEY');
        console.log('   3. Ve a https://radar.com/dashboard/usage para ver uso de API\n');

    } catch (error: any) {
        console.error('\n❌ ERROR FATAL:', error.message);
        console.error('Stack:', error.stack);

        if (error.message.includes('secret key')) {
            console.log('\n⚠️  RADAR_SECRET_KEY no configurada correctamente');
            console.log('   Verifica backend/config.env línea 30\n');
        }
    }
}

testRadarIntegration();

