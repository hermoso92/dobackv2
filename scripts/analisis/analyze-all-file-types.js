/**
 * ANÁLISIS COMPLETO DE TODOS LOS TIPOS DE ARCHIVOS
 * Lee archivos completos línea por línea para entender estructura exacta
 */

const fs = require('fs');
const path = require('path');

// Archivos a analizar (del mismo día para correlación)
const FILES = {
    estabilidad: 'backend/data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251001.txt',
    gps: 'backend/data/datosDoback/CMadrid/doback024/GPS/GPS_DOBACK024_20251001.txt',
    rotativo: 'backend/data/datosDoback/CMadrid/doback024/ROTATIVO/ROTATIVO_DOBACK024_20251001.txt'
};

function analyzeEstabilidad(filePath) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISIS COMPLETO: ESTABILIDAD');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    console.log(`📁 Archivo: ${path.basename(filePath)}`);
    console.log(`📏 Total líneas: ${lines.length.toLocaleString()}\n`);

    // LÍNEA 1: Cabecera
    console.log('🔍 LÍNEA 1 - CABECERA:');
    console.log(`   "${lines[0]}"`);
    
    const headerMatch = lines[0].match(/^ESTABILIDAD;(.+?);(.+?);(.+?);$/);
    if (headerMatch) {
        console.log(`   ✅ Fecha inicio: ${headerMatch[1]}`);
        console.log(`   ✅ Vehículo: ${headerMatch[2]}`);
        console.log(`   ✅ Sesión: ${headerMatch[3]}`);
    }

    // LÍNEA 2: Columnas
    console.log('\n🔍 LÍNEA 2 - COLUMNAS:');
    const columns = lines[1].split(';').map(c => c.trim()).filter(c => c);
    console.log(`   Total: ${columns.length}`);
    console.log(`   ${columns.join(', ')}`);

    // LÍNEA 3+: Datos alternados con timestamps
    console.log('\n🔍 LÍNEAS 3+ - PATRÓN DE DATOS:\n');
    
    let dataLines = 0;
    let timestampLines = 0;
    let currentTimestamp = null;
    let dataBySecond = [];
    let sessions = [];
    let currentSession = { number: 1, start: null, end: null, dataCount: 0 };

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];

        // Detectar timestamp (HH:MM:SS)
        const tsMatch = line.match(/^(\d{2}):(\d{2}):(\d{2})$/);
        if (tsMatch) {
            timestampLines++;
            currentTimestamp = line;
            
            if (dataBySecond.length > 0) {
                // Cerrar segundo anterior
                if (!currentSession.start) currentSession.start = currentTimestamp;
                currentSession.end = currentTimestamp;
                currentSession.dataCount += dataBySecond.length;
                dataBySecond = [];
            }
            continue;
        }

        // Detectar cambio de sesión
        if (line.match(/^Sesión:\d+$/)) {
            if (currentSession.dataCount > 0) {
                sessions.push({ ...currentSession });
            }
            const sessionNum = parseInt(line.match(/\d+/)[0]);
            currentSession = { number: sessionNum, start: null, end: null, dataCount: 0 };
            continue;
        }

        // Línea de datos
        const values = line.split(';').map(v => v.trim());
        if (values.length === columns.length) {
            dataLines++;
            dataBySecond.push(line);
        }
    }

    // Cerrar última sesión
    if (currentSession.dataCount > 0) {
        sessions.push(currentSession);
    }

    console.log(`   Líneas de datos: ${dataLines.toLocaleString()}`);
    console.log(`   Líneas de timestamp: ${timestampLines.toLocaleString()}`);
    console.log(`   Frecuencia muestreo: ${(dataLines / timestampLines).toFixed(1)} registros/segundo`);
    console.log(`   Sesiones detectadas: ${sessions.length}\n`);

    if (sessions.length > 0) {
        console.log('   SESIONES:');
        sessions.forEach(s => {
            const duration = s.start && s.end ? 
                `${s.start} → ${s.end}` : 
                'Sin timestamps';
            console.log(`     Sesión ${s.number}: ${s.dataCount.toLocaleString()} registros (${duration})`);
        });
    }

    // Muestrear valores
    console.log('\n📊 MUESTRA DE DATOS (primeros 3 registros):\n');
    let sampleCount = 0;
    for (let i = 2; i < lines.length && sampleCount < 3; i++) {
        const line = lines[i];
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        
        const values = line.split(';').map(v => v.trim());
        if (values.length === columns.length) {
            sampleCount++;
            console.log(`   Registro ${sampleCount}:`);
            columns.forEach((col, idx) => {
                if (idx < 10) { // Solo primeras 10 columnas para brevedad
                    console.log(`     ${col}: ${values[idx]}`);
                }
            });
            console.log('');
        }
    }
}

