import * as fs from 'fs';
import * as path from 'path';

interface GPSPoint {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    satellites?: number;
    hdop?: number;
    fix?: number;
    heading?: number;
    accuracy?: number;
}

interface CANData {
    timestamp: string;
    engineRpm: number;
    vehicleSpeed: number;
    fuelSystemStatus: number;
}

interface StabilityData {
    timestamp: string;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    si: number;
    accmag: number;
}

interface RotativoData {
    timestamp: string;
    state: number;
}

class TestParsers {
    private descartes = {
        GPS: [] as Array<{ line: number; reason: string; data?: string }>,
        CAN: [] as Array<{ line: number; reason: string; data?: string }>,
        ESTABILIDAD: [] as Array<{ line: number; reason: string; data?: string }>,
        ROTATIVO: [] as Array<{ line: number; reason: string; data?: string }>
    };

    constructor() {
        console.log('🧪 TEST PARSERS DOBACK SOFT');
        console.log('='.repeat(50));
    }

    // Parser GPS con correcciones del fixed processor
    parseGPS(filePath: string): GPSPoint[] {
        console.log('\n📍 PARSEANDO GPS...');

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line);

        if (lines.length < 2) {
            console.log('❌ Archivo GPS demasiado corto');
            return [];
        }

        // Header en línea 1 (línea 0 es cabecera)
        const headerLine = lines[1];
        console.log(`📋 Header GPS: ${headerLine}`);

        const delimiter = headerLine.includes(',') ? ',' : ';';
        const data: GPSPoint[] = [];

        // Extraer desfase de tiempo de la cabecera
        const timeOffset = 0;
        const cabecera = lines[0];
        const cabeceraMatch = cabecera.match(/(\d{8})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (cabeceraMatch) {
            const cabeceraHour = parseInt(cabeceraMatch[2]);
            console.log(
                `⏰ Hora en cabecera: ${cabeceraHour}:${cabeceraMatch[3]}:${cabeceraMatch[4]}`
            );
        }

        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.includes('sin datos GPS')) {
                this.descartes.GPS.push({ line: i + 1, reason: 'Sin datos GPS', data: line });
                continue;
            }

            const parts = line.split(delimiter).map((p) => p.trim());
            if (parts.length < 9) {
                this.descartes.GPS.push({
                    line: i + 1,
                    reason: 'Columnas insuficientes',
                    data: line
                });
                continue;
            }

            try {
                const fecha = parts[0];
                let hora = parts[1];

                // CORRECCIÓN 1: Limpiar timestamps malformados (06:15:4. -> 06:15:40)
                if (hora.includes('.')) {
                    hora = hora.replace('.', '0');
                    console.log(`🔧 Timestamp corregido: ${parts[1]} -> ${hora}`);
                }

                // CORRECCIÓN 2: Verificar desfase de 2 horas
                if (hora.startsWith('06:') && cabeceraMatch && cabeceraMatch[2] === '08') {
                    const [h, m, s] = hora.split(':');
                    const newHour = (parseInt(h) + 2) % 24;
                    hora = `${newHour.toString().padStart(2, '0')}:${m}:${s}`;
                    console.log(`⏰ Hora corregida (+2h): ${parts[1]} -> ${hora}`);
                }

                const dateTimeStr = `${fecha} ${hora}`;
                const timestamp = this.parseDateTime(dateTimeStr);

                if (!timestamp) {
                    this.descartes.GPS.push({
                        line: i + 1,
                        reason: 'Timestamp inválido',
                        data: dateTimeStr
                    });
                    continue;
                }

                const latitude = parseFloat(parts[2]);
                let longitude = parseFloat(parts[3]);

                // CORRECCIÓN 3: Detectar coordenadas corruptas (longitud que empieza con -0.5)
                if (longitude < -0.1 && longitude > -1.0 && parts[3].startsWith('-0.')) {
                    const correctedLon = parseFloat(parts[3].replace('-0.', '-3.'));
                    console.log(`🔧 Longitud corregida: ${longitude} -> ${correctedLon}`);
                    longitude = correctedLon;
                }

                // Validar rangos de coordenadas
                if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                    this.descartes.GPS.push({
                        line: i + 1,
                        reason: 'Coordenadas fuera de rango',
                        data: `lat=${latitude}, lon=${longitude}`
                    });
                    continue;
                }

                const altitude = parseFloat(parts[4]) || 0;
                const hdop = parts[5] ? parseFloat(parts[5]) : undefined;
                const fix = parts[6] ? parseInt(parts[6]) : undefined;
                const satellites = parts[7] ? parseInt(parts[7]) : undefined;
                const speed = parts[8] ? parseFloat(parts[8]) : 0;

