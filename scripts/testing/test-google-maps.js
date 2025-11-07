/**
 * 🧪 Test Google Maps Platform Integration
 * 
 * Script para verificar que todos los servicios de Google Maps estén funcionando
 * 
 * Uso: node test-google-maps.js
 */

const https = require('https');
const readline = require('readline');

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// API Key desde variables de entorno
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCVVP_Qq-05sob_vPGWagkldD_bgVaxHiU';

console.log('\n' + colors.cyan + colors.bright + '🗺️  TESTING GOOGLE MAPS PLATFORM INTEGRATION' + colors.reset);
console.log(colors.cyan + '='.repeat(70) + colors.reset + '\n');

// Coordenadas de prueba (Madrid - Plaza Mayor)
const TEST_LAT = 40.4168;
const TEST_LNG = -3.7038;

// ===========================
// UTILIDADES
// ===========================

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

function printSuccess(message) {
    console.log(colors.green + '✅ ' + message + colors.reset);
}

function printError(message) {
    console.log(colors.red + '❌ ' + message + colors.reset);
}

function printInfo(message) {
    console.log(colors.blue + 'ℹ️  ' + message + colors.reset);
}

function printWarning(message) {
    console.log(colors.yellow + '⚠️  ' + message + colors.reset);
}

// ===========================
// TESTS
// ===========================

async function testGeocodingAPI() {
    console.log('\n' + colors.bright + '1️⃣  Testing Geocoding API' + colors.reset);
    console.log(colors.cyan + '-'.repeat(70) + colors.reset);
    
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${TEST_LAT},${TEST_LNG}&key=${API_KEY}&language=es`;
        
        const response = await makeRequest(url);
        
        if (response.status === 'OK' && response.results && response.results.length > 0) {
            const result = response.results[0];
            printSuccess('Geocoding API funcionando correctamente');
            printInfo(`Dirección: ${result.formatted_address}`);
            
            const street = result.address_components.find(c => c.types.includes('route'));
            if (street) {
                printInfo(`Calle: ${street.long_name}`);
            }
            
            return true;
        } else {
            printError(`Geocoding API error: ${response.status}`);
            if (response.error_message) {
                printError(`Mensaje: ${response.error_message}`);
            }
            return false;
        }
    } catch (error) {
        printError(`Error al probar Geocoding API: ${error.message}`);
        return false;
    }
}

async function testRoutesAPI() {
    console.log('\n' + colors.bright + '2️⃣  Testing Routes API' + colors.reset);
    console.log(colors.cyan + '-'.repeat(70) + colors.reset);
    
    try {
        const body = JSON.stringify({
            origin: {
                location: {
                    latLng: {
                        latitude: 40.4168,
                        longitude: -3.7038
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: 40.4200,
                        longitude: -3.7000
                    }
                }
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_UNAWARE',
            languageCode: 'es',
            units: 'METRIC'
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
            },
            body
        };
        
        const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        
        const response = await makeRequest(url, options);
        
        if (response.routes && response.routes.length > 0) {
            const route = response.routes[0];
            printSuccess('Routes API funcionando correctamente');
            printInfo(`Distancia: ${(route.distanceMeters / 1000).toFixed(2)} km`);
            printInfo(`Duración: ${route.duration}`);
            return true;
        } else {
            printError('Routes API: No se encontraron rutas');
            return false;
        }
    } catch (error) {
        printError(`Error al probar Routes API: ${error.message}`);
        return false;
    }
}

async function testRoadsAPI() {
    console.log('\n' + colors.bright + '3️⃣  Testing Roads API' + colors.reset);
    console.log(colors.cyan + '-'.repeat(70) + colors.reset);
    
    try {
        const path = `${TEST_LAT},${TEST_LNG}|40.4170,-3.7040`;
        const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&interpolate=false&key=${API_KEY}`;
        
        const response = await makeRequest(url);
        
        if (response.snappedPoints && response.snappedPoints.length > 0) {
            printSuccess('Roads API funcionando correctamente');
            printInfo(`Puntos ajustados: ${response.snappedPoints.length}`);
            return true;
        } else {
            printError('Roads API: No se pudieron ajustar los puntos');
            return false;
        }
    } catch (error) {
        printError(`Error al probar Roads API: ${error.message}`);
        return false;
    }
}

