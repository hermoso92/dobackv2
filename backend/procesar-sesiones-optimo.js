const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

console.log('🚀 PROCESADOR ÓPTIMO BASADO EN SISTEMA EXISTENTE');
console.log('================================================');

const prisma = new PrismaClient();

// Función para escribir logs tanto a consola como a archivo
const logs = [];
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logs.push(logMessage);
}

// Función para guardar logs al archivo
function guardarLogs() {
    const logContent = logs.join('\n');
    const logFile = path.join(__dirname, `procesamiento-optimo-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
    fs.writeFileSync(logFile, logContent);
    console.log(`📄 Logs guardados en: ${logFile}`);
    return logFile;
}

// Función para obtener tamaño de archivo en MB
function obtenerTamanoArchivoMB(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);
        log(`   📏 Tamaño de ${path.basename(filePath)}: ${sizeMB.toFixed(2)} MB`);
        return sizeMB;
    } catch (error) {
        log(`   ❌ Error obteniendo tamaño de ${filePath}: ${error.message}`);
        return 0;
    }
}

// Función para leer cabecera de archivo (replica la lógica del sistema existente)
function leerCabeceraArchivo(filePath) {
    try {
        log(`   📖 Leyendo cabecera de: ${path.basename(filePath)}`);
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
                        const cabecera = {
                            fecha: fechaMatch[0],
                            tipo: parts[0],
                            vehiculo: parts[2] || '',
                            sesion: parts[3] || ''
                        };
                        log(`   ✅ Cabecera encontrada: ${cabecera.tipo};${cabecera.fecha};${cabecera.vehiculo};${cabecera.sesion}`);
                        return cabecera;
                    }
                }
            }
        }
        log(`   ⚠️ No se encontró cabecera válida en: ${path.basename(filePath)}`);
        return null;
    } catch (error) {
        log(`   ❌ Error leyendo cabecera de ${path.basename(filePath)}: ${error.message}`);
        return null;
    }
}

// Función para decodificar archivo CAN (replica la lógica del sistema existente)
function decodificarArchivoCAN(filePath) {
    const pythonPath = 'python';
    const decodificadorPath = path.join(__dirname, 'data/DECODIFICADOR CAN/decodificador_can_unificado.py');
    
    if (!fs.existsSync(decodificadorPath)) {
        log(`   ⚠️ Decodificador CAN no encontrado: ${decodificadorPath}`);
        return false;
    }
    
    const traducido = filePath.replace(/\.txt$/i, '_TRADUCIDO.csv');
    
    if (fs.existsSync(traducido)) {
        log(`   ✅ Archivo CAN ya decodificado: ${path.basename(traducido)}`);
        return true;
    }
    
    log(`   🔧 Decodificando CAN: ${path.basename(filePath)}`);
    
    const result = spawnSync(pythonPath, [decodificadorPath, filePath], { 
        encoding: 'utf-8',
        timeout: 30000 // 30 segundos timeout
    });
    
    if (result.error || result.status !== 0) {
        log(`   ❌ Error decodificando CAN: ${result.stderr || result.error}`);
        return false;
    }
    
    if (fs.existsSync(traducido)) {
        log(`   ✅ CAN decodificado exitosamente: ${path.basename(traducido)}`);
        return true;
    } else {
        log(`   ❌ Archivo decodificado no encontrado: ${traducido}`);
        return false;
    }
}

// Función para parsear archivo de estabilidad (simplificada)
function parsearArchivoEstabilidad(filePath) {
    try {
        log(`   🔍 Parseando archivo de estabilidad: ${path.basename(filePath)}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        log(`   📊 Total de líneas en archivo: ${lines.length}`);
        
        if (lines.length < 2) {
            log(`   ⚠️ Archivo muy pequeño: ${lines.length} líneas`);
            return [];
        }
        
        // Buscar línea de datos (no cabecera)
        let dataStart = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(';') && !lines[i].match(/^[A-Z_]+;/)) {
                dataStart = i;
                break;
            }
        }
        
        log(`   📍 Línea de inicio de datos: ${dataStart}`);
        
        const dataLines = lines.slice(dataStart);
        const data = [];
        
        log(`   📋 Procesando ${dataLines.length} líneas de datos`);
        
        for (const line of dataLines) {
            const parts = line.split(';');
            if (parts.length >= 7) {
                try {
                    const timestamp = parts[0];
                    const ax = parseFloat(parts[1]);
                    const ay = parseFloat(parts[2]);
                    const az = parseFloat(parts[3]);
                    const gx = parseFloat(parts[4]);
                    const gy = parseFloat(parts[5]);
                    const gz = parseFloat(parts[6]);
                    
                    if (!isNaN(ax) && !isNaN(ay) && !isNaN(az) && 
                        !isNaN(gx) && !isNaN(gy) && !isNaN(gz)) {
                        data.push({
                            timestamp,
                            ax, ay, az, gx, gy, gz
                        });
                    }
                } catch (e) {
                    // Ignorar líneas malformadas
                }
            }
        }
        
        log(`   ✅ Datos de estabilidad válidos: ${data.length} registros`);
        return data;
    } catch (error) {
        log(`   ❌ Error parseando estabilidad: ${error.message}`);
        return [];
    }
}

