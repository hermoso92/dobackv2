import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
    async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password'> & { password: string }): Promise<User> {
        const hash = await bcrypt.hash(data.password, 10);
        return prisma.user.create({
            data: {
                ...data,
                password: hash,
            },
        });
    }

    async getUserById(id: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async listUsers(): Promise<User[]> {
        return prisma.user.findMany();
    }

    async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password'>>): Promise<User | null> {
        return prisma.user.update({ where: { id }, data });
    }

    async deleteUser(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }

    async authenticate(email: string, plainPassword: string): Promise<User | null> {
        const user = await this.getUserByEmail(email);
        if (!user) return null;
        const valid = await bcrypt.compare(plainPassword, user.password);
        return valid ? user : null;
    }

    // Relaciones y consultas avanzadas (adaptadas al nuevo modelo)
    async getOrganization(id: string) {
        return prisma.user.findUnique({ where: { id }, include: { organization: true } });
    }

    async getSessions(id: string) {
        return prisma.user.findUnique({ where: { id }, include: { sessions: true } });
    }

    async getNotifications(id: string) {
        return prisma.user.findUnique({ where: { id }, include: { notifications: true } });
    }

    async getLogs(id: string) {
        return prisma.user.findUnique({ where: { id }, include: { logs: true } });
    }

    // Métodos adicionales según el nuevo modelo pueden agregarse aquí
} 