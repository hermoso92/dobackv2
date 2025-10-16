/**
 * ⚙️ CONFIGURACIÓN DEL SISTEMA DE UPLOAD
 * 
 * Este archivo permite configurar todas las reglas de procesamiento de archivos.
 * Ideal para testing y ajustes sin modificar código.
 */

export interface UploadConfigType {
    /** 📋 Archivos obligatorios para crear sesión */
    requiredFiles: {
        estabilidad: boolean;
        gps: boolean;
        rotativo: boolean;
    };

    /** ⏱️ Duración mínima de sesión (segundos) */
    minSessionDuration: number;

    /** ⏱️ Duración máxima de sesión (segundos, 0 = sin límite) */
    maxSessionDuration: number;

    /** 🚗 Vehículos permitidos ([] = todos) */
    allowedVehicles: string[];

    /** 🔗 Umbral de correlación temporal entre archivos (segundos) */
    correlationThresholdSeconds: number;

    /** ⏸️ Gap temporal para detectar nueva sesión (segundos) */
    sessionGapSeconds: number;

    /** 📊 Mediciones mínimas por sesión */
    minMeasurements: {
        estabilidad: number;
        gps: number;
        rotativo: number;
    };

    /** 🔄 Permitir sesiones sin GPS */
    allowNoGPS: boolean;

    /** 🗑️ Omitir sesiones duplicadas */
    skipDuplicates: boolean;

    /** 📅 Procesar solo fechas específicas ([] = todas) */
    allowedDates: string[]; // Formato: 'YYYY-MM-DD'
}

/**
 * ⚙️ CONFIGURACIÓN POR DEFECTO (PRODUCCIÓN)
 */
export const UPLOAD_CONFIG: UploadConfigType = {
    // Archivos obligatorios (ESTABILIDAD + ROTATIVO)
    requiredFiles: {
        estabilidad: true,
        gps: false,        // ✅ GPS NO obligatorio
        rotativo: true
    },

    // Duración de sesión (PERMISIVO: aceptar sesiones cortas)
    minSessionDuration: 10, // 10 segundos (muy permisivo)
    maxSessionDuration: 0,   // Sin límite

    // Vehículos permitidos
    allowedVehicles: [], // Todos los vehículos

    // Correlación temporal (≤ 5 minutos, más permisivo)
    correlationThresholdSeconds: 300,

    // Gap para nueva sesión (> 5 minutos)
    sessionGapSeconds: 300,

    // Mediciones mínimas
    minMeasurements: {
        estabilidad: 10,
        gps: 0,
        rotativo: 10
    },

    // Configuración GPS
    allowNoGPS: true,

    // Duplicados
    skipDuplicates: true,

    // Fechas
    allowedDates: []
};

/**
 * ⚙️ CONFIGURACIÓN PARA TESTING (GPS OBLIGATORIO)
 * 
 * AJUSTE: Duración mínima 280s (4m 40s) en lugar de 300s (5m)
 * para capturar sesiones "~ 5 min" del análisis real que son 4m 50s
 */
export const UPLOAD_CONFIG_TESTING: UploadConfigType = {
    requiredFiles: {
        estabilidad: true,
        gps: true,         // ✅ GPS OBLIGATORIO para testing
        rotativo: true
    },

    minSessionDuration: 230, // 3m 50s (captura todas las sesiones marcadas como "~ 5 min")
    maxSessionDuration: 0, // Sin límite (permite sesiones muy largas)

    allowedVehicles: [], // Todos los vehículos

    correlationThresholdSeconds: 300, // 5 minutos (GPS con arranque lento)
    sessionGapSeconds: 300,

    minMeasurements: {
        estabilidad: 10,
        gps: 0,
        rotativo: 10
    },

    allowNoGPS: false,
    skipDuplicates: true,
    allowedDates: [] // Todas las fechas
};

/**
 * ⚙️ CONFIGURACIÓN FLEXIBLE (ACEPTAR TODO)
 */
export const UPLOAD_CONFIG_PERMISSIVE: UploadConfigType = {
    requiredFiles: {
        estabilidad: false, // ✅ Nada es obligatorio
        gps: false,
        rotativo: false
    },

    minSessionDuration: 0,  // Sin mínimo
    maxSessionDuration: 0,  // Sin máximo

    allowedVehicles: [],

    correlationThresholdSeconds: 300, // 5 minutos (muy flexible)
    sessionGapSeconds: 600,          // 10 minutos

    minMeasurements: {
        estabilidad: 0,
        gps: 0,
        rotativo: 0
    },

    allowNoGPS: true,
    skipDuplicates: false, // ✅ Permitir duplicados
    allowedDates: []
};

/**
 * 🔧 Función para obtener la configuración activa
 * 
 * Usa variable de entorno UPLOAD_CONFIG_MODE:
 * - 'production' (default)
 * - 'testing'
 * - 'permissive'
 */
export function getUploadConfig(): UploadConfigType {
    const mode = process.env.UPLOAD_CONFIG_MODE || 'production';

    switch (mode) {
        case 'testing':
            return UPLOAD_CONFIG_TESTING;
        case 'permissive':
            return UPLOAD_CONFIG_PERMISSIVE;
        default:
            return UPLOAD_CONFIG;
    }
}

/**
 * 📋 Validar si un vehículo está permitido
 */
export function isVehicleAllowed(vehicleId: string, config: UploadConfigType): boolean {
    if (config.allowedVehicles.length === 0) return true;
    return config.allowedVehicles.includes(vehicleId);
}

/**
 * 📋 Validar si una fecha está permitida
 */
export function isDateAllowed(date: Date, config: UploadConfigType): boolean {
    if (config.allowedDates.length === 0) return true;
    const dateStr = date.toISOString().split('T')[0];
    return config.allowedDates.includes(dateStr);
}

/**
 * 📋 Validar duración de sesión
 */
export function isSessionDurationValid(durationSeconds: number, config: UploadConfigType): boolean {
    if (config.minSessionDuration > 0 && durationSeconds < config.minSessionDuration) {
        return false;
    }
    if (config.maxSessionDuration > 0 && durationSeconds > config.maxSessionDuration) {
        return false;
    }
    return true;
}

