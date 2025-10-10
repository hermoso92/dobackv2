const axios = require('axios');

// Datos de prueba para estabilidad
const testStabilityData = [
    {
        timestamp: new Date().toISOString(),
        ax: 1.5,
        ay: 2.3,
        az: 9.8,
        gx: 0.1,
        gy: 0.2,
        gz: 0.3,
        si: 0.5,
        accmag: 10.2
    },
    {
        timestamp: new Date(Date.now() + 1000).toISOString(),
        ax: 1.6,
        ay: 2.4,
        az: 9.7,
        gx: 0.15,
        gy: 0.25,
        gz: 0.35,
        si: 0.6,
        accmag: 10.3
    }
];

// Datos de prueba para GPS
const testGpsData = [
    {
        timestamp: new Date().toISOString(),
        latitude: 40.4168,
        longitude: -3.7038,
        altitude: 655,
        speed: 25.5,
        satellites: 8,
        quality: "good"
    }
];

// Datos de prueba para CAN
const testCanData = [
    {
        timestamp: new Date().toISOString(),
        engineRpm: 2500,
        vehicleSpeed: 60,
        fuelSystemStatus: 1
    }
];

// Datos de prueba para rotativo
const testRotativoData = [
    {
        timestamp: new Date().toISOString(),
        state: "ON"
    }
];

async function testStabilityUpload() {
    try {
        console.log('🧪 Iniciando prueba de subida de datos de estabilidad...');
        
        // Crear datos de prueba con archivos simulados
        const testData = {
            vehicleId: 'test-vehicle-123',
            sessionNumber: 'TEST-001',
            stabilityData: testStabilityData,
            gpsData: testGpsData,
            canData: testCanData,
            rotativoData: testRotativoData
        };
        
        console.log('📤 Enviando datos de prueba...');
        console.log('   - Datos de estabilidad:', testStabilityData.length, 'puntos');
        console.log('   - Datos GPS:', testGpsData.length, 'puntos');
        console.log('   - Datos CAN:', testCanData.length, 'puntos');
        console.log('   - Datos rotativo:', testRotativoData.length, 'puntos');
        
        // Simular la petición POST
        const response = await axios.post('http://localhost:9998/api/sesion/upload', testData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            timeout: 30000
        });
        
        console.log('✅ Prueba exitosa!');
        console.log('📊 Respuesta:', response.data);
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        
        if (error.response) {
            console.error('📋 Detalles del error:');
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Función para probar datos incompletos (que deberían ser filtrados)
async function testIncompleteData() {
    try {
        console.log('\n🧪 Probando datos incompletos...');
        
        const incompleteData = [
            {
                timestamp: new Date().toISOString(),
                ax: 1.5,
                ay: 2.3,
                // az faltante
                gx: 0.1,
                gy: 0.2,
                gz: 0.3
            },
            {
                timestamp: new Date(Date.now() + 1000).toISOString(),
                ax: 1.6,
                ay: 2.4,
                az: 9.7,
                gx: 0.15,
                gy: 0.25,
                gz: 0.35
            }
        ];
        
        console.log('📤 Enviando datos incompletos...');
        console.log('   - Primer punto: sin az');
        console.log('   - Segundo punto: completo');
        
        const testData = {
            vehicleId: 'test-vehicle-123',
            sessionNumber: 'TEST-002',
            stabilityData: incompleteData,
            gpsData: testGpsData,
            canData: testCanData,
            rotativoData: testRotativoData
        };
        
        const response = await axios.post('http://localhost:9998/api/sesion/upload', testData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            timeout: 30000
        });
        
        console.log('✅ Prueba con datos incompletos exitosa!');
        console.log('📊 Respuesta:', response.data);
        
    } catch (error) {
        console.error('❌ Error en la prueba con datos incompletos:', error.message);
        
        if (error.response) {
            console.error('📋 Detalles del error:');
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Ejecutar pruebas
async function runTests() {
    console.log('🚀 Iniciando pruebas de subida de datos...\n');
    
    await testStabilityUpload();
    await testIncompleteData();
    
    console.log('\n🏁 Pruebas completadas');
}

runTests().catch(console.error); 