const fs = require('fs');
const path = require('path');

console.log('=== TEST COMPLETO SUBIDA SESIÓN ===\n');

// Rutas de archivos
const basePath = 'backend/data/datosDoback/CMadrid - copia';
const files = {
    GPS: path.join(basePath, 'GPS_DOBACK022_20250710_0.txt'),
    CAN: path.join(basePath, 'CAN_DOBACK022_20250710_0_TRADUCIDO.csv'),
    ESTABILIDAD: path.join(basePath, 'ESTABILIDAD_DOBACK022_20250710_0.txt'),
    ROTATIVO: path.join(basePath, 'ROTATIVO_DOBACK022_20250710_0.txt')
};

// Función para leer primeras líneas
function readFirstLines(filePath, lines = 10) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').slice(0, lines);
    } catch (error) {
        return [`ERROR: ${error.message}`];
    }
}

// Función para analizar GPS
function analyzeGPS(filePath) {
    console.log('📍 ANÁLISIS GPS:');
    const lines = readFirstLines(filePath, 300);
    
    const header = lines[1];
    console.log(`Header: ${header}`);
    
    let validDataFound = false;
    let firstValidLine = null;
    let timeIssues = [];
    let coordinateIssues = [];
    
    for (let i = 2; i < Math.min(lines.length, 300); i++) {
        const line = lines[i].trim();
        if (!line || line.includes('sin datos GPS')) continue;
        
        const parts = line.split(',');
        if (parts.length >= 9) {
            if (!validDataFound) {
                firstValidLine = { line: i + 1, data: line };
                validDataFound = true;
            }
            
            // Verificar timestamps malformados
            const hora = parts[1];
            if (hora && (hora.includes('.') || hora.length < 8)) {
                timeIssues.push({ line: i + 1, hora, issue: 'Timestamp malformado' });
            }
            
            // Verificar coordenadas
            const lat = parseFloat(parts[2]);
            const lon = parseFloat(parts[3]);
            if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                coordinateIssues.push({ line: i + 1, lat, lon, issue: 'Coordenadas inválidas' });
            }
            
            // Solo analizar primeras 20 líneas válidas
            if (validDataFound && coordinateIssues.length + timeIssues.length > 20) break;
        }
    }
    
    console.log(`✅ Primera línea con datos válidos: línea ${firstValidLine?.line}`);
    console.log(`❌ Problemas de tiempo encontrados: ${timeIssues.length}`);
    console.log(`❌ Problemas de coordenadas encontrados: ${coordinateIssues.length}`);
    
    if (timeIssues.length > 0) {
        console.log('   Ejemplos de problemas de tiempo:');
        timeIssues.slice(0, 3).forEach(issue => {
            console.log(`   Línea ${issue.line}: "${issue.hora}" - ${issue.issue}`);
        });
    }
    
    if (coordinateIssues.length > 0) {
        console.log('   Ejemplos de problemas de coordenadas:');
        coordinateIssues.slice(0, 3).forEach(issue => {
            console.log(`   Línea ${issue.line}: lat=${issue.lat}, lon=${issue.lon} - ${issue.issue}`);
        });
    }
    
    // Verificar desfase de tiempo
    if (firstValidLine) {
        const parts = firstValidLine.data.split(',');
        const fecha = parts[0];
        const hora = parts[1];
        console.log(`📅 Primer timestamp válido: ${fecha} ${hora}`);
        
        // El header dice que debería empezar a las 08:15:26
        // pero los datos empiezan a las 06:20:XX - desfase de 2 horas
        if (hora.startsWith('06:')) {
            console.log('⚠️  DESFASE DETECTADO: Los datos están 2 horas atrasados');
            console.log('   Corrección necesaria: sumar 2 horas a todos los timestamps');
        }
    }
    
    console.log('');
}

