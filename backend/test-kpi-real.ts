/**
 * TEST REAL DE kpiCalculator
 * Verifica que devuelve quality y por_tipo
 */

import { PrismaClient } from '@prisma/client';
import { kpiCalculator } from './src/services/kpiCalculator';
import { createLogger } from './src/utils/logger';

const prisma = new PrismaClient();
const logger = createLogger('TestKPICalculator');

async function testKPICalculator() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST DIRECTO DE kpiCalculator');
    console.log('='.repeat(80) + '\n');

    try {
        // Obtener organizationId real
        const session = await prisma.session.findFirst({
            select: { id: true, organizationId: true, vehicleId: true, startTime: true }
        });

        if (!session) {
            console.log('❌ No hay sesiones en la BD');
            return;
        }

        console.log(`📍 Sesión de prueba:`);
        console.log(`   ID: ${session.id}`);
        console.log(`   OrganizationId: ${session.organizationId}`);
        console.log(`   VehícleId: ${session.vehicleId}`);
        console.log(`   Fecha: ${session.startTime.toISOString().split('T')[0]}\n`);

        console.log('⏳ Llamando a kpiCalculator.calcularKPIsCompletos()...\n');

        const startTime = Date.now();
        const result = await kpiCalculator.calcularKPIsCompletos({
            organizationId: session.organizationId
        });
        const duration = Date.now() - startTime;

        console.log(`✅ Ejecutado en ${duration}ms\n`);

        console.log('─'.repeat(80));
        console.log('📊 RESULTADO:\n');

        // States
        console.log(`✅ states:`);
        console.log(`   total_time: ${result.states?.total_time_formatted || 'undefined'}`);
        if (result.states?.states) {
            result.states.states.forEach((s: any) => {
                console.log(`   Clave ${s.key} (${s.name}): ${s.duration_formatted}`);
            });
        }

        // Activity
        console.log(`\n✅ activity:`);
        console.log(`   km_total: ${result.activity?.km_total || 'undefined'}`);
        console.log(`   driving_hours: ${result.activity?.driving_hours_formatted || 'undefined'}`);
        console.log(`   rotativo_on: ${result.activity?.rotativo_on_formatted || 'undefined'} (${result.activity?.rotativo_on_percentage || 0}%)`);

        // Stability
        console.log(`\n✅ stability:`);
        console.log(`   total_incidents: ${result.stability?.total_incidents || 'undefined'}`);
        console.log(`   critical: ${result.stability?.critical || 0}`);
        console.log(`   moderate: ${result.stability?.moderate || 0}`);
        console.log(`   light: ${result.stability?.light || 0}`);
        console.log(`   por_tipo: ${result.stability?.por_tipo ? 'EXISTE ✅' : 'undefined ❌'}`);

        if (result.stability?.por_tipo) {
            console.log(`\n   📊 Eventos por tipo:`);
            Object.entries(result.stability.por_tipo).forEach(([tipo, count]) => {
                console.log(`      ${tipo}: ${count}`);
            });
        }

        // Quality (ÍNDICE SI)
        console.log(`\n${result.quality ? '✅' : '❌'} quality: ${result.quality ? 'EXISTE' : 'undefined'}`);

        if (result.quality) {
            console.log(`   indice_promedio: ${result.quality.indice_promedio}`);
            console.log(`   calificacion: ${result.quality.calificacion}`);
            console.log(`   estrellas: ${result.quality.estrellas}`);
            console.log(`   total_muestras: ${result.quality.total_muestras}`);
        } else {
            console.log(`   ⚠️  PROBLEMA: quality no se está calculando`);
        }

        // Metadata
        console.log(`\n✅ metadata:`);
        console.log(`   sesiones_analizadas: ${result.metadata?.sesiones_analizadas || 'undefined'}`);
        console.log(`   cobertura_gps: ${result.metadata?.cobertura_gps || 'undefined'}%`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ TEST COMPLETADO');
        console.log('='.repeat(80) + '\n');

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testKPICalculator().catch((err: any) => console.error(err));

