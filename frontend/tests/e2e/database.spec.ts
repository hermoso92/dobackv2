import { test, expect } from '@playwright/test';

test.describe('Database Integrity Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display vehicles from database', async ({ page }) => {
    await page.goto('/vehicles');
    
    // Verificar que se muestran los vehículos
    const vehicleCards = await page.$$('.vehicle-card');
    expect(vehicleCards.length).toBeGreaterThan(0);
    
    // Verificar datos del primer vehículo
    const firstVehicle = vehicleCards[0];
    const name = await firstVehicle.$eval('.vehicle-name', el => el.textContent);
    const model = await firstVehicle.$eval('.vehicle-model', el => el.textContent);
    const plate = await firstVehicle.$eval('.vehicle-plate', el => el.textContent);
    
    expect(name).toBeTruthy();
    expect(model).toBeTruthy();
    expect(plate).toBeTruthy();
  });

  test('should display stability sessions', async ({ page }) => {
    await page.goto('/sessions');
    
    // Verificar que se muestran las sesiones
    const sessionCards = await page.$$('.session-card');
    expect(sessionCards.length).toBeGreaterThan(0);
    
    // Verificar datos de la primera sesión
    const firstSession = sessionCards[0];
    const startTime = await firstSession.$eval('.session-start', el => el.textContent);
    const endTime = await firstSession.$eval('.session-end', el => el.textContent);
    const status = await firstSession.$eval('.session-status', el => el.textContent);
    
    expect(startTime).toBeTruthy();
    expect(endTime).toBeTruthy();
    expect(status).toBeTruthy();
  });

  test('should display stability data in charts', async ({ page }) => {
    await page.goto('/sessions');
    
    // Seleccionar la primera sesión
    await page.click('.session-card:first-child');
    
    // Verificar que se cargan los gráficos
    await expect(page.locator('.stability-chart')).toBeVisible();
    await expect(page.locator('.gps-chart')).toBeVisible();
    await expect(page.locator('.can-chart')).toBeVisible();
    
    // Verificar datos en los gráficos
    const chartData = await page.evaluate(() => {
      const charts = document.querySelectorAll('.chart');
      return Array.from(charts).map(chart => {
        const data = (chart as any).__data__;
        return data && data.length > 0;
      });
    });
    
    expect(chartData.every(hasData => hasData)).toBeTruthy();
  });

  test('should display GPS data on map', async ({ page }) => {
    await page.goto('/sessions');
    
    // Seleccionar la primera sesión
    await page.click('.session-card:first-child');
    
    // Verificar que se carga el mapa
    await expect(page.locator('.map-container')).toBeVisible();
    
    // Verificar que hay marcadores en el mapa
    const markers = await page.$$('.map-marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  test('should display CAN data in real-time', async ({ page }) => {
    await page.goto('/sessions');
    
    // Seleccionar la primera sesión
    await page.click('.session-card:first-child');
    
    // Verificar que se muestran los datos CAN
    await expect(page.locator('.can-data-container')).toBeVisible();
    
    // Verificar valores específicos
    const speed = await page.$eval('.speed-value', el => el.textContent);
    const rpm = await page.$eval('.rpm-value', el => el.textContent);
    
    expect(speed).toBeTruthy();
    expect(rpm).toBeTruthy();
  });

  test('should handle database errors gracefully', async ({ page }) => {
    // Simular error de base de datos
    await page.route('**/api/v1/**', route => 
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Database error' })
      })
    );
    
    await page.goto('/vehicles');
    
    // Verificar que se muestra el mensaje de error
    await expect(page.locator('.error-message')).toBeVisible();
    const errorText = await page.$eval('.error-message', el => el.textContent);
    expect(errorText).toContain('Error');
  });
}); 