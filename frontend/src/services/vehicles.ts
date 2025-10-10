import { apiService } from './api';

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'REPAIR';
export type VehicleType = 'TRUCK' | 'VAN' | 'CAR' | 'BUS' | 'MOTORCYCLE' | 'OTHER';

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  brand: string;
  type: VehicleType;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface CreateVehicleDTO {
  name: string;
  model: string;
  plate: string;
  brand: string;
  type: string;
  status: VehicleStatus;
  organizationId: string;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> { }

export interface VehicleFilters {
  search?: string;
  status?: string;
  brand?: string;
  model?: string;
  year?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function getAllVehicles(token: string, parkId?: string) {
  const url = parkId ? `/api/vehicles?parkId=${parkId}` : '/api/vehicles';
  // apiService.get ya añade el token automáticamente
  const response = await apiService.get(url);
  // response debe tener la forma { success, data }
  if (!response.success) throw new Error(response.message || 'Error al obtener vehículos');
  return response.data;
}

export async function getVehicleById(id: string, token: string) {
  const response = await apiService.get(`/api/vehicles/${id}`);
  if (!response.success) throw new Error(response.message || 'Error al obtener vehículo');
  return response.data;
}

export async function createVehicle(data: any, token: string) {
  const response = await apiService.post('/api/vehicles', data);
  if (!response.success) throw new Error(response.message || 'Error al crear vehículo');
  return response.data;
}

export async function updateVehicle(id: string, data: any, token: string) {
  const response = await apiService.put(`/api/vehicles/${id}`, data);
  if (!response.success) throw new Error(response.message || 'Error al actualizar vehículo');
  return response.data;
}

export async function deleteVehicle(id: string, token: string) {
  const response = await apiService.delete(`/api/vehicles/${id}`);
  if (!response.success) throw new Error(response.message || 'Error al eliminar vehículo');
}

export const vehicleService = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
}; 