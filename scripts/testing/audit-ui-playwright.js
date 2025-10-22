/**
 * audit-ui-playwright.js
 * AutomatizaciÃ³n de validaciÃ³n UI del Dashboard StabilSafe V3 usando Playwright
 * 
 * Requisitos:
 * - Node.js instalado
 * - npm install playwright
 * 
 * Uso:
 * node scripts/testing/audit-ui-playwright.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURACIÃ“N
// =============================================================================

const CONFIG = {
    baseUrl: 'http://localhost:5174',
    dashboardPath: '/dashboard',
    credentials: {
        email: 'test@bomberosmadrid.es',
        password: 'admin123'
    },
    screenshots: {
        enabled: true,
        directory: './scripts/testing/results/screenshots',
        fullPage: true
    },
    viewport: {
        width: 1920,
        height: 1080
    },
    timeouts: {
        navigation: 30000,
        element: 10000,
        action: 5000
    }
};

// =============================================================================
// UTILIDADES
// =============================================================================

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
        'INFO': '\x1b[36m',
        'SUCCESS': '\x1b[32m',
        'WARNING': '\x1b[33m',
        'ERROR': '\x1b[31m',
        'RESET': '\x1b[0m'
    };
    console.log(`${colors[level]}[${timestamp}] [${level}] ${message}${colors.RESET}`);
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`Created directory: ${dirPath}`, 'INFO');
    }
}

async function takeScreenshot(page, name, results) {
    if (!CONFIG.screenshots.enabled) return;
    
    try {
        const filename = `${name.replace(/\s+/g, '_').toLowerCase()}.png`;
        const filepath = path.join(CONFIG.screenshots.directory, filename);
        
        await page.screenshot({ 
            path: filepath, 
            fullPage: CONFIG.screenshots.fullPage 
        });
        
        log(`Screenshot saved: ${filename}`, 'SUCCESS');
        results.screenshots.push(filename);
    } catch (error) {
        log(`Failed to take screenshot ${name}: ${error.message}`, 'ERROR');
    }
}

async function checkForConsoleErrors(page, results) {
    const errors = [];
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            log(`Console Error: ${msg.text()}`, 'WARNING');
        }
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
        log(`Page Error: ${error.message}`, 'ERROR');
    });
    
    results.consoleErrors = errors;
}

// =============================================================================
// PRUEBAS
// =============================================================================

async function testLogin(page, results) {
    log('Testing login...', 'INFO');
    
    try {
        await page.goto(`${CONFIG.baseUrl}/login`, { 
            waitUntil: 'domcontentloaded', 
            timeout: CONFIG.timeouts.navigation 
        });
        
        // Esperar mensaje de carga de traducciones
        log('Waiting for translations to load...', 'INFO');
        await page.waitForTimeout(5000);
        
        // Esperar a que desaparezca el loading y aparezca el formulario
        try {
            await page.waitForSelector('h6:has-text("Cargando traducciones")', {
                state: 'hidden',
                timeout: 30000
            });
        } catch (e) {
            log('Translation loading screen not found or already hidden', 'INFO');
        }
        
        // Esperar a que cargue el formulario (tabs y botón)
        await page.waitForSelector('button:has-text("Iniciar Sesión"), button[type="submit"]', { 
            timeout: 30000,
            state: 'visible'
        });
        
        log('Login form loaded', 'INFO');
        
        // Material-UI TextField - llenar campos por índice
        const inputs = page.locator('input[type="text"], input:not([type])');
        const emailInput = inputs.first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        await emailInput.fill(CONFIG.credentials.email);
        await passwordInput.fill(CONFIG.credentials.password);
        
        log('Credentials filled', 'INFO');
        
        await takeScreenshot(page, 'login-form', results);
        
        await page.click('button[type="submit"]');
        
        log('Waiting for redirect to dashboard...', 'INFO');
        
        await page.waitForURL('**/dashboard', { 
            timeout: CONFIG.timeouts.navigation 
        });
        
        log('Login successful', 'SUCCESS');
        results.tests.login = { pass: true, error: null };
        return true;
    } catch (error) {
        log(`Login failed: ${error.message}`, 'ERROR');
        await takeScreenshot(page, 'login-error', results);
        results.tests.login = { pass: false, error: error.message };
        return false;
    }
}

async function testDashboardLoad(page, results) {
    log('Testing dashboard load...', 'INFO');
    
    try {
        const startTime = Date.now();
        
        await page.goto(`${CONFIG.baseUrl}${CONFIG.dashboardPath}`, {
            waitUntil: 'networkidle',
            timeout: CONFIG.timeouts.navigation
        });
        
        const loadTime = Date.now() - startTime;
        
        await takeScreenshot(page, 'dashboard-initial', results);
        
        log(`Dashboard loaded in ${loadTime}ms`, 'SUCCESS');
        results.tests.dashboardLoad = { 
            pass: true, 
            loadTimeMs: loadTime,
            threshold: 3000,
            meetsThreshold: loadTime < 3000,
            error: null 
        };
        
        return true;
    } catch (error) {
        log(`Dashboard load failed: ${error.message}`, 'ERROR');
        results.tests.dashboardLoad = { pass: false, loadTimeMs: 0, error: error.message };
        return false;
    }
}

