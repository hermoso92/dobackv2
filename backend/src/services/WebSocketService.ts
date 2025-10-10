import { Server } from 'http';
import WebSocket from 'ws';
import { logger } from '../utils/logger';

export class WebSocketService {
    private wss: WebSocket.Server;
    private clients: Set<WebSocket> = new Set();
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly PING_INTERVAL = 30000; // 30 segundos

    constructor(server: Server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws',
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
                threshold: 1024
            }
        });
        this.setupWebSocket();
        this.startPingInterval();
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws: WebSocket, req) => {
            const clientIp = req.socket.remoteAddress;
            logger.info('Nueva conexión WebSocket establecida', { clientIp });
            this.clients.add(ws);

            // Enviar mensaje de bienvenida
            this.sendToClient(ws, { type: 'welcome', message: 'Conexión establecida' });

            ws.on('message', (message) => this.handleMessage(ws, message));

            ws.on('close', () => {
                logger.info('Conexión WebSocket cerrada', { clientIp });
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                logger.error('Error en WebSocket:', { error, clientIp });
                this.clients.delete(ws);
            });

            ws.on('pong', () => {
                logger.debug('Pong recibido', { clientIp });
            });
        });

        this.wss.on('error', (error) => {
            logger.error('Error en el servidor WebSocket:', error);
        });
    }

    private startPingInterval() {
        this.pingInterval = setInterval(() => {
            this.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    try {
                        client.ping();
                    } catch (error) {
                        logger.error('Error enviando ping:', error);
                        this.clients.delete(client);
                    }
                }
            });
        }, this.PING_INTERVAL);
    }

    private handleMessage(ws: WebSocket, message: WebSocket.Data) {
        try {
            const data = JSON.parse(message.toString());
            logger.debug('Mensaje WebSocket recibido:', data);

            // Procesar el mensaje según su tipo
            switch (data.type) {
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
                    break;
                default:
                    // Broadcast el mensaje a todos los clientes
                    this.broadcast(data);
            }
        } catch (error: any) {
            logger.error('Error procesando mensaje WebSocket:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Error procesando mensaje',
                error: error.message
            });
        }
    }

    public broadcast(data: any) {
        const message = JSON.stringify(data);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    logger.error('Error enviando mensaje broadcast:', error);
                    this.clients.delete(client);
                }
            }
        });
    }

    public sendToClient(client: WebSocket, data: any) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(data));
            } catch (error) {
                logger.error('Error enviando mensaje a cliente:', error);
                this.clients.delete(client);
            }
        }
    }

    public close() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.wss.close(() => {
            logger.info('Servidor WebSocket cerrado');
        });
    }
}
