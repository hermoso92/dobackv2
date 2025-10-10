const axios = require('axios');

async function testWebfleetEndpoint() {
    console.log('🚀 Probando endpoint de reportes Webfleet con datos reales...');
    
    try {
        // Configuración de la petición
        const config = {
            startDate: '2025-07-10T00:00:00Z',
            endDate: '2025-07-10T23:59:59Z',
            vehicleIds: [], // Todos los vehículos
            reportType: 'detailed',
            title: 'Reporte Prueba Real - doback022',
            includeCriticalEvents: true,
            includeConsumptionAnalysis: true,
            fuelReferenceBase: 7.5
        };
        
        console.log('⚙️ Configuración:', config);
        
        // Hacer petición al endpoint (asumiendo que el servidor esté corriendo)
        const response = await axios.post('http://localhost:9998/api/reports/webfleet', config, {
            headers: {
                'Content-Type': 'application/json',
                // Aquí normalmente iría el token de autenticación
                'Authorization': 'Bearer token-de-prueba'
            },
            timeout: 30000 // 30 segundos de timeout
        });
        
        console.log('✅ Respuesta del servidor:');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        
        if (response.data.success && response.data.data) {
            const reportData = response.data.data;
            console.log(`\n📊 Reporte generado exitosamente:`);
            console.log(`📁 ID: ${reportData.reportId}`);
            console.log(`📄 Archivo: ${reportData.fileName}`);
            console.log(`📏 Tamaño: ${(reportData.size / 1024).toFixed(2)} KB`);
            
            // Intentar descargar el reporte
            if (reportData.reportId) {
                console.log(`\n📥 Intentando descargar reporte...`);
                const downloadUrl = `http://localhost:9998/api/reports/webfleet/download/${reportData.reportId}`;
                console.log(`🔗 URL de descarga: ${downloadUrl}`);
            }
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️ Servidor no está corriendo en localhost:9998');
            console.log('💡 Para probar el endpoint:');
            console.log('   1. Ejecuta "npm run dev" en el backend');
            console.log('   2. Vuelve a ejecutar este script');
        } else if (error.response) {
            console.error('❌ Error del servidor:', error.response.status);
            console.error('   Mensaje:', error.response.data);
        } else {
            console.error('❌ Error de conexión:', error.message);
        }
    }
}

testWebfleetEndpoint(); 