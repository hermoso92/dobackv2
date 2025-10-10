/**
 * 💰 SERVICIO DE REPORTES DE COSTOS OPERATIVOS - BOMBEROS MADRID
 * Analiza y reporta los costos operativos de vehículos, personal y recursos
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

// Tipos de datos para análisis de costos operativos
export interface CostCategory {
    id: string;
    name: string;
    description: string;
    type: 'FIXED' | 'VARIABLE' | 'CAPITAL' | 'OPERATIONAL';
    subcategories: CostSubcategory[];
}

export interface CostSubcategory {
    id: string;
    name: string;
    description: string;
    unit: string;
    typicalRange: {
        min: number;
        max: number;
        average: number;
    };
}

export interface CostRecord {
    id: string;
    date: Date;
    category: string;
    subcategory: string;
    entityId: string; // vehicleId, personnelId, zoneId, etc.
    entityType: 'VEHICLE' | 'PERSONNEL' | 'ZONE' | 'EQUIPMENT' | 'FACILITY';
    description: string;
    amount: number;
    currency: string;
    quantity?: number;
    unit?: string;
    unitCost?: number;
    vendor?: string;
    invoiceNumber?: string;
    paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    metadata: {
        createdBy: string;
        approvedBy?: string;
        organizationId: string;
        tags: string[];
        notes?: string;
    };
}

export interface CostAnalysis {
    id: string;
    title: string;
    type: 'VEHICLE' | 'PERSONNEL' | 'ZONE' | 'DEPARTMENT' | 'ORGANIZATION';
    entityId: string;
    entityName: string;
    period: {
        start: Date;
        end: Date;
    };
    analysis: {
        totalCosts: number;
        byCategory: { [category: string]: number };
        bySubcategory: { [subcategory: string]: number };
        byMonth: Array<{
            month: string;
            total: number;
            byCategory: { [category: string]: number };
        }>;
        trends: {
            total: number;
            change: number; // porcentaje
            direction: 'INCREASING' | 'DECREASING' | 'STABLE';
        };
        benchmarks: {
            budget: number;
            actual: number;
            variance: number; // porcentaje
            previousPeriod: number;
            industry: number;
        };
        costPerIncident: number;
        costPerHour: number;
        costPerKm: number;
    };
    insights: {
        costDrivers: Array<{
            category: string;
            amount: number;
            percentage: number;
            trend: 'INCREASING' | 'DECREASING' | 'STABLE';
        }>;
        opportunities: string[];
        risks: string[];
        recommendations: string[];
    };
    metadata: {
        generatedAt: Date;
        generatedBy: string;
        organizationId: string;
        dataQuality: number; // porcentaje
        lastUpdated: Date;
    };
}

export interface CostReport {
    id: string;
    title: string;
    type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalCosts: number;
        totalBudget: number;
        variance: number; // porcentaje
        costPerIncident: number;
        costPerVehicle: number;
        costPerPersonnel: number;
        byCategory: { [category: string]: number };
        byEntity: { [entityId: string]: number };
        trends: {
            total: number;
            change: number;
            direction: 'INCREASING' | 'DECREASING' | 'STABLE';
        };
    };
    analyses: CostAnalysis[];
    budget: {
        allocated: number;
        spent: number;
        remaining: number;
        utilization: number; // porcentaje
        byCategory: { [category: string]: { allocated: number; spent: number; remaining: number } };
    };
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
        savings: {
            potential: number;
            actions: string[];
        };
    };
    metadata: {
        generatedAt: Date;
        generatedBy: string;
        organizationId: string;
        approvedBy?: string;
        approvedAt?: Date;
    };
}

export interface CostForecast {
    id: string;
    entityId: string;
    entityType: 'VEHICLE' | 'PERSONNEL' | 'ZONE' | 'DEPARTMENT' | 'ORGANIZATION';
    period: {
        start: Date;
        end: Date;
    };
    forecast: {
        total: number;
        byCategory: { [category: string]: number };
        byMonth: Array<{
            month: string;
            predicted: number;
            confidence: number;
            factors: string[];
        }>;
        confidence: number; // porcentaje
        methodology: string;
        assumptions: string[];
    };
    scenarios: {
        optimistic: number;
        realistic: number;
        pessimistic: number;
    };
    metadata: {
        generatedAt: Date;
        generatedBy: string;
        organizationId: string;
    };
}

class OperationalCostsService extends EventEmitter {
    private costCategories: Map<string, CostCategory> = new Map();
    private costRecords: Map<string, CostRecord> = new Map();
    private costAnalyses: Map<string, CostAnalysis> = new Map();
    private costReports: Map<string, CostReport> = new Map();
    private costForecasts: Map<string, CostForecast> = new Map();

    constructor() {
        super();
        this.initializeService();
    }

    private initializeService(): void {
        logger.info('💰 Inicializando servicio de reportes de costos operativos');
        this.loadCostCategories();
        this.generateSampleCostRecords();
        this.generateSampleAnalyses();
    }

    /**
     * Carga categorías de costos por defecto
     */
    private loadCostCategories(): void {
        const defaultCategories: CostCategory[] = [
            {
                id: 'fuel',
                name: 'Combustible',
                description: 'Costos de combustible para vehículos',
                type: 'VARIABLE',
                subcategories: [
                    {
                        id: 'diesel',
                        name: 'Gasóleo',
                        description: 'Gasóleo para vehículos pesados',
                        unit: 'litros',
                        typicalRange: { min: 1.2, max: 1.8, average: 1.5 }
                    },
                    {
                        id: 'gasoline',
                        name: 'Gasolina',
                        description: 'Gasolina para vehículos ligeros',
                        unit: 'litros',
                        typicalRange: { min: 1.4, max: 2.0, average: 1.7 }
                    }
                ]
            },
            {
                id: 'maintenance',
                name: 'Mantenimiento',
                description: 'Costos de mantenimiento de vehículos y equipos',
                type: 'VARIABLE',
                subcategories: [
                    {
                        id: 'preventive',
                        name: 'Preventivo',
                        description: 'Mantenimiento preventivo programado',
                        unit: 'EUR',
                        typicalRange: { min: 500, max: 2000, average: 1200 }
                    },
                    {
                        id: 'corrective',
                        name: 'Correctivo',
                        description: 'Mantenimiento correctivo por averías',
                        unit: 'EUR',
                        typicalRange: { min: 200, max: 5000, average: 1500 }
                    },
                    {
                        id: 'parts',
                        name: 'Repuestos',
                        description: 'Costos de repuestos y piezas',
                        unit: 'EUR',
                        typicalRange: { min: 100, max: 3000, average: 800 }
                    }
                ]
            },
            {
                id: 'personnel',
                name: 'Personal',
                description: 'Costos de personal y recursos humanos',
                type: 'FIXED',
                subcategories: [
                    {
                        id: 'salaries',
                        name: 'Salarios',
                        description: 'Salarios base del personal',
                        unit: 'EUR',
                        typicalRange: { min: 2000, max: 4000, average: 3000 }
                    },
                    {
                        id: 'benefits',
                        name: 'Beneficios',
                        description: 'Beneficios sociales y complementos',
                        unit: 'EUR',
                        typicalRange: { min: 300, max: 800, average: 500 }
                    },
                    {
                        id: 'training',
                        name: 'Capacitación',
                        description: 'Costos de capacitación y certificación',
                        unit: 'EUR',
                        typicalRange: { min: 200, max: 1000, average: 500 }
                    }
                ]
            },
            {
                id: 'equipment',
                name: 'Equipamiento',
                description: 'Costos de equipamiento y herramientas',
                type: 'CAPITAL',
                subcategories: [
                    {
                        id: 'purchase',
                        name: 'Compra',
                        description: 'Compra de equipamiento nuevo',
                        unit: 'EUR',
                        typicalRange: { min: 1000, max: 50000, average: 15000 }
                    },
                    {
                        id: 'rental',
                        name: 'Alquiler',
                        description: 'Alquiler de equipamiento especializado',
                        unit: 'EUR',
                        typicalRange: { min: 200, max: 2000, average: 800 }
                    },
                    {
                        id: 'repair',
                        name: 'Reparación',
                        description: 'Reparación de equipamiento',
                        unit: 'EUR',
                        typicalRange: { min: 100, max: 3000, average: 600 }
                    }
                ]
            },
            {
                id: 'facilities',
                name: 'Instalaciones',
                description: 'Costos de instalaciones y infraestructura',
                type: 'FIXED',
                subcategories: [
                    {
                        id: 'rent',
                        name: 'Alquiler',
                        description: 'Alquiler de instalaciones',
                        unit: 'EUR',
                        typicalRange: { min: 2000, max: 8000, average: 5000 }
                    },
                    {
                        id: 'utilities',
                        name: 'Servicios',
                        description: 'Electricidad, agua, gas, etc.',
                        unit: 'EUR',
                        typicalRange: { min: 500, max: 2000, average: 1200 }
                    },
                    {
                        id: 'insurance',
                        name: 'Seguros',
                        description: 'Seguros de instalaciones y equipos',
                        unit: 'EUR',
                        typicalRange: { min: 1000, max: 5000, average: 3000 }
                    }
                ]
            },
            {
                id: 'operational',
                name: 'Operacionales',
                description: 'Costos operacionales diversos',
                type: 'VARIABLE',
                subcategories: [
                    {
                        id: 'communications',
                        name: 'Comunicaciones',
                        description: 'Teléfonos, radio, internet',
                        unit: 'EUR',
                        typicalRange: { min: 200, max: 800, average: 400 }
                    },
                    {
                        id: 'supplies',
                        name: 'Suministros',
                        description: 'Suministros de oficina y operativos',
                        unit: 'EUR',
                        typicalRange: { min: 100, max: 500, average: 250 }
                    },
                    {
                        id: 'travel',
                        name: 'Viajes',
                        description: 'Costos de viajes y desplazamientos',
                        unit: 'EUR',
                        typicalRange: { min: 300, max: 1500, average: 800 }
                    }
                ]
            }
        ];

        defaultCategories.forEach(category => {
            this.costCategories.set(category.id, category);
        });

        logger.info(`💰 Cargadas ${defaultCategories.length} categorías de costos`);
    }

    /**
     * Genera registros de costos de ejemplo
     */
    private generateSampleCostRecords(): void {
        const vehicles = ['DOBACK022', 'DOBACK023', 'DOBACK024', 'DOBACK025', 'DOBACK027', 'DOBACK028'];
        const categories = Array.from(this.costCategories.keys());

        let recordId = 1;

        // Generar registros para los últimos 6 meses
        for (let month = 0; month < 6; month++) {
            const date = new Date();
            date.setMonth(date.getMonth() - month);

            vehicles.forEach(vehicleId => {
                categories.forEach(categoryId => {
                    const category = this.costCategories.get(categoryId)!;

                    category.subcategories.forEach(subcategory => {
                        // Generar 1-3 registros por subcategoría por mes
                        const recordCount = Math.floor(Math.random() * 3) + 1;

                        for (let i = 0; i < recordCount; i++) {
                            const amount = Math.floor(Math.random() * (subcategory.typicalRange.max - subcategory.typicalRange.min)) + subcategory.typicalRange.min;
                            const quantity = Math.floor(Math.random() * 10) + 1;
                            const unitCost = amount / quantity;

                            const record: CostRecord = {
                                id: `cost_${String(recordId).padStart(6, '0')}`,
                                date: new Date(date.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                                category: categoryId,
                                subcategory: subcategory.id,
                                entityId: vehicleId,
                                entityType: 'VEHICLE',
                                description: `${subcategory.name} para ${vehicleId}`,
                                amount: Math.round(amount * 100) / 100,
                                currency: 'EUR',
                                quantity,
                                unit: subcategory.unit,
                                unitCost: Math.round(unitCost * 100) / 100,
                                vendor: this.getRandomVendor(),
                                invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                                paymentStatus: this.getRandomPaymentStatus(),
                                metadata: {
                                    createdBy: 'Sistema Automático',
                                    organizationId: 'bomberos-madrid',
                                    tags: [categoryId, subcategory.id, vehicleId],
                                    notes: `Registro automático generado para ${subcategory.name}`
                                }
                            };

                            this.costRecords.set(record.id, record);
                            recordId++;
                        }
                    });
                });
            });
        }

        logger.info(`💰 Generados ${this.costRecords.size} registros de costos de ejemplo`);
    }

    /**
     * Genera análisis de ejemplo
     */
    private generateSampleAnalyses(): void {
        const vehicles = ['DOBACK022', 'DOBACK023', 'DOBACK024', 'DOBACK025', 'DOBACK027', 'DOBACK028'];

        vehicles.forEach(vehicleId => {
            const analysis = this.generateVehicleCostAnalysis(vehicleId);
            this.costAnalyses.set(analysis.id, analysis);
        });

        logger.info(`💰 Generados ${vehicles.length} análisis de costos de vehículos`);
    }

    /**
     * Genera análisis de costos para un vehículo
     */
    private generateVehicleCostAnalysis(vehicleId: string): CostAnalysis {
        const id = `analysis_${vehicleId}_${Date.now()}`;
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás

        // Obtener registros del vehículo para el período
        const vehicleRecords = Array.from(this.costRecords.values())
            .filter(record => record.entityId === vehicleId && record.date >= startDate);

        // Calcular totales por categoría
        const byCategory: { [category: string]: number } = {};
        const bySubcategory: { [subcategory: string]: number } = {};
        let totalCosts = 0;

        vehicleRecords.forEach(record => {
            byCategory[record.category] = (byCategory[record.category] || 0) + record.amount;
            bySubcategory[record.subcategory] = (bySubcategory[record.subcategory] || 0) + record.amount;
            totalCosts += record.amount;
        });

        // Generar datos mensuales
        const byMonth = this.generateMonthlyCosts(vehicleRecords);

        // Calcular tendencias
        const previousPeriod = this.getPreviousPeriodCosts(vehicleId, startDate);
        const change = previousPeriod > 0 ? ((totalCosts - previousPeriod) / previousPeriod) * 100 : 0;

        const analysis: CostAnalysis = {
            id,
            title: `Análisis de Costos - ${vehicleId}`,
            type: 'VEHICLE',
            entityId: vehicleId,
            entityName: `Vehículo ${vehicleId}`,
            period: {
                start: startDate,
                end: now
            },
            analysis: {
                totalCosts: Math.round(totalCosts * 100) / 100,
                byCategory,
                bySubcategory,
                byMonth,
                trends: {
                    total: totalCosts,
                    change: Math.round(change * 100) / 100,
                    direction: change > 5 ? 'INCREASING' : change < -5 ? 'DECREASING' : 'STABLE'
                },
                benchmarks: {
                    budget: Math.round(totalCosts * 1.1), // 10% más que lo actual
                    actual: totalCosts,
                    variance: Math.round(((totalCosts - totalCosts * 1.1) / (totalCosts * 1.1)) * 100 * 100) / 100,
                    previousPeriod,
                    industry: Math.round(totalCosts * 1.2) // 20% más que lo actual
                },
                costPerIncident: Math.round((totalCosts / 15) * 100) / 100, // Asumiendo 15 incidentes
                costPerHour: Math.round((totalCosts / 720) * 100) / 100, // 720 horas en 30 días
                costPerKm: Math.round((totalCosts / 2000) * 100) / 100 // Asumiendo 2000 km
            },
            insights: this.generateCostInsights(byCategory, totalCosts, change),
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
     * Genera datos de costos mensuales
     */
    private generateMonthlyCosts(records: CostRecord[]): Array<{
        month: string;
        total: number;
        byCategory: { [category: string]: number };
    }> {
        const monthlyData: { [month: string]: { total: number; byCategory: { [category: string]: number } } } = {};

        records.forEach(record => {
            const month = record.date.toISOString().substr(0, 7); // YYYY-MM

            if (!monthlyData[month]) {
                monthlyData[month] = { total: 0, byCategory: {} };
            }

            monthlyData[month].total += record.amount;
            monthlyData[month].byCategory[record.category] = (monthlyData[month].byCategory[record.category] || 0) + record.amount;
        });

        return Object.entries(monthlyData).map(([month, data]) => ({
            month,
            total: Math.round(data.total * 100) / 100,
            byCategory: data.byCategory
        })).sort((a, b) => a.month.localeCompare(b.month));
    }

    /**
     * Obtiene costos del período anterior
     */
    private getPreviousPeriodCosts(vehicleId: string, startDate: Date): number {
        const previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const previousRecords = Array.from(this.costRecords.values())
            .filter(record =>
                record.entityId === vehicleId &&
                record.date >= previousStartDate &&
                record.date < startDate
            );

        return previousRecords.reduce((total, record) => total + record.amount, 0);
    }

    /**
     * Genera insights de costos
     */
    private generateCostInsights(
        byCategory: { [category: string]: number },
        totalCosts: number,
        change: number
    ): {
        costDrivers: Array<{
            category: string;
            amount: number;
            percentage: number;
            trend: 'INCREASING' | 'DECREASING' | 'STABLE';
        }>;
        opportunities: string[];
        risks: string[];
        recommendations: string[];
    } {
        const costDrivers = Object.entries(byCategory)
            .map(([category, amount]) => ({
                category,
                amount: Math.round(amount * 100) / 100,
                percentage: Math.round((amount / totalCosts) * 100 * 100) / 100,
                trend: Math.random() > 0.5 ? 'INCREASING' : Math.random() > 0.5 ? 'DECREASING' : 'STABLE'
            }))
            .sort((a, b) => b.amount - a.amount);

        const opportunities: string[] = [];
        const risks: string[] = [];
        const recommendations: string[] = [];

        // Analizar drivers de costos
        costDrivers.forEach(driver => {
            if (driver.percentage > 30) {
                opportunities.push(`Optimizar costos de ${driver.category} (${driver.percentage}% del total)`);
            }

            if (driver.trend === 'INCREASING' && driver.percentage > 20) {
                risks.push(`Aumento significativo en costos de ${driver.category}`);
            }
        });

        // Generar recomendaciones basadas en el cambio
        if (change > 10) {
            recommendations.push('Implementar medidas de control de costos');
            recommendations.push('Revisar presupuesto asignado');
        } else if (change < -10) {
            recommendations.push('Mantener eficiencia actual');
            recommendations.push('Identificar factores de reducción de costos');
        } else {
            recommendations.push('Mantener estabilidad en costos');
            recommendations.push('Buscar oportunidades de optimización');
        }

        return {
            costDrivers,
            opportunities,
            risks,
            recommendations
        };
    }

    /**
     * Obtiene un proveedor aleatorio
     */
    private getRandomVendor(): string {
        const vendors = [
            'Proveedor A', 'Proveedor B', 'Proveedor C', 'Proveedor D', 'Proveedor E',
            'Taller Madrid', 'Suministros Bomberos', 'Equipos de Emergencia', 'Combustibles SL'
        ];
        return vendors[Math.floor(Math.random() * vendors.length)];
    }

    /**
     * Obtiene un estado de pago aleatorio
     */
    private getRandomPaymentStatus(): CostRecord['paymentStatus'] {
        const statuses: CostRecord['paymentStatus'][] = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
        const weights = [0.2, 0.7, 0.08, 0.02]; // 70% pagados, 20% pendientes, etc.

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < statuses.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return statuses[i];
            }
        }

        return 'PAID';
    }

    /**
     * Genera análisis de costos operativos
     */
    async generateCostAnalysis(
        type: 'VEHICLE' | 'PERSONNEL' | 'ZONE' | 'DEPARTMENT' | 'ORGANIZATION',
        entityId: string,
        period: { start: Date; end: Date }
    ): Promise<CostAnalysis> {
        const id = `analysis_${type.toLowerCase()}_${entityId}_${Date.now()}`;

        let analysis: CostAnalysis;

        switch (type) {
            case 'VEHICLE':
                analysis = this.generateVehicleCostAnalysis(entityId);
                break;
            case 'PERSONNEL':
                analysis = this.generatePersonnelCostAnalysis(entityId);
                break;
            case 'ZONE':
                analysis = this.generateZoneCostAnalysis(entityId);
                break;
            case 'DEPARTMENT':
                analysis = this.generateDepartmentCostAnalysis(entityId);
                break;
            case 'ORGANIZATION':
                analysis = this.generateOrganizationCostAnalysis(entityId);
                break;
            default:
                throw new Error(`Tipo de análisis no soportado: ${type}`);
        }

        analysis.period = period;
        this.costAnalyses.set(id, analysis);

        this.emit('analysisGenerated', analysis);

        logger.info(`💰 Análisis de costos operativos generado: ${id}`);
        return analysis;
    }

    /**
     * Genera análisis de costos de personal
     */
    private generatePersonnelCostAnalysis(personnelId: string): CostAnalysis {
        const id = `analysis_personnel_${personnelId}_${Date.now()}`;
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Simular costos de personal
        const totalCosts = Math.floor(Math.random() * 5000) + 3000;

        return {
            id,
            title: `Análisis de Costos - Personal ${personnelId}`,
            type: 'PERSONNEL',
            entityId: personnelId,
            entityName: `Personal ${personnelId}`,
            period: { start: startDate, end: now },
            analysis: {
                totalCosts,
                byCategory: {
                    'personnel': totalCosts * 0.8,
                    'training': totalCosts * 0.1,
                    'equipment': totalCosts * 0.1
                },
                bySubcategory: {
                    'salaries': totalCosts * 0.7,
                    'benefits': totalCosts * 0.1,
                    'training': totalCosts * 0.1,
                    'equipment': totalCosts * 0.1
                },
                byMonth: [],
                trends: {
                    total: totalCosts,
                    change: Math.random() * 20 - 10,
                    direction: 'STABLE'
                },
                benchmarks: {
                    budget: totalCosts * 1.1,
                    actual: totalCosts,
                    variance: -10,
                    previousPeriod: totalCosts * 0.95,
                    industry: totalCosts * 1.15
                },
                costPerIncident: totalCosts / 20,
                costPerHour: totalCosts / 160, // 160 horas al mes
                costPerKm: 0
            },
            insights: {
                costDrivers: [],
                opportunities: ['Optimizar capacitación', 'Mejorar eficiencia'],
                risks: ['Aumento de costos de personal'],
                recommendations: ['Mantener costos actuales', 'Buscar eficiencias']
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
     * Genera análisis de costos de zona
     */
    private generateZoneCostAnalysis(zoneId: string): CostAnalysis {
        const id = `analysis_zone_${zoneId}_${Date.now()}`;
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Simular costos de zona
        const totalCosts = Math.floor(Math.random() * 10000) + 5000;

        return {
            id,
            title: `Análisis de Costos - Zona ${zoneId}`,
            type: 'ZONE',
            entityId: zoneId,
            entityName: `Zona ${zoneId}`,
            period: { start: startDate, end: now },
            analysis: {
                totalCosts,
                byCategory: {
                    'facilities': totalCosts * 0.4,
                    'personnel': totalCosts * 0.3,
                    'fuel': totalCosts * 0.2,
                    'maintenance': totalCosts * 0.1
                },
                bySubcategory: {
                    'rent': totalCosts * 0.3,
                    'utilities': totalCosts * 0.1,
                    'salaries': totalCosts * 0.3,
                    'diesel': totalCosts * 0.2,
                    'preventive': totalCosts * 0.1
                },
                byMonth: [],
                trends: {
                    total: totalCosts,
                    change: Math.random() * 20 - 10,
                    direction: 'STABLE'
                },
                benchmarks: {
                    budget: totalCosts * 1.1,
                    actual: totalCosts,
                    variance: -10,
                    previousPeriod: totalCosts * 0.95,
                    industry: totalCosts * 1.15
                },
                costPerIncident: totalCosts / 25,
                costPerHour: totalCosts / 720,
                costPerKm: totalCosts / 5000
            },
            insights: {
                costDrivers: [],
                opportunities: ['Optimizar instalaciones', 'Mejorar eficiencia operativa'],
                risks: ['Aumento de costos de combustible'],
                recommendations: ['Mantener eficiencia actual', 'Buscar optimizaciones']
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
     * Genera análisis de costos de departamento
     */
    private generateDepartmentCostAnalysis(departmentId: string): CostAnalysis {
        const id = `analysis_department_${departmentId}_${Date.now()}`;
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Simular costos de departamento
        const totalCosts = Math.floor(Math.random() * 50000) + 30000;

        return {
            id,
            title: `Análisis de Costos - Departamento ${departmentId}`,
            type: 'DEPARTMENT',
            entityId: departmentId,
            entityName: `Departamento ${departmentId}`,
            period: { start: startDate, end: now },
            analysis: {
                totalCosts,
                byCategory: {
                    'personnel': totalCosts * 0.5,
                    'facilities': totalCosts * 0.2,
                    'equipment': totalCosts * 0.15,
                    'fuel': totalCosts * 0.1,
                    'maintenance': totalCosts * 0.05
                },
                bySubcategory: {
                    'salaries': totalCosts * 0.4,
                    'benefits': totalCosts * 0.1,
                    'rent': totalCosts * 0.15,
                    'utilities': totalCosts * 0.05,
                    'purchase': totalCosts * 0.15,
                    'diesel': totalCosts * 0.1,
                    'preventive': totalCosts * 0.05
                },
                byMonth: [],
                trends: {
                    total: totalCosts,
                    change: Math.random() * 20 - 10,
                    direction: 'STABLE'
                },
                benchmarks: {
                    budget: totalCosts * 1.1,
                    actual: totalCosts,
                    variance: -10,
                    previousPeriod: totalCosts * 0.95,
                    industry: totalCosts * 1.15
                },
                costPerIncident: totalCosts / 100,
                costPerHour: totalCosts / 720,
                costPerKm: totalCosts / 20000
            },
            insights: {
                costDrivers: [],
                opportunities: ['Optimizar recursos', 'Mejorar eficiencia departamental'],
                risks: ['Aumento de costos operativos'],
                recommendations: ['Mantener eficiencia actual', 'Buscar optimizaciones departamentales']
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
     * Genera análisis de costos de organización
     */
    private generateOrganizationCostAnalysis(organizationId: string): CostAnalysis {
        const id = `analysis_organization_${organizationId}_${Date.now()}`;
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Simular costos de organización
        const totalCosts = Math.floor(Math.random() * 200000) + 150000;

        return {
            id,
            title: `Análisis de Costos - Organización ${organizationId}`,
            type: 'ORGANIZATION',
            entityId: organizationId,
            entityName: `Organización ${organizationId}`,
            period: { start: startDate, end: now },
            analysis: {
                totalCosts,
                byCategory: {
                    'personnel': totalCosts * 0.4,
                    'facilities': totalCosts * 0.2,
                    'equipment': totalCosts * 0.15,
                    'fuel': totalCosts * 0.15,
                    'maintenance': totalCosts * 0.1
                },
                bySubcategory: {
                    'salaries': totalCosts * 0.3,
                    'benefits': totalCosts * 0.1,
                    'rent': totalCosts * 0.15,
                    'utilities': totalCosts * 0.05,
                    'purchase': totalCosts * 0.15,
                    'diesel': totalCosts * 0.15,
                    'preventive': totalCosts * 0.1
                },
                byMonth: [],
                trends: {
                    total: totalCosts,
                    change: Math.random() * 20 - 10,
                    direction: 'STABLE'
                },
                benchmarks: {
                    budget: totalCosts * 1.1,
                    actual: totalCosts,
                    variance: -10,
                    previousPeriod: totalCosts * 0.95,
                    industry: totalCosts * 1.15
                },
                costPerIncident: totalCosts / 500,
                costPerHour: totalCosts / 720,
                costPerKm: totalCosts / 100000
            },
            insights: {
                costDrivers: [],
                opportunities: ['Optimización organizacional', 'Mejora de eficiencia general'],
                risks: ['Aumento de costos operativos'],
                recommendations: ['Mantener eficiencia actual', 'Buscar optimizaciones organizacionales']
            },
            metadata: {
                generatedAt: now,
                generatedBy: 'Sistema Automático',
                organizationId: 'bomberos-madrid',
                dataQuality: 98,
                lastUpdated: now
            }
        };
    }

    /**
     * Obtiene todas las categorías de costos
     */
    getAllCostCategories(): CostCategory[] {
        return Array.from(this.costCategories.values());
    }

    /**
     * Obtiene todos los registros de costos
     */
    getAllCostRecords(): CostRecord[] {
        return Array.from(this.costRecords.values());
    }

    /**
     * Obtiene todos los análisis de costos
     */
    getAllCostAnalyses(): CostAnalysis[] {
        return Array.from(this.costAnalyses.values());
    }

    /**
     * Obtiene un análisis específico
     */
    getCostAnalysis(analysisId: string): CostAnalysis | undefined {
        return this.costAnalyses.get(analysisId);
    }

    /**
     * Obtiene estadísticas del servicio
     */
    getStats() {
        const records = Array.from(this.costRecords.values());
        const analyses = Array.from(this.costAnalyses.values());

        return {
            totalRecords: records.length,
            totalAnalyses: analyses.length,
            totalCosts: records.reduce((sum, record) => sum + record.amount, 0),
            byCategory: this.getCostsByCategory(records),
            byEntity: this.getCostsByEntity(records),
            byPaymentStatus: this.getCostsByPaymentStatus(records),
            averageCostPerRecord: records.length > 0 ? records.reduce((sum, record) => sum + record.amount, 0) / records.length : 0,
            lastRecord: records.length > 0 ? Math.max(...records.map(r => r.date.getTime())) : null
        };
    }

    /**
     * Obtiene costos por categoría
     */
    private getCostsByCategory(records: CostRecord[]): { [category: string]: number } {
        const byCategory: { [category: string]: number } = {};

        records.forEach(record => {
            byCategory[record.category] = (byCategory[record.category] || 0) + record.amount;
        });

        return byCategory;
    }

    /**
     * Obtiene costos por entidad
     */
    private getCostsByEntity(records: CostRecord[]): { [entityId: string]: number } {
        const byEntity: { [entityId: string]: number } = {};

        records.forEach(record => {
            byEntity[record.entityId] = (byEntity[record.entityId] || 0) + record.amount;
        });

        return byEntity;
    }

    /**
     * Obtiene costos por estado de pago
     */
    private getCostsByPaymentStatus(records: CostRecord[]): { [status: string]: number } {
        const byStatus: { [status: string]: number } = {};

        records.forEach(record => {
            byStatus[record.paymentStatus] = (byStatus[record.paymentStatus] || 0) + record.amount;
        });

        return byStatus;
    }
}

export const operationalCostsService = new OperationalCostsService();
