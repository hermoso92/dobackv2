/**
 * Detector Avanzado de Eventos de Estabilidad
 * 
 * Mejoras vs IncliSafe V1:
 * - Eventos adaptativos según contexto (velocidad, ubicación)
 * - Confianza calculada (0-1) para cada evento
 * - Detección multi-criterio (no umbrales fijos)
 * - Recomendaciones accionables
 * - Prevención de falsos positivos
 */

import { createLogger } from '../utils/logger';
import { ImprovedStabilityMetrics, VehiclePhysicalConfig } from './ImprovedStabilityCalculator';

const logger = createLogger('AdvancedEventDetector');

export type EventType =
    | 'vuelco_inminente'
    | 'transferencia_carga_critica'
    | 'suspension_asimetrica'
    | 'rebote_severo'
    | 'deriva_controlada'
    | 'frenada_emergencia'
    | 'aceleracion_brusca'
    | 'curva_peligrosa';

export type EventSeverity = 'leve' | 'moderado' | 'grave' | 'critico';

export interface DetectedEvent {
    type: EventType;
    severity: EventSeverity;
    confidence: number;        // 0-1 (confianza en la detección)
    timestamp: Date;
    location?: {
        latitude: number;
        longitude: number;
    };
    metrics: {
        si: number;
        ltrReal: number;
        drs: number;
        rolloverRisk: number;
        velocidad: number;
    };
    conditions: string[];      // Condiciones que se cumplieron
    recommendation: string;    // Recomendación accionable
    priority: number;          // 1-5 (para ordenar alertas)
}

export class AdvancedEventDetector {
    
    /**
     * Detecta vuelco inminente
     * Requiere múltiples condiciones simultáneas para alta confianza
     */
    detectVuelcoInminente(
        metrics: ImprovedStabilityMetrics,
        speedKmh: number,
        location?: { latitude: number; longitude: number }
    ): DetectedEvent | null {
        
        const conditions: { name: string; met: boolean }[] = [
            { name: 'LTR real > 0.80', met: Math.abs(metrics.ltrReal) > 0.80 },
            { name: 'Roll > 15°', met: Math.abs(metrics.rollAngle) > 15 },
            { name: 'Velocidad > 40 km/h', met: speedKmh > 40 },
            { name: 'Suspensión asimétrica > 70%', met: metrics.loadDistribution.asymmetry > 0.70 },
            { name: 'Riesgo vuelco > 0.75', met: metrics.rolloverRisk > 0.75 }
        ];
        
        const conditionsMet = conditions.filter(c => c.met);
        const totalConditions = conditions.length;
        
        // Requiere al menos 3 de 5 condiciones
        if (conditionsMet.length < 3) {
            return null;
        }
        
        // Confianza proporcional a condiciones cumplidas
        const confidence = conditionsMet.length / totalConditions;
        
        // Severidad basada en cuántas condiciones críticas se cumplen
        let severity: EventSeverity;
        if (conditionsMet.length >= 4) {
            severity = 'critico';
        } else if (conditionsMet.length >= 3) {
            severity = 'grave';
        } else {
            severity = 'moderado';
        }
        
        return {
            type: 'vuelco_inminente',
            severity,
            confidence,
            timestamp: metrics.timestamp,
            location,
            metrics: {
                si: metrics.siImproved,
                ltrReal: metrics.ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: speedKmh
            },
            conditions: conditionsMet.map(c => c.name),
            recommendation: severity === 'critico'
                ? 'REDUCIR VELOCIDAD INMEDIATAMENTE. Riesgo de vuelco crítico.'
                : 'Reducir velocidad y corregir trayectoria. Transferencia de carga excesiva.',
            priority: 5
        };
    }
    
