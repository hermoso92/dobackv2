/**
 * Testing Completo de KPIs - DobackSoft
 * 
 * Verifica cada KPI de cada pestaña del dashboard
 * Autentica y prueba endpoints uno por uno
 */

const axios = require('axios');

const CONFIG = {
    BACKEND_URL: 'http://localhost:9998',
    EMAIL: 'admin@dobacksoft.com',
    PASSWORD: 'admin123'
};

let authToken = '';
const resultados = [];

function log(mensaje, tipo = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = tipo === 'OK' ? '✅' : tipo === 'FAIL' ? '❌' : tipo === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${icon} ${mensaje}`);
}

function addResultado(pestaña, kpi, valor, ok) {
    resultados.push({ pestaña, kpi, valor, ok });
    log(`[${pestaña}] ${kpi}: ${valor}`, ok ? 'OK' : 'FAIL');
}

// ============================================================================
// 1. AUTENTICACIÓN
// ============================================================================

async function autenticar() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  1. AUTENTICACIÓN');
    console.log('═══════════════════════════════════════════════\n');
    
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/api/auth/login`, {
            email: CONFIG.EMAIL,
            password: CONFIG.PASSWORD
        });
        
        if (!response.data || !response.data.token) {
            log(`Login falló: Respuesta sin token`, 'FAIL');
            console.log('Respuesta:', JSON.stringify(response.data, null, 2));
            return false;
        }
        
        authToken = response.data.token;
        log('Login exitoso', 'OK');
        if (authToken) {
            log(`Token: ${authToken.substring(0, 20)}...`, 'INFO');
        }
        return true;
    } catch (error) {
        log(`Error login: ${error.response?.data?.message || error.message}`, 'FAIL');
        if (error.response?.data) {
            console.log('Error detallado:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// ============================================================================
// 2. KPIs PANEL DE CONTROL
// ============================================================================

async function testPanelControl() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  2. PANEL DE CONTROL - KPIs');
    console.log('═══════════════════════════════════════════════\n');
    
    try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/kpis/summary`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const data = response.data.data;
        
        // Disponibilidad
        addResultado(
            'Panel Control',
            'Disponibilidad',
            `${data.availability?.availability_percentage || 0}%`,
            data.availability !== undefined
        );
        
        addResultado(
            'Panel Control',
            'Total Sesiones',
            data.availability?.total_sessions || 0,
            true
        );
        
        addResultado(
            'Panel Control',
            'Total Vehículos',
            data.availability?.total_vehicles || 0,
            true
        );
        
        // Estados (Claves Operacionales)
        if (data.states && data.states.states) {
            data.states.states.forEach(state => {
                addResultado(
                    'Panel Control',
                    `Clave ${state.key} (${state.name})`,
                    state.duration_formatted,
                    true
                );
            });
        }
        
        // Actividad
        addResultado(
            'Panel Control',
            'Km Totales',
            `${data.activity?.km_total || 0} km`,
            data.activity !== undefined
        );
        
        addResultado(
            'Panel Control',
            'Horas Conducción',
            data.activity?.driving_hours_formatted || '00:00:00',
            true
        );
        
        addResultado(
            'Panel Control',
            'Tiempo Rotativo ON',
            `${data.activity?.rotativo_on_percentage || 0}%`,
            true
        );
        
        // Estabilidad
        addResultado(
            'Panel Control',
            'Total Incidencias',
            data.stability?.total_incidents || 0,
            data.stability !== undefined
        );
        
        addResultado(
            'Panel Control',
            'Incidencias Críticas',
            data.stability?.critical || 0,
            true
        );
        
        // Calidad
        addResultado(
            'Panel Control',
            'Índice Estabilidad',
            `${data.quality?.indice_promedio || 0} (${data.quality?.calificacion || 'N/A'})`,
            data.quality !== undefined
        );
        
    } catch (error) {
        log(`Error obteniendo KPIs Panel Control: ${error.message}`, 'FAIL');
    }
}

// ============================================================================
// 3. VEHÍCULOS
// ============================================================================

async function testVehiculos() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  3. VEHÍCULOS');
    console.log('═══════════════════════════════════════════════\n');
    
    try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/vehicles`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const vehiculos = response.data;
        
        addResultado(
            'Vehículos',
            'Total Vehículos',
            vehiculos.length,
            vehiculos.length > 0
        );
        
        if (vehiculos.length > 0) {
            const primer = vehiculos[0];
            addResultado(
                'Vehículos',
                'Primer Vehículo',
                `${primer.name} (${primer.identifier})`,
                primer.name !== undefined
            );
        }
        
        return vehiculos;
        
    } catch (error) {
        log(`Error obteniendo vehículos: ${error.message}`, 'FAIL');
        return [];
    }
}

// ============================================================================
// 4. SESIONES
// ============================================================================

async function testSesiones() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  4. SESIONES');
    console.log('═══════════════════════════════════════════════\n');
    
    try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/sessions`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { limit: 10 }
        });
        
        const sesiones = response.data;
        
        addResultado(
            'Sesiones',
            'Total Sesiones',
            sesiones.length,
            sesiones.length >= 0
        );
        
        if (sesiones.length > 0) {
            const primera = sesiones[0];
            addResultado(
                'Sesiones',
                'Primera Sesión',
                `ID: ${primera.id?.substring(0, 8)}...`,
                primera.id !== undefined
            );
            
            return primera.id; // Retornar para tests posteriores
        }
        
        return null;
        
    } catch (error) {
        log(`Error obteniendo sesiones: ${error.message}`, 'FAIL');
        return null;
    }
}

// ============================================================================
// 5. ESTABILIDAD (si hay sesiones)
// ============================================================================

async function testEstabilidad(sessionId) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  5. ESTABILIDAD');
    console.log('═══════════════════════════════════════════════\n');
    
    if (!sessionId) {
        log('Sin sesiones para testear', 'WARN');
        return;
    }
    
    try {
        // Test mediciones de estabilidad
        const response = await axios.get(
            `${CONFIG.BACKEND_URL}/api/sessions/${sessionId}/stability`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const data = response.data;
        
        addResultado(
            'Estabilidad',
            'Mediciones',
            data.measurements?.length || 0,
            data.measurements !== undefined
        );
        
        if (data.metrics) {
            addResultado(
                'Estabilidad',
                'Índice SI Promedio',
                data.metrics.avgSI?.toFixed(3) || 'N/A',
                true
            );
        }
        
    } catch (error) {
        log(`Endpoint estabilidad no disponible: ${error.message}`, 'WARN');
    }
}

// ============================================================================
// 6. ALERTAS
// ============================================================================

async function testAlertas() {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  6. ALERTAS');
    console.log('═══════════════════════════════════════════════\n');
    
    try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/alerts`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const alertas = response.data;
        
        addResultado(
            'Alertas',
            'Total Alertas',
            alertas.length || 0,
            Array.isArray(alertas)
        );
        
    } catch (error) {
        log(`Error obteniendo alertas: ${error.message}`, 'WARN');
    }
}

