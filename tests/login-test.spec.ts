import { expect, test } from '@playwright/test';

test('Login con credenciales de prueba', async ({ page }) => {
    // Navegar a la página de login
    await page.goto('/login');

    // Usar el botón para rellenar credenciales de prueba
    await page.click('button:has-text("Usar credenciales de prueba")');

    // Verificar que los campos se hayan rellenado correctamente
    expect(await page.inputValue('input[name="username"]')).toBe('admin');
    expect(await page.inputValue('input[name="password"]')).toBe('password');

    // Hacer clic en el botón de enviar
    await page.click('button[type="submit"]');

    // Esperar a que se redirija al dashboard (con un timeout más largo porque usa setTimeout)
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    // Verificar que estamos en la página del dashboard
    expect(page.url()).toContain('/dashboard');
}); 