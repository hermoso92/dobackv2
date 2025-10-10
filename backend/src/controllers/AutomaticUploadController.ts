import { Request, Response } from 'express';
import { AutomaticDataUploadService } from '../services/AutomaticDataUploadService';
import { logger } from '../utils/logger';

export class AutomaticUploadController {
    private service: AutomaticDataUploadService;

    constructor() {
        this.service = new AutomaticDataUploadService();
    }

    /**
     * Inicia el servicio automático
     */
    public async startService(req: Request, res: Response): Promise<void> {
        try {
            await this.service.start();

            res.json({
                success: true,
                message: 'Servicio automático iniciado exitosamente',
                status: this.service.getStatus()
            });

        } catch (error) {
            logger.error('Error iniciando servicio automático:', error);
            res.status(500).json({
                success: false,
                message: 'Error iniciando servicio automático',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Detiene el servicio automático
     */
    public async stopService(req: Request, res: Response): Promise<void> {
        try {
            await this.service.stop();

            res.json({
                success: true,
                message: 'Servicio automático detenido exitosamente',
                status: this.service.getStatus()
            });

        } catch (error) {
            logger.error('Error deteniendo servicio automático:', error);
            res.status(500).json({
                success: false,
                message: 'Error deteniendo servicio automático',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Reinicia el servicio automático
     */
    public async restartService(req: Request, res: Response): Promise<void> {
        try {
            await this.service.restart();

            res.json({
                success: true,
                message: 'Servicio automático reiniciado exitosamente',
                status: this.service.getStatus()
            });

        } catch (error) {
            logger.error('Error reiniciando servicio automático:', error);
            res.status(500).json({
                success: false,
                message: 'Error reiniciando servicio automático',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtiene el estado del servicio
     */
    public async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = this.service.getStatus();
            const stats = this.service.getStats();

            res.json({
                success: true,
                status,
                stats
            });

        } catch (error) {
            logger.error('Error obteniendo estado del servicio:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estado del servicio',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtiene estadísticas detalladas
     */
    public async getDetailedStats(req: Request, res: Response): Promise<void> {
        try {
            const detailedStats = this.service.getDetailedStats();

            res.json({
                success: true,
                stats: detailedStats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas detalladas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas detalladas',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Procesa archivos pendientes
     */
    public async processPendingFiles(req: Request, res: Response): Promise<void> {
        try {
            await this.service.processPendingFiles();

            res.json({
                success: true,
                message: 'Archivos pendientes procesados',
                pendingFiles: this.service.getPendingFiles()
            });

        } catch (error) {
            logger.error('Error procesando archivos pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error procesando archivos pendientes',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtiene archivos pendientes
     */
    public async getPendingFiles(req: Request, res: Response): Promise<void> {
        try {
            const pendingFiles = this.service.getPendingFiles();

            res.json({
                success: true,
                pendingFiles
            });

        } catch (error) {
            logger.error('Error obteniendo archivos pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo archivos pendientes',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtiene archivos con errores
     */
    public async getErrorFiles(req: Request, res: Response): Promise<void> {
        try {
            const errorFiles = this.service.getErrorFiles();

            res.json({
                success: true,
                errorFiles
            });

        } catch (error) {
            logger.error('Error obteniendo archivos con errores:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo archivos con errores',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Reinicia las estadísticas
     */
    public async resetStats(req: Request, res: Response): Promise<void> {
        try {
            this.service.resetStats();

            res.json({
                success: true,
                message: 'Estadísticas reiniciadas exitosamente'
            });

        } catch (error) {
            logger.error('Error reiniciando estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error reiniciando estadísticas',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Configura el directorio base
     */
    public async setBasePath(req: Request, res: Response): Promise<void> {
        try {
            const { basePath } = req.body;

            if (!basePath) {
                res.status(400).json({
                    success: false,
                    message: 'Falta el parámetro basePath'
                });
                return;
            }

            this.service.setBasePath(basePath);

            res.json({
                success: true,
                message: 'Directorio base configurado exitosamente',
                basePath: this.service.getBasePath()
            });

        } catch (error) {
            logger.error('Error configurando directorio base:', error);
            res.status(500).json({
                success: false,
                message: 'Error configurando directorio base',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtiene el directorio base actual
     */
    public async getBasePath(req: Request, res: Response): Promise<void> {
        try {
            const basePath = this.service.getBasePath();

            res.json({
                success: true,
                basePath
            });

        } catch (error) {
            logger.error('Error obteniendo directorio base:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo directorio base',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}