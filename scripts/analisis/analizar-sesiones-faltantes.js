/**
 * 📊 ANÁLISIS DETALLADO DE SESIONES FALTANTES
 * 
 * Compara sesión por sesión para identificar exactamente cuáles faltan
 */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

function timeToMinutes(timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

async function analizarFaltantes() {
    console.log('📊 ANÁLISIS DETALLADO DE SESIONES FALTANTES\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Leer análisis real
        const analisisReal = fs.readFileSync('resumendoback/Analisis_Sesiones_CMadrid_real.md', 'utf8');
        
        const sesionesEsperadas = [];
        const lineas = analisisReal.split('\n');
        
        let vehiculoActual = null;
        let fechaActual = null;
        let sesionActual = null;
        let tieneEst = false, tieneGPS = false, tieneRot = false;

        for (const linea of lineas) {
            if (linea.includes('## 🚒 DOBACK024')) vehiculoActual = 'doback024';
            else if (linea.includes('## 🚒 DOBACK027')) vehiculoActual = 'doback027';
            else if (linea.includes('## 🚒 DOBACK028')) vehiculoActual = 'doback028';

            const matchFecha = linea.match(/### 📅 (\d{2})\/(\d{2})\/(\d{4})/);
            if (matchFecha) {
                fechaActual = `${matchFecha[3]}-${matchFecha[2]}-${matchFecha[1]}`;
            }

            const matchSesion = linea.match(/#### Sesión (\d+)/);
            if (matchSesion) {
                sesionActual = parseInt(matchSesion[1]);
                tieneEst = false;
                tieneGPS = false;
                tieneRot = false;
            }

            if (linea.includes('**ESTABILIDAD:**') && linea.includes('✅')) tieneEst = true;
            if (linea.includes('**GPS:**') && linea.includes('✅')) tieneGPS = true;
            if (linea.includes('**ROTATIVO:**') && linea.includes('✅')) tieneRot = true;

            if (linea.includes('**Resumen sesión:**')) {
                const esValida = linea.includes('✅');
                
                if (esValida && tieneEst && tieneGPS && tieneRot) {
                    const matchInicio = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                    const matchFin = linea.match(/fin (\d{2}):(\d{2}):(\d{2})/);
                    const matchDuracion = linea.match(/duración ([\d\s\w]+)/);
                    
                    if (matchInicio && matchFin && matchDuracion) {
                        const duracionSegundos = parseDuration(matchDuracion[1]);
                        
                        if (duracionSegundos >= 280) { // Usar 280s según ajuste
                            sesionesEsperadas.push({
                                vehiculo: vehiculoActual,
                                fecha: fechaActual,
                                sesion: sesionActual,
                                inicio: `${matchInicio[1]}:${matchInicio[2]}:${matchInicio[3]}`,
                                fin: `${matchFin[1]}:${matchFin[2]}:${matchFin[3]}`,
                                duracionSegundos,
                                duracionMin: Math.round(duracionSegundos / 60)
                            });
                        }
                    }
                }
            }
        }

        // Obtener sesiones del sistema
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        console.log(`✅ Esperadas (GPS + >= 280s): ${sesionesEsperadas.length}`);
        console.log(`💾 Detectadas por el sistema: ${sessions.length}`);
        console.log(`📉 Faltan: ${sesionesEsperadas.length - sessions.length}\n`);

        // Comparar una por una
        const faltantes = [];
        const detectadas = [];

        for (const esperada of sesionesEsperadas) {
            // Buscar sesión correspondiente
            const encontrada = sessions.find(s => {
                const vehiculo = s.Vehicle.identifier.toLowerCase();
                const fecha = s.startTime.toISOString().split('T')[0];
                const inicio = s.startTime.toTimeString().split(' ')[0];
                
                // Tolerancia de 2 minutos en inicio
                const esperadaMin = timeToMinutes(esperada.inicio);
                const sistemaMin = timeToMinutes(inicio);
                const difMin = Math.abs(esperadaMin - sistemaMin);
                
                return vehiculo === esperada.vehiculo &&
                       fecha === esperada.fecha &&
                       difMin <= 2;
            });

            if (encontrada) {
                detectadas.push({ esperada, encontrada });
            } else {
                faltantes.push(esperada);
            }
        }

        console.log(`✅ Sesiones detectadas correctamente: ${detectadas.length}`);
        console.log(`❌ Sesiones faltantes: ${faltantes.length}\n`);

        if (faltantes.length > 0) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('❌ SESIONES FALTANTES (primeras 20)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            faltantes.slice(0, 20).forEach((s, i) => {
                const [y, m, d] = s.fecha.split('-');
                console.log(`${i + 1}. ${s.vehiculo.toUpperCase()} - ${d}/${m}/${y} - Sesión ${s.sesion}`);
                console.log(`   ${s.inicio} → ${s.fin} (${s.duracionMin} min, ${s.duracionSegundos}s)\n`);
            });
        }

        // Análisis por vehículo
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 ANÁLISIS POR VEHÍCULO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const vehiculo of ['doback024', 'doback027', 'doback028']) {
            const esperadasVeh = sesionesEsperadas.filter(s => s.vehiculo === vehiculo);
            const detectadasVeh = detectadas.filter(d => d.esperada.vehiculo === vehiculo);
            const faltantesVeh = faltantes.filter(s => s.vehiculo === vehiculo);

            console.log(`🚗 ${vehiculo.toUpperCase()}:`);
            console.log(`   Esperadas:  ${esperadasVeh.length}`);
            console.log(`   Detectadas: ${detectadasVeh.length}`);
            console.log(`   Faltantes:  ${faltantesVeh.length}`);
            console.log(`   Cobertura:  ${((detectadasVeh.length / esperadasVeh.length) * 100).toFixed(1)}%\n`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 CONCLUSIÓN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const cobertura = (detectadas.length / sesionesEsperadas.length) * 100;

        if (cobertura >= 95) {
            console.log(`✅ Excelente cobertura (${cobertura.toFixed(1)}%)`);
            console.log(`   El sistema detecta casi todas las sesiones del análisis real.\n`);
        } else if (cobertura >= 80) {
            console.log(`⚠️  Buena cobertura pero mejorable (${cobertura.toFixed(1)}%)`);
            console.log(`   ${faltantes.length} sesiones no se detectan.\n`);
        } else {
            console.log(`❌ Cobertura insuficiente (${cobertura.toFixed(1)}%)`);
            console.log(`   ${faltantes.length} sesiones no se detectan.\n`);
            console.log(`   Causa principal: GPS fragmentado que no se correlaciona correctamente.\n`);
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

analizarFaltantes();

