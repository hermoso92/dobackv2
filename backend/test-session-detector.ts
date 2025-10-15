/**
 * TEST: SessionDetector
 * 
 * Prueba rápida para verificar que el detector funciona con archivos reales
 */

import fs from 'fs';
import path from 'path';
import { SessionDetector } from './src/services/upload/SessionDetector';

async function main() {
    console.log('🧪 TEST: SessionDetector con archivos reales\n');

    // Rutas a archivos reales
    const estabilidadPath = path.join(__dirname, 'data/datosDoback/CMadrid/doback024/estabilidad/ESTABILIDAD_DOBACK024_20250930.txt');
    const gpsPath = path.join(__dirname, 'data/datosDoback/CMadrid/doback024/GPS/GPS_DOBACK024_20250930.txt');
    const rotativoPath = path.join(__dirname, 'data/datosDoback/CMadrid/doback024/ROTATIVO/ROTATIVO_DOBACK024_20250930.txt');

    // Test ESTABILIDAD
    console.log('📊 Test ESTABILIDAD:');
    const estContent = fs.readFileSync(estabilidadPath, 'utf8');
    const estResult = SessionDetector.detectSessions(estContent, 'ESTABILIDAD', 'ESTABILIDAD_DOBACK024_20250930.txt');

    console.log(`   Total líneas: ${estResult.totalLines}`);
    console.log(`   Líneas válidas: ${estResult.validLines}`);
    console.log(`   Sesiones detectadas: ${estResult.sessions.length}`);

    if (estResult.sessions.length > 0) {
        estResult.sessions.forEach((s, i) => {
            console.log(`   Sesión ${i + 1}: ${s.startTime.toLocaleTimeString()} - ${s.endTime.toLocaleTimeString()} (${s.measurementCount} mediciones)`);
        });
    }

    if (estResult.errors.length > 0) {
        console.log(`   ❌ Errores: ${estResult.errors.join(', ')}`);
    }

    // Test GPS
    console.log('\n📍 Test GPS:');
    const gpsContent = fs.readFileSync(gpsPath, 'utf8');
    const gpsResult = SessionDetector.detectSessions(gpsContent, 'GPS', 'GPS_DOBACK024_20250930.txt');

    console.log(`   Total líneas: ${gpsResult.totalLines}`);
    console.log(`   Líneas válidas: ${gpsResult.validLines}`);
    console.log(`   Sesiones detectadas: ${gpsResult.sessions.length}`);

    if (gpsResult.sessions.length > 0) {
        gpsResult.sessions.forEach((s, i) => {
            console.log(`   Sesión ${i + 1}: ${s.startTime.toLocaleTimeString()} - ${s.endTime.toLocaleTimeString()} (${s.measurementCount} mediciones)`);
        });
    }

    // Test ROTATIVO
    console.log('\n🔄 Test ROTATIVO:');
    const rotContent = fs.readFileSync(rotativoPath, 'utf8');
    const rotResult = SessionDetector.detectSessions(rotContent, 'ROTATIVO', 'ROTATIVO_DOBACK024_20250930.txt');

    console.log(`   Total líneas: ${rotResult.totalLines}`);
    console.log(`   Líneas válidas: ${rotResult.validLines}`);
    console.log(`   Sesiones detectadas: ${rotResult.sessions.length}`);

    if (rotResult.sessions.length > 0) {
        rotResult.sessions.forEach((s, i) => {
            console.log(`   Sesión ${i + 1}: ${s.startTime.toLocaleTimeString()} - ${s.endTime.toLocaleTimeString()} (${s.measurementCount} mediciones)`);
        });
    }

    // Resultado esperado según análisis real
    console.log('\n📋 RESULTADO ESPERADO (según Analisis_Sesiones_CMadrid_real.md):');
    console.log('   ESTABILIDAD: 2 sesiones');
    console.log('   - Sesión 1: 09:33:44 - 10:38:20');
    console.log('   - Sesión 2: 12:41:48 - 14:05:45');
    console.log('   GPS: 1 sesión');
    console.log('   - Sesión 1: 09:33:37 - 09:57:27');
    console.log('   ROTATIVO: 2 sesiones');
    console.log('   - Sesión 1: 09:33:37 - 10:38:25');
    console.log('   - Sesión 2: 12:41:43 - 14:05:48');
}

main().catch(console.error);

