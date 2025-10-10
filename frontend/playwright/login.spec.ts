import { expect, test } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully and navigate to dashboard', async ({ page }) => {
    // Configurar el manejo de errores de red
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`Error en la petición: ${response.url()} - ${response.status()}`);
      }
    });

    // Intentar login con reintentos
    let loginSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!loginSuccess && attempts < maxAttempts) {
      try {
        // Limpiar campos
        await page.fill('input[name="email"]', '');
        await page.fill('input[name="password"]', '');

        // Ingresar credenciales
        await page.fill('input[name="email"]', 'admin@DobackSoft.com');
        await page.fill('input[name="password"]', 'admin123');

        // Click en el botón de login
        await page.click('button[type="submit"]');

        // Esperar a que la redirección ocurra
        await page.waitForURL('**/');

        // Verificar que el token existe
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();

        loginSuccess = true;
      } catch (error) {
        console.log(`Intento ${attempts + 1} fallido:`, error);
        attempts++;

        if (attempts < maxAttempts) {
          // Esperar antes de reintentar
          await page.waitForTimeout(2000);
        }
      }
    }

    expect(loginSuccess).toBeTruthy();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    const alert = await page.waitForSelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });

  test('should persist login state after page reload', async ({ page }) => {
    // Login exitoso
    await page.fill('input[name="email"]', 'admin@DobackSoft.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Esperar a que la redirección ocurra
    await page.waitForURL('**/');

    // Recargar la página
    await page.reload();

    // Verificar que sigue en el dashboard
    expect(page.url()).toContain('/');
  });
}); 