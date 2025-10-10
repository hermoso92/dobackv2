/**
 * SCRIPT DE VERIFICACIÓN RÁPIDA - RADAR.COM
 * 
 * Verifica que la integración con Radar.com funcione correctamente
 */

const axios = require('axios');
require('dotenv').config({ path: './config.env' });

const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

// Coordenadas de test
const TEST_POINTS = [
    { name: 'Dentro Parque Central', lat: 40.42, lon: -3.70 },
    { name: 'Fuera de Parques', lat: 40.50, lon: -3.60 }
];

async function testRadarAPI() {
    console.log('\n🔍 VERIFICACIÓN RADAR.COM\n');
    console.log('='.repeat(50));
    
    // 1. Verificar credenciales
    console.log('\n1. Verificando credenciales...');
    if (!RADAR_SECRET_KEY) {
        console.error('❌ RADAR_SECRET_KEY no configurado');
        return;
    }
    console.log('   ✅ RADAR_SECRET_KEY configurado');
    
    // 2. Listar geocercas
    console.log('\n2. Listando geocercas configuradas...');
    try {
        const geofencesResponse = await axios.get(`${RADAR_BASE_URL}/geofences`, {
            headers: { 'Authorization': RADAR_SECRET_KEY }
        });
        
        const geofences = geofencesResponse.data.geofences || [];
        console.log(`   ✅ ${geofences.length} geocercas encontradas:`);
        geofences.forEach(g => {
            console.log(`      - ${g.description} (tag: ${g.tag})`);
        });
    } catch (error) {
        console.error('   ❌ Error listando geocercas:', error.response?.data || error.message);
        return;
    }
    
    // 3. Probar Context API con puntos de test
    console.log('\n3. Probando Context API...');
    for (const point of TEST_POINTS) {
        console.log(`\n   📍 ${point.name} (${point.lat}, ${point.lon})`);
        try {
            const contextResponse = await axios.get(
                `${RADAR_BASE_URL}/context?coordinates=${point.lat},${point.lon}`,
                {
                    headers: { 'Authorization': RADAR_SECRET_KEY }
                }
            );
            
            const geofences = contextResponse.data.context?.geofences || [];
            
            if (geofences.length > 0) {
                console.log(`      ✅ Dentro de geocerca: ${geofences[0].description}`);
                console.log(`         Tag: ${geofences[0].tag}`);
            } else {
                console.log(`      ℹ️  No está dentro de ninguna geocerca`);
            }
        } catch (error) {
            console.error(`      ❌ Error en Context API:`, error.response?.data || error.message);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Verificación completada\n');
}

testRadarAPI().catch(console.error);
