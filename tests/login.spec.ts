import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Asegurar que el directorio de logs exista
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

test('Login exitoso con credenciales de prueba', async ({ page }) => {
    // Navegar a la página de login
    await page.goto('http://localhost:5175/login');

    // Tomar captura de pantalla inicial
    await page.screenshot({ path: path.join(logsDir, 'login_initial.png') });

    // Usar el botón para autocompletar credenciales
    await page.click('button:has-text("Usar credenciales de prueba")');
    console.log('✅ Botón de autocompletar credenciales clickeado');

    // Verificar que los campos se hayan rellenado correctamente
    const usernameValue = await page.inputValue('input[name="username"]');
    const passwordValue = await page.inputValue('input[name="password"]');

    console.log(`📋 Valores de los campos: usuario="${usernameValue}", contraseña="${'*'.repeat(passwordValue.length)}"`);
    expect(usernameValue).toBe('admin');
    expect(passwordValue).toBe('password');

    // Click en el botón de login
    await page.click('button[type="submit"]');
    console.log('✅ Botón de login clickeado');

    // Esperar a que se complete la redirección
    try {
        await page.waitForURL('**/dashboard', { timeout: 5000 });
        console.log('✅ Redirección al dashboard completada');
    } catch (error) {
        console.log('⚠️ No se detectó redirección al dashboard');
        throw error;
    }

    // Tomar captura de pantalla del dashboard
    await page.screenshot({ path: path.join(logsDir, 'dashboard.png') });

    // Verificar que estamos en el dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    console.log('✅ URL del dashboard verificada');
}); 