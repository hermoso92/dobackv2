import { logger } from '../utils/logger';

const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Función para generar datos de estabilidad
const generateStabilityData = (startTime, durationMinutes) => {
    const data = [];
    const duration = durationMinutes * 60;
    const samplingRate = 10; // 10 Hz

    for (let t = 0; t < duration; t += 1/samplingRate) {
        const progress = t / duration;
        const currentTime = new Date(startTime.getTime() + t * 1000);
        
        // Determinar fase
        let phase;
        if (progress < 0.167) phase = 'city_start';        // 0-20 min
        else if (progress < 0.25) phase = 'emergency';      // 20-30 min
        else if (progress < 0.833) phase = 'highway';       // 30-100 min
        else if (progress < 0.917) phase = 'intervention';  // 100-110 min
        else phase = 'city_end';                           // 110-120 min

        // Generar datos según la fase
        let speed, ax, ay, az, roll, pitch, yaw, si;
        switch (phase) {
            case 'city_start':
            case 'city_end':
                speed = 35 + Math.sin(t * 0.1) * 5;
                ax = Math.sin(t * 0.2) * 0.5;
                roll = Math.sin(t * 0.1) * 4;
                si = 0.75;
                break;
            case 'emergency':
                speed = 75 + Math.sin(t * 0.05) * 8;
                ax = Math.sin(t * 0.3) * 0.8;
                roll = Math.sin(t * 0.2) * 3;
                si = 0.85;
                break;
            case 'highway':
                speed = 90 + Math.sin(t * 0.02) * 3;
                ax = Math.sin(t * 0.1) * 0.2;
                roll = Math.sin(t * 0.05) * 1.5;
                si = 0.95;
                break;
            case 'intervention':
                speed = 25 + Math.sin(t * 0.3) * 10;
                ax = Math.sin(t * 0.4) * 1.0;
                roll = Math.sin(t * 0.3) * 5;
                si = 0.65;
                break;
        }

        // Añadir ruido y otros parámetros
        ay = 85 + Math.sin(t * 0.1) * 2;
        az = 1020 + Math.sin(t * 0.05);
        pitch = 4.5 + Math.sin(t * 0.1);
        yaw = Math.sin(t * 0.05) * 10;

        // Calcular velocidades angulares
        const gx = roll * 0.1;
        const gy = pitch * 0.1;
        const gz = yaw * 0.1;

        // Calcular aceleración total
        const accmag = Math.sqrt(ax*ax + ay*ay + az*az);

        data.push({
            time: format(currentTime, 'HH:mm:ss.SSS'),
            timestamp: currentTime.toISOString(),
            phase,
            speed,
            ax, ay, az,
            gx, gy, gz,
            roll, pitch, yaw,
            si,
            accmag
        });
    }

    return data;
};

// Generar datos
const startTime = new Date();
const data = generateStabilityData(startTime, 120);

// Crear CSV
const headers = [
    'Tiempo',
    'Timestamp',
    'Fase',
    'Velocidad (km/h)',
    'Aceleración X (g)',
    'Aceleración Y (g)',
    'Aceleración Z (g)',
    'Velocidad Angular X (°/s)',
    'Velocidad Angular Y (°/s)',
    'Velocidad Angular Z (°/s)',
    'Roll (°)',
    'Pitch (°)',
    'Yaw (°)',
    'Índice de Estabilidad',
    'Aceleración Total (g)'
].join(',');

const rows = data.map(point => [
    point.time,
    point.timestamp,
    point.phase,
    point.speed.toFixed(2),
    point.ax.toFixed(3),
    point.ay.toFixed(3),
    point.az.toFixed(3),
    point.gx.toFixed(3),
    point.gy.toFixed(3),
    point.gz.toFixed(3),
    point.roll.toFixed(3),
    point.pitch.toFixed(3),
    point.yaw.toFixed(3),
    point.si.toFixed(3),
    point.accmag.toFixed(3)
].join(','));

const csv = [headers, ...rows].join('\n');

// Guardar archivo
const filePath = './data/stability_data.csv';
fs.writeFileSync(filePath, csv, 'utf-8');
logger.info(`Datos guardados en: ${filePath}`);
logger.info(`Total de registros: ${data.length}`); 