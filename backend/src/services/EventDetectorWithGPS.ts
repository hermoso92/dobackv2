import { EventSeverity, PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { dataCorrelationService } from './DataCorrelationService';

const logger = createLogger('EventDetectorWithGPS');
const prisma = new PrismaClient();

export interface EventoDetectado {
    timestamp: Date;
    tipo: string;
    severidad: EventSeverity;
    lat: number;
    lon: number;
    speed: number;
    interpolatedGPS: boolean;
    rotativoState: number;
    keyType?: number;
    valores: {
        ax: number;
        ay: number;
        az: number;
        gx: number;
        gy: number;
        gz: number;
        roll: number;
        pitch: number;
        yaw: number;
        si: number;
        accmag: number;
    };
}

/**
 * Event Detector con GPS - VERSIÓN CORREGIDA
 * 
 * CORRECCIONES APLICADAS:
 * 1. Severidad viene SOLO del SI (no del tipo de evento)
 * 2. Tipos de eventos son etiquetas adicionales basadas en dinámica
 * 3. No hay filtro global "si < 0.50" que bloquee otros casos
 * 
 * SEVERIDAD (solo basada en SI):
 * - GRAVE: si < 0.20
 * - MODERADA: 0.20 ≤ si < 0.35
 * - LEVE: 0.35 ≤ si < 0.50
 * - NORMAL (no se guarda evento): si ≥ 0.50
 */
export class EventDetectorWithGPS {

    /**
     * Detecta y guarda eventos de estabilidad con coordenadas GPS
     */
    async detectarYGuardarEventos(sessionId: string): Promise<{ total: number; guardados: number }> {
        try {
            logger.info(`Detectando eventos para sesión ${sessionId}`);

            // 1. Obtener datos correlacionados (estabilidad con GPS)
            const { estabilidadConGPS } = await dataCorrelationService.correlacionarSesion(sessionId);

            if (estabilidadConGPS.length === 0) {
                logger.info(`No hay datos de estabilidad para sesión ${sessionId}`);
                return { total: 0, guardados: 0 };
            }

            const eventos: EventoDetectado[] = [];

            // 2. Analizar cada muestra
            for (const muestra of estabilidadConGPS) {
                // ✅ SEVERIDAD BASADA EN SI
                let severidad: EventSeverity;

                if (muestra.si < 0.20) {
                    severidad = 'GRAVE';
                } else if (muestra.si >= 0.20 && muestra.si < 0.35) {
                    severidad = 'MODERADA';
                } else if (muestra.si >= 0.35 && muestra.si < 0.50) {
                    severidad = 'LEVE';
                } else {
                    // SI ≥ 0.50 = NORMAL, no guardar evento
                    continue;
                }

                // ✅ TIPOS DE EVENTOS (etiquetas adicionales basadas en dinámica)
                const tipos: string[] = [];

                // Vuelco inminente
                if (muestra.si < 0.10 && (Math.abs(muestra.roll) > 10 || Math.abs(muestra.gx) > 30)) {
                    tipos.push('VUELCO_INMINENTE');
                }

                // Deriva peligrosa (sin restricción de SI, ya que puede pasar con SI bajo)
                if (Math.abs(muestra.gx) > 45) {
                    tipos.push('DERIVA_PELIGROSA');
                }

                // Maniobra brusca
                if (Math.abs(muestra.ay) > 300) {
                    tipos.push('MANIOBRA_BRUSCA');
                }

                // Riesgo de vuelco (general)
                if (muestra.si < 0.30) {
                    tipos.push('RIESGO_VUELCO');
                }

                // Zona inestable (variaciones en gz)
                if (Math.abs(muestra.gz) > 1000) {
                    tipos.push('ZONA_INESTABLE');
                }

                // Si no hay tipo específico, marcar como evento genérico
                const tipoFinal = tipos.length > 0 ? tipos.join(',') : 'ESTABILIDAD_BAJA';

                // Crear evento
                eventos.push({
                    timestamp: muestra.timestamp,
                    tipo: tipoFinal,
                    severidad,
                    lat: muestra.lat,
                    lon: muestra.lon,
                    speed: muestra.speed,
                    interpolatedGPS: muestra.interpolatedGPS,
                    rotativoState: 0, // TODO: obtener de correlación
                    valores: {
                        ax: muestra.ax,
                        ay: muestra.ay,
                        az: muestra.az,
                        gx: muestra.gx,
                        gy: muestra.gy,
                        gz: muestra.gz,
                        roll: muestra.roll,
                        pitch: muestra.pitch,
                        yaw: muestra.yaw,
                        si: muestra.si,
                        accmag: muestra.accmag
                    }
                });
            }

            logger.info(`Eventos detectados: ${eventos.length} de ${estabilidadConGPS.length} muestras`);

            // 3. Guardar eventos en BD
            let guardados = 0;

            for (const evento of eventos) {
                try {
                    await prisma.stability_events.create({
                        data: {
                            session_id: sessionId,
                            timestamp: evento.timestamp,
                            type: evento.tipo,
                            severity: evento.severidad,
                            lat: evento.lat,
                            lon: evento.lon,
                            speed: evento.speed,
                            interpolatedGPS: evento.interpolatedGPS,
                            rotativoState: evento.rotativoState,
                            keyType: evento.keyType || null,
                            details: evento.valores
                        }
                    });
                    guardados++;
                } catch (error: any) {
                    // Ignorar duplicados
                    if (!error.code || error.code !== 'P2002') {
                        logger.error(`Error guardando evento: ${error.message}`);
                    }
                }
            }

            logger.info(`Guardados ${guardados} eventos para sesión ${sessionId}`);

            return { total: eventos.length, guardados };

        } catch (error: any) {
            logger.error(`Error en detectarYGuardarEventos: ${error.message}`);
            throw error;
        }
    }

    /**
     * Detecta eventos para múltiples sesiones en paralelo
     */
    async detectarEventosMultiples(sessionIds: string[]): Promise<Map<string, { total: number; guardados: number }>> {
        logger.info(`Detectando eventos para ${sessionIds.length} sesiones en paralelo`);

        const resultados = new Map<string, { total: number; guardados: number }>();

        const promesas = sessionIds.map(async (sessionId) => {
            try {
                const resultado = await this.detectarYGuardarEventos(sessionId);
                resultados.set(sessionId, resultado);
            } catch (error: any) {
                logger.error(`Error detectando eventos para sesión ${sessionId}`, { error: error.message });
                resultados.set(sessionId, { total: 0, guardados: 0 });
            }
        });

        await Promise.all(promesas);

        logger.info(`Detección múltiple completada: ${resultados.size} sesiones procesadas`);

        return resultados;
    }
}

export const eventDetectorWithGPS = new EventDetectorWithGPS();

