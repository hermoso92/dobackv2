const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servicio automático de subida de datos en producción...');

// Configurar variables de entorno
process.env.NODE_ENV = 'production';

// Iniciar el servicio automático
const serviceProcess = spawn('npx', ['ts-node', 'scripts/start-automatic-upload.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: 'production'
    }
});

// Manejar señales del sistema
process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, deteniendo servicio...');
    serviceProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, deteniendo servicio...');
    serviceProcess.kill('SIGTERM');
    process.exit(0);
});

// Manejar errores del proceso hijo
serviceProcess.on('error', (error) => {
    console.error('❌ Error en el proceso del servicio:', error);
    process.exit(1);
});

serviceProcess.on('exit', (code, signal) => {
    if (code !== 0) {
        console.error(`❌ El servicio terminó con código ${code} y señal ${signal}`);
        process.exit(1);
    } else {
        console.log('✅ Servicio terminado exitosamente');
        process.exit(0);
    }
});

console.log('✅ Servicio automático iniciado en modo producción');
console.log('📊 Monitoreando archivos en:', path.join(process.cwd(), 'data', 'datosDoback'));
console.log('🛑 Presiona Ctrl+C para detener el servicio');