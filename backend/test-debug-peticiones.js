/**
 * TEST DEBUG DE PETICIONES DEL FRONTEND
 * Captura las peticiones exactas que hace el navegador
 */

const { chromium } = require('playwright');

const FRONTEND_URL = 'http://localhost:5174';
const TEST_USER = {
    email: 'antoniohermoso92@gmail.com',
    password: 'admin123'
};

async function testDebugPeticiones() {
    console.log('\n🔍 DEBUG DE PETICIONES DEL FRONTEND\n');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    // Capturar todas las peticiones
    const peticiones = [];
    page.on('request', request => {
        if (request.url().includes('hotspots') || request.url().includes('speed') || request.url().includes('operational-keys')) {
            peticiones.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers()
            });
            console.log(`\n📡 REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    // Capturar respuestas
    page.on('response', async response => {
        if (response.url().includes('hotspots') || response.url().includes('speed') || response.url().includes('operational-keys')) {
            console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
            try {
                const data = await response.json();
                console.log(`   Datos: ${JSON.stringify(data).substring(0, 200)}...`);
            } catch (e) {
                console.log('   (No JSON)');
            }
        }
    });
    
    try {
        // LOGIN
        console.log('🔐 Login...\n');
        await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
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
        
        await page.waitForTimeout(8000);
        console.log('\n✅ Login completado\n');
        
        // IR A PANEL DE CONTROL
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
        
        // PUNTOS NEGROS
        console.log('\n' + '='.repeat(80));
        console.log('🗺️  PROBANDO: PUNTOS NEGROS');
        console.log('='.repeat(80) + '\n');
        
        await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                if (el.textContent.trim() === 'Puntos Negros' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
        });
        await page.waitForTimeout(8000);
        
        // Obtener KPIs mostrados
        const kpisPuntosNegros = await page.evaluate(() => {
            const kpis = {};
            const text = document.body.textContent;
            
            // Buscar números en el texto
            const totalClustersMatch = text.match(/Total Clusters[^\d]*(\d+)/);
            const totalEventosMatch = text.match(/Total Eventos[^\d]*(\d+)/);
            
            return {
                totalClusters: totalClustersMatch ? totalClustersMatch[1] : 'No encontrado',
                totalEventos: totalEventosMatch ? totalEventosMatch[1] : 'No encontrado',
                textoVisible: text.substring(0, 500)
            };
        });
        
        console.log('\n📊 KPIs EN PANTALLA:');
        console.log(`   Total Clusters: ${kpisPuntosNegros.totalClusters}`);
        console.log(`   Total Eventos: ${kpisPuntosNegros.totalEventos}`);
        
        // VELOCIDAD
        console.log('\n' + '='.repeat(80));
        console.log('🚗 PROBANDO: VELOCIDAD');
        console.log('='.repeat(80) + '\n');
        
        await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                if (el.textContent.trim() === 'Velocidad' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
        });
        await page.waitForTimeout(8000);
        
        // Obtener KPIs mostrados
        const kpisVelocidad = await page.evaluate(() => {
            const text = document.body.textContent;
            return {
                total: (text.match(/Total[^\d]*(\d+)/) || [])[1] || 'No encontrado',
                graves: (text.match(/Graves[^\d]*(\d+)/) || [])[1] || 'No encontrado',
                leves: (text.match(/Leves[^\d]*(\d+)/) || [])[1] || 'No encontrado',
                textoVisible: text.substring(0, 500)
            };
        });
        
        console.log('\n📊 KPIs EN PANTALLA:');
        console.log(`   Total: ${kpisVelocidad.total}`);
        console.log(`   Graves: ${kpisVelocidad.graves}`);
        console.log(`   Leves: ${kpisVelocidad.leves}`);
        
        console.log('\n' + '='.repeat(80));
        console.log('📋 PETICIONES CAPTURADAS:');
        console.log('='.repeat(80));
        console.log(`\nTotal: ${peticiones.length} peticiones\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testDebugPeticiones().catch(console.error);

