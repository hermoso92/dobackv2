/**
 * 📊 COMPARACIÓN FINAL SIMPLE
 * 
 * Sesiones esperadas (GPS + >= 5min) vs Sesiones detectadas
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

async function compararFinal() {
    console.log('📊 COMPARACIÓN FINAL: GPS OBLIGATORIO + >= 5 MIN\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Leer análisis real
        const analisisReal = fs.readFileSync('resumendoback/Analisis_Sesiones_CMadrid_real.md', 'utf8');
        
        // Contar sesiones ✅ con >= 5 min por vehículo
        const esperadas = { doback024: 0, doback027: 0, doback028: 0 };
        const lineas = analisisReal.split('\n');
        let vehiculoActual = null;
        let tieneEst = false, tieneGPS = false, tieneRot = false;

        for (const linea of lineas) {
            if (linea.includes('## 🚒 DOBACK024')) vehiculoActual = 'doback024';
            else if (linea.includes('## 🚒 DOBACK027')) vehiculoActual = 'doback027';
            else if (linea.includes('## 🚒 DOBACK028')) vehiculoActual = 'doback028';

            if (linea.match(/#### Sesión/)) {
                tieneEst = false;
                tieneGPS = false;
                tieneRot = false;
            }

            if (linea.includes('**ESTABILIDAD:**') && linea.includes('✅')) tieneEst = true;
            if (linea.includes('**GPS:**') && linea.includes('✅')) tieneGPS = true;
            if (linea.includes('**ROTATIVO:**') && linea.includes('✅')) tieneRot = true;

            if (linea.includes('**Resumen sesión:**') && linea.includes('✅')) {
                if (tieneEst && tieneGPS && tieneRot) {
                    const matchDuracion = linea.match(/duración ([\d\s\w]+)/);
                    if (matchDuracion) {
                        const duracionSegundos = parseDuration(matchDuracion[1]);
                        if (duracionSegundos >= 300 && vehiculoActual) {
                            esperadas[vehiculoActual]++;
                        }
                    }
                }
            }
        }

        // Contar sesiones detectadas por el sistema
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: true
            }
        });

        const detectadas = { doback024: 0, doback027: 0, doback028: 0 };
        sessions.forEach(s => {
            const vehiculo = s.Vehicle.identifier.toLowerCase();
            if (detectadas[vehiculo] !== undefined) {
                detectadas[vehiculo]++;
            }
        });

        // Mostrar comparación
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║         COMPARACIÓN CON MISMA CONFIGURACIÓN              ║');
        console.log('║         (GPS Obligatorio + Duración >= 5 min)            ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        console.log('┌───────────┬──────────┬───────────┬────────────┬──────────┐');
        console.log('│ Vehículo  │ Esperadas│ Detectadas│ Diferencia │ Cobertura│');
        console.log('├───────────┼──────────┼───────────┼────────────┼──────────┤');

        let totalEsperadas = 0;
        let totalDetectadas = 0;

        for (const vehiculo of ['doback024', 'doback027', 'doback028']) {
            const esp = esperadas[vehiculo];
            const det = detectadas[vehiculo];
            const diff = esp - det;
            const cob = esp > 0 ? ((det / esp) * 100).toFixed(1) : '0.0';

            totalEsperadas += esp;
            totalDetectadas += det;

            const status = diff === 0 ? '✅' : '❌';
            const diffStr = diff > 0 ? `-${diff}` : `+${Math.abs(diff)}`;

            console.log(`│ ${vehiculo}  │    ${esp.toString().padStart(2)}    │     ${det.toString().padStart(2)}    │    ${diffStr.padStart(4)}    │  ${cob.padStart(5)}% │`);
        }

        console.log('├───────────┼──────────┼───────────┼────────────┼──────────┤');
        
        const totalDiff = totalEsperadas - totalDetectadas;
        const totalCob = totalEsperadas > 0 ? ((totalDetectadas / totalEsperadas) * 100).toFixed(1) : '0.0';
        const totalDiffStr = totalDiff > 0 ? `-${totalDiff}` : `+${Math.abs(totalDiff)}`;

        console.log(`│ TOTAL     │    ${totalEsperadas.toString().padStart(2)}    │     ${totalDetectadas.toString().padStart(2)}    │    ${totalDiffStr.padStart(4)}    │  ${totalCob.padStart(5)}% │`);
        console.log('└───────────┴──────────┴───────────┴────────────┴──────────┘\n');

        // Diagnóstico
        if (totalDiff === 0) {
            console.log('✅ ¡PERFECTO! El sistema detecta EXACTAMENTE las mismas sesiones\n');
            console.log('   que el análisis real con la configuración GPS + >= 5 min.\n');
        } else {
            console.log(`❌ El sistema detecta ${totalDetectadas} de ${totalEsperadas} sesiones (${totalCob}% cobertura)\n`);
            console.log(`   Faltan ${totalDiff} sesiones por detectar.\n`);

            console.log('🔍 CAUSAS PRINCIPALES:\n');
            
            // Analizar por qué faltan
            console.log('   Del reporte del frontend vemos que se rechazan por:\n');
            console.log('   1. ❌ Duración < 300s');
            console.log('      Ejemplo: "Duración < 300s (236.9s)"');
            console.log('      → Sesiones cerca de 5min pero ligeramente bajo\n');
            
            console.log('   2. ❌ Falta GPS');
            console.log('      Aunque el análisis real marca como ✅ con GPS');
            console.log('      → Problema de correlación GPS\n');
            
            console.log('   3. ❌ Falta ROTATIVO');
            console.log('      Algunas sesiones GPS no correlacionan con ROTATIVO');
            console.log('      → Problema de correlación temporal\n');

            console.log('💡 POSIBLE SOLUCIÓN:\n');
            console.log('   El análisis real usa redondeo ("~ 5 min" para 4m 50s)');
            console.log('   Reducir duración mínima a 280s (4m 40s) podría capturar más.\n');
        }

        // Mostrar ejemplo de sesiones que faltan
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 EJEMPLOS DE SESIONES QUE FALTAN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📋 Sesiones esperadas pero NO detectadas:\n');
        
        // Listar primeras 5 diferencias de cada vehículo
        for (const vehiculo of ['doback024', 'doback027', 'doback028']) {
            if (esperadas[vehiculo] > detectadas[vehiculo]) {
                console.log(`🚗 ${vehiculo.toUpperCase()}:\n`);
                console.log(`   (Mostrando posibles causas según reporte)\n`);
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

compararFinal();

