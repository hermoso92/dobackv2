import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RealTimeGeofenceService, GeofenceEvent } from '../services/RealTimeGeofenceService';
import { PostGISGeometryService } from '../services/PostGISGeometryService';
import { logger } from '../utils/logger';

export class RealTimeGeofenceController {
  private prisma: PrismaClient;
  private geofenceService: RealTimeGeofenceService;
  private geometryService: PostGISGeometryService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.geofenceService = new RealTimeGeofenceService(prisma);
    this.geometryService = new PostGISGeometryService(prisma);
  }

  /**
   * Procesa posición de vehículo y retorna eventos de geocerca
   */
  async processVehiclePosition(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, lon, lat, timestamp } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!vehicleId || typeof lon !== 'number' || typeof lat !== 'number') {
        res.status(400).json({ 
          error: 'Datos requeridos: vehicleId, lon, lat' 
        });
        return;
      }

      const events = await this.geofenceService.processVehiclePosition(
        vehicleId,
        lon,
        lat,
        organizationId,
        timestamp ? new Date(timestamp) : new Date()
      );

      res.json({
        success: true,
        events,
        count: events.length
      });

      logger.info(`Posición procesada para vehículo ${vehicleId}: ${events.length} eventos generados`);
    } catch (error) {
      logger.error('Error procesando posición de vehículo:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Procesa múltiples posiciones en lote
   */
  async processBatchPositions(req: Request, res: Response): Promise<void> {
    try {
      const { positions } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (!Array.isArray(positions) || positions.length === 0) {
        res.status(400).json({ 
          error: 'Se requiere array de posiciones' 
        });
        return;
      }

      // Validar formato de cada posición
      for (const pos of positions) {
        if (!pos.vehicleId || typeof pos.lon !== 'number' || typeof pos.lat !== 'number') {
          res.status(400).json({ 
            error: 'Cada posición debe tener: vehicleId, lon, lat' 
          });
          return;
        }
        pos.organizationId = organizationId;
      }

      const events = await this.geofenceService.processBatchPositions(positions);

      res.json({
        success: true,
        events,
        count: events.length,
        processedPositions: positions.length
      });

      logger.info(`Lote procesado: ${positions.length} posiciones, ${events.length} eventos generados`);
    } catch (error) {
      logger.error('Error procesando lote de posiciones:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtiene estado actual de geocercas para un vehículo
   */
  async getVehicleGeofenceState(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const state = await this.geofenceService.getVehicleGeofenceState(vehicleId);

      if (!state) {
        res.status(404).json({ 
          error: 'Estado de geocerca no encontrado para el vehículo' 
        });
        return;
      }

      res.json({
        success: true,
        state
      });
    } catch (error) {
      logger.error('Error obteniendo estado de geocerca:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtiene vehículos dentro de una zona específica
   */
  async getVehiclesInZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const vehicles = await this.geofenceService.getVehiclesInZone(zoneId, organizationId);

      res.json({
        success: true,
        zoneId,
        vehicles,
        count: vehicles.length
      });
    } catch (error) {
      logger.error('Error obteniendo vehículos en zona:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtiene vehículos dentro de un parque específico
   */
  async getVehiclesInPark(req: Request, res: Response): Promise<void> {
    try {
      const { parkId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const vehicles = await this.geofenceService.getVehiclesInPark(parkId, organizationId);

      res.json({
        success: true,
        parkId,
        vehicles,
        count: vehicles.length
      });
    } catch (error) {
      logger.error('Error obteniendo vehículos en parque:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtiene estadísticas generales de geocercas
   */
  async getGeofenceStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const stats = await this.geofenceService.getGeofenceStats(organizationId);

      res.json({
        success: true,
        stats: {
          ...stats,
          activeZones: Array.from(stats.activeZones),
          activeParks: Array.from(stats.activeParks)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de geocercas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verifica si un punto está dentro de una zona específica
   */
  async checkPointInZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      const { lon, lat } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (typeof lon !== 'number' || typeof lat !== 'number') {
        res.status(400).json({ 
          error: 'Se requieren coordenadas: lon, lat' 
        });
        return;
      }

      const isInside = await this.geometryService.isPointInZone(
        lon, lat, zoneId, organizationId
      );

      res.json({
        success: true,
        zoneId,
        coordinates: { lon, lat },
        isInside
      });
    } catch (error) {
      logger.error('Error verificando punto en zona:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verifica si un punto está dentro de un parque específico
   */
  async checkPointInPark(req: Request, res: Response): Promise<void> {
    try {
      const { parkId } = req.params;
      const { lon, lat } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (typeof lon !== 'number' || typeof lat !== 'number') {
        res.status(400).json({ 
          error: 'Se requieren coordenadas: lon, lat' 
        });
        return;
      }

      const isInside = await this.geometryService.isPointInPark(
        lon, lat, parkId, organizationId
      );

      res.json({
        success: true,
        parkId,
        coordinates: { lon, lat },
        isInside
      });
    } catch (error) {
      logger.error('Error verificando punto en parque:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Encuentra todas las zonas que contienen un punto
   */
  async findZonesContainingPoint(req: Request, res: Response): Promise<void> {
    try {
      const { lon, lat } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (typeof lon !== 'number' || typeof lat !== 'number') {
        res.status(400).json({ 
          error: 'Se requieren coordenadas: lon, lat' 
        });
        return;
      }

      const zones = await this.geometryService.findZonesContainingPoint(
        lon, lat, organizationId
      );

      res.json({
        success: true,
        coordinates: { lon, lat },
        zones,
        count: zones.length
      });
    } catch (error) {
      logger.error('Error encontrando zonas que contienen punto:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Encuentra todos los parques que contienen un punto
   */
  async findParksContainingPoint(req: Request, res: Response): Promise<void> {
    try {
      const { lon, lat } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (typeof lon !== 'number' || typeof lat !== 'number') {
        res.status(400).json({ 
          error: 'Se requieren coordenadas: lon, lat' 
        });
        return;
      }

      const parks = await this.geometryService.findParksContainingPoint(
        lon, lat, organizationId
      );

      res.json({
        success: true,
        coordinates: { lon, lat },
        parks,
        count: parks.length
      });
    } catch (error) {
      logger.error('Error encontrando parques que contienen punto:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Calcula distancia entre dos puntos
   */
  async calculateDistance(req: Request, res: Response): Promise<void> {
    try {
      const { lon1, lat1, lon2, lat2 } = req.body;

      if (typeof lon1 !== 'number' || typeof lat1 !== 'number' || 
          typeof lon2 !== 'number' || typeof lat2 !== 'number') {
        res.status(400).json({ 
          error: 'Se requieren coordenadas: lon1, lat1, lon2, lat2' 
        });
        return;
      }

      const distance = await this.geometryService.calculateDistance(lon1, lat1, lon2, lat2);

      res.json({
        success: true,
        point1: { lon: lon1, lat: lat1 },
        point2: { lon: lon2, lat: lat2 },
        distance: Math.round(distance), // Redondear a metros
        unit: 'meters'
      });
    } catch (error) {
      logger.error('Error calculando distancia:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Encuentra zonas dentro de un radio de un punto
   */
  async findZonesInRadius(req: Request, res: Response): Promise<void> {
    try {
      const { lon, lat, radius } = req.body;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      if (typeof lon !== 'number' || typeof lat !== 'number' || typeof radius !== 'number') {
        res.status(400).json({ 
          error: 'Se requieren: lon, lat, radius' 
        });
        return;
      }

      const zones = await this.geometryService.findZonesInRadius(
        lon, lat, radius, organizationId
      );

      res.json({
        success: true,
        center: { lon, lat },
        radius,
        zones,
        count: zones.length
      });
    } catch (error) {
      logger.error('Error encontrando zonas en radio:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Reinicia estado de geocercas para un vehículo
   */
  async resetVehicleGeofenceState(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      this.geofenceService.resetVehicleState(vehicleId);

      res.json({
        success: true,
        message: `Estado de geocerca reiniciado para vehículo ${vehicleId}`
      });

      logger.info(`Estado de geocerca reiniciado para vehículo ${vehicleId}`);
    } catch (error) {
      logger.error('Error reiniciando estado de geocerca:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Reinicia estado de geocercas para todos los vehículos
   */
  async resetAllGeofenceStates(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      this.geofenceService.resetAllVehicleStates();

      res.json({
        success: true,
        message: 'Estado de geocercas reiniciado para todos los vehículos'
      });

      logger.info('Estado de geocercas reiniciado para todos los vehículos');
    } catch (error) {
      logger.error('Error reiniciando estados de geocercas:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
} 