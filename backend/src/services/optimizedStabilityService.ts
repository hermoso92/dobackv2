/**
 * Servicio optimizado de estabilidad con caché inteligente
 * Optimización específica para análisis de estabilidad
 */

import { CacheService } from './CacheService';
import { logger } from '../utils/logger';

// Instancia de cache para estabilidad
const cacheService = new CacheService({ ttl: 5 * 60 * 1000 });

interface StabilityDataPoint {
    timestamp: Date;
    roll: number;
    pitch: number;
    yaw: number;
    speed: number;
    lat: number;
    lng: number;
    sessionId: string;
    vehicleId: string;
}

interface StabilityStats {
    totalSessions: number;
    averageRoll: number;
    averagePitch: number;
    maxRoll: number;
    maxPitch: number;
    criticalEvents: number;
    lastUpdate: Date;
}

interface OptimizedStabilityData {
    sessionId: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    dataPoints: StabilityDataPoint[];
    stats: StabilityStats;
    criticalEvents: CriticalEvent[];
}

interface CriticalEvent {
    id: string;
    timestamp: Date;
    type: 'ROLL_CRITICAL' | 'PITCH_CRITICAL' | 'SPEED_HIGH' | 'MANEUVER_AGGRESSIVE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    roll?: number;
    pitch?: number;
    speed?: number;
    location: {
        lat: number;
        lng: number;
    };
    description: string;
}

class OptimizedStabilityService {
    private stabilityCache: Map<string, OptimizedStabilityData> = new Map();
    private sessionCache: Map<string, string[]> = new Map(); // vehicleId -> sessionIds

