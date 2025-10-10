import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAndCreateSuperAdmin() {
    console.log('🔍 Verificando usuario Super Admin...');

    try {
        // Verificar si el usuario superadmin ya existe
        const existingSuperAdmin = await prisma.user.findUnique({
            where: { email: 'superadmin@dobacksoft.com' }
        });

        if (existingSuperAdmin) {
            console.log('✅ Usuario Super Admin ya existe');
            console.log(`👤 Nombre: ${existingSuperAdmin.name}`);
            console.log(`📧 Email: ${existingSuperAdmin.email}`);
            console.log(`🔑 Rol: ${existingSuperAdmin.role}`);
            console.log(`🏢 Organización: ${existingSuperAdmin.organizationId || 'Sistema'}`);
            console.log(`📊 Estado: ${existingSuperAdmin.status}`);
            return;
        }

        // Crear usuario super admin si no existe
        console.log('🚀 Creando usuario Super Admin...');
        const superAdminPassword = await bcrypt.hash('superadmin123', 10);

        const superAdmin = await prisma.user.create({
            data: {
                email: 'superadmin@dobacksoft.com',
                name: 'Super Administrador',
                password: superAdminPassword,
                role: 'ADMIN',
                organizationId: null, // Super admin no pertenece a ninguna organización específica
                status: 'ACTIVE'
            }
        });

        console.log('✅ Usuario Super Admin creado exitosamente');
        console.log(`👤 Nombre: ${superAdmin.name}`);
        console.log(`📧 Email: ${superAdmin.email}`);
        console.log(`🔑 Credenciales: superadmin@dobacksoft.com / superadmin123`);
    } catch (error) {
        console.error('❌ Error al verificar/crear Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndCreateSuperAdmin();
