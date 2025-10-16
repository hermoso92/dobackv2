/**
 * SANITY CHECK FASE 3
 * Verificar consistencia de eventos detectados
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sanityCheck() {
    try {
        console.log('\n🔍 SANITY CHECK FASE 3\n');
        console.log('='.repeat(80) + '\n');
        
        // 1. Total de eventos
        const total = await prisma.$queryRaw`
            SELECT COUNT(*) AS total 
            FROM stability_events 
            WHERE timestamp >= '2025-10-08'
        `;
        
        console.log('📊 TOTAL EVENTOS:', total[0].total);
        
        // 2. Desglose por severidad
        const porSeveridad = await prisma.$queryRaw`
            SELECT severity, COUNT(*) AS c
            FROM stability_events
            WHERE timestamp >= '2025-10-08'
            GROUP BY severity
            ORDER BY c DESC
        `;
        
        console.log('\n📊 DESGLOSE POR SEVERIDAD:');
        porSeveridad.forEach(r => {
            console.log(`   ${r.severity}: ${r.c}`);
        });
        
        const suma = porSeveridad.reduce((acc, r) => acc + parseInt(r.c), 0);
        console.log('   ───────────────');
        console.log(`   SUMA: ${suma}`);
        
        console.log(`\n✅ Total coincide: ${total[0].total == suma ? 'SÍ ✅' : 'NO ❌'}`);
        
        // 3. Validación SI < 0.50
        const validacionSI = await prisma.$queryRaw`
            SELECT 
                COUNT(*) FILTER (WHERE (details->>'si')::float < 0.50) AS eventos_si_menor_050,
                COUNT(*) AS total
            FROM stability_events
            WHERE timestamp >= '2025-10-08'
        `;
        
        console.log('\n📊 VALIDACIÓN SI < 0.50:');
        console.log(`   Eventos con SI < 0.50: ${validacionSI[0].eventos_si_menor_050}`);
        console.log(`   Total eventos: ${validacionSI[0].total}`);
        
        console.log(`\n✅ Todos tienen SI < 0.50: ${validacionSI[0].eventos_si_menor_050 == validacionSI[0].total ? 'SÍ ✅' : 'NO ❌'}`);
        
        // 4. Distribución de SI
        console.log('\n📊 DISTRIBUCIÓN SI:');
        
        const distribucionSI = await prisma.$queryRaw`
            SELECT 
                COUNT(*) FILTER (WHERE (details->>'si')::float < 0.20) AS graves,
                COUNT(*) FILTER (WHERE (details->>'si')::float >= 0.20 AND (details->>'si')::float < 0.35) AS moderados,
                COUNT(*) FILTER (WHERE (details->>'si')::float >= 0.35 AND (details->>'si')::float < 0.50) AS leves,
                COUNT(*) FILTER (WHERE (details->>'si')::float >= 0.50) AS incorrectos
            FROM stability_events
            WHERE timestamp >= '2025-10-08'
        `;
        
        console.log(`   SI < 0.20 (GRAVE): ${distribucionSI[0].graves}`);
        console.log(`   0.20 ≤ SI < 0.35 (MODERADA): ${distribucionSI[0].moderados}`);
        console.log(`   0.35 ≤ SI < 0.50 (LEVE): ${distribucionSI[0].leves}`);
        console.log(`   SI ≥ 0.50 (INCORRECTOS): ${distribucionSI[0].incorrectos}`);
        
        console.log(`\n✅ Sin eventos incorrectos: ${distribucionSI[0].incorrectos == 0 ? 'SÍ ✅' : 'NO ❌'}`);
        
        // 5. Eventos con GPS
        const conGPS = await prisma.stabilityEvent.count({
            where: {
                timestamp: { gte: new Date('2025-10-08') },
                lat: { not: 0 },
                lon: { not: 0 }
            }
        });
        
        const totalEventos = parseInt(total[0].total);
        const porcentajeGPS = (conGPS / totalEventos * 100).toFixed(1);
        
        console.log('\n📍 EVENTOS CON GPS:');
        console.log(`   Con coordenadas: ${conGPS} de ${totalEventos} (${porcentajeGPS}%)`);
        console.log(`   Sin coordenadas: ${totalEventos - conGPS}`);
        
        // RESUMEN FINAL
        console.log('\n' + '='.repeat(80));
        console.log('✅ RESUMEN SANITY CHECK\n');
        
        const todoBien = 
            total[0].total == suma &&
            validacionSI[0].eventos_si_menor_050 == validacionSI[0].total &&
            distribucionSI[0].incorrectos == 0;
        
        if (todoBien) {
            console.log('✅ TODOS LOS CHECKS PASARON');
            console.log('✅ FASE 3 CERRADA OFICIALMENTE\n');
        } else {
            console.log('❌ HAY INCONSISTENCIAS - REVISAR\n');
        }
        
        console.log('='.repeat(80) + '\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

sanityCheck();

