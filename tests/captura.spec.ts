import { test } from '@playwright/test';

test('Capturar pantalla de login', async ({ page }) => {
    console.log('Navegando a la página de login');
    await page.goto('http://localhost:5174');

    // Esperar a que se cargue la página
    await page.waitForTimeout(3000);

    // Tomar captura de pantalla
    console.log('Tomando captura de pantalla del login');
    await page.screenshot({ path: './logs/login_screen.png', fullPage: true });

    // Buscar todos los campos de entrada visibles
    const inputs = await page.$$('input');
    for (const input of inputs) {
        const type = await input.getAttribute('type') || 'sin tipo';
        const placeholder = await input.getAttribute('placeholder') || 'sin placeholder';
        console.log(`Input: type=${type}, placeholder=${placeholder}`);
    }
}); 