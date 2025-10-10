const bcrypt = require('bcrypt');

async function createSuperAdmin() {
    console.log('🔐 Generando hash de contraseña...');
    
    try {
        const password = 'superadmin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('✅ Hash generado exitosamente');
        console.log('📧 Email: superadmin@dobacksoft.com');
        console.log('🔑 Contraseña: superadmin123');
        console.log('🔐 Hash:', hashedPassword);
        
        console.log('\n📋 SQL para insertar:');
        console.log(`INSERT INTO "User" (id, email, name, password, "organizationId", "createdAt", "updatedAt", role, status) VALUES (gen_random_uuid(), 'superadmin@dobacksoft.com', 'Super Administrador', '${hashedPassword}', NULL, NOW(), NOW(), 'ADMIN', 'ACTIVE') ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createSuperAdmin(); 