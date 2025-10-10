import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UsuarioService {
    async crearUsuario(
        data: {
            email: string;
            name: string;
            password?: string;
            role: UserRole;
            organizationId: string;
        },
        passwordPlano: string
    ): Promise<any> {
        const hash = await bcrypt.hash(passwordPlano, 10);
        return prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                password: hash,
                role: data.role,
                organizationId: data.organizationId
            }
        });
    }

    async obtenerUsuarioPorId(id: string): Promise<any | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async obtenerUsuarioPorEmail(email: string): Promise<any | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async listarUsuarios(): Promise<any[]> {
        return prisma.user.findMany();
    }

    async actualizarUsuario(id: string, data: Partial<any>): Promise<any | null> {
        return prisma.user.update({ where: { id }, data });
    }

    async eliminarUsuario(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }

    async autenticar(email: string, passwordPlano: string): Promise<any | null> {
        const usuario = await this.obtenerUsuarioPorEmail(email);
        if (!usuario) return null;
        const valido = await bcrypt.compare(passwordPlano, usuario.password);
        return valido ? usuario : null;
    }
}
