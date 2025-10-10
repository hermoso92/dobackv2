// Iniciar navegador y navegar a la página de login
console.log('🚀 Iniciando prueba de navegación automatizada');
await page.goto('http://localhost:5174');

// Tomar captura del formulario de login
await page.screenshot({ path: path.join(logsDir, 'login_form_initial.png') });

// Esperar a que se cargue la pantalla de login (con un enfoque más flexible)
console.log('⏳ Esperando a que se cargue la pantalla de login...');

// Analizar la estructura del formulario de login
console.log('🔍 Analizando campos del formulario de login:');
const inputs = await page.$$('input');
for (const input of inputs) {
    const type = await input.getAttribute('type') || 'sin tipo';
    const name = await input.getAttribute('name') || 'sin nombre';
    const placeholder = await input.getAttribute('placeholder') || 'sin placeholder';
    const id = await input.getAttribute('id') || 'sin id';
    console.log(`📋 Campo encontrado: type=${type}, name=${name}, placeholder=${placeholder}, id=${id}`);

    // Resaltar visualmente para debug
    await input.evaluate(node => {
        node.style.border = '3px solid red';
    });
}

// Tomar captura con campos resaltados
await page.screenshot({ path: path.join(logsDir, 'login_form_highlighted.png') });

// Intentar diferentes selectores para los campos de login
await Promise.any([
    page.waitForSelector('input[type="text"]', { timeout: 5000 })
        .then(() => console.log('Campo de usuario/email encontrado [type="text"]')),
    page.waitForSelector('input[type="email"]', { timeout: 5000 })
        .then(() => console.log('Campo de email encontrado [type="email"]')),
    page.waitForSelector('input[name="username"]', { timeout: 5000 })
        .then(() => console.log('Campo de usuario encontrado [name="username"]')),
    page.waitForSelector('input[name="email"]', { timeout: 5000 })
        .then(() => console.log('Campo de email encontrado [name="email"]')),
    page.waitForSelector('input[placeholder*="usuario"]', { timeout: 5000 })
        .then(() => console.log('Campo de usuario encontrado por placeholder')),
    page.waitForSelector('input[placeholder*="email"]', { timeout: 5000 })
        .then(() => console.log('Campo de email encontrado por placeholder de email')),
    page.waitForSelector('input[placeholder*="correo"]', { timeout: 5000 })
        .then(() => console.log('Campo de email encontrado por placeholder de correo')),
]).catch(() => console.log('⚠️ No se encontró el campo de usuario/email con los selectores habituales'));

await Promise.any([
    page.waitForSelector('input[type="password"]', { timeout: 5000 })
        .then(() => console.log('Campo de contraseña encontrado [type="password"]')),
    page.waitForSelector('input[name="password"]', { timeout: 5000 })
        .then(() => console.log('Campo de contraseña encontrado [name="password"]')),
    page.waitForSelector('input[placeholder*="contraseña"]', { timeout: 5000 })
        .then(() => console.log('Campo de contraseña encontrado por placeholder')),
]).catch(() => console.log('⚠️ No se encontró el campo de contraseña con los selectores habituales'));

// Iniciar sesión con un enfoque más robusto
console.log('🔐 Iniciando sesión con credenciales');

// Intentar diferentes métodos para llenar el campo de usuario/email
try {
    const userFields = await page.$$('input[type="text"], input[type="email"], input[name="username"], input[name="email"], input[placeholder*="usuario"], input[placeholder*="email"], input[placeholder*="correo"]');
    if (userFields.length > 0) {
        // Tomar una captura para debug
        await page.screenshot({ path: './logs/login_form.png' });

        // Verificar si podemos encontrar el campo por etiqueta o texto cercano
        const emailField = await page.$('label:has-text("Correo") + input, label:has-text("Email") + input, div:has-text("Correo") input, div:has-text("Email") input');

        if (emailField) {
            console.log('✅ Campo de email encontrado por etiqueta o texto cercano');
            await emailField.fill('Cosigein');
        } else {
            console.log('⚠️ Usando el primer campo de entrada como campo de email');
            await userFields[0].fill('Cosigein');
        }
        console.log('✅ Campo de usuario/email rellenado con: Cosigein');
    } else {
        console.log('⚠️ No se pudo encontrar el campo de usuario/email para llenarlo');
    }
} catch (error) {
    console.log('⚠️ Error al intentar llenar el campo de usuario/email:', error);
}

// Función para navegar a una ruta y esperar a que se cargue
async function navigateToRoute(route: string): Promise<void> {
    // ... existing code ...
}

test('Navegar por rutas y capturar errores de consola', async ({ page }) => {
    // ... existing code ...

    // Iniciar navegador y navegar a la página de login
    console.log('🚀 Iniciando prueba de navegación automatizada');
    await page.goto('http://localhost:5174');

    // Tomar captura del formulario de login
    await page.screenshot({ path: path.join(logsDir, 'login_form_initial.png') });

    // Esperar a que se cargue la pantalla de login (con un enfoque más flexible)
    console.log('⏳ Esperando a que se cargue la pantalla de login...');

    // Analizar la estructura del formulario de login
    console.log('🔍 Analizando campos del formulario de login:');
    const inputs = await page.$$('input');
    for (const input of inputs) {
        const type = await input.getAttribute('type') || 'sin tipo';
        const name = await input.getAttribute('name') || 'sin nombre';
        const placeholder = await input.getAttribute('placeholder') || 'sin placeholder';
        const id = await input.getAttribute('id') || 'sin id';
        console.log(`📋 Campo encontrado: type=${type}, name=${name}, placeholder=${placeholder}, id=${id}`);

        // Resaltar visualmente para debug
        await input.evaluate(node => {
            node.style.border = '3px solid red';
        });
    }

    // Tomar captura con campos resaltados
    await page.screenshot({ path: path.join(logsDir, 'login_form_highlighted.png') });

    // Intentar diferentes selectores para los campos de login
    await Promise.any([
        // ... existing code ...
    ]).catch(() => console.log('⚠️ No se encontró el campo de usuario/email con los selectores habituales'));

    // ... continuar con el resto del código ...

}); 