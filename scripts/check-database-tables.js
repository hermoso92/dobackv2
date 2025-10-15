/**
 * Script para verificar qué tablas existen en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseTables() {
    console.log('🔍 VERIFICANDO TABLAS EN LA BASE DE DATOS');
    console.log('========================================\n');

    try {
        // Conectar a la base de datos
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        // Lista de tablas que esperamos encontrar
        const expectedTables = [
            'Session',
            'GpsMeasurement', 
            'RotativoMeasurement',
            'StabilityEvent',
            'StabilityMeasurement',
            'Vehicle',
            'Organization',
            'User'
        ];

        console.log('📋 Verificando tablas esperadas:');
        
        for (const tableName of expectedTables) {
            try {
                // Intentar hacer una consulta count a cada tabla
                const result = await prisma[tableName].count();
                console.log(`✅ ${tableName}: ${result} registros`);
            } catch (error) {
                console.log(`❌ ${tableName}: Error - ${error.message}`);
            }
        }

        console.log('\n🔍 Verificando estructura de la tabla Session:');
        try {
            const sampleSession = await prisma.session.findFirst({
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    vehicleId: true,
                    organizationId: true
                }
            });
            
            if (sampleSession) {
                console.log('✅ Estructura de Session:');
                console.log(JSON.stringify(sampleSession, null, 2));
            } else {
                console.log('⚠️ No hay sesiones en la tabla');
            }
        } catch (error) {
            console.log(`❌ Error accediendo a Session: ${error.message}`);
        }

        console.log('\n🔍 Verificando estructura de la tabla GpsMeasurement:');
        try {
            const sampleGPS = await prisma.gpsMeasurement.findFirst({
                select: {
                    id: true,
                    sessionId: true,
                    timestamp: true,
                    latitude: true,
                    longitude: true,
                    speed: true
                }
            });
            
            if (sampleGPS) {
                console.log('✅ Estructura de GpsMeasurement:');
                console.log(JSON.stringify(sampleGPS, null, 2));
            } else {
                console.log('⚠️ No hay mediciones GPS en la tabla');
            }
        } catch (error) {
            console.log(`❌ Error accediendo a GpsMeasurement: ${error.message}`);
        }

        console.log('\n🔍 Verificando estructura de la tabla RotativoMeasurement:');
        try {
            const sampleRotativo = await prisma.rotativoMeasurement.findFirst({
                select: {
                    id: true,
                    sessionId: true,
                    timestamp: true,
                    state: true
                }
            });
            
            if (sampleRotativo) {
                console.log('✅ Estructura de RotativoMeasurement:');
                console.log(JSON.stringify(sampleRotativo, null, 2));
            } else {
                console.log('⚠️ No hay mediciones de rotativo en la tabla');
            }
        } catch (error) {
            console.log(`❌ Error accediendo a RotativoMeasurement: ${error.message}`);
        }

        // Intentar diferentes nombres para la tabla de eventos de estabilidad
        console.log('\n🔍 Buscando tabla de eventos de estabilidad:');
        const stabilityTableNames = [
            'StabilityEvent',
            'stabilityEvent', 
            'stability_events',
            'StabilityEvents',
            'Event',
            'Events'
        ];

        for (const tableName of stabilityTableNames) {
            try {
                const result = await prisma[tableName].count();
                console.log(`✅ ${tableName}: ${result} registros`);
                
                // Si encontramos la tabla, mostrar una muestra
                if (result > 0) {
                    const sample = await prisma[tableName].findFirst();
                    console.log(`   Muestra: ${JSON.stringify(sample, null, 2)}`);
                }
            } catch (error) {
                console.log(`❌ ${tableName}: No existe o error - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar verificación
checkDatabaseTables().catch(console.error);
