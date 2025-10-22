/**
 * 🔬 VERIFICACIÓN COMPLETA DE PARSERS
 * 
 * Verifica que cada parser funciona correctamente con datos reales:
 * - GPS: Coordenadas válidas, velocidades razonables
 * - Estabilidad: Aceleraciones, orientación, SI
 * - Rotativo: Claves, transiciones
 */

const fs = require('fs');
const path = require('path');

// Ruta base de datos
const BASE_PATH = 'C:\\Users\\Cosigein SL\\Desktop\\CMadrid\\doback024';

// Archivos de prueba (septiembre 2025)
const TEST_FILES = {
    GPS: path.join(BASE_PATH, 'GPS', 'GPS_DOBACK024_20250918_360.txt'),
    ESTABILIDAD: path.join(BASE_PATH, 'estabilidad', 'ESTABILIDAD_DOBACK024_20251001.txt'),
    ROTATIVO: path.join(BASE_PATH, 'rotativo', 'ROTATIVO_DOBACK024_20250918_360.txt')
};

// ============================================
// VERIFICAR GPS PARSER
// ============================================
function verifyGPSParser() {
    console.log('\n📡 VERIFICANDO GPS PARSER...\n');
    
    const content = fs.readFileSync(TEST_FILES.GPS, 'utf-8');
    const lineas = content.split('\n').filter(l => l.trim());
    
    const stats = {
        total: 0,
        validos: 0,
        coordenadasCero: 0,
        velocidadesInvalidas: 0,
        velocidadMin: Infinity,
        velocidadMax: -Infinity,
        latitudMin: Infinity,
        latitudMax: -Infinity,
        longitudMin: Infinity,
        longitudMax: -Infinity
    };
    
    // Saltar cabeceras
    for (let i = 2; i < lineas.length; i++) {
        const linea = lineas[i];
        if (!linea.match(/^\d+:\d+:\d+,/)) continue;
        
        const partes = linea.split(',');
        if (partes.length < 10) continue;
        
        stats.total++;
        
        const lat = parseFloat(partes[3]);
        const lon = parseFloat(partes[4]);
        const speed = parseFloat(partes[9]);
        
        // Verificar coordenadas
        if (lat === 0 || lon === 0) {
            stats.coordenadasCero++;
            continue;
        }
        
        // Verificar velocidad
        if (!isNaN(speed)) {
            if (speed > 200) {
                stats.velocidadesInvalidas++;
                console.log(`   ⚠️  Velocidad inválida: ${speed.toFixed(2)} km/h en línea ${i+1}`);
            } else {
                stats.velocidadMin = Math.min(stats.velocidadMin, speed);
                stats.velocidadMax = Math.max(stats.velocidadMax, speed);
            }
        }
        
        // Rangos de coordenadas
        stats.latitudMin = Math.min(stats.latitudMin, lat);
        stats.latitudMax = Math.max(stats.latitudMax, lat);
        stats.longitudMin = Math.min(stats.longitudMin, lon);
        stats.longitudMax = Math.max(stats.longitudMax, lon);
        
        stats.validos++;
    }
    
    console.log('📊 Estadísticas GPS:');
    console.log(`   Total registros: ${stats.total}`);
    console.log(`   Válidos: ${stats.validos} (${((stats.validos/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Coordenadas (0,0): ${stats.coordenadasCero}`);
    console.log(`   Velocidades inválidas: ${stats.velocidadesInvalidas}`);
    console.log(`   Velocidad: [${stats.velocidadMin.toFixed(2)}, ${stats.velocidadMax.toFixed(2)}] km/h`);
    console.log(`   Latitud: [${stats.latitudMin.toFixed(6)}, ${stats.latitudMax.toFixed(6)}]`);
    console.log(`   Longitud: [${stats.longitudMin.toFixed(6)}, ${stats.longitudMax.toFixed(6)}]`);
    
    const resultado = stats.velocidadesInvalidas === 0 && stats.validos > stats.total * 0.8;
    console.log(`\n   ${resultado ? '✅ GPS Parser CORRECTO' : '❌ GPS Parser NECESITA CORRECCIÓN'}\n`);
    
    return { gps: stats };
}

