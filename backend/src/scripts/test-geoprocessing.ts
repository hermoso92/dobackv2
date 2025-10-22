import { osrmService } from '../services/geoprocessing/OSRMService';
import { routeProcessorService } from '../services/geoprocessing/RouteProcessorService';

async function testGeoprocessing() {
    console.log('🧪 Iniciando pruebas de geoprocesamiento...\n');

    // 1. Test OSRM health
    console.log('1️⃣ Verificando OSRM...');
    const osrmHealthy = await osrmService.healthCheck();
    console.log(osrmHealthy ? '✅ OSRM funcionando' : '❌ OSRM no disponible');

    if (!osrmHealthy) {
        console.log('\n❌ OSRM no disponible. Ejecuta: docker-compose up -d osrm');
        return;
    }

    // 2. Test con sesión real
    console.log('\n2️⃣ Procesando sesión de prueba...');
    const testSessionId = '5894090f-156c-4816-92c6-4632e7dd666f';

    try {
        const result = await routeProcessorService.processSession(testSessionId);

        console.log('\n✅ Resultados:');
        console.log(`   📏 Distancia: ${result.distance.toFixed(2)}m (${(result.distance / 1000).toFixed(2)} km)`);
        console.log(`   ⏱️  Duración: ${result.duration.toFixed(0)}s (${(result.duration / 60).toFixed(1)} min)`);
        console.log(`   🎯 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   🗺️  Eventos geocerca: ${result.geofenceEvents}`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

testGeoprocessing();
















