// Categorías de vehículos según la DGT (Dirección General de Tráfico de España)
// Fuente: https://www.dgt.es/

import { DGTVehicleCategory } from '../types/deviceControl';

export const DGT_VEHICLE_CATEGORIES: DGTVehicleCategory[] = [
    {
        id: 'turismo',
        name: 'Turismo',
        type: 'ligero',
        speedLimits: {
            urban: 50,      // km/h en ciudad
            interurban: 90, // km/h en carretera convencional
            highway: 120    // km/h en autopista/autovía
        }
    },
    {
        id: 'motocicleta',
        name: 'Motocicleta',
        type: 'ligero',
        speedLimits: {
            urban: 50,
            interurban: 90,
            highway: 120
        }
    },
    {
        id: 'camion_ligero',
        name: 'Camión Ligero (< 3.5t)',
        type: 'ligero',
        speedLimits: {
            urban: 50,
            interurban: 90,
            highway: 120
        }
    },
    {
        id: 'camion_pesado',
        name: 'Camión Pesado (> 3.5t)',
        type: 'pesado',
        speedLimits: {
            urban: 50,
            interurban: 80,  // Reducido para pesados
            highway: 90      // Reducido para pesados
        }
    },
    {
        id: 'camion_mas_12t',
        name: 'Camión (> 12t)',
        type: 'pesado',
        speedLimits: {
            urban: 50,
            interurban: 80,
            highway: 90
        }
    },
    {
        id: 'autobus',
        name: 'Autobús',
        type: 'autobus',
        speedLimits: {
            urban: 50,
            interurban: 80,
            highway: 100    // Autobuses pueden ir a 100 en autopista
        }
    },
    {
        id: 'vehiculo_emergencia',
        name: 'Vehículo de Emergencias',
        type: 'ligero',
        speedLimits: {
            urban: 50,      // Sin rotativo
            interurban: 90, // Sin rotativo
            highway: 120    // Sin rotativo
            // Con rotativo: sin límite legal (pero debe ser seguro)
        }
    },
    {
        id: 'furgoneta',
        name: 'Furgoneta',
        type: 'ligero',
        speedLimits: {
            urban: 50,
            interurban: 90,
            highway: 120
        }
    }
];

// Mapeo de vehículos DobackSoft a categorías DGT
export const VEHICLE_TO_DGT_CATEGORY: Record<string, string> = {
    // Vehículos de bomberos
    'doback022': 'vehiculo_emergencia',
    'doback023': 'vehiculo_emergencia',
    'doback024': 'vehiculo_emergencia',
    'doback025': 'vehiculo_emergencia',
    'doback026': 'vehiculo_emergencia',
    'doback027': 'vehiculo_emergencia',
    'doback028': 'vehiculo_emergencia',
    // Por defecto, vehículos de emergencia
    'default': 'vehiculo_emergencia'
};

// Límites especiales para vehículos de emergencia con rotativo
export const EMERGENCY_WITH_ROTATIVO_LIMITS = {
    urban: 80,      // Límite razonable en ciudad con rotativo
    interurban: 120, // Límite razonable en carretera con rotativo
    highway: 140    // Límite razonable en autopista con rotativo
};

// Tipos de vía
export type RoadType = 'urban' | 'interurban' | 'highway';

// Función para obtener la categoría DGT de un vehículo
export function getDGTCategory(vehicleId: string): DGTVehicleCategory {
    const categoryId = VEHICLE_TO_DGT_CATEGORY[vehicleId] || VEHICLE_TO_DGT_CATEGORY['default'];
    const category = DGT_VEHICLE_CATEGORIES.find(cat => cat.id === categoryId);

    // Retornar categoría encontrada o la primera como fallback
    return category ?? DGT_VEHICLE_CATEGORIES[0]!;
}

// Función para obtener el límite de velocidad aplicable
export function getSpeedLimit(
    vehicleId: string,
    roadType: RoadType,
    rotativoOn: boolean,
    inPark: boolean
): number {
    // Si está en el parque, límite especial
    if (inPark) {
        return 20; // km/h dentro del parque
    }

    const category = getDGTCategory(vehicleId);

    // Si es vehículo de emergencia con rotativo, usar límites especiales
    if (category.id === 'vehiculo_emergencia' && rotativoOn) {
        return EMERGENCY_WITH_ROTATIVO_LIMITS[roadType];
    }

    // Límite normal según categoría y tipo de vía
    return category.speedLimits[roadType];
}

// Función para clasificar exceso de velocidad
export function classifySpeedViolation(
    speed: number,
    speedLimit: number
): 'correcto' | 'leve' | 'grave' {
    const excess = speed - speedLimit;

    if (excess <= 0) {
        return 'correcto';
    }

    // Leve: hasta 20 km/h de exceso
    if (excess <= 20) {
        return 'leve';
    }

    // Grave: más de 20 km/h de exceso
    return 'grave';
}

// Función para obtener el color según el tipo de violación
export function getViolationColor(violationType: 'correcto' | 'leve' | 'grave'): string {
    switch (violationType) {
        case 'correcto':
            return '#3B82F6'; // Azul
        case 'leve':
            return '#F59E0B'; // Amarillo
        case 'grave':
            return '#EF4444'; // Rojo
        default:
            return '#9CA3AF'; // Gris
    }
}
