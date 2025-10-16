/**
 * Verificar estructura de tabla OperationalKey en PostgreSQL
 */

const { Pool } = require('pg');

async function checkTable() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'dobacksoft',
        user: 'postgres',
        password: 'cosigein'
    });
    
    try {
        // Verificar si la tabla existe
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'OperationalKey'
            );
        `);
        
        console.log('\n📊 Verificando tabla OperationalKey\n');
        console.log(`Tabla existe: ${tableExists.rows[0].exists}`);
        
        if (tableExists.rows[0].exists) {
            // Obtener columnas
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns
                WHERE table_name = 'OperationalKey'
                ORDER BY ordinal_position;
            `);
            
            console.log('\n📋 Columnas de la tabla:\n');
            columns.rows.forEach(col => {
                console.log(`  ${col.column_name}: ${col.data_type}`);
            });
            
            // Buscar si existe columna "existe"
            const existeCol = columns.rows.find(c => c.column_name === 'existe');
            console.log(`\n🔍 Columna "existe": ${existeCol ? '✅ SÍ existe' : '❌ NO existe'}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTable();

