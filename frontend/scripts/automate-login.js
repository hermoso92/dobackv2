const { execSync } = require('child_process');
const path = require('path');

// Función para ejecutar comandos y manejar errores
function runCommand(command) {
  try {
    console.log(`Ejecutando: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar el comando: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando automatización del proceso de login...');

  // 1. Instalar dependencias si es necesario
  console.log('\n📦 Verificando dependencias...');
  if (!runCommand('npm install')) {
    console.error('❌ Error al instalar dependencias');
    process.exit(1);
  }

  // 2. Instalar navegadores de Playwright
  console.log('\n🌐 Instalando navegadores de Playwright...');
  if (!runCommand('npx playwright install chromium')) {
    console.error('❌ Error al instalar navegadores');
    process.exit(1);
  }

  // 3. Iniciar el servidor de desarrollo
  console.log('\n🔄 Iniciando servidor de desarrollo...');
  const devServer = execSync('npm start', { stdio: 'inherit' });

  // 4. Esperar a que el servidor esté listo
  console.log('\n⏳ Esperando a que el servidor esté listo...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 5. Ejecutar tests de Playwright
  console.log('\n🧪 Ejecutando tests de automatización...');
  if (!runCommand('npx playwright test')) {
    console.error('❌ Error en los tests de automatización');
    process.exit(1);
  }

  console.log('\n✅ Automatización completada exitosamente!');
}

// Ejecutar el script
main().catch(error => {
  console.error('❌ Error en la automatización:', error);
  process.exit(1);
}); 