/**
 * Script para probar el endpoint /api/kpis/summary con autenticación
 */

const fetch = require('node-fetch');

async function testKPIWithAuth() {
    console.log('🧪 PROBANDO ENDPOINT /api/kpis/summary CON AUTENTICACIÓN');
    console.log('======================================================\n');

    try {
        const baseUrl = 'http://localhost:9998';
        
        // 1. Intentar login para obtener token
        console.log('1. Intentando login...');
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@bomberosmadrid.es',
                password: 'admin123'
            })
        });

        console.log(`   Status: ${loginResponse.status}`);
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login exitoso');
            
            const token = loginData.access_token || loginData.token || loginData.data?.token;
            if (!token) {
                console.log('❌ No se obtuvo token del login');
                console.log('Respuesta del login:', loginData);
                return;
            }
            
            console.log(`   Token obtenido: ${token.substring(0, 20)}...`);
            
            // 2. Probar endpoint de KPIs con token
            console.log('\n2. Probando endpoint de KPIs...');
            const params = new URLSearchParams({
                from: '2025-09-29',
                to: '2025-10-08',
                force: 'true'
            });

            const kpiUrl = `${baseUrl}/api/kpis/summary?${params.toString()}`;
            console.log(`   URL: ${kpiUrl}`);

            const kpiResponse = await fetch(kpiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(`   Status: ${kpiResponse.status} ${kpiResponse.statusText}`);
            
            const kpiData = await kpiResponse.text();
            console.log('   Respuesta:');
            console.log(kpiData);

            if (kpiResponse.ok) {
                try {
                    const parsed = JSON.parse(kpiData);
                    console.log('\n✅ KPIs obtenidos exitosamente:');
                    
                    if (parsed.success && parsed.data) {
                        const kpis = parsed.data;
                        console.log(`   📊 Horas de conducción: ${kpis.activity?.driving_hours_formatted || 'N/A'}`);
                        console.log(`   🚗 Kilómetros: ${kpis.activity?.km_total || 0} km`);
                        console.log(`   🔄 % Rotativo: ${kpis.activity?.rotativo_on_percentage || 0}%`);
                        console.log(`   📈 Total sesiones: ${kpis.availability?.total_sessions || 0}`);
                        console.log(`   🚛 Total vehículos: ${kpis.availability?.total_vehicles || 0}`);
                        console.log(`   ⚠️ Eventos de estabilidad: ${kpis.stability?.total_incidents || 0}`);
                        console.log(`   ⭐ Índice de estabilidad: ${kpis.quality?.indice_promedio || 0} (${kpis.quality?.calificacion || 'N/A'})`);
                        
                        // Verificar si los valores son diferentes de 0
                        const hasData = (kpis.activity?.km_total || 0) > 0 || 
                                       (kpis.activity?.driving_hours || 0) > 0 ||
                                       (kpis.stability?.total_incidents || 0) > 0;
                        
                        if (hasData) {
                            console.log('\n🎉 ¡PROBLEMA RESUELTO! Los KPIs ya no están en 0');
                        } else {
                            console.log('\n⚠️ Los KPIs siguen en 0, puede haber otro problema');
                        }
                    } else {
                        console.log('❌ Respuesta no tiene la estructura esperada');
                    }
                } catch (parseError) {
                    console.log('❌ Error parseando JSON:', parseError.message);
                }
            } else {
                console.log('❌ Error en la petición de KPIs');
            }
            
        } else {
            const loginError = await loginResponse.text();
            console.log('❌ Error en login:', loginError);
            
            // Intentar con credenciales alternativas
            console.log('\n🔄 Intentando con credenciales alternativas...');
            const altLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@dobacksoft.com',
                    password: 'test123'
                })
            });
            
            if (altLoginResponse.ok) {
                console.log('✅ Login alternativo exitoso');
                // Repetir el proceso con el token alternativo
                const altLoginData = await altLoginResponse.json();
                const altToken = altLoginData.token || altLoginData.data?.token;
                
                if (altToken) {
                    console.log('🔄 Probando KPIs con token alternativo...');
                    // Aquí se repetiría la lógica de KPIs
                }
            } else {
                console.log('❌ Login alternativo también falló');
            }
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
testKPIWithAuth().catch(console.error);
