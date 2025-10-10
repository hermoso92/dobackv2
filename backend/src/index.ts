import { createServer } from 'http';
import { app } from './config/server';
import { WebSocketService } from './services/WebSocketService';
import { logger } from './utils/logger';
import { AlertWebSocket } from './websocket/alertWebSocket';
// Reload trigger - corrección de cálculos de sesiones duplicadas
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore dependencias internas

// Importar el emparejador mejorado de sesiones
import { spawn } from 'child_process';
import { join } from 'path';

// Función para ejecutar el emparejador de sesiones
async function runSessionMatcher() {
    try {
        logger.info('🔄 Iniciando emparejador de sesiones mejorado...');

        // Ruta al script del emparejador
        const sessionMatcherPath = join(__dirname, '..', 'agrupar_sesiones.py');

        // Ejecutar el emparejador como proceso separado
        const sessionMatcher = spawn(
            'python',
            [
                sessionMatcherPath,
                '--base-path',
                'data/datosDoback/CMadrid',
                '--gps-offset',
                '2',
                '--tolerance',
                '30'
            ],
            {
                cwd: join(__dirname, '..'),
                stdio: ['pipe', 'pipe', 'pipe']
            }
        );

        // Capturar salida
        sessionMatcher.stdout.on('data', (data) => {
            logger.info(`📋 Emparejador: ${data.toString().trim()}`);
        });

        sessionMatcher.stderr.on('data', (data) => {
            logger.warn(`⚠️ Emparejador: ${data.toString().trim()}`);
        });

        // Manejar finalización
        sessionMatcher.on('close', (code) => {
            if (code === 0) {
                logger.info('✅ Emparejador de sesiones completado exitosamente');
            } else {
                logger.error(`❌ Emparejador de sesiones falló con código: ${code}`);
            }
        });

        sessionMatcher.on('error', (error) => {
            logger.error(`❌ Error ejecutando emparejador: ${error.message}`);
        });
    } catch (error) {
        logger.error(`❌ Error iniciando emparejador: ${error}`);
    }
}

// Crear servidor HTTP
const server = createServer(app);

// Inicializar WebSocket
const wsService = new WebSocketService(server);
AlertWebSocket.init(server);

// Iniciar servidor
const PORT = parseInt(process.env.PORT || '9998');
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, async () => {
    logger.info(`Servidor iniciado en ${HOST}:${PORT}`);
    logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`URL: http://${HOST}:${PORT}`);
    logger.info(`Health: http://${HOST}:${PORT}/health`);

    // Ejecutar emparejador de sesiones al iniciar
    // await runSessionMatcher();

    // Procesador de reportes deshabilitado temporalmente
    // processPendingReports().catch((e) => logger.error('Error procesando reportes', e));
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    logger.error('Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Promesa rechazada no manejada:', error);
    process.exit(1);
});