    /**
     * Detecta transferencia de carga crítica
     */
    private detectTransferenciaCarga(
        metrics: ImprovedStabilityMetrics,
        speedKmh: number
    ): DetectedEvent | null {
        
        const { loadTransfer, loadDistribution, ltrReal } = metrics;
        
        const conditions: { name: string; met: boolean }[] = [
            { name: 'Load transfer > 0.60', met: loadTransfer > 0.60 },
            { name: 'Asimetría > 0.50', met: loadDistribution.asymmetry > 0.50 },
            { name: 'LTR real > 0.65', met: Math.abs(ltrReal) > 0.65 },
            { name: 'Velocidad > 30 km/h', met: speedKmh > 30 }
        ];
        
        const conditionsMet = conditions.filter(c => c.met);
        
        if (conditionsMet.length < 2) {
            return null;
        }
        
        const confidence = conditionsMet.length / conditions.length;
        
        return {
            type: 'transferencia_carga_critica',
            severity: conditionsMet.length >= 3 ? 'grave' : 'moderado',
            confidence,
            timestamp: metrics.timestamp,
            metrics: {
                si: metrics.siImproved,
                ltrReal: metrics.ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: speedKmh
            },
            conditions: conditionsMet.map(c => c.name),
            recommendation: 'Evitar maniobras bruscas. Redistribución de carga en curso.',
            priority: 4
        };
    }
    
    /**
     * Detecta suspensión asimétrica (posible fallo mecánico)
     */
    private detectSuspensionAsimetrica(
        metrics: ImprovedStabilityMetrics
    ): DetectedEvent | null {
        
        const { loadDistribution } = metrics;
        
        // Verificar asimetría extrema
        if (loadDistribution.asymmetry < 0.70) {
            return null;
        }
        
        // Verificar ratio frente-atrás anómalo
        const ratioAnomalo = loadDistribution.frontRearRatio < 0.5 || loadDistribution.frontRearRatio > 2.0;
        
        const conditions: string[] = [
            `Asimetría: ${(loadDistribution.asymmetry * 100).toFixed(1)}%`
        ];
        
        if (ratioAnomalo) {
            conditions.push(`Ratio frente/atrás anómalo: ${loadDistribution.frontRearRatio.toFixed(2)}`);
        }
        
        return {
            type: 'suspension_asimetrica',
            severity: loadDistribution.asymmetry > 0.85 ? 'critico' : 'grave',
            confidence: loadDistribution.asymmetry, // Directamente proporcional
            timestamp: metrics.timestamp,
            metrics: {
                si: metrics.siImproved,
                ltrReal: metrics.ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: 0
            },
            conditions,
            recommendation: 'REVISAR SUSPENSIÓN URGENTEMENTE. Distribución de carga anómala detectada.',
            priority: ratioAnomalo ? 5 : 3
        };
    }
    
    /**
     * Detecta rebote severo (bache, impacto)
     */
    private detectReboteSevero(
        measurement: any, // StabilityMeasurement sin import circular
        metrics: ImprovedStabilityMetrics
    ): DetectedEvent | null {
        
        const { totalAccG, verticalAccG } = metrics;
        
        // Umbral: aceleración vertical > 1.5g o total > 2.0g
        const conditions: { name: string; met: boolean }[] = [
            { name: 'Acc vertical > 1.5g', met: Math.abs(verticalAccG) > 1.5 },
            { name: 'Acc total > 2.0g', met: totalAccG > 2.0 },
            { name: 'Giroscopio alto', met: Math.abs(measurement.gx) > 500 || Math.abs(measurement.gy) > 500 }
        ];
        
        const conditionsMet = conditions.filter(c => c.met);
        
        if (conditionsMet.length < 1) {
            return null;
        }
        
        const confidence = conditionsMet.length / conditions.length;
        
        return {
            type: 'rebote_severo',
            severity: totalAccG > 3.0 ? 'grave' : 'moderado',
            confidence,
            timestamp: metrics.timestamp,
            metrics: {
                si: metrics.siImproved,
                ltrReal: metrics.ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: 0
            },
            conditions: conditionsMet.map(c => c.name),
            recommendation: 'Impacto detectado. Revisar integridad estructural si se repite.',
            priority: 2
        };
    }
    