    /**
     * Obtiene datos de estabilidad para una sesión específica
     */
    async getStabilityData(sessionId: string, forceRefresh: boolean = false): Promise<OptimizedStabilityData | null> {
        const cacheKey = cacheService.generateKey('stability', sessionId);

        if (!forceRefresh) {
            const cached = cacheService.get<OptimizedStabilityData>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        try {
            // Simulación de datos optimizada
            const stabilityData: OptimizedStabilityData = {
                sessionId,
                vehicleId: 'doback027',
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
                endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
                duration: 60 * 60 * 1000, // 1 hora
                dataPoints: this.generateStabilityDataPoints(sessionId),
                stats: await this.calculateStabilityStats(sessionId),
                criticalEvents: await this.getCriticalEvents(sessionId)
            };

            // Actualizar caché interno
            this.stabilityCache.set(sessionId, stabilityData);

            // Guardar en caché con TTL apropiado
            cacheService.set(cacheKey, stabilityData, CACHE_CONFIG.FREQUENT);

            return stabilityData;

        } catch (error) {
            logger.error('Error obteniendo datos de estabilidad:', error);
            throw error;
        }
    }

    /**
     * Obtiene sesiones de estabilidad para un vehículo
     */
    async getVehicleStabilitySessions(vehicleId: string): Promise<string[]> {
        const cacheKey = cacheService.generateKey('stability-sessions', vehicleId);

        const cached = cacheService.get<string[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Si no está en caché, buscar en caché interno
        const sessions = this.sessionCache.get(vehicleId);
        if (sessions) {
            cacheService.set(cacheKey, sessions, CACHE_CONFIG.STATIC);
            return sessions;
        }

        // Simulación de sesiones para el vehículo
        const sessionIds = [
            `stability_${vehicleId}_${Date.now() - 3 * 60 * 60 * 1000}`,
            `stability_${vehicleId}_${Date.now() - 2 * 60 * 60 * 1000}`,
            `stability_${vehicleId}_${Date.now() - 1 * 60 * 60 * 1000}`,
            `stability_${vehicleId}_${Date.now() - 30 * 60 * 1000}`,
            `stability_${vehicleId}_${Date.now() - 15 * 60 * 1000}`
        ];

        // Actualizar caches
        this.sessionCache.set(vehicleId, sessionIds);
        cacheService.set(cacheKey, sessionIds, CACHE_CONFIG.STATIC);

        return sessionIds;
    }

    /**
     * Obtiene estadísticas generales de estabilidad
     */
    async getGeneralStabilityStats(forceRefresh: boolean = false): Promise<StabilityStats> {
        const cacheKey = 'stability-general-stats';

        if (!forceRefresh) {
            const cached = cacheService.get<StabilityStats>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const stats: StabilityStats = {
            totalSessions: 156,
            averageRoll: 2.3,
            averagePitch: 1.8,
            maxRoll: 15.2,
            maxPitch: 12.7,
            criticalEvents: 23,
            lastUpdate: new Date()
        };

        cacheService.set(cacheKey, stats, CACHE_CONFIG.FREQUENT);
        return stats;
    }

    /**
     * Obtiene eventos críticos con filtros
     */
    async getCriticalEvents(sessionId?: string, severity?: string): Promise<CriticalEvent[]> {
        const cacheKey = cacheService.generateKey('critical-events', sessionId || 'all', severity || 'all');

        const cached = cacheService.get<CriticalEvent[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Simulación de eventos críticos
        const events: CriticalEvent[] = [
            {
                id: 'event_001',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                type: 'ROLL_CRITICAL',
                severity: 'HIGH',
                roll: 12.5,
                location: { lat: 40.4168, lng: -3.7038 },
                description: 'Maniobra brusca detectada en intersección'
            },
            {
                id: 'event_002',
                timestamp: new Date(Date.now() - 45 * 60 * 1000),
                type: 'SPEED_HIGH',
                severity: 'MEDIUM',
                speed: 85,
                location: { lat: 40.4268, lng: -3.7138 },
                description: 'Velocidad excesiva en zona urbana'
            },
            {
                id: 'event_003',
                timestamp: new Date(Date.now() - 60 * 60 * 1000),
                type: 'PITCH_CRITICAL',
                severity: 'CRITICAL',
                pitch: 8.2,
                location: { lat: 40.4068, lng: -3.6938 },
                description: 'Inclinación crítica durante frenado de emergencia'
            }
        ];

        // Filtrar por sesión si se especifica
        const filteredEvents = sessionId
            ? events.filter(event => event.id.includes(sessionId))
            : events;

        // Filtrar por severidad si se especifica
        const finalEvents = severity && severity !== 'all'
            ? filteredEvents.filter(event => event.severity === severity)
            : filteredEvents;

        cacheService.set(cacheKey, finalEvents, CACHE_CONFIG.FREQUENT);
        return finalEvents;
    }

    /**
     * Genera datos de estabilidad simulados
     */
    private generateStabilityDataPoints(sessionId: string): StabilityDataPoint[] {
        const points: StabilityDataPoint[] = [];
        const startTime = Date.now() - 2 * 60 * 60 * 1000;

        for (let i = 0; i < 7200; i += 10) { // Cada 10 segundos por 2 horas
            points.push({
                timestamp: new Date(startTime + i * 1000),
                roll: Math.sin(i / 100) * 5 + Math.random() * 2 - 1,
                pitch: Math.cos(i / 120) * 3 + Math.random() * 1.5 - 0.75,
                yaw: Math.random() * 360,
                speed: 30 + Math.random() * 40,
                lat: 40.4168 + (Math.random() - 0.5) * 0.01,
                lng: -3.7038 + (Math.random() - 0.5) * 0.01,
                sessionId,
                vehicleId: 'doback027'
            });
        }

        return points;
    }

    /**
     * Calcula estadísticas de estabilidad para una sesión
     */
    private async calculateStabilityStats(sessionId: string): Promise<StabilityStats> {
        const data = await this.getStabilityData(sessionId);
        if (!data) {
            throw new Error('No se encontraron datos de estabilidad');
        }

        const rolls = data.dataPoints.map(p => p.roll);
        const pitches = data.dataPoints.map(p => p.pitch);

        return {
            totalSessions: 1,
            averageRoll: rolls.reduce((a, b) => a + b, 0) / rolls.length,
            averagePitch: pitches.reduce((a, b) => a + b, 0) / pitches.length,
            maxRoll: Math.max(...rolls),
            maxPitch: Math.max(...pitches),
            criticalEvents: data.criticalEvents.length,
            lastUpdate: new Date()
        };
    }

    /**
     * Compara dos sesiones de estabilidad
     */
    async compareStabilitySessions(sessionId1: string, sessionId2: string): Promise<{
        session1: OptimizedStabilityData;
        session2: OptimizedStabilityData;
        comparison: {
            rollDifference: number;
            pitchDifference: number;
            eventsDifference: number;
            durationDifference: number;
        };
    }> {
        const [session1, session2] = await Promise.all([
            this.getStabilityData(sessionId1),
            this.getStabilityData(sessionId2)
        ]);

        if (!session1 || !session2) {
            throw new Error('Una o ambas sesiones no fueron encontradas');
        }

        const comparison = {
            rollDifference: session1.stats.averageRoll - session2.stats.averageRoll,
            pitchDifference: session1.stats.averagePitch - session2.stats.averagePitch,
            eventsDifference: session1.stats.criticalEvents - session2.stats.criticalEvents,
            durationDifference: session1.duration - session2.duration
        };

        return { session1, session2, comparison };
    }

    /**
     * Limpia caches específicos de estabilidad
     */
    clearStabilityCache(): void {
        // Limpiar caché interno
        this.stabilityCache.clear();
        this.sessionCache.clear();

        // Limpiar caché externo
        const keys = [
            'stability-general-stats'
        ];

        keys.forEach(key => cacheService.delete(key));
    }

    /**
     * Obtiene métricas de rendimiento del servicio
     */
    getPerformanceMetrics() {
        return {
            stabilityCacheSize: this.stabilityCache.size,
            sessionCacheSize: this.sessionCache.size,
            cacheStats: cacheService.getStats()
        };
    }
}

export const optimizedStabilityService = new OptimizedStabilityService();
export default optimizedStabilityService;
