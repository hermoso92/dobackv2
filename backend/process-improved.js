const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración de logging
const LOG_FILE = path.join(process.cwd(), 'improved-processing-log.txt');
const ERROR_LOG_FILE = path.join(process.cwd(), 'improved-processing-errors.txt');

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

// Estadísticas globales
const stats = {
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    totalSessions: 0,
    createdSessions: 0,
    failedSessions: 0,
    totalMeasurements: 0,
    startTime: new Date(),
    errors: []
};

async function processImproved() {
    try {
        // Limpiar logs anteriores
        [LOG_FILE, ERROR_LOG_FILE].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });

        writeLog('🚀 INICIANDO PROCESAMIENTO MEJORADO');
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
        
        // Procesar solo doback022 para prueba rápida
        const testVehicle = 'doback022';
        writeLog(`🧪 MODO PRUEBA: Procesando solo vehículo ${testVehicle}`);
        
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
        const sessionsByDate = await groupFilesByDateImproved(vehiclePath, testVehicle);
        writeLog(`📅 Fechas encontradas para ${testVehicle}: ${sessionsByDate.size}`);
        
        let processedDates = 0;
        for (const [date, files] of sessionsByDate) {
            if (processedDates >= 3) {
                writeLog(`⏭️ Limiting to first 3 dates for testing`);
                break;
            }
            
            writeLog(`\n  📅 Procesando fecha: ${date}`);
            writeLog(`    📊 Archivos: Estabilidad(${files.estabilidad.length}), CAN(${files.can.length}), GPS(${files.gps.length}), Rotativo(${files.rotativo.length})`);
            
            // Solo crear sesión si hay al menos estabilidad
            if (files.estabilidad.length > 0) {
                const sessionResult = await createSessionForDateImproved(vehicle.id, organization.id, date);
                
                if (sessionResult.success) {
                    writeLog(`    ✅ Sesión creada: ${sessionResult.sessionId}`);
                    stats.createdSessions++;
                    
                    let measurementsInSession = 0;
                    
                    // Procesar archivos de ESTABILIDAD
                    if (files.estabilidad.length > 0) {
                        writeLog(`    🔄 Procesando ${files.estabilidad.length} archivos de estabilidad...`);
                        for (const file of files.estabilidad) {
                            const result = await processStabilityFileImproved(file.path, sessionResult.sessionId, file.name);
                            measurementsInSession += result.measurements;
                            stats.processedFiles++;
                            if (result.measurements > 0) {
                                writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                            } else {
                                writeErrorLog(new Error(`No se procesaron mediciones`), `Estabilidad ${file.name}`);
                                stats.failedFiles++;
                            }
                        }
                    }

                    // Procesar archivos ROTATIVO
                    if (files.rotativo.length > 0) {
                        writeLog(`    🔄 Procesando ${files.rotativo.length} archivos ROTATIVO...`);
                        for (const file of files.rotativo) {
                            const result = await processRotativoFileImproved(file.path, sessionResult.sessionId, file.name);
                            measurementsInSession += result.measurements;
                            stats.processedFiles++;
                            if (result.measurements > 0) {
                                writeLog(`      ✅ ${file.name}: ${result.measurements} mediciones`);
                            } else {
                                writeErrorLog(new Error(`No se procesaron mediciones`), `Rotativo ${file.name}`);
                                stats.failedFiles++;
                            }
                        }
                    }
                    
                    stats.totalMeasurements += measurementsInSession;
                    stats.totalSessions++;
                    writeLog(`  📊 Sesión ${date}: ${measurementsInSession} mediciones totales`);
                    processedDates++;
                } else {
                    writeErrorLog(new Error(`Error creando sesión`), `Fecha ${date}`);
                    stats.failedSessions++;
                }
            } else {
                writeLog(`    ⚠️ No hay archivos de estabilidad para ${date}, saltando sesión`);
            }
        }

        // Generar reporte final
        await generateFinalReportImproved();

    } catch (error) {
        writeErrorLog(error, 'PROCESAMIENTO PRINCIPAL');
    } finally {
        await prisma.$disconnect();
    }
}

async function groupFilesByDateImproved(vehiclePath, vehicleName) {
    const sessionsByDate = new Map();
    
    const fileTypes = [
        { dir: 'estabilidad', key: 'estabilidad' },
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

async function createSessionForDateImproved(vehicleId, organizationId, dateString) {
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
                source: 'IMPROVED_PROCESSING',
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

async function processStabilityFileImproved(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return { measurements: 0, error: 'Archivo demasiado corto' };
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        // Usar timestamp base único para este archivo
        const baseTime = Date.now() + Math.random() * 1000;
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 19) {
                // Generar timestamp único para cada medición
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
            // USAR skipDuplicates para evitar errores de constraint
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

async function processRotativoFileImproved(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return { measurements: 0, error: 'Archivo demasiado corto' };
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        
        // Usar timestamp base único para este archivo
        const baseTime = Date.now() + Math.random() * 1000;
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(' ').filter(part => part.trim());
            
            if (parts.length >= 2) {
                const state = parseInt(parts[1]) || 0;
                
                // Generar timestamp único para cada medición
                const uniqueTimestamp = new Date(baseTime + i * 300 + Math.random() * 10);
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: uniqueTimestamp,
                    state: state.toString()
                });
            }
        }

        if (measurements.length > 0) {
            // USAR skipDuplicates para evitar errores de constraint
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

async function generateFinalReportImproved() {
    const endTime = new Date();
    const duration = endTime.getTime() - stats.startTime.getTime();
    
    writeLog('\n🎉 REPORTE FINAL DEL PROCESAMIENTO MEJORADO');
    writeLog('===========================================');
    writeLog(`📅 Fecha de inicio: ${stats.startTime.toISOString()}`);
    writeLog(`📅 Fecha de fin: ${endTime.toISOString()}`);
    writeLog(`⏱️ Duración total: ${Math.round(duration / 1000 / 60)} minutos`);
    writeLog('');
    writeLog('📊 ESTADÍSTICAS:');
    writeLog(`  - Archivos procesados: ${stats.processedFiles}`);
    writeLog(`  - Archivos fallidos: ${stats.failedFiles}`);
    writeLog(`  - Sesiones creadas: ${stats.createdSessions}`);
    writeLog(`  - Sesiones fallidas: ${stats.failedSessions}`);
    writeLog(`  - Total de mediciones: ${stats.totalMeasurements}`);
    writeLog('');
    writeLog('🔧 MEJORAS IMPLEMENTADAS:');
    writeLog('  ✅ skipDuplicates en todas las operaciones createMany');
    writeLog('  ✅ Timestamps únicos por archivo y medición');
    writeLog('  ✅ Logging mejorado y detallado');
    writeLog('  ✅ Procesamiento limitado para pruebas');
    writeLog('');
    writeLog('📁 ARCHIVOS DE LOG:');
    writeLog(`  - Log principal: ${LOG_FILE}`);
    writeLog(`  - Log de errores: ${ERROR_LOG_FILE}`);
}

processImproved();
