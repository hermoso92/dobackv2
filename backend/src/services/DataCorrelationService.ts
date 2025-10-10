import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { crearMapaRotativo, encontrarEstadoMasCercano } from './parsers/RobustRotativoParser';

const logger = createLogger('DataCorrelationService');
const prisma = new PrismaClient();

export interface GPSConRotativo {
    id: string;
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    fix: string | null;
    rotativoOn: boolean;
}

export interface EstabilidadConGPS {
    id: string;
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number | null;
    pitch: number | null;
    yaw: number | null;
    si: number;
    accmag: number;
    lat: number;
    lon: number;
    speed: number;
    interpolatedGPS: boolean;
}

export interface CorrelacionResult {
    gpsConRotativo: GPSConRotativo[];
    estabilidadConGPS: EstabilidadConGPS[];
    estadisticas: {
        puntosGPS: number;
        puntosGPSValidos: number;
        muestrasEstabilidad: number;
        cambiosRotativo: number;
        correlacionesGPSRotativo: number;
        correlacionesEstabilidadGPS: number;
    };
}

/**
 * Servicio de Correlación de Datos
 * 
 * Correlaciona:
 * - GPS con ROTATIVO (estado de sirena en cada punto)
 * - ESTABILIDAD con GPS (ubicación de eventos)
 * - Interpola GPS cuando falta señal
 */
export class DataCorrelationService {

    /**
     * Correlaciona todos los datos de una sesión
     */
    async correlacionarSesion(sessionId: string): Promise<CorrelacionResult> {
        logger.info(`Correlacionando datos de sesión ${sessionId}`);

        // 1. Obtener todos los datos de la sesión
        const [gps, estabilidad, rotativo] = await Promise.all([
            prisma.gpsMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.stabilityMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.rotativoMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            })
        ]);

        logger.info(`Datos obtenidos: GPS=${gps.length}, ESTABILIDAD=${estabilidad.length}, ROTATIVO=${rotativo.length}`);

        // 2. Crear mapa de estado rotativo por timestamp
        const rotativoMap = crearMapaRotativo(rotativo.map(r => ({
            timestamp: r.timestamp,
            state: r.state
        })));

        // 3. Correlacionar GPS con Rotativo
        let correlacionesGPSRotativo = 0;
        const gpsConRotativo: GPSConRotativo[] = gps.map(g => {
            const estado = encontrarEstadoMasCercano(g.timestamp, rotativoMap, 5000);

            if (estado !== null) {
                correlacionesGPSRotativo++;
            }

            return {
                id: g.id,
                timestamp: g.timestamp,
                latitude: g.latitude,
                longitude: g.longitude,
                speed: g.speed,
                fix: g.fix,
                rotativoOn: estado === '1'
            };
        });

        // 4. Correlacionar Estabilidad con GPS
        let correlacionesEstabilidadGPS = 0;
        const estabilidadConGPS: EstabilidadConGPS[] = estabilidad.map(e => {
            const gpsMasCercano = this.encontrarPuntoGPSMasCercano(e.timestamp, gps, 5000);

            if (gpsMasCercano) {
                correlacionesEstabilidadGPS++;
            }

            return {
                id: e.id,
                timestamp: e.timestamp,
                ax: e.ax,
                ay: e.ay,
                az: e.az,
                gx: e.gx,
                gy: e.gy,
                gz: e.gz,
                roll: e.roll,
                pitch: e.pitch,
                yaw: e.yaw,
                si: e.si,
                accmag: e.accmag,
                lat: gpsMasCercano?.latitude || 0,
                lon: gpsMasCercano?.longitude || 0,
                speed: gpsMasCercano?.speed || 0,
                interpolatedGPS: false // TODO: detectar si fue interpolado
            };
        });

        const puntosGPSValidos = gps.filter(g => g.fix === '1').length;

        logger.info(`Correlación completada`, {
            gpsRotativo: correlacionesGPSRotativo,
            estabilidadGPS: correlacionesEstabilidadGPS
        });

        return {
            gpsConRotativo,
            estabilidadConGPS,
            estadisticas: {
                puntosGPS: gps.length,
                puntosGPSValidos,
                muestrasEstabilidad: estabilidad.length,
                cambiosRotativo: rotativo.length,
                correlacionesGPSRotativo,
                correlacionesEstabilidadGPS
            }
        };
    }

    /**
     * Encuentra el punto GPS más cercano a un timestamp dado
     * Busca en una ventana de ±maxDiffMs milisegundos
     */
    private encontrarPuntoGPSMasCercano(
        timestamp: Date,
        puntosGPS: any[],
        maxDiffMs: number = 5000
    ): any | null {
        const targetTime = timestamp.getTime();
        let puntoMasCercano: any | null = null;
        let menorDiferencia = Infinity;

        for (const punto of puntosGPS) {
            const diff = Math.abs(targetTime - punto.timestamp.getTime());

            if (diff < menorDiferencia && diff <= maxDiffMs) {
                menorDiferencia = diff;
                puntoMasCercano = punto;
            }
        }

        return puntoMasCercano;
    }

    /**
     * Correlaciona múltiples sesiones en paralelo
     */
    async correlacionarSesionesMultiples(sessionIds: string[]): Promise<Map<string, CorrelacionResult>> {
        logger.info(`Correlacionando ${sessionIds.length} sesiones en paralelo`);

        const resultados = new Map<string, CorrelacionResult>();

        const promesas = sessionIds.map(async (sessionId) => {
            try {
                const resultado = await this.correlacionarSesion(sessionId);
                resultados.set(sessionId, resultado);
            } catch (error: any) {
                logger.error(`Error correlacionando sesión ${sessionId}`, { error: error.message });
            }
        });

        await Promise.all(promesas);

        logger.info(`Correlación múltiple completada: ${resultados.size}/${sessionIds.length} sesiones`);

        return resultados;
    }
}

export const dataCorrelationService = new DataCorrelationService();

