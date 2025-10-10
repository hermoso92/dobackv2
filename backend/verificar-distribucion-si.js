/**
 * Verificar distribución del índice SI en los datos reales
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDistribucionSI() {
    console.log('\n🔍 VERIFICANDO DISTRIBUCIÓN DEL ÍNDICE SI\n');
    
    // Obtener todas las mediciones de estabilidad
    const total = await prisma.stabilityMeasurement.count();
    console.log(`📊 Total muestras: ${total.toLocaleString()}\n`);
    
    // Contar por rangos de SI
    const rangos = [
        { min: 0, max: 0.10, label: 'SI < 10% (CRÍTICO)' },
        { min: 0.10, max: 0.20, label: 'SI 10-20% (MUY MALO)' },
        { min: 0.20, max: 0.30, label: 'SI 20-30% (MALO)' },
        { min: 0.30, max: 0.40, label: 'SI 30-40% (REGULAR)' },
        { min: 0.40, max: 0.50, label: 'SI 40-50% (ACEPTABLE)' },
        { min: 0.50, max: 0.60, label: 'SI 50-60% (BUENO)' },
        { min: 0.60, max: 0.70, label: 'SI 60-70% (MUY BUENO)' },
        { min: 0.70, max: 0.80, label: 'SI 70-80% (EXCELENTE)' },
        { min: 0.80, max: 0.90, label: 'SI 80-90% (ÓPTIMO)' },
        { min: 0.90, max: 1.00, label: 'SI 90-100% (PERFECTO)' }
    ];
    
    console.log('📊 DISTRIBUCIÓN POR RANGOS:\n');
    
    for (const rango of rangos) {
        const count = await prisma.stabilityMeasurement.count({
            where: {
                si: {
                    gte: rango.min,
                    lt: rango.max
                }
            }
        });
        
        const porcentaje = (count / total * 100).toFixed(2);
        const barra = '█'.repeat(Math.floor(porcentaje / 2));
        
        console.log(`${rango.label.padEnd(25)} ${count.toLocaleString().padStart(10)} (${porcentaje.padStart(6)}%) ${barra}`);
    }
    
    // Contar específicamente SI < 50%
    const menoresCincuenta = await prisma.stabilityMeasurement.count({
        where: { si: { lt: 0.50 } }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 TOTAL CON SI < 50%: ${menoresCincuenta.toLocaleString()} (${(menoresCincuenta / total * 100).toFixed(2)}%)`);
    console.log('='.repeat(80));
    
    // Calcular promedio real
    const resultado = await prisma.$queryRaw`
        SELECT 
            AVG(si) as promedio,
            MIN(si) as minimo,
            MAX(si) as maximo,
            STDDEV(si) as desviacion
        FROM "StabilityMeasurement"
    `;
    
    console.log('\n📊 ESTADÍSTICAS SI:');
    console.log(`   Promedio: ${(resultado[0].promedio * 100).toFixed(2)}%`);
    console.log(`   Mínimo: ${(resultado[0].minimo * 100).toFixed(2)}%`);
    console.log(`   Máximo: ${(resultado[0].maximo * 100).toFixed(2)}%`);
    console.log(`   Desv. Est: ${(resultado[0].desviacion * 100).toFixed(2)}%`);
    
    console.log('\n💡 INTERPRETACIÓN:');
    console.log(`   - ${menoresCincuenta.toLocaleString()} muestras con SI < 50%`);
    console.log(`   - 1,853 eventos detectados`);
    
    if (menoresCincuenta > 0) {
        const razon = menoresCincuenta / 1853;
        console.log(`   - Ratio: ${razon.toFixed(1)} muestras por evento`);
        
        if (razon < 1) {
            console.log('\n⚠️ PROBLEMA: Más eventos que muestras con SI < 50%');
        } else if (razon > 100) {
            console.log('\n⚠️ PROBLEMA: Muy pocos eventos detectados (umbrales muy estrictos)');
        } else {
            console.log('\n✅ RATIO REALISTA: Eventos correctos');
        }
    }
    
    await prisma.$disconnect();
}

verificarDistribucionSI().catch(console.error);

