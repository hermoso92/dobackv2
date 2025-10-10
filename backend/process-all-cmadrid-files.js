const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function processAllCMadridFiles() {
    try {
        console.log('🧠 PROCESANDO TODOS LOS ARCHIVOS DE TODOS LOS VEHÍCULOS CMADRID...');

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
        
        // Obtener vehículos reales de CMadrid
        const realVehicles = ['doback022', 'doback023', 'doback024', 'doback025', 'doback027', 'doback028'];
        
        let totalFilesProcessed = 0;
        let totalMeasurements = 0;

        for (const vehicleName of realVehicles) {
            console.log(`\n🔧 Procesando TODOS los archivos de: ${vehicleName}`);
            
            // Buscar vehículo en BD
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

            // Procesar archivos de estabilidad
            const stabilityPath = path.join(vehiclePath, 'estabilidad');
            if (fs.existsSync(stabilityPath)) {
                const stabilityFiles = fs.readdirSync(stabilityPath).filter(f => f.endsWith('.txt'));
                console.log(`  📊 Archivos de estabilidad: ${stabilityFiles.length}`);
                
                // Procesar TODOS los archivos de estabilidad
                for (const file of stabilityFiles) {
                    const filePath = path.join(stabilityPath, file);
                    
                    console.log(`    📄 Procesando: ${file}`);
                    
                    // Crear sesión única para cada archivo
                    const sessionId = await createSessionForFile(vehicle.id, organization.id, file);
                    if (sessionId) {
                        const measurementsCount = await processStabilityFileReal(filePath, sessionId, file);
                        totalMeasurements += measurementsCount;
                        totalFilesProcessed++;
                        console.log(`    ✅ ${measurementsCount} mediciones reales insertadas`);
                    }
                }
            }

            // Procesar archivos CAN
            const canPath = path.join(vehiclePath, 'CAN');
            if (fs.existsSync(canPath)) {
                const canFiles = fs.readdirSync(canPath).filter(f => f.endsWith('.txt'));
                console.log(`  📊 Archivos CAN: ${canFiles.length}`);
                
                for (const file of canFiles) {
                    const filePath = path.join(canPath, file);
                    
                    console.log(`    📄 Procesando CAN: ${file}`);
                    
                    const sessionId = await createSessionForFile(vehicle.id, organization.id, file);
                    if (sessionId) {
                        const measurementsCount = await processCANFileReal(filePath, sessionId, file);
                        totalMeasurements += measurementsCount;
                        totalFilesProcessed++;
                        console.log(`    ✅ ${measurementsCount} mediciones CAN insertadas`);
                    }
                }
            }

            // Procesar archivos GPS
            const gpsPath = path.join(vehiclePath, 'GPS');
            if (fs.existsSync(gpsPath)) {
                const gpsFiles = fs.readdirSync(gpsPath).filter(f => f.endsWith('.txt'));
                console.log(`  📊 Archivos GPS: ${gpsFiles.length}`);
                
                for (const file of gpsFiles) {
                    const filePath = path.join(gpsPath, file);
                    
                    console.log(`    📄 Procesando GPS: ${file}`);
                    
                    const sessionId = await createSessionForFile(vehicle.id, organization.id, file);
                    if (sessionId) {
                        const measurementsCount = await processGPSFileReal(filePath, sessionId, file);
                        totalMeasurements += measurementsCount;
                        totalFilesProcessed++;
                        console.log(`    ✅ ${measurementsCount} mediciones GPS insertadas`);
                    }
                }
            }

            // Procesar archivos ROTATIVO
            const rotativoPath = path.join(vehiclePath, 'ROTATIVO');
            if (fs.existsSync(rotativoPath)) {
                const rotativoFiles = fs.readdirSync(rotativoPath).filter(f => f.endsWith('.txt'));
                console.log(`  📊 Archivos ROTATIVO: ${rotativoFiles.length}`);
                
                for (const file of rotativoFiles) {
                    const filePath = path.join(rotativoPath, file);
                    
                    console.log(`    📄 Procesando ROTATIVO: ${file}`);
                    
                    const sessionId = await createSessionForFile(vehicle.id, organization.id, file);
                    if (sessionId) {
                        const measurementsCount = await processRotativoFileReal(filePath, sessionId, file);
                        totalMeasurements += measurementsCount;
                        totalFilesProcessed++;
                        console.log(`    ✅ ${measurementsCount} mediciones ROTATIVO insertadas`);
                    }
                }
            }
        }

        console.log(`\n🎉 PROCESAMIENTO COMPLETO FINALIZADO:`);
        console.log(`  - Archivos procesados: ${totalFilesProcessed}`);
        console.log(`  - Mediciones totales insertadas: ${totalMeasurements}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function processStabilityFileReal(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            console.log(`    ❌ Archivo ${fileName} no tiene suficientes líneas`);
            return 0;
        }

        // Saltar cabecera del archivo y encabezado de columnas
        const dataLines = lines.slice(2);
        
        const measurements = [];
        const startTime = new Date('2025-07-07T14:23:20.000Z'); // Fecha base
        
        // Procesar todas las líneas de datos
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 19) {
                const ax = parseFloat(parts[0]) || 0;
                const ay = parseFloat(parts[1]) || 0;
                const az = parseFloat(parts[2]) || 0;
                const gx = parseFloat(parts[3]) || 0;
                const gy = parseFloat(parts[4]) || 0;
                const gz = parseFloat(parts[5]) || 0;
                const roll = parseFloat(parts[6]) || 0;
                const pitch = parseFloat(parts[7]) || 0;
                const yaw = parseFloat(parts[8]) || 0;
                const timeantwifi = parseFloat(parts[9]) || 0;
                const usciclo1 = parseFloat(parts[10]) || 0;
                const usciclo2 = parseFloat(parts[11]) || 0;
                const usciclo3 = parseFloat(parts[12]) || 0;
                const usciclo4 = parseFloat(parts[13]) || 0;
                const usciclo5 = parseFloat(parts[14]) || 0;
                const si = parseFloat(parts[15]) || 0;
                const accmag = parseFloat(parts[16]) || 0;
                const microsds = parseFloat(parts[17]) || 0;
                const k3 = parseFloat(parts[18]) || 0;
                
                measurements.push({
                    sessionId: sessionId,
                    timestamp: new Date(startTime.getTime() + i * 100),
                    ax: ax,
                    ay: ay,
                    az: az,
                    gx: gx,
                    gy: gy,
                    gz: gz,
                    roll: roll,
                    pitch: pitch,
                    yaw: yaw,
                    timeantwifi: timeantwifi,
                    accmag: accmag,
                    microsds: microsds,
                    si: si,
                    usciclo1: usciclo1,
                    usciclo2: usciclo2,
                    usciclo3: usciclo3,
                    usciclo4: usciclo4,
                    usciclo5: usciclo5
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

async function processCANFileReal(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return 0;
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        const startTime = new Date('2025-07-07T14:23:20.000Z');
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 10) {
                measurements.push({
                    sessionId: sessionId,
                    timestamp: new Date(startTime.getTime() + i * 100),
                    speed: parseFloat(parts[0]) || 0,
                    rpm: parseFloat(parts[1]) || 0,
                    throttlePosition: parseFloat(parts[2]) || 0,
                    brakePressure: parseFloat(parts[3]) || 0,
                    steeringAngle: parseFloat(parts[4]) || 0,
                    gearPosition: parseInt(parts[5]) || 0,
                    fuelLevel: parseFloat(parts[6]) || 0,
                    engineTemp: parseFloat(parts[7]) || 0,
                    batteryVoltage: parseFloat(parts[8]) || 0,
                    fuelSystemStatus: parseFloat(parts[9]) || 0
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

async function processGPSFileReal(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return 0;
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        const startTime = new Date('2025-07-07T14:23:20.000Z');
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 6) {
                measurements.push({
                    sessionId: sessionId,
                    timestamp: new Date(startTime.getTime() + i * 1000),
                    latitude: parseFloat(parts[0]) || 0,
                    longitude: parseFloat(parts[1]) || 0,
                    altitude: parseFloat(parts[2]) || 0,
                    speed: parseFloat(parts[3]) || 0,
                    satellites: parseInt(parts[4]) || 0,
                    quality: parts[5] || 'UNKNOWN'
                });
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

async function processRotativoFileReal(filePath, sessionId, fileName) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 3) {
            return 0;
        }

        const dataLines = lines.slice(2);
        const measurements = [];
        const startTime = new Date('2025-07-07T14:23:20.000Z');
        
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const parts = line.split(';').map(part => part.trim()).filter(part => part);
            
            if (parts.length >= 1) {
                measurements.push({
                    sessionId: sessionId,
                    timestamp: new Date(startTime.getTime() + i * 100),
                    state: parts[0] || 'UNKNOWN'
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

async function createSessionForFile(vehicleId, organizationId, fileName) {
    try {
        // Extraer fecha del nombre del archivo
        const dateMatch = fileName.match(/(\d{8})/);
        const sessionDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0].replace(/-/g, '');
        
        const startTime = new Date(
            sessionDate.substring(0,4), 
            sessionDate.substring(4,6)-1, 
            sessionDate.substring(6,8),
            14, 23, 20 // Hora específica del archivo
        );
        
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        // Buscar usuario existente para la organización
        const user = await prisma.user.findFirst({
            where: {
                organizationId: organizationId
            }
        });

        if (!user) {
            console.log(`    ❌ No se encontró usuario para la organización`);
            return null;
        }

        // Crear sesión única para este archivo
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
                source: 'REAL_CMADRID_FILE',
                sequence: 1,
                sessionNumber: 1
            }
        });

        return session.id;
    } catch (error) {
        console.error(`    ❌ Error creando sesión para ${fileName}:`, error.message);
        return null;
    }
}

processAllCMadridFiles();
