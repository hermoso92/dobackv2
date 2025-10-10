import { Server as HttpServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { logger } from './logger';

export class SocketServer {
    private io: SocketIOServer;

    constructor(httpServer: HttpServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info('Client connected to socket', { socketId: socket.id });

            socket.on('disconnect', () => {
                logger.info('Client disconnected from socket', { socketId: socket.id });
            });
        });
    }

    public emit(event: string, data: any): void {
        this.io.emit(event, data);
    }

    public on(event: string, callback: (data: any) => void): void {
        this.io.on(event, callback);
    }

    public off(event: string, callback: (data: any) => void): void {
        this.io.off(event, callback);
    }
}
