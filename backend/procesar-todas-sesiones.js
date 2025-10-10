const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚀 PROCESANDO TODAS LAS SESIONES MASIVAMENTE');
console.log('============================================');

const prisma = new PrismaClient();

async function procesarTodasSesiones() {
    try {
        // PASO 1: Verificar conexión a base de datos
        console.log('\n1️⃣ VERIFICANDO CONEXIÓN A BASE DE DATOS...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa a PostgreSQL');
        
        // PASO 2: Obtener organización y usuario admin
        console.log('\n2️⃣ OBTENIENDO DATOS DE CONFIGURACIÓN...');
        const organization = await prisma.organization.findFirst({
            where: { name: 'CMadrid' }
        });
        
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@cmadrid.com' }
        });
        
        if (!organization || !adminUser) {
            console.log('❌ ERROR: Organización o usuario admin no encontrados');
            console.log('   Ejecuta primero: node ejecutar-sistema-completo.js');
            return;
        }
        
        console.log(`✅ Organización: ${organization.name}`);
        console.log(`✅ Usuario admin: ${adminUser.name}`);
        
        // PASO 3: Escanear directorio de datos
        console.log('\n3️⃣ ESCANEANDO DIRECTORIO DE DATOS...');
        const dataPath = path.join(__dirname, 'data/datosDoback/CMadrid');
        
        if (!fs.existsSync(dataPath)) {
            console.log('❌ ERROR: Directorio de datos no encontrado');
            return;
        }
        
        const vehicleDirs = fs.readdirSync(dataPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        console.log(`✅ Vehículos encontrados: ${vehicleDirs.length}`);
        
        // PASO 4: Crear mapeo de vehículos
        console.log('\n4️⃣ CREANDO MAPEO DE VEHÍCULOS...');
        const vehicleMapping = new Map();
        for (const vehicleDir of vehicleDirs) {
            const vehicle = await prisma.vehicle.findFirst({
                where: { identifier: vehicleDir }
            });
            if (vehicle) {
                vehicleMapping.set(vehicleDir, vehicle.id);
            }
        }
        
        console.log(`✅ Mapeo creado para ${vehicleMapping.size} vehículos`);
        
        // PASO 5: Analizar todas las sesiones
        console.log('\n5️⃣ ANALIZANDO TODAS LAS SESIONES...');
        const sessions = new Map();
        let totalFiles = 0;
        
        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(dataPath, vehicleDir);
            console.log(`\n🔍 Analizando vehículo: ${vehicleDir}`);
            
            for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
                const typePath = path.join(vehiclePath, dataType);
                if (fs.existsSync(typePath)) {
                    const files = fs.readdirSync(typePath)
                        .filter(file => file.endsWith('.txt'));
                    
                    totalFiles += files.length;
                    console.log(`   📁 ${dataType}: ${files.length} archivos`);
                    
                    for (const file of files) {
                        const match = file.match(/^([A-Z_]+)_DOBACK(\d+)_(\d{8})_(\d+)\.txt$/);
                        if (match) {
                            const [, fileType, vehicleId, date, sequence] = match;
                            const sessionKey = `${vehicleId}_${date}_${sequence}`;
                            
                            if (!sessions.has(sessionKey)) {
                                sessions.set(sessionKey, {
                                    vehicleId: vehicleMapping.get(vehicleDir),
                                    date,
                                    sequence: parseInt(sequence),
                                    files: { GPS: [], CAN: [], ESTABILIDAD: [], ROTATIVO: [] }
                                });
                            }
                            
                            sessions.get(sessionKey).files[fileType] = file;
                        }
                    }
                }
            }
        }
        
        console.log(`\n📊 RESUMEN DE DATOS:`);
        console.log(`   - Total archivos: ${totalFiles}`);
        console.log(`   - Sesiones detectadas: ${sessions.size}`);
        
        if (sessions.size === 0) {
            console.log('❌ ERROR: No se detectaron sesiones válidas');
            return;
        }
        
        // PASO 6: Procesar todas las sesiones
        console.log('\n6️⃣ PROCESANDO TODAS LAS SESIONES...');
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        const batchSize = 100; // Procesar en lotes de 100
        
        const sessionEntries = Array.from(sessions.entries());
        const totalSessions = sessionEntries.length;
        
        console.log(`📊 Procesando ${totalSessions} sesiones en lotes de ${batchSize}...`);
        
        for (let i = 0; i < sessionEntries.length; i += batchSize) {
            const batch = sessionEntries.slice(i, i + batchSize);
            console.log(`\n📦 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalSessions / batchSize)}`);
            
            for (const [key, session] of batch) {
                try {
                    // Convertir fecha de YYYYMMDD a DateTime
                    const sessionDate = new Date(session.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
                    
                    // Verificar si la sesión ya existe
                    const existingSession = await prisma.session.findFirst({
                        where: {
                            vehicleId: session.vehicleId,
                            startTime: sessionDate,
                            sequence: session.sequence
                        }
                    });
                    
                    if (existingSession) {
                        skipped++;
                        continue;
                    }
                    
                    // Crear sesión
                    await prisma.session.create({
                        data: {
                            vehicleId: session.vehicleId,
                            userId: adminUser.id,
                            organizationId: organization.id,
                            startTime: sessionDate,
                            endTime: sessionDate,
                            sequence: session.sequence,
                            sessionNumber: session.sequence,
                            status: 'COMPLETED',
                            type: 'ROUTINE',
                            source: 'AUTOMATIC_UPLOAD'
                        }
                    });
                    
                    processed++;
                    
                    // Mostrar progreso cada 50 sesiones
                    if (processed % 50 === 0) {
                        console.log(`   ✅ Procesadas: ${processed}, Omitidas: ${skipped}, Errores: ${errors}`);
                    }
                    
                } catch (error) {
                    console.log(`   ❌ Error procesando sesión ${key}: ${error.message}`);
                    errors++;
                }
            }
            
            // Pausa entre lotes para evitar sobrecarga
            if (i + batchSize < sessionEntries.length) {
                console.log('   ⏸️ Pausa entre lotes...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // PASO 7: Resumen final
        console.log('\n============================================');
        console.log('✅ PROCESAMIENTO MASIVO COMPLETADO');
        console.log('============================================');
        console.log(`📊 RESUMEN FINAL:`);
        console.log(`   - Organización: ${organization.name}`);
        console.log(`   - Vehículos: ${vehicleDirs.length}`);
        console.log(`   - Archivos escaneados: ${totalFiles}`);
        console.log(`   - Sesiones detectadas: ${totalSessions}`);
        console.log(`   - Sesiones procesadas: ${processed}`);
        console.log(`   - Sesiones omitidas: ${skipped}`);
        console.log(`   - Errores: ${errors}`);
        console.log(`   - Tasa de éxito: ${((processed / totalSessions) * 100).toFixed(2)}%`);
        
        if (errors > 0) {
            console.log('\n⚠️ Algunas sesiones tuvieron errores. Revisa los logs anteriores.');
        } else {
            console.log('\n🎉 ¡Todas las sesiones procesadas exitosamente!');
        }
        
        console.log('\n🎯 Sistema de procesamiento masivo completado');
        console.log('💡 Ahora puedes usar el dashboard para ver los datos procesados');
        
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión a base de datos cerrada');
    }
}

// Ejecutar el procesamiento masivo
procesarTodasSesiones(); 