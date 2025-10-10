/**
 * 📊 SERVICIO DE ANÁLISIS DE EFICIENCIA OPERATIVA - BOMBEROS MADRID
 * Analiza la eficiencia operativa de vehículos, personal y recursos
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Tipos de datos para análisis de eficiencia operativa
export interface EfficiencyMetrics {
    vehicleId: string;
    period: string;
    metrics: {
        // Métricas de disponibilidad
        availability: {
            totalHours: number;
            operationalHours: number;
            maintenanceHours: number;
            downtimeHours: number;
            availabilityRate: number; // porcentaje
        };
        // Métricas de respuesta
        response: {
            totalIncidents: number;
            averageResponseTime: number;
            targetResponseTime: number;
            complianceRate: number; // porcentaje
            fastestResponse: number;
            slowestResponse: number;
        };
        // Métricas de utilización
        utilization: {
            totalDistance: number;
            fuelConsumption: number;
            fuelEfficiency: number; // km/litro
            operationalCosts: number;
            costPerIncident: number;
        };
        // Métricas de mantenimiento
        maintenance: {
            preventiveMaintenance: number;
            correctiveMaintenance: number;
            maintenanceCosts: number;
            reliabilityScore: number; // 0-100
            nextMaintenanceDue: Date;
        };
        // Métricas de personal
        personnel: {
            totalPersonnel: number;
            averageExperience: number;
            trainingHours: number;
            certificationRate: number; // porcentaje
            performanceScore: number; // 0-100
        };
    };
    efficiencyScore: number; // 0-100
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
    recommendations: string[];
    trends: {
        availability: number;
        response: number;
        utilization: number;
        maintenance: number;
        overall: number;
    };
    benchmarks: {
        industry: number;
        regional: number;
        target: number;
    };
}

export interface OperationalAnalysis {
    id: string;
    type: 'VEHICLE' | 'PERSONNEL' | 'ZONE' | 'GENERAL';
    entityId: string;
    entityName: string;
    period: {
        start: Date;
        end: Date;
    };
    analysis: {
        currentPerformance: EfficiencyMetrics;
        historicalComparison: {
            previousPeriod: EfficiencyMetrics;
            improvement: number; // porcentaje
        };
        peerComparison: {
            average: EfficiencyMetrics;
            percentile: number; // posición relativa
        };
        predictions: {
            nextMonth: EfficiencyMetrics;
            nextQuarter: EfficiencyMetrics;
            confidence: number; // porcentaje
        };
    };
    insights: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
        criticalIssues: string[];
    };
    actionPlan: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
        budget: {
            immediate: number;
            shortTerm: number;
            longTerm: number;
            total: number;
        };
    };
    metadata: {
        generatedAt: Date;
        generatedBy: string;
        organizationId: string;
        dataQuality: number; // porcentaje
        lastUpdated: Date;
    };
}

export interface EfficiencyReport {
    id: string;
    title: string;
    type: 'VEHICLE_EFFICIENCY' | 'PERSONNEL_EFFICIENCY' | 'ZONE_EFFICIENCY' | 'COMPREHENSIVE';
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalEntities: number;
        averageEfficiency: number;
        topPerformers: Array<{
            id: string;
            name: string;
            score: number;
            grade: string;
        }>;
        underPerformers: Array<{
            id: string;
            name: string;
            score: number;
            grade: string;
        }>;
        keyMetrics: {
            overallAvailability: number;
            averageResponseTime: number;
            totalCosts: number;
            complianceRate: number;
        };
    };
    analyses: OperationalAnalysis[];
    recommendations: {
        strategic: string[];
        operational: string[];
        tactical: string[];
    };
    metadata: {
        generatedAt: Date;
        generatedBy: string;
        organizationId: string;
    };
}

export interface EfficiencyBenchmark {
    category: string;
    metric: string;
    industry: number;
    regional: number;
    target: number;
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
    unit: string;
    description: string;
}

class OperationalEfficiencyService extends EventEmitter {
    private analyses: Map<string, OperationalAnalysis> = new Map();
    private reports: Map<string, EfficiencyReport> = new Map();
    private benchmarks: Map<string, EfficiencyBenchmark> = new Map();
    private isAnalyzing: boolean = false;

    constructor() {
        super();
        this.initializeService();
    }

    private initializeService(): void {
        logger.info('📊 Inicializando servicio de análisis de eficiencia operativa');
        this.loadBenchmarks();
        this.generateSampleAnalyses();
    }

    /**
     * Carga benchmarks de la industria
     */
    private loadBenchmarks(): void {
        const defaultBenchmarks: EfficiencyBenchmark[] = [
            {
                category: 'Disponibilidad',
                metric: 'Tasa de Disponibilidad',
                industry: 85,
                regional: 88,
                target: 90,
                excellent: 95,
                good: 90,
                acceptable: 85,
                poor: 80,
                unit: '%',
                description: 'Porcentaje de tiempo que el vehículo está operativo'
            },
            {
                category: 'Respuesta',
                metric: 'Tiempo Promedio de Respuesta',
                industry: 8.5,
                regional: 7.2,
                target: 6.0,
                excellent: 5.0,
                good: 6.0,
                acceptable: 8.0,
                poor: 10.0,
                unit: 'minutos',
                description: 'Tiempo promedio desde la llamada hasta la llegada'
            },
            {
                category: 'Utilización',
                metric: 'Eficiencia de Combustible',
                industry: 12.5,
                regional: 13.2,
                target: 14.0,
                excellent: 15.0,
                good: 14.0,
                acceptable: 12.0,
                poor: 10.0,
                unit: 'km/litro',
                description: 'Kilómetros recorridos por litro de combustible'
            },
            {
                category: 'Mantenimiento',
                metric: 'Costo de Mantenimiento por Incidente',
                industry: 150,
                regional: 140,
                target: 120,
                excellent: 100,
                good: 120,
                acceptable: 150,
                poor: 200,
                unit: 'EUR',
                description: 'Costo promedio de mantenimiento por incidente atendido'
            },
            {
                category: 'Personal',
                metric: 'Tasa de Certificación',
                industry: 85,
                regional: 88,
                target: 90,
                excellent: 95,
                good: 90,
                acceptable: 85,
                poor: 80,
                unit: '%',
                description: 'Porcentaje de personal certificado'
            }
        ];

        defaultBenchmarks.forEach(benchmark => {
            this.benchmarks.set(`${benchmark.category}_${benchmark.metric}`, benchmark);
        });

        logger.info(`📊 Cargados ${defaultBenchmarks.length} benchmarks de eficiencia`);
    }

    /**
     * Genera análisis de ejemplo
     */
    private generateSampleAnalyses(): void {
        const vehicles = ['DOBACK022', 'DOBACK023', 'DOBACK024', 'DOBACK025', 'DOBACK027', 'DOBACK028'];

        vehicles.forEach(vehicleId => {
            const analysis = this.generateVehicleAnalysis(vehicleId);
            this.analyses.set(analysis.id, analysis);
        });

        logger.info(`📊 Generados ${vehicles.length} análisis de eficiencia de vehículos`);
    }

    /**
     * Genera análisis de eficiencia para un vehículo
     */
    private generateVehicleAnalysis(vehicleId: string): OperationalAnalysis {
        const id = `analysis_${vehicleId}_${Date.now()}`;
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás

        // Generar métricas actuales
        const currentMetrics = this.generateEfficiencyMetrics(vehicleId, 'current');

        // Generar métricas del período anterior
        const previousMetrics = this.generateEfficiencyMetrics(vehicleId, 'previous');

        // Generar métricas promedio
        const averageMetrics = this.generateEfficiencyMetrics(vehicleId, 'average');

        // Generar predicciones
        const predictions = this.generatePredictions(vehicleId);

        const analysis: OperationalAnalysis = {
            id,
            type: 'VEHICLE',
            entityId: vehicleId,
            entityName: `Vehículo ${vehicleId}`,
            period: {
                start: startDate,
                end: now
            },
            analysis: {
                currentPerformance: currentMetrics,
                historicalComparison: {
                    previousPeriod: previousMetrics,
                    improvement: this.calculateImprovement(currentMetrics.efficiencyScore, previousMetrics.efficiencyScore)
                },
                peerComparison: {
                    average: averageMetrics,
                    percentile: this.calculatePercentile(currentMetrics.efficiencyScore, averageMetrics.efficiencyScore)
                },
                predictions
            },
            insights: this.generateInsights(currentMetrics),
            actionPlan: this.generateActionPlan(currentMetrics),
            metadata: {
                generatedAt: now,
                generatedBy: 'Sistema Automático',
                organizationId: 'bomberos-madrid',
                dataQuality: Math.floor(Math.random() * 20) + 80, // 80-100%
                lastUpdated: now
            }
        };

        return analysis;
    }

    /**
     * Genera métricas de eficiencia
     */
    private generateEfficiencyMetrics(vehicleId: string, type: 'current' | 'previous' | 'average'): EfficiencyMetrics {
        const baseScore = this.getBaseScore(vehicleId, type);
        const variation = type === 'previous' ? -5 : type === 'average' ? 0 : Math.random() * 10 - 5;
        const score = Math.max(0, Math.min(100, baseScore + variation));

        return {
            vehicleId,
            period: '30 días',
            metrics: {
                availability: {
                    totalHours: 720, // 30 días * 24 horas
                    operationalHours: Math.floor(720 * (score / 100) * 0.9),
                    maintenanceHours: Math.floor(720 * 0.05),
                    downtimeHours: Math.floor(720 * 0.05),
                    availabilityRate: Math.round(score * 0.9 * 10) / 10
                },
                response: {
                    totalIncidents: Math.floor(Math.random() * 20) + 10,
                    averageResponseTime: Math.max(3, Math.min(15, 8 - (score - 50) / 10)),
                    targetResponseTime: 6,
                    complianceRate: Math.max(60, Math.min(100, score + Math.random() * 10 - 5)),
                    fastestResponse: Math.max(2, Math.min(5, 4 - (score - 50) / 20)),
                    slowestResponse: Math.max(8, Math.min(20, 15 - (score - 50) / 10))
                },
                utilization: {
                    totalDistance: Math.floor(Math.random() * 2000) + 1000,
                    fuelConsumption: Math.floor(Math.random() * 500) + 200,
                    fuelEfficiency: Math.max(10, Math.min(18, 12 + (score - 50) / 10)),
                    operationalCosts: Math.floor(Math.random() * 5000) + 2000,
                    costPerIncident: Math.floor(Math.random() * 200) + 100
                },
                maintenance: {
                    preventiveMaintenance: Math.floor(Math.random() * 5) + 2,
                    correctiveMaintenance: Math.floor(Math.random() * 3) + 1,
                    maintenanceCosts: Math.floor(Math.random() * 3000) + 1000,
                    reliabilityScore: Math.max(60, Math.min(100, score + Math.random() * 10 - 5)),
                    nextMaintenanceDue: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
                },
                personnel: {
                    totalPersonnel: Math.floor(Math.random() * 5) + 3,
                    averageExperience: Math.floor(Math.random() * 10) + 5,
                    trainingHours: Math.floor(Math.random() * 40) + 20,
                    certificationRate: Math.max(70, Math.min(100, score + Math.random() * 10 - 5)),
                    performanceScore: Math.max(60, Math.min(100, score + Math.random() * 10 - 5))
                }
            },
            efficiencyScore: Math.round(score * 10) / 10,
            grade: this.calculateGrade(score),
            recommendations: this.generateRecommendations(score),
            trends: {
                availability: Math.random() * 20 - 10,
                response: Math.random() * 20 - 10,
                utilization: Math.random() * 20 - 10,
                maintenance: Math.random() * 20 - 10,
                overall: Math.random() * 20 - 10
            },
            benchmarks: {
                industry: 75,
                regional: 78,
                target: 85
            }
        };
    }

    /**
     * Obtiene score base según el vehículo y tipo
     */
    private getBaseScore(vehicleId: string, type: 'current' | 'previous' | 'average'): number {
        const vehicleScores: { [key: string]: number } = {
            'DOBACK022': 85,
            'DOBACK023': 78,
            'DOBACK024': 92,
            'DOBACK025': 88,
            'DOBACK027': 95,
            'DOBACK028': 82
        };

        const baseScore = vehicleScores[vehicleId] || 80;

        switch (type) {
            case 'previous':
                return Math.max(60, baseScore - Math.random() * 10);
            case 'average':
                return Math.max(70, baseScore - Math.random() * 5);
            default:
                return baseScore;
        }
    }

    /**
     * Calcula la calificación basada en el score
     */
    private calculateGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F' {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 75) return 'C+';
        if (score >= 70) return 'C';
        if (score >= 65) return 'D+';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Calcula la mejora porcentual
     */
    private calculateImprovement(current: number, previous: number): number {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    }

    /**
     * Calcula el percentil
     */
    private calculatePercentile(current: number, average: number): number {
        const difference = current - average;
        const percentile = 50 + (difference / average) * 50;
        return Math.max(0, Math.min(100, Math.round(percentile * 10) / 10));
    }

    /**
     * Genera predicciones
     */
    private generatePredictions(vehicleId: string): {
        nextMonth: EfficiencyMetrics;
        nextQuarter: EfficiencyMetrics;
        confidence: number;
    } {
        const current = this.generateEfficiencyMetrics(vehicleId, 'current');

        return {
            nextMonth: this.generateEfficiencyMetrics(vehicleId, 'current'),
            nextQuarter: this.generateEfficiencyMetrics(vehicleId, 'current'),
            confidence: Math.floor(Math.random() * 20) + 75 // 75-95%
        };
    }

    /**
     * Genera insights
     */
    private generateInsights(metrics: EfficiencyMetrics): {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
        criticalIssues: string[];
    } {
        const insights = {
            strengths: [] as string[],
            weaknesses: [] as string[],
            opportunities: [] as string[],
            threats: [] as string[],
            criticalIssues: [] as string[]
        };

        // Analizar métricas y generar insights
        if (metrics.metrics.availability.availabilityRate >= 90) {
            insights.strengths.push('Excelente disponibilidad del vehículo');
        } else if (metrics.metrics.availability.availabilityRate < 80) {
            insights.weaknesses.push('Baja disponibilidad del vehículo');
            insights.criticalIssues.push('Necesita revisión de disponibilidad');
        }

        if (metrics.metrics.response.complianceRate >= 90) {
            insights.strengths.push('Cumplimiento excelente de tiempos de respuesta');
        } else if (metrics.metrics.response.complianceRate < 80) {
            insights.weaknesses.push('Cumplimiento deficiente de tiempos de respuesta');
            insights.criticalIssues.push('Optimizar tiempos de respuesta');
        }

        if (metrics.metrics.utilization.fuelEfficiency >= 14) {
            insights.strengths.push('Eficiencia de combustible superior');
        } else if (metrics.metrics.utilization.fuelEfficiency < 12) {
            insights.weaknesses.push('Eficiencia de combustible deficiente');
        }

        if (metrics.metrics.maintenance.reliabilityScore >= 90) {
            insights.strengths.push('Alta confiabilidad del vehículo');
        } else if (metrics.metrics.maintenance.reliabilityScore < 75) {
            insights.weaknesses.push('Baja confiabilidad del vehículo');
            insights.criticalIssues.push('Revisar programa de mantenimiento');
        }

        // Generar oportunidades y amenazas genéricas
        insights.opportunities.push('Implementar telemetría avanzada');
        insights.opportunities.push('Optimizar rutas de respuesta');
        insights.opportunities.push('Capacitación adicional del personal');

        insights.threats.push('Aumento de costos de combustible');
        insights.threats.push('Envejecimiento de la flota');
        insights.threats.push('Competencia por personal calificado');

        return insights;
    }

    /**
     * Genera plan de acción
     */
    private generateActionPlan(metrics: EfficiencyMetrics): {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
        budget: {
            immediate: number;
            shortTerm: number;
            longTerm: number;
            total: number;
        };
    } {
        const actionPlan = {
            immediate: [] as string[],
            shortTerm: [] as string[],
            longTerm: [] as string[],
            budget: {
                immediate: 0,
                shortTerm: 0,
                longTerm: 0,
                total: 0
            }
        };

        // Acciones inmediatas
        if (metrics.metrics.availability.availabilityRate < 85) {
            actionPlan.immediate.push('Revisar y corregir problemas de disponibilidad');
            actionPlan.budget.immediate += 2000;
        }

        if (metrics.metrics.response.complianceRate < 85) {
            actionPlan.immediate.push('Optimizar rutas de respuesta');
            actionPlan.budget.immediate += 1500;
        }

        // Acciones a corto plazo
        actionPlan.shortTerm.push('Implementar sistema de monitoreo en tiempo real');
        actionPlan.budget.shortTerm += 5000;

        actionPlan.shortTerm.push('Capacitación del personal en nuevas tecnologías');
        actionPlan.budget.shortTerm += 3000;

        // Acciones a largo plazo
        actionPlan.longTerm.push('Modernización de la flota');
        actionPlan.budget.longTerm += 50000;

        actionPlan.longTerm.push('Implementación de IA para optimización');
        actionPlan.budget.longTerm += 25000;

        actionPlan.budget.total = actionPlan.budget.immediate + actionPlan.budget.shortTerm + actionPlan.budget.longTerm;

        return actionPlan;
    }

    /**
     * Genera recomendaciones
     */
    private generateRecommendations(score: number): string[] {
        const recommendations: string[] = [];

        if (score >= 90) {
            recommendations.push('Mantener estándares actuales');
            recommendations.push('Compartir mejores prácticas con otros vehículos');
        } else if (score >= 80) {
            recommendations.push('Implementar mejoras menores');
            recommendations.push('Optimizar procesos operativos');
        } else if (score >= 70) {
            recommendations.push('Revisar y mejorar procesos');
            recommendations.push('Capacitación adicional del personal');
            recommendations.push('Optimizar mantenimiento preventivo');
        } else {
            recommendations.push('Revisión completa del vehículo');
            recommendations.push('Implementar medidas correctivas urgentes');
            recommendations.push('Evaluar reemplazo del vehículo');
        }

        return recommendations;
    }

    /**
     * Genera análisis de eficiencia operativa
     */
    async generateOperationalAnalysis(
        type: 'VEHICLE' | 'PERSONNEL' | 'ZONE' | 'GENERAL',
        entityId: string,
        period: { start: Date; end: Date }
    ): Promise<OperationalAnalysis> {
        const id = `analysis_${type.toLowerCase()}_${entityId}_${Date.now()}`;

        let analysis: OperationalAnalysis;

        switch (type) {
            case 'VEHICLE':
                analysis = this.generateVehicleAnalysis(entityId);
                break;
            case 'PERSONNEL':
                analysis = this.generatePersonnelAnalysis(entityId);
                break;
            case 'ZONE':
                analysis = this.generateZoneAnalysis(entityId);
                break;
            case 'GENERAL':
                analysis = this.generateGeneralAnalysis(entityId);
                break;
            default:
                throw new Error(`Tipo de análisis no soportado: ${type}`);
        }

        analysis.period = period;
        this.analyses.set(id, analysis);

        this.emit('analysisGenerated', analysis);

        logger.info(`📊 Análisis de eficiencia operativa generado: ${id}`);
        return analysis;
    }

    /**
     * Genera análisis de personal
     */
    private generatePersonnelAnalysis(personnelId: string): OperationalAnalysis {
        // Implementación simplificada para análisis de personal
        const id = `analysis_personnel_${personnelId}_${Date.now()}`;
        const now = new Date();

        return {
            id,
            type: 'PERSONNEL',
            entityId: personnelId,
            entityName: `Personal ${personnelId}`,
            period: {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            },
            analysis: {
                currentPerformance: this.generateEfficiencyMetrics('PERSONNEL', 'current'),
                historicalComparison: {
                    previousPeriod: this.generateEfficiencyMetrics('PERSONNEL', 'previous'),
                    improvement: Math.random() * 20 - 10
                },
                peerComparison: {
                    average: this.generateEfficiencyMetrics('PERSONNEL', 'average'),
                    percentile: Math.random() * 100
                },
                predictions: {
                    nextMonth: this.generateEfficiencyMetrics('PERSONNEL', 'current'),
                    nextQuarter: this.generateEfficiencyMetrics('PERSONNEL', 'current'),
                    confidence: Math.floor(Math.random() * 20) + 75
                }
            },
            insights: {
                strengths: ['Experiencia sólida', 'Certificaciones actualizadas'],
                weaknesses: ['Necesita capacitación en nuevas tecnologías'],
                opportunities: ['Especialización en equipos avanzados'],
                threats: ['Competencia por personal calificado'],
                criticalIssues: []
            },
            actionPlan: {
                immediate: ['Capacitación básica'],
                shortTerm: ['Certificación avanzada'],
                longTerm: ['Especialización técnica'],
                budget: {
                    immediate: 1000,
                    shortTerm: 3000,
                    longTerm: 8000,
                    total: 12000
                }
            },
            metadata: {
                generatedAt: now,
                generatedBy: 'Sistema Automático',
                organizationId: 'bomberos-madrid',
                dataQuality: 85,
                lastUpdated: now
            }
        };
    }

    /**
     * Genera análisis de zona
     */
    private generateZoneAnalysis(zoneId: string): OperationalAnalysis {
        // Implementación simplificada para análisis de zona
        const id = `analysis_zone_${zoneId}_${Date.now()}`;
        const now = new Date();

        return {
            id,
            type: 'ZONE',
            entityId: zoneId,
            entityName: `Zona ${zoneId}`,
            period: {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            },
            analysis: {
                currentPerformance: this.generateEfficiencyMetrics('ZONE', 'current'),
                historicalComparison: {
                    previousPeriod: this.generateEfficiencyMetrics('ZONE', 'previous'),
                    improvement: Math.random() * 20 - 10
                },
                peerComparison: {
                    average: this.generateEfficiencyMetrics('ZONE', 'average'),
                    percentile: Math.random() * 100
                },
                predictions: {
                    nextMonth: this.generateEfficiencyMetrics('ZONE', 'current'),
                    nextQuarter: this.generateEfficiencyMetrics('ZONE', 'current'),
                    confidence: Math.floor(Math.random() * 20) + 75
                }
            },
            insights: {
                strengths: ['Buena cobertura', 'Acceso adecuado'],
                weaknesses: ['Tiempos de respuesta variables'],
                opportunities: ['Optimización de rutas'],
                threats: ['Crecimiento urbano'],
                criticalIssues: []
            },
            actionPlan: {
                immediate: ['Revisar rutas de acceso'],
                shortTerm: ['Optimizar ubicación de recursos'],
                longTerm: ['Planificación urbana'],
                budget: {
                    immediate: 2000,
                    shortTerm: 8000,
                    longTerm: 25000,
                    total: 35000
                }
            },
            metadata: {
                generatedAt: now,
                generatedBy: 'Sistema Automático',
                organizationId: 'bomberos-madrid',
                dataQuality: 90,
                lastUpdated: now
            }
        };
    }

    /**
     * Genera análisis general
     */
    private generateGeneralAnalysis(organizationId: string): OperationalAnalysis {
        // Implementación simplificada para análisis general
        const id = `analysis_general_${organizationId}_${Date.now()}`;
        const now = new Date();

        return {
            id,
            type: 'GENERAL',
            entityId: organizationId,
            entityName: `Organización ${organizationId}`,
            period: {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            },
            analysis: {
                currentPerformance: this.generateEfficiencyMetrics('GENERAL', 'current'),
                historicalComparison: {
                    previousPeriod: this.generateEfficiencyMetrics('GENERAL', 'previous'),
                    improvement: Math.random() * 20 - 10
                },
                peerComparison: {
                    average: this.generateEfficiencyMetrics('GENERAL', 'average'),
                    percentile: Math.random() * 100
                },
                predictions: {
                    nextMonth: this.generateEfficiencyMetrics('GENERAL', 'current'),
                    nextQuarter: this.generateEfficiencyMetrics('GENERAL', 'current'),
                    confidence: Math.floor(Math.random() * 20) + 75
                }
            },
            insights: {
                strengths: ['Flota moderna', 'Personal bien capacitado'],
                weaknesses: ['Costos operativos altos'],
                opportunities: ['Digitalización de procesos'],
                threats: ['Presupuesto limitado'],
                criticalIssues: ['Optimización de recursos']
            },
            actionPlan: {
                immediate: ['Auditoría operativa'],
                shortTerm: ['Implementar mejoras de eficiencia'],
                longTerm: ['Transformación digital'],
                budget: {
                    immediate: 5000,
                    shortTerm: 20000,
                    longTerm: 100000,
                    total: 125000
                }
            },
            metadata: {
                generatedAt: now,
                generatedBy: 'Sistema Automático',
                organizationId: 'bomberos-madrid',
                dataQuality: 95,
                lastUpdated: now
            }
        };
    }

    /**
     * Obtiene todos los análisis
     */
    getAllAnalyses(): OperationalAnalysis[] {
        return Array.from(this.analyses.values());
    }

    /**
     * Obtiene un análisis específico
     */
    getAnalysis(analysisId: string): OperationalAnalysis | undefined {
        return this.analyses.get(analysisId);
    }

    /**
     * Obtiene análisis por tipo
     */
    getAnalysesByType(type: OperationalAnalysis['type']): OperationalAnalysis[] {
        return Array.from(this.analyses.values()).filter(analysis => analysis.type === type);
    }

    /**
     * Obtiene análisis por entidad
     */
    getAnalysesByEntity(entityId: string): OperationalAnalysis[] {
        return Array.from(this.analyses.values()).filter(analysis => analysis.entityId === entityId);
    }

    /**
     * Obtiene todos los benchmarks
     */
    getAllBenchmarks(): EfficiencyBenchmark[] {
        return Array.from(this.benchmarks.values());
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats() {
        const analyses = Array.from(this.analyses.values());

        return {
            totalAnalyses: analyses.length,
            byType: {
                VEHICLE: analyses.filter(a => a.type === 'VEHICLE').length,
                PERSONNEL: analyses.filter(a => a.type === 'PERSONNEL').length,
                ZONE: analyses.filter(a => a.type === 'ZONE').length,
                GENERAL: analyses.filter(a => a.type === 'GENERAL').length
            },
            averageEfficiency: analyses.length > 0
                ? analyses.reduce((acc, a) => acc + a.analysis.currentPerformance.efficiencyScore, 0) / analyses.length
                : 0,
            totalBenchmarks: this.benchmarks.size,
            lastAnalysis: analyses.length > 0
                ? Math.max(...analyses.map(a => a.metadata.generatedAt.getTime()))
                : null
        };
    }
}

export const operationalEfficiencyService = new OperationalEfficiencyService();
