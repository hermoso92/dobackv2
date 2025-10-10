import { logger } from '../utils/logger';

export class StabilityProcessorService {
    public processRawData(data: any): any {
        try {
            // Validar datos de entrada
            if (!data.timestamp) throw new Error('Falta timestamp');
            return {
                timestamp: new Date(data.timestamp),
                roll: parseFloat(data.roll),
                pitch: parseFloat(data.pitch),
                yaw: parseFloat(data.yaw),
                ay: parseFloat(data.ay),
                az: parseFloat(data.az),
                ax: parseFloat(data.ax)
            };
        } catch (error) {
            logger.error('Error procesando datos de estabilidad', { error, data });
            throw new Error('Error procesando datos de estabilidad');
        }
    }

    public calculateMetrics(measurements: any[]): any {
        try {
            if (!measurements || measurements.length === 0) {
                throw new Error('No hay mediciones para calcular métricas');
            }
            const latest = measurements[measurements.length - 1];
            // Ejemplo: solo métricas básicas
            return {
                roll: latest.roll,
                pitch: latest.pitch,
                yaw: latest.yaw,
                ay: latest.ay,
                az: latest.az,
                ax: latest.ax
            };
        } catch (error) {
            logger.error('Error calculando métricas', { error });
            throw new Error('Error calculando métricas');
        }
    }
}
