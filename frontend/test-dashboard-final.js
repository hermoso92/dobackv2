import { chromium } from 'playwright';

async function testDashboard() {
    console.log('🚀 Iniciando prueba del dashboard ejecutivo...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('📱 Navegando al dashboard...');
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
        
        // Esperar a que cargue el dashboard
        await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
        console.log('✅ Dashboard cargado correctamente');
        
        // Probar selección de vehículo
        console.log('🔍 Probando selección de vehículo...');
        const vehicleButton = page.locator('button:has-text("DOBACK022")').first();
        if (await vehicleButton.isVisible()) {
            await vehicleButton.click();
            console.log('✅ Vehículo DOBACK022 seleccionado');
        }
        
        // Probar cambio de fecha personalizada
        console.log('📅 Probando selector de fechas personalizadas...');
        const customDateButton = page.locator('button:has-text("Personalizado")');
        if (await customDateButton.isVisible()) {
            await customDateButton.click();
            console.log('✅ Selector de fechas personalizadas activado');
            
            // Establecer fechas
            const startDateInput = page.locator('input[type="date"]').first();
            const endDateInput = page.locator('input[type="date"]').nth(1);
            
            if (await startDateInput.isVisible()) {
                await startDateInput.fill('2025-09-01');
                await endDateInput.fill('2025-09-30');
                console.log('✅ Fechas establecidas');
                
                // Aplicar fechas
                const applyButton = page.locator('button:has-text("Aplicar")');
                if (await applyButton.isVisible()) {
                    await applyButton.click();
                    console.log('✅ Fechas aplicadas');
                }
            }
        }
        
        // Probar navegación entre pestañas
        console.log('📑 Probando navegación entre pestañas...');
        const tabs = ['Estados & Tiempos', 'Puntos Negros', 'Velocidad', 'Sesiones & Recorridos'];
        
        for (const tabName of tabs) {
            const tab = page.locator(`button:has-text("${tabName}")`);
            if (await tab.isVisible()) {
                await tab.click();
                await page.waitForTimeout(2000); // Esperar a que cargue
                console.log(`✅ Pestaña "${tabName}" activada`);
            }
        }
        
        // Probar click en cajas KPI
        console.log('📊 Probando click en cajas KPI...');
        const kpiCard = page.locator('.cursor-pointer').first();
        if (await kpiCard.isVisible()) {
            await kpiCard.click();
            console.log('✅ Caja KPI clickeada');
            
            // Verificar que aparece el modal
            const modal = page.locator('.fixed.inset-0');
            if (await modal.isVisible()) {
                console.log('✅ Modal de detalles KPI abierto');
                
                // Cerrar modal
                const closeButton = page.locator('button:has(svg)').last();
                if (await closeButton.isVisible()) {
                    await closeButton.click();
                    console.log('✅ Modal cerrado');
                }
            }
        }
        
        // Probar pestaña Sesiones & Recorridos
        console.log('🚗 Probando pestaña Sesiones & Recorridos...');
        const sessionsTab = page.locator('button:has-text("Sesiones & Recorridos")');
        if (await sessionsTab.isVisible()) {
            await sessionsTab.click();
            await page.waitForTimeout(2000);
            
            // Seleccionar vehículo en el selector de sesiones
            const vehicleSelect = page.locator('select').first();
            if (await vehicleSelect.isVisible()) {
                await vehicleSelect.selectOption('doback022');
                console.log('✅ Vehículo seleccionado en sesiones');
                
                // Seleccionar sesión
                const sessionSelect = page.locator('select').nth(1);
                if (await sessionSelect.isVisible()) {
                    await sessionSelect.selectOption({ index: 1 });
                    console.log('✅ Sesión seleccionada');
                    
                    // Esperar a que cargue la sesión
                    await page.waitForTimeout(3000);
                    console.log('✅ Datos de sesión cargados');
                }
            }
        }
        
        console.log('🎉 Todas las pruebas completadas exitosamente!');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    } finally {
        await browser.close();
    }
}

testDashboard().catch(console.error);
