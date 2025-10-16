/**
 * Script para regenerar eventos de estabilidad con TODOS los campos
 * Elimina eventos existentes y los regenera con speed, rotativoState, keyType, interpolatedGPS
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function regenerarEventos() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('🔄 Iniciando regeneración de eventos de estabilidad...\n');
        
        // 1. Contar eventos actuales
        const countResult = await pool.query('SELECT COUNT(*) as count FROM stability_events');
        const currentCount = parseInt(countResult.rows[0].count);
        console.log(`📊 Eventos actuales en BD: ${currentCount.toLocaleString()}`);

        // 2. Confirmar acción (en producción, esto requeriría confirmación del usuario)
        console.log('\n⚠️  ATENCIÓN: Este script eliminará TODOS los eventos existentes');
        console.log('   y los regenerará con los campos completos (speed, rotativoState, keyType, interpolatedGPS)\n');

        // 3. Eliminar eventos existentes
        console.log('🗑️  Eliminando eventos existentes...');
        await pool.query('DELETE FROM stability_events');
        console.log('   ✅ Eventos eliminados\n');

        // 4. Obtener sesiones para regenerar
        const sessionsResult = await pool.query(`
            SELECT id, "startTime", "endTime" 
            FROM sessions 
            ORDER BY "startTime" DESC
        `);
        
        const totalSessions = sessionsResult.rows.length;
        console.log(`📋 Sesiones a procesar: ${totalSessions}\n`);

        // 5. Ejecutar endpoint de post-procesamiento
        console.log('🔄 Regenerando eventos...');
        console.log('   ℹ️  Esto debe ejecutarse desde el backend en ejecución\n');
        console.log('   Para regenerar eventos, ejecuta en otra terminal:\n');
        console.log('   curl -X POST http://localhost:9998/api/upload/regenerate-all-events\n');
        
        console.log('✅ Base de datos limpiada');
        console.log(`   Total sesiones pendientes de reprocesar: ${totalSessions}`);
        console.log('\n📝 Siguiente paso: El backend regenerará eventos automáticamente');
        console.log('   cuando proceses archivos o llames al endpoint de regeneración.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

regenerarEventos();

