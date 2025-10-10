const { PrismaClient } = require('@prisma/client');

async function manualEventTest() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🧪 Test manual de generación de eventos\n');
        
        // 1. Obtener la última sesión
        const session = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        if (!session) {
            console.log('❌ No hay sesiones');
            return;
        }
        
        console.log('📊 Sesión:', session.id);
        console.log('📊 Vehículo:', session.vehicleId);
        
        // 2. Obtener todos los datos necesarios
        const [stabilityData, gpsData, canData] = await Promise.all([
            prisma.stabilityData.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.gPSData.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.cANData.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' }
            })
        ]);
        
        console.log('📈 Datos cargados:');
        console.log('   - Stability:', stabilityData.length);
        console.log('   - GPS:', gpsData.length);
        console.log('   - CAN:', canData.length);
        
        // 3. Filtrar puntos críticos (SI < 50%)
        const criticalPoints = stabilityData.filter(point => {
            const si = point.si;
            return typeof si === 'number' && !isNaN(si) && si >= 0 && si <= 1 && si < 0.5;
        });
        
        console.log('\n🎯 Puntos críticos (SI < 50%):', criticalPoints.length);
        
        if (criticalPoints.length === 0) {
            console.log('❌ No hay puntos críticos, no se pueden generar eventos');
            return;
        }
        
        // 4. Crear mapas para búsqueda rápida
        const gpsMap = new Map();
        gpsData.forEach(p => gpsMap.set(p.timestamp.toISOString(), p));
        
        const canMap = new Map();
        canData.forEach(p => canMap.set(p.timestamp.toISOString(), p));
        
        console.log('\n🔍 Analizando primeros 3 puntos críticos...');
        
        let validEvents = 0;
        let filteredEvents = 0;
        
        // 5. Analizar los primeros puntos críticos
        for (let i = 0; i < Math.min(3, criticalPoints.length); i++) {
            const point = criticalPoints[i];
            
            console.log(`\n--- Punto ${i + 1} ---`);
            console.log('Timestamp:', point.timestamp.toISOString());
            console.log('SI:', (point.si * 100).toFixed(1) + '%');
            console.log('Roll:', point.roll?.toFixed(2) + '°');
            console.log('AY:', point.ay?.toFixed(2) + ' m/s²');
            
            // Buscar GPS exacto o cercano
            const pointTime = point.timestamp.getTime();
            let gps = gpsMap.get(point.timestamp.toISOString());
            
            if (!gps) {
                // Buscar GPS cercano (±5 segundos)
                for (const [timestamp, gpsPoint] of gpsMap) {
                    const gpsTime = new Date(timestamp).getTime();
                    const diff = Math.abs(pointTime - gpsTime);
                    if (diff < 5000) {
                        gps = gpsPoint;
                        console.log('GPS cercano encontrado (diff:', diff + 'ms)');
                        break;
                    }
                }
            } else {
                console.log('GPS exacto encontrado');
            }
            
            if (!gps) {
                console.log('❌ Sin GPS - FILTRADO');
                filteredEvents++;
                continue;
            }
            
            console.log('GPS:', gps.latitude.toFixed(6), gps.longitude.toFixed(6));
            console.log('Velocidad GPS:', gps.speed || 'N/A');
            
            // Buscar CAN exacto o cercano
            let can = canMap.get(point.timestamp.toISOString());
            
            if (!can) {
                // Buscar CAN cercano (±5 segundos)
                for (const [timestamp, canPoint] of canMap) {
                    const canTime = new Date(timestamp).getTime();
                    const diff = Math.abs(pointTime - canTime);
                    if (diff < 5000) {
                        can = canPoint;
                        console.log('CAN cercano encontrado (diff:', diff + 'ms)');
                        break;
                    }
                }
            } else {
                console.log('CAN exacto encontrado');
            }
            
            if (!can) {
                console.log('❌ Sin CAN - FILTRADO');
                filteredEvents++;
                continue;
            }
            
            console.log('CAN RPM:', can.engineRPM);
            console.log('CAN Rotativo:', can.rotativo);
            console.log('CAN Speed:', can.vehicleSpeed);
            
            // Verificar filtros
            const motorOn = can.engineRPM > 0;
            const rotativoActive = can.rotativo;
            const minSpeed = (gps.speed || 0) >= 5;
            
            console.log('\n🔍 Verificando filtros:');
            console.log('   - Motor encendido (RPM > 0):', motorOn ? '✅' : '❌');
            console.log('   - Rotativo activo:', rotativoActive ? '✅' : '❌');
            console.log('   - Velocidad mínima (≥5):', minSpeed ? '✅' : '❌');
            
            if (!motorOn || !rotativoActive || !minSpeed) {
                console.log('🚫 FILTRADO por contexto');
                filteredEvents++;
                continue;
            }
            
            console.log('🎉 EVENTO VÁLIDO - debería generarse');
            validEvents++;
        }
        
        console.log('\n📊 RESUMEN:');
        console.log('   - Puntos críticos totales:', criticalPoints.length);
        console.log('   - Eventos válidos (primeros 3):', validEvents);
        console.log('   - Eventos filtrados (primeros 3):', filteredEvents);
        
        // 6. Si hay eventos válidos, probar generación real
        if (validEvents > 0) {
            console.log('\n🚀 Probando generación real de eventos...');
            
            // Importar y ejecutar el generador real
            const StabilityEventService = require('./src/services/StabilityEventService.ts');
            
            if (StabilityEventService && StabilityEventService.generateStabilityEvents) {
                const events = StabilityEventService.generateStabilityEvents(
                    stabilityData,
                    gpsData,
                    canData,
                    session.id
                );
                
                console.log('✅ Eventos generados:', events.length);
                
                if (events.length > 0) {
                    console.log('📋 Primer evento:');
                    console.log('   - Nivel:', events[0].level);
                    console.log('   - Tipos:', events[0].tipos);
                    console.log('   - SI%:', events[0].perc);
                }
            }
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

manualEventTest(); 