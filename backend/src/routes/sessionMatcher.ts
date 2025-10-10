import { spawn } from 'child_process';
import { Router } from 'express';
import { join } from 'path';
import { logger } from '../utils/logger';

const router = Router();

// Endpoint para ejecutar el emparejador de sesiones
router.post('/run', async (req, res) => {
    try {
        const { basePath, gpsOffset = 2, tolerance = 30 } = req.body;

        logger.info('🔄 Ejecutando emparejador de sesiones desde API...');

        // Ruta al script del emparejador
        const sessionMatcherPath = join(__dirname, '..', '..', 'agrupar_sesiones.py');

        // Parámetros por defecto si no se proporcionan
        const defaultBasePath = basePath || 'data/datosDoback/CMadrid';

        // Ejecutar el emparejador
        const sessionMatcher = spawn(
            'python',
            [
                sessionMatcherPath,
                '--base-path',
                defaultBasePath,
                '--gps-offset',
                gpsOffset.toString(),
                '--tolerance',
                tolerance.toString()
            ],
            {
                cwd: join(__dirname, '..', '..'),
                stdio: ['pipe', 'pipe', 'pipe']
            }
        );

        let output = '';
        let errorOutput = '';

        // Capturar salida
        sessionMatcher.stdout.on('data', (data) => {
            const message = data.toString().trim();
            output += message + '\n';
            logger.info(`📋 Emparejador: ${message}`);
        });

        sessionMatcher.stderr.on('data', (data) => {
            const message = data.toString().trim();
            errorOutput += message + '\n';
            logger.warn(`⚠️ Emparejador: ${message}`);
        });

        // Manejar finalización
        sessionMatcher.on('close', (code) => {
            if (code === 0) {
                logger.info('✅ Emparejador de sesiones completado exitosamente');
                res.json({
                    success: true,
                    message: 'Emparejador de sesiones ejecutado exitosamente',
                    output: output,
                    errorOutput: errorOutput,
                    exitCode: code
                });
            } else {
                logger.error(`❌ Emparejador de sesiones falló con código: ${code}`);
                res.status(500).json({
                    success: false,
                    message: 'Emparejador de sesiones falló',
                    output: output,
                    errorOutput: errorOutput,
                    exitCode: code
                });
            }
        });

        sessionMatcher.on('error', (error) => {
            logger.error(`❌ Error ejecutando emparejador: ${error.message}`);
            res.status(500).json({
                success: false,
                message: 'Error ejecutando emparejador de sesiones',
                error: error.message
            });
        });
    } catch (error) {
        logger.error(`❌ Error en endpoint de emparejador: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Endpoint para obtener el estado del emparejador
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Emparejador de sesiones disponible',
        version: 'Mejorado V1.0',
        features: [
            '+2 horas automáticas para GPS',
            'Tolerancia configurable (30 min por defecto)',
            'Mejor manejo de archivos ROTATIVO',
            'Filtrado de archivos traducidos',
            'Lectura de cabeceros internos',
            'Score de calidad de coincidencia'
        ],
        defaultConfig: {
            gpsOffset: 2,
            tolerance: 30,
            basePath: 'data/datosDoback/CMadrid'
        }
    });
});

// Endpoint para obtener configuración recomendada
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: {
            gpsOffset: 2,
            tolerance: 30,
            basePath: 'data/datosDoback/CMadrid',
            description: 'Configuración optimizada para CMadrid'
        }
    });
});

export default router;
