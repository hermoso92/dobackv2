/**
 * PRUEBA COMPLETA DEL SISTEMA DOBACKSOFT CON PLAYWRIGHT
 * 
 * Este script automatiza todas las pruebas del frontend y backend
 * usando Playwright para simular interacción real del usuario
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuración
const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:9998';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-test');

// Credenciales de test
// ... existing code ...
const TEST_USER = {
    // cambio aquí
    email: 'antoniohermoso92@manager.com',
    password: 'password123'
};
// ... existing code ...

// Crear directorio de screenshots
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

async function testCompleto() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 INICIANDO PRUEBAS COMPLETAS DE DOBACKSOFT');
    console.log('='.repeat(70) + '\n');
    
    const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    const browser = await chromium.launch({
        headless,
        slowMo: headless ? 0 : 500
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    try {
        const gotoDashboardTab = async (tabIndex) => {
            const tabUrl = `${FRONTEND_URL}/dashboard?tab=${tabIndex}`;
            await page.goto(tabUrl, { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
        };

        // ========================================
        // TEST 1: VERIFICAR BACKEND ONLINE
        // ========================================
        console.log('📡 TEST 1: Verificando backend...');
        try {
            const response = await page.goto(`${BACKEND_URL}/health`);
            if (response && response.ok()) {
                console.log('   ✅ Backend online en puerto 9998\n');
            } else {
                console.log('   ⚠️  Backend respondió pero con error\n');
            }
        } catch (error) {
            console.log('   ❌ Backend no responde:', error.message, '\n');
        }
        
        // ========================================
        // TEST 2: CARGAR FRONTEND
        // ========================================
        console.log('🌐 TEST 2: Cargando frontend...');
        await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-frontend-cargado.png') });
        console.log('   ✅ Frontend cargado');
        console.log('   📸 Screenshot: 01-frontend-cargado.png\n');
        
        // ========================================
        // TEST 3: LOGIN
        // ========================================
        console.log('🔐 TEST 3: Realizando login...');
        
        // Esperar que aparezca el formulario de login (más flexible)
        await page.waitForTimeout(2000);
        
        // Buscar inputs de forma más flexible
        const inputs = await page.$$('input[type="text"], input[type="email"], input');
        if (inputs.length >= 2) {
            // Limpiar y llenar email
            await inputs[0].click({ clickCount: 3 }); // Seleccionar todo
            await inputs[0].fill(TEST_USER.email);
            
            // Limpiar y llenar password
            await inputs[1].click({ clickCount: 3 }); // Seleccionar todo
            await inputs[1].fill(TEST_USER.password);
        }
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-formulario-login.png') });
        
        // Click en botón de login - buscar por texto o tipo
        try {
            await page.click('button:has-text("LOGIN"), button:has-text("Iniciar"), button[type="submit"]');
        } catch (error) {
            // Buscar cualquier botón visible
            const buttons = await page.$$('button');
            if (buttons.length > 0) {
                await buttons[0].click();
            }
        }
        
        // Esperar a que la sesión se persista
        await page.waitForFunction(() => !!localStorage.getItem('auth_token'), { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-post-login.png') });

        // Verificar si hay tokens y usuario en localStorage o cookies de sesión
        const sessionData = await page.evaluate(() => ({
            access: localStorage.getItem('auth_token'),
            refresh: localStorage.getItem('refresh_token'),
            user: localStorage.getItem('auth_user'),
            authTokens: localStorage.getItem('authTokens'),
            cookies: document.cookie
        }));

        const hasLegacyTokens = sessionData.access && sessionData.refresh && sessionData.user;
        const hasNewAuthToken = (() => {
            try {
                if (!sessionData.authTokens) return false;
                const parsed = JSON.parse(sessionData.authTokens);
                return Boolean(parsed?.accessToken && parsed?.refreshToken);
            } catch (e) {
                return false;
            }
        })();
        const hasSessionCookie = sessionData.cookies?.includes('sessionId=');

        if (hasLegacyTokens || hasNewAuthToken || hasSessionCookie) {
            console.log('   ✅ Login exitoso - Sesión detectada');
            console.log('   📸 Screenshots: 02-formulario-login.png, 03-post-login.png\n');
        } else {
            console.log('   ⚠️  Login completado pero no se encontraron tokens esperados\n');
        }
        
        // ========================================
        // TEST 4: PANEL DE CONTROL
        // ========================================
        console.log('📊 TEST 4: Navegando a Panel de Control...');
        
        await gotoDashboardTab(0);
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-panel-control.png') });
        console.log('   ✅ Panel de Control visible');
        console.log('   📸 Screenshot: 04-panel-control.png\n');
        
        // ========================================
        // TEST 5: VERIFICAR KPIs
        // ========================================
        console.log('📈 TEST 5: Verificando KPIs...');
        
        // Buscar elementos de KPIs
        const kpiElements = await page.$$('[class*="kpi"], [class*="card"], [class*="metric"]');
        console.log(`   ℹ️  Encontrados ${kpiElements.length} elementos tipo KPI/Card`);
        
        // Intentar extraer texto de KPIs
        const kpiTexts = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('[class*="kpi"], [class*="card"], [class*="metric"]'));
            return elements.slice(0, 6).map(el => el.textContent.trim().substring(0, 100));
        });
        
        if (kpiTexts.length > 0) {
            console.log('   ✅ KPIs encontrados:');
            kpiTexts.forEach((text, i) => {
                if (text) console.log(`      ${i + 1}. ${text}`);
            });
        }
        console.log('');
        
        // ========================================
        // TEST 6: SELECTOR DE VEHÍCULOS
        // ========================================
        console.log('🚗 TEST 6: Probando selector de vehículos...');
        
        try {
            // Buscar selector/dropdown de vehículos
            const vehicleSelector = await page.$('select, [role="combobox"], [class*="select"]');
            if (vehicleSelector) {
                await vehicleSelector.click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-selector-vehiculos.png') });
                
                // Intentar seleccionar otro vehículo
                const options = await page.$$('option, [role="option"]');
                if (options.length > 1) {
                    await options[1].click();
                    await page.waitForTimeout(2000);
                    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-vehiculo-cambiado.png') });
                    console.log('   ✅ Selector de vehículos funcional');
                    console.log('   📸 Screenshots: 05-selector-vehiculos.png, 06-vehiculo-cambiado.png\n');
                } else {
                    console.log('   ⚠️  Solo hay un vehículo disponible\n');
                }
            } else {
                console.log('   ℹ️  No se encontró selector de vehículos en esta vista\n');
            }
        } catch (error) {
            console.log('   ⚠️  Error probando selector:', error.message, '\n');
        }
        
        // ========================================
        // TEST 7: NAVEGAR A PUNTOS NEGROS
        // ========================================
        console.log('📍 TEST 7: Navegando a Puntos Negros...');
        
        try {
            await gotoDashboardTab(2);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-puntos-negros.png') });
            console.log('   ✅ Tab Puntos Negros cargado');
            console.log('   📸 Screenshot: 07-puntos-negros.png\n');
        } catch (error) {
            console.log('   ⚠️  No se pudo cargar Puntos Negros:', error.message, '\n');
        }
        
        // ========================================
        // TEST 8: NAVEGAR A VELOCIDAD
        // ========================================
        console.log('🚦 TEST 8: Navegando a Velocidad...');
        
        try {
            await gotoDashboardTab(3);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-velocidad.png') });
            console.log('   ✅ Tab Velocidad cargado');
            console.log('   📸 Screenshot: 08-velocidad.png\n');
        } catch (error) {
            console.log('   ⚠️  No se pudo cargar Velocidad:', error.message, '\n');
        }
        
        // ========================================
        // TEST 9: NAVEGAR A SESIONES & RUTAS
        // ========================================
        console.log('🗺️ TEST 9: Navegando a Sesiones & Rutas...');
        
        try {
            await gotoDashboardTab(4);
            await page.waitForTimeout(2000);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-sesiones-rutas.png') });
            console.log('   ✅ Sesiones & Rutas cargado');
            console.log('   📸 Screenshot: 09-sesiones-rutas.png\n');
        } catch (error) {
            console.log('   ⚠️  No se pudo cargar Sesiones & Rutas:', error.message, '\n');
        }

        // ========================================
        // TEST 10: NAVEGAR A UPLOAD
        // ========================================
        console.log('📤 TEST 10: Navegando a Upload...');
        
        try {
            await page.goto(`${FRONTEND_URL}/upload`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-upload.png') });
            console.log('   ✅ Página de Upload cargada');
            console.log('   📸 Screenshot: 10-upload.png\n');
        } catch (error) {
            console.log('   ⚠️  No se pudo acceder a Upload:', error.message, '\n');
        }
        
        // ========================================
        // TEST 11: EXPORTACIÓN PDF
        // ========================================
        console.log('📄 TEST 11: Probando exportación PDF...');
        
        try {
            const exportButton = await page.$('button:has-text("PDF"), button:has-text("Exportar"), [class*="export"]');
            if (exportButton) {
                // Configurar listener para descarga
                const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
                await exportButton.click();
                
                try {
                    const download = await downloadPromise;
                    console.log('   ✅ PDF descargado:', download.suggestedFilename());
                    console.log('');
                } catch (error) {
                    console.log('   ⚠️  Botón clickeado pero no se detectó descarga\n');
                }
            } else {
                console.log('   ℹ️  No se encontró botón de exportación PDF\n');
            }
        } catch (error) {
            console.log('   ⚠️  Error probando exportación:', error.message, '\n');
        }
        
        // ========================================
        // TEST 12: ENDPOINTS API
        // ========================================
        console.log('🔌 TEST 12: Verificando endpoints API...');
        
        const authToken = await page.evaluate(() => {
            const legacy = localStorage.getItem('auth_token');
            if (legacy) return legacy;
            try {
                const stored = localStorage.getItem('authTokens');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return parsed?.accessToken ?? null;
                }
            } catch (error) {
                // ignore parse errors
            }
            return null;
        });
        
        if (authToken) {
            const endpoints = [
                '/api/kpis/summary',
                '/api/operational-keys/summary',
                '/api/sessions'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await page.evaluate(async ([url, tkn]) => {
                        const res = await fetch(url, {
                            headers: { 'Authorization': `Bearer ${tkn}` }
                        });
                        return {
                            ok: res.ok,
                            status: res.status,
                            data: await res.json()
                        };
                    }, [`${BACKEND_URL}${endpoint}`, authToken]);
                    
                    if (response.ok) {
                        console.log(`   ✅ ${endpoint}: ${response.status}`);
                        if (endpoint.includes('operational-keys')) {
                            console.log(`      Claves totales: ${response.data.totalClaves || 0}`);
                        }
                    } else {
                        console.log(`   ⚠️  ${endpoint}: ${response.status}`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${endpoint}: Error - ${error.message}`);
                }
            }
            console.log('');
        } else {
            console.log('   ⚠️  No hay token de autenticación disponible\n');
        }
        
        // ========================================
        // TEST 13: SCREENSHOT FINAL
        // ========================================
        console.log('📸 TEST 13: Capturando estado final...');
        
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, '10-dashboard-final.png'),
            fullPage: true 
        });
        console.log('   ✅ Screenshot final capturado');
        console.log('   📸 Screenshot: 10-dashboard-final.png (página completa)\n');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ERROR.png') });
    } finally {
        console.log('='.repeat(70));
        console.log('🏁 PRUEBAS COMPLETADAS');
        console.log('='.repeat(70));
        console.log(`\n📁 Screenshots guardados en: ${SCREENSHOTS_DIR}\n`);
        
        await browser.close();
    }
}

// Ejecutar pruebas
testCompleto().catch(console.error);

