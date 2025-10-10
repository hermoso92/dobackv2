import { Alert } from '../types';
import { apiService } from './api';
export const alertService = {
  getAll: async () => {
    return await apiService.get<Alert[]>('/alerts');
  },

  getById: async (id: number) => {
    return await apiService.get<Alert>(`/alerts/${id}`);
  },

  getByVehicle: (vehicleId: number) => apiService.get<Alert[]>(`/alerts/vehicle/${vehicleId}`),

  acknowledge: async (id: number) => {
    return await apiService.post<Alert>(`/alerts/${id}/acknowledge`);
  },

  resolve: async (id: number) => {
    return await apiService.post<Alert>(`/alerts/${id}/resolve`);
  },
}; 