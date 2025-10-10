import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AICacheService } from './AICacheService';

const prisma = new PrismaClient();

interface AIAnalysis {
    insights: any[];
    recommendations: any[];
    patterns: any[];
    statistics: any;
}

export class AIService {
    async analyzeStabilityData(organizationId: string, days: number = 30): Promise<AIAnalysis> {
        try {
            // OPTIMIZACIÓN: Verificar caché primero
            const cacheKey = { days };
            const cachedData = await AICacheService.getFromCache(organizationId, 'stability_analysis', cacheKey);
            if (cachedData) {
                logger.info('Retornando análisis de estabilidad desde caché', { organizationId, days });
                return cachedData;
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // OPTIMIZACIÓN: Usar datos ya procesados y agregaciones de la BD
            const sessions = await prisma.session.findMany({
                where: {
                    organizationId,
                    startTime: { gte: startDate }
                },
                include: {
                    vehicle: true,
                    stability_events: {
                        select: {
                            id: true,
                            type: true,
                            severity: true,
                            timestamp: true,
                            location: true,
                            description: true
                        }
                    },
                    stabilityMeasurements: {
                        select: {
                            isDRSHigh: true,
                            isLTRCritical: true,
                            isLateralGForceHigh: true,
                            timestamp: true
                        }
                    },
                    gpsMeasurements: {
                        select: {
                            latitude: true,
                            longitude: true,
                            speed: true,
                            timestamp: true
                        }
                    },
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            gpsMeasurements: true
                        }
                    }
                },
                orderBy: { startTime: 'desc' }
            });

            // OPTIMIZACIÓN: Usar solo los campos necesarios para análisis
            const stabilityEvents = await prisma.stabilityEvent.findMany({
                where: {
                    Session: {
                        organizationId
                    },
                    timestamp: { gte: startDate }
                },
                select: {
                    id: true,
                    type: true,
                    severity: true,
                    timestamp: true,
                    location: true,
                    description: true,
                    Session: {
                        select: {
                            id: true,
                            vehicleId: true,
                            vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    licensePlate: true
                                }
                            }
                        }
                    }
                }
            });

            const patterns = this.detectPatterns(stabilityEvents);
            const insights = this.generateInsights(sessions, stabilityEvents);
            const generalRecommendations = this.generateRecommendations(patterns, insights, organizationId);
            const vehicleSpecificRecommendations = await this.generateVehicleSpecificRecommendations(organizationId);
            const recommendations = [...generalRecommendations, ...vehicleSpecificRecommendations];

            // OPTIMIZACIÓN: Estadísticas más detalladas usando datos procesados
            const criticalEvents = stabilityEvents.filter(e =>
                e.type === 'CURVA_PELIGROSA' ||
                e.type === 'FRENADA_BRUSCA' ||
                e.severity === 'CRITICAL' ||
                e.severity === 'HIGH'
            );

            const eventsBySeverity = stabilityEvents.reduce((acc, event) => {
                acc[event.severity] = (acc[event.severity] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const eventsByType = stabilityEvents.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const totalMeasurements = sessions.reduce((sum, session) =>
                sum + session._count.stabilityMeasurements + session._count.gpsMeasurements, 0
            );

            const vehiclesWithEvents = new Set(stabilityEvents.map(e => e.Session.vehicleId));
            const activeVehicles = new Set(sessions.map(s => s.vehicleId));

            const statistics = {
                totalSessions: sessions.length,
                totalEvents: stabilityEvents.length,
                totalMeasurements,
                avgEventsPerSession: sessions.length > 0 ? stabilityEvents.length / sessions.length : 0,
                criticalEvents: criticalEvents.length,
                eventsBySeverity,
                eventsByType,
                activeVehicles: activeVehicles.size,
                vehiclesWithEvents: vehiclesWithEvents.size,
                riskScore: this.calculateRiskScore(stabilityEvents, sessions.length)
            };

            const result = {
                insights,
                recommendations,
                patterns,
                statistics
            };

            // OPTIMIZACIÓN: Guardar en caché para futuras consultas
            await AICacheService.saveToCache(organizationId, 'stability_analysis', cacheKey, result);

            return result;

        } catch (error) {
            logger.error('Error analizando datos de estabilidad', { error, organizationId });
            throw error;
        }
    }

    async analyzeCriticalEvents(organizationId: string): Promise<any> {
        try {
            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);

            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);

            const recentEvents = await prisma.stabilityEvent.findMany({
                where: {
                    Session: { organizationId },
                    timestamp: { gte: last7Days }
                },
                include: {
                    Session: {
                        include: {
                            vehicle: true
                        }
                    }
                }
            });

            const olderEvents = await prisma.stabilityEvent.findMany({
                where: {
                    Session: { organizationId },
                    timestamp: {
                        gte: last30Days,
                        lt: last7Days
                    }
                }
            });

            const recentCount = recentEvents.length;
            const olderCount = olderEvents.length;
            const trend = recentCount > olderCount ? 'increasing' : recentCount < olderCount ? 'decreasing' : 'stable';
            const changePercent = olderCount > 0 ? ((recentCount - olderCount) / olderCount * 100).toFixed(1) : '0';

            const eventsByType = recentEvents.reduce((acc: any, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {});

            const vehicleEvents = recentEvents.reduce((acc: any, event) => {
                const vehicleId = event.Session.vehicleId;
                const vehicleName = event.Session.vehicle.name;
                if (!acc[vehicleId]) {
                    acc[vehicleId] = { id: vehicleId, name: vehicleName, count: 0 };
                }
                acc[vehicleId].count++;
                return acc;
            }, {});

            const topVehicles = Object.values(vehicleEvents)
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5);

            return {
                summary: {
                    total: recentCount,
                    trend,
                    changePercent: Number(changePercent),
                    period: '7 días'
                },
                eventsByType,
                topVehicles,
                criticalLocations: this.findCriticalLocations(recentEvents)
            };

        } catch (error) {
            logger.error('Error analizando eventos críticos', { error, organizationId });
            throw error;
        }
    }

    async generateChatResponse(organizationId: string, message: string, context?: any): Promise<any> {
        try {
            const lowerMessage = message.toLowerCase();

            let response: any = {
                text: '',
                data: null,
                suggestions: []
            };

            // Análisis específico de vehículo individual
            if (lowerMessage.includes('dobac') || (lowerMessage.includes('vehículo') && (lowerMessage.includes('022') || lowerMessage.includes('027') || lowerMessage.includes('028') || lowerMessage.includes('029')))) {
                const vehicleId = this.extractVehicleId(lowerMessage);
                if (vehicleId) {
                    const vehicleAnalysis = await this.analyzeSpecificVehicle(organizationId, vehicleId);
                    response.text = vehicleAnalysis.text;
                    response.data = vehicleAnalysis.data;
                    response.suggestions = vehicleAnalysis.suggestions;
                } else {
                    response.text = 'Por favor, especifica el vehículo que quieres analizar (ej: "DOBACK022" o "análisis del vehículo DOBACK027").';
                }
            }
            else if (lowerMessage.includes('evento') || lowerMessage.includes('crítico') || lowerMessage.includes('alerta')) {
                const analysis = await this.analyzeCriticalEvents(organizationId);

                if (analysis.summary.total === 0) {
                    response.text = 'No se han registrado eventos críticos en los últimos 7 días. La flota está operando de manera segura.';
                } else {
                    response.text = `Análisis de eventos críticos en los últimos 7 días:\n\n`;
                    response.text += `📊 **Total de eventos:** ${analysis.summary.total}\n`;
                    response.text += `📈 **Tendencia:** ${analysis.summary.trend === 'increasing' ? '↗️ Creciente' : analysis.summary.trend === 'decreasing' ? '↘️ Decreciente' : '➡️ Estable'}\n`;

                    if (analysis.summary.changePercent !== 0) {
                        response.text += `📊 **Cambio:** ${analysis.summary.changePercent > 0 ? '+' : ''}${analysis.summary.changePercent}%\n`;
                    }

                    // Análisis por tipo de evento
                    if (Object.keys(analysis.eventsByType).length > 0) {
                        response.text += `\n🔍 **Tipos de eventos más frecuentes:**\n`;
                        Object.entries(analysis.eventsByType)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .forEach(([type, count]) => {
                                response.text += `• ${type}: ${count} eventos\n`;
                            });
                    }

                    // Vehículos con más eventos
                    if (analysis.topVehicles.length > 0) {
                        response.text += `\n🚗 **Vehículos con mayor incidencia:**\n`;
                        analysis.topVehicles.slice(0, 3).forEach((vehicle: { name: string; count: number }) => {
                            response.text += `• ${vehicle.name}: ${vehicle.count} eventos\n`;
                        });
                    }
                }

                response.data = analysis;

                if (analysis.summary.trend === 'increasing') {
                    response.suggestions.push({
                        id: 'review-driving-patterns',
                        type: 'action',
                        title: 'Revisar patrones de conducción',
                        description: 'Analizar las sesiones con más eventos para identificar causas',
                        priority: 'high',
                        actionable: true,
                        confidence: 90,
                        reasoning: ['Tendencia creciente detectada', 'Requiere atención inmediata'],
                        estimatedImpact: [
                            { metric: 'Eventos críticos', change: -20, direction: 'decrease' }
                        ]
                    });
                }
            }
            else if (lowerMessage.includes('vehículo') || lowerMessage.includes('vehiculo') || lowerMessage.includes('flota')) {
                const vehicles = await prisma.vehicle.findMany({
                    where: { organizationId, active: true },
                    include: {
                        _count: {
                            select: {
                                sessions: {
                                    where: {
                                        startTime: {
                                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                const activeLast7Days = vehicles.filter(v => v._count.sessions > 0).length;

                response.text = `Estado de la flota:\n\n`;
                response.text += `🚗 **Total de vehículos activos:** ${vehicles.length}\n`;
                response.text += `⚡ **Vehículos con actividad (7 días):** ${activeLast7Days}\n`;
                response.text += `📊 **Tasa de actividad:** ${((activeLast7Days / vehicles.length) * 100).toFixed(1)}%\n\n`;

                if (activeLast7Days > 0) {
                    response.text += `🔍 **Vehículos más activos:**\n`;
                    vehicles
                        .filter(v => v._count.sessions > 0)
                        .sort((a, b) => b._count.sessions - a._count.sessions)
                        .slice(0, 3)
                        .forEach(vehicle => {
                            response.text += `• ${vehicle.name}: ${vehicle._count.sessions} sesiones\n`;
                        });
                }

                response.data = {
                    totalVehicles: vehicles.length,
                    activeVehicles: activeLast7Days,
                    activityRate: ((activeLast7Days / vehicles.length) * 100).toFixed(1)
                };

                if (activeLast7Days < vehicles.length * 0.5) {
                    response.suggestions.push({
                        id: 'review-inactive-vehicles',
                        type: 'maintenance',
                        title: 'Revisar vehículos inactivos',
                        description: `${vehicles.length - activeLast7Days} vehículos no han tenido actividad reciente`,
                        priority: 'medium',
                        actionable: true,
                        confidence: 85,
                        reasoning: ['Baja tasa de actividad', 'Posible problema de disponibilidad'],
                        estimatedImpact: [
                            { metric: 'Disponibilidad de flota', change: 15, direction: 'increase' }
                        ]
                    });
                }
            }
            else if (lowerMessage.includes('sesión') || lowerMessage.includes('sesion') || lowerMessage.includes('viaje')) {
                const last7Days = new Date();
                last7Days.setDate(last7Days.getDate() - 7);

                const sessions = await prisma.session.findMany({
                    where: {
                        organizationId,
                        startTime: { gte: last7Days }
                    },
                    include: {
                        vehicle: true,
                        _count: {
                            select: {
                                stabilityMeasurements: true,
                                gpsMeasurements: true
                            }
                        }
                    }
                });

                const avgDuration = sessions.reduce((sum, s) => {
                    if (s.endTime) {
                        return sum + (s.endTime.getTime() - s.startTime.getTime());
                    }
                    return sum;
                }, 0) / sessions.length / 60000;

                response.text = `Análisis de sesiones (últimos 7 días):\n\n`;
                response.text += `📊 **Total de sesiones:** ${sessions.length}\n`;

                if (avgDuration > 0) {
                    response.text += `⏱️ **Duración promedio:** ${avgDuration.toFixed(0)} minutos\n`;
                }

                // Sesiones por vehículo
                const sessionsByVehicle = sessions.reduce((acc: any, session) => {
                    const vehicleName = session.vehicle.name;
                    acc[vehicleName] = (acc[vehicleName] || 0) + 1;
                    return acc;
                }, {});

                if (Object.keys(sessionsByVehicle).length > 0) {
                    response.text += `\n🚗 **Sesiones por vehículo:**\n`;
                    Object.entries(sessionsByVehicle)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .forEach(([vehicle, count]) => {
                            response.text += `• ${vehicle}: ${count} sesiones\n`;
                        });
                }

                response.data = {
                    totalSessions: sessions.length,
                    avgDuration: avgDuration.toFixed(0),
                    sessionsByVehicle
                };

                if (sessions.length === 0) {
                    response.suggestions.push({
                        id: 'check-vehicle-activity',
                        type: 'investigation',
                        title: 'Verificar actividad de vehículos',
                        description: 'No se han registrado sesiones recientes',
                        priority: 'high',
                        actionable: true,
                        confidence: 95,
                        reasoning: ['Falta de actividad reciente', 'Posible problema técnico'],
                        estimatedImpact: [
                            { metric: 'Disponibilidad', change: 25, direction: 'increase' }
                        ]
                    });
                }
            }
            else {
                // Respuesta genérica mejorada con datos específicos
                const analysis = await this.analyzeStabilityData(organizationId, 7);

                response.text = `Análisis general del sistema (últimos 7 días):\n\n`;
                response.text += `📊 **Sesiones procesadas:** ${analysis.statistics.totalSessions}\n`;
                response.text += `⚠️ **Eventos detectados:** ${analysis.statistics.totalEvents}\n`;
                response.text += `🔍 **Patrones identificados:** ${analysis.patterns.length}\n`;
                response.text += `💡 **Recomendaciones generadas:** ${analysis.recommendations.length}\n`;

                if (analysis.statistics.totalEvents > 0) {
                    response.text += `\n📈 **Promedio de eventos por sesión:** ${analysis.statistics.avgEventsPerSession.toFixed(1)}\n`;
                }

                if (analysis.statistics.criticalEvents > 0) {
                    response.text += `🚨 **Eventos críticos:** ${analysis.statistics.criticalEvents}\n`;
                }

                response.text += `🚗 **Vehículos activos:** ${analysis.statistics.activeVehicles}\n`;

                response.data = analysis.statistics;

                // Agregar sugerencias basadas en el análisis
                if (analysis.recommendations.length > 0) {
                    response.suggestions.push(...analysis.recommendations.slice(0, 2));
                }
            }

            return response;

        } catch (error) {
            logger.error('Error generando respuesta de chat', { error, organizationId, message });
            return {
                text: 'Lo siento, ha ocurrido un error al procesar tu pregunta. Por favor, intenta de nuevo.',
                data: null,
                suggestions: []
            };
        }
    }

    private extractVehicleId(message: string): string | null {
        // Extraer ID de vehículo del mensaje - soporte para diferentes formatos
        const patterns = [
            /dobac(\d{3})/i,           // dobac022, dobac027, etc.
            /doback(\d{3})/i,          // doback022, doback027, etc.
            /(\d{3})/                  // 022, 027, etc.
        ];

        for (const pattern of patterns) {
            const matches = message.match(pattern);
            if (matches) {
                const number = matches[1];
                return `DOBACK${number.padStart(3, '0')}`;
            }
        }

        return null;
    }

    private async analyzeSpecificVehicle(organizationId: string, vehicleId: string): Promise<any> {
        try {
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    organizationId,
                    name: vehicleId
                }
            });

            if (!vehicle) {
                return {
                    text: `No se encontró el vehículo ${vehicleId} en la flota.`,
                    data: null,
                    suggestions: []
                };
            }

            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);

            const sessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicle.id,
                    startTime: { gte: last7Days }
                },
                include: {
                    stability_events: true,
                    _count: {
                        select: {
                            stabilityMeasurements: true,
                            gpsMeasurements: true
                        }
                    }
                }
            });

            const events = sessions.flatMap(s => s.stability_events);
            const criticalEvents = events.filter(e => e.type === 'CURVA_PELIGROSA' || e.type === 'FRENADA_BRUSCA');

            let text = `Análisis específico del vehículo ${vehicleId}:\n\n`;
            text += `📊 **Sesiones (7 días):** ${sessions.length}\n`;
            text += `⚠️ **Total de eventos:** ${events.length}\n`;
            text += `🚨 **Eventos críticos:** ${criticalEvents.length}\n`;

            if (events.length > 0) {
                text += `📈 **Eventos por sesión:** ${(events.length / sessions.length).toFixed(1)}\n`;
            }

            // Análisis por tipo de evento
            const eventsByType = events.reduce((acc: Record<string, number>, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {});

            if (Object.keys(eventsByType).length > 0) {
                text += `\n🔍 **Tipos de eventos:**\n`;
                Object.entries(eventsByType)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .forEach(([type, count]) => {
                        text += `• ${type}: ${count} eventos\n`;
                    });
            }

            const suggestions: any[] = [];

            if (criticalEvents.length > 5) {
                suggestions.push({
                    id: 'vehicle-critical-events',
                    type: 'maintenance',
                    title: 'Revisión urgente del vehículo',
                    description: `${vehicleId} presenta ${criticalEvents.length} eventos críticos`,
                    priority: 'high',
                    actionable: true,
                    confidence: 95,
                    reasoning: ['Alto número de eventos críticos', 'Requiere intervención inmediata'],
                    estimatedImpact: [
                        { metric: 'Seguridad', change: 30, direction: 'increase' }
                    ]
                });
            }

            if (events.length / sessions.length > 3) {
                suggestions.push({
                    id: 'vehicle-driving-patterns',
                    type: 'training',
                    title: 'Capacitación específica del conductor',
                    description: 'Revisar técnicas de conducción para este vehículo',
                    priority: 'medium',
                    actionable: true,
                    confidence: 80,
                    reasoning: ['Alta tasa de eventos por sesión', 'Posible problema de conducción'],
                    estimatedImpact: [
                        { metric: 'Eventos por sesión', change: -25, direction: 'decrease' }
                    ]
                });
            }

            return {
                text,
                data: {
                    vehicleId,
                    vehicleName: vehicle.name,
                    sessions: sessions.length,
                    totalEvents: events.length,
                    criticalEvents: criticalEvents.length,
                    eventsByType,
                    avgEventsPerSession: sessions.length > 0 ? (events.length / sessions.length).toFixed(1) : '0'
                },
                suggestions
            };

        } catch (error) {
            logger.error('Error analizando vehículo específico', { error, organizationId, vehicleId });
            return {
                text: 'Error al analizar el vehículo específico.',
                data: null,
                suggestions: []
            };
        }
    }

    private detectPatterns(events: any[]): any[] {
        const patterns: any[] = [];

        if (events.length === 0) return patterns;

        const eventsByHour = events.reduce((acc: any, event) => {
            const hour = new Date(event.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        const peakHours = Object.entries(eventsByHour)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([hour, count]) => ({ hour: Number(hour), count: count as number }));

        if (peakHours.length > 0 && peakHours[0].count > 2) {
            patterns.push({
                id: 'temporal-peak',
                type: 'temporal',
                title: 'Horarios pico de eventos',
                description: 'Los eventos se concentran en las ' + peakHours[0].hour + ':00 horas',
                frequency: peakHours[0].count / events.length,
                confidence: 85,
                data: { peakHours }
            });
        }

        const eventsByType = events.reduce((acc: any, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {});

        const dominantType = Object.entries(eventsByType)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0];

        if (dominantType && (dominantType[1] as number) > events.length * 0.3) {
            patterns.push({
                id: 'dominant-type',
                type: 'categorical',
                title: 'Predominancia de ' + dominantType[0],
                description: 'El ' + (((dominantType[1] as number) / events.length) * 100).toFixed(0) + '% de los eventos son de tipo ' + dominantType[0],
                frequency: (dominantType[1] as number) / events.length,
                confidence: 90,
                data: { type: dominantType[0], count: dominantType[1] }
            });
        }

        const locationClusters = this.findCriticalLocations(events);
        if (locationClusters.length > 0) {
            patterns.push({
                id: 'geographic-hotspot',
                type: 'geographic',
                title: 'Zonas críticas identificadas',
                description: 'Se han detectado ' + locationClusters.length + ' zonas con alta concentración de eventos',
                frequency: 0.8,
                confidence: 80,
                data: { locations: locationClusters }
            });
        }

        return patterns;
    }

    private generateInsights(sessions: any[], events: any[]): any[] {
        const insights: any[] = [];

        if (sessions.length === 0) return insights;

        if (events.length > 0) {
            const avgEventsPerSession = events.length / sessions.length;
            insights.push({
                id: 'event-rate',
                type: 'metric',
                title: 'Tasa de eventos por sesión',
                description: 'Se detectan en promedio ' + avgEventsPerSession.toFixed(1) + ' eventos por sesión',
                severity: avgEventsPerSession > 5 ? 'high' : avgEventsPerSession > 2 ? 'medium' : 'low',
                confidence: 90,
                data: { avgEventsPerSession }
            });
        }

        const vehicleEvents = events.reduce((acc: any, event) => {
            const vehicleId = event.Session.vehicleId;
            acc[vehicleId] = (acc[vehicleId] || 0) + 1;
            return acc;
        }, {});

        const problematicVehicles = Object.entries(vehicleEvents)
            .filter(([_, count]) => (count as number) > 10)
            .length;

        if (problematicVehicles > 0) {
            insights.push({
                id: 'problematic-vehicles',
                type: 'alert',
                title: 'Vehículos con alta incidencia',
                description: problematicVehicles + ' vehículo(s) presentan más de 10 eventos',
                severity: 'high',
                confidence: 95,
                data: { count: problematicVehicles }
            });
        }

        return insights;
    }

    private generateRecommendations(patterns: any[], insights: any[], organizationId?: string): any[] {
        const recommendations: any[] = [];

        const temporalPattern = patterns.find(p => p.id === 'temporal-peak');
        if (temporalPattern) {
            recommendations.push({
                id: 'peak-hours-monitoring',
                type: 'operational',
                title: 'Reforzar monitoreo en horarios pico',
                description: 'Implementar supervisión adicional durante las ' + temporalPattern.data.peakHours[0].hour + ':00 horas',
                priority: 'high',
                actionable: true,
                confidence: 85,
                reasoning: ['Concentración de eventos en horarios específicos', 'Requiere atención preventiva'],
                estimatedImpact: [
                    { metric: 'Eventos críticos', change: -20, direction: 'decrease' }
                ],
                vehicleSpecific: true,
                steps: [
                    'Identificar conductores activos en horarios pico',
                    'Establecer alertas preventivas',
                    'Revisar condiciones de tráfico en esos horarios'
                ]
            });
        }

        const typePattern = patterns.find(p => p.id === 'dominant-type');
        if (typePattern && typePattern.data.type === 'FRENADA_BRUSCA') {
            recommendations.push({
                id: 'brake-training',
                type: 'training',
                title: 'Capacitación en frenado seguro',
                description: 'Se recomienda formación específica en técnicas de frenado preventivo',
                priority: 'medium',
                actionable: true,
                confidence: 80,
                reasoning: ['Predominancia de frenadas bruscas', 'Necesidad de mejora en técnicas de conducción'],
                estimatedImpact: [
                    { metric: 'Frenadas bruscas', change: -30, direction: 'decrease' }
                ],
                steps: [
                    'Organizar sesión de formación',
                    'Revisar casos específicos con conductores',
                    'Establecer objetivos de mejora'
                ]
            });
        }

        const geoPattern = patterns.find(p => p.id === 'geographic-hotspot');
        if (geoPattern) {
            recommendations.push({
                id: 'geofence-critical-zones',
                type: 'safety',
                title: 'Crear geocercas en zonas críticas',
                description: 'Establecer alertas automáticas al circular por zonas de alta incidencia',
                priority: 'high',
                actionable: true,
                confidence: 90,
                reasoning: ['Zonas críticas identificadas', 'Necesidad de alertas preventivas'],
                estimatedImpact: [
                    { metric: 'Eventos en zonas críticas', change: -40, direction: 'decrease' }
                ],
                steps: [
                    'Definir perímetros de zonas críticas',
                    'Configurar alertas de entrada/salida',
                    'Establecer límites de velocidad específicos'
                ]
            });
        }

        const highSeverityInsights = insights.filter(i => i.severity === 'high');
        if (highSeverityInsights.length > 0) {
            recommendations.push({
                id: 'comprehensive-review',
                type: 'review',
                title: 'Revisión integral del sistema',
                description: 'Se detectan múltiples indicadores de atención prioritaria',
                priority: 'high',
                actionable: true,
                confidence: 95,
                reasoning: ['Múltiples indicadores de alta severidad', 'Requiere intervención inmediata'],
                estimatedImpact: [
                    { metric: 'Indicadores críticos', change: -50, direction: 'decrease' }
                ],
                steps: [
                    'Auditoría completa de procedimientos',
                    'Revisión de mantenimiento de vehículos',
                    'Evaluación de formación de conductores'
                ]
            });
        }

        return recommendations;
    }

    async generateVehicleSpecificRecommendations(organizationId: string): Promise<any[]> {
        try {
            const vehicles = await prisma.vehicle.findMany({
                where: { organizationId, active: true },
                include: {
                    sessions: {
                        where: {
                            startTime: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            }
                        },
                        include: {
                            stability_events: true
                        }
                    }
                }
            });

            const recommendations: any[] = [];

            for (const vehicle of vehicles) {
                const events = vehicle.sessions.flatMap(s => s.stability_events);
                const criticalEvents = events.filter(e => e.type === 'CURVA_PELIGROSA' || e.type === 'FRENADA_BRUSCA');
                const eventsByType = events.reduce((acc: Record<string, number>, event) => {
                    acc[event.type] = (acc[event.type] || 0) + 1;
                    return acc;
                }, {});

                // Recomendación por alta incidencia de eventos críticos
                if (criticalEvents.length > 5) {
                    recommendations.push({
                        id: `vehicle-${vehicle.id}-critical-review`,
                        type: 'maintenance',
                        title: `Revisión urgente de ${vehicle.name}`,
                        description: `${vehicle.name} presenta ${criticalEvents.length} eventos críticos en los últimos 7 días. Se requiere revisión inmediata del vehículo y evaluación del conductor.`,
                        priority: 'high',
                        actionable: true,
                        confidence: 95,
                        reasoning: [
                            `Alto número de eventos críticos: ${criticalEvents.length}`,
                            'Requiere intervención inmediata para garantizar seguridad',
                            'Posible problema mecánico o de conducción'
                        ],
                        estimatedImpact: [
                            { metric: 'Seguridad del vehículo', change: 40, direction: 'increase' },
                            { metric: 'Eventos críticos', change: -60, direction: 'decrease' }
                        ],
                        vehicleSpecific: true,
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        steps: [
                            `Programar revisión mecánica completa de ${vehicle.name}`,
                            'Documentar todos los eventos críticos del vehículo',
                            'Evaluar conductor asignado y posibles problemas de conducción',
                            'Implementar monitoreo adicional temporal',
                            'Establecer protocolo de seguimiento post-mantenimiento'
                        ]
                    });
                }

                // Recomendación por tipo de evento predominante
                const dominantEventType = Object.entries(eventsByType)
                    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

                if (dominantEventType && dominantEventType[1] > events.length * 0.4) {
                    const eventType = dominantEventType[0];
                    const count = dominantEventType[1];

                    if (eventType === 'FRENADA_BRUSCA') {
                        recommendations.push({
                            id: `vehicle-${vehicle.id}-brake-training`,
                            type: 'training',
                            title: `Capacitación en frenado seguro para ${vehicle.name}`,
                            description: `${vehicle.name} presenta ${count} eventos de frenadas bruscas (${Math.round((count / events.length) * 100)}% del total). Se recomienda formación específica en técnicas de frenado preventivo.`,
                            priority: 'medium',
                            actionable: true,
                            confidence: 85,
                            reasoning: [
                                `Predominancia de frenadas bruscas: ${count} eventos`,
                                'Necesidad de mejora en técnicas de conducción',
                                'Posible problema de anticipación al volante'
                            ],
                            estimatedImpact: [
                                { metric: 'Frenadas bruscas', change: -35, direction: 'decrease' },
                                { metric: 'Eficiencia de conducción', change: 20, direction: 'increase' }
                            ],
                            vehicleSpecific: true,
                            vehicleId: vehicle.id,
                            vehicleName: vehicle.name,
                            steps: [
                                `Organizar sesión de formación específica para el conductor de ${vehicle.name}`,
                                'Revisar casos específicos de frenadas bruscas del vehículo',
                                'Implementar técnicas de frenado anticipado',
                                'Establecer objetivos de mejora mensuales',
                                'Realizar seguimiento post-formación'
                            ]
                        });
                    }
                }

                // Recomendación por alta tasa de eventos por sesión
                const avgEventsPerSession = vehicle.sessions.length > 0 ? events.length / vehicle.sessions.length : 0;
                if (avgEventsPerSession > 3) {
                    recommendations.push({
                        id: `vehicle-${vehicle.id}-driving-patterns`,
                        type: 'training',
                        title: `Análisis de patrones de conducción de ${vehicle.name}`,
                        description: `${vehicle.name} presenta una tasa alta de eventos por sesión (${avgEventsPerSession.toFixed(1)} eventos/sesión). Se requiere análisis profundo de patrones de conducción y posible reciclaje.`,
                        priority: 'medium',
                        actionable: true,
                        confidence: 80,
                        reasoning: [
                            `Alta tasa de eventos: ${avgEventsPerSession.toFixed(1)} eventos por sesión`,
                            'Posible problema sistémico de conducción',
                            'Necesidad de intervención formativa'
                        ],
                        estimatedImpact: [
                            { metric: 'Eventos por sesión', change: -30, direction: 'decrease' },
                            { metric: 'Calidad de conducción', change: 25, direction: 'increase' }
                        ],
                        vehicleSpecific: true,
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        steps: [
                            `Realizar análisis detallado de patrones de conducción de ${vehicle.name}`,
                            'Identificar causas raíz de la alta incidencia de eventos',
                            'Diseñar programa de reciclaje personalizado',
                            'Implementar monitoreo en tiempo real temporal',
                            'Evaluar resultados y ajustar estrategia'
                        ]
                    });
                }
            }

            return recommendations.sort((a, b) => {
                const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

        } catch (error) {
            logger.error('Error generando recomendaciones específicas de vehículos', { error, organizationId });
            return [];
        }
    }

    async explainSuggestion(organizationId: string, suggestionId: string, context?: any): Promise<any> {
        try {
            // Obtener datos actuales para contextualizar la explicación
            const analysis = await this.analyzeStabilityData(organizationId, 7);
            const criticalEvents = await this.analyzeCriticalEvents(organizationId);

            let explanation = '';
            let detailedSteps: string[] = [];
            let expectedResults: any[] = [];

            switch (suggestionId) {
                case 'review-driving-patterns':
                    explanation = `**Análisis detallado de patrones de conducción:**\n\n`;
                    explanation += `📊 **Situación actual:** Se han detectado ${criticalEvents.summary.total} eventos críticos en los últimos 7 días, con una tendencia ${criticalEvents.summary.trend === 'increasing' ? 'creciente' : 'estable'}.\n\n`;
                    explanation += `🔍 **Análisis de causas:**\n`;
                    explanation += `• Los eventos se concentran principalmente en: ${Object.keys(criticalEvents.eventsByType).slice(0, 2).join(', ')}\n`;
                    explanation += `• Los vehículos más afectados son: ${criticalEvents.topVehicles.slice(0, 2).map((v: any) => v.name).join(', ')}\n\n`;
                    explanation += `💡 **Beneficios de implementar esta sugerencia:**\n`;
                    explanation += `• Reducción estimada del 20% en eventos críticos\n`;
                    explanation += `• Mejora en la seguridad operativa\n`;
                    explanation += `• Optimización de recursos de mantenimiento\n\n`;

                    detailedSteps = [
                        'Revisar sesiones con mayor número de eventos críticos',
                        'Identificar patrones comunes en la conducción',
                        'Analizar condiciones externas (tráfico, clima, rutas)',
                        'Implementar alertas preventivas en tiempo real',
                        'Programar sesiones de capacitación específicas'
                    ];

                    expectedResults = [
                        { metric: 'Eventos críticos', current: criticalEvents.summary.total, expected: Math.round(criticalEvents.summary.total * 0.8) },
                        { metric: 'Tasa de mejora', current: 0, expected: 20 }
                    ];
                    break;

                case 'vehicle-critical-events':
                    explanation = `**Revisión urgente de vehículo con alta incidencia:**\n\n`;
                    explanation += `🚨 **Situación crítica:** Este vehículo presenta un número alarmante de eventos críticos que requiere atención inmediata.\n\n`;
                    explanation += `🔧 **Acciones recomendadas:**\n`;
                    explanation += `• Revisión mecánica completa del sistema de frenos\n`;
                    explanation += `• Inspección de amortiguadores y suspensión\n`;
                    explanation += `• Verificación de neumáticos y presión\n`;
                    explanation += `• Análisis del conductor asignado\n\n`;

                    detailedSteps = [
                        'Programar revisión mecánica inmediata',
                        'Documentar todos los eventos críticos',
                        'Evaluar conductor y posibles problemas de conducción',
                        'Implementar monitoreo adicional temporal',
                        'Establecer protocolo de seguimiento post-mantenimiento'
                    ];

                    expectedResults = [
                        { metric: 'Seguridad del vehículo', current: 30, expected: 80 },
                        { metric: 'Eventos críticos', current: 0, expected: -60 }
                    ];
                    break;

                case 'brake-training':
                    explanation = `**Programa de capacitación en frenado seguro:**\n\n`;
                    explanation += `📚 **Objetivo:** Reducir significativamente los eventos de frenadas bruscas mediante formación especializada.\n\n`;
                    explanation += `🎯 **Contenido del programa:**\n`;
                    explanation += `• Técnicas de frenado anticipado\n`;
                    explanation += `• Manejo en condiciones adversas\n`;
                    explanation += `• Análisis de casos reales del sistema\n`;
                    explanation += `• Simulaciones de situaciones críticas\n\n`;

                    detailedSteps = [
                        'Identificar conductores con mayor incidencia de frenadas bruscas',
                        'Diseñar programa de formación personalizado',
                        'Realizar sesiones teóricas y prácticas',
                        'Implementar seguimiento post-formación',
                        'Evaluar resultados y ajustar programa'
                    ];

                    expectedResults = [
                        { metric: 'Frenadas bruscas', current: 0, expected: -30 },
                        { metric: 'Eficiencia de conducción', current: 0, expected: 15 }
                    ];
                    break;

                default:
                    explanation = `**Explicación detallada de la sugerencia:**\n\n`;
                    explanation += `Esta sugerencia ha sido generada basándose en el análisis de los datos del sistema y los patrones detectados.\n\n`;
                    explanation += `📊 **Contexto actual:**\n`;
                    explanation += `• ${analysis.statistics.totalSessions} sesiones analizadas\n`;
                    explanation += `• ${analysis.statistics.totalEvents} eventos detectados\n`;
                    explanation += `• ${analysis.patterns.length} patrones identificados\n\n`;
                    explanation += `💡 **Implementación recomendada:**\n`;
                    explanation += `Se sugiere seguir los pasos detallados y monitorear los resultados esperados.`;

                    detailedSteps = [
                        'Revisar el análisis completo del sistema',
                        'Identificar recursos necesarios',
                        'Planificar implementación por fases',
                        'Establecer métricas de seguimiento',
                        'Evaluar resultados y ajustar estrategia'
                    ];
            }

            return {
                suggestionId,
                explanation,
                detailedSteps,
                expectedResults,
                implementationTime: '1-2 semanas',
                resourcesNeeded: ['Personal técnico', 'Herramientas de análisis', 'Tiempo de capacitación'],
                successCriteria: 'Reducción del 20% en eventos críticos en 30 días'
            };

        } catch (error) {
            logger.error('Error explicando sugerencia', { error, organizationId, suggestionId });
            return {
                suggestionId,
                explanation: 'Error al generar la explicación detallada de la sugerencia.',
                detailedSteps: [],
                expectedResults: [],
                implementationTime: 'Por determinar',
                resourcesNeeded: [],
                successCriteria: 'Por determinar'
            };
        }
    }

    private findCriticalLocations(events: any[]): any[] {
        if (events.length === 0) return [];

        const clusters: any = {};
        const threshold = 0.001;

        events.forEach(event => {
            const lat = Math.round(event.lat / threshold) * threshold;
            const lon = Math.round(event.lon / threshold) * threshold;
            const key = lat + ',' + lon;

            if (!clusters[key]) {
                clusters[key] = {
                    lat,
                    lon,
                    count: 0,
                    types: {}
                };
            }

            clusters[key].count++;
            clusters[key].types[event.type] = (clusters[key].types[event.type] || 0) + 1;
        });

        return Object.values(clusters)
            .filter((c: any) => c.count >= 3)
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 10);
    }

    async getAIStats(organizationId: string): Promise<any> {
        try {
            const analysis = await this.analyzeStabilityData(organizationId, 30);
            const criticalAnalysis = await this.analyzeCriticalEvents(organizationId);

            return {
                totalSessions: analysis.statistics.totalSessions,
                totalEvents: analysis.statistics.totalEvents,
                patternsDetected: analysis.patterns.length,
                recommendationsGenerated: analysis.recommendations.length,
                insightsGenerated: analysis.insights.length,
                avgEventsPerSession: analysis.statistics.avgEventsPerSession.toFixed(2),
                criticalEventsCount: analysis.statistics.criticalEvents,
                activeVehicles: analysis.statistics.activeVehicles,
                trend: criticalAnalysis.summary.trend,
                trendPercent: criticalAnalysis.summary.changePercent
            };

        } catch (error) {
            logger.error('Error obteniendo estadísticas de IA', { error, organizationId });
            throw error;
        }
    }

    // NUEVO: Método para calcular score de riesgo usando datos procesados
    private calculateRiskScore(events: any[], totalSessions: number): number {
        if (totalSessions === 0) return 0;

        const criticalEvents = events.filter(e =>
            e.severity === 'CRITICAL' || e.type === 'CURVA_PELIGROSA' || e.type === 'FRENADA_BRUSCA'
        ).length;

        const highEvents = events.filter(e => e.severity === 'HIGH').length;
        const mediumEvents = events.filter(e => e.severity === 'MEDIUM').length;

        // Ponderación: Critical=10, High=5, Medium=2, Low=1
        const weightedScore = (criticalEvents * 10) + (highEvents * 5) + (mediumEvents * 2);
        const maxPossibleScore = totalSessions * 10; // Asumiendo máximo 1 evento crítico por sesión

        // Normalizar a escala 0-100
        const riskScore = Math.min(100, (weightedScore / maxPossibleScore) * 100);

        return Math.round(riskScore);
    }

    // NUEVO: Método optimizado para análisis en tiempo real
    async getOptimizedAnalysis(organizationId: string, timeWindow: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
        try {
            // OPTIMIZACIÓN: Verificar caché primero (TTL más corto para análisis en tiempo real)
            const cacheKey = { timeWindow };
            const cachedData = await AICacheService.getFromCache(organizationId, 'optimized_analysis', cacheKey);
            if (cachedData) {
                logger.info('Retornando análisis optimizado desde caché', { organizationId, timeWindow });
                return cachedData;
            }

            const now = new Date();
            let startDate: Date;

            switch (timeWindow) {
                case '1h':
                    startDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            // OPTIMIZACIÓN: Consulta única con agregaciones
            const analysis = await prisma.stabilityEvent.groupBy({
                by: ['type', 'severity'],
                where: {
                    Session: { organizationId },
                    timestamp: { gte: startDate }
                },
                _count: { id: true }
            });

            const totalEvents = analysis.reduce((sum, group) => sum + group._count.id, 0);
            const criticalCount = analysis
                .filter(g => g.severity === 'CRITICAL')
                .reduce((sum, group) => sum + group._count.id, 0);

            const result = {
                timeWindow,
                totalEvents,
                criticalEvents: criticalCount,
                riskLevel: criticalCount > 10 ? 'HIGH' : criticalCount > 5 ? 'MEDIUM' : 'LOW',
                eventsByType: analysis.reduce((acc, group) => {
                    acc[group.type] = (acc[group.type] || 0) + group._count.id;
                    return acc;
                }, {} as Record<string, number>),
                eventsBySeverity: analysis.reduce((acc, group) => {
                    acc[group.severity] = (acc[group.severity] || 0) + group._count.id;
                    return acc;
                }, {} as Record<string, number>)
            };

            // OPTIMIZACIÓN: Guardar en caché (TTL más corto para análisis en tiempo real)
            await AICacheService.saveToCache(organizationId, 'optimized_analysis', cacheKey, result);

            return result;

        } catch (error) {
            logger.error('Error en análisis optimizado', { error, organizationId, timeWindow });
            throw error;
        }
    }
}

export const aiService = new AIService();
