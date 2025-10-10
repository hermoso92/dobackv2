const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración de logging
const LOG_FILE = path.join(process.cwd(), 'correct-sessions-log.txt');
const ERROR_LOG_FILE = path.join(process.cwd(), 'correct-sessions-errors.txt');

function writeLog(message, logFile = LOG_FILE) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(message);
}

function writeErrorLog(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR ${context}: ${error.message}\n`;
    fs.appendFileSync(ERROR_LOG_FILE, errorMessage);
    console.error(`❌ ERROR ${context}:`, error.message);
}

async function processCorrectSessions() {
    try {
        // Limpiar logs anteriores
        [LOG_FILE, ERROR_LOG_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });

        writeLog('🚀 PROCESAMIENTO CON SESIONES CORRECTAS (UNA POR DÍA POR VEHÍCULO)');
        writeLog(`📅 Fecha de inicio: ${new Date().toISOString()}`);

        // Buscar organización CMadrid
        const organization = await prisma.organization.findFirst({
            where: {
                name: { contains: 'CMadrid', mode: 'insensitive' }
            }
        });

        if (!organization) {
            writeErrorLog(new Error('No se encontró la organización CMadrid'));
            return;
        }

        writeLog(`✅ Organización encontrada: ${organization.name}`);

        const basePath = path.join(process.cwd(), 'data/datosDoback/CMadrid');
        const realVehicles = ['doback022', 'doback023', 'doback024', 'doback025', 'doback027', 'doback028'];
        
        // Procesar solo doback022 para prueba
        const testVehicle = 'doback022';
        writeLog(`🧪 PROCESANDO VEHÍCULO: ${testVehicle}`);
        
        const vehiclePath = path.join(basePath, testVehicle);
        if (!fs.existsSync(vehiclePath)) {
            writeErrorLog(new Error(`No existe directorio para ${testVehicle}`));
            return;
        }

        const vehicle = await prisma.vehicle.findFirst({
            where: {
                name: testVehicle,
                organizationId: organization.id
            }
        });

        if (!vehicle) {
            writeErrorLog(new Error(`No se encontró el vehículo ${testVehicle} en la BD`));
            return;
        }

        writeLog(`✅ Vehículo encontrado: ${vehicle.name} (ID: ${vehicle.id})`);

        // Agrupar archivos por fecha
        const filesByDate = await groupFilesByDate(vehiclePath, testVehicle);
        writeLog(`📅 Fechas encontradas para ${testVehicle}: ${Object.keys(filesByDate).length}`);
        
        let sessionsCreated = 0;
        let totalMeasurements = 0;

        for (const [date, files] of Object.entries(filesByDate)) {
            writeLog(`\n  📅 Procesando fecha: ${date}`);
            writeLog(`    📊 Archivos: Estabilidad(${files.estabilidad.length}), CAN(${files.can.length}), GPS(${files.gps.length}), Rotativo(${files.rotativo.length})`);
            
            // Solo crear sesión si hay al menos estabilidad
            if (files.estabilidad.length > 0) {
                // VERIFICAR SI YA EXISTE UNA SESIÓN PARA ESTA FECHA Y VEHÍCULO
                const existingSession = await prisma.session.findFirst({
                    where: {
                        vehicleId: vehicle.id,
                        startTime: {
                            gte: new Date(date.substring(0,4), date.substring(4,6)-1, date.substring(6,8)),
                            lt: new Date(date.substring(0,4), date.substring(4,6)-1, date.substring(6,8), 23, 59, 59)
                        }
                    }
                });

                if (existingSession) {
                    writeLog(`    ⚠️ Ya existe sesión para ${date}: ${existingSession.id.substring(0, 8)}...`);
                    writeLog(`    ⏭️ Saltando fecha ${date} para evitar duplicados`);
                    continue;
                }

                // Crear UNA SOLA sesión para esta fecha
                const sessionResult = await createSingleSessionForDate(vehicle.id, organization.id, date);
                
                if (sessionResult.success) {
                    writeLog(`    ✅ Sesión única creada para ${date}: ${sessionResult.sessionId}`);
                    sessionsCreated++;
                    
                    let measurementsInSession = 0;
                    
                    // Procesar TODOS los archivos de esta fecha en la MISMA sesión
                    writeLog(`    🔄 Procesando archivos de estabilidad...`);
                    for (const file of files.estabilidad) {
                        const result = await processStabilityFile(file.path, sessionResult.sessionId, file.name);
                        measurementsInSession += result.measurements;
                        if (result.measurements > 0) {
                            writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                        }
                    }

                    writeLog(`    🔄 Procesando archivos rotativo...`);
                    for (const file of files.rotativo) {
                        const result = await processRotativoFile(file.path, sessionResult.sessionId, file.name);
                        measurementsInSession += result.measurements;
                        if (result.measurements > 0) {
                            writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                        }
                    }

                    writeLog(`    🔄 Procesando archivos CAN...`);
                    for (const file of files.can) {
                        const result = await processCANFile(file.path, sessionResult.sessionId, file.name);
                        measurementsInSession += result.measurements;
                        if (result.measurements > 0) {
                            writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                        }
                    }

                    writeLog(`    🔄 Procesando archivos GPS...`);
                    for (const file of files.gps) {
                        const result = await processGPSFile(file.path, sessionResult.sessionId, file.name);
                        measurementsInSession += result.measurements;
                        if (result.measurements > 0) {
                            writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                        }
                    }
                    
                    totalMeasurements += measurementsInSession;
                    writeLog(`  📊 Sesión ${date}: ${measurementsInSession} mediciones totales`);
                } else {
                    writeErrorLog(new Error(`Error creando sesión`), `Fecha ${date}`);
                }
            } else {
                writeLog(`    ⚠️ No hay archivos de estabilidad para ${date}, saltando sesión`);
            }
        }

        writeLog('\n🎉 PROCESAMIENTO CORRECTO COMPLETADO:');
        writeLog(`  - Sesiones creadas: ${sessionsCreated}`);
        writeLog(`  - Mediciones totales: ${totalMeasurements}`);
        writeLog(`  - Regla respetada: UNA sesión por día por vehículo`);

    } catch (error) {
        writeErrorLog(error, 'PROCESAMIENTO PRINCIPAL');
    } finally {
        await prisma.$disconnect();
    }
}

async function groupFilesByDate(vehiclePath, vehicleName) {
    const filesByDate = {};
    
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
                const dateMatch = file.match(/(\d{8})/);
                if (dateMatch) {
                    const date = dateMatch[1];
                    
                    if (!filesByDate[date]) {
                        filesByDate[date] = {
                            estabilidad: [],
                            can: [],
                            gps: [],
                            rotativo: []
                        };
                    }
                    
                    filesByDate[date][fileType.key].push({
                        name: file,
                        path: path.join(typePath, file)
                    });
                }
            }
        }
    }
    
    return filesByDate;
}

async function createSingleSessionForDate(vehicleId, organizationId, dateString) {
    try {
        const startTime = new Date(
            dateString.substring(0,4), 
            dateString.substring(4,6)-1, 
            dateString.substring(6,8),
            14, 23, 20
        );
        
        const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

        const user = await prisma.user.findFirst({
            where: {
                organizationId: organizationId
            }
        });

        if (!user) {
            throw new Error('No se encontró usuario para la organización');
        }

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
                source: 'CORRECT_SESSIONS_PROCESSING',
                sequence: 1,
                sessionNumber: 1
            }
        });

        return { success: true, sessionId: session.id };
    } catch (error) {
        writeErrorLog(error, `Creando sesión única para ${dateString}`);
        return { success: false, error: error.message };
    }
}

async function processStabilityFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return { measurements: 0, error: 'Archivo demasiado corto' };
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        const baseTime = Date.now() + Math.random() * 1000;
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 19) {
                const uniqueTimestamp = new Date(baseTime + i * 100 + Math.random() * 10);
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: uniqueTimestamp,
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
                data: measurements,
                skipDuplicates: true
            });
        }

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando estabilidad ${fileName}`);
        return { measurements: 0, error: error.message };
    }
}

