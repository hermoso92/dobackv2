/**
 * TEST: SessionDetectorV2
 * 
 * Prueba con archivos reales
 */

import fs from 'fs';
import path from 'path';
import { SessionDetectorV2 } from './src/services/upload/SessionDetectorV2';

async function main() {
    console.log('🧪 TEST: SessionDetectorV2 con archivos reales\n');

    // Rutas a archivos reales
    const estabilidadPath = path.join(__dirname, 'data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20250930.txt');
    const gpsPath = path.join(__dirname, 'data/datosDoback/CMadrid/doback024/GPS/GPS_DOBACK024_20250930.txt');
    const rotativoPath = path.join(__dirname, 'data/datosDoback/CMadrid/doback024/ROTATIVO/ROTATIVO_DOBACK024_20250930.txt');

    const baseDate = new Date(2025, 8, 30); // 30/09/2025

    // Test ESTABILIDAD
    console.log('📊 Test ESTABILIDAD:');
    const estBuffer = fs.readFileSync(estabilidadPath);
    const estSessions = SessionDetectorV2.detectEstabilidadSessions(estBuffer, baseDate, 'ESTABILIDAD_DOBACK024_20250930.txt');

    console.log(`   Sesiones detectadas: ${estSessions.length}`);
    estSessions.forEach((s, i) => {
        const duration = Math.floor(s.durationSeconds / 60);
        console.log(`   Sesión ${s.sessionNumber}: ${s.startTime.toLocaleTimeString()} - ${s.endTime.toLocaleTimeString()} (${duration}min, ${s.measurementCount} med)`);
    });

    // Test GPS
    console.log('\n📍 Test GPS:');
    const gpsBuffer = fs.readFileSync(gpsPath);
    const gpsSessions = SessionDetectorV2.detectGPSSessions(gpsBuffer, baseDate, 'GPS_DOBACK024_20250930.txt');

    console.log(`   Sesiones detectadas: ${gpsSessions.length}`);
    gpsSessions.forEach((s, i) => {
        const duration = Math.floor(s.durationSeconds / 60);
        console.log(`   Sesión ${s.sessionNumber}: ${s.startTime.toLocaleTimeString()} - ${s.endTime.toLocaleTimeString()} (${duration}min, ${s.measurementCount} med)`);
    });

    // Test ROTATIVO
    console.log('\n🔄 Test ROTATIVO:');
    const rotBuffer = fs.readFileSync(rotativoPath);
    const rotSessions = SessionDetectorV2.detectRotativoSessions(rotBuffer, baseDate, 'ROTATIVO_DOBACK024_20250930.txt');

    console.log(`   Sesiones detectadas: ${rotSessions.length}`);
    rotSessions.forEach((s, i) => {
        const duration = Math.floor(s.durationSeconds / 60);
        console.log(`   Sesión ${s.sessionNumber}: ${s.startTime.toLocaleTimeString()} - ${s.endTime.toLocaleTimeString()} (${duration}min, ${s.measurementCount} med)`);
    });

    // Resultado esperado
    console.log('\n📋 RESULTADO ESPERADO:');
    console.log('   ESTABILIDAD: 2 sesiones (09:33-10:38, 12:41-14:05)');
    console.log('   GPS: 1 sesión (09:33-09:57)');
    console.log('   ROTATIVO: 2 sesiones (09:33-10:38, 12:41-14:05)');
}

main().catch(console.error);

