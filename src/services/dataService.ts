import { DashboardData, EventData, StabilityData, TelemetryData, VehicleData } from '../types/data';
import { FileService } from './fileService';

export class DataService {
    private static instance: DataService;
    private fileService: FileService;

    private constructor() {
        this.fileService = FileService.getInstance();
    }

    public static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    // Métodos para Telemetría
    public async saveTelemetryData(vehicleId: string, data: TelemetryData[]): Promise<void> {
        const filename = `telemetry/${vehicleId}/${Date.now()}.json`;
        await this.fileService.saveData(filename, data);
    }

    public async loadTelemetryData(vehicleId: string, startTime: number, endTime: number): Promise<TelemetryData[]> {
        const filename = `telemetry/${vehicleId}/data.json`;
        const data = await this.fileService.loadData<TelemetryData[]>(filename);
        return data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
    }

    // Métodos para Estabilidad
    public async saveStabilityData(vehicleId: string, data: StabilityData[]): Promise<void> {
        const filename = `stability/${vehicleId}/${Date.now()}.json`;
        await this.fileService.saveData(filename, data);
    }

    public async loadStabilityData(vehicleId: string, startTime: number, endTime: number): Promise<StabilityData[]> {
        const filename = `stability/${vehicleId}/data.json`;
        const data = await this.fileService.loadData<StabilityData[]>(filename);
        return data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime);
    }

    // Métodos para Vehículos
    public async saveVehicleData(data: VehicleData[]): Promise<void> {
        const filename = 'vehicles/data.json';
        await this.fileService.saveData(filename, data);
    }

    public async loadVehicleData(): Promise<VehicleData[]> {
        const filename = 'vehicles/data.json';
        return await this.fileService.loadData<VehicleData[]>(filename);
    }

    // Métodos para Eventos
    public async saveEventData(data: EventData[]): Promise<void> {
        const filename = 'events/data.json';
        await this.fileService.saveData(filename, data);
    }

    public async loadEventData(): Promise<EventData[]> {
        const filename = 'events/data.json';
        return await this.fileService.loadData<EventData[]>(filename);
    }

    // Métodos para Dashboard
    public async saveDashboardData(data: DashboardData): Promise<void> {
        const filename = 'dashboard/data.json';
        await this.fileService.saveData(filename, data);
    }

    public async loadDashboardData(): Promise<DashboardData> {
        const filename = 'dashboard/data.json';
        return await this.fileService.loadData<DashboardData>(filename);
    }

    // Método para verificar si existen datos reales
    public async hasRealData(type: 'telemetry' | 'stability' | 'vehicles' | 'events' | 'dashboard'): Promise<boolean> {
        const filename = `${type}/data.json`;
        return await this.fileService.fileExists(filename);
    }
} 