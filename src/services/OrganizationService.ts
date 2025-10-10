import { Organization, PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class OrganizationService {
    async getOrganizations(options: { page?: number; limit?: number; search?: string } = {}): Promise<{ organizations: Organization[]; total: number }> {
        try {
            const { page = 1, limit = 10, search } = options;
            const where = search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { type: { contains: search, mode: 'insensitive' } },
                        { contactPerson: { contains: search, mode: 'insensitive' } }
                    ]
                }
                : {};
            const [organizations, total] = await Promise.all([
                prisma.organization.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.organization.count({ where })
            ]);
            return { organizations, total };
        } catch (error) {
            logger.error('Error getting organizations', { error });
            throw error;
        }
    }

    async getOrganizationById(id: string): Promise<Organization> {
        const organization = await prisma.organization.findUnique({ where: { id } });
        if (!organization) {
            throw ApiError.notFound('Organization not found');
        }
        return organization;
    }

    async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
        return prisma.organization.create({ data });
    }

    async updateOrganization(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Organization> {
        return prisma.organization.update({ where: { id }, data });
    }

    async deleteOrganization(id: string): Promise<void> {
        await prisma.organization.delete({ where: { id } });
    }

    // Ejemplo de consulta avanzada: obtener usuarios y vehículos de la organización
    async getOrganizationDetails(id: string) {
        return prisma.organization.findUnique({
            where: { id },
            include: {
                users: true,
                vehicles: true
            }
        });
    }

    // Otros métodos avanzados pueden agregarse aquí según el nuevo modelo
} 