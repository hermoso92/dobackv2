const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function processAllFilesComplete() {
    try {
        console.log('🧠 PROCESANDO TODOS LOS ARCHIVOS DE TODOS LOS TIPOS...');

        // Buscar organización CMadrid
        const organization = await prisma.organization.findFirst({
            where: {
                name: { contains: 'CMadrid', mode: 'insensitive' }
            }
        });

        if (!organization) {
            console.log('❌ No se encontró la organización CMadrid');
            return;
        }

        console.log(`✅ Organización: ${organization.name}`);

        const basePath = path.join(process.cwd(), 'data/datosDoback/CMadrid');
        const realVehicles = ['doback022', 'doback023', 'doback024', 'doback025', 'doback027', 'doback028'];
        
        let totalSessions = 0;
        let totalMeasurements = 0;

        for (const vehicleName of realVehicles) {
            console.log(`\n🔧 Procesando vehículo: ${vehicleName}`);
            
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    name: vehicleName,
                    organizationId: organization.id
                }
            });

            if (!vehicle) {
                console.log(`❌ No se encontró el vehículo ${vehicleName} en la BD`);
                continue;
            }

            const vehiclePath = path.join(basePath, vehicleName);
            if (!fs.existsSync(vehiclePath)) {
                console.log(`❌ No existe directorio para ${vehicleName}`);
                continue;
            }

            // Agrupar archivos por fecha con TODOS los tipos
            const sessionsByDate = await groupFilesByDateComplete(vehiclePath, vehicleName);
            
            for (const [date, files] of sessionsByDate) {
                console.log(`  📅 Procesando fecha: ${date}`);
                console.log(`    📊 Archivos: Estabilidad(${files.estabilidad.length}), CAN(${files.can.length}), GPS(${files.gps.length}), Rotativo(${files.rotativo.length})`);
                
                // Solo crear sesión si hay al menos estabilidad (archivos principales)
                if (files.estabilidad.length > 0) {
                    // Crear una sesión por fecha
                    const sessionId = await createSessionForDate(vehicle.id, organization.id, date);
                    
                    if (sessionId) {
                        let measurementsInSession = 0;
                        
                        // Procesar TODOS los archivos de ESTABILIDAD
                        if (files.estabilidad.length > 0) {
                            console.log(`    🔄 Procesando ${files.estabilidad.length} archivos de estabilidad...`);
                            for (const file of files.estabilidad) {
                                const measurementsCount = await processStabilityFile(file.path, sessionId, file.name);
                                measurementsInSession += measurementsCount;
                                if (measurementsCount > 0) {
                                    console.log(`      ✅ ${file.name}: ${measurementsCount} mediciones`);
                                }
                            }
                        }

                        // Procesar TODOS los archivos CAN
                        if (files.can.length > 0) {
                            console.log(`    🔄 Procesando ${files.can.length} archivos CAN...`);
                            for (const file of files.can) {
                                const measurementsCount = await processCANFile(file.path, sessionId, file.name);
                                measurementsInSession += measurementsCount;
                                if (measurementsCount > 0) {
                                    console.log(`      ✅ ${file.name}: ${measurementsCount} mediciones`);
                                }
                            }
                        }

                        // Procesar TODOS los archivos GPS
                        if (files.gps.length > 0) {
                            console.log(`    🔄 Procesando ${files.gps.length} archivos GPS...`);
                            for (const file of files.gps) {
                                const measurementsCount = await processGPSFile(file.path, sessionId, file.name);
                                measurementsInSession += measurementsCount;
                                if (measurementsCount > 0) {
                                    console.log(`      ✅ ${file.name}: ${measurementsCount} mediciones`);
                                }
                            }
                        }

                        // Procesar TODOS los archivos ROTATIVO
                        if (files.rotativo.length > 0) {
                            console.log(`    🔄 Procesando ${files.rotativo.length} archivos ROTATIVO...`);
                            for (const file of files.rotativo) {
                                const measurementsCount = await processRotativoFile(file.path, sessionId, file.name);
                                measurementsInSession += measurementsCount;
                                if (measurementsCount > 0) {
                                    console.log(`      ✅ ${file.name}: ${measurementsCount} mediciones`);
                                }
                            }
                        }
                        
                        totalMeasurements += measurementsInSession;
                        totalSessions++;
                        console.log(`  📊 Sesión ${date}: ${measurementsInSession} mediciones totales`);
                    }
                } else {
                    console.log(`    ⚠️ No hay archivos de estabilidad para ${date}, saltando sesión`);
                }
            }
        }

        console.log(`\n🎉 PROCESAMIENTO COMPLETO FINALIZADO:`);
        console.log(`  - Sesiones creadas: ${totalSessions}`);
        console.log(`  - Mediciones totales: ${totalMeasurements}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function groupFilesByDateComplete(vehiclePath, vehicleName) {
    const sessionsByDate = new Map();
    
    // Procesar todos los tipos de archivos
    const fileTypes = [
        { dir: 'estabilidad', key: 'estabilidad' },
        { dir: 'CAN', key: 'can' },
        { dir: 'GPS', key: 'gps' },
        { dir: 'ROTATIVO', key: 'rotativo' }
    ];

    for (const fileType of fileTypes) {
        const typePath = path.join(vehiclePath, fileType.dir);
        if (fs.existsSync(typePath)) {
            const files = fs.readdirSync(typePath).filter(f => f.endsWith('.txt'));
            
            for (const file of files) {
                // Extraer fecha del nombre del archivo
                const dateMatch = file.match(/(\d{8})/);
                if (dateMatch) {
                    const date = dateMatch[1];
                    
                    if (!sessionsByDate.has(date)) {
                        sessionsByDate.set(date, {
                            estabilidad: [],
                            can: [],
                            gps: [],
                            rotativo: []
                        });
                    }
                    
                    sessionsByDate.get(date)[fileType.key].push({
                        name: file,
                        path: path.join(typePath, file)
                    });
                }
            }
        }
    }
    
    return sessionsByDate;
}

async function createSessionForDate(vehicleId, organizationId, dateString) {
    try {
        const startTime = new Date(
            dateString.substring(0,4), 
            dateString.substring(4,6)-1, 
            dateString.substring(6,8),
            14, 23, 20
        );
        
        const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

        // Buscar usuario existente
        const user = await prisma.user.findFirst({
            where: {
                organizationId: organizationId
            }
        });

        if (!user) {
            console.log(`    ❌ No se encontró usuario para la organización`);
            return null;
        }

        // Crear sesión para esta fecha
        const session = await prisma.session.create({
            data: {
                vehicle: {
                    connect: { id: vehicleId }
                },
                organization: {
                    connect: { id: organizationId }
                },
                user: {
                    connect: { id: user.id }
                },
                startTime: startTime,
                endTime: endTime,
                status: 'COMPLETED',
                source: 'REAL_CMADRID_ALL_FILES',
                sequence: 1,
                sessionNumber: 1
            }
        });

        console.log(`    ✅ Sesión creada para ${dateString}: ${session.id}`);
        return session.id;
    } catch (error) {
        console.error(`    ❌ Error creando sesión para ${dateString}:`, error.message);
        return null;
    }
}

// Procesar archivos de ESTABILIDAD
async function processStabilityFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return 0;
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        const baseTime = Date.now();
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 19) {
                measurements.push({
                    sessionId: sessionId,
                    timestamp: new Date(baseTime + i * 100),
                    ax: parseFloat(parts[0]) || 0,
                    ay: parseFloat(parts[1]) || 0,
                    az: parseFloat(parts[2]) || 0,
                    gx: parseFloat(parts[3]) || 0,
                    gy: parseFloat(parts[4]) || 0,
                    gz: parseFloat(parts[5]) || 0,
                    roll: parseFloat(parts[6]) || 0,
                    pitch: parseFloat(parts[7]) || 0,
                    yaw: parseFloat(parts[8]) || 0,
                    timeantwifi: parseFloat(parts[9]) || 0,
                    accmag: parseFloat(parts[16]) || 0,
                    microsds: parseFloat(parts[17]) || 0,
                    si: parseFloat(parts[15]) || 0,
                    usciclo1: parseFloat(parts[10]) || 0,
                    usciclo2: parseFloat(parts[11]) || 0,
                    usciclo3: parseFloat(parts[12]) || 0,
                    usciclo4: parseFloat(parts[13]) || 0,
                    usciclo5: parseFloat(parts[14]) || 0
                });
            }
        }

        if (measurements.length > 0) {
            await prisma.stabilityMeasurement.createMany({
                data: measurements
            });
        }

        return measurements.length;
    } catch (error) {
        console.error(`    ❌ Error procesando estabilidad ${fileName}:`, error.message);
        return 0;
    }
}

// Procesar archivos CAN
async function processCANFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            return 0;
        }

        const dataLines = lines.slice(1);
        const measurements = [];
        
        const baseTime = Date.now();
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(' ').filter(part => part.trim());
            
            if (parts.length >= 4) {
                const timestamp = new Date(baseTime + i * 200);
                const canId = parts[2];
                const data = parts.slice(3).join(' ');
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: timestamp,
                    canId: canId,
                    data: data,
                    frameType: 'CAN_FRAME'
                });
            }
        }

        if (measurements.length > 0) {
            await prisma.canMeasurement.createMany({
                data: measurements
            });
        }

        return measurements.length;
    } catch (error) {
        console.error(`    ❌ Error procesando CAN ${fileName}:`, error.message);
        return 0;
    }
}

// Procesar archivos GPS
async function processGPSFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return 0;
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        const baseTime = Date.now();
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            
            if (line.includes('sin datos GPS') || line.trim() === '') {
                continue;
            }
            
            const parts = line.split(',').map(part => part.trim());
            
            if (parts.length >= 9) {
                const latitude = parseFloat(parts[2]);
                const longitude = parseFloat(parts[3]);
                
                if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
                    measurements.push({
                        sessionId: sessionId,
                        timestamp: new Date(baseTime + i * 150),
                        latitude: latitude,
                        longitude: longitude,
                        altitude: parseFloat(parts[4]) || 0,
                        hdop: parseFloat(parts[5]) || 0,
                        fix: parseInt(parts[6]) || 0,
                        numSats: parseInt(parts[7]) || 0,
                        speed: parseFloat(parts[8]) || 0
                    });
                }
            }
        }

        if (measurements.length > 0) {
            await prisma.gpsMeasurement.createMany({
                data: measurements
            });
        }

        return measurements.length;
    } catch (error) {
        console.error(`    ❌ Error procesando GPS ${fileName}:`, error.message);
        return 0;
    }
}

// Procesar archivos ROTATIVO
async function processRotativoFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return 0;
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        const baseTime = Date.now();
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(' ').filter(part => part.trim());
            
            if (parts.length >= 2) {
                const state = parseInt(parts[1]) || 0;
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: new Date(baseTime + i * 300),
                    state: state.toString()
                });
            }
        }

        if (measurements.length > 0) {
            await prisma.rotativoMeasurement.createMany({
                data: measurements
            });
        }

        return measurements.length;
    } catch (error) {
        console.error(`    ❌ Error procesando ROTATIVO ${fileName}:`, error.message);
        return 0;
    }
}

processAllFilesComplete();
