const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function setupDailyProcessing() {
    try {
        console.log('🚀 Configurando sistema de procesamiento diario automático...');

        // Verificar conexión a la base de datos
        console.log('📡 Verificando conexión a la base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión a la base de datos establecida');

        // 1. Verificar que existe la organización CMadrid
        let organization = await prisma.organization.findFirst({
            where: {
                name: {
                    contains: 'CMadrid',
                    mode: 'insensitive'
                }
            }
        });

        if (!organization) {
            console.log('📋 Creando organización CMadrid...');
            organization = await prisma.organization.create({
                data: {
                    name: 'CMadrid',
                    apiKey: 'cmadrid-api-key-' + Date.now()
                }
            });
            console.log('✅ Organización CMadrid creada:', organization.id);
        } else {
            console.log('✅ Organización CMadrid encontrada:', organization.id);
        }

        // 2. Verificar que existen los vehículos
        const vehicleIds = ['doback022', 'doback023', 'doback024', 'doback025', 'doback027', 'doback028'];
        const vehicles = [];

        for (const vehicleId of vehicleIds) {
            let vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: organization.id
                }
            });

            if (!vehicle) {
                console.log(`📋 Creando vehículo ${vehicleId}...`);
                vehicle = await prisma.vehicle.create({
                    data: {
                        id: vehicleId,
                        name: `Vehículo ${vehicleId}`,
                        organizationId: organization.id,
                        active: true,
                        type: 'BOMBERO',
                        plate: `PL-${vehicleId}`,
                        model: 'Doback',
                        year: 2025
                    }
                });
                console.log(`✅ Vehículo ${vehicleId} creado`);
            } else {
                console.log(`✅ Vehículo ${vehicleId} encontrado`);
            }

            vehicles.push(vehicle);
        }

        // 3. Verificar estructura de directorios
        const fs = require('fs');
        const basePath = path.join(process.cwd(), 'backend/data/datosDoback/CMadrid');
        
        console.log(`📁 Verificando estructura de directorios en: ${basePath}`);

        for (const vehicle of vehicles) {
            const vehiclePath = path.join(basePath, vehicle.id);
            
            if (!fs.existsSync(vehiclePath)) {
                console.log(`📁 Creando directorio para vehículo ${vehicle.id}...`);
                fs.mkdirSync(vehiclePath, { recursive: true });
                
                // Crear subdirectorios
                const subdirs = ['CAN', 'estabilidad', 'GPS', 'ROTATIVO'];
                for (const subdir of subdirs) {
                    const subdirPath = path.join(vehiclePath, subdir);
                    if (!fs.existsSync(subdirPath)) {
                        fs.mkdirSync(subdirPath, { recursive: true });
                        console.log(`  📁 Creado subdirectorio: ${subdir}`);
                    }
                }
            } else {
                console.log(`✅ Directorio del vehículo ${vehicle.id} existe`);
            }
        }

        // 4. Crear usuario administrador si no existe
        const adminEmail = 'admin@cmadrid.com';
        let adminUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!adminUser) {
            console.log('👤 Creando usuario administrador...');
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            adminUser = await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Administrador CMadrid',
                    password: hashedPassword,
                    role: 'ADMIN',
                    organizationId: organization.id,
                    status: 'ACTIVE'
                }
            });
            console.log('✅ Usuario administrador creado:', adminEmail);
        } else {
            console.log('✅ Usuario administrador existe:', adminEmail);
        }

        // 5. Mostrar resumen de configuración
        console.log('\n🎉 Configuración completada exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`  - Organización: ${organization.name} (${organization.id})`);
        console.log(`  - Vehículos configurados: ${vehicles.length}`);
        console.log(`  - Usuario admin: ${adminEmail} / admin123`);
        console.log(`  - Ruta de datos: ${basePath}`);
        
        console.log('\n🔧 Próximos pasos:');
        console.log('  1. Reiniciar el servidor backend');
        console.log('  2. El servicio de procesamiento diario se iniciará automáticamente');
        console.log('  3. Procesará datos todos los días a las 2:00 AM');
        console.log('  4. Usar /api/independent para procesamiento manual');
        console.log('  5. Usar /api/daily-processing para monitoreo');

    } catch (error) {
        console.error('❌ Error en la configuración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    setupDailyProcessing()
        .then(() => {
            console.log('\n✅ Configuración finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Error en la configuración:', error);
            process.exit(1);
        });
}

module.exports = { setupDailyProcessing };
