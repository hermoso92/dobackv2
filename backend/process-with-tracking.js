const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración de logging
const LOG_FILE = path.join(process.cwd(), 'processing-log.txt');
const ERROR_LOG_FILE = path.join(process.cwd(), 'processing-errors.txt');
const PROGRESS_LOG_FILE = path.join(process.cwd(), 'processing-progress.txt');

// Función para escribir logs
function writeLog(message, logFile = LOG_FILE) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(message);
}

function writeErrorLog(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR ${context}: ${error.message}\nStack: ${error.stack}\n---\n`;
    fs.appendFileSync(ERROR_LOG_FILE, errorMessage);
    console.error(`❌ ERROR ${context}:`, error.message);
}

function writeProgressLog(message) {
    const timestamp = new Date().toISOString();
    const progressMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(PROGRESS_LOG_FILE, progressMessage);
    console.log(`📊 ${message}`);
}

// Estadísticas globales
const stats = {
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    totalSessions: 0,
    createdSessions: 0,
    failedSessions: 0,
    totalMeasurements: 0,
    stabilityMeasurements: 0,
    canMeasurements: 0,
    gpsMeasurements: 0,
    rotativoMeasurements: 0,
    startTime: new Date(),
    errors: []
};

async function processWithTracking() {
    try {
        // Limpiar logs anteriores
        [LOG_FILE, ERROR_LOG_FILE, PROGRESS_LOG_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });

        writeLog('🚀 INICIANDO PROCESAMIENTO CON SEGUIMIENTO COMPLETO');
        writeLog(`📅 Fecha de inicio: ${stats.startTime.toISOString()}`);

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

        writeLog(`✅ Organización encontrada: ${organization.name} (ID: ${organization.id})`);

        const basePath = path.join(process.cwd(), 'data/datosDoback/CMadrid');
        const realVehicles = ['doback022', 'doback023', 'doback024', 'doback025', 'doback027', 'doback028'];
        
        // Contar archivos totales primero
        writeLog('📊 CONTANDO ARCHIVOS TOTALES...');
        for (const vehicleName of realVehicles) {
            const vehiclePath = path.join(basePath, vehicleName);
            if (fs.existsSync(vehiclePath)) {
                const fileTypes = ['estabilidad', 'CAN', 'GPS', 'ROTATIVO'];
                for (const fileType of fileTypes) {
                    const typePath = path.join(vehiclePath, fileType);
                    if (fs.existsSync(typePath)) {
                        const files = fs.readdirSync(typePath).filter(f => f.endsWith('.txt'));
                        stats.totalFiles += files.length;
                        writeLog(`  📁 ${vehicleName}/${fileType}: ${files.length} archivos`);
                    }
                }
            }
        }

        writeLog(`📊 TOTAL DE ARCHIVOS A PROCESAR: ${stats.totalFiles}`);

        // Procesar cada vehículo
        for (const vehicleName of realVehicles) {
            writeLog(`\n🔧 PROCESANDO VEHÍCULO: ${vehicleName}`);
            
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    name: vehicleName,
                    organizationId: organization.id
                }
            });

            if (!vehicle) {
                writeErrorLog(new Error(`No se encontró el vehículo ${vehicleName} en la BD`));
                continue;
            }

            writeLog(`✅ Vehículo encontrado: ${vehicle.name} (ID: ${vehicle.id})`);

            const vehiclePath = path.join(basePath, vehicleName);
            if (!fs.existsSync(vehiclePath)) {
                writeErrorLog(new Error(`No existe directorio para ${vehicleName}`));
                continue;
            }

            // Agrupar archivos por fecha
            const sessionsByDate = await groupFilesByDateComplete(vehiclePath, vehicleName);
            writeLog(`📅 Fechas encontradas para ${vehicleName}: ${sessionsByDate.size}`);
            
            for (const [date, files] of sessionsByDate) {
                writeLog(`\n  📅 Procesando fecha: ${date}`);
                writeLog(`    📊 Archivos: Estabilidad(${files.estabilidad.length}), CAN(${files.can.length}), GPS(${files.gps.length}), Rotativo(${files.rotativo.length})`);
                
                // Solo crear sesión si hay al menos estabilidad
                if (files.estabilidad.length > 0) {
                    const sessionResult = await createSessionForDate(vehicle.id, organization.id, date);
                    
                    if (sessionResult.success) {
                        writeLog(`    ✅ Sesión creada: ${sessionResult.sessionId}`);
                        stats.createdSessions++;
                        
                        let measurementsInSession = 0;
                        
                        // Procesar archivos de ESTABILIDAD
                        if (files.estabilidad.length > 0) {
                            writeProgressLog(`    🔄 Procesando ${files.estabilidad.length} archivos de estabilidad...`);
                            for (const file of files.estabilidad) {
                                const result = await processStabilityFile(file.path, sessionResult.sessionId, file.name);
                                measurementsInSession += result.measurements;
                                stats.processedFiles++;
                                if (result.measurements > 0) {
                                    writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                                    stats.stabilityMeasurements += result.measurements;
                                } else {
                                    writeErrorLog(new Error(`No se procesaron mediciones`), `Estabilidad ${file.name}`);
                                    stats.failedFiles++;
                                }
                            }
                        }

                        // Procesar archivos CAN
                        if (files.can.length > 0) {
                            writeProgressLog(`    🔄 Procesando ${files.can.length} archivos CAN...`);
                            for (const file of files.can) {
                                const result = await processCANFile(file.path, sessionResult.sessionId, file.name);
                                measurementsInSession += result.measurements;
                                stats.processedFiles++;
                                if (result.measurements > 0) {
                                    writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                                    stats.canMeasurements += result.measurements;
                                } else {
                                    writeErrorLog(new Error(`No se procesaron mediciones`), `CAN ${file.name}`);
                                    stats.failedFiles++;
                                }
                            }
                        }

                        // Procesar archivos GPS
                        if (files.gps.length > 0) {
                            writeProgressLog(`    🔄 Procesando ${files.gps.length} archivos GPS...`);
                            for (const file of files.gps) {
                                const result = await processGPSFile(file.path, sessionResult.sessionId, file.name);
                                measurementsInSession += result.measurements;
                                stats.processedFiles++;
                                if (result.measurements > 0) {
                                    writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                                    stats.gpsMeasurements += result.measurements;
                                } else {
                                    writeErrorLog(new Error(`No se procesaron mediciones`), `GPS ${file.name}`);
                                    stats.failedFiles++;
                                }
                            }
                        }

                        // Procesar archivos ROTATIVO
                        if (files.rotativo.length > 0) {
                            writeProgressLog(`    🔄 Procesando ${files.rotativo.length} archivos ROTATIVO...`);
                            for (const file of files.rotativo) {
                                const result = await processRotativoFile(file.path, sessionResult.sessionId, file.name);
                                measurementsInSession += result.measurements;
                                stats.processedFiles++;
                                if (result.measurements > 0) {
                                    writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                                    stats.rotativoMeasurements += result.measurements;
                                } else {
                                    writeErrorLog(new Error(`No se procesaron mediciones`), `Rotativo ${file.name}`);
                                    stats.failedFiles++;
                                }
                            }
                        }
                        
                        stats.totalMeasurements += measurementsInSession;
                        stats.totalSessions++;
                        writeLog(`  📊 Sesión ${date}: ${measurementsInSession} mediciones totales`);
                    } else {
                        writeErrorLog(new Error(`Error creando sesión`), `Fecha ${date}`);
                        stats.failedSessions++;
                    }
                } else {
                    writeLog(`    ⚠️ No hay archivos de estabilidad para ${date}, saltando sesión`);
                }
            }
        }

        // Generar reporte final
        await generateFinalReport();

    } catch (error) {
        writeErrorLog(error, 'PROCESAMIENTO PRINCIPAL');
    } finally {
        await prisma.$disconnect();
    }
}

async function groupFilesByDateComplete(vehiclePath, vehicleName) {
    const sessionsByDate = new Map();
    
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
                source: 'REAL_CMADRID_TRACKED',
                sequence: 1,
                sessionNumber: 1
            }
        });

        return { success: true, sessionId: session.id };
    } catch (error) {
        writeErrorLog(error, `Creando sesión para ${dateString}`);
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

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando estabilidad ${fileName}`);
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

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando GPS ${fileName}`);
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

        return { measurements: measurements.length, error: null };
    } catch (error) {
        writeErrorLog(error, `Procesando ROTATIVO ${fileName}`);
        return { measurements: 0, error: error.message };
    }
}

async function generateFinalReport() {
    const endTime = new Date();
    const duration = endTime.getTime() - stats.startTime.getTime();
    
    writeLog('\n🎉 REPORTE FINAL DEL PROCESAMIENTO');
    writeLog('=====================================');
    writeLog(`📅 Fecha de inicio: ${stats.startTime.toISOString()}`);
    writeLog(`📅 Fecha de fin: ${endTime.toISOString()}`);
    writeLog(`⏱️ Duración total: ${Math.round(duration / 1000 / 60)} minutos`);
    writeLog('');
    writeLog('📊 ESTADÍSTICAS DE ARCHIVOS:');
    writeLog(`  - Total de archivos: ${stats.totalFiles}`);
    writeLog(`  - Archivos procesados: ${stats.processedFiles}`);
    writeLog(`  - Archivos fallidos: ${stats.failedFiles}`);
    writeLog(`  - Porcentaje de éxito: ${Math.round((stats.processedFiles / stats.totalFiles) * 100)}%`);
    writeLog('');
    writeLog('📊 ESTADÍSTICAS DE SESIONES:');
    writeLog(`  - Total de sesiones: ${stats.totalSessions}`);
    writeLog(`  - Sesiones creadas: ${stats.createdSessions}`);
    writeLog(`  - Sesiones fallidas: ${stats.failedSessions}`);
    writeLog('');
    writeLog('📊 ESTADÍSTICAS DE MEDICIONES:');
    writeLog(`  - Total de mediciones: ${stats.totalMeasurements}`);
    writeLog(`  - Mediciones de estabilidad: ${stats.stabilityMeasurements}`);
    writeLog(`  - Mediciones CAN: ${stats.canMeasurements}`);
    writeLog(`  - Mediciones GPS: ${stats.gpsMeasurements}`);
    writeLog(`  - Mediciones Rotativo: ${stats.rotativoMeasurements}`);
    writeLog('');
    writeLog('📁 ARCHIVOS DE LOG GENERADOS:');
    writeLog(`  - Log principal: ${LOG_FILE}`);
    writeLog(`  - Log de errores: ${ERROR_LOG_FILE}`);
    writeLog(`  - Log de progreso: ${PROGRESS_LOG_FILE}`);
}

processWithTracking();
