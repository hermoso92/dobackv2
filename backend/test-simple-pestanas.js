/**
 * TEST SIMPLE - QUÉ PESTAÑAS HAY VISIBLES
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5174';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-simple');

const TEST_USER = {
    email: 'antoniohermoso92@gmail.com',
    password: 'admin123'
};

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

async function testSimple() {
    console.log('\n🔍 TEST SIMPLE DE PESTAÑAS\n');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    // Capturar requests
    page.on('request', req => {
        if (req.url().includes('hotspots') || req.url().includes('speed') || req.url().includes('operational-keys')) {
            console.log(`📡 REQUEST: ${req.method()} ${req.url()}`);
        }
    });
    
    page.on('response', async resp => {
        if (resp.url().includes('hotspots') || resp.url().includes('speed') || resp.url().includes('operational-keys')) {
            console.log(`📥 RESPONSE: ${resp.status()} ${resp.url()}`);
            try {
                const json = await resp.json();
                console.log(`   Success: ${json.success}, Data keys: ${Object.keys(json.data || {}).join(', ')}`);
                if (json.data?.clusters) console.log(`   Clusters: ${json.data.clusters.length}`);
                if (json.data?.violations) console.log(`   Violations: ${json.data.violations.length}`);
            } catch(e) {}
        }
    });
    
    try {
        // LOGIN
        console.log('🔐 Login...\n');
        await page.goto(FRONTEND_URL);
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login.png') });
        
        // Llenar formulario con método más robusto
        await page.fill('input[type="text"], input[type="email"]', TEST_USER.email);
        await page.fill('input[type="password"]', TEST_USER.password);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-formulario-llenado.png') });
        
        // Click login
        await page.click('button');
        console.log('Click en botón login...\n');
        await page.waitForTimeout(12000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-despues-login.png') });
        
        // Buscar pestañas internas
        console.log('📋 Buscando pestañas internas (sub-tabs)...\n');
        const pestanasInternas = await page.evaluate(() => {
            const tabs = [];
            
            // Buscar elementos que parezcan sub-tabs (no los del menú principal)
            const posiblesTabsInternos = Array.from(document.querySelectorAll('[role="button"], button, div[class*="tab"]'));
            
            posiblesTabsInternos.forEach(el => {
                const text = el.textContent?.trim();
                // Filtrar solo sub-tabs del Panel de Control
                if (text && text.length > 0 && text.length < 50 && 
                    (text.includes('Estados') || text.includes('Puntos') || text.includes('Velocidad') || 
                     text.includes('Claves') || text.includes('Sesiones'))) {
                    if (el.offsetParent !== null) {
                        tabs.push({
                            texto: text,
                            classes: el.className,
                            visible: true
                        });
                    }
                }
            });
            
            return tabs;
        });
        
        console.log(`Pestañas internas encontradas: ${pestanasInternas.length}`);
        pestanasInternas.forEach((tab, i) => {
            console.log(`   ${i+1}. "${tab.texto}"`);
        });
        
        if (pestanasInternas.length === 0) {
            console.log('\n⚠️  NO SE ENCONTRARON PESTAÑAS INTERNAS\n');
        }
        
        console.log('\n📸 Screenshots guardados en:', SCREENSHOTS_DIR, '\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ERROR.png') });
    } finally {
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

testSimple().catch(console.error);

