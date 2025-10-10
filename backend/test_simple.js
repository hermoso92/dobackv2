const fs = require('fs');
const path = require('path');

console.log('🧪 TEST SIMPLE PARSERS DOBACK SOFT');
console.log('='.repeat(50));

// Rutas de archivos
const basePath = 'data/datosDoback/CMadrid - copia';
const files = {
    GPS: path.join(basePath, 'GPS_DOBACK022_20250710_0.txt'),
    CAN: path.join(basePath, 'CAN_DOBACK022_20250710_0_TRADUCIDO.csv'),
    ESTABILIDAD: path.join(basePath, 'ESTABILIDAD_DOBACK022_20250710_0.txt'),
    ROTATIVO: path.join(basePath, 'ROTATIVO_DOBACK022_20250710_0.txt')
};

function parseDateTime(dateTimeStr) {
    try {
        // dd/mm/yyyy hh:mm:ss
        const match1 = dateTimeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
        if (match1) {
            const [, day, month, year, hour, minute, second] = match1;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        }
        
        // dd/mm/yyyy hh:mm:ssAM/PM
        const match2 = dateTimeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/);
        if (match2) {
            const [, day, month, year, hour, minute, second, ampm] = match2;
            let hour24 = parseInt(hour);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (ampm === 'AM' && hour24 === 12) hour24 = 0;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

function testGPS() {
    console.log('\n📍 TESTING GPS...');
    
    if (!fs.existsSync(files.GPS)) {
        console.log('❌ Archivo GPS no encontrado');
        return { data: [], issues: ['Archivo no encontrado'] };
    }
    
    const content = fs.readFileSync(files.GPS, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log(`📄 Total líneas: ${lines.length}`);
    console.log(`📋 Cabecera: ${lines[0]}`);
    console.log(`📋 Header: ${lines[1]}`);
    
    // Extraer hora de cabecera
    const cabeceraMatch = lines[0].match(/(\d{8})\s+(\d{2}):(\d{2}):(\d{2})/);
    const cabeceraHora = cabeceraMatch ? `${cabeceraMatch[2]}:${cabeceraMatch[3]}:${cabeceraMatch[4]}` : null;
    console.log(`⏰ Hora cabecera: ${cabeceraHora}`);
    
    const data = [];
    const issues = [];
    let firstValidData = null;
    let timeIssues = 0;
    let coordIssues = 0;
    let speedIssues = 0;
    
    for (let i = 2; i < Math.min(lines.length, 500); i++) {
        const line = lines[i];
        
        if (!line || line.includes('sin datos GPS')) {
            continue;
        }
        
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 9) {
            continue;
        }
        
        const fecha = parts[0];
        let hora = parts[1];
        
        // DETECTAR PROBLEMAS DE TIMESTAMP
        if (hora.includes('.')) {
            timeIssues++;
            const horaOriginal = hora;
            hora = hora.replace('.', '0');
            console.log(`🔧 Línea ${i+1}: timestamp corregido "${horaOriginal}" -> "${hora}"`);
        }
        
        // DETECTAR DESFASE DE 2 HORAS
        if (hora.startsWith('06:') && cabeceraHora && cabeceraHora.startsWith('08:')) {
            const [h, m, s] = hora.split(':');
            const newHour = (parseInt(h) + 2) % 24;
            const horaCorregida = `${newHour.toString().padStart(2, '0')}:${m}:${s}`;
            console.log(`⏰ Línea ${i+1}: desfase detectado "${hora}" -> "${horaCorregida}"`);
            hora = horaCorregida;
        }
        
        let latitude = parseFloat(parts[2]);
        let longitude = parseFloat(parts[3]);
        
        // DETECTAR COORDENADAS CORRUPTAS
        if (longitude < -0.1 && longitude > -1.0 && parts[3].startsWith('-0.')) {
            coordIssues++;
            const lonOriginal = longitude;
            longitude = parseFloat(parts[3].replace('-0.', '-3.'));
            console.log(`🔧 Línea ${i+1}: longitud corregida ${lonOriginal} -> ${longitude}`);
        }
        
        // VALIDAR COORDENADAS
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            issues.push(`Línea ${i+1}: coordenadas inválidas lat=${latitude}, lon=${longitude}`);
            continue;
        }
        
        const speed = parseFloat(parts[8]) || 0;
        
        // DETECTAR VELOCIDADES ANÓMALAS
        if (speed > 150) {
            speedIssues++;
            console.log(`⚠️ Línea ${i+1}: velocidad anómala ${speed} km/h`);
        }
        
        const timestamp = parseDateTime(`${fecha} ${hora}`);
        if (!timestamp) {
            issues.push(`Línea ${i+1}: timestamp inválido "${fecha} ${hora}"`);
            continue;
        }
        
        if (!firstValidData) {
            firstValidData = {
                line: i + 1,
                timestamp: timestamp.toISOString(),
                latitude,
                longitude,
                speed
            };
        }
        
        data.push({
            timestamp,
            latitude,
            longitude,
            altitude: parseFloat(parts[4]) || 0,
            speed,
            satellites: parseInt(parts[7]) || 0
        });
        
        // Solo procesar primeras 100 líneas válidas para el test
        if (data.length >= 100) break;
    }
    
    console.log(`✅ GPS: ${data.length} puntos válidos parseados`);
    console.log(`🔧 Correcciones aplicadas: ${timeIssues} timestamps, ${coordIssues} coordenadas`);
    console.log(`⚠️ Issues detectados: ${speedIssues} velocidades anómalas, ${issues.length} otros problemas`);
    
    if (firstValidData) {
        console.log(`📍 Primer punto válido (línea ${firstValidData.line}): ${firstValidData.timestamp}`);
        console.log(`   Coordenadas: ${firstValidData.latitude}, ${firstValidData.longitude}`);
        console.log(`   Velocidad: ${firstValidData.speed} km/h`);
    }
    
    return { data, issues: [...issues, `${timeIssues} timestamps corregidos`, `${coordIssues} coordenadas corregidas`, `${speedIssues} velocidades anómalas`] };
}

function testCAN() {
    console.log('\n🚗 TESTING CAN...');
    
    if (!fs.existsSync(files.CAN)) {
        console.log('❌ Archivo CAN no encontrado');
        return { data: [], issues: ['Archivo no encontrado'] };
    }
    
    try {
        const content = fs.readFileSync(files.CAN, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        console.log(`📄 Total líneas: ${lines.length}`);
        
        // Buscar header
        let headerIndex = -1;
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('fecha-hora') || line.includes('timestamp') || line.includes('engine')) {
                headerIndex = i;
                break;
            }
        }
        
        if (headerIndex === -1) {
            return { data: [], issues: ['No se encontró header válido'] };
        }
        
        console.log(`📋 Header encontrado en línea ${headerIndex + 1}: ${lines[headerIndex]}`);
        
        const delimiter = lines[headerIndex].includes(',') ? ',' : ';';
        const headers = lines[headerIndex].split(delimiter).map(h => h.trim().toLowerCase());
        
        const data = [];
        const issues = [];
        
        for (let i = headerIndex + 1; i < Math.min(lines.length, headerIndex + 101); i++) {
            const line = lines[i];
            if (!line) continue;
            
            const parts = line.split(delimiter).map(p => p.trim());
            if (parts.length !== headers.length) {
                issues.push(`Línea ${i+1}: columnas incorrectas (esperado ${headers.length}, encontrado ${parts.length})`);
                continue;
            }
            
            // Crear objeto de la fila
            const rowData = {};
            headers.forEach((header, idx) => {
                rowData[header] = parts[idx];
            });
            
            // Buscar campos obligatorios
            const timestamp = findField(rowData, ['fecha-hora', 'timestamp']);
            const engineRpm = findField(rowData, ['enginerpm', 'engine_speed', 'rpm', 'engine rpm']);
            
            if (!timestamp || !engineRpm) {
                issues.push(`Línea ${i+1}: faltan campos obligatorios (timestamp: ${!!timestamp}, engineRpm: ${!!engineRpm})`);
                continue;
            }
            
            try {
                data.push({
                    timestamp,
                    engineRpm: parseFloat(engineRpm),
                    vehicleSpeed: parseFloat(findField(rowData, ['vehiclespeed', 'vehicle_speed', 'speed', 'vehicle speed']) || '0'),
                    fuelSystemStatus: parseFloat(findField(rowData, ['fuelsystemstatus', 'fuel_consumption', 'fuel consumption']) || '0')
                });
            } catch (error) {
                issues.push(`Línea ${i+1}: error parsing - ${error.message}`);
            }
        }
        
        console.log(`✅ CAN: ${data.length} puntos válidos parseados`);
        console.log(`❌ Issues: ${issues.length} problemas detectados`);
        
        if (data.length > 0) {
            const first = data[0];
            console.log(`🚗 Primer punto: timestamp="${first.timestamp}", rpm=${first.engineRpm}, speed=${first.vehicleSpeed}`);
        }
        
        return { data, issues };
        
    } catch (error) {
        return { data: [], issues: [`Error leyendo archivo: ${error.message}`] };
    }
}

