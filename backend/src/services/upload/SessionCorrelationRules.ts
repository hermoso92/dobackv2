/**
 * 📋 REGLAS DE CORRELACIÓN DE SESIONES
 * 
 * Basadas en: resumendoback/Analisis_Sesiones_CMadrid_real.md
 * 
 * Estas reglas definen cómo se detectan, agrupan y validan las sesiones
 * a partir de archivos ESTABILIDAD, GPS y ROTATIVO.
 * 
 * @version 1.0
 * @date 2025-10-12
 */

// ============================================================================
// REGLA 1: UMBRAL DE EMPAREJAMIENTO TEMPORAL
// ============================================================================

/**
 * Umbral máximo de diferencia de tiempo para correlacionar sesiones.
 * 
 * Regla del análisis real:
 * "Emparejamiento por tiempo (solape o |Inicio|≤120s)"
 * 
 * AJUSTE REALIZADO: Aumentado a 300s (5 minutos) para casos donde:
 * - GPS tarda en obtener señal satelital
 * - Sistemas arrancan con desfase temporal
 * - Vehículos de emergencia con arranques rápidos
 * 
 * Dos sesiones de diferentes tipos (ESTABILIDAD, GPS, ROTATIVO) se consideran
 * de la misma sesión operativa si la diferencia entre sus tiempos de inicio
 * es menor o igual a 300 segundos.
 * 
 * Ejemplo:
 * - ESTABILIDAD inicia: 09:33:44
 * - GPS inicia: 09:33:37
 * - Diferencia: 7 segundos ✅ (≤ 300s → MISMA SESIÓN)
 */
export const CORRELATION_TIME_THRESHOLD_SECONDS = 300;

// ============================================================================
// REGLA 2: CRITERIOS DE SESIÓN VÁLIDA
// ============================================================================

/**
 * Define qué hace que una sesión sea considerada válida o completa.
 * 
 * Del análisis real:
 * "Resumen de sesión = ✅ solo si están **los 3 tipos** y ninguna duración es 0s."
 * 
 * IMPORTANTE: GPS puede faltar (es común en túneles, zonas sin cobertura)
 * pero ESTABILIDAD y ROTATIVO son obligatorios.
 */
export const SESSION_VALIDITY_CRITERIA = {
    /**
     * ¿Se requieren los 3 tipos de archivos?
     * true = Idealmente sí, pero GPS puede faltar
     */
    requiresAllThreeTypes: true,

    /**
     * ¿Se permite que falte GPS?
     * true = Sí, muchas sesiones reales no tienen GPS completo
     */
    allowMissingGPS: true,

    /**
     * Duración mínima de sesión en segundos
     * 0 = No se aceptan sesiones con duración 0
     */
    minimumDurationSeconds: 1,

    /**
     * Tipos de archivo obligatorios
     */
    requiredTypes: ['ESTABILIDAD', 'ROTATIVO'] as const,

    /**
     * Tipos de archivo opcionales
     */
    optionalTypes: ['GPS'] as const
};

// ============================================================================
// REGLA 3: DETECCIÓN DE PERÍODOS OPERATIVOS
// ============================================================================

/**
 * Reglas para detectar cuándo comienza y termina una sesión dentro de un archivo.
 * 
 * Las sesiones se detectan por "gaps" o brechas temporales en los datos.
 * Si hay más de X segundos sin datos, se considera que la sesión terminó
 * y la siguiente medición inicia una nueva sesión.
 */
export const OPERATIONAL_PERIOD_RULES = {
    /**
     * Gap temporal para considerar nueva sesión (en segundos)
     * 
     * Si entre dos mediciones pasan más de 5 minutos (300s),
     * se considera que son de sesiones diferentes.
     * 
     * Ejemplo:
     * - Medición 1: 10:38:20
     * - Medición 2: 12:41:48
     * - Gap: 2h 3m 28s (> 300s) → NUEVA SESIÓN ✅
     */
    gapThresholdSeconds: 300,

    /**
     * Número mínimo de mediciones para considerar una sesión válida
     * 
     * 1 = Se acepta aunque solo haya 1 medición
     * (Puede haber sesiones muy cortas en pruebas o arranques)
     */
    minimumMeasurements: 1,

    /**
     * ¿Ignorar mediciones con timestamp inválido?
     * true = Sí, saltar mediciones con fecha/hora malformada
     */
    skipInvalidTimestamps: true
};

// ============================================================================
// REGLA 4: PRIORIDAD DE TIMESTAMPS
// ============================================================================

/**
 * Orden de prioridad para determinar el timestamp oficial de una sesión
 * cuando hay múltiples archivos correlacionados.
 * 
 * El análisis real muestra que:
 * - ESTABILIDAD suele ser la fuente más confiable de timestamps
 * - GPS puede tener gaps pero cuando existe es muy preciso
 * - ROTATIVO suele estar sincronizado con ESTABILIDAD
 * 
 * Para determinar startTime de sesión:
 * 1. Usar el timestamp MÁS TEMPRANO de los 3 tipos disponibles
 * 
 * Para determinar endTime de sesión:
 * 1. Usar el timestamp MÁS TARDÍO de los 3 tipos disponibles
 */
