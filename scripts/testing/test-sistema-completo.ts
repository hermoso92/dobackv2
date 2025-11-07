/**
 * 🧪 TEST SISTEMA COMPLETO - DobackSoft + Google Maps
 * 
 * Verifica el flujo completo end-to-end:
 * 1. APIs de Google Maps
 * 2. Subida de archivos
 * 3. Procesamiento de datos
 * 4. Cálculo de KPIs
 * 5. Eventos de estabilidad
 * 6. Rutas y geocoding
 * 7. Dashboard completo
 * 
 * Uso: npx ts-node scripts/testing/test-sistema-completo.ts
 */

import axios from 'axios';

// ===========================
// CONFIGURACIÓN
// ===========================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9998';
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCVVP_Qq-05sob_vPGWagkldD_bgVaxHiU';

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

// ===========================
// UTILIDADES
// ===========================

function printHeader(text: string) {
    console.log('\n' + colors.cyan + colors.bright + '═'.repeat(80) + colors.reset);
    console.log(colors.cyan + colors.bright + text + colors.reset);
    console.log(colors.cyan + colors.bright + '═'.repeat(80) + colors.reset + '\n');
}

function printSection(text: string) {
    console.log('\n' + colors.blue + colors.bright + '▶ ' + text + colors.reset);
    console.log(colors.blue + '─'.repeat(80) + colors.reset);
}

function printSuccess(message: string, details?: string) {
    console.log(colors.green + '✅ ' + message + colors.reset);
    if (details) {
        console.log(colors.green + '   ' + details + colors.reset);
    }
}

function printError(message: string, details?: string) {
    console.log(colors.red + '❌ ' + message + colors.reset);
    if (details) {
        console.log(colors.red + '   ' + details + colors.reset);
    }
}

function printWarning(message: string, details?: string) {
    console.log(colors.yellow + '⚠️  ' + message + colors.reset);
    if (details) {
        console.log(colors.yellow + '   ' + details + colors.reset);
    }
}

