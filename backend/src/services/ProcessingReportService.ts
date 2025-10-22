/**
 * 📊 SERVICIO DE REPORTES DE PROCESAMIENTO
 * 
 * Gestiona el almacenamiento y recuperación de reportes de procesamiento
 */

import { prisma } from '../lib/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProcessingReportService');

export interface ProcessingReportData {
    files: Array<{
        fileName: string;
        vehicleName: string;
        vehicleId: string;
        date: string;
        sessionsCreated: number;
        sessionsOmitted: number;
        sessionDetails: Array<{
            sessionNumber: number;
            sessionId: string;
            startTime: string;
            endTime: string;
            measurements: number;
            status: string;
            reason: string;
            archivos?: any;
            dataQuality?: any;
            eventsGenerated?: number;
            segmentsGenerated?: number;
            events?: Array<{
                type: string;
                severity: string;
                timestamp: Date;
                lat?: number;
                lon?: number;
            }>;
            geofenceEvents?: number;
            routeDistance?: number;
            routeConfidence?: number;
            speedViolations?: number;
            gpsPoints?: number;
            stabilityMeasurements?: number;
        }>;
    }>;
    summary: {
        totalFiles: number;
        totalSessionsCreated: number;
        totalSessionsOmitted: number;
        totalMeasurements: number;
        totalEvents: number;
        totalSegments: number;
        totalGeofenceEvents: number;
        totalRouteDistance: number;
        totalSpeedViolations: number;
        totalGpsPoints: number;
        totalStabilityMeasurements: number;
    };
}

export class ProcessingReportService {
    /**
     * Crear un nuevo reporte de procesamiento
     */
    static async createReport(
        userId: string,
        organizationId: string,
        reportType: string,
        reportData: ProcessingReportData
    ): Promise<string> {
        try {
            const report = await prisma.processingReport.create({
                data: {
                    userId,
                    organizationId,
                    reportType,
                    totalFiles: reportData.summary.totalFiles,
                    totalSessions: reportData.summary.totalSessionsCreated,
                    totalOmitted: reportData.summary.totalSessionsOmitted,
                    status: 'COMPLETED',
                    reportData: reportData as any,
                    endTime: new Date(),
                    duration: Math.floor((new Date().getTime() - new Date().getTime()) / 1000)
                }
            });

            logger.info(`✅ Reporte de procesamiento creado: ${report.id}`);
            return report.id;
        } catch (error: any) {
            logger.error(`❌ Error creando reporte: ${error.message}`);
            throw error;
        }
    }

    /**
     * Actualizar el estado de un reporte
     */
    static async updateReportStatus(
        reportId: string,
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
        errorMessage?: string
    ): Promise<void> {
        try {
            await prisma.processingReport.update({
                where: { id: reportId },
                data: {
                    status,
                    errorMessage,
                    endTime: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
                    duration: status === 'COMPLETED' || status === 'FAILED' ?
                        Math.floor((new Date().getTime() - new Date().getTime()) / 1000) : undefined
                }
            });

            logger.info(`✅ Estado del reporte actualizado: ${reportId} -> ${status}`);
        } catch (error: any) {
            logger.error(`❌ Error actualizando reporte: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener el último reporte de procesamiento
     * ✅ Solo filtra por organizationId para permitir acceso compartido
     */
    static async getLastReport(
        organizationId: string
    ): Promise<ProcessingReportData | null> {
        try {
            const report = await prisma.processingReport.findFirst({
                where: {
                    organizationId,
                    status: 'COMPLETED'
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (!report) {
                return null;
            }

            return report.reportData as ProcessingReportData;
        } catch (error: any) {
            logger.error(`❌ Error obteniendo último reporte: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener todos los reportes de procesamiento
     */
    static async getAllReports(
        userId: string,
        organizationId: string,
        limit: number = 10
    ): Promise<Array<{
        id: string;
        reportType: string;
        totalFiles: number;
        totalSessions: number;
        totalOmitted: number;
        status: string;
        startTime: Date;
        endTime: Date | null;
        duration: number | null;
        createdAt: Date;
    }>> {
        try {
            const reports = await prisma.processingReport.findMany({
                where: {
                    userId,
                    organizationId
                },
                select: {
                    id: true,
                    reportType: true,
                    totalFiles: true,
                    totalSessions: true,
                    totalOmitted: true,
                    status: true,
                    startTime: true,
                    endTime: true,
                    duration: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit
            });

            return reports;
        } catch (error: any) {
            logger.error(`❌ Error obteniendo reportes: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtener un reporte específico por ID
     */
    static async getReportById(
        reportId: string,
        userId: string,
        organizationId: string
    ): Promise<ProcessingReportData | null> {
        try {
            const report = await prisma.processingReport.findFirst({
                where: {
                    id: reportId,
                    userId,
                    organizationId
                }
            });

            if (!report) {
                return null;
            }

            return report.reportData as ProcessingReportData;
        } catch (error: any) {
            logger.error(`❌ Error obteniendo reporte por ID: ${error.message}`);
            throw error;
        }
    }

    /**
     * Eliminar un reporte
     */
    static async deleteReport(
        reportId: string,
        userId: string,
        organizationId: string
    ): Promise<void> {
        try {
            await prisma.processingReport.deleteMany({
                where: {
                    id: reportId,
                    userId,
                    organizationId
                }
            });

            logger.info(`✅ Reporte eliminado: ${reportId}`);
        } catch (error: any) {
            logger.error(`❌ Error eliminando reporte: ${error.message}`);
            throw error;
        }
    }
}

