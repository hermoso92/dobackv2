/**
 * 🧪 DEBUG Roads API
 * 
 * Test detallado para diagnosticar problemas con Roads API
 */

const https = require('https');

const GOOGLE_MAPS_API_KEY = 'AIzaSyCVVP_Qq-05sob_vPGWagkldD_bgVaxHiU';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function print(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function testRoadsAPI() {
    print('\n' + colors.cyan + '═'.repeat(80) + colors.reset);
    print(colors.cyan + colors.bright + '🗺️  DEBUG ROADS API' + colors.reset);
    print(colors.cyan + '═'.repeat(80) + colors.reset + '\n');
    
    print(colors.bright + 'API Key: ' + colors.reset + GOOGLE_MAPS_API_KEY.substring(0, 20) + '...\n');
    
    // Test 1: Snap to Roads (básico)
    print(colors.blue + '1️⃣  Test Snap to Roads (básico)' + colors.reset);
    print(colors.blue + '─'.repeat(80) + colors.reset);
    
    try {
        const path = '40.4168,-3.7038|40.4170,-3.7040';
        const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&interpolate=false&key=${GOOGLE_MAPS_API_KEY}`;
        
        print(colors.yellow + 'URL: ' + url.substring(0, 100) + '...' + colors.reset);
        
        const response = await makeRequest(url);
        
        print(colors.yellow + 'Status: ' + response.status + colors.reset);
        print(colors.yellow + 'Response: ' + JSON.stringify(response.data, null, 2) + colors.reset);
        
        if (response.data.snappedPoints && response.data.snappedPoints.length > 0) {
            print(colors.green + '\n✅ Roads API funcionando!' + colors.reset);
            print(colors.green + '   Puntos ajustados: ' + response.data.snappedPoints.length + colors.reset);
            
            const point = response.data.snappedPoints[0];
            print(colors.green + '   Ejemplo: ' + point.location.latitude + ', ' + point.location.longitude + colors.reset);
        } else {
            print(colors.red + '\n❌ Roads API: Respuesta vacía' + colors.reset);
            
            if (response.data.error) {
                print(colors.red + '   Error: ' + response.data.error.message + colors.reset);
                print(colors.red + '   Status: ' + response.data.error.status + colors.reset);
            }
        }
    } catch (error) {
        print(colors.red + '\n❌ Error: ' + error.message + colors.reset);
    }
    
    // Test 2: Snap to Roads (con más puntos)
    print('\n' + colors.blue + '2️⃣  Test Snap to Roads (ruta completa)' + colors.reset);
    print(colors.blue + '─'.repeat(80) + colors.reset);
    
    try {
        const path = '40.7127,-74.0059|40.7128,-74.0060|40.7129,-74.0061|40.7130,-74.0062';
        const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&interpolate=true&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await makeRequest(url);
        
        if (response.data.snappedPoints && response.data.snappedPoints.length > 0) {
            print(colors.green + '✅ Snap to Roads con interpolación' + colors.reset);
            print(colors.green + '   Puntos ajustados: ' + response.data.snappedPoints.length + colors.reset);
        } else {
            print(colors.yellow + '⚠️  Sin resultados para esta ruta' + colors.reset);
        }
    } catch (error) {
        print(colors.red + '❌ Error: ' + error.message + colors.reset);
    }
    
    // Test 3: Speed Limits
    print('\n' + colors.blue + '3️⃣  Test Speed Limits' + colors.reset);
    print(colors.blue + '─'.repeat(80) + colors.reset);
    
    try {
        // Primero necesitamos un placeId válido
        const path = '40.7127,-74.0059|40.7128,-74.0060';
        const snapUrl = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const snapResponse = await makeRequest(snapUrl);
        
        if (snapResponse.data.snappedPoints && snapResponse.data.snappedPoints.length > 0) {
            const placeId = snapResponse.data.snappedPoints[0].placeId;
            
            const speedUrl = `https://roads.googleapis.com/v1/speedLimits?placeId=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
            const speedResponse = await makeRequest(speedUrl);
            
            if (speedResponse.data.speedLimits && speedResponse.data.speedLimits.length > 0) {
                print(colors.green + '✅ Speed Limits funcionando' + colors.reset);
                print(colors.green + '   Límite: ' + speedResponse.data.speedLimits[0].speedLimit + ' km/h' + colors.reset);
            } else {
                print(colors.yellow + '⚠️  Sin datos de velocidad para este lugar' + colors.reset);
            }
        } else {
            print(colors.yellow + '⚠️  No se pudo obtener placeId' + colors.reset);
        }
    } catch (error) {
        print(colors.red + '❌ Error: ' + error.message + colors.reset);
    }
    
    // Resumen
    print('\n' + colors.cyan + '═'.repeat(80) + colors.reset);
    print(colors.bright + '\n📋 DIAGNÓSTICO:' + colors.reset + '\n');
    
    print(colors.yellow + 'Si ves errores arriba, posibles causas:' + colors.reset);
    print(colors.yellow + '1. Roads API no está habilitada en Google Cloud Console' + colors.reset);
    print(colors.yellow + '2. La API Key tiene restricciones que bloquean Roads API' + colors.reset);
    print(colors.yellow + '3. Los puntos de prueba no están en una carretera válida' + colors.reset);
    print(colors.yellow + '4. La API Key no tiene permisos para Roads API' + colors.reset);
    
    print('\n' + colors.bright + '🔧 SOLUCIONES:' + colors.reset + '\n');
    print('1. Ir a: https://console.cloud.google.com/apis/library');
    print('2. Buscar "Roads API" y verificar que esté ENABLED');
    print('3. Ir a: https://console.cloud.google.com/apis/credentials');
    print('4. Editar tu API Key y en "API restrictions" asegurar que Roads API esté permitida');
    print('5. Guardar cambios y esperar 1-2 minutos\n');
    
    print(colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

testRoadsAPI().catch(error => {
    console.error(colors.red + '\n❌ Error fatal: ' + error.message + colors.reset + '\n');
    process.exit(1);
});

