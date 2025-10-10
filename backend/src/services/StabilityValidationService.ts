import { EventSeverity } from '../types/enums';
import {
    StabilityMetrics,
    StabilityThresholds,
    StabilityValidation,
    stabilityMetricsSchema
} from '../types/stability';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class StabilityValidationService {
    private thresholds: StabilityThresholds;
    private readonly CACHE_SIZE = 1000; // Tamaño de la caché para validaciones
    private validationCache: Map<string, StabilityValidation>;

    constructor(thresholds: StabilityThresholds) {
        this.thresholds = thresholds;
        this.validationCache = new Map();
    }

    public validateMetrics(metrics: StabilityMetrics): StabilityValidation {
        try {
            // Generar clave de caché
            const cacheKey = this.generateCacheKey(metrics);

            // Verificar caché
            const cachedValidation = this.validationCache.get(cacheKey);
            if (cachedValidation) {
                return cachedValidation;
            }

            // Validar contra el esquema
            stabilityMetricsSchema.parse(metrics);

            const errors: StabilityValidation['errors'] = [];
            const warnings: StabilityValidation['warnings'] = [];

            // Validar LTR
            if (metrics.ltr >= this.thresholds.ltr.critical) {
                errors.push({
                    field: 'ltr',
                    message: 'LTR excede el umbral crítico',
                    value: metrics.ltr,
                    constraint: this.thresholds.ltr.critical
                });
            } else if (metrics.ltr >= this.thresholds.ltr.warning) {
                warnings.push({
                    field: 'ltr',
                    message: 'LTR excede el umbral de advertencia',
                    value: metrics.ltr,
                    threshold: this.thresholds.ltr.warning
                });
            }

            // Validar SSF
            if (metrics.ssf <= this.thresholds.ssf.critical) {
                errors.push({
                    field: 'ssf',
                    message: 'SSF por debajo del umbral crítico',
                    value: metrics.ssf,
                    constraint: this.thresholds.ssf.critical
                });
            } else if (metrics.ssf <= this.thresholds.ssf.warning) {
                warnings.push({
                    field: 'ssf',
                    message: 'SSF por debajo del umbral de advertencia',
                    value: metrics.ssf,
                    threshold: this.thresholds.ssf.warning
                });
            }

            // Validar DRS
            if (metrics.drs >= this.thresholds.drs.critical) {
                errors.push({
                    field: 'drs',
                    message: 'DRS excede el umbral crítico',
                    value: metrics.drs,
                    constraint: this.thresholds.drs.critical
                });
            } else if (metrics.drs >= this.thresholds.drs.warning) {
                warnings.push({
                    field: 'drs',
                    message: 'DRS excede el umbral de advertencia',
                    value: metrics.drs,
                    threshold: this.thresholds.drs.warning
                });
            }

            // Validar ángulo de balanceo
            if (Math.abs(metrics.rollAngle) >= this.thresholds.rollAngle.critical) {
                errors.push({
                    field: 'rollAngle',
                    message: 'Ángulo de balanceo excede el umbral crítico',
                    value: metrics.rollAngle,
                    constraint: this.thresholds.rollAngle.critical
                });
            } else if (Math.abs(metrics.rollAngle) >= this.thresholds.rollAngle.warning) {
                warnings.push({
                    field: 'rollAngle',
                    message: 'Ángulo de balanceo excede el umbral de advertencia',
                    value: metrics.rollAngle,
                    threshold: this.thresholds.rollAngle.warning
                });
            }

            // Validar ángulo de cabeceo
            if (Math.abs(metrics.pitchAngle) >= this.thresholds.pitchAngle.critical) {
                errors.push({
                    field: 'pitchAngle',
                    message: 'Ángulo de cabeceo excede el umbral crítico',
                    value: metrics.pitchAngle,
                    constraint: this.thresholds.pitchAngle.critical
                });
            } else if (Math.abs(metrics.pitchAngle) >= this.thresholds.pitchAngle.warning) {
                warnings.push({
                    field: 'pitchAngle',
                    message: 'Ángulo de cabeceo excede el umbral de advertencia',
                    value: metrics.pitchAngle,
                    threshold: this.thresholds.pitchAngle.warning
                });
            }

            // Validar aceleración lateral
            if (
                Math.abs(metrics.lateralAcceleration) >=
                this.thresholds.lateralAcceleration.critical
            ) {
                errors.push({
                    field: 'lateralAcceleration',
                    message: 'Aceleración lateral excede el umbral crítico',
                    value: metrics.lateralAcceleration,
                    constraint: this.thresholds.lateralAcceleration.critical
                });
            } else if (
                Math.abs(metrics.lateralAcceleration) >= this.thresholds.lateralAcceleration.warning
            ) {
                warnings.push({
                    field: 'lateralAcceleration',
                    message: 'Aceleración lateral excede el umbral de advertencia',
                    value: metrics.lateralAcceleration,
                    threshold: this.thresholds.lateralAcceleration.warning
                });
            }

            // Validar transferencia de carga
            if (Math.abs(metrics.loadTransfer) >= this.thresholds.loadTransfer.critical) {
                errors.push({
                    field: 'loadTransfer',
                    message: 'Transferencia de carga excede el umbral crítico',
                    value: metrics.loadTransfer,
                    constraint: this.thresholds.loadTransfer.critical
                });
            } else if (Math.abs(metrics.loadTransfer) >= this.thresholds.loadTransfer.warning) {
                warnings.push({
                    field: 'loadTransfer',
                    message: 'Transferencia de carga excede el umbral de advertencia',
                    value: metrics.loadTransfer,
                    threshold: this.thresholds.loadTransfer.warning
                });
            }

            const validation: StabilityValidation = {
                isValid: errors.length === 0,
                errors,
                warnings
            };

            // Guardar en caché
            this.updateCache(cacheKey, validation);

            return validation;
        } catch (error) {
            logger.error('Error validando métricas de estabilidad', { error, metrics });
            throw new ApiError(400, 'Error validando métricas de estabilidad');
        }
    }

    public determineSeverity(validation: StabilityValidation): EventSeverity {
        if (validation.errors.length > 0) {
            return EventSeverity.CRITICAL;
        } else if (validation.warnings.length > 0) {
            return EventSeverity.WARNING;
        }
        return EventSeverity.INFO;
    }

    public generateValidationMessage(validation: StabilityValidation): string {
        const messages: string[] = [];

        if (validation.errors.length > 0) {
            messages.push('Errores críticos detectados:');
            validation.errors.forEach((error) => {
                messages.push(`- ${error.message} (${error.field}: ${error.value})`);
            });
        }

        if (validation.warnings.length > 0) {
            messages.push('Advertencias:');
            validation.warnings.forEach((warning) => {
                messages.push(`- ${warning.message} (${warning.field}: ${warning.value})`);
            });
        }

        return messages.join('\n');
    }

    private generateCacheKey(metrics: StabilityMetrics): string {
        return JSON.stringify({
            ltr: metrics.ltr.toFixed(2),
            ssf: metrics.ssf.toFixed(2),
            drs: metrics.drs.toFixed(2),
            rollAngle: metrics.rollAngle.toFixed(2),
            pitchAngle: metrics.pitchAngle.toFixed(2),
            lateralAcceleration: metrics.lateralAcceleration.toFixed(2),
            loadTransfer: metrics.loadTransfer.toFixed(2)
        });
    }

    private updateCache(key: string, validation: StabilityValidation): void {
        // Limpiar caché si excede el tamaño máximo
        if (this.validationCache.size >= this.CACHE_SIZE) {
            const oldestKey = this.validationCache.keys().next().value;
            if (oldestKey) {
                this.validationCache.delete(oldestKey);
            }
        }

        // Agregar nueva validación a la caché
        this.validationCache.set(key, validation);
    }
}
