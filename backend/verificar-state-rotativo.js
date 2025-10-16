const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarState() {
    try {
        const registros = await prisma.rotativoMeasurement.findMany({
            where: {
                Session: {
                    organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
                }
            },
            take: 100,
            orderBy: {
                timestamp: 'asc'
            }
        });
        
        console.log('\n📊 Datos de Rotativo:\n');
        console.log(`Total registros: ${registros.length}`);
        
        const estadosUnicos = [...new Set(registros.map(r => r.state))];
        console.log(`\nEstados únicos encontrados: ${estadosUnicos.join(', ')}`);
        
        console.log('\nPrimeros 20 registros:');
        registros.slice(0, 20).forEach((r, i) => {
            console.log(`  ${i+1}. State: ${r.state} - ${r.timestamp.toISOString()}`);
        });
        
        // Contar cambios de estado
        let cambios = 0;
        for (let i = 1; i < Math.min(registros.length, 100); i++) {
            if (registros[i].state !== registros[i-1].state) {
                cambios++;
                if (cambios <= 5) {
                    console.log(`\n  🔄 Cambio #${cambios}: ${registros[i-1].state} → ${registros[i].state} (${registros[i].timestamp.toISOString()})`);
                }
            }
        }
        
        console.log(`\n  📊 Total cambios en primeros 100: ${cambios}\n`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarState().catch(console.error);

