import { Organization, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';



export class OrganizationService {
    async createOrganization(data: {
        name: string;
        apiKey: string;
        description?: string;
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

    async getAllOrganizations(): Promise<Organization[]> {
        return prisma.organization.findMany();
    }
}
