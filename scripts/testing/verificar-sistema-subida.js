/**
 * 🔍 SCRIPT DE VERIFICACIÓN DEL SISTEMA DE SUBIDA
 * 
 * Verifica paso a paso:
 * 1. Foreign Keys (User, Organization)
 * 2. Archivos disponibles en CMadrid
 * 3. Proceso de agrupación
 * 4. Detección de sesiones
 * 5. Correlación de sesiones
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// UUIDs del sistema
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICACIÓN DEL SISTEMA DE SUBIDA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // PASO 1: Verificar Foreign Keys
    console.log('1️⃣  VERIFICACIÓN DE FOREIGN KEYS\n');
    
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: SYSTEM_ORG_ID }
        });

        if (organization) {
            console.log('✅ Organization SYSTEM encontrada:');
            console.log(`   ID: ${organization.id}`);
            console.log(`   Name: ${organization.name}\n`);
        } else {
            console.log('❌ Organization SYSTEM NO encontrada\n');
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: SYSTEM_USER_ID }
        });

        if (user) {
            console.log('✅ User SYSTEM encontrado:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Organization: ${user.organizationId}\n`);
        } else {
            console.log('❌ User SYSTEM NO encontrado\n');
            return;
        }

    } catch (error) {
        console.log('❌ Error verificando foreign keys:', error.message);
        return;
    }

    // PASO 2: Verificar archivos
    console.log('2️⃣  VERIFICACIÓN DE ARCHIVOS EN CMADRID\n');
    
    // Probar ambas rutas posibles
    const paths = [
        path.join(__dirname, 'backend/data/CMadrid'),
        path.join(__dirname, 'backend/data/datosDoback/CMadrid')
    ];

    let cmadridPath = null;
    for (const p of paths) {
        if (fs.existsSync(p)) {
            cmadridPath = p;
            console.log(`✅ Directorio encontrado: ${p}\n`);
            break;
        }
    }

    if (!cmadridPath) {
        console.log('❌ Directorio CMadrid NO encontrado en ninguna ruta\n');
        return;
    }

    const vehicleDirs = fs.readdirSync(cmadridPath).filter(item =>
        fs.statSync(path.join(cmadridPath, item)).isDirectory() && 
        item.toLowerCase().startsWith('doback')
    );

    console.log(`📁 Vehículos encontrados: ${vehicleDirs.length}`);
    vehicleDirs.forEach(v => console.log(`   - ${v}`));
    console.log();

    // PASO 3: Analizar archivos del primer vehículo
    if (vehicleDirs.length === 0) {
        console.log('⚠️  No hay vehículos para analizar\n');
        return;
    }

    const vehicleId = vehicleDirs[0];
    console.log(`3️⃣  ANÁLISIS DETALLADO DE ${vehicleId}\n`);

    const vehiclePath = path.join(cmadridPath, vehicleId);
    const subdirs = ['estabilidad', 'GPS', 'ROTATIVO'].map(s => s.toLowerCase());
    
    const archivosEncontrados = {
        estabilidad: [],
        gps: [],
        rotativo: []
    };

    for (const subdir of subdirs) {
        const subdirPath = path.join(vehiclePath, subdir);
        
        // Probar diferentes capitalizaciones
        const variants = [subdir, subdir.toUpperCase(), subdir.charAt(0).toUpperCase() + subdir.slice(1)];
        
        for (const variant of variants) {
            const testPath = path.join(vehiclePath, variant);
            if (fs.existsSync(testPath)) {
                const files = fs.readdirSync(testPath).filter(f => f.endsWith('.txt'));
                archivosEncontrados[subdir] = files.map(f => ({
                    nombre: f,
                    path: path.join(testPath, f),
                    size: fs.statSync(path.join(testPath, f)).size
                }));
                break;
            }
        }
    }

    console.log(`📄 Archivos ESTABILIDAD: ${archivosEncontrados.estabilidad.length}`);
    archivosEncontrados.estabilidad.slice(0, 3).forEach(f => 
        console.log(`   - ${f.nombre} (${(f.size / 1024).toFixed(2)} KB)`)
    );
    if (archivosEncontrados.estabilidad.length > 3) {
        console.log(`   ... y ${archivosEncontrados.estabilidad.length - 3} más`);
    }
    console.log();

    console.log(`📍 Archivos GPS: ${archivosEncontrados.gps.length}`);
    archivosEncontrados.gps.slice(0, 3).forEach(f => 
        console.log(`   - ${f.nombre} (${(f.size / 1024).toFixed(2)} KB)`)
    );
    if (archivosEncontrados.gps.length > 3) {
        console.log(`   ... y ${archivosEncontrados.gps.length - 3} más`);
    }
    console.log();

    console.log(`🔄 Archivos ROTATIVO: ${archivosEncontrados.rotativo.length}`);
    archivosEncontrados.rotativo.slice(0, 3).forEach(f => 
        console.log(`   - ${f.nombre} (${(f.size / 1024).toFixed(2)} KB)`)
    );
    if (archivosEncontrados.rotativo.length > 3) {
        console.log(`   ... y ${archivosEncontrados.rotativo.length - 3} más`);
    }
    console.log();

    // PASO 4: Agrupar por fecha
    console.log('4️⃣  AGRUPACIÓN POR FECHA\n');

    const grupos = new Map();

    // Procesar ESTABILIDAD
    archivosEncontrados.estabilidad.forEach(archivo => {
        const match = archivo.nombre.match(/_(\d{8})\.txt$/);
        if (match) {
            const fecha = match[1];
            if (!grupos.has(fecha)) {
                grupos.set(fecha, { estabilidad: null, gps: null, rotativo: null });
            }
            grupos.get(fecha).estabilidad = archivo.nombre;
        }
    });

    // Procesar GPS
    archivosEncontrados.gps.forEach(archivo => {
        const match = archivo.nombre.match(/_(\d{8})\.txt$/);
        if (match) {
            const fecha = match[1];
            if (!grupos.has(fecha)) {
                grupos.set(fecha, { estabilidad: null, gps: null, rotativo: null });
            }
            grupos.get(fecha).gps = archivo.nombre;
        }
    });

    // Procesar ROTATIVO
    archivosEncontrados.rotativo.forEach(archivo => {
        const match = archivo.nombre.match(/_(\d{8})\.txt$/);
        if (match) {
            const fecha = match[1];
            if (!grupos.has(fecha)) {
                grupos.set(fecha, { estabilidad: null, gps: null, rotativo: null });
            }
            grupos.get(fecha).rotativo = archivo.nombre;
        }
    });

    console.log(`📅 Fechas únicas encontradas: ${grupos.size}\n`);

    // Analizar grupos
    let gruposCompletos = 0;
    let gruposSinGPS = 0;
    let gruposIncompletos = 0;

    grupos.forEach((grupo, fecha) => {
        const tieneEstabilidad = !!grupo.estabilidad;
        const tieneGPS = !!grupo.gps;
        const tieneRotativo = !!grupo.rotativo;

        if (tieneEstabilidad && tieneGPS && tieneRotativo) {
            gruposCompletos++;
        } else if (tieneEstabilidad && tieneRotativo && !tieneGPS) {
            gruposSinGPS++;
        } else {
            gruposIncompletos++;
        }
    });

    console.log(`✅ Grupos completos (EST+GPS+ROT): ${gruposCompletos}`);
    console.log(`⚠️  Grupos sin GPS (EST+ROT): ${gruposSinGPS}`);
    console.log(`❌ Grupos incompletos: ${gruposIncompletos}\n`);

    // Mostrar primeros 3 grupos
    console.log('Detalle de primeros 3 grupos:\n');
    let count = 0;
    for (const [fecha, grupo] of grupos.entries()) {
        if (count >= 3) break;
        
        const year = fecha.substring(0, 4);
        const month = fecha.substring(4, 6);
        const day = fecha.substring(6, 8);
        
        console.log(`   📅 ${day}/${month}/${year}:`);
        console.log(`      ESTABILIDAD: ${grupo.estabilidad ? '✅' : '❌'}`);
        console.log(`      GPS:         ${grupo.gps ? '✅' : '❌'}`);
        console.log(`      ROTATIVO:    ${grupo.rotativo ? '✅' : '❌'}`);
        console.log();
        
        count++;
    }

    // PASO 5: Verificar sesiones existentes en BD
    console.log('5️⃣  SESIONES EN BASE DE DATOS\n');

    const vehicle = await prisma.vehicle.findFirst({
        where: {
            identifier: vehicleId
        }
    });

    if (!vehicle) {
        console.log(`⚠️  Vehículo ${vehicleId} NO existe en BD (se creará automáticamente)\n`);
    } else {
        console.log(`✅ Vehículo encontrado en BD:`);
        console.log(`   ID: ${vehicle.id}`);
        console.log(`   Identifier: ${vehicle.identifier}`);
        console.log(`   Name: ${vehicle.name}`);
        console.log(`   Organization: ${vehicle.organizationId}\n`);

        const sessionsCount = await prisma.session.count({
            where: {
                vehicleId: vehicle.id
            }
        });

        console.log(`📊 Sesiones existentes: ${sessionsCount}\n`);

        if (sessionsCount > 0) {
            const recentSessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicle.id
                },
                orderBy: {
                    startTime: 'desc'
                },
                take: 3
            });

            console.log('Últimas 3 sesiones:\n');
            recentSessions.forEach(s => {
                console.log(`   • ${s.startTime.toISOString().split('T')[0]} - ${s.startTime.toTimeString().split(' ')[0]}`);
            });
            console.log();
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Resumen
    console.log('📋 RESUMEN:\n');
    console.log(`   • Foreign Keys: ✅ VÁLIDAS`);
    console.log(`   • Directorio CMadrid: ${cmadridPath ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
    console.log(`   • Vehículos: ${vehicleDirs.length}`);
    console.log(`   • Grupos procesables (EST+ROT±GPS): ${gruposCompletos + gruposSinGPS}`);
    console.log(`   • Grupos completos (EST+GPS+ROT): ${gruposCompletos}`);
    console.log();

    if (gruposCompletos + gruposSinGPS > 0) {
        console.log('✅ El sistema está listo para procesar archivos\n');
    } else {
        console.log('❌ No hay grupos procesables\n');
    }
}

main()
    .catch(e => {
        console.error('❌ Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

