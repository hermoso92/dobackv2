import { VehicleDataResponse } from '../types/vehicleData';
import { logger } from '../utils/logger';
import { apiService } from './api';
/**
 * Obtiene los datos de un vehículo para una fecha específica
 * @param vehicleId Identificador del vehículo
 * @param date Fecha en formato DD-MM-YYYY
 * @returns Datos del vehículo para la fecha especificada
 */
export const getVehicleData = async (vehicleId: string, date: string): Promise<VehicleDataResponse> => {
  try {
    logger.info('Obteniendo datos del vehículo', { vehicleId, date });
    const response = await apiService.get<VehicleDataResponse>(`/api/vehicles/${vehicleId}/data`, {
      params: { date }
    });

    if (!response.data) {
      throw new Error('No se recibieron datos del vehículo');
    }

    logger.info('Datos del vehículo obtenidos exitosamente', {
      vehicleId,
      date,
      hasData: !!response.data
    });

    return response.data;
  } catch (error) {
    logger.error('Error obteniendo datos del vehículo', {
      error,
      vehicleId,
      date
    });
    throw error;
  }
};

export const getAvailableSessions = async (
  vehicleId: string,
  date: string
): Promise<{ sessionId: number; timestamp: string }[]> => {
  try {
    logger.info('Obteniendo sesiones disponibles', { vehicleId, date });
    const response = await apiService.get<{ sessions: { sessionId: number; timestamp: string }[] }>(
      `/api/vehicles/${vehicleId}/sessions`,
      {
        params: { date }
      }
    );

    if (!response.data?.sessions) {
      logger.warn('No se encontraron sesiones', { vehicleId, date });
      return [];
    }

    logger.info('Sesiones obtenidas exitosamente', {
      vehicleId,
      date,
      sessionCount: response.data.sessions.length
    });

    return response.data.sessions.sort((a, b) => a.sessionId - b.sessionId);
  } catch (error) {
    logger.error('Error obteniendo sesiones disponibles', {
      error,
      vehicleId,
      date
    });
    return [];
  }
}; 