const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 PROCESANDO SESIONES CORRECTAMENTE');
console.log('====================================');

const prisma = new PrismaClient();

// Función para leer cabecera de archivo y extraer fecha
function leerCabeceraArchivo(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Buscar línea que contenga fecha (formato: Tipo;fecha;vehículo;sesión)
        for (const line of lines) {
            if (line.includes(';') && line.match(/\d{8}/)) {
                const parts = line.split(';');
                if (parts.length >= 2) {
                    const fechaPart = parts[1];
                    const fechaMatch = fechaPart.match(/(\d{4})(\d{2})(\d{2})/);
                    if (fechaMatch) {
                        return {
                            fecha: fechaMatch[0],
                            tipo: parts[0],
                            vehiculo: parts[2] || '',
                            sesion: parts[3] || ''
                        };
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.log(`   ❌ Error leyendo cabecera de ${filePath}: ${error.message}`);
        return null;
    }
}

// Función para decodificar archivo CAN
async function decodificarArchivoCAN(filePath) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'data/DECODIFICADOR CAN/decodificador_can_unificado.py');
        
        if (!fs.existsSync(pythonScript)) {
            console.log(`   ⚠️ Decodificador CAN no encontrado: ${pythonScript}`);
            resolve(false);
            return;
        }
        
        const pythonProcess = spawn('python', [pythonScript, filePath]);
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`   ✅ CAN decodificado: ${path.basename(filePath)}`);
                resolve(true);
            } else {
                console.log(`   ❌ Error decodificando CAN: ${errorOutput}`);
                resolve(false);
            }
        });
    });
}

// Función para obtener tamaño de archivo en MB
function obtenerTamanoArchivoMB(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size / (1024 * 1024); // Convertir a MB
    } catch (error) {
        return 0;
    }
}

