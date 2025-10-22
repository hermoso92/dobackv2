
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';



interface ProcessingEvent {
    id: string;
    fileName: string;
    filePath: string;
    fileType: 'CAN' | 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';
    vehicleId: string;
    organizationId: string;
    status: 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    dataPointsProcessed?: number;
    processingTime?: number;
    errorMessage?: string;
    errorCode?: string;
    metadata?: any;
    timestamp: Date;
}

interface ProcessingStatistics {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    skippedFiles: number;
    totalDataPoints: number;
    averageProcessingTime: number;
    successRate: number;
    errorBreakdown: Record<string, number>;
    processingTrends: {
        hourly: Array<{ hour: string; processed: number; failed: number }>;
        daily: Array<{ date: string; processed: number; failed: number }>;
    };
    topErrors: Array<{ error: string; count: number }>;
    vehicleStats: Array<{
        vehicleId: string;
        vehicleName: string;
        filesProcessed: number;
        successRate: number;
        totalDataPoints: number;
    }>;
}

interface ProcessingHealth {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    issues: string[];
    recommendations: string[];
    lastProcessedFile?: Date;
    averageProcessingTime: number;
    errorRate: number;
    throughput: number; // files per hour
}

export class ProcessingTrackingService {
    /**
     * Registra el inicio del procesamiento de un archivo
     */
    async startProcessing(fileInfo: {
        fileName: string;
        filePath: string;
        fileType: 'CAN' | 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';
        vehicleId: string;
        organizationId: string;
        metadata?: any;
    }): Promise<string> {
        try {
            const eventId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const event: ProcessingEvent = {
                id: eventId,
                fileName: fileInfo.fileName,
                filePath: fileInfo.filePath,
                fileType: fileInfo.fileType,
                vehicleId: fileInfo.vehicleId,
                organizationId: fileInfo.organizationId,
                status: 'STARTED',
                timestamp: new Date(),
                metadata: fileInfo.metadata
            };

            // Guardar en base de datos
            await this.saveProcessingEvent(event);

            // Actualizar estado en FileStateManager
            await this.updateFileState(fileInfo.filePath, 'PROCESSING', eventId);

            logger.info('Inicio de procesamiento registrado', {
                eventId,
                fileName: fileInfo.fileName,
                fileType: fileInfo.fileType,
                vehicleId: fileInfo.vehicleId
            });

            return eventId;

        } catch (error) {
            logger.error('Error registrando inicio de procesamiento', { error, fileInfo });
            throw error;
        }
    }

    /**
     * Actualiza el progreso del procesamiento
     */
    async updateProgress(eventId: string, dataPointsProcessed: number, metadata?: any): Promise<void> {
        try {
            const event = await this.getProcessingEvent(eventId);
            if (!event) {
                throw new Error(`Evento de procesamiento no encontrado: ${eventId}`);
            }

            event.status = 'PROCESSING';
            event.dataPointsProcessed = dataPointsProcessed;
            event.metadata = { ...event.metadata, ...metadata };

            await this.saveProcessingEvent(event);

            logger.debug('Progreso de procesamiento actualizado', {
                eventId,
                dataPointsProcessed,
                fileName: event.fileName
            });

        } catch (error) {
            logger.error('Error actualizando progreso de procesamiento', { error, eventId });
            throw error;
        }
    }

    /**
     * Registra la finalización exitosa del procesamiento
     */
    async completeProcessing(eventId: string, dataPointsProcessed: number, processingTime: number, metadata?: any): Promise<void> {
        try {
            const event = await this.getProcessingEvent(eventId);
            if (!event) {
                throw new Error(`Evento de procesamiento no encontrado: ${eventId}`);
            }

            event.status = 'COMPLETED';
            event.dataPointsProcessed = dataPointsProcessed;
            event.processingTime = processingTime;
            event.metadata = { ...event.metadata, ...metadata };

            await this.saveProcessingEvent(event);

            // Actualizar estado en FileStateManager
            await this.updateFileState(event.filePath, 'COMPLETED', eventId, {
                dataPointsCount: dataPointsProcessed,
                processingTime,
                metadata
            });

            logger.info('Procesamiento completado exitosamente', {
                eventId,
                fileName: event.fileName,
                dataPointsProcessed,
                processingTime: `${processingTime}ms`
            });

        } catch (error) {
            logger.error('Error registrando finalización de procesamiento', { error, eventId });
            throw error;
        }
    }