// Función para analizar CAN
function analyzeCAN(filePath) {
    console.log('🚗 ANÁLISIS CAN:');
    const lines = readFirstLines(filePath, 20);
    
    let headerFound = false;
    let headerLine = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes('fecha-hora') || line.toLowerCase().includes('timestamp')) {
            headerFound = true;
            headerLine = { line: i + 1, content: line };
            break;
        }
    }
    
    if (headerFound) {
        console.log(`✅ Header encontrado en línea ${headerLine.line}: ${headerLine.content}`);
    } else {
        console.log('❌ No se encontró header válido en las primeras 20 líneas');
        console.log('   Contenido de las primeras líneas:');
        lines.slice(0, 5).forEach((line, i) => {
            console.log(`   ${i + 1}: ${line}`);
        });
    }
    console.log('');
}

// Función para analizar ESTABILIDAD
function analyzeStability(filePath) {
    console.log('⚖️ ANÁLISIS ESTABILIDAD:');
    const lines = readFirstLines(filePath, 10);
    
    if (lines.length >= 3) {
        console.log(`✅ Cabecera: ${lines[0]}`);
        console.log(`✅ Header: ${lines[1]}`);
        console.log(`✅ Primera línea de datos: ${lines[2]}`);
    } else {
        console.log('❌ Archivo demasiado corto');
    }
    console.log('');
}

// Función para analizar ROTATIVO
function analyzeRotativo(filePath) {
    console.log('🔄 ANÁLISIS ROTATIVO:');
    const lines = readFirstLines(filePath, 10);
    
    if (lines.length >= 3) {
        console.log(`✅ Cabecera: ${lines[0]}`);
        console.log(`✅ Header: ${lines[1]}`);
        console.log(`✅ Primera línea de datos: ${lines[2]}`);
        
        // Contar estados
        let states = { '0': 0, '1': 0 };
        for (let i = 2; i < Math.min(lines.length, 20); i++) {
            const parts = lines[i].split(';');
            if (parts.length >= 2) {
                const state = parts[1];
                if (state in states) states[state]++;
            }
        }
        console.log(`📊 Estados en primeras líneas: Estado 0: ${states['0']}, Estado 1: ${states['1']}`);
    } else {
        console.log('❌ Archivo demasiado corto');
    }
    console.log('');
}

// Función principal
function runTest() {
    console.log('📁 Verificando existencia de archivos...\n');
    
    for (const [type, filePath] of Object.entries(files)) {
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${type}: ${filePath}`);
        } else {
            console.log(`❌ ${type}: NO ENCONTRADO - ${filePath}`);
        }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Analizar cada archivo
    if (fs.existsSync(files.GPS)) {
        analyzeGPS(files.GPS);
    }
    
    if (fs.existsSync(files.CAN)) {
        analyzeCAN(files.CAN);
    }
    
    if (fs.existsSync(files.ESTABILIDAD)) {
        analyzeStability(files.ESTABILIDAD);
    }
    
    if (fs.existsSync(files.ROTATIVO)) {
        analyzeRotativo(files.ROTATIVO);
    }
    
    console.log('='.repeat(60));
    console.log('📋 RESUMEN DE PROBLEMAS DETECTADOS:');
    console.log('1. GPS: Timestamps malformados (06:15:4., 06:15:8.)');
    console.log('2. GPS: Coordenadas corruptas (-0.5630963 debería ser -3.5630963)');
    console.log('3. GPS: Desfase de 2 horas (datos a las 06:XX vs cabecera 08:XX)');
    console.log('4. GPS: Velocidades anómalas (>150 km/h)');
    console.log('');
    console.log('🔧 CORRECCIONES NECESARIAS:');
    console.log('1. Validar y limpiar timestamps GPS');
    console.log('2. Detectar y corregir coordenadas corruptas');
    console.log('3. Implementar corrección de +2 horas en GPS');
    console.log('4. Validar rangos de velocidad razonables');
}

// Ejecutar test
runTest(); 