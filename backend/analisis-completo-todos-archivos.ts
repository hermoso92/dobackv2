/**
 * ANÁLISIS COMPLETO DE TODOS LOS ARCHIVOS
 * 
 * Este script analiza TODOS los archivos de TODOS los vehículos
 * para entender patrones globales, variaciones entre días y vehículos
 */

import fs from 'fs';
import path from 'path';

const BASE_PATH = path.join(__dirname, 'data', 'datosDoback', 'CMadrid');

interface ResumenArchivo {
    vehiculo: string;
    fecha: string;
    tipo: string;
    nombreArchivo: string;
    tamañoKB: number;
    totalLineas: number;
    sesionesDetectadas: number;
    calidadDatos: number; // %
    problemas: string[];
}

function analizarArchivoCompleto(rutaArchivo: string): ResumenArchivo | null {
    try {
        const stats = fs.statSync(rutaArchivo);
        const nombreArchivo = path.basename(rutaArchivo);

        // Extraer metadatos del nombre
        const match = nombreArchivo.match(/^(ESTABILIDAD|GPS|ROTATIVO)_(DOBACK\d+)_(\d{8})\.txt$/);
        if (!match) {
            return null;
        }

        const [_, tipo, vehiculo, fechaStr] = match;
        const fecha = `${fechaStr.substring(6, 8)}/${fechaStr.substring(4, 6)}/${fechaStr.substring(0, 4)}`;

        // Leer archivo
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        const lineas = contenido.split('\n');

        // Detectar sesiones
        let sesiones = 0;
        let lineasDatos = 0;
        let lineasProblema = 0;
        const problemas: string[] = [];

        for (const linea of lineas) {
            const lineaTrim = linea.trim();
            if (!lineaTrim) continue;

            // Detectar cabeceras de sesión
            if (lineaTrim.startsWith(`${tipo};`)) {
                sesiones++;
            }

            // Contar líneas de datos y problemas
            if (tipo === 'GPS') {
                if (lineaTrim.includes('sin datos GPS')) {
                    lineasProblema++;
                } else if (lineaTrim.includes(',') && !lineaTrim.startsWith('GPS;') && !lineaTrim.startsWith('HoraRaspberry')) {
                    lineasDatos++;
                }

                // Detectar timestamps corruptos
                if (lineaTrim.match(/\d{2}:\d{2}:\./)) {
                    problemas.push('Timestamp corrupto detectado');
                }
                if (lineaTrim.match(/2[4-9]:\d{2}:\d{2}/)) {
                    problemas.push('Hora inválida (>24h)');
                }
            } else if (tipo === 'ESTABILIDAD') {
                if (lineaTrim.includes(';') && !lineaTrim.startsWith('ESTABILIDAD;') && !lineaTrim.startsWith('ax;') && !lineaTrim.match(/^\d{2}:\d{2}:\d{2}$/)) {
                    lineasDatos++;
                }
            } else if (tipo === 'ROTATIVO') {
                if (lineaTrim.includes(';') && !lineaTrim.startsWith('ROTATIVO;') && !lineaTrim.startsWith('Fecha-Hora;')) {
                    lineasDatos++;
                }
            }
        }

        // Calcular calidad
        const totalLineasSignificativas = lineasDatos + lineasProblema;
        const calidadDatos = totalLineasSignificativas > 0
            ? (lineasDatos / totalLineasSignificativas) * 100
            : 100;

        return {
            vehiculo,
            fecha,
            tipo,
            nombreArchivo,
            tamañoKB: stats.size / 1024,
            totalLineas: lineas.length,
            sesionesDetectadas: sesiones || 1,
            calidadDatos: Math.round(calidadDatos),
            problemas: problemas.length > 0 ? [...new Set(problemas)] : []
        };

    } catch (error: any) {
        console.error(`Error analizando ${rutaArchivo}: ${error.message}`);
        return null;
    }
}

function explorarDirectorio(dir: string, archivos: ResumenArchivo[] = []): ResumenArchivo[] {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const rutaCompleta = path.join(dir, item);
        const stats = fs.statSync(rutaCompleta);

        if (stats.isDirectory()) {
            explorarDirectorio(rutaCompleta, archivos);
        } else if (item.endsWith('.txt')) {
            const resumen = analizarArchivoCompleto(rutaCompleta);
            if (resumen) {
                archivos.push(resumen);
            }
        }
    }

    return archivos;
}

console.log('🔬 ANÁLISIS COMPLETO DE TODOS LOS ARCHIVOS DOBACK\n');
console.log('Escaneando directorio:', BASE_PATH);
console.log('\n' + '='.repeat(100) + '\n');

const todosLosArchivos = explorarDirectorio(BASE_PATH);

console.log(`✅ Total de archivos encontrados: ${todosLosArchivos.length}\n`);

// Agrupar por vehículo
const porVehiculo = new Map<string, ResumenArchivo[]>();
todosLosArchivos.forEach(a => {
    if (!porVehiculo.has(a.vehiculo)) {
        porVehiculo.set(a.vehiculo, []);
    }
    porVehiculo.get(a.vehiculo)!.push(a);
});

console.log('📊 VEHÍCULOS ENCONTRADOS:\n');
porVehiculo.forEach((archivos, vehiculo) => {
    console.log(`  ${vehiculo}: ${archivos.length} archivos`);

    // Contar por tipo
    const estabilidad = archivos.filter(a => a.tipo === 'ESTABILIDAD').length;
    const gps = archivos.filter(a => a.tipo === 'GPS').length;
    const rotativo = archivos.filter(a => a.tipo === 'ROTATIVO').length;

    console.log(`    ESTABILIDAD: ${estabilidad}, GPS: ${gps}, ROTATIVO: ${rotativo}`);

    // Fechas
    const fechas = [...new Set(archivos.map(a => a.fecha))].sort();
    console.log(`    Fechas: ${fechas.join(', ')}\n`);
});

