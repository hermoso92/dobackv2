/**
 * Configuración de estabilidad para DobackSoft V2
 * Estos parámetros son usados para los cálculos de estabilidad y visualización
 */

// Constantes físicas
export const GRAVITY = 9.81;  // m/s²

// Valores por defecto del vehículo
export const DEFAULT_VEHICLE_CONFIG = {
    track_width: 2.0,  // m
    cg_height: 1.5,    // m
    wheelbase: 3.0,    // m
    mass: 2000.0,      // kg
    max_speed: 120.0,  // km/h
};

// Umbrales de peligrosidad
export const DANGER_THRESHOLDS = {
    safe: {
        min: 0.0,
        max: 0.3,
        color: '#00FF00',  // Verde
        description: 'Condiciones seguras'
    },
    warning: {
        min: 0.3,
        max: 0.6,
        color: '#FFFF00',  // Amarillo
        description: 'Atención requerida'
    },
    danger: {
        min: 0.6,
        max: 0.8,
        color: '#FFA500',  // Naranja
        description: 'Condiciones peligrosas'
    },
    critical: {
        min: 0.8,
        max: 1.0,
        color: '#FF0000',  // Rojo
        description: 'Riesgo de vuelco inminente'
    }
};

// Pesos para el cálculo de peligrosidad
export const DANGER_WEIGHTS = {
    ltr: 0.4,  // Lateral Transfer Ratio
    ssf: 0.3,  // Static Stability Factor
    drs: 0.3   // Dynamic Rollover Stability
};

// Umbrales de alarmas
export const ALARM_THRESHOLDS = {
    ltr: {
        warning: 0.6,
        danger: 0.8,
        critical: 0.9
    },
    ssf: {
        warning: 1.2,
        danger: 1.0,
        critical: 0.8
    },
    drs: {
        warning: 0.5,
        danger: 0.3,
        critical: 0.1
    },
    roll_angle: {
        warning: 5.0,  // grados
        danger: 10.0,
        critical: 15.0
    },
    lateral_acc: {
        warning: 0.3,  // g
        danger: 0.5,
        critical: 0.7
    }
};

// Configuración de visualización
export const VISUALIZATION_CONFIG = {
    trend_window: 100,  // puntos para análisis de tendencia
    update_interval: 100,  // ms entre actualizaciones
    graph_colors: {
        ltr: '#FF0000',
        ssf: '#FFA500',
        drs: '#FFFF00',
        roll_angle: '#00FF00',
        lateral_acc: '#0000FF'
    },
    reference_lines: {
        warning: { color: '#FFFF00', style: '--' },
        danger: { color: '#FFA500', style: '-.' },
        critical: { color: '#FF0000', style: '-' }
    }
};

// Frecuencias de muestreo disponibles (Hz)
export const SAMPLING_RATES = [1, 5, 10, 20, 50, 100];

// Ventanas de tiempo disponibles (segundos)
export const TIME_WINDOWS = [10, 30, 60, 300, 600]; 