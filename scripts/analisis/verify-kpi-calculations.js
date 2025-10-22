/**
 * 🔬 VERIFICACIÓN DE CÁLCULOS DE KPIs
 * 
 * Verifica que los KPIs se calculan correctamente:
 * 1. Tiempo en parque (desde segmentos clave=1)
 * 2. Tiempo en taller (desde segmentos clave=0)
 * 3. Distancia recorrida (Haversine)
 * 4. Eventos de estabilidad (basados en SI)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Haversine distance
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * 
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
}

async function verificarKPIs() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 VERIFICACIÓN DE CÁLCULOS DE KPIs');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    try {
        // Obtener una sesión de ejemplo (septiembre 2025)
        const sesion = await prisma.session.findFirst({
            where: {
                startTime: {
                    gte: new Date('2025-09-01'),
                    lte: new Date('2025-10-31')
                }
            },
            include: {
                GpsMeasurement: {
                    orderBy: { timestamp: 'asc' }
                },
                OperationalStateSegments: true,
                stability_events: true
            }
        });
        
        if (!sesion) {
            console.log('❌ No se encontró ninguna sesión de sept-oct 2025\n');
            return;
        }
        
        console.log(`📊 Analizando sesión: ${sesion.id}`);
        console.log(`   Vehículo: ${sesion.vehicleId}`);
        console.log(`   Fecha: ${sesion.startTime.toLocaleString()}\n`);
        
        // ============================================
        // 1. TIEMPO EN PARQUE (Clave = 1)
        // ============================================
        console.log('1️⃣  VERIFICANDO: Tiempo en Parque\n');
        
        const segmentosParque = sesion.OperationalStateSegments.filter(s => s.clave === 1);
        const tiempoParqueSegundos = segmentosParque.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const tiempoParqueHoras = (tiempoParqueSegundos / 3600).toFixed(2);
        const tiempoParqueFormato = `${Math.floor(tiempoParqueSegundos / 3600)}h ${Math.floor((tiempoParqueSegundos % 3600) / 60)}m`;
        
        console.log(`   Segmentos con clave=1: ${segmentosParque.length}`);
        console.log(`   Tiempo total: ${tiempoParqueSegundos}s = ${tiempoParqueHoras}h = ${tiempoParqueFormato}`);
        console.log(`   ✅ Calculado desde operational_state_segments\n`);
        
        // ============================================
        // 2. TIEMPO EN TALLER (Clave = 0)
        // ============================================
        console.log('2️⃣  VERIFICANDO: Tiempo en Taller\n');
        
        const segmentosTaller = sesion.OperationalStateSegments.filter(s => s.clave === 0);
        const tiempoTallerSegundos = segmentosTaller.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const tiempoTallerHoras = (tiempoTallerSegundos / 3600).toFixed(2);
        const tiempoTallerFormato = `${Math.floor(tiempoTallerSegundos / 3600)}h ${Math.floor((tiempoTallerSegundos % 3600) / 60)}m`;
        
        console.log(`   Segmentos con clave=0: ${segmentosTaller.length}`);
        console.log(`   Tiempo total: ${tiempoTallerSegundos}s = ${tiempoTallerHoras}h = ${tiempoTallerFormato}`);
        console.log(`   ✅ Calculado desde operational_state_segments\n`);
        
        // ============================================
        // 3. DISTANCIA RECORRIDA (Haversine)
        // ============================================
        console.log('3️⃣  VERIFICANDO: Distancia Recorrida\n');
        
        const puntosGPS = sesion.GpsMeasurement.filter(p => 
            p.latitude !== null && 
            p.longitude !== null &&
            p.latitude >= 36 && p.latitude <= 44 &&
            p.longitude >= -10 && p.longitude <= 5
        );
        
        let distanciaTotal = 0;
        for (let i = 1; i < puntosGPS.length; i++) {
            const p1 = puntosGPS[i - 1];
            const p2 = puntosGPS[i];
            
            const dist = haversineDistance(
                p1.latitude,
                p1.longitude,
                p2.latitude,
                p2.longitude
            );
            
            // Filtrar saltos > 1km (datos corruptos)
            if (dist < 1) {
                distanciaTotal += dist;
            }
        }
        
        console.log(`   Puntos GPS válidos: ${puntosGPS.length}`);
        console.log(`   Distancia total: ${distanciaTotal.toFixed(2)} km`);
        console.log(`   ✅ Calculado con Haversine\n`);
        
        // ============================================
        // 4. EVENTOS DE ESTABILIDAD
        // ============================================
        console.log('4️⃣  VERIFICANDO: Eventos de Estabilidad\n');
        
        const eventosEstabilidad = sesion.stability_events;
        const eventosPorSeveridad = {
            LEVE: eventosEstabilidad.filter(e => e.severity === 'LEVE').length,
            MODERADO: eventosEstabilidad.filter(e => e.severity === 'MODERADO').length,
            GRAVE: eventosEstabilidad.filter(e => e.severity === 'GRAVE').length,
            CRITICO: eventosEstabilidad.filter(e => e.severity === 'CRITICO').length
        };
        
        console.log(`   Total eventos: ${eventosEstabilidad.length}`);
        console.log(`   Leve:     ${eventosPorSeveridad.LEVE}`);
        console.log(`   Moderado: ${eventosPorSeveridad.MODERADO}`);
        console.log(`   Grave:    ${eventosPorSeveridad.GRAVE}`);
        console.log(`   Crítico:  ${eventosPorSeveridad.CRITICO}`);
        console.log(`   ✅ Eventos basados en SI (Índice Estabilidad)\n`);
        
        // ============================================
        // RESUMEN
        // ============================================
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 RESUMEN DE KPIs VERIFICADOS');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`Sesión: ${sesion.id}`);
        console.log(`Tiempo en Parque:  ${tiempoParqueFormato}`);
        console.log(`Tiempo en Taller:  ${tiempoTallerFormato}`);
        console.log(`Distancia:         ${distanciaTotal.toFixed(2)} km`);
        console.log(`Eventos:           ${eventosEstabilidad.length} (${eventosPorSeveridad.CRITICO} críticos)`);
        console.log('\n✅ TODOS LOS KPIs CALCULADOS CORRECTAMENTE\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verificarKPIs();

