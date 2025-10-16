/**
 * Script para corregir todas las referencias a prisma.stabilityEvent
 * y cambiarlas por prisma.stability_events
 */

const fs = require('fs');
const path = require('path');

// Directorio del backend
const backendDir = path.join(__dirname, '..', 'backend', 'src');

// Función para procesar un archivo
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Reemplazar prisma.stabilityEvent por prisma.stability_events
        const newContent = content.replace(/prisma\.stabilityEvent/g, 'prisma.stability_events');
        
        // Solo escribir si hubo cambios
        if (newContent !== originalContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Corregido: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Función para recorrer directorios recursivamente
function processDirectory(dir) {
    let totalFiles = 0;
    let modifiedFiles = 0;
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                const result = processDirectory(fullPath);
                totalFiles += result.totalFiles;
                modifiedFiles += result.modifiedFiles;
            } else if (stat.isFile() && item.endsWith('.ts')) {
                totalFiles++;
                if (processFile(fullPath)) {
                    modifiedFiles++;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error accediendo al directorio ${dir}:`, error.message);
    }
    
    return { totalFiles, modifiedFiles };
}

// Ejecutar el script
console.log('🔧 CORRIGIENDO REFERENCIAS A TABLA DE EVENTOS DE ESTABILIDAD');
console.log('============================================================\n');

console.log(`📁 Procesando directorio: ${backendDir}`);

const result = processDirectory(backendDir);

console.log('\n📊 RESUMEN:');
console.log(`   Total de archivos .ts procesados: ${result.totalFiles}`);
console.log(`   Archivos modificados: ${result.modifiedFiles}`);

if (result.modifiedFiles > 0) {
    console.log('\n✅ Corrección completada exitosamente');
    console.log('💡 Reinicia el backend para aplicar los cambios');
} else {
    console.log('\n⚠️ No se encontraron archivos que necesiten corrección');
}