async function testNoScrollOnMainContainer(page, results) {
    log('Testing no-scroll rule on main container...', 'INFO');
    
    try {
        // Buscar contenedor principal
        const mainSelectors = [
            '.app-layout',
            '.main-content',
            'main',
            '[role="main"]'
        ];
        
        let foundScroll = false;
        let scrollDetails = [];
        
        for (const selector of mainSelectors) {
            try {
                const element = await page.locator(selector).first();
                const count = await element.count();
                
                if (count > 0) {
                    const overflowY = await element.evaluate(el => 
                        window.getComputedStyle(el).overflowY
                    );
                    
                    log(`Checking ${selector}: overflow-y = ${overflowY}`, 'INFO');
                    scrollDetails.push({ selector, overflowY });
                    
                    if (overflowY === 'auto' || overflowY === 'scroll') {
                        foundScroll = true;
                        log(`âŒ FAIL: Found overflow-y: ${overflowY} on ${selector}`, 'ERROR');
                    }
                }
            } catch (err) {
                // Selector not found, continue
            }
        }
        
        if (!foundScroll) {
            log('âœ… PASS: No scroll detected on main containers', 'SUCCESS');
            results.tests.noScrollMainContainer = { 
                pass: true, 
                details: scrollDetails,
                error: null 
            };
        } else {
            results.tests.noScrollMainContainer = { 
                pass: false, 
                details: scrollDetails,
                error: 'Scroll detected on main container (violates StabilSafe V2 rule)' 
            };
        }
        
        return !foundScroll;
    } catch (error) {
        log(`No-scroll test failed: ${error.message}`, 'ERROR');
        results.tests.noScrollMainContainer = { pass: false, details: [], error: error.message };
        return false;
    }
}

async function testTabsLoad(page, results) {
    log('Testing tabs load...', 'INFO');
    
    const tabs = [
        { name: 'Estados & Tiempos', selector: 'button:has-text("Estados")' },
        { name: 'Puntos Negros', selector: 'button:has-text("Puntos Negros")' },
        { name: 'Velocidad', selector: 'button:has-text("Velocidad")' },
        { name: 'Sesiones', selector: 'button:has-text("Sesiones")' },
        { name: 'Reportes', selector: 'button:has-text("Reportes")' }
    ];
    
    results.tests.tabs = [];
    
    for (const tab of tabs) {
        try {
            log(`Testing tab: ${tab.name}`, 'INFO');
            
            const startTime = Date.now();
            
            // Click en la pestaÃ±a
            await page.click(tab.selector, { timeout: CONFIG.timeouts.element });
            
            // Esperar a que cargue contenido
            await page.waitForTimeout(2000);
            
            const loadTime = Date.now() - startTime;
            
            // Tomar screenshot
            await takeScreenshot(page, `tab-${tab.name}`, results);
            
            log(`Tab ${tab.name} loaded in ${loadTime}ms`, 'SUCCESS');
            
            results.tests.tabs.push({
                name: tab.name,
                pass: true,
                loadTimeMs: loadTime,
                error: null
            });
        } catch (error) {
            log(`Tab ${tab.name} failed: ${error.message}`, 'ERROR');
            results.tests.tabs.push({
                name: tab.name,
                pass: false,
                loadTimeMs: 0,
                error: error.message
            });
        }
    }
    
    const allPassed = results.tests.tabs.every(t => t.pass);
    return allPassed;
}

async function testGlobalFilters(page, results) {
    log('Testing global filters...', 'INFO');
    
    try {
        // Buscar el selector de vehÃ­culo
        const vehicleSelector = 'select[name="vehicle"], select[id*="vehicle"]';
        
        await page.waitForSelector(vehicleSelector, { 
            timeout: CONFIG.timeouts.element,
            state: 'visible'
        });
        
        // Obtener opciones de vehÃ­culos
        const options = await page.locator(`${vehicleSelector} option`).count();
        
        if (options > 1) {
            log(`Found ${options} vehicle options`, 'INFO');
            
            // Seleccionar un vehÃ­culo especÃ­fico (segunda opciÃ³n, primera es "Todos")
            await page.selectOption(vehicleSelector, { index: 1 });
            
            // Esperar a que se actualicen los datos
            await page.waitForTimeout(3000);
            
            await takeScreenshot(page, 'filter-vehicle-applied', results);
            
            log('Filter applied successfully', 'SUCCESS');
            results.tests.globalFilters = { pass: true, vehiclesFound: options, error: null };
            return true;
        } else {
            log('No vehicles found in selector', 'WARNING');
            results.tests.globalFilters = { pass: false, vehiclesFound: 0, error: 'No vehicles available' };
            return false;
        }
    } catch (error) {
        log(`Global filters test failed: ${error.message}`, 'WARNING');
        results.tests.globalFilters = { pass: false, vehiclesFound: 0, error: error.message };
        return false;
    }
}

