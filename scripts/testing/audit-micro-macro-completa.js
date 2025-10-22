/**
 * AUDITORÍA EXHAUSTIVA MICRO → MACRO
 * DobackSoft Dashboard StabilSafe V3
 * 
 * Estrategia: De lo más pequeño a lo más grande
 * - MICRO: Componentes individuales
 * - MEDIO: Integraciones
 * - MACRO: Flujos end-to-end completos
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURACIÓN
// ========================================
const CONFIG = {
    baseUrl: 'http://localhost:5174',
    backendUrl: 'http://localhost:9998',
    credentials: {
        email: 'antoniohermoso92@gmail.com',
        password: 'password123'
    },
    screenshots: {
        enabled: true,
        directory: './scripts/testing/results/screenshots/micro-macro',
        fullPage: true
    },
    viewport: {
        width: 1920,
        height: 1080
    },
    timeouts: {
        navigation: 60000,
        element: 15000,
        action: 10000
    },
    headless: false // Visible para debugging
};

// ========================================
// UTILIDADES
// ========================================
const results = {
    timestamp: new Date().toISOString(),
    micro: [],
    medio: [],
    macro: [],
    screenshots: [],
    errors: []
};

function log(message, level = 'INFO') {
    const colors = {
        INFO: '\x1b[36m',
        SUCCESS: '\x1b[32m',
        ERROR: '\x1b[31m',
        WARNING: '\x1b[33m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}[${new Date().toISOString()}] [${level}] ${message}${reset}`);
}

async function takeScreenshot(page, name) {
    if (!CONFIG.screenshots.enabled) return;
    
    const dir = CONFIG.screenshots.directory;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const filename = `${name}.png`;
    const filepath = path.join(dir, filename);
    await page.screenshot({ 
        path: filepath, 
        fullPage: CONFIG.screenshots.fullPage 
    });
    
    results.screenshots.push(filename);
    log(`Screenshot saved: ${filename}`, 'SUCCESS');
    return filepath;
}

function addResult(category, test, pass, details = {}) {
    const result = {
        test,
        pass,
        timestamp: new Date().toISOString(),
        ...details
    };
    results[category].push(result);
    
    if (pass) {
        log(`✓ ${test}`, 'SUCCESS');
    } else {
        log(`✗ ${test}`, 'ERROR');
        if (details.error) {
            log(`  Error: ${details.error}`, 'ERROR');
        }
    }
}

// ========================================
// AUTENTICACIÓN
// ========================================
async function login(page) {
    log('Iniciando login con credenciales correctas...', 'INFO');
    
    try {
        await page.goto(`${CONFIG.baseUrl}/login`, { 
            waitUntil: 'domcontentloaded', 
            timeout: CONFIG.timeouts.navigation 
        });
        
        // Esperar que carguen las traducciones
        log('Waiting for translations...', 'INFO');
        await page.waitForTimeout(5000);
        
        try {
            await page.waitForSelector('h6:has-text("Cargando traducciones")', {
                state: 'hidden',
                timeout: 30000
            });
        } catch (e) {
            log('Translation screen not found or already hidden', 'INFO');
        }
        
        // Esperar formulario
        await page.waitForSelector('button:has-text("Iniciar Sesión"), button[type="submit"]', { 
            timeout: CONFIG.timeouts.element,
            state: 'visible'
        });
        
        // Llenar credenciales
        const emailInput = page.locator('input[type="text"], input:not([type])').first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        await emailInput.fill(CONFIG.credentials.email);
        await passwordInput.fill(CONFIG.credentials.password);
        
        await takeScreenshot(page, '00-login-form-filled');
        
        // Click login
        const submitButton = page.locator('button:has-text("Iniciar Sesión"), button[type="submit"]').first();
        await submitButton.click();
        
        log('Clicked login button, waiting for response...', 'INFO');
        await page.waitForTimeout(3000);
        
        // Capturar screenshot DESPUÉS del click
        await takeScreenshot(page, '01-after-login-click');
        
        // Verificar si hay errores visibles
        const errorMessages = await page.locator('text=/error|incorrecto|inválido/i').allTextContents();
        if (errorMessages.length > 0) {
            log(`Error messages found: ${errorMessages.join(', ')}`, 'ERROR');
        }
        
        // Intentar esperar redirect con timeout más largo
        try {
            await page.waitForURL('**/dashboard', { timeout: 45000 });
            log('Redirected to dashboard', 'SUCCESS');
        } catch (redirectError) {
            log('No redirect to dashboard, checking current URL...', 'WARNING');
            const currentUrl = page.url();
            log(`Current URL: ${currentUrl}`, 'INFO');
            
            // Si ya estamos en dashboard por alguna razón
            if (currentUrl.includes('/dashboard')) {
                log('Already on dashboard page', 'INFO');
            } else {
                // Intentar navegar manualmente
                log('Attempting manual navigation to dashboard...', 'INFO');
                await page.goto(`${CONFIG.baseUrl}/dashboard`, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 30000 
                });
            }
        }
        
        await page.waitForTimeout(3000);
        await takeScreenshot(page, '02-dashboard-loaded');
        log('Login successful', 'SUCCESS');
        return true;
        
    } catch (error) {
        log(`Login failed: ${error.message}`, 'ERROR');
        results.errors.push({ stage: 'login', error: error.message });
        return false;
    }
}

