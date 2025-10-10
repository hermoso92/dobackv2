const { PrismaClient } = require('@prisma/client');

async function quickAnalysis() {
    const prisma = new PrismaClient();
    
    try {
        // Obtener la última sesión
        const session = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        console.log('Sesión ID:', session.id);
        
        // Contar puntos críticos
        const criticalCount = await prisma.stabilityData.count({
            where: {
                sessionId: session.id,
                si: { lt: 0.5 }
            }
        });
        
        console.log('Puntos críticos (SI < 50%):', criticalCount);
        
        // Obtener un punto crítico de ejemplo
        const samplePoint = await prisma.stabilityData.findFirst({
            where: {
                sessionId: session.id,
                si: { lt: 0.5 }
            }
        });
        
        if (samplePoint) {
            console.log('Punto de ejemplo:');
            console.log('- Timestamp:', samplePoint.timestamp);
            console.log('- SI:', (samplePoint.si * 100).toFixed(1) + '%');
            
            // Buscar GPS cercano
            const targetTime = new Date(samplePoint.timestamp);
            const gpsNear = await prisma.gPSData.findFirst({
                where: {
                    sessionId: session.id,
                    timestamp: {
                        gte: new Date(targetTime.getTime() - 5000),
                        lte: new Date(targetTime.getTime() + 5000)
                    }
                }
            });
            
            if (gpsNear) {
                console.log('- GPS encontrado, speed:', gpsNear.speed);
            } else {
                console.log('- GPS NO encontrado');
            }
            
            // Buscar CAN cercano
            const canNear = await prisma.cANData.findFirst({
                where: {
                    sessionId: session.id,
                    timestamp: {
                        gte: new Date(targetTime.getTime() - 5000),
                        lte: new Date(targetTime.getTime() + 5000)
                    }
                }
            });
            
            if (canNear) {
                console.log('- CAN encontrado:');
                console.log('  RPM:', canNear.engineRPM);
                console.log('  Rotativo:', canNear.rotativo);
                console.log('  Speed:', canNear.vehicleSpeed);
            } else {
                console.log('- CAN NO encontrado');
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

quickAnalysis(); 