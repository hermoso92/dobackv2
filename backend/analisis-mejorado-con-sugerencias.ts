/**
 * ANÁLISIS MEJORADO CON TODAS LAS SUGERENCIAS
 * 
 * MEJORAS IMPLEMENTADAS:
 * 1. Detectar coordenadas (0,0) inválidas
 * 2. Streaming con createReadStream para archivos grandes
 * 3. Paralelización con Promise.allSettled()
 * 4. Exportación a CSV adicional
 * 5. Validación de sesiones=0 (archivos incompletos)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BASE_PATH = path.join(__dirname, 'data', 'datosDoback', 'CMadrid');

interface ResumenArchivoMejorado {
    vehiculo: string;
    fecha: string;
    tipo: string;
    nombreArchivo: string;
    tamañoKB: number;
    totalLineas: number;
    sesionesDetectadas: number;
    calidadDatos: number;
    // ✅ MEJORA 1: Coordenadas inválidas
    coordenadasInvalidas: number; // GPS con lat=0, lon=0
    sinDatosGPS: number;          // "sin datos GPS"
    timestampsCorruptos: number;
    problemas: string[];
    incompleto: boolean; // ✅ MEJORA 5: Archivo sin sesiones
}

/**
 * ✅ MEJORA 2: Streaming para archivos grandes
 * Lee archivo línea por línea sin cargarlo completo en memoria
 */
async function analizarArchivoStream(rutaArchivo: string): Promise<ResumenArchivoMejorado | null> {
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

        // Contadores
        let totalLineas = 0;
        let sesiones = 0;
        let lineasDatos = 0;
        let lineasProblema = 0;
        let coordenadasInvalidas = 0; // ✅ NUEVO
        let sinDatosGPS = 0;            // ✅ NUEVO
        let timestampsCorruptos = 0;    // ✅ NUEVO
        const problemasSet = new Set<string>();

        // ✅ MEJORA 2: Usar streaming en lugar de readFileSync
        const fileStream = fs.createReadStream(rutaArchivo, { encoding: 'utf-8' });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const linea of rl) {
            const lineaTrim = linea.trim();
            if (!lineaTrim) continue;

            totalLineas++;

            // Detectar cabeceras de sesión
            if (lineaTrim.startsWith(`${tipo};`)) {
                sesiones++;
            }

            // Análisis específico por tipo
            if (tipo === 'GPS') {
                // Detectar "sin datos GPS"
                if (lineaTrim.includes('sin datos GPS')) {
                    sinDatosGPS++;
                    lineasProblema++;
                }
                // ✅ MEJORA 1: Detectar coordenadas (0,0)
                else if (lineaTrim.includes(',')) {
                    const partes = lineaTrim.split(',');
                    if (partes.length >= 5) {
                        const lat = parseFloat(partes[3]);
                        const lon = parseFloat(partes[4]);

                        if (lat === 0 && lon === 0) {
                            coordenadasInvalidas++;
                            lineasProblema++;
                            problemasSet.add('Coordenadas (0,0) inválidas');
                        } else if (!isNaN(lat) && !isNaN(lon)) {
                            lineasDatos++;
                        }
                    }
                }

                // Detectar timestamps corruptos
                if (lineaTrim.match(/\d{2}:\d{2}:\./)) {
                    timestampsCorruptos++;
                    problemasSet.add('Timestamp corrupto detectado');
                }
                if (lineaTrim.match(/2[4-9]:\d{2}:\d{2}/)) {
                    timestampsCorruptos++;
                    problemasSet.add('Hora inválida (>24h)');
                }
            }
            else if (tipo === 'ESTABILIDAD') {
                if (lineaTrim.includes(';') &&
                    !lineaTrim.startsWith('ESTABILIDAD;') &&
                    !lineaTrim.startsWith('ax;') &&
                    !lineaTrim.match(/^\d{2}:\d{2}:\d{2}$/)) {
                    lineasDatos++;
                }
            }
            else if (tipo === 'ROTATIVO') {
                if (lineaTrim.includes(';') &&
                    !lineaTrim.startsWith('ROTATIVO;') &&
                    !lineaTrim.startsWith('Fecha-Hora;')) {
                    lineasDatos++;
                }
            }
        }

        // Calcular calidad
        const totalLineasSignificativas = lineasDatos + lineasProblema;
        const calidadDatos = totalLineasSignificativas > 0
            ? (lineasDatos / totalLineasSignificativas) * 100
            : 100;

        // ✅ MEJORA 5: Detectar archivos incompletos
        const incompleto = sesiones === 0 || (tipo !== 'ROTATIVO' && lineasDatos === 0);

        if (incompleto) {
            problemasSet.add('Archivo incompleto (sesiones=0 o datos=0)');
        }

        return {
            vehiculo,
            fecha,
            tipo,
            nombreArchivo,
            tamañoKB: stats.size / 1024,
            totalLineas,
            sesionesDetectadas: sesiones || 0,
            calidadDatos: Math.round(calidadDatos),
            coordenadasInvalidas,
            sinDatosGPS,
            timestampsCorruptos,
            problemas: Array.from(problemasSet),
            incompleto
        };

    } catch (error: any) {
        console.error(`Error analizando ${path.basename(rutaArchivo)}: ${error.message}`);
        return null;
    }
}