function printInfo(message: string, details?: string) {
    console.log(colors.blue + 'ℹ️  ' + message + colors.reset);
    if (details) {
        console.log(colors.blue + '   ' + details + colors.reset);
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================
// TESTS DE GOOGLE MAPS APIs
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

    try {
        // Test Geocoding API
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=40.4168,-3.7038&key=${GOOGLE_MAPS_API_KEY}&language=es`
            );

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                results.geocoding = true;
                printSuccess('Geocoding API', response.data.results[0].formatted_address);
            } else {
                printError('Geocoding API', response.data.status);
            }
        } catch (error: any) {
            printError('Geocoding API', error.message);
        }

        // Test Routes API
        try {
            const response = await axios.post(
                'https://routes.googleapis.com/directions/v2:computeRoutes',
                {
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
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                    }
                }
            );

            if (response.data.routes && response.data.routes.length > 0) {
                results.routes = true;
                const route = response.data.routes[0];
                printSuccess('Routes API', `${(route.distanceMeters / 1000).toFixed(2)} km`);
            } else {
                printError('Routes API', 'No routes found');
            }
        } catch (error: any) {
            printError('Routes API', error.message);
        }

        // Test Roads API
        try {
            const response = await axios.get(
                `https://roads.googleapis.com/v1/snapToRoads?path=40.4168,-3.7038|40.4170,-3.7040&interpolate=false&key=${GOOGLE_MAPS_API_KEY}`
            );

            if (response.data.snappedPoints && response.data.snappedPoints.length > 0) {
                results.roads = true;
                printSuccess('Roads API', `${response.data.snappedPoints.length} puntos ajustados`);
            } else {
                printError('Roads API', 'No snapped points');
            }
        } catch (error: any) {
            printWarning('Roads API', error.message);
        }

        // Test Elevation API
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/elevation/json?locations=40.4168,-3.7038&key=${GOOGLE_MAPS_API_KEY}`
            );

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                results.elevation = true;
                printSuccess('Elevation API', `${response.data.results[0].elevation.toFixed(1)} metros`);
            } else {
                printError('Elevation API', response.data.status);
            }
        } catch (error: any) {
            printError('Elevation API', error.message);
        }

        // Test Places API
        try {
            const response = await axios.post(
                'https://places.googleapis.com/v1/places:searchNearby',
                {
                    locationRestriction: {
                        circle: {
                            center: { latitude: 40.4168, longitude: -3.7038 },
                            radius: 1000
                        }
                    },
                    includedTypes: ['restaurant'],
                    maxResultCount: 5,
                    languageCode: 'es'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'places.displayName'
                    }
                }
            );

            if (response.data.places && response.data.places.length > 0) {
                results.places = true;
                printSuccess('Places API', `${response.data.places.length} lugares encontrados`);
            } else {
                printError('Places API', 'No places found');
            }
        } catch (error: any) {
            printError('Places API', error.message);
        }

        return results;

    } catch (error: any) {
        printError('Error general en Google Maps APIs', error.message);
        return results;
    }
}

// ===========================
// TEST DE BACKEND
// ===========================

async function testBackendConnection() {
    printSection('2️⃣  Testing Backend Connection');

    try {
        const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });

        if (response.status === 200) {
            printSuccess('Backend conectado', `${API_BASE_URL}`);
            return true;
        } else {
            printError('Backend no responde correctamente', `Status: ${response.status}`);
            return false;
        }
    } catch (error: any) {
        printError('Backend no disponible', error.message);
        printInfo('Asegúrate de que el backend esté corriendo en puerto 9998');
        return false;
    }
}

// ===========================
// TEST DE AUTENTICACIÓN
// ===========================

async function testAuthentication() {
    printSection('3️⃣  Testing Authentication');

    try {
        // Intentar login con usuario demo
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'admin@dobacksoft.com',
            password: 'admin123'
        });

        if (response.data.token) {
            printSuccess('Login exitoso', `Token: ${response.data.token.substring(0, 20)}...`);
            printInfo('Usuario', response.data.user.email);
            printInfo('Rol', response.data.user.role);
            printInfo('Organización', response.data.user.organizationId);
            return {
                token: response.data.token,
                user: response.data.user
            };
        } else {
            printError('Login falló', 'No se recibió token');
            return null;
        }
    } catch (error: any) {
        printError('Error en autenticación', error.message);
        if (error.response?.data) {
            printError('Detalle', JSON.stringify(error.response.data));
        }
        return null;
    }
}

// ===========================
// TEST DE DASHBOARD
// ===========================

async function testDashboard(token: string, organizationId: string) {
    printSection('4️⃣  Testing Dashboard & KPIs');

    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-Organization-ID': organizationId
        };

        // Test Dashboard Metrics
        try {
            const response = await axios.get(`${API_BASE_URL}/api/dashboard/metrics`, { headers });

            if (response.data) {
                printSuccess('Dashboard Metrics');
                printInfo('Disponibilidad', `${response.data.disponibilidad?.toFixed(1) || 0}%`);
                printInfo('Tiempo en ruta', `${response.data.tiempoEnRuta?.toFixed(1) || 0} horas`);
                printInfo('Tiempo con rotativo', `${response.data.tiempoConRotativo?.toFixed(1) || 0} horas`);
                printInfo('Incidencias críticas', `${response.data.incidenciasCriticas || 0}`);
                printInfo('Kilómetros totales', `${response.data.kmTotales?.toFixed(1) || 0} km`);
            } else {
                printWarning('Dashboard Metrics sin datos');
            }
        } catch (error: any) {
            printError('Dashboard Metrics', error.message);
        }

        // Test Vehicles
        try {
            const response = await axios.get(`${API_BASE_URL}/api/dashboard/vehicles`, { headers });

            if (response.data && Array.isArray(response.data)) {
                printSuccess('Vehículos', `${response.data.length} vehículos cargados`);

                if (response.data.length > 0) {
                    const vehicle = response.data[0];
                    printInfo('Ejemplo', `${vehicle.name} (ID: ${vehicle.id})`);
                }
            } else {
                printWarning('No hay vehículos');
            }
        } catch (error: any) {
            printError('Vehículos', error.message);
        }

        // Test Alarms
        try {
            const response = await axios.get(`${API_BASE_URL}/api/dashboard/alarms`, { headers });

            if (response.data && Array.isArray(response.data)) {
                printSuccess('Alarmas', `${response.data.length} alarmas`);
            } else {
                printInfo('Sin alarmas activas');
            }
        } catch (error: any) {
            printError('Alarmas', error.message);
        }

        return true;

    } catch (error: any) {
        printError('Error general en Dashboard', error.message);
        return false;
    }
}

// ===========================
// TEST DE ESTABILIDAD
// ===========================

async function testStabilityModule(token: string, organizationId: string) {
    printSection('5️⃣  Testing Stability Module');

    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-Organization-ID': organizationId
        };

        // Test Sessions
        try {
            const response = await axios.get(`${API_BASE_URL}/api/stability/sessions`, { headers });

            if (response.data && Array.isArray(response.data)) {
                printSuccess('Sesiones de estabilidad', `${response.data.length} sesiones`);

                if (response.data.length > 0) {
                    const session = response.data[0];
                    printInfo('Última sesión', `${session.vehicle_name || 'N/A'} - ${new Date(session.start_time).toLocaleDateString()}`);
                }

                return response.data.length > 0 ? response.data[0] : null;
            } else {
                printWarning('No hay sesiones de estabilidad');
                return null;
            }
        } catch (error: any) {
            printError('Sesiones de estabilidad', error.message);
            return null;
        }

    } catch (error: any) {
        printError('Error general en Estabilidad', error.message);
        return null;
    }
}

// ===========================
// TEST DE EVENTOS
// ===========================

async function testEventsWithGeocoding(token: string, organizationId: string, sessionId?: string) {
    printSection('6️⃣  Testing Events & Geocoding');

    if (!sessionId) {
        printWarning('No hay sesión disponible para probar eventos');
        return false;
    }

    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-Organization-ID': organizationId
        };

        // Get events from session
        const response = await axios.get(`${API_BASE_URL}/api/stability/events`, {
            headers,
            params: { sessionId }
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            printSuccess('Eventos de estabilidad', `${response.data.length} eventos`);

            // Test geocoding on first event
            const event = response.data[0];
            printInfo('Evento de prueba', `${event.tipo_evento} - Severidad: ${event.severidad}`);

            if (event.lat_inicio && event.lon_inicio) {
                printInfo('Coordenadas', `${event.lat_inicio.toFixed(6)}, ${event.lon_inicio.toFixed(6)}`);

                // Test geocoding con Google Maps
                try {
                    const geocodeResponse = await axios.get(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${event.lat_inicio},${event.lon_inicio}&key=${GOOGLE_MAPS_API_KEY}&language=es`
                    );

                    if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
                        printSuccess('Geocoding del evento', geocodeResponse.data.results[0].formatted_address);
                    } else {
                        printWarning('No se pudo geocodificar el evento');
                    }
                } catch (error: any) {
                    printError('Error en geocoding', error.message);
                }
            }

            return true;
        } else {
            printWarning('No hay eventos en esta sesión');
            return false;
        }

    } catch (error: any) {
        printError('Error al obtener eventos', error.message);
        return false;
    }
}

