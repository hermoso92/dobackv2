import { Vehicle } from '../types/vehicle';
export interface VehicleWithMetrics extends Vehicle {
    lastActive: string;
    metrics: { stabilityScore: number; maintenanceStatus: string };
    sessionsCount: number;
    alertsCount: number;
}

export const BOMBEROS_MADRID_VEHICLES: VehicleWithMetrics[] = [
    {
        id: 1,
        name: 'Bomba Escalera 1',
        model: 'Rosenbauer AT',
        plateNumber: 'M-1234-BM',
        organizationId: 1,
        status: 'ACTIVE',
        type: 'BOMBA_ESCALERA',
        brand: 'Rosenbauer',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: '2024-06-10T12:34:56.789Z',
        metrics: { stabilityScore: 87, maintenanceStatus: 'OK' },
        sessionsCount: 12,
        alertsCount: 2
    },
    {
        id: 2,
        name: 'Nodriza 2',
        model: 'Iveco Magirus',
        plateNumber: 'M-2345-BM',
        organizationId: 1,
        status: 'ACTIVE',
        type: 'NODRIZA',
        brand: 'Iveco',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: '2024-06-09T09:12:00.000Z',
        metrics: { stabilityScore: 92, maintenanceStatus: 'OK' },
        sessionsCount: 8,
        alertsCount: 1
    },
    {
        id: 3,
        name: 'Autoescala 3',
        model: 'Mercedes-Benz Atego',
        plateNumber: 'M-3456-BM',
        organizationId: 1,
        status: 'MAINTENANCE',
        type: 'AUTOESCALA',
        brand: 'Mercedes-Benz',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: '2024-06-08T15:20:00.000Z',
        metrics: { stabilityScore: 75, maintenanceStatus: 'Pendiente' },
        sessionsCount: 5,
        alertsCount: 3
    },
    {
        id: 4,
        name: 'Bomba Urbana 4',
        model: 'Scania P320',
        plateNumber: 'M-4567-BM',
        organizationId: 1,
        status: 'ACTIVE',
        type: 'BOMBA_URBANA',
        brand: 'Scania',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: '2024-06-10T08:00:00.000Z',
        metrics: { stabilityScore: 90, maintenanceStatus: 'OK' },
        sessionsCount: 10,
        alertsCount: 0
    },
    {
        id: 5,
        name: 'Unidad de Rescate 5',
        model: 'MAN TGM',
        plateNumber: 'M-5678-BM',
        organizationId: 1,
        status: 'ACTIVE',
        type: 'UNIDAD_RESCATE',
        brand: 'MAN',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: '2024-06-07T18:45:00.000Z',
        metrics: { stabilityScore: 85, maintenanceStatus: 'OK' },
        sessionsCount: 7,
        alertsCount: 1
    }
]; 