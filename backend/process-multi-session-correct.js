/**
 * 🔥 PROCESADOR DE ARCHIVOS DOBACK - VERSIÓN CORRECTA
 * Detecta múltiples sesiones, extrae timestamps reales, parsea correctamente
 * Basado en análisis exhaustivo de archivos reales
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración
const LOG_FILE = path.join(process.cwd(), 'multi-session-processing.log');
const BASE_PATH = path.join(process.cwd(), 'backend', 'data', 'datosDoback', 'CMadrid');
const VEHICLES = ['doback024', 'doback027', 'doback028'];

// ============================================================================
// LOGGING
// ============================================================================

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logMessage);
    console.log(message);
}

function logError(error, context) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ❌ ERROR ${context}: ${error.message}\n`;
    fs.appendFileSync(LOG_FILE, errorMessage);
    console.error(`❌ ERROR ${context}:`, error.message);
}

// ============================================================================
// PARSEO DE TIMESTAMPS
// ============================================================================

function parseTimestamp(str) {
    if (!str) return null;
    
    // Formato: "30/09/2025 09:33:44" o "30/09/2025-09:33:37"
    const cleaned = str.replace(/-/g, ' ');
    const match = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    return null;
}

// ============================================================================
// PARSEO DE ARCHIVOS ESTABILIDAD
// ============================================================================

function parseEstabilidadFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    const sesiones = [];
    let sesionActual = null;
    let currentTimestamp = null;
    
    for (const line of lines) {
        // Detectar cabecera de nueva sesión
        const headerMatch = line.match(/^ESTABILIDAD;(.+?);(DOBACK\d+);Sesión:(\d+);/);
        
        if (headerMatch) {
            // Guardar sesión anterior si existe
            if (sesionActual) {
                sesiones.push(sesionActual);
            }
            
            // Iniciar nueva sesión
            const timestamp = parseTimestamp(headerMatch[1]);
            const vehiculo = headerMatch[2];
            const numeroSesion = parseInt(headerMatch[3]);
            
            sesionActual = {
                tipo: 'ESTABILIDAD',
                vehiculo,
                numeroSesion,
                timestampInicio: timestamp,
                timestampFin: timestamp,
                datos: []
            };
            currentTimestamp = timestamp;
            continue;
        }
        
        // Detectar línea de timestamp (formato: 09:33:46)
        if (/^\d{2}:\d{2}:\d{2}$/.test(line)) {
            if (sesionActual && sesionActual.timestampInicio) {
                const [hour, minute, second] = line.split(':').map(Number);
                const baseDate = new Date(sesionActual.timestampInicio);
                currentTimestamp = new Date(
                    baseDate.getFullYear(),
                    baseDate.getMonth(),
                    baseDate.getDate(),
                    hour,
                    minute,
                    second
                );
                sesionActual.timestampFin = currentTimestamp;
            }
            continue;
        }
        
        // Línea de datos
        if (sesionActual && line.includes(';')) {
            const parts = line.split(';').map(p => p.trim());
            
            if (parts.length >= 19) {
                sesionActual.datos.push({
                    timestamp: currentTimestamp,
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
                    usciclo1: parseFloat(parts[10]) || 0,
                    usciclo2: parseFloat(parts[11]) || 0,
                    usciclo3: parseFloat(parts[12]) || 0,
                    usciclo4: parseFloat(parts[13]) || 0,
                    usciclo5: parseFloat(parts[14]) || 0,
                    si: parseFloat(parts[15]) || 0,
                    accmag: parseFloat(parts[16]) || 0,
                    microsds: parseFloat(parts[17]) || 0,
                    k3: parseFloat(parts[18]) || 0
                });
            }
        }
    }
    
    // Guardar última sesión
    if (sesionActual) {
        sesiones.push(sesionActual);
    }
    
    log(`  📊 ESTABILIDAD: ${sesiones.length} sesiones detectadas en archivo`);
    return sesiones;
}

// ============================================================================
// PARSEO DE ARCHIVOS GPS
// ============================================================================

function parseGPSFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    const sesiones = [];
    let sesionActual = null;
    
    for (const line of lines) {
        // Detectar cabecera
        const headerMatch = line.match(/^GPS;(.+?);(DOBACK\d+);Sesión:(\d+)/);
        
        if (headerMatch) {
            if (sesionActual) {
                sesiones.push(sesionActual);
            }
            
            const timestamp = parseTimestamp(headerMatch[1]);
            const vehiculo = headerMatch[2];
            const numeroSesion = parseInt(headerMatch[3]);
            
            sesionActual = {
                tipo: 'GPS',
                vehiculo,
                numeroSesion,
                timestampInicio: timestamp,
                timestampFin: timestamp,
                datos: []
            };
            continue;
        }
        
        // Saltar cabecera de columnas
        if (line.includes('HoraRaspberry') || line.includes('Latitud')) {
            continue;
        }
        
        // Parsear datos GPS
        if (sesionActual && line.includes(',')) {
            // Formato completo: HoraRaspberry,Fecha,Hora(GPS),Latitud,Longitud,Altitud,HDOP,Fix,NumSats,Velocidad
            // O simplificado: 09:40:10,01/10/2025,07:40:10,40.5343190,-3.6179127,715.9,6.03,1,05,0.43
            
            if (line.includes('sin datos GPS')) {
                // Línea sin GPS válido - extraer solo timestamp
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const horaRaspMatch = parts[0].match(/(\d{2}):(\d{2}):(\d{2})/);
                    const fechaMatch = parts[1].match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    
                    if (horaRaspMatch && fechaMatch) {
                        const [, day, month, year] = fechaMatch;
                        const [, hour, minute, second] = horaRaspMatch;
                        const timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
                        sesionActual.timestampFin = timestamp;
                    }
                }
                continue;
            }
            
            const parts = line.split(',').map(p => p.trim());
            
            // Detectar formato: puede empezar con "Hora Raspberry-" o directamente con hora
            let horaIdx = 0;
            let fechaIdx = 1;
            let latIdx = 3;
            let lonIdx = 4;
            let altIdx = 5;
            let hdopIdx = 6;
            let fixIdx = 7;
            let numSatsIdx = 8;
            let velocidadIdx = 9;
            
            if (parts[0].includes('Hora Raspberry')) {
                // Formato con prefijo - extraer solo la hora
                const horaMatch = parts[0].match(/(\d{2}):(\d{2}):(\d{2})/);
                if (!horaMatch) continue;
                parts[0] = `${horaMatch[1]}:${horaMatch[2]}:${horaMatch[3]}`;
            }
            
            if (parts.length >= 10) {
                try {
                    const lat = parseFloat(parts[latIdx]);
                    const lon = parseFloat(parts[lonIdx]);
                    
                    // Validar coordenadas
                    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                        continue;
                    }
                    
                    // Parsear timestamp
                    const horaMatch = parts[horaIdx].match(/(\d{2}):(\d{2}):(\d{2})/);
                    const fechaMatch = parts[fechaIdx].match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    
                    if (horaMatch && fechaMatch) {
                        const [, day, month, year] = fechaMatch;
                        const [, hour, minute, second] = horaMatch;
                        const timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
                        
                        sesionActual.datos.push({
                            timestamp,
                            latitude: lat,
                            longitude: lon,
                            altitude: parseFloat(parts[altIdx]) || 0,
                            hdop: parseFloat(parts[hdopIdx]) || 0,
                            fix: parseInt(parts[fixIdx]) || 0,
                            satellites: parseInt(parts[numSatsIdx]) || 0,
                            speed: parseFloat(parts[velocidadIdx]) || 0
                        });
                        
                        sesionActual.timestampFin = timestamp;
                    }
                } catch (e) {
                    // Línea inválida - saltar
                    continue;
                }
            }
        }
    }
    
    if (sesionActual) {
        sesiones.push(sesionActual);
    }
    
    log(`  🛰️ GPS: ${sesiones.length} sesiones detectadas`);
    return sesiones;
}

// ============================================================================
// PARSEO DE ARCHIVOS ROTATIVO
// ============================================================================

function parseRotativoFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    const sesiones = [];
    let sesionActual = null;
    
    for (const line of lines) {
        // Detectar cabecera
        const headerMatch = line.match(/^ROTATIVO;(.+?);(DOBACK\d+);Sesión:(\d+)/);
        
        if (headerMatch) {
            if (sesionActual) {
                sesiones.push(sesionActual);
            }
            
            const timestamp = parseTimestamp(headerMatch[1]);
            const vehiculo = headerMatch[2];
            const numeroSesion = parseInt(headerMatch[3]);
            
            sesionActual = {
                tipo: 'ROTATIVO',
                vehiculo,
                numeroSesion,
                timestampInicio: timestamp,
                timestampFin: timestamp,
                datos: []
            };
            continue;
        }
        
        // Saltar cabecera de columnas
        if (line.includes('Fecha-Hora') || line.includes('Estado')) {
            continue;
        }
        
        // Parsear datos - Formato: 30/09/2025-09:33:37;0
        if (sesionActual && line.includes(';')) {
            const parts = line.split(';').map(p => p.trim());
            
            if (parts.length >= 2) {
                const timestamp = parseTimestamp(parts[0]);
                const estado = parts[1];
                
                if (timestamp && ['0', '1', '2', '5'].includes(estado)) {
                    sesionActual.datos.push({
                        timestamp,
                        state: estado
                    });
                    
                    sesionActual.timestampFin = timestamp;
                }
            }
        }
    }
    
    if (sesionActual) {
        sesiones.push(sesionActual);
    }
    
    log(`  🔄 ROTATIVO: ${sesiones.length} sesiones detectadas`);
    return sesiones;
}

// ============================================================================
// CORRELACIÓN DE SESIONES
// ============================================================================

function correlacionarSesiones(sesionesEstabilidad, sesionesGPS, sesionesRotativo) {
    const sesionesPorNumero = {};
    
    // Agrupar por número de sesión
    sesionesEstabilidad.forEach(s => {
        const key = s.numeroSesion;
        if (!sesionesPorNumero[key]) {
            sesionesPorNumero[key] = { numero: key, estabilidad: null, gps: null, rotativo: null };
        }
        sesionesPorNumero[key].estabilidad = s;
    });
    
    sesionesGPS.forEach(s => {
        const key = s.numeroSesion;
        if (!sesionesPorNumero[key]) {
            sesionesPorNumero[key] = { numero: key, estabilidad: null, gps: null, rotativo: null };
        }
        sesionesPorNumero[key].gps = s;
    });
    
    sesionesRotativo.forEach(s => {
        const key = s.numeroSesion;
        if (!sesionesPorNumero[key]) {
            sesionesPorNumero[key] = { numero: key, estabilidad: null, gps: null, rotativo: null };
        }
        sesionesPorNumero[key].rotativo = s;
    });
    
    return Object.values(sesionesPorNumero);
}

// ============================================================================
// CREAR SESIÓN EN BD
// ============================================================================

async function crearSesionEnBD(vehicleId, organizationId, userId, sesionCorrelacionada) {
    // Determinar timestamps globales
    const timestamps = [];
    if (sesionCorrelacionada.estabilidad?.timestampInicio) timestamps.push(sesionCorrelacionada.estabilidad.timestampInicio);
    if (sesionCorrelacionada.gps?.timestampInicio) timestamps.push(sesionCorrelacionada.gps.timestampInicio);
    if (sesionCorrelacionada.rotativo?.timestampInicio) timestamps.push(sesionCorrelacionada.rotativo.timestampInicio);
    
    if (timestamps.length === 0) {
        throw new Error('No hay timestamps válidos para la sesión');
    }
    
    const startTime = new Date(Math.min(...timestamps.map(t => t.getTime())));
    
    const timestampsFin = [];
    if (sesionCorrelacionada.estabilidad?.timestampFin) timestampsFin.push(sesionCorrelacionada.estabilidad.timestampFin);
    if (sesionCorrelacionada.gps?.timestampFin) timestampsFin.push(sesionCorrelacionada.gps.timestampFin);
    if (sesionCorrelacionada.rotativo?.timestampFin) timestampsFin.push(sesionCorrelacionada.rotativo.timestampFin);
    
    const endTime = timestampsFin.length > 0 
        ? new Date(Math.max(...timestampsFin.map(t => t.getTime())))
        : new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hora por defecto
    
    const session = await prisma.session.create({
        data: {
            vehicleId,
            organizationId,
            userId,
            startTime,
            endTime,
            sequence: sesionCorrelacionada.numero,
            sessionNumber: sesionCorrelacionada.numero,
            status: 'COMPLETED',
            source: 'MULTI_SESSION_PROCESSOR'
        }
    });
    
    return session;
}

// ============================================================================
// GUARDAR MEDICIONES EN BD
// ============================================================================

async function guardarMedicionesEstabilidad(sessionId, datos) {
    if (datos.length === 0) return 0;
    
    const measurements = datos
        .filter(d => d.timestamp)
        .map(d => ({
            sessionId,
            timestamp: d.timestamp,
            ax: d.ax,
            ay: d.ay,
            az: d.az,
            gx: d.gx,
            gy: d.gy,
            gz: d.gz,
            roll: d.roll,
            pitch: d.pitch,
            yaw: d.yaw,
            timeantwifi: d.timeantwifi,
            usciclo1: d.usciclo1,
            usciclo2: d.usciclo2,
            usciclo3: d.usciclo3,
            usciclo4: d.usciclo4,
            usciclo5: d.usciclo5,
            si: d.si,
            accmag: d.accmag,
            microsds: d.microsds
        }));
    
    if (measurements.length > 0) {
        await prisma.stabilityMeasurement.createMany({
            data: measurements,
            skipDuplicates: true
        });
    }
    
    return measurements.length;
}

async function guardarMedicionesGPS(sessionId, datos) {
    if (datos.length === 0) return 0;
    
    const measurements = datos
        .filter(d => d.timestamp)
        .map(d => ({
            sessionId,
            timestamp: d.timestamp,
            latitude: d.latitude,
            longitude: d.longitude,
            altitude: d.altitude,
            hdop: d.hdop,
            fix: d.fix.toString(),
            satellites: d.satellites,
            speed: d.speed
        }));
    
    if (measurements.length > 0) {
        await prisma.gpsMeasurement.createMany({
            data: measurements,
            skipDuplicates: true
        });
    }
    
    return measurements.length;
}

async function guardarMedicionesRotativo(sessionId, datos) {
    if (datos.length === 0) return 0;
    
    const measurements = datos
        .filter(d => d.timestamp)
        .map(d => ({
            sessionId,
            timestamp: d.timestamp,
            state: d.state
        }));
    
    if (measurements.length > 0) {
        await prisma.rotativoMeasurement.createMany({
            data: measurements,
            skipDuplicates: true
        });
    }
    
    return measurements.length;
}

// ============================================================================
// PROCESAMIENTO PRINCIPAL
// ============================================================================

async function procesarVehiculo(vehiculo) {
    log(`\n========================================`);
    log(`🚗 Procesando vehículo: ${vehiculo.toUpperCase()}`);
    log(`========================================`);
    
    const vehiculoDB = await prisma.vehicle.findFirst({
        where: { identifier: vehiculo.toUpperCase() }
    });
    
    if (!vehiculoDB) {
        logError(new Error(`Vehículo ${vehiculo} no encontrado en BD`), 'VEHICULO');
        return { sesionesCreadas: 0, medicionesTotales: 0 };
    }
    
    const organization = await prisma.organization.findFirst({
        where: { id: vehiculoDB.organizationId }
    });
    
    const user = await prisma.user.findFirst({
        where: { organizationId: organization.id }
    });
    
    log(`✅ Vehículo DB: ${vehiculoDB.name} (${vehiculoDB.id})`);
    
    const vehiculoPath = path.join(BASE_PATH, vehiculo);
    
    // Buscar archivos
    const archivosEstabilidad = [];
    const archivosGPS = [];
    const archivosRotativo = [];
    
    const estabilidadPath = path.join(vehiculoPath, 'estabilidad');
    if (fs.existsSync(estabilidadPath)) {
        fs.readdirSync(estabilidadPath)
            .filter(f => f.endsWith('.txt'))
            .forEach(f => archivosEstabilidad.push(path.join(estabilidadPath, f)));
    }
    
    const gpsPath = path.join(vehiculoPath, 'GPS');
    if (fs.existsSync(gpsPath)) {
        fs.readdirSync(gpsPath)
            .filter(f => f.endsWith('.txt'))
            .forEach(f => archivosGPS.push(path.join(gpsPath, f)));
    }
    
    const rotativoPath = path.join(vehiculoPath, 'ROTATIVO');
    if (fs.existsSync(rotativoPath)) {
        fs.readdirSync(rotativoPath)
            .filter(f => f.endsWith('.txt'))
            .forEach(f => archivosRotativo.push(path.join(rotativoPath, f)));
    }
    
    log(`📁 Archivos encontrados:`);
    log(`   - ESTABILIDAD: ${archivosEstabilidad.length}`);
    log(`   - GPS: ${archivosGPS.length}`);
    log(`   - ROTATIVO: ${archivosRotativo.length}`);
    
    // Procesar todos los archivos y detectar TODAS las sesiones
    const todasSesionesEstabilidad = [];
    const todasSesionesGPS = [];
    const todasSesionesRotativo = [];
    
    log(`\n📊 Parseando archivos de ESTABILIDAD...`);
    for (const archivo of archivosEstabilidad) {
        const sesiones = parseEstabilidadFile(archivo);
        todasSesionesEstabilidad.push(...sesiones);
    }
    
    log(`\n🛰️ Parseando archivos de GPS...`);
    for (const archivo of archivosGPS) {
        const sesiones = parseGPSFile(archivo);
        todasSesionesGPS.push(...sesiones);
    }
    
    log(`\n🔄 Parseando archivos de ROTATIVO...`);
    for (const archivo of archivosRotativo) {
        const sesiones = parseRotativoFile(archivo);
        todasSesionesRotativo.push(...sesiones);
    }
    
    log(`\n📊 TOTAL SESIONES DETECTADAS:`);
    log(`   - ESTABILIDAD: ${todasSesionesEstabilidad.length} sesiones`);
    log(`   - GPS: ${todasSesionesGPS.length} sesiones`);
    log(`   - ROTATIVO: ${todasSesionesRotativo.length} sesiones`);
    
    // Agrupar sesiones por número
    const numerosSesiones = new Set([
        ...todasSesionesEstabilidad.map(s => s.numeroSesion),
        ...todasSesionesGPS.map(s => s.numeroSesion),
        ...todasSesionesRotativo.map(s => s.numeroSesion)
    ]);
    
    log(`\n🔗 Correlacionando ${numerosSesiones.size} sesiones únicas...`);
    
    let sesionesCreadas = 0;
    let medicionesTotales = 0;
    
    for (const numero of Array.from(numerosSesiones).sort((a, b) => a - b)) {
        const estabilidad = todasSesionesEstabilidad.find(s => s.numeroSesion === numero);
        const gps = todasSesionesGPS.find(s => s.numeroSesion === numero);
        const rotativo = todasSesionesRotativo.find(s => s.numeroSesion === numero);
        
        const sesionCorrelacionada = {
            numero,
            estabilidad,
            gps,
            rotativo
        };
        
        // Solo crear si hay al menos un tipo de datos
        if (estabilidad || gps || rotativo) {
            try {
                const session = await crearSesionEnBD(
                    vehiculoDB.id,
                    organization.id,
                    user.id,
                    sesionCorrelacionada
                );
                
                log(`\n  ✅ Sesión ${numero} creada: ${session.id.substring(0, 8)}`);
                
                // Guardar mediciones
                let mediciones = 0;
                
                if (estabilidad) {
                    const count = await guardarMedicionesEstabilidad(session.id, estabilidad.datos);
                    mediciones += count;
                    log(`     📊 ESTABILIDAD: ${count} mediciones`);
                }
                
                if (gps) {
                    const count = await guardarMedicionesGPS(session.id, gps.datos);
                    mediciones += count;
                    log(`     🛰️ GPS: ${count} mediciones`);
                }
                
                if (rotativo) {
                    const count = await guardarMedicionesRotativo(session.id, rotativo.datos);
                    mediciones += count;
                    log(`     🔄 ROTATIVO: ${count} mediciones`);
                }
                
                log(`     📈 Total mediciones: ${mediciones}`);
                
                sesionesCreadas++;
                medicionesTotales += mediciones;
                
            } catch (error) {
                logError(error, `Creando sesión ${numero}`);
            }
        }
    }
    
    log(`\n✅ ${vehiculo.toUpperCase()} COMPLETADO:`);
    log(`   - Sesiones creadas: ${sesionesCreadas}`);
    log(`   - Mediciones totales: ${medicionesTotales}`);
    
    return { sesionesCreadas, medicionesTotales };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    try {
        // Limpiar log anterior
        if (fs.existsSync(LOG_FILE)) {
            fs.unlinkSync(LOG_FILE);
        }
        
        log('╔══════════════════════════════════════════════════════════════╗');
        log('║    PROCESADOR MULTI-SESIÓN - DOBACKSOFT V2.0                ║');
        log('║    Detección correcta de múltiples sesiones por archivo     ║');
        log('╚══════════════════════════════════════════════════════════════╝');
        log(`\n⏰ Inicio: ${new Date().toLocaleString()}`);
        
        let totalSesiones = 0;
        let totalMediciones = 0;
        
        for (const vehiculo of VEHICLES) {
            const resultado = await procesarVehiculo(vehiculo);
            totalSesiones += resultado.sesionesCreadas;
            totalMediciones += resultado.medicionesTotales;
        }
        
        log('\n╔══════════════════════════════════════════════════════════════╗');
        log('║              PROCESAMIENTO COMPLETADO                        ║');
        log('╚══════════════════════════════════════════════════════════════╝');
        log(`\n📊 RESUMEN GLOBAL:`);
        log(`   - Vehículos procesados: ${VEHICLES.length}`);
        log(`   - Sesiones creadas: ${totalSesiones}`);
        log(`   - Mediciones totales: ${totalMediciones.toLocaleString()}`);
        log(`   - Promedio mediciones/sesión: ${Math.round(totalMediciones / totalSesiones)}`);
        log(`\n⏰ Fin: ${new Date().toLocaleString()}`);
        log(`\n✅ Log guardado en: ${LOG_FILE}`);
        
    } catch (error) {
        logError(error, 'MAIN');
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    parseEstabilidadFile,
    parseGPSFile,
    parseRotativoFile,
    correlacionarSesiones
};

