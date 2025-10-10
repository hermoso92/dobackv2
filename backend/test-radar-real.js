/**
 * Test REAL de Radar.com - Llamada a la API
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

async function testRadarReal() {
    console.log('\n🧪 TEST REAL DE RADAR.COM\n');
    
    const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
    const RADAR_BASE_URL = process.env.RADAR_BASE_URL || 'https://api.radar.io/v1';
    
    console.log(`🔑 RADAR_SECRET_KEY: ${RADAR_SECRET_KEY?.substring(0, 20)}...`);
    console.log(`🌐 RADAR_BASE_URL: ${RADAR_BASE_URL}\n`);
    
    if (!RADAR_SECRET_KEY) {
        console.log('❌ RADAR_SECRET_KEY no configurada');
        return;
    }
    
    // Coordenadas de prueba: Parque Alcobendas
    const lat = 40.53553949812811;
    const lon = -3.618328905581324;
    
    console.log(`📍 Probando coordenadas: ${lat}, ${lon} (Parque Alcobendas)\n`);
    
    try {
        const url = `${RADAR_BASE_URL}/context?coordinates=${lat},${lon}`;
        
        console.log(`🌐 URL: ${url}\n`);
        console.log('⏳ Haciendo llamada a Radar.com...\n');
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': RADAR_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📡 Status: ${response.status} ${response.statusText}\n`);
        
        if (!response.ok) {
            const error = await response.text();
            console.log('❌ ERROR:', error);
            return;
        }
        
        const data = await response.json();
        
        console.log('✅ RESPUESTA RECIBIDA:\n');
        console.log(`📍 Coordenadas verificadas: ${data.coordinates?.latitude}, ${data.coordinates?.longitude}`);
        console.log(`🌍 País: ${data.country?.name || 'N/A'}`);
        console.log(`🏙️ Ciudad: ${data.state?.name || 'N/A'}`);
        
        if (data.geofences && data.geofences.length > 0) {
            console.log(`\n🎯 GEOCERCAS DETECTADAS: ${data.geofences.length}\n`);
            
            data.geofences.forEach((geo, i) => {
                console.log(`   ${i + 1}. ${geo.description || geo.tag}`);
                console.log(`      - Tag: ${geo.tag}`);
                console.log(`      - External ID: ${geo.externalId}`);
                console.log(`      - Tipo: ${geo.type}`);
                console.log('');
            });
            
            const parque = data.geofences.find(g => g.tag === 'parque');
            const taller = data.geofences.find(g => g.tag === 'taller');
            
            console.log('🏢 RESULTADO LÓGICA BOMBEROS:');
            console.log(`   En Parque: ${parque ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   En Taller: ${taller ? '✅ SÍ' : '❌ NO'}`);
            
        } else {
            console.log('\n⚠️ No se encontraron geocercas en esta ubicación');
        }
        
        console.log('\n✅ RADAR.COM FUNCIONANDO CORRECTAMENTE');
        console.log('\n💡 Ahora keyCalculator puede usar Radar.com para detectar parques/talleres');
        
    } catch (error) {
        console.log('❌ ERROR EN LLAMADA:', error.message);
        console.log('\n🔍 Detalles:', error);
    }
    
    // await prisma.$disconnect();
}

testRadarReal();

