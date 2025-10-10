#!/usr/bin/env ts-node

import WebSocket from 'ws';

interface GeofenceEvent {
    type: 'geofence_event';
    data: {
        vehicleId: string;
        eventType: 'entry' | 'exit' | 'violation';
        zoneId?: string;
        parkId?: string;
        latitude: number;
        longitude: number;
        timestamp: string;
        ruleId?: string;
    };
}

interface WebSocketMessage {
    type: 'auth' | 'subscribe' | 'heartbeat' | 'geofence_event';
    data?: any;
    token?: string;
    organizationId?: string;
}

class GeofenceWebSocketClient {
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private isConnected = false;

    constructor(private url: string, private token: string, private organizationId: string) { }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`🔌 Conectando a WebSocket: ${this.url}`);

            this.ws = new WebSocket(this.url);

            this.ws.on('open', () => {
                console.log('✅ Conexión WebSocket establecida');
                this.isConnected = true;

                // Autenticar
                this.send({
                    type: 'auth',
                    token: this.token,
                    organizationId: this.organizationId
                });

                // Suscribirse a eventos de geocercas
                this.send({
                    type: 'subscribe',
                    data: { eventTypes: ['geofence_event'] }
                });

                // Iniciar heartbeat
                this.startHeartbeat();

                resolve();
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ Error parseando mensaje:', error);
                }
            });

            this.ws.on('close', (code: number, reason: string) => {
                console.log(`🔌 Conexión cerrada: ${code} - ${reason}`);
                this.isConnected = false;
                this.stopHeartbeat();
            });

            this.ws.on('error', (error: Error) => {
                console.error('❌ Error WebSocket:', error);
                reject(error);
            });
        });
    }

    private send(message: WebSocketMessage): void {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
            console.log(`📤 Enviado: ${message.type}`);
        }
    }

    private handleMessage(message: any): void {
        console.log(`📥 Recibido: ${message.type}`);

        switch (message.type) {
            case 'auth_success':
                console.log('✅ Autenticación exitosa');
                break;

            case 'auth_error':
                console.log('❌ Error de autenticación:', message.error);
                break;

            case 'subscription_success':
                console.log('✅ Suscripción exitosa');
                break;

            case 'geofence_event':
                this.handleGeofenceEvent(message.data);
                break;

            case 'heartbeat_response':
                console.log('💓 Heartbeat recibido');
                break;

            default:
                console.log('📨 Mensaje no reconocido:', message);
        }
    }

    private handleGeofenceEvent(event: GeofenceEvent['data']): void {
        console.log('\n🚨 EVENTO DE GEOCERCA DETECTADO:');
        console.log(`   🚗 Vehículo: ${event.vehicleId}`);
        console.log(`   📍 Tipo: ${event.eventType}`);
        console.log(`   🗺️  Zona: ${event.zoneId || 'N/A'}`);
        console.log(`   🏢 Parque: ${event.parkId || 'N/A'}`);
        console.log(`   📍 Coordenadas: ${event.latitude}, ${event.longitude}`);
        console.log(`   ⏰ Timestamp: ${event.timestamp}`);
        console.log(`   📋 Regla: ${event.ruleId || 'N/A'}`);
        console.log('');
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'heartbeat' });
        }, 30000); // Cada 30 segundos
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.stopHeartbeat();
    }
}

async function testWebSocketClient() {
    console.log('🧪 Iniciando prueba de cliente WebSocket...\n');

    // Configuración (usar token real en producción)
    const url = 'ws://localhost:3001/ws/geofence';
    const token = 'test-token-123'; // Token de prueba
    const organizationId = 'test-org-123'; // ID de organización de prueba

    const client = new GeofenceWebSocketClient(url, token, organizationId);

    try {
        await client.connect();

        console.log('\n⏳ Cliente conectado. Esperando eventos...');
        console.log('   (Presiona Ctrl+C para salir)\n');

        // Mantener el cliente activo
        process.on('SIGINT', () => {
            console.log('\n🛑 Cerrando cliente...');
            client.disconnect();
            process.exit(0);
        });

        // Simular eventos de prueba cada 10 segundos
        setInterval(() => {
            console.log('⏰ Cliente activo - esperando eventos de geocercas...');
        }, 10000);

    } catch (error) {
        console.error('❌ Error en cliente WebSocket:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testWebSocketClient().catch(console.error);
}

export { GeofenceWebSocketClient };
