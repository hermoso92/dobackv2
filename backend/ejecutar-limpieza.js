const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'dobacksoft',
    user: 'postgres',
    password: 'cosigein'
});

async function limpiarTrigger() {
    try {
        console.log('🔧 Eliminando trigger existente...');
        const sql = fs.readFileSync('./limpiar-trigger.sql', 'utf8');
        await pool.query(sql);
        console.log('✅ Trigger eliminado correctamente\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

limpiarTrigger();

