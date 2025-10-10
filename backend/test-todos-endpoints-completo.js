/**
 * TEST COMPLETO DE TODOS LOS ENDPOINTS
 * Verificación exhaustiva post-reinicio
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function testEndpoint(nombre, url, validaciones) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 TEST: ${nombre}`);
    console.log(`🌐 URL: ${url}`);
    console.log('⏳ Llamando...\n');
    
    try {
        const response = await fetch(url);
        const status = response.status;
        
        console.log(`📡 Status: ${status} ${response.statusText}`);
        
        if (!response.ok) {
            const error = await response.text();
            console.log(`❌ ERROR: ${error.substring(0, 200)}`);
            return false;
        }
        
        const data = await response.json();
        
        // Ejecutar validaciones
        let todoBien = true;
        
        for (const validacion of validaciones) {
            const resultado = validacion.fn(data);
            const simbolo = resultado ? '✅' : '❌';
            console.log(`${simbolo} ${validacion.nombre}: ${resultado ? 'OK' : 'FALLÓ'}`);
            
            if (!resultado && validacion.detalle) {
                console.log(`   ℹ️ ${validacion.detalle(data)}`);
            }
            
            todoBien = todoBien && resultado;
        }
        
        return todoBien;
        
    } catch (error) {
        console.log(`❌ EXCEPCIÓN: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🧪 TEST EXHAUSTIVO DE TODOS LOS ENDPOINTS');
    console.log('🔄 Backend recién reiniciado - verificando cambios\n');
    
    const resultados = [];
    
    // ========================================================================
    // TEST 1: KPIs Summary - Eventos corregidos
    // ========================================================================
    resultados.push(await testEndpoint(
        'KPIs Summary - Eventos de estabilidad',
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`,
        [
            {
                nombre: 'Respuesta exitosa',
                fn: (data) => data.success === true
            },
            {
                nombre: 'Tiene datos de stability',
                fn: (data) => data.data && data.data.stability
            },
            {
                nombre: 'Total eventos ~1,853 (no 784k)',
                fn: (data) => {
                    const total = data.data?.stability?.total_incidents || 0;
                    return total > 1000 && total < 3000;
                },
                detalle: (data) => `Total real: ${data.data?.stability?.total_incidents || 0}`
            },
            {
                nombre: 'Tiene desglose por_tipo',
                fn: (data) => data.data?.stability?.por_tipo && Object.keys(data.data.stability.por_tipo).length > 0
            },
            {
                nombre: 'DERIVA_PELIGROSA < 2000',
                fn: (data) => {
                    const deriva = data.data?.stability?.por_tipo?.DERIVA_PELIGROSA || 0;
                    return deriva < 2000;
                },
                detalle: (data) => `DERIVA_PELIGROSA: ${data.data?.stability?.por_tipo?.DERIVA_PELIGROSA || 0}`
            },
            {
                nombre: 'Tiene quality (índice SI)',
                fn: (data) => data.data?.quality && data.data.quality.indice_promedio
            }
        ]
    ));
    
    // ========================================================================
    // TEST 2: Hotspots Critical Points
    // ========================================================================
    resultados.push(await testEndpoint(
        'Hotspots - Puntos críticos',
        `${BASE_URL}/api/hotspots/critical-points?organizationId=${ORG_ID}&severity=all&minFrequency=1&clusterRadius=20`,
        [
            {
                nombre: 'Respuesta exitosa',
                fn: (data) => data.success === true
            },
            {
                nombre: 'Total eventos ~1,853',
                fn: (data) => {
                    const total = data.data?.totalEvents || 0;
                    return total > 1000 && total < 3000;
                },
                detalle: (data) => `Total eventos: ${data.data?.totalEvents || 0}`
            },
            {
                nombre: 'Tiene clusters',
                fn: (data) => data.data?.clusters && data.data.clusters.length > 0
            },
            {
                nombre: 'Eventos tienen lat/lon',
                fn: (data) => {
                    const clusters = data.data?.clusters || [];
                    return clusters.length === 0 || clusters[0].lat !== undefined;
                }
            }
        ]
    ));
    
    // ========================================================================
    // TEST 3: Hotspots Ranking
    // ========================================================================
    resultados.push(await testEndpoint(
        'Hotspots - Ranking zonas críticas',
        `${BASE_URL}/api/hotspots/ranking?organizationId=${ORG_ID}&limit=10`,
        [
            {
                nombre: 'Respuesta exitosa',
                fn: (data) => data.success === true
            },
            {
                nombre: 'Tiene ranking',
                fn: (data) => data.data?.ranking && Array.isArray(data.data.ranking)
            },
            {
                nombre: 'Zonas tienen datos completos',
                fn: (data) => {
                    const ranking = data.data?.ranking || [];
                    if (ranking.length === 0) return true;
                    const zona = ranking[0];
                    return zona.rank && zona.location && zona.totalEvents !== undefined;
                },
                detalle: (data) => {
                    const zona = data.data?.ranking?.[0];
                    return zona ? `Primera zona: ${JSON.stringify(zona)}` : 'Sin zonas';
                }
            }
        ]
    ));
    
    // ========================================================================
    // TEST 4: Speed Violations
    // ========================================================================
    resultados.push(await testEndpoint(
        'Speed - Violaciones de velocidad',
        `${BASE_URL}/api/speed/violations?organizationId=${ORG_ID}&rotativoOn=all&violationType=all`,
        [
            {
                nombre: 'Respuesta exitosa',
                fn: (data) => data.success === true
            },
            {
                nombre: 'Tiene violations',
                fn: (data) => data.data?.violations && Array.isArray(data.data.violations)
            },
            {
                nombre: 'Tiene stats',
                fn: (data) => data.data?.stats
            },
            {
                nombre: 'Summary tiene velocidades',
                fn: (data) => data.data?.summary && data.data.summary.velocidad_maxima !== undefined
            }
        ]
    ));
    
    // ========================================================================
    // TEST 5: Estados (claves operativas)
    // ========================================================================
    resultados.push(await testEndpoint(
        'Estados - Claves operativas',
        `${BASE_URL}/api/kpis/states?organizationId=${ORG_ID}`,
        [
            {
                nombre: 'Respuesta exitosa',
                fn: (data) => data.success === true
            },
            {
                nombre: 'Tiene tiempos por clave',
                fn: (data) => data.data?.tiemposPorClave
            },
            {
                nombre: 'Tiene clave 0 (Taller)',
                fn: (data) => data.data?.tiemposPorClave?.clave0_segundos !== undefined
            },
            {
                nombre: 'Tiene clave 2 (Emergencia)',
                fn: (data) => data.data?.tiemposPorClave?.clave2_segundos !== undefined
            }
        ]
    ));
    
    // ========================================================================
    // TEST 6: Filtros - vehicleIds
    // ========================================================================
    const vehicleId = '14b9febb-ca73-4130-a88d-e4d73ed6501a'; // DOBACK024
    resultados.push(await testEndpoint(
        'Filtros - Por vehículo específico',
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&vehicleIds=${vehicleId}`,
        [
            {
                nombre: 'Respuesta exitosa',
                fn: (data) => data.success === true
            },
            {
                nombre: 'KPIs filtrados por vehículo',
                fn: (data) => data.data?.metadata?.sesiones_analizadas !== undefined
            },
            {
                nombre: 'Tiene eventos de estabilidad',
                fn: (data) => data.data?.stability?.total_incidents !== undefined
            }
        ]
    ));
    
    // ========================================================================
    // RESUMEN FINAL
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE TESTS\n');
    
    const total = resultados.length;
    const exitosos = resultados.filter(r => r).length;
    const fallidos = total - exitosos;
    
    console.log(`Total tests: ${total}`);
    console.log(`✅ Exitosos: ${exitosos}`);
    console.log(`❌ Fallidos: ${fallidos}`);
    console.log(`📈 Tasa de éxito: ${((exitosos / total) * 100).toFixed(1)}%`);
    
    console.log('\n' + '='.repeat(80));
    
    if (fallidos === 0) {
        console.log('✅ TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE');
        console.log('\n💡 Sistema listo para producción');
    } else {
        console.log('⚠️ ALGUNOS ENDPOINTS TIENEN PROBLEMAS');
        console.log('\n💡 Revisar logs arriba para detalles');
    }
    
    console.log('\n');
}

runAllTests().catch(console.error);

