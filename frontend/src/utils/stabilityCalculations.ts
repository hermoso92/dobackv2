/**
 * Cálculos de estabilidad basados en DobackSoft V2
 * Implementación TypeScript de los algoritmos de cálculo avanzados
 */

import { ALARM_THRESHOLDS, DANGER_WEIGHTS, GRAVITY } from '../config/stabilityConfig';
import { Alarm, DangerInfo, StabilityMetrics, TelemetryData, TrendInfo } from '../types/stability';
import { logger } from '../utils/logger';

interface StabilityInput {
    lateral_acc?: number;
    roll_angle?: number;
    pitch_angle?: number;
    speed?: number;
    track_width: number;
    cg_height: number;
    wheelbase?: number;
    mass?: number;
}

/**
 * Calcula el Lateral Transfer Ratio (LTR)
 * Mide la transferencia lateral de carga que podría causar vuelco
 */
export function calculateLTR(input: StabilityInput): number {
    const {
        lateral_acc = 0,
        roll_angle = 0,
        track_width,
        cg_height
    } = input;

    if (!track_width || !cg_height) {
        throw new Error('track_width y cg_height son requeridos para calcular LTR');
    }

    // Validar rangos
    if (track_width <= 0 || track_width > 5.0) {
        throw new Error(`Ancho de vía inválido: ${track_width}`);
    }

    if (cg_height <= 0 || cg_height > 3.0) {
        throw new Error(`Altura del CG inválida: ${cg_height}`);
    }

    // Cálculo LTR según la fórmula actualizada
    let ltr = (2 * cg_height * lateral_acc) / (track_width * GRAVITY);
    ltr += Math.sin(roll_angle * Math.PI / 180); // Convertir grados a radianes

    return Math.min(Math.max(ltr, -1.0), 1.0); // Normalizar entre -1 y 1
}

/**
 * Calcula el Static Stability Factor (SSF)
 * Mide la estabilidad estática del vehículo, mayor es mejor
 */
export function calculateSSF(input: StabilityInput): number {
    const { track_width, cg_height } = input;

    if (!track_width || !cg_height) {
        throw new Error('track_width y cg_height son requeridos para calcular SSF');
    }

    if (cg_height === 0) return 10.0; // Evitar división por cero

    // Cálculo SSF
    return track_width / (2 * cg_height);
}

/**
 * Calcula el Dynamic Rollover Stability (DRS)
 * Mide la estabilidad dinámica ante vuelcos, mayor es mejor
 */
export function calculateDRS(input: StabilityInput): number {
    const {
        lateral_acc = 0,
        speed = 0,
        track_width,
        cg_height
    } = input;

    if (!track_width || !cg_height) {
        throw new Error('track_width y cg_height son requeridos para calcular DRS');
    }

    // Velocidad en m/s
    const speedMS = speed / 3.6;

    // Factor de corrección basado en la velocidad
    const velocityFactor = Math.min(Math.max(speedMS / 30, 0), 1);

    // Cálculo DRS
    const staticStability = track_width / (2 * cg_height);
    const dynamicFactor = 1 - (Math.abs(lateral_acc) / GRAVITY) * velocityFactor;

    return staticStability * dynamicFactor;
}

/**
 * Calcula el nivel general de peligrosidad
 * Devuelve un valor entre 0 y 1, donde 1 es máximo peligro
 */
export function calculateDangerLevel(
    ltr: number,
    ssf: number,
    drs: number
): number {
    // Normalizar valores
    const ltrNorm = Math.abs(ltr);
    const ssfNorm = Math.min(ssf / 2.0, 1.0);  // SSF típicamente entre 0 y 2
    const drsNorm = Math.min(Math.max(drs, 0), 1.0);

    // Calcular nivel de peligrosidad según pesos configurados
    const dangerLevel = (
        DANGER_WEIGHTS.ltr * ltrNorm +
        DANGER_WEIGHTS.ssf * (1 - ssfNorm) +  // Invertir SSF (menor es peor)
        DANGER_WEIGHTS.drs * (1 - drsNorm)    // Invertir DRS (menor es peor)
    );

    return Math.min(Math.max(dangerLevel, 0), 1.0);  // Normalizar entre 0 y 1
}

/**
 * Obtiene todas las métricas de estabilidad para un punto de datos
 */
