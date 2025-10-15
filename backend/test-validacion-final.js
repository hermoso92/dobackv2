/**
 * TEST DE VALIDACIÓN FINAL
 * Usando el método que funcionó en tests anteriores
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5174';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-validacion');

const TEST_USER = {
    email: 'antoniohermoso92@gmail.com',
    password: 'admin123'
};

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

async function testValidacionFinal() {
    console.log('\n' + '='.repeat(80));
    console.log('✅ VALIDACIÓN FINAL - FILTROS Y DATOS');
    console.log('='.repeat(80) + '\n');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    // Capturar peticiones relevantes
    page.on('request', req => {
        if (req.url().includes('hotspots') || req.url().includes('speed') || req.url().includes('operational-keys')) {
            console.log(`\n📡 REQUEST: ${req.method()} ${req.url()}`);
        }
    });
    
    page.on('response', async resp => {
        if (resp.url().includes('hotspots') || resp.url().includes('speed') || resp.url().includes('operational-keys')) {
            console.log(`📥 RESPONSE: ${resp.status()}`);
            try {
                const json = await resp.json();
                if (json.data?.clusters) console.log(`   ✅ Clusters: ${json.data.clusters.length}`);
                if (json.data?.totalClusters) console.log(`   ✅ Total Clusters: ${json.data.totalClusters}`);
                if (json.data?.violations) console.log(`   ✅ Violations: ${json.data.violations.length}`);
            } catch (e) {}
        }
    });
    
    try {
        // LOGIN (método que funcionó)
        console.log('🔐 Realizando login...');
        await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const allInputs = await page.$$('input');
        console.log(`   Inputs encontrados: ${allInputs.length}`);
        
        if (allInputs.length >= 2) {
            await allInputs[0].click();
            await page.keyboard.press('Control+A');
            await page.keyboard.type(TEST_USER.email);
            await page.waitForTimeout(1000);
            
            await allInputs[1].click();
            await page.keyboard.press('Control+A');
            await page.keyboard.type(TEST_USER.password);
            await page.waitForTimeout(1000);
        }
        
        const loginButton = await page.$('button:has-text("LOGIN_BUTTON")');
        if (loginButton) {
            console.log('   Clickeando LOGIN_BUTTON...');
            await loginButton.click();
        }
        
        await page.waitForTimeout(10000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-despues-login.png') });
        console.log('   ✅ Login completado\n');
        
        // Verificar que estamos en el dashboard
        const enDashboard = await page.evaluate(() => {
            return document.body.textContent.includes('Panel de Control') ||
                   document.body.textContent.includes('Horas de Conducción');
        });
        
        if (!enDashboard) {
            console.log('⚠️  NO SE DETECTÓ EL DASHBOARD\n');
            await browser.close();
            return;
        }
        
        console.log('✅ Dashboard detectado\n');
        
        // CLICK EN PUNTOS NEGROS (método que funcionó)
        console.log('='.repeat(80));
        console.log('🗺️  PROBANDO: PUNTOS NEGROS');
        console.log('='.repeat(80) + '\n');
        
        const clickedPN = await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                const text = el.textContent?.trim();
                if (text === 'Puntos Negros' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (clickedPN) {
            console.log('✅ Click en Puntos Negros exitoso');
            await page.waitForTimeout(8000);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-puntos-negros.png'), fullPage: true });
            
            // Extraer KPIs
            const kpis = await page.evaluate(() => {
                const extractNumber = (text, keyword) => {
                    const regex = new RegExp(keyword + '[^\\d]*(\\d+)', 'i');
                    const match = text.match(regex);
                    return match ? match[1] : '0';
                };
                
                const text = document.body.textContent;
                return {
                    totalClusters: extractNumber(text, 'Total Clusters'),
                    totalEventos: extractNumber(text, 'Total Eventos'),
                    graves: extractNumber(text, 'Graves'),
                    moderadas: extractNumber(text, 'Moderadas'),
                    leves: extractNumber(text, 'Leves')
                };
            });
            
            console.log('\n📊 KPIs MOSTRADOS:');
            console.log(`   Total Clusters: ${kpis.totalClusters}`);
            console.log(`   Total Eventos: ${kpis.totalEventos}`);
            console.log(`   Graves: ${kpis.graves}`);
            console.log(`   Moderadas: ${kpis.moderadas}`);
            console.log(`   Leves: ${kpis.leves}\n`);
            
            if (kpis.totalClusters !== '0') {
                console.log('   ✅ PUNTOS NEGROS MOSTRANDO DATOS\n');
            } else {
                console.log('   ⚠️  PUNTOS NEGROS MUESTRA 0\n');
            }
        } else {
            console.log('⚠️  No se pudo hacer click en Puntos Negros\n');
        }
        
        // CLICK EN VELOCIDAD
        console.log('='.repeat(80));
        console.log('🚗 PROBANDO: VELOCIDAD');
        console.log('='.repeat(80) + '\n');
        
        const clickedVel = await page.evaluate(() => {
            const elementos = Array.from(document.querySelectorAll('*'));
            for (const el of elementos) {
                const text = el.textContent?.trim();
                if (text === 'Velocidad' && el.offsetParent !== null) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (clickedVel) {
            console.log('✅ Click en Velocidad exitoso');
            await page.waitForTimeout(8000);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-velocidad.png'), fullPage: true });
            
            // Extraer KPIs
            const kpis = await page.evaluate(() => {
                const extractNumber = (text, keyword) => {
                    const regex = new RegExp(keyword + '[^\\d]*(\\d+)', 'i');
                    const match = text.match(regex);
                    return match ? match[1] : '0';
                };
                
                const text = document.body.textContent;
                return {
                    total: extractNumber(text, 'Total:'),
                    graves: extractNumber(text, 'Graves'),
                    leves: extractNumber(text, 'Leves'),
                    correctos: extractNumber(text, 'Correctos')
                };
            });
            
            console.log('\n📊 KPIs MOSTRADOS:');
            console.log(`   Total: ${kpis.total}`);
            console.log(`   Graves: ${kpis.graves}`);
            console.log(`   Leves: ${kpis.leves}`);
            console.log(`   Correctos: ${kpis.correctos}\n`);
            
            if (kpis.total !== '0') {
                console.log('   ✅ VELOCIDAD MOSTRANDO DATOS\n');
            } else {
                console.log('   ⚠️  VELOCIDAD MUESTRA 0\n');
            }
        } else {
            console.log('⚠️  No se pudo hacer click en Velocidad\n');
        }
        
        console.log('='.repeat(80));
        console.log(`📁 Screenshots en: ${SCREENSHOTS_DIR}`);
        console.log('='.repeat(80) + '\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ERROR.png') });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testValidacionFinal().catch(console.error);

