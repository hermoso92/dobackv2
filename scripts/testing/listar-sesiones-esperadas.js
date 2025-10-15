/**
 * 📋 LISTAR SESIONES ESPERADAS
 * 
 * Extrae del análisis real SOLO las sesiones con:
 * - GPS obligatorio (3 tipos)
 * - Duración >= 5 minutos (300s)
 */

const fs = require('fs');

function parseDuration(duracionStr) {
    let totalSeconds = 0;
    
    const hMatch = duracionStr.match(/(\d+)\s*h/);
    const mMatch = duracionStr.match(/(\d+)\s*m/);
    const sMatch = duracionStr.match(/(\d+)\s*s/);
    
    if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
    if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
    if (sMatch) totalSeconds += parseInt(sMatch[1]);
    
    return totalSeconds;
}

function listarSesionesEsperadas() {
    console.log('📋 SESIONES ESPERADAS (GPS + >= 5 MIN)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const analisisReal = fs.readFileSync('resumendoback/Analisis_Sesiones_CMadrid_real.md', 'utf8');
    
    const sesionesEsperadas = [];
    const lineas = analisisReal.split('\n');
    
    let vehiculoActual = null;
    let fechaActual = null;
    let sesionActual = null;
    let tieneEstabilidad = false;
    let tieneGPS = false;
    let tieneRotativo = false;

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        if (linea.includes('## 🚒 DOBACK024')) vehiculoActual = 'DOBACK024';
        else if (linea.includes('## 🚒 DOBACK027')) vehiculoActual = 'DOBACK027';
        else if (linea.includes('## 🚒 DOBACK028')) vehiculoActual = 'DOBACK028';

        const matchFecha = linea.match(/### 📅 (\d{2})\/(\d{2})\/(\d{4})/);
        if (matchFecha && vehiculoActual) {
            fechaActual = `${matchFecha[1]}/${matchFecha[2]}/${matchFecha[3]}`;
        }

        const matchSesion = linea.match(/#### Sesión (\d+)/);
        if (matchSesion && vehiculoActual && fechaActual) {
            sesionActual = parseInt(matchSesion[1]);
            tieneEstabilidad = false;
            tieneGPS = false;
            tieneRotativo = false;
        }

        if (linea.includes('**ESTABILIDAD:**') && linea.includes('✅')) tieneEstabilidad = true;
        if (linea.includes('**GPS:**') && linea.includes('✅')) tieneGPS = true;
        if (linea.includes('**ROTATIVO:**') && linea.includes('✅')) tieneRotativo = true;

        if (linea.includes('**Resumen sesión:**') && sesionActual) {
            const esValida = linea.includes('✅');
            
            if (esValida && tieneEstabilidad && tieneGPS && tieneRotativo) {
                const matchInicio = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                const matchFin = linea.match(/fin (\d{2}):(\d{2}):(\d{2})/);
                const matchDuracion = linea.match(/duración ([\d\s\w]+)/);
                
                if (matchInicio && matchFin && matchDuracion) {
                    const duracionSegundos = parseDuration(matchDuracion[1]);
                    const duracionMinutos = Math.round(duracionSegundos / 60);
                    
                    // FILTRO: >= 5 minutos
                    if (duracionSegundos >= 300) {
                        sesionesEsperadas.push({
                            vehiculo: vehiculoActual,
                            fecha: fechaActual,
                            sesion: sesionActual,
                            inicio: `${matchInicio[1]}:${matchInicio[2]}:${matchInicio[3]}`,
                            fin: `${matchFin[1]}:${matchFin[2]}:${matchFin[3]}`,
                            duracion: matchDuracion[1].trim(),
                            duracionSegundos,
                            duracionMinutos
                        });
                    }
                }
            }
        }
    }

    // Agrupar por vehículo
    const porVehiculo = {
        DOBACK024: [],
        DOBACK027: [],
        DOBACK028: []
    };

    sesionesEsperadas.forEach(s => {
        porVehiculo[s.vehiculo].push(s);
    });

    // Mostrar todas las sesiones esperadas
    for (const [vehiculo, sesiones] of Object.entries(porVehiculo)) {
        if (sesiones.length === 0) continue;

        console.log(`🚗 ${vehiculo} (${sesiones.length} sesiones esperadas)\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Agrupar por fecha
        const porFecha = {};
        sesiones.forEach(s => {
            if (!porFecha[s.fecha]) {
                porFecha[s.fecha] = [];
            }
            porFecha[s.fecha].push(s);
        });

        for (const [fecha, sesionesFecha] of Object.entries(porFecha).sort()) {
            console.log(`   📅 ${fecha} (${sesionesFecha.length} sesiones):\n`);
            
            sesionesFecha.forEach(s => {
                console.log(`      • Sesión ${s.sesion}: ${s.inicio} → ${s.fin}`);
                console.log(`        Duración: ${s.duracion} (${s.duracionMinutos} min)\n`);
            });
        }
        console.log();
    }

    // Resumen total
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN TOTAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`   Total sesiones esperadas: ${sesionesEsperadas.length}\n`);
    console.log(`   Por vehículo:`);
    console.log(`   • DOBACK024: ${porVehiculo.DOBACK024.length}`);
    console.log(`   • DOBACK027: ${porVehiculo.DOBACK027.length}`);
    console.log(`   • DOBACK028: ${porVehiculo.DOBACK028.length}\n`);

    // Guardar en archivo JSON para fácil comparación
    fs.writeFileSync(
        'sesiones-esperadas-gps-5min.json',
        JSON.stringify(sesionesEsperadas, null, 2)
    );

    console.log('💾 Lista guardada en: sesiones-esperadas-gps-5min.json\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 PRÓXIMO PASO:\n');
    console.log('   1. Ve al frontend: http://localhost:5174/upload');
    console.log('   2. Configura: GPS obligatorio + Duración >= 300s');
    console.log('   3. Procesa archivos');
    console.log('   4. Ejecuta: node comparar-con-mismo-filtro.js');
    console.log('   5. Verifica si coinciden con esta lista\n');
}

listarSesionesEsperadas();