export function getStabilityMetrics(
    telemetryData: TelemetryData,
    vehicleConfig: { track_width: number; cg_height: number }
): StabilityMetrics {
    // Calcular métricas individuales
    const ltr = calculateLTR({
        lateral_acc: telemetryData.lateral_acc,
        roll_angle: telemetryData.roll_angle,
        track_width: vehicleConfig.track_width,
        cg_height: vehicleConfig.cg_height
    });

    const ssf = calculateSSF({
        track_width: vehicleConfig.track_width,
        cg_height: vehicleConfig.cg_height
    });

    const drs = calculateDRS({
        lateral_acc: telemetryData.lateral_acc,
        speed: telemetryData.speed,
        track_width: vehicleConfig.track_width,
        cg_height: vehicleConfig.cg_height
    });

    // Calcular nivel de peligrosidad
    const dangerLevel = calculateDangerLevel(ltr, ssf, drs);

    // En este ejemplo, usamos valores simulados para las métricas adicionales
    // requeridas por la interfaz StabilityMetrics
    return {
        ltr,
        ssf,
        drs,
        dangerLevel,
        timestamp: telemetryData.timestamp,

        // Campos adicionales requeridos por la interfaz
        rsc: 0.9 - Math.abs(ltr), // Valor simulado para Roll Stability Control
        loadTransfer: Math.abs(ltr) * vehicleConfig.track_width * 0.5, // Valor simulado
        rollAngle: telemetryData.roll_angle,
        pitchAngle: telemetryData.pitch_angle,
        lateralAcceleration: telemetryData.lateral_acc,
        verticalAcceleration: telemetryData.acceleration_z || -1.0, // Valor por defecto si no existe
        longitudinalAcceleration: telemetryData.acceleration_x || 0.0 // Valor por defecto si no existe
    };
}

/**
 * Verifica condiciones de alarma en los datos de telemetría
 */
export function checkAlarms(
    telemetryData: TelemetryData,
    vehicleConfig: { track_width: number; cg_height: number }
): Alarm[] {
    const alarms: Alarm[] = [];

    try {
        // Obtener métricas
        const metrics = getStabilityMetrics(telemetryData, vehicleConfig);
        const ltr = Math.abs(metrics.ltr);
        const ssf = metrics.ssf;
        const drs = metrics.drs;
        const roll_angle = Math.abs(telemetryData.roll_angle);
        const lateral_acc = Math.abs(telemetryData.lateral_acc);

        // Verificar LTR
        if (ltr >= ALARM_THRESHOLDS.ltr.critical) {
            alarms.push({
                id: `ltr-${telemetryData.timestamp}`,
                type: 'LTR',
                level: 'critical',
                value: ltr,
                threshold: ALARM_THRESHOLDS.ltr.critical,
                description: 'LTR crítico - Riesgo de vuelco inminente',
                timestamp: telemetryData.timestamp
            });
        } else if (ltr >= ALARM_THRESHOLDS.ltr.danger) {
            alarms.push({
                id: `ltr-${telemetryData.timestamp}`,
                type: 'LTR',
                level: 'danger',
                value: ltr,
                threshold: ALARM_THRESHOLDS.ltr.danger,
                description: 'LTR peligroso - Alta transferencia de carga',
                timestamp: telemetryData.timestamp
            });
        } else if (ltr >= ALARM_THRESHOLDS.ltr.warning) {
            alarms.push({
                id: `ltr-${telemetryData.timestamp}`,
                type: 'LTR',
                level: 'warning',
                value: ltr,
                threshold: ALARM_THRESHOLDS.ltr.warning,
                description: 'LTR elevado - Precaución recomendada',
                timestamp: telemetryData.timestamp
            });
        }

        // Verificar ángulo de rolido (roll)
        if (roll_angle >= ALARM_THRESHOLDS.roll_angle.critical) {
            alarms.push({
                id: `roll-${telemetryData.timestamp}`,
                type: 'ROLL',
                level: 'critical',
                value: roll_angle,
                threshold: ALARM_THRESHOLDS.roll_angle.critical,
                description: 'Ángulo de rolido crítico',
                timestamp: telemetryData.timestamp
            });
        } else if (roll_angle >= ALARM_THRESHOLDS.roll_angle.danger) {
            alarms.push({
                id: `roll-${telemetryData.timestamp}`,
                type: 'ROLL',
                level: 'danger',
                value: roll_angle,
                threshold: ALARM_THRESHOLDS.roll_angle.danger,
                description: 'Ángulo de rolido peligroso',
                timestamp: telemetryData.timestamp
            });
        } else if (roll_angle >= ALARM_THRESHOLDS.roll_angle.warning) {
            alarms.push({
                id: `roll-${telemetryData.timestamp}`,
                type: 'ROLL',
                level: 'warning',
                value: roll_angle,
                threshold: ALARM_THRESHOLDS.roll_angle.warning,
                description: 'Ángulo de rolido elevado',
                timestamp: telemetryData.timestamp
            });
        }

        // Verificar aceleración lateral
        if (lateral_acc >= ALARM_THRESHOLDS.lateral_acc.critical) {
            alarms.push({
                id: `lat_acc-${telemetryData.timestamp}`,
                type: 'LATERAL_ACC',
                level: 'critical',
                value: lateral_acc,
                threshold: ALARM_THRESHOLDS.lateral_acc.critical,
                description: 'Aceleración lateral crítica',
                timestamp: telemetryData.timestamp
            });
        } else if (lateral_acc >= ALARM_THRESHOLDS.lateral_acc.danger) {
            alarms.push({
                id: `lat_acc-${telemetryData.timestamp}`,
                type: 'LATERAL_ACC',
                level: 'danger',
                value: lateral_acc,
                threshold: ALARM_THRESHOLDS.lateral_acc.danger,
                description: 'Aceleración lateral peligrosa',
                timestamp: telemetryData.timestamp
            });
        } else if (lateral_acc >= ALARM_THRESHOLDS.lateral_acc.warning) {
            alarms.push({
                id: `lat_acc-${telemetryData.timestamp}`,
                type: 'LATERAL_ACC',
                level: 'warning',
                value: lateral_acc,
                threshold: ALARM_THRESHOLDS.lateral_acc.warning,
                description: 'Aceleración lateral elevada',
                timestamp: telemetryData.timestamp
            });
        }

        return alarms;
    } catch (error) {
        logger.error('Error checking alarms:', error);
        return [];
    }
}