// Función para parsear archivo GPS (simplificada)
function parsearArchivoGPS(filePath) {
    try {
        log(`   🔍 Parseando archivo GPS: ${path.basename(filePath)}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        log(`   📊 Total de líneas en archivo GPS: ${lines.length}`);
        
        if (lines.length < 2) {
            log(`   ⚠️ Archivo GPS muy pequeño: ${lines.length} líneas`);
            return [];
        }
        
        const data = [];
        
        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length >= 5) {
                try {
                    const timestamp = parts[0];
                    const latitude = parseFloat(parts[1]);
                    const longitude = parseFloat(parts[2]);
                    const altitude = parseFloat(parts[3]);
                    const speed = parseFloat(parts[4]);
                    
                    if (!isNaN(latitude) && !isNaN(longitude) && 
                        !isNaN(altitude) && !isNaN(speed)) {
                        data.push({
                            timestamp,
                            latitude, longitude, altitude, speed
                        });
                    }
                } catch (e) {
                    // Ignorar líneas malformadas
                }
            }
        }
        
        log(`   ✅ Datos GPS válidos: ${data.length} registros`);
        return data;
    } catch (error) {
        log(`   ❌ Error parseando GPS: ${error.message}`);
        return [];
    }
}

// Función para parsear archivo CAN decodificado
function parsearArchivoCANDecodificado(filePath) {
    try {
        log(`   🔍 Parseando archivo CAN decodificado: ${path.basename(filePath)}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        log(`   📊 Total de líneas en archivo CAN: ${lines.length}`);
        
        if (lines.length < 2) {
            log(`   ⚠️ Archivo CAN muy pequeño: ${lines.length} líneas`);
            return [];
        }
        
        const data = [];
        
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 4) {
                try {
                    const timestamp = parts[0];
                    const engineRpm = parseFloat(parts[1]);
                    const vehicleSpeed = parseFloat(parts[2]);
                    const fuelSystemStatus = parseFloat(parts[3]);
                    
                    if (!isNaN(engineRpm) && !isNaN(vehicleSpeed) && !isNaN(fuelSystemStatus)) {
                        data.push({
                            timestamp,
                            engineRpm, vehicleSpeed, fuelSystemStatus
                        });
                    }
                } catch (e) {
                    // Ignorar líneas malformadas
                }
            }
        }
        
        log(`   ✅ Datos CAN válidos: ${data.length} registros`);
        return data;
    } catch (error) {
        log(`   ❌ Error parseando CAN: ${error.message}`);
        return [];
    }
}

