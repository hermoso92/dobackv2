/**
 * ANÁLISIS EXHAUSTIVO LÍNEA POR LÍNEA DE ARCHIVOS DOBACK
 * 
 * Este script analiza cada archivo en detalle para entender:
 * - Estructura exacta
 * - Patrones
 * - Anomalías
 * - Casos especiales
 */

import fs from 'fs';
import path from 'path';

// Configuración
const VEHICULO = 'doback024';
const FECHA = '20251008';
const BASE_PATH = path.join(__dirname, 'data', 'datosDoback', 'CMadrid', VEHICULO);

interface AnalisisLinea {
    numero: number;
    contenido: string;
    tipo: string; // 'CABECERA_SESION', 'CABECERA_COLUMNAS', 'MARCADOR_TEMPORAL', 'DATOS', 'VACIA', 'DESCONOCIDA'
    campos?: number;
    problemas?: string[];
    notas?: string[];
}

function analizarArchivo(tipo: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO', maxLineas: number = 1000) {
    const nombreArchivo = `${tipo}_DOBACK024_${FECHA}.txt`;
    const rutaArchivo = path.join(BASE_PATH, tipo === 'ESTABILIDAD' ? 'estabilidad' : tipo, nombreArchivo);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 ANALIZANDO: ${nombreArchivo}`);
    console.log(`${'='.repeat(80)}\n`);

    if (!fs.existsSync(rutaArchivo)) {
        console.error(`❌ Archivo no encontrado: ${rutaArchivo}`);
        return;
    }

    const stats = fs.statSync(rutaArchivo);
    console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);

    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const lineas = contenido.split('\n');

    console.log(`📊 Total líneas: ${lineas.length.toLocaleString()}`);
    console.log(`📊 Analizando primeras ${maxLineas} líneas...\n`);

    const analisis: AnalisisLinea[] = [];
    const estadisticas = {
        cabecerasSesion: 0,
        cabecerasColumnas: 0,
        marcadoresTemporales: 0,
        lineasDatos: 0,
        lineasVacias: 0,
        lineasDesconocidas: 0,
        problemasDetectados: 0,
        camposPorLinea: new Map<number, number>()
    };

    let sesionActual = 0;
    let ultimoMarcador: string | null = null;

    for (let i = 0; i < Math.min(maxLineas, lineas.length); i++) {
        const linea = lineas[i];
        const lineaTrim = linea.trim();

        const analisisLinea: AnalisisLinea = {
            numero: i + 1,
            contenido: linea.substring(0, 100) + (linea.length > 100 ? '...' : ''),
            tipo: 'DESCONOCIDA',
            problemas: [],
            notas: []
        };

        // Detectar tipo de línea
        if (!lineaTrim) {
            analisisLinea.tipo = 'VACIA';
            estadisticas.lineasVacias++;
        }
        // Cabecera de sesión
        else if (lineaTrim.startsWith(`${tipo};`)) {
            analisisLinea.tipo = 'CABECERA_SESION';
            estadisticas.cabecerasSesion++;
            sesionActual++;

            // Extraer información de la cabecera
            const match = lineaTrim.match(/(\d{2}\/\d{2}\/\d{4})[\s-](\d{2}:\d{2}:\d{2});(DOBACK\d+);(?:Sesión:)?(\d+)?/);
            if (match) {
                const [_, fecha, hora, vehiculo, numeroSesion] = match;
                analisisLinea.notas?.push(`Fecha: ${fecha}`);
                analisisLinea.notas?.push(`Hora: ${hora}`);
                analisisLinea.notas?.push(`Vehículo: ${vehiculo}`);
                analisisLinea.notas?.push(`Sesión: ${numeroSesion || 'N/A'}`);
            } else {
                analisisLinea.problemas?.push('Formato de cabecera no estándar');
            }
        }
        // Cabecera de columnas
        else if (lineaTrim.startsWith('ax;') || lineaTrim.startsWith('HoraRaspberry') || lineaTrim.startsWith('Fecha-Hora;')) {
            analisisLinea.tipo = 'CABECERA_COLUMNAS';
            estadisticas.cabecerasColumnas++;

            const columnas = lineaTrim.split(';').map(c => c.trim()).filter(c => c);
            analisisLinea.campos = columnas.length;
            analisisLinea.notas?.push(`Columnas: ${columnas.slice(0, 5).join(', ')}...`);
        }
        // Marcador temporal (solo HH:MM:SS)
        else if (lineaTrim.match(/^\d{2}:\d{2}:\d{2}$/)) {
            analisisLinea.tipo = 'MARCADOR_TEMPORAL';
            estadisticas.marcadoresTemporales++;
            ultimoMarcador = lineaTrim;
            analisisLinea.notas?.push(`Marcador: ${lineaTrim}`);
        }
        // Línea de datos
        else if (lineaTrim.includes(';')) {
            analisisLinea.tipo = 'DATOS';
            estadisticas.lineasDatos++;

            const partes = lineaTrim.split(';');
            analisisLinea.campos = partes.length;

            // Registrar distribución de campos
            const count = estadisticas.camposPorLinea.get(partes.length) || 0;
            estadisticas.camposPorLinea.set(partes.length, count + 1);

            // Verificar si tiene datos válidos
            if (tipo === 'GPS' && lineaTrim.includes('sin datos GPS')) {
                analisisLinea.problemas?.push('GPS sin señal');
            }

            // Muestra de valores (primeros 3 campos)
            const muestra = partes.slice(0, 3).map(p => p.trim()).join('; ');
            analisisLinea.notas?.push(`Muestra: ${muestra}...`);

            // Verificar marcador temporal previo
            if (tipo === 'ESTABILIDAD' && !ultimoMarcador && i > 5) {
                analisisLinea.problemas?.push('Datos sin marcador temporal previo');
            }
        }
        else {
            analisisLinea.tipo = 'DESCONOCIDA';
            estadisticas.lineasDesconocidas++;
            analisisLinea.problemas?.push('Tipo de línea no reconocido');
        }

        if (analisisLinea.problemas && analisisLinea.problemas.length > 0) {
            estadisticas.problemasDetectados++;
        }

        analisis.push(analisisLinea);
    }

    // REPORTE DETALLADO
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ESTADÍSTICAS GENERALES`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`Total líneas analizadas: ${analisis.length.toLocaleString()}`);
    console.log(`\nTIPOS DE LÍNEAS:`);
    console.log(`  Cabeceras de sesión: ${estadisticas.cabecerasSesion}`);
    console.log(`  Cabeceras de columnas: ${estadisticas.cabecerasColumnas}`);
    console.log(`  Marcadores temporales: ${estadisticas.marcadoresTemporales}`);
    console.log(`  Líneas de datos: ${estadisticas.lineasDatos.toLocaleString()}`);
    console.log(`  Líneas vacías: ${estadisticas.lineasVacias}`);
    console.log(`  Líneas desconocidas: ${estadisticas.lineasDesconocidas}`);
    console.log(`  Problemas detectados: ${estadisticas.problemasDetectados}\n`);

    console.log(`DISTRIBUCIÓN DE CAMPOS:`);
    Array.from(estadisticas.camposPorLinea.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([campos, cantidad]) => {
            const porcentaje = (cantidad / estadisticas.lineasDatos * 100).toFixed(2);
            console.log(`  ${campos} campos: ${cantidad.toLocaleString()} líneas (${porcentaje}%)`);
        });

    // PRIMERAS 50 LÍNEAS DETALLADAS
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 PRIMERAS 50 LÍNEAS DETALLADAS`);
    console.log(`${'='.repeat(80)}\n`);

    for (let i = 0; i < Math.min(50, analisis.length); i++) {
        const a = analisis[i];

        let emoji = '';
        switch (a.tipo) {
            case 'CABECERA_SESION': emoji = '📌'; break;
            case 'CABECERA_COLUMNAS': emoji = '📋'; break;
            case 'MARCADOR_TEMPORAL': emoji = '⏰'; break;
            case 'DATOS': emoji = '📊'; break;
            case 'VACIA': emoji = '⬜'; break;
            default: emoji = '❓';
        }

        console.log(`${emoji} Línea ${a.numero.toString().padStart(4, ' ')}: [${a.tipo.padEnd(20, ' ')}] ${a.campos ? `(${a.campos} campos)` : ''}`);
        console.log(`   ${a.contenido}`);

        if (a.notas && a.notas.length > 0) {
            a.notas.forEach(nota => console.log(`   💡 ${nota}`));
        }

        if (a.problemas && a.problemas.length > 0) {
            a.problemas.forEach(problema => console.log(`   ⚠️  ${problema}`));
        }

        console.log();
    }

    // PROBLEMAS DETECTADOS
    const lineasConProblemas = analisis.filter(a => a.problemas && a.problemas.length > 0);
    const problemasAgrupados = new Map<string, number>();

    if (lineasConProblemas.length > 0) {
        console.log(`${'='.repeat(80)}`);
        console.log(`⚠️  RESUMEN DE PROBLEMAS (${lineasConProblemas.length} líneas)`);
        console.log(`${'='.repeat(80)}\n`);

        lineasConProblemas.forEach(l => {
            l.problemas?.forEach(p => {
                const count = problemasAgrupados.get(p) || 0;
                problemasAgrupados.set(p, count + 1);
            });
        });

        Array.from(problemasAgrupados.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([problema, cantidad]) => {
                console.log(`  ${problema}: ${cantidad} ocurrencias`);
            });
    }

    // Guardar análisis completo en archivo
    const nombreSalida = `ANALISIS_DETALLADO_${tipo}_${FECHA}.json`;
    fs.writeFileSync(
        nombreSalida,
        JSON.stringify({
            archivo: nombreArchivo,
            totalLineas: lineas.length,
            lineasAnalizadas: analisis.length,
            estadisticas,
            primerasLineas: analisis.slice(0, 100),
            problemasAgrupados: Array.from(problemasAgrupados.entries())
        }, null, 2)
    );

    console.log(`\n✅ Análisis guardado en: ${nombreSalida}\n`);
}

// ANALIZAR LOS 3 ARCHIVOS UNO POR UNO
console.log('\n🔬 ANÁLISIS EXHAUSTIVO DE ARCHIVOS DOBACK');
console.log('Vehículo: DOBACK024');
console.log('Fecha: 2025-10-08\n');

console.log('Este análisis examinará cada archivo línea por línea para entender perfectamente su estructura.\n');

// 1. ROTATIVO (el más simple, empezar por aquí)
analizarArchivo('ROTATIVO', 1000);

// 2. GPS 
analizarArchivo('GPS', 1000);

// 3. ESTABILIDAD (el más complejo)
analizarArchivo('ESTABILIDAD', 1000);

console.log('\n' + '='.repeat(80));
console.log('✅ ANÁLISIS EXHAUSTIVO COMPLETADO');
console.log('='.repeat(80));
console.log('\nArchivos JSON generados con análisis completo.');
console.log('Revisar para entender cada patrón y anomalía.\n');

