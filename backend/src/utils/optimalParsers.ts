import { logger } from './logger';

export interface GPSData {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    satellites: number;
    hdop: number | null;
    fix: string | null;
    heading: number | null;
    accuracy: number | null;
}

export interface StabilityData {
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    si: number;
    accmag: number;
}

export interface RotativoData {
    timestamp: Date;
    state: number;
}

export interface CANData {
    timestamp: Date;
    engineRpm: number;
    vehicleSpeed: number;
    fuelSystemStatus: string;
    engineTemperature: number;
    fuelConsumption: number;
}

/**
 * Parser optimizado para archivos GPS
 */
export class GPSStreamParser {
    private headerProcessed = false;
    private baseDate: Date | null = null;

    parseLine(line: string, lineNumber: number): GPSData | null {
        try {
            // Procesar header
            if (lineNumber === 1) {
                this.parseHeader(line);
                return null;
            }

            // Saltar líneas vacías o sin datos GPS
            if (!line.trim() || line.includes('sin datos GPS')) {
                return null;
            }

            // Parsear línea de datos GPS
            const parts = line.split(',');
            if (parts.length < 9) return null;

            const [fecha, hora, latitud, longitud, altitud, hdop, fix, numSats, velocidad] = parts;

            // Parsear fecha y hora
            const timestamp = this.parseDateTime(fecha.trim(), hora.trim());
            if (!timestamp) return null;

            // Validar coordenadas
            const lat = parseFloat(latitud);
            const lon = parseFloat(longitud);

            if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                return null;
            }

            // Aplicar correcciones de coordenadas
            const correctedCoords = this.correctCoordinates(lat, lon);

            return {
                timestamp,
                latitude: correctedCoords.lat,
                longitude: correctedCoords.lon,
                altitude: parseFloat(altitud) || 0,
                speed: parseFloat(velocidad) || 0,
                satellites: parseInt(numSats) || 0,
                hdop: parseFloat(hdop) || null,
                fix: fix?.trim() || null,
                heading: null,
                accuracy: null
            };

        } catch (error) {
            if (lineNumber <= 10) {
                logger.warn(`⚠️ Error parseando GPS línea ${lineNumber}: ${error}`);
            }
            return null;
        }
    }

    private parseHeader(line: string): void {
        // Formato: GPS;YYYYMMDD HH:MM:SS;DOBACKXXX;X;X
        const match = line.match(/GPS;(\d{8}) (\d{2}):(\d{2}):(\d{2});/);
        if (match) {
            const [, dateStr, hour, minute, second] = match;
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6));
            const day = parseInt(dateStr.substring(6, 8));

            this.baseDate = new Date(year, month - 1, day, parseInt(hour), parseInt(minute), parseInt(second));
        }
        this.headerProcessed = true;
    }

    private parseDateTime(fecha: string, hora: string): Date | null {
        try {
            // Formato: DD/MM/YYYY,HH:MM:SS
            const [day, month, year] = fecha.split('/');
            const [hour, minute, second] = hora.split(':');

            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );
        } catch (error) {
            return null;
        }
    }

    private correctCoordinates(lat: number, lon: number): { lat: number; lon: number } {
        let correctedLat = lat;
        let correctedLon = lon;

        // Corregir latitud que empieza con 0. en lugar de 40.
        if (lat.toString().startsWith('0.') && lat.toString().length > 4) {
            correctedLat = parseFloat('40' + lat.toString().substring(1));
        }

        // Corregir latitud que empieza con 4. en lugar de 4X.
        if (lat.toString().startsWith('4.') && lat.toString().length > 4 && lat < 10) {
            correctedLat = parseFloat('4' + lat.toString());
        }

        // Corregir longitud que empieza con -0. en lugar de -3.
        if (lon.toString().startsWith('-0.') && lon.toString().length > 4) {
            correctedLon = parseFloat('-3' + lon.toString().substring(1));
        }

        // Manejar valores extremos de longitud
        if (lon > 180 || lon < -180) {
            correctedLon = lon % 180;
        }

        return { lat: correctedLat, lon: correctedLon };
    }
}

/**
 * Parser optimizado para archivos de estabilidad
 */
export class StabilityStreamParser {
    private headerProcessed = false;
    private baseTimestamp: Date | null = null;
    private lastTimestamp: Date | null = null;
    private lineCount = 0;

    parseLine(line: string, lineNumber: number): StabilityData | null {
        try {
            // Procesar header
            if (lineNumber === 1) {
                this.parseHeader(line);
                return null;
            }

            // Saltar línea de columnas
            if (lineNumber === 2 && line.includes('ax; ay; az;')) {
                return null;
            }

            this.lineCount++;

            // Detectar timestamp en línea
            const timestampMatch = line.match(/(\d{1,2}):(\d{2}):(\d{2})(AM|PM)/);
            if (timestampMatch) {
                this.updateTimestamp(timestampMatch);
                return null; // Solo actualizar timestamp, no generar dato
            }

            // Parsear línea de datos
            const parts = line.split(';').map(p => p.trim());
            if (parts.length < 19) return null;

            const timestamp = this.getCurrentTimestamp();
            if (!timestamp) return null;

            // ✅ Validar y normalizar SI en rango [0,1]
            const siRaw = parseFloat(parts[15]) || 0;
            const siNormalizado = Math.max(0, Math.min(1, siRaw));
            
            return {
                timestamp,
                ax: parseFloat(parts[0]) || 0,
                ay: parseFloat(parts[1]) || 0,
                az: parseFloat(parts[2]) || 0,
                gx: parseFloat(parts[3]) || 0,
                gy: parseFloat(parts[4]) || 0,
                gz: parseFloat(parts[5]) || 0,
                roll: parseFloat(parts[6]) || 0,
                pitch: parseFloat(parts[7]) || 0,
                yaw: parseFloat(parts[8]) || 0,
                si: siNormalizado, // ✅ VALIDADO: clamped a [0,1]
                accmag: parseFloat(parts[16]) || 0
            };

        } catch (error) {
            if (lineNumber <= 10) {
                logger.warn(`⚠️ Error parseando estabilidad línea ${lineNumber}: ${error}`);
            }
            return null;
        }
    }

