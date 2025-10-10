import { test } from '@playwright/test';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

// Asegurar que el directorio de logs exista
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Función para verificar si el servidor está respondiendo
async function isServerRunning(url: string, maxRetries = 5): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🔄 Intento ${i + 1} de verificar el servidor en ${url}...`);
            const response = await new Promise<boolean>((resolve) => {
                const req = http.get(url, (res) => {
                    console.log(`📡 Respuesta del servidor: ${res.statusCode}`);
                    resolve(res.statusCode === 200);
                });
                req.on('error', (error) => {
                    console.log(`❌ Error al conectar con el servidor: ${error.message}`);
                    resolve(false);
                });
                req.setTimeout(5000, () => {
                    console.log('⏰ Timeout al conectar con el servidor');
                    req.destroy();
                    resolve(false);
                });
            });
            if (response) {
                console.log('✅ Servidor respondiendo correctamente');
                return true;
            }
        } catch (error) {
            console.log(`❌ Error al verificar el servidor: ${error}`);
        }
        // Esperar 2 segundos antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
}

test('Navegar por rutas y capturar errores de consola', async ({ page }) => {
    try {
        console.log('🚀 Iniciando prueba de navegación automatizada');

        // Configurar el listener de errores de consola
        page.on('console', msg => {
            console.log(`📝 Consola [${msg.type()}]: ${msg.text()}`);
        });

        // Configurar el listener de errores de página
        page.on('pageerror', error => {
            console.log(`❌ Error en página: ${error.message}`);
        });

        // Configurar el listener de requests
        page.on('request', request => {
            console.log(`🌐 Request: ${request.method()} ${request.url()}`);
        });

        // Configurar el listener de responses
        page.on('response', response => {
            console.log(`📥 Response: ${response.status()} ${response.url()}`);
        });

        // Navegar a la página de login
        console.log('🌐 Navegando a la página de login...');

        // Intentar navegar directamente a la URL
        await page.goto('http://localhost:5174', {
            timeout: 30000
        });

        // Esperar a que la página esté lista
        await page.waitForLoadState('domcontentloaded');

        // Verificar que estamos en la página correcta
        const currentUrl = page.url();
        console.log(`📍 URL actual: ${currentUrl}`);

        if (currentUrl === 'about:blank') {
            console.log('⚠️ La página se redirigió a about:blank, intentando recargar...');
            await page.reload({ waitUntil: 'domcontentloaded' });

            // Verificar la URL después de recargar
            const newUrl = page.url();
            console.log(`📍 URL después de recargar: ${newUrl}`);

            if (newUrl === 'about:blank') {
                throw new Error('La página sigue en about:blank después de recargar');
            }
        }

        // Tomar captura de pantalla después de cargar la página
        await page.screenshot({ path: path.join(logsDir, 'login_page.png') });
        console.log('📸 Captura de pantalla de login guardada');

        // Esperar y verificar que los campos de login estén presentes
        console.log('🔍 Buscando campos de login...');
        const emailInput = await page.waitForSelector('input[name="email"]', {
            timeout: 10000,
            state: 'visible'
        });
        const passwordInput = await page.waitForSelector('input[type="password"]', {
            timeout: 10000,
            state: 'visible'
        });

        if (!emailInput || !passwordInput) {
            throw new Error('No se encontraron los campos de login');
        }
        console.log('✅ Campos de login encontrados');

        // Llenar el formulario de login
        console.log('✍️ Llenando formulario de login...');
        await emailInput.fill('admin@cosigein.com');
        await passwordInput.fill('admin123');
        console.log('✅ Formulario de login llenado');

        // Tomar captura de pantalla después de llenar el formulario
        await page.screenshot({ path: path.join(logsDir, 'login_form_filled.png') });
        console.log('📸 Captura de pantalla del formulario llenado guardada');

        // Hacer clic en el botón de login
        console.log('🖱️ Haciendo clic en el botón de login...');
        const loginButton = await page.waitForSelector('button[type="submit"]', {
            timeout: 10000,
            state: 'visible'
        });
        if (!loginButton) {
            throw new Error('No se encontró el botón de login');
        }
        await loginButton.click();
        console.log('✅ Botón de login clickeado');

        // Esperar a que se cargue el dashboard
        console.log('⏳ Esperando redirección al dashboard...');
        await page.waitForURL('**/dashboard', { timeout: 30000 });
        console.log('✅ Dashboard cargado');

        // Tomar captura de pantalla del dashboard
        await page.screenshot({ path: path.join(logsDir, 'dashboard.png') });
        console.log('📸 Captura de pantalla del dashboard guardada');

        // Lista de rutas a navegar
        const routes = [
            '/dashboard',
            '/estabilidad',
            '/telemetria',
            '/ia',
            '/conocimiento',
            '/admin',
            '/perfil',
        ];

        // Navegar por cada ruta
        for (const route of routes) {
            console.log(`\n🌐 Navegando a ${route}...`);

            // Navegar a la ruta
            await page.goto(`http://localhost:5174${route}`, {
                timeout: 30000
            });

            // Esperar a que la página esté lista
            await page.waitForLoadState('domcontentloaded');

            // Verificar que la URL actual es la correcta
            const currentUrl = page.url();
            console.log(`📍 URL actual: ${currentUrl}`);

            if (currentUrl === 'about:blank') {
                console.log('⚠️ La página se redirigió a about:blank, intentando recargar...');
                await page.reload({ waitUntil: 'domcontentloaded' });

                // Verificar la URL después de recargar
                const newUrl = page.url();
                console.log(`📍 URL después de recargar: ${newUrl}`);

                if (newUrl === 'about:blank') {
                    throw new Error(`La página sigue en about:blank después de recargar en la ruta ${route}`);
                }
            }

            console.log(`✅ ${route} cargada`);

            // Tomar captura de pantalla de cada ruta
            await page.screenshot({ path: path.join(logsDir, `${route.replace('/', '')}.png`) });
            console.log(`📸 Captura de pantalla de ${route} guardada`);

            // Verificación específica para la página de estabilidad
            if (route === '/estabilidad') {
                console.log('🔍 Verificando selectores en la página de estabilidad...');

                try {
                    // Esperar a que los selectores estén presentes
                    const vehicleSelect = await page.waitForSelector('[data-testid="vehicle-select"]', {
                        timeout: 30000,
                        state: 'attached'
                    });
                    const sessionSelect = await page.waitForSelector('[data-testid="session-select"]', {
                        timeout: 30000,
                        state: 'attached'
                    });

                    if (!vehicleSelect || !sessionSelect) {
                        throw new Error('No se encontraron los selectores en la página de estabilidad');
                    }

                    console.log('✅ Selectores encontrados');

                    // Verificar que los selectores estén habilitados
                    const vehicleDisabled = await vehicleSelect.isDisabled();
                    const sessionDisabled = await sessionSelect.isDisabled();

                    console.log(`📊 Estado de selectores:
                        - Selector de vehículo: ${vehicleDisabled ? 'Deshabilitado' : 'Habilitado'}
                        - Selector de sesión: ${sessionDisabled ? 'Deshabilitado' : 'Habilitado'}
                    `);

                    // Tomar captura de pantalla de la página de estabilidad
                    await page.screenshot({ path: path.join(logsDir, 'estabilidad_selectors.png') });
                    console.log('📸 Captura de pantalla de los selectores guardada');

                } catch (error) {
                    console.error('❌ Error verificando selectores:', error);
                    await page.screenshot({ path: path.join(logsDir, 'estabilidad_error.png') });
                    throw error;
                }
            }
        }

        console.log('\n✅ Test completado exitosamente');
    } catch (error) {
        console.error('❌ Error en el test:', error);
        // Tomar captura de pantalla del error
        await page.screenshot({ path: path.join(logsDir, 'test_error.png') });
        throw error;
    }
}); 