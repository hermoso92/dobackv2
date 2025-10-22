/**
 * Script para inspeccionar el DOM del dashboard
 * y obtener información sobre la estructura real
 */

const { chromium } = require('playwright');

async function inspectDashboard() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Navegando a login...');
        await page.goto('http://localhost:5174/login');
        await page.waitForTimeout(5000);
        
        console.log('📝 Llenando credenciales...');
        await page.fill('input[type="text"]', 'antoniohermoso92@gmail.com');
        await page.fill('input[type="password"]', 'password123');
        
        console.log('🔐 Haciendo login...');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(10000);
        
        console.log('📍 URL actual:', page.url());
        
        // Si no redirigió, ir manualmente
        if (page.url().includes('/login')) {
            console.log('⚠️  No redirigió, navegando manualmente...');
            await page.goto('http://localhost:5174/dashboard');
            await page.waitForTimeout(5000);
        }
        
        console.log('\n========================================');
        console.log('  INSPECCIONANDO DASHBOARD');
        console.log('========================================\n');
        
        // Capturar screenshot
        await page.screenshot({ path: 'scripts/testing/results/dashboard-inspection.png', fullPage: true });
        console.log('📸 Screenshot guardado: dashboard-inspection.png');
        
        // Obtener estructura del DOM
        const structure = await page.evaluate(() => {
            const result = {
                title: document.title,
                url: window.location.href,
                bodyClasses: document.body.className,
                mainElements: [],
                buttons: [],
                links: [],
                inputs: [],
                h1Elements: [],
                h2Elements: [],
                navElements: [],
                allText: document.body.innerText.substring(0, 1000)
            };
            
            // Elementos principales
            document.querySelectorAll('main, .main, [role="main"], .dashboard, .app-layout').forEach(el => {
                result.mainElements.push({
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    childrenCount: el.children.length
                });
            });
            
            // Botones
            document.querySelectorAll('button').forEach((btn, i) => {
                if (i < 20) { // Primeros 20 botones
                    result.buttons.push({
                        text: btn.innerText.trim().substring(0, 50),
                        class: btn.className,
                        type: btn.type
                    });
                }
            });
            
            // Links
            document.querySelectorAll('a').forEach((link, i) => {
                if (i < 20) { // Primeros 20 links
                    result.links.push({
                        text: link.innerText.trim().substring(0, 50),
                        href: link.getAttribute('href'),
                        class: link.className
                    });
                }
            });
            
            // Inputs
            document.querySelectorAll('input').forEach((input, i) => {
                if (i < 10) {
                    result.inputs.push({
                        type: input.type,
                        placeholder: input.placeholder,
                        name: input.name
                    });
                }
            });
            
            // Headings
            document.querySelectorAll('h1').forEach(h1 => {
                result.h1Elements.push(h1.innerText.trim());
            });
            
            document.querySelectorAll('h2').forEach(h2 => {
                result.h2Elements.push(h2.innerText.trim().substring(0, 100));
            });
            
            // Nav elements
            document.querySelectorAll('nav, [role="navigation"], .nav, .navigation').forEach(nav => {
                result.navElements.push({
                    class: nav.className,
                    childrenCount: nav.children.length,
                    text: nav.innerText.substring(0, 200)
                });
            });
            
            return result;
        });
        
        console.log('\n📊 ESTRUCTURA DEL DASHBOARD:\n');
        console.log('URL:', structure.url);
        console.log('Title:', structure.title);
        console.log('\n🏗️  ELEMENTOS PRINCIPALES:');
        console.log(JSON.stringify(structure.mainElements, null, 2));
        
        console.log('\n🔘 BOTONES ENCONTRADOS:', structure.buttons.length);
        structure.buttons.forEach((btn, i) => {
            console.log(`  ${i+1}. "${btn.text}" (class: ${btn.class})`);
        });
        
        console.log('\n🔗 LINKS ENCONTRADOS:', structure.links.length);
        structure.links.forEach((link, i) => {
            console.log(`  ${i+1}. "${link.text}" -> ${link.href}`);
        });
        
        console.log('\n📝 H1 TITLES:');
        structure.h1Elements.forEach(h1 => console.log(`  - ${h1}`));
        
        console.log('\n📝 H2 TITLES (primeros 5):');
        structure.h2Elements.slice(0, 5).forEach(h2 => console.log(`  - ${h2}`));
        
        console.log('\n🧭 NAVEGACIÓN:');
        console.log(JSON.stringify(structure.navElements, null, 2));
        
        console.log('\n📄 TEXTO VISIBLE (primeros 1000 chars):');
        console.log(structure.allText);
        
        // Guardar en JSON
        const fs = require('fs');
        fs.writeFileSync(
            'scripts/testing/results/dashboard-structure.json',
            JSON.stringify(structure, null, 2)
        );
        console.log('\n💾 Estructura guardada en: dashboard-structure.json');
        
        console.log('\n✅ Inspección completada. Revisa los archivos generados.');
        console.log('Presiona Ctrl+C para cerrar el navegador...');
        
        // Mantener navegador abierto para inspección manual
        await page.waitForTimeout(60000);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

inspectDashboard();