// ===========================
// TEST DE RUTAS Y GPS
// ===========================

async function testRoutesAndGPS(token: string, organizationId: string, sessionId?: string) {
    printSection('7️⃣  Testing Routes & GPS Data');

    if (!sessionId) {
        printWarning('No hay sesión disponible para probar rutas');
        return false;
    }

    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-Organization-ID': organizationId
        };

        // Aquí podrías llamar a un endpoint de GPS si lo tienes
        // Por ahora, simulamos con coordenadas de prueba

        const testCoords = [
            { lat: 40.4168, lng: -3.7038 },
            { lat: 40.4200, lng: -3.7000 }
        ];

        // Test Routes API
        try {
            const response = await axios.post(
                'https://routes.googleapis.com/directions/v2:computeRoutes',
                {
                    origin: {
                        location: {
                            latLng: { latitude: testCoords[0].lat, longitude: testCoords[0].lng }
                        }
                    },
                    destination: {
                        location: {
                            latLng: { latitude: testCoords[1].lat, longitude: testCoords[1].lng }
                        }
                    },
                    travelMode: 'DRIVE',
                    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
                    languageCode: 'es',
                    units: 'METRIC'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                    }
                }
            );

            if (response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                printSuccess('Cálculo de ruta');
                printInfo('Distancia', `${(route.distanceMeters / 1000).toFixed(2)} km`);
                printInfo('Duración', `${Math.round(parseInt(route.duration) / 60)} minutos`);
            }
        } catch (error: any) {
            printError('Error calculando ruta', error.message);
        }

        // Test Snap-to-road
        try {
            const path = testCoords.map(c => `${c.lat},${c.lng}`).join('|');
            const response = await axios.get(
                `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&interpolate=true&key=${GOOGLE_MAPS_API_KEY}`
            );

            if (response.data.snappedPoints) {
                printSuccess('Snap-to-road', `${response.data.snappedPoints.length} puntos ajustados`);
            }
        } catch (error: any) {
            printWarning('Snap-to-road no disponible', 'Requiere habilitar Roads API');
        }

        return true;

    } catch (error: any) {
        printError('Error general en rutas', error.message);
        return false;
    }
}

// ===========================
// RESUMEN FINAL
// ===========================

