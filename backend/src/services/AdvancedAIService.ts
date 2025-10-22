
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { AICacheService } from './AICacheService';



interface AIExplanation {
    id: string;
    orgId: string;
    module: string;
    context: string;
    explanation: string;
    confidence: number;
    references: string[];
    suggestions: string[];
    createdAt: string;
    expiresAt: string;
    metadata: {
        model: string;
        version: string;
        processingTime: number;
        tokensUsed: number;
        contextSize: number;
        dataPoints: number;
        analysisDepth: string;
        language: string;
    };
}

interface AdvancedAnalysis {
    explanation: AIExplanation;
    insights: any[];
    recommendations: any[];
    patterns: any[];
    statistics: any;
    riskAssessment: {
        overallRisk: 'low' | 'medium' | 'high' | 'critical';
        riskFactors: string[];
        mitigationStrategies: string[];
    };
}

export class AdvancedAIService {
    /**
     * Genera explicaciones avanzadas basadas en datos reales
     */
    async generateAdvancedExplanation(
        organizationId: string,
        module: string,
        context: string,
        analysisType: string = 'comprehensive',
        depth: string = 'medium',
        language: string = 'es'
    ): Promise<AdvancedAnalysis> {
        try {
            logger.info('Generando explicación avanzada de IA', {
                organizationId,
                module,
                context,
                analysisType,
                depth
            });

            // Verificar caché
            const cacheKey = { module, context, analysisType, depth, language };
            const cachedData = await AICacheService.getFromCache(organizationId, 'advanced_explanation', cacheKey);
            if (cachedData) {
                logger.info('Retornando explicación avanzada desde caché', { organizationId });
                return cachedData;
            }

            const startTime = Date.now();

            // Obtener datos según el módulo
            let analysisData;
            switch (module) {
                case 'stability':
                    analysisData = await this.getStabilityAnalysisData(organizationId);
                    break;
                case 'telemetry':
                    analysisData = await this.getTelemetryAnalysisData(organizationId);
                    break;
                case 'performance':
                    analysisData = await this.getPerformanceAnalysisData(organizationId);
                    break;
                case 'emergency':
                    analysisData = await this.getEmergencyAnalysisData(organizationId);
                    break;
                default:
                    analysisData = await this.getGeneralAnalysisData(organizationId);
            }

            // Generar análisis avanzado
            const analysis = await this.performAdvancedAnalysis(
                analysisData,
                module,
                context,
                analysisType,
                depth,
                language
            );

            // Calcular tiempo de procesamiento
            const processingTime = Date.now() - startTime;

            // Crear explicación
            const explanation: AIExplanation = {
                id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                orgId: organizationId,
                module,
                context,
                explanation: analysis.explanation,
                confidence: analysis.confidence,
                references: analysis.references,
                suggestions: analysis.suggestions,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
                metadata: {
                    model: 'doback-ai-v2',
                    version: '2.0.0',
                    processingTime,
                    tokensUsed: Math.floor(analysis.explanation.length / 4), // Estimación
                    contextSize: analysisData.dataPoints,
                    dataPoints: analysisData.dataPoints,
                    analysisDepth: depth,
                    language
                }
            };

            const result: AdvancedAnalysis = {
                explanation,
                insights: analysis.insights,
                recommendations: analysis.recommendations,
                patterns: analysis.patterns,
                statistics: analysisData.statistics,
                riskAssessment: analysis.riskAssessment
            };

            // Guardar en caché
            await AICacheService.saveToCache(organizationId, 'advanced_explanation', cacheKey, result);

            logger.info('Explicación avanzada generada exitosamente', {
                organizationId,
                processingTime,
                dataPoints: analysisData.dataPoints
            });

            return result;

        } catch (error) {
            logger.error('Error generando explicación avanzada', { error, organizationId, module });
            throw error;
        }
    }

