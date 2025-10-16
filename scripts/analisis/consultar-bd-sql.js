/**
 * Consultar BD PostgreSQL directamente usando SQL
 */

const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:cosigein@localhost:5432/dobacksoft'
});

async function main() {
    try {
        await client.connect();
        console.log('\n✅ Conectado a PostgreSQL\n');
        console.log('========================================');
        console.log('ANÁLISIS COMPLETO DE BASE DE DATOS');
        console.log('========================================\n');

        // 1. Conteos de tablas
        console.log('📊 CONTEO DE REGISTROS:\n');
        
        const tables = [
            '"Session"',
            '"Vehicle"',
            '"RotativoMeasurement"',
            '"GpsMeasurement"',
            'stability_events',
            '"Geofence"',
            '"Organization"'
        ];

        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${table.replace(/"/g, '').padEnd(25)} ${result.rows[0].count}`);
        }
        console.log();

        // 2. Listar vehículos
        console.log('🚒 VEHÍCULOS:\n');
        const vehicles = await client.query(`
            SELECT id, name, "licensePlate", "organizationId"
            FROM "Vehicle"
            LIMIT 10
        `);
        vehicles.rows.forEach(v => {
            console.log(`   • ${v.name} (${v.licensePlate})`);
            console.log(`     ID: ${v.id}`);
        });
        console.log();

        // 3. Listar sesiones recientes con conteos
        console.log('📋 ÚLTIMAS 5 SESIONES CON DATOS:\n');
        const sessions = await client.query(`
            SELECT 
                s.id,
                s."vehicleId",
                s."startTime",
                s."endTime",
                v.name as vehicle_name,
                (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) as rotativo_count,
                (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) as gps_count,
                (SELECT COUNT(*) FROM stability_events WHERE session_id = s.id) as events_count
            FROM "Session" s
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            ORDER BY s."startTime" DESC
            LIMIT 5
        `);

        if (sessions.rows.length === 0) {
            console.log('   ⚠️  NO HAY SESIONES\n');
        } else {
            sessions.rows.forEach((s, idx) => {
                console.log(`   ${idx + 1}. Sesión: ${s.id.substring(0, 8)}...`);
                console.log(`      Vehículo: ${s.vehicle_name}`);
                console.log(`      Inicio: ${s.startTime ? new Date(s.startTime).toISOString() : 'null'}`);
                console.log(`      Fin: ${s.endTime ? new Date(s.endTime).toISOString() : 'null'}`);
                console.log(`      Rotativo: ${s.rotativo_count} | GPS: ${s.gps_count} | Eventos: ${s.events_count}\n`);
            });
        }

        // 4. Analizar una sesión específica con datos
        console.log('🔬 ANÁLISIS DETALLADO DE UNA SESIÓN CON DATOS:\n');
        const sessionWithData = await client.query(`
            SELECT 
                s.id,
                s."vehicleId",
                s."startTime",
                s."endTime",
                v.name as vehicle_name,
                v."licensePlate"
            FROM "Session" s
            JOIN "Vehicle" v ON s."vehicleId" = v.id
            WHERE EXISTS (SELECT 1 FROM "RotativoMeasurement" WHERE "sessionId" = s.id)
            AND EXISTS (SELECT 1 FROM "GpsMeasurement" WHERE "sessionId" = s.id)
            LIMIT 1
        `);

        if (sessionWithData.rows.length === 0) {
            console.log('   ⚠️  NO HAY SESIONES CON DATOS COMPLETOS (Rotativo + GPS)\n');
        } else {
            const session = sessionWithData.rows[0];
            console.log(`   Sesión ID: ${session.id}`);
            console.log(`   Vehículo: ${session.vehicle_name} (${session.licensePlate})`);
            console.log(`   Inicio: ${session.startTime ? new Date(session.startTime).toISOString() : 'null'}`);
            console.log(`   Fin: ${session.endTime ? new Date(session.endTime).toISOString() : 'null'}\n`);

            // Analizar claves (rotativo)
            console.log('   🔑 DISTRIBUCIÓN DE CLAVES (ROTATIVO):\n');
            const statesDistribution = await client.query(`
                SELECT 
                    state,
                    COUNT(*) as measurements,
                    MIN(timestamp) as first_measurement,
                    MAX(timestamp) as last_measurement
                FROM "RotativoMeasurement"
                WHERE "sessionId" = $1
                GROUP BY state
                ORDER BY state::int
            `, [session.id]);

            if (statesDistribution.rows.length === 0) {
                console.log('      ⚠️  Sin mediciones de rotativo\n');
            } else {
                statesDistribution.rows.forEach(s => {
                    console.log(`      Clave ${s.state}: ${s.measurements} mediciones`);
                    console.log(`         Primera: ${new Date(s.first_measurement).toISOString()}`);
                    console.log(`         Última: ${new Date(s.last_measurement).toISOString()}\n`);
                });
            }

            // Calcular duración por clave
            console.log('   ⏱️  DURACIÓN POR CLAVE:\n');
            const durations = await client.query(`
                WITH ordered_measurements AS (
                    SELECT 
                        state,
                        timestamp,
                        LEAD(timestamp) OVER (ORDER BY timestamp) as next_timestamp
                    FROM "RotativoMeasurement"
                    WHERE "sessionId" = $1
                )
                SELECT 
                    state,
                    SUM(EXTRACT(EPOCH FROM (next_timestamp - timestamp))) as duration_seconds,
                    COUNT(*) as intervals
                FROM ordered_measurements
                WHERE next_timestamp IS NOT NULL
                GROUP BY state
                ORDER BY state::int
            `, [session.id]);

            let totalSeconds = 0;
            const statesDuration = {};
            
            durations.rows.forEach(d => {
                const seconds = parseFloat(d.duration_seconds) || 0;
                totalSeconds += seconds;
                statesDuration[d.state] = seconds;
                
                const hours = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                const formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                
                console.log(`      Clave ${d.state}: ${formatted} (${d.intervals} intervalos)`);
            });

            const hours = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = Math.floor(totalSeconds % 60);
            const totalFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            console.log(`\n      TOTAL: ${totalFormatted}\n`);

            // Calcular tiempo fuera de parque (2+3+4+5)
            const timeOutside = (statesDuration['2'] || 0) + (statesDuration['3'] || 0) + 
                               (statesDuration['4'] || 0) + (statesDuration['5'] || 0);
            const outHours = Math.floor(timeOutside / 3600);
            const outMins = Math.floor((timeOutside % 3600) / 60);
            const outSecs = Math.floor(timeOutside % 60);
            const outFormatted = `${String(outHours).padStart(2, '0')}:${String(outMins).padStart(2, '0')}:${String(outSecs).padStart(2, '0')}`;
            console.log(`      Tiempo Fuera de Parque (2+3+4+5): ${outFormatted}\n`);

            // Analizar GPS
            console.log('   🛰️  ANÁLISIS GPS:\n');
            const gpsStats = await client.query(`
                SELECT 
                    COUNT(*) as total_points,
                    COUNT(CASE WHEN latitude = 0 AND longitude = 0 THEN 1 END) as invalid_coords,
                    MIN(timestamp) as first_point,
                    MAX(timestamp) as last_point,
                    AVG(speed) as avg_speed,
                    MAX(speed) as max_speed
                FROM "GpsMeasurement"
                WHERE "sessionId" = $1
            `, [session.id]);

            const gps = gpsStats.rows[0];
            console.log(`      Puntos GPS: ${gps.total_points}`);
            console.log(`      Puntos inválidos (0,0): ${gps.invalid_coords}`);
            console.log(`      Puntos válidos: ${parseInt(gps.total_points) - parseInt(gps.invalid_coords)}`);
            console.log(`      Velocidad promedio: ${gps.avg_speed ? parseFloat(gps.avg_speed).toFixed(2) : 'N/A'} km/h`);
            console.log(`      Velocidad máxima: ${gps.max_speed ? parseFloat(gps.max_speed).toFixed(2) : 'N/A'} km/h\n`);

            // Analizar eventos
            console.log('   ⚠️  EVENTOS DE ESTABILIDAD:\n');
            const eventsStats = await client.query(`
                SELECT 
                    type,
                    COUNT(*) as count
                FROM stability_events
                WHERE session_id = $1
                GROUP BY type
                ORDER BY count DESC
            `, [session.id]);

            if (eventsStats.rows.length === 0) {
                console.log('      ℹ️  No hay eventos de estabilidad\n');
            } else {
                eventsStats.rows.forEach(e => {
                    console.log(`      ${e.type}: ${e.count}`);
                });
                console.log();
            }
        }

        // 5. Análisis de geocercas
        console.log('🗺️  GEOCERCAS:\n');
        const geofences = await client.query(`
            SELECT id, name, type FROM "Geofence"
            LIMIT 10
        `);

        if (geofences.rows.length === 0) {
            console.log('   ⚠️  NO HAY GEOCERCAS CONFIGURADAS');
            console.log('   → Sin geocercas, NO se puede determinar "Tiempo en Parque" basado en ubicación');
            console.log('   → El "Tiempo en Parque" se calcula solo por Clave 1 del rotativo\n');
        } else {
            console.log(`   ✅ Geocercas configuradas: ${geofences.rows.length}\n`);
            geofences.rows.forEach(g => {
                console.log(`      • ${g.name} (${g.type})`);
            });
            console.log();
        }

        console.log('========================================');
        console.log('ANÁLISIS COMPLETADO');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    } finally {
        await client.end();
    }
}

main();

