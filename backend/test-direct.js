console.log('🚀 Iniciando prueba directa...');

// Verificar archivos
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data/datosDoback/CMadrid');

if (fs.existsSync(dataPath)) {
    console.log('✅ Directorio de datos encontrado');
    
    const vehicles = fs.readdirSync(dataPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    console.log(`📁 Vehículos encontrados: ${vehicles.join(', ')}`);
    
    // Contar archivos por tipo
    let totalFiles = 0;
    const fileTypes = { GPS: 0, CAN: 0, ESTABILIDAD: 0, ROTATIVO: 0 };
    
    for (const vehicleDir of vehicles) {
        const vehiclePath = path.join(dataPath, vehicleDir);
        console.log(`\n🔍 Analizando vehículo: ${vehicleDir}`);
        
        for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
            const typePath = path.join(vehiclePath, dataType);
            if (fs.existsSync(typePath)) {
                const files = fs.readdirSync(typePath)
                    .filter(file => file.endsWith('.txt'));
                
                const typeKey = dataType.toUpperCase();
                fileTypes[typeKey] += files.length;
                totalFiles += files.length;
                
                console.log(`  - ${typeKey}: ${files.length} archivos`);
                
                // Mostrar algunos ejemplos
                if (files.length > 0) {
                    console.log(`    Ejemplos: ${files.slice(0, 3).join(', ')}`);
                }
            }
        }
    }
    
    console.log('\n📊 Resumen total:');
    console.log(`  - GPS: ${fileTypes.GPS} archivos`);
    console.log(`  - CAN: ${fileTypes.CAN} archivos`);
    console.log(`  - ESTABILIDAD: ${fileTypes.ESTABILIDAD} archivos`);
    console.log(`  - ROTATIVO: ${fileTypes.ROTATIVO} archivos`);
    console.log(`  - Total: ${totalFiles} archivos`);
    
    // Analizar algunas sesiones
    console.log('\n🔍 Analizando sesiones...');
    const sessions = new Map();
    
    for (const vehicleDir of vehicles) {
        const vehiclePath = path.join(dataPath, vehicleDir);
        
        for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
            const typePath = path.join(vehiclePath, dataType);
            if (fs.existsSync(typePath)) {
                const files = fs.readdirSync(typePath)
                    .filter(file => file.endsWith('.txt'));
                
                for (const file of files) {
                    // Parsear: TIPO_DOBACKXXX_YYYYMMDD_SEQUENCE.txt
                    const match = file.match(/^([A-Z_]+)_DOBACK(\d+)_(\d{8})_(\d+)\.txt$/);
                    if (match) {
                        const [, fileType, vehicleId, date, sequence] = match;
                        const sessionKey = `${vehicleId}_${date}_${sequence}`;
                        
                        if (!sessions.has(sessionKey)) {
                            sessions.set(sessionKey, {
                                vehicleId: `DOBACK${vehicleId}`,
                                date,
                                sequence: parseInt(sequence),
                                files: { GPS: [], CAN: [], ESTABILIDAD: [], ROTATIVO: [] }
                            });
                        }
                        
                        sessions.get(sessionKey).files[fileType] = file;
                    }
                }
            }
        }
    }
    
    console.log(`\n📊 Sesiones detectadas: ${sessions.size}`);
    
    // Mostrar primeras 5 sesiones
    let count = 0;
    for (const [key, session] of sessions) {
        if (count >= 5) break;
        
        const fileCount = Object.values(session.files).filter(f => f).length;
        console.log(`  - ${key}: ${fileCount} archivos`);
        count++;
    }
    
    if (sessions.size > 5) {
        console.log(`  ... y ${sessions.size - 5} sesiones más`);
    }
    
} else {
    console.log('❌ Directorio de datos no encontrado');
}

console.log('\n✅ Análisis completado');