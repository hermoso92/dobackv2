/**
 * ANÁLISIS PROFUNDO Y CORRECTO DE ESTABILIDAD
 * Lee el archivo completo entendiendo su estructura real
 */

const fs = require('fs');

const FILE = 'backend/data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251001.txt';

function deepAnalyze() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISIS PROFUNDO: ESTRUCTURA REAL DE ESTABILIDAD');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = fs.readFileSync(FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`Total líneas: ${lines.length.toLocaleString()}\n`);

    // Línea 1: Cabecera
    console.log('LÍNEA 1 (Cabecera):');
    console.log(`  ${lines[0]}\n`);

    // Línea 2: Columnas
    console.log('LÍNEA 2 (Columnas):');
    const columns = lines[1].split(';').map(c => c.trim()).filter(c => c);
    console.log(`  ${columns.length} columnas: ${columns.join(', ')}\n`);

    // Detectar patrón de datos
    console.log('ESTRUCTURA DE DATOS (primeras 30 líneas):\n');
    
    const pattern = [];
    for (let i = 2; i < Math.min(32, lines.length); i++) {
        const line = lines[i];
        
        // Detectar tipo de línea
        let tipo;
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) {
            tipo = 'TIMESTAMP';
        } else if (line.split(';').length > 10) {
            tipo = 'DATOS';
        } else {
            tipo = 'OTRO';
        }
        
        console.log(`  Línea ${i+1} [${tipo.padEnd(10)}]: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
        pattern.push(tipo);
    }

    // Analizar patrón
    console.log('\n📋 PATRÓN DETECTADO:\n');
    
    const patternStr = pattern.slice(0, 20).join(' → ');
    console.log(`  ${patternStr}\n`);

    // Contar por tipo
    const fullPattern = {};
    let currentTimestamp = null;
    let dataCount = 0;
    let timestampCount = 0;

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) {
            timestampCount++;
            currentTimestamp = line;
        } else if (line.split(';').length >= columns.length) {
            dataCount++;
        }
    }

    console.log('📊 CONTEO TOTAL:\n');
    console.log(`  Timestamps: ${timestampCount.toLocaleString()}`);
    console.log(`  Datos: ${dataCount.toLocaleString()}`);
    console.log(`  Ratio: ${(dataCount / timestampCount).toFixed(2)} datos por timestamp\n`);

    // Calcular duración de sesión
    const firstTimestamp = lines.find(l => l.match(/^\d{2}:\d{2}:\d{2}$/));
    const lastTimestamp = [...lines].reverse().find(l => l.match(/^\d{2}:\d{2}:\d{2}$/));

    if (firstTimestamp && lastTimestamp) {
        console.log('⏱️  DURACIÓN DE SESIÓN:\n');
        console.log(`  Inicio: ${firstTimestamp}`);
        console.log(`  Fin: ${lastTimestamp}`);
        
        const [h1, m1, s1] = firstTimestamp.split(':').map(Number);
        const [h2, m2, s2] = lastTimestamp.split(':').map(Number);
        
        const start = h1 * 3600 + m1 * 60 + s1;
        const end = h2 * 3600 + m2 * 60 + s2;
        
        let duration = end - start;
        if (duration < 0) duration += 24 * 3600; // Cruce de medianoche
        
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        console.log(`  Duración: ${hours}h ${minutes}m ${seconds}s (${duration} segundos)\n`);
    }

    // Analizar valores de SI (Índice de Estabilidad)
    console.log('🎯 ANÁLISIS DE SI (Índice de Estabilidad):\n');
    
    const siValues = [];
    const siIndex = columns.indexOf('si');
    
    if (siIndex !== -1) {
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
            
            const values = line.split(';').map(v => parseFloat(v.trim()));
            if (values.length >= siIndex + 1 && !isNaN(values[siIndex])) {
                siValues.push(values[siIndex]);
            }
        }
        
        if (siValues.length > 0) {
            const siMin = Math.min(...siValues);
            const siMax = Math.max(...siValues);
            const siAvg = siValues.reduce((a, b) => a + b, 0) / siValues.length;
            
            const critical = siValues.filter(v => v < 0.6).length;
            const warning = siValues.filter(v => v >= 0.6 && v < 0.8).length;
            const good = siValues.filter(v => v >= 0.8).length;
            
            console.log(`  Total muestras SI: ${siValues.length.toLocaleString()}`);
            console.log(`  SI mínimo: ${siMin.toFixed(3)}`);
            console.log(`  SI máximo: ${siMax.toFixed(3)}`);
            console.log(`  SI promedio: ${siAvg.toFixed(3)}\n`);
            console.log(`  Distribución por severidad:`);
            console.log(`    🔴 Crítico (SI < 0.6): ${critical.toLocaleString()} (${((critical/siValues.length)*100).toFixed(2)}%)`);
            console.log(`    🟡 Advertencia (0.6 ≤ SI < 0.8): ${warning.toLocaleString()} (${((warning/siValues.length)*100).toFixed(2)}%)`);
            console.log(`    🟢 Bueno (SI ≥ 0.8): ${good.toLocaleString()} (${((good/siValues.length)*100).toFixed(2)}%)`);
        }
    }

    console.log('\n');
}

deepAnalyze();

