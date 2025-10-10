export interface EventData {
    id: string;
    type: string;
    vehicleId: string;
    vehicleName: string;
    timestamp: string;
    location: string;
    variables: {
        [key: string]: {
            value: number;
            unit: string;
        };
    };
    details?: string[];
}

export const EVENTS_DATA: EventData[] = [
    {
        id: 'EV001',
        type: 'ROLLOVER_RISK',
        vehicleId: 'BM001',
        vehicleName: 'Bomba Urbana Pesada',
        timestamp: new Date().toISOString(),
        location: 'Plaza Castilla, Madrid',
        variables: {
            si: {
                value: 25,
                unit: '%'
            },
            roll: {
                value: 8,
                unit: '°'
            }
        },
        details: [
            'Índice de estabilidad crítico: 25%',
            'Ángulo de balanceo elevado: 8°',
            'Velocidad: 45 km/h'
        ]
    },
    {
        id: 'EV002',
        type: 'IMMINENT_ROLLOVER',
        vehicleId: 'BM002',
        vehicleName: 'Bomba Urbana Ligera',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        location: 'Gran Vía, Madrid',
        variables: {
            si: {
                value: 8,
                unit: '%'
            },
            roll: {
                value: 12,
                unit: '°'
            },
            gx: {
                value: 35,
                unit: '°/s'
            }
        },
        details: [
            'Índice de estabilidad crítico: 8%',
            'Ángulo de balanceo peligroso: 12°',
            'Velocidad angular excesiva: 35°/s'
        ]
    },
    {
        id: 'EV003',
        type: 'SIGNIFICANT_DRIFT',
        vehicleId: 'BM003',
        vehicleName: 'Escalera Automática',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        location: 'Paseo de la Castellana, Madrid',
        variables: {
            yaw_rate_diff: {
                value: 0.18,
                unit: 'rad/s'
            },
            ay: {
                value: 3.2,
                unit: 'm/s²'
            }
        },
        details: [
            'Desviación de trayectoria significativa',
            'Aceleración lateral: 3.2 m/s²',
            'Diferencia de yaw rate: 0.18 rad/s'
        ]
    },
    {
        id: 'EV004',
        type: 'HARSH_MANEUVER',
        vehicleId: 'BM004',
        vehicleName: 'Nodriza',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        location: 'Calle Alcalá, Madrid',
        variables: {
            gx_rate: {
                value: 120,
                unit: '°/s²'
            },
            ay_rate: {
                value: 3.5,
                unit: 'm/s²'
            }
        },
        details: [
            'Maniobra brusca detectada',
            'Tasa de giro elevada: 120°/s²',
            'Aceleración lateral rápida: 3.5 m/s²'
        ]
    },
    {
        id: 'EV005',
        type: 'STABLE_TURN',
        vehicleId: 'BM005',
        vehicleName: 'Unidad de Rescate',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        location: 'Calle Serrano, Madrid',
        variables: {
            ay: {
                value: 2.5,
                unit: 'm/s²'
            },
            si: {
                value: 75,
                unit: '%'
            },
            roll: {
                value: 5,
                unit: '°'
            }
        },
        details: [
            'Curva controlada a velocidad moderada',
            'Índice de estabilidad óptimo: 75%',
            'Ángulo de balanceo seguro: 5°'
        ]
    }
]; 