function analyzeGPS(filePath) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🛰️  ANÁLISIS COMPLETO: GPS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    console.log(`📁 Archivo: ${path.basename(filePath)}`);
    console.log(`📏 Total líneas: ${lines.length.toLocaleString()}\n`);

    // LÍNEA 1: Cabecera
    console.log('🔍 LÍNEA 1 - CABECERA:');
    console.log(`   "${lines[0]}"`);

    // LÍNEA 2: Columnas
    console.log('\n🔍 LÍNEA 2 - COLUMNAS:');
    console.log(`   "${lines[1]}"`);

    // Analizar datos
    console.log('\n🔍 ANÁLISIS DE DATOS:\n');

    let totalLines = 0;
    let sinDatos = 0;
    let conDatos = 0;
    let validCoords = 0;

    const firstValid = [];
    const lastValid = [];

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        totalLines++;

        if (line.includes('sin datos GPS')) {
            sinDatos++;
        } else {
            conDatos++;
            const parts = line.split(',');
            
            // Intentar extraer coordenadas
            if (parts.length >= 5) {
                const latStr = parts[3]?.trim();
                const lonStr = parts[4]?.trim();
                const lat = parseFloat(latStr);
                const lon = parseFloat(lonStr);

                if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                    validCoords++;
                    if (firstValid.length < 3) {
                        firstValid.push({ line: i + 1, lat, lon, raw: line });
                    }
                    lastValid.push({ line: i + 1, lat, lon, raw: line });
                }
            }
        }
    }

    console.log(`   Total líneas datos: ${totalLines.toLocaleString()}`);
    console.log(`   Sin señal GPS: ${sinDatos.toLocaleString()} (${((sinDatos/totalLines)*100).toFixed(1)}%)`);
    console.log(`   Con datos: ${conDatos.toLocaleString()} (${((conDatos/totalLines)*100).toFixed(1)}%)`);
    console.log(`   Coordenadas válidas: ${validCoords.toLocaleString()}\n`);

    if (firstValid.length > 0) {
        console.log('   PRIMEROS DATOS GPS VÁLIDOS:');
        firstValid.forEach(v => {
            console.log(`     Línea ${v.line}: [${v.lat}, ${v.lon}]`);
        });
    } else {
        console.log('   ❌ NO SE ENCONTRARON DATOS GPS VÁLIDOS');
    }

    if (validCoords > 0 && lastValid.length > 3) {
        console.log('\n   ÚLTIMOS DATOS GPS VÁLIDOS:');
        lastValid.slice(-3).forEach(v => {
            console.log(`     Línea ${v.line}: [${v.lat}, ${v.lon}]`);
        });
    }

    console.log('');
}

