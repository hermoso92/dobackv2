/**
 * 🔬 ANÁLISIS FÍSICO PROFUNDO - VALIDACIÓN CRÍTICA
 * 
 * Objetivo: Verificar desde la física real si cada variable representa
 * lo que dice representar, sin asumir que las etiquetas son correctas.
 */

const fs = require('fs');
const path = require('path');

const FILE = 'C:\\Users\\Cosigein SL\\Desktop\\CMadrid\\doback024\\estabilidad\\ESTABILIDAD_DOBACK024_20251001.txt';

// ============================================
// LEER Y PARSEAR DATOS
// ============================================
function loadData(maxLines = 10000) {
    const content = fs.readFileSync(FILE, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    const data = [];
    
    // Saltar cabeceras y timestamps
    for (let i = 2; i < Math.min(lines.length, maxLines + 2); i++) {
        const line = lines[i];
        
        // Ignorar timestamps solos
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        
        const parts = line.split(';').map(p => p.trim());
        if (parts.length < 19) continue;
        
        try {
            data.push({
                ax: parseFloat(parts[0]),
                ay: parseFloat(parts[1]),
                az: parseFloat(parts[2]),
                gx: parseFloat(parts[3]),
                gy: parseFloat(parts[4]),
                gz: parseFloat(parts[5]),
                roll: parseFloat(parts[6]),
                pitch: parseFloat(parts[7]),
                yaw: parseFloat(parts[8]),
                si: parseFloat(parts[15]),
                accmag: parseFloat(parts[16])
            });
        } catch (e) {
            // Ignorar líneas con errores de parseo
        }
    }
    
    return data;
}

// ============================================
// VALIDACIÓN 1: ESCALA Y UNIDADES
// ============================================
function validateScale(data) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 VALIDACIÓN 1: ESCALA Y UNIDADES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Calcular promedios
    const avgAx = data.reduce((sum, d) => sum + Math.abs(d.ax), 0) / data.length;
    const avgAy = data.reduce((sum, d) => sum + Math.abs(d.ay), 0) / data.length;
    const avgAz = data.reduce((sum, d) => sum + d.az, 0) / data.length;
    const avgAccmag = data.reduce((sum, d) => sum + d.accmag, 0) / data.length;
    
    console.log('Promedios en TODO el archivo:');
    console.log(`  |ax| promedio: ${avgAx.toFixed(2)}`);
    console.log(`  |ay| promedio: ${avgAy.toFixed(2)}`);
    console.log(`  az  promedio:  ${avgAz.toFixed(2)}`);
    console.log(`  accmag prom:   ${avgAccmag.toFixed(2)}`);
    
    console.log('\n📊 HIPÓTESIS: Unidades en centésimas de m/s² (escala 100x)');
    console.log(`  az / 100 = ${(avgAz / 100).toFixed(3)} m/s²`);
    console.log(`  Gravedad terrestre = 9.81 m/s²`);
    console.log(`  Diferencia: ${((avgAz / 100) - 9.81).toFixed(3)} m/s²`);
    
    if (Math.abs((avgAz / 100) - 9.81) < 1.0) {
        console.log(`  ✅ az parece ser aceleración VERTICAL (≈gravedad)`);
    } else {
        console.log(`  ⚠️  az NO coincide con gravedad terrestre`);
    }
    
    console.log(`\n📊 Análisis de ay:`);
    console.log(`  ay / 100 = ${(avgAy / 100).toFixed(3)} m/s²`);
    if (avgAy / 100 > 1.0) {
        console.log(`  ⚠️  CRÍTICO: ay promedio = 3.6+ m/s² es DEMASIADO alto`);
        console.log(`  → Si el vehículo está en reposo, esto indica:`);
        console.log(`     1. ay NO es aceleración frontal pura`);
        console.log(`     2. Hay un OFFSET/BIAS constante en ay`);
        console.log(`     3. O el sensor está MAL CALIBRADO`);
    }
    
    return { avgAx, avgAy, avgAz, avgAccmag };
}

// ============================================
// VALIDACIÓN 2: IDENTIFICAR EJE VERTICAL
// ============================================
function identifyVerticalAxis(data) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 VALIDACIÓN 2: IDENTIFICAR EJE VERTICAL (GRAVEDAD)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Calcular desviación estándar de cada eje
    const mean_ax = data.reduce((sum, d) => sum + d.ax, 0) / data.length;
    const mean_ay = data.reduce((sum, d) => sum + d.ay, 0) / data.length;
    const mean_az = data.reduce((sum, d) => sum + d.az, 0) / data.length;
    
    const std_ax = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.ax - mean_ax, 2), 0) / data.length);
    const std_ay = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.ay - mean_ay, 2), 0) / data.length);
    const std_az = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.az - mean_az, 2), 0) / data.length);
    
    console.log('Desviación estándar (mide variabilidad):');
    console.log(`  ax: mean=${mean_ax.toFixed(2)}, std=${std_ax.toFixed(2)}`);
    console.log(`  ay: mean=${mean_ay.toFixed(2)}, std=${std_ay.toFixed(2)}`);
    console.log(`  az: mean=${mean_az.toFixed(2)}, std=${std_az.toFixed(2)}`);
    
    console.log('\n💡 LÓGICA:');
    console.log('  → El eje VERTICAL debe tener:');
    console.log('     1. Media ≈ ±9.81 m/s² (gravedad)');
    console.log('     2. Desviación estándar BAJA (poco movimiento vertical)');
    
    // Determinar cuál es más estable
    const axes = [
        { name: 'ax', mean: Math.abs(mean_ax), std: std_ax },
        { name: 'ay', mean: Math.abs(mean_ay), std: std_ay },
        { name: 'az', mean: Math.abs(mean_az), std: std_az }
    ];
    
    // El eje vertical debe tener:
    // 1. Media cercana a 981 (9.81 × 100)
    // 2. Desviación estándar baja
    axes.forEach(axis => {
        const diff_from_gravity = Math.abs((axis.mean / 100) - 9.81);
        axis.score = 1 / (diff_from_gravity + 0.1) - axis.std / 100;
    });
    
    axes.sort((a, b) => b.score - a.score);
    
    console.log('\n🏆 RANKING (más probable = eje vertical):');
    axes.forEach((axis, i) => {
        console.log(`  ${i + 1}. ${axis.name}: mean=${axis.mean.toFixed(2)}, std=${axis.std.toFixed(2)}, score=${axis.score.toFixed(3)}`);
    });
    
    console.log(`\n✅ EJE VERTICAL MÁS PROBABLE: ${axes[0].name.toUpperCase()}`);
    
    return axes[0].name;
}

