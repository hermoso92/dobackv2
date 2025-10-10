import { TelemetryData } from '../types/telemetry';
import { get, post } from './api';

export const telemetryService = {
    async getCurrent(vehicleId: string): Promise<TelemetryData> {
        const response = await get<TelemetryData>(`/telemetry/current?vehicleId=${vehicleId}`);
        return response.data;
    },

    async getHistory(vehicleId: string, startDate: string, endDate: string): Promise<TelemetryData[]> {
        const response = await get<TelemetryData[]>(`/telemetry/history?vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    async upload(data: any): Promise<void> {
        await post('/telemetry/upload', data);
    }
}; 