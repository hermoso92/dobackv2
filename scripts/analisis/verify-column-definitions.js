/**
 * VERIFICACIÓN EXHAUSTIVA DE DEFINICIONES DE COLUMNAS
 * Compara valores reales con unidades documentadas para detectar errores
 */

const fs = require('fs');

const FILE = 'C:/Users/Cosigein SL/Desktop/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251001.txt';

// Definiciones DOCUMENTADAS (pueden estar incorrectas)
const DOCUMENTED_DEFINITIONS = {
    ax: { name: 'Aceleración X', unit: 'mg', expectedRange: [-2000, 2000] },
    ay: { name: 'Aceleración Y', unit: 'mg', expectedRange: [-2000, 2000] },
    az: { name: 'Aceleración Z', unit: 'mg', expectedRange: [-2000, 2000] },
    gx: { name: 'Velocidad Angular X', unit: 'mdps', expectedRange: [-10000, 10000] },
    gy: { name: 'Velocidad Angular Y', unit: 'mdps', expectedRange: [-10000, 10000] },
    gz: { name: 'Velocidad Angular Z', unit: 'mdps', expectedRange: [-10000, 10000] },
    roll: { name: 'Ángulo Roll', unit: 'grados', expectedRange: [-180, 180] },
    pitch: { name: 'Ángulo Pitch', unit: 'grados', expectedRange: [-180, 180] },
    yaw: { name: 'Ángulo Yaw', unit: 'grados', expectedRange: [-180, 180] },
    si: { name: 'Índice Estabilidad', unit: 'ratio', expectedRange: [0, 1] }
};

function analyzeColumns() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔬 VERIFICACIÓN DE DEFINICIONES DE COLUMNAS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!fs.existsSync(FILE)) {
        console.error('❌ Archivo no encontrado');
        return;
    }

    const content = fs.readFileSync(FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    // Obtener columnas
    const columnsLine = lines[1];
    const columns = columnsLine.split(';').map(c => c.trim()).filter(c => c);

    console.log(`📋 COLUMNAS EN ARCHIVO (${columns.length} total):\n`);
    columns.forEach((col, idx) => {
        console.log(`  ${(idx+1).toString().padStart(2)}. ${col}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISIS DE VALORES REALES POR COLUMNA\n');

    // Recopilar valores de cada columna (primeros 10000 registros)
    const columnValues = {};
    columns.forEach(col => {
        columnValues[col] = [];
    });

    let dataCount = 0;
    for (let i = 2; i < lines.length && dataCount < 10000; i++) {
        const line = lines[i].trim();
        
        // Saltar timestamps
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        if (!line || line.length < 10) continue;

        const values = line.split(';').map(v => parseFloat(v.trim()));
        if (values.length !== columns.length) continue;

        columns.forEach((col, idx) => {
            if (!isNaN(values[idx])) {
                columnValues[col].push(values[idx]);
            }
        });

        dataCount++;
    }

    console.log(`Analizados ${dataCount.toLocaleString()} registros\n`);

    // Analizar cada columna
    Object.keys(DOCUMENTED_DEFINITIONS).forEach(col => {
        if (!columnValues[col] || columnValues[col].length === 0) {
            console.log(`⚠️  ${col}: NO ENCONTRADA en archivo\n`);
            return;
        }

        const values = columnValues[col];
        const doc = DOCUMENTED_DEFINITIONS[col];
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a,b) => a+b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);

        console.log(`📊 ${col.toUpperCase()} - ${doc.name}`);
        console.log(`   Unidad documentada: ${doc.unit}`);
        console.log(`   Rango documentado: [${doc.expectedRange[0]}, ${doc.expectedRange[1]}] ${doc.unit}`);
        console.log(`   Rango REAL: [${min.toFixed(2)}, ${max.toFixed(2)}]`);
        console.log(`   Promedio: ${avg.toFixed(2)}`);
        console.log(`   Desv. Std: ${std.toFixed(2)}`);

        // Detectar si valores están fuera del rango documentado
        const outOfRange = values.filter(v => v < doc.expectedRange[0] || v > doc.expectedRange[1]).length;
        const outOfRangePercent = (outOfRange / values.length * 100).toFixed(2);

        if (outOfRange > 0) {
            console.log(`   ⚠️  FUERA DE RANGO: ${outOfRange} valores (${outOfRangePercent}%)`);
            
            // Sugerir posible error de definición
            if (outOfRangePercent > 20) {
                console.log(`   🚨 POSIBLE ERROR EN DEFINICIÓN: >20% valores fuera de rango`);
                
                // Analizar si parece otra unidad
                if (doc.unit === 'mg' && max > 2000) {
                    console.log(`      → Podría ser 'mdps' en lugar de 'mg'`);
                } else if (doc.unit === 'mdps' && max < 500) {
                    console.log(`      → Podría ser 'mg' en lugar de 'mdps'`);
                } else if (doc.unit === 'grados' && max > 180) {
                    console.log(`      → Podría ser 'mdps' o 'mg' en lugar de 'grados'`);
                }
            }
        } else {
            console.log(`   ✅ Todos los valores dentro del rango`);
        }

        console.log('');
    });

    // Buscar posibles intercambios de columnas
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DETECCIÓN DE COLUMNAS POSIBLEMENTE INTERCAMBIADAS\n');

    // Comparar rangos entre columnas similares
    const accelCols = ['ax', 'ay', 'az'];
    const gyroCols = ['gx', 'gy', 'gz'];
    const angleCols = ['roll', 'pitch', 'yaw'];

    console.log('ACELERACIONES (ax, ay, az) - Deberían estar en rango similar:\n');
    accelCols.forEach(col => {
        if (columnValues[col]) {
            const min = Math.min(...columnValues[col]);
            const max = Math.max(...columnValues[col]);
            const avg = Math.abs(columnValues[col].reduce((a,b) => a+b, 0) / columnValues[col].length);
            console.log(`  ${col}: [${min.toFixed(0)}, ${max.toFixed(0)}] mg, |promedio|=${avg.toFixed(0)}`);
        }
    });

    console.log('\nVELOCIDADES ANGULARES (gx, gy, gz) - Deberían estar en rango similar:\n');
    gyroCols.forEach(col => {
        if (columnValues[col]) {
            const min = Math.min(...columnValues[col]);
            const max = Math.max(...columnValues[col]);
            const avg = Math.abs(columnValues[col].reduce((a,b) => a+b, 0) / columnValues[col].length);
            console.log(`  ${col}: [${min.toFixed(0)}, ${max.toFixed(0)}] mdps, |promedio|=${avg.toFixed(0)}`);
        }
    });

    console.log('\nÁNGULOS (roll, pitch, yaw) - Deberían estar en grados:\n');
    angleCols.forEach(col => {
        if (columnValues[col]) {
            const min = Math.min(...columnValues[col]);
            const max = Math.max(...columnValues[col]);
            const avg = columnValues[col].reduce((a,b) => a+b, 0) / columnValues[col].length;
            console.log(`  ${col}: [${min.toFixed(2)}, ${max.toFixed(2)}] grados, promedio=${avg.toFixed(2)}`);
        }
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ ANÁLISIS COMPLETADO\n');
}

analyzeColumns();