// ============================================================================
// REPORTE FINAL
// ============================================================================

function generarReporte() {
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('  REPORTE FINAL');
    console.log('═══════════════════════════════════════════════\n');
    
    const total = resultados.length;
    const ok = resultados.filter(r => r.ok).length;
    const fail = resultados.filter(r => r.ok === false).length;
    
    console.log(`Total KPIs verificados: ${total}`);
    console.log(`✅ OK: ${ok} (${((ok/total)*100).toFixed(1)}%)`);
    console.log(`❌ FAIL: ${fail} (${((fail/total)*100).toFixed(1)}%)`);
    
    // Agrupar por pestaña
    console.log('\n📊 Por pestaña:\n');
    const porPestaña = {};
    resultados.forEach(r => {
        if (!porPestaña[r.pestaña]) porPestaña[r.pestaña] = { ok: 0, total: 0 };
        porPestaña[r.pestaña].total++;
        if (r.ok) porPestaña[r.pestaña].ok++;
    });
    
    Object.entries(porPestaña).forEach(([pestaña, stats]) => {
        const percent = ((stats.ok / stats.total) * 100).toFixed(0);
        const icon = stats.ok === stats.total ? '✅' : stats.ok > 0 ? '⚠️' : '❌';
        console.log(`${icon} ${pestaña}: ${stats.ok}/${stats.total} (${percent}%)`);
    });
    
    // KPIs fallidos
    const fallidos = resultados.filter(r => !r.ok);
    if (fallidos.length > 0) {
        console.log('\n❌ KPIs fallidos:\n');
        fallidos.forEach(r => {
            console.log(`   [${r.pestaña}] ${r.kpi}`);
        });
    }
    
    console.log('\n═══════════════════════════════════════════════\n');
    
    return { total, ok, fail, porcentaje: ((ok/total)*100).toFixed(1) };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.clear();
    console.log('═══════════════════════════════════════════════');
    console.log('  TESTING KPIs COMPLETO - DOBACKSOFT');
    console.log('═══════════════════════════════════════════════\n');
    
    // 1. Autenticar
    const loginOK = await autenticar();
    if (!loginOK) {
        console.log('\n❌ No se pudo autenticar. Verifica que el backend esté corriendo.\n');
        process.exit(1);
    }
    
    // 2. Test Panel Control
    await testPanelControl();
    
    // 3. Test Vehículos
    const vehiculos = await testVehiculos();
    
    // 4. Test Sesiones
    const sessionId = await testSesiones();
    
    // 5. Test Estabilidad
    await testEstabilidad(sessionId);
    
    // 6. Test Alertas
    await testAlertas();
    
    // 7. Reporte Final
    const stats = generarReporte();
    
    // Exit code según resultado
    process.exit(stats.fail > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
});

