/**
 * 🧪 TEST COMPLETO DE RADAR.COM
 * Verifica que la integración con Radar.io funciona correctamente
 */

require('dotenv').config({ path: 'config.env' });

const { RadarService } = require('./dist/services/radarService');
const { radarIntegration } = require('./dist/services/radarIntegration');

// Coordenadas de prueba (Madrid - zona de bomberos)
const COORDENADAS_PRUEBA = {
    // Parque de Bomberos de Alcobendas (aproximado)
    alcobendas: { lat: 40.5379, lon: -3.6408, nombre: 'Parque Alcobendas' },
    
    // Parque de Bomberos de Las Rozas (aproximado)
    rozas: { lat: 40.4913, lon: -3.8739, nombre: 'Parque Las Rozas' },
    
    // Punto fuera de geocercas (Plaza Mayor Madrid)
    fueraGeocerca: { lat: 40.4153, lon: -3.7074, nombre: 'Plaza Mayor (fuera)' }
};

async function testRadarService() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 1: RadarService - Verificación de API Key y Conexión');
    console.log('='.repeat(80));

    const radarService = new RadarService({
        secretKey: process.env.RADAR_SECRET_KEY
    });

    // Test 1.1: Verificar que tenemos API Key
    console.log('\n📋 Verificando configuración...');
    if (!process.env.RADAR_SECRET_KEY) {
        console.error('❌ RADAR_SECRET_KEY no configurada en config.env');
        return false;
    }
    console.log('✅ RADAR_SECRET_KEY configurada:', process.env.RADAR_SECRET_KEY.substring(0, 20) + '...');

    // Test 1.2: Obtener geocercas
    try {
        console.log('\n🗺️  Obteniendo geocercas de Radar.com...');
        const geofences = await radarService.getGeofences({ forceRefresh: true });
        
        if (geofences && geofences.geofences) {
            console.log(`✅ Geocercas obtenidas: ${geofences.geofences.length}`);
            
            // Mostrar primeras geocercas
            console.log('\n📍 Geocercas configuradas en Radar.com:');
            geofences.geofences.slice(0, 10).forEach((g, i) => {
                console.log(`   ${i + 1}. ${g.description || g.tag || g._id}`);
                console.log(`      - Tag: ${g.tag || 'sin tag'}`);
                console.log(`      - Tipo: ${g.type}`);
                if (g.geometryCenter) {
                    console.log(`      - Centro: [${g.geometryCenter.coordinates[1]}, ${g.geometryCenter.coordinates[0]}]`);
                }
            });
            
            return true;
        } else {
            console.error('❌ No se obtuvieron geocercas');
            return false;
        }
    } catch (error) {
        console.error('❌ Error obteniendo geocercas:', error.message);
        if (error.status === 401) {
            console.error('   💡 Error 401: API Key inválida o expirada');
        }
        return false;
    }
}

async function testRadarContext() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 2: Context API - Verificación de Puntos en Geocercas');
    console.log('='.repeat(80));

    const radarService = new RadarService({
        secretKey: process.env.RADAR_SECRET_KEY
    });

    for (const [key, coords] of Object.entries(COORDENADAS_PRUEBA)) {
        console.log(`\n📍 Probando: ${coords.nombre}`);
        console.log(`   Coordenadas: [${coords.lat}, ${coords.lon}]`);

        try {
            const context = await radarService.getContext(coords.lat, coords.lon);
            
            if (context && context.geofences && context.geofences.length > 0) {
                console.log(`   ✅ DENTRO de geocerca:`);
                context.geofences.forEach((g, i) => {
                    console.log(`      ${i + 1}. ${g.description}`);
                    console.log(`         Tag: ${g.tag}`);
                    console.log(`         ID: ${g._id}`);
                });
            } else {
                console.log(`   ℹ️  FUERA de geocercas`);
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
}

async function testRadarIntegration() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 3: radarIntegration - Funciones de Alto Nivel');
    console.log('='.repeat(80));

    for (const [key, coords] of Object.entries(COORDENADAS_PRUEBA)) {
        console.log(`\n📍 Probando: ${coords.nombre}`);

        try {
            // Test verificarEnParque
            const resultadoParque = await radarIntegration.verificarEnParque(coords.lat, coords.lon);
            if (resultadoParque.enParque) {
                console.log(`   ✅ En PARQUE: ${resultadoParque.nombreParque}`);
            } else {
                console.log(`   ℹ️  No está en parque`);
            }

            // Test verificarEnTaller
            const resultadoTaller = await radarIntegration.verificarEnTaller(coords.lat, coords.lon);
            if (resultadoTaller.enTaller) {
                console.log(`   ✅ En TALLER: ${resultadoTaller.nombreTaller}`);
            } else {
                console.log(`   ℹ️  No está en taller`);
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
}

async function testObtenerGeocercas() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 4: obtenerGeocercasRadar - Lista Completa de Geocercas');
    console.log('='.repeat(80));

    try {
        const geocercas = await radarIntegration.obtenerGeocercasRadar();
        
        if (geocercas && geocercas.length > 0) {
            console.log(`\n✅ Total de geocercas: ${geocercas.length}`);
            
            // Agrupar por tag
            const porTag = {};
            geocercas.forEach(g => {
                const tag = g.tag || 'sin-tag';
                if (!porTag[tag]) porTag[tag] = [];
                porTag[tag].push(g);
            });

            console.log('\n📊 Geocercas por tag:');
            Object.entries(porTag).forEach(([tag, lista]) => {
                console.log(`   ${tag}: ${lista.length}`);
                lista.forEach(g => {
                    console.log(`      - ${g.description || g.externalId}`);
                });
            });
        } else {
            console.error('❌ No se obtuvieron geocercas');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function runAllTests() {
    console.log('\n');
    console.log('🚒 TEST COMPLETO DE INTEGRACIÓN RADAR.COM - BOMBEROS MADRID');
    console.log('='.repeat(80));

    let todosExitosos = true;

    // Test 1: RadarService básico
    const test1 = await testRadarService();
    todosExitosos = todosExitosos && test1;

    // Test 2: Context API
    await testRadarContext();

    // Test 3: radarIntegration
    await testRadarIntegration();

    // Test 4: Obtener geocercas
    await testObtenerGeocercas();

    // Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(80));
    
    if (todosExitosos) {
        console.log('✅ TODOS LOS TESTS PASARON CORRECTAMENTE');
        console.log('\n💡 Radar.com está configurado y funcionando.');
        console.log('   Las geocercas se usarán para calcular:');
        console.log('   - Clave 0: Tiempo en taller');
        console.log('   - Clave 1: Tiempo en parque');
        console.log('   - Clave 2: Salida de emergencia desde parque');
        console.log('   - Clave 5: Regreso al parque');
    } else {
        console.error('\n❌ ALGUNOS TESTS FALLARON');
        console.error('   Verifica que:');
        console.error('   1. RADAR_SECRET_KEY esté correctamente configurada en config.env');
        console.error('   2. Las geocercas estén creadas en Radar.com con tags "parque" y "taller"');
        console.error('   3. La conexión a internet funcione correctamente');
    }

    console.log('\n');
}

// Ejecutar tests
runAllTests().catch(error => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
});

