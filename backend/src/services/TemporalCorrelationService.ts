import { prisma } from '../config/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('TemporalCorrelationService');

export interface SesionCorrelacionada {
    sessionId: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    tieneGPS: boolean;
    tieneEstabilidad: boolean;
    tieneRotativo: boolean;
    calidadGPS: number; // %
    duracionSegundos: number;
}

/**
 * SERVICIO DE CORRELACIÓN TEMPORAL
 * 
 * Basado en hallazgos reales:
 * - Sesiones pueden ser dispares (10 ESTABILIDAD vs 5 GPS vs 14 ROTATIVO)
 * - GPS puede faltar completamente (0% válido)
 * - Correlación debe ser por RANGO TEMPORAL, no por índice
 */
export class TemporalCorrelationService {

    /**
     * Correlaciona sesiones por rango temporal
     * 
     * Estrategia:
     * 1. Obtener todas las sesiones de un vehículo/fecha
     * 2. Agrupar por rango temporal (±5 min)
     * 3. Marcar qué tipo de datos tiene cada una
     */
    async correlacionarSesionesPorTiempo(
        vehicleId: string,
        startDate: Date,
        endDate: Date
    ): Promise<SesionCorrelacionada[]> {
        logger.info(`Correlacionando sesiones de ${vehicleId} entre ${startDate.toISOString()} y ${endDate.toISOString()}`);

        // 1. Obtener todas las sesiones en el rango
        const sesiones = await prisma.session.findMany({
            where: {
                vehicleId,
                startTime: { gte: startDate, lte: endDate }
            },
            orderBy: { startTime: 'asc' },
            include: {
                dataQualityMetrics: true
            }
        });

        if (sesiones.length === 0) {
            logger.info('No se encontraron sesiones en el rango');
            return [];
        }

        logger.info(`Sesiones encontradas: ${sesiones.length}`);

        // 2. Verificar qué tipo de datos tiene cada sesión
        const sesionesCorrelacionadas: SesionCorrelacionada[] = [];

        for (const sesion of sesiones) {
            const [gpsCount, estabilidadCount, rotativoCount] = await Promise.all([
                prisma.gpsMeasurement.count({ where: { sessionId: sesion.id } }),
                prisma.stabilityMeasurement.count({ where: { sessionId: sesion.id } }),
                prisma.rotativoMeasurement.count({ where: { sessionId: sesion.id } })
            ]);

            const duracion = sesion.endTime
                ? (sesion.endTime.getTime() - sesion.startTime.getTime()) / 1000
                : 0;

            sesionesCorrelacionadas.push({
                sessionId: sesion.id,
                vehicleId: sesion.vehicleId,
                startTime: sesion.startTime,
                endTime: sesion.endTime || sesion.startTime,
                tieneGPS: gpsCount > 0,
                tieneEstabilidad: estabilidadCount > 0,
                tieneRotativo: rotativoCount > 0,
                calidadGPS: sesion.dataQualityMetrics?.porcentajeGPSValido || 0,
                duracionSegundos: duracion
            });
        }

        logger.info(`Correlación completada: ${sesionesCorrelacionadas.length} sesiones`);

        return sesionesCorrelacionadas;
    }

    /**
     * Encuentra sesión que contiene un timestamp específico
     */
    async encontrarSesionPorTimestamp(
        vehicleId: string,
        timestamp: Date,
        toleranciaMinutos: number = 5
    ): Promise<string | null> {
        const margenMs = toleranciaMinutos * 60 * 1000;

        const sesion = await prisma.session.findFirst({
            where: {
                vehicleId,
                startTime: { lte: new Date(timestamp.getTime() + margenMs) },
                OR: [
                    { endTime: { gte: new Date(timestamp.getTime() - margenMs) } },
                    { endTime: null }
                ]
            }
        });

        return sesion?.id || null;
    }