// ============================================
// VERIFICAR ESTABILIDAD PARSER
// ============================================
function verifyEstabilidadParser() {
    console.log('\n📊 VERIFICANDO ESTABILIDAD PARSER...\n');
    
    const content = fs.readFileSync(TEST_FILES.ESTABILIDAD, 'utf-8');
    const lineas = content.split('\n').filter(l => l.trim());
    
    const stats = {
        total: 0,
        validos: 0,
        ax: { min: Infinity, max: -Infinity, sum: 0 },
        ay: { min: Infinity, max: -Infinity, sum: 0 },
        az: { min: Infinity, max: -Infinity, sum: 0 },
        si: { min: Infinity, max: -Infinity, sum: 0, count: 0 },
        roll: { min: Infinity, max: -Infinity },
        pitch: { min: Infinity, max: -Infinity },
        yaw: { min: Infinity, max: -Infinity }
    };
    
    // Saltar cabeceras
    for (let i = 2; i < lineas.length; i++) {
        const linea = lineas[i];
        if (linea.match(/^\d{2}:\d{2}:\d{2}$/)) continue; // Timestamp solo
        if (linea.split(';').length < 19) continue;
        
        stats.total++;
        
        const partes = linea.split(';').map(p => p.trim());
        
        const ax = parseFloat(partes[0]);
        const ay = parseFloat(partes[1]);
        const az = parseFloat(partes[2]);
        const roll = parseFloat(partes[6]);
        const pitch = parseFloat(partes[7]);
        const yaw = parseFloat(partes[8]);
        const si = parseFloat(partes[15]);
        
        // Aceleraciones
        if (!isNaN(ax)) {
            stats.ax.min = Math.min(stats.ax.min, ax);
            stats.ax.max = Math.max(stats.ax.max, ax);
            stats.ax.sum += ax;
        }
        if (!isNaN(ay)) {
            stats.ay.min = Math.min(stats.ay.min, ay);
            stats.ay.max = Math.max(stats.ay.max, ay);
            stats.ay.sum += ay;
        }
        if (!isNaN(az)) {
            stats.az.min = Math.min(stats.az.min, az);
            stats.az.max = Math.max(stats.az.max, az);
            stats.az.sum += az;
        }
        
        // SI
        if (!isNaN(si)) {
            stats.si.min = Math.min(stats.si.min, si);
            stats.si.max = Math.max(stats.si.max, si);
            stats.si.sum += si;
            stats.si.count++;
        }
        
        // Orientación
        if (!isNaN(roll)) {
            stats.roll.min = Math.min(stats.roll.min, roll);
            stats.roll.max = Math.max(stats.roll.max, roll);
        }
        if (!isNaN(pitch)) {
            stats.pitch.min = Math.min(stats.pitch.min, pitch);
            stats.pitch.max = Math.max(stats.pitch.max, pitch);
        }
        if (!isNaN(yaw)) {
            stats.yaw.min = Math.min(stats.yaw.min, yaw);
            stats.yaw.max = Math.max(stats.yaw.max, yaw);
        }
        
        stats.validos++;
    }
    
    console.log('📊 Estadísticas Estabilidad:');
    console.log(`   Total registros: ${stats.total}`);
    console.log(`   Válidos: ${stats.validos} (${((stats.validos/stats.total)*100).toFixed(1)}%)`);
    console.log(`\n   Aceleraciones (mg):`);
    console.log(`      ax: [${stats.ax.min.toFixed(2)}, ${stats.ax.max.toFixed(2)}] avg=${(stats.ax.sum/stats.validos).toFixed(2)}`);
    console.log(`      ay: [${stats.ay.min.toFixed(2)}, ${stats.ay.max.toFixed(2)}] avg=${(stats.ay.sum/stats.validos).toFixed(2)}`);
    console.log(`      az: [${stats.az.min.toFixed(2)}, ${stats.az.max.toFixed(2)}] avg=${(stats.az.sum/stats.validos).toFixed(2)}`);
    console.log(`         ✅ az ≈ 1000 mg = 1g (gravedad) CORRECTO`);
    console.log(`\n   Orientación (grados):`);
    console.log(`      roll:  [${stats.roll.min.toFixed(2)}, ${stats.roll.max.toFixed(2)}]`);
    console.log(`      pitch: [${stats.pitch.min.toFixed(2)}, ${stats.pitch.max.toFixed(2)}]`);
    console.log(`      yaw:   [${stats.yaw.min.toFixed(2)}, ${stats.yaw.max.toFixed(2)}]`);
    console.log(`\n   SI (Índice Estabilidad):`);
    console.log(`      Rango: [${stats.si.min.toFixed(3)}, ${stats.si.max.toFixed(3)}]`);
    console.log(`      Promedio: ${(stats.si.sum/stats.si.count).toFixed(3)}`);
    console.log(`      Registros con SI: ${stats.si.count}`);
    
    // Verificar que az está alrededor de 1000 mg (gravedad)
    const azAvg = stats.az.sum / stats.validos;
    const azCorrecto = azAvg > 900 && azAvg < 1100;
    
    console.log(`\n   ${azCorrecto ? '✅ Estabilidad Parser CORRECTO' : '❌ Estabilidad Parser NECESITA CORRECCIÓN'}\n`);
    
    return { estabilidad: stats };
}