                // CORRECCIÓN 4: Validar velocidades anómalas
                if (speed > 200) {
                    console.log(`⚠️ Velocidad anómala detectada: ${speed} km/h en línea ${i + 1}`);
                    // Opcional: descartar o mantener
                }

                data.push({
                    timestamp,
                    latitude,
                    longitude,
                    altitude,
                    speed,
                    satellites,
                    hdop,
                    fix
                });
            } catch (error) {
                this.descartes.GPS.push({
                    line: i + 1,
                    reason: `Error parsing: ${error}`,
                    data: line
                });
            }
        }

        console.log(`✅ GPS parseado: ${data.length} puntos válidos`);
        console.log(`❌ GPS descartado: ${this.descartes.GPS.length} puntos`);

        if (data.length > 0) {
            const first = data[0];
            const last = data[data.length - 1];
            console.log(
                `📅 Rango temporal: ${first.timestamp.toISOString()} - ${last.timestamp.toISOString()}`
            );
            console.log(`📍 Primera coordenada: ${first.latitude}, ${first.longitude}`);
        }

        return data;
    }

    // Parser CAN mejorado
    parseCAN(filePath: string): CANData[] {
        console.log('\n🚗 PARSEANDO CAN...');

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line);

            // Buscar header real
            let headerIndex = -1;
            let delimiter = ',';

            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                const line = lines[i].toLowerCase();
                if (line.includes('fecha-hora') || line.includes('timestamp')) {
                    headerIndex = i;
                    delimiter = line.includes(',') ? ',' : ';';
                    break;
                }
            }

            if (headerIndex === -1) {
                console.log('❌ No se encontró header CAN válido');
                return [];
            }

            const headerLine = lines[headerIndex];
            console.log(`📋 Header CAN encontrado en línea ${headerIndex + 1}: ${headerLine}`);

            const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());
            const data: CANData[] = [];

            for (let i = headerIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;

                const parts = line.split(delimiter).map((p) => p.trim());
                if (parts.length !== headers.length) {
                    this.descartes.CAN.push({
                        line: i + 1,
                        reason: 'Columnas incorrectas',
                        data: line
                    });
                    continue;
                }

                const rowData: any = {};
                headers.forEach((header, idx) => {
                    rowData[header] = parts[idx];
                });

                // Buscar campos obligatorios
                const timestamp = this.findCANField(rowData, ['fecha-hora', 'timestamp']);
                const engineRpm = this.findCANField(rowData, ['enginerpm', 'engine_speed', 'rpm']);

                if (!timestamp || !engineRpm) {
                    this.descartes.CAN.push({
                        line: i + 1,
                        reason: 'Faltan campos obligatorios',
                        data: line
                    });
                    continue;
                }

                try {
                    data.push({
                        timestamp,
                        engineRpm: parseFloat(engineRpm),
                        vehicleSpeed: parseFloat(
                            this.findCANField(rowData, [
                                'vehiclespeed',
                                'vehicle_speed',
                                'speed'
                            ]) || '0'
                        ),
                        fuelSystemStatus: parseFloat(
                            this.findCANField(rowData, ['fuelsystemstatus', 'fuel_consumption']) ||
                                '0'
                        )
                    });
                } catch (error) {
                    this.descartes.CAN.push({
                        line: i + 1,
                        reason: `Error parsing: ${error}`,
                        data: line
                    });
                }
            }

            console.log(`✅ CAN parseado: ${data.length} puntos válidos`);
            console.log(`❌ CAN descartado: ${this.descartes.CAN.length} puntos`);

            return data;
        } catch (error) {
            console.log(`❌ Error leyendo archivo CAN: ${error}`);
            return [];
        }
    }

    // Parser ESTABILIDAD con interpolación de timestamps
    parseStability(filePath: string): StabilityData[] {
        console.log('\n⚖️ PARSEANDO ESTABILIDAD...');

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line);

        if (lines.length < 3) {
            console.log('❌ Archivo ESTABILIDAD demasiado corto');
            return [];
        }

        // Parsear cabecera
        const cabecera = lines[0].split(';');
        const fechaBaseStr = cabecera[1].trim();
        console.log(`📅 Fecha base: ${fechaBaseStr}`);

        let fechaBase: Date;
        try {
            fechaBase = this.parseDateTime(
                fechaBaseStr.replace(/(\d+)\/(\d+)\/(\d+) (\d+:\d+:\d+)(AM|PM)/, '$3-$2-$1 $4 $5')
            );
        } catch (error) {
            console.log(`❌ Error parseando fecha base: ${error}`);
            return [];
        }

        const header = lines[1].split(';').map((h) => h.trim());
        console.log(`📋 Header ESTABILIDAD: ${header.join(', ')}`);

        const data: StabilityData[] = [];
        const timePattern = /^(\d{2}:\d{2}:\d{2}(AM|PM))$/;

        const marcasTiempo = [fechaBase];
        const bloques: any[][] = [];
        let bloqueActual: any[] = [];

        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];

            if (timePattern.test(line)) {
                // Nueva marca de tiempo
                if (bloqueActual.length > 0) {
                    bloques.push(bloqueActual);
                    bloqueActual = [];
                }

                try {
                    const timestamp = this.parseDateTime(`${fechaBaseStr.split(' ')[0]} ${line}`);
                    if (timestamp) {
                        marcasTiempo.push(timestamp);
                    }
                } catch (error) {
                    console.log(`⚠️ Error parseando marca de tiempo: ${line}`);
                }
            } else {
                // Línea de datos
                const parts = line.split(';').map((p) => p.trim());
                if (
                    parts.length === header.length ||
                    (parts.length === header.length + 1 && parts[parts.length - 1] === '')
                ) {
                    if (parts.length === header.length + 1) parts.pop(); // Remover columna vacía final

                    const rowData: any = {};
                    header.forEach((h, idx) => {
                        rowData[h] = parts[idx];
                    });

                    bloqueActual.push(rowData);
                } else {
                    this.descartes.ESTABILIDAD.push({
                        line: i + 1,
                        reason: 'Columnas incorrectas',
                        data: line
                    });
                }
            }
        }

        // Agregar último bloque
        if (bloqueActual.length > 0) {
            bloques.push(bloqueActual);
        }

        // Interpolar timestamps
        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            if (bloque.length === 0) continue;

            const tStart = marcasTiempo[i];
            const tEnd =
                i + 1 < marcasTiempo.length
                    ? marcasTiempo[i + 1]
                    : new Date(tStart.getTime() + 1000 * bloque.length);

            const totalMs = tEnd.getTime() - tStart.getTime();
            const stepMs = bloque.length > 1 ? totalMs / bloque.length : 0;

            bloque.forEach((row, j) => {
                const timestamp = new Date(tStart.getTime() + stepMs * (j + 0.5));

                try {
                    data.push({
                        timestamp: timestamp.toISOString(),
                        ax: parseFloat(row.ax || '0'),
                        ay: parseFloat(row.ay || '0'),
                        az: parseFloat(row.az || '0'),
                        gx: parseFloat(row.gx || '0'),
                        gy: parseFloat(row.gy || '0'),
                        gz: parseFloat(row.gz || '0'),
                        si: parseFloat(row.si || '0'),
                        accmag: parseFloat(row.accmag || '0')
                    });
                } catch (error) {
                    this.descartes.ESTABILIDAD.push({
                        line: -1,
                        reason: `Error processing: ${error}`,
                        data: JSON.stringify(row)
                    });
                }
            });
        }

        console.log(`✅ ESTABILIDAD parseado: ${data.length} puntos válidos`);
        console.log(`❌ ESTABILIDAD descartado: ${this.descartes.ESTABILIDAD.length} puntos`);

        return data;
    }

    // Parser ROTATIVO
    parseRotativo(filePath: string): RotativoData[] {
        console.log('\n🔄 PARSEANDO ROTATIVO...');

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line);

        if (lines.length < 2) {
            console.log('❌ Archivo ROTATIVO demasiado corto');
            return [];
        }

        const headerLine = lines[1];
        console.log(`📋 Header ROTATIVO: ${headerLine}`);

        const delimiter = headerLine.includes(',') ? ',' : ';';
        const data: RotativoData[] = [];

        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const parts = line.split(delimiter).map((p) => p.trim());
            if (parts.length < 2) {
                this.descartes.ROTATIVO.push({
                    line: i + 1,
                    reason: 'Columnas insuficientes',
                    data: line
                });
                continue;
            }

            try {
                data.push({
                    timestamp: parts[0],
                    state: parseInt(parts[1])
                });
            } catch (error) {
                this.descartes.ROTATIVO.push({
                    line: i + 1,
                    reason: `Error parsing: ${error}`,
                    data: line
                });
            }
        }

        console.log(`✅ ROTATIVO parseado: ${data.length} puntos válidos`);
        console.log(`❌ ROTATIVO descartado: ${this.descartes.ROTATIVO.length} puntos`);

        return data;
    }

    // Utilidades
    private parseDateTime(dateTimeStr: string): Date | null {
        // Formatos soportados
        const formats = [
            // dd/mm/yyyy hh:mm:ss
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/,
            // dd/mm/yyyy hh:mm:ssAM/PM
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/,
            // yyyy-mm-dd hh:mm:ss
            /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{2}):(\d{2})$/
        ];

        for (const format of formats) {
            const match = dateTimeStr.match(format);
            if (match) {
                try {
                    if (format === formats[0]) {
                        // dd/mm/yyyy hh:mm:ss
                        const [, day, month, year, hour, minute, second] = match;
                        return new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day),
                            parseInt(hour),
                            parseInt(minute),
                            parseInt(second)
                        );
                    } else if (format === formats[1]) {
                        // dd/mm/yyyy hh:mm:ssAM/PM
                        const [, day, month, year, hour, minute, second, ampm] = match;
                        let hour24 = parseInt(hour);
                        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
                        if (ampm === 'AM' && hour24 === 12) hour24 = 0;
                        return new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day),
                            hour24,
                            parseInt(minute),
                            parseInt(second)
                        );
                    } else if (format === formats[2]) {
                        // yyyy-mm-dd hh:mm:ss
                        const [, year, month, day, hour, minute, second] = match;
                        return new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day),
                            parseInt(hour),
                            parseInt(minute),
                            parseInt(second)
                        );
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        return null;
    }

    private findCANField(rowData: any, fieldNames: string[]): string | null {
        for (const name of fieldNames) {
            for (const key in rowData) {
                if (key.toLowerCase().includes(name.toLowerCase())) {
                    return rowData[key];
                }
            }
        }
        return null;
    }

    // Test principal
    async runTest() {
        const basePath = path.join('backend', 'data', 'datosDoback', 'CMadrid - copia');
        const files = {
            GPS: path.join(basePath, 'GPS_DOBACK022_20250710_0.txt'),
            CAN: path.join(basePath, 'CAN_DOBACK022_20250710_0_TRADUCIDO.csv'),
            ESTABILIDAD: path.join(basePath, 'ESTABILIDAD_DOBACK022_20250710_0.txt'),
            ROTATIVO: path.join(basePath, 'ROTATIVO_DOBACK022_20250710_0.txt')
        };

        console.log('\n📁 Verificando archivos...');
        for (const [type, filePath] of Object.entries(files)) {
            const exists = fs.existsSync(filePath);
            console.log(`${exists ? '✅' : '❌'} ${type}: ${filePath}`);
        }

        // Parsear todos los archivos
        const gpsData = fs.existsSync(files.GPS) ? this.parseGPS(files.GPS) : [];
        const canData = fs.existsSync(files.CAN) ? this.parseCAN(files.CAN) : [];
        const stabilityData = fs.existsSync(files.ESTABILIDAD)
            ? this.parseStability(files.ESTABILIDAD)
            : [];
        const rotativoData = fs.existsSync(files.ROTATIVO)
            ? this.parseRotativo(files.ROTATIVO)
            : [];

        // Resumen final
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMEN FINAL:');
        console.log(
            `GPS: ${gpsData.length} puntos parseados, ${this.descartes.GPS.length} descartados`
        );
        console.log(
            `CAN: ${canData.length} puntos parseados, ${this.descartes.CAN.length} descartados`
        );
        console.log(
            `ESTABILIDAD: ${stabilityData.length} puntos parseados, ${this.descartes.ESTABILIDAD.length} descartados`
        );
        console.log(
            `ROTATIVO: ${rotativoData.length} puntos parseados, ${this.descartes.ROTATIVO.length} descartados`
        );

        // Mostrar algunos descartes como ejemplo
        console.log('\n🚫 EJEMPLOS DE DESCARTES:');
        for (const [type, descartes] of Object.entries(this.descartes)) {
            if (descartes.length > 0) {
                console.log(`\n${type} (${descartes.length} total):`);
                descartes.slice(0, 3).forEach((d) => {
                    console.log(
                        `  Línea ${d.line}: ${d.reason} ${
                            d.data ? `- "${d.data.substring(0, 50)}..."` : ''
                        }`
                    );
                });
            }
        }

        return {
            gps: gpsData,
            can: canData,
            stability: stabilityData,
            rotativo: rotativoData,
            descartes: this.descartes
        };
    }
}

// Ejecutar test
const test = new TestParsers();
test.runTest()
    .then((result) => {
        console.log('\n✅ Test completado');
    })
    .catch((error) => {
        console.error('❌ Error en test:', error);
    });
