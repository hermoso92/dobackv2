import {
  StabilitySession,
  StabilitySessionDTO,
  StabilityThreshold,
  StabilityThresholdDTO,
  mapSessionDTOToSession,
  mapThresholdDTOToThreshold
} from '../types';
import { DatabaseStabilityData, StabilityDataPoint } from '../types/stability';
import { mapDatabaseArrayToStabilityDataPoints } from '../utils/stabilityDataMapper';
import { get, post, put } from './index';

export const stabilityService = {
  getCurrent: async (vehicleId: string): Promise<StabilitySession> => {
    const response = await get<StabilitySessionDTO>(`/api/stability/current/${vehicleId}`);
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener la sesión actual');
    }
    return mapSessionDTOToSession(response.data);
  },

  getHistory: async (vehicleId: string, startDate: Date, endDate: Date): Promise<StabilitySession[]> => {
    const response = await get<StabilitySessionDTO[]>(
      `/api/stability/history/${vehicleId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener el historial');
    }
    return response.data.map(mapSessionDTOToSession);
  },

  getSessionData: async (sessionId: string): Promise<StabilityDataPoint[]> => {
    const response = await get<{
      success: boolean;
      data: {
        sessionId: string;
        vehicleId: string;
        startTime: string;
        endTime: string;
        measurements: DatabaseStabilityData[];
      };
    }>(`/api/stability/session/${sessionId}/data`);

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener los datos de la sesión');
    }

    if (!response.data?.data?.measurements) {
      throw new Error('No se encontraron mediciones para esta sesión');
    }

    return mapDatabaseArrayToStabilityDataPoints(response.data.data.measurements);
  },

  getThresholds: async (vehicleId: string): Promise<StabilityThreshold> => {
    const response = await get<StabilityThresholdDTO>(`/api/stability/${vehicleId}/thresholds`);
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener los umbrales');
    }
    return mapThresholdDTOToThreshold(response.data);
  },

  updateThresholds: async (vehicleId: string, data: Partial<StabilityThreshold>): Promise<StabilityThreshold> => {
    const response = await put<StabilityThresholdDTO>(`/api/stability/${vehicleId}/thresholds`, data);
    if (!response.success) {
      throw new Error(response.message || 'Error al actualizar los umbrales');
    }
    return mapThresholdDTOToThreshold(response.data);
  },

  analyze: async (data: Partial<StabilitySessionDTO>): Promise<StabilitySession> => {
    const response = await post<StabilitySessionDTO>('/api/stability/analyze', data);
    if (!response.success) {
      throw new Error(response.message || 'Error al analizar la sesión');
    }
    return mapSessionDTOToSession(response.data);
  },

  compareSession: async (sessionId: string, comparisonId: string): Promise<{
    primary: StabilitySession;
    comparison: StabilitySession;
    analysis: {
      stabilityDifference: number;
      riskLevelChange: string;
      significantEvents: string[];
      recommendations: string[];
    };
  }> => {
    const response = await get<{
      primary: StabilitySessionDTO;
      comparison: StabilitySessionDTO;
      analysis: {
        stabilityDifference: number;
        riskLevelChange: string;
        significantEvents: string[];
        recommendations: string[];
      };
    }>(`/api/stability/compare/${sessionId}/${comparisonId}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al comparar las sesiones');
    }

    return {
      primary: mapSessionDTOToSession(response.data.primary),
      comparison: mapSessionDTOToSession(response.data.comparison),
      analysis: response.data.analysis
    };
  },

  // Reprocesar eventos con datos CAN
  reprocessEvents: async (sessionId: string): Promise<any> => {
    const response = await post(`/api/stability/events/${sessionId}/reprocess`);
    if (!response.success) {
      throw new Error(response.message || 'Error al reprocesar eventos');
    }
    return response.data;
  }
}; 