/**
 * Script para procesar y guardar eventos en BD para todas las sesiones existentes
 */

const { PrismaClient } = require('@prisma/client');
const { eventDetector } = require('./dist/src/services/eventDetector');

const prisma = new PrismaClient();

async function procesarTodasLasSesiones() {
    console.log('\n🔥 PROCESANDO Y GUARDANDO EVENTOS PARA TODAS LAS SESIONES\n');
    console.log('='.repeat(80) + '\n');
    
    try {
        // Obtener todas las sesiones
        const sessions = await prisma.session.findMany({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
            },
            orderBy: { startTime: 'desc' }
        });
        
        console.log(`📊 Total sesiones encontradas: ${sessions.length}\n`);
        
        let procesadas = 0;
        let errorCount = 0;
        let eventosGuardadosTotal = 0;
        
        for (const session of sessions) {
            try {
                console.log(`⏳ Procesando sesión ${procesadas + 1}/${sessions.length}: ${session.id.substring(0, 8)}...`);
                
                // Verificar si ya tiene eventos
                const eventosExistentes = await prisma.stabilityEvent.count({
                    where: { session_id: session.id }
                });
                
                if (eventosExistentes > 0) {
                    console.log(`   ⚠️ Ya tiene ${eventosExistentes} eventos, saltando...`);
                    procesadas++;
                    continue;
                }
                
                // Detectar y guardar eventos
                const result = await eventDetector.detectarYGuardarEventos(session.id);
                
                console.log(`   ✅ Guardados ${result.guardados} eventos`);
                eventosGuardadosTotal += result.guardados;
                procesadas++;
                
                // Pausa cada 10 sesiones
                if (procesadas % 10 === 0) {
                    console.log(`\n   📊 Progreso: ${procesadas}/${sessions.length} sesiones procesadas`);
                    console.log(`   📊 Total eventos guardados: ${eventosGuardadosTotal}\n`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`   ❌ Error procesando sesión ${session.id}: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('\n✅ PROCESAMIENTO COMPLETADO\n');
        console.log(`   Sesiones procesadas: ${procesadas}/${sessions.length}`);
        console.log(`   Eventos guardados: ${eventosGuardadosTotal}`);
        console.log(`   Errores: ${errorCount}\n`);
        
        // Verificar
        const totalEventosBD = await prisma.stabilityEvent.count();
        console.log(`📊 Total eventos en BD: ${totalEventosBD}\n`);
        
    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

procesarTodasLasSesiones();

