/**
 * 🔍 DEBUG DE RADAR.COM
 * Ver respuesta completa de la API
 */

require('dotenv').config({ path: 'config.env' });
const fetch = require('node-fetch');

const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

async function debugRadar() {
    console.log('\n🔍 DEBUG RADAR.COM\n');

    // 1. Ver geocercas configuradas
    console.log('1️⃣ GEOCERCAS CONFIGURADAS:');
    console.log('='.repeat(80));
    
    const geofencesResponse = await fetch(`${RADAR_BASE_URL}/geofences`, {
        headers: { 'Authorization': RADAR_SECRET_KEY }
    });
    
    const geofencesData = await geofencesResponse.json();
    console.log(JSON.stringify(geofencesData, null, 2));

    // 2. Probar Context API con coordenada del centro
    console.log('\n\n2️⃣ CONTEXT API (Centro Parque Las Rozas):');
    console.log('='.repeat(80));
    
    const lat = 40.5202;
    const lon = -3.8841;
    
    const contextResponse = await fetch(
        `${RADAR_BASE_URL}/context?coordinates=${lat},${lon}`,
        {
            headers: { 'Authorization': RADAR_SECRET_KEY }
        }
    );
    
    const contextData = await contextResponse.json();
    console.log(JSON.stringify(contextData, null, 2));

    // 3. Probar con otras coordenadas
    console.log('\n\n3️⃣ PROBANDO DIFERENTES FORMATOS:');
    console.log('='.repeat(80));
    
    // Formato 1: lat,lon
    console.log('\nFormato: lat,lon');
    let resp = await fetch(`${RADAR_BASE_URL}/context?coordinates=${lat},${lon}`, {
        headers: { 'Authorization': RADAR_SECRET_KEY }
    });
    let data = await resp.json();
    console.log('Geofences:', data.geofences ? data.geofences.length : 0);

    // Formato 2: lon,lat (algunas APIs usan este orden)
    console.log('\nFormato: lon,lat');
    resp = await fetch(`${RADAR_BASE_URL}/context?coordinates=${lon},${lat}`, {
        headers: { 'Authorization': RADAR_SECRET_KEY }
    });
    data = await resp.json();
    console.log('Geofences:', data.geofences ? data.geofences.length : 0);
}

debugRadar().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});

