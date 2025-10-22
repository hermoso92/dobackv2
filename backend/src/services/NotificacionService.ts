
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';



interface NotificacionConfig {
    destinatarios?: string[];
    mensaje: string;
    retardo?: number;
}

export class NotificacionService {
    private notificacionesPendientes: Map<
        string,
        {
            timestamp: number;
            mensajes: string[];
            prioridad: number;
        }
    > = new Map();

    private prioridades = {
        CRITICA: 1,
        ALTA: 2,
        MEDIA: 3,
        BAJA: 4
    };

    private agrupacion = {
        tiempo: 5000, // 5 segundos
        maxNotificaciones: 10
    };

    async crearNotificacion(data: any) {
        return prisma.notification.create({ data });
    }

    async obtenerNotificacion(id: string) {
        return prisma.notification.findUnique({ where: { id } });
    }

    async listar() {
        return prisma.notification.findMany();
    }

    async enviar(config: NotificacionConfig): Promise<void> {
        try {
            const key = this.generarKeyAgrupacion(config);
            if (this.notificacionesPendientes.has(key)) {
                this.agruparNotificacion(key, config);
            } else {
                this.crearNuevaAgrupacion(key, config);
            }
            await this.procesarNotificacionesAgrupadas();
        } catch (error) {
            logger.error('Error enviando notificación', { error, config });
            throw error;
        }
    }

    private generarKeyAgrupacion(config: NotificacionConfig): string {
        return (config.destinatarios || []).join(',');
    }

    private agruparNotificacion(key: string, config: NotificacionConfig) {
        const grupo = this.notificacionesPendientes.get(key);
        if (grupo) {
            grupo.mensajes.push(config.mensaje);
            grupo.timestamp = Date.now();
        }
    }

    private crearNuevaAgrupacion(key: string, config: NotificacionConfig) {
        this.notificacionesPendientes.set(key, {
            timestamp: Date.now(),
            mensajes: [config.mensaje],
            prioridad: this.prioridades.MEDIA
        });
    }

    private async procesarNotificacionesAgrupadas(): Promise<void> {
        const ahora = Date.now();
        for (const [key, grupo] of this.notificacionesPendientes) {
            if (ahora - grupo.timestamp >= this.agrupacion.tiempo) {
                await this.enviarNotificacionAgrupada(key, grupo);
                this.notificacionesPendientes.delete(key);
            }
        }
    }

    private async enviarNotificacionAgrupada(
        key: string,
        grupo: { mensajes: string[]; prioridad: number }
    ): Promise<void> {
        try {
            const destinatarios = key.split(',');
            const mensaje = grupo.mensajes.join('\n');
            logger.info('Enviando notificación agrupada', {
                destinatarios,
                mensaje,
                prioridad: grupo.prioridad
            });
        } catch (error) {
            logger.error('Error enviando notificación agrupada', { error, key });
            throw error;
        }
    }
}
