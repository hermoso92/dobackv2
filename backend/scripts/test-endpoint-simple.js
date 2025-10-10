const fetch = require('node-fetch');

async function testEndpoint() {
    try {
        console.log('🧪 Probando endpoint del dashboard...');
        
        // Esperar un momento para que el servidor se inicie
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const response = await fetch('http://localhost:3001/api/advanced-kpis/dashboard-format?vehicleId=f0c2abab-dd54-44ca-b249-820e7c524efa&date=2025-07-07');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint del dashboard responde correctamente');
            console.log('📊 Datos recibidos:', Object.keys(data).length, 'propiedades');
            
            if (data.kpiData) {
                console.log('📈 Datos del KPI en el dashboard:');
                console.log('  - Velocidad máxima:', data.kpiData.maxVelocidadAlcanzada, 'km/h');
                console.log('  - Velocidad promedio:', data.kpiData.velocidadPromedio, 'km/h');
                console.log('  - Distancia:', data.kpiData.distanciaRecorrida, 'km');
                console.log('  - Tiempo fuera de parque:', data.kpiData.tiempoFueraParque, 'minutos');
                console.log('  - Eventos críticos:', data.kpiData.eventosCriticos);
                console.log('  - Total puntos GPS:', data.kpiData.totalPuntosGPS);
            }
        } else {
            console.error('❌ Error en endpoint del dashboard:', response.status, response.statusText);
        }
        
    } catch (error) {
        console.error('💥 Error probando endpoint:', error.message);
    }
}

testEndpoint();