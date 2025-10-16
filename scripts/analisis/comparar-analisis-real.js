/**
 * 📊 COMPARAR CON ANÁLISIS REAL
 * 
 * Cuenta las sesiones del análisis real y las compara con las detectadas
 */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compararAnalisis() {
    console.log('📊 COMPARACIÓN CON ANÁLISIS REAL\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Leer análisis real
        const analisisReal = fs.readFileSync('resumendoback/Analisis_Sesiones_CMadrid_real.md', 'utf8');

        // Contar sesiones por vehículo en análisis real
        const contadorReal = {
            doback024: { total: 0, conGPS: 0, sinGPS: 0, porFecha: {} },
            doback027: { total: 0, conGPS: 0, sinGPS: 0, porFecha: {} },
            doback028: { total: 0, conGPS: 0, sinGPS: 0, porFecha: {} }
        };

        // Parsear análisis real
        const lineas = analisisReal.split('\n');
        let vehiculoActual = null;
        let fechaActual = null;

        for (const linea of lineas) {
            // Detectar vehículo
            if (linea.includes('## 🚒 DOBACK024')) vehiculoActual = 'doback024';
            else if (linea.includes('## 🚒 DOBACK027')) vehiculoActual = 'doback027';
            else if (linea.includes('## 🚒 DOBACK028')) vehiculoActual = 'doback028';

            // Detectar fecha
            const matchFecha = linea.match(/### 📅 (\d{2}\/\d{2}\/\d{4})/);
            if (matchFecha && vehiculoActual) {
                fechaActual = matchFecha[1];
                if (!contadorReal[vehiculoActual].porFecha[fechaActual]) {
                    contadorReal[vehiculoActual].porFecha[fechaActual] = { total: 0, conGPS: 0, sinGPS: 0 };
                }
            }

            // Detectar sesión
            if (linea.includes('**Resumen sesión:**') && vehiculoActual && fechaActual) {
                contadorReal[vehiculoActual].total++;
                contadorReal[vehiculoActual].porFecha[fechaActual].total++;

                if (linea.includes('✅')) {
                    contadorReal[vehiculoActual].conGPS++;
                    contadorReal[vehiculoActual].porFecha[fechaActual].conGPS++;
                } else {
                    contadorReal[vehiculoActual].sinGPS++;
                    contadorReal[vehiculoActual].porFecha[fechaActual].sinGPS++;
                }
            }
        }

        // Obtener sesiones detectadas por el sistema
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        const contadorSistema = {
            doback024: { total: 0, porFecha: {} },
            doback027: { total: 0, porFecha: {} },
            doback028: { total: 0, porFecha: {} }
        };

        sessions.forEach(session => {
            const vehicleId = session.Vehicle.identifier;
            if (contadorSistema[vehicleId]) {
                contadorSistema[vehicleId].total++;

                const fecha = session.startTime.toISOString().split('T')[0];
                const [year, month, day] = fecha.split('-');
                const fechaFormateada = `${day}/${month}/${year}`;

                if (!contadorSistema[vehicleId].porFecha[fechaFormateada]) {
                    contadorSistema[vehicleId].porFecha[fechaFormateada] = 0;
                }
                contadorSistema[vehicleId].porFecha[fechaFormateada]++;
            }
        });

        // Mostrar comparación
        console.log('📋 COMPARACIÓN POR VEHÍCULO:\n');

        for (const vehiculo of ['doback024', 'doback027', 'doback028']) {
            const real = contadorReal[vehiculo];
            const sistema = contadorSistema[vehiculo];

            console.log(`🚗 ${vehiculo.toUpperCase()}:\n`);
            console.log(`   Análisis Real:  ${real.total} sesiones (${real.conGPS} con GPS, ${real.sinGPS} sin GPS)`);
            console.log(`   Sistema actual: ${sistema.total} sesiones`);
            console.log(`   Diferencia:     ${real.total - sistema.total} sesiones faltantes\n`);

            if (real.total !== sistema.total) {
                console.log(`   📅 Detalle por fecha:\n`);

                // Obtener todas las fechas únicas
                const todasFechas = new Set([
                    ...Object.keys(real.porFecha),
                    ...Object.keys(sistema.porFecha)
                ]);

                for (const fecha of Array.from(todasFechas).sort()) {
                    const realFecha = real.porFecha[fecha] || { total: 0, conGPS: 0, sinGPS: 0 };
                    const sistemaFecha = sistema.porFecha[fecha] || 0;

                    if (realFecha.total !== sistemaFecha) {
                        const diff = realFecha.total - sistemaFecha;
                        const emoji = diff > 0 ? '❌' : '✅';
                        console.log(`      ${emoji} ${fecha}:`);
                        console.log(`         Real:    ${realFecha.total} (${realFecha.conGPS} con GPS, ${realFecha.sinGPS} sin GPS)`);
                        console.log(`         Sistema: ${sistemaFecha}`);
                        console.log(`         Faltan:  ${diff}\n`);
                    }
                }
            }
        }

        // Resumen total
        const totalReal = contadorReal.doback024.total + contadorReal.doback027.total + contadorReal.doback028.total;
        const totalConGPS = contadorReal.doback024.conGPS + contadorReal.doback027.conGPS + contadorReal.doback028.conGPS;
        const totalSinGPS = contadorReal.doback024.sinGPS + contadorReal.doback027.sinGPS + contadorReal.doback028.sinGPS;
        const totalSistema = contadorSistema.doback024.total + contadorSistema.doback027.total + contadorSistema.doback028.total;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN TOTAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`   Análisis Real:  ${totalReal} sesiones`);
        console.log(`      • Con GPS:   ${totalConGPS} (${((totalConGPS/totalReal)*100).toFixed(1)}%)`);
        console.log(`      • Sin GPS:   ${totalSinGPS} (${((totalSinGPS/totalReal)*100).toFixed(1)}%)\n`);

        console.log(`   Sistema actual: ${totalSistema} sesiones`);
        console.log(`   Diferencia:     ${totalReal - totalSistema} sesiones faltantes\n`);

        console.log('🔍 DIAGNÓSTICO:\n');
        console.log(`   El sistema solo detecta sesiones CON GPS.`);
        console.log(`   Las ${totalSinGPS} sesiones SIN GPS no se detectan.`);
        console.log(`   Esto representa el ${((totalSinGPS/totalReal)*100).toFixed(1)}% de todas las sesiones.\n`);

        console.log('💡 SOLUCIÓN:\n');
        console.log(`   Cambiar configuración para permitir GPS opcional:`);
        console.log(`   requiredFiles: { gps: false, estabilidad: true, rotativo: true }\n`);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

compararAnalisis();

