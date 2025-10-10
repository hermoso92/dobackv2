import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateVehicleKPI } from '../calculateVehicleKPI';

vi.mock('@prisma/client');
const prisma = new PrismaClient() as any;

// Mock turf
vi.mock('@turf/boolean-point-in-polygon', () => () => true);
vi.mock('@turf/helpers', () => ({ point: vi.fn(), polygon: vi.fn() }));

describe('calculateVehicleKPI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calcula correctamente clave2Minutes y clave5Minutes fuera del parque', async () => {
        // Mock zonas: ninguna zona (todo fuera del parque)
        prisma.zone.findMany.mockResolvedValue([]);
        // Mock sesiones
        prisma.session.findMany.mockResolvedValue([{ id: 's1' }]);
        // Mock GPS: dos puntos, 10 minutos de diferencia
        prisma.gpsMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T10:00:00Z'), latitude: 1, longitude: 1 },
            { timestamp: new Date('2024-01-01T10:10:00Z'), latitude: 1, longitude: 1 }
        ]);
        // Mock rotativo: ON al inicio
        prisma.rotativoMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T09:59:00Z'), state: 'ON' }
        ]);
        // Mock eventos
        prisma.eventVehicle.findMany.mockResolvedValue([]);
        prisma.event.findMany.mockResolvedValue([]);
        // Mock persistencia
        prisma.vehicleKPI.findFirst.mockResolvedValue(null);
        prisma.vehicleKPI.create.mockResolvedValue({} as any);

        await calculateVehicleKPI('veh1', new Date('2024-01-01T00:00:00Z'), 'org1');
        expect(prisma.vehicleKPI.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ clave2Minutes: 10, clave5Minutes: 0 })
            })
        );
    });

    it('calcula correctamente clave5Minutes fuera del parque y rotativo OFF', async () => {
        prisma.zone.findMany.mockResolvedValue([]);
        prisma.session.findMany.mockResolvedValue([{ id: 's1' }]);
        prisma.gpsMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T10:00:00Z'), latitude: 1, longitude: 1 },
            { timestamp: new Date('2024-01-01T10:10:00Z'), latitude: 1, longitude: 1 }
        ]);
        prisma.rotativoMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T09:59:00Z'), state: 'OFF' }
        ]);
        prisma.eventVehicle.findMany.mockResolvedValue([]);
        prisma.event.findMany.mockResolvedValue([]);
        prisma.vehicleKPI.findFirst.mockResolvedValue(null);
        prisma.vehicleKPI.create.mockResolvedValue({} as any);

        await calculateVehicleKPI('veh1', new Date('2024-01-01T00:00:00Z'), 'org1');
        expect(prisma.vehicleKPI.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ clave2Minutes: 0, clave5Minutes: 10 })
            })
        );
    });

    it('no suma minutos fuera del parque si está en zona parque', async () => {
        prisma.zone.findMany.mockResolvedValue([
            { id: 'z1', type: 'parque', geometry: { coordinates: [[[1, 1], [2, 2], [3, 3], [1, 1]]] } }
        ]);
        prisma.session.findMany.mockResolvedValue([{ id: 's1' }]);
        prisma.gpsMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T10:00:00Z'), latitude: 1, longitude: 1 },
            { timestamp: new Date('2024-01-01T10:10:00Z'), latitude: 1, longitude: 1 }
        ]);
        prisma.rotativoMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T09:59:00Z'), state: 'ON' }
        ]);
        prisma.eventVehicle.findMany.mockResolvedValue([]);
        prisma.event.findMany.mockResolvedValue([]);
        prisma.vehicleKPI.findFirst.mockResolvedValue(null);
        prisma.vehicleKPI.create.mockResolvedValue({} as any);

        await calculateVehicleKPI('veh1', new Date('2024-01-01T00:00:00Z'), 'org1');
        expect(prisma.vehicleKPI.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ outOfParkMinutes: 0 })
            })
        );
    });

    it('cuenta eventos críticos y moderados', async () => {
        prisma.zone.findMany.mockResolvedValue([]);
        prisma.session.findMany.mockResolvedValue([{ id: 's1' }]);
        prisma.gpsMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T10:00:00Z'), latitude: 1, longitude: 1 },
            { timestamp: new Date('2024-01-01T10:10:00Z'), latitude: 1, longitude: 1 }
        ]);
        prisma.rotativoMeasurement.findMany.mockResolvedValue([
            { timestamp: new Date('2024-01-01T09:59:00Z'), state: 'ON' }
        ]);
        prisma.eventVehicle.findMany.mockResolvedValue([{ eventId: 'e1' }, { eventId: 'e2' }]);
        prisma.event.findMany.mockResolvedValue([
            { id: 'e1', status: 'ACTIVE', type: 'STABILITY', data: { severity: 'HIGH' } },
            { id: 'e2', status: 'ACTIVE', type: 'STABILITY', data: { severity: 'MODERATE' } }
        ]);
        prisma.vehicleKPI.findFirst.mockResolvedValue(null);
        prisma.vehicleKPI.create.mockResolvedValue({} as any);

        await calculateVehicleKPI('veh1', new Date('2024-01-01T00:00:00Z'), 'org1');
        expect(prisma.vehicleKPI.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ eventsHigh: 1, eventsModerate: 1 })
            })
        );
    });
}); 