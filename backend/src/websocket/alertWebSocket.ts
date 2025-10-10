import { WebSocket, WebSocketServer } from 'ws';
import { AlertService } from '../services/AlertService';
import { logger } from '../utils/logger';

export class AlertWebSocket {
    private static wss: WebSocketServer | null = null;
    private static clients: Set<WebSocket> = new Set();

    // Inicializar servidor WebSocket de alertas
    static init(server: any): void {
        if (this.wss) {
            logger.warn('WebSocket de alertas ya inicializado');
            return;
        }

        this.wss = new WebSocketServer({
            server,
            path: '/ws/alerts',
            perMessageDeflate: false,
        });

        this.wss.on('connection', (ws: WebSocket, request) => {
            const clientId = this.generateClientId();
            logger.info('Cliente conectado a alertas WebSocket', {
                clientId,
                ip: request.socket.remoteAddress,
                userAgent: request.headers['user-agent'],
            });

            // Registrar cliente
            this.clients.add(ws);
            AlertService.registerWebSocketClient(ws);

            // Enviar mensaje de bienvenida
            this.sendToClient(ws, {
                type: 'CONNECTION_ESTABLISHED',
                data: {
                    clientId,
                    timestamp: new Date().toISOString(),
                    message: 'Conexión establecida con el servidor de alertas',
                },
            });

            // Manejar mensajes del cliente
            ws.on('message', (data: Buffer) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(ws, message, clientId);
                } catch (error) {
                    logger.error('Error procesando mensaje del cliente', {
                        error,
                        clientId,
                        data: data.toString(),
                    });
                }
            });

            // Manejar cierre de conexión
            ws.on('close', (code: number, reason: Buffer) => {
                this.clients.delete(ws);
                logger.info('Cliente desconectado de alertas WebSocket', {
                    clientId,
                    code,
                    reason: reason.toString(),
                    totalClients: this.clients.size,
                });
            });

            // Manejar errores
            ws.on('error', (error: Error) => {
                logger.error('Error en WebSocket de alertas', {
                    error,
                    clientId,
                });
                this.clients.delete(ws);
            });

            // Enviar ping periódico para mantener la conexión
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000); // 30 segundos

            ws.on('pong', () => {
                logger.debug('Pong recibido del cliente', { clientId });
            });
        });

        this.wss.on('error', (error: Error) => {
            logger.error('Error en servidor WebSocket de alertas', { error });
        });

        logger.info('Servidor WebSocket de alertas iniciado', {
            path: '/ws/alerts',
        });
    }

    // Cerrar servidor WebSocket
    static close(): void {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
            this.clients.clear();
            logger.info('Servidor WebSocket de alertas cerrado');
        }
    }

    // Enviar mensaje a un cliente específico
    private static sendToClient(ws: WebSocket, message: any): void {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                logger.error('Error enviando mensaje a cliente', { error });
            }
        }
    }

    // Enviar mensaje a todos los clientes conectados
    static broadcast(message: any): void {
        let sentCount = 0;
        const messageStr = JSON.stringify(message);

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageStr);
                    sentCount++;
                } catch (error) {
                    logger.error('Error enviando mensaje broadcast', { error });
                    this.clients.delete(client);
                }
            } else {
                this.clients.delete(client);
            }
        });

        logger.info('Mensaje broadcast enviado', {
            sentCount,
            totalClients: this.clients.size,
            messageType: message.type,
        });
    }

    // Enviar mensaje a clientes de una organización específica
    static broadcastToOrganization(organizationId: string, message: any): void {
        // En una implementación real, aquí se filtrarían los clientes por organización
        // Por ahora, enviamos a todos los clientes
        this.broadcast({
            ...message,
            organizationId,
        });
    }

    // Manejar mensajes del cliente
    private static handleClientMessage(ws: WebSocket, message: any, clientId: string): void {
        logger.debug('Mensaje recibido del cliente', {
            clientId,
            messageType: message.type,
        });

        switch (message.type) {
            case 'PING':
                this.sendToClient(ws, {
                    type: 'PONG',
                    data: {
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            case 'SUBSCRIBE_ALERTS':
                this.sendToClient(ws, {
                    type: 'SUBSCRIPTION_CONFIRMED',
                    data: {
                        message: 'Suscripción a alertas confirmada',
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            case 'UNSUBSCRIBE_ALERTS':
                this.sendToClient(ws, {
                    type: 'UNSUBSCRIPTION_CONFIRMED',
                    data: {
                        message: 'Suscripción a alertas cancelada',
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            case 'GET_ALERT_HISTORY':
                // En una implementación real, aquí se obtendría el historial de alertas
                this.sendToClient(ws, {
                    type: 'ALERT_HISTORY',
                    data: {
                        alerts: [],
                        message: 'Historial de alertas (implementación pendiente)',
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            default:
                logger.warn('Tipo de mensaje no reconocido', {
                    clientId,
                    messageType: message.type,
                });
                this.sendToClient(ws, {
                    type: 'ERROR',
                    data: {
                        message: 'Tipo de mensaje no reconocido',
                        timestamp: new Date().toISOString(),
                    },
                });
        }
    }

    // Generar ID único para el cliente
    private static generateClientId(): string {
        return `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // Obtener estadísticas del WebSocket
    static getStats(): any {
        return {
            totalClients: this.clients.size,
            serverStatus: this.wss ? 'running' : 'stopped',
            uptime: this.wss ? Date.now() - (this.wss as any).startTime : 0,
        };
    }

    // Enviar alerta de emergencia
    static sendEmergencyAlert(alert: any): void {
        this.broadcast({
            type: 'EMERGENCY_ALERT',
            data: alert,
            timestamp: new Date().toISOString(),
            priority: 'HIGH',
        });
    }

    // Enviar alerta de vehículo
    static sendVehicleAlert(alert: any): void {
        this.broadcast({
            type: 'VEHICLE_ALERT',
            data: alert,
            timestamp: new Date().toISOString(),
            priority: 'MEDIUM',
        });
    }

    // Enviar alerta de geocerca
    static sendGeofenceAlert(alert: any): void {
        this.broadcast({
            type: 'GEOFENCE_ALERT',
            data: alert,
            timestamp: new Date().toISOString(),
            priority: 'MEDIUM',
        });
    }

    // Enviar notificación del sistema
    static sendSystemNotification(notification: any): void {
        this.broadcast({
            type: 'SYSTEM_NOTIFICATION',
            data: notification,
            timestamp: new Date().toISOString(),
            priority: 'LOW',
        });
    }
}
