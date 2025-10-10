import { EventDTO, GeofenceDTO } from '../types/telemetry';
import { logger } from '../utils/logger';

// Adapter para convertir payloads de Radar a DTOs del sistema
export class RadarAdapter {
    /**
     * Convierte webhook de Radar a EventDTO
     */
    static webhookToEventDTO(payload: unknown): EventDTO {
        try {
            const data = payload as any;

            // Mapeo de tipos de eventos de Radar
            const eventTypeMap: Record<string, string> = {
                'geofence.enter': 'geofence_enter',
                'geofence.exit': 'geofence_exit',
                'geofence.violation': 'geofence_violation',
                'speed.exceeded': 'speed_exceeded',
                'hard.brake': 'hard_brake',
                'hard.acceleration': 'hard_acceleration'
            };

            // Mapeo de severidad
            const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
                'low': 'LOW',
                'medium': 'MEDIUM',
                'high': 'HIGH',
                'critical': 'CRITICAL'
            };

            return {
                id: data.id || `radar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                orgId: data.user?.metadata?.orgId || data.organizationId || '',
                ts: data.timestamp || data.created_at || new Date().toISOString(),
                type: eventTypeMap[data.type] || data.type || 'unknown',
                severity: severityMap[data.severity?.toLowerCase()] || 'MEDIUM',
                sessionId: data.user?.metadata?.sessionId,
                vehicleId: data.user?.metadata?.vehicleId || data.vehicleId || '',
                lat: data.location?.coordinates?.[1] || data.latitude || 0,
                lng: data.location?.coordinates?.[0] || data.longitude || 0,
                meta: {
                    geofenceId: data.geofence?.id,
                    geofenceName: data.geofence?.name,
                    originalPayload: data
                }
            };
        } catch (error) {
            logger.error('Error convirtiendo webhook de Radar a EventDTO', { error, payload });
            throw new Error('Formato de webhook de Radar inválido');
        }
    }

    /**
     * Convierte geocerca de Radar a GeofenceDTO
     */
    static geofenceToDTO(geofence: any, orgId: string): GeofenceDTO {
        try {
            return {
                id: geofence.id,
                orgId,
                name: geofence.name || geofence.description || `Geocerca ${geofence.id}`,
                provider: 'RADAR',
                type: geofence.geometry?.type === 'Circle' ? 'CIRCLE' : 'POLYGON',
                geometry: {
                    type: geofence.geometry?.type || 'Polygon',
                    coordinates: geofence.geometry?.coordinates,
                    center: geofence.geometry?.center,
                    radius: geofence.geometry?.radius
                },
                tags: geofence.tags || [],
                version: geofence.version || 1
            };
        } catch (error) {
            logger.error('Error convirtiendo geocerca de Radar a DTO', { error, geofence });
            throw new Error('Formato de geocerca de Radar inválido');
        }
    }

    /**
     * Convierte lista de geocercas de Radar
     */
    static geofencesToDTOs(geofences: any[], orgId: string): GeofenceDTO[] {
        return geofences
            .map(geofence => {
                try {
                    return this.geofenceToDTO(geofence, orgId);
                } catch (error) {
                    logger.warn('Geocerca omitida por error de conversión', { error, geofence });
                    return null;
                }
            })
            .filter((dto): dto is GeofenceDTO => dto !== null);
    }

    /**
     * Valida si un payload de webhook es válido
     */
    static isValidWebhookPayload(payload: unknown): boolean {
        try {
            const data = payload as any;
            return !!(
                data &&
                (data.id || data.timestamp) &&
                (data.location?.coordinates || data.latitude) &&
                (data.type || data.event_type)
            );
        } catch {
            return false;
        }
    }
}
