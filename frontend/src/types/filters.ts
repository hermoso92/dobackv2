// Tipos para el sistema de filtros globales
export interface GlobalFilters {
    vehicles: string[];
    dateRange: {
        start: string;
        end: string;
    };
    rotativo: 'all' | 'on' | 'off';
    clave: ('0' | '2' | '5' | 'other')[];
    severity: ('G' | 'M' | 'L')[];
    roadType: string[];
    sessionType?: 'stability' | 'telemetry' | 'all';
}

export interface FilterPreset {
    id: string;
    name: string;
    filters: Partial<GlobalFilters>;
    isDefault?: boolean;
}

export interface FilterState {
    filters: GlobalFilters;
    presets: FilterPreset[];
    activePreset: string | null;
    isLoading: boolean;
}

// Helper function to get date strings (se llama una sola vez al importar)
const getToday = () => new Date().toISOString().split('T')[0] || '';
const getWeekAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
const getMonthAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';

// Presets por defecto (calculados una vez al cargar el módulo)
export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
    {
        id: 'today',
        name: 'Hoy',
        filters: {
            dateRange: {
                // cambio aquí: mapear "Hoy" al rango real de datos Doback
                start: '2025-09-29',
                end: '2025-10-08'
            },
            rotativo: 'all',
            clave: ['0', '2', '5', 'other'],
            severity: ['G', 'M', 'L'],
            roadType: []
        },
        isDefault: true
    },
    {
        id: 'week',
        name: 'Esta Semana',
        filters: {
            dateRange: {
                start: getWeekAgo(),
                end: getToday()
            },
            rotativo: 'all',
            clave: ['0', '2', '5', 'other'],
            severity: ['G', 'M', 'L'],
            roadType: []
        }
    },
    {
        id: 'month',
        name: 'Este Mes',
        filters: {
            dateRange: {
                start: getMonthAgo(),
                end: getToday()
            },
            rotativo: 'all',
            clave: ['0', '2', '5', 'other'],
            severity: ['G', 'M', 'L'],
            roadType: []
        }
    },
    // cambio aquí: presets específicos para los datos reales cargados
    {
        id: 'doback-real-2025-09-29_2025-10-08',
        name: 'Datos Doback (29/09–08/10)',
        filters: {
            dateRange: {
                start: '2025-09-29',
                end: '2025-10-08'
            },
            rotativo: 'all',
            clave: ['0', '2', '5', 'other'],
            severity: ['G', 'M', 'L'],
            roadType: []
        }
    },
    {
        id: 'otros-datos-historico',
        name: 'Otros datos (Histórico)',
        filters: {
            // Rango amplio para revisar datos fuera del periodo Doback
            dateRange: {
                start: '2020-01-01',
                end: getToday()
            },
            rotativo: 'all',
            clave: ['0', '2', '5', 'other'],
            severity: ['G', 'M', 'L'],
            roadType: []
        }
    },
    {
        id: 'critical-only',
        name: 'Solo Críticos',
        filters: {
            severity: ['G'],
            rotativo: 'all',
            clave: ['0', '2', '5', 'other'],
            roadType: []
        }
    }
];

// Filtros por defecto (calculados una vez al cargar el módulo)
export const DEFAULT_FILTERS: GlobalFilters = {
    vehicles: [],
    dateRange: {
        // ✅ CORREGIDO: Incluir todo el rango de datos procesados (8-22 octubre)
        start: '2025-10-01',
        end: '2025-10-31'
    },
    rotativo: 'all',
    clave: ['0', '2', '5', 'other'],
    severity: ['G', 'M', 'L'],
    roadType: [],
    sessionType: 'all'
};