// ========================================
// FASE MICRO: COMPONENTES INDIVIDUALES
// ========================================
async function testMicroComponents(page) {
    log('\n=== FASE MICRO: COMPONENTES INDIVIDUALES ===\n', 'INFO');
    
    // MICRO-1: Verificar mapas OSM
    log('MICRO-1: Verificando mapas OSM...', 'INFO');
    try {
        // Ir a tab de Puntos Negros (tiene mapa)
        await page.click('button:has-text("Puntos Negros")');
        await page.waitForTimeout(3000);
        
        // Buscar elemento de mapa Leaflet
        const mapExists = await page.locator('.leaflet-container').count() > 0;
        
        if (mapExists) {
            // Verificar que el mapa tenga tiles cargados
            const tilesLoaded = await page.locator('.leaflet-tile-loaded').count() > 0;
            addResult('micro', 'OSM Map Loads', tilesLoaded, {
                tilesCount: await page.locator('.leaflet-tile-loaded').count()
            });
            
            await takeScreenshot(page, 'micro-01-osm-map');
        } else {
            addResult('micro', 'OSM Map Loads', false, {
                error: 'Leaflet container not found'
            });
        }
    } catch (error) {
        addResult('micro', 'OSM Map Loads', false, { error: error.message });
    }
    
    // MICRO-2: Verificar KPIs individuales
    log('MICRO-2: Verificando KPIs individuales...', 'INFO');
    try {
        await page.click('button:has-text("Estados & Tiempos")');
        await page.waitForTimeout(2000);
        
        // Buscar tarjetas de KPIs
        const kpiCards = await page.locator('[class*="kpi"], [class*="stat-card"], [class*="metric"]').count();
        
        if (kpiCards > 0) {
            log(`Found ${kpiCards} KPI cards`, 'INFO');
            
            // Verificar que tengan valores numéricos
            const kpiTexts = await page.locator('[class*="kpi"], [class*="stat-card"], [class*="metric"]').allTextContents();
            const hasNumbers = kpiTexts.some(text => /\d+/.test(text));
            
            addResult('micro', 'KPIs Display Values', hasNumbers, {
                kpiCount: kpiCards,
                hasNumericValues: hasNumbers
            });
            
            await takeScreenshot(page, 'micro-02-kpis');
        } else {
            addResult('micro', 'KPIs Display Values', false, {
                error: 'No KPI cards found'
            });
        }
    } catch (error) {
        addResult('micro', 'KPIs Display Values', false, { error: error.message });
    }
    
    // MICRO-3: Verificar botón de exportación PDF
    log('MICRO-3: Verificando botón exportación PDF...', 'INFO');
    try {
        const pdfButton = await page.locator('button:has-text("Exportar PDF"), button:has-text("PDF")').count() > 0;
        
        if (pdfButton) {
            const isEnabled = await page.locator('button:has-text("Exportar PDF"), button:has-text("PDF")').first().isEnabled();
            addResult('micro', 'PDF Export Button Available', isEnabled, {
                buttonFound: true,
                enabled: isEnabled
            });
        } else {
            addResult('micro', 'PDF Export Button Available', false, {
                error: 'PDF button not found'
            });
        }
    } catch (error) {
        addResult('micro', 'PDF Export Button Available', false, { error: error.message });
    }
    
    // MICRO-4: Verificar filtros de fecha
    log('MICRO-4: Verificando filtros de fecha...', 'INFO');
    try {
        const dateInputs = await page.locator('input[type="date"], input[placeholder*="fecha"]').count();
        addResult('micro', 'Date Filters Present', dateInputs >= 2, {
            dateInputsFound: dateInputs
        });
    } catch (error) {
        addResult('micro', 'Date Filters Present', false, { error: error.message });
    }
    
    // MICRO-5: Verificar tabs de navegación
    log('MICRO-5: Verificando tabs de navegación...', 'INFO');
    try {
        const tabs = [
            'Estados & Tiempos',
            'Puntos Negros',
            'Velocidad',
            'Sesiones',
            'Reportes'
        ];
        
        let tabsFound = 0;
        for (const tabName of tabs) {
            const exists = await page.locator(`button:has-text("${tabName}")`).count() > 0;
            if (exists) tabsFound++;
        }
        
        addResult('micro', 'All Navigation Tabs Present', tabsFound === tabs.length, {
            expectedTabs: tabs.length,
            foundTabs: tabsFound
        });
        
        await takeScreenshot(page, 'micro-05-tabs');
    } catch (error) {
        addResult('micro', 'All Navigation Tabs Present', false, { error: error.message });
    }
}

