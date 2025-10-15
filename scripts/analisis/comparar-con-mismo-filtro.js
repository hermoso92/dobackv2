/**
 * 📊 COMPARAR CON MISMO FILTRO
 * 
 * Filtrar análisis real con las MISMAS condiciones:
 * - GPS obligatorio (3 tipos)
 * - Duración >= 300 segundos (5 minutos)
 * 
 * Y comparar si coinciden con las detectadas por el sistema
 */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Convertir "1 h 4 m 48 s" a segundos
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

async function compararConMismoFiltro() {
    console.log('📊 COMPARACIÓN CON MISMO FILTRO (GPS + >= 5 MIN)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Leer análisis real
        const analisisReal = fs.readFileSync('resumendoback/Analisis_Sesiones_CMadrid_real.md', 'utf8');

        // Extraer SOLO sesiones ✅ con >= 5 minutos
        const sesionesValidasReal = [];
        const lineas = analisisReal.split('\n');
        
        let vehiculoActual = null;
        let fechaActual = null;
        let sesionActual = null;
        let tieneEstabilidad = false;
        let tieneGPS = false;
        let tieneRotativo = false;

        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];

            // Detectar vehículo
            if (linea.includes('## 🚒 DOBACK024')) vehiculoActual = 'doback024';
            else if (linea.includes('## 🚒 DOBACK027')) vehiculoActual = 'doback027';
            else if (linea.includes('## 🚒 DOBACK028')) vehiculoActual = 'doback028';

            // Detectar fecha
            const matchFecha = linea.match(/### 📅 (\d{2})\/(\d{2})\/(\d{4})/);
            if (matchFecha && vehiculoActual) {
                fechaActual = `${matchFecha[3]}-${matchFecha[2]}-${matchFecha[1]}`;
            }

            // Detectar inicio de sesión
            const matchSesion = linea.match(/#### Sesión (\d+)/);
            if (matchSesion && vehiculoActual && fechaActual) {
                sesionActual = parseInt(matchSesion[1]);
                tieneEstabilidad = false;
                tieneGPS = false;
                tieneRotativo = false;
            }

            // Detectar tipo de archivo
            if (linea.includes('**ESTABILIDAD:**') && linea.includes('✅')) tieneEstabilidad = true;
            if (linea.includes('**GPS:**') && linea.includes('✅')) tieneGPS = true;
            if (linea.includes('**ROTATIVO:**') && linea.includes('✅')) tieneRotativo = true;

            // Detectar resumen de sesión
            if (linea.includes('**Resumen sesión:**') && sesionActual) {
                const esValida = linea.includes('✅');
                
                if (esValida && tieneEstabilidad && tieneGPS && tieneRotativo) {
                    const matchInicio = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                    const matchFin = linea.match(/fin (\d{2}):(\d{2}):(\d{2})/);
                    const matchDuracion = linea.match(/duración ([\d\s\w]+)/);
                    
                    if (matchInicio && matchFin && matchDuracion) {
                        const duracionSegundos = parseDuration(matchDuracion[1]);
                        
                        // FILTRO: Solo >= 5 minutos (300 segundos)
                        if (duracionSegundos >= 300) {
                            sesionesValidasReal.push({
                                vehiculo: vehiculoActual,
                                fecha: fechaActual,
                                sesion: sesionActual,
                                inicio: `${matchInicio[1]}:${matchInicio[2]}:${matchInicio[3]}`,
                                fin: `${matchFin[1]}:${matchFin[2]}:${matchFin[3]}`,
                                duracion: matchDuracion[1].trim(),
                                duracionSegundos
                            });
                        }
                    }
                }
            }
        }

        console.log(`✅ Sesiones del análisis real (GPS + >= 5 min): ${sesionesValidasReal.length}\n`);

        // Obtener sesiones del sistema
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        console.log(`💾 Sesiones detectadas por el sistema: ${sessions.length}\n`);
        console.log(`📉 Diferencia: ${sesionesValidasReal.length - sessions.length} sesiones\n`);

        // Agrupar por vehículo
        const porVehiculo = {
            doback024: { real: [], sistema: [] },
            doback027: { real: [], sistema: [] },
            doback028: { real: [], sistema: [] }
        };

        sesionesValidasReal.forEach(s => {
            if (porVehiculo[s.vehiculo]) {
                porVehiculo[s.vehiculo].real.push(s);
            }
        });

        sessions.forEach(s => {
            const vehiculo = s.Vehicle.identifier.toLowerCase(); // ✅ Comparar en minúsculas
            if (porVehiculo[vehiculo]) {
                const fecha = s.startTime.toISOString().split('T')[0];
                const hora = s.startTime.toTimeString().split(' ')[0];
                const fin = s.endTime ? s.endTime.toTimeString().split(' ')[0] : 'N/A';
                const durMin = s.endTime ? Math.round((s.endTime - s.startTime) / 1000 / 60) : 0;
                porVehiculo[vehiculo].sistema.push({
                    fecha,
                    inicio: hora,
                    fin,
                    duracionMin: durMin,
                    sessionNumber: s.sessionNumber
                });
            }
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 COMPARACIÓN POR VEHÍCULO (GPS + >= 5 MIN)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const [vehiculo, datos] of Object.entries(porVehiculo)) {
            console.log(`🚗 ${vehiculo.toUpperCase()}:\n`);
            console.log(`   Análisis Real (✅ >= 5min):  ${datos.real.length} sesiones`);
            console.log(`   Sistema detectó:             ${datos.sistema.length} sesiones`);
            
            const diff = datos.real.length - datos.sistema.length;
            if (diff === 0) {
                console.log(`   ✅ COINCIDEN PERFECTAMENTE\n`);
            } else {
                console.log(`   ❌ Diferencia: ${diff} sesiones\n`);
            }
        }

        // Comparación detallada de las primeras 10 sesiones de cada vehículo
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 DETALLE: PRIMERAS SESIONES DE CADA VEHÍCULO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const [vehiculo, datos] of Object.entries(porVehiculo)) {
            if (datos.real.length === 0) continue;

            console.log(`🚗 ${vehiculo.toUpperCase()}\n`);
            console.log(`   📋 ANÁLISIS REAL (primeras 5):\n`);
            
            datos.real.slice(0, 5).forEach((s, i) => {
                const [y, m, d] = s.fecha.split('-');
                console.log(`      ${i + 1}. ${d}/${m}/${y} - Sesión ${s.sesion}: ${s.inicio} → ${s.fin} (${s.duracion})`);
            });
            
            console.log(`\n   💾 SISTEMA DETECTÓ (primeras 5):\n`);
            
            if (datos.sistema.length === 0) {
                console.log(`      ⚠️  Ninguna sesión detectada\n`);
            } else {
                datos.sistema.slice(0, 5).forEach((s, i) => {
                    const fecha = s.startTime.toISOString().split('T')[0];
                    const [y, m, d] = fecha.split('-');
                    const inicio = s.startTime.toTimeString().split(' ')[0];
                    const fin = s.endTime ? s.endTime.toTimeString().split(' ')[0] : 'N/A';
                    const durMin = s.endTime ? Math.round((s.endTime - s.startTime) / 1000 / 60) : 0;
                    console.log(`      ${i + 1}. ${d}/${m}/${y}: ${inicio} → ${fin} (${durMin} min)`);
                });
                console.log();
            }
        }

        // Resumen final
        const totalReal = sesionesValidasReal.length;
        const totalSistema = sessions.length;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN FINAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`   Análisis Real (GPS + >= 5min):  ${totalReal} sesiones`);
        console.log(`   Sistema actual:                  ${totalSistema} sesiones`);
        console.log(`   Diferencia:                      ${totalReal - totalSistema} sesiones\n`);

        if (totalReal === totalSistema) {
            console.log('   ✅ ¡COINCIDENCIA PERFECTA!\n');
            console.log('   El sistema detecta exactamente las mismas sesiones\n');
            console.log('   que el análisis real con los mismos filtros.\n');
        } else {
            const porcentaje = ((totalSistema / totalReal) * 100).toFixed(1);
            console.log(`   📉 Cobertura: ${porcentaje}%\n`);
            
            if (totalSistema < totalReal) {
                console.log('   ❌ El sistema detecta MENOS sesiones\n');
                console.log('   Posibles causas:\n');
                console.log('   • Umbral de correlación muy estricto (120s vs 300s necesario)');
                console.log('   • Sesiones muy cortas cerca de 5 min rechazadas por redondeo');
                console.log('   • Problemas de parsing en fechas/timestamps\n');
            } else {
                console.log('   ⚠️  El sistema detecta MÁS sesiones (posible sobre-detección)\n');
            }
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

compararConMismoFiltro();

