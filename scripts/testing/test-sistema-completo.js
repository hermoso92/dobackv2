/**
 * 🧪 TEST SISTEMA COMPLETO - DobackSoft + Google Maps
 * 
 * Verifica el flujo completo end-to-end
 * 
 * Uso: node scripts/testing/test-sistema-completo.js
 */

const https = require('https');
const http = require('http');

// ===========================
// CONFIGURACIÓN
// ===========================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9998';
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCVVP_Qq-05sob_vPGWagkldD_bgVaxHiU';

// Colores
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// ===========================
// UTILIDADES
// ===========================

function printHeader(text) {
    console.log('\n' + colors.cyan + colors.bright + '═'.repeat(80) + colors.reset);
    console.log(colors.cyan + colors.bright + text + colors.reset);
    console.log(colors.cyan + colors.bright + '═'.repeat(80) + colors.reset + '\n');
}

function printSection(text) {
    console.log('\n' + colors.blue + colors.bright + '▶ ' + text + colors.reset);
    console.log(colors.blue + '─'.repeat(80) + colors.reset);
}

function printSuccess(message, details) {
    console.log(colors.green + '✅ ' + message + colors.reset);
    if (details) console.log(colors.green + '   ' + details + colors.reset);
}

function printError(message, details) {
    console.log(colors.red + '❌ ' + message + colors.reset);
    if (details) console.log(colors.red + '   ' + details + colors.reset);
}

function printWarning(message, details) {
    console.log(colors.yellow + '⚠️  ' + message + colors.reset);
    if (details) console.log(colors.yellow + '   ' + details + colors.reset);
}

function printInfo(message, details) {
    console.log(colors.blue + 'ℹ️  ' + message + colors.reset);
    if (details) console.log(colors.blue + '   ' + details + colors.reset);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(url, options, (res) => {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================
// TESTS
// ===========================

async function testGoogleMapsAPIs() {
    printSection('1️⃣  Testing Google Maps Platform APIs');
    
    const results = {
        geocoding: false,
        routes: false,
        roads: false,
        elevation: false,
        places: false,
    };
    
    // Test Geocoding
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=40.4168,-3.7038&key=${GOOGLE_MAPS_API_KEY}&language=es`;
        const response = await makeRequest(url);
        
        if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
            results.geocoding = true;
            printSuccess('Geocoding API', response.data.results[0].formatted_address);
        } else {
            printError('Geocoding API', response.data.status);
        }
    } catch (error) {
        printError('Geocoding API', error.message);
    }
    
    // Test Routes
    try {
        const body = JSON.stringify({
            origin: {
                location: {
                    latLng: { latitude: 40.4168, longitude: -3.7038 }
                }
            },
            destination: {
                location: {
                    latLng: { latitude: 40.4200, longitude: -3.7000 }
                }
            },
            travelMode: 'DRIVE',
            languageCode: 'es',
            units: 'METRIC'
        });
        
        const response = await makeRequest('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
            },
            body
        });
        
        if (response.data.routes && response.data.routes.length > 0) {
            results.routes = true;
            const route = response.data.routes[0];
            printSuccess('Routes API', `${(route.distanceMeters / 1000).toFixed(2)} km`);
        } else {
            printError('Routes API', 'No routes found');
        }
    } catch (error) {
        printError('Routes API', error.message);
    }
    
    // Test Roads
    try {
        const url = `https://roads.googleapis.com/v1/snapToRoads?path=40.4168,-3.7038|40.4170,-3.7040&interpolate=false&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await makeRequest(url);
        
        if (response.data.snappedPoints && response.data.snappedPoints.length > 0) {
            results.roads = true;
            printSuccess('Roads API', `${response.data.snappedPoints.length} puntos`);
        } else {
            printWarning('Roads API', 'Requiere habilitar en Google Cloud Console');
        }
    } catch (error) {
        printWarning('Roads API', error.message);
    }
    
    // Test Elevation
    try {
        const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=40.4168,-3.7038&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await makeRequest(url);
        
        if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
            results.elevation = true;
            printSuccess('Elevation API', `${response.data.results[0].elevation.toFixed(1)} m`);
        } else {
            printError('Elevation API', response.data.status);
        }
    } catch (error) {
        printError('Elevation API', error.message);
    }
    
    // Test Places
    try {
        const body = JSON.stringify({
            locationRestriction: {
                circle: {
                    center: { latitude: 40.4168, longitude: -3.7038 },
                    radius: 1000
                }
            },
            includedTypes: ['restaurant'],
            maxResultCount: 5,
            languageCode: 'es'
        });
        
        const response = await makeRequest('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.displayName'
            },
            body
        });
        
        if (response.data.places && response.data.places.length > 0) {
            results.places = true;
            printSuccess('Places API', `${response.data.places.length} lugares`);
        } else {
            printError('Places API', 'No places found');
        }
    } catch (error) {
        printError('Places API', error.message);
    }
    
    return results;
}

