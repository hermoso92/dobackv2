/**
 * Script para hacer que los campos lat/lon sean opcionales en stability_events
 * Corrige el error de NOT NULL constraint violation
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer la configuración de la base de datos desde .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function fixStabilityEventsCoords() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('🔧 Conectando a la base de datos...');
        
        // Leer el SQL de migración
        const sqlPath = path.join(__dirname, '../../database/fix_stability_events_nullable_coords.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        
        console.log('📝 Ejecutando migración para hacer lat/lon opcionales...');
        await pool.query(sql);
        
        console.log('✅ Migración completada exitosamente');
        console.log('   - Campo lat ahora permite NULL');
        console.log('   - Campo lon ahora permite NULL');
        
    } catch (error) {
        console.error('❌ Error ejecutando la migración:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixStabilityEventsCoords();

