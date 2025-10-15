/**
 * 📊 COMPARAR SESIONES VÁLIDAS (CON 3 TIPOS)
 * 
 * Compara las sesiones ✅ del análisis real (con GPS)
 * con las detectadas por el sistema
 */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compararSesionesValidas() {
    console.log('📊 COMPARACIÓN: SESIONES VÁLIDAS (CON 3 TIPOS DE ARCHIVOS)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Leer análisis real
        const analisisReal = fs.readFileSync('resumendoback/Analisis_Sesiones_CMadrid_real.md', 'utf8');

        // Extraer SOLO sesiones ✅ (con los 3 tipos)
        const sesionesValidasReal = [];
        const lineas = analisisReal.split('\n');
        
        let vehiculoActual = null;
        let fechaActual = null;
        let sesionActual = null;
        let tieneEstabilidad = false;
        let tieneGPS = false;
        let tieneRotativo = false;
        let inicioSesion = null;
        let finSesion = null;

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
                // Resetear datos de sesión anterior
                sesionActual = parseInt(matchSesion[1]);
                tieneEstabilidad = false;
                tieneGPS = false;
                tieneRotativo = false;
                inicioSesion = null;
                finSesion = null;
            }

            // Detectar tipo de archivo
            if (linea.includes('**ESTABILIDAD:**') && linea.includes('✅')) {
                tieneEstabilidad = true;
                const matchTime = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                if (matchTime && !inicioSesion) {
                    inicioSesion = `${matchTime[1]}:${matchTime[2]}:${matchTime[3]}`;
                }
            }
            if (linea.includes('**GPS:**') && linea.includes('✅')) {
                tieneGPS = true;
                const matchTime = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                if (matchTime && !inicioSesion) {
                    inicioSesion = `${matchTime[1]}:${matchTime[2]}:${matchTime[3]}`;
                }
            }
            if (linea.includes('**ROTATIVO:**') && linea.includes('✅')) {
                tieneRotativo = true;
                const matchTime = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                if (matchTime && !inicioSesion) {
                    inicioSesion = `${matchTime[1]}:${matchTime[2]}:${matchTime[3]}`;
                }
            }

            // Detectar resumen de sesión
            if (linea.includes('**Resumen sesión:**') && sesionActual) {
                const esValida = linea.includes('✅');
                
                if (esValida && tieneEstabilidad && tieneGPS && tieneRotativo) {
                    const matchInicio = linea.match(/inicio (\d{2}):(\d{2}):(\d{2})/);
                    const matchFin = linea.match(/fin (\d{2}):(\d{2}):(\d{2})/);
                    const matchDuracion = linea.match(/duración ([\d\s\w]+)/);
                    
                    if (matchInicio && matchFin) {
                        sesionesValidasReal.push({
                            vehiculo: vehiculoActual,
                            fecha: fechaActual,
                            sesion: sesionActual,
                            inicio: `${matchInicio[1]}:${matchInicio[2]}:${matchInicio[3]}`,
                            fin: `${matchFin[1]}:${matchFin[2]}:${matchFin[3]}`,
                            duracion: matchDuracion ? matchDuracion[1].trim() : 'N/A'
                        });
                    }
                }
            }
        }

        console.log(`✅ Sesiones VÁLIDAS en análisis real (con 3 tipos): ${sesionesValidasReal.length}\n`);

        // Obtener sesiones del sistema
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: true
            },
            orderBy: [
                { startTime: 'asc' }
            ]
        });

        console.log(`💾 Sesiones detectadas por el sistema: ${sessions.length}\n`);
        console.log(`📉 Diferencia: ${sesionesValidasReal.length - sessions.length} sesiones faltantes\n`);

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
            const vehiculo = s.Vehicle.identifier;
            if (porVehiculo[vehiculo]) {
                const fecha = s.startTime.toISOString().split('T')[0];
                const hora = s.startTime.toTimeString().split(' ')[0];
                porVehiculo[vehiculo].sistema.push({
                    fecha,
                    inicio: hora,
                    fin: s.endTime ? s.endTime.toTimeString().split(' ')[0] : 'N/A'
                });
            }
        });

        // Comparación por vehículo
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 COMPARACIÓN POR VEHÍCULO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const [vehiculo, datos] of Object.entries(porVehiculo)) {
            console.log(`🚗 ${vehiculo.toUpperCase()}:\n`);
            console.log(`   Análisis Real (✅):  ${datos.real.length} sesiones con 3 tipos`);
            console.log(`   Sistema:             ${datos.sistema.length} sesiones detectadas`);
            console.log(`   Diferencia:          ${datos.real.length - datos.sistema.length} sesiones faltantes\n`);

            if (datos.real.length > datos.sistema.length) {
                // Agrupar por fecha
                const porFecha = {};
                datos.real.forEach(s => {
                    if (!porFecha[s.fecha]) {
                        porFecha[s.fecha] = { real: 0, sistema: 0 };
                    }
                    porFecha[s.fecha].real++;
                });

                datos.sistema.forEach(s => {
                    if (!porFecha[s.fecha]) {
                        porFecha[s.fecha] = { real: 0, sistema: 0 };
                    }
                    porFecha[s.fecha].sistema++;
                });

                console.log('   📅 Detalle por fecha (solo fechas con diferencias):\n');
                for (const [fecha, count] of Object.entries(porFecha).sort()) {
                    if (count.real !== count.sistema) {
                        const [year, month, day] = fecha.split('-');
                        console.log(`      ${day}/${month}/${year}: Real ${count.real}, Sistema ${count.sistema} → Faltan ${count.real - count.sistema}`);
                    }
                }
                console.log();
            }
        }

        // Mostrar primeras 10 sesiones faltantes con detalles
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 EJEMPLOS DE SESIONES FALTANTES (primeras 10)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let mostradas = 0;
        for (const sesionReal of sesionesValidasReal) {
            if (mostradas >= 10) break;

            // Buscar si esta sesión existe en el sistema
            const existe = sessions.some(s => {
                const fecha = s.startTime.toISOString().split('T')[0];
                const horaInicio = s.startTime.toTimeString().split(' ')[0];
                
                return s.Vehicle.identifier === sesionReal.vehiculo &&
                       fecha === sesionReal.fecha &&
                       Math.abs(
                           new Date(`2000-01-01T${horaInicio}`).getTime() - 
                           new Date(`2000-01-01T${sesionReal.inicio}`).getTime()
                       ) < 60000; // Dentro de 1 minuto
            });

            if (!existe) {
                const [year, month, day] = sesionReal.fecha.split('-');
                console.log(`❌ ${sesionReal.vehiculo.toUpperCase()} - ${day}/${month}/${year} - Sesión ${sesionReal.sesion}`);
                console.log(`   ${sesionReal.inicio} → ${sesionReal.fin} (${sesionReal.duracion})`);
                console.log();
                mostradas++;
            }
        }

        // Análisis de por qué faltan
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 POSIBLES CAUSAS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('1. 📏 Duración mínima muy alta:');
        console.log('   Configuración actual: 300s (5 minutos)');
        console.log('   Análisis real incluye sesiones desde ~30 segundos\n');

        console.log('2. ⏱️ Umbral de correlación estricto:');
        console.log('   Configuración actual: 120s (2 minutos)');
        console.log('   Algunos GPS tardan 3-5 minutos en arrancar\n');

        console.log('3. 🔄 Sesiones ya existían (duplicados):');
        const duplicados = sesionesValidasReal.length - sessions.length;
        console.log(`   ${duplicados} sesiones podrían ser rechazadas por duplicado\n`);

        console.log('💡 SOLUCIONES:\n');
        console.log('   1. Reducir duración mínima a 10-30 segundos');
        console.log('   2. Aumentar umbral de correlación a 300s (5 minutos)');
        console.log('   3. Limpiar BD antes de reprocesar\n');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

compararSesionesValidas();