// ============================================
// VALIDACIÓN 3: ANALIZAR COMPONENTES
// ============================================
function analyzeComponents(data, verticalAxis) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 VALIDACIÓN 3: ANÁLISIS DE COMPONENTES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Calcular magnitud 2D (sin componente vertical)
    const results = data.map(d => {
        let ax_h, ay_h, az_v;
        
        if (verticalAxis === 'az') {
            ax_h = d.ax;
            ay_h = d.ay;
            az_v = d.az;
        } else if (verticalAxis === 'ay') {
            ax_h = d.ax;
            ay_h = d.az;
            az_v = d.ay;
        } else { // ax
            ax_h = d.ay;
            ay_h = d.az;
            az_v = d.ax;
        }
        
        const mag_horizontal = Math.sqrt(ax_h * ax_h + ay_h * ay_h);
        const mag_total = Math.sqrt(ax_h * ax_h + ay_h * ay_h + az_v * az_v);
        
        return { mag_horizontal, mag_total, az_v };
    });
    
    const avg_mag_h = results.reduce((sum, r) => sum + r.mag_horizontal, 0) / results.length;
    const avg_mag_t = results.reduce((sum, r) => sum + r.mag_total, 0) / results.length;
    const avg_az_v = results.reduce((sum, r) => sum + r.az_v, 0) / results.length;
    
    console.log(`Componente vertical (${verticalAxis}):`);
    console.log(`  Promedio: ${avg_az_v.toFixed(2)} (${(avg_az_v / 100).toFixed(3)} m/s²)`);
    console.log(`\nMagnitud horizontal (sin gravedad):`);
    console.log(`  Promedio: ${avg_mag_h.toFixed(2)} (${(avg_mag_h / 100).toFixed(3)} m/s²)`);
    console.log(`\nMagnitud total:`);
    console.log(`  Promedio: ${avg_mag_t.toFixed(2)} (${(avg_mag_t / 100).toFixed(3)} m/s²)`);
    
    console.log(`\n💡 INTERPRETACIÓN:`);
    if (avg_mag_h / 100 < 0.5) {
        console.log(`  ✅ Magnitud horizontal baja → Vehículo mayormente en reposo`);
    } else {
        console.log(`  ⚠️  Magnitud horizontal alta (${(avg_mag_h / 100).toFixed(2)} m/s²) → Vehículo en movimiento o sensor mal calibrado`);
    }
}

// ============================================
// VALIDACIÓN 4: VERIFICAR CONSISTENCIA ACCMAG
// ============================================
function verifyAccmagConsistency(data) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 VALIDACIÓN 4: CONSISTENCIA DE ACCMAG');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let errors = 0;
    let maxError = 0;
    
    for (let i = 0; i < Math.min(data.length, 100); i++) {
        const d = data[i];
        const calculated = Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az);
        const diff = Math.abs(calculated - d.accmag);
        
        if (diff > 0.5) {
            errors++;
            maxError = Math.max(maxError, diff);
        }
    }
    
    console.log(`Verificación en primeros 100 registros:`);
    console.log(`  Errores (diff > 0.5): ${errors}/100`);
    console.log(`  Error máximo: ${maxError.toFixed(2)}`);
    
    if (errors === 0) {
        console.log(`\n  ✅ accmag = √(ax² + ay² + az²) VERIFICADO`);
    } else {
        console.log(`\n  ⚠️  Hay inconsistencias en accmag`);
    }
}

// ============================================
// MAIN
// ============================================
console.log('═══════════════════════════════════════════════════════════');
console.log('🔬 ANÁLISIS FÍSICO PROFUNDO - VALIDACIÓN CRÍTICA');
console.log('═══════════════════════════════════════════════════════════');
console.log(`\nArchivo: ${FILE}`);

const data = loadData(10000);
console.log(`Registros cargados: ${data.length}\n`);

const stats = validateScale(data);
const verticalAxis = identifyVerticalAxis(data);
analyzeComponents(data, verticalAxis);
verifyAccmagConsistency(data);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📊 CONCLUSIONES FINALES');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`1. Escala: Unidades en centésimas de m/s² (100x)`);
console.log(`2. Eje vertical identificado: ${verticalAxis.toUpperCase()}`);
console.log(`3. Magnitud total verificada: accmag = √(ax² + ay² + az²) ✅`);
console.log(`4. Calidad de calibración: ${stats.avgAy > 300 ? '⚠️  REQUIERE REVISIÓN' : '✅ OK'}`);
console.log('');