async function procesarSesionesCorrecto() {
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
        
        // PASO 5: Analizar archivos de estabilidad > 1MB
        console.log('\n5️⃣ ANALIZANDO ARCHIVOS DE ESTABILIDAD > 1MB...');
        const sesionesReales = new Map();
        
        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(dataPath, vehicleDir);
            console.log(`\n🔍 Analizando vehículo: ${vehicleDir}`);
            
            // Buscar archivos de estabilidad > 1MB
            const estabilidadPath = path.join(vehiclePath, 'estabilidad');
            if (!fs.existsSync(estabilidadPath)) {
                console.log(`   ⚠️ No hay carpeta estabilidad para ${vehicleDir}`);
                continue;
            }
            
            const archivosEstabilidad = fs.readdirSync(estabilidadPath)
                .filter(file => file.endsWith('.txt'))
                .map(file => ({
                    nombre: file,
                    ruta: path.join(estabilidadPath, file),
                    tamano: obtenerTamanoArchivoMB(path.join(estabilidadPath, file))
                }))
                .filter(archivo => archivo.tamano > 1); // Solo > 1MB
            
            console.log(`   📁 Estabilidad > 1MB: ${archivosEstabilidad.length} archivos`);
            
            // Para cada archivo de estabilidad > 1MB, buscar coincidencias
            for (const archivoEstabilidad of archivosEstabilidad) {
                console.log(`   🔍 Analizando: ${archivoEstabilidad.nombre} (${archivoEstabilidad.tamano.toFixed(2)}MB)`);
                
                // Leer cabecera del archivo de estabilidad
                const cabeceraEstabilidad = leerCabeceraArchivo(archivoEstabilidad.ruta);
                if (!cabeceraEstabilidad) {
                    console.log(`   ❌ No se pudo leer cabecera de estabilidad`);
                    continue;
                }
                
                console.log(`   📅 Fecha estabilidad: ${cabeceraEstabilidad.fecha}`);
                
                // Buscar archivos coincidentes en GPS, CAN y rotativo
                const archivosCoincidentes = {
                    estabilidad: archivoEstabilidad,
                    gps: null,
                    can: null,
                    rotativo: null
                };
                
                // Buscar GPS coincidente
                const gpsPath = path.join(vehiclePath, 'GPS');
                if (fs.existsSync(gpsPath)) {
                    const archivosGPS = fs.readdirSync(gpsPath)
                        .filter(file => file.endsWith('.txt'));
                    
                    for (const archivoGPS of archivosGPS) {
                        const cabeceraGPS = leerCabeceraArchivo(path.join(gpsPath, archivoGPS));
                        if (cabeceraGPS && cabeceraGPS.fecha === cabeceraEstabilidad.fecha) {
                            archivosCoincidentes.gps = {
                                nombre: archivoGPS,
                                ruta: path.join(gpsPath, archivoGPS),
                                cabecera: cabeceraGPS
                            };
                            console.log(`   ✅ GPS coincidente: ${archivoGPS}`);
                            break;
                        }
                    }
                }
                
                // Buscar CAN coincidente y decodificar
                const canPath = path.join(vehiclePath, 'CAN');
                if (fs.existsSync(canPath)) {
                    const archivosCAN = fs.readdirSync(canPath)
                        .filter(file => file.endsWith('.txt'));
                    
                    for (const archivoCAN of archivosCAN) {
                        const cabeceraCAN = leerCabeceraArchivo(path.join(canPath, archivoCAN));
                        if (cabeceraCAN && cabeceraCAN.fecha === cabeceraEstabilidad.fecha) {
                            console.log(`   🔧 Decodificando CAN: ${archivoCAN}`);
                            const decodificado = await decodificarArchivoCAN(path.join(canPath, archivoCAN));
                            
                            archivosCoincidentes.can = {
                                nombre: archivoCAN,
                                ruta: path.join(canPath, archivoCAN),
                                cabecera: cabeceraCAN,
                                decodificado: decodificado
                            };
                            break;
                        }
                    }
                }
                
                // Buscar rotativo coincidente
                const rotativoPath = path.join(vehiclePath, 'rotativo');
                if (fs.existsSync(rotativoPath)) {
                    const archivosRotativo = fs.readdirSync(rotativoPath)
                        .filter(file => file.endsWith('.txt'));
                    
                    for (const archivoRotativo of archivosRotativo) {
                        const cabeceraRotativo = leerCabeceraArchivo(path.join(rotativoPath, archivoRotativo));
                        if (cabeceraRotativo && cabeceraRotativo.fecha === cabeceraEstabilidad.fecha) {
                            archivosCoincidentes.rotativo = {
                                nombre: archivoRotativo,
                                ruta: path.join(rotativoPath, archivoRotativo),
                                cabecera: cabeceraRotativo
                            };
                            console.log(`   ✅ Rotativo coincidente: ${archivoRotativo}`);
                            break;
                        }
                    }
                }
                
                // Crear sesión solo si hay al menos estabilidad + otro archivo
                const archivosValidos = Object.values(archivosCoincidentes).filter(a => a !== null).length;
                if (archivosValidos >= 2) {
                    const sessionKey = `${vehicleDir}_${cabeceraEstabilidad.fecha}_${cabeceraEstabilidad.sesion}`;
                    
                    sesionesReales.set(sessionKey, {
                        vehicleId: vehicleMapping.get(vehicleDir),
                        fecha: cabeceraEstabilidad.fecha,
                        sesion: cabeceraEstabilidad.sesion,
                        archivos: archivosCoincidentes,
                        archivosValidos: archivosValidos
                    });
                    
                    console.log(`   ✅ Sesión válida creada: ${sessionKey} (${archivosValidos} archivos)`);
                } else {
                    console.log(`   ⚠️ Sesión descartada: solo ${archivosValidos} archivos válidos`);
                }
            }
        }
        
        console.log(`\n📊 RESUMEN DE SESIONES REALES:`);
        console.log(`   - Sesiones válidas detectadas: ${sesionesReales.size}`);
        
        if (sesionesReales.size === 0) {
            console.log('❌ ERROR: No se detectaron sesiones válidas');
            return;
        }
        
        // PASO 6: Procesar sesiones reales
        console.log('\n6️⃣ PROCESANDO SESIONES REALES...');
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const [key, session] of sesionesReales) {
            try {
                console.log(`\n🔍 Procesando sesión: ${key}`);
                console.log(`   📁 Archivos: ${session.archivosValidos} válidos`);
                
                // Convertir fecha de YYYYMMDD a DateTime
                const sessionDate = new Date(session.fecha.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
                
                // Verificar si la sesión ya existe
                const existingSession = await prisma.session.findFirst({
                    where: {
                        vehicleId: session.vehicleId,
                        startTime: sessionDate,
                        sequence: parseInt(session.sesion) || 0
                    }
                });
                
                if (existingSession) {
                    console.log(`   ⏭️ Sesión ya existe: ${existingSession.id}`);
                    skipped++;
                    continue;
                }
                
                // Crear sesión
                const newSession = await prisma.session.create({
                    data: {
                        vehicleId: session.vehicleId,
                        userId: adminUser.id,
                        organizationId: organization.id,
                        startTime: sessionDate,
                        endTime: sessionDate,
                        sequence: parseInt(session.sesion) || 0,
                        sessionNumber: parseInt(session.sesion) || 0,
                        status: 'COMPLETED',
                        type: 'ROUTINE',
                        source: 'AUTOMATIC_UPLOAD'
                    }
                });
                
                console.log(`   ✅ Sesión creada: ${newSession.id}`);
                processed++;
                
            } catch (error) {
                console.log(`   ❌ Error procesando sesión ${key}: ${error.message}`);
                errors++;
            }
        }
        
        // PASO 7: Resumen final
        console.log('\n====================================');
        console.log('✅ PROCESAMIENTO CORRECTO COMPLETADO');
        console.log('====================================');
        console.log(`📊 RESUMEN FINAL:`);
        console.log(`   - Organización: ${organization.name}`);
        console.log(`   - Vehículos: ${vehicleDirs.length}`);
        console.log(`   - Sesiones válidas detectadas: ${sesionesReales.size}`);
        console.log(`   - Sesiones procesadas: ${processed}`);
        console.log(`   - Sesiones omitidas: ${skipped}`);
        console.log(`   - Errores: ${errors}`);
        
        if (errors > 0) {
            console.log('\n⚠️ Algunas sesiones tuvieron errores. Revisa los logs anteriores.');
        } else {
            console.log('\n🎉 ¡Todas las sesiones procesadas exitosamente!');
        }
        
        console.log('\n🎯 Sistema de procesamiento correcto completado');
        console.log('💡 Ahora puedes usar el dashboard para ver los datos procesados');
        
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión a base de datos cerrada');
    }
}

// Ejecutar el procesamiento correcto
procesarSesionesCorrecto(); 