/**
 * VERIFICACIÓN COMPLETA DE LAS 3 PESTAÑAS
 * Con método robusto de login
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:9998';
const SCREENSHOTS_DIR = path.join(__dirname, 'verificacion-completa');

const TEST_USER = {
    email: 'antoniohermoso92@gmail.com',
    password: 'admin123'
};

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

async function verificarPestanasCompleto() {
    console.log('\n' + '='.repeat(90));
    console.log('✅ VERIFICACIÓN COMPLETA DE PESTAÑAS CON DATOS');
    console.log('='.repeat(90) + '\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1500,
        args: ['--start-maximized']
    });
    const context = await browser.newContext({ 
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    let peticionesHechas = [];
    
    // Capturar peticiones
    page.on('request', req => {
        if (req.url().includes('/api/hotspots') || req.url().includes('/api/speed') || req.url().includes('/api/operational-keys')) {
            peticionesHechas.push({
                tipo: req.url().includes('hotspots') ? 'Puntos Negros' : 
                      req.url().includes('speed') ? 'Velocidad' : 'Claves',
                url: req.url(),
                organizationId: req.url().match(/organizationId=([^&]+)/)?.[1] || 'NO ENVIADO'
            });
            console.log(`\n📡 REQUEST a ${req.url().includes('hotspots') ? 'PUNTOS NEGROS' : req.url().includes('speed') ? 'VELOCIDAD' : 'CLAVES'}`);
            const orgMatch = req.url().match(/organizationId=([^&]+)/);
            if (orgMatch) {
                console.log(`   OrganizationId: ${orgMatch[1]}`);
            }
        }
    });
    
    // Capturar respuestas
    page.on('response', async resp => {
        if (resp.url().includes('/api/hotspots') || resp.url().includes('/api/speed')) {
            console.log(`📥 RESPONSE: Status ${resp.status()}`);
            try {
                const json = await resp.json();
                if (json.data?.clusters) {
                    console.log(`   ✅ DATOS RECIBIDOS: ${json.data.clusters.length} clusters, ${json.data.total_events || 0} eventos`);
                }
                if (json.data?.violations) {
                    console.log(`   ✅ DATOS RECIBIDOS: ${json.data.violations.length} violaciones`);
                }
                if (json.data?.totalClusters !== undefined) {
                    console.log(`   ✅ Total Clusters: ${json.data.totalClusters}`);
                }
            } catch (e) {}
        }
    });
    
    try {
        // ========================================
        // FASE 1: LOGIN ROBUSTO
        // ========================================
        console.log('🔐 FASE 1: LOGIN\n');
        await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(4000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00-pagina-login.png') });
        
        // Método robusto: Buscar inputs por tipo
        console.log('   Llenando formulario...');
        const emailInput = await page.$('input[type="text"], input[type="email"]');
        if (emailInput) {
            await emailInput.click({ clickCount: 3 });
            await emailInput.fill(TEST_USER.email);
            console.log(`   ✅ Email: ${TEST_USER.email}`);
        }
        
        await page.waitForTimeout(1000);
        
        const passwordInput = await page.$('input[type="password"]');
        if (passwordInput) {
            await passwordInput.click({ clickCount: 3 });
            await passwordInput.fill(TEST_USER.password);
            console.log('   ✅ Password ingresado');
        }
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-formulario-lleno.png') });
        
        // Click en botón LOGIN
        console.log('   Buscando botón de login...');
        const buttonSelectors = [
            'button:has-text("LOGIN_BUTTON")',
            'button:has-text("Iniciar")',
            'button[type="submit"]',
            'button'
        ];
        
        let loginClicked = false;
        for (const selector of buttonSelectors) {
            try {
                await page.click(selector, { timeout: 2000 });
                console.log(`   ✅ Click en botón: ${selector}`);
                loginClicked = true;
                break;
            } catch (e) {
                // Intentar siguiente selector
            }
        }
        
        if (!loginClicked) {
            console.log('   ❌ No se pudo hacer click en botón de login');
            await browser.close();
            return;
        }
        
        // Esperar navegación
        console.log('   Esperando respuesta del servidor...');
        await page.waitForTimeout(15000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-despues-login.png') });
        
        // Verificar autenticación
        const authStatus = await page.evaluate(() => {
            const user = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            let userData = null;
            try {
                userData = user ? JSON.parse(user) : null;
            } catch (e) {}
            
            return {
                tieneToken: !!token,
                tieneUser: !!userData,
                organizationId: userData?.organizationId || null,
                email: userData?.email || null,
                enDashboard: document.body.textContent.includes('Panel de Control') || 
                             document.body.textContent.includes('Horas de Conducción')
            };
        });
        
        console.log('\n   📋 ESTADO DE AUTENTICACIÓN:');
        console.log(`   Token: ${authStatus.tieneToken ? '✅' : '❌'}`);
        console.log(`   User: ${authStatus.tieneUser ? '✅' : '❌'}`);
        console.log(`   OrganizationId: ${authStatus.organizationId || '❌ NO DISPONIBLE'}`);
        console.log(`   En Dashboard: ${authStatus.enDashboard ? '✅' : '❌'}`);
        console.log('');
        
        if (!authStatus.tieneUser || !authStatus.organizationId) {
            console.log('❌ LOGIN FALLÓ - No hay datos de usuario\n');
            console.log('📸 Revisa screenshots en:', SCREENSHOTS_DIR);
            await browser.close();
            return;
        }
        
        console.log(`✅ LOGIN EXITOSO - OrganizationId: ${authStatus.organizationId}\n`);
        
        // ========================================
        // FASE 2: PUNTOS NEGROS
        // ========================================
        console.log('='.repeat(90));
        console.log('🗺️  FASE 2: PUNTOS NEGROS');
        console.log('='.repeat(90) + '\n');
        
        // Asegurar que estamos en Panel de Control
        await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                if (el.textContent?.includes('Panel de Control') && el.offsetParent !== null) {
                    el.click();
                    break;
                }
            }
        });
        await page.waitForTimeout(2000);
        
        // Click en Puntos Negros
        console.log('   Haciendo click en "Puntos Negros"...');
        const clickedPN = await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('button, div, [role="button"]'));
            for (const el of elementos) {
                if (el.textContent?.trim() === 'Puntos Negros' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (!clickedPN) {
            console.log('   ⚠️  No se encontró la pestaña "Puntos Negros"\n');
        } else {
            console.log('   ✅ Click exitoso');
            console.log('   Esperando carga de datos...\n');
            await page.waitForTimeout(10000);
            
            await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, '03-puntos-negros.png'),
                fullPage: true 
            });
            
            // Extraer KPIs
            const kpis = await page.evaluate(() => {
                const text = document.body.textContent || '';
                
                // Buscar números después de cada label
                const extractNum = (label) => {
                    const patterns = [
                        new RegExp(label + '[^\\d]*(\\d+)', 'i'),
                        new RegExp(label + '\\s*:\\s*(\\d+)', 'i'),
                        new RegExp(label + '\\s+(\\d+)', 'i')
                    ];
                    
                    for (const pattern of patterns) {
                        const match = text.match(pattern);
                        if (match) return match[1];
                    }
                    return '0';
                };
                
                return {
                    totalClusters: extractNum('Total Clusters'),
                    totalEventos: extractNum('Total Eventos'),
                    graves: extractNum('Graves'),
                    moderadas: extractNum('Moderadas'),
                    leves: extractNum('Leves'),
                    hayMapa: document.querySelector('.leaflet-container, [class*="leaflet"]') !== null
                };
            });
            
            console.log('   📊 KPIs MOSTRADOS:');
            console.log(`      Total Clusters: ${kpis.totalClusters}`);
            console.log(`      Total Eventos: ${kpis.totalEventos}`);
            console.log(`      Graves: ${kpis.graves}`);
            console.log(`      Moderadas: ${kpis.moderadas}`);
            console.log(`      Leves: ${kpis.leves}`);
            console.log(`      Mapa Leaflet: ${kpis.hayMapa ? '✅' : '❌'}`);
            
            if (kpis.totalClusters !== '0' || kpis.totalEventos !== '0') {
                console.log(`\n   ✅✅✅ PUNTOS NEGROS MUESTRA DATOS REALES ✅✅✅\n`);
            } else {
                console.log(`\n   ⚠️  Puntos Negros muestra 0 (verificar peticiones)\n`);
            }
        }
        
        // ========================================
        // FASE 3: VELOCIDAD
        // ========================================
        console.log('='.repeat(90));
        console.log('🚗 FASE 3: VELOCIDAD');
        console.log('='.repeat(90) + '\n');
        
        console.log('   Haciendo click en "Velocidad"...');
        const clickedVel = await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('button, div, [role="button"]'));
            for (const el of elementos) {
                if (el.textContent?.trim() === 'Velocidad' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (!clickedVel) {
            console.log('   ⚠️  No se encontró la pestaña "Velocidad"\n');
        } else {
            console.log('   ✅ Click exitoso');
            console.log('   Esperando carga de datos...\n');
            await page.waitForTimeout(10000);
            
            await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, '04-velocidad.png'),
                fullPage: true 
            });
            
            // Extraer KPIs
            const kpis = await page.evaluate(() => {
                const text = document.body.textContent || '';
                
                const extractNum = (label) => {
                    const patterns = [
                        new RegExp(label + '[^\\d]*(\\d+)', 'i'),
                        new RegExp(label + '\\s*:\\s*(\\d+)', 'i')
                    ];
                    
                    for (const pattern of patterns) {
                        const match = text.match(pattern);
                        if (match) return match[1];
                    }
                    return '0';
                };
                
                return {
                    total: extractNum('Total:'),
                    graves: extractNum('Graves'),
                    leves: extractNum('Leves'),
                    correctos: extractNum('Correctos'),
                    hayMapa: document.querySelector('.leaflet-container, [class*="leaflet"]') !== null
                };
            });
            
            console.log('   📊 KPIs MOSTRADOS:');
            console.log(`      Total: ${kpis.total}`);
            console.log(`      Graves: ${kpis.graves}`);
            console.log(`      Leves: ${kpis.leves}`);
            console.log(`      Correctos: ${kpis.correctos}`);
            console.log(`      Mapa Leaflet: ${kpis.hayMapa ? '✅' : '❌'}`);
            
            if (kpis.total !== '0' || kpis.graves !== '0' || kpis.leves !== '0') {
                console.log(`\n   ✅✅✅ VELOCIDAD MUESTRA DATOS REALES ✅✅✅\n`);
            } else {
                console.log(`\n   ⚠️  Velocidad muestra 0 (verificar peticiones)\n`);
            }
        }
        
        // ========================================
        // FASE 4: CLAVES OPERACIONALES
        // ========================================
        console.log('='.repeat(90));
        console.log('🔑 FASE 4: CLAVES OPERACIONALES');
        console.log('='.repeat(90) + '\n');
        
        console.log('   Haciendo click en "Claves Operacionales"...');
        const clickedClaves = await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('button, div, [role="button"]'));
            for (const el of elementos) {
                if (el.textContent?.trim() === 'Claves Operacionales' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (!clickedClaves) {
            console.log('   ⚠️  No se encontró la pestaña "Claves Operacionales"\n');
        } else {
            console.log('   ✅ Click exitoso');
            console.log('   Esperando carga...\n');
            await page.waitForTimeout(8000);
            
            await page.screenshot({ 
                path: path.join(SCREENSHOTS_DIR, '05-claves-operacionales.png'),
                fullPage: true 
            });
            
            // Verificar mensaje
            const estado = await page.evaluate(() => {
                const text = document.body.textContent || '';
                return {
                    hayError: text.includes('Error cargando'),
                    hayMensajeSinDatos: text.includes('No hay claves') || text.includes('periodo seleccionado'),
                    totalClaves: (text.match(/Total.*claves[^\d]*(\d+)/i) || [])[1] || '0'
                };
            });
            
            console.log('   📊 ESTADO:');
            console.log(`      Hay error: ${estado.hayError ? '❌ SÍ' : '✅ NO'}`);
            console.log(`      Mensaje sin datos: ${estado.hayMensajeSinDatos ? '✅ SÍ (esperado)' : 'NO'}`);
            console.log(`      Total Claves: ${estado.totalClaves}`);
            
            if (!estado.hayError) {
                console.log(`\n   ✅✅✅ CLAVES OPERACIONALES FUNCIONA SIN ERRORES ✅✅✅\n`);
            } else {
                console.log(`\n   ⚠️  Claves Operacionales muestra error\n`);
            }
        }
        
        // ========================================
        // RESUMEN FINAL
        // ========================================
        console.log('='.repeat(90));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(90) + '\n');
        
        console.log(`📡 Peticiones realizadas: ${peticionesHechas.length}\n`);
        peticionesHechas.forEach((p, i) => {
            console.log(`   ${i+1}. ${p.tipo}`);
            console.log(`      OrganizationId enviado: ${p.organizationId}`);
        });
        
        console.log(`\n📁 Screenshots guardados en: ${SCREENSHOTS_DIR}\n`);
        console.log('='.repeat(90));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ERROR.png') });
    } finally {
        console.log('\n⏸️  Navegador quedará abierto 10 segundos para inspección visual...\n');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

verificarPestanasCompleto().catch(console.error);

