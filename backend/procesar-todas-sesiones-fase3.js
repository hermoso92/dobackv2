/**
 * Procesar TODAS las sesiones creadas para detectar eventos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function procesarTodasLasSesiones() {
    try {
        console.log('\n🔄 PROCESANDO TODAS LAS SESIONES - FASE 3\n');
        console.log('='.repeat(80) + '\n');
        
        // 1. Obtener todas las sesiones de DOBACK024 del día 08/10
        const sesiones = await prisma.session.findMany({
            where: {
                vehicleId: '14b9febb-ca73-4130-a88d-e4d73ed6501a',
                startTime: {
                    gte: new Date('2025-10-08T00:00:00Z'),
                    lte: new Date('2025-10-08T23:59:59Z')
                }
            },
            orderBy: { startTime: 'asc' }
        });
        
        console.log(`📋 Sesiones encontradas: ${sesiones.length}\n`);
        
        // Importar detector
        const { eventDetectorWithGPS } = require('./dist/services/EventDetectorWithGPS');
        
        let totalEventos = 0;
        let totalGraves = 0;
        let totalModerados = 0;
        let totalLeves = 0;
        let sesionesConEventos = 0;
        
        const inicio = Date.now();
        
        for (let i = 0; i < sesiones.length; i++) {
            const sesion = sesiones[i];
            
            console.log(`[${i + 1}/${sesiones.length}] Procesando ${sesion.id.substring(0, 8)}...`);
            
            // Verificar si tiene ESTABILIDAD
            const estCount = await prisma.stabilityMeasurement.count({
                where: { sessionId: sesion.id }
            });
            
            if (estCount === 0) {
                console.log(`   ⏭️  Sin datos ESTABILIDAD, saltando\n`);
                continue;
            }
            
            // Detectar eventos
            const resultado = await eventDetectorWithGPS.detectarYGuardarEventos(sesion.id);
            
            console.log(`   ✅ ${resultado.guardados} eventos guardados`);
            
            if (resultado.guardados > 0) {
                sesionesConEventos++;
                totalEventos += resultado.guardados;
                
                // Contar por severidad
                const eventos = await prisma.stabilityEvent.findMany({
                    where: { session_id: sesion.id },
                    select: { severity: true }
                });
                
                totalGraves += eventos.filter(e => e.severity === 'GRAVE').length;
                totalModerados += eventos.filter(e => e.severity === 'MODERADA').length;
                totalLeves += eventos.filter(e => e.severity === 'LEVE').length;
            }
            
            console.log();
        }
        
        const duracion = Date.now() - inicio;
        
        console.log('='.repeat(80));
        console.log('📊 RESUMEN FINAL\n');
        
        console.log(`Total sesiones procesadas: ${sesiones.length}`);
        console.log(`Sesiones con eventos: ${sesionesConEventos}`);
        console.log(`Total eventos detectados: ${totalEventos.toLocaleString()}\n`);
        
        console.log('Distribución por severidad:');
        console.log(`  GRAVE (SI < 0.20): ${totalGraves}`);
        console.log(`  MODERADA (0.20-0.35): ${totalModerados}`);
        console.log(`  LEVE (0.35-0.50): ${totalLeves}\n`);
        
        console.log(`Tiempo total: ${(duracion / 1000).toFixed(2)}s`);
        console.log(`Promedio por sesión: ${(duracion / sesiones.length).toFixed(0)}ms\n`);
        
        console.log('='.repeat(80));
        console.log('✅ PROCESAMIENTO COMPLETO\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

procesarTodasLasSesiones();