async function testPDFExport(page, results) {
    log('Testing PDF export...', 'INFO');
    
    try {
        // Buscar botÃ³n de exportaciÃ³n PDF
        const pdfButtonSelectors = [
            'button:has-text("Exportar PDF")',
            'button:has-text("PDF")',
            'button[title*="PDF"]'
        ];
        
        let exportFound = false;
        
        for (const selector of pdfButtonSelectors) {
            try {
                const button = await page.locator(selector).first();
                const count = await button.count();
                
                if (count > 0) {
                    log(`Found PDF export button: ${selector}`, 'INFO');
                    exportFound = true;
                    break;
                }
            } catch (err) {
                // Continue
            }
        }
        
        if (exportFound) {
            log('PDF export button available', 'SUCCESS');
            results.tests.pdfExport = { pass: true, available: true, error: null };
            // No hacemos click para evitar descargas reales en modo automatizado
        } else {
            log('PDF export button not found', 'WARNING');
            results.tests.pdfExport = { pass: false, available: false, error: 'Export button not found' };
        }
        
        return exportFound;
    } catch (error) {
        log(`PDF export test failed: ${error.message}`, 'ERROR');
        results.tests.pdfExport = { pass: false, available: false, error: error.message };
        return false;
    }
}

// =============================================================================
// REPORTE
// =============================================================================

function generateReport(results) {
    const timestamp = new Date().toISOString();
    const reportPath = path.join(CONFIG.screenshots.directory, '..', 'ui-audit-results.json');
    
    const report = {
        timestamp,
        config: CONFIG,
        results: results,
        summary: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            successRate: 0
        }
    };
    
    // Calcular resumen
    const flatTests = [
        results.tests.login,
        results.tests.dashboardLoad,
        results.tests.noScrollMainContainer,
        results.tests.globalFilters,
        results.tests.pdfExport,
        ...results.tests.tabs
    ];
    
    report.summary.totalTests = flatTests.length;
    report.summary.passed = flatTests.filter(t => t && t.pass).length;
    report.summary.failed = report.summary.totalTests - report.summary.passed;
    report.summary.successRate = (report.summary.passed / report.summary.totalTests * 100).toFixed(2);
    
    // Guardar reporte JSON
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Report saved: ${reportPath}`, 'SUCCESS');
    
    // Mostrar resumen en consola
    console.log('\n========================================');
    console.log('  UI AUDIT SUMMARY');
    console.log('========================================\n');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed:      ${report.summary.passed} âœ…`);
    console.log(`Failed:      ${report.summary.failed} âŒ`);
    console.log(`Success Rate: ${report.summary.successRate}%\n`);
    
    if (results.consoleErrors.length > 0) {
        console.log(`âš ï¸  Console Errors Found: ${results.consoleErrors.length}`);
        results.consoleErrors.slice(0, 5).forEach(err => {
            console.log(`   - ${err}`);
        });
        if (results.consoleErrors.length > 5) {
            console.log(`   ... and ${results.consoleErrors.length - 5} more`);
        }
    }
    
    console.log('\n========================================\n');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    log('Starting UI audit with Playwright', 'INFO');
    
    // Preparar directorios
    ensureDirectoryExists(CONFIG.screenshots.directory);
    
    // Inicializar resultados
    const results = {
        tests: {},
        screenshots: [],
        consoleErrors: []
    };
    
    // Lanzar navegador
    const browser = await chromium.launch({ 
        headless: process.argv.includes('--headless'),
        slowMo: 100 
    });
    
    const context = await browser.newContext({
        viewport: CONFIG.viewport,
        ignoreHTTPSErrors: true
    });
    
    const page = await context.newPage();
    
    // Capturar errores de consola
    checkForConsoleErrors(page, results);
    
    try {
        // Ejecutar pruebas
        const loginSuccess = await testLogin(page, results);
        if (!loginSuccess) {
            log('Cannot continue without successful login', 'ERROR');
            await browser.close();
            process.exit(1);
        }
        
        await testDashboardLoad(page, results);
        await testNoScrollOnMainContainer(page, results);
        await testTabsLoad(page, results);
        await testGlobalFilters(page, results);
        await testPDFExport(page, results);
        
        // Generar reporte
        generateReport(results);
        
        log('UI audit completed', 'SUCCESS');
    } catch (error) {
        log(`Audit failed with error: ${error.message}`, 'ERROR');
        console.error(error);
    } finally {
        await browser.close();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };


