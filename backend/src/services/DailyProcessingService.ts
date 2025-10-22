
import fs from 'fs/promises';
import { prisma } from '../lib/prisma';
import cron from 'node-cron';
import path from 'path';
import { logger } from '../utils/logger';
import { IndependentDataProcessor } from './IndependentDataProcessor';



interface ProcessingResult {
    vehicleId: string;
    vehicleName: string;
    success: boolean;
    error?: string;
    report?: any;
}

interface DailyProcessingConfig {
    baseDataPath: string;
    organizationId: string;
    scheduleTime: string; // Formato cron (ej: "0 2 * * *" para 2:00 AM)
    enabled: boolean;
}

export class DailyProcessingService {
    private config: DailyProcessingConfig;
    private isRunning: boolean = false;
    private cronJob: cron.ScheduledTask | null = null;

    constructor(config: DailyProcessingConfig) {
        this.config = config;
    }

    /**
     * Inicia el servicio de procesamiento diario
     */
    public start(): void {
        if (this.isRunning) {
            logger.warn('Servicio de procesamiento diario ya está ejecutándose');
            return;
        }

        if (!this.config.enabled) {
            logger.info('Servicio de procesamiento diario deshabilitado');
            return;
        }

        logger.info(`🕐 Iniciando servicio de procesamiento diario`, {
            schedule: this.config.scheduleTime,
            basePath: this.config.baseDataPath,
            organizationId: this.config.organizationId
        });

        this.cronJob = cron.schedule(this.config.scheduleTime, async () => {
            await this.processDailyData();
        }, {
            scheduled: true,
            timezone: "Europe/Madrid"
        });

        this.isRunning = true;
        logger.info('✅ Servicio de procesamiento diario iniciado correctamente');
    }

    /**
     * Detiene el servicio de procesamiento diario
     */
    public stop(): void {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
        }
        this.isRunning = false;
        logger.info('🛑 Servicio de procesamiento diario detenido');
    }

    /**
     * Procesa los datos del día actual
     */
    public async processDailyData(): Promise<ProcessingResult[]> {
        if (this.isRunning && this.cronJob) {
            logger.warn('Procesamiento diario ya está en ejecución, saltando...');
            return [];
        }

        this.isRunning = true;
        const results: ProcessingResult[] = [];

        try {
            logger.info('🌅 Iniciando procesamiento diario automático');

            // Obtener fecha de ayer (datos del día anterior)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');

            // Obtener todos los vehículos activos de la organización
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: this.config.organizationId,
                    active: true
                }
            });

            if (vehicles.length === 0) {
                logger.warn('No se encontraron vehículos activos para procesar');
                return results;
            }

            logger.info(`🚗 Procesando ${vehicles.length} vehículos para fecha ${dateStr}`);

            // Procesar cada vehículo
            for (const vehicle of vehicles) {
                const result = await this.processVehicle(vehicle.id, vehicle.name, dateStr);
                results.push(result);
            }

            // Generar reporte de procesamiento diario
            await this.generateDailyReport(results, dateStr);

            const successfulVehicles = results.filter(r => r.success).length;
            const failedVehicles = results.filter(r => !r.success).length;

            logger.info('🎉 Procesamiento diario completado', {
                totalVehicles: vehicles.length,
                successful: successfulVehicles,
                failed: failedVehicles,
                date: dateStr
            });

        } catch (error) {
            logger.error('Error en procesamiento diario:', error);
        } finally {
            this.isRunning = false;
        }

        return results;
    }

    /**
     * Procesa un vehículo específico
     */
    private async processVehicle(vehicleId: string, vehicleName: string, dateStr: string): Promise<ProcessingResult> {
        try {
            logger.info(`🔄 Procesando vehículo ${vehicleName} (${vehicleId})`);

            const vehiclePath = path.join(this.config.baseDataPath, vehicleId);

            // Verificar que la ruta del vehículo existe
            try {
                await fs.access(vehiclePath);
            } catch (error) {
                logger.warn(`Ruta de datos no encontrada para vehículo ${vehicleId}: ${vehiclePath}`);
                return {
                    vehicleId,
                    vehicleName,
                    success: false,
                    error: 'Ruta de datos no encontrada'
                };
            }

            // Crear procesador independiente
            const processor = new IndependentDataProcessor({
                organizationId: this.config.organizationId,
                vehicleId: vehicleId,
                date: dateStr,
                basePath: vehiclePath
            });

            // Procesar todos los archivos
            await processor.processAllFilesByType();

            // Obtener reporte
            const report = processor.getProcessingReport();

            logger.info(`✅ Vehículo ${vehicleName} procesado exitosamente`, {
                totalFiles: report.totalFiles,
                successfulFiles: report.successfulFiles,
                totalDataPoints: report.totalDataPoints
            });

            return {
                vehicleId,
                vehicleName,
                success: true,
                report
            };

        } catch (error) {
            logger.error(`Error procesando vehículo ${vehicleName}:`, error);
            return {
                vehicleId,
                vehicleName,
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Genera un reporte diario del procesamiento
     */
    private async generateDailyReport(results: ProcessingResult[], dateStr: string): Promise<void> {
        try {
            const totalVehicles = results.length;
            const successfulVehicles = results.filter(r => r.success).length;
            const failedVehicles = results.filter(r => !r.success).length;
            const totalDataPoints = results
                .filter(r => r.success && r.report)
                .reduce((sum, r) => sum + (r.report?.totalDataPoints || 0), 0);

            // Crear entrada en la tabla de reportes de procesamiento diario
            await prisma.dailyProcessingReport.create({
                data: {
                    organizationId: this.config.organizationId,
                    processingDate: new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
                    totalVehicles: totalVehicles,
                    successfulVehicles: successfulVehicles,
                    failedVehicles: failedVehicles,
                    totalDataPoints: totalDataPoints,
                    status: failedVehicles === 0 ? 'SUCCESS' : failedVehicles === totalVehicles ? 'FAILED' : 'PARTIAL',
                    details: {
                        results: results.map(r => ({
                            vehicleId: r.vehicleId,
                            vehicleName: r.vehicleName,
                            success: r.success,
                            error: r.error,
                            report: r.report ? {
                                totalFiles: r.report.totalFiles,
                                successfulFiles: r.report.successfulFiles,
                                totalDataPoints: r.report.totalDataPoints
                            } : null
                        }))
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            logger.info('📊 Reporte diario generado y guardado en base de datos');

        } catch (error) {
            logger.error('Error generando reporte diario:', error);
        }
    }

    /**
     * Procesa datos de una fecha específica (para reprocesamiento manual)
     */
    public async processSpecificDate(targetDate: string): Promise<ProcessingResult[]> {
        logger.info(`🔄 Iniciando procesamiento manual para fecha ${targetDate}`);

        const results: ProcessingResult[] = [];

        try {
            // Obtener todos los vehículos activos
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: this.config.organizationId,
                    active: true
                }
            });

            if (vehicles.length === 0) {
                logger.warn('No se encontraron vehículos activos para procesar');
                return results;
            }

            // Procesar cada vehículo
            for (const vehicle of vehicles) {
                const result = await this.processVehicle(vehicle.id, vehicle.name, targetDate);
                results.push(result);
            }

            // Generar reporte
            await this.generateDailyReport(results, targetDate);

            logger.info('✅ Procesamiento manual completado', {
                date: targetDate,
                totalVehicles: vehicles.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            });

        } catch (error) {
            logger.error('Error en procesamiento manual:', error);
        }

        return results;
    }

    /**
     * Obtiene el estado del servicio
     */
    public getStatus(): {
        isRunning: boolean;
        schedule: string;
        enabled: boolean;
        lastExecution?: Date;
    } {
        return {
            isRunning: this.isRunning,
            schedule: this.config.scheduleTime,
            enabled: this.config.enabled
        };
    }

    /**
     * Obtiene los reportes de procesamiento recientes
     */
    public async getRecentReports(limit: number = 10): Promise<any[]> {
        try {
            const reports = await prisma.dailyProcessingReport.findMany({
                where: {
                    organizationId: this.config.organizationId
                },
                orderBy: {
                    processingDate: 'desc'
                },
                take: limit
            });

            return reports;
        } catch (error) {
            logger.error('Error obteniendo reportes recientes:', error);
            return [];
        }
    }
}
