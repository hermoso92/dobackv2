/**
 * Análisis detallado de valores reales para detectar errores en definiciones
 */

const fs = require('fs');

const FILE = 'C:/Users/Cosigein SL/Desktop/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251001.txt';

function analyzeRealValues() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔬 ANÁLISIS REAL DE VALORES - DETECCIÓN DE ERRORES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = fs.readFileSync(FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    // Columnas
    const columnsLine = lines[1];
    const columns = columnsLine.split(';').map(c => c.trim()).filter(c => c);

    console.log(`COLUMNAS: ${columns.join(', ')}\n`);
    console.log('PRIMEROS 5 REGISTROS DE DATOS:\n');

    // Mostrar primeros 5 registros completos
    let shown = 0;
    for (let i = 2; i < lines.length && shown < 5; i++) {
        const line = lines[i].trim();
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        if (!line || line.length < 10) continue;

        const values = line.split(';').map(v => v.trim());
        if (values.length !== columns.length) continue;

        shown++;
        console.log(`Registro ${shown}:`);
        columns.forEach((col, idx) => {
            const val = parseFloat(values[idx]);
            console.log(`  ${col.padEnd(15)}: ${values[idx].padStart(12)} ${!isNaN(val) ? '(numérico)' : ''}`);
        });
        console.log('');
    }

    // Analizar rangos de cada columna
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RANGOS REALES (primeros 5000 registros):\n');

    const stats = {};
    columns.forEach(col => {
        stats[col] = [];
    });

    let count = 0;
    for (let i = 2; i < lines.length && count < 5000; i++) {
        const line = lines[i].trim();
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        if (!line || line.length < 10) continue;

        const values = line.split(';').map(v => v.trim());
        if (values.length !== columns.length) continue;

        columns.forEach((col, idx) => {
            const val = parseFloat(values[idx]);
            if (!isNaN(val)) {
                stats[col].push(val);
            }
        });

        count++;
    }

    console.log(`Analizados: ${count.toLocaleString()} registros\n`);

    // Mostrar estadísticas
    columns.forEach(col => {
        if (stats[col].length === 0) return;

        const vals = stats[col];
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const avg = vals.reduce((a,b) => a+b, 0) / vals.length;

        console.log(`${col.padEnd(15)}: Min=${min.toFixed(2).padStart(10)}, Max=${max.toFixed(2).padStart(10)}, Avg=${avg.toFixed(2).padStart(10)}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎯 ANÁLISIS DE UNIDADES DE MEDIDA:\n');

    // Analizar qué columnas parecen ser qué
    console.log('ACELERACIONES (debería ser ~±100 mg en reposo, ±2000 mg en movimiento):');
    ['ax', 'ay', 'az'].forEach(col => {
        if (stats[col] && stats[col].length > 0) {
            const min = Math.min(...stats[col]);
            const max = Math.max(...stats[col]);
            const avg = Math.abs(stats[col].reduce((a,b) => a+b, 0) / stats[col].length);
            console.log(`  ${col}: [${min.toFixed(0)}, ${max.toFixed(0)}] → |avg|=${avg.toFixed(0)}`);
            
            if (avg > 500 && avg < 1100) {
                console.log(`      ⚠️  SOSPECHA: Valores ~1000 NO son aceleraciones mg`);
                console.log(`          Posiblemente: Presión atmosférica (mbar)`);
            } else if (avg < 100) {
                console.log(`      ✅ Valores coherentes con aceleraciones mg`);
            }
        }
    });

    console.log('\nVELOCIDADES ANGULARES (debería ser ±10000 mdps):');
    ['gx', 'gy', 'gz'].forEach(col => {
        if (stats[col] && stats[col].length > 0) {
            const min = Math.min(...stats[col]);
            const max = Math.max(...stats[col]);
            console.log(`  ${col}: [${min.toFixed(0)}, ${max.toFixed(0)}] mdps`);
            
            if (Math.abs(min) > 10000 || Math.abs(max) > 10000) {
                console.log(`      ⚠️  Valores fuera del rango ±10000 mdps`);
            } else {
                console.log(`      ✅ Valores coherentes`);
            }
        }
    });

    console.log('\nÁNGULOS (debería ser ±180 grados):');
    ['roll', 'pitch', 'yaw'].forEach(col => {
        if (stats[col] && stats[col].length > 0) {
            const min = Math.min(...stats[col]);
            const max = Math.max(...stats[col]);
            console.log(`  ${col}: [${min.toFixed(2)}, ${max.toFixed(2)}] grados`);
            
            if (Math.abs(min) > 180 || Math.abs(max) > 180) {
                console.log(`      ⚠️  Valores fuera del rango ±180°`);
            } else {
                console.log(`      ✅ Valores coherentes con grados`);
            }
        }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
}

analyzeRealValues();

