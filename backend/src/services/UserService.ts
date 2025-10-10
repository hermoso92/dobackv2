import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

interface GetUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
}

export class UserService {
    async getUsers(options: GetUsersOptions = {}): Promise<{ users: User[]; total: number }> {
        const { page = 1, limit = 10, search, role } = options;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) where.role = role;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        return { users, total };
    }

    async getUserById(id: string): Promise<User> {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw ApiError.notFound('User not found');
        return user;
    }

    async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        const existing = await prisma.user.findUnique({ where: { email: userData.email } });
        if (existing) throw ApiError.badRequest('Email already exists');
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                status: 'ACTIVE'
            }
        });
        return user;
    }

    async updateUser(id: string, userData: Partial<User>): Promise<User> {
        const user = await prisma.user.update({
            where: { id },
            data: userData
        });
        return user;
    }

    async deleteUser(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }

    async resetUserPassword(id: string, newPassword: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    }
}
