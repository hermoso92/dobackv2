const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function verificarContraseñas() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando contraseñas de usuarios...');
        
        const usuarios = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                password: true,
                role: true
            }
        });
        
        console.log(`📊 Encontrados ${usuarios.length} usuarios:`);
        
        for (const user of usuarios) {
            console.log(`\n👤 Usuario: ${user.email}`);
            console.log(`   Contraseña hash: ${user.password.substring(0, 20)}...`);
            
            // Probar contraseñas comunes
            const passwordsToTest = ['123456', 'password', 'admin', 'test', 'doback'];
            
            for (const testPassword of passwordsToTest) {
                const isValid = await bcrypt.compare(testPassword, user.password);
                if (isValid) {
                    console.log(`   ✅ Contraseña válida: "${testPassword}"`);
                    break;
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarContraseñas();
