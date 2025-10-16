const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'dobacksoft',
    user: 'postgres',
    password: 'cosigein'
});

async function verificarTablas() {
    try {
        console.log('🔍 Verificando tablas en BD...\n');
        
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('OperationalKey', 'DataQualityMetrics')
            ORDER BY table_name;
        `);
        
        console.log('Tablas encontradas:');
        tables.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });
        
        if (tables.rows.length === 0) {
            console.log('  ❌ Ninguna tabla encontrada');
        }
        
        console.log('\n🔍 Verificando columnas de OperationalKey...\n');
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'OperationalKey'
            ORDER BY ordinal_position;
        `);
        
        if (cols.rows.length > 0) {
            console.log('Columnas:');
            cols.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type}`);
            });
        } else {
            console.log('  ❌ Tabla OperationalKey no existe o no tiene columnas');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verificarTablas();

