const axios = require('axios');

async function testAdvancedKPIEndpoint() {
    try {
        console.log('🧪 Probando endpoint de KPIs avanzados...');
        
        // Primero obtener un token de autenticación
        const loginResponse = await axios.post('http://localhost:9998/auth/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            withCredentials: true
        });
        
        console.log('✅ Login exitoso');
        
        // Obtener vehículos para tener un vehicleId válido
        const vehiclesResponse = await axios.get('http://localhost:9998/vehicles', {
            withCredentials: true
        });
        
        if (!vehiclesResponse.data.data || vehiclesResponse.data.data.length === 0) {
            console.log('❌ No hay vehículos disponibles');
            return;
        }
        
        const vehicle = vehiclesResponse.data.data[0];
        console.log(`🚗 Usando vehículo: ${vehicle.name} (${vehicle.id})`);
        
        // Probar endpoint de KPIs avanzados
        const kpiResponse = await axios.get(`http://localhost:9998/advanced-kpi/dashboard`, {
            params: {
                vehicleId: vehicle.id,
                organizationId: vehicle.organizationId,
                date: new Date().toISOString().slice(0, 10)
            },
            withCredentials: true
        });
        
        console.log('✅ KPIs avanzados obtenidos exitosamente');
        console.log('\n📊 DATOS DE KPIs AVANZADOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const kpiData = kpiResponse.data.data;
        
        // Mostrar cajas principales
        console.log('\n🏢 ESTADOS DEL VEHÍCULO:');
        kpiData.mainBoxes.forEach((box, index) => {
            console.log(`  ${index + 1}. ${box.title}: ${box.value} ${box.unit}`);
            if (box.details) {
                Object.entries(box.details).forEach(([key, value]) => {
                    console.log(`     - ${key}: ${value}`);
                });
            }
        });
        
        // Mostrar cajas de velocidad
        console.log('\n🚗 VELOCIDAD Y EXCESOS:');
        kpiData.speedBoxes.forEach((box, index) => {
            console.log(`  ${index + 1}. ${box.title}: ${box.value} ${box.unit}`);
            if (box.details) {
                Object.entries(box.details).forEach(([key, value]) => {
                    console.log(`     - ${key}: ${value}`);
                });
            }
        });
        
        // Mostrar excesos de velocidad
        console.log('\n⚠️ EXCESOS DE VELOCIDAD POR CATEGORÍA:');
        kpiData.speedExcessBoxes.forEach((box, index) => {
            console.log(`  ${index + 1}. ${box.title}: ${box.value} ${box.unit} - ${box.description}`);
        });
        
        // Mostrar eventos
        console.log('\n⚠️ EVENTOS DE ESTABILIDAD:');
        kpiData.eventBoxes.forEach((box, index) => {
            console.log(`  ${index + 1}. ${box.title}: ${box.value} ${box.unit}`);
            if (box.details) {
                Object.entries(box.details).forEach(([key, value]) => {
                    console.log(`     - ${key}: ${value}`);
                });
            }
        });
        
        // Mostrar estadísticas generales
        console.log('\n📈 ESTADÍSTICAS GENERALES:');
        kpiData.statsBoxes.forEach((box, index) => {
            console.log(`  ${index + 1}. ${box.title}: ${box.value} ${box.unit}`);
        });
        
        // Mostrar claves operativas
        console.log('\n🔑 CLAVES OPERATIVAS:');
        kpiData.operationalKeys.forEach((box, index) => {
            console.log(`  ${index + 1}. ${box.title}: ${box.value} ${box.unit} - ${box.description}`);
        });
        
        // Mostrar resumen de datos crudos
        console.log('\n📋 RESUMEN DE DATOS CRUDOS:');
        const rawData = kpiData.rawData;
        console.log(`  • Tiempo total: ${rawData.totalTiempo} minutos`);
        console.log(`  • Distancia recorrida: ${Math.round(rawData.distanciaRecorrida / 1000)} km`);
        console.log(`  • Velocidad máxima: ${rawData.maxVelocidadAlcanzada} km/h`);
        console.log(`  • Eventos críticos: ${rawData.eventosCriticos}`);
        console.log(`  • Eventos peligrosos: ${rawData.eventosPeligrosos}`);
        console.log(`  • Eventos moderados: ${rawData.eventosModerados}`);
        console.log(`  • Eventos leves: ${rawData.eventosLeves}`);
        
        console.log('\n✅ Endpoint de KPIs avanzados funcionando correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('🔐 Error de autenticación - verificar credenciales');
        } else if (error.response?.status === 404) {
            console.log('🔍 Endpoint no encontrado - verificar ruta');
        } else if (error.response?.status === 500) {
            console.log('💥 Error interno del servidor - verificar logs');
        }
    }
}

testAdvancedKPIEndpoint(); 