// Tabla completa de archivos
console.log('\n' + '='.repeat(100));
console.log('📋 TABLA COMPLETA DE ARCHIVOS\n');

console.log('VEHÍCULO'.padEnd(12) + 'FECHA'.padEnd(12) + 'TIPO'.padEnd(15) + 'TAMAÑO'.padEnd(12) + 'LÍNEAS'.padEnd(10) + 'SESIONES'.padEnd(10) + 'CALIDAD'.padEnd(10) + 'PROBLEMAS');
console.log('-'.repeat(100));

todosLosArchivos
    .sort((a, b) => {
        if (a.vehiculo !== b.vehiculo) return a.vehiculo.localeCompare(b.vehiculo);
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return a.tipo.localeCompare(b.tipo);
    })
    .forEach(a => {
        const tamaño = `${a.tamañoKB.toFixed(1)} KB`;
        const calidad = `${a.calidadDatos}%`;
        const problemas = a.problemas.length > 0 ? a.problemas.join(', ') : '-';

        console.log(
            a.vehiculo.padEnd(12) +
            a.fecha.padEnd(12) +
            a.tipo.padEnd(15) +
            tamaño.padEnd(12) +
            a.totalLineas.toString().padEnd(10) +
            a.sesionesDetectadas.toString().padEnd(10) +
            calidad.padEnd(10) +
            problemas
        );
    });

// Estadísticas agregadas
console.log('\n' + '='.repeat(100));
console.log('📊 ESTADÍSTICAS AGREGADAS\n');

const totalEstabilidad = todosLosArchivos.filter(a => a.tipo === 'ESTABILIDAD');
const totalGPS = todosLosArchivos.filter(a => a.tipo === 'GPS');
const totalRotativo = todosLosArchivos.filter(a => a.tipo === 'ROTATIVO');

console.log(`ARCHIVOS POR TIPO:`);
console.log(`  ESTABILIDAD: ${totalEstabilidad.length} archivos`);
console.log(`  GPS: ${totalGPS.length} archivos`);
console.log(`  ROTATIVO: ${totalRotativo.length} archivos\n`);

console.log(`TAMAÑO PROMEDIO:`);
console.log(`  ESTABILIDAD: ${(totalEstabilidad.reduce((sum, a) => sum + a.tamañoKB, 0) / totalEstabilidad.length).toFixed(2)} KB`);
console.log(`  GPS: ${(totalGPS.reduce((sum, a) => sum + a.tamañoKB, 0) / totalGPS.length).toFixed(2)} KB`);
console.log(`  ROTATIVO: ${(totalRotativo.reduce((sum, a) => sum + a.tamañoKB, 0) / totalRotativo.length).toFixed(2)} KB\n`);

console.log(`SESIONES PROMEDIO POR ARCHIVO:`);
console.log(`  ESTABILIDAD: ${(totalEstabilidad.reduce((sum, a) => sum + a.sesionesDetectadas, 0) / totalEstabilidad.length).toFixed(1)}`);
console.log(`  GPS: ${(totalGPS.reduce((sum, a) => sum + a.sesionesDetectadas, 0) / totalGPS.length).toFixed(1)}`);
console.log(`  ROTATIVO: ${(totalRotativo.reduce((sum, a) => sum + a.sesionesDetectadas, 0) / totalRotativo.length).toFixed(1)}\n`);

console.log(`CALIDAD PROMEDIO GPS:`);
const calidadPromedioGPS = totalGPS.reduce((sum, a) => sum + a.calidadDatos, 0) / totalGPS.length;
console.log(`  ${calidadPromedioGPS.toFixed(2)}%\n`);

// Archivos con problemas
const archivosConProblemas = todosLosArchivos.filter(a => a.problemas.length > 0);
if (archivosConProblemas.length > 0) {
    console.log('⚠️  ARCHIVOS CON PROBLEMAS:\n');
    archivosConProblemas.forEach(a => {
        console.log(`  ${a.vehiculo} ${a.fecha} ${a.tipo}:`);
        a.problemas.forEach(p => console.log(`    - ${p}`));
    });
}

// Guardar resumen completo
const resumenCompleto = {
    fechaAnalisis: new Date().toISOString(),
    totalArchivos: todosLosArchivos.length,
    vehiculos: Array.from(porVehiculo.keys()),
    resumenPorVehiculo: Array.from(porVehiculo.entries()).map(([vehiculo, archivos]) => ({
        vehiculo,
        totalArchivos: archivos.length,
        fechas: [...new Set(archivos.map(a => a.fecha))].sort(),
        tipos: {
            estabilidad: archivos.filter(a => a.tipo === 'ESTABILIDAD').length,
            gps: archivos.filter(a => a.tipo === 'GPS').length,
            rotativo: archivos.filter(a => a.tipo === 'ROTATIVO').length
        }
    })),
    archivos: todosLosArchivos
};

fs.writeFileSync(
    'RESUMEN_COMPLETO_TODOS_ARCHIVOS.json',
    JSON.stringify(resumenCompleto, null, 2)
);

console.log('\n' + '='.repeat(100));
console.log('✅ ANÁLISIS COMPLETO GUARDADO EN: RESUMEN_COMPLETO_TODOS_ARCHIVOS.json\n');

