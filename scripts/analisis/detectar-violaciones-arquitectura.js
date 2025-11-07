#!/usr/bin/env node

/**
 * 🔍 DETECTOR DE VIOLACIONES DE ARQUITECTURA - DOBACKSOFT
 * 
 * Script automático para detectar violaciones de las reglas de arquitectura:
 * - URLs hardcodeadas (excepto en tests y scripts de desarrollo)
 * - console.log en código core (excepto en tests y scripts)
 * - Falta de logger imports
 * - organizationId no filtrado (TODO)
 * 
 * Uso:
 *   node scripts/analisis/detectar-violaciones-arquitectura.js
 *   node scripts/analisis/detectar-violaciones-arquitectura.js --json
 *   node scripts/analisis/detectar-violaciones-arquitectura.js --fix
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    // Directorios a escanear
    scanDirs: [
        'frontend/src',
        'backend/src'
    ],

    // Directorios a excluir
    excludeDirs: [
        'node_modules',
        'dist',
        'build',
        '.git',
        'coverage',
        'test',
        'tests',
        '__tests__',
        'scripts',
        'backup',
        'historico'
    ],

    // Archivos a excluir
    excludeFiles: [
        '.test.ts',
        '.test.tsx',
        '.spec.ts',
        '.spec.tsx',
        '.test.js',
        '.spec.js',
        'setupTests',
        'test-utils',
        'mock'
    ],

    // Extensiones válidas
    validExtensions: ['.ts', '.tsx', '.js', '.jsx'],

    // Patrones de URLs a detectar (excepto las permitidas)
    urlPatterns: [
        /http:\/\/localhost:\d+/g,
        /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\'"]*(?=['"\s])/g
    ],

    // URLs permitidas (externas, CDN, etc.)
    allowedUrls: [
        'https://api.tomtom.com',
        'https://api.openstreetmap.org',
        'https://nominatim.openstreetmap.org',
        'https://unpkg.com/leaflet',
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet',
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers',
        'http://www.w3.org',
        'http://json-schema.org',
        'http://alembic.zzzcomputing.com'
    ],

    // Patrones de console
    consolePatterns: [
        /console\.(log|error|warn|info|debug)\s*\(/g
    ]
};

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

const violations = {
    hardcodedUrls: [],
    consoleUsage: [],
    missingLogger: [],
    summary: {
        totalFiles: 0,
        scannedFiles: 0,
        filesWithViolations: 0
    }
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Verifica si una ruta debe ser excluida
 */
function shouldExclude(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Excluir directorios
    for (const dir of CONFIG.excludeDirs) {
        if (normalizedPath.includes(`/${dir}/`) || normalizedPath.includes(`/${dir}`)) {
            return true;
        }
    }
    
    // Excluir archivos específicos
    for (const pattern of CONFIG.excludeFiles) {
        if (normalizedPath.includes(pattern)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Verifica si la extensión es válida
 */
function hasValidExtension(filePath) {
    const ext = path.extname(filePath);
    return CONFIG.validExtensions.includes(ext);
}

/**
 * Verifica si una URL está en la lista de permitidas
 */
function isAllowedUrl(url) {
    return CONFIG.allowedUrls.some(allowed => url.startsWith(allowed));
}

/**
 * Detecta URLs hardcodeadas en el contenido
 */
function detectHardcodedUrls(content, filePath) {
    const lines = content.split('\n');
    const found = [];
    
    lines.forEach((line, index) => {
        // Ignorar comentarios
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
            return;
        }
        
        // Buscar URLs
        for (const pattern of CONFIG.urlPatterns) {
            const matches = line.matchAll(pattern);
            for (const match of matches) {
                const url = match[0];
                
                // Verificar si es una URL permitida
                if (!isAllowedUrl(url)) {
                    found.push({
                        file: filePath,
                        line: index + 1,
                        content: line.trim(),
                        url: url,
                        type: 'hardcoded_url'
                    });
                }
            }
        }
    });
    
    return found;
}

/**
 * Detecta uso de console en el contenido
 */
function detectConsoleUsage(content, filePath) {
    const lines = content.split('\n');
    const found = [];
    
    lines.forEach((line, index) => {
        // Ignorar comentarios
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
            return;
        }
        
        // Buscar console
        for (const pattern of CONFIG.consolePatterns) {
            if (pattern.test(line)) {
                found.push({
                    file: filePath,
                    line: index + 1,
                    content: line.trim(),
                    type: 'console_usage'
                });
            }
        }
    });
    
    return found;
}

/**
 * Verifica si el archivo importa logger cuando usa console
 */
function checkLoggerImport(content, hasConsole) {
    if (!hasConsole) return true;
    
    const hasLoggerImport = /import.*logger.*from.*['"](\.\.\/)*utils\/logger['"]/.test(content);
    return hasLoggerImport;
}

/**
 * Escanea un archivo
 */
function scanFile(filePath) {
    violations.summary.totalFiles++;
    
    // Verificar si debe ser excluido
    if (shouldExclude(filePath) || !hasValidExtension(filePath)) {
        return;
    }
    
    violations.summary.scannedFiles++;
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Detectar violaciones
        const urlViolations = detectHardcodedUrls(content, filePath);
        const consoleViolations = detectConsoleUsage(content, filePath);
        
        // Verificar import de logger
        const hasConsole = consoleViolations.length > 0;
        const hasLogger = checkLoggerImport(content, hasConsole);
        
        // Agregar al reporte
        if (urlViolations.length > 0) {
            violations.hardcodedUrls.push(...urlViolations);
        }
        
        if (consoleViolations.length > 0) {
            violations.consoleUsage.push(...consoleViolations);
            
            if (!hasLogger) {
                violations.missingLogger.push({
                    file: filePath,
                    type: 'missing_logger_import'
                });
            }
        }
        
        // Actualizar resumen
        if (urlViolations.length > 0 || consoleViolations.length > 0) {
            violations.summary.filesWithViolations++;
        }
        
    } catch (error) {
        console.error(`Error escaneando ${filePath}:`, error.message);
    }
}

/**
 * Escanea un directorio recursivamente
 */
function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.error(`Directorio no existe: ${dirPath}`);
        return;
    }
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            if (!shouldExclude(fullPath)) {
                scanDirectory(fullPath);
            }
        } else if (entry.isFile()) {
            scanFile(fullPath);
        }
    }
}