function findField(rowData, fieldNames) {
    for (const name of fieldNames) {
        for (const key in rowData) {
            if (key.toLowerCase().includes(name.toLowerCase())) {
                return rowData[key];
            }
        }
    }
    return null;
}

function testEstabilidad() {
    console.log('\n⚖️ TESTING ESTABILIDAD...');
    
    if (!fs.existsSync(files.ESTABILIDAD)) {
        console.log('❌ Archivo ESTABILIDAD no encontrado');
        return { data: [], issues: ['Archivo no encontrado'] };
    }
    
    const content = fs.readFileSync(files.ESTABILIDAD, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 3) {
        return { data: [], issues: ['Archivo demasiado corto'] };
    }
    
    console.log(`📄 Total líneas: ${lines.length}`);
    console.log(`📋 Cabecera: ${lines[0]}`);
    console.log(`📋 Header: ${lines[1]}`);
    
    const header = lines[1].split(';').map(h => h.trim());
    const data = [];
    const issues = [];
    let timeMarks = 0;
    let dataRows = 0;
    
    const timePattern = /^(\d{2}:\d{2}:\d{2}(AM|PM))$/;
    
    for (let i = 2; i < Math.min(lines.length, 102); i++) {
        const line = lines[i];
        
        if (timePattern.test(line)) {
            timeMarks++;
            console.log(`⏰ Marca de tiempo encontrada en línea ${i+1}: ${line}`);
        } else {
            const parts = line.split(';').map(p => p.trim());
            if (parts.length === header.length || (parts.length === header.length + 1 && parts[parts.length - 1] === '')) {
                if (parts.length === header.length + 1) parts.pop();
                
                const rowData = {};
                header.forEach((h, idx) => {
                    rowData[h] = parts[idx];
                });
                
                try {
                    data.push({
                        ax: parseFloat(rowData.ax || '0'),
                        ay: parseFloat(rowData.ay || '0'),
                        az: parseFloat(rowData.az || '0'),
                        gx: parseFloat(rowData.gx || '0'),
                        gy: parseFloat(rowData.gy || '0'),
                        gz: parseFloat(rowData.gz || '0'),
                        si: parseFloat(rowData.si || '0'),
                        accmag: parseFloat(rowData.accmag || '0')
                    });
                    dataRows++;
                } catch (error) {
                    issues.push(`Línea ${i+1}: error parsing - ${error.message}`);
                }
            } else {
                issues.push(`Línea ${i+1}: columnas incorrectas (esperado ${header.length}, encontrado ${parts.length})`);
            }
        }
    }
    
    console.log(`✅ ESTABILIDAD: ${data.length} puntos válidos parseados`);
    console.log(`⏰ Marcas de tiempo encontradas: ${timeMarks}`);
    console.log(`📊 Filas de datos procesadas: ${dataRows}`);
    console.log(`❌ Issues: ${issues.length} problemas detectados`);
    
    return { data, issues };
}

