/**
 * Servicio de alertas
 * 
 * Gestiona alertas de:
 * - Archivos faltantes (verificación diaria automática)
 * - Calidad GPS baja (< 30% CRITICAL, < 50% WARNING)
 * - Notificaciones a usuarios MANAGER
 * 
 * Características:
 * - Severidad calculada automáticamente
 * - Notificaciones In-App + Email (según preferencias usuario)
 * - Resolución manual con notas
 * - Estadísticas agregadas por organización
 * 
 * Nuevas funcionalidades:
 * - createGPSQualityAlert(): Alertas automáticas desde kpiCalculator
 * - Notificaciones contextualizadas con recomendaciones accionables
 */

import { AlertSeverity, AlertStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const isAlertStatus = (value?: string): value is AlertStatus =>
    !!value && Object.values(AlertStatus).includes(value as AlertStatus);

const isAlertSeverity = (value?: string): value is AlertSeverity =>
    !!value && Object.values(AlertSeverity).includes(value as AlertSeverity);

export class AlertService {
    /**
     * Verificar archivos faltantes del día anterior
     * Ejecutar diariamente a las 08:00 AM
     */
    static async checkMissingFiles(): Promise<any[]> {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);

            logger.info('🔍 Verificando archivos faltantes', { date: yesterday.toISOString() });

            // Obtener todos los vehículos activos
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    active: true,
                    status: 'ACTIVE'
                },
                include: {
                    Organization: true
                }
            });

            const alerts: any[] = [];
            const expectedFileTypes = ['CAN', 'ESTABILIDAD', 'GPS', 'ROTATIVO'];

            for (const vehicle of vehicles) {
                // Verificar archivos subidos ayer
                const uploadedFiles = await prisma.archivoSubido.findMany({
                    where: {
                        vehicleId: vehicle.id,
                        uploadedAt: {
                            gte: yesterday,
                            lte: endOfYesterday
                        }
                    },
                    select: {
                        fileType: true
                    }
                });

                const uploadedTypes = [...new Set(uploadedFiles.map(f => f.fileType))];
                const missingTypes = expectedFileTypes.filter(type => !uploadedTypes.includes(type));

                if (missingTypes.length > 0) {
                    // Calcular severidad
                    const severity = this.calculateSeverity(missingTypes.length, expectedFileTypes.length);

                    // Crear o actualizar alerta
                    const alert = await prisma.missingFileAlert.upsert({
                        where: {
                            organizationId_vehicleId_date: {
                                organizationId: vehicle.organizationId,
                                vehicleId: vehicle.id,
                                date: yesterday
                            }
                        },
                        update: {
                            missingFiles: missingTypes,
                            uploadedFiles: uploadedTypes,
                            status: AlertStatus.PENDING,
                            severity,
                            updatedAt: new Date()
                        },
                        create: {
                            organizationId: vehicle.organizationId,
                            vehicleId: vehicle.id,
                            date: yesterday,
                            expectedFiles: expectedFileTypes,
                            missingFiles: missingTypes,
                            uploadedFiles: uploadedTypes,
                            status: AlertStatus.PENDING,
                            severity
                        },
                        include: {
                            Vehicle: true,
                            Organization: true
                        }
                    });

                    alerts.push(alert);

                    // Notificar usuarios MANAGER
                    await this.notifyManagers(vehicle.organizationId, alert, vehicle);
                }
            }

            logger.info('✅ Verificación de archivos completada', {
                totalVehicles: vehicles.length,
                alertsCreated: alerts.length
            });

            return alerts;
        } catch (error) {
            logger.error('❌ Error verificando archivos faltantes', error);
            throw error;
        }
    }

    /**
     * Calcular severidad según cantidad de archivos faltantes
     */
    private static calculateSeverity(missing: number, total: number): AlertSeverity {
        const percentage = (missing / total) * 100;
        if (percentage >= 75) return AlertSeverity.CRITICAL;  // 3-4 archivos faltantes
        if (percentage >= 50) return AlertSeverity.ERROR;     // 2 archivos faltantes
        if (percentage >= 25) return AlertSeverity.WARNING;   // 1 archivo faltante
        return AlertSeverity.INFO;
    }

    /**
     * Notificar a usuarios MANAGER de la organización
     */
    private static async notifyManagers(
        organizationId: string,
        alert: any,
        vehicle: any
    ): Promise<void> {
        try {
            // Buscar MANAGERS de la organización
            const managers = await prisma.user.findMany({
                where: {
                    organizationId,
                    role: 'MANAGER',
                    status: 'ACTIVE'
                },
                include: {
                    UserConfig: true
                }
            });

            const notifiedUserIds: string[] = [];

            for (const manager of managers) {
                // Verificar preferencias de notificación
                const preferences = manager.UserConfig?.notificationPreferences as any;
                const emailEnabled = preferences?.emailAlerts !== false;

                // Crear notificación in-app
                await prisma.notification.create({
                    data: {
                        userId: manager.id,
                        type: 'ALERT',
                        channel: 'IN_APP',
                        title: `⚠️ Archivos faltantes - ${vehicle.name}`,
                        message: `Faltan ${alert.missingFiles.length} archivo(s) del ${new Date(alert.date).toLocaleDateString('es-ES')}: ${alert.missingFiles.join(', ')}`,
                        priority: alert.severity,
                        relatedEntity: 'MissingFileAlert',
                        relatedEntityId: alert.id,
                        status: 'PENDING'
                    }
                });

                notifiedUserIds.push(manager.id);

                // TODO: Enviar email si está habilitado
                // if (emailEnabled) {
                //     await EmailService.sendMissingFilesAlert(manager.email, manager.name, vehicle, alert);
                // }
            }

            // Actualizar alerta con usuarios notificados
            await prisma.missingFileAlert.update({
                where: { id: alert.id },
                data: {
                    notifiedAt: new Date(),
                    notifiedUsers: notifiedUserIds,
                    status: AlertStatus.NOTIFIED
                }
            });

            logger.info('📧 Managers notificados', {
                alertId: alert.id,
                vehicleId: vehicle.id,
                managersNotified: managers.length
            });
        } catch (error) {
            logger.error('❌ Error notificando managers', error);
        }
    }

    /**
     * Obtener alertas de una organización
     */
    static async getAlerts(organizationId: string, filters?: {
        status?: string;
        severity?: string;
        vehicleId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<any[]> {
        try {
            const where: any = {
                organizationId
            };

            if (isAlertStatus(filters?.status)) {
                where.status = filters.status;
            }

            if (isAlertSeverity(filters?.severity)) {
                where.severity = filters.severity;
            }

            if (filters?.vehicleId) {
                where.vehicleId = filters.vehicleId;
            }

            if (filters?.startDate || filters?.endDate) {
                where.date = {};
                if (filters.startDate) {
                    where.date.gte = filters.startDate;
                }
                if (filters.endDate) {
                    where.date.lte = filters.endDate;
                }
            }

            const alerts = await prisma.missingFileAlert.findMany({
                where,
                include: {
                    Vehicle: {
                        select: {
                            id: true,
                            name: true,
                            identifier: true,
                            licensePlate: true
                        }
                    },
                    Organization: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    date: 'desc'
                }
            });

            return alerts.map(alert => {
                const { User, ...rest } = alert as typeof alert & { User?: any };
                return {
                    ...rest,
                    resolvedByUser: User
                };
            });
        } catch (error) {
            logger.error('❌ Error obteniendo alertas', error);
            throw error;
        }
    }

    /**
     * Resolver una alerta
     */
    static async resolveAlert(
        alertId: string,
        userId: string,
        notes?: string
    ): Promise<any> {
        try {
            const alert = await prisma.missingFileAlert.update({
                where: { id: alertId },
                data: {
                    status: AlertStatus.RESOLVED,
                    resolvedAt: new Date(),
                    resolvedBy: userId,
                    resolutionNotes: notes
                },
                include: {
                    Vehicle: true,
                    Organization: true,
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            logger.info('✅ Alerta resuelta', {
                alertId,
                userId,
                vehicleId: alert.vehicleId
            });

            const { User, ...rest } = alert as typeof alert & { User?: any };
            return {
                ...rest,
                resolvedByUser: User
            };
        } catch (error) {
            logger.error('❌ Error resolviendo alerta', error);
            throw error;
        }
    }

    /**
     * Ignorar una alerta
     */
    static async ignoreAlert(alertId: string, userId: string): Promise<any> {
        try {
            const alert = await prisma.missingFileAlert.update({
                where: { id: alertId },
                data: {
                    status: AlertStatus.IGNORED,
                    resolvedBy: userId,
                    resolvedAt: new Date()
                }
            });

            logger.info('ℹ️ Alerta ignorada', { alertId, userId });

            return alert;
        } catch (error) {
            logger.error('❌ Error ignorando alerta', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de alertas
     */
    static async getAlertStats(organizationId: string): Promise<any> {
        try {
            const [
                totalAlerts,
                pendingAlerts,
                criticalAlerts,
                resolvedLast7Days
            ] = await Promise.all([
                prisma.missingFileAlert.count({
                    where: { organizationId }
                }),
                prisma.missingFileAlert.count({
                    where: {
                        organizationId,
                        status: { in: [AlertStatus.PENDING, AlertStatus.NOTIFIED] }
                    }
                }),
                prisma.missingFileAlert.count({
                    where: {
                        organizationId,
                        severity: AlertSeverity.CRITICAL,
                        status: { in: [AlertStatus.PENDING, AlertStatus.NOTIFIED] }
                    }
                }),
                prisma.missingFileAlert.count({
                    where: {
                        organizationId,
                        status: AlertStatus.RESOLVED,
                        resolvedAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                })
            ]);

            // Alertas por vehículo
            const alertsByVehicle = await prisma.missingFileAlert.groupBy({
                by: ['vehicleId'],
                where: {
                    organizationId,
                    status: { in: [AlertStatus.PENDING, AlertStatus.NOTIFIED] }
                },
                _count: {
                    _all: true
                }
            });

            return {
                totalAlerts,
                pendingAlerts,
                criticalAlerts,
                resolvedLast7Days,
                alertsByVehicle: alertsByVehicle.map(item => ({
                    vehicleId: item.vehicleId,
                    count: item._count._all
                }))
            };
        } catch (error) {
            logger.error('❌ Error obteniendo estadísticas de alertas', error);
            throw error;
        }
    }

    /**
     * Crear alerta de calidad GPS baja
     * Llamado automáticamente desde kpiCalculator cuando GPS < 50%
     */
    static async createGPSQualityAlert(
        organizationId: string,
        vehicleId: string,
        sessionIds: string[],
        gpsQuality: number
    ): Promise<void> {
        try {
            const severity = gpsQuality < 30 ? 'CRITICAL' : 'WARNING';
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: vehicleId },
                select: { name: true, identifier: true }
            });

            const alert = await prisma.alert.create({
                data: {
                    type: 'GPS_QUALITY',
                    severity,
                    title: `Calidad GPS ${severity === 'CRITICAL' ? 'CRÍTICA' : 'BAJA'} - ${vehicle?.name || vehicleId}`,
                    description: `Calidad GPS: ${gpsQuality.toFixed(1)}% válido. ${severity === 'CRITICAL' ? 'Verificar hardware urgentemente.' : 'Revisar antena GPS.'}`,
                    vehicleId,
                    organizationId,
                    metadata: {
                        gpsQuality,
                        sessionIds,
                        threshold: gpsQuality < 30 ? 30 : 50
                    }
                }
            });

            // Notificar MANAGER
            const managers = await prisma.user.findMany({
                where: {
                    organizationId,
                    role: 'MANAGER',
                    status: 'ACTIVE'
                }
            });

            for (const manager of managers) {
                await prisma.notification.create({
                    data: {
                        userId: manager.id,
                        type: 'ALERT',
                        channel: 'IN_APP',
                        title: alert.title,
                        message: alert.description,
                        priority: severity,
                        relatedEntity: 'Alert',
                        relatedEntityId: alert.id,
                        status: 'PENDING'
                    }
                });
            }

            logger.info(`✅ Alerta GPS creada: ${alert.title}`);
        } catch (error) {
            logger.error('❌ Error creando alerta GPS', error);
        }
    }
}
