import { PrismaClient } from '@prisma/client';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../utils/logger';
import { GeofenceEvent, RealTimeGeofenceService } from './RealTimeGeofenceService';

export interface WebSocketClient {
    id: string;
    ws: WebSocket;
    organizationId: string;
    userId: string;
    subscriptions: Set<string>;
    isAlive: boolean;
}

export interface WebSocketMessage {
    type: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'PING' | 'PONG';
    data?: any;
    timestamp: number;
}

export interface GeofenceWebSocketMessage {
    type: 'GEOFENCE_EVENT' | 'VEHICLE_UPDATE' | 'ZONE_UPDATE' | 'PARK_UPDATE';
    data: any;
    timestamp: number;
}

export class WebSocketGeofenceService {
    private wss: WebSocketServer;
    private clients: Map<string, WebSocketClient> = new Map();
    private geofenceService: RealTimeGeofenceService;
    private prisma: PrismaClient;
    private heartbeatInterval: NodeJS.Timeout;
    private cleanupInterval: NodeJS.Timeout;

    constructor(server: Server, prisma: PrismaClient, geofenceService: RealTimeGeofenceService) {
        this.prisma = prisma;
        this.geofenceService = geofenceService;

        // Crear servidor WebSocket
        this.wss = new WebSocketServer({
            server,
            path: '/ws/geofence'
        });

        // Configurar eventos del servidor WebSocket
        this.setupWebSocketServer();

        // Configurar callbacks del servicio de geocercas
        this.setupGeofenceCallbacks();

        // Iniciar intervalos de mantenimiento
        this.startMaintenanceIntervals();

        logger.info('Servicio WebSocket de geocercas iniciado');
    }

    /**
     * Configura el servidor WebSocket
     */
    private setupWebSocketServer(): void {
        this.wss.on('connection', async (ws: WebSocket, request) => {
            try {
                // Autenticar conexión
                const client = await this.authenticateConnection(ws, request);
                if (!client) {
                    ws.close(1008, 'Autenticación fallida');
                    return;
                }

                // Agregar cliente
                this.clients.set(client.id, client);
                logger.info(`Cliente WebSocket conectado: ${client.id} (Org: ${client.organizationId})`);

                // Configurar eventos del cliente
                this.setupClientEvents(client);

                // Enviar mensaje de bienvenida
                this.sendToClient(client, {
                    type: 'CONNECTION_ESTABLISHED',
                    data: {
                        clientId: client.id,
                        organizationId: client.organizationId,
                        timestamp: Date.now()
                    },
                    timestamp: Date.now()
                });

            } catch (error) {
                logger.error('Error en conexión WebSocket:', error);
                ws.close(1011, 'Error interno del servidor');
            }
        });

        this.wss.on('error', (error) => {
            logger.error('Error en servidor WebSocket:', error);
        });
    }