async function processRotativoFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return { measurements: 0, error: 'Archivo demasiado corto' };
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        const baseTime = Date.now() + Math.random() * 1000;
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(' ').filter(part => part.trim());
            
            if (parts.length >= 2) {
                const state = parseInt(parts[1]) || 0;
                const uniqueTimestamp = new Date(baseTime + i * 300 + Math.random() * 10);
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: uniqueTimestamp,
                    state: state.toString()
                });
            }
        }

        if (measurements.length > 0) {
            await prisma.rotativoMeasurement.createMany({
                data: measurements,
                skipDuplicates: true
            });
        }

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando ROTATIVO ${fileName}`);
        return { measurements: 0, error: error.message };
    }
}

async function processCANFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            return { measurements: 0, error: 'Archivo demasiado corto' };
        }

        const dataLines = lines.slice(1);
        const measurements = [];
        
        const baseTime = Date.now() + Math.random() * 1000;
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(' ').filter(part => part.trim());
            
            if (parts.length >= 4) {
                const uniqueTimestamp = new Date(baseTime + i * 200 + Math.random() * 10);
                const canId = parts[2];
                const data = parts.slice(3).join(' ');
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: uniqueTimestamp,
                    canId: canId,
                    data: data,
                    frameType: 'CAN_FRAME'
                });
            }
        }

        if (measurements.length > 0) {
            await prisma.canMeasurement.createMany({
                data: measurements,
                skipDuplicates: true
            });
        }

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando CAN ${fileName}`);
        return { measurements: 0, error: error.message };
    }
}

async function processGPSFile(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return { measurements: 0, error: 'Archivo demasiado corto' };
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        const baseTime = Date.now() + Math.random() * 1000;
        
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
                    const uniqueTimestamp = new Date(baseTime + i * 150 + Math.random() * 10);
                    
                    measurements.push({
                        sessionId: sessionId,
                        timestamp: uniqueTimestamp,
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
                data: measurements,
                skipDuplicates: true
            });
        }

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando GPS ${fileName}`);
        return { measurements: 0, error: error.message };
    }
}

processCorrectSessions();