async function testElevationAPI() {
    console.log('\n' + colors.bright + '4️⃣  Testing Elevation API' + colors.reset);
    console.log(colors.cyan + '-'.repeat(70) + colors.reset);
    
    try {
        const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${TEST_LAT},${TEST_LNG}&key=${API_KEY}`;
        
        const response = await makeRequest(url);
        
        if (response.status === 'OK' && response.results && response.results.length > 0) {
            const result = response.results[0];
            printSuccess('Elevation API funcionando correctamente');
            printInfo(`Elevación: ${result.elevation.toFixed(1)} metros`);
            printInfo(`Resolución: ${result.resolution.toFixed(1)} metros`);
            return true;
        } else {
            printError(`Elevation API error: ${response.status}`);
            return false;
        }
    } catch (error) {
        printError(`Error al probar Elevation API: ${error.message}`);
        return false;
    }
}

async function testPlacesAPI() {
    console.log('\n' + colors.bright + '5️⃣  Testing Places API (New)' + colors.reset);
    console.log(colors.cyan + '-'.repeat(70) + colors.reset);
    
    try {
        const body = JSON.stringify({
            locationRestriction: {
                circle: {
                    center: {
                        latitude: TEST_LAT,
                        longitude: TEST_LNG
                    },
                    radius: 1000
                }
            },
            includedTypes: ['restaurant'],
            maxResultCount: 5,
            languageCode: 'es'
        });
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress'
            },
            body
        };
        
        const url = 'https://places.googleapis.com/v1/places:searchNearby';
        
        const response = await makeRequest(url, options);
        
        if (response.places && response.places.length > 0) {
            printSuccess('Places API funcionando correctamente');
            printInfo(`Lugares encontrados: ${response.places.length}`);
            if (response.places[0].displayName) {
                printInfo(`Ejemplo: ${response.places[0].displayName.text}`);
            }
            return true;
        } else {
            printError('Places API: No se encontraron lugares');
            return false;
        }
    } catch (error) {
        printError(`Error al probar Places API: ${error.message}`);
        return false;
    }
}

// ===========================
// MAIN
// ===========================

async function runTests() {
    console.log(colors.bright + 'API Key:' + colors.reset + ' ' + API_KEY.substring(0, 20) + '...\n');
    
    const results = {
        geocoding: false,
        routes: false,
        roads: false,
        elevation: false,
        places: false,
    };
    
    // Ejecutar tests secuencialmente
    results.geocoding = await testGeocodingAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre tests
    
    results.routes = await testRoutesAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.roads = await testRoadsAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.elevation = await testElevationAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.places = await testPlacesAPI();
    
    // Resumen final
    console.log('\n' + colors.cyan + '='.repeat(70) + colors.reset);
    console.log(colors.bright + '\n📊 RESUMEN DE TESTS\n' + colors.reset);
    
    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r).length;
    
    console.log(`${results.geocoding ? colors.green + '✅' : colors.red + '❌'} Geocoding API${colors.reset}`);
    console.log(`${results.routes ? colors.green + '✅' : colors.red + '❌'} Routes API${colors.reset}`);
    console.log(`${results.roads ? colors.green + '✅' : colors.red + '❌'} Roads API${colors.reset}`);
    console.log(`${results.elevation ? colors.green + '✅' : colors.red + '❌'} Elevation API${colors.reset}`);
    console.log(`${results.places ? colors.green + '✅' : colors.red + '❌'} Places API${colors.reset}`);
    
    console.log('\n' + colors.cyan + '-'.repeat(70) + colors.reset);
    
    if (passed === total) {
        console.log(colors.green + colors.bright + `\n🎉 ¡TODOS LOS TESTS PASARON! (${passed}/${total})` + colors.reset);
        console.log(colors.green + '\n✅ Google Maps Platform está completamente integrado y funcional\n' + colors.reset);
    } else {
        console.log(colors.yellow + colors.bright + `\n⚠️  ${passed}/${total} tests pasaron` + colors.reset);
        console.log(colors.yellow + '\nAlgunas APIs pueden no estar habilitadas en Google Cloud Console.' + colors.reset);
        console.log(colors.yellow + 'Visita: https://console.cloud.google.com/apis/library\n' + colors.reset);
    }
    
    console.log(colors.cyan + '='.repeat(70) + colors.reset + '\n');
    
    // Instrucciones adicionales
    if (passed < total) {
        console.log(colors.bright + '📋 PRÓXIMOS PASOS:\n' + colors.reset);
        console.log('1. Ir a Google Cloud Console: https://console.cloud.google.com/');
        console.log('2. Seleccionar tu proyecto');
        console.log('3. Ir a "APIs & Services" > "Library"');
        console.log('4. Habilitar las siguientes APIs:');
        
        if (!results.geocoding) console.log('   - Geocoding API');
        if (!results.routes) console.log('   - Routes API');
        if (!results.roads) console.log('   - Roads API');
        if (!results.elevation) console.log('   - Elevation API');
        if (!results.places) console.log('   - Places API (New)');
        
        console.log('\n5. Ejecutar de nuevo: node test-google-maps.js\n');
    }
}

// Ejecutar tests
runTests().catch(error => {
    console.error(colors.red + '\n❌ Error fatal: ' + error.message + colors.reset + '\n');
    process.exit(1);
});

