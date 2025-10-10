const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuración
const TEST_TIMEOUT = 30000; // 30 segundos
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Asegurar que el directorio de screenshots existe
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

// Función para tomar screenshot
async function takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot guardado: ${filepath}`);
}

// Función para validar el dashboard
async function validateDashboard(page) {
    try {
        console.log('🔍 Validando dashboard...');
        
        // Verificar que estamos en la página correcta
        const currentUrl = page.url();
        console.log('📍 URL actual:', currentUrl);
        
        if (!currentUrl.includes('/dashboard')) {
            throw new Error(`URL incorrecta: ${currentUrl}`);
        }
        
        // Esperar a que el contenido del dashboard esté visible
        await page.waitForSelector('[data-testid="dashboard-content"]', { 
            state: 'visible',
            timeout: TEST_TIMEOUT 
        });
        
        // Esperar a que los datos se carguen o muestre el error
        await Promise.race([
            page.waitForSelector('.grid', { 
                state: 'visible',
                timeout: TEST_TIMEOUT 
            }),
            page.waitForSelector('[role="alert"]', {
                state: 'visible',
                timeout: TEST_TIMEOUT
            })
        ]);
        
        console.log('✅ Dashboard validado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al validar dashboard:', error);
        await takeScreenshot(page, 'error');
        throw error;
    }
}

// Función para realizar el login
async function performLogin(page) {
    try {
        console.log('🔑 Iniciando proceso de login...');
        
        // Esperar a que la página de login esté lista
        await page.waitForLoadState('networkidle');
        
        // Verificar que estamos en la página de login
        const currentUrl = page.url();
        console.log('📍 URL actual:', currentUrl);
        
        if (!currentUrl.includes('/login')) {
            throw new Error(`URL incorrecta: ${currentUrl}`);
}

        // Limpiar localStorage antes de intentar el login
        await page.evaluate(() => {
            localStorage.clear();
        });
        
        // Esperar a que los campos estén disponibles
        await page.waitForSelector('input[name="email"]', { state: 'visible' });
        await page.waitForSelector('input[name="password"]', { state: 'visible' });
        
        // Ingresar credenciales
        await page.fill('input[name="email"]', 'admin@cosigein.com');
        await page.fill('input[name="password"]', 'admin123');
        
        // Hacer clic en el botón de login
        await page.click('button[type="submit"]');
        
        // Esperar a que la navegación se complete y la URL cambie
        await page.waitForURL('**/dashboard', { timeout: TEST_TIMEOUT });
        await page.waitForLoadState('networkidle');
        
        console.log('✅ Login completado');
        return true;
    } catch (error) {
        console.error('❌ Error durante el login:', error);
        await takeScreenshot(page, 'login-error');
        throw error;
    }
}

// Función principal de prueba
async function testBrowserLogin() {
    let browser;
    try {
        console.log('🚀 Iniciando prueba de navegador...');
        
        // Iniciar el navegador
        browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox']
        });

        // Crear un nuevo contexto
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        
        // Crear una nueva página
        const page = await context.newPage();
        
        // Configurar el manejador de errores de la consola
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            console.log(`[${type.toUpperCase()}] ${text}`);
        });
        
        // Configurar el manejador de errores de la página
        page.on('pageerror', error => {
            console.error('❌ Error en la página:', error);
        });
        
        // Configurar el manejador de errores de la petición
        page.on('requestfailed', request => {
            console.error('❌ Error en la petición:', request.url(), '\n   Método:', request.method(), '\n   Estado:', request.failure().errorText);
        });
            
        // Navegar a la página de login
        console.log('🌐 Navegando a la página de login...');
        await page.goto('http://localhost:5174/login', {
            waitUntil: 'networkidle',
            timeout: TEST_TIMEOUT
        });
        
        // Realizar el login
        await performLogin(page);

        // Validar el dashboard
        await validateDashboard(page);

        // Tomar screenshot del dashboard
        await takeScreenshot(page, 'dashboard');
        
        console.log('✅ Prueba completada exitosamente');
    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
        throw error;
    } finally {
        if (browser) {
            console.log('🔒 Navegador cerrado');
            await browser.close();
        }
    }
}

// Ejecutar la prueba
testBrowserLogin().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
}); 