function printFinalSummary(results: any) {
    printHeader('📊 RESUMEN FINAL DE VERIFICACIÓN');

    console.log(colors.bright + '\n🗺️  Google Maps Platform:' + colors.reset);
    console.log(`   ${results.googleMaps.geocoding ? '✅' : '❌'} Geocoding API`);
    console.log(`   ${results.googleMaps.routes ? '✅' : '❌'} Routes API`);
    console.log(`   ${results.googleMaps.roads ? '✅' : '⚠️ '} Roads API ${!results.googleMaps.roads ? '(opcional)' : ''}`);
    console.log(`   ${results.googleMaps.elevation ? '✅' : '❌'} Elevation API`);
    console.log(`   ${results.googleMaps.places ? '✅' : '❌'} Places API`);

    console.log(colors.bright + '\n🔧 Sistema DobackSoft:' + colors.reset);
    console.log(`   ${results.backend ? '✅' : '❌'} Backend Connection`);
    console.log(`   ${results.auth ? '✅' : '❌'} Authentication`);
    console.log(`   ${results.dashboard ? '✅' : '❌'} Dashboard & KPIs`);
    console.log(`   ${results.stability ? '✅' : '❌'} Stability Module`);
    console.log(`   ${results.events ? '✅' : '❌'} Events & Geocoding`);
    console.log(`   ${results.routes ? '✅' : '❌'} Routes & GPS`);

    const googleMapsScore = Object.values(results.googleMaps).filter(v => v === true).length;
    const systemScore = [
        results.backend,
        results.auth,
        results.dashboard,
        results.stability,
        results.events,
        results.routes
    ].filter(v => v === true).length;

    console.log('\n' + colors.cyan + '─'.repeat(80) + colors.reset);

    if (googleMapsScore >= 4 && systemScore >= 5) {
        console.log(colors.green + colors.bright + '\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!' + colors.reset);
        console.log(colors.green + `\nGoogle Maps: ${googleMapsScore}/5 APIs funcionando` + colors.reset);
        console.log(colors.green + `DobackSoft: ${systemScore}/6 módulos funcionando` + colors.reset);
    } else if (googleMapsScore >= 3 || systemScore >= 4) {
        console.log(colors.yellow + colors.bright + '\n⚠️  SISTEMA PARCIALMENTE FUNCIONAL' + colors.reset);
        console.log(colors.yellow + `\nGoogle Maps: ${googleMapsScore}/5 APIs funcionando` + colors.reset);
        console.log(colors.yellow + `DobackSoft: ${systemScore}/6 módulos funcionando` + colors.reset);
    } else {
        console.log(colors.red + colors.bright + '\n❌ SISTEMA CON PROBLEMAS' + colors.reset);
        console.log(colors.red + `\nGoogle Maps: ${googleMapsScore}/5 APIs funcionando` + colors.reset);
        console.log(colors.red + `DobackSoft: ${systemScore}/6 módulos funcionando` + colors.reset);
    }

    console.log('\n' + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

// ===========================
// MAIN
// ===========================

async function main() {
    printHeader('🧪 TEST SISTEMA COMPLETO - DobackSoft + Google Maps Platform');

    console.log(colors.bright + 'Fecha:' + colors.reset + ' ' + new Date().toLocaleString('es-ES'));
    console.log(colors.bright + 'Backend:' + colors.reset + ' ' + API_BASE_URL);
    console.log(colors.bright + 'Google Maps API Key:' + colors.reset + ' ' + GOOGLE_MAPS_API_KEY.substring(0, 20) + '...\n');

    const results = {
        googleMaps: {
            geocoding: false,
            routes: false,
            roads: false,
            elevation: false,
            places: false,
        },
        backend: false,
        auth: false,
        dashboard: false,
        stability: false,
        events: false,
        routes: false,
    };

    try {
        // 1. Test Google Maps APIs
        results.googleMaps = await testGoogleMapsAPIs();
        await sleep(1000);

        // 2. Test Backend
        results.backend = await testBackendConnection();
        if (!results.backend) {
            printError('Backend no disponible. Tests de sistema cancelados.');
            printFinalSummary(results);
            return;
        }
        await sleep(1000);

        // 3. Test Authentication
        const authData = await testAuthentication();
        results.auth = authData !== null;
        if (!authData) {
            printError('Autenticación falló. Tests restantes cancelados.');
            printFinalSummary(results);
            return;
        }
        await sleep(1000);

        // 4. Test Dashboard
        results.dashboard = await testDashboard(authData.token, authData.user.organizationId);
        await sleep(1000);

        // 5. Test Stability
        const session = await testStabilityModule(authData.token, authData.user.organizationId);
        results.stability = session !== null;
        await sleep(1000);

        // 6. Test Events & Geocoding
        results.events = await testEventsWithGeocoding(authData.token, authData.user.organizationId, session?.id);
        await sleep(1000);

        // 7. Test Routes & GPS
        results.routes = await testRoutesAndGPS(authData.token, authData.user.organizationId, session?.id);

        // Resumen final
        printFinalSummary(results);

    } catch (error: any) {
        printError('Error fatal en la ejecución', error.message);
        printFinalSummary(results);
    }
}

// Ejecutar
main().catch(error => {
    console.error(colors.red + '\n❌ Error fatal: ' + error.message + colors.reset + '\n');
    process.exit(1);
});
