import { store } from '../store';
import { addTelemetryData, setError } from '../store/slices/telemetrySlice';
import { TelemetryData } from '../types';
import { apiService } from './api';
class TelemetryService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // 1 segundo inicial

  connect(vehicleId: number) {
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(`ws://localhost:8080/telemetry/${vehicleId}`);

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: TelemetryData = JSON.parse(event.data);
          store.dispatch(addTelemetryData(data));
        } catch (error) {
          console.error('Error parsing telemetry data:', error);
          store.dispatch(setError('Error processing telemetry data'));
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.attemptReconnect(vehicleId);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        store.dispatch(setError('WebSocket connection error'));
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      store.dispatch(setError('Failed to establish WebSocket connection'));
      this.attemptReconnect(vehicleId);
    }
  }

  private attemptReconnect(vehicleId: number) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnectTimeout *= 2; // Exponential backoff
        this.connect(vehicleId);
      }, this.reconnectTimeout);
    } else {
      console.error('Max reconnection attempts reached');
      store.dispatch(setError('Unable to establish connection after multiple attempts'));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // API Methods
  async getCurrent(vehicleId: number): Promise<TelemetryData> {
    return await apiService.get<TelemetryData>(`/telemetry/current?vehicle_id=${vehicleId}`);
  }

  async getHistory(vehicleId: number, startDate?: Date, endDate?: Date): Promise<TelemetryData[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    return await apiService.get<TelemetryData[]>(`/telemetry/history?vehicle_id=${vehicleId}&${params.toString()}`);
  }

  async upload(data: Partial<TelemetryData>): Promise<TelemetryData> {
    return await apiService.post<TelemetryData>('/telemetry/upload', data);
  }
}

export const telemetryService = new TelemetryService(); 