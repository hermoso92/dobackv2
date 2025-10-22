/**
 * Análisis profundo de archivo de estabilidad
 * Verifica estructura, datos, outliers y calidad
 */

const fs = require('fs');
const path = require('path');

// Archivo a analizar
const FILE_PATH = 'backend/data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251001.txt';

// Columnas esperadas según docs
const EXPECTED_COLUMNS = [
    'ax', 'ay', 'az',           // Aceleraciones (mg)
    'gx', 'gy', 'gz',           // Velocidades angulares (mdps)
    'roll', 'pitch', 'yaw',     // Orientación (grados)
    'timeantwifi',              // Timestamp interno
    'usciclo1', 'usciclo2', 'usciclo3', 'usciclo4', 'usciclo5', // Ciclos
    'si',                       // Índice de Estabilidad (0-1)
    'accmag',                   // Magnitud aceleración
    'microsds',                 // Microsegundos SD
    'k3'                        // Constante k3
];

// Rangos válidos
const VALID_RANGES = {
    ax: { min: -2000, max: 2000, unit: 'mg' },
    ay: { min: -2000, max: 2000, unit: 'mg' },
    az: { min: -2000, max: 2000, unit: 'mg' },
    gx: { min: -10000, max: 10000, unit: 'mdps' },
    gy: { min: -10000, max: 10000, unit: 'mdps' },
    gz: { min: -10000, max: 10000, unit: 'mdps' },
    roll: { min: -180, max: 180, unit: '°' },
    pitch: { min: -180, max: 180, unit: '°' },
    yaw: { min: -180, max: 180, unit: '°' },
    si: { min: 0, max: 1, unit: '' },
    accmag: { min: 0, max: 2000, unit: 'mg' },
};

