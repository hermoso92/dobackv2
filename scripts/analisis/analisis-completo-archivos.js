/**
 * Análisis completo de archivos DOBACK para entender la estructura
 */
const fs = require('fs');
const path = require('path');

const vehiculos = ['doback024', 'doback027', 'doback028'];
const fecha = '20251006';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ANÁLISIS COMPLETO DE ARCHIVOS DOBACK - ' + fecha);
console.log('═══════════════════════════════════════════════════════════\n');

vehiculos.forEach(vehiculo => {
    console.log(`\n🚒 ${vehiculo.toUpperCase()}`);
    console.log('─'.repeat(60));
    
    const basePath = `backend/data/CMadrid/${vehiculo}`;
    
    // Analizar GPS
    const gpsFile = `${basePath}/GPS/GPS_${vehiculo.toUpperCase()}_${fecha}.txt`;
    if (fs.existsSync(gpsFile)) {
        const content = fs.readFileSync(gpsFile, 'utf8');
        const lines = content.split('\n');
        
        let sesiones = 0;
        let puntosConGPS = 0;
        let puntosSinGPS = 0;
        let coordenadas = [];
        
        lines.forEach(line => {
            if (line.startsWith('GPS;')) sesiones++;
            if (line.includes('sin datos GPS')) puntosSinGPS++;
            
            // Detectar líneas con coordenadas reales
            const match = line.match(/(\d{2}:\d{2}:\d{2}),(\d{2}\/\d{2}\/\d{4}),(\d{2}:\d{2}:\d{2}),([-\d.]+),([-\d.]+),/);
            if (match) {
                const lat = parseFloat(match[4]);
                const lon = parseFloat(match[5]);
                if (lat !== 0 && lon !== 0 && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
                    puntosConGPS++;
                    coordenadas.push({ lat, lon, time: match[1] });
                }
            }
        });
        
        console.log(`   📍 GPS:`);
        console.log(`      Sesiones: ${sesiones}`);
        console.log(`      Puntos con GPS: ${puntosConGPS}`);
        console.log(`      Puntos sin GPS: ${puntosSinGPS}`);
        
        if (coordenadas.length > 0) {
            console.log(`      Primera coord: ${coordenadas[0].lat.toFixed(6)}, ${coordenadas[0].lon.toFixed(6)} (${coordenadas[0].time})`);
            console.log(`      Última coord: ${coordenadas[coordenadas.length-1].lat.toFixed(6)}, ${coordenadas[coordenadas.length-1].lon.toFixed(6)} (${coordenadas[coordenadas.length-1].time})`);
        }
    }
    
    // Analizar ROTATIVO
    const rotativoFile = `${basePath}/ROTATIVO/ROTATIVO_${vehiculo.toUpperCase()}_${fecha}.txt`;
    if (fs.existsSync(rotativoFile)) {
        const content = fs.readFileSync(rotativoFile, 'utf8');
        const lines = content.split('\n');
        
        let sesiones = 0;
        const estados = new Set();
        let mediciones = 0;
        
        lines.forEach(line => {
            if (line.startsWith('ROTATIVO;')) sesiones++;
            
            const match = line.match(/^\d{2}\/\d{2}\/\d{4}-\d{2}:\d{2}:\d{2};(\d)$/);
            if (match) {
                estados.add(match[1]);
                mediciones++;
            }
        });
        
        console.log(`   🔑 ROTATIVO:`);
        console.log(`      Sesiones: ${sesiones}`);
        console.log(`      Mediciones: ${mediciones}`);
        console.log(`      Estados presentes: ${Array.from(estados).sort().join(', ')}`);
    }
    
    // Analizar ESTABILIDAD
    const estabilidadFile = `${basePath}/ESTABILIDAD/ESTABILIDAD_${vehiculo.toUpperCase()}_${fecha}.txt`;
    if (fs.existsSync(estabilidadFile)) {
        const content = fs.readFileSync(estabilidadFile, 'utf8');
        const lines = content.split('\n');
        
        let sesiones = 0;
        let mediciones = lines.filter(l => l.trim() && !l.startsWith('ESTABILIDAD;') && !l.includes('ax; ay; az')).length;
        
        lines.forEach(line => {
            if (line.startsWith('ESTABILIDAD;')) sesiones++;
        });
        
        console.log(`   📊 ESTABILIDAD:`);
        console.log(`      Sesiones: ${sesiones}`);
        console.log(`      Mediciones: ${mediciones}`);
    }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ANÁLISIS COMPLETADO');
console.log('═══════════════════════════════════════════════════════════\n');