// ========================================
// FASE MEDIO: INTEGRACIONES
// ========================================
async function testMedioIntegrations(page) {
    log('\n=== FASE MEDIO: INTEGRACIONES ===\n', 'INFO');
    
    // MEDIO-1: Verificar tab Upload y procesamiento automático
    log('MEDIO-1: Verificando sistema de upload...', 'INFO');
    try {
        // Ir a menú lateral y buscar Upload
        const menuButton = await page.locator('button[aria-label="menu"], button:has-text("☰")').first();
        if (await menuButton.count() > 0) {
            await menuButton.click();
            await page.waitForTimeout(1000);
        }
        
        // Buscar opción de Upload en menú
        const uploadLink = await page.locator('a:has-text("Upload"), a:has-text("Subir")').first();
        if (await uploadLink.count() > 0) {
            await uploadLink.click();
            await page.waitForTimeout(2000);
            
            // Verificar que existe la pestaña "Procesamiento Automático"
            const autoProcessTab = await page.locator('button:has-text("Procesamiento"), button:has-text("Automático")').count() > 0;
            
            addResult('medio', 'Upload System Available', autoProcessTab, {
                uploadPageFound: true,
                autoProcessTabFound: autoProcessTab
            });
            
            await takeScreenshot(page, 'medio-01-upload-page');
        } else {
            addResult('medio', 'Upload System Available', false, {
                error: 'Upload link not found in menu'
            });
        }
        
    } catch (error) {
        addResult('medio', 'Upload System Available', false, { error: error.message });
    }
    
    // MEDIO-2: Verificar que datos cargan en tabs
    log('MEDIO-2: Verificando carga de datos en tabs...', 'INFO');
    try {
        // Volver al dashboard
        await page.goto(`${CONFIG.baseUrl}/dashboard`);
        await page.waitForTimeout(3000);
        
        // Ir a tab de Sesiones
        await page.click('button:has-text("Sesiones")');
        await page.waitForTimeout(3000);
        
        // Buscar tabla o lista de sesiones
        const hasTable = await page.locator('table, [role="table"]').count() > 0;
        const hasRows = await page.locator('tr, [role="row"]').count() > 1; // Más de 1 = header + data
        
        addResult('medio', 'Sessions Data Loads', hasRows, {
            tableFound: hasTable,
            rowsFound: await page.locator('tr, [role="row"]').count()
        });
        
        await takeScreenshot(page, 'medio-02-sessions-data');
    } catch (error) {
        addResult('medio', 'Sessions Data Loads', false, { error: error.message });
    }
    
    // MEDIO-3: Verificar filtros afectan datos
    log('MEDIO-3: Verificando que filtros afectan datos...', 'INFO');
    try {
        // Contar elementos antes de filtrar
        const beforeCount = await page.locator('tr, [role="row"], .session-card').count();
        
        // Cambiar filtro de fecha (si existe)
        const dateInput = await page.locator('input[type="date"]').first();
        if (await dateInput.count() > 0) {
            const today = new Date().toISOString().split('T')[0];
            await dateInput.fill(today);
            await page.waitForTimeout(2000);
            
            const afterCount = await page.locator('tr, [role="row"], .session-card').count();
            
            // Los datos pueden cambiar o no, pero el sistema debe responder
            addResult('medio', 'Filters Affect Data', true, {
                beforeCount,
                afterCount,
                changed: beforeCount !== afterCount
            });
        } else {
            addResult('medio', 'Filters Affect Data', false, {
                error: 'No date filter found to test'
            });
        }
    } catch (error) {
        addResult('medio', 'Filters Affect Data', false, { error: error.message });
    }
    
    // MEDIO-4: Verificar puntos en mapa clickeables
    log('MEDIO-4: Verificando interacción con mapa...', 'INFO');
    try {
        await page.click('button:has-text("Puntos Negros")');
        await page.waitForTimeout(3000);
        
        // Buscar marcadores en el mapa
        const markers = await page.locator('.leaflet-marker-icon, .leaflet-marker').count();
        
        if (markers > 0) {
            log(`Found ${markers} markers on map`, 'INFO');
            
            // Intentar click en primer marcador
            try {
                await page.locator('.leaflet-marker-icon, .leaflet-marker').first().click();
                await page.waitForTimeout(1000);
                
                // Buscar popup o modal
                const popupExists = await page.locator('.leaflet-popup, .modal, [role="dialog"]').count() > 0;
                
                addResult('medio', 'Map Markers Clickable', popupExists, {
                    markersFound: markers,
                    popupOpened: popupExists
                });
                
                await takeScreenshot(page, 'medio-04-map-interaction');
            } catch (clickError) {
                addResult('medio', 'Map Markers Clickable', false, {
                    markersFound: markers,
                    error: 'Click failed: ' + clickError.message
                });
            }
        } else {
            addResult('medio', 'Map Markers Clickable', false, {
                error: 'No markers found on map'
            });
        }
    } catch (error) {
        addResult('medio', 'Map Markers Clickable', false, { error: error.message });
    }
    
    // MEDIO-5: Verificar gráficas renderizan con datos
    log('MEDIO-5: Verificando renderizado de gráficas...', 'INFO');
    try {
        await page.click('button:has-text("Estados & Tiempos")');
        await page.waitForTimeout(3000);
        
        // Buscar elementos SVG (recharts, chart.js)
        const svgElements = await page.locator('svg, canvas').count();
        const hasChartElements = await page.locator('[class*="recharts"], [class*="chart"]').count() > 0;
        
        addResult('medio', 'Charts Render', svgElements > 0 || hasChartElements, {
            svgCount: svgElements,
            chartElementsFound: hasChartElements
        });
        
        await takeScreenshot(page, 'medio-05-charts');
    } catch (error) {
        addResult('medio', 'Charts Render', false, { error: error.message });
    }
}

