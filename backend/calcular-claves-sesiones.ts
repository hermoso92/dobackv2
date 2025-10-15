/**
 * CALCULAR CLAVES OPERACIONALES PARA SESIONES EXISTENTES
 */

import { PrismaClient } from '@prisma/client';
import { OperationalKeyCalculator } from './src/services/OperationalKeyCalculator';

const prisma = new PrismaClient();

async function calcularClavesParaSesiones() {
    console.log('\n🔑 CALCULANDO CLAVES OPERACIONALES PARA SESIONES EXISTENTES\n');

    try {
        // Obtener sesiones del último mes
        const sesiones = await prisma.session.findMany({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
                startTime: {
                    gte: new Date('2025-10-01')
                }
            },
            include: {
                vehicle: true
            },
            take: 20,
            orderBy: {
                startTime: 'desc'
            }
        });

        console.log(`📊 Sesiones encontradas: ${sesiones.length}\n`);

        let clavesCalculadas = 0;

        for (const sesion of sesiones) {
            console.log(`\n📍 Procesando sesión ${sesion.id.substring(0, 8)}...`);
            console.log(`   Vehículo: ${sesion.vehicle.name || sesion.vehicle.identifier}`);
            console.log(`   Fecha: ${sesion.startTime.toISOString().substring(0, 19)}`);

            try {
                // Usar OperationalKeyCalculator para calcular claves
                const calculator = new OperationalKeyCalculator();
                const claveIds = await calculator.calcularClavesOperacionales(sesion.id);

                console.log(`   ✅ ${claveIds.length} claves calculadas`);
                clavesCalculadas += claveIds.length;

                // Obtener las claves creadas para mostrar resumen
                if (claveIds.length > 0) {
                    const clavesCreadas = await prisma.operationalKey.findMany({
                        where: {
                            id: { in: claveIds }
                        }
                    });

                    const resumen: Record<number, number> = {};
                    clavesCreadas.forEach(c => {
                        if (!resumen[c.keyType]) resumen[c.keyType] = 0;
                        resumen[c.keyType]++;
                    });

                    const resumenTexto = Object.entries(resumen)
                        .map(([tipo, cantidad]) => `Clave ${tipo}: ${cantidad}`)
                        .join(', ');

                    console.log(`   📋 ${resumenTexto}`);
                }

            } catch (error: any) {
                console.log(`   ⚠️  Error: ${error.message}`);
            }
        }

        console.log(`\n========================================`);
        console.log(`✅ COMPLETADO`);
        console.log(`   Total sesiones procesadas: ${sesiones.length}`);
        console.log(`   Total claves calculadas: ${clavesCalculadas}`);
        console.log(`========================================\n`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

calcularClavesParaSesiones().catch(console.error);

