import { EventSeverity, EventType } from '@prisma/client';
import { Request } from 'express';
import WebSocket from 'ws';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface RealtimeConfig {
    type: 'stability' | 'telemetry' | 'event' | 'all';
    vehicleId?: number;
    organizationId?: number;
}

interface RealtimeMessage {
    type: string;
    data: any;
    timestamp: Date;
}

// Mapa de conexiones WebSocket
const connections = new Map<string, WebSocket>();

// Enviar mensaje a conexiones
const broadcastMessage = (message: RealtimeMessage, config: RealtimeConfig) => {
    connections.forEach((ws, id) => {
        try {
            const [type, entityId] = id.split(':');

            // Filtrar por tipo y entidad
            if (
                (config.type === 'all' || type === config.type) &&
                (!config.vehicleId || entityId === config.vehicleId.toString()) &&
                (!config.organizationId || entityId === config.organizationId.toString())
            ) {
                ws.send(JSON.stringify(message));
            }
        } catch (error) {
            logger.error('Error enviando mensaje en tiempo real', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
};

// Middleware para manejar conexiones WebSocket
export const realtimeMiddleware = (ws: WebSocket, req: Request) => {
    try {
        const config: RealtimeConfig = {
            type: req.query.type as 'stability' | 'telemetry' | 'event' | 'all',
            vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
            organizationId: req.query.organizationId
                ? parseInt(req.query.organizationId as string)
                : undefined
        };

        if (!config.type) {
            throw new AppError(400, 'Tipo de conexión requerido');
        }

        // Generar ID de conexión
        const connectionId = `${config.type}:${config.vehicleId || config.organizationId || 'all'}`;
        connections.set(connectionId, ws);

        // Manejar mensajes
        ws.on('message', async (message: string) => {
            try {
                const data = JSON.parse(message);

                // Validar mensaje
                if (!data.type || !data.data) {
                    throw new AppError(400, 'Mensaje inválido');
                }

                // Procesar mensaje según el tipo
                switch (data.type) {
                    case 'stability':
                        await processStabilityData(data.data, config);
                        break;
                    case 'telemetry':
                        await processTelemetryData(data.data, config);
                        break;
                    case 'event':
                        await processEventData(data.data, config);
                        break;
                    default:
                        throw new AppError(400, 'Tipo de mensaje no soportado');
                }
            } catch (error) {
                logger.error('Error procesando mensaje en tiempo real', { error });
                ws.send(JSON.stringify({ error: error.message }));
            }
        });

        // Manejar cierre de conexión
        ws.on('close', () => {
            connections.delete(connectionId);
            logger.info('Conexión WebSocket cerrada', { connectionId });
        });

        // Enviar mensaje de confirmación
        ws.send(
            JSON.stringify({
                type: 'connection',
                data: { id: connectionId },
                timestamp: new Date()
            })
        );

        logger.info('Nueva conexión WebSocket establecida', { connectionId });
    } catch (error) {
        logger.error('Error estableciendo conexión WebSocket', { error });
        ws.close();
    }
};

// Procesar datos de estabilidad
const processStabilityData = async (data: any, config: RealtimeConfig) => {
    try {
        // Crear evento de estabilidad
        const event = await prisma.event.create({
            data: {
                type: EventType.STABILITY_WARNING,
                severity: data.severity as EventSeverity,
                description: `LTR: ${data.ltr}, SSF: ${data.ssf}, DRS: ${data.drs}`,
                vehicleId: data.vehicleId,
                organizationId: data.organizationId
            }
        });

        // Enviar notificación
        broadcastMessage(
            {
                type: 'stability',
                data: {
                    ...data,
                    eventId: event.id
                },
                timestamp: new Date()
            },
            config
        );
    } catch (error) {
        logger.error('Error procesando datos de estabilidad', { error, data });
        throw error;
    }
};

// Procesar datos de telemetría
const processTelemetryData = async (data: any, config: RealtimeConfig) => {
    try {
        // Validar sesión activa
        const session = await prisma.session.findFirst({
            where: {
                vehicleId: data.vehicleId,
                status: 'ACTIVE'
            }
        });

        if (!session) {
            throw new AppError(400, 'No hay sesión activa para este vehículo');
        }

        // Enviar notificación
        broadcastMessage(
            {
                type: 'telemetry',
                data: {
                    ...data,
                    sessionId: session.id
                },
                timestamp: new Date()
            },
            config
        );
    } catch (error) {
        logger.error('Error procesando datos de telemetría', { error, data });
        throw error;
    }
};

// Procesar datos de eventos
const processEventData = async (data: any, config: RealtimeConfig) => {
    try {
        // Crear evento
        const event = await prisma.event.create({
            data: {
                type: data.type as EventType,
                severity: data.severity as EventSeverity,
                description: data.description,
                vehicleId: data.vehicleId,
                organizationId: data.organizationId
            }
        });

        // Enviar notificación
        broadcastMessage(
            {
                type: 'event',
                data: {
                    ...data,
                    eventId: event.id
                },
                timestamp: new Date()
            },
            config
        );
    } catch (error) {
        logger.error('Error procesando datos de evento', { error, data });
        throw error;
    }
};