    /**
     * Detecta deriva controlada (maniobra segura vs peligrosa)
     */
    private detectDerivaControlada(
        measurement: any,
        metrics: ImprovedStabilityMetrics,
        speedKmh: number
    ): DetectedEvent | null {
        
        const yawRate = Math.abs(measurement.gz); // °/s
        const { siImproved, ltrReal } = metrics;
        
        // Deriva = yaw rate alto
        if (yawRate < 30) { // °/s
            return null;
        }
        
        // Deriva CONTROLADA si SI es alto (> 0.85)
        // Deriva PELIGROSA si SI es bajo (< 0.85)
        const esControlada = siImproved > 0.85;
        
        if (esControlada) {
            // No reportar deriva controlada (es maniobra normal)
            return null;
        }
        
        // Deriva peligrosa
        return {
            type: 'curva_peligrosa',
            severity: siImproved < 0.75 ? 'grave' : 'moderado',
            confidence: 1 - siImproved, // Menor SI = mayor confianza de peligro
            timestamp: metrics.timestamp,
            metrics: {
                si: siImproved,
                ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: speedKmh
            },
            conditions: [
                `Yaw rate: ${yawRate.toFixed(1)}°/s`,
                `SI bajo: ${siImproved.toFixed(3)}`,
                `Velocidad: ${speedKmh.toFixed(1)} km/h`
            ],
            recommendation: 'Reducir velocidad en curva. Estabilidad comprometida.',
            priority: siImproved < 0.75 ? 4 : 3
        };
    }
    
    /**
     * Detecta frenada de emergencia
     */
    private detectFrenadaEmergencia(
        metrics: ImprovedStabilityMetrics,
        speedKmh: number,
        prevSpeedKmh?: number
    ): DetectedEvent | null {
        
        const { longitudinalAccG } = metrics;
        
        // Desaceleración > 0.7g (frenada fuerte)
        if (longitudinalAccG > -0.7) {
            return null;
        }
        
        // Verificar cambio de velocidad si disponible
        let deltaV = 0;
        if (prevSpeedKmh !== undefined) {
            deltaV = prevSpeedKmh - speedKmh;
        }
        
        const conditions: string[] = [
            `Desaceleración: ${Math.abs(longitudinalAccG).toFixed(2)}g`
        ];
        
        if (deltaV > 20) {
            conditions.push(`ΔV: -${deltaV.toFixed(1)} km/h`);
        }
        
        return {
            type: 'frenada_emergencia',
            severity: Math.abs(longitudinalAccG) > 1.0 ? 'grave' : 'moderado',
            confidence: Math.min(Math.abs(longitudinalAccG) / 1.2, 1.0),
            timestamp: metrics.timestamp,
            metrics: {
                si: metrics.siImproved,
                ltrReal: metrics.ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: speedKmh
            },
            conditions,
            recommendation: 'Frenada de emergencia detectada. Verificar sistema de frenos.',
            priority: 3
        };
    }
    
    /**
     * Detecta aceleración brusca
     */
    private detectAceleracionBrusca(
        metrics: ImprovedStabilityMetrics
    ): DetectedEvent | null {
        
        const { longitudinalAccG } = metrics;
        
        // Aceleración > 0.6g
        if (longitudinalAccG < 0.6) {
            return null;
        }
        
        return {
            type: 'aceleracion_brusca',
            severity: longitudinalAccG > 0.8 ? 'moderado' : 'leve',
            confidence: Math.min(longitudinalAccG / 1.0, 1.0),
            timestamp: metrics.timestamp,
            metrics: {
                si: metrics.siImproved,
                ltrReal: metrics.ltrReal,
                drs: metrics.drs,
                rolloverRisk: metrics.rolloverRisk,
                velocidad: 0
            },
            conditions: [`Aceleración: ${longitudinalAccG.toFixed(2)}g`],
            recommendation: 'Aceleración brusca. Considerar estilo de conducción.',
            priority: 1
        };
    }
    
