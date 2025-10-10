#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // Asegúrate de instalar este paquete: npm install chalk

// Colores para mejor visibilidad
const info = chalk.blue;
const success = chalk.green;
const warning = chalk.yellow;
const error = chalk.red;

console.log(info('🚀 Iniciando servidor de desarrollo DobackSoft V2'));

// Verificar si el directorio node_modules existe
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log(warning('⚠️ No se encontró el directorio node_modules. Instalando dependencias...'));
  const install = spawn('npm', ['install'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code !== 0) {
      console.log(error('❌ Error al instalar dependencias. Código de salida:', code));
      process.exit(1);
    }
    startDev();
  });
} else {
  startDev();
}

function startDev() {
  console.log(info('📦 Dependencias listas. Iniciando servidor de desarrollo...'));
  
  // Iniciar el servidor de desarrollo
  const dev = spawn('npx', ['vite', '--host'], { stdio: 'inherit' });
  
  dev.on('close', (code) => {
    if (code !== 0) {
      console.log(error(`❌ El servidor de desarrollo se cerró con código ${code}`));
      process.exit(code);
    }
  });
  
  // Manejar señales para cierre limpio
  process.on('SIGINT', () => {
    console.log(info('👋 Cerrando servidor de desarrollo...'));
    dev.kill('SIGINT');
  });
  
  console.log(success(`
  ✅ Servidor iniciado correctamente
  
  📝 Notas importantes:
  - Para acceder al Dashboard, usa la ruta: /test-dashboard
  - La autenticación está en modo desarrollo forzado para facilitar las pruebas
  - El panel de depuración aparecerá en la esquina inferior izquierda
  
  🌐 Accede a: http://localhost:5174
  `));
} 