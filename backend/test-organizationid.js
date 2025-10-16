/**
 * TEST DE ORGANIZATIONID EN FRONTEND
 */

const { chromium } = require('playwright');

const FRONTEND_URL = 'http://localhost:5174';
const TEST_USER = {
    email: 'antoniohermoso92@gmail.com',
    password: 'admin123'
};

async function testOrganizationId() {
    console.log('\n🔍 TEST DE ORGANIZATIONID\n');
    
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    try {
        await page.goto(FRONTEND_URL);
        await page.waitForTimeout(3000);
        
        const allInputs = await page.$$('input');
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
        if (loginButton) await loginButton.click();
        
        await page.waitForTimeout(12000);
        
        // Verificar localStorage y contexto de autenticación
        const authInfo = await page.evaluate(() => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            const orgId = localStorage.getItem('organizationId');
            
            return {
                token: token ? `${token.substring(0, 50)}...` : null,
                user: user ? JSON.parse(user) : null,
                organizationId: orgId,
                url: window.location.href
            };
        });
        
        console.log('📋 INFORMACIÓN DE AUTENTICACIÓN:');
        console.log(`   Token: ${authInfo.token || '❌ No encontrado'}`);
        console.log(`   User: ${authInfo.user ? JSON.stringify(authInfo.user, null, 2) : '❌ No encontrado'}`);
        console.log(`   OrganizationId: ${authInfo.organizationId || '❌ No encontrado'}`);
        console.log(`   URL actual: ${authInfo.url}\n`);
        
        if (authInfo.user) {
            console.log(`✅ Usuario autenticado: ${authInfo.user.email}`);
            console.log(`✅ OrganizationId: ${authInfo.user.organizationId || authInfo.organizationId || 'NO ENCONTRADO'}\n`);
        } else {
            console.log('❌ Usuario NO autenticado\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testOrganizationId().catch(console.error);

