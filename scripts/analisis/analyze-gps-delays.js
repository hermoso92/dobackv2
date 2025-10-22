/**
 * Análisis de delays y gaps en archivos GPS
 * Verifica si GPS tarda en recibir señal y gaps temporales
 */

const fs = require('fs');

// Par de archivos GPS + ESTABILIDAD del mismo día
const GPS_FILE = 'backend/data/datosDoback/CMadrid/doback024/GPS/GPS_DOBACK024_20251001.txt';
const EST_FILE = 'backend/data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20251001.txt';

function parseTime(timeStr) {
    // Formato: "01/10/2025 09:36:54" o "09:36:54"
    const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return null;
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]), seconds: parseInt(match[3]) };
}

function timeToSeconds(time) {
    return time.hours * 3600 + time.minutes * 60 + time.seconds;
}

function analyzeGPSDelays() {
    console.log('🔬 ANÁLISIS DE DELAYS Y GAPS EN GPS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!fs.existsSync(GPS_FILE)) {
        console.error(`❌ Archivo GPS no encontrado: ${GPS_FILE}`);
        return;
    }

    if (!fs.existsSync(EST_FILE)) {
        console.error(`❌ Archivo ESTABILIDAD no encontrado: ${EST_FILE}`);
        return;
    }

    // Leer archivos
    const gpsContent = fs.readFileSync(GPS_FILE, 'utf8');
    const estContent = fs.readFileSync(EST_FILE, 'utf8');

    const gpsLines = gpsContent.split('\n').filter(l => l.trim());
    const estLines = estContent.split('\n').filter(l => l.trim());

    console.log(`📁 Archivo GPS: ${gpsLines.length} líneas`);
    console.log(`📁 Archivo ESTABILIDAD: ${estLines.length} líneas\n`);

    // Obtener tiempo de inicio de ESTABILIDAD
    const estHeader = estLines[0];
    const estTimeMatch = estHeader.match(/;(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2});/);
    const estStartTime = estTimeMatch ? estTimeMatch[1] : null;

    console.log(`⏱️  ESTABILIDAD inicia: ${estStartTime}`);

    // Obtener tiempo de inicio de GPS
    const gpsHeader = gpsLines[0];
    const gpsTimeMatch = gpsHeader.match(/;(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2});/);
    const gpsStartTime = gpsTimeMatch ? gpsTimeMatch[1] : null;

    console.log(`⏱️  GPS inicia: ${gpsStartTime}\n`);

    // Buscar primer dato GPS válido (con fix 3D y satélites > 4)
    let firstValidGPS = null;
    let lineNum = 2;

    for (let i = 2; i < gpsLines.length; i++) {
        const line = gpsLines[i].trim();
        if (line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        if (!line || line.length < 10) continue;

        const parts = line.split(';');
        if (parts.length < 8) continue;

        const fix = parts[5]?.trim();
        const satellites = parseInt(parts[6]?.trim());

        if ((fix === '3D' || fix === '3') && satellites >= 4) {
            firstValidGPS = {
                lineNum: i + 1,
                timestamp: parts[0]?.trim(),
                lat: parseFloat(parts[1]),
                lon: parseFloat(parts[2]),
                satellites
            };
            break;
        }

        lineNum++;
    }

    if (firstValidGPS) {
        console.log(`🛰️  PRIMER GPS VÁLIDO:`);
        console.log(`   Línea: ${firstValidGPS.lineNum}`);
        console.log(`   Timestamp: ${firstValidGPS.timestamp}`);
        console.log(`   Coordenadas: [${firstValidGPS.lat}, ${firstValidGPS.lon}]`);
        console.log(`   Satélites: ${firstValidGPS.satellites}\n`);

        // Calcular delay desde inicio
        const delayLines = firstValidGPS.lineNum - 2; // Restar cabecera y columnas
        console.log(`⏳ DELAY DESDE INICIO:`);
        console.log(`   ${delayLines} líneas (~${(delayLines / 10).toFixed(1)} segundos)\n`);
    } else {
        console.log(`❌ No se encontró GPS válido (fix 3D + satélites >= 4)\n`);
    }

    // Analizar gaps en GPS
    console.log(`📊 ANÁLISIS DE GAPS TEMPORALES:\n`);

    const timestamps = [];
    for (let i = 2; i < gpsLines.length; i++) {
        const line = gpsLines[i].trim();
        if (!line.match(/^\d{2}:\d{2}:\d{2}$/)) continue;
        
        const time = parseTime(line);
        if (time) {
            timestamps.push(timeToSeconds(time));
        }
    }

    if (timestamps.length > 1) {
        const gaps = [];
        for (let i = 1; i < timestamps.length; i++) {
            const gap = timestamps[i] - timestamps[i - 1];
            if (gap > 5) { // Gap > 5 segundos
                gaps.push(gap);
            }
        }

        console.log(`   Total timestamps: ${timestamps.length}`);
        console.log(`   Gaps > 5s detectados: ${gaps.length}`);
        
        if (gaps.length > 0) {
            const maxGap = Math.max(...gaps);
            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
            console.log(`   Gap máximo: ${maxGap}s`);
            console.log(`   Gap promedio: ${avgGap.toFixed(1)}s`);
        } else {
            console.log(`   ✅ Sin gaps significativos (señal GPS estable)`);
        }
    }

    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log('✅ Análisis de GPS completado\n');
}

analyzeGPSDelays();