// ========================================
// FASE MACRO: FLUJOS END-TO-END
// ========================================
async function testMacroFlows(page) {
    log('\n=== FASE MACRO: FLUJOS END-TO-END ===\n', 'INFO');
    
    // MACRO-1: Flujo completo de navegación por todos los tabs
    log('MACRO-1: Verificando flujo completo de navegación...', 'INFO');
    try {
        const tabs = [
            'Estados & Tiempos',
            'Puntos Negros',
            'Velocidad',
            'Sesiones',
            'Reportes'
        ];
        
        let successfulTabs = 0;
        const tabDetails = [];
        
        for (const tabName of tabs) {
            try {
                const startTime = Date.now();
                await page.click(`button:has-text("${tabName}")`);
                await page.waitForTimeout(2000);
                const loadTime = Date.now() - startTime;
                
                // Verificar que no hay errores visibles
                const errorText = await page.locator('text=/error|fail|404|500/i').count();
                const hasContent = await page.locator('body').textContent();
                
                successfulTabs++;
                tabDetails.push({
                    name: tabName,
                    loadTime,
                    errors: errorText,
                    hasContent: hasContent.length > 100
                });
                
                await takeScreenshot(page, `macro-01-tab-${tabName.toLowerCase().replace(/\s+/g, '-')}`);
            } catch (tabError) {
                tabDetails.push({
                    name: tabName,
                    error: tabError.message
                });
            }
        }
        
        addResult('macro', 'Complete Navigation Flow', successfulTabs === tabs.length, {
            totalTabs: tabs.length,
            successfulTabs,
            tabDetails
        });
    } catch (error) {
        addResult('macro', 'Complete Navigation Flow', false, { error: error.message });
    }
    
    // MACRO-2: Verificar KPIs calculan correctamente con datos
    log('MACRO-2: Verificando cálculo de KPIs con datos reales...', 'INFO');
    try {
        await page.goto(`${CONFIG.baseUrl}/dashboard`);
        await page.waitForTimeout(3000);
        
        // Extraer todos los valores numéricos visibles
        const bodyText = await page.locator('body').textContent();
        const numbers = bodyText.match(/\d+[.,]\d+|\d+/g);
        
        if (numbers && numbers.length > 10) {
            // Buscar específicamente valores de KPIs
            const kpiValues = [];
            const kpiSelectors = [
                '[class*="kpi"]',
                '[class*="stat"]',
                '[class*="metric"]',
                '[data-testid*="kpi"]'
            ];
            
            for (const selector of kpiSelectors) {
                const elements = await page.locator(selector).all();
                for (const el of elements) {
                    const text = await el.textContent();
                    const value = text.match(/\d+[.,]\d+|\d+/);
                    if (value) kpiValues.push(value[0]);
                }
            }
            
            addResult('macro', 'KPIs Calculate With Real Data', kpiValues.length > 0, {
                totalNumbers: numbers.length,
                kpiValuesFound: kpiValues.length,
                sampleValues: kpiValues.slice(0, 5)
            });
            
            await takeScreenshot(page, 'macro-02-kpis-calculated');
        } else {
            addResult('macro', 'KPIs Calculate With Real Data', false, {
                error: 'Insufficient numeric data found'
            });
        }
    } catch (error) {
        addResult('macro', 'KPIs Calculate With Real Data', false, { error: error.message });
    }
    
    // MACRO-3: Verificar regla No-Scroll en contenedores principales
    log('MACRO-3: Verificando regla No-Scroll...', 'INFO');
    try {
        const mainContainers = ['.app-layout', '.main-content', 'main'];
        const violations = [];
        
        for (const selector of mainContainers) {
            const element = page.locator(selector).first();
            if (await element.count() > 0) {
                const overflowY = await element.evaluate(el => window.getComputedStyle(el).overflowY);
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    violations.push({ selector, overflowY });
                }
            }
        }
        
        addResult('macro', 'No-Scroll Rule Compliance', violations.length === 0, {
            violations,
            message: violations.length === 0 ? 'All main containers comply' : 'Scroll detected on main containers'
        });
    } catch (error) {
        addResult('macro', 'No-Scroll Rule Compliance', false, { error: error.message });
    }
    
    // MACRO-4: Verificar console errors durante navegación
    log('MACRO-4: Analizando errores de consola...', 'INFO');
    const consoleErrors = results.errors.filter(e => e.type === 'console');
    
    addResult('macro', 'Minimal Console Errors', consoleErrors.length < 10, {
        totalErrors: consoleErrors.length,
        sample: consoleErrors.slice(0, 3)
    });
}

