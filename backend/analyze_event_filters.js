const { PrismaClient } = require('@prisma/client');

async function analyzeEventFilters() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Análisis detallado de filtros de eventos\n');
        
        // Obtener la última sesión
        const session = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        if (!session) {
            console.log('❌ No hay sesiones');
            return;
        }
        
        console.log('📊 Sesión:', session.id, 'Vehículo:', session.vehicleId);
        
        // Contar datos por tipo
        const [stabilityCount, gpsCount, canCount] = await Promise.all([
            prisma.stabilityData.count({ where: { sessionId: session.id } }),
            prisma.gPSData.count({ where: { sessionId: session.id } }),
            prisma.cANData.count({ where: { sessionId: session.id } })
        ]);
        
        console.log('📈 Datos disponibles:');
        console.log('   - Stability:', stabilityCount);
        console.log('   - GPS:', gpsCount);
        console.log('   - CAN:', canCount);
        
        // Analizar puntos críticos de estabilidad
        const criticalStability = await prisma.stabilityData.findMany({
            where: {
                sessionId: session.id,
                si: { lt: 0.5 }
            },
            take: 10,
            orderBy: { timestamp: 'asc' }
        });
        
        console.log('\n🎯 Puntos con SI < 50%:', criticalStability.length);
        
        if (criticalStability.length === 0) {
            console.log('❌ No hay puntos críticos para procesar');
            return;
        }
        
        let validEvents = 0;
        let filteredByGPS = 0;
        let filteredByCAN = 0;
        let filteredByRPM = 0;
        let filteredByRotativo = 0;
        let filteredBySpeed = 0;
        
        // Analizar cada punto crítico
        console.log('\n🔬 Análisis detallado de puntos críticos:');
        
        for (let i = 0; i < Math.min(5, criticalStability.length); i++) {
            const point = criticalStability[i];
            console.log(`\n--- Punto ${i + 1} ---`);
            console.log('Timestamp:', point.timestamp);
            console.log('SI:', (point.si * 100).toFixed(1) + '%');
            console.log('Roll:', point.roll.toFixed(2) + '°');
            console.log('AY:', point.ay.toFixed(2) + ' m/s²');
            
            // Buscar GPS cercano
            const targetTime = new Date(point.timestamp);
            const gpsNear = await prisma.gPSData.findMany({
                where: {
                    sessionId: session.id,
                    timestamp: {
                        gte: new Date(targetTime.getTime() - 5000),
                        lte: new Date(targetTime.getTime() + 5000)
                    }
                },
                take: 1,
                orderBy: { timestamp: 'asc' }
            });
            
            if (gpsNear.length === 0) {
                console.log('❌ No se encontró GPS cercano');
                filteredByGPS++;
                continue;
            }
            
            const gps = gpsNear[0];
            console.log('GPS encontrado:', gps.latitude.toFixed(6), gps.longitude.toFixed(6), 'Speed:', gps.speed || 'N/A');
            
            // Buscar CAN cercano
            const canNear = await prisma.cANData.findMany({
                where: {
                    sessionId: session.id,
                    timestamp: {
                        gte: new Date(targetTime.getTime() - 5000),
                        lte: new Date(targetTime.getTime() + 5000)
                    }
                },
                take: 1,
                orderBy: { timestamp: 'asc' }
            });
            
            if (canNear.length === 0) {
                console.log('❌ No se encontró CAN cercano');
                filteredByCAN++;
                continue;
            }
            
            const can = canNear[0];
            console.log('CAN encontrado:', 'RPM:', can.engineRPM, 'Speed:', can.vehicleSpeed, 'Rotativo:', can.rotativo);
            
            // Verificar filtros uno por uno
            const motorOn = can.engineRPM > 0;
            const rotativoActive = can.rotativo;
            const minSpeed = (gps.speed || 0) >= 5;
            
            console.log('🔍 Verificación de filtros:');
            console.log('   - Motor encendido (RPM > 0):', motorOn ? '✅' : '❌', `(${can.engineRPM})`);
            console.log('   - Rotativo activo:', rotativoActive ? '✅' : '❌');
            console.log('   - Velocidad mínima (≥5):', minSpeed ? '✅' : '❌', `(${gps.speed || 0})`);
            
            if (!motorOn) {
                filteredByRPM++;
                console.log('🚫 Filtrado por RPM = 0');
                continue;
            }
            
            if (!rotativoActive) {
                filteredByRotativo++;
                console.log('🚫 Filtrado por rotativo = false');
                continue;
            }
            
            if (!minSpeed) {
                filteredBySpeed++;
                console.log('🚫 Filtrado por velocidad < 5');
                continue;
            }
            
            validEvents++;
            console.log('🎉 Este punto DEBERÍA generar evento');
            
            // Detectar causa
            const roll = Math.abs(point.roll);
            const ay = Math.abs(point.ay);
            const yawRate = Math.abs(point.gz);
            
            let cause = 'sin_causa_clara';
            if (roll > 5 && ay < 0.5) {
                cause = 'pendiente_lateral';
            } else if (ay > 1.5 && yawRate > 0.1 && roll < 5) {
                cause = 'curva_brusca';
            } else if (roll > 8 && ay < 0.5) {
                cause = 'terreno_irregular';
            }
            
            console.log('📋 Causa detectada:', cause);
        }
        
        console.log('\n📊 RESUMEN DE FILTRADO:');
        console.log('   - Puntos analizados:', Math.min(5, criticalStability.length));
        console.log('   - Filtrados por GPS:', filteredByGPS);
        console.log('   - Filtrados por CAN:', filteredByCAN);
        console.log('   - Filtrados por RPM = 0:', filteredByRPM);
        console.log('   - Filtrados por rotativo = false:', filteredByRotativo);
        console.log('   - Filtrados por velocidad < 5:', filteredBySpeed);
        console.log('   - Eventos válidos:', validEvents);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeEventFilters(); 