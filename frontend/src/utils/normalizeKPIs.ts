import { EventDetail } from '../services/kpiService';

/**
 * Normaliza un valor KPI individual (convierte null/undefined/NaN a 0)
 * @param value - Valor a normalizar
 * @returns Valor normalizado (número válido o 0)
 */
export function normalizeKPI(value: number | null | undefined): number {
    if (value === null || value === undefined || isNaN(value)) {
        return 0;
    }
    return value;
}

/**
 * Interfaz para métricas de estabilidad crudas del backend
 */
interface RawStabilityMetrics {
    critical?: number;
    moderate?: number;
    light?: number;
    total_incidents?: number;
    eventos_detallados?: {
        critical?: EventDetail[];
        moderate?: EventDetail[];
        light?: EventDetail[];
    };
    por_tipo?: Record<string, number>;
}

/**
 * Interfaz para métricas de estabilidad normalizadas
 */
export interface NormalizedStabilityMetrics {
    critical: number;
    moderate: number;
    light: number;
    total_incidents: number;
    eventos_detallados: {
        critical: EventDetail[];
        moderate: EventDetail[];
        light: EventDetail[];
    };
    por_tipo: Record<string, number>;
}

/**
 * Normaliza las métricas de estabilidad asegurando valores seguros
 * Convierte null/undefined a 0 y asegura que los arrays existan
 * 
 * @param stability - Métricas de estabilidad crudas del backend
 * @returns Métricas normalizadas con valores seguros
 */
export function normalizeStabilityMetrics(
    stability: RawStabilityMetrics | null | undefined
): NormalizedStabilityMetrics {
    // Si no hay datos, devolver estructura vacía pero válida
    if (!stability) {
        return {
            critical: 0,
            moderate: 0,
            light: 0,
            total_incidents: 0,
            eventos_detallados: {
                critical: [],
                moderate: [],
                light: []
            },
            por_tipo: {}
        };
    }

    // Normalizar valores numéricos (convertir null/undefined a 0)
    const critical = stability.critical ?? 0;
    const moderate = stability.moderate ?? 0;
    const light = stability.light ?? 0;
    const total_incidents = stability.total_incidents ?? 0;

    // Normalizar eventos detallados (asegurar arrays válidos)
    const eventos_detallados = {
        critical: stability.eventos_detallados?.critical ?? [],
        moderate: stability.eventos_detallados?.moderate ?? [],
        light: stability.eventos_detallados?.light ?? []
    };

    // Normalizar conteo por tipo
    const por_tipo = stability.por_tipo ?? {};

    return {
        critical,
        moderate,
        light,
        total_incidents,
        eventos_detallados,
        por_tipo
    };
}

