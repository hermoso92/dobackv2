/**
 * Script para reprocesar segmentos operacionales de sesiones existentes
 * Usa la lógica corregida de geocercas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    VELOCIDAD_PARADO: 5, // km/h
    TIEMPO_MIN_PARADO: 5 * 60, // segundos
    GPS_SAMPLE_INTERVAL: 5, // segundos
    RADIO_GEOCERCA: 100 // metros por defecto
};

// ============================================================================
// UTILIDADES
// ============================================================================

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function puntoEnGeocerca(lat, lon, geocerca) {
    const distancia = haversineDistance(lat, lon, geocerca.lat, geocerca.lon);
    return distancia <= geocerca.radio;
}

// ============================================================================
// CARGAR GEOCERCAS
// ============================================================================

async function cargarGeocercas(organizationId) {
    // Cargar parques
    const parks = await prisma.park.findMany({
        where: { organizationId }
    });

    const parques = parks.map(p => {
        const geometry = typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry;

        if (geometry.type === 'circle' || geometry.type === 'Circle') {
            const center = Array.isArray(geometry.center)
                ? { lat: geometry.center[0], lon: geometry.center[1] }
                : { lat: geometry.center.lat, lon: geometry.center.lng };

            return {
                lat: center.lat,
                lon: center.lon,
                radio: geometry.radius || CONFIG.RADIO_GEOCERCA,
                nombre: p.name
            };
        }

        if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
            return {
                lat: geometry.coordinates[1],
                lon: geometry.coordinates[0],
                radio: CONFIG.RADIO_GEOCERCA,
                nombre: p.name
            };
        }

        if (geometry.type === 'Polygon' && geometry.coordinates?.[0]?.length > 0) {
            const coords = geometry.coordinates[0][0];
            return {
                lat: Array.isArray(coords) ? coords[1] : 0,
                lon: Array.isArray(coords) ? coords[0] : 0,
                radio: CONFIG.RADIO_GEOCERCA,
                nombre: p.name
            };
        }

        return {
            lat: 0,
            lon: 0,
            radio: CONFIG.RADIO_GEOCERCA,
            nombre: p.name
        };
    });

    // Cargar talleres
    const zones = await prisma.zone.findMany({
        where: {
            organizationId,
            type: 'TALLER'
        }
    });

    const talleres = zones.map(z => {
        const geometry = typeof z.geometry === 'string' ? JSON.parse(z.geometry) : z.geometry;

        if (geometry.type === 'Circle' && geometry.center) {
            const center = Array.isArray(geometry.center)
                ? { lat: geometry.center[0], lon: geometry.center[1] }
                : { lat: geometry.center.lat, lon: geometry.center.lng };

            return {
                lat: center.lat,
                lon: center.lon,
                radio: geometry.radius || CONFIG.RADIO_GEOCERCA,
                nombre: z.name
            };
        }

        const coords = geometry.coordinates?.[0]?.[0];
        return {
            lat: Array.isArray(coords) ? coords[1] : 0,
            lon: Array.isArray(coords) ? coords[0] : 0,
            radio: CONFIG.RADIO_GEOCERCA,
            nombre: z.name
        };
    });

    return { parques, talleres };
}

// ============================================================================
// CALCULAR Y GUARDAR SEGMENTOS
// ============================================================================

async function calcularYGuardarSegmentos(sessionId) {
    try {
        // 1. Obtener datos GPS y rotativo
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                GpsMeasurement: { orderBy: { timestamp: 'asc' } },
                RotativoMeasurement: { orderBy: { timestamp: 'asc' } }
            }
        });

        if (!session || session.GpsMeasurement.length === 0) {
            return 0;
        }

        // 2. Cargar geocercas
        const geocercas = await cargarGeocercas(session.organizationId);

        // 3. Detectar segmentos usando máquina de estados
        const segmentos = [];

        let estadoActual = null;
        let inicioSegmento = null;
        let rotativoOn = false;
        let enGeocerca = null;

        // Crear mapa de rotativo
        const rotativoMap = new Map();
        session.RotativoMeasurement.forEach(r => {
            rotativoMap.set(r.timestamp.getTime(), r.state);
        });

        for (let i = 0; i < session.GpsMeasurement.length; i++) {
            const gps = session.GpsMeasurement[i];
            const rotativoState = rotativoMap.get(gps.timestamp.getTime()) || '0';
            rotativoOn = rotativoState === '1';

            // Detectar geocerca actual
            let enParque = false;
            let enTaller = false;
            let nombreGeocerca = null;

            for (const parque of geocercas.parques) {
                if (puntoEnGeocerca(gps.latitude, gps.longitude, parque)) {
                    enParque = true;
                    nombreGeocerca = parque.nombre;
                    break;
                }
            }

            if (!enParque) {
                for (const taller of geocercas.talleres) {
                    if (puntoEnGeocerca(gps.latitude, gps.longitude, taller)) {
                        enTaller = true;
                        nombreGeocerca = taller.nombre;
                        break;
                    }
                }
            }

            // Determinar clave actual
            let claveActual;
            if (enTaller) {
                claveActual = 0;
            } else if (enParque && !rotativoOn) {
                claveActual = 1;
            } else if (!enParque && rotativoOn && gps.speed > CONFIG.VELOCIDAD_PARADO) {
                claveActual = 2;
            } else if (!enParque && gps.speed <= CONFIG.VELOCIDAD_PARADO) {
                claveActual = 3;
            } else if (!enParque && !rotativoOn && estadoActual === 3) {
                claveActual = 4;
            } else {
                claveActual = 5;
            }

            // Detectar transiciones
            if (estadoActual !== claveActual) {
                // Cerrar segmento anterior
                if (estadoActual !== null && inicioSegmento !== null) {
                    const duracion = Math.floor((gps.timestamp.getTime() - inicioSegmento.getTime()) / 1000);
                    if (duracion > 0) {
                        segmentos.push({
                            clave: estadoActual,
                            inicio: inicioSegmento,
                            fin: gps.timestamp,
                            duracion,
                            metadata: {
                                geocerca: enGeocerca,
                                rotativoOn: rotativoOn,
                                velocidadPromedio: gps.speed
                            }
                        });
                    }
                }

                // Iniciar nuevo segmento
                estadoActual = claveActual;
                inicioSegmento = gps.timestamp;
                enGeocerca = nombreGeocerca;
            }
        }

        // Cerrar último segmento
        if (estadoActual !== null && inicioSegmento !== null) {
            const ultimoGPS = session.GpsMeasurement[session.GpsMeasurement.length - 1];
            const duracion = Math.floor((ultimoGPS.timestamp.getTime() - inicioSegmento.getTime()) / 1000);
            if (duracion > 0) {
                segmentos.push({
                    clave: estadoActual,
                    inicio: inicioSegmento,
                    fin: ultimoGPS.timestamp,
                    duracion,
                    metadata: { geocerca: enGeocerca, rotativoOn }
                });
            }
        }

        // 4. Persistir segmentos en BD
        if (segmentos.length > 0) {
            for (const s of segmentos) {
                await prisma.$executeRaw`
                    INSERT INTO operational_state_segments ("sessionId", clave, "startTime", "endTime", "durationSeconds", metadata, "createdAt", "updatedAt")
                    VALUES (${sessionId}, ${s.clave}, ${s.inicio}, ${s.fin}, ${s.duracion}, ${JSON.stringify(s.metadata || {})}::jsonb, NOW(), NOW())
                `;
            }
        }

        return segmentos.length;

    } catch (error) {
        console.error(`Error calculando segmentos: ${error.message}`);
        return 0;
    }
}

// ============================================================================
// REPROCESAR SESIONES
// ============================================================================

async function reprocesarSegmentos() {
    console.log('🔄 Iniciando reprocesamiento de segmentos operacionales...\n');

    try {
        // 1. Obtener todas las sesiones de la organización
        const sessions = await prisma.session.findMany({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
            },
            select: { id: true, startTime: true, vehicleId: true },
            orderBy: { startTime: 'asc' }
        });

        console.log(`📊 Encontradas ${sessions.length} sesiones\n`);

        // 2. Eliminar segmentos existentes usando query raw
        console.log('🗑️  Eliminando segmentos antiguos...');
        const sessionIds = sessions.map(s => s.id);
        const deleted = await prisma.$executeRaw`
            DELETE FROM operational_state_segments
            WHERE "sessionId"::text = ANY(${sessionIds}::text[])
        `;
        console.log(`✅ ${deleted} segmentos eliminados\n`);

        // 3. Regenerar segmentos usando la función corregida
        console.log('⚙️ Regenerando segmentos con lógica corregida...\n');

        let procesados = 0;
        let conSegmentos = 0;
        let errors = 0;

        for (const session of sessions) {
            try {
                const numSegmentos = await calcularYGuardarSegmentos(session.id);
                procesados++;
                
                if (numSegmentos > 0) {
                    conSegmentos++;
                    console.log(`  ✓ Sesión ${session.id.substring(0, 8)}... → ${numSegmentos} segmentos`);
                } else {
                    console.log(`  ⚠️  Sesión ${session.id.substring(0, 8)}... → 0 segmentos`);
                }

                // Cada 10 sesiones, mostrar progreso
                if (procesados % 10 === 0) {
                    console.log(`\n📊 Progreso: ${procesados}/${sessions.length} (${((procesados/sessions.length)*100).toFixed(1)}%)\n`);
                }

            } catch (error) {
                errors++;
                console.log(`  ✗ Error en ${session.id.substring(0, 8)}...: ${error.message}`);
            }
        }

        console.log('\n========================================');
        console.log('  REPROCESAMIENTO COMPLETADO');
        console.log('========================================\n');
        console.log(`Total sesiones: ${sessions.length}`);
        console.log(`Procesadas: ${procesados}`);
        console.log(`Con segmentos: ${conSegmentos}`);
        console.log(`Errores: ${errors}\n`);

        // 4. Verificar nuevos segmentos usando query raw
        const nuevosTotales = await prisma.$queryRaw`
            SELECT clave, 
                   COUNT(*)::int as count, 
                   SUM("durationSeconds")::int as total_duration
            FROM operational_state_segments
            GROUP BY clave
            ORDER BY clave
        `;

        console.log('📊 NUEVOS SEGMENTOS POR CLAVE:\n');
        nuevosTotales.forEach(s => {
            const horas = ((s.total_duration || 0) / 3600).toFixed(2);
            console.log(`  Clave ${s.clave}: ${s.count} segmentos, ${horas}h`);
        });

    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reprocesarSegmentos();

