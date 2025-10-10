import { EventSeverity } from '../types/enums';
export interface EventThreshold {
    variable: string;
    value: number;
    unit: string;
    description: string;
}

export interface EventType {
    id: string;
    icon: string;
    name: string;
    severity: EventSeverity;
    description: string;
    variables: string[];
    thresholds: EventThreshold[];
    color: string;
}

export const EVENT_TYPES: EventType[] = [
    {
        id: 'ROLLOVER_RISK',
        icon: '⚠️',
        name: 'Riesgo de vuelco',
        severity: EventSeverity.CRITICAL,
        description: 'Índice de estabilidad por debajo del umbral crítico',
        variables: ['si'],
        thresholds: [
            {
                variable: 'si',
                value: 30,
                unit: '%',
                description: 'Índice de estabilidad total menor al 30%'
            }
        ],
        color: '#f44336' // red
    },
    {
        id: 'IMMINENT_ROLLOVER',
        icon: '⚠️',
        name: 'Vuelco inminente',
        severity: EventSeverity.CRITICAL,
        description: 'Condiciones críticas de estabilidad y balanceo',
        variables: ['si', 'roll', 'gx'],
        thresholds: [
            {
                variable: 'si',
                value: 10,
                unit: '%',
                description: 'Índice de estabilidad total menor al 10%'
            },
            {
                variable: 'roll',
                value: 10,
                unit: '°',
                description: 'Ángulo de balanceo mayor a 10°'
            },
            {
                variable: 'gx',
                value: 30,
                unit: '°/s',
                description: 'Velocidad angular de balanceo mayor a 30°/s'
            }
        ],
        color: '#d32f2f' // dark red
    },
    {
        id: 'SIGNIFICANT_DRIFT',
        icon: '🟡',
        name: 'Deriva lateral significativa',
        severity: EventSeverity.WARNING,
        description: 'Desviación significativa en el comportamiento lateral',
        variables: ['ay', 'yaw', 'gx'],
        thresholds: [
            {
                variable: 'yaw_rate_diff',
                value: 0.15,
                unit: 'rad/s',
                description: 'Diferencia entre yaw rate y ay/v mayor a ±0.15 rad/s'
            }
        ],
        color: '#ffc107' // amber
    },
    {
        id: 'DANGEROUS_DRIFT',
        icon: '🔴',
        name: 'Deriva peligrosa (trompo)',
        severity: EventSeverity.CRITICAL,
        description: 'Pérdida de control direccional',
        variables: ['gx', 'yaw', 'ay'],
        thresholds: [
            {
                variable: 'yaw_rate',
                value: 45,
                unit: '°/s',
                description: 'Velocidad de guiñada excesiva'
            }
        ],
        color: '#d32f2f' // dark red
    },
    {
        id: 'HARSH_MANEUVER',
        icon: '🟠',
        name: 'Maniobra brusca',
        severity: EventSeverity.WARNING,
        description: 'Cambios rápidos en la dinámica del vehículo',
        variables: ['gx', 'ay', 'roll'],
        thresholds: [
            {
                variable: 'gx_rate',
                value: 100,
                unit: '°/s²',
                description: 'Derivada de velocidad angular > 100 °/s²'
            },
            {
                variable: 'ay_rate',
                value: 3,
                unit: 'm/s²',
                description: 'Derivada de aceleración lateral > 3 m/s²'
            }
        ],
        color: '#ff9800' // orange
    },
    {
        id: 'STABLE_TURN',
        icon: '🟢',
        name: 'Curva rápida pero estable',
        severity: EventSeverity.INFO,
        description: 'Maniobra controlada a alta velocidad',
        variables: ['ay', 'roll', 'si'],
        thresholds: [
            {
                variable: 'ay',
                value: 2,
                unit: 'm/s²',
                description: 'Aceleración lateral > 2 m/s²'
            },
            {
                variable: 'si',
                value: 60,
                unit: '%',
                description: 'Índice de estabilidad > 60%'
            },
            {
                variable: 'roll',
                value: 8,
                unit: '°',
                description: 'Ángulo de balanceo < 8°'
            }
        ],
        color: '#4caf50' // green
    },
    {
        id: 'LOAD_CHANGE',
        icon: '🟤',
        name: 'Cambio de carga detectado',
        severity: EventSeverity.WARNING,
        description: 'Variación anormal en la distribución de peso',
        variables: ['roll', 'ay', 'gx', 'si'],
        thresholds: [
            {
                variable: 'si_change',
                value: 10,
                unit: '%',
                description: 'Cambio en índice de estabilidad > ±10%'
            }
        ],
        color: '#795548' // brown
    },
    {
        id: 'UNSTABLE_ZONE',
        icon: '🔵',
        name: 'Zona bacheada / inestable',
        severity: EventSeverity.INFO,
        description: 'Irregularidades en la superficie',
        variables: ['gz', 'gx'],
        thresholds: [
            {
                variable: 'gz_variation',
                value: 2,
                unit: 'm/s²',
                description: 'Variaciones rápidas en aceleración vertical'
            }
        ],
        color: '#2196f3' // blue
    }
];

export const CRITICAL_THRESHOLDS = {
    si: {
        critical: 30,
        normal: 60,
        unit: '%'
    },
    ay: {
        critical: 4,
        unit: 'm/s²'
    },
    gx: {
        critical: 45,
        unit: '°/s'
    },
    roll: {
        critical: 10,
        normal: 5,
        unit: '°'
    }
}; 