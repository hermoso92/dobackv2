/**
 * Analizar datos REALES del archivo ROTATIVO
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarRotativoReal() {
    console.log('\n🔍 ANÁLISIS DE DATOS ROTATIVO REALES\n');
    
    try {
        // Obtener todas las mediciones ROTATIVO
        const mediciones = await prisma.rotativoMeasurement.findMany({
            select: {
                state: true,
                timestamp: true,
                Session: {
                    select: {
                        id: true,
                        startTime: true,
                        vehicleId: true,
                        Vehicle: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 1000
        });

        console.log(`📊 Total mediciones ROTATIVO en BD: ${mediciones.length}\n`);

        if (mediciones.length === 0) {
            console.log('❌ NO HAY DATOS ROTATIVO EN LA BASE DE DATOS\n');
            return;
        }

        // Contar estados
        const estadosCount = {};
        mediciones.forEach(m => {
            const estado = parseInt(m.state);
            estadosCount[estado] = (estadosCount[estado] || 0) + 1;
        });

        console.log('📈 DISTRIBUCIÓN DE ESTADOS EN ROTATIVO:\n');
        
        const nombresEstados = {
            0: 'Taller',
            1: 'En Parque',
            2: 'Salida en Emergencia',
            3: 'En Siniestro',
            4: 'Fin de Actuación',
            5: 'Regreso al Parque'
        };

        for (let i = 0; i <= 5; i++) {
            const count = estadosCount[i] || 0;
            const porcentaje = ((count / mediciones.length) * 100).toFixed(1);
            console.log(`   Estado ${i} (${nombresEstados[i]}): ${count} mediciones (${porcentaje}%)`);
        }

        // Verificar si hay estados operativos (2, 3, 4, 5)
        const estadosOperativos = (estadosCount[2] || 0) + (estadosCount[3] || 0) + 
                                   (estadosCount[4] || 0) + (estadosCount[5] || 0);
        
        console.log(`\n📊 RESUMEN:\n`);
        console.log(`   Estados No-Operativos (0,1): ${(estadosCount[0]||0) + (estadosCount[1]||0)} (${(((estadosCount[0]||0) + (estadosCount[1]||0))/mediciones.length*100).toFixed(1)}%)`);
        console.log(`   Estados Operativos (2,3,4,5): ${estadosOperativos} (${(estadosOperativos/mediciones.length*100).toFixed(1)}%)`);

        if (estadosOperativos === 0) {
            console.log(`\n⚠️  PROBLEMA DETECTADO: NO HAY ESTADOS OPERATIVOS EN ROTATIVO`);
            console.log(`   Los archivos ROTATIVO solo tienen estados 0 y 1`);
            console.log(`   Por eso se implementó la lógica de inferencia desde GPS\n`);
        } else {
            console.log(`\n✅ HAY ESTADOS OPERATIVOS EN ROTATIVO`);
            console.log(`   El sistema debería usar estos datos reales\n`);
        }

        // Analizar una sesión específica con ROTATIVO
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('🔍 ANÁLISIS DE SESIÓN ESPECÍFICA:\n');

        const sesionConRotativo = await prisma.session.findFirst({
            where: {
                RotativoMeasurement: {
                    some: {}
                }
            },
            include: {
                RotativoMeasurement: {
                    orderBy: { timestamp: 'asc' }
                },
                Vehicle: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (sesionConRotativo) {
            console.log(`   Vehículo: ${sesionConRotativo.Vehicle.name}`);
            console.log(`   Fecha: ${sesionConRotativo.startTime.toISOString().split('T')[0]}`);
            console.log(`   Mediciones ROTATIVO: ${sesionConRotativo.RotativoMeasurement.length}\n`);

            const estadosSesion = {};
            sesionConRotativo.RotativoMeasurement.forEach(m => {
                const estado = parseInt(m.state);
                estadosSesion[estado] = (estadosSesion[estado] || 0) + 1;
            });

            console.log('   Estados en esta sesión:\n');
            for (let i = 0; i <= 5; i++) {
                if (estadosSesion[i]) {
                    console.log(`      Estado ${i} (${nombresEstados[i]}): ${estadosSesion[i]} mediciones`);
                }
            }

            // Calcular duraciones REALES
            console.log('\n   📊 DURACIONES REALES (desde ROTATIVO):\n');
            
            const rotativo = sesionConRotativo.RotativoMeasurement.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );

            const duraciones = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            for (let i = 0; i < rotativo.length - 1; i++) {
                const current = rotativo[i];
                const next = rotativo[i + 1];
                const duration = (new Date(next.timestamp) - new Date(current.timestamp)) / 1000;
                const estado = parseInt(current.state);
                
                if (duraciones.hasOwnProperty(estado)) {
                    duraciones[estado] += duration;
                }
            }

            for (let i = 0; i <= 5; i++) {
                if (duraciones[i] > 0) {
                    const minutos = Math.floor(duraciones[i] / 60);
                    const segundos = Math.floor(duraciones[i] % 60);
                    console.log(`      Estado ${i}: ${minutos}min ${segundos}seg`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

analizarRotativoReal();

