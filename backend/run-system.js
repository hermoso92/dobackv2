const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando sistema óptimo de procesamiento...');
    
    try {
        // 1. Verificar conexión a base de datos
        console.log('\n1️⃣ Verificando conexión a base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa');
        
        // 2. Verificar organización CMadrid
        console.log('\n2️⃣ Verificando organización CMadrid...');
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
            console.log('✅ Organización creada:', organization.id);
        } else {
            console.log('✅ Organización encontrada:', organization.id);
        }
        
        // 3. Verificar directorio de datos
        console.log('\n3️⃣ Verificando directorio de datos...');
        const dataPath = path.join(__dirname, 'data/datosDoback/CMadrid');
        
        if (!fs.existsSync(dataPath)) {
            console.log('❌ Directorio de datos no encontrado:', dataPath);
            return;
        }
        
        console.log('✅ Directorio encontrado');
        
        // 4. Escanear vehículos
        console.log('\n4️⃣ Escaneando vehículos...');
        const vehicleDirs = fs.readdirSync(dataPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        console.log('📁 Vehículos encontrados:', vehicleDirs);
        
        // 5. Verificar/crear vehículos en BD
        console.log('\n5️⃣ Verificando vehículos en base de datos...');
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
                console.log(`✅ Vehículo creado: ${vehicle.id}`);
            } else {
                console.log(`✅ Vehículo existente: ${vehicle.id}`);
            }
        }
        
        // 6. Analizar sesiones
        console.log('\n6️⃣ Analizando sesiones de datos...');
        const sessions = new Map();
        
        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(dataPath, vehicleDir);
            
            for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
                const typePath = path.join(vehiclePath, dataType);
                if (fs.existsSync(typePath)) {
                    const files = fs.readdirSync(typePath)
                        .filter(file => file.endsWith('.txt'));
                    
                    for (const file of files) {
                        const match = file.match(/^([A-Z_]+)_DOBACK(\d+)_(\d{8})_(\d+)\.txt$/);
                        if (match) {
                            const [, fileType, vehicleId, date, sequence] = match;
                            const sessionKey = `${vehicleId}_${date}_${sequence}`;
                            
                            if (!sessions.has(sessionKey)) {
                                sessions.set(sessionKey, {
                                    vehicleId: `DOBACK${vehicleId}`,
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
        
        console.log(`📊 Total de sesiones detectadas: ${sessions.size}`);
        
        // 7. Procesar primeras 3 sesiones como prueba
        console.log('\n7️⃣ Procesando primeras 3 sesiones...');
        let processed = 0;
        
        for (const [key, session] of sessions) {
            if (processed >= 3) break;
            
            console.log(`\n🔍 Procesando sesión: ${key}`);
            
            // Verificar si la sesión ya existe
            const existingSession = await prisma.session.findFirst({
                where: {
                    vehicleId: session.vehicleId,
                    date: new Date(session.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
                    sequence: session.sequence
                }
            });
            
            if (existingSession) {
                console.log(`  ⏭️ Sesión ya existe: ${existingSession.id}`);
                processed++;
                continue;
            }
            
            // Crear sesión
            const newSession = await prisma.session.create({
                data: {
                    vehicleId: session.vehicleId,
                    date: new Date(session.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
                    sequence: session.sequence,
                    status: 'PROCESSED'
                }
            });
            
            console.log(`  ✅ Sesión creada: ${newSession.id}`);
            processed++;
        }
        
        console.log('\n✅ Sistema óptimo ejecutado correctamente');
        console.log(`📊 Resumen:`);
        console.log(`  - Organización: ${organization.name}`);
        console.log(`  - Vehículos: ${vehicleDirs.length}`);
        console.log(`  - Sesiones detectadas: ${sessions.size}`);
        console.log(`  - Sesiones procesadas: ${processed}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 