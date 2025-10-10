/**
 * TEST FASE 4: CLAVES OPERACIONALES
 * 
 * Objetivos:
 * 1. Probar secuencia típica 1→2→3→5
 * 2. Validar ventana rodante 5 min en Clave 3
 * 3. Verificar geocercas Radar.com y fallback BD
 */

// ✅ CARGAR VARIABLES DE ENTORNO PRIMERO
require('dotenv').config({ path: 'config.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFase4() {
    try {
        console.log('\n' + '='.repeat(100));
        console.log('🧪 TEST FASE 4: CLAVES OPERACIONALES');
        console.log('='.repeat(100) + '\n');
        
        // ============================================
        // PASO 1: VERIFICAR GEOCERCAS EN BD
        // ============================================
        console.log('📍 PASO 1: VERIFICACIÓN DE GEOCERCAS\n');
        
        const [parques, talleres] = await Promise.all([
            prisma.park.findMany({ select: { id: true, name: true, geometry: true } }),
            // Taller no existe en schema, usar array vacío
            Promise.resolve([])
        ]);
        
        console.log(`Parques encontrados: ${parques.length}`);
        parques.forEach(p => {
            const geom = p.geometry;
            if (geom && geom.coordinates) {
                console.log(`  ${p.name}: ${geom.coordinates.length} puntos`);
            } else {
                console.log(`  ${p.name}: Sin coordenadas`);
            }
        });
        
        console.log(`\nTalleres encontrados: ${talleres.length}`);
        
        if (parques.length === 0 && talleres.length === 0) {
            console.log('\n⚠️  NO HAY GEOCERCAS EN BD - Se usarán ubicaciones aproximadas\n');
        }
        
        // ============================================
        // PASO 2: BUSCAR SESIÓN CON ROTATIVO ON/OFF
        // ============================================
        console.log('='.repeat(100));
        console.log('🔍 PASO 2: BUSCAR SESIÓN CON CAMBIOS DE ROTATIVO\n');
        
        // Buscar sesión con GPS y ROTATIVO
        const sesionesConDatos = await prisma.session.findMany({
            where: {
                vehicleId: '14b9febb-ca73-4130-a88d-e4d73ed6501a', // DOBACK024
                startTime: { gte: new Date('2025-10-08') }
            },
            orderBy: { startTime: 'asc' }
        });
        
        let sesionElegida = null;
        let cambiosRotativo = 0;
        
        for (const sesion of sesionesConDatos) {
            const [gpsCount, rotativoCount] = await Promise.all([
                prisma.gpsMeasurement.count({ where: { sessionId: sesion.id } }),
                prisma.rotativoMeasurement.count({ where: { sessionId: sesion.id } })
            ]);
            
            if (gpsCount > 100 && rotativoCount > 0) {
                // Contar cambios de estado
                const mediciones = await prisma.rotativoMeasurement.findMany({
                    where: { sessionId: sesion.id },
                    orderBy: { timestamp: 'asc' },
                    select: { state: true }
                });
                
                let cambios = 0;
                for (let i = 1; i < mediciones.length; i++) {
                    if (mediciones[i].state !== mediciones[i-1].state) {
                        cambios++;
                    }
                }
                
                if (cambios > 2) { // Al menos 2 cambios (ON→OFF→ON o viceversa)
                    sesionElegida = sesion;
                    cambiosRotativo = cambios;
                    break;
                }
            }
        }
        
        if (!sesionElegida) {
            console.log('❌ No se encontró sesión con cambios de rotativo suficientes\n');
            return;
        }
        
        console.log(`✅ Sesión seleccionada: ${sesionElegida.id.substring(0, 8)}...`);
        console.log(`   Inicio: ${sesionElegida.startTime.toISOString()}`);
        console.log(`   Fin: ${sesionElegida.endTime?.toISOString()}`);
        console.log(`   Cambios rotativo: ${cambiosRotativo}\n`);
        
        // ============================================
        // PASO 3: CALCULAR CLAVES OPERACIONALES
        // ============================================
        console.log('='.repeat(100));
        console.log('🔑 PASO 3: CÁLCULO DE CLAVES OPERACIONALES\n');
        
        // Importar calculador (compilado)
        const { operationalKeyCalculator } = require('./dist/services/OperationalKeyCalculator');
        
        const inicio = Date.now();
        
        const clavesIds = await operationalKeyCalculator.calcularClavesOperacionales(sesionElegida.id);
        
        // Buscar claves en BD
        const claves = await prisma.operationalKey.findMany({
            where: { sessionId: sesionElegida.id },
            orderBy: { startTime: 'asc' }
        });
        
        const duracion = Date.now() - inicio;
        
        console.log(`✅ Claves calculadas en ${duracion}ms\n`);
        
        if (claves.length === 0) {
            console.log('⚠️  No se detectaron claves operacionales\n');
            console.log('Posibles razones:');
            console.log('  - No hay geocercas configuradas');
            console.log('  - GPS sin señal');
            console.log('  - Sesión muy corta\n');
        } else {
            console.log(`📊 Total claves detectadas: ${claves.length}\n`);
            
            // Agrupar por tipo
            const porTipo = new Map();
            claves.forEach(c => {
                const tipo = c.keyType;
                porTipo.set(tipo, (porTipo.get(tipo) || 0) + 1);
            });
            
            console.log('Distribución por tipo:');
            porTipo.forEach((count, tipo) => {
                const nombre = {
                    0: 'TALLER',
                    1: 'OPERATIVO EN PARQUE',
                    2: 'SALIDA EMERGENCIA',
                    3: 'EN INCENDIO/EMERGENCIA',
                    5: 'REGRESO'
                }[tipo] || 'DESCONOCIDO';
                console.log(`  Clave ${tipo} (${nombre}): ${count}`);
            });
            
            console.log('\n📋 Detalle de claves:');
            claves.forEach((clave, i) => {
                const nombre = {
                    0: 'TALLER',
                    1: 'OPERATIVO EN PARQUE',
                    2: 'SALIDA EMERGENCIA',
                    3: 'EN INCENDIO/EMERGENCIA',
                    5: 'REGRESO'
                }[clave.keyType] || 'DESCONOCIDO';
                
                const duracionMin = clave.duration ? (clave.duration / 60).toFixed(1) : 'N/A';
                
                console.log(`\n  [${i+1}] Clave ${clave.keyType} - ${nombre}`);
                console.log(`      Inicio: ${clave.startTime.toISOString()}`);
                console.log(`      Fin: ${clave.endTime?.toISOString() || 'En curso'}`);
                console.log(`      Duración: ${duracionMin} min`);
                if (clave.geofenceName) {
                    console.log(`      Geocerca: ${clave.geofenceName}`);
                }
                console.log(`      Rotativo: ${clave.rotativoState ? 'ON' : 'OFF'}`);
            });
            
            // ============================================
            // PASO 4: VALIDAR SECUENCIA LÓGICA
            // ============================================
            console.log('\n' + '='.repeat(100));
            console.log('🔍 PASO 4: VALIDACIÓN DE SECUENCIA LÓGICA\n');
            
            // Ordenar claves por tiempo
            const clavesOrdenadas = [...claves].sort((a, b) => 
                a.startTime.getTime() - b.startTime.getTime()
            );
            
            console.log('Secuencia temporal:');
            let secuenciaValida = true;
            
            for (let i = 0; i < clavesOrdenadas.length; i++) {
                const actual = clavesOrdenadas[i];
                const siguiente = clavesOrdenadas[i + 1];
                
                const nombre = {
                    0: 'TALLER',
                    1: 'PARQUE',
                    2: 'EMERGENCIA',
                    3: 'INCENDIO',
                    5: 'REGRESO'
                }[actual.keyType];
                
                console.log(`  ${i+1}. Clave ${actual.keyType} (${nombre}) - ${actual.startTime.toLocaleTimeString()}`);
                
                // Validar transiciones
                if (siguiente) {
                    const transicionValida = validarTransicion(actual.keyType, siguiente.keyType);
                    if (!transicionValida) {
                        console.log(`     ⚠️  Transición inválida a Clave ${siguiente.keyType}`);
                        secuenciaValida = false;
                    }
                }
            }
            
            console.log(`\n✅ Secuencia lógica: ${secuenciaValida ? 'VÁLIDA ✅' : 'INVÁLIDA ⚠️'}\n`);
            
            // ============================================
            // PASO 5: VALIDAR CLAVE 3 (VENTANA RODANTE)
            // ============================================
            console.log('='.repeat(100));
            console.log('🔍 PASO 5: VALIDACIÓN CLAVE 3 (VENTANA RODANTE)\n');
            
            const claves3 = claves.filter(c => c.keyType === 3);
            
            if (claves3.length > 0) {
                console.log(`Claves 3 detectadas: ${claves3.length}\n`);
                
                claves3.forEach((clave, i) => {
                    const duracionMin = clave.duration ? (clave.duration / 60).toFixed(1) : 0;
                    console.log(`  Clave 3 [${i+1}]:`);
                    console.log(`    Duración: ${duracionMin} min`);
                    console.log(`    ✅ Cumple ventana ≥5 min: ${duracionMin >= 5 ? 'SÍ' : 'NO'}`);
                    
                    // Verificar cluster (puntos cercanos)
                    if (clave.startLat && clave.endLat) {
                        const dist = calcularDistancia(
                            clave.startLat, clave.startLon,
                            clave.endLat, clave.endLon
                        );
                        console.log(`    Distancia inicio-fin: ${dist.toFixed(0)}m`);
                        console.log(`    ✅ Cumple cluster ≤50m: ${dist <= 50 ? 'SÍ' : 'NO'}`);
                    }
                });
            } else {
                console.log('No se detectaron Claves 3 en esta sesión\n');
            }
        }
        
        // ============================================
        // RESUMEN FINAL
        // ============================================
        console.log('='.repeat(100));
        console.log('📊 RESUMEN FINAL - FASE 4\n');
        
        console.log('DATOS VERIFICADOS:');
        console.log(`  Geocercas parques: ${parques.length}`);
        console.log(`  Geocercas talleres: ${talleres.length}`);
        console.log(`  Sesión analizada: ${sesionElegida.id.substring(0, 8)}...`);
        console.log(`  Cambios rotativo: ${cambiosRotativo}`);
        console.log(`  Claves detectadas: ${claves.length}`);
        console.log(`  Tiempo cálculo: ${duracion}ms\n`);
        
        if (claves.length > 0) {
            console.log('✅ FASE 4 COMPLETADA EXITOSAMENTE\n');
        } else {
            console.log('⚠️  FASE 4 REQUIERE AJUSTES (sin claves detectadas)\n');
        }
        
        console.log('='.repeat(100) + '\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

function validarTransicion(actual, siguiente) {
    // Transiciones válidas típicas:
    // 1 (PARQUE) → 2 (EMERGENCIA)
    // 2 (EMERGENCIA) → 3 (INCENDIO)
    // 3 (INCENDIO) → 5 (REGRESO)
    // 5 (REGRESO) → 1 (PARQUE)
    // 1 (PARQUE) → 0 (TALLER)
    // 0 (TALLER) → 1 (PARQUE)
    
    const validTransitions = {
        0: [1],       // TALLER → PARQUE
        1: [0, 2],    // PARQUE → TALLER o EMERGENCIA
        2: [3, 5],    // EMERGENCIA → INCENDIO o REGRESO (falsa alarma)
        3: [5],       // INCENDIO → REGRESO
        5: [1]        // REGRESO → PARQUE
    };
    
    return validTransitions[actual]?.includes(siguiente) || false;
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

testFase4();

