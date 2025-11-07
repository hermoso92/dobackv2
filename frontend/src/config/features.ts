/**
 * 🎚️ FEATURE FLAGS - DOBACKSOFT
 * 
 * Sistema de feature flags para controlar funcionalidades
 * según entorno y permisos de usuario.
 * 
 * @version 1.0
 * @date 2025-10-22
 */

export interface FeatureFlags {
    // Funcionalidades peligrosas (solo testing)
    allowDatabaseCleanup: boolean;
    allowMassDelete: boolean;
    showDebugInfo: boolean;

    // Funcionalidades experimentales
    enableAutoReprocessing: boolean;
    enableAdvancedMetrics: boolean;
    enableParserV2: boolean;

    // Límites y configuración
    uploadTimeoutMs: number;
    maxFilesPerUpload: number;
    processingRateLimitMs: number;
}

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production';
const isTesting = process.env.NODE_ENV === 'test' || process.env.VITE_ENV === 'test';
const isDevelopment = process.env.NODE_ENV === 'development' || !isProduction;

/**
 * Configuración de features por entorno
 */
export const FEATURE_FLAGS: FeatureFlags = {
    // 🔴 PELIGROSAS - Solo en testing/development
    allowDatabaseCleanup: isTesting || isDevelopment,
    allowMassDelete: isTesting,
    showDebugInfo: isDevelopment,

    // 🟡 EXPERIMENTALES - Activar gradualmente
    enableAutoReprocessing: true,
    enableAdvancedMetrics: true,
    enableParserV2: true, // ✅ Parser con corrección 100x

    // ⚙️ CONFIGURACIÓN
    uploadTimeoutMs: isProduction ? 300000 : 600000, // 5 min prod, 10 min dev
    maxFilesPerUpload: isProduction ? 1000 : 10000, // Límite de archivos
    processingRateLimitMs: isProduction ? (10 * 60 * 1000) : (30 * 1000) // 10 min prod, 30 seg dev
};

/**
 * Verifica si una feature está habilitada para el usuario actual
 */
export function isFeatureEnabled(
    feature: keyof FeatureFlags,
    userRole?: string
): boolean {
    const flagValue = FEATURE_FLAGS[feature];

    // Para features booleanas
    if (typeof flagValue === 'boolean') {
        // Features peligrosas requieren rol ADMIN
        if (['allowDatabaseCleanup', 'allowMassDelete'].includes(feature)) {
            return flagValue && userRole === 'ADMIN';
        }
        return flagValue;
    }

    return true;
}

/**
 * Obtiene el valor de configuración de una feature
 */
export function getFeatureValue<K extends keyof FeatureFlags>(
    feature: K
): FeatureFlags[K] {
    return FEATURE_FLAGS[feature];
}

/**
 * Log de feature flags para debugging
 */
export function logFeatureFlags(): void {
    if (FEATURE_FLAGS.showDebugInfo) {
        console.table({
            'Entorno': process.env.NODE_ENV,
            'Limpieza BD': FEATURE_FLAGS.allowDatabaseCleanup,
            'Mass Delete': FEATURE_FLAGS.allowMassDelete,
            'Debug Info': FEATURE_FLAGS.showDebugInfo,
            'Parser V2': FEATURE_FLAGS.enableParserV2,
            'Upload Timeout': `${FEATURE_FLAGS.uploadTimeoutMs / 1000}s`,
            'Rate Limit': `${FEATURE_FLAGS.processingRateLimitMs / 60000} min`
        });
    }
}

