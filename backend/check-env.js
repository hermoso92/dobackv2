// Verificar variables de entorno
console.log('🔍 Verificando configuración...');

// Verificar DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
    console.log('✅ DATABASE_URL encontrada');
    console.log('📊 Tipo de BD:', databaseUrl.includes('postgresql') ? 'PostgreSQL' : 'Otro');
} else {
    console.log('❌ DATABASE_URL no encontrada');
}

// Verificar directorio de datos
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data/datosDoback/CMadrid');
if (fs.existsSync(dataPath)) {
    console.log('✅ Directorio de datos encontrado');
    
    const vehicles = fs.readdirSync(dataPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    console.log(`📁 Vehículos: ${vehicles.join(', ')}`);
    
    // Contar archivos
    let totalFiles = 0;
    for (const vehicle of vehicles) {
        const vehiclePath = path.join(dataPath, vehicle);
        for (const type of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
            const typePath = path.join(vehiclePath, type);
            if (fs.existsSync(typePath)) {
                const files = fs.readdirSync(typePath).filter(f => f.endsWith('.txt'));
                totalFiles += files.length;
            }
        }
    }
    console.log(`📊 Total archivos: ${totalFiles}`);
    
} else {
    console.log('❌ Directorio de datos no encontrado');
}

console.log('✅ Verificación completada');