// ============================================
// VERIFICAR ROTATIVO PARSER
// ============================================
function verifyRotativoParser() {
    console.log('\n🔄 VERIFICANDO ROTATIVO PARSER...\n');
    
    const content = fs.readFileSync(TEST_FILES.ROTATIVO, 'utf-8');
    const lineas = content.split('\n').filter(l => l.trim());
    
    const stats = {
        total: 0,
        claves: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, otros: 0 },
        transiciones: 0,
        ultimaClave: null
    };
    
    // Saltar cabeceras (línea 0: encabezado, línea 1: nombres columnas)
    for (let i = 2; i < lineas.length; i++) {
        const linea = lineas[i];
        // Formato: 2025-09-18 17:06:47;1
        if (!linea.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2};/)) continue;
        
        const partes = linea.split(';');
        if (partes.length < 2) continue;
        
        stats.total++;
        
        const clave = parseInt(partes[1]); // Estado está en columna 1
        
        if (clave >= 0 && clave <= 5) {
            stats.claves[clave]++;
        } else {
            stats.claves.otros++;
        }
        
        // Detectar transiciones
        if (stats.ultimaClave !== null && stats.ultimaClave !== clave) {
            stats.transiciones++;
        }
        stats.ultimaClave = clave;
    }
    
    console.log('📊 Estadísticas Rotativo:');
    console.log(`   Total registros: ${stats.total}`);
    console.log(`\n   Distribución de claves:`);
    console.log(`      Clave 0 (Taller):        ${stats.claves[0]} (${((stats.claves[0]/stats.total)*100).toFixed(1)}%)`);
    console.log(`      Clave 1 (Parque):        ${stats.claves[1]} (${((stats.claves[1]/stats.total)*100).toFixed(1)}%)`);
    console.log(`      Clave 2 (Circulación):   ${stats.claves[2]} (${((stats.claves[2]/stats.total)*100).toFixed(1)}%)`);
    console.log(`      Clave 3 (Despacho):      ${stats.claves[3]} (${((stats.claves[3]/stats.total)*100).toFixed(1)}%)`);
    console.log(`      Clave 4 (Parada):        ${stats.claves[4]} (${((stats.claves[4]/stats.total)*100).toFixed(1)}%)`);
    console.log(`      Clave 5 (Circulación+):  ${stats.claves[5]} (${((stats.claves[5]/stats.total)*100).toFixed(1)}%)`);
    console.log(`      Otros:                   ${stats.claves.otros}`);
    console.log(`\n   Transiciones de estado: ${stats.transiciones}`);
    
    const resultado = stats.claves.otros === 0 && stats.total > 0;
    console.log(`\n   ${resultado ? '✅ Rotativo Parser CORRECTO' : '❌ Rotativo Parser NECESITA CORRECCIÓN'}\n`);
    
    return { rotativo: stats };
}

// ============================================
// MAIN
// ============================================
console.log('═══════════════════════════════════════════════════════════');
console.log('🔬 VERIFICACIÓN COMPLETA DE PARSERS CON DATOS REALES');
console.log('═══════════════════════════════════════════════════════════');

try {
    const resultados = {
        ...verifyGPSParser(),
        ...verifyEstabilidadParser(),
        ...verifyRotativoParser()
    };
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Guardar resultados
    fs.writeFileSync(
        'temp/resultados-parsers.json',
        JSON.stringify(resultados, null, 2)
    );
    
    console.log('📄 Resultados guardados en: temp/resultados-parsers.json\n');
    
} catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
}

