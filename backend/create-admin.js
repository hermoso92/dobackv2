const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando usuario admin...');
    
    const existing = await prisma.user.findUnique({ 
      where: { email: 'admin@cosigein.com' } 
    });
    
    if (existing) {
      console.log('✅ Usuario admin ya existe:', existing.email);
      console.log('👤 Nombre:', existing.name);
      console.log('🔑 Rol:', existing.role);
    } else {
      console.log('🔧 Creando usuario admin...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const admin = await prisma.user.create({
        data: {
          email: 'admin@cosigein.com',
          name: 'Administrador',
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: null
        }
      });
      
      console.log('✅ Usuario admin creado exitosamente!');
      console.log('📧 Email:', admin.email);
      console.log('👤 Nombre:', admin.name);
      console.log('🔑 Rol:', admin.role);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();