    /**
     * Obtiene datos de análisis de estabilidad
     */
    private async getStabilityAnalysisData(organizationId: string) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Últimos 30 días

        const [sessions, events, measurements] = await Promise.all([
            prisma.session.findMany({
                where: {
                    organizationId,
                    startTime: { gte: startDate }
                },
                include: {
                    vehicle: true,
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            stability_events: true
                        }
                    }
                }
            }),
            prisma.stability_events.findMany({
                where: {
                    Session: {
                        organizationId
                    },
                    timestamp: { gte: startDate }
                },
                include: {
                    Session: {
                        include: {
                            vehicle: true
                        }
                    }
                }
            }),
            prisma.stabilityMeasurement.findMany({
                where: {
                    Session: {
                        organizationId,
                        startTime: { gte: startDate }
                    }
                },
                select: {
                    timestamp: true,
                    lateralAcceleration: true,
                    longitudinalAcceleration: true,
                    rollAngle: true,
                    isLTRCritical: true,
                    isDRSHigh: true,
                    isLateralGForceHigh: true
                }
            })
        ]);

        // Calcular estadísticas
        const totalSessions = sessions.length;
        const totalEvents = events.length;
        const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
        const eventsByType = events.reduce((acc: any, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {});

        const eventsBySeverity = events.reduce((acc: any, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {});

        // Análisis de mediciones críticas
        const criticalMeasurements = measurements.filter(m =>
            m.isLTRCritical || m.isDRSHigh || m.isLateralGForceHigh
        ).length;

        return {
            sessions,
            events,
            measurements,
            statistics: {
                totalSessions,
                totalEvents,
                criticalEvents,
                eventsByType,
                eventsBySeverity,
                criticalMeasurements,
                totalMeasurements: measurements.length,
                avgEventsPerSession: totalSessions > 0 ? totalEvents / totalSessions : 0,
                criticalEventRate: totalEvents > 0 ? criticalEvents / totalEvents : 0
            },
            dataPoints: totalEvents + measurements.length
        };
    }

    /**
     * Obtiene datos de análisis de telemetría
     */
    private async getTelemetryAnalysisData(organizationId: string) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const [sessions, gpsMeasurements, canMeasurements] = await Promise.all([
            prisma.session.findMany({
                where: {
                    organizationId,
                    startTime: { gte: startDate }
                },
                include: {
                    vehicle: true,
                    _count: {
                        select: {
                            gpsMeasurements: true,
                            canMeasurements: true
                        }
                    }
                }
            }),
            prisma.gpsMeasurement.findMany({
                where: {
                    Session: {
                        organizationId,
                        startTime: { gte: startDate }
                    }
                },
                select: {
                    timestamp: true,
                    speed: true,
                    latitude: true,
                    longitude: true,
                    heading: true
                }
            }),
            prisma.canMeasurement.findMany({
                where: {
                    Session: {
                        organizationId,
                        startTime: { gte: startDate }
                    }
                },
                select: {
                    timestamp: true,
                    engineRpm: true,
                    vehicleSpeed: true,
                    throttlePosition: true,
                    brakePedal: true
                }
            })
        ]);

        // Análisis de velocidad
        const speedViolations = gpsMeasurements.filter(m => (m.speed || 0) > 80).length;
        const avgSpeed = gpsMeasurements.reduce((sum, m) => sum + (m.speed || 0), 0) / gpsMeasurements.length;

        // Análisis de comportamiento de conducción
        const aggressiveBraking = canMeasurements.filter(m => (m.brakePedal || 0) > 80).length;
        const highThrottle = canMeasurements.filter(m => (m.throttlePosition || 0) > 90).length;

        return {
            sessions,
            gpsMeasurements,
            canMeasurements,
            statistics: {
                totalSessions: sessions.length,
                totalGpsMeasurements: gpsMeasurements.length,
                totalCanMeasurements: canMeasurements.length,
                speedViolations,
                avgSpeed: avgSpeed || 0,
                aggressiveBraking,
                highThrottle,
                totalMeasurements: gpsMeasurements.length + canMeasurements.length
            },
            dataPoints: gpsMeasurements.length + canMeasurements.length
        };
    }

    /**
     * Obtiene datos de análisis de rendimiento
     */
    private async getPerformanceAnalysisData(organizationId: string) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const sessions = await prisma.session.findMany({
            where: {
                organizationId,
                startTime: { gte: startDate }
            },
            include: {
                vehicle: true,
                _count: {
                    select: {
                        stabilityMeasurements: true,
                        gpsMeasurements: true,
                        canMeasurements: true
                    }
                }
            }
        });

        // Calcular métricas de rendimiento
        const totalSessions = sessions.length;
        const totalDistance = sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
        const totalDuration = sessions.reduce((sum, s) => {
            if (s.endTime) {
                return sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60); // horas
            }
            return sum;
        }, 0);

        const avgSpeed = totalDuration > 0 ? totalDistance / totalDuration : 0;
        const activeSessions = sessions.filter(s => s.status === 'ACTIVE').length;

        return {
            sessions,
            statistics: {
                totalSessions,
                totalDistance,
                totalDuration,
                avgSpeed,
                activeSessions,
                completionRate: totalSessions > 0 ? (totalSessions - activeSessions) / totalSessions : 0
            },
            dataPoints: totalSessions
        };
    }

    /**
     * Obtiene datos de análisis de emergencias
     */
    private async getEmergencyAnalysisData(organizationId: string) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const events = await prisma.stability_events.findMany({
            where: {
                Session: {
                    organizationId
                },
                timestamp: { gte: startDate },
                severity: 'CRITICAL'
            },
            include: {
                Session: {
                    include: {
                        vehicle: true
                    }
                }
            }
        });

        // Análisis de emergencias
        const emergencyTypes = events.reduce((acc: any, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {});

        const vehiclesInvolved = new Set(events.map(e => e.Session.vehicleId)).size;

        return {
            events,
            statistics: {
                totalEmergencies: events.length,
                emergencyTypes,
                vehiclesInvolved,
                avgEmergenciesPerVehicle: vehiclesInvolved > 0 ? events.length / vehiclesInvolved : 0
            },
            dataPoints: events.length
        };
    }

    /**
     * Obtiene datos generales de análisis
     */
    private async getGeneralAnalysisData(organizationId: string) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const [sessions, events, vehicles] = await Promise.all([
            prisma.session.findMany({
                where: {
                    organizationId,
                    startTime: { gte: startDate }
                },
                include: {
                    vehicle: true
                }
            }),
            prisma.stability_events.findMany({
                where: {
                    Session: {
                        organizationId
                    },
                    timestamp: { gte: startDate }
                }
            }),
            prisma.vehicle.findMany({
                where: { organizationId }
            })
        ]);

        return {
            sessions,
            events,
            vehicles,
            statistics: {
                totalSessions: sessions.length,
                totalEvents: events.length,
                totalVehicles: vehicles.length,
                activeVehicles: vehicles.filter(v => v.isActive).length
            },
            dataPoints: sessions.length + events.length
        };
    }

    /**
     * Realiza análisis avanzado de los datos
     */
    private async performAdvancedAnalysis(
        data: any,
        module: string,
        context: string,
        analysisType: string,
        depth: string,
        language: string
    ) {
        const explanation = this.generateContextualExplanation(data, module, context, language);
        const insights = this.generateAdvancedInsights(data, module);
        const recommendations = this.generateAdvancedRecommendations(data, module, insights);
        const patterns = this.detectAdvancedPatterns(data, module);
        const riskAssessment = this.assessRisk(data, module);

        return {
            explanation,
            confidence: this.calculateConfidence(data, module),
            references: this.generateReferences(data, module),
            suggestions: this.generateSuggestions(insights, recommendations),
            insights,
            recommendations,
            patterns,
            riskAssessment
        };
    }

    /**
     * Genera explicación contextual basada en datos reales
     */
    private generateContextualExplanation(data: any, module: string, context: string, language: string): string {
        const stats = data.statistics;

        switch (module) {
            case 'stability':
                if (stats.totalEvents === 0) {
                    return `El análisis de estabilidad muestra un excelente rendimiento operativo. No se han detectado eventos críticos en los últimos 30 días, indicando un manejo seguro y estable de la flota. La tasa de eventos por sesión es de ${stats.avgEventsPerSession.toFixed(2)}, muy por debajo del umbral de riesgo.`;
                } else if (stats.criticalEventRate > 0.1) {
                    return `El análisis de estabilidad revela una situación de atención. Se han registrado ${stats.totalEvents} eventos en ${stats.totalSessions} sesiones, con ${stats.criticalEvents} eventos críticos (${(stats.criticalEventRate * 100).toFixed(1)}% del total). Los tipos de eventos más frecuentes son: ${Object.entries(stats.eventsByType).map(([type, count]) => `${type} (${count})`).join(', ')}. Se recomienda revisión inmediata.`;
                } else {
                    return `El análisis de estabilidad muestra un rendimiento operativo aceptable. Se registraron ${stats.totalEvents} eventos en ${stats.totalSessions} sesiones, con una tasa de ${stats.avgEventsPerSession.toFixed(2)} eventos por sesión. Los eventos críticos representan el ${(stats.criticalEventRate * 100).toFixed(1)}% del total, dentro de parámetros normales.`;
                }

            case 'telemetry':
                return `El análisis de telemetría indica ${stats.speedViolations} violaciones de velocidad de ${stats.totalGpsMeasurements} mediciones GPS analizadas. La velocidad promedio es de ${stats.avgSpeed.toFixed(1)} km/h. Se detectaron ${stats.aggressiveBraking} casos de frenado agresivo y ${stats.highThrottle} casos de aceleración intensa, sugiriendo patrones de conducción que requieren atención.`;

            case 'performance':
                return `El análisis de rendimiento muestra ${stats.totalSessions} sesiones completadas con una distancia total de ${(stats.totalDistance / 1000).toFixed(1)} km en ${stats.totalDuration.toFixed(1)} horas. La velocidad promedio operativa es de ${stats.avgSpeed.toFixed(1)} km/h. La tasa de finalización de sesiones es del ${(stats.completionRate * 100).toFixed(1)}%.`;

            case 'emergency':
                return `El análisis de emergencias detecta ${stats.totalEmergencies} eventos críticos en los últimos 30 días, afectando a ${stats.vehiclesInvolved} vehículos. Los tipos de emergencia más frecuentes son: ${Object.entries(stats.emergencyTypes).map(([type, count]) => `${type} (${count})`).join(', ')}. La tasa promedio es de ${stats.avgEmergenciesPerVehicle.toFixed(2)} emergencias por vehículo.`;

            default:
                return `Análisis general del sistema: ${stats.totalSessions} sesiones activas, ${stats.totalEvents} eventos registrados, ${stats.totalVehicles} vehículos en flota (${stats.activeVehicles} activos). El sistema opera dentro de parámetros normales con indicadores de rendimiento estables.`;
        }
    }

    /**
     * Genera insights avanzados
     */
    private generateAdvancedInsights(data: any, module: string): any[] {
        const insights: any[] = [];
        const stats = data.statistics;

        switch (module) {
            case 'stability':
                if (stats.criticalEventRate > 0.15) {
                    insights.push({
                        id: 'high-critical-rate',
                        type: 'alert',
                        title: 'Alta tasa de eventos críticos',
                        description: `La tasa de eventos críticos (${(stats.criticalEventRate * 100).toFixed(1)}%) supera el umbral de seguridad recomendado (15%)`,
                        severity: 'critical',
                        confidence: 95,
                        data: { criticalEventRate: stats.criticalEventRate }
                    });
                }

                if (stats.avgEventsPerSession > 3) {
                    insights.push({
                        id: 'high-event-frequency',
                        type: 'warning',
                        title: 'Frecuencia elevada de eventos',
                        description: `Promedio de ${stats.avgEventsPerSession.toFixed(1)} eventos por sesión, indicando posible deterioro en técnicas de conducción`,
                        severity: 'high',
                        confidence: 90,
                        data: { avgEventsPerSession: stats.avgEventsPerSession }
                    });
                }
                break;

            case 'telemetry':
                if (stats.speedViolations > stats.totalGpsMeasurements * 0.05) {
                    insights.push({
                        id: 'excessive-speed-violations',
                        type: 'alert',
                        title: 'Exceso de violaciones de velocidad',
                        description: `${stats.speedViolations} violaciones de velocidad detectadas (${(stats.speedViolations / stats.totalGpsMeasurements * 100).toFixed(1)}% de las mediciones)`,
                        severity: 'high',
                        confidence: 92,
                        data: { speedViolations: stats.speedViolations, violationRate: stats.speedViolations / stats.totalGpsMeasurements }
                    });
                }
                break;
        }

        return insights;
    }

    /**
     * Genera recomendaciones avanzadas
     */
    private generateAdvancedRecommendations(data: any, module: string, insights: any[]): any[] {
        const recommendations: any[] = [];
        const stats = data.statistics;

        switch (module) {
            case 'stability':
                if (stats.criticalEventRate > 0.15) {
                    recommendations.push({
                        id: 'critical-review',
                        type: 'immediate',
                        title: 'Revisión crítica inmediata',
                        description: 'Implementar protocolo de emergencia y revisar todos los eventos críticos',
                        priority: 'critical',
                        actionable: true,
                        confidence: 95,
                        steps: [
                            'Revisar eventos críticos individualmente',
                            'Identificar patrones comunes',
                            'Implementar medidas correctivas inmediatas',
                            'Aumentar supervisión en tiempo real'
                        ]
                    });
                }

                if (stats.avgEventsPerSession > 3) {
                    recommendations.push({
                        id: 'driver-training',
                        type: 'training',
                        title: 'Capacitación en técnicas de conducción',
                        description: 'Organizar sesión de formación para mejorar técnicas de conducción segura',
                        priority: 'high',
                        actionable: true,
                        confidence: 88,
                        steps: [
                            'Identificar conductores con mayor incidencia',
                            'Diseñar programa de formación específico',
                            'Implementar seguimiento personalizado',
                            'Establecer métricas de mejora'
                        ]
                    });
                }
                break;

            case 'telemetry':
                if (stats.speedViolations > stats.totalGpsMeasurements * 0.05) {
                    recommendations.push({
                        id: 'speed-monitoring',
                        type: 'operational',
                        title: 'Reforzar monitoreo de velocidad',
                        description: 'Implementar alertas automáticas y seguimiento de violaciones de velocidad',
                        priority: 'high',
                        actionable: true,
                        confidence: 90,
                        steps: [
                            'Configurar alertas automáticas de velocidad',
                            'Implementar reportes semanales de violaciones',
                            'Establecer protocolo de seguimiento',
                            'Revisar límites de velocidad por zona'
                        ]
                    });
                }
                break;
        }

        return recommendations;
    }

    /**
     * Detecta patrones avanzados
     */
    private detectAdvancedPatterns(data: any, module: string): any[] {
        const patterns: any[] = [];

        // Patrones temporales
        if (data.events && data.events.length > 0) {
            const hourlyDistribution = data.events.reduce((acc: any, event: any) => {
                const hour = new Date(event.timestamp).getHours();
                acc[hour] = (acc[hour] || 0) + 1;
                return acc;
            }, {});

            const peakHour = Object.entries(hourlyDistribution)
                .sort(([, a], [, b]) => (b as number) - (a as number))[0];

            if (peakHour && (peakHour[1] as number) > data.events.length * 0.15) {
                patterns.push({
                    id: 'temporal-peak',
                    type: 'temporal',
                    title: 'Pico temporal de eventos',
                    description: `Concentración de eventos en las ${peakHour[0]}:00 horas`,
                    confidence: 85,
                    data: { peakHour: peakHour[0], eventCount: peakHour[1] }
                });
            }
        }

        return patterns;
    }

    /**
     * Evalúa el riesgo general
     */
    private assessRisk(data: any, module: string): any {
        const stats = data.statistics;
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        const riskFactors: string[] = [];
        const mitigationStrategies: string[] = [];

        switch (module) {
            case 'stability':
                if (stats.criticalEventRate > 0.15) {
                    riskLevel = 'critical';
                    riskFactors.push('Alta tasa de eventos críticos');
                    mitigationStrategies.push('Revisión inmediata de protocolos de seguridad');
                } else if (stats.criticalEventRate > 0.1) {
                    riskLevel = 'high';
                    riskFactors.push('Tasa elevada de eventos críticos');
                    mitigationStrategies.push('Aumentar supervisión y capacitación');
                } else if (stats.avgEventsPerSession > 3) {
                    riskLevel = 'medium';
                    riskFactors.push('Frecuencia elevada de eventos');
                    mitigationStrategies.push('Implementar formación en técnicas de conducción');
                }
                break;

            case 'telemetry':
                if (stats.speedViolations > stats.totalGpsMeasurements * 0.05) {
                    riskLevel = 'high';
                    riskFactors.push('Exceso de violaciones de velocidad');
                    mitigationStrategies.push('Reforzar monitoreo de velocidad');
                }
                break;
        }

        return {
            overallRisk: riskLevel,
            riskFactors,
            mitigationStrategies
        };
    }

    /**
     * Calcula la confianza del análisis
     */
    private calculateConfidence(data: any, module: string): number {
        const stats = data.statistics;
        let confidence = 70; // Base

        // Aumentar confianza con más datos
        if (stats.dataPoints > 1000) confidence += 15;
        else if (stats.dataPoints > 500) confidence += 10;
        else if (stats.dataPoints > 100) confidence += 5;

        // Ajustar según el módulo
        switch (module) {
            case 'stability':
                if (stats.totalEvents > 50) confidence += 10;
                break;
            case 'telemetry':
                if (stats.totalGpsMeasurements > 1000) confidence += 10;
                break;
        }

        return Math.min(confidence, 95);
    }

    /**
     * Genera referencias del análisis
     */
    private generateReferences(data: any, module: string): string[] {
        const references: string[] = [];
        const stats = data.statistics;

        references.push(`Análisis basado en ${stats.dataPoints || stats.totalSessions} puntos de datos`);

        switch (module) {
            case 'stability':
                references.push(`${stats.totalEvents} eventos de estabilidad analizados`);
                references.push(`${stats.totalSessions} sesiones de conducción evaluadas`);
                break;
            case 'telemetry':
                references.push(`${stats.totalGpsMeasurements} mediciones GPS procesadas`);
                references.push(`${stats.totalCanMeasurements} mediciones CAN analizadas`);
                break;
        }

        return references;
    }

    /**
     * Genera sugerencias basadas en insights y recomendaciones
     */
    private generateSuggestions(insights: any[], recommendations: any[]): string[] {
        const suggestions: string[] = [];

        if (insights.length > 0) {
            suggestions.push('Revisar insights generados para identificar áreas de mejora');
        }

        if (recommendations.length > 0) {
            suggestions.push('Implementar recomendaciones prioritarias para optimizar el rendimiento');
        }

        suggestions.push('Programar revisión periódica de métricas de rendimiento');
        suggestions.push('Considerar formación adicional para conductores con mayor incidencia');

        return suggestions;
    }
}
