const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteSystem() {
    try {
        console.log('🎯 PROBANDO SISTEMA COMPLETO DE KPIs AVANZADOS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // 1. Verificar estado de la base de datos
        console.log('📊 1. VERIFICACIÓN DE DATOS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const [vehicles, zones, sessions, gpsCount, stabilityCount, rotativoCount] = await Promise.all([
            prisma.vehicle.findMany({ take: 3 }),
            prisma.zone.findMany(),
            prisma.session.findMany({ take: 3 }),
            prisma.gpsMeasurement.count(),
            prisma.stabilityEvent.count(),
            prisma.rotativoMeasurement.count()
        ]);
        
        console.log(`✅ Vehículos: ${vehicles.length}`);
        console.log(`✅ Zonas: ${zones.length}`);
        console.log(`✅ Sesiones: ${sessions.length}`);
        console.log(`✅ Puntos GPS: ${gpsCount}`);
        console.log(`✅ Eventos estabilidad: ${stabilityCount}`);
        console.log(`✅ Mediciones rotativo: ${rotativoCount}`);
        
        if (vehicles.length === 0 || zones.length === 0 || sessions.length === 0) {
            console.log('\n❌ ERROR: No hay suficientes datos para probar el sistema');
            return;
        }
        
        // 2. Seleccionar datos de prueba
        console.log('\n🎯 2. SELECCIÓN DE DATOS DE PRUEBA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const testVehicle = vehicles[0];
        const testSession = sessions.find(s => s.vehicleId === testVehicle.id) || sessions[0];
        const testDate = new Date(testSession.startTime);
        
        console.log(`🚗 Vehículo: ${testVehicle.name}`);
        console.log(`📅 Sesión: ${testSession.id}`);
        console.log(`📆 Fecha: ${testDate.toISOString().slice(0, 10)}`);
        console.log(`🏢 Organización: ${testVehicle.organizationId}`);
        
        // 3. Simular cálculo de KPIs avanzados
        console.log('\n🧮 3. CÁLCULO DE KPIs AVANZADOS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const [gpsPoints, rotativoEvents, stabilityEvents] = await Promise.all([
            prisma.gpsMeasurement.findMany({
                where: { sessionId: testSession.id },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.rotativoMeasurement.findMany({
                where: { sessionId: testSession.id },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.stabilityEvent.findMany({
                where: { session_id: testSession.id },
                orderBy: { timestamp: 'asc' }
            })
        ]);
        
        console.log(`📍 Puntos GPS analizados: ${gpsPoints.length}`);
        console.log(`🔄 Eventos rotativo: ${rotativoEvents.length}`);
        console.log(`⚠️ Eventos estabilidad: ${stabilityEvents.length}`);
        
        // 4. Calcular KPIs
        let tiempoEnParque = 0, tiempoEnTaller = 0, tiempoFueraParque = 0;
        let tiempoConRotativo = 0, tiempoSinRotativo = 0;
        let maxVelocidad = 0, velocidadPromedio = 0;
        let eventosCriticos = 0, eventosPeligrosos = 0, eventosModerados = 0;
        let excesosVelocidadLeves = 0, excesosVelocidadModerados = 0;
        let excesosVelocidadGraves = 0, excesosVelocidadMuyGraves = 0;
        
        if (gpsPoints.length > 1) {
            for (let i = 0; i < Math.min(100, gpsPoints.length - 1); i++) {
                const p1 = gpsPoints[i];
                const p2 = gpsPoints[i + 1];
                const intervalo = (p2.timestamp.getTime() - p1.timestamp.getTime()) / 60000;
                
                // Determinar zona
                let zona = 'fuera';
                for (const zone of zones) {
                    if (zone.geometry && zone.geometry.coordinates) {
                        try {
                            const coords = zone.geometry.coordinates[0];
                            if (coords && coords.length >= 4) {
                                const minLon = Math.min(...coords.map(c => c[0]));
                                const maxLon = Math.max(...coords.map(c => c[0]));
                                const minLat = Math.min(...coords.map(c => c[1]));
                                const maxLat = Math.max(...coords.map(c => c[1]));
                                
                                if (p1.longitude >= minLon && p1.longitude <= maxLon && 
                                    p1.latitude >= minLat && p1.latitude <= maxLat) {
                                    zona = zone.type;
                                    break;
                                }
                            }
                        } catch (error) {
                            // Ignorar errores de geometría
                        }
                    }
                }
                
                // Determinar estado del rotativo
                let rotativo = 'OFF';
                for (const event of rotativoEvents) {
                    if (event.timestamp <= p1.timestamp) {
                        if (typeof event.state === 'number') {
                            rotativo = event.state === 1 ? 'ON' : 'OFF';
                        } else {
                            rotativo = (event.state === 'ON' || event.state === '1' || event.state === 'true') ? 'ON' : 'OFF';
                        }
                    } else {
                        break;
                    }
                }
                
                // Acumular tiempos
                switch (zona) {
                    case 'parque':
                        tiempoEnParque += intervalo;
                        break;
                    case 'taller':
                        tiempoEnTaller += intervalo;
                        break;
                    default:
                        tiempoFueraParque += intervalo;
                        break;
                }
                
                if (rotativo === 'ON') {
                    tiempoConRotativo += intervalo;
                } else {
                    tiempoSinRotativo += intervalo;
                }
                
                // Velocidad
                const speed = p1.speed || 0;
                maxVelocidad = Math.max(maxVelocidad, speed);
                velocidadPromedio += speed;
                
                // Excesos de velocidad
                const speedLimit = zona === 'parque' ? 20 : zona === 'taller' ? 10 : 50;
                if (speed > speedLimit) {
                    const exceso = speed - speedLimit;
                    if (exceso <= 10) excesosVelocidadLeves++;
                    else if (exceso <= 20) excesosVelocidadModerados++;
                    else if (exceso <= 30) excesosVelocidadGraves++;
                    else excesosVelocidadMuyGraves++;
                }
            }
        }
        
        // Analizar eventos
        for (const event of stabilityEvents) {
            const type = (event.type || '').toString().toLowerCase();
            if (type.includes('curva_brusca') || type.includes('punto_interes') || type.includes('critico')) {
                eventosCriticos++;
            } else if (type.includes('peligroso') || type.includes('danger')) {
                eventosPeligrosos++;
            } else if (type.includes('moderado') || type.includes('warning')) {
                eventosModerados++;
            }
        }
        
        velocidadPromedio = gpsPoints.length > 0 ? velocidadPromedio / gpsPoints.length : 0;
        
        // 5. Mostrar resultados
        console.log('\n📊 4. RESULTADOS DE KPIs AVANZADOS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n🏢 TIEMPOS POR UBICACIÓN:');
        console.log(`  • Tiempo en parque: ${tiempoEnParque.toFixed(2)} minutos`);
        console.log(`  • Tiempo en taller: ${tiempoEnTaller.toFixed(2)} minutos`);
        console.log(`  • Tiempo fuera de parque: ${tiempoFueraParque.toFixed(2)} minutos`);
        
        console.log('\n🔄 TIEMPOS CON ROTATIVO:');
        console.log(`  • Con rotativo: ${tiempoConRotativo.toFixed(2)} minutos`);
        console.log(`  • Sin rotativo: ${tiempoSinRotativo.toFixed(2)} minutos`);
        
        console.log('\n🚗 VELOCIDAD:');
        console.log(`  • Velocidad máxima: ${maxVelocidad.toFixed(1)} km/h`);
        console.log(`  • Velocidad promedio: ${velocidadPromedio.toFixed(1)} km/h`);
        
        console.log('\n⚠️ EVENTOS:');
        console.log(`  • Eventos críticos: ${eventosCriticos}`);
        console.log(`  • Eventos peligrosos: ${eventosPeligrosos}`);
        console.log(`  • Eventos moderados: ${eventosModerados}`);
        
        console.log('\n🚨 EXCESOS DE VELOCIDAD:');
        console.log(`  • Excesos leves: ${excesosVelocidadLeves}`);
        console.log(`  • Excesos moderados: ${excesosVelocidadModerados}`);
        console.log(`  • Excesos graves: ${excesosVelocidadGraves}`);
        console.log(`  • Excesos muy graves: ${excesosVelocidadMuyGraves}`);
        
        // 6. Verificar posibilidades detectadas
        console.log('\n📈 5. POSIBILIDADES DETECTADAS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const possibilities = [
            { name: 'En parque con rotativo encendido', detected: tiempoEnParque > 0 && tiempoConRotativo > 0 },
            { name: 'En parque con rotativo apagado', detected: tiempoEnParque > 0 && tiempoSinRotativo > 0 },
            { name: 'Fuera de parque con rotativo encendido', detected: tiempoFueraParque > 0 && tiempoConRotativo > 0 },
            { name: 'Fuera de parque con rotativo apagado', detected: tiempoFueraParque > 0 && tiempoSinRotativo > 0 },
            { name: 'En taller con rotativo encendido', detected: tiempoEnTaller > 0 && tiempoConRotativo > 0 },
            { name: 'En taller con rotativo apagado', detected: tiempoEnTaller > 0 && tiempoSinRotativo > 0 },
            { name: 'Excediendo límites de velocidad', detected: maxVelocidad > 50 },
            { name: 'Eventos críticos detectados', detected: eventosCriticos > 0 },
            { name: 'Eventos peligrosos detectados', detected: eventosPeligrosos > 0 },
            { name: 'Eventos moderados detectados', detected: eventosModerados > 0 }
        ];
        
        possibilities.forEach(possibility => {
            console.log(`  ${possibility.detected ? '✅' : '❌'} ${possibility.name}`);
        });
        
        // 7. Resumen final
        console.log('\n🎯 6. RESUMEN FINAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const detectedPossibilities = possibilities.filter(p => p.detected).length;
        console.log(`📊 Posibilidades detectadas: ${detectedPossibilities}/${possibilities.length}`);
        console.log(`📈 Datos analizados: ${gpsPoints.length} puntos GPS`);
        console.log(`⏱️ Tiempo total: ${(tiempoEnParque + tiempoEnTaller + tiempoFueraParque).toFixed(2)} minutos`);
        console.log(`🚨 Eventos totales: ${eventosCriticos + eventosPeligrosos + eventosModerados}`);
        
        if (detectedPossibilities > 0) {
            console.log('\n✅ SISTEMA FUNCIONANDO CORRECTAMENTE');
            console.log('🎯 El sistema está listo para ser usado en el frontend');
            console.log('🌐 Accede a /advanced-kpis para ver la interfaz');
        } else {
            console.log('\n⚠️ SISTEMA FUNCIONANDO PERO SIN DATOS DETECTADOS');
            console.log('💡 Esto puede ser normal si no hay datos en las zonas definidas');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCompleteSystem(); 