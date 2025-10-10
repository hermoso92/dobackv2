import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

// Middleware de validación genérico
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validación fallida', {
        path: req.path,
        error: error.details[0].message,
        body: req.body,
      });
      
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: error.details[0].message,
      });
    }
    
    next();
  };
};

// Esquemas de validación para vehículos
export const vehicleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  licensePlate: Joi.string().pattern(/^[A-Z0-9-]+$/).required(),
  model: Joi.string().min(1).max(50).required(),
  brand: Joi.string().min(1).max(50).required(),
  type: Joi.string().valid('CAR', 'TRUCK', 'VAN', 'MOTORCYCLE').required(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMERGENCY').optional(),
});

// Esquemas de validación para sesiones
export const sessionSchema = Joi.object({
  vehicleId: Joi.string().uuid().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).optional(),
  type: Joi.string().valid('ROUTINE', 'EMERGENCY', 'TRAINING', 'MAINTENANCE').required(),
  sessionNumber: Joi.number().integer().min(1).required(),
  sequence: Joi.number().integer().min(1).required(),
});

// Esquemas de validación para eventos
export const eventSchema = Joi.object({
  type: Joi.string().valid('GPS', 'CAN', 'SYSTEM', 'USER').required(),
  status: Joi.string().valid('ACTIVE', 'RESOLVED', 'ARCHIVED').required(),
  timestamp: Joi.date().iso().required(),
  data: Joi.object().required(),
  displayData: Joi.object().optional(),
});

// Esquemas de validación para usuarios
export const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  name: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('ADMIN', 'USER').required(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
});

// Esquemas de validación para organizaciones
export const organizationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  apiKey: Joi.string().min(10).max(100).required(),
});

// Esquemas de validación para parques
export const parkSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  identifier: Joi.string().min(1).max(50).required(),
  geometry: Joi.object().required(),
});

// Esquemas de validación para zonas
export const zoneSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('HIGH_RISK', 'HIGH_PRIORITY', 'RESTRICTED', 'EMERGENCY').required(),
  geometry: Joi.object().required(),
  parkId: Joi.string().uuid().required(),
});

// Esquemas de validación para autenticación
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

// Esquemas de validación para reportes
export const reportSchema = Joi.object({
  sessionIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  vehicleIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  dateRange: Joi.object({
    from: Joi.date().iso().required(),
    to: Joi.date().iso().greater(Joi.ref('from')).required(),
  }).required(),
  includeCharts: Joi.boolean().optional(),
  includeMaps: Joi.boolean().optional(),
  format: Joi.string().valid('PDF', 'CSV', 'JSON').optional(),
});

// Esquemas de validación para geocercas
export const geofenceSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('POLYGON', 'CIRCLE').required(),
  geometry: Joi.object({
    type: Joi.string().valid('Polygon', 'Circle').required(),
    coordinates: Joi.array().when('type', {
      is: 'Polygon',
      then: Joi.array().items(Joi.array().items(Joi.array().items(Joi.number()))),
      otherwise: Joi.array().items(Joi.number()).length(2),
    }),
    center: Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
    }).when('type', {
      is: 'Circle',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    radius: Joi.number().min(1).when('type', {
      is: 'Circle',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }).required(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// Esquemas de validación para telemetría
export const telemetryPointSchema = Joi.object({
  ts: Joi.date().iso().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  speed: Joi.number().min(0).max(300).optional(),
  heading: Joi.number().min(0).max(360).optional(),
  can: Joi.object().optional(),
});

// Esquemas de validación para alertas
export const alertSchema = Joi.object({
  type: Joi.string().valid('FIRE', 'MEDICAL', 'RESCUE', 'HAZMAT', 'ROUTINE', 'MAINTENANCE').required(),
  location: Joi.string().min(1).max(200).required(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
  description: Joi.string().min(1).max(500).required(),
  vehicleId: Joi.string().uuid().required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).optional(),
});

// Middleware para validar parámetros de query
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      logger.warn('Validación de query fallida', {
        path: req.path,
        error: error.details[0].message,
        query: req.query,
      });
      
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        details: error.details[0].message,
      });
    }
    
    next();
  };
};

// Esquemas de validación para parámetros de query
export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('asc', 'desc').default('desc'),
  sortBy: Joi.string().optional(),
});

export const dateRangeQuerySchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().greater(Joi.ref('from')).optional(),
});

export const vehicleFilterQuerySchema = Joi.object({
  vehicleId: Joi.string().uuid().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMERGENCY').optional(),
  type: Joi.string().valid('CAR', 'TRUCK', 'VAN', 'MOTORCYCLE').optional(),
});

export const eventFilterQuerySchema = Joi.object({
  type: Joi.string().valid('GPS', 'CAN', 'SYSTEM', 'USER').optional(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  status: Joi.string().valid('ACTIVE', 'RESOLVED', 'ARCHIVED').optional(),
});

// Middleware para validar parámetros de ruta
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      logger.warn('Validación de parámetros fallida', {
        path: req.path,
        error: error.details[0].message,
        params: req.params,
      });
      
      return res.status(400).json({
        error: 'Parámetros de ruta inválidos',
        details: error.details[0].message,
      });
    }
    
    next();
  };
};

// Esquemas de validación para parámetros de ruta
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const vehicleIdParamSchema = Joi.object({
  vehicleId: Joi.string().uuid().required(),
});

export const sessionIdParamSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
});

export const eventIdParamSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
});