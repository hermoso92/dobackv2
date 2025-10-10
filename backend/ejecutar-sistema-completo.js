const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO SISTEMA ÓPTIMO DE PROCESAMIENTO MASIVO');
console.log('==================================================');

const prisma = new PrismaClient();

async function ejecutarSistema() {
    try {
        // PASO 1: Verificar conexión a base de datos
        console.log('\n1️⃣ VERIFICANDO CONEXIÓN A BASE DE DATOS...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa a PostgreSQL');
        
        // PASO 2: Verificar organización CMadrid
        console.log('\n2️⃣ VERIFICANDO ORGANIZACIÓN CMADRID...');
        let organization = await prisma.organization.findFirst({
            where: { name: 'CMadrid' }
        });
        
        if (!organization) {
            console.log('📝 Creando organización CMadrid...');
            organization = await prisma.organization.create({
                data: {
                    name: 'CMadrid',
                    apiKey: 'cmadrid-api-key-2025'
                }
            });
            console.log(`✅ Organización creada con ID: ${organization.id}`);
        } else {
            console.log(`✅ Organización encontrada: ${organization.name} (ID: ${organization.id})`);
        }
        
        // PASO 3: Verificar usuario admin
        console.log('\n3️⃣ VERIFICANDO USUARIO ADMIN...');
        let adminUser = await prisma.user.findFirst({
            where: { email: 'admin@cmadrid.com' }
        });
        
        if (!adminUser) {
            console.log('📝 Creando usuario admin...');
            adminUser = await prisma.user.create({
                data: {
                    email: 'admin@cmadrid.com',
                    name: 'Administrador CMadrid',
                    password: 'admin123',
                    organizationId: organization.id,
                    role: 'ADMIN'
                }
            });
            console.log(`✅ Usuario admin creado: ${adminUser.id}`);
        } else {
            console.log(`✅ Usuario admin encontrado: ${adminUser.id}`);
        }
        
        // PASO 4: Verificar directorio de datos
        console.log('\n4️⃣ VERIFICANDO DIRECTORIO DE DATOS...');
        const dataPath = path.join(__dirname, 'data/datosDoback/CMadrid');
        console.log(`📁 Ruta de datos: ${dataPath}`);
        
        if (!fs.existsSync(dataPath)) {
            console.log('❌ ERROR: Directorio de datos no encontrado');
            console.log('   Verifica que existe: backend/data/datosDoback/CMadrid');
            return;
        }
        
        console.log('✅ Directorio de datos encontrado');
        
        // PASO 5: Escanear vehículos
        console.log('\n5️⃣ ESCANEANDO VEHÍCULOS...');
        const vehicleDirs = fs.readdirSync(dataPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        console.log(`📁 Vehículos encontrados: ${vehicleDirs.join(', ')}`);
        console.log(`📊 Total de vehículos: ${vehicleDirs.length}`);
        
        if (vehicleDirs.length === 0) {
            console.log('❌ ERROR: No se encontraron vehículos');
            return;
        }
        
        // PASO 6: Verificar/crear vehículos en BD
        console.log('\n6️⃣ VERIFICANDO VEHÍCULOS EN BASE DE DATOS...');
        const vehiclesCreated = [];
        const vehiclesExisting = [];
        
        for (const vehicleDir of vehicleDirs) {
            const vehicleId = vehicleDir;
            
            let vehicle = await prisma.vehicle.findFirst({
                where: { identifier: vehicleId }
            });
            
            if (!vehicle) {
                console.log(`📝 Creando vehículo: ${vehicleId}`);
                vehicle = await prisma.vehicle.create({
                    data: {
                        name: vehicleId,
                        licensePlate: vehicleId,
                        model: 'DOBACK',
                        identifier: vehicleId,
                        type: 'VAN',
                        organizationId: organization.id,
                        status: 'ACTIVE'
                    }
                });
                vehiclesCreated.push(vehicleId);
                console.log(`✅ Vehículo creado: ${vehicle.id}`);
            } else {
                vehiclesExisting.push(vehicleId);
                console.log(`✅ Vehículo existente: ${vehicle.id}`);
            }
        }
        
        console.log(`📊 Resumen vehículos:`);
        console.log(`   - Creados: ${vehiclesCreated.length}`);
        console.log(`   - Existentes: ${vehiclesExisting.length}`);
        
        // PASO 7: Analizar sesiones de datos
        console.log('\n7️⃣ ANALIZANDO SESIONES DE DATOS...');
        const sessions = new Map();
        let totalFiles = 0;
        
        // Crear mapeo de identificadores a IDs de vehículos
        const vehicleMapping = new Map();
        for (const vehicleDir of vehicleDirs) {
            const vehicle = await prisma.vehicle.findFirst({
                where: { identifier: vehicleDir }
            });
            if (vehicle) {
                vehicleMapping.set(vehicleDir, vehicle.id);
            }
        }
        
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
                                    vehicleId: vehicleMapping.get(vehicleDir), // Usar ID real del vehículo
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
        
        // PASO 8: Procesar primeras 5 sesiones como prueba
        console.log('\n8️⃣ PROCESANDO PRIMERAS 5 SESIONES...');
        let processed = 0;
        let skipped = 0;
        
        for (const [key, session] of sessions) {
            if (processed >= 5) break;
            
            console.log(`\n🔍 Procesando sesión: ${key}`);
            
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
                console.log(`   ⏭️ Sesión ya existe: ${existingSession.id}`);
                skipped++;
                continue;
            }
            
            // Crear sesión con todos los campos requeridos
            const newSession = await prisma.session.create({
                data: {
                    vehicleId: session.vehicleId,
                    userId: adminUser.id,
                    organizationId: organization.id,
                    startTime: sessionDate,
                    endTime: sessionDate, // Por ahora igual que startTime
                    sequence: session.sequence,
                    sessionNumber: session.sequence,
                    status: 'COMPLETED',
                    type: 'ROUTINE',
                    source: 'AUTOMATIC_UPLOAD'
                }
            });
            
            console.log(`   ✅ Sesión creada: ${newSession.id}`);
            processed++;
        }
        
        // PASO 9: Resumen final
        console.log('\n==================================================');
        console.log('✅ SISTEMA ÓPTIMO EJECUTADO CORRECTAMENTE');
        console.log('==================================================');
        console.log(`📊 RESUMEN FINAL:`);
        console.log(`   - Organización: ${organization.name}`);
        console.log(`   - Usuario admin: ${adminUser.name}`);
        console.log(`   - Vehículos totales: ${vehicleDirs.length}`);
        console.log(`   - Vehículos creados: ${vehiclesCreated.length}`);
        console.log(`   - Vehículos existentes: ${vehiclesExisting.length}`);
        console.log(`   - Archivos escaneados: ${totalFiles}`);
        console.log(`   - Sesiones detectadas: ${sessions.size}`);
        console.log(`   - Sesiones procesadas: ${processed}`);
        console.log(`   - Sesiones omitidas: ${skipped}`);
        console.log('\n🎯 El sistema está listo para procesamiento masivo');
        console.log('💡 Para procesar todas las sesiones, ejecuta: node procesar-todas-sesiones.js');
        
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:');
        console.error(error);
        console.error('\n🔧 Posibles soluciones:');
        console.error('   1. Verifica que PostgreSQL esté ejecutándose');
        console.error('   2. Verifica la variable DATABASE_URL en .env');
        console.error('   3. Ejecuta: npx prisma generate');
        console.error('   4. Ejecuta: npx prisma db push');
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión a base de datos cerrada');
    }
}

// Ejecutar el sistema
ejecutarSistema(); 