/**
 * ✅ MEJORA 3: Paralelización con Promise.allSettled()
 */
async function explorarDirectorioParalelo(dir: string): Promise<ResumenArchivoMejorado[]> {
    const archivos: string[] = [];

    // Recolectar rutas de todos los archivos .txt
    function recolectarArchivos(currentDir: string) {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
            const rutaCompleta = path.join(currentDir, item);
            const stats = fs.statSync(rutaCompleta);

            if (stats.isDirectory()) {
                recolectarArchivos(rutaCompleta);
            } else if (item.endsWith('.txt')) {
                archivos.push(rutaCompleta);
            }
        }
    }

    recolectarArchivos(dir);

    console.log(`📁 Encontrados ${archivos.length} archivos .txt`);
    console.log(`⚡ Procesando en paralelo...\n`);

    // ✅ MEJORA 3: Procesar todos en paralelo
    const inicio = Date.now();

    const resultados = await Promise.allSettled(
        archivos.map(ruta => analizarArchivoStream(ruta))
    );

    const duracion = Date.now() - inicio;

    console.log(`✅ Procesamiento paralelo completado en ${(duracion / 1000).toFixed(2)}s\n`);

    // Extraer resultados exitosos
    const archivosValidos: ResumenArchivoMejorado[] = [];

    resultados.forEach((resultado, index) => {
        if (resultado.status === 'fulfilled' && resultado.value) {
            archivosValidos.push(resultado.value);
        } else if (resultado.status === 'rejected') {
            console.error(`Error en archivo ${index}: ${resultado.reason}`);
        }
    });

    return archivosValidos;
}

/**
 * ✅ MEJORA 4: Exportar a CSV
 */
function exportarACSV(archivos: ResumenArchivoMejorado[], nombreArchivo: string) {
    const headers = [
        'Vehiculo',
        'Fecha',
        'Tipo',
        'NombreArchivo',
        'TamañoKB',
        'TotalLineas',
        'Sesiones',
        'CalidadDatos%',
        'CoordInvalidas',
        'SinDatosGPS',
        'TimestampsCorruptos',
        'Incompleto',
        'Problemas'
    ].join(',');

    const lineas = archivos.map(a => [
        a.vehiculo,
        a.fecha,
        a.tipo,
        a.nombreArchivo,
        a.tamañoKB.toFixed(2),
        a.totalLineas,
        a.sesionesDetectadas,
        a.calidadDatos,
        a.coordenadasInvalidas,
        a.sinDatosGPS,
        a.timestampsCorruptos,
        a.incompleto ? 'SI' : 'NO',
        `"${a.problemas.join('; ')}"`
    ].join(','));

    const csv = [headers, ...lineas].join('\n');

    fs.writeFileSync(nombreArchivo, csv, 'utf-8');
    console.log(`✅ CSV exportado: ${nombreArchivo}\n`);
}

