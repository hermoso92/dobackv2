import { exec } from 'child_process';
import { Request, Response } from 'express';
import path from 'path';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class OrganizationProcessorController {
    /**
     * Ejecuta el procesador completo flexible para toda la organización
     */
    async processOrganizationSessions(req: Request, res: Response) {
        try {
            const orgId = req.orgId!;
            const userId = req.user?.id!;

            logger.info('Iniciando procesamiento de sesiones de organización', {
                orgId,
                userId
            });

            // Ejecutar el procesador completo flexible
            const processorPath = path.join(__dirname, '../../complete_processor_flexible.py');

            logger.info(`Ejecutando procesador: ${processorPath}`);

            const { stdout, stderr } = await execAsync(`python "${processorPath}"`, {
                cwd: path.join(__dirname, '../../'),
                timeout: 300000 // 5 minutos timeout
            });

            logger.info('Procesador completado', {
                stdout: stdout.substring(0, 1000), // Primeros 1000 caracteres
                stderr: stderr.substring(0, 1000)
            });

            // Parsear resultados del stdout para extraer estadísticas
            const stats = this.parseProcessorOutput(stdout);

            res.json({
                success: true,
                message: 'Procesamiento de sesiones completado',
                data: {
                    stats,
                    output: stdout.substring(0, 2000), // Primeros 2000 caracteres
                    errors: stderr.substring(0, 1000) // Primeros 1000 caracteres de errores
                }
            });

        } catch (error) {
            logger.error('Error ejecutando procesador de organización', error);

            res.status(500).json({
                success: false,
                error: 'Error ejecutando procesador de sesiones',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Parsea la salida del procesador para extraer estadísticas
     */
    private parseProcessorOutput(output: string) {
        const stats = {
            vehiclesFound: 0,
            sessionsFound: 0,
            sessionsUploaded: 0,
            sessionsSkipped: 0,
            sessionsFailed: 0
        };

        try {
            // Buscar patrones en la salida
            const vehiclesMatch = output.match(/Vehículos válidos encontrados: (\d+)/);
            if (vehiclesMatch) {
                stats.vehiclesFound = parseInt(vehiclesMatch[1]);
            }

            const sessionsMatch = output.match(/Encontradas (\d+) sesiones válidas/);
            if (sessionsMatch) {
                stats.sessionsFound = parseInt(sessionsMatch[1]);
            }

            const uploadedMatch = output.match(/Subidas exitosas: (\d+)/);
            if (uploadedMatch) {
                stats.sessionsUploaded = parseInt(uploadedMatch[1]);
            }

            const skippedMatch = output.match(/Saltadas \(duplicadas\): (\d+)/);
            if (skippedMatch) {
                stats.sessionsSkipped = parseInt(skippedMatch[1]);
            }

            const failedMatch = output.match(/Fallidas: (\d+)/);
            if (failedMatch) {
                stats.sessionsFailed = parseInt(failedMatch[1]);
            }

        } catch (error) {
            logger.warn('Error parseando salida del procesador', error);
        }

        return stats;
    }

    /**
     * Obtiene el estado del procesamiento
     */
    async getProcessingStatus(req: Request, res: Response) {
        try {
            // Verificar si hay un proceso de procesamiento ejecutándose
            const processorPath = path.join(__dirname, '../../complete_processor_flexible.py');

            // Verificar si el archivo existe
            const fs = require('fs');
            if (!fs.existsSync(processorPath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Procesador no encontrado'
                });
            }

            // Verificar archivos de log recientes
            const logPath = path.join(__dirname, '../../complete_processor_flexible.log');
            let lastRun = null;

            if (fs.existsSync(logPath)) {
                const stats = fs.statSync(logPath);
                lastRun = stats.mtime;
            }

            res.json({
                success: true,
                data: {
                    processorExists: true,
                    lastRun,
                    logPath: fs.existsSync(logPath) ? logPath : null
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estado del procesamiento', error);

            res.status(500).json({
                success: false,
                error: 'Error obteniendo estado del procesamiento',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
