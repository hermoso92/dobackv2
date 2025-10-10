import nodemailer from 'nodemailer';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

// Tipos de alertas
export interface EmergencyAlert {
    id: string;
    type: 'FIRE' | 'MEDICAL' | 'RESCUE' | 'HAZMAT' | 'ROUTINE' | 'MAINTENANCE';
    location: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    vehicleId: string;
    vehicleName?: string;
    timestamp: Date;
    organizationId: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    metadata?: Record<string, any>;
}

export interface VehicleAlert {
    id: string;
    vehicleId: string;
    vehicleName: string;
    type: 'STATUS_CHANGE' | 'MAINTENANCE_DUE' | 'FUEL_LOW' | 'SPEED_EXCEEDED' | 'GEOFENCE_VIOLATION';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: Date;
    organizationId: string;
    metadata?: Record<string, any>;
}

export interface GeofenceAlert {
    id: string;
    geofenceId: string;
    geofenceName: string;
    vehicleId: string;
    vehicleName: string;
    type: 'ENTER' | 'EXIT' | 'VIOLATION';
    timestamp: Date;
    organizationId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    metadata?: Record<string, any>;
}

export class AlertService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    private static webSocketClients: Set<WebSocket> = new Set();

    // Registrar cliente WebSocket
    static registerWebSocketClient(ws: WebSocket) {
        this.webSocketClients.add(ws);
        logger.info('Cliente WebSocket registrado para alertas', {
            totalClients: this.webSocketClients.size
        });

        ws.on('close', () => {
            this.webSocketClients.delete(ws);
            logger.info('Cliente WebSocket desconectado de alertas', {
                totalClients: this.webSocketClients.size
            });
        });
    }

    // Enviar alerta de emergencia
    static async sendEmergencyAlert(alert: EmergencyAlert): Promise<void> {
        try {
            logger.info('Enviando alerta de emergencia', { alertId: alert.id, type: alert.type });

            // Enviar por email
            if (process.env.ALERT_EMAIL_ENABLED === 'true') {
                await this.sendEmergencyEmail(alert);
            }

            // Enviar por WebSocket
            await this.broadcastWebSocketAlert({
                type: 'EMERGENCY_ALERT',
                data: alert,
                timestamp: new Date().toISOString(),
            });

            // Enviar por webhook si está configurado
            if (process.env.ALERT_WEBHOOK_URL) {
                await this.sendWebhookAlert(alert);
            }

            logger.info('Alerta de emergencia enviada exitosamente', { alertId: alert.id });
        } catch (error) {
            logger.error('Error enviando alerta de emergencia', { error, alertId: alert.id });
            throw error;
        }
    }

    // Enviar alerta de vehículo
    static async sendVehicleAlert(alert: VehicleAlert): Promise<void> {
        try {
            logger.info('Enviando alerta de vehículo', { alertId: alert.id, vehicleId: alert.vehicleId });

            // Enviar por email si es crítica
            if (alert.severity === 'CRITICAL' && process.env.ALERT_EMAIL_ENABLED === 'true') {
                await this.sendVehicleEmail(alert);
            }

            // Enviar por WebSocket
            await this.broadcastWebSocketAlert({
                type: 'VEHICLE_ALERT',
                data: alert,
                timestamp: new Date().toISOString(),
            });

            logger.info('Alerta de vehículo enviada exitosamente', { alertId: alert.id });
        } catch (error) {
            logger.error('Error enviando alerta de vehículo', { error, alertId: alert.id });
            throw error;
        }
    }

    // Enviar alerta de geocerca
    static async sendGeofenceAlert(alert: GeofenceAlert): Promise<void> {
        try {
            logger.info('Enviando alerta de geocerca', { alertId: alert.id, geofenceId: alert.geofenceId });

            // Enviar por WebSocket
            await this.broadcastWebSocketAlert({
                type: 'GEOFENCE_ALERT',
                data: alert,
                timestamp: new Date().toISOString(),
            });

            logger.info('Alerta de geocerca enviada exitosamente', { alertId: alert.id });
        } catch (error) {
            logger.error('Error enviando alerta de geocerca', { error, alertId: alert.id });
            throw error;
        }
    }

    // Enviar email de emergencia
    private static async sendEmergencyEmail(alert: EmergencyAlert): Promise<void> {
        const subject = `🚨 ALERTA DE EMERGENCIA - ${alert.type} - ${alert.severity}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #D32F2F; color: white; padding: 20px; text-align: center;">
          <h1>🚨 ALERTA DE EMERGENCIA</h1>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2>Detalles de la Emergencia</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tipo:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Severidad:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.severity}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Ubicación:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehículo:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.vehicleName || alert.vehicleId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Hora:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.timestamp.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Descripción:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.description}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #D32F2F; color: white; padding: 10px; text-align: center;">
          <p>Bomberos Madrid - Sistema DobackSoft</p>
        </div>
      </div>
    `;

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@bomberosmadrid.es',
            to: 'emergencias@bomberosmadrid.es',
            subject,
            html,
        });

        logger.info('Email de emergencia enviado', { alertId: alert.id });
    }

    // Enviar email de vehículo
    private static async sendVehicleEmail(alert: VehicleAlert): Promise<void> {
        const subject = `⚠️ ALERTA DE VEHÍCULO - ${alert.vehicleName}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #FFA000; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ ALERTA DE VEHÍCULO</h1>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2>Detalles de la Alerta</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Vehículo:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.vehicleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tipo:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Severidad:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.severity}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Hora:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.timestamp.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Mensaje:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.message}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #FFA000; color: white; padding: 10px; text-align: center;">
          <p>Bomberos Madrid - Sistema DobackSoft</p>
        </div>
      </div>
    `;

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@bomberosmadrid.es',
            to: 'mantenimiento@bomberosmadrid.es',
            subject,
            html,
        });

        logger.info('Email de vehículo enviado', { alertId: alert.id });
    }

    // Enviar alerta por WebSocket
    private static async broadcastWebSocketAlert(alert: any): Promise<void> {
        const message = JSON.stringify(alert);
        let sentCount = 0;

        this.webSocketClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                    sentCount++;
                } catch (error) {
                    logger.error('Error enviando alerta por WebSocket', { error });
                    this.webSocketClients.delete(client);
                }
            } else {
                this.webSocketClients.delete(client);
            }
        });

        logger.info('Alerta enviada por WebSocket', {
            sentCount,
            totalClients: this.webSocketClients.size
        });
    }

    // Enviar alerta por webhook
    private static async sendWebhookAlert(alert: EmergencyAlert): Promise<void> {
        try {
            const response = await fetch(process.env.ALERT_WEBHOOK_URL!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'EMERGENCY_ALERT',
                    data: alert,
                    timestamp: new Date().toISOString(),
                    source: 'DobackSoft',
                }),
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
            }

            logger.info('Alerta enviada por webhook', { alertId: alert.id });
        } catch (error) {
            logger.error('Error enviando alerta por webhook', { error, alertId: alert.id });
        }
    }

    // Crear alerta de emergencia
    static createEmergencyAlert(data: Partial<EmergencyAlert>): EmergencyAlert {
        return {
            id: `emergency-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            type: data.type || 'ROUTINE',
            location: data.location || 'Ubicación no especificada',
            severity: data.severity || 'MEDIUM',
            description: data.description || 'Sin descripción',
            vehicleId: data.vehicleId || 'unknown',
            timestamp: data.timestamp || new Date(),
            organizationId: data.organizationId || 'unknown',
            ...data,
        };
    }

    // Crear alerta de vehículo
    static createVehicleAlert(data: Partial<VehicleAlert>): VehicleAlert {
        return {
            id: `vehicle-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            vehicleId: data.vehicleId || 'unknown',
            vehicleName: data.vehicleName || 'Vehículo desconocido',
            type: data.type || 'STATUS_CHANGE',
            message: data.message || 'Sin mensaje',
            severity: data.severity || 'MEDIUM',
            timestamp: data.timestamp || new Date(),
            organizationId: data.organizationId || 'unknown',
            ...data,
        };
    }

    // Crear alerta de geocerca
    static createGeofenceAlert(data: Partial<GeofenceAlert>): GeofenceAlert {
        return {
            id: `geofence-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            geofenceId: data.geofenceId || 'unknown',
            geofenceName: data.geofenceName || 'Geocerca desconocida',
            vehicleId: data.vehicleId || 'unknown',
            vehicleName: data.vehicleName || 'Vehículo desconocido',
            type: data.type || 'ENTER',
            timestamp: data.timestamp || new Date(),
            organizationId: data.organizationId || 'unknown',
            coordinates: data.coordinates || { latitude: 0, longitude: 0 },
            ...data,
        };
    }
}
