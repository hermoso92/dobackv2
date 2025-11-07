/**
 * 🧪 TEST CON SESIÓN INESTABLE
 */

import { eventDetectorV2 } from '../../backend/src/services/eventDetectorV2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              🧪 TEST DETECTOR V2 - SESIÓN INESTABLE                        ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
    
    // Mejor candidata con más eventos
    const sessionId = '6a64b156-5c18-46b8-be49-1165122310a2';
    
    console.log(`📍 Sesión de prueba: ${sessionId}`);
    console.log(`   SI mínimo: 11%`);
    console.log(`   Mediciones inestables: 476`);
    console.log(`   └─ Graves (SI<0.20): 6`);
    console.log(`   └─ Moderadas (0.20-0.35): 51`);
    console.log(`   └─ Leves (0.35-0.50): 419\n`);
    
    try {
        // Detectar eventos
        console.log('🔍 Detectando eventos con sistema V2...\n');
        const eventos = await eventDetectorV2.detectarEventosSesionV2(sessionId);
        
        console.log('╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                           📊 RESULTADOS                                    ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
        
        console.log(`✅ Total eventos detectados: ${eventos.length}\n`);
        
        if (eventos.length === 0) {
            console.log('⚠️  No se detectaron eventos.');
            console.log('   Posibles causas:');
            console.log('   1. Ventana temporal no captura mediciones inestables');
            console.log('   2. Mediciones inestables no cumplen criterios de tipo');
            console.log('   3. Eventos filtrados por falta de GPS\n');
            await prisma.$disconnect();
            return;
        }
        
        // Por tipo
        const porTipo = eventos.reduce((acc: any, e) => {
            acc[e.tipo] = (acc[e.tipo] || 0) + 1;
            return acc;
        }, {});
        
        console.log('📊 Por TIPO:');
        Object.entries(porTipo).forEach(([tipo, count]) => {
            const porcentaje = ((count as number) / eventos.length * 100).toFixed(1);
            console.log(`   ${tipo.padEnd(35, ' ')} ${String(count).padStart(5, ' ')} (${porcentaje}%)`);
        });
        
        // Por severidad
        const porSeveridad = eventos.reduce((acc: any, e) => {
            acc[e.severidad] = (acc[e.severidad] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📊 Por SEVERIDAD (basada en SI):');
        Object.entries(porSeveridad).forEach(([sev, count]) => {
            const porcentaje = ((count as number) / eventos.length * 100).toFixed(1);
            const emoji = sev === 'GRAVE' ? '🔴' : sev === 'MODERADA' ? '🟠' : '🟡';
            console.log(`   ${emoji} ${sev.padEnd(10, ' ')} ${String(count).padStart(5, ' ')} (${porcentaje}%)`);
        });
        
        // Análisis de SI
        console.log('\n📈 Distribución de SI en eventos:');
        const siValues = eventos.map(e => e.si).sort((a, b) => a - b);
        console.log(`   Mínimo:  ${(siValues[0] * 100).toFixed(1)}%`);
        console.log(`   Máximo:  ${(siValues[siValues.length - 1] * 100).toFixed(1)}%`);
        console.log(`   Promedio: ${(siValues.reduce((a, b) => a + b, 0) / siValues.length * 100).toFixed(1)}%`);
        
        // Mostrar ejemplos de cada tipo
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                         📋 EJEMPLOS DE EVENTOS                             ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
        
        const tiposUnicos = [...new Set(eventos.map(e => e.tipo))];
        
        for (const tipo of tiposUnicos) {
            const ejemplosTipo = eventos.filter(e => e.tipo === tipo);
            console.log(`\n🎯 ${tipo} (${ejemplosTipo.length} eventos):`);
            console.log('─'.repeat(80));
            
            // Mostrar 3 ejemplos: 1 de cada severidad si hay
            const ejemploPorSeveridad = new Map();
            ['GRAVE', 'MODERADA', 'LEVE'].forEach(sev => {
                const ejemplo = ejemplosTipo.find(e => e.severidad === sev);
                if (ejemplo) ejemploPorSeveridad.set(sev, ejemplo);
            });
            
            let idx = 1;
            ejemploPorSeveridad.forEach((e, sev) => {
                const emoji = sev === 'GRAVE' ? '🔴' : sev === 'MODERADA' ? '🟠' : '🟡';
                console.log(`\n${idx}. ${emoji} ${e.severidad}`);
                console.log(`   ${e.descripcion}`);
                console.log(`   Timestamp: ${e.timestamp.toISOString()}`);
                console.log(`   GPS: ${e.lat ? `${e.lat.toFixed(6)}, ${e.lon?.toFixed(6)}` : '❌ Sin GPS'}`);
                if (e.speed) console.log(`   Velocidad: ${e.speed.toFixed(1)} km/h`);
                idx++;
            });
        }
        
        // Preguntar si guardar
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                          💾 GUARDAR EN BD                                  ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
        
        console.log(`📊 Se detectaron ${eventos.length} eventos.`);
        console.log(`   Por tipo:`, porTipo);
        console.log(`   Por severidad:`, porSeveridad);
        console.log(`\n💡 Para guardar en BD, ejecutar:`);
        console.log(`   const guardados = await eventDetectorV2.guardarEventosV2(eventos);`);
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();

