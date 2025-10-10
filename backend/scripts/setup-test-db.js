const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Configurando base de datos de pruebas...');

try {
    // Verificar si PostgreSQL está ejecutándose
    execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
    console.log('✅ PostgreSQL está ejecutándose');

    // Crear base de datos de pruebas si no existe
    try {
        execSync('createdb dobacksoft_test', { stdio: 'pipe' });
        console.log('✅ Base de datos de pruebas creada');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Base de datos de pruebas ya existe');
        } else {
            throw error;
        }
    }

    // Ejecutar migraciones en la base de datos de pruebas
    console.log('🔄 Ejecutando migraciones...');
    execSync('npx prisma migrate deploy --env-file env.test', { stdio: 'inherit' });
    
    console.log('✅ Base de datos de pruebas configurada correctamente');
} catch (error) {
    console.error('❌ Error configurando base de datos de pruebas:', error.message);
    console.log('\n📋 Instrucciones para configurar manualmente:');
    console.log('1. Asegúrate de que PostgreSQL esté ejecutándose');
    console.log('2. Crea un usuario de prueba: CREATE USER test WITH PASSWORD \'test\';');
    console.log('3. Crea la base de datos: CREATE DATABASE dobacksoft_test OWNER test;');
    console.log('4. Ejecuta: npx prisma migrate deploy --env-file env.test');
    process.exit(1);
}