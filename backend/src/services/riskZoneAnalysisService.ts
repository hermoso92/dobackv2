/**
 * 🗺️ SERVICIO DE ANÁLISIS DE ZONAS DE ALTO RIESGO - BOMBEROS MADRID
 * Analiza y evalúa el riesgo de diferentes zonas geográficas
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Tipos de datos para análisis de zonas de riesgo
export interface RiskZone {
    id: string;
    name: string;
    description: string;
    type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'HISTORICAL' | 'MIXED';
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    center: {
        latitude: number;
        longitude: number;
    };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number; // 0-100
    population: number;
    area: number; // en km²
    riskFactors: RiskFactor[];
    historicalIncidents: HistoricalIncident[];
    infrastructure: InfrastructureInfo;
    recommendations: string[];
    lastUpdated: Date;
}

export interface RiskFactor {
    id: string;
    name: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    weight: number; // 0-1
    category: 'STRUCTURAL' | 'DEMOGRAPHIC' | 'ENVIRONMENTAL' | 'INFRASTRUCTURE' | 'ACCESSIBILITY';
    mitigation: string;
    cost: number; // costo estimado de mitigación
}

export interface HistoricalIncident {
    id: string;
    date: Date;
    type: 'FIRE' | 'RESCUE' | 'HAZMAT' | 'TRAFFIC' | 'MEDICAL' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    casualties: {
        fatalities: number;
        injured: number;
        rescued: number;
    };
    responseTime: number;
    resolutionTime: number;
    cost: number;
    lessonsLearned: string[];
}

export interface InfrastructureInfo {
    fireStations: number;
    hospitals: number;
    policeStations: number;
    schools: number;
    accessRoads: number;
    waterSources: number;
    gasStations: number;
    chemicalPlants: number;
    warehouses: number;
    residentialBuildings: number;
    commercialBuildings: number;
}

export interface RiskAnalysis {
    zoneId: string;
    analysisDate: Date;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    trend: 'DECREASING' | 'STABLE' | 'INCREASING';
    factors: {
        structural: number;
        demographic: number;
        environmental: number;
        infrastructure: number;
        accessibility: number;
    };
    predictions: {
        nextMonth: number;
        nextQuarter: number;
        nextYear: number;
    };
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    budget: {
        immediate: number;
        shortTerm: number;
        longTerm: number;
        total: number;
    };
}

export interface ZoneComparison {
    zones: string[];
    comparisonDate: Date;
    metrics: {
        riskScore: { [zoneId: string]: number };
        incidentCount: { [zoneId: string]: number };
        averageResponseTime: { [zoneId: string]: number };
        costPerIncident: { [zoneId: string]: number };
    };
    ranking: Array<{
        zoneId: string;
        rank: number;
        score: number;
    }>;
    insights: string[];
}

class RiskZoneAnalysisService extends EventEmitter {
    private riskZones: Map<string, RiskZone> = new Map();
    private analyses: Map<string, RiskAnalysis> = new Map();
    private isAnalyzing: boolean = false;

    constructor() {
        super();
        this.initializeService();
    }

    private initializeService(): void {
        logger.info('🗺️ Inicializando servicio de análisis de zonas de riesgo');
        this.loadDefaultRiskZones();
    }

    /**
     * Carga las zonas de riesgo por defecto de Madrid
     */
    private loadDefaultRiskZones(): void {
        const defaultZones: RiskZone[] = [
            {
                id: 'centro-historico',
                name: 'Centro Histórico',
                description: 'Zona de alto riesgo por densidad de edificios históricos',
                type: 'HISTORICAL',
                bounds: {
                    north: 40.4250,
                    south: 40.4050,
                    east: -3.6900,
                    west: -3.7200
                },
                center: {
                    latitude: 40.4150,
                    longitude: -3.7050
                },
                riskLevel: 'HIGH',
                riskScore: 78,
                population: 45000,
                area: 2.5,
                riskFactors: [
                    {
                        id: 'hist-buildings',
                        name: 'Edificios Históricos',
                        description: 'Construcciones antiguas con materiales inflamables',
                        severity: 'HIGH',
                        weight: 0.3,
                        category: 'STRUCTURAL',
                        mitigation: 'Sistemas de detección y supresión avanzados',
                        cost: 500000
                    },
                    {
                        id: 'narrow-streets',
                        name: 'Calles Estrechas',
                        description: 'Acceso limitado para vehículos de emergencia',
                        severity: 'HIGH',
                        weight: 0.25,
                        category: 'ACCESSIBILITY',
                        mitigation: 'Ampliación de calles y señalización especial',
                        cost: 800000
                    },
                    {
                        id: 'high-density',
                        name: 'Alta Densidad Poblacional',
                        description: 'Concentración de personas en espacios reducidos',
                        severity: 'MEDIUM',
                        weight: 0.2,
                        category: 'DEMOGRAPHIC',
                        mitigation: 'Plan de evacuación y señalización',
                        cost: 100000
                    }
                ],
                historicalIncidents: this.generateHistoricalIncidents('centro-historico'),
                infrastructure: {
                    fireStations: 2,
                    hospitals: 3,
                    policeStations: 4,
                    schools: 8,
                    accessRoads: 15,
                    waterSources: 12,
                    gasStations: 5,
                    chemicalPlants: 0,
                    warehouses: 3,
                    residentialBuildings: 1200,
                    commercialBuildings: 800
                },
                recommendations: [
                    'Instalar sistemas de detección temprana',
                    'Mejorar acceso vehicular',
                    'Capacitación específica del personal',
                    'Protocolos de evacuación actualizados'
                ],
                lastUpdated: new Date()
            },
            {
                id: 'zona-industrial-sur',
                name: 'Zona Industrial Sur',
                description: 'Zona de riesgo crítico por presencia de materiales peligrosos',
                type: 'INDUSTRIAL',
                bounds: {
                    north: 40.3800,
                    south: 40.3500,
                    east: -3.6800,
                    west: -3.7200
                },
                center: {
                    latitude: 40.3650,
                    longitude: -3.7000
                },
                riskLevel: 'CRITICAL',
                riskScore: 92,
                population: 25000,
                area: 8.2,
                riskFactors: [
                    {
                        id: 'hazmat',
                        name: 'Materiales Peligrosos',
                        description: 'Almacenamiento de sustancias químicas peligrosas',
                        severity: 'CRITICAL',
                        weight: 0.4,
                        category: 'ENVIRONMENTAL',
                        mitigation: 'Sistemas de contención y monitoreo 24/7',
                        cost: 1200000
                    },
                    {
                        id: 'explosion-risk',
                        name: 'Riesgo de Explosión',
                        description: 'Presencia de gases inflamables y combustibles',
                        severity: 'CRITICAL',
                        weight: 0.35,
                        category: 'ENVIRONMENTAL',
                        mitigation: 'Sistemas de detección de gases y ventilación',
                        cost: 800000
                    },
                    {
                        id: 'limited-access',
                        name: 'Acceso Limitado',
                        description: 'Restricciones de acceso para vehículos de emergencia',
                        severity: 'HIGH',
                        weight: 0.25,
                        category: 'ACCESSIBILITY',
                        mitigation: 'Rutas de acceso prioritarias y señalización',
                        cost: 300000
                    }
                ],
                historicalIncidents: this.generateHistoricalIncidents('zona-industrial-sur'),
                infrastructure: {
                    fireStations: 1,
                    hospitals: 1,
                    policeStations: 2,
                    schools: 4,
                    accessRoads: 8,
                    waterSources: 6,
                    gasStations: 3,
                    chemicalPlants: 5,
                    warehouses: 25,
                    residentialBuildings: 800,
                    commercialBuildings: 150
                },
                recommendations: [
                    'Protocolos especializados para materiales peligrosos',
                    'Equipamiento específico de protección química',
                    'Coordinación con empresas industriales',
                    'Sistemas de monitoreo ambiental continuo'
                ],
                lastUpdated: new Date()
            },
            {
                id: 'barrio-salamanca',
                name: 'Barrio de Salamanca',
                description: 'Zona de riesgo medio por edificios residenciales',
                type: 'RESIDENTIAL',
                bounds: {
                    north: 40.4350,
                    south: 40.4150,
                    east: -3.6800,
                    west: -3.7000
                },
                center: {
                    latitude: 40.4250,
                    longitude: -3.6900
                },
                riskLevel: 'MEDIUM',
                riskScore: 45,
                population: 65000,
                area: 5.8,
                riskFactors: [
                    {
                        id: 'traffic',
                        name: 'Tráfico Intenso',
                        description: 'Congestión vehicular que afecta tiempos de respuesta',
                        severity: 'MEDIUM',
                        weight: 0.3,
                        category: 'ACCESSIBILITY',
                        mitigation: 'Rutas prioritarias y coordinación con tráfico',
                        cost: 200000
                    },
                    {
                        id: 'residential-density',
                        name: 'Densidad Residencial',
                        description: 'Alta concentración de edificios residenciales',
                        severity: 'MEDIUM',
                        weight: 0.25,
                        category: 'DEMOGRAPHIC',
                        mitigation: 'Plan de evacuación y comunicación',
                        cost: 80000
                    },
                    {
                        id: 'parking',
                        name: 'Problemas de Aparcamiento',
                        description: 'Dificultad para estacionar vehículos de emergencia',
                        severity: 'LOW',
                        weight: 0.15,
                        category: 'ACCESSIBILITY',
                        mitigation: 'Zonas de aparcamiento reservadas',
                        cost: 50000
                    }
                ],
                historicalIncidents: this.generateHistoricalIncidents('barrio-salamanca'),
                infrastructure: {
                    fireStations: 2,
                    hospitals: 2,
                    policeStations: 3,
                    schools: 12,
                    accessRoads: 20,
                    waterSources: 15,
                    gasStations: 8,
                    chemicalPlants: 0,
                    warehouses: 2,
                    residentialBuildings: 2000,
                    commercialBuildings: 300
                },
                recommendations: [
                    'Optimización de rutas de respuesta',
                    'Coordinación con servicios de tráfico',
                    'Patrullaje preventivo',
                    'Comunicación con comunidades vecinales'
                ],
                lastUpdated: new Date()
            }
        ];

        defaultZones.forEach(zone => {
            this.riskZones.set(zone.id, zone);
        });

        logger.info(`🗺️ Cargadas ${defaultZones.length} zonas de riesgo por defecto`);
    }

    /**
     * Genera incidentes históricos para una zona
     */
    private generateHistoricalIncidents(zoneId: string): HistoricalIncident[] {
        const incidents: HistoricalIncident[] = [];
        const incidentCount = Math.floor(Math.random() * 20) + 10;

        for (let i = 0; i < incidentCount; i++) {
            const incident: HistoricalIncident = {
                id: `${zoneId}_inc_${i + 1}`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                type: ['FIRE', 'RESCUE', 'HAZMAT', 'TRAFFIC', 'MEDICAL', 'OTHER'][Math.floor(Math.random() * 6)] as any,
                severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
                casualties: {
                    fatalities: Math.floor(Math.random() * 3),
                    injured: Math.floor(Math.random() * 10),
                    rescued: Math.floor(Math.random() * 15) + 1
                },
                responseTime: Math.floor(Math.random() * 15) + 3,
                resolutionTime: Math.floor(Math.random() * 120) + 15,
                cost: Math.floor(Math.random() * 50000) + 5000,
                lessonsLearned: [
                    'Mejorar coordinación entre servicios',
                    'Actualizar protocolos de respuesta',
                    'Capacitar personal en nuevas técnicas'
                ]
            };
            incidents.push(incident);
        }

        return incidents.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    /**
     * Analiza el riesgo de una zona específica
     */
    async analyzeZoneRisk(zoneId: string): Promise<RiskAnalysis> {
        const zone = this.riskZones.get(zoneId);
        if (!zone) {
            throw new Error(`Zona ${zoneId} no encontrada`);
        }

        // Calcular factores de riesgo
        const structuralRisk = zone.riskFactors
            .filter(f => f.category === 'STRUCTURAL')
            .reduce((acc, f) => acc + (f.weight * this.severityToNumber(f.severity)), 0);

        const demographicRisk = zone.riskFactors
            .filter(f => f.category === 'DEMOGRAPHIC')
            .reduce((acc, f) => acc + (f.weight * this.severityToNumber(f.severity)), 0);

        const environmentalRisk = zone.riskFactors
            .filter(f => f.category === 'ENVIRONMENTAL')
            .reduce((acc, f) => acc + (f.weight * this.severityToNumber(f.severity)), 0);

        const infrastructureRisk = zone.riskFactors
            .filter(f => f.category === 'INFRASTRUCTURE')
            .reduce((acc, f) => acc + (f.weight * this.severityToNumber(f.severity)), 0);

        const accessibilityRisk = zone.riskFactors
            .filter(f => f.category === 'ACCESSIBILITY')
            .reduce((acc, f) => acc + (f.weight * this.severityToNumber(f.severity)), 0);

        // Calcular riesgo general
        const totalRisk = (structuralRisk + demographicRisk + environmentalRisk + infrastructureRisk + accessibilityRisk) * 25;
        const overallRisk = this.scoreToRiskLevel(totalRisk);

        // Generar predicciones
        const predictions = {
            nextMonth: Math.max(0, totalRisk + (Math.random() - 0.5) * 10),
            nextQuarter: Math.max(0, totalRisk + (Math.random() - 0.5) * 15),
            nextYear: Math.max(0, totalRisk + (Math.random() - 0.5) * 20)
        };

        // Generar recomendaciones
        const recommendations = this.generateRecommendations(zone, totalRisk);

        // Calcular presupuesto
        const budget = this.calculateBudget(zone.riskFactors, recommendations);

        const analysis: RiskAnalysis = {
            zoneId,
            analysisDate: new Date(),
            overallRisk,
            riskScore: totalRisk,
            trend: 'STABLE', // En producción se calcularía basado en datos históricos
            factors: {
                structural: structuralRisk,
                demographic: demographicRisk,
                environmental: environmentalRisk,
                infrastructure: infrastructureRisk,
                accessibility: accessibilityRisk
            },
            predictions,
            recommendations,
            budget
        };

        this.analyses.set(`${zoneId}_${Date.now()}`, analysis);
        this.emit('analysisCompleted', analysis);

        logger.info(`🗺️ Análisis de riesgo completado para zona ${zoneId}: ${overallRisk} (${totalRisk.toFixed(1)})`);
        return analysis;
    }

    /**
     * Compara múltiples zonas
     */
    async compareZones(zoneIds: string[]): Promise<ZoneComparison> {
        const zones = zoneIds.map(id => this.riskZones.get(id)).filter(Boolean) as RiskZone[];

        if (zones.length < 2) {
            throw new Error('Se requieren al menos 2 zonas para comparar');
        }

        const metrics = {
            riskScore: {} as { [zoneId: string]: number },
            incidentCount: {} as { [zoneId: string]: number },
            averageResponseTime: {} as { [zoneId: string]: number },
            costPerIncident: {} as { [zoneId: string]: number }
        };

        const ranking: Array<{ zoneId: string; rank: number; score: number }> = [];

        zones.forEach(zone => {
            metrics.riskScore[zone.id] = zone.riskScore;
            metrics.incidentCount[zone.id] = zone.historicalIncidents.length;
            metrics.averageResponseTime[zone.id] = zone.historicalIncidents.length > 0
                ? zone.historicalIncidents.reduce((acc, inc) => acc + inc.responseTime, 0) / zone.historicalIncidents.length
                : 0;
            metrics.costPerIncident[zone.id] = zone.historicalIncidents.length > 0
                ? zone.historicalIncidents.reduce((acc, inc) => acc + inc.cost, 0) / zone.historicalIncidents.length
                : 0;

            ranking.push({
                zoneId: zone.id,
                rank: 0, // Se calculará después
                score: zone.riskScore
            });
        });

        // Ordenar ranking por score (mayor riesgo = mayor rank)
        ranking.sort((a, b) => b.score - a.score);
        ranking.forEach((item, index) => {
            item.rank = index + 1;
        });

        // Generar insights
        const insights = this.generateComparisonInsights(zones, metrics, ranking);

        const comparison: ZoneComparison = {
            zones: zoneIds,
            comparisonDate: new Date(),
            metrics,
            ranking,
            insights
        };

        this.emit('comparisonCompleted', comparison);

        logger.info(`🗺️ Comparación de zonas completada: ${zoneIds.join(', ')}`);
        return comparison;
    }

    /**
     * Obtiene todas las zonas de riesgo
     */
    getAllRiskZones(): RiskZone[] {
        return Array.from(this.riskZones.values());
    }

    /**
     * Obtiene una zona específica
     */
    getRiskZone(zoneId: string): RiskZone | undefined {
        return this.riskZones.get(zoneId);
    }

    /**
     * Obtiene análisis por zona
     */
    getAnalysesByZone(zoneId: string): RiskAnalysis[] {
        return Array.from(this.analyses.values())
            .filter(analysis => analysis.zoneId === zoneId)
            .sort((a, b) => b.analysisDate.getTime() - a.analysisDate.getTime());
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats() {
        const zones = Array.from(this.riskZones.values());
        const analyses = Array.from(this.analyses.values());

        return {
            totalZones: zones.length,
            totalAnalyses: analyses.length,
            byRiskLevel: {
                LOW: zones.filter(z => z.riskLevel === 'LOW').length,
                MEDIUM: zones.filter(z => z.riskLevel === 'MEDIUM').length,
                HIGH: zones.filter(z => z.riskLevel === 'HIGH').length,
                CRITICAL: zones.filter(z => z.riskLevel === 'CRITICAL').length
            },
            byType: {
                RESIDENTIAL: zones.filter(z => z.type === 'RESIDENTIAL').length,
                COMMERCIAL: zones.filter(z => z.type === 'COMMERCIAL').length,
                INDUSTRIAL: zones.filter(z => z.type === 'INDUSTRIAL').length,
                HISTORICAL: zones.filter(z => z.type === 'HISTORICAL').length,
                MIXED: zones.filter(z => z.type === 'MIXED').length
            },
            averageRiskScore: zones.length > 0
                ? zones.reduce((acc, z) => acc + z.riskScore, 0) / zones.length
                : 0,
            lastAnalysis: analyses.length > 0
                ? Math.max(...analyses.map(a => a.analysisDate.getTime()))
                : null
        };
    }

    // Métodos auxiliares privados
    private severityToNumber(severity: string): number {
        switch (severity) {
            case 'LOW': return 1;
            case 'MEDIUM': return 2;
            case 'HIGH': return 3;
            case 'CRITICAL': return 4;
            default: return 0;
        }
    }

    private scoreToRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        if (score < 25) return 'LOW';
        if (score < 50) return 'MEDIUM';
        if (score < 75) return 'HIGH';
        return 'CRITICAL';
    }

    private generateRecommendations(zone: RiskZone, riskScore: number): {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    } {
        const recommendations = {
            immediate: [] as string[],
            shortTerm: [] as string[],
            longTerm: [] as string[]
        };

        // Recomendaciones inmediatas (críticas)
        if (riskScore > 80) {
            recommendations.immediate.push('Evaluación de emergencia requerida');
            recommendations.immediate.push('Aumentar patrullaje en la zona');
        }

        // Recomendaciones a corto plazo (1-3 meses)
        zone.riskFactors
            .filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL')
            .forEach(factor => {
                recommendations.shortTerm.push(factor.mitigation);
            });

        // Recomendaciones a largo plazo (6+ meses)
        if (zone.type === 'INDUSTRIAL') {
            recommendations.longTerm.push('Desarrollo de protocolos especializados');
            recommendations.longTerm.push('Inversión en equipamiento específico');
        } else if (zone.type === 'HISTORICAL') {
            recommendations.longTerm.push('Plan de modernización de infraestructura');
            recommendations.longTerm.push('Programa de sensibilización ciudadana');
        }

        return recommendations;
    }

    private calculateBudget(factors: RiskFactor[], recommendations: any): {
        immediate: number;
        shortTerm: number;
        longTerm: number;
        total: number;
    } {
        const immediate = factors
            .filter(f => f.severity === 'CRITICAL')
            .reduce((acc, f) => acc + (f.cost * 0.1), 0);

        const shortTerm = factors
            .filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL')
            .reduce((acc, f) => acc + (f.cost * 0.3), 0);

        const longTerm = factors
            .reduce((acc, f) => acc + (f.cost * 0.6), 0);

        return {
            immediate,
            shortTerm,
            longTerm,
            total: immediate + shortTerm + longTerm
        };
    }

    private generateComparisonInsights(zones: RiskZone[], metrics: any, ranking: any[]): string[] {
        const insights: string[] = [];

        const highestRisk = ranking[0];
        const lowestRisk = ranking[ranking.length - 1];

        insights.push(`La zona con mayor riesgo es ${zones.find(z => z.id === highestRisk.zoneId)?.name} con un score de ${highestRisk.score}`);
        insights.push(`La zona con menor riesgo es ${zones.find(z => z.id === lowestRisk.zoneId)?.name} con un score de ${lowestRisk.score}`);

        const avgResponseTime = Object.values(metrics.averageResponseTime).reduce((acc: number, val: any) => acc + val, 0) / zones.length;
        insights.push(`El tiempo promedio de respuesta en todas las zonas es de ${avgResponseTime.toFixed(1)} minutos`);

        const totalIncidents = Object.values(metrics.incidentCount).reduce((acc: number, val: any) => acc + val, 0);
        insights.push(`Total de incidentes históricos analizados: ${totalIncidents}`);

        return insights;
    }
}

export const riskZoneAnalysisService = new RiskZoneAnalysisService();
