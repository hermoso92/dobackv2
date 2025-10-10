import { SessionStatus } from '../types/enums';
import type { StabilitySession } from '../types/stability';
import { logger } from '../utils/logger';
import { apiService } from './api';
import { DataService } from './dataService';

export type SessionType = 'ROUTINE' | 'MAINTENANCE' | 'EMERGENCY' | 'TEST' | 'TRAINING';

export interface Session {
  id: string;
  vehicleId: string;
  type: SessionType;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionDTO {
  vehicleId: string;
  type: SessionType;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
}

export interface UpdateSessionDTO {
  vehicleId: string;
  type: SessionType;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class SessionService {
  private static instance: SessionService;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;
  private dataService: DataService;

  private constructor() {
    this.dataService = DataService.getInstance();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  async getSessions(params?: { vehicleId?: string; status?: string; startDate?: string; endDate?: string }): Promise<Session[]> {
    try {
      logger.info('Obteniendo sesiones', { params });
      const response = await apiService.get<ApiResponse<Session[]>>('/sessions', { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener las sesiones');
      }

      logger.info('Sesiones obtenidas exitosamente', { count: response.data.data.length });
      return response.data.data;
    } catch (error) {
      logger.error('Error obteniendo sesiones:', { error, params });
      throw error;
    }
  }

  async getSession(id: string): Promise<Session> {
    try {
      logger.info('Obteniendo sesión', { id });
      const response = await apiService.get<ApiResponse<Session>>(`/sessions/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener la sesión');
      }

      logger.info('Sesión obtenida exitosamente', { id });
      return response.data.data;
    } catch (error) {
      logger.error(`Error obteniendo sesión ${id}:`, { error });
      throw error;
    }
  }

  async getVehicleSessions(vehicleId: string, params?: { status?: string; startDate?: string; endDate?: string }): Promise<Session[]> {
    try {
      logger.info('Obteniendo sesiones del vehículo', { vehicleId, params });
      const response = await apiService.get<ApiResponse<Session[]>>(`/api/vehicles/${vehicleId}/sessions`, { params });

      logger.info('Respuesta del servidor:', {
        url: `/api/vehicles/${vehicleId}/sessions`,
        data: response.data
      });

      // Si la respuesta es un array directamente, lo devolvemos
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // Si la respuesta tiene el formato ApiResponse
      if (response.data && response.data.data) {
        return response.data.data;
      }

      // Si no hay datos, devolvemos un array vacío
      return [];
    } catch (error) {
      logger.error(`Error obteniendo sesiones del vehículo ${vehicleId}:`, { error, params });
      throw error;
    }
  }

  async getStabilitySessions(params?: { vehicleId?: string; status?: string; startDate?: string; endDate?: string }): Promise<StabilitySession[]> {
    try {
      logger.info('Obteniendo sesiones de estabilidad', { params });
      const response = await apiService.get<ApiResponse<StabilitySession[]>>('/api/stability/sessions', {
        params,
        headers: {
          'cache-control': 'no-cache',
          'pragma': 'no-cache'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener las sesiones de estabilidad');
      }

      logger.info('Sesiones de estabilidad obtenidas exitosamente', { count: response.data.data.length });
      return response.data.data;
    } catch (error) {
      logger.error('Error obteniendo sesiones de estabilidad:', { error, params });
      throw error;
    }
  }

  async getStabilitySession(id: string): Promise<StabilitySession> {
    try {
      logger.info('Obteniendo sesión de estabilidad', { id });
      const response = await apiService.get<ApiResponse<StabilitySession>>(`/api/stability/sessions/${id}`, {
        headers: {
          'cache-control': 'no-cache',
          'pragma': 'no-cache'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener la sesión de estabilidad');
      }

      logger.info('Sesión de estabilidad obtenida exitosamente', { id });
      return response.data.data;
    } catch (error) {
      logger.error(`Error obteniendo sesión de estabilidad ${id}:`, { error });
      throw error;
    }
  }

  public async getVehicleStabilitySessions(vehicleId: string): Promise<StabilitySession[]> {
    let attempt = 1;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      try {
        logger.info('Obteniendo sesiones de estabilidad del vehículo', {
          vehicleId,
          attempt
        });

        const response = await apiService.get<ApiResponse<StabilitySession[]>>(`/api/stability/vehicle/${vehicleId}/sessions`, {
          timeout: 15000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Error al obtener las sesiones de estabilidad');
        }

        if (!response.data.data || !Array.isArray(response.data.data)) {
          throw new Error('Formato de respuesta inválido');
        }

        logger.info('Sesiones obtenidas exitosamente', {
          vehicleId,
          count: response.data.data.length,
          sessions: response.data.data
        });

        return response.data.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');
        logger.error(`Error en intento ${attempt} de obtener sesiones de estabilidad del vehículo ${vehicleId}:`, { error });

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.info(`Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        } else {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Error al obtener las sesiones de estabilidad');
  }

  async createSession(session: CreateSessionDTO): Promise<Session> {
    try {
      logger.info('Creando sesión', { session });
      const response = await apiService.post<ApiResponse<Session>>('/api/sessions', session);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al crear la sesión');
      }

      logger.info('Sesión creada exitosamente', { id: response.data.data.id });
      return response.data.data;
    } catch (error) {
      logger.error('Error creando sesión:', { error, session });
      throw error;
    }
  }

  async updateSession(id: string, data: UpdateSessionDTO): Promise<Session> {
    try {
      logger.info('Actualizando sesión', { id, data });
      const response = await apiService.put<ApiResponse<Session>>(`/api/sessions/${id}`, data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar la sesión');
      }

      logger.info('Sesión actualizada exitosamente', { id });
      return response.data.data;
    } catch (error) {
      logger.error('Error actualizando sesión:', { error, id, data });
      throw error;
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      logger.info('Eliminando sesión', { id });
      const response = await apiService.delete<ApiResponse<void>>(`/api/sessions/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar la sesión');
      }

      logger.info('Sesión eliminada exitosamente', { id });
    } catch (error) {
      logger.error('Error eliminando sesión:', { error, id });
      throw error;
    }
  }
}

export const sessionService = SessionService.getInstance();

export const getVehicleSessions = async (vehicleId: string): Promise<StabilitySession[]> => {
  try {
    logger.info('Obteniendo sesiones del vehículo', { vehicleId });
    const response = await apiService.get<ApiResponse<StabilitySession[]>>(`/api/vehicles/${vehicleId}/sessions`);

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener las sesiones del vehículo');
    }

    if (!Array.isArray(response.data)) {
      throw new Error('Formato de respuesta inválido');
    }

    logger.info('Sesiones obtenidas exitosamente', {
      vehicleId,
      count: response.data.length
    });

    return response.data;
  } catch (error) {
    logger.error('Error obteniendo sesiones del vehículo:', { error, vehicleId });
    throw error;
  }
};

export const getSessionDetails = async (sessionId: string): Promise<StabilitySession> => {
  try {
    logger.info('Obteniendo detalles de la sesión', { sessionId });
    const response = await apiService.get<ApiResponse<StabilitySession>>(`/api/stability/sessions/${sessionId}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener los detalles de la sesión');
    }

    logger.info('Detalles de la sesión obtenidos exitosamente', { sessionId });
    return response.data;
  } catch (error) {
    logger.error('Error obteniendo detalles de la sesión:', { error, sessionId });
    throw error;
  }
}; 