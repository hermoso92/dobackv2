import * as fs from 'fs';
import * as path from 'path';
import { generateStabilityData, getTravelPhase } from './stabilitySimulation';
// Función para exportar datos a CSV
const exportToCSV = () => {
    const startTime = new Date();
    const { data } = generateStabilityData(startTime, 120);

    // Definir encabezados CSV
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

    // Convertir datos a filas CSV
    const rows = data.map((point, index) => {
        const timeInSeconds = index / 10; // Ya que muestreamos a 10Hz
        const phase = getTravelPhase(timeInSeconds, 7200);
        return [
            point.time,
            point.timestamp,
            phase,
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
        ].join(',');
    });

    // Combinar encabezados y filas
    const csv = [headers, ...rows].join('\n');

    // Guardar archivo
    const filePath = path.join(__dirname, '../../data/stability_data.csv');
    fs.writeFileSync(filePath, csv, 'utf-8');
    console.log(`Datos guardados en: ${filePath}`);
    console.log(`Total de registros: ${data.length}`);
};

// Ejecutar exportación
exportToCSV(); 