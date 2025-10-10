import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Asegurar que el directorio de logs exista
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

test('Realizar login', async ({ page }) => {
    // Navegar a la página de login
    console.log('Navegando a la página de login');
    await page.goto('http://localhost:5175/login');
    await page.waitForTimeout(1000);

    // Tomar captura de pantalla
    console.log('Tomando captura de pantalla del login');
    await page.screenshot({ path: path.join(logsDir, 'login_screen.png'), fullPage: true });

    // Inspeccionar elementos del formulario
    console.log('Inspeccionando elementos del formulario');
    const inputs = await page.$$('input');
    for (const input of inputs) {
        const type = await input.getAttribute('type') || 'sin tipo';
        const name = await input.getAttribute('name') || 'sin nombre';
        const placeholder = await input.getAttribute('placeholder') || 'sin placeholder';
        const id = await input.getAttribute('id') || 'sin id';
        console.log(`Input: type=${type}, name=${name}, placeholder=${placeholder}, id=${id}`);
    }

    const buttons = await page.$$('button');
    for (const button of buttons) {
        const text = await button.textContent() || 'sin texto';
        const type = await button.getAttribute('type') || 'sin tipo';
        const id = await button.getAttribute('id') || 'sin id';
        console.log(`Button: text="${text}", type=${type}, id=${id}`);
    }

    // Rellenar el formulario con selectores específicos
    console.log('Rellenando el formulario con credenciales de prueba');
    // Usar selectores por tipo de campo y su posición
    await page.fill('input[type="email"]', 'Cosigein');
    await page.fill('input[type="password"]', 'Cosigein25!');

    // Click en el botón de login
    await page.click('button[type="submit"]');
    console.log('Botón de login clickeado');

    // Esperar un momento para ver si hay redirección o mensajes de error
    await page.waitForTimeout(3000);

    // Tomar captura de pantalla del resultado
    await page.screenshot({ path: path.join(logsDir, 'login_result.png'), fullPage: true });

    // Comprobar si hay mensaje de error
    const alert = await page.$('div[role="alert"]');
    if (alert) {
        const alertText = await alert.textContent();
        console.log(`⚠️ Alerta mostrada: ${alertText}`);
    } else {
        console.log('✅ No se mostraron alertas de error');

        // Verificar si hubo redirección
        const currentUrl = page.url();
        console.log(`🌐 URL actual: ${currentUrl}`);
    }
}); 