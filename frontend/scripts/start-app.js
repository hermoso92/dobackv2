const { execSync, spawn } = require('child_process');
const http = require('http');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

async function checkServer(url, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          console.log(`Respuesta del servidor: ${res.statusCode} ${res.statusMessage}`);
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve();
          } else {
            reject(new Error(`Status code: ${res.statusCode}`));
          }
        }).on('error', (error) => {
          console.log(`Error de conexión: ${error.message}`);
          reject(error);
        });
      });
      return true;
    } catch (error) {
      console.log(`Intento ${i + 1} fallido: ${error.message}`);
      await sleep(2000);
    }
  }
  return false;
}

async function startApp() {
  console.log('🚀 Iniciando la aplicación...');

  try {
    // Instalar dependencias si es necesario
    console.log('📦 Verificando dependencias...');
    execSync('npm install', { stdio: 'inherit' });

    // Iniciar el servidor de desarrollo en modo no bloqueante
    console.log('🌐 Iniciando servidor de desarrollo...');
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Manejar errores del servidor
    server.on('error', (error) => {
      console.error('❌ Error al iniciar el servidor:', error);
      process.exit(1);
    });

    // Esperar a que el servidor esté listo
    console.log('⏳ Esperando a que el servidor esté listo...');
    const isServerReady = await checkServer('http://localhost:3000');

    if (isServerReady) {
      console.log('✅ Servidor iniciado correctamente!');
      console.log('🌐 Puedes acceder a la aplicación en: http://localhost:3000/login');
      
      // Mantener el proceso vivo
      process.on('SIGINT', () => {
        console.log('🛑 Deteniendo el servidor...');
        server.kill();
        process.exit(0);
      });
    } else {
      console.error('❌ No se pudo conectar al servidor después de varios intentos');
      server.kill();
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

startApp(); 