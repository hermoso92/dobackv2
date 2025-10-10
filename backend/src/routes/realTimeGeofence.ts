import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { RealTimeGeofenceController } from '../controllers/realTimeGeofenceController';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const controller = new RealTimeGeofenceController(prisma);

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================================================
// RUTAS PARA PROCESAMIENTO DE POSICIONES
// ============================================================================

/**
 * POST /api/geofence/position
 * Procesa posición de un vehículo y detecta eventos de geocerca
 */
router.post('/position', controller.processVehiclePosition.bind(controller));

/**
 * POST /api/geofence/positions/batch
 * Procesa múltiples posiciones en lote para mejor performance
 */
router.post('/positions/batch', controller.processBatchPositions.bind(controller));

// ============================================================================
// RUTAS PARA CONSULTA DE ESTADOS
// ============================================================================

/**
 * GET /api/geofence/vehicle/:vehicleId/state
 * Obtiene estado actual de geocercas para un vehículo específico
 */
router.get('/vehicle/:vehicleId/state', controller.getVehicleGeofenceState.bind(controller));

/**
 * GET /api/geofence/zone/:zoneId/vehicles
 * Obtiene todos los vehículos dentro de una zona específica
 */
router.get('/zone/:zoneId/vehicles', controller.getVehiclesInZone.bind(controller));

/**
 * GET /api/geofence/park/:parkId/vehicles
 * Obtiene todos los vehículos dentro de un parque específico
 */
router.get('/park/:parkId/vehicles', controller.getVehiclesInPark.bind(controller));

/**
 * GET /api/geofence/stats
 * Obtiene estadísticas generales de geocercas
 */
router.get('/stats', controller.getGeofenceStats.bind(controller));

// ============================================================================
// RUTAS PARA VERIFICACIÓN DE GEOMETRÍAS
// ============================================================================

/**
 * POST /api/geofence/zone/:zoneId/check
 * Verifica si un punto está dentro de una zona específica
 */
router.post('/zone/:zoneId/check', controller.checkPointInZone.bind(controller));

/**
 * POST /api/geofence/park/:parkId/check
 * Verifica si un punto está dentro de un parque específico
 */
router.post('/park/:parkId/check', controller.checkPointInPark.bind(controller));

/**
 * POST /api/geofence/point/zones
 * Encuentra todas las zonas que contienen un punto específico
 */
router.post('/point/zones', controller.findZonesContainingPoint.bind(controller));

/**
 * POST /api/geofence/point/parks
 * Encuentra todos los parques que contienen un punto específico
 */
router.post('/point/parks', controller.findParksContainingPoint.bind(controller));

// ============================================================================
// RUTAS PARA CÁLCULOS GEOMÉTRICOS
// ============================================================================

/**
 * POST /api/geofence/distance
 * Calcula la distancia entre dos puntos
 */
router.post('/distance', controller.calculateDistance.bind(controller));

/**
 * POST /api/geofence/radius/zones
 * Encuentra zonas dentro de un radio de un punto
 */
router.post('/radius/zones', controller.findZonesInRadius.bind(controller));

// ============================================================================
// RUTAS PARA ADMINISTRACIÓN
// ============================================================================

/**
 * DELETE /api/geofence/vehicle/:vehicleId/state
 * Reinicia estado de geocercas para un vehículo específico
 */
router.delete('/vehicle/:vehicleId/state', controller.resetVehicleGeofenceState.bind(controller));

/**
 * DELETE /api/geofence/states
 * Reinicia estado de geocercas para todos los vehículos
 */
router.delete('/states', controller.resetAllGeofenceStates.bind(controller));

export default router; 