/**
 * Script para probar el endpoint /api/kpis/summary directamente
 */

const fetch = require('node-fetch');

async function testKPIEndpoint() {
    console.log('🧪 PROBANDO ENDPOINT /api/kpis/summary');
    console.log('=====================================\n');

    try {
        // URL del endpoint
        const baseUrl = 'http://localhost:9998';
        const endpoint = '/api/kpis/summary';
        
        // Parámetros de prueba (usando las fechas del dashboard)
        const params = new URLSearchParams({
            from: '2025-09-29',
            to: '2025-10-08',
            force: 'true'
        });

        const url = `${baseUrl}${endpoint}?${params.toString()}`;
        console.log(`📡 URL: ${url}`);

        // Headers necesarios (simulando autenticación)
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token', // Esto probablemente fallará, pero veremos el error
            'organizationId': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26' // Bomberos Madrid
        };

        console.log('📤 Enviando petición...');
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        console.log(`📥 Status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        console.log('📄 Respuesta:');
        console.log(responseText);

        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('\n✅ Respuesta parseada exitosamente');
                console.log('📊 KPIs recibidos:');
                
                if (data.success && data.data) {
                    const kpis = data.data;
                    console.log(`   - Horas de conducción: ${kpis.activity?.driving_hours_formatted || 'N/A'}`);
                    console.log(`   - Kilómetros: ${kpis.activity?.km_total || 0} km`);
                    console.log(`   - % Rotativo: ${kpis.activity?.rotativo_on_percentage || 0}%`);
                    console.log(`   - Total sesiones: ${kpis.availability?.total_sessions || 0}`);
                    console.log(`   - Total vehículos: ${kpis.availability?.total_vehicles || 0}`);
                    console.log(`   - Eventos de estabilidad: ${kpis.stability?.total_incidents || 0}`);
                } else {
                    console.log('❌ Respuesta no tiene la estructura esperada');
                }
            } catch (parseError) {
                console.log('❌ Error parseando JSON:', parseError.message);
            }
        } else {
            console.log('❌ Error en la petición');
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 El backend no está ejecutándose en el puerto 9998');
            console.log('   Ejecuta: iniciar.ps1 para iniciar el sistema');
        }
    }
}

// Ejecutar prueba
testKPIEndpoint().catch(console.error);