/**
 * Calcula la tendencia del nivel de peligrosidad
 */
export function calculateDangerTrend(
    telemetryData: TelemetryData[],
    vehicleConfig: { track_width: number; cg_height: number }
): TrendInfo {
    if (telemetryData.length < 10) {
        return {
            trend: 'stable',
            changeRate: 0,
            direction: 'none'
        };
    }

    // Tomar últimos 10 puntos para análisis
    const recentData = telemetryData.slice(-10);

    // Calcular nivel de peligrosidad para cada punto
    const dangerLevels = recentData.map(data =>
        getStabilityMetrics(data, vehicleConfig).dangerLevel
    );

    // Calcular tendencia (regresión lineal simple)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = dangerLevels.length;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dangerLevels[i];
        sumXY += i * dangerLevels[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;

    // Determinar dirección
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let direction: 'up' | 'down' | 'none' = 'none';

    if (Math.abs(slope) < 0.005) {
        trend = 'stable';
        direction = 'none';
    } else if (slope > 0) {
        trend = 'increasing';
        direction = 'up';
    } else {
        trend = 'decreasing';
        direction = 'down';
    }

    return {
        trend,
        changeRate: Math.abs(slope),
        direction
    };
}

/**
 * Calcula información completa de peligrosidad
 */
export function calculateDangerInfo(
    telemetryData: TelemetryData,
    vehicleConfig: { track_width: number; cg_height: number }
): DangerInfo {
    // Calcular métricas
    const metrics = getStabilityMetrics(telemetryData, vehicleConfig);

    // Determinar nivel de peligrosidad
    let level: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';
    let color = '#00FF00';
    let description = 'Condiciones seguras';

    // Clasificación de nivel de riesgo
    // Se asume dangerLevel = 1 - StabilityIndex.
    // Por lo tanto, StabilityIndex < 10 %  ⇒ dangerLevel ≥ 0.90  → Riesgo crítico
    //              10 % ≤ SI < 30 %     ⇒ dangerLevel ∈ [0.70 – 0.90) → Riesgo peligroso
    //              30 % ≤ SI < 50 %     ⇒ dangerLevel ∈ [0.50 – 0.70) → Riesgo moderado
    if (metrics.dangerLevel >= 0.9) {
        level = 'critical';
        color = '#FF0000';
        description = 'Riesgo de vuelco crítico';
    } else if (metrics.dangerLevel >= 0.7) {
        level = 'danger';
        color = '#FFA500';
        description = 'Riesgo de vuelco peligroso';
    } else if (metrics.dangerLevel >= 0.5) {
        level = 'warning';
        color = '#FFFF00';
        description = 'Riesgo de vuelco moderado';
    }

    return {
        dangerLevel: metrics.dangerLevel,
        level,
        color,
        description,
        ltrValue: metrics.ltr,
        ssfValue: metrics.ssf,
        drsValue: metrics.drs,
        timestamp: metrics.timestamp
    };
}

export default {
    calculateLTR,
    calculateSSF,
    calculateDRS,
    calculateDangerLevel,
    getStabilityMetrics,
    checkAlarms,
    calculateDangerTrend,
    calculateDangerInfo
}; 