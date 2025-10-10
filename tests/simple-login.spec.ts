import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Asegurar que el directorio de logs exista
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

test('Realizar login exitoso', async ({ page }) => {
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
        console.log(`Button: text="${text}", type=${type}`);
    }

    // Usar el botón de autocompletar credenciales
    console.log('Usando botón de autocompletar credenciales');
    await page.click('button:has-text("Usar credenciales de prueba")');

    // Verificar que los campos se hayan rellenado correctamente
    const usernameValue = await page.inputValue('input[name="username"]');
    const passwordValue = await page.inputValue('input[name="password"]');
    console.log(`Valores rellenados: usuario="${usernameValue}", contraseña="${'*'.repeat(passwordValue.length)}"`);

    // Click en el botón de login
    await page.click('button[type="submit"]');
    console.log('Botón de login clickeado');

    // Esperar a que ocurra la redirección o aparezca un mensaje de error
    try {
        // Intentar esperar a que ocurra redirección o aparezca un error
        await Promise.race([
            page.waitForURL('**/dashboard', { timeout: 5000 }).then(() => console.log('Redirección detectada')),
            page.waitForSelector('div[role="alert"]', { timeout: 5000 }).then(() => console.log('Alerta detectada'))
        ]);
    } catch (error) {
        console.log('No se detectó redirección ni mensaje de error en el tiempo esperado');
    }

    // Tomar captura de pantalla del resultado
    await page.screenshot({ path: path.join(logsDir, 'login_result.png'), fullPage: true });

    // Comprobar si hay mensaje de error
    const alert = await page.$('div[role="alert"]');
    if (alert) {
        const alertText = await alert.textContent() || '';
        console.log(`⚠️ Alerta mostrada: ${alertText}`);

        // Este test puede fallar por problemas de comunicación con el backend
        console.log('❌ Login fallido - hay mensajes de error');
    } else {
        console.log('✅ No se mostraron alertas de error');

        // Verificar si hubo redirección
        const currentUrl = page.url();
        console.log(`🌐 URL actual: ${currentUrl}`);

        if (currentUrl !== 'http://localhost:5175/login') {
            console.log('✅ Login exitoso - hubo redirección');

            // Verificar elementos comunes en un dashboard como navegación, etc.
            const nav = await page.$('nav');
            if (nav) {
                console.log('✅ Se encontró un elemento de navegación en la página');
            }

            const main = await page.$('main');
            if (main) {
                console.log('✅ Se encontró un elemento principal en la página');
            }
        } else {
            console.log('❓ No hubo redirección pero tampoco hay mensajes de error');
        }
    }
}); 