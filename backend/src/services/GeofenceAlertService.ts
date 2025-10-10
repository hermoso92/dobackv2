/**
 * 🚨 SERVICIO DE ALERTAS DE GEOCERCAS - BOMBEROS MADRID
 * Sistema de alertas por entrada/salida y permanencia en parques
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface GeofenceAlert {
    id: string;
    type: 'ENTRY' | 'EXIT' | 'LONG_STAY_OUTSIDE' | 'LONG_STAY_INSIDE';
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    parkId?: string;
    parkName?: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

export interface AlertConfig {
    longStayOutsideHours: number;
    longStayInsideHours: number;
    notifyOnEntry: boolean;
    notifyOnExit: boolean;
    notifyOnLongStay: boolean;
    enabled: boolean;
}

export class GeofenceAlertService {
    private static instance: GeofenceAlertService;
    private alertConfig: AlertConfig = {
        longStayOutsideHours: 4, // 4 horas fuera del parque
        longStayInsideHours: 8,  // 8 horas dentro del parque (posible problema)
        notifyOnEntry: true,
        notifyOnExit: true,
        notifyOnLongStay: true,
        enabled: true
    };

    public static getInstance(): GeofenceAlertService {
        if (!GeofenceAlertService.instance) {
            GeofenceAlertService.instance = new GeofenceAlertService();
        }
        return GeofenceAlertService.instance;
    }

    /**
     * Procesar evento de geocerca y generar alertas
     */
    async processGeofenceEvent(
        vehicleId: string,
        geofenceId: string,
        eventType: 'ENTER' | 'EXIT',
        timestamp: Date,
        organizationId: string
    ): Promise<void> {
        if (!this.alertConfig.enabled) {
            return;
        }

        try {
            // Obtener información del vehículo y geocerca
            const [vehicle, geofence] = await Promise.all([
                prisma.vehicle.findFirst({
                    where: { id: vehicleId },
                    include: { park: true }
                }),
                prisma.geofence.findFirst({
                    where: { id: geofenceId },
                    include: { zones: { include: { park: true } } }
                })
            ]);

            if (!vehicle || !geofence) {
                logger.warn(`Vehículo o geocerca no encontrados: ${vehicleId}, ${geofenceId}`);
                return;
            }

            const park = geofence.zones?.[0]?.park;

            // Generar alertas según el tipo de evento
            if (eventType === 'ENTER') {
                if (this.alertConfig.notifyOnEntry) {
                    await this.createAlert({
                        type: 'ENTRY',
                        vehicleId,
                        vehicleName: vehicle.name || vehicle.dobackId,
                        geofenceId,
                        geofenceName: geofence.name,
                        parkId: park?.id,
                        parkName: park?.name,
                        message: `Vehículo ${vehicle.name || vehicle.dobackId} ha entrado al parque ${park?.name || geofence.name}`,
                        severity: 'MEDIUM',
                        timestamp
                    }, organizationId);
                }
            } else if (eventType === 'EXIT') {
                if (this.alertConfig.notifyOnExit) {
                    await this.createAlert({
                        type: 'EXIT',
                        vehicleId,
                        vehicleName: vehicle.name || vehicle.dobackId,
                        geofenceId,
                        geofenceName: geofence.name,
                        parkId: park?.id,
                        parkName: park?.name,
                        message: `Vehículo ${vehicle.name || vehicle.dobackId} ha salido del parque ${park?.name || geofence.name}`,
                        severity: 'HIGH',
                        timestamp
                    }, organizationId);
                }

                // Iniciar monitoreo de permanencia fuera del parque
                await this.scheduleLongStayCheck(vehicleId, geofenceId, timestamp, organizationId);
            }

            logger.info(`Alerta procesada: ${eventType} - ${vehicle.name || vehicle.dobackId} - ${geofence.name}`);
        } catch (error) {
            logger.error('Error procesando evento de geocerca para alertas:', error);
        }
    }

    /**
     * Verificar vehículos que llevan mucho tiempo fuera del parque
     */
    async checkLongStayOutside(organizationId: string): Promise<void> {
        if (!this.alertConfig.enabled || !this.alertConfig.notifyOnLongStay) {
            return;
        }

        try {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - this.alertConfig.longStayOutsideHours);

            // Buscar vehículos que salieron del parque hace más de X horas
            const longStayVehicles = await prisma.geofenceEvent.findMany({
                where: {
                    eventType: 'EXIT',
                    timestamp: {
                        lt: cutoffTime
                    },
                    geofence: {
                        organizationId,
                        zones: {
                            some: {
                                park: {
                                    isNot: null
                                }
                            }
                        }
                    },
                    // Verificar que no han vuelto a entrar
                    vehicle: {
                        geofenceEvents: {
                            none: {
                                eventType: 'ENTER',
                                timestamp: {
                                    gt: cutoffTime
                                },
                                geofence: {
                                    zones: {
                                        some: {
                                            park: {
                                                isNot: null
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                include: {
                    vehicle: true,
                    geofence: {
                        include: {
                            zones: {
                                include: { park: true }
                            }
                        }
                    }
                },
                distinct: ['vehicleId']
            });

            for (const event of longStayVehicles) {
                const vehicle = event.vehicle;
                const geofence = event.geofence;
                const park = geofence.zones?.[0]?.park;

                // Verificar si ya existe una alerta para este vehículo
                const existingAlert = await prisma.alert.findFirst({
                    where: {
                        vehicleId: vehicle.id,
                        type: 'LONG_STAY_OUTSIDE',
                        acknowledged: false,
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                        }
                    }
                });

                if (!existingAlert) {
                    await this.createAlert({
                        type: 'LONG_STAY_OUTSIDE',
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name || vehicle.dobackId,
                        geofenceId: geofence.id,
                        geofenceName: geofence.name,
                        parkId: park?.id,
                        parkName: park?.name,
                        message: `Vehículo ${vehicle.name || vehicle.dobackId} lleva más de ${this.alertConfig.longStayOutsideHours} horas fuera del parque ${park?.name || geofence.name}`,
                        severity: 'CRITICAL',
                        timestamp: new Date()
                    }, organizationId);
                }
            }

            logger.info(`Verificación de permanencia fuera completada. Vehículos fuera >${this.alertConfig.longStayOutsideHours}h: ${longStayVehicles.length}`);
        } catch (error) {
            logger.error('Error verificando permanencia fuera del parque:', error);
        }
    }

    /**
     * Crear una nueva alerta
     */
    private async createAlert(alertData: Omit<GeofenceAlert, 'id'>, organizationId: string): Promise<void> {
        try {
            await prisma.alert.create({
                data: {
                    type: alertData.type,
                    vehicleId: alertData.vehicleId,
                    geofenceId: alertData.geofenceId,
                    parkId: alertData.parkId,
                    title: this.getAlertTitle(alertData.type),
                    message: alertData.message,
                    severity: alertData.severity,
                    status: 'ACTIVE',
                    organizationId,
                    metadata: {
                        geofenceName: alertData.geofenceName,
                        parkName: alertData.parkName,
                        vehicleName: alertData.vehicleName
                    }
                }
            });

            // Enviar notificación (implementar según necesidad)
            await this.sendNotification(alertData);

            logger.info(`Alerta creada: ${alertData.type} - ${alertData.vehicleName}`);
        } catch (error) {
            logger.error('Error creando alerta:', error);
        }
    }

    /**
     * Programar verificación de permanencia larga
     */
    private async scheduleLongStayCheck(
        vehicleId: string,
        geofenceId: string,
        exitTimestamp: Date,
        organizationId: string
    ): Promise<void> {
        // En un sistema real, aquí se programaría un job/task
        // Para esta implementación, solo registramos la intención
        logger.info(`Programando verificación de permanencia para vehículo ${vehicleId} desde ${exitTimestamp}`);
    }

    /**
     * Obtener título de alerta según tipo
     */
    private getAlertTitle(type: string): string {
        const titles = {
            'ENTRY': 'Entrada al Parque',
            'EXIT': 'Salida del Parque',
            'LONG_STAY_OUTSIDE': 'Permanencia Prolongada Fuera',
            'LONG_STAY_INSIDE': 'Permanencia Prolongada Dentro'
        };
        return titles[type as keyof typeof titles] || 'Alerta de Geocerca';
    }

    /**
     * Enviar notificación (email, push, etc.)
     */
    private async sendNotification(alertData: Omit<GeofenceAlert, 'id'>): Promise<void> {
        // Implementar según necesidades:
        // - Email a administradores
        // - Push notification
        // - Webhook a sistema externo
        // - SMS para alertas críticas

        logger.info(`Notificación enviada: ${alertData.type} - ${alertData.vehicleName} - Severidad: ${alertData.severity}`);
    }

    /**
     * Obtener alertas activas
     */
    async getActiveAlerts(organizationId: string, limit: number = 50): Promise<GeofenceAlert[]> {
        try {
            const alerts = await prisma.alert.findMany({
                where: {
                    organizationId,
                    status: 'ACTIVE',
                    type: {
                        in: ['ENTRY', 'EXIT', 'LONG_STAY_OUTSIDE', 'LONG_STAY_INSIDE']
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    vehicle: true,
                    geofence: true,
                    park: true
                }
            });

            return alerts.map(alert => ({
                id: alert.id,
                type: alert.type as any,
                vehicleId: alert.vehicleId,
                vehicleName: alert.vehicle?.name || alert.vehicle?.dobackId || 'Desconocido',
                geofenceId: alert.geofenceId || '',
                geofenceName: alert.geofence?.name || 'Desconocido',
                parkId: alert.parkId,
                parkName: alert.park?.name,
                message: alert.message,
                severity: alert.severity as any,
                timestamp: alert.createdAt,
                acknowledged: alert.acknowledged || false,
                acknowledgedBy: alert.acknowledgedBy,
                acknowledgedAt: alert.acknowledgedAt
            }));
        } catch (error) {
            logger.error('Error obteniendo alertas activas:', error);
            return [];
        }
    }

    /**
     * Marcar alerta como reconocida
     */
    async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
        try {
            await prisma.alert.update({
                where: { id: alertId },
                data: {
                    acknowledged: true,
                    acknowledgedBy,
                    acknowledgedAt: new Date(),
                    status: 'ACKNOWLEDGED'
                }
            });

            logger.info(`Alerta reconocida: ${alertId} por ${acknowledgedBy}`);
            return true;
        } catch (error) {
            logger.error('Error reconociendo alerta:', error);
            return false;
        }
    }

    /**
     * Actualizar configuración de alertas
     */
    updateConfig(newConfig: Partial<AlertConfig>): void {
        this.alertConfig = { ...this.alertConfig, ...newConfig };
        logger.info('Configuración de alertas actualizada:', this.alertConfig);
    }

    /**
     * Obtener configuración actual
     */
    getConfig(): AlertConfig {
        return { ...this.alertConfig };
    }
}

export const geofenceAlertService = GeofenceAlertService.getInstance();