// Función para parsear archivo rotativo (simplificada)
function parsearArchivoRotativo(filePath) {
    try {
        log(`   🔍 Parseando archivo rotativo: ${path.basename(filePath)}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        log(`   📊 Total de líneas en archivo rotativo: ${lines.length}`);
        
        if (lines.length < 2) {
            log(`   ⚠️ Archivo rotativo muy pequeño: ${lines.length} líneas`);
            return [];
        }
        
        const data = [];
        
        for (const line of lines) {
            const parts = line.split(';');
            if (parts.length >= 2) {
                try {
                    const timestamp = parts[0];
                    const state = parseInt(parts[1]);
                    
                    if (!isNaN(state)) {
                        data.push({
                            timestamp,
                            state
                        });
                    }
                } catch (e) {
                    // Ignorar líneas malformadas
                }
            }
        }
        
        log(`   ✅ Datos rotativo válidos: ${data.length} registros`);
        return data;
    } catch (error) {
        log(`   ❌ Error parseando rotativo: ${error.message}`);
        return [];
    }
}

// Función para parsear timestamp (replica la lógica del sistema existente)
function parsearTimestamp(timestampStr) {
    try {
        // Try direct parsing first
        let date = new Date(timestampStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // dd/mm/yyyy hh:mm:ss or MM/dd/yyyy hh:mm:ss
        const match1 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
        if (match1) {
            const [, part1, part2, year, hour, minute, second] = match1;
            // Try both interpretations: DD/MM and MM/DD
            const dateOption1 = new Date(parseInt(year), parseInt(part2) - 1, parseInt(part1), parseInt(hour), parseInt(minute), parseInt(second));
            const dateOption2 = new Date(parseInt(year), parseInt(part1) - 1, parseInt(part2), parseInt(hour), parseInt(minute), parseInt(second));

            // Return the one that seems more reasonable (check if day is > 12 to determine format)
            if (parseInt(part1) > 12) {
                return dateOption1; // Must be DD/MM
            } else if (parseInt(part2) > 12) {
                return dateOption2; // Must be MM/DD
            } else {
                // Ambiguous, default to MM/DD for CAN files
                return dateOption2;
            }
        }

        // MM/dd/yyyy hh:mm:ssAM/PM format (Estabilidad)
        const match2 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/);
        if (match2) {
            const [, month, day, year, hour, minute, second, ampm] = match2;
            let hour24 = parseInt(hour);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (ampm === 'AM' && hour24 === 12) hour24 = 0;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
        }

        // dd/mm/yyyy,hh:mm:ss format (GPS)
        const match3 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),(\d{1,2}):(\d{2}):(\d{2})$/);
        if (match3) {
            const [, day, month, year, hour, minute, second] = match3;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        }

        // If all else fails, return current date with a warning
        log(`⚠️ No se pudo parsear timestamp: "${timestampStr}", usando fecha actual`);
        return new Date();
    } catch (error) {
        log(`⚠️ Error parseando timestamp: "${timestampStr}", usando fecha actual`);
        return new Date();
    }
}

async function procesarSesionesOptimo() {
    try {
        // PASO 1: Verificar conexión a base de datos
        log('\n1️⃣ VERIFICANDO CONEXIÓN A BASE DE DATOS...');
        await prisma.$connect();
        log('✅ Conexión exitosa a PostgreSQL');
        
        // PASO 2: Obtener organización y usuario admin
        log('\n2️⃣ OBTENIENDO DATOS DE CONFIGURACIÓN...');
        const organization = await prisma.organization.findFirst({
            where: { name: 'CMadrid' }
        });
        
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@cmadrid.com' }
        });
        
        if (!organization || !adminUser) {
            log('❌ ERROR: Organización o usuario admin no encontrados');
            return;
        }
        
        log(`✅ Organización: ${organization.name}`);
        log(`✅ Usuario admin: ${adminUser.name}`);
        
        // PASO 3: Escanear directorio de datos
        log('\n3️⃣ ESCANEANDO DIRECTORIO DE DATOS...');
        const dataPath = path.join(__dirname, 'data/datosDoback/CMadrid');
        
        if (!fs.existsSync(dataPath)) {
            log('❌ ERROR: Directorio de datos no encontrado');
            return;
        }
        
        const vehicleDirs = fs.readdirSync(dataPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        log(`✅ Vehículos encontrados: ${vehicleDirs.length}`);
        log(`📁 Lista de vehículos: ${vehicleDirs.join(', ')}`);
        
        // PASO 4: Crear mapeo de vehículos
        log('\n4️⃣ CREANDO MAPEO DE VEHÍCULOS...');
        const vehicleMapping = new Map();
        for (const vehicleDir of vehicleDirs) {
            const vehicle = await prisma.vehicle.findFirst({
                where: { identifier: vehicleDir }
            });
            if (vehicle) {
                vehicleMapping.set(vehicleDir, vehicle.id);
                log(`   ✅ Vehículo mapeado: ${vehicleDir} -> ${vehicle.id}`);
            } else {
                log(`   ⚠️ Vehículo no encontrado en BD: ${vehicleDir}`);
            }
        }
        
        log(`✅ Mapeo creado para ${vehicleMapping.size} vehículos`);
        
        // PASO 5: Procesar cada vehículo (replica la lógica del sistema existente)
        log('\n5️⃣ PROCESANDO VEHÍCULOS...');
        let totalSesiones = 0;
        let totalArchivos = 0;
        let sesionesProcesadas = 0;
        let sesionesOmitidas = 0;
        let errores = 0;
        
        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(dataPath, vehicleDir);
            log(`\n🔍 Procesando vehículo: ${vehicleDir}`);
            log(`   📁 Ruta del vehículo: ${vehiclePath}`);
            
            // Buscar archivos en subcarpetas por tipo
            const tipoDirs = ['estabilidad', 'CAN', 'GPS', 'ROTATIVO'];
            const archivosPorTipo = {
                ESTABILIDAD: [],
                CAN: [],
                GPS: [],
                ROTATIVO: []
            };
            
            for (const tipo of tipoDirs) {
                const tipoPath = path.join(vehiclePath, tipo);
                log(`   🔍 Verificando carpeta: ${tipoPath}`);
                
                if (fs.existsSync(tipoPath) && fs.statSync(tipoPath).isDirectory()) {
                    log(`   ✅ Carpeta existe: ${tipo}`);
                    const files = fs.readdirSync(tipoPath, { withFileTypes: true })
                        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.txt'))
                        .map(dirent => path.join(tipoPath, dirent.name));
                    
                    log(`   📄 Archivos .txt encontrados en ${tipo}: ${files.length}`);
                    
                    switch (tipo.toUpperCase()) {
                        case 'ESTABILIDAD': 
                            // FILTRO: Solo archivos > 1MB
                            const archivosEstabilidad = files.filter(file => {
                                const tamano = obtenerTamanoArchivoMB(file);
                                return tamano > 1;
                            });
                            archivosPorTipo.ESTABILIDAD.push(...archivosEstabilidad);
                            log(`   📁 ${tipo}: ${files.length} archivos total, ${archivosEstabilidad.length} > 1MB`);
                            break;
                        case 'CAN': 
                            archivosPorTipo.CAN.push(...files);
                            log(`   📁 ${tipo}: ${files.length} archivos`);
                            break;
                        case 'GPS': 
                            archivosPorTipo.GPS.push(...files);
                            log(`   📁 ${tipo}: ${files.length} archivos`);
                            break;
                        case 'ROTATIVO': 
                            archivosPorTipo.ROTATIVO.push(...files);
                            log(`   📁 ${tipo}: ${files.length} archivos`);
                            break;
                    }
                } else {
                    log(`   ❌ Carpeta no existe: ${tipoPath}`);
                }
            }
            
            totalArchivos += Object.values(archivosPorTipo).flat().length;
            log(`   📊 Total de archivos encontrados: ${totalArchivos}`);
            
            // Paso previo: traducir archivos CAN crudos a _TRADUCIDO.csv
            const canCrudos = archivosPorTipo.CAN.filter(f => !f.endsWith('_TRADUCIDO.csv'));
            log(`   🔧 Archivos CAN crudos a decodificar: ${canCrudos.length}`);
            
            for (const canFile of canCrudos) {
                const decodificado = decodificarArchivoCAN(canFile);
                if (decodificado) {
                    const traducido = canFile.replace(/\.txt$/i, '_TRADUCIDO.csv');
                    if (fs.existsSync(traducido)) {
                        archivosPorTipo.CAN.push(traducido);
                        log(`   ✅ Archivo CAN decodificado añadido: ${path.basename(traducido)}`);
                    }
                }
            }
            archivosPorTipo.CAN = archivosPorTipo.CAN.filter(f => f.endsWith('_TRADUCIDO.csv'));
            log(`   📁 Archivos CAN decodificados finales: ${archivosPorTipo.CAN.length}`);
            
            // Parsear todos los archivos y extraer metadatos
            log(`   🔍 Iniciando parsing de archivos...`);
            const fragmentos = [];
            const descartes = { ESTABILIDAD: [], CAN: [], GPS: [], ROTATIVO: [] };
            
            // ESTABILIDAD
            log(`   📊 Procesando ${archivosPorTipo.ESTABILIDAD.length} archivos de ESTABILIDAD`);
            for (const file of archivosPorTipo.ESTABILIDAD) {
                try {
                    const data = parsearArchivoEstabilidad(file);
                    if (data.length > 0) {
                        const startDate = parsearTimestamp(data[0].timestamp);
                        const endDate = parsearTimestamp(data[data.length - 1].timestamp);
                        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            fragmentos.push({
                                tipo: 'ESTABILIDAD',
                                file,
                                start: startDate,
                                end: endDate,
                                data: data
                            });
                            log(`   ✅ Fragmento ESTABILIDAD creado: ${path.basename(file)} (${data.length} registros)`);
                        } else {
                            log(`   ⚠️ Fecha inválida en ESTABILIDAD: ${path.basename(file)}`);
                            descartes.ESTABILIDAD.push({ file, motivo: 'Fecha inválida' });
                        }
                    } else {
                        log(`   ⚠️ Sin datos válidos en ESTABILIDAD: ${path.basename(file)}`);
                        descartes.ESTABILIDAD.push({ file, motivo: 'Sin datos válidos' });
                    }
                } catch (e) {
                    log(`   ❌ Error parseando estabilidad: ${path.basename(file)} - ${e.message}`);
                    descartes.ESTABILIDAD.push({ file, motivo: 'Error de parsing' });
                }
            }
            
            // CAN
            log(`   📊 Procesando ${archivosPorTipo.CAN.length} archivos de CAN`);
            for (const file of archivosPorTipo.CAN) {
                try {
                    const data = parsearArchivoCANDecodificado(file);
                    if (data.length > 0) {
                        const startDate = parsearTimestamp(data[0].timestamp);
                        const endDate = parsearTimestamp(data[data.length - 1].timestamp);
                        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            fragmentos.push({
                                tipo: 'CAN',
                                file,
                                start: startDate,
                                end: endDate,
                                data: data
                            });
                            log(`   ✅ Fragmento CAN creado: ${path.basename(file)} (${data.length} registros)`);
                        } else {
                            log(`   ⚠️ Fecha inválida en CAN: ${path.basename(file)}`);
                            descartes.CAN.push({ file, motivo: 'Fecha inválida' });
                        }
                    } else {
                        log(`   ⚠️ Sin datos válidos en CAN: ${path.basename(file)}`);
                        descartes.CAN.push({ file, motivo: 'Sin datos válidos' });
                    }
                } catch (e) {
                    log(`   ❌ Error parseando CAN: ${path.basename(file)} - ${e.message}`);
                    descartes.CAN.push({ file, motivo: 'Error de parsing' });
                }
            }
            
            // GPS
            log(`   📊 Procesando ${archivosPorTipo.GPS.length} archivos de GPS`);
            for (const file of archivosPorTipo.GPS) {
                try {
                    const data = parsearArchivoGPS(file);
                    if (data.length > 0) {
                        const startDate = parsearTimestamp(data[0].timestamp);
                        const endDate = parsearTimestamp(data[data.length - 1].timestamp);
                        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            fragmentos.push({
                                tipo: 'GPS',
                                file,
                                start: startDate,
                                end: endDate,
                                data: data
                            });
                            log(`   ✅ Fragmento GPS creado: ${path.basename(file)} (${data.length} registros)`);
                        } else {
                            log(`   ⚠️ Fecha inválida en GPS: ${path.basename(file)}`);
                            descartes.GPS.push({ file, motivo: 'Fecha inválida' });
                        }
                    } else {
                        log(`   ⚠️ Sin datos válidos en GPS: ${path.basename(file)}`);
                        descartes.GPS.push({ file, motivo: 'Sin datos válidos' });
                    }
                } catch (e) {
                    log(`   ❌ Error parseando GPS: ${path.basename(file)} - ${e.message}`);
                    descartes.GPS.push({ file, motivo: 'Error de parsing' });
                }
            }
            
            // ROTATIVO
            log(`   📊 Procesando ${archivosPorTipo.ROTATIVO.length} archivos de ROTATIVO`);
            for (const file of archivosPorTipo.ROTATIVO) {
                try {
                    const data = parsearArchivoRotativo(file);
                    if (data.length > 0) {
                        const startDate = parsearTimestamp(data[0].timestamp);
                        const endDate = parsearTimestamp(data[data.length - 1].timestamp);
                        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            fragmentos.push({
                                tipo: 'ROTATIVO',
                                file,
                                start: startDate,
                                end: endDate,
                                data: data
                            });
                            log(`   ✅ Fragmento ROTATIVO creado: ${path.basename(file)} (${data.length} registros)`);
                        } else {
                            log(`   ⚠️ Fecha inválida en ROTATIVO: ${path.basename(file)}`);
                            descartes.ROTATIVO.push({ file, motivo: 'Fecha inválida' });
                        }
                    } else {
                        log(`   ⚠️ Sin datos válidos en ROTATIVO: ${path.basename(file)}`);
                        descartes.ROTATIVO.push({ file, motivo: 'Sin datos válidos' });
                    }
                } catch (e) {
                    log(`   ❌ Error parseando ROTATIVO: ${path.basename(file)} - ${e.message}`);
                    descartes.ROTATIVO.push({ file, motivo: 'Error de parsing' });
                }
            }
            
            // Agrupar fragmentos por solapamiento real de tiempo (replica la lógica del sistema existente)
            log(`   🔍 Agrupando ${fragmentos.length} fragmentos por solapamiento temporal`);
            fragmentos.sort((a, b) => a.start.getTime() - b.start.getTime());
            const sesiones = [];
            
            for (const frag of fragmentos) {
                let added = false;
                for (const grupo of sesiones) {
                    if (grupo.some(f => !(frag.end < f.start || frag.start > f.end))) {
                        grupo.push(frag);
                        added = true;
                        log(`   🔗 Fragmento ${frag.tipo} añadido a sesión existente`);
                        break;
                    }
                }
                if (!added) {
                    sesiones.push([frag]);
                    log(`   🆕 Nueva sesión creada con fragmento ${frag.tipo}`);
                }
            }
            
            log(`   📊 Fragmentos: ${fragmentos.length}, Sesiones: ${sesiones.length}`);
            
            // Procesar cada sesión
            let idx = 1;
            log(`   🎯 Procesando ${sesiones.length} sesiones detectadas`);
            
            for (const grupo of sesiones) {
                try {
                    log(`   📋 Analizando sesión ${idx}:`);
                    const files = {};
                    const tipos = ['ESTABILIDAD', 'CAN', 'GPS', 'ROTATIVO'];
                    
                    for (const frag of grupo) {
                        switch (frag.tipo) {
                            case 'ESTABILIDAD': files.stabilityFile = frag.file; break;
                            case 'CAN': files.canFile = frag.file; break;
                            case 'GPS': files.gpsFile = frag.file; break;
                            case 'ROTATIVO': files.rotativoFile = frag.file; break;
                        }
                        log(`     📁 ${frag.tipo}: ${path.basename(frag.file)}`);
                    }
                    
                    const missing = tipos.filter(t => {
                        switch (t) {
                            case 'ESTABILIDAD': return !files.stabilityFile;
                            case 'CAN': return !files.canFile;
                            case 'GPS': return !files.gpsFile;
                            case 'ROTATIVO': return !files.rotativoFile;
                        }
                    });
                    
                    log(`     ❌ Archivos faltantes: ${missing.join(', ') || 'Ninguno'}`);
                    
                    // Solo procesar si hay al menos estabilidad + otro archivo
                    const archivosValidos = Object.values(files).filter(f => f).length;
                    log(`     📊 Archivos válidos: ${archivosValidos}/4`);
                    
                    if (archivosValidos < 2) {
                        log(`   ⚠️ Sesión ${idx} descartada: solo ${archivosValidos} archivos válidos`);
                        continue;
                    }
                    
                    // Calcular rango temporal global
                    const allTimes = grupo.flatMap(f => [f.start.getTime(), f.end.getTime()]);
                    const startTime = new Date(Math.min(...allTimes));
                    const endTime = new Date(Math.max(...allTimes));
                    
                    log(`     📅 Rango temporal: ${startTime.toISOString()} - ${endTime.toISOString()}`);
                    
                    // Verificar si la sesión ya existe
                    const existingSession = await prisma.session.findFirst({
                        where: {
                            vehicleId: vehicleMapping.get(vehicleDir),
                            startTime: startTime,
                            endTime: endTime
                        }
                    });
                    
                    if (existingSession) {
                        log(`   ⏭️ Sesión ${idx} ya existe: ${existingSession.id}`);
                        sesionesOmitidas++;
                        continue;
                    }
                    
                    // Crear sesión
                    const newSession = await prisma.session.create({
                        data: {
                            vehicleId: vehicleMapping.get(vehicleDir),
                            userId: adminUser.id,
                            organizationId: organization.id,
                            startTime: startTime,
                            endTime: endTime,
                            sequence: idx,
                            sessionNumber: idx,
                            status: 'COMPLETED',
                            type: 'ROUTINE',
                            source: 'AUTOMATIC_UPLOAD'
                        }
                    });
                    
                    log(`   ✅ Sesión ${idx} creada: ${newSession.id} (${archivosValidos} archivos)`);
                    sesionesProcesadas++;
                    totalSesiones++;
                    
                    idx++;
                    
                } catch (error) {
                    log(`   ❌ Error procesando sesión ${idx}: ${error.message}`);
                    errores++;
                }
            }
        }
        
        // PASO 6: Resumen final
        log('\n================================================');
        log('✅ PROCESAMIENTO ÓPTIMO COMPLETADO');
        log('================================================');
        log(`📊 RESUMEN FINAL:`);
        log(`   - Organización: ${organization.name}`);
        log(`   - Vehículos: ${vehicleDirs.length}`);
        log(`   - Archivos escaneados: ${totalArchivos}`);
        log(`   - Sesiones detectadas: ${totalSesiones}`);
        log(`   - Sesiones procesadas: ${sesionesProcesadas}`);
        log(`   - Sesiones omitidas: ${sesionesOmitidas}`);
        log(`   - Errores: ${errores}`);
        
        if (errores > 0) {
            log('\n⚠️ Algunas sesiones tuvieron errores. Revisa los logs anteriores.');
        } else {
            log('\n🎉 ¡Todas las sesiones procesadas exitosamente!');
        }
        
        log('\n🎯 Procesador óptimo completado');
        log('💡 Ahora puedes usar el dashboard para ver los datos procesados');
        
        // Guardar logs al archivo
        const logFile = guardarLogs();
        log(`📄 Logs completos guardados en: ${logFile}`);
        
    } catch (error) {
        log('\n❌ ERROR CRÍTICO:');
        log(error.toString());
        
        // Guardar logs incluso si hay error
        const logFile = guardarLogs();
        log(`📄 Logs de error guardados en: ${logFile}`);
    } finally {
        await prisma.$disconnect();
        log('\n🔌 Conexión a base de datos cerrada');
    }
}

// Ejecutar el procesamiento óptimo
procesarSesionesOptimo();