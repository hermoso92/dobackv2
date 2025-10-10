// Script simple para generar hash bcrypt
const bcrypt = require('bcryptjs'); // Usar bcryptjs que es más compatible

const password = 'superadmin123';
const saltRounds = 10;

console.log('Generando hash para contraseña:', password);
console.log('Salt rounds:', saltRounds);

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Hash generado:', hash);

// Verificar que el hash es correcto
const isValid = bcrypt.compareSync(password, hash);
console.log('Verificación del hash:', isValid ? 'CORRECTO' : 'INCORRECTO');

console.log('\nSQL para insertar:');
console.log(`INSERT INTO "User" (id, email, name, password, "organizationId", "createdAt", "updatedAt", role, status) VALUES (gen_random_uuid(), 'superadmin@dobacksoft.com', 'Super Administrador', '${hash}', NULL, NOW(), NOW(), 'ADMIN', 'ACTIVE') ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW();`); 