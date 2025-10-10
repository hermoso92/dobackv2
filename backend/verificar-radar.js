#!/usr/bin/env node
/**
 * 🔍 VERIFICADOR DE RADAR.COM
 * Script único para verificar que Radar.com está funcionando correctamente
 * 
 * Uso: node verificar-radar.js
 */

require('dotenv').config({ path: 'config.env' });
const fetch = require('node-fetch');

const RADAR_SECRET_KEY = process.env.RADAR_SECRET_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

// Coordenadas de los centros de las geocercas configuradas
const PRUEBAS = [
    { nombre: 'Parque Las Rozas', lat: 40.5202177500439, lon: -3.8841334864808306, esperado: 'parque' },
    { nombre: 'Parque Alcobendas', lat: 40.53553949812811, lon: -3.618328905581324, esperado: 'parque' },
    { nombre: 'Fuera de geocercas', lat: 40.4153, lon: -3.7074, esperado: null }
];

async function verificarRadar() {
    console.log('\n🔍 VERIFICACIÓN DE RADAR.COM\n');

    // 1. Verificar API Key
    if (!RADAR_SECRET_KEY) {
        console.error('❌ RADAR_SECRET_KEY no configurada en config.env');
        return false;
    }
    console.log('✅ API Key configurada');

    // 2. Obtener geocercas
    console.log('\n📍 Geocercas configuradas:');
    try {
        const resp = await fetch(`${RADAR_BASE_URL}/geofences`, {
            headers: { 'Authorization': RADAR_SECRET_KEY }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        const data = await resp.json();
        const geofences = data.geofences || [];
        
        if (geofences.length === 0) {
            console.warn('⚠️  No hay geocercas configuradas');
            return false;
        }

        const porTag = {};
        geofences.forEach(g => {
            const tag = g.tag || 'sin-tag';
            porTag[tag] = (porTag[tag] || 0) + 1;
        });

        Object.entries(porTag).forEach(([tag, count]) => {
            console.log(`   • ${tag}: ${count}`);
        });

    } catch (error) {
        console.error('❌ Error obteniendo geocercas:', error.message);
        return false;
    }

    // 3. Probar Context API
    console.log('\n🧪 Probando Context API:');
    let exitosos = 0;
    
    for (const prueba of PRUEBAS) {
        try {
            const resp = await fetch(
                `${RADAR_BASE_URL}/context?coordinates=${prueba.lat},${prueba.lon}`,
                { headers: { 'Authorization': RADAR_SECRET_KEY } }
            );
            
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            const geofences = data?.context?.geofences || [];

            if (prueba.esperado === null) {
                if (geofences.length === 0) {
                    console.log(`   ✅ ${prueba.nombre} → Fuera (correcto)`);
                    exitosos++;
                } else {
                    console.log(`   ❌ ${prueba.nombre} → Dentro (incorrecto)`);
                }
            } else {
                if (geofences.length > 0 && geofences[0].tag === prueba.esperado) {
                    console.log(`   ✅ ${prueba.nombre} → Dentro (correcto)`);
                    exitosos++;
                } else {
                    console.log(`   ❌ ${prueba.nombre} → No detectado`);
                }
            }
        } catch (error) {
            console.error(`   ❌ ${prueba.nombre} → Error: ${error.message}`);
        }
    }

    // Resumen
    console.log(`\n📊 Resultado: ${exitosos}/${PRUEBAS.length} tests pasaron`);
    
    if (exitosos === PRUEBAS.length) {
        console.log('✅ Radar.com está funcionando correctamente\n');
        return true;
    } else {
        console.error('⚠️  Algunos tests fallaron\n');
        return false;
    }
}

verificarRadar()
    .then(exito => process.exit(exito ? 0 : 1))
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