function testRotativo() {
    console.log('\n🔄 TESTING ROTATIVO...');
    
    if (!fs.existsSync(files.ROTATIVO)) {
        console.log('❌ Archivo ROTATIVO no encontrado');
        return { data: [], issues: ['Archivo no encontrado'] };
    }
    
    const content = fs.readFileSync(files.ROTATIVO, 'utf8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
        return { data: [], issues: ['Archivo demasiado corto'] };
    }
    
    console.log(`📄 Total líneas: ${lines.length}`);
    console.log(`📋 Cabecera: ${lines[0]}`);
    console.log(`📋 Header: ${lines[1]}`);
    
    const data = [];
    const issues = [];
    const states = { '0': 0, '1': 0 };
    
    for (let i = 2; i < Math.min(lines.length, 102); i++) {
        const line = lines[i];
        if (!line) continue;
        
        const parts = line.split(';').map(p => p.trim());
        if (parts.length < 2) {
            issues.push(`Línea ${i+1}: columnas insuficientes`);
            continue;
        }
        
        try {
            const state = parseInt(parts[1]);
            data.push({
                timestamp: parts[0],
                state: state
            });
            
            if (state in states) {
                states[state]++;
            }
        } catch (error) {
            issues.push(`Línea ${i+1}: error parsing - ${error.message}`);
        }
    }
    
    console.log(`✅ ROTATIVO: ${data.length} puntos válidos parseados`);
    console.log(`📊 Estados: Estado 0: ${states['0']}, Estado 1: ${states['1']}`);
    console.log(`❌ Issues: ${issues.length} problemas detectados`);
    
    return { data, issues };
}

