const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticarCondiciones() {
    const sessionId = 'aa25d38e-1023-4937-a7fa-cc09369daf5e';
    
    console.log('=== DIAGNÓSTICO DE CONDICIONES PARA EVENTOS ===\n');
    
    // 1. Obtener todos los datos
    const [stabilityData, gpsData, canData] = await Promise.all([
        prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        }),
        prisma.gpsData.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        }),
        prisma.canData.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        })
    ]);
    
    console.log(`📊 Datos disponibles:`);
    console.log(`- Estabilidad: ${stabilityData.length} puntos`);
    console.log(`- GPS: ${gpsData.length} puntos`);
    console.log(`- CAN: ${canData.length} puntos\n`);
    
    // 2. Filtro inicial: SI < 60%
    const criticalPoints = stabilityData.filter(point => {
        const si = point.si;
        return typeof si === 'number' && !isNaN(si) && si >= 0 && si <= 1 && si < 0.6;
    });
    
    console.log(`🎯 Puntos con SI < 60%: ${criticalPoints.length} de ${stabilityData.length}`);
    console.log(`   - Filtrados por SI ≥ 60%: ${stabilityData.length - criticalPoints.length}\n`);
    
    // 3. Análisis detallado de condiciones
    let stats = {
        sinGPS: 0,
        sinCAN: 0,
        motorApagado: 0,
        rotativoFalso: 0,
        velocidadBaja: 0,
        validos: 0
    };
    
    // Crear mapas para búsqueda rápida
    const gpsMap = new Map();
    gpsData.forEach(gps => {
        gpsMap.set(gps.timestamp.toISOString(), gps);
    });
    
    const canMap = new Map();
    canData.forEach(can => {
        canMap.set(can.timestamp.toISOString(), can);
    });
    
    console.log('🔍 Analizando condiciones para los primeros 100 puntos críticos...\n');
    
    for (let i = 0; i < Math.min(criticalPoints.length, 100); i++) {
        const point = criticalPoints[i];
        const currentTime = new Date(point.timestamp).getTime();
        
        // Buscar GPS cercano
        let gps = gpsMap.get(point.timestamp.toISOString());
        if (!gps) {
            let closestGps = null;
            let minDiff = Infinity;
            for (const [timestamp, gpsPoint] of gpsMap) {
                const gpsTime = new Date(timestamp).getTime();
                const diff = Math.abs(currentTime - gpsTime);
                if (diff < minDiff && diff < 5000) {
                    minDiff = diff;
                    closestGps = gpsPoint;
                }
            }
            gps = closestGps;
        }
        
        if (!gps) {
            stats.sinGPS++;
            continue;
        }
        
        // Buscar CAN cercano
        let closestCan = null;
        let minCanDiff = Infinity;
        for (const [ts, canPoint] of canMap) {
            const diff = Math.abs(currentTime - new Date(ts).getTime());
            if (diff < minCanDiff && diff < 5000) {
                minCanDiff = diff;
                closestCan = canPoint;
            }
        }
        
        if (!closestCan) {
            stats.sinCAN++;
            continue;
        }
        
        // Verificar condiciones CAN
        if (closestCan.engineRPM === 0) {
            stats.motorApagado++;
            continue;
        }
        
        if (!closestCan.rotativo) {
            stats.rotativoFalso++;
            continue;
        }
        
        // Verificar velocidad
        const vehicleSpeed = gps.speed || 0;
        if (vehicleSpeed < 5) {
            stats.velocidadBaja++;
            continue;
        }
        
        stats.validos++;
        
        // Mostrar algunos ejemplos válidos
        if (stats.validos <= 5) {
            console.log(`✅ Punto válido ${stats.validos}:`);
            console.log(`   - SI: ${(point.si * 100).toFixed(1)}%`);
            console.log(`   - RPM: ${closestCan.engineRPM}`);
            console.log(`   - Velocidad: ${vehicleSpeed.toFixed(1)} km/h`);
            console.log(`   - Rotativo: ${closestCan.rotativo}`);
            console.log(`   - GPS diff: ${Math.abs(currentTime - new Date(gps.timestamp).getTime())}ms`);
            console.log(`   - CAN diff: ${Math.abs(currentTime - new Date(closestCan.timestamp).getTime())}ms\n`);
        }
    }
    
    console.log('📈 RESUMEN DE FILTROS:');
    console.log(`- Sin GPS correlacionado (±5s): ${stats.sinGPS}`);
    console.log(`- Sin CAN correlacionado (±5s): ${stats.sinCAN}`);
    console.log(`- Motor apagado (RPM = 0): ${stats.motorApagado}`);
    console.log(`- Rotativo = false: ${stats.rotativoFalso}`);
    console.log(`- Velocidad < 5 km/h: ${stats.velocidadBaja}`);
    console.log(`- ✅ VÁLIDOS: ${stats.validos}`);
    console.log(`- Total analizado: ${Math.min(criticalPoints.length, 100)}\n`);
    
    // 4. Análisis de rangos de tiempo
    if (stabilityData.length > 0 && gpsData.length > 0 && canData.length > 0) {
        const stabStart = new Date(stabilityData[0].timestamp);
        const stabEnd = new Date(stabilityData[stabilityData.length - 1].timestamp);
        const gpsStart = new Date(gpsData[0].timestamp);
        const gpsEnd = new Date(gpsData[gpsData.length - 1].timestamp);
        const canStart = new Date(canData[0].timestamp);
        const canEnd = new Date(canData[canData.length - 1].timestamp);
        
        console.log('⏰ RANGOS TEMPORALES:');
        console.log(`- Estabilidad: ${stabStart.toISOString()} → ${stabEnd.toISOString()}`);
        console.log(`- GPS: ${gpsStart.toISOString()} → ${gpsEnd.toISOString()}`);
        console.log(`- CAN: ${canStart.toISOString()} → ${canEnd.toISOString()}\n`);
    }
    
    await prisma.$disconnect();
}

diagnosticarCondiciones().catch(console.error); 