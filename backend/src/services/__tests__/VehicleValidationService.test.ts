import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../utils/ApiError';
import { prisma } from '../../utils/db';
import { VehicleValidationService } from '../VehicleValidationService';

// Mock de Prisma
vi.mock('../../utils/db', () => ({
    prisma: {
        session: {
            findFirst: vi.fn()
        },
        maintenanceRequest: {
            findFirst: vi.fn()
        }
    }
}));

describe('VehicleValidationService', () => {
    let service: VehicleValidationService;

    beforeEach(() => {
        service = new VehicleValidationService();
        vi.clearAllMocks();
    });

    describe('validateVehicle', () => {
        it('should validate a vehicle with valid ID', async () => {
            // Arrange
            const vehicleId = 'test-123';
            const organizationId = 1;

            // Act & Assert
            await expect(service.validateVehicle(vehicleId, organizationId)).resolves.not.toThrow();
        });

        it('should throw error for invalid vehicle ID', async () => {
            // Arrange
            const vehicleId = 'test@123'; // Invalid character @
            const organizationId = 1;

            // Act & Assert
            await expect(service.validateVehicle(vehicleId, organizationId)).rejects.toThrow(
                ApiError
            );
        });
    });

    describe('validateVehicleForSession', () => {
        it('should allow session for valid vehicle without active session or maintenance', async () => {
            // Arrange
            const vehicleId = 'test-123';
            const organizationId = 1;

            (prisma.session.findFirst as any).mockResolvedValue(null);
            (prisma.maintenanceRequest.findFirst as any).mockResolvedValue(null);

            // Act
            const result = await service.validateVehicleForSession(vehicleId, organizationId);

            // Assert
            expect(result.canStartSession).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should not allow session for vehicle with active session', async () => {
            // Arrange
            const vehicleId = 'test-123';
            const organizationId = 1;

            (prisma.session.findFirst as any).mockResolvedValue({
                id: 1,
                vehicleId: 1,
                startTime: new Date(),
                endTime: null
            });
            (prisma.maintenanceRequest.findFirst as any).mockResolvedValue(null);

            // Act
            const result = await service.validateVehicleForSession(vehicleId, organizationId);

            // Assert
            expect(result.canStartSession).toBe(false);
            expect(result.reason).toBe('Vehicle has an active session');
        });

        it('should not allow session for vehicle with pending maintenance', async () => {
            // Arrange
            const vehicleId = 'test-123';
            const organizationId = 1;

            (prisma.session.findFirst as any).mockResolvedValue(null);
            (prisma.maintenanceRequest.findFirst as any).mockResolvedValue({
                id: 1,
                vehicleId: 1,
                status: 'pending'
            });

            // Act
            const result = await service.validateVehicleForSession(vehicleId, organizationId);

            // Assert
            expect(result.canStartSession).toBe(false);
            expect(result.reason).toBe('Vehicle has pending maintenance');
        });

        it('should throw error for invalid vehicle ID', async () => {
            // Arrange
            const vehicleId = 'test@123'; // Invalid character @
            const organizationId = 1;

            // Act & Assert
            await expect(
                service.validateVehicleForSession(vehicleId, organizationId)
            ).rejects.toThrow(ApiError);
        });
    });
});