// ==========================================
// EJECUTAR ANÁLISIS MEJORADO
// ==========================================
async function main() {
    console.log('🔬 ANÁLISIS MEJORADO DE TODOS LOS ARCHIVOS DOBACK');
    console.log('📊 Con TODAS las mejoras sugeridas:\n');
    console.log('  1️⃣ Detección de coordenadas (0,0)');
    console.log('  2️⃣ Streaming para archivos grandes');
    console.log('  3️⃣ Paralelización con Promise.allSettled()');
    console.log('  4️⃣ Exportación a CSV');
    console.log('  5️⃣ Detección de archivos incompletos\n');
    console.log('='.repeat(100) + '\n');

    // Análisis paralelo
    const todosLosArchivos = await explorarDirectorioParalelo(BASE_PATH);

    console.log(`✅ Total de archivos analizados: ${todosLosArchivos.length}\n`);

    // Estadísticas mejoradas
    console.log('='.repeat(100));
    console.log('📊 ESTADÍSTICAS MEJORADAS\n');

    const totalGPS = todosLosArchivos.filter(a => a.tipo === 'GPS');

    console.log(`GPS - ANÁLISIS DETALLADO:`);
    console.log(`  Total archivos: ${totalGPS.length}`);
    console.log(`  Calidad promedio: ${(totalGPS.reduce((sum, a) => sum + a.calidadDatos, 0) / totalGPS.length).toFixed(2)}%`);
    console.log(`  Total líneas "sin datos GPS": ${totalGPS.reduce((sum, a) => sum + a.sinDatosGPS, 0).toLocaleString()}`);
    console.log(`  Total coordenadas (0,0): ${totalGPS.reduce((sum, a) => sum + a.coordenadasInvalidas, 0).toLocaleString()}`);
    console.log(`  Total timestamps corruptos: ${totalGPS.reduce((sum, a) => sum + a.timestampsCorruptos, 0).toLocaleString()}\n`);

    // ✅ MEJORA 5: Archivos incompletos
    const archivosIncompletos = todosLosArchivos.filter(a => a.incompleto);

    if (archivosIncompletos.length > 0) {
        console.log(`⚠️  ARCHIVOS INCOMPLETOS (sesiones=0): ${archivosIncompletos.length}\n`);
        archivosIncompletos.forEach(a => {
            console.log(`  ${a.vehiculo} ${a.fecha} ${a.tipo}: ${a.sesionesDetectadas} sesiones, ${a.totalLineas} líneas`);
        });
        console.log();
    }

    // Archivos críticos
    const archivosGPSCriticos = totalGPS.filter(a => a.calidadDatos < 30);

    if (archivosGPSCriticos.length > 0) {
        console.log(`❌ ARCHIVOS GPS CRÍTICOS (calidad <30%): ${archivosGPSCriticos.length}\n`);
        archivosGPSCriticos.forEach(a => {
            console.log(`  ${a.vehiculo} ${a.fecha}:`);
            console.log(`    Calidad: ${a.calidadDatos}%`);
            console.log(`    Sin señal: ${a.sinDatosGPS}, Coords (0,0): ${a.coordenadasInvalidas}`);
        });
        console.log();
    }

    // ✅ MEJORA 4: Exportar a CSV
    console.log('='.repeat(100));
    console.log('📄 EXPORTANDO RESULTADOS\n');

    exportarACSV(todosLosArchivos, 'RESUMEN_ARCHIVOS_COMPLETO.csv');

    // También guardar JSON mejorado
    const resumenCompleto = {
        fechaAnalisis: new Date().toISOString(),
        totalArchivos: todosLosArchivos.length,
        duracionAnalisis: '(ver logs)',
        mejorasAplicadas: [
            'Detección de coordenadas (0,0)',
            'Streaming para archivos grandes',
            'Paralelización',
            'Exportación CSV',
            'Validación de archivos incompletos'
        ],
        estadisticasGPS: {
            totalArchivos: totalGPS.length,
            calidadPromedio: (totalGPS.reduce((sum, a) => sum + a.calidadDatos, 0) / totalGPS.length),
            sinDatosGPSTotal: totalGPS.reduce((sum, a) => sum + a.sinDatosGPS, 0),
            coordenadasInvalidasTotal: totalGPS.reduce((sum, a) => sum + a.coordenadasInvalidas, 0),
            timestampsCorruptosTotal: totalGPS.reduce((sum, a) => sum + a.timestampsCorruptos, 0),
            archivosCriticos: archivosGPSCriticos.length
        },
        archivosIncompletos: archivosIncompletos.length,
        archivos: todosLosArchivos
    };

    fs.writeFileSync(
        'RESUMEN_COMPLETO_MEJORADO.json',
        JSON.stringify(resumenCompleto, null, 2)
    );

    console.log('✅ JSON exportado: RESUMEN_COMPLETO_MEJORADO.json\n');

    // Tabla resumen en consola
    console.log('='.repeat(100));
    console.log('📋 RESUMEN POR VEHÍCULO\n');

    const porVehiculo = new Map<string, ResumenArchivoMejorado[]>();
    todosLosArchivos.forEach(a => {
        if (!porVehiculo.has(a.vehiculo)) {
            porVehiculo.set(a.vehiculo, []);
        }
        porVehiculo.get(a.vehiculo)!.push(a);
    });

    porVehiculo.forEach((archivos, vehiculo) => {
        const gps = archivos.filter(a => a.tipo === 'GPS');
        const calidadPromedioGPS = gps.length > 0
            ? gps.reduce((sum, a) => sum + a.calidadDatos, 0) / gps.length
            : 0;

        const coordInvalidas = gps.reduce((sum, a) => sum + a.coordenadasInvalidas, 0);
        const sinDatos = gps.reduce((sum, a) => sum + a.sinDatosGPS, 0);

        console.log(`${vehiculo}:`);
        console.log(`  Archivos: ${archivos.length}`);
        console.log(`  Calidad GPS: ${calidadPromedioGPS.toFixed(1)}%`);
        console.log(`  Coordenadas (0,0): ${coordInvalidas}`);
        console.log(`  Sin datos GPS: ${sinDatos}`);
        console.log(`  Archivos incompletos: ${archivos.filter(a => a.incompleto).length}\n`);
    });

    console.log('='.repeat(100));
    console.log('✅ ANÁLISIS MEJORADO COMPLETADO\n');
}

main();

