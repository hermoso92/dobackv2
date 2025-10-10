import { StabilitySession } from '../types/stability';
import { get, post } from './api';

export const stabilityService = {
    async getCurrent(vehicleId: string): Promise<StabilitySession> {
        const response = await get<StabilitySession>(`/stability/current?vehicleId=${vehicleId}`);
        return response.data;
    },

    async getHistory(vehicleId: string, startDate: string, endDate: string): Promise<StabilitySession[]> {
        const response = await get<StabilitySession[]>(`/stability/history?vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    async analyze(data: any): Promise<StabilitySession> {
        const response = await post<StabilitySession>('/stability/analyze', data);
        return response.data;
    }
}; 