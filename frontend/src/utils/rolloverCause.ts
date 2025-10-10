import { StabilityDataPoint } from '../types/stability';

export type RolloverCause =
    | 'pendiente_lateral'
    | 'curva_brusca'
    | 'maniobra_brusca'
    | 'terreno_irregular'
    | 'perdida_adherencia'
    | 'sin_causa_clara';

/**
 * Detecta la causa probable del riesgo de vuelco basándose en dos puntos consecutivos.
 * @param curr Punto de datos actual
 * @param prev Punto anterior (opcional)
 */
export function detectRolloverCause(
    curr: StabilityDataPoint,
    prev?: StabilityDataPoint
): RolloverCause {
    const roll = Math.abs(curr.roll);
    const ay = Math.abs(curr.ay);
    const yawRate = Math.abs(curr.gz); // gyro_z como yaw_rate aprox.
    const speed = Math.max(curr.time > 0 ? (curr.accmag ?? 0) : 0.1, 0.1); // estimación burda

    // 1) Pendiente lateral
    if (roll > 5 && ay < 0.5) return 'pendiente_lateral';

    // 2) Curva brusca
    if (ay > 1.5 && yawRate > 0.1 && roll < 5) return 'curva_brusca';

    if (prev) {
        const dt = (curr.time - prev.time) / 1000;
        if (dt > 0) {
            // 3) Maniobra brusca
            const dyawDt = Math.abs(yawRate - Math.abs(prev.gz)) / dt;
            const dayDt = Math.abs(ay - Math.abs(prev.ay)) / dt;
            if (roll < 5 && (dyawDt > 1 || dayDt > 3)) return 'maniobra_brusca';

            // 4) Terreno irregular
            const drollDt = Math.abs(roll - Math.abs(prev.roll)) / dt;
            if (drollDt > 20 && ay < 0.5) return 'terreno_irregular';
        }
    }

    // 5) Pérdida de adherencia
    const slip = Math.abs(yawRate - ay / speed);
    if (slip > 0.2) return 'perdida_adherencia';

    return 'sin_causa_clara';
} 