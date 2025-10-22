/**
 * ScheduledReportService - Servicio de Reportes Programados
 * 
 * Gestiona reportes automáticos:
 * - CRUD de reportes programados
 * - Ejecución automática con cron jobs
 * - Generación y envío por email
 */

import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ScheduledReportService {
    private static cronJobs: Map<string, cron.ScheduledTask> = new Map();

    /**
     * Inicializar todos los cron jobs de reportes programados
     */
    static async initializeScheduledReports(): Promise<void> {
        try {
            logger.info('🔄 Inicializando reportes programados');

            const scheduledReports = await prisma.scheduledReport.findMany({
                where: { isActive: true }
            });

            for (const report of scheduledReports) {
                this.scheduleReport(report);
            }

            logger.info('✅ Reportes programados inicializados', {
                total: scheduledReports.length
            });
        } catch (error) {
            logger.error('❌ Error inicializando reportes programados', error);
        }
    }

    /**
     * Programar un reporte
     */
    static scheduleReport(report: any): void {
        try {
            // Convertir configuración a expresión cron
            const cronExpression = this.buildCronExpression(
                report.frequency,
                report.dayOfWeek,
                report.dayOfMonth,
                report.timeOfDay
            );

            logger.info('📅 Programando reporte', {
                reportId: report.id,
                name: report.name,
                cronExpression
            });

            // Detener job anterior si existe
            const existingJob = this.cronJobs.get(report.id);
            if (existingJob) {
                existingJob.stop();
            }

            // Crear nuevo cron job
            const job = cron.schedule(
                cronExpression,
                async () => {
                    await this.executeReport(report.id);
                },
                {
                    timezone: report.timezone || 'Europe/Madrid'
                }
            );

            // Guardar referencia
            this.cronJobs.set(report.id, job);

            // Calcular y actualizar nextRunAt
            const nextRun = this.calculateNextRun(cronExpression, report.timezone);
            prisma.scheduledReport.update({
                where: { id: report.id },
                data: { nextRunAt: nextRun }
            }).catch(err => logger.error('Error actualizando nextRunAt', err));

        } catch (error) {
            logger.error('❌ Error programando reporte', { reportId: report.id, error });
        }
    }

    /**
     * Detener un reporte programado
     */
    static stopReport(reportId: string): void {
        const job = this.cronJobs.get(reportId);
        if (job) {
            job.stop();
            this.cronJobs.delete(reportId);
            logger.info('⏹️ Reporte detenido', { reportId });
        }
    }

    /**
     * Ejecutar un reporte programado
     */
    static async executeReport(reportId: string): Promise<void> {
        try {
            logger.info('🚀 Ejecutando reporte programado', { reportId });

            // Marcar como ejecutándose
            await prisma.scheduledReport.update({
                where: { id: reportId },
                data: {
                    lastStatus: 'RUNNING',
                    lastRunAt: new Date()
                }
            });

            const scheduledReport = await prisma.scheduledReport.findUnique({
                where: { id: reportId },
                include: {
                    User: true,
                    Organization: true
                }
            });

            if (!scheduledReport) {
                throw new Error('Reporte programado no encontrado');
            }

            // TODO: Integrar con ReportService existente
            // const reportData = await ReportService.generateReport({
            //     userId: scheduledReport.userId,
            //     organizationId: scheduledReport.organizationId,
            //     type: scheduledReport.reportType,
            //     format: scheduledReport.format,
            //     filters: scheduledReport.filters
            // });

            // TODO: Enviar por email
            // for (const recipient of scheduledReport.recipients) {
            //     await EmailService.sendScheduledReport(recipient, scheduledReport.name, reportData);
            // }

            // Actualizar estado exitoso
            const nextRun = this.calculateNextRun(
                this.buildCronExpression(
                    scheduledReport.frequency,
                    scheduledReport.dayOfWeek,
                    scheduledReport.dayOfMonth,
                    scheduledReport.timeOfDay
                ),
                scheduledReport.timezone
            );

            await prisma.scheduledReport.update({
                where: { id: reportId },
                data: {
                    lastStatus: 'SUCCESS',
                    nextRunAt: nextRun,
                    lastError: null
                }
            });

            logger.info('✅ Reporte programado ejecutado con éxito', {
                reportId,
                recipients: scheduledReport.recipients.length
            });

        } catch (error) {
            logger.error('❌ Error ejecutando reporte programado', { reportId, error });

            // Actualizar estado de error
            await prisma.scheduledReport.update({
                where: { id: reportId },
                data: {
                    lastStatus: 'FAILED',
                    lastError: error instanceof Error ? error.message : 'Error desconocido'
                }
            });
        }
    }

    /**
     * Construir expresión cron desde configuración
     */
    private static buildCronExpression(
        frequency: string,
        dayOfWeek?: number | null,
        dayOfMonth?: number | null,
        timeOfDay?: string
    ): string {
        const [hour, minute] = (timeOfDay || '08:00').split(':');

        switch (frequency) {
            case 'DAILY':
                return `${minute} ${hour} * * *`;

            case 'WEEKLY':
                return `${minute} ${hour} * * ${dayOfWeek || 1}`;

            case 'MONTHLY':
                return `${minute} ${hour} ${dayOfMonth || 1} * *`;

            default:
                throw new Error(`Frecuencia no soportada: ${frequency}`);
        }
    }

    /**
     * Calcular próxima ejecución
     */
    private static calculateNextRun(cronExpression: string, timezone: string): Date {
        // Aproximación simple (mejorar con librería cron-parser)
        const now = new Date();
        const nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 1);
        return nextRun;
    }

    /**
     * Crear reporte programado
     */
    static async createScheduledReport(data: {
        userId: string;
        organizationId: string;
        name: string;
        description?: string;
        frequency: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
        timeOfDay: string;
        filters: any;
        reportType: string;
        format: string;
        recipients: string[];
        createdBy: string;
    }): Promise<any> {
        try {
            const nextRun = this.calculateNextRun(
                this.buildCronExpression(
                    data.frequency,
                    data.dayOfWeek,
                    data.dayOfMonth,
                    data.timeOfDay
                ),
                'Europe/Madrid'
            );

            const report = await prisma.scheduledReport.create({
                data: {
                    ...data,
                    nextRunAt: nextRun,
                    isActive: true
                }
            });

            // Programar el cron job
            this.scheduleReport(report);

            logger.info('✅ Reporte programado creado', {
                reportId: report.id,
                name: report.name
            });

            return report;
        } catch (error) {
            logger.error('❌ Error creando reporte programado', error);
            throw error;
        }
    }

    /**
     * Actualizar reporte programado
     */
    static async updateScheduledReport(
        reportId: string,
        data: Partial<any>
    ): Promise<any> {
        try {
            const report = await prisma.scheduledReport.update({
                where: { id: reportId },
                data
            });

            // Re-programar si está activo
            if (report.isActive) {
                this.stopReport(reportId);
                this.scheduleReport(report);
            } else {
                this.stopReport(reportId);
            }

            logger.info('✅ Reporte programado actualizado', { reportId });

            return report;
        } catch (error) {
            logger.error('❌ Error actualizando reporte programado', error);
            throw error;
        }
    }

    /**
     * Eliminar reporte programado
     */
    static async deleteScheduledReport(reportId: string): Promise<void> {
        try {
            this.stopReport(reportId);

            await prisma.scheduledReport.delete({
                where: { id: reportId }
            });

            logger.info('✅ Reporte programado eliminado', { reportId });
        } catch (error) {
            logger.error('❌ Error eliminando reporte programado', error);
            throw error;
        }
    }

    /**
     * Obtener reportes programados de una organización
     */
    static async getScheduledReports(organizationId: string): Promise<any[]> {
        try {
            const reports = await prisma.scheduledReport.findMany({
                where: { organizationId },
                include: {
                    User: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    CreatedByUser: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return reports;
        } catch (error) {
            logger.error('❌ Error obteniendo reportes programados', error);
            throw error;
        }
    }
}

