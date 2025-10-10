const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        console.log('👤 Creando usuario de prueba...');

        // Obtener la organización existente (Bomberos Madrid)
        const organization = await prisma.organization.findFirst();
        
        if (!organization) {
            console.log('❌ No se encontró ninguna organización');
            return;
        }

        console.log(`✅ Usando organización: ${organization.name} (${organization.id})`);

        // Verificar si el usuario ya existe
        let user = await prisma.user.findFirst({
            where: { email: 'test@bomberosmadrid.es' }
        });

        if (!user) {
            // Crear usuario de prueba
            user = await prisma.user.create({
                data: {
                    email: 'test@bomberosmadrid.es',
                    name: 'Usuario de Prueba',
                    password: '$2b$10$example.hash.for.testing', // Hash de ejemplo
                    organizationId: organization.id,
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }
            });
            console.log(`✅ Usuario creado: ${user.email} (${user.id})`);
        } else {
            console.log(`✅ Usuario existente: ${user.email} (${user.id})`);
        }

        // Generar token JWT real
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

        console.log('\n🔑 Token JWT generado:');
        console.log(token);
        console.log('\n📋 Información del usuario:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.name}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Organización: ${organization.name} (${organization.id})`);
        console.log(`   Estado: ${user.status}`);

        console.log('\n🧪 Para probar la API:');
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:9998/api/geofences`);

    } catch (error) {
        console.error('❌ Error creando usuario de prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
