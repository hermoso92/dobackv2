/**
 * Analizar correlación entre estados ROTATIVO y movimiento GPS
 * Para determinar qué significa 0 y 1
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarCorrelacion() {
    console.log('\n🔍 ANÁLISIS DE CORRELACIÓN ROTATIVO-GPS\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    try {
        // Obtener sesión con ambos datos
        const sesion = await prisma.session.findFirst({
            where: {
                AND: [
                    { GpsMeasurement: { some: {} } },
                    { RotativoMeasurement: { some: {} } }
                ]
            },
            include: {
                GpsMeasurement: {
                    orderBy: { timestamp: 'asc' },
                    select: {
                        latitude: true,
                        longitude: true,
                        speed: true,
                        timestamp: true
                    }
                },
                RotativoMeasurement: {
                    orderBy: { timestamp: 'asc' },
                    select: {
                        state: true,
                        timestamp: true
                    }
                },
                Vehicle: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!sesion) {
            console.log('❌ No hay sesiones con ambos datos\n');
            return;
        }

        console.log(`🚗 Vehículo: ${sesion.Vehicle.name}`);
        console.log(`📅 Fecha: ${sesion.startTime.toISOString().split('T')[0]}\n`);

        const rotativo = sesion.RotativoMeasurement;
        const gps = sesion.GpsMeasurement;

        console.log(`📊 Mediciones ROTATIVO: ${rotativo.length}`);
        console.log(`📊 Puntos GPS: ${gps.length}\n`);

        // Analizar estados de rotativo
        const estadosCount = { 0: 0, 1: 0, otros: 0 };
        rotativo.forEach(r => {
            const estado = parseInt(r.state);
            if (estado === 0) estadosCount[0]++;
            else if (estado === 1) estadosCount[1]++;
            else estadosCount.otros++;
        });

        console.log('📈 DISTRIBUCIÓN DE ESTADOS ROTATIVO:\n');
        console.log(`   Estado 0: ${estadosCount[0]} mediciones (${(estadosCount[0]/rotativo.length*100).toFixed(1)}%)`);
        console.log(`   Estado 1: ${estadosCount[1]} mediciones (${(estadosCount[1]/rotativo.length*100).toFixed(1)}%)`);
        if (estadosCount.otros > 0) {
            console.log(`   Otros: ${estadosCount.otros} mediciones`);
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');
        console.log('🔍 CORRELACIÓN CON MOVIMIENTO GPS:\n');

        // Crear mapa de velocidades por tiempo
        const velocidadesPorTiempo = new Map();
        gps.forEach(g => {
            const ts = new Date(g.timestamp).getTime();
            velocidadesPorTiempo.set(ts, g.speed);
        });

        // Analizar cada medición de rotativo y ver velocidad GPS correspondiente
        const estado0_velocidades = [];
        const estado1_velocidades = [];

        for (const r of rotativo) {
            const ts = new Date(r.timestamp).getTime();
            const estado = parseInt(r.state);
            
            // Buscar velocidad GPS más cercana (dentro de 30 segundos)
            let velocidadMasCercana = null;
            let minDiff = Infinity;
            
            for (const [gpsTs, velocidad] of velocidadesPorTiempo) {
                const diff = Math.abs(gpsTs - ts);
                if (diff < minDiff && diff < 30000) { // 30 segundos
                    minDiff = diff;
                    velocidadMasCercana = velocidad;
                }
            }

            if (velocidadMasCercana !== null) {
                if (estado === 0) {
                    estado0_velocidades.push(velocidadMasCercana);
                } else if (estado === 1) {
                    estado1_velocidades.push(velocidadMasCercana);
                }
            }
        }

        // Estadísticas de velocidades
        const calcularStats = (velocidades) => {
            if (velocidades.length === 0) return null;
            
            const promedio = velocidades.reduce((a, b) => a + b, 0) / velocidades.length;
            const max = Math.max(...velocidades);
            const min = Math.min(...velocidades);
            const paradas = velocidades.filter(v => v < 5).length;
            const movimiento = velocidades.filter(v => v >= 5).length;
            
            return { promedio, max, min, paradas, movimiento, total: velocidades.length };
        };

        const stats0 = calcularStats(estado0_velocidades);
        const stats1 = calcularStats(estado1_velocidades);

        if (stats0) {
            console.log(`📊 ESTADO 0 del ROTATIVO:`);
            console.log(`   Muestras correlacionadas: ${stats0.total}`);
            console.log(`   Velocidad promedio: ${stats0.promedio.toFixed(1)} km/h`);
            console.log(`   Velocidad máxima: ${stats0.max.toFixed(1)} km/h`);
            console.log(`   Veces parado (<5 km/h): ${stats0.paradas} (${(stats0.paradas/stats0.total*100).toFixed(1)}%)`);
            console.log(`   Veces en movimiento (≥5 km/h): ${stats0.movimiento} (${(stats0.movimiento/stats0.total*100).toFixed(1)}%)`);
            console.log();
        }

        if (stats1) {
            console.log(`📊 ESTADO 1 del ROTATIVO:`);
            console.log(`   Muestras correlacionadas: ${stats1.total}`);
            console.log(`   Velocidad promedio: ${stats1.promedio.toFixed(1)} km/h`);
            console.log(`   Velocidad máxima: ${stats1.max.toFixed(1)} km/h`);
            console.log(`   Veces parado (<5 km/h): ${stats1.paradas} (${(stats1.paradas/stats1.total*100).toFixed(1)}%)`);
            console.log(`   Veces en movimiento (≥5 km/h): ${stats1.movimiento} (${(stats1.movimiento/stats1.total*100).toFixed(1)}%)`);
            console.log();
        }

        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('💡 INTERPRETACIÓN:\n');

        if (stats0 && stats1) {
            if (stats0.promedio > stats1.promedio + 5) {
                console.log('   ✅ Estado 0 = ROTATIVO ON (más movimiento)');
                console.log('   ✅ Estado 1 = ROTATIVO OFF (más parado)\n');
            } else if (stats1.promedio > stats0.promedio + 5) {
                console.log('   ✅ Estado 0 = ROTATIVO OFF (más parado)');
                console.log('   ✅ Estado 1 = ROTATIVO ON (más movimiento)\n');
            } else {
                console.log('   ⚠️  NO HAY CORRELACIÓN CLARA entre estados y movimiento');
                console.log('   Ambos estados tienen velocidades similares\n');
                
                // Probar correlación temporal
                console.log('   🔍 Analizando patrones temporales...\n');
                
                const primerEstado0 = rotativo.find(r => parseInt(r.state) === 0);
                const primerEstado1 = rotativo.find(r => parseInt(r.state) === 1);
                
                if (primerEstado0 && primerEstado1) {
                    console.log(`   Primera vez Estado 0: ${primerEstado0.timestamp.toISOString()}`);
                    console.log(`   Primera vez Estado 1: ${primerEstado1.timestamp.toISOString()}\n`);
                }
            }
        }

        // Mostrar secuencia de ejemplo
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('📋 SECUENCIA DE EJEMPLO (primeros 20):\n');
        
        for (let i = 0; i < Math.min(20, rotativo.length); i++) {
            const r = rotativo[i];
            const ts = new Date(r.timestamp).getTime();
            
            let velocidadGPS = 'N/A';
            let minDiff = Infinity;
            
            for (const [gpsTs, velocidad] of velocidadesPorTiempo) {
                const diff = Math.abs(gpsTs - ts);
                if (diff < minDiff && diff < 30000) {
                    minDiff = diff;
                    velocidadGPS = velocidad.toFixed(1) + ' km/h';
                }
            }
            
            const hora = r.timestamp.toISOString().split('T')[1].substring(0, 8);
            console.log(`   ${hora} → Estado ${r.state} | GPS: ${velocidadGPS}`);
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

analizarCorrelacion();

