import { StabilityMeasurements } from '../types/stability';

export type RolloverCause =
    | 'Pendiente lateral'
    | 'Curva brusca'
    | 'Maniobra brusca'
    | 'Terreno irregular'
    | 'Pérdida de adherencia'
    | 'Sin causa clara';

/**
 * Detecta la causa más probable del riesgo de vuelco para una medición actual.
 * Se basa en las reglas de negocio proporcionadas por el usuario.
 * @param current Medición actual de estabilidad
 * @param previous Medición inmediatamente anterior (opcional, para derivadas)
 */
export function detectRolloverCause(
    current: StabilityMeasurements,
    previous?: StabilityMeasurements
): RolloverCause {
    const roll = Math.abs(current.roll); // °
    const ay = Math.abs(current.ay); // m/s²
    const yawRate = Math.abs(current.gz); // rad/s   (suponemos gyro Z ≈ yaw_rate)

    // 1) Pendiente lateral
    if (roll > 5 && ay < 0.5) {
        return 'Pendiente lateral';
    }

    // 2) Curva brusca
    if (ay > 1.5 && yawRate > 0.1 && roll < 5) {
        return 'Curva brusca';
    }

    // Para reglas que necesitan derivadas hace falta medición previa
    if (previous) {
        const dt = (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000; // s
        if (dt > 0) {
            // 3) Maniobra brusca: cambios rápidos en yaw_rate o ay
            const dyawDt = Math.abs(yawRate - Math.abs(previous.gz)) / dt; // rad/s²
            const dayDt = Math.abs(ay - Math.abs(previous.ay)) / dt; // m/s³
            if (roll < 5 && (dyawDt > 1 || dayDt > 3)) {
                return 'Maniobra brusca';
            }

            // 4) Terreno irregular: picos en roll
            const drollDt = Math.abs(roll - Math.abs(previous.roll)) / dt; // °/s
            if (drollDt > 20 && ay < 0.5) {
                return 'Terreno irregular';
            }
        }
    }

    // 5) Pérdida de adherencia
    // No contamos con velocidad en StabilityMeasurements, así que omitimos.

    return 'Sin causa clara';
}
