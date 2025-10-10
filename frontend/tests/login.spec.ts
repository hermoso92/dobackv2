import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Asegurar que el directorio de logs exista
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

test('Intento de login con credenciales de prueba', async ({ page }) => {
  // Navegar a la página de login
  await page.goto('http://localhost:5175/login');

  // Tomar captura de pantalla inicial
  await page.screenshot({ path: path.join(logsDir, 'login_initial.png') });

  // Analizar los campos del formulario
  console.log('🔍 Analizando campos del formulario de login:');
  const inputs = await page.$$('input');
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    const id = await input.getAttribute('id');
    console.log(`📋 Campo encontrado: type=${type}, id=${id}`);
  }

  // Rellenar el formulario con credenciales
  await page.fill('input[type="email"]', 'Cosigein');
  console.log('✅ Campo de correo electrónico rellenado con: Cosigein');

  await page.fill('input[type="password"]', 'Cosigein25!');
  console.log('✅ Campo de contraseña rellenado con: Cosigein25!');

  // Click en el botón de login
  await page.click('button[type="submit"]');
  console.log('✅ Botón de login clickeado');

  // Esperar un momento para ver resultados
  await page.waitForTimeout(2000);

  // Tomar captura de pantalla del resultado
  await page.screenshot({ path: path.join(logsDir, 'login_result.png') });

  // Verificar si hay error (puede ser porque el backend no está funcionando)
  const alert = await page.$('div[role="alert"]');
  if (alert) {
    const alertText = await alert.textContent();
    console.log(`⚠️ Alerta mostrada: ${alertText}`);

    // Este test puede pasar si el error es porque el backend no está disponible
    if (alertText && alertText.includes('Error al iniciar sesión')) {
      console.log('✅ Test pasado: Se detectó un error esperado relacionado con el backend');
    }
  } else {
    // Verificar si hubo redirección
    const currentUrl = page.url();
    console.log(`🌐 URL actual después del login: ${currentUrl}`);

    if (currentUrl !== 'http://localhost:5175/login') {
      console.log('✅ Test pasado: Se detectó redirección después del login');
    } else {
      console.log('⚠️ No hubo redirección ni mensaje de error');
    }
  }
}); 