    /**
     * Detecta todos los eventos en un punto de medición
     */
    detectAllEvents(
        measurement: any, // StabilityMeasurement
        metrics: ImprovedStabilityMetrics,
        speedKmh: number,
        prevSpeedKmh?: number,
        location?: { latitude: number; longitude: number }
    ): DetectedEvent[] {
        
        const events: DetectedEvent[] = [];
        
        // Detectar cada tipo de evento
        const vuelco = this.detectVuelcoInminente(metrics, speedKmh, location);
        if (vuelco) events.push(vuelco);
        
        const transferencia = this.detectTransferenciaCarga(metrics, speedKmh);
        if (transferencia) events.push(transferencia);
        
        const suspension = this.detectSuspensionAsimetrica(metrics);
        if (suspension) events.push(suspension);
        
        const rebote = this.detectReboteSevero(measurement, metrics);
        if (rebote) events.push(rebote);
        
        const deriva = this.detectDerivaControlada(measurement, metrics, speedKmh);
        if (deriva) events.push(deriva);
        
        const frenada = this.detectFrenadaEmergencia(metrics, speedKmh, prevSpeedKmh);
        if (frenada) events.push(frenada);
        
        const aceleracion = this.detectAceleracionBrusca(metrics);
        if (aceleracion) events.push(aceleracion);
        
        // Ordenar por prioridad
        events.sort((a, b) => b.priority - a.priority);
        
        // Log solo eventos graves o críticos
        events.filter(e => e.severity === 'grave' || e.severity === 'critico').forEach(e => {
            logger.warn(`Evento ${e.type} [${e.severity}] detectado con confianza ${(e.confidence * 100).toFixed(0)}%`, {
                conditions: e.conditions,
                recommendation: e.recommendation
            });
        });
        
        return events;
    }
    
    /**
     * Agrupa eventos por proximidad temporal
     * Previene duplicados de un mismo evento prolongado
     */
    deduplicateEvents(
        events: DetectedEvent[],
        timeWindowSeconds: number = 5
    ): DetectedEvent[] {
        
        if (events.length === 0) return [];
        
        const deduplicated: DetectedEvent[] = [];
        let lastEventByType = new Map<EventType, DetectedEvent>();
        
        for (const event of events) {
            const lastEvent = lastEventByType.get(event.type);
            
            if (!lastEvent) {
                // Primer evento de este tipo
                deduplicated.push(event);
                lastEventByType.set(event.type, event);
                continue;
            }
            
            // Verificar si está dentro de ventana temporal
            const timeDiffSeconds = (event.timestamp.getTime() - lastEvent.timestamp.getTime()) / 1000;
            
            if (timeDiffSeconds > timeWindowSeconds) {
                // Nuevo evento (fuera de ventana)
                deduplicated.push(event);
                lastEventByType.set(event.type, event);
            } else {
                // Mismo evento continuando (actualizar si es más severo)
                if (event.priority > lastEvent.priority || event.confidence > lastEvent.confidence) {
                    // Reemplazar con versión más severa
                    const index = deduplicated.findIndex(e => e === lastEvent);
                    if (index !== -1) {
                        deduplicated[index] = event;
                    }
                    lastEventByType.set(event.type, event);
                }
            }
        }
        
        return deduplicated;
    }
    
    /**
     * Calcula estadísticas de eventos para una sesión
     */
    calculateEventStatistics(events: DetectedEvent[]): {
        total: number;
        porSeveridad: Record<EventSeverity, number>;
        porTipo: Record<EventType, number>;
        confianzaPromedio: number;
        eventoCritico: DetectedEvent | null;
    } {
        
        const porSeveridad: Record<EventSeverity, number> = {
            leve: 0,
            moderado: 0,
            grave: 0,
            critico: 0
        };
        
        const porTipo: Partial<Record<EventType, number>> = {};
        
        events.forEach(event => {
            porSeveridad[event.severity]++;
            porTipo[event.type] = (porTipo[event.type] || 0) + 1;
        });
        
        const confianzaPromedio = events.length > 0
            ? events.reduce((sum, e) => sum + e.confidence, 0) / events.length
            : 0;
        
        // Encontrar evento más crítico
        const eventoCritico = events.length > 0
            ? events.reduce((max, e) => e.priority > max.priority ? e : max)
            : null;
        
        return {
            total: events.length,
            porSeveridad,
            porTipo: porTipo as Record<EventType, number>,
            confianzaPromedio,
            eventoCritico
        };
    }
}

// Exportar instancia singleton
export const advancedEventDetector = new AdvancedEventDetector();