function analyzeFile() {
    console.log('🔬 ANÁLISIS PROFUNDO DE ARCHIVO DE ESTABILIDAD\n');
    console.log(`📁 Archivo: ${FILE_PATH}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`❌ Archivo no encontrado: ${FILE_PATH}`);
        return;
    }

    const content = fs.readFileSync(FILE_PATH, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`📊 INFORMACIÓN BÁSICA:\n`);
    console.log(`Total de líneas: ${lines.length}`);
    
    // Línea 1: Cabecera
    const header = lines[0];
    console.log(`Cabecera: ${header}`);
    
    const headerMatch = header.match(/^ESTABILIDAD;(.+?);(.+?);(.+?);$/);
    if (headerMatch) {
        console.log(`  ✅ Fecha: ${headerMatch[1]}`);
        console.log(`  ✅ Vehículo: ${headerMatch[2]}`);
        console.log(`  ✅ Sesión: ${headerMatch[3]}`);
    } else {
        console.log(`  ❌ Cabecera inválida`);
    }

    // Línea 2: Columnas
    const columns = lines[1].split(';').map(c => c.trim());
    console.log(`\n📋 COLUMNAS DETECTADAS: ${columns.length}`);
    console.log(`Esperadas: ${EXPECTED_COLUMNS.length}`);
    
    const missingColumns = EXPECTED_COLUMNS.filter(c => !columns.includes(c));
    const extraColumns = columns.filter(c => c && !EXPECTED_COLUMNS.includes(c));
    
    if (missingColumns.length > 0) {
        console.log(`  ❌ Columnas faltantes: ${missingColumns.join(', ')}`);
    }
    if (extraColumns.length > 0) {
        console.log(`  ⚠️  Columnas adicionales: ${extraColumns.join(', ')}`);
    }
    if (missingColumns.length === 0 && extraColumns.length === 0) {
        console.log(`  ✅ Todas las columnas presentes`);
    }

    // Analizar datos
    console.log(`\n📈 ANÁLISIS DE DATOS:\n`);
    
    const stats = {
        totalData: 0,
        timestamps: 0,
        outliers: {},
        sessions: new Set()
    };

    // Inicializar estadísticas por variable
    Object.keys(VALID_RANGES).forEach(key => {
        stats.outliers[key] = { count: 0, examples: [] };
    });

    let currentSession = null;
    
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detectar timestamp (formato HH:MM:SS)
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) {
            stats.timestamps++;
            continue;
        }

        if (!line || line.length < 10) continue;

        const values = line.split(';').map(v => parseFloat(v.trim()));
        
        if (values.length < columns.length) continue;

        stats.totalData++;

        // Verificar rangos
        columns.forEach((col, idx) => {
            const value = values[idx];
            const range = VALID_RANGES[col];
            
            if (range && !isNaN(value)) {
                if (value < range.min || value > range.max) {
                    stats.outliers[col].count++;
                    if (stats.outliers[col].examples.length < 3) {
                        stats.outliers[col].examples.push({
                            line: i + 1,
                            value,
                            expected: `${range.min} - ${range.max} ${range.unit}`
                        });
                    }
                }
            }
        });
    }

    console.log(`Total de registros de datos: ${stats.totalData.toLocaleString()}`);
    console.log(`Timestamps detectados: ${stats.timestamps}`);
    console.log(`Frecuencia aproximada: ${(stats.timestamps > 0 ? stats.totalData / stats.timestamps : 0).toFixed(1)} registros/segundo\n`);

    // Reporte de outliers
    console.log(`🚨 OUTLIERS DETECTADOS:\n`);
    let hasOutliers = false;
    
    Object.keys(stats.outliers).forEach(key => {
        const outlier = stats.outliers[key];
        if (outlier.count > 0) {
            hasOutliers = true;
            const percentage = ((outlier.count / stats.totalData) * 100).toFixed(2);
            console.log(`  ⚠️  ${key}: ${outlier.count} (${percentage}%)`);
            
            outlier.examples.forEach(ex => {
                console.log(`     - Línea ${ex.line}: ${ex.value} (esperado: ${ex.expected})`);
            });
        }
    });

    if (!hasOutliers) {
        console.log(`  ✅ No se detectaron outliers en rangos definidos`);
    }

    // Análisis del SI (crítico para estabilidad)
    console.log(`\n🎯 ANÁLISIS DEL ÍNDICE DE ESTABILIDAD (SI):\n`);
    
    const siValues = [];
    for (let i = 2; i < Math.min(lines.length, 10000); i++) {
        const line = lines[i].trim();
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        if (!line || line.length < 10) continue;

        const values = line.split(';').map(v => parseFloat(v.trim()));
        const siIndex = columns.indexOf('si');
        
        if (siIndex !== -1 && !isNaN(values[siIndex])) {
            siValues.push(values[siIndex]);
        }
    }

    if (siValues.length > 0) {
        const siMin = Math.min(...siValues);
        const siMax = Math.max(...siValues);
        const siAvg = siValues.reduce((a, b) => a + b, 0) / siValues.length;
        const siCritical = siValues.filter(v => v < 0.6).length;
        const siWarning = siValues.filter(v => v >= 0.6 && v < 0.8).length;
        const siGood = siValues.filter(v => v >= 0.8).length;

        console.log(`  SI mínimo: ${siMin.toFixed(3)}`);
        console.log(`  SI máximo: ${siMax.toFixed(3)}`);
        console.log(`  SI promedio: ${siAvg.toFixed(3)}\n`);
        console.log(`  Distribución:`);
        console.log(`    🔴 Crítico (< 0.6): ${siCritical} (${((siCritical/siValues.length)*100).toFixed(1)}%)`);
        console.log(`    🟡 Advertencia (0.6-0.8): ${siWarning} (${((siWarning/siValues.length)*100).toFixed(1)}%)`);
        console.log(`    🟢 Bueno (>= 0.8): ${siGood} (${((siGood/siValues.length)*100).toFixed(1)}%)`);
    }

    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log('✅ Análisis completado\n');
}

analyzeFile();

