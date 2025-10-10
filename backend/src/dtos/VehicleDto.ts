import { VehicleStatus, VehicleType } from '@prisma/client';
import { z } from 'zod';

export const CreateVehicleSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    model: z.string().min(1, 'El modelo es requerido'),
    licensePlate: z.string().min(1, 'La matrícula es requerida'),
    brand: z.string().min(1, 'La marca es requerida'),
    type: z.nativeEnum(VehicleType),
    status: z.nativeEnum(VehicleStatus).optional().default(VehicleStatus.ACTIVE),
    organizationId: z.string().uuid('ID de organización inválido')
});

export type CreateVehicleDto = z.infer<typeof CreateVehicleSchema>;

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export type UpdateVehicleDto = z.infer<typeof UpdateVehicleSchema>;