export const TIMESTAMP_PRIORITY = ['ESTABILIDAD', 'GPS', 'ROTATIVO'] as const;

/**
 * Estrategia para calcular tiempo de inicio de sesión correlacionada
 */
export const START_TIME_STRATEGY = 'EARLIEST' as const; // El más temprano

/**
 * Estrategia para calcular tiempo de fin de sesión correlacionada
 */
export const END_TIME_STRATEGY = 'LATEST' as const; // El más tardío

// ============================================================================
// REGLA 5: NUMERACIÓN DE SESIONES
// ============================================================================

/**
 * Reglas para asignar números de sesión.
 * 
 * Del análisis real, las sesiones se numeran secuencialmente por día:
 * - 30/09/2025: Sesión 1, Sesión 2
 * - 01/10/2025: Sesión 1, Sesión 2, ..., Sesión 7
 * 
 * IMPORTANTE: La numeración reinicia cada día.
 */
export const SESSION_NUMBERING_RULES = {
    /**
     * ¿Reiniciar numeración cada día?
     * true = Cada día comienza en Sesión 1
     */
    resetDailyNumbers: true,

    /**
     * Índice inicial de numeración
     * 1 = Sesiones empiezan en 1 (no en 0)
     */
    startIndex: 1,

    /**
     * ¿Numerar solo sesiones válidas?
     * false = Numerar todas, incluso las incompletas
     */
    onlyValidSessions: false
};

// ============================================================================
// REGLA 6: VALIDACIÓN DE GPS
// ============================================================================

/**
 * Reglas específicas para validar datos GPS.
 * 
 * Del análisis real, muchas sesiones tienen "❌ GPS: sin registro"
 * o GPS con cobertura parcial. Esto es normal y aceptable.
 */
export const GPS_VALIDATION_RULES = {
    /**
     * ¿Rechazar sesión si no hay GPS?
     * false = Aceptar sesiones sin GPS (es común)
     */
    rejectMissingGPS: false,

    /**
     * ¿Interpolar GPS cuando faltan puntos?
     * true = Sí, usar interpolación lineal
     */
    interpolateWhenMissing: true,

    /**
     * Coordenadas inválidas a rechazar
     */
    invalidCoordinates: {
        /** Rechazar (0, 0) */
        rejectZeroZero: true,

        /** Rango válido global */
        validLatitudeRange: [-90, 90] as const,
        validLongitudeRange: [-180, 180] as const,

        /** Rango España (warning si está fuera pero no rechazar) */
        spainLatitudeRange: [36, 44] as const,
        spainLongitudeRange: [-10, 5] as const
    },

    /**
     * Umbral para detectar saltos GPS anormales (en metros)
     * 
     * Si entre dos puntos consecutivos hay más de 1km,
     * se considera un salto sospechoso (posible error de GPS)
     */
    maxJumpDistanceMeters: 1000
};

// ============================================================================
// REGLA 7: MANEJO DE CASOS ESPECIALES
// ============================================================================

/**
 * Situaciones especiales encontradas en el análisis real.
 */
export const SPECIAL_CASES = {
    /**
     * Sesiones muy cortas (< 2 minutos)
     * Suelen ser arranques/pruebas pero son válidas
     */
    acceptShortSessions: true,
    minShortSessionDuration: 10, // segundos

    /**
     * Archivos con múltiples sesiones
     * Es normal que un archivo contenga varias sesiones del día
     */
    multipleSessionsPerFile: true,

    /**
     * Sesiones nocturnas (00:00 - 06:00)
     * Son válidas, algunos vehículos operan de madrugada
     */
    acceptNocturnalSessions: true,

    /**
     * GPS sin señal durante toda la sesión
     * Aceptar pero marcar con observación "sin gps"
     */
    acceptNoGPSSessions: true
};

// ============================================================================
// REGLA 8: METADATA Y LOGGING
// ============================================================================

/**
 * Información a registrar sobre cada sesión procesada.
 */
export const SESSION_METADATA = {
    /**
     * Campos obligatorios en cada sesión
     */
    requiredFields: [
        'sessionNumber',
        'vehicleId',
        'startTime',
        'endTime',
        'source' // ESTABILIDAD, GPS, ROTATIVO o CORRELACIONADA
    ] as const,

    /**
     * Observaciones a añadir según el caso
     */
    observations: {
        noGPS: 'sin gps',
        shortSession: 'sesión corta',
        gpsInterpolated: 'gps interpolado',
        partialData: 'datos parciales'
    }
};

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Configuración completa de reglas de correlación
 */
export const CORRELATION_CONFIG = {
    correlation: {
        timeThresholdSeconds: CORRELATION_TIME_THRESHOLD_SECONDS
    },
    validity: SESSION_VALIDITY_CRITERIA,
    detection: OPERATIONAL_PERIOD_RULES,
    timestamps: {
        priority: TIMESTAMP_PRIORITY,
        startStrategy: START_TIME_STRATEGY,
        endStrategy: END_TIME_STRATEGY
    },
    numbering: SESSION_NUMBERING_RULES,
    gps: GPS_VALIDATION_RULES,
    special: SPECIAL_CASES,
    metadata: SESSION_METADATA
} as const;

export type CorrelationConfig = typeof CORRELATION_CONFIG;