function analyzeRotativo(filePath) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🚨 ANÁLISIS COMPLETO: ROTATIVO');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    console.log(`📁 Archivo: ${path.basename(filePath)}`);
    console.log(`📏 Total líneas: ${lines.length.toLocaleString()}\n`);

    // LÍNEA 1: Cabecera
    console.log('🔍 LÍNEA 1 - CABECERA:');
    console.log(`   "${lines[0]}"`);

    // LÍNEA 2: Columnas
    console.log('\n🔍 LÍNEA 2 - COLUMNAS:');
    console.log(`   "${lines[1]}"`);

    // Analizar estado del rotativo
    console.log('\n🔍 ANÁLISIS DE ESTADO ROTATIVO:\n');

    let estadoON = 0;
    let estadoOFF = 0;
    let transitions = [];
    let lastState = null;

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(';');

        if (parts.length >= 2) {
            const state = parts[1]?.trim();

            if (state === '1' || state === 'ON') {
                estadoON++;
                if (lastState !== '1') {
                    transitions.push({ line: i + 1, from: lastState, to: '1' });
                }
                lastState = '1';
            } else if (state === '0' || state === 'OFF') {
                estadoOFF++;
                if (lastState !== '0') {
                    transitions.push({ line: i + 1, from: lastState, to: '0' });
                }
                lastState = '0';
            }
        }
    }

    const total = estadoON + estadoOFF;
    console.log(`   Total registros: ${total.toLocaleString()}`);
    console.log(`   Estado ON (emergencia): ${estadoON.toLocaleString()} (${((estadoON/total)*100).toFixed(1)}%)`);
    console.log(`   Estado OFF (normal): ${estadoOFF.toLocaleString()} (${((estadoOFF/total)*100).toFixed(1)}%)`);
    console.log(`   Transiciones: ${transitions.length}\n`);

    if (transitions.length > 0 && transitions.length <= 20) {
        console.log('   TRANSICIONES DETECTADAS:');
        transitions.forEach(t => {
            console.log(`     Línea ${t.line}: ${t.from || 'inicio'} → ${t.to}`);
        });
    } else if (transitions.length > 20) {
        console.log(`   Primeras 10 transiciones:`);
        transitions.slice(0, 10).forEach(t => {
            console.log(`     Línea ${t.line}: ${t.from || 'inicio'} → ${t.to}`);
        });
    }

    // Muestra de datos
    console.log('\n📊 MUESTRA DE DATOS (primeras 5 líneas):\n');
    for (let i = 2; i < Math.min(lines.length, 7); i++) {
        console.log(`   ${lines[i]}`);
    }

    console.log('');
}

function compareFiles() {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔀 COMPARACIÓN TEMPORAL ENTRE ARCHIVOS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const allExist = Object.values(FILES).every(f => fs.existsSync(f));
    
    if (!allExist) {
        console.log('⚠️  No todos los archivos existen\n');
        Object.entries(FILES).forEach(([tipo, path]) => {
            console.log(`   ${tipo}: ${fs.existsSync(path) ? '✅' : '❌'}`);
        });
        return;
    }

    // Extraer tiempos de inicio de cada archivo
    const startTimes = {};

    Object.entries(FILES).forEach(([tipo, filePath]) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const firstLine = content.split('\n')[0];

        const match = firstLine.match(/(\d{2}\/\d{2}\/\d{4})[^\d]*(\d{2}:\d{2}:\d{2})/);
        if (match) {
            startTimes[tipo] = `${match[1]} ${match[2]}`;
        } else {
            startTimes[tipo] = 'No detectado';
        }
    });

    console.log('⏱️  TIEMPOS DE INICIO:\n');
    Object.entries(startTimes).forEach(([tipo, time]) => {
        console.log(`   ${tipo.toUpperCase().padEnd(15)}: ${time}`);
    });

    console.log('\n');

    // Contar líneas efectivas
    console.log('📏 LÍNEAS EFECTIVAS:\n');
    Object.entries(FILES).forEach(([tipo, filePath]) => {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        const dataLines = lines.length - 2; // Sin cabecera ni columnas
        console.log(`   ${tipo.toUpperCase().padEnd(15)}: ${dataLines.toLocaleString()} líneas`);
    });

    console.log('');
}

// EJECUTAR ANÁLISIS
console.log('\n🔬 ANÁLISIS EXHAUSTIVO DE ARCHIVOS DOBACKSOFT');
console.log('   Vehículo: DOBACK024');
console.log('   Fecha: 01/10/2025\n');

analyzeEstabilidad(FILES.estabilidad);
analyzeGPS(FILES.gps);
analyzeRotativo(FILES.rotativo);
compareFiles();

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ANÁLISIS COMPLETO FINALIZADO');
console.log('═══════════════════════════════════════════════════════════════\n');

