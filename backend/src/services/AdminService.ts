import { Organization, PrismaClient, User, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AdminService {
    async createUser(data: {
        email: string;
        name: string;
        role: UserRole;
        organizationId: string;
        password: string;
    }): Promise<User> {
        try {
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    organizationId: data.organizationId,
                    password: data.password
                }
            });
            return user;
        } catch (error) {
            logger.error('Error creating user', { error });
            throw error;
        }
    }

    async getUsersByOrganization(organizationId: string): Promise<User[]> {
        return prisma.user.findMany({ where: { organizationId } });
    }

    async createOrganization(data: {
        name: string;
        description?: string;
        apiKey: string;
    }): Promise<Organization> {
        return prisma.organization.create({ data });
    }

    async getOrganizationById(id: string): Promise<Organization | null> {
        return prisma.organization.findUnique({ where: { id } });
    }

    async updateOrganization(
        id: string,
        data: Partial<Organization>
    ): Promise<Organization | null> {
        return prisma.organization.update({ where: { id }, data });
    }

    async countUsersByOrganization(id: string): Promise<number> {
        return prisma.user.count({ where: { organizationId: id } });
    }

    async countVehiclesByOrganization(id: string): Promise<number> {
        return prisma.vehicle.count({ where: { organizationId: id } });
    }

    async countEventsByOrganization(id: string): Promise<number> {
        return prisma.event.count({ where: { organizationId: id } });
    }
}
