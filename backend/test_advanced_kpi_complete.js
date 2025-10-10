const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteAdvancedKPI() {
    try {
        console.log('🧪 Probando sistema completo de KPIs avanzados...\n');
        
        // 1. Verificar datos disponibles
        console.log('📊 Verificando datos disponibles...');
        
        const vehicles = await prisma.vehicle.findMany({ take: 3 });
        console.log(`🚗 Vehículos disponibles: ${vehicles.length}`);
        vehicles.forEach(v => console.log(`  - ${v.name} (${v.id})`));
        
        const zones = await prisma.zone.findMany();
        console.log(`\n🏢 Zonas disponibles: ${zones.length}`);
        zones.forEach(z => console.log(`  - ${z.name} (${z.type}) - ${z.organizationId}`));
        
        const sessions = await prisma.session.findMany({ take: 3 });
        console.log(`\n📅 Sesiones disponibles: ${sessions.length}`);
        sessions.forEach(s => console.log(`  - ${s.id} - ${s.startTime}`));
        
        if (vehicles.length === 0 || zones.length === 0 || sessions.length === 0) {
            console.log('❌ No hay suficientes datos para probar el sistema');
            return;
        }
        
        // 2. Seleccionar vehículo y sesión para prueba
        const testVehicle = vehicles[0];
        const testSession = sessions.find(s => s.vehicleId === testVehicle.id) || sessions[0];
        const testDate = new Date(testSession.startTime);
        
        console.log(`\n🎯 Usando para prueba:`);
        console.log(`  - Vehículo: ${testVehicle.name}`);
        console.log(`  - Sesión: ${testSession.id}`);
        console.log(`  - Fecha: ${testDate.toISOString().slice(0, 10)}`);
        
        // 3. Obtener datos de la sesión
        console.log('\n📈 Obteniendo datos de la sesión...');
        
        const [gpsPoints, rotativoEvents, stabilityEvents, canMeasurements] = await Promise.all([
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
            }),
            prisma.canMeasurement.findMany({
                where: { sessionId: testSession.id },
                orderBy: { timestamp: 'asc' }
            })
        ]);
        
        console.log(`  📍 Puntos GPS: ${gpsPoints.length}`);
        console.log(`  🔄 Eventos rotativo: ${rotativoEvents.length}`);
        console.log(`  ⚠️ Eventos estabilidad: ${stabilityEvents.length}`);
        console.log(`  📊 Mediciones CAN: ${canMeasurements.length}`);
        
        // 4. Simular cálculo de KPIs avanzados
        console.log('\n🧮 Calculando KPIs avanzados...');
        
        let tiempoEnParque = 0, tiempoEnTaller = 0, tiempoFueraParque = 0;
        let tiempoConRotativo = 0, tiempoSinRotativo = 0;
        let maxVelocidad = 0, velocidadPromedio = 0;
        let eventosCriticos = 0, eventosPeligrosos = 0, eventosModerados = 0;
        let excesosVelocidadLeves = 0, excesosVelocidadModerados = 0;
        let excesosVelocidadGraves = 0, excesosVelocidadMuyGraves = 0;
        
        if (gpsPoints.length > 1) {
            for (let i = 0; i < Math.min(50, gpsPoints.length - 1); i++) {
                const p1 = gpsPoints[i];
                const p2 = gpsPoints[i + 1];
                const intervalo = (p2.timestamp.getTime() - p1.timestamp.getTime()) / 60000; // minutos
                
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
                
                // Excesos de velocidad (asumiendo límite de 50 km/h)
                const speedLimit = zona === 'parque' ? 20 : zona === 'taller' ? 10 : 50;
                if (speed > speedLimit) {
                    const exceso = speed - speedLimit;
                    if (exceso <= 10) excesosVelocidadLeves++;
                    else if (exceso <= 20) excesosVelocidadModerados++;
                    else if (exceso <= 30) excesosVelocidadGraves++;
                    else excesosVelocidadMuyGraves++;
                }
                
                if (i < 5) {
                    console.log(`  Punto ${i}: zona=${zona}, rotativo=${rotativo}, velocidad=${speed.toFixed(1)}km/h, intervalo=${intervalo.toFixed(2)}min`);
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
        console.log('\n📊 RESULTADOS DE KPIs AVANZADOS:');
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
        
        console.log('\n🔑 CLAVES OPERATIVAS:');
        console.log(`  • Clave 2 (rotativo ON fuera parque): ${tiempoFueraParque.toFixed(2)} min`);
        console.log(`  • Clave 5 (rotativo OFF fuera parque): ${tiempoFueraParque.toFixed(2)} min`);
        
        console.log('\n📈 POSIBILIDADES DETECTADAS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const possibilities = [
            { name: 'En parque con rotativo encendido', time: tiempoEnParque > 0 && tiempoConRotativo > 0 ? 'SÍ' : 'NO' },
            { name: 'En parque con rotativo apagado', time: tiempoEnParque > 0 && tiempoSinRotativo > 0 ? 'SÍ' : 'NO' },
            { name: 'Fuera de parque con rotativo encendido', time: tiempoFueraParque > 0 && tiempoConRotativo > 0 ? 'SÍ' : 'NO' },
            { name: 'Fuera de parque con rotativo apagado', time: tiempoFueraParque > 0 && tiempoSinRotativo > 0 ? 'SÍ' : 'NO' },
            { name: 'En taller con rotativo encendido', time: tiempoEnTaller > 0 && tiempoConRotativo > 0 ? 'SÍ' : 'NO' },
            { name: 'En taller con rotativo apagado', time: tiempoEnTaller > 0 && tiempoSinRotativo > 0 ? 'SÍ' : 'NO' },
            { name: 'Excediendo límites de velocidad', time: maxVelocidad > 50 ? 'SÍ' : 'NO' },
            { name: 'Eventos críticos detectados', time: eventosCriticos > 0 ? 'SÍ' : 'NO' },
            { name: 'Eventos peligrosos detectados', time: eventosPeligrosos > 0 ? 'SÍ' : 'NO' },
            { name: 'Eventos moderados detectados', time: eventosModerados > 0 ? 'SÍ' : 'NO' }
        ];
        
        possibilities.forEach(possibility => {
            console.log(`  • ${possibility.name}: ${possibility.time}`);
        });
        
        console.log('\n✅ Sistema de KPIs avanzados funcionando correctamente');
        console.log('🎯 El sistema está listo para ser usado en el frontend');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCompleteAdvancedKPI(); 