    /**
     * Fusiona sesiones que están muy próximas en el tiempo
     * (pueden ser la misma operación fragmentada)
     */
    async fusionarSesionesCercanas(
        vehicleId: string,
        fecha: Date,
        gapMaximoMinutos: number = 5
    ): Promise<{ fusionadas: number; resultantes: number }> {
        logger.info(`Fusionando sesiones cercanas de ${vehicleId} el ${fecha.toISOString().split('T')[0]}`);

        const inicioDia = new Date(fecha);
        inicioDia.setHours(0, 0, 0, 0);

        const finDia = new Date(fecha);
        finDia.setHours(23, 59, 59, 999);

        const sesiones = await prisma.session.findMany({
            where: {
                vehicleId,
                startTime: { gte: inicioDia, lte: finDia }
            },
            orderBy: { startTime: 'asc' }
        });

        if (sesiones.length < 2) {
            return { fusionadas: 0, resultantes: sesiones.length };
        }

        const gapMaximoMs = gapMaximoMinutos * 60 * 1000;
        let fusionadas = 0;

        for (let i = 0; i < sesiones.length - 1; i++) {
            const actual = sesiones[i];
            const siguiente = sesiones[i + 1];

            if (!actual.endTime) continue;

            const gap = siguiente.startTime.getTime() - actual.endTime.getTime();

            // Si el gap es menor al máximo, fusionar
            if (gap >= 0 && gap <= gapMaximoMs) {
                logger.info(`Fusionando sesiones: ${actual.id} + ${siguiente.id} (gap: ${gap / 1000}s)`);

                // Actualizar sesión actual con endTime de la siguiente
                await prisma.session.update({
                    where: { id: actual.id },
                    data: { endTime: siguiente.endTime }
                });

                // Mover mediciones de la siguiente a la actual
                await Promise.all([
                    prisma.gpsMeasurement.updateMany({
                        where: { sessionId: siguiente.id },
                        data: { sessionId: actual.id }
                    }),
                    prisma.stabilityMeasurement.updateMany({
                        where: { sessionId: siguiente.id },
                        data: { sessionId: actual.id }
                    }),
                    prisma.rotativoMeasurement.updateMany({
                        where: { sessionId: siguiente.id },
                        data: { sessionId: actual.id }
                    })
                ]);

                // Eliminar sesión siguiente
                await prisma.session.delete({ where: { id: siguiente.id } });

                fusionadas++;
                sesiones.splice(i + 1, 1); // Remover del array
                i--; // Re-evaluar la sesión actual
            }
        }

        logger.info(`Fusión completada: ${fusionadas} sesiones fusionadas, ${sesiones.length - fusionadas} resultantes`);

        return {
            fusionadas,
            resultantes: sesiones.length - fusionadas
        };
    }

    /**
     * Obtiene resumen de cobertura de datos por sesión
     */
    async obtenerCoberturaDatos(sessionId: string): Promise<{
        gps: { total: number; validos: number; interpolados: number; porcentaje: number };
        estabilidad: { total: number; conGPS: number; porcentaje: number };
        rotativo: { total: number; cambios: number };
    }> {
        const [gpsCount, gpsValidos, estabilidadCount, rotativoCount, calidad] = await Promise.all([
            prisma.gpsMeasurement.count({ where: { sessionId } }),
            prisma.gpsMeasurement.count({ where: { sessionId, fix: '1' } }),
            prisma.stabilityMeasurement.count({ where: { sessionId } }),
            prisma.rotativoMeasurement.count({ where: { sessionId } }),
            prisma.dataQualityMetrics.findUnique({ where: { sessionId } })
        ]);

        const estabilidadConGPS = await prisma.stability_events.count({
            where: {
                session_id: sessionId,
                lat: { not: 0 },
                lon: { not: 0 }
            }
        });

        return {
            gps: {
                total: gpsCount,
                validos: gpsValidos,
                interpolados: calidad?.gpsInterpoladas || 0,
                porcentaje: calidad?.porcentajeGPSValido || 0
            },
            estabilidad: {
                total: estabilidadCount,
                conGPS: estabilidadConGPS,
                porcentaje: estabilidadCount > 0 ? (estabilidadConGPS / estabilidadCount) * 100 : 0
            },
            rotativo: {
                total: rotativoCount,
                cambios: await this.contarCambiosEstado(sessionId)
            }
        };
    }

    private async contarCambiosEstado(sessionId: string): Promise<number> {
        const mediciones = await prisma.rotativoMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            select: { state: true }
        });

        let cambios = 0;
        for (let i = 1; i < mediciones.length; i++) {
            if (mediciones[i].state !== mediciones[i - 1].state) {
                cambios++;
            }
        }

        return cambios;
    }
}

export const temporalCorrelationService = new TemporalCorrelationService();

