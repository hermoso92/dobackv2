/**
 * 🎨 TIPOS Y CONFIGURACIÓN DE SEVERIDADES
 * 
 * Propuesta: ChatGPT Auditoría DobackSoft (P3-11)
 * 
 * PROBLEMA IDENTIFICADO:
 * Mezcla de 'GRAVE', 'grave', 'gravE' en diferentes partes del sistema.
 * 
 * SOLUCIÓN:
 * Enum centralizado con configuración única de colores y umbrales.
 */

/**
 * Enum de severidades (valores únicos permitidos)
 */
export enum Severity {
  LEVE = 'LEVE',
  MODERADA = 'MODERADA',
  GRAVE = 'GRAVE'
}

/**
 * Configuración de severidades
 * - color: Código hexadecimal para UI
 * - threshold: Umbral de SI para esta severidad
 * - label: Etiqueta para mostrar
 * - priority: Prioridad numérica (mayor = más grave)
 */
export const SEVERITY_CONFIG = {
  [Severity.LEVE]: {
    color: '#FCD34D',      // Amarillo
    bgColor: '#FEF3C7',
    threshold: 0.50,
    label: 'Leve',
    priority: 1,
    icon: '🟡'
  },
  [Severity.MODERADA]: {
    color: '#FB923C',      // Naranja
    bgColor: '#FED7AA',
    threshold: 0.35,
    label: 'Moderada',
    priority: 2,
    icon: '🟠'
  },
  [Severity.GRAVE]: {
    color: '#EF4444',      // Rojo
    bgColor: '#FEE2E2',
    threshold: 0.20,
    label: 'Grave',
    priority: 3,
    icon: '🔴'
  }
} as const;

/**
 * Helper: Obtener configuración de severidad
 */
export const getSeverityConfig = (severity: Severity | string) => {
  const normalizedSeverity = (severity?.toUpperCase() as Severity) || Severity.LEVE;
  return SEVERITY_CONFIG[normalizedSeverity] || SEVERITY_CONFIG[Severity.LEVE];
};

/**
 * Helper: Clasificar severidad por SI
 */
export const clasificarSeveridadPorSI = (si: number): Severity | null => {
  if (si >= 0.50) return null; // Sin evento
  if (si < 0.20) return Severity.GRAVE;
  if (si < 0.35) return Severity.MODERADA;
  return Severity.LEVE;
};

/**
 * Helper: Validar que un string es una severidad válida
 */
export const isSeverity = (value: string): value is Severity => {
  return Object.values(Severity).includes(value as Severity);
};

/**
 * Helper: Normalizar severidad (convertir variaciones a enum)
 */
export const normalizeSeverity = (severity: string | null | undefined): Severity | null => {
  if (!severity) return null;
  
  const upper = severity.toUpperCase();
  
  if (upper === 'LEVE' || upper === 'LEVE') return Severity.LEVE;
  if (upper === 'MODERADA' || upper === 'MODERADO') return Severity.MODERADA;
  if (upper === 'GRAVE' || upper === 'CRÍTICA' || upper === 'CRITICA') return Severity.GRAVE;
  
  logger.warn('⚠️ Severidad desconocida, usando LEVE por defecto', { severity });
  return Severity.LEVE;
};

