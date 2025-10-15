const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'dobacksoft',
    user: 'postgres',
    password: 'cosigein'
});

async function agregarColumnas() {
    try {
        console.log('🔧 Agregando columnas faltantes a OperationalKey...');
        const sql = fs.readFileSync('./agregar-columnas-faltantes.sql', 'utf8');
        await pool.query(sql);
        console.log('✅ Columnas agregadas correctamente\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

agregarColumnas();

