/**
 * 🧪 TEST Roads API - Madrid
 * 
 * Test con coordenadas reales de carreteras en Madrid
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

async function testRoadsInMadrid() {
    print('\n' + colors.cyan + '═'.repeat(80) + colors.reset);
    print(colors.cyan + colors.bright + '🗺️  TEST ROADS API - MADRID' + colors.reset);
    print(colors.cyan + '═'.repeat(80) + colors.reset + '\n');
    
    // Rutas reales en Madrid
    const routes = [
        {
            name: 'Gran Vía (Madrid)',
            points: [
                [40.4198, -3.7069],
                [40.4200, -3.7065],
                [40.4202, -3.7061],
                [40.4204, -3.7057]
            ]
        },
        {
            name: 'Paseo de la Castellana',
            points: [
                [40.4379, -3.6896],
                [40.4390, -3.6889],
                [40.4401, -3.6882],
                [40.4412, -3.6875]
            ]
        },
        {
            name: 'M-30 (Circunvalación)',
            points: [
                [40.4260, -3.7040],
                [40.4265, -3.7038],
                [40.4270, -3.7036],
                [40.4275, -3.7034]
            ]
        }
    ];
    
    let successCount = 0;
    
    for (const route of routes) {
        print(colors.blue + `\n▶ Probando: ${route.name}` + colors.reset);
        print(colors.blue + '─'.repeat(80) + colors.reset);
        
        try {
            const path = route.points.map(p => `${p[0]},${p[1]}`).join('|');
            const url = `https://roads.googleapis.com/v1/snapToRoads?path=${encodeURIComponent(path)}&interpolate=true&key=${GOOGLE_MAPS_API_KEY}`;
            
            const response = await makeRequest(url);
            
            if (response.data.snappedPoints && response.data.snappedPoints.length > 0) {
                successCount++;
                print(colors.green + '✅ Snap-to-road exitoso' + colors.reset);
                print(colors.green + `   Puntos originales: ${route.points.length}` + colors.reset);
                print(colors.green + `   Puntos ajustados: ${response.data.snappedPoints.length}` + colors.reset);
                
                const firstPoint = response.data.snappedPoints[0];
                print(colors.green + `   Primer punto: ${firstPoint.location.latitude.toFixed(6)}, ${firstPoint.location.longitude.toFixed(6)}` + colors.reset);
                
                if (firstPoint.placeId) {
                    print(colors.green + `   Place ID: ${firstPoint.placeId}` + colors.reset);
                    
                    // Intentar obtener límite de velocidad
                    const speedUrl = `https://roads.googleapis.com/v1/speedLimits?placeId=${firstPoint.placeId}&key=${GOOGLE_MAPS_API_KEY}`;
                    const speedResponse = await makeRequest(speedUrl);
                    
                    if (speedResponse.data.speedLimits && speedResponse.data.speedLimits.length > 0) {
                        print(colors.green + `   Límite de velocidad: ${speedResponse.data.speedLimits[0].speedLimit} km/h` + colors.reset);
                    }
                }
            } else {
                print(colors.yellow + '⚠️  Sin resultados para esta ruta' + colors.reset);
                
                if (response.data.error) {
                    print(colors.red + `   Error: ${response.data.error.message}` + colors.reset);
                }
            }
            
        } catch (error) {
            print(colors.red + '❌ Error: ' + error.message + colors.reset);
        }
        
        // Pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Resumen
    print('\n' + colors.cyan + '═'.repeat(80) + colors.reset);
    print(colors.bright + '\n📊 RESUMEN' + colors.reset + '\n');
    
    if (successCount === routes.length) {
        print(colors.green + colors.bright + `🎉 ¡Roads API FUNCIONANDO PERFECTAMENTE!` + colors.reset);
        print(colors.green + `   ${successCount}/${routes.length} rutas procesadas exitosamente` + colors.reset);
    } else if (successCount > 0) {
        print(colors.yellow + `⚠️  Roads API funcionando parcialmente` + colors.reset);
        print(colors.yellow + `   ${successCount}/${routes.length} rutas exitosas` + colors.reset);
    } else {
        print(colors.red + `❌ Roads API no funcionó con ninguna ruta` + colors.reset);
        print(colors.yellow + '\n📋 Posibles causas:' + colors.reset);
        print(colors.yellow + '   1. Roads API no está habilitada' + colors.reset);
        print(colors.yellow + '   2. API Key con restricciones incorrectas' + colors.reset);
        print(colors.yellow + '   3. Coordenadas fuera del área de cobertura' + colors.reset);
    }
    
    print('\n' + colors.cyan + '═'.repeat(80) + colors.reset + '\n');
}

testRoadsInMadrid().catch(error => {
    console.error(colors.red + '\n❌ Error fatal: ' + error.message + colors.reset + '\n');
    process.exit(1);
});

