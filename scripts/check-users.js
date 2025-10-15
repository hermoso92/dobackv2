/**
 * Script para verificar qué usuarios existen en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    console.log('👥 VERIFICANDO USUARIOS EN LA BASE DE DATOS');
    console.log('==========================================\n');

    try {
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        // Obtener todos los usuarios
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organizationId: true,
                status: true
            }
        });

        console.log(`📊 Total de usuarios: ${users.length}\n`);

        if (users.length > 0) {
            console.log('👤 Usuarios disponibles:');
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email}`);
                console.log(`      - Nombre: ${user.name || 'N/A'}`);
                console.log(`      - Rol: ${user.role || 'N/A'}`);
                console.log(`      - Organización: ${user.organizationId || 'N/A'}`);
                console.log(`      - Estado: ${user.status || 'N/A'}`);
                console.log('');
            });

            // Mostrar el primer usuario activo para pruebas
            const activeUser = users.find(u => u.status === 'ACTIVE' || u.status === 'active');
            if (activeUser) {
                console.log('🔑 Usuario recomendado para pruebas:');
                console.log(`   Email: ${activeUser.email}`);
                console.log(`   ID: ${activeUser.id}`);
                console.log(`   Organización: ${activeUser.organizationId}`);
            }
        } else {
            console.log('⚠️ No hay usuarios en la base de datos');
        }

        // Verificar organizaciones
        console.log('\n🏢 VERIFICANDO ORGANIZACIONES:');
        const organizations = await prisma.organization.findMany({
            select: {
                id: true,
                name: true
            }
        });

        organizations.forEach(org => {
            console.log(`   - ${org.id}: ${org.name}`);
        });

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar verificación
checkUsers().catch(console.error);
