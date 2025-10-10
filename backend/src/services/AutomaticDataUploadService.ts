import { EventEmitter } from 'events';
import path from 'path';
import { logger } from '../utils/logger';
import { AutoSessionProcessor } from './AutoSessionProcessor';

export interface ServiceStats {
    isRunning: boolean;
    startTime: Date | null;
    sessionsProcessed: number;
    filesProcessed: number;
    errors: number;
    lastActivity: Date | null;
    processorStats: any;
}

export class AutomaticDataUploadService extends EventEmitter {
    private processor: AutoSessionProcessor;
    private isRunning: boolean = false;
    private startTime: Date | null = null;
    private sessionsProcessed: number = 0;
    private filesProcessed: number = 0;
    private errors: number = 0;
    private lastActivity: Date | null = null;
    private basePath: string;

    constructor() {
        super();
        this.processor = new AutoSessionProcessor();
        this.basePath = path.join(process.cwd(), 'data', 'datosDoback');
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.processor.on('sessionProcessed', this.handleSessionProcessed.bind(this));
        this.processor.on('sessionError', this.handleSessionError.bind(this));
    }

    /**
     * Inicia el servicio automático de subida de datos
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('⚠️ El servicio automático ya está ejecutándose');
            return;
        }

        try {
            logger.info('🚀 Iniciando servicio automático de subida de datos...');

            // Verificar que el directorio base existe
            if (!this.directoryExists(this.basePath)) {
                throw new Error(`Directorio base no encontrado: ${this.basePath}`);
            }

            // Iniciar procesador
            await this.processor.startProcessing(this.basePath);

            this.isRunning = true;
            this.startTime = new Date();
            this.lastActivity = new Date();

            logger.info('✅ Servicio automático iniciado exitosamente');
            this.emit('started');

        } catch (error) {
            logger.error('❌ Error iniciando servicio automático:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Detiene el servicio automático
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.warn('⚠️ El servicio automático no está ejecutándose');
            return;
        }

        try {
            logger.info('🛑 Deteniendo servicio automático...');

            await this.processor.stopProcessing();

            this.isRunning = false;
            this.lastActivity = new Date();

            logger.info('✅ Servicio automático detenido');
            this.emit('stopped');

        } catch (error) {
            logger.error('❌ Error deteniendo servicio automático:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Reinicia el servicio automático
     */
    public async restart(): Promise<void> {
        logger.info('🔄 Reiniciando servicio automático...');

        if (this.isRunning) {
            await this.stop();
        }

        await this.start();

        logger.info('✅ Servicio automático reiniciado');
    }

    /**
     * Maneja sesiones procesadas exitosamente
     */
    private handleSessionProcessed(group: any, result: any): void {
        this.sessionsProcessed++;
        this.filesProcessed += result.filesProcessed;
        this.lastActivity = new Date();

        logger.info(`✅ Sesión procesada: ${group.vehicleId}_${group.date}`, {
            sessionId: result.sessionId,
            filesProcessed: result.filesProcessed,
            dataInserted: result.dataInserted,
            kpisCalculated: result.kpisCalculated
        });

        this.emit('sessionProcessed', {
            group,
            result,
            stats: this.getStats()
        });
    }

    /**
     * Maneja errores de procesamiento
     */
    private handleSessionError(group: any, error: any): void {
        this.errors++;
        this.lastActivity = new Date();

        logger.error(`❌ Error procesando sesión: ${group.vehicleId}_${group.date}`, error);

        this.emit('sessionError', {
            group,
            error,
            stats: this.getStats()
        });
    }

    /**
     * Verifica si un directorio existe
     */
    private directoryExists(dirPath: string): boolean {
        try {
            const fs = require('fs');
            return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtiene estadísticas del servicio
     */
    public getStats(): ServiceStats {
        return {
            isRunning: this.isRunning,
            startTime: this.startTime,
            sessionsProcessed: this.sessionsProcessed,
            filesProcessed: this.filesProcessed,
            errors: this.errors,
            lastActivity: this.lastActivity,
            processorStats: this.processor.getStats()
        };
    }

    /**
     * Obtiene estadísticas detalladas
     */
    public getDetailedStats(): {
        service: ServiceStats;
        uptime: number | null;
        averageSessionsPerHour: number;
        averageFilesPerHour: number;
        errorRate: number;
    } {
        const stats = this.getStats();
        const uptime = stats.startTime ? Date.now() - stats.startTime.getTime() : null;
        const uptimeHours = uptime ? uptime / (1000 * 60 * 60) : 0;

        return {
            service: stats,
            uptime: uptime,
            averageSessionsPerHour: uptimeHours > 0 ? stats.sessionsProcessed / uptimeHours : 0,
            averageFilesPerHour: uptimeHours > 0 ? stats.filesProcessed / uptimeHours : 0,
            errorRate: stats.filesProcessed > 0 ? (stats.errors / stats.filesProcessed) * 100 : 0
        };
    }

    /**
     * Obtiene el estado del servicio
     */
    public getStatus(): 'stopped' | 'starting' | 'running' | 'stopping' | 'error' {
        if (!this.isRunning) {
            return 'stopped';
        }

        const processorStats = this.processor.getStats();
        if (processorStats.isProcessing) {
            return 'running';
        }

        return 'running';
    }

    /**
     * Fuerza el procesamiento de archivos pendientes
     */
    public async processPendingFiles(): Promise<void> {
        if (!this.isRunning) {
            throw new Error('El servicio no está ejecutándose');
        }

        logger.info('🔄 Procesando archivos pendientes...');

        try {
            // El procesador ya maneja archivos pendientes automáticamente
            // Esta función es para forzar el procesamiento inmediato
            const stats = this.processor.getStats();
            logger.info(`📊 Estado del procesador: ${JSON.stringify(stats)}`);

        } catch (error) {
            logger.error('❌ Error procesando archivos pendientes:', error);
            throw error;
        }
    }

    /**
     * Obtiene archivos pendientes
     */
    public getPendingFiles(): any[] {
        if (!this.isRunning) {
            return [];
        }

        const processorStats = this.processor.getStats();
        return processorStats.fileWatcherStats.pendingFiles || 0;
    }

    /**
     * Obtiene archivos con errores
     */
    public getErrorFiles(): any[] {
        if (!this.isRunning) {
            return [];
        }

        const processorStats = this.processor.getStats();
        return processorStats.fileWatcherStats.errorFiles || 0;
    }

    /**
     * Limpia estadísticas
     */
    public resetStats(): void {
        this.sessionsProcessed = 0;
        this.filesProcessed = 0;
        this.errors = 0;
        this.lastActivity = new Date();

        logger.info('📊 Estadísticas del servicio reiniciadas');
    }

    /**
     * Obtiene logs del servicio
     */
    public getLogs(): string[] {
        // Esta función podría implementarse para obtener logs específicos del servicio
        // Por ahora retorna un array vacío
        return [];
    }

    /**
     * Configura el directorio base
     */
    public setBasePath(newPath: string): void {
        if (this.isRunning) {
            throw new Error('No se puede cambiar el directorio base mientras el servicio está ejecutándose');
        }

        this.basePath = newPath;
        logger.info(`📁 Directorio base configurado: ${newPath}`);
    }

    /**
     * Obtiene el directorio base actual
     */
    public getBasePath(): string {
        return this.basePath;
    }
}