    /**
     * Registra un fallo en el procesamiento
     */
    async failProcessing(eventId: string, errorMessage: string, errorCode?: string, metadata?: any): Promise<void> {
        try {
            const event = await this.getProcessingEvent(eventId);
            if (!event) {
                throw new Error(`Evento de procesamiento no encontrado: ${eventId}`);
            }

            event.status = 'FAILED';
            event.errorMessage = errorMessage;
            event.errorCode = errorCode;
            event.metadata = { ...event.metadata, ...metadata };

            await this.saveProcessingEvent(event);

            // Actualizar estado en FileStateManager
            await this.updateFileState(event.filePath, 'FAILED', eventId, {
                processingErrors: [errorMessage],
                metadata
            });

            logger.error('Procesamiento falló', {
                eventId,
                fileName: event.fileName,
                errorMessage,
                errorCode
            });

        } catch (error) {
            logger.error('Error registrando fallo de procesamiento', { error, eventId });
            throw error;
        }
    }

    /**
     * Marca un archivo como omitido
     */
    async skipProcessing(eventId: string, reason: string, metadata?: any): Promise<void> {
        try {
            const event = await this.getProcessingEvent(eventId);
            if (!event) {
                throw new Error(`Evento de procesamiento no encontrado: ${eventId}`);
            }

            event.status = 'SKIPPED';
            event.metadata = { ...event.metadata, reason, ...metadata };

            await this.saveProcessingEvent(event);

            // Actualizar estado en FileStateManager
            await this.updateFileState(event.filePath, 'SKIPPED', eventId, {
                metadata: { ...metadata, reason }
            });

            logger.info('Procesamiento omitido', {
                eventId,
                fileName: event.fileName,
                reason
            });

        } catch (error) {
            logger.error('Error registrando omisión de procesamiento', { error, eventId });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de procesamiento
     */
    async getProcessingStatistics(organizationId: string, timeRange?: { start: Date; end: Date }): Promise<ProcessingStatistics> {
        try {
            const whereClause = {
                organizationId,
                ...(timeRange && {
                    timestamp: {
                        gte: timeRange.start,
                        lte: timeRange.end
                    }
                })
            };

            // Estadísticas básicas
            const [totalFiles, successfulFiles, failedFiles, skippedFiles] = await Promise.all([
                prisma.processingEvent.count({ where: whereClause }),
                prisma.processingEvent.count({ where: { ...whereClause, status: 'COMPLETED' } }),
                prisma.processingEvent.count({ where: { ...whereClause, status: 'FAILED' } }),
                prisma.processingEvent.count({ where: { ...whereClause, status: 'SKIPPED' } })
            ]);

            // Total de puntos de datos
            const completedEvents = await prisma.processingEvent.findMany({
                where: { ...whereClause, status: 'COMPLETED' },
                select: { dataPointsProcessed: true, processingTime: true }
            });

            const totalDataPoints = completedEvents.reduce((sum, event) => sum + (event.dataPointsProcessed || 0), 0);
            const averageProcessingTime = completedEvents.length > 0
                ? completedEvents.reduce((sum, event) => sum + (event.processingTime || 0), 0) / completedEvents.length
                : 0;

            const successRate = totalFiles > 0 ? (successfulFiles / totalFiles) * 100 : 0;

            // Desglose de errores
            const errorEvents = await prisma.processingEvent.findMany({
                where: { ...whereClause, status: 'FAILED' },
                select: { errorCode: true, errorMessage: true }
            });

            const errorBreakdown = errorEvents.reduce((acc, event) => {
                const errorKey = event.errorCode || 'UNKNOWN_ERROR';
                acc[errorKey] = (acc[errorKey] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // Top errores
            const topErrors = Object.entries(errorBreakdown)
                .map(([error, count]) => ({ error, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Tendencias por hora (últimas 24 horas)
            const hourlyTrends = await this.getHourlyTrends(organizationId, timeRange);

            // Tendencias por día (últimos 30 días)
            const dailyTrends = await this.getDailyTrends(organizationId, timeRange);

            // Estadísticas por vehículo
            const vehicleStats = await this.getVehicleStatistics(organizationId, timeRange);

            return {
                totalFiles,
                successfulFiles,
                failedFiles,
                skippedFiles,
                totalDataPoints,
                averageProcessingTime,
                successRate,
                errorBreakdown,
                processingTrends: {
                    hourly: hourlyTrends,
                    daily: dailyTrends
                },
                topErrors,
                vehicleStats
            };

        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento', { error, organizationId });
            throw error;
        }
    }

    /**
     * Evalúa la salud del sistema de procesamiento
     */
    async getProcessingHealth(organizationId: string): Promise<ProcessingHealth> {
        try {
            const last24Hours = new Date();
            last24Hours.setHours(last24Hours.getHours() - 24);

            const stats = await this.getProcessingStatistics(organizationId, {
                start: last24Hours,
                end: new Date()
            });

            const issues: string[] = [];
            const recommendations: string[] = [];

            // Evaluar tasa de error
            const errorRate = stats.totalFiles > 0 ? (stats.failedFiles / stats.totalFiles) * 100 : 0;
            if (errorRate > 20) {
                issues.push(`Alta tasa de errores: ${errorRate.toFixed(1)}%`);
                recommendations.push('Revisar logs de errores y mejorar validación de archivos');
            } else if (errorRate > 10) {
                issues.push(`Tasa de errores elevada: ${errorRate.toFixed(1)}%`);
                recommendations.push('Monitorear patrones de errores');
            }

            // Evaluar throughput
            const throughput = stats.totalFiles / 24; // archivos por hora
            if (throughput < 1) {
                issues.push('Throughput muy bajo: menos de 1 archivo por hora');
                recommendations.push('Optimizar procesamiento y revisar recursos del sistema');
            }

            // Evaluar tiempo de procesamiento
            if (stats.averageProcessingTime > 30000) { // 30 segundos
                issues.push(`Tiempo de procesamiento alto: ${(stats.averageProcessingTime / 1000).toFixed(1)}s promedio`);
                recommendations.push('Optimizar algoritmos de procesamiento');
            }

            // Obtener último archivo procesado
            const lastProcessedFile = await prisma.processingEvent.findFirst({
                where: { organizationId, status: 'COMPLETED' },
                orderBy: { timestamp: 'desc' },
                select: { timestamp: true }
            });

            // Determinar estado de salud
            let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
            if (issues.length > 2 || errorRate > 30) {
                status = 'CRITICAL';
            } else if (issues.length > 0 || errorRate > 15) {
                status = 'WARNING';
            }

            return {
                status,
                issues,
                recommendations,
                lastProcessedFile: lastProcessedFile?.timestamp,
                averageProcessingTime: stats.averageProcessingTime,
                errorRate,
                throughput
            };

        } catch (error) {
            logger.error('Error evaluando salud del procesamiento', { error, organizationId });
            throw error;
        }
    }

    /**
     * Obtiene eventos de procesamiento recientes
     */
    async getRecentProcessingEvents(organizationId: string, limit: number = 50): Promise<ProcessingEvent[]> {
        try {
            const events = await prisma.processingEvent.findMany({
                where: { organizationId },
                orderBy: { timestamp: 'desc' },
                take: limit
            });

            return events.map(event => ({
                id: event.id,
                fileName: event.fileName,
                filePath: event.filePath,
                fileType: event.fileType as any,
                vehicleId: event.vehicleId,
                organizationId: event.organizationId,
                status: event.status as any,
                dataPointsProcessed: event.dataPointsProcessed,
                processingTime: event.processingTime,
                errorMessage: event.errorMessage,
                errorCode: event.errorCode,
                metadata: event.metadata,
                timestamp: event.timestamp
            }));

        } catch (error) {
            logger.error('Error obteniendo eventos recientes', { error, organizationId });
            throw error;
        }
    }

    /**
     * Métodos privados de ayuda
     */
    private async saveProcessingEvent(event: ProcessingEvent): Promise<void> {
        await prisma.processingEvent.upsert({
            where: { id: event.id },
            update: {
                status: event.status,
                dataPointsProcessed: event.dataPointsProcessed,
                processingTime: event.processingTime,
                errorMessage: event.errorMessage,
                errorCode: event.errorCode,
                metadata: event.metadata
            },
            create: {
                id: event.id,
                fileName: event.fileName,
                filePath: event.filePath,
                fileType: event.fileType,
                vehicleId: event.vehicleId,
                organizationId: event.organizationId,
                status: event.status,
                dataPointsProcessed: event.dataPointsProcessed,
                processingTime: event.processingTime,
                errorMessage: event.errorMessage,
                errorCode: event.errorCode,
                metadata: event.metadata,
                timestamp: event.timestamp
            }
        });
    }

    private async getProcessingEvent(eventId: string): Promise<ProcessingEvent | null> {
        const event = await prisma.processingEvent.findUnique({
            where: { id: eventId }
        });

        if (!event) return null;

        return {
            id: event.id,
            fileName: event.fileName,
            filePath: event.filePath,
            fileType: event.fileType as any,
            vehicleId: event.vehicleId,
            organizationId: event.organizationId,
            status: event.status as any,
            dataPointsProcessed: event.dataPointsProcessed,
            processingTime: event.processingTime,
            errorMessage: event.errorMessage,
            errorCode: event.errorCode,
            metadata: event.metadata,
            timestamp: event.timestamp
        };
    }

    private async updateFileState(filePath: string, status: string, eventId: string, metadata?: any): Promise<void> {
        try {
            await prisma.fileState.updateMany({
                where: { filePath },
                data: {
                    processingStatus: status as any,
                    lastProcessedAt: new Date(),
                    processingErrors: metadata?.processingErrors,
                    metadata: metadata
                }
            });
        } catch (error) {
            logger.warn('Error actualizando FileState', { error, filePath, status });
        }
    }

    private async getHourlyTrends(organizationId: string, timeRange?: { start: Date; end: Date }): Promise<Array<{ hour: string; processed: number; failed: number }>> {
        const start = timeRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000);
        const end = timeRange?.end || new Date();

        const events = await prisma.processingEvent.findMany({
            where: {
                organizationId,
                timestamp: { gte: start, lte: end },
                status: { in: ['COMPLETED', 'FAILED'] }
            },
            select: { timestamp: true, status: true }
        });

        const hourlyData: Record<string, { processed: number; failed: number }> = {};

        events.forEach(event => {
            const hour = event.timestamp.toISOString().substr(0, 13) + ':00:00';
            if (!hourlyData[hour]) {
                hourlyData[hour] = { processed: 0, failed: 0 };
            }
            if (event.status === 'COMPLETED') {
                hourlyData[hour].processed++;
            } else if (event.status === 'FAILED') {
                hourlyData[hour].failed++;
            }
        });

        return Object.entries(hourlyData)
            .map(([hour, data]) => ({ hour, ...data }))
            .sort((a, b) => a.hour.localeCompare(b.hour));
    }

    private async getDailyTrends(organizationId: string, timeRange?: { start: Date; end: Date }): Promise<Array<{ date: string; processed: number; failed: number }>> {
        const start = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = timeRange?.end || new Date();

        const events = await prisma.processingEvent.findMany({
            where: {
                organizationId,
                timestamp: { gte: start, lte: end },
                status: { in: ['COMPLETED', 'FAILED'] }
            },
            select: { timestamp: true, status: true }
        });

        const dailyData: Record<string, { processed: number; failed: number }> = {};

        events.forEach(event => {
            const date = event.timestamp.toISOString().substr(0, 10);
            if (!dailyData[date]) {
                dailyData[date] = { processed: 0, failed: 0 };
            }
            if (event.status === 'COMPLETED') {
                dailyData[date].processed++;
            } else if (event.status === 'FAILED') {
                dailyData[date].failed++;
            }
        });

        return Object.entries(dailyData)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private async getVehicleStatistics(organizationId: string, timeRange?: { start: Date; end: Date }): Promise<Array<{
        vehicleId: string;
        vehicleName: string;
        filesProcessed: number;
        successRate: number;
        totalDataPoints: number;
    }>> {
        const whereClause = {
            organizationId,
            ...(timeRange && {
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                }
            })
        };

        const events = await prisma.processingEvent.findMany({
            where: whereClause,
            select: {
                vehicleId: true,
                status: true,
                dataPointsProcessed: true,
                vehicle: {
                    select: { name: true }
                }
            }
        });

        const vehicleStats: Record<string, {
            vehicleName: string;
            total: number;
            successful: number;
            totalDataPoints: number;
        }> = {};

        events.forEach(event => {
            const vehicleId = event.vehicleId;
            if (!vehicleStats[vehicleId]) {
                vehicleStats[vehicleId] = {
                    vehicleName: event.vehicle?.name || 'Desconocido',
                    total: 0,
                    successful: 0,
                    totalDataPoints: 0
                };
            }

            vehicleStats[vehicleId].total++;
            if (event.status === 'COMPLETED') {
                vehicleStats[vehicleId].successful++;
                vehicleStats[vehicleId].totalDataPoints += event.dataPointsProcessed || 0;
            }
        });

        return Object.entries(vehicleStats).map(([vehicleId, stats]) => ({
            vehicleId,
            vehicleName: stats.vehicleName,
            filesProcessed: stats.total,
            successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
            totalDataPoints: stats.totalDataPoints
        })).sort((a, b) => b.filesProcessed - a.filesProcessed);
    }
}