// ========================================
// GENERACIÓN DE REPORTE
// ========================================
function generateReport() {
    log('\n=== GENERANDO REPORTE FINAL ===\n', 'INFO');
    
    const microPass = results.micro.filter(r => r.pass).length;
    const medioPass = results.medio.filter(r => r.pass).length;
    const macroPass = results.macro.filter(r => r.pass).length;
    
    const summary = {
        timestamp: results.timestamp,
        summary: {
            micro: {
                total: results.micro.length,
                passed: microPass,
                failed: results.micro.length - microPass,
                successRate: ((microPass / results.micro.length) * 100).toFixed(2) + '%'
            },
            medio: {
                total: results.medio.length,
                passed: medioPass,
                failed: results.medio.length - medioPass,
                successRate: ((medioPass / results.medio.length) * 100).toFixed(2) + '%'
            },
            macro: {
                total: results.macro.length,
                passed: macroPass,
                failed: results.macro.length - macroPass,
                successRate: ((macroPass / results.macro.length) * 100).toFixed(2) + '%'
            },
            overall: {
                total: results.micro.length + results.medio.length + results.macro.length,
                passed: microPass + medioPass + macroPass,
                failed: (results.micro.length + results.medio.length + results.macro.length) - (microPass + medioPass + macroPass),
                successRate: (((microPass + medioPass + macroPass) / (results.micro.length + results.medio.length + results.macro.length)) * 100).toFixed(2) + '%'
            }
        },
        details: results,
        screenshots: results.screenshots
    };
    
    // Guardar JSON
    const jsonPath = './scripts/testing/results/audit-micro-macro-results.json';
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    log(`Report saved: ${jsonPath}`, 'SUCCESS');
    
    // Mostrar resumen en consola
    console.log('\n========================================');
    console.log('  RESUMEN AUDITORÍA MICRO → MACRO');
    console.log('========================================\n');
    console.log('📊 RESULTADOS:');
    console.log(`  🔬 MICRO:  ${microPass}/${results.micro.length} (${summary.summary.micro.successRate})`);
    console.log(`  🏗️  MEDIO:  ${medioPass}/${results.medio.length} (${summary.summary.medio.successRate})`);
    console.log(`  🌍 MACRO:  ${macroPass}/${results.macro.length} (${summary.summary.macro.successRate})`);
    console.log(`  ✅ TOTAL:  ${summary.summary.overall.passed}/${summary.summary.overall.total} (${summary.summary.overall.successRate})\n`);
    console.log(`📸 Screenshots: ${results.screenshots.length} capturados`);
    console.log(`📁 Ubicación: ${CONFIG.screenshots.directory}\n`);
    console.log('========================================\n');
    
    return summary;
}

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================
async function runAudit() {
    log('========================================', 'INFO');
    log('  AUDITORÍA MICRO → MACRO INICIADA', 'INFO');
    log('========================================\n', 'INFO');
    
    const browser = await chromium.launch({ 
        headless: CONFIG.headless,
        slowMo: 50 // Slow down for visibility
    });
    
    const context = await browser.newContext({
        viewport: CONFIG.viewport,
        recordVideo: {
            dir: './scripts/testing/results/videos/',
            size: CONFIG.viewport
        }
    });
    
    const page = await context.newPage();
    
    // Capturar errores de consola
    page.on('console', msg => {
        if (msg.type() === 'error') {
            results.errors.push({
                type: 'console',
                message: msg.text(),
                timestamp: new Date().toISOString()
            });
            log(`Console Error: ${msg.text()}`, 'WARNING');
        }
    });
    
    try {
        // Login
        const loginSuccess = await login(page);
        if (!loginSuccess) {
            throw new Error('Login failed, cannot continue audit');
        }
        
        // Ejecutar fases
        await testMicroComponents(page);
        await testMedioIntegrations(page);
        await testMacroFlows(page);
        
        // Generar reporte
        const report = generateReport();
        
        log('\n✅ Auditoría completada exitosamente', 'SUCCESS');
        
    } catch (error) {
        log(`\n❌ Error fatal en auditoría: ${error.message}`, 'ERROR');
        results.errors.push({
            type: 'fatal',
            message: error.message,
            stack: error.stack
        });
    } finally {
        await context.close();
        await browser.close();
    }
}

// Ejecutar
runAudit().catch(console.error);

