import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { PostGISGeometryService } from './PostGISGeometryService';

export interface GeofenceEvent {
  vehicleId: string;
  zoneId?: string;
  parkId?: string;
  eventType: 'ENTER' | 'EXIT' | 'INSIDE' | 'OUTSIDE';
  timestamp: Date;
  coordinates: {
    lon: number;
    lat: number;
  };
  organizationId: string;
}

export interface VehicleGeofenceState {
  vehicleId: string;
  currentZones: string[];
  currentParks: string[];
  lastUpdate: Date;
}

export class RealTimeGeofenceService {
  private prisma: PrismaClient;
  private geometryService: PostGISGeometryService;
  private vehicleStates: Map<string, VehicleGeofenceState> = new Map();
  private eventCallbacks: Array<(event: GeofenceEvent) => void> = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.geometryService = new PostGISGeometryService(prisma);
  }

  /**
   * Registra callback para eventos de geocerca
   */
  onGeofenceEvent(callback: (event: GeofenceEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Procesa posición de vehículo y detecta cambios de geocerca
   */
  async processVehiclePosition(
    vehicleId: string,
    lon: number,
    lat: number,
    organizationId: string,
    timestamp: Date = new Date()
  ): Promise<GeofenceEvent[]> {
    try {
      const events: GeofenceEvent[] = [];
      const currentState = this.vehicleStates.get(vehicleId) || {
        vehicleId,
        currentZones: [],
        currentParks: [],
        lastUpdate: new Date(0)
      };

      // Encontrar zonas y parques que contienen el punto actual
      const containingZones = await this.geometryService.findZonesContainingPoint(
        lon, lat, organizationId
      );
      const containingParks = await this.geometryService.findParksContainingPoint(
        lon, lat, organizationId
      );

      const currentZoneIds = containingZones.map(z => z.id);
      const currentParkIds = containingParks.map(p => p.id);

      // Detectar entrada en nuevas zonas
      for (const zoneId of currentZoneIds) {
        if (!currentState.currentZones.includes(zoneId)) {
          const event: GeofenceEvent = {
            vehicleId,
            zoneId,
            eventType: 'ENTER',
            timestamp,
            coordinates: { lon, lat },
            organizationId
          };
          events.push(event);
        }
      }

      // Detectar salida de zonas
      for (const zoneId of currentState.currentZones) {
        if (!currentZoneIds.includes(zoneId)) {
          const event: GeofenceEvent = {
            vehicleId,
            zoneId,
            eventType: 'EXIT',
            timestamp,
            coordinates: { lon, lat },
            organizationId
          };
          events.push(event);
        }
      }

      // Detectar entrada en nuevos parques
      for (const parkId of currentParkIds) {
        if (!currentState.currentParks.includes(parkId)) {
          const event: GeofenceEvent = {
            vehicleId,
            parkId,
            eventType: 'ENTER',
            timestamp,
            coordinates: { lon, lat },
            organizationId
          };
          events.push(event);
        }
      }

      // Detectar salida de parques
      for (const parkId of currentState.currentParks) {
        if (!currentParkIds.includes(parkId)) {
          const event: GeofenceEvent = {
            vehicleId,
            parkId,
            eventType: 'EXIT',
            timestamp,
            coordinates: { lon, lat },
            organizationId
          };
          events.push(event);
        }
      }

      // Actualizar estado del vehículo
      currentState.currentZones = currentZoneIds;
      currentState.currentParks = currentParkIds;
      currentState.lastUpdate = timestamp;
      this.vehicleStates.set(vehicleId, currentState);

      // Emitir eventos si hay cambios
      for (const event of events) {
        await this.emitGeofenceEvent(event);
      }

      return events;
    } catch (error) {
      logger.error(`Error procesando posición del vehículo ${vehicleId}:`, error);
      return [];
    }
  }

  /**
   * Procesa múltiples posiciones de vehículos en lote
   */
  async processBatchPositions(
    positions: Array<{
      vehicleId: string;
      lon: number;
      lat: number;
      organizationId: string;
      timestamp?: Date;
    }>
  ): Promise<GeofenceEvent[]> {
    const allEvents: GeofenceEvent[] = [];

    for (const position of positions) {
      const events = await this.processVehiclePosition(
        position.vehicleId,
        position.lon,
        position.lat,
        position.organizationId,
        position.timestamp
      );
      allEvents.push(...events);
    }

    return allEvents;
  }

  /**
   * Verifica estado actual de un vehículo en geocercas
   */
  async getVehicleGeofenceState(vehicleId: string): Promise<VehicleGeofenceState | null> {
    return this.vehicleStates.get(vehicleId) || null;
  }

  /**
   * Obtiene todos los vehículos dentro de una zona específica
   */
  async getVehiclesInZone(zoneId: string, organizationId: string): Promise<string[]> {
    const vehicles: string[] = [];

    for (const [vehicleId, state] of this.vehicleStates.entries()) {
      if (state.currentZones.includes(zoneId)) {
        vehicles.push(vehicleId);
      }
    }

    return vehicles;
  }

  /**
   * Obtiene todos los vehículos dentro de un parque específico
   */
  async getVehiclesInPark(parkId: string, organizationId: string): Promise<string[]> {
    const vehicles: string[] = [];

    for (const [vehicleId, state] of this.vehicleStates.entries()) {
      if (state.currentParks.includes(parkId)) {
        vehicles.push(vehicleId);
      }
    }

    return vehicles;
  }

  /**
   * Obtiene estadísticas de geocercas
   */
  async getGeofenceStats(organizationId: string): Promise<{
    totalVehicles: number;
    vehiclesInZones: number;
    vehiclesInParks: number;
    activeZones: Set<string>;
    activeParks: Set<string>;
  }> {
    const activeZones = new Set<string>();
    const activeParks = new Set<string>();
    let vehiclesInZones = 0;
    let vehiclesInParks = 0;

    for (const state of this.vehicleStates.values()) {
      if (state.currentZones.length > 0) {
        vehiclesInZones++;
        state.currentZones.forEach(zoneId => activeZones.add(zoneId));
      }
      if (state.currentParks.length > 0) {
        vehiclesInParks++;
        state.currentParks.forEach(parkId => activeParks.add(parkId));
      }
    }

    return {
      totalVehicles: this.vehicleStates.size,
      vehiclesInZones,
      vehiclesInParks,
      activeZones,
      activeParks
    };
  }

  /**
   * Limpia estado de vehículos inactivos
   */
  async cleanupInactiveVehicles(maxInactiveMinutes: number = 30): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [vehicleId, state] of this.vehicleStates.entries()) {
      if (state.lastUpdate < cutoffTime) {
        this.vehicleStates.delete(vehicleId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Limpiados ${cleanedCount} vehículos inactivos`);
    }

    return cleanedCount;
  }

  /**
   * Emite evento de geocerca a todos los callbacks registrados
   */
  private async emitGeofenceEvent(event: GeofenceEvent): Promise<void> {
    try {
      // Guardar evento en base de datos
      await this.saveGeofenceEvent(event);

      // Emitir a callbacks registrados
      for (const callback of this.eventCallbacks) {
        try {
          callback(event);
        } catch (error) {
          logger.error('Error en callback de evento de geocerca:', error);
        }
      }
    } catch (error) {
      logger.error('Error emitiendo evento de geocerca:', error);
    }
  }

  /**
   * Guarda evento de geocerca en base de datos
   */
  private async saveGeofenceEvent(event: GeofenceEvent): Promise<void> {
    try {
      // Crear evento en la tabla Event
      await this.prisma.event.create({
        data: {
          type: `GEOFENCE_${event.eventType}`,
          timestamp: event.timestamp,
          vehicleId: event.vehicleId,
          zoneId: event.zoneId || null,
          parkId: event.parkId || null,
          organizationId: event.organizationId,
          metadata: {
            coordinates: event.coordinates,
            eventType: event.eventType
          }
        }
      });

      logger.debug(`Evento de geocerca guardado: ${event.eventType} para vehículo ${event.vehicleId}`);
    } catch (error) {
      logger.error('Error guardando evento de geocerca:', error);
    }
  }

  /**
   * Reinicia estado de un vehículo específico
   */
  resetVehicleState(vehicleId: string): void {
    this.vehicleStates.delete(vehicleId);
    logger.debug(`Estado reiniciado para vehículo ${vehicleId}`);
  }

  /**
   * Reinicia estado de todos los vehículos
   */
  resetAllVehicleStates(): void {
    this.vehicleStates.clear();
    logger.info('Estado de todos los vehículos reiniciado');
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    const totalVehicles = this.vehicleStates.size;
    let vehiclesInZones = 0;
    let vehiclesInParks = 0;
    const activeZones = new Set<string>();
    const activeParks = new Set<string>();

    for (const state of this.vehicleStates.values()) {
      if (state.currentZones.length > 0) {
        vehiclesInZones++;
        state.currentZones.forEach(zoneId => activeZones.add(zoneId));
      }
      if (state.currentParks.length > 0) {
        vehiclesInParks++;
        state.currentParks.forEach(parkId => activeParks.add(parkId));
      }
    }

    return {
      totalVehicles,
      vehiclesInZones,
      vehiclesInParks,
      activeZones,
      activeParks
    };
  }
} 