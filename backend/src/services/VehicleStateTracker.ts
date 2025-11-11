import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface VehicleStatePosition {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    timestamp?: Date | null;
}

export interface VehicleState {
    vehicleId: string;
    lastState: number | null;
    lastSeenAt: Date | null;
    lastPosition: VehicleStatePosition | null;
    lastGeofenceId: string | null;
    inferred: boolean;
}

interface VehicleStateOptions {
    forceReload?: boolean;
}

const DEFAULT_STATE: VehicleState = {
    vehicleId: 'unknown',
    lastState: null,
    lastSeenAt: null,
    lastPosition: null,
    lastGeofenceId: null,
    inferred: false
};

class VehicleStateTrackerService {
    private static instance: VehicleStateTrackerService;
    private readonly cache = new Map<string, VehicleState>();

    private constructor() {}

    static getInstance(): VehicleStateTrackerService {
        if (!VehicleStateTrackerService.instance) {
            VehicleStateTrackerService.instance = new VehicleStateTrackerService();
        }
        return VehicleStateTrackerService.instance;
    }

    async getState(vehicleId: string, options: VehicleStateOptions = {}): Promise<VehicleState> {
        if (!vehicleId) {
            return { ...DEFAULT_STATE, vehicleId: 'unknown' };
        }

        if (!options.forceReload && this.cache.has(vehicleId)) {
            return this.cache.get(vehicleId)!;
        }

        const loaded = await this.loadStateFromDatabase(vehicleId);
        this.cache.set(vehicleId, loaded);
        return loaded;
    }

    async updateStateFromSession(sessionId: string): Promise<void> {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                vehicleId: true,
                endTime: true,
                startTime: true
            }
        });

        if (!session?.vehicleId) {
            logger.warn('⚠️ No se pudo actualizar VehicleState: sesión sin vehículo', { sessionId });
            return;
        }

        const [lastSegment, lastGps, lastGeofence] = await Promise.all([
            prisma.operational_state_segments.findFirst({
                where: { sessionId },
                orderBy: { endTime: 'desc' },
                select: {
                    clave: true,
                    endTime: true
                }
            }),
            prisma.gpsMeasurement.findFirst({
                where: { sessionId },
                orderBy: { timestamp: 'desc' },
                select: {
                    latitude: true,
                    longitude: true,
                    altitude: true,
                    timestamp: true
                }
            }),
            prisma.geofenceEvent.findFirst({
                where: { vehicleId: session.vehicleId },
                orderBy: { timestamp: 'desc' },
                select: {
                    geofenceId: true,
                    timestamp: true
                }
            }).catch((error) => {
                logger.debug('ℹ️ geofenceEvent no disponible, continuando sin geocerca', { error: error?.message });
                return null;
            })
        ]);

        const lastState = lastSegment?.clave ?? null;
        const lastSeenAt = lastSegment?.endTime ?? session.endTime ?? session.startTime ?? null;
        const lastPosition = lastGps
            ? {
                  latitude: lastGps.latitude,
                  longitude: lastGps.longitude,
                  altitude: lastGps.altitude,
                  timestamp: lastGps.timestamp
              }
            : null;

        const state: VehicleState = {
            vehicleId: session.vehicleId,
            lastState,
            lastSeenAt,
            lastPosition,
            lastGeofenceId: lastGeofence?.geofenceId ?? null,
            inferred: false
        };

        this.cache.set(session.vehicleId, state);
        logger.info('🚚 VehicleState actualizado desde sesión', {
            sessionId,
            vehicleId: session.vehicleId,
            lastState,
            lastSeenAt
        });
    }

    async markInferredState(vehicleId: string, state: Partial<VehicleState>): Promise<VehicleState> {
        const current = await this.getState(vehicleId);
        const updated: VehicleState = {
            ...current,
            ...state,
            inferred: true,
            vehicleId
        };
        this.cache.set(vehicleId, updated);
        return updated;
    }

    clearCache(): void {
        this.cache.clear();
    }

    private async loadStateFromDatabase(vehicleId: string): Promise<VehicleState> {
        try {
            const latestSession = await prisma.session.findFirst({
                where: { vehicleId },
                orderBy: [
                    { endTime: 'desc' },
                    { startTime: 'desc' }
                ],
                select: {
                    id: true,
                    endTime: true,
                    startTime: true
                }
            });

            if (!latestSession) {
                return {
                    vehicleId,
                    lastState: null,
                    lastSeenAt: null,
                    lastPosition: null,
                    lastGeofenceId: null,
                    inferred: false
                };
            }

            const [lastSegment, lastGps, lastGeofence] = await Promise.all([
                prisma.operational_state_segments.findFirst({
                    where: { sessionId: latestSession.id },
                    orderBy: { endTime: 'desc' },
                    select: {
                        clave: true,
                        endTime: true
                    }
                }),
                prisma.gpsMeasurement.findFirst({
                    where: { sessionId: latestSession.id },
                    orderBy: { timestamp: 'desc' },
                    select: {
                        latitude: true,
                        longitude: true,
                        altitude: true,
                        timestamp: true
                    }
                }),
                prisma.geofenceEvent.findFirst({
                    where: { vehicleId },
                    orderBy: { timestamp: 'desc' },
                    select: {
                        geofenceId: true,
                        timestamp: true
                    }
                }).catch((error) => {
                    logger.debug('ℹ️ geofenceEvent no disponible al cargar estado', { error: error?.message });
                    return null;
                })
            ]);

            return {
                vehicleId,
                lastState: lastSegment?.clave ?? null,
                lastSeenAt: lastSegment?.endTime ?? latestSession.endTime ?? latestSession.startTime ?? null,
                lastPosition: lastGps
                    ? {
                          latitude: lastGps.latitude,
                          longitude: lastGps.longitude,
                          altitude: lastGps.altitude,
                          timestamp: lastGps.timestamp
                      }
                    : null,
                lastGeofenceId: lastGeofence?.geofenceId ?? null,
                inferred: false
            };
        } catch (error: any) {
            logger.error('❌ Error cargando VehicleState desde BD', { vehicleId, error: error?.message });
            return {
                vehicleId,
                lastState: null,
                lastSeenAt: null,
                lastPosition: null,
                lastGeofenceId: null,
                inferred: false
            };
        }
    }
}

export const VehicleStateTracker = VehicleStateTrackerService.getInstance();
