const fs = require('fs');
const path = require('path');

// Función para eliminar importaciones no utilizadas de t
function removeUnusedImports(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Buscar y eliminar importaciones de t que no se usan
        const importRegex = /import\s*{\s*t\s*}\s*from\s*["']\.\.\/i18n["'];?\s*\n/g;
        const tUsageRegex = /\bt\(/g;

        // Verificar si t se usa en el archivo
        const tUsageMatches = content.match(tUsageRegex);
        
        if (!tUsageMatches || tUsageMatches.length === 0) {
            // Si no se usa t, eliminar la importación
            const newContent = content.replace(importRegex, '');
            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent);
                console.log(`✅ Eliminada importación no utilizada de t en: ${filePath}`);
                modified = true;
            }
        }

        return modified;
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Función para procesar directorio recursivamente
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    let totalModified = 0;

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            totalModified += processDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            if (removeUnusedImports(filePath)) {
                totalModified++;
            }
        }
    });

    return totalModified;
}

// Procesar el directorio src
const srcPath = path.join(__dirname, '..', 'src');
console.log('🔍 Buscando importaciones no utilizadas de t...');
const modifiedCount = processDirectory(srcPath);
console.log(`\n✨ Proceso completado. ${modifiedCount} archivos modificados.`); 