/**
 * DIAGNÓSTICO COMPLETO DE DATOS DISPONIBLES
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DIAGNÓSTICO DE DATOS DISPONIBLES');
    console.log('='.repeat(80) + '\n');
    
    try {
        const orgId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';
        
        // 1. SESIONES
        console.log('📊 SESIONES:');
        const sesiones = await prisma.session.findMany({
            where: { organizationId: orgId },
            orderBy: { startTime: 'desc' },
            take: 5
        });
        console.log(`   Total: ${sesiones.length} sesiones encontradas`);
        if (sesiones.length > 0) {
            console.log(`   Última: ${sesiones[0].startTime.toISOString()}\n`);
        }
        
        // 2. EVENTOS DE ESTABILIDAD (para Puntos Negros)
        console.log('🗺️  DATOS PARA PUNTOS NEGROS:');
        const eventosTotal = await prisma.stabilityEvent.count({
            where: {
                Session: { organizationId: orgId }
            }
        });
        console.log(`   Total eventos: ${eventosTotal}`);
        
        const eventosConGPS = await prisma.stabilityEvent.count({
            where: {
                Session: { organizationId: orgId },
                lat: { not: 0 },
                lon: { not: 0 }
            }
        });
        console.log(`   Eventos con GPS (lat/lon != 0): ${eventosConGPS}`);
        
        if (eventosConGPS > 0) {
            const eventosEjemplo = await prisma.stabilityEvent.findMany({
                where: {
                    Session: { organizationId: orgId },
                    lat: { not: 0 },
                    lon: { not: 0 }
                },
                take: 3
            });
            console.log('\n   Ejemplos de eventos con GPS:');
            eventosEjemplo.forEach((e, i) => {
                console.log(`      ${i+1}. (${e.lat}, ${e.lon}) - ${e.type}`);
            });
        } else {
            console.log('   ⚠️  NO HAY EVENTOS CON COORDENADAS GPS');
            console.log('   Solución: Ejecutar EventDetectorWithGPS para correlacionar GPS\n');
        }
        
        // 3. DATOS GPS (para Velocidad)
        console.log('\n🚗 DATOS PARA VELOCIDAD:');
        
        // Primero obtener sesiones de la org
        const sessionIds = sesiones.map(s => s.id);
        
        const gpsTotal = await prisma.gpsMeasurement.count({
            where: {
                sessionId: { in: sessionIds }
            }
        });
        console.log(`   Total puntos GPS: ${gpsTotal}`);
        
        const gpsConVelocidad = await prisma.gpsMeasurement.count({
            where: {
                sessionId: { in: sessionIds },
                speed: { gt: 0 }
            }
        });
        console.log(`   GPS con velocidad >0: ${gpsConVelocidad}`);
        
        if (gpsConVelocidad > 0) {
            const gpsEjemplo = await prisma.gpsMeasurement.findMany({
                where: {
                    Session: { organizationId: orgId },
                    speed: { gt: 0 }
                },
                orderBy: { speed: 'desc' },
                take: 5
            });
            console.log('\n   Top 5 velocidades:');
            gpsEjemplo.forEach((g, i) => {
                console.log(`      ${i+1}. ${g.speed} km/h - (${g.lat}, ${g.lng})`);
            });
        } else {
            console.log('   ⚠️  NO HAY DATOS GPS CON VELOCIDAD\n');
        }
        
        // 4. DATOS ROTATIVO (para Claves Operacionales)
        console.log('\n🔑 DATOS PARA CLAVES OPERACIONALES:');
        const rotativoTotal = await prisma.rotativoMeasurement.count({
            where: {
                sessionId: { in: sessionIds }
            }
        });
        console.log(`   Total mediciones rotativo: ${rotativoTotal}`);
        
        const rotativoConKey = await prisma.rotativoMeasurement.count({
            where: {
                sessionId: { in: sessionIds },
                key: { not: null }
            }
        });
        console.log(`   Rotativo con 'key' definida: ${rotativoConKey}`);
        
        if (rotativoConKey > 0) {
            const rotativoEjemplo = await prisma.rotativoMeasurement.findMany({
                where: {
                    sessionId: { in: sessionIds },
                    key: { not: null }
                },
                take: 5
            });
            console.log('\n   Ejemplos con clave:');
            rotativoEjemplo.forEach((r, i) => {
                console.log(`      ${i+1}. Clave ${r.key} - Estado ${r.state}`);
            });
        } else {
            console.log('   ⚠️  NO HAY DATOS ROTATIVO CON COLUMNA KEY');
            console.log('   Solución: Reprocesar archivos ROTATIVO con nueva lógica\n');
        }
        
        // 5. CLAVES OPERACIONALES YA CALCULADAS
        console.log('\n🔑 CLAVES OPERACIONALES CALCULADAS:');
        const clavesCalculadas = await prisma.operationalKey.count();
        console.log(`   Total claves en BD: ${clavesCalculadas}`);
        
        if (clavesCalculadas === 0) {
            console.log('   ⚠️  NO HAY CLAVES CALCULADAS');
            console.log('   Solución: Ejecutar cálculo de claves para sesiones existentes\n');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('📋 CONCLUSIÓN:');
        console.log('='.repeat(80) + '\n');
        
        if (eventosConGPS === 0) {
            console.log('❌ PUNTOS NEGROS: Sin datos - Necesita correlación GPS con eventos');
        } else {
            console.log(`✅ PUNTOS NEGROS: ${eventosConGPS} eventos con GPS disponibles`);
        }
        
        if (gpsConVelocidad === 0) {
            console.log('❌ VELOCIDAD: Sin datos - Necesita datos GPS con velocidad');
        } else {
            console.log(`✅ VELOCIDAD: ${gpsConVelocidad} puntos GPS con velocidad disponibles`);
        }
        
        if (rotativoConKey === 0 && clavesCalculadas === 0) {
            console.log('❌ CLAVES OPERACIONALES: Sin datos - Necesita reprocesar archivos ROTATIVO');
        } else if (clavesCalculadas > 0) {
            console.log(`✅ CLAVES OPERACIONALES: ${clavesCalculadas} claves calculadas`);
        }
        
        console.log('');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

diagnosticar().catch(console.error);

