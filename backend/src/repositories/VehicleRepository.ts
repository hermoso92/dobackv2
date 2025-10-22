
import { prisma } from '../lib/prisma';
import { Vehicle } from '../types/vehicle';



export class VehicleRepository {
    async findAll(): Promise<Vehicle[]> {
        return prisma.vehicle.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    async findById(id: string): Promise<Vehicle | null> {
        return prisma.vehicle.findUnique({
            where: { id }
        });
    }

    async create(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
        return prisma.vehicle.create({
            data
        });
    }

    async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
        return prisma.vehicle.update({
            where: { id },
            data
        });
    }

    async delete(id: string): Promise<Vehicle> {
        return prisma.vehicle.update({
            where: { id },
            data: { isActive: false }
        });
    }
}