    /**
     * Autentica la conexión WebSocket
     */
    private async authenticateConnection(ws: WebSocket, request: any): Promise<WebSocketClient | null> {
        try {
            // Extraer token del header o query string
            const token = this.extractToken(request);
            if (!token) {
                return null;
            }

            // Verificar JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            if (!decoded || !decoded.organizationId) {
                return null;
            }

            // Crear cliente
            const client: WebSocketClient = {
                id: this.generateClientId(),
                ws,
                organizationId: decoded.organizationId,
                userId: decoded.userId,
                subscriptions: new Set(),
                isAlive: true
            };

            return client;
        } catch (error) {
            logger.error('Error autenticando conexión WebSocket:', error);
            return null;
        }
    }

    /**
     * Extrae token de la request
     */
    private extractToken(request: any): string | null {
        // Buscar en headers
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Buscar en query string
        const url = new URL(request.url, 'http://localhost');
        return url.searchParams.get('token');
    }

    /**
     * Genera ID único para cliente
     */
    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Configura eventos de un cliente específico
     */
    private setupClientEvents(client: WebSocketClient): void {
        client.ws.on('message', (data: Buffer) => {
            try {
                const message: WebSocketMessage = JSON.parse(data.toString());
                this.handleClientMessage(client, message);
            } catch (error) {
                logger.error(`Error procesando mensaje del cliente ${client.id}:`, error);
            }
        });

        client.ws.on('close', () => {
            this.removeClient(client.id);
            logger.info(`Cliente WebSocket desconectado: ${client.id}`);
        });

        client.ws.on('error', (error) => {
            logger.error(`Error en cliente WebSocket ${client.id}:`, error);
            this.removeClient(client.id);
        });

        client.ws.on('pong', () => {
            client.isAlive = true;
        });
    }

    /**
     * Maneja mensajes del cliente
     */
    private handleClientMessage(client: WebSocketClient, message: WebSocketMessage): void {
        try {
            switch (message.type) {
                case 'SUBSCRIBE':
                    this.handleSubscribe(client, message.data);
                    break;
                case 'UNSUBSCRIBE':
                    this.handleUnsubscribe(client, message.data);
                    break;
                case 'PING':
                    this.sendToClient(client, {
                        type: 'PONG',
                        data: { timestamp: Date.now() },
                        timestamp: Date.now()
                    });
                    break;
                default:
                    logger.warn(`Tipo de mensaje no reconocido: ${message.type}`);
            }
        } catch (error) {
            logger.error(`Error manejando mensaje del cliente ${client.id}:`, error);
        }
    }

    /**
     * Maneja suscripción a eventos
     */
    private handleSubscribe(client: WebSocketClient, data: any): void {
        try {
            const { eventType, targetId } = data;

            if (!eventType || !targetId) {
                this.sendToClient(client, {
                    type: 'ERROR',
                    data: { message: 'eventType y targetId son requeridos' },
                    timestamp: Date.now()
                });
                return;
            }

            // Crear clave de suscripción
            const subscriptionKey = `${eventType}:${targetId}`;
            client.subscriptions.add(subscriptionKey);

            this.sendToClient(client, {
                type: 'SUBSCRIBED',
                data: { eventType, targetId, subscriptionKey },
                timestamp: Date.now()
            });

            logger.info(`Cliente ${client.id} suscrito a ${subscriptionKey}`);
        } catch (error) {
            logger.error(`Error en suscripción del cliente ${client.id}:`, error);
        }
    }

    /**
     * Maneja cancelación de suscripción
     */
    private handleUnsubscribe(client: WebSocketClient, data: any): void {
        try {
            const { eventType, targetId } = data;

            if (!eventType || !targetId) {
                this.sendToClient(client, {
                    type: 'ERROR',
                    data: { message: 'eventType y targetId son requeridos' },
                    timestamp: Date.now()
                });
                return;
            }

            // Remover suscripción
            const subscriptionKey = `${eventType}:${targetId}`;
            client.subscriptions.delete(subscriptionKey);

            this.sendToClient(client, {
                type: 'UNSUBSCRIBED',
                data: { eventType, targetId, subscriptionKey },
                timestamp: Date.now()
            });

            logger.info(`Cliente ${client.id} desuscrito de ${subscriptionKey}`);
        } catch (error) {
            logger.error(`Error en desuscripción del cliente ${client.id}:`, error);
        }
    }

    /**
     * Configura callbacks del servicio de geocercas
     */
    private setupGeofenceCallbacks(): void {
        this.geofenceService.onGeofenceEvent((event: GeofenceEvent) => {
            this.broadcastGeofenceEvent(event);
        });
    }

    /**
     * Transmite evento de geocerca a clientes suscritos
     */
    private broadcastGeofenceEvent(event: GeofenceEvent): void {
        const message: GeofenceWebSocketMessage = {
            type: 'GEOFENCE_EVENT',
            data: event,
            timestamp: Date.now()
        };

        // Encontrar clientes de la misma organización
        for (const client of this.clients.values()) {
            if (client.organizationId === event.organizationId) {
                // Verificar si está suscrito a este tipo de evento
                const subscriptionKey = `GEOFENCE_EVENT:${event.vehicleId}`;
                if (client.subscriptions.has(subscriptionKey) ||
                    client.subscriptions.has(`GEOFENCE_EVENT:*`)) {
                    this.sendToClient(client, message);
                }
            }
        }

        logger.debug(`Evento de geocerca transmitido: ${event.eventType} para vehículo ${event.vehicleId}`);
    }

    /**
     * Envía mensaje a un cliente específico
     */
    private sendToClient(client: WebSocketClient, message: any): void {
        try {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        } catch (error) {
            logger.error(`Error enviando mensaje al cliente ${client.id}:`, error);
            this.removeClient(client.id);
        }
    }

    /**
     * Transmite mensaje a todos los clientes de una organización
     */
    public broadcastToOrganization(organizationId: string, message: GeofenceWebSocketMessage): void {
        for (const client of this.clients.values()) {
            if (client.organizationId === organizationId) {
                this.sendToClient(client, message);
            }
        }
    }

    /**
     * Transmite mensaje a clientes suscritos a un evento específico
     */
    public broadcastToSubscribers(eventType: string, targetId: string, data: any): void {
        const message: GeofenceWebSocketMessage = {
            type: eventType as any,
            data,
            timestamp: Date.now()
        };

        const subscriptionKey = `${eventType}:${targetId}`;

        for (const client of this.clients.values()) {
            if (client.subscriptions.has(subscriptionKey) ||
                client.subscriptions.has(`${eventType}:*`)) {
                this.sendToClient(client, message);
            }
        }
    }

    /**
     * Remueve un cliente
     */
    private removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            client.ws.close();
            this.clients.delete(clientId);
        }
    }

    /**
     * Inicia intervalos de mantenimiento
     */
    private startMaintenanceIntervals(): void {
        // Heartbeat cada 30 segundos
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws: WebSocket) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                }
            });
        }, 30000);

        // Limpieza de clientes inactivos cada minuto
        this.cleanupInterval = setInterval(() => {
            for (const [clientId, client] of this.clients.entries()) {
                if (!client.isAlive) {
                    logger.info(`Cliente inactivo removido: ${clientId}`);
                    this.removeClient(clientId);
                } else {
                    client.isAlive = false;
                }
            }
        }, 60000);
    }

    /**
     * Obtiene estadísticas del servicio WebSocket
     */
    public getStats(): {
        totalClients: number;
        clientsByOrganization: Map<string, number>;
        totalSubscriptions: number;
    } {
        const clientsByOrganization = new Map<string, number>();
        let totalSubscriptions = 0;

        for (const client of this.clients.values()) {
            const current = clientsByOrganization.get(client.organizationId) || 0;
            clientsByOrganization.set(client.organizationId, current + 1);
            totalSubscriptions += client.subscriptions.size;
        }

        return {
            totalClients: this.clients.size,
            clientsByOrganization,
            totalSubscriptions
        };
    }

    /**
     * Cierra el servicio WebSocket
     */
    public close(): void {
        clearInterval(this.heartbeatInterval);
        clearInterval(this.cleanupInterval);

        for (const client of this.clients.values()) {
            client.ws.close();
        }

        this.wss.close();
        logger.info('Servicio WebSocket de geocercas cerrado');
    }
} 