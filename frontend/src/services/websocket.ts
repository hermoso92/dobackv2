import { store } from '../store';
import { addAlert } from '../store/slices/alertSlice';
import { addStabilityData } from '../store/slices/stabilitySlice';
import { addTelemetryData } from '../store/slices/telemetrySlice';
import { logger } from '../utils/logger';

type MessageType = 'telemetry' | 'stability' | 'alert' | 'welcome' | 'pong' | 'error';
type MessageHandler = (data: any) => void;

interface WebSocketMessage {
    type: MessageType;
    data: any;
    timestamp?: number;
    message?: string;
    error?: string;
}

class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout = 1000;
    private isConnecting = false;
    private messageHandlers: Map<MessageType, MessageHandler>;
    private connectionPromise: Promise<void> | null = null;
    private connectionResolve: (() => void) | null = null;
    private connected = false;
    private simulationMode = false;
    private fallbackMode = false;
    private simulationInterval: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly PING_INTERVAL = 30000; // 30 segundos
    private WS_URL = "ws://localhost:9998/ws";
    private wsHost = 'localhost:9998';

    private constructor() {
        this.messageHandlers = new Map();
        this.messageHandlers.set('telemetry', (data) => store.dispatch(addTelemetryData(data)));
        this.messageHandlers.set('stability', (data) => store.dispatch(addStabilityData(data)));
        this.messageHandlers.set('alert', (data) => store.dispatch(addAlert(data)));
        this.messageHandlers.set('welcome', (data) => logger.info('Conexión WebSocket establecida:', data));
        this.messageHandlers.set('pong', (data) => logger.info('Pong recibido:', data));
        this.messageHandlers.set('error', (data) => {
            logger.error('Error del servidor WebSocket:', data);
            store.dispatch(addAlert({
                id: Date.now().toString(),
                type: 'error',
                message: data.message || 'Error en la conexión WebSocket',
                timestamp: new Date().toISOString()
            }));
        });

        logger.info(`WebSocket en modo simulación: ${this.simulationMode ? 'activado' : 'desactivado'}`);
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.simulationMode) {
            logger.info('WebSocket en modo simulación - no se intentará conectar al servidor');
            return Promise.resolve();
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve) => {
            this.connectionResolve = resolve;
            this.connect();
        });

        return this.connectionPromise;
    }

    private connect(): void {
        if (this.isConnecting || this.simulationMode) return;

        try {
            this.isConnecting = true;

            // Configuración base del WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            const port = '9998';
            const wsPath = '/ws';
            const wsUrl = `${protocol}//${host}:${port}${wsPath}`;

            logger.info(`Conectando WebSocket a: ${wsUrl}`);
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                logger.info('WebSocket conectado');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                if (this.connectionResolve) {
                    this.connectionResolve();
                    this.connectionResolve = null;
                }
                this.connectionPromise = null;
                this.startPingInterval();
            };

            this.ws.onmessage = (event: MessageEvent) => {
                this.handleMessage(event).catch(error => {
                    logger.error('Error en handleMessage:', error);
                });
            };

            this.ws.onclose = (event: CloseEvent) => {
                logger.info('WebSocket desconectado:', event.code, event.reason);
                this.cleanup();
                this.handleReconnect();
            };

            this.ws.onerror = (error: Event) => {
                logger.error('Error en WebSocket:', error);
                this.cleanup();
            };
        } catch (error) {
            logger.error('Error conectando WebSocket:', error);
            this.cleanup();
            this.handleReconnect();
        }
    }

    private startPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping', timestamp: Date.now() });
            }
        }, this.PING_INTERVAL);
    }

    private async handleMessage(event: MessageEvent): Promise<void> {
        try {
            const message = JSON.parse(event.data) as WebSocketMessage;

            if (!this.isValidMessage(message)) {
                logger.warn('Mensaje inválido recibido:', message);
                return;
            }

            const handler = this.messageHandlers.get(message.type);
            if (handler) {
                handler(message.data);
            } else {
                logger.warn('Tipo de mensaje desconocido:', message.type);
            }
        } catch (error) {
            logger.error('Error procesando mensaje:', error);
            throw error;
        }
    }

    private isValidMessage(message: any): message is WebSocketMessage {
        return message
            && typeof message === 'object'
            && typeof message.type === 'string'
            && message.hasOwnProperty('data')
            && ['telemetry', 'stability', 'alert', 'welcome', 'pong', 'error'].includes(message.type);
    }

    private cleanup(): void {
        this.isConnecting = false;
        this.connected = false;
        if (this.connectionResolve) {
            this.connectionResolve();
            this.connectionResolve = null;
        }
        this.connectionPromise = null;
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private handleReconnect(): void {
        if (this.simulationMode) {
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(`Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectTimeout * this.reconnectAttempts);
        } else {
            logger.error('Máximo número de intentos de reconexión alcanzado');

            if (!this.fallbackMode) {
                logger.info('Activando modo de simulación de fallback debido a fallos de conexión');
                this.fallbackMode = true;
                this.startFallbackSimulation();
            }
        }
    }

    private generateSimulatedData(): any {
        const now = Date.now();
        const time = now / 1000;

        const lateralAcc = 0.2 * Math.sin(time * 0.1) + 0.1 * Math.sin(time * 0.5) + 0.05 * (Math.random() - 0.5);
        const rollAngle = 3 * Math.sin(time * 0.1) + 2 * Math.sin(time * 0.3) + 1 * (Math.random() - 0.5);
        const pitchAngle = 1 * Math.sin(time * 0.2) + 0.5 * (Math.random() - 0.5);
        const speed = 60 + 20 * Math.sin(time * 0.05) + 5 * (Math.random() - 0.5);

        return {
            timestamp: now,
            acceleration_x: 0.1 * Math.sin(time * 0.3) + 0.05 * (Math.random() - 0.5),
            acceleration_y: lateralAcc,
            acceleration_z: -1.0 + 0.1 * Math.sin(time * 0.2) + 0.05 * (Math.random() - 0.5),
            gyro_x: 0.5 * Math.sin(time * 0.3) + 0.2 * (Math.random() - 0.5),
            gyro_y: 0.3 * Math.sin(time * 0.4) + 0.2 * (Math.random() - 0.5),
            gyro_z: 0.2 * Math.sin(time * 0.5) + 0.1 * (Math.random() - 0.5),
            angular_x: rollAngle,
            angular_y: pitchAngle,
            angular_z: 1 * Math.sin(time * 0.1) + 0.5 * (Math.random() - 0.5),
            speed: speed,
            lateral_acc: lateralAcc,
            roll_angle: rollAngle,
            pitch_angle: pitchAngle
        };
    }

    private startFallbackSimulation(): void {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        this.simulationInterval = setInterval(() => {
            const data = this.generateSimulatedData();
            store.dispatch(addTelemetryData(data));
        }, 100);
    }

    private stopFallbackSimulation(): void {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    public send(message: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                logger.error('Error enviando mensaje:', error);
                this.cleanup();
                this.handleReconnect();
            }
        } else {
            logger.warn('WebSocket no está conectado. No se puede enviar el mensaje.');
        }
    }

    public disconnect(): void {
        this.cleanup();
        this.stopFallbackSimulation();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const websocketService = WebSocketService.getInstance(); 