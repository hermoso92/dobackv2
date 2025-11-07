import axios from 'axios';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface GoogleSpeedLimitResult {
    speedLimit: number;
    confidence: 'high' | 'medium' | 'low';
    source: 'google' | 'cache' | 'default';
    roadType: 'urban' | 'interurban' | 'highway';
    placeId?: string;
    snappedLat?: number;
    snappedLon?: number;
}

export interface SnappedPoint {
    latitude: number;
    longitude: number;
    originalIndex: number;
    placeId: string;
}

export class GoogleRoadsService {
    private readonly GOOGLE_ROADS_API_KEY = process.env.GOOGLE_ROADS_API_KEY || process.env.GOOGLE_API_KEY || '';
    private readonly SNAP_TO_ROADS_URL = 'https://roads.googleapis.com/v1/snapToRoads';
    private readonly SPEED_LIMITS_URL = 'https://roads.googleapis.com/v1/speedLimits';
    private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hora
    private readonly MAX_POINTS_PER_REQUEST = 100; // Límite de Google API

    /**
     * Obtiene el límite de velocidad para un punto GPS usando Google Roads API
     * 
     * Flujo:
     * 1. Snap to Roads: Corrige GPS a carretera más cercana
     * 2. Speed Limits: Obtiene límite legal de esa carretera
     * 3. Cache: Guarda resultado para reutilizar
     */
    async getSpeedLimit(
        lat: number,
        lon: number,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<GoogleSpeedLimitResult> {
        // 1. Intentar obtener de caché primero
        const cached = await this.getFromCache(lat, lon);
        if (cached && this.isCacheValid(cached)) {
            logger.debug(`📍 [Google] Límite desde caché: ${cached.speed_limit} km/h`);
            return {
                speedLimit: cached.speed_limit,
                confidence: 'high',
                source: 'cache',
                roadType: cached.road_type as any,
                placeId: cached.place_id || undefined,
            };
        }

        // 2. Verificar que tengamos API key
        if (!this.GOOGLE_ROADS_API_KEY) {
            logger.warn('⚠️ Google Roads API key no configurada, usando valores por defecto');
            return this.getDefaultSpeedLimit(vehicleType);
        }

        try {
            // 3. Snap to Roads: Corregir GPS a la vía más cercana
            const snappedPoint = await this.snapToRoad(lat, lon);

            if (!snappedPoint) {
                logger.warn(`⚠️ No se pudo hacer snap to road para ${lat},${lon}`);
                return this.getDefaultSpeedLimit(vehicleType);
            }

            logger.debug(`📍 [Google] Punto corregido: ${snappedPoint.latitude},${snappedPoint.longitude} (placeId: ${snappedPoint.placeId})`);

            // 4. Obtener límite de velocidad usando placeId
            const speedLimit = await this.getSpeedLimitByPlaceId(snappedPoint.placeId);

            if (!speedLimit) {
                logger.warn(`⚠️ No se pudo obtener límite para placeId: ${snappedPoint.placeId}`);
                return this.getDefaultSpeedLimit(vehicleType);
            }

            // 5. Determinar tipo de vía según el límite
            const roadType = this.determineRoadType(speedLimit);

            // 6. Guardar en caché
            await this.saveToCache(
                snappedPoint.latitude,
                snappedPoint.longitude,
                speedLimit,
                roadType,
                snappedPoint.placeId
            );

            logger.info(`✅ [Google] Límite obtenido: ${speedLimit} km/h (${roadType})`);

            return {
                speedLimit,
                confidence: 'high',
                source: 'google',
                roadType,
                placeId: snappedPoint.placeId,
                snappedLat: snappedPoint.latitude,
                snappedLon: snappedPoint.longitude,
            };
        } catch (error: any) {
            logger.error(`❌ [Google] Error al obtener límite de velocidad: ${error.message}`);
            return this.getDefaultSpeedLimit(vehicleType);
        }
    }

    /**
     * Snap to Roads: Corrige un punto GPS a la carretera más cercana
     */
    private async snapToRoad(lat: number, lon: number): Promise<SnappedPoint | null> {
        try {
            const url = `${this.SNAP_TO_ROADS_URL}?path=${lat},${lon}&interpolate=false&key=${this.GOOGLE_ROADS_API_KEY}`;

            logger.debug(`🌐 [Google] Snap to Roads request: ${lat},${lon}`);

            const response = await axios.get(url, {
                timeout: 5000,
            });

            if (!response.data.snappedPoints || response.data.snappedPoints.length === 0) {
                logger.warn('⚠️ [Google] Snap to Roads no devolvió puntos');
                return null;
            }

            const snapped = response.data.snappedPoints[0];

            return {
                latitude: snapped.location.latitude,
                longitude: snapped.location.longitude,
                originalIndex: snapped.originalIndex || 0,
                placeId: snapped.placeId,
            };
        } catch (error: any) {
            if (error.response?.status === 403) {
                logger.error('❌ [Google] API key inválida o sin permisos para Roads API');
            } else if (error.response?.status === 429) {
                logger.error('❌ [Google] Rate limit excedido');
            } else {
                logger.error(`❌ [Google] Error en Snap to Roads: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Obtiene el límite de velocidad usando un placeId
     */
    private async getSpeedLimitByPlaceId(placeId: string): Promise<number | null> {
        try {
            const url = `${this.SPEED_LIMITS_URL}?placeId=${placeId}&key=${this.GOOGLE_ROADS_API_KEY}`;

            logger.debug(`🌐 [Google] Speed Limits request para placeId: ${placeId}`);

            const response = await axios.get(url, {
                timeout: 5000,
            });

            if (!response.data.speedLimits || response.data.speedLimits.length === 0) {
                logger.warn('⚠️ [Google] Speed Limits no devolvió datos');
                return null;
            }

            const speedLimitData = response.data.speedLimits[0];

            // Google devuelve en diferentes unidades según el país
            let speedLimit = speedLimitData.speedLimit;

            // Si es MPH (millas), convertir a KPH
            if (speedLimitData.units === 'MPH') {
                speedLimit = Math.round(speedLimit * 1.60934);
                logger.debug(`🔄 Convertido de ${speedLimitData.speedLimit} MPH a ${speedLimit} KPH`);
            }

            return speedLimit;
        } catch (error: any) {
            if (error.response?.status === 403) {
                logger.error('❌ [Google] API key inválida o sin permisos para Speed Limits');
            } else if (error.response?.status === 429) {
                logger.error('❌ [Google] Rate limit excedido');
            } else {
                logger.error(`❌ [Google] Error en Speed Limits: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Batch processing: Obtiene límites para múltiples puntos de una vez
     * (Optimización: hasta 100 puntos por request)
     */
    async getBatchSpeedLimits(
        points: Array<{ lat: number; lon: number }>,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<GoogleSpeedLimitResult[]> {
        if (points.length === 0) {
            return [];
        }

        // Dividir en chunks de 100 puntos (límite de Google API)
        const chunks = this.chunkArray(points, this.MAX_POINTS_PER_REQUEST);
        const results: GoogleSpeedLimitResult[] = [];

        for (const chunk of chunks) {
            const chunkResults = await this.processBatch(chunk, vehicleType);
            results.push(...chunkResults);
        }

        return results;
    }

    /**
     * Procesa un batch de puntos
     */
    private async processBatch(
        points: Array<{ lat: number; lon: number }>,
        vehicleType: string
    ): Promise<GoogleSpeedLimitResult[]> {
        try {
            // 1. Snap all points to roads
            const path = points.map(p => `${p.lat},${p.lon}`).join('|');
            const snapUrl = `${this.SNAP_TO_ROADS_URL}?path=${path}&interpolate=false&key=${this.GOOGLE_ROADS_API_KEY}`;

            logger.debug(`🌐 [Google] Batch Snap to Roads: ${points.length} puntos`);

            const snapResponse = await axios.get(snapUrl, { timeout: 10000 });
            const snappedPoints: SnappedPoint[] = (snapResponse.data.snappedPoints || []).map((p: any) => ({
                latitude: p.location.latitude,
                longitude: p.location.longitude,
                originalIndex: p.originalIndex,
                placeId: p.placeId,
            }));

            if (snappedPoints.length === 0) {
                logger.warn('⚠️ [Google] Batch snap no devolvió puntos');
                return points.map(() => this.getDefaultSpeedLimit(vehicleType));
            }

            // 2. Get speed limits for all placeIds
            const placeIds = snappedPoints.map(p => p.placeId).join('&placeId=');
            const speedUrl = `${this.SPEED_LIMITS_URL}?placeId=${placeIds}&key=${this.GOOGLE_ROADS_API_KEY}`;

            logger.debug(`🌐 [Google] Batch Speed Limits: ${snappedPoints.length} placeIds`);

            const speedResponse = await axios.get(speedUrl, { timeout: 10000 });
            const speedLimits = speedResponse.data.speedLimits || [];

            // 3. Match results with original points
            const results: GoogleSpeedLimitResult[] = [];

            for (let i = 0; i < points.length; i++) {
                const snapped = snappedPoints.find(sp => sp.originalIndex === i);

                if (!snapped) {
                    results.push(this.getDefaultSpeedLimit(vehicleType));
                    continue;
                }

                const speedData = speedLimits.find((sl: any) => sl.placeId === snapped.placeId);

                if (!speedData) {
                    results.push(this.getDefaultSpeedLimit(vehicleType));
                    continue;
                }

                let speedLimit = speedData.speedLimit;

                // Convertir MPH a KPH si es necesario
                if (speedData.units === 'MPH') {
                    speedLimit = Math.round(speedLimit * 1.60934);
                }

                const roadType = this.determineRoadType(speedLimit);

                // Guardar en caché
                await this.saveToCache(
                    snapped.latitude,
                    snapped.longitude,
                    speedLimit,
                    roadType,
                    snapped.placeId
                );

                results.push({
                    speedLimit,
                    confidence: 'high',
                    source: 'google',
                    roadType,
                    placeId: snapped.placeId,
                    snappedLat: snapped.latitude,
                    snappedLon: snapped.longitude,
                });
            }

            logger.info(`✅ [Google] Batch completado: ${results.length} límites obtenidos`);

            return results;
        } catch (error: any) {
            logger.error(`❌ [Google] Error en batch processing: ${error.message}`);
            return points.map(() => this.getDefaultSpeedLimit(vehicleType));
        }
    }

    /**
     * Determina el tipo de vía según el límite de velocidad (España)
     */
    private determineRoadType(speedLimit: number): 'urban' | 'interurban' | 'highway' {
        if (speedLimit >= 100) return 'highway';
        if (speedLimit >= 70) return 'interurban';
        return 'urban';
    }

    /**
     * Obtiene límite de velocidad desde caché
     */
    private async getFromCache(lat: number, lon: number): Promise<any> {
        try {
            const result = await prisma.speed_limits_cache.findFirst({
                where: {
                    lat: {
                        gte: lat - 0.001, // ~100m
                        lte: lat + 0.001,
                    },
                    lon: {
                        gte: lon - 0.001,
                        lte: lon + 0.001,
                    },
                },
                orderBy: {
                    cached_at: 'desc',
                },
            });

            return result;
        } catch (error: any) {
            logger.debug(`No se pudo obtener de caché: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica si el caché es válido
     */
    private isCacheValid(cached: any): boolean {
        if (!cached.cached_at) return false;

        const age = Date.now() - new Date(cached.cached_at).getTime();
        return age < this.CACHE_TTL;
    }

    /**
     * Guarda límite de velocidad en caché
     */
    private async saveToCache(
        lat: number,
        lon: number,
        speedLimit: number,
        roadType: string,
        placeId?: string
    ): Promise<void> {
        try {
            await prisma.speed_limits_cache.create({
                data: {
                    lat,
                    lon,
                    speed_limit: speedLimit,
                    road_type: roadType,
                    place_id: placeId,
                    source: 'google',
                },
            });

            logger.debug(`💾 [Google] Guardado en caché: ${speedLimit} km/h`);
        } catch (error: any) {
            logger.debug(`No se pudo guardar en caché: ${error.message}`);
        }
    }

    /**
     * Obtiene límite de velocidad por defecto según tipo de vehículo
     */
    private getDefaultSpeedLimit(vehicleType: string): GoogleSpeedLimitResult {
        const defaultLimits: any = {
            emergencia: { urban: 50, interurban: 80, highway: 120 },
            camion: { urban: 50, interurban: 70, highway: 90 },
            turismo: { urban: 50, interurban: 90, highway: 120 },
        };

        const limits = defaultLimits[vehicleType] || defaultLimits.emergencia;

        return {
            speedLimit: limits.urban,
            confidence: 'low',
            source: 'default',
            roadType: 'urban',
        };
    }

    /**
     * Divide un array en chunks
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Limpia caché antiguo (más de 24 horas)
     */
    async cleanOldCache(): Promise<void> {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const result = await prisma.speed_limits_cache.deleteMany({
                where: {
                    cached_at: {
                        lt: oneDayAgo,
                    },
                },
            });

            logger.info(`🗑️ [Google] Caché limpiado: ${result.count} registros eliminados`);
        } catch (error: any) {
            logger.error(`❌ [Google] Error al limpiar caché: ${error.message}`);
        }
    }
}

export const googleRoadsService = new GoogleRoadsService();

