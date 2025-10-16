const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'dobacksoft',
    user: 'postgres',
    password: 'cosigein'
});

async function agregarColumnaKey() {
    try {
        console.log('🔧 Agregando columna "key" a RotativoMeasurement...');
        const sql = fs.readFileSync('./agregar-columna-key-rotativo.sql', 'utf8');
        await pool.query(sql);
        console.log('✅ Columna "key" agregada correctamente\n');
        
        // Verificar
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'RotativoMeasurement' 
            AND column_name = 'key';
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Verificación exitosa:');
            console.log(`   Columna: ${result.rows[0].column_name}`);
            console.log(`   Tipo: ${result.rows[0].data_type}\n`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

agregarColumnaKey();

