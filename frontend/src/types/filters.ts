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
                start: getToday(),
                end: getToday()
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
        start: getWeekAgo(),
        end: getToday()
    },
    rotativo: 'all',
    clave: ['0', '2', '5', 'other'],
    severity: ['G', 'M', 'L'],
    roadType: [],
    sessionType: 'all'
};
