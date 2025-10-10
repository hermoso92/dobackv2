/**
 * Aplicar índices optimizados a la BD
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function aplicarIndices() {
    console.log('\n🔧 APLICANDO ÍNDICES OPTIMIZADOS A LA BD\n');
    
    try {
        // Leer script SQL
        const sqlPath = path.join(__dirname, 'optimizar-indices-bd.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Separar comandos (cada CREATE INDEX)
        const comandos = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.startsWith('CREATE INDEX'));
        
        console.log(`📊 Total índices a crear: ${comandos.length}\n`);
        
        let creados = 0;
        let existentes = 0;
        
        for (const comando of comandos) {
            try {
                const nombreMatch = comando.match(/idx_\w+/);
                const nombreIndice = nombreMatch ? nombreMatch[0] : '?';
                
                await prisma.$executeRawUnsafe(comando);
                console.log(`✅ Creado: ${nombreIndice}`);
                creados++;
            } catch (error) {
                if (error.message.includes('already exists')) {
                    const nombreMatch = comando.match(/idx_\w+/);
                    const nombreIndice = nombreMatch ? nombreMatch[0] : '?';
                    console.log(`⚠️  Ya existe: ${nombreIndice}`);
                    existentes++;
                } else {
                    console.log(`❌ Error: ${error.message.substring(0, 100)}`);
                }
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log(`📊 RESUMEN:`);
        console.log(`   Índices creados: ${creados}`);
        console.log(`   Índices ya existentes: ${existentes}`);
        console.log(`   Total: ${creados + existentes}/${comandos.length}`);
        console.log('='.repeat(80));
        
        // Verificar índices creados
        console.log('\n📊 VERIFICANDO ÍNDICES CREADOS:\n');
        
        const indices = await prisma.$queryRaw`
            SELECT 
                tablename,
                indexname,
                pg_size_pretty(pg_relation_size(indexname::text::regclass)) as size
            FROM pg_indexes
            WHERE 
                schemaname = 'public'
                AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname
        `;
        
        let tablaActual = '';
        indices.forEach(idx => {
            if (idx.tablename !== tablaActual) {
                console.log(`\n📦 ${idx.tablename}:`);
                tablaActual = idx.tablename;
            }
            console.log(`   - ${idx.indexname.padEnd(40)} (${idx.size})`);
        });
        
        console.log('\n✅ ÍNDICES OPTIMIZADOS APLICADOS CORRECTAMENTE\n');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

aplicarIndices();