    private parseHeader(line: string): void {
        // Formato: ESTABILIDAD;DD/MM/YYYY HH:MM:SSAM/PM;DOBACKXXX;X;X;
        const match = line.match(/ESTABILIDAD;(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM);/);
        if (match) {
            const [, day, month, year, hour, minute, second, ampm] = match;
            let hour24 = parseInt(hour);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (ampm === 'AM' && hour24 === 12) hour24 = 0;

            this.baseTimestamp = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                hour24,
                parseInt(minute),
                parseInt(second)
            );
            this.lastTimestamp = new Date(this.baseTimestamp);
        }
        this.headerProcessed = true;
    }

    private updateTimestamp(match: RegExpMatchArray): void {
        if (!this.baseTimestamp) return;

        const [, hour, minute, second, ampm] = match;
        let hour24 = parseInt(hour);
        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (ampm === 'AM' && hour24 === 12) hour24 = 0;

        const newTimestamp = new Date(this.baseTimestamp);
        newTimestamp.setHours(hour24, parseInt(minute), parseInt(second), 0);

        // Si el timestamp es anterior al último, asumir día siguiente
        if (this.lastTimestamp && newTimestamp < this.lastTimestamp) {
            newTimestamp.setDate(newTimestamp.getDate() + 1);
        }

        this.lastTimestamp = newTimestamp;
    }

    private getCurrentTimestamp(): Date | null {
        if (!this.lastTimestamp) return null;

        // Interpolar timestamp basado en frecuencia de muestreo (ej: 100Hz)
        const sampleRate = 100; // Hz
        const msPerSample = 1000 / sampleRate;
        const interpolatedTime = new Date(this.lastTimestamp.getTime() + (this.lineCount * msPerSample));

        return interpolatedTime;
    }
}

/**
 * Parser optimizado para archivos rotativo
 */
export class RotativoStreamParser {
    private headerProcessed = false;

    parseLine(line: string, lineNumber: number): RotativoData | null {
        try {
            // Procesar header
            if (lineNumber === 1) {
                this.parseHeader(line);
                return null;
            }

            // Saltar línea de columnas
            if (lineNumber === 2 && line.includes('Fecha-Hora;Estado')) {
                return null;
            }

            // Parsear línea de datos
            const parts = line.split(';');
            if (parts.length < 2) return null;

            const [fechaHora, estado] = parts;
            const timestamp = this.parseDateTime(fechaHora.trim());
            if (!timestamp) return null;

            return {
                timestamp,
                state: parseInt(estado) || 0
            };

        } catch (error) {
            if (lineNumber <= 10) {
                logger.warn(`⚠️ Error parseando rotativo línea ${lineNumber}: ${error}`);
            }
            return null;
        }
    }

    private parseHeader(line: string): void {
        // Formato: ROTATIVO;YYYY-MM-DD;DOBACKXXX;X;X
        this.headerProcessed = true;
    }

    private parseDateTime(fechaHora: string): Date | null {
        try {
            // Formato: YYYY-MM-DD HH:MM:SS
            return new Date(fechaHora);
        } catch (error) {
            return null;
        }
    }
}

/**
 * Parser para archivos CAN decodificados
 */
export class CANStreamParser {
    parseLine(line: string, lineNumber: number): CANData | null {
        try {
            // Saltar líneas de comentario
            if (line.startsWith('#') || line.trim() === '') {
                return null;
            }

            // Parsear CSV decodificado
            const parts = line.split(',');
            if (parts.length < 6) return null;

            const [timestamp, length, response, service, parameterId, ...values] = parts;

            // Parsear timestamp
            const parsedTimestamp = this.parseTimestamp(timestamp.trim());
            if (!parsedTimestamp) return null;

            // Extraer valores decodificados (depende del formato del decodificador)
            const engineRpm = this.extractValue(values, 'Engine_Speed') || 0;
            const vehicleSpeed = this.extractValue(values, 'Vehicle_Speed') || 0;
            const engineTemperature = this.extractValue(values, 'Engine_Temperature') || 0;
            const fuelConsumption = this.extractValue(values, 'Fuel_Consumption') || 0;

            return {
                timestamp: parsedTimestamp,
                engineRpm,
                vehicleSpeed,
                fuelSystemStatus: service || 'unknown',
                engineTemperature,
                fuelConsumption
            };

        } catch (error) {
            if (lineNumber <= 10) {
                logger.warn(`⚠️ Error parseando CAN línea ${lineNumber}: ${error}`);
            }
            return null;
        }
    }

    private parseTimestamp(timestampStr: string): Date | null {
        try {
            // Formato: DD/MM/YYYY HH:MM:SS
            const match = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
            if (match) {
                const [, day, month, year, hour, minute, second] = match;
                return new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    parseInt(hour),
                    parseInt(minute),
                    parseInt(second)
                );
            }
            return new Date(timestampStr);
        } catch (error) {
            return null;
        }
    }

    private extractValue(values: string[], fieldName: string): number | null {
        // Buscar valor por nombre de campo en los valores decodificados
        // Esto depende del formato específico del decodificador CAN
        const index = values.findIndex(v => v.includes(fieldName));
        if (index !== -1 && index + 1 < values.length) {
            return parseFloat(values[index + 1]) || null;
        }
        return null;
    }
}