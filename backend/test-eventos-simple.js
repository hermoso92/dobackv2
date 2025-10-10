/**
 * Test simple del detector de eventos (JavaScript puro para evitar problemas TypeScript)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEventos() {
    try {
        console.log('\n🧪 TEST: DETECTOR DE EVENTOS CON GPS\n');
        console.log('='.repeat(80) + '\n');
        
        // 1. Buscar una sesión reciente con ESTABILIDAD
        const sesion = await prisma.session.findFirst({
            where: {
                vehicleId: '14b9febb-ca73-4130-a88d-e4d73ed6501a', // DOBACK024
                endTime: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!sesion) {
            throw new Error('No se encontró sesión para probar');
        }
        
        console.log(`📋 Sesión: ${sesion.id}`);
        console.log(`   Inicio: ${sesion.startTime.toISOString()}`);
        console.log(`   Fin: ${sesion.endTime?.toISOString()}\n`);
        
        // 2. Verificar datos disponibles
        const [gpsCount, estCount, rotCount] = await Promise.all([
            prisma.gpsMeasurement.count({ where: { sessionId: sesion.id } }),
            prisma.stabilityMeasurement.count({ where: { sessionId: sesion.id } }),
            prisma.rotativoMeasurement.count({ where: { sessionId: sesion.id } })
        ]);
        
        console.log('📊 Datos disponibles:');
        console.log(`   GPS: ${gpsCount.toLocaleString()}`);
        console.log(`   ESTABILIDAD: ${estCount.toLocaleString()}`);
        console.log(`   ROTATIVO: ${rotCount.toLocaleString()}\n`);
        
        if (estCount === 0) {
            console.log('⚠️  Esta sesión no tiene datos de ESTABILIDAD, no se pueden detectar eventos');
            console.log('   Busca una sesión más antigua que SÍ tenga datos.\n');
            return;
        }
        
        // 3. Analizar distribución de SI
        console.log('='.repeat(80));
        console.log('📊 DISTRIBUCIÓN DE ÍNDICE DE ESTABILIDAD (SI)\n');
        
        const muestras = await prisma.stabilityMeasurement.findMany({
            where: { sessionId: sesion.id },
            select: { si: true },
            take: 10000 // Muestra de 10K
        });
        
        const distribucion = {
            siMenor020: muestras.filter(m => m.si < 0.20).length,
            si020a035: muestras.filter(m => m.si >= 0.20 && m.si < 0.35).length,
            si035a050: muestras.filter(m => m.si >= 0.35 && m.si < 0.50).length,
            si050a070: muestras.filter(m => m.si >= 0.50 && m.si < 0.70).length,
            si070a090: muestras.filter(m => m.si >= 0.70 && m.si < 0.90).length,
            siMayor090: muestras.filter(m => m.si >= 0.90).length
        };
        
        console.log(`Total muestras analizadas: ${muestras.length.toLocaleString()}\n`);
        console.log('Distribución:');
        console.log(`  SI < 0.20 (GRAVE):       ${distribucion.siMenor020.toLocaleString()} (${(distribucion.siMenor020 / muestras.length * 100).toFixed(4)}%)`);
        console.log(`  0.20 ≤ SI < 0.35 (MOD):  ${distribucion.si020a035.toLocaleString()} (${(distribucion.si020a035 / muestras.length * 100).toFixed(4)}%)`);
        console.log(`  0.35 ≤ SI < 0.50 (LEVE): ${distribucion.si035a050.toLocaleString()} (${(distribucion.si035a050 / muestras.length * 100).toFixed(4)}%)`);
        console.log(`  0.50 ≤ SI < 0.70:        ${distribucion.si050a070.toLocaleString()} (${(distribucion.si050a070 / muestras.length * 100).toFixed(2)}%)`);
        console.log(`  0.70 ≤ SI < 0.90:        ${distribucion.si070a090.toLocaleString()} (${(distribucion.si070a090 / muestras.length * 100).toFixed(2)}%)`);
        console.log(`  SI ≥ 0.90:               ${distribucion.siMayor090.toLocaleString()} (${(distribucion.siMayor090 / muestras.length * 100).toFixed(2)}%)\n`);
        
        const eventosPotenciales = distribucion.siMenor020 + distribucion.si020a035 + distribucion.si035a050;
        console.log(`⚠️  EVENTOS POTENCIALES (SI < 0.50): ${eventosPotenciales.toLocaleString()} (${(eventosPotenciales / muestras.length * 100).toFixed(4)}%)\n`);
        
        // 4. SI hay eventos potenciales, continuar con detección
        if (eventosPotenciales > 0) {
            console.log('='.repeat(80));
            console.log('🔍 DETECTANDO EVENTOS...\n');
            
            // Importar el detector (compilado)
            const { eventDetectorWithGPS } = require('./dist/services/EventDetectorWithGPS');
            
            const resultado = await eventDetectorWithGPS.detectarYGuardarEventos(sesion.id);
            
            console.log(`✅ Eventos detectados: ${resultado.total}`);
            console.log(`✅ Eventos guardados: ${resultado.guardados}\n`);
            
            if (resultado.guardados > 0) {
                // Consultar eventos guardados
                const eventos = await prisma.stabilityEvent.findMany({
                    where: { session_id: sesion.id },
                    select: { severity: true, type: true, lat: true, lon: true }
                });
                
                console.log('📊 Distribución por severidad:');
                console.log(`   GRAVE: ${eventos.filter(e => e.severity === 'GRAVE').length}`);
                console.log(`   MODERADA: ${eventos.filter(e => e.severity === 'MODERADA').length}`);
                console.log(`   LEVE: ${eventos.filter(e => e.severity === 'LEVE').length}\n`);
                
                const conGPS = eventos.filter(e => e.lat !== 0 && e.lon !== 0).length;
                console.log(`📍 Eventos con GPS: ${conGPS} de ${eventos.length} (${(conGPS / eventos.length * 100).toFixed(1)}%)\n`);
            }
        } else {
            console.log('✅ No hay eventos en esta sesión (SI siempre > 0.50)\n');
            console.log('   Esto es NORMAL en conducción segura.\n');
        }
        
        console.log('='.repeat(80));
        console.log('✅ TEST COMPLETADO\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testEventos();