/**
 * Genera reporte en formato texto
 */
function generateTextReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 REPORTE DE VIOLACIONES DE ARQUITECTURA - DOBACKSOFT');
    console.log('='.repeat(80) + '\n');
    
    // Resumen
    console.log('📊 RESUMEN:');
    console.log(`   Archivos totales:         ${violations.summary.totalFiles}`);
    console.log(`   Archivos escaneados:      ${violations.summary.scannedFiles}`);
    console.log(`   Archivos con violaciones: ${violations.summary.filesWithViolations}`);
    console.log(`   URLs hardcodeadas:        ${violations.hardcodedUrls.length}`);
    console.log(`   Uso de console:           ${violations.consoleUsage.length}`);
    console.log(`   Sin import de logger:     ${violations.missingLogger.length}`);
    console.log('');
    
    // URLs hardcodeadas
    if (violations.hardcodedUrls.length > 0) {
        console.log('🚨 URLs HARDCODEADAS:\n');
        
        const byFile = {};
        violations.hardcodedUrls.forEach(v => {
            if (!byFile[v.file]) byFile[v.file] = [];
            byFile[v.file].push(v);
        });
        
        Object.entries(byFile).forEach(([file, items]) => {
            console.log(`   📄 ${file}:`);
            items.forEach(item => {
                console.log(`      Línea ${item.line}: ${item.url}`);
            });
            console.log('');
        });
    }
    
    // Console usage
    if (violations.consoleUsage.length > 0) {
        console.log('⚠️  USO DE CONSOLE (primeros 20):\n');
        
        const byFile = {};
        violations.consoleUsage.slice(0, 20).forEach(v => {
            if (!byFile[v.file]) byFile[v.file] = [];
            byFile[v.file].push(v);
        });
        
        Object.entries(byFile).forEach(([file, items]) => {
            console.log(`   📄 ${file}:`);
            items.forEach(item => {
                console.log(`      Línea ${item.line}`);
            });
            console.log('');
        });
        
        if (violations.consoleUsage.length > 20) {
            console.log(`   ... y ${violations.consoleUsage.length - 20} más\n`);
        }
    }
    
    // Missing logger
    if (violations.missingLogger.length > 0) {
        console.log('📝 ARCHIVOS SIN IMPORT DE LOGGER:\n');
        violations.missingLogger.forEach(v => {
            console.log(`   - ${v.file}`);
        });
        console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('');
    
    // Conclusión
    if (violations.summary.filesWithViolations === 0) {
        console.log('✅ No se encontraron violaciones. ¡Excelente trabajo!');
    } else {
        console.log('❌ Se encontraron violaciones. Revisa el reporte anterior.');
        console.log('');
        console.log('💡 Para corregir automáticamente (próximamente):');
        console.log('   node scripts/analisis/detectar-violaciones-arquitectura.js --fix');
    }
    
    console.log('');
}

/**
 * Genera reporte en formato JSON
 */
function generateJsonReport() {
    console.log(JSON.stringify(violations, null, 2));
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    const fixMode = args.includes('--fix');
    
    if (fixMode) {
        console.log('❌ Modo --fix aún no implementado');
        console.log('💡 Usa el script manual por ahora');
        process.exit(1);
    }
    
    // Escanear directorios
    for (const dir of CONFIG.scanDirs) {
        if (fs.existsSync(dir)) {
            scanDirectory(dir);
        }
    }
    
    // Generar reporte
    if (jsonOutput) {
        generateJsonReport();
    } else {
        generateTextReport();
    }
    
    // Exit code
    process.exit(violations.summary.filesWithViolations > 0 ? 1 : 0);
}

// Ejecutar
if (require.main === module) {
    main();
}

module.exports = { scanFile, scanDirectory, violations };













