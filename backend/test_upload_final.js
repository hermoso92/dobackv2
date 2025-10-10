const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

console.log('🧪 TEST FINAL - SUBIDA REAL DE SESIÓN');
console.log('='.repeat(50));

async function testUpload() {
    const basePath = 'backend/data/datosDoback/CMadrid - copia';
    const files = {
        GPS: path.join(basePath, 'GPS_DOBACK022_20250710_0.txt'),
        CAN: path.join(basePath, 'CAN_DOBACK022_20250710_0_TRADUCIDO.csv'),
        ESTABILIDAD: path.join(basePath, 'ESTABILIDAD_DOBACK022_20250710_0.txt'),
        ROTATIVO: path.join(basePath, 'ROTATIVO_DOBACK022_20250710_0.txt')
    };

    // Verificar archivos
    console.log('📁 Verificando archivos...');
    for (const [type, filePath] of Object.entries(files)) {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${type}: ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            console.log(`❌ ${type}: NO ENCONTRADO - ${filePath}`);
            return;
        }
    }

    console.log('\n🚀 RECOMENDACIONES PARA PRUEBA MANUAL:');
    console.log('='.repeat(50));
    
    console.log('1. Asegúrate de que el backend esté ejecutándose:');
    console.log('   cd backend && npm run dev');
    
    console.log('\n2. Usa Postman o curl para probar:');
    console.log('   URL: http://localhost:3001/api/sesion/upload');
    console.log('   Method: POST');
    console.log('   Headers:');
    console.log('     - Content-Type: multipart/form-data');
    console.log('     - Authorization: Bearer <tu-jwt-token>');
    
    console.log('\n3. Form Data:');
    console.log('   - vehicleId: doback022');
    console.log('   - stabilityFile: backend/data/datosDoback/CMadrid - copia/ESTABILIDAD_DOBACK022_20250710_0.txt');
    console.log('   - canFile: backend/data/datosDoback/CMadrid - copia/CAN_DOBACK022_20250710_0_TRADUCIDO.csv');
    console.log('   - gpsFile: backend/data/datosDoback/CMadrid - copia/GPS_DOBACK022_20250710_0.txt');
    console.log('   - rotativoFile: backend/data/datosDoback/CMadrid - copia/ROTATIVO_DOBACK022_20250710_0.txt');
    
    console.log('\n4. Ejemplo de comando curl:');
    console.log(`curl -X POST http://localhost:3001/api/sesion/upload \\`);
    console.log(`  -H "Authorization: Bearer TU_JWT_TOKEN_AQUI" \\`);
    console.log(`  -F "vehicleId=doback022" \\`);
    console.log(`  -F "stabilityFile=@${files.ESTABILIDAD}" \\`);
    console.log(`  -F "canFile=@${files.CAN}" \\`);
    console.log(`  -F "gpsFile=@${files.GPS}" \\`);
    console.log(`  -F "rotativoFile=@${files.ROTATIVO}"`);
    
    console.log('\n📊 RESULTADOS ESPERADOS:');
    console.log('='.repeat(50));
    console.log('✅ Status: 200 OK');
    console.log('✅ GPS: ~900+ puntos válidos (con correcciones aplicadas)');
    console.log('✅ CAN: Cientos de puntos válidos');
    console.log('✅ ESTABILIDAD: Miles de puntos válidos');
    console.log('✅ ROTATIVO: Decenas de puntos válidos');
    console.log('✅ Correcciones aplicadas:');
    console.log('   - Timestamps GPS malformados corregidos');
    console.log('   - Desfase de tiempo GPS (+2 horas) corregido');
    console.log('   - Coordenadas GPS corruptas reparadas');
    console.log('   - Velocidades anómalas detectadas');
    
    console.log('\n🔧 LOGS A OBSERVAR:');
    console.log('='.repeat(50));
    console.log('En el backend deberías ver logs como:');
    console.log('🔧 GPS timestamp corregido línea X: "06:20:2." -> "06:20:20"');
    console.log('⏰ GPS desfase corregido línea X: +2h -> "08:20:20"');
    console.log('🔧 GPS latitud corrupta línea X: "402960.1000000" -> "40.4960100"');
    console.log('🔧 GPS longitud corrupta línea X: "-35774.5500000" -> "-3.5774550"');
    console.log('⚠️ GPS velocidad anómala línea X: 544.86 km/h');
    
    console.log('\n🎯 PRÓXIMOS PASOS SI FUNCIONA:');
    console.log('='.repeat(50));
    console.log('1. Verificar en la base de datos que los datos se guardaron');
    console.log('2. Probar el frontend SubirSesion.tsx');
    console.log('3. Verificar que el dashboard muestre los datos correctamente');
    console.log('4. Aplicar las mismas correcciones a los otros archivos del proyecto');
    
    console.log('\n✅ TEST PREPARADO - EJECUTA LA SUBIDA MANUAL');
}

testUpload().catch(console.error); 