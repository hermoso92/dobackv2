import { TelemetryData } from '../types/telemetry';
import { Vehicle, VehicleStatus, VehicleType } from '../types/vehicle';
import { logger } from '../utils/logger';
class DataService {
    private static instance: DataService;

    private constructor() { }

    public static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    public async getMockVehicles(): Promise<Vehicle[]> {
        logger.info('Generando datos de prueba para vehículos');

        return [
            {
                id: 1,
                name: 'Vehículo de Prueba 1',
                model: 'Modelo A',
                brand: 'Marca X',
                type: 'TRUCK' as VehicleType,
                status: 'ACTIVE' as VehicleStatus
            },
            {
                id: 2,
                name: 'Vehículo de Prueba 2',
                model: 'Modelo B',
                brand: 'Marca Y',
                type: 'VAN' as VehicleType,
                status: 'ACTIVE' as VehicleStatus
            },
            {
                id: 3,
                name: 'Vehículo de Prueba 3',
                model: 'Modelo C',
                brand: 'Marca Z',
                type: 'TRUCK' as VehicleType,
                status: 'MAINTENANCE' as VehicleStatus
            }
        ];
    }

    public async getMockTelemetryData(vehicleId: number): Promise<TelemetryData[]> {
        logger.info('Generando datos de prueba para telemetría', { vehicleId });

        const now = new Date();
        const data: TelemetryData[] = [];

        // Generar 50 puntos de datos simulados
        for (let i = 0; i < 50; i++) {
            const timestamp = new Date(now.getTime() - (50 - i) * 1000); // Un punto por segundo
            data.push({
                id: `mock-${i}`,
                vehicleId: vehicleId,
                timestamp: timestamp.toISOString(),
                createdAt: timestamp.toISOString(),
                updatedAt: timestamp.toISOString(),
                acceleration_x: Math.sin(i / 5) * 2,
                acceleration_y: Math.cos(i / 5) * 2,
                acceleration_z: Math.sin(i / 10) * 1.5,
                gyro_x: Math.sin(i / 8) * 3,
                gyro_y: Math.cos(i / 8) * 3,
                gyro_z: Math.sin(i / 12) * 2,
                angular_x: Math.sin(i / 6) * 4,
                angular_y: Math.cos(i / 6) * 4,
                angular_z: Math.sin(i / 9) * 3,
                speed: Math.min(120, Math.max(0, 20 + Math.sin(i / 10) * 100)),
                rpm: Math.min(6000, Math.max(800, 1000 + Math.sin(i / 8) * 5000)),
                lateral_acc: Math.sin(i / 7) * 1.5,
                roll_angle: Math.sin(i / 6) * 5,
                pitch_angle: Math.cos(i / 6) * 5,
                temperature: Math.min(120, Math.max(60, 80 + Math.sin(i / 15) * 40)),
                battery: Math.min(14, Math.max(11, 12 + Math.sin(i / 20) * 2)),
                fuel: Math.max(0, Math.min(100, 75 - i * 0.5))
            });
        }

        return data;
    }
}

export const dataService = DataService.getInstance(); 