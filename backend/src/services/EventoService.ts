import { logger } from '../utils/logger';

export class EventoService {
    private notificaciones: any;
    constructor() {
        this.notificaciones = { enviar: async () => {} };
    }

    private async ejecutarAcciones(evento: any, datos: any): Promise<void> {
        try {
            for (const accion of evento.acciones) {
                switch (accion.tipo) {
                    case 'NOTIFICACION':
                        await this.notificaciones.enviar({
                            destinatarios: accion.configuracion.destinatarios || [],
                            mensaje: accion.configuracion.mensaje || '',
                            retardo: accion.configuracion.retardo
                        });
                        break;
                    case 'REGISTRO':
                        logger.info('Evento registrado', { evento, datos });
                        break;
                    case 'COMANDO':
                        if (accion.configuracion.comando) {
                            logger.info('Comando ejecutado', {
                                comando: accion.configuracion.comando,
                                datos
                            });
                        }
                        break;
                }
            }
        } catch (error) {
            logger.error('Error ejecutando acciones', { error, eventoId: evento.id });
            throw error;
        }
    }
}
