const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTallerData() {
    try {
        console.log('Verificando datos de Clave 0 (Taller/Fuera de Servicio)...\n');

        // Contar mediciones con estado 0
        const totalClave0 = await prisma.$queryRaw`
            SELECT COUNT(*)::int as total
            FROM "RotativoMeasurement"
            WHERE state = '0'
        `;
        
        console.log(`Total mediciones Clave 0: ${totalClave0[0].total}`);
        
        // Si hay mediciones, calcular duración total
        if (totalClave0[0].total > 0) {
            const sesionesConClave0 = await prisma.$queryRaw`
                SELECT 
                    "sessionId",
                    COUNT(*)::int as mediciones
                FROM "RotativoMeasurement"
                WHERE state = '0'
                GROUP BY "sessionId"
                ORDER BY mediciones DESC
                LIMIT 5
            `;
            
            console.log('\nSesiones con más tiempo en Clave 0:');
            sesionesConClave0.forEach((s, i) => {
                console.log(`  ${i+1}. Sesión ${s.sessionId}: ${s.mediciones} mediciones`);
            });
            
            console.log('\n❌ PROBLEMA: Hay datos de Clave 0 (Taller) cuando NO deberían existir');
            console.log('   Esto indica que los archivos fuente tienen estado 0');
            console.log('   Solución: Filtrar estado 0 en el cálculo de KPIs\n');
        } else {
            console.log('\n✅ OK: No hay mediciones de Clave 0');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTallerData();

