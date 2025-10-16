/**
 * TEST QUE CAPTURA TODO
 */

const { chromium } = require('playwright');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:5174';
const TEST_USER = {
    email: 'antoniohermoso92@gmail.com',
    password: 'admin123'
};

async function testCapturarTodo() {
    console.log('\n🔍 CAPTURANDO TODAS LAS PETICIONES\n');
    
    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    const logs = [];
    const requests = [];
    const responses = [];
    
    // Capturar logs
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
        if (text.includes('hotspots') || text.includes('speed') || text.includes('operational') || 
            text.includes('Cargando') || text.includes('URL completa')) {
            console.log(`[CONSOLE]: ${text}`);
        }
    });
    
    // Capturar requests
    page.on('request', req => {
        if (req.url().includes('/api/')) {
            requests.push({ url: req.url(), method: req.method() });
            console.log(`[REQUEST]: ${req.method()} ${req.url()}`);
        }
    });
    
    // Capturar responses
    page.on('response', async resp => {
        if (resp.url().includes('/api/hotspots') || resp.url().includes('/api/speed')) {
            responses.push({ url: resp.url(), status: resp.status() });
            console.log(`[RESPONSE]: ${resp.status()} ${resp.url()}`);
            try {
                const data = await resp.json();
                console.log(`[DATA]: Success=${data.success}, Clusters=${data.data?.clusters?.length || data.data?.totalClusters || 0}, Violations=${data.data?.violations?.length || 0}`);
            } catch (e) {}
        }
    });
    
    try {
        // LOGIN
        console.log('🔐 Haciendo login...\n');
        await page.goto(FRONTEND_URL);
        await page.waitForTimeout(3000);
        
        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
            await inputs[0].click();
            await page.keyboard.press('Control+A');
            await page.keyboard.type(TEST_USER.email);
            await page.waitForTimeout(500);
            
            await inputs[1].click();
            await page.keyboard.press('Control+A');
            await page.keyboard.type(TEST_USER.password);
            await page.waitForTimeout(500);
        }
        
        const loginButton = await page.$('button');
        if (loginButton) await loginButton.click();
        
        await page.waitForTimeout(10000);
        console.log('✅ Login completado\n');
        
        // PANEL DE CONTROL
        console.log('📊 Ir a Panel de Control...\n');
        await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                if (el.textContent === 'Panel de Control') {
                    el.click();
                    break;
                }
            }
        });
        await page.waitForTimeout(2000);
        
        // CLICK EN PUNTOS NEGROS
        console.log('🗺️  Click en Puntos Negros...\n');
        const clickedPN = await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                const text = el.textContent?.trim();
                if (text === 'Puntos Negros' && el.offsetParent !== null) {
                    console.log('[DEBUG] Clickeando Puntos Negros');
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (clickedPN) {
            console.log('✅ Click exitoso, esperando carga...\n');
            await page.waitForTimeout(10000);
        } else {
            console.log('⚠️  No se pudo hacer click\n');
        }
        
        // Guardar logs
        fs.writeFileSync('./logs-captura.txt', logs.join('\n'));
        fs.writeFileSync('./requests-captura.json', JSON.stringify(requests, null, 2));
        fs.writeFileSync('./responses-captura.json', JSON.stringify(responses, null, 2));
        
        console.log(`\n📋 RESUMEN:`);
        console.log(`   Logs: ${logs.length}`);
        console.log(`   Requests: ${requests.length}`);
        console.log(`   Responses: ${responses.length}`);
        console.log(`\n📁 Archivos guardados: logs-captura.txt, requests-captura.json, responses-captura.json\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testCapturarTodo().catch(console.error);

