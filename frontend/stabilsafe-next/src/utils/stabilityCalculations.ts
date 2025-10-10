/**
 * Cálculos de estabilidad basados en DobackSoft V1
 * Implementación TypeScript de los algoritmos originales de cálculo
 */

import { ALARM_THRESHOLDS, DANGER_WEIGHTS, GRAVITY } from '../config/stabilityConfig';
import { Alarm, DangerInfo, StabilityMetrics, TelemetryData, TrendInfo } from '../types';

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

  // Cálculo LTR según la fórmula original de DobackSoft V1
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

  return {
    ltr,
    ssf,
    drs,
    dangerLevel,
    timestamp: telemetryData.timestamp
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
        description: 'LTR en advertencia - Transferencia de carga significativa',
        timestamp: telemetryData.timestamp
      });
    }

    // Verificar SSF (menor es peor)
    if (ssf <= ALARM_THRESHOLDS.ssf.critical) {
      alarms.push({
        id: `ssf-${telemetryData.timestamp}`,
        type: 'SSF',
        level: 'critical',
        value: ssf,
        threshold: ALARM_THRESHOLDS.ssf.critical,
        description: 'SSF crítico - Estabilidad estructural comprometida',
        timestamp: telemetryData.timestamp
      });
    } else if (ssf <= ALARM_THRESHOLDS.ssf.danger) {
      alarms.push({
        id: `ssf-${telemetryData.timestamp}`,
        type: 'SSF',
        level: 'danger',
        value: ssf,
        threshold: ALARM_THRESHOLDS.ssf.danger,
        description: 'SSF peligroso - Baja estabilidad estática',
        timestamp: telemetryData.timestamp
      });
    } else if (ssf <= ALARM_THRESHOLDS.ssf.warning) {
      alarms.push({
        id: `ssf-${telemetryData.timestamp}`,
        type: 'SSF',
        level: 'warning',
        value: ssf,
        threshold: ALARM_THRESHOLDS.ssf.warning,
        description: 'SSF en advertencia - Estabilidad estática reducida',
        timestamp: telemetryData.timestamp
      });
    }

    // Verificar DRS (menor es peor)
    if (drs <= ALARM_THRESHOLDS.drs.critical) {
      alarms.push({
        id: `drs-${telemetryData.timestamp}`,
        type: 'DRS',
        level: 'critical',
        value: drs,
        threshold: ALARM_THRESHOLDS.drs.critical,
        description: 'DRS crítico - Estabilidad dinámica crítica',
        timestamp: telemetryData.timestamp
      });
    } else if (drs <= ALARM_THRESHOLDS.drs.danger) {
      alarms.push({
        id: `drs-${telemetryData.timestamp}`,
        type: 'DRS',
        level: 'danger',
        value: drs,
        threshold: ALARM_THRESHOLDS.drs.danger,
        description: 'DRS peligroso - Estabilidad dinámica comprometida',
        timestamp: telemetryData.timestamp
      });
    } else if (drs <= ALARM_THRESHOLDS.drs.warning) {
      alarms.push({
        id: `drs-${telemetryData.timestamp}`,
        type: 'DRS',
        level: 'warning',
        value: drs,
        threshold: ALARM_THRESHOLDS.drs.warning,
        description: 'DRS en advertencia - Estabilidad dinámica reducida',
        timestamp: telemetryData.timestamp
      });
    }

    // Verificar ángulo de balanceo (roll)
    if (roll_angle >= ALARM_THRESHOLDS.roll_angle.critical) {
      alarms.push({
        id: `roll-${telemetryData.timestamp}`,
        type: 'ROLL',
        level: 'critical',
        value: roll_angle,
        threshold: ALARM_THRESHOLDS.roll_angle.critical,
        description: 'Ángulo de balanceo crítico',
        timestamp: telemetryData.timestamp
      });
    } else if (roll_angle >= ALARM_THRESHOLDS.roll_angle.danger) {
      alarms.push({
        id: `roll-${telemetryData.timestamp}`,
        type: 'ROLL',
        level: 'danger',
        value: roll_angle,
        threshold: ALARM_THRESHOLDS.roll_angle.danger,
        description: 'Ángulo de balanceo peligroso',
        timestamp: telemetryData.timestamp
      });
    } else if (roll_angle >= ALARM_THRESHOLDS.roll_angle.warning) {
      alarms.push({
        id: `roll-${telemetryData.timestamp}`,
        type: 'ROLL',
        level: 'warning',
        value: roll_angle,
        threshold: ALARM_THRESHOLDS.roll_angle.warning,
        description: 'Ángulo de balanceo en advertencia',
        timestamp: telemetryData.timestamp
      });
    }

    // Verificar aceleración lateral
    if (lateral_acc >= ALARM_THRESHOLDS.lateral_acc.critical) {
      alarms.push({
        id: `lat-acc-${telemetryData.timestamp}`,
        type: 'LATERAL_ACC',
        level: 'critical',
        value: lateral_acc,
        threshold: ALARM_THRESHOLDS.lateral_acc.critical,
        description: 'Aceleración lateral crítica',
        timestamp: telemetryData.timestamp
      });
    } else if (lateral_acc >= ALARM_THRESHOLDS.lateral_acc.danger) {
      alarms.push({
        id: `lat-acc-${telemetryData.timestamp}`,
        type: 'LATERAL_ACC',
        level: 'danger',
        value: lateral_acc,
        threshold: ALARM_THRESHOLDS.lateral_acc.danger,
        description: 'Aceleración lateral peligrosa',
        timestamp: telemetryData.timestamp
      });
    } else if (lateral_acc >= ALARM_THRESHOLDS.lateral_acc.warning) {
      alarms.push({
        id: `lat-acc-${telemetryData.timestamp}`,
        type: 'LATERAL_ACC',
        level: 'warning',
        value: lateral_acc,
        threshold: ALARM_THRESHOLDS.lateral_acc.warning,
        description: 'Aceleración lateral en advertencia',
        timestamp: telemetryData.timestamp
      });
    }

    return alarms;
  } catch (error) {
    console.error('Error al verificar alarmas:', error);

    alarms.push({
      id: `system-${telemetryData.timestamp}`,
      type: 'SYSTEM',
      level: 'warning',
      value: 0,
      threshold: 0,
      description: `Error en sistema de alarmas: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: telemetryData.timestamp
    });

    return alarms;
  }
}

/**
 * Calcula la tendencia de peligrosidad en una serie de datos
 */
export function calculateDangerTrend(telemetryData: TelemetryData[], vehicleConfig: { track_width: number; cg_height: number }): TrendInfo {
  if (telemetryData.length < 2) {
    return {
      trend: 'stable',
      changeRate: 0,
      direction: 'none'
    };
  }

  // Calcular nivel de peligrosidad para cada punto
  const dangerLevels = telemetryData.map(data => {
    const metrics = getStabilityMetrics(data, vehicleConfig);
    return metrics.dangerLevel;
  });

  // Calcular cambios entre puntos consecutivos
  const diffs = [];
  for (let i = 1; i < dangerLevels.length; i++) {
    diffs.push(dangerLevels[i] - dangerLevels[i - 1]);
  }

  // Promedio de cambios
  const changeRate = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;

  // Determinar tendencia
  let trend: 'increasing' | 'decreasing' | 'stable';
  let direction: 'up' | 'down' | 'none';

  if (Math.abs(changeRate) < 0.01) {
    trend = 'stable';
    direction = 'none';
  } else if (changeRate > 0) {
    trend = 'increasing';
    direction = 'up';
  } else {
    trend = 'decreasing';
    direction = 'down';
  }

  return {
    trend,
    changeRate,
    direction
  };
}

/**
 * Calcula información de peligrosidad para visualización
 */
export function calculateDangerInfo(
  telemetryData: TelemetryData,
  vehicleConfig: { track_width: number; cg_height: number }
): DangerInfo {
  try {
    // Obtener métricas de estabilidad
    const metrics = getStabilityMetrics(telemetryData, vehicleConfig);

    // Determinar nivel y color
    let level: 'safe' | 'warning' | 'danger' | 'critical';
    let color: string;
    let description: string;

    if (metrics.dangerLevel < 0.3) {
      level = 'safe';
      color = '#00FF00';
      description = 'Condiciones seguras';
    } else if (metrics.dangerLevel < 0.6) {
      level = 'warning';
      color = '#FFFF00';
      description = 'Atención requerida';
    } else if (metrics.dangerLevel < 0.8) {
      level = 'danger';
      color = '#FFA500';
      description = 'Condiciones peligrosas';
    } else {
      level = 'critical';
      color = '#FF0000';
      description = 'Riesgo de vuelco inminente';
    }

    return {
      dangerLevel: metrics.dangerLevel,
      level,
      color,
      description,
      ltrValue: Math.abs(metrics.ltr),
      ssfValue: metrics.ssf,
      drsValue: metrics.drs,
      timestamp: telemetryData.timestamp
    };
  } catch (error) {
    console.error('Error al calcular información de peligrosidad:', error);

    // Valor por defecto en caso de error
    return {
      dangerLevel: 0,
      level: 'safe',
      color: '#00FF00',
      description: 'Sin datos de telemetría',
      ltrValue: 0,
      ssfValue: 0,
      drsValue: 0,
      timestamp: telemetryData.timestamp
    };
  }
} 