async function testBackend() {
    printSection('2️⃣  Testing Backend');
    
    try {
        const response = await makeRequest(`${API_BASE_URL}/health`);
        
        if (response.status === 200) {
            printSuccess('Backend conectado', API_BASE_URL);
            return true;
        } else {
            printError('Backend error', `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        printError('Backend no disponible', error.message);
        printInfo('Verifica que el backend esté en puerto 9998');
        return false;
    }
}

async function testAuth() {
    printSection('3️⃣  Testing Authentication');
    
    try {
        const body = JSON.stringify({
            email: 'admin@dobacksoft.com',
            password: 'admin123'
        });
        
        const response = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });
        
        if (response.data.token) {
            printSuccess('Login exitoso');
            printInfo('Usuario', response.data.user.email);
            printInfo('Rol', response.data.user.role);
            return {
                token: response.data.token,
                user: response.data.user
            };
        } else {
            printError('Login falló');
            return null;
        }
    } catch (error) {
        printError('Error en autenticación', error.message);
        return null;
    }
}

async function testDashboard(token, organizationId) {
    printSection('4️⃣  Testing Dashboard & KPIs');
    
    try {
        const url = `${API_BASE_URL}/api/dashboard/metrics`;
        const response = await makeRequest(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Organization-ID': organizationId
            }
        });
        
        if (response.data) {
            printSuccess('Dashboard Metrics');
            printInfo('Disponibilidad', `${response.data.disponibilidad?.toFixed(1) || 0}%`);
            printInfo('KM totales', `${response.data.kmTotales?.toFixed(1) || 0} km`);
            printInfo('Incidencias', `${response.data.incidenciasCriticas || 0}`);
            return true;
        } else {
            printWarning('Sin datos');
            return false;
        }
    } catch (error) {
        printError('Error en dashboard', error.message);
        return false;
    }
}

async function testStability(token, organizationId) {
    printSection('5️⃣  Testing Stability');
    
    try {
        const url = `${API_BASE_URL}/api/stability/sessions`;
        const response = await makeRequest(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Organization-ID': organizationId
            }
        });
        
        if (response.data && response.data.length > 0) {
            printSuccess('Sesiones', `${response.data.length} sesiones`);
            printInfo('Última', response.data[0].vehicle_name || 'N/A');
            return response.data[0];
        } else {
            printWarning('Sin sesiones');
            return null;
        }
    } catch (error) {
        printError('Error en estabilidad', error.message);
        return null;
    }
}

async function testEvents(token, organizationId, sessionId) {
    printSection('6️⃣  Testing Events & Geocoding');
    
    if (!sessionId) {
        printWarning('No hay sesión para probar eventos');
        return false;
    }
    
    try {
        const url = `${API_BASE_URL}/api/stability/events?sessionId=${sessionId}`;
        const response = await makeRequest(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Organization-ID': organizationId
            }
        });
        
        if (response.data && response.data.length > 0) {
            printSuccess('Eventos', `${response.data.length} eventos`);
            
            const event = response.data[0];
            printInfo('Tipo', event.tipo_evento);
            printInfo('Coordenadas', `${event.lat_inicio?.toFixed(6)}, ${event.lon_inicio?.toFixed(6)}`);
            
            // Test geocoding
            if (event.lat_inicio && event.lon_inicio) {
                try {
                    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${event.lat_inicio},${event.lon_inicio}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
                    const geocodeResponse = await makeRequest(geocodeUrl);
                    
                    if (geocodeResponse.data.status === 'OK') {
                        printSuccess('Geocoding', geocodeResponse.data.results[0].formatted_address);
                    }
                } catch (error) {
                    printWarning('Geocoding', error.message);
                }
            }
            
            return true;
        } else {
            printWarning('Sin eventos');
            return false;
        }
    } catch (error) {
        printError('Error en eventos', error.message);
        return false;
    }
}

function printFinalSummary(results) {
    printHeader('📊 RESUMEN FINAL');
    
    console.log(colors.bright + '\n🗺️  Google Maps:' + colors.reset);
    console.log(`   ${results.googleMaps.geocoding ? '✅' : '❌'} Geocoding`);
    console.log(`   ${results.googleMaps.routes ? '✅' : '❌'} Routes`);
    console.log(`   ${results.googleMaps.roads ? '✅' : '⚠️ '} Roads ${!results.googleMaps.roads ? '(opcional)' : ''}`);
    console.log(`   ${results.googleMaps.elevation ? '✅' : '❌'} Elevation`);
    console.log(`   ${results.googleMaps.places ? '✅' : '❌'} Places`);
    
    console.log(colors.bright + '\n🔧 DobackSoft:' + colors.reset);
    console.log(`   ${results.backend ? '✅' : '❌'} Backend`);
    console.log(`   ${results.auth ? '✅' : '❌'} Authentication`);
    console.log(`   ${results.dashboard ? '✅' : '❌'} Dashboard`);
    console.log(`   ${results.stability ? '✅' : '❌'} Stability`);
    console.log(`   ${results.events ? '✅' : '❌'} Events`);
    
    const googleScore = Object.values(results.googleMaps).filter(v => v === true).length;
    const systemScore = [
        results.backend,
        results.auth,
        results.dashboard,
        results.stability,
        results.events
    ].filter(v => v === true).length;
    
    console.log('\n' + colors.cyan + '─'.repeat(80) + colors.reset);
    
    if (googleScore >= 4 && systemScore >= 4) {
        console.log(colors.green + colors.bright + '\n🎉 ¡SISTEMA FUNCIONAL!' + colors.reset);
        console.log(colors.green + `Google Maps: ${googleScore}/5` + colors.reset);
        console.log(colors.green + `DobackSoft: ${systemScore}/5` + colors.reset);
    } else {
        console.log(colors.yellow + colors.bright + '\n⚠️  SISTEMA PARCIAL' + colors.reset);
        console.log(colors.yellow + `Google Maps: ${googleScore}/5` + colors.reset);
        console.log(colors.yellow + `DobackSoft: ${systemScore}/5` + colors.reset);
    }
    
    console.log('\n' + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

// ===========================
// MAIN
// ===========================

async function main() {
    printHeader('🧪 TEST SISTEMA COMPLETO - DobackSoft + Google Maps');
    
    const results = {
        googleMaps: {},
        backend: false,
        auth: false,
        dashboard: false,
        stability: false,
        events: false,
    };
    
    try {
        // 1. Google Maps
        results.googleMaps = await testGoogleMapsAPIs();
        await sleep(1000);
        
        // 2. Backend
        results.backend = await testBackend();
        if (!results.backend) {
            printFinalSummary(results);
            return;
        }
        await sleep(1000);
        
        // 3. Auth
        const authData = await testAuth();
        results.auth = authData !== null;
        if (!authData) {
            printFinalSummary(results);
            return;
        }
        await sleep(1000);
        
        // 4. Dashboard
        results.dashboard = await testDashboard(authData.token, authData.user.organizationId);
        await sleep(1000);
        
        // 5. Stability
        const session = await testStability(authData.token, authData.user.organizationId);
        results.stability = session !== null;
        await sleep(1000);
        
        // 6. Events
        results.events = await testEvents(authData.token, authData.user.organizationId, session?.id);
        
        // Resumen
        printFinalSummary(results);
        
    } catch (error) {
        printError('Error fatal', error.message);
        printFinalSummary(results);
    }
}

// Ejecutar
main().catch(error => {
    console.error(colors.red + '\n❌ Error: ' + error.message + colors.reset + '\n');
    process.exit(1);
});

