#!/usr/bin/env node

/**
 * 🔧 MIGRADOR AUTOMÁTICO: console → logger
 * 
 * Script para migrar automáticamente console.log/error/warn/info/debug a logger
 * 
 * Uso:
 *   node scripts/analisis/migrar-console-to-logger.js --dry-run  # Ver cambios sin aplicar
 *   node scripts/analisis/migrar-console-to-logger.js           # Aplicar cambios
 *   node scripts/analisis/migrar-console-to-logger.js --file frontend/src/components/MyComponent.tsx
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    // Directorios a procesar (sin tests ni scripts de desarrollo)
    processableDirs: [
        'frontend/src/components',
        'frontend/src/services',
        'frontend/src/hooks',
        'frontend/src/utils',
        'frontend/src/pages',
        'frontend/src/api',
        'backend/src/controllers',
        'backend/src/services',
        'backend/src/routes',
        'backend/src/middleware'
    ],

    // Archivos a excluir
    excludePatterns: [
        'test',
        'spec',
        'mock',
        '.test.',
        '.spec.',
        'setupTests',
        'test-utils'
    ],

    // Logger paths por tipo de archivo
    loggerPaths: {
        frontend: '../utils/logger',
        backend: '../utils/logger'
    }
};

// ============================================================================
// ESTADO
// ============================================================================

const stats = {
    filesProcessed: 0,
    filesModified: 0,
    consolesReplaced: 0,
    importsAdded: 0,
    errors: []
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Determina si es un archivo de frontend o backend
 */
function getFileType(filePath) {
    if (filePath.includes('frontend')) return 'frontend';
    if (filePath.includes('backend')) return 'backend';
    return null;
}

/**
 * Calcula la ruta relativa correcta para el import de logger
 */
function calculateLoggerImportPath(filePath) {
    const fileType = getFileType(filePath);
    if (!fileType) return null;
    
    // Determinar cuántos niveles subir
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const srcIndex = parts.indexOf('src');
    
    if (srcIndex === -1) return null;
    
    // Contar niveles desde src/X hasta el archivo
    const levelsFromSrc = parts.length - srcIndex - 2; // -2 porque excluimos 'src' y el nombre del archivo
    
    // Construir path relativo
    const upLevels = '../'.repeat(levelsFromSrc);
    return `${upLevels}utils/logger`;
}

/**
 * Verifica si el archivo ya tiene import de logger
 */
function hasLoggerImport(content) {
    return /import.*logger.*from.*['"].*logger['"]/.test(content);
}

/**
 * Añade import de logger al archivo
 */
function addLoggerImport(content, filePath) {
    const loggerPath = calculateLoggerImportPath(filePath);
    if (!loggerPath) return content;
    
    // Buscar la última línea de imports
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
        } else if (lastImportIndex !== -1 && lines[i].trim() !== '') {
            // Primera línea no-import después de imports
            break;
        }
    }
    
    // Insertar import después del último import
    const importStatement = `import { logger } from '${loggerPath}';`;
    
    if (lastImportIndex === -1) {
        // No hay imports, añadir al principio
        return importStatement + '\n\n' + content;
    } else {
        lines.splice(lastImportIndex + 1, 0, importStatement);
        return lines.join('\n');
    }
}

/**
 * Reemplaza console.X por logger.X
 */
function replaceConsole(content) {
    let modified = content;
    let count = 0;
    
    // Patrones de reemplazo
    const replacements = [
        { from: /console\.log\(/g, to: 'logger.info(' },
        { from: /console\.error\(/g, to: 'logger.error(' },
        { from: /console\.warn\(/g, to: 'logger.warn(' },
        { from: /console\.info\(/g, to: 'logger.info(' },
        { from: /console\.debug\(/g, to: 'logger.debug(' }
    ];
    
    for (const { from, to } of replacements) {
        const matches = modified.match(from);
        if (matches) {
            count += matches.length;
            modified = modified.replace(from, to);
        }
    }
    
    return { content: modified, count };
}

/**
 * Procesa un archivo
 */
function processFile(filePath, dryRun = false) {
    stats.filesProcessed++;
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        let modified = content;
        let hasChanges = false;
        
        // Verificar si tiene console
        if (!/console\.(log|error|warn|info|debug)\(/.test(content)) {
            return; // No tiene console, skip
        }
        
        // Añadir import de logger si no existe
        if (!hasLoggerImport(content)) {
            modified = addLoggerImport(modified, filePath);
            hasChanges = true;
            stats.importsAdded++;
        }
        
        // Reemplazar console por logger
        const { content: newContent, count } = replaceConsole(modified);
        if (count > 0) {
            modified = newContent;
            hasChanges = true;
            stats.consolesReplaced += count;
        }
        
        // Guardar cambios
        if (hasChanges) {
            stats.filesModified++;
            
            if (!dryRun) {
                fs.writeFileSync(filePath, modified, 'utf-8');
                console.log(`✅ ${filePath} (${count} consoles reemplazados)`);
            } else {
                console.log(`🔍 ${filePath} (${count} consoles a reemplazar)`);
            }
        }
        
    } catch (error) {
        stats.errors.push({ file: filePath, error: error.message });
        console.error(`❌ Error en ${filePath}:`, error.message);
    }
}

/**
 * Procesa un directorio recursivamente
 */
function processDirectory(dirPath, dryRun = false) {
    if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  Directorio no existe: ${dirPath}`);
        return;
    }
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Excluir archivos de test
        const shouldExclude = CONFIG.excludePatterns.some(pattern => 
            fullPath.includes(pattern)
        );
        
        if (shouldExclude) continue;
        
        if (entry.isDirectory()) {
            processDirectory(fullPath, dryRun);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                processFile(fullPath, dryRun);
            }
        }
    }
}

/**
 * Genera reporte final
 */
function generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE DE MIGRACIÓN: console → logger');
    console.log('='.repeat(80) + '\n');
    
    console.log('Archivos procesados:   ', stats.filesProcessed);
    console.log('Archivos modificados:  ', stats.filesModified);
    console.log('Consoles reemplazados: ', stats.consolesReplaced);
    console.log('Imports añadidos:      ', stats.importsAdded);
    console.log('Errores:               ', stats.errors.length);
    
    if (stats.errors.length > 0) {
        console.log('\n❌ ERRORES:\n');
        stats.errors.forEach(({ file, error }) => {
            console.log(`   ${file}: ${error}`);
        });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const fileArg = args.find(arg => arg.startsWith('--file='));
    
    console.log('\n🔧 MIGRADOR: console → logger\n');
    
    if (dryRun) {
        console.log('🔍 Modo DRY RUN - No se harán cambios\n');
    }
    
    if (fileArg) {
        // Procesar archivo específico
        const filePath = fileArg.replace('--file=', '');
        processFile(filePath, dryRun);
    } else {
        // Procesar directorios
        for (const dir of CONFIG.processableDirs) {
            if (fs.existsSync(dir)) {
                console.log(`📁 Procesando ${dir}...`);
                processDirectory(dir, dryRun);
            }
        }
    }
    
    generateReport();
    
    if (dryRun) {
        console.log('💡 Para aplicar los cambios, ejecuta sin --dry-run\n');
    } else {
        console.log('✅ Migración completada\n');
        console.log('💡 Recomendación: Ejecuta los tests para verificar que todo funciona\n');
    }
}

// Ejecutar
if (require.main === module) {
    main();
}

module.exports = { processFile, processDirectory };