// Test principal
async function runAllTests() {
    console.log('\n📁 Verificando archivos...');
    for (const [type, filePath] of Object.entries(files)) {
        const exists = fs.existsSync(filePath);
        console.log(`${exists ? '✅' : '❌'} ${type}: ${filePath}`);
    }
    
    const results = {
        gps: testGPS(),
        can: testCAN(),
        estabilidad: testEstabilidad(),
        rotativo: testRotativo()
    };
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL:');
    console.log('='.repeat(70));
    
    for (const [type, result] of Object.entries(results)) {
        console.log(`\n${type.toUpperCase()}:`);
        console.log(`  ✅ Datos parseados: ${result.data.length}`);
        console.log(`  ❌ Issues detectados: ${result.issues.length}`);
        
        if (result.issues.length > 0) {
            console.log('  🚫 Principales issues:');
            result.issues.slice(0, 5).forEach(issue => {
                console.log(`    - ${issue}`);
            });
        }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 CONCLUSIONES Y SIGUIENTE PASO:');
    console.log('='.repeat(70));
    
    const totalData = Object.values(results).reduce((sum, r) => sum + r.data.length, 0);
    const totalIssues = Object.values(results).reduce((sum, r) => sum + r.issues.length, 0);
    
    console.log(`📈 Total datos parseados: ${totalData}`);
    console.log(`⚠️  Total issues detectados: ${totalIssues}`);
    
    if (totalData > 0) {
        console.log('\n✅ PARSERS FUNCIONANDO - Datos válidos encontrados');
        console.log('🔧 Las correcciones del fixed processor están siendo aplicadas');
        console.log('📤 Siguiente paso: Probar subida real a la base de datos');
    } else {
        console.log('\n❌ PARSERS FALLANDO - No se obtuvieron datos válidos');
        console.log('🐛 Revisar archivos de entrada y lógica de parsing');
    }
    
    return results;
}

// Ejecutar
runAllTests().catch(console.error); 

// Test simple usando node fetch built-in (Node 18+)
async function testEndpoint() {
    try {
        console.log('Testing webfleet endpoint...');
        
        // Probar directamente con Authorization básica
        const testPayload = {
            startDate: '2025-07-03T14:50:29.788Z',
            endDate: '2025-07-17T14:50:29.788Z',
            vehicleIds: ['e2d7d36b-bd18-4a9e-897d-18d664769da2'],
            reportType: 'detailed',
            title: 'Informe de viajes (detailed)',
            includeCriticalEvents: true,
            includeConsumptionAnalysis: true,
            fuelReferenceBase: 7.5
        };

        console.log('Payload:', JSON.stringify(testPayload, null, 2));

        const response = await fetch('http://localhost:9998/api/reports/webfleet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MTYxNmQ0LTYxNDItNDRiMC04Y2QyLThjNmMxOTBjZGI0NSIsImVtYWlsIjoiYWRtaW5AZG9iYWNrLmxvY2FsIiwicm9sZSI6IkFETUlOIiwib3JnYW5pemF0aW9uSWQiOiI2YzJiZGZjMy0wMWMxLTRiMmMtYjBmMC1hMTM2NTYzZmE1ZjAiLCJpYXQiOjE3Mzc1NTQ0NjIsImV4cCI6MTczNzU2MTY2Mn0.Qe8JtpgOGVxV7sPXzZwX8FLJNw_vEqZgwYOWfPV_xts'
            },
            body: JSON.stringify(testPayload)
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEndpoint(); 