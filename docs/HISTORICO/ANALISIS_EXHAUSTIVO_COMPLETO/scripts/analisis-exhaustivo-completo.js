const fs = require('fs');
const path = require('path');

// ============================================================================
// ANÁLISIS EXHAUSTIVO DE ARCHIVOS DOBACK
// ============================================================================

const BASE_DIR = path.join(__dirname, 'backend', 'data', 'datosDoback', 'CMadrid');
const VEHICLES = ['doback024', 'doback027', 'doback028'];
const FILE_TYPES = ['estabilidad', 'GPS', 'ROTATIVO'];

// Estructura para almacenar todos los resultados
const analisisCompleto = {
    metadata: {
        fecha_analisis: new Date().toISOString(),
        total_archivos: 0,
        total_sesiones: 0,
        vehiculos_analizados: VEHICLES.length
    },
    vehiculos: {},
    hallazgos_globales: [],
    problemas_criticos: []
};

// ============================================================================
// UTILIDADES
// ============================================================================

function parseTimestamp(str) {
    // Formato: "30/09/2025 09:33:44" o "30/09/2025-09:33:37"
    if (!str) return null;
    
    const cleaned = str.replace(/-/g, ' ');
    const match = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    return null;
}

function getDuracionHoras(inicio, fin) {
    if (!inicio || !fin) return 0;
    return (fin - inicio) / (1000 * 60 * 60);
}

function getDuracionMinutos(inicio, fin) {
    if (!inicio || !fin) return 0;
    return (fin - inicio) / (1000 * 60);
}

// ============================================================================
// ANÁLISIS DE ARCHIVO INDIVIDUAL
// ============================================================================

function analizarArchivo(filePath, tipo) {
    const resultado = {
        archivo: path.basename(filePath),
        tipo: tipo,
        existe: false,
        lineas_totales: 0,
        lineas_validas: 0,
        lineas_invalidas: 0,
        lineas_vacias: 0,
        timestamp_inicio: null,
        timestamp_fin: null,
        duracion_horas: 0,
        sesion_numero: null,
        vehiculo: null,
        fecha: null,
        errores: [],
        estadisticas_campos: {},
        muestras_invalidas: []
    };

    try {
        if (!fs.existsSync(filePath)) {
            resultado.errores.push('Archivo no existe');
            return resultado;
        }

        resultado.existe = true;
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        resultado.lineas_totales = lines.length;

        // Analizar cabecera
        if (lines.length > 0) {
            const header = lines[0];
            const headerMatch = header.match(/^(ESTABILIDAD|GPS|ROTATIVO);(.+?);(DOBACK\d+);Sesión:(\d+)/);
            
            if (headerMatch) {
                resultado.timestamp_inicio = parseTimestamp(headerMatch[2]);
                resultado.vehiculo = headerMatch[3];
                resultado.sesion_numero = parseInt(headerMatch[4]);
                resultado.fecha = headerMatch[2].split(/[\s-]/)[0];
            } else {
                resultado.errores.push('Cabecera inválida: ' + header);
            }
        }

        // Analizar contenido según tipo
        let primeraLinea = null;
        let ultimaLinea = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === '') {
                resultado.lineas_vacias++;
                continue;
            }

            // Saltar cabeceras (primeras 2 líneas)
            if (i < 2) continue;

            // Analizar según tipo
            if (tipo === 'estabilidad') {
                if (analizarLineaEstabilidad(line, resultado)) {
                    resultado.lineas_validas++;
                    if (!primeraLinea) primeraLinea = i;
                    ultimaLinea = i;
                } else {
                    resultado.lineas_invalidas++;
                    if (resultado.muestras_invalidas.length < 10) {
                        resultado.muestras_invalidas.push({ linea: i + 1, contenido: line.substring(0, 100) });
                    }
                }
            } else if (tipo === 'GPS') {
                if (analizarLineaGPS(line, resultado)) {
                    resultado.lineas_validas++;
                    if (!primeraLinea) primeraLinea = i;
                    ultimaLinea = i;
                } else {
                    resultado.lineas_invalidas++;
                    if (resultado.muestras_invalidas.length < 10) {
                        resultado.muestras_invalidas.push({ linea: i + 1, contenido: line.substring(0, 100) });
                    }
                }
            } else if (tipo === 'ROTATIVO') {
                if (analizarLineaRotativo(line, resultado)) {
                    resultado.lineas_validas++;
                    if (!primeraLinea) primeraLinea = i;
                    ultimaLinea = i;
                } else {
                    resultado.lineas_invalidas++;
                    if (resultado.muestras_invalidas.length < 10) {
                        resultado.muestras_invalidas.push({ linea: i + 1, contenido: line.substring(0, 100) });
                    }
                }
            }
        }

        // Calcular duración
        if (resultado.timestamp_inicio && resultado.timestamp_fin) {
            resultado.duracion_horas = getDuracionHoras(resultado.timestamp_inicio, resultado.timestamp_fin);
        }

        // Validaciones adicionales
        if (resultado.lineas_validas === 0 && resultado.lineas_totales > 10) {
            resultado.errores.push('Archivo sin datos válidos');
        }

        const porcentajeInvalidas = (resultado.lineas_invalidas / resultado.lineas_totales) * 100;
        if (porcentajeInvalidas > 10) {
            resultado.errores.push(`Alto porcentaje de líneas inválidas: ${porcentajeInvalidas.toFixed(2)}%`);
        }

    } catch (error) {
        resultado.errores.push('Error al leer archivo: ' + error.message);
    }

    return resultado;
}

function analizarLineaEstabilidad(line, resultado) {
    // Puede ser una línea de timestamp (solo hora) o una línea de datos
    if (/^\d{2}:\d{2}:\d{2}$/.test(line)) {
        // Es una línea de timestamp
        return true;
    }

    // Es una línea de datos - debe tener múltiples valores separados por ;
    const parts = line.split(';');
    if (parts.length < 15) {
        return false; // Muy pocos campos
    }

    // Intentar extraer timestamp del final del archivo
    // Las líneas tienen formato con ax, ay, az, etc.
    const firstValue = parseFloat(parts[0]);
    if (isNaN(firstValue)) {
        return false;
    }

    return true;
}

function analizarLineaGPS(line, resultado) {
    // Formato: Hora Raspberry-09:33:37,30/09/2025,Hora GPS-07:33:38,sin datos GPS
    // O: Hora Raspberry-09:33:37,30/09/2025,Hora GPS-07:33:38,40.123456,-3.123456,650,1.2,1,8,45.5
    
    if (!line.includes(',')) {
        return false;
    }

    const parts = line.split(',');
    if (parts.length < 4) {
        return false;
    }

    // Extraer timestamp
    const timestampMatch = parts[0].match(/(\d{2}):(\d{2}):(\d{2})/);
    const fechaMatch = parts[1].match(/(\d{2})\/(\d{2})\/(\d{4})/);
    
    if (timestampMatch && fechaMatch) {
        const [, day, month, year] = fechaMatch;
        const [, hour, minute, second] = timestampMatch;
        const timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        
        if (!resultado.timestamp_fin || timestamp > resultado.timestamp_fin) {
            resultado.timestamp_fin = timestamp;
        }
    }

    // Contar cuántas tienen "sin datos GPS"
    if (!resultado.estadisticas_campos.sin_gps) {
        resultado.estadisticas_campos.sin_gps = 0;
        resultado.estadisticas_campos.con_gps = 0;
    }

    if (line.includes('sin datos GPS')) {
        resultado.estadisticas_campos.sin_gps++;
    } else {
        resultado.estadisticas_campos.con_gps++;
    }

    return true;
}

function analizarLineaRotativo(line, resultado) {
    // Formato: 30/09/2025-09:33:37;0
    const parts = line.split(';');
    
    if (parts.length !== 2) {
        return false;
    }

    const timestamp = parseTimestamp(parts[0]);
    const estado = parts[1].trim();
    
    if (!timestamp || (estado !== '0' && estado !== '1' && estado !== '2' && estado !== '5')) {
        return false;
    }

    // Actualizar timestamp final
    if (!resultado.timestamp_fin || timestamp > resultado.timestamp_fin) {
        resultado.timestamp_fin = timestamp;
    }

    // Contar estados
    if (!resultado.estadisticas_campos.estados) {
        resultado.estadisticas_campos.estados = { '0': 0, '1': 0, '2': 0, '5': 0 };
    }
    resultado.estadisticas_campos.estados[estado]++;

    return true;
}

// ============================================================================
// ANÁLISIS DE SESIONES
// ============================================================================

function analizarSesionesVehiculo(vehiculo, archivosData) {
    const sesiones = {};

    // Agrupar archivos por fecha y sesión
    archivosData.forEach(archivoData => {
        if (!archivoData.existe || !archivoData.fecha || archivoData.sesion_numero === null) {
            return;
        }

        const key = `${archivoData.fecha}_sesion${archivoData.sesion_numero}`;
        
        if (!sesiones[key]) {
            sesiones[key] = {
                vehiculo: vehiculo,
                fecha: archivoData.fecha,
                sesion_numero: archivoData.sesion_numero,
                archivos: { estabilidad: null, GPS: null, ROTATIVO: null },
                completa: false,
                timestamp_inicio: null,
                timestamp_fin: null,
                duracion_horas: 0,
                desfases_temporales: [],
                anomalias: []
            };
        }

        sesiones[key].archivos[archivoData.tipo] = archivoData;
    });

    // Analizar cada sesión
    Object.values(sesiones).forEach(sesion => {
        const { estabilidad, GPS, ROTATIVO } = sesion.archivos;

        // Determinar si está completa
        sesion.completa = estabilidad && GPS && ROTATIVO;
        
        if (!sesion.completa) {
            const faltantes = [];
            if (!estabilidad) faltantes.push('estabilidad');
            if (!GPS) faltantes.push('GPS');
            if (!ROTATIVO) faltantes.push('ROTATIVO');
            sesion.anomalias.push(`Sesión incompleta: faltan archivos de ${faltantes.join(', ')}`);
        }

        // Calcular timestamps globales
        const timestamps = [];
        if (estabilidad?.timestamp_inicio) timestamps.push(estabilidad.timestamp_inicio);
        if (GPS?.timestamp_inicio) timestamps.push(GPS.timestamp_inicio);
        if (ROTATIVO?.timestamp_inicio) timestamps.push(ROTATIVO.timestamp_inicio);

        if (timestamps.length > 0) {
            sesion.timestamp_inicio = new Date(Math.min(...timestamps.map(t => t.getTime())));
            
            const timestampsFin = [];
            if (estabilidad?.timestamp_fin) timestampsFin.push(estabilidad.timestamp_fin);
            if (GPS?.timestamp_fin) timestampsFin.push(GPS.timestamp_fin);
            if (ROTATIVO?.timestamp_fin) timestampsFin.push(ROTATIVO.timestamp_fin);
            
            if (timestampsFin.length > 0) {
                sesion.timestamp_fin = new Date(Math.max(...timestampsFin.map(t => t.getTime())));
                sesion.duracion_horas = getDuracionHoras(sesion.timestamp_inicio, sesion.timestamp_fin);
            }
        }

        // Detectar desfases temporales entre archivos
        if (sesion.completa) {
            const tiemposInicio = [
                { tipo: 'estabilidad', time: estabilidad.timestamp_inicio },
                { tipo: 'GPS', time: GPS.timestamp_inicio },
                { tipo: 'ROTATIVO', time: ROTATIVO.timestamp_inicio }
            ].filter(t => t.time);

            for (let i = 0; i < tiemposInicio.length; i++) {
                for (let j = i + 1; j < tiemposInicio.length; j++) {
                    const diff = Math.abs(tiemposInicio[i].time - tiemposInicio[j].time) / 1000; // segundos
                    if (diff > 60) { // Más de 1 minuto de diferencia
                        sesion.desfases_temporales.push({
                            tipos: `${tiemposInicio[i].tipo} vs ${tiemposInicio[j].tipo}`,
                            diferencia_segundos: diff
                        });
                    }
                }
            }
        }

        // Detectar duraciones anómalas
        if (sesion.duracion_horas > 0) {
            if (sesion.duracion_horas < 0.016) { // Menos de 1 minuto
                sesion.anomalias.push(`Duración muy corta: ${(sesion.duracion_horas * 60).toFixed(2)} minutos`);
            } else if (sesion.duracion_horas > 12) {
                sesion.anomalias.push(`Duración muy larga: ${sesion.duracion_horas.toFixed(2)} horas`);
            }
        }

        // Detectar problemas en archivos individuales
        [estabilidad, GPS, ROTATIVO].forEach(archivo => {
            if (archivo && archivo.errores.length > 0) {
                sesion.anomalias.push(`${archivo.tipo}: ${archivo.errores.join(', ')}`);
            }
        });
    });

    return Object.values(sesiones);
}

// ============================================================================
// ANÁLISIS TEMPORAL
// ============================================================================

function analizarPatronesTemporal(sesiones) {
    const analisis = {
        gaps: [],
        solapamientos: [],
        patrones_horarios: {
            inicio_jornada: [],
            fin_jornada: []
        },
        dias_con_datos: new Set(),
        dias_sin_datos: [],
        sesiones_por_dia: {}
    };

    // Ordenar sesiones por timestamp
    const sesionesOrdenadas = sesiones
        .filter(s => s.timestamp_inicio)
        .sort((a, b) => a.timestamp_inicio - b.timestamp_inicio);

    // Detectar gaps y solapamientos
    for (let i = 0; i < sesionesOrdenadas.length - 1; i++) {
        const actual = sesionesOrdenadas[i];
        const siguiente = sesionesOrdenadas[i + 1];

        if (actual.timestamp_fin && siguiente.timestamp_inicio) {
            const gapMinutos = getDuracionMinutos(actual.timestamp_fin, siguiente.timestamp_inicio);
            
            if (gapMinutos < 0) {
                // Solapamiento
                analisis.solapamientos.push({
                    sesion1: `${actual.fecha} S${actual.sesion_numero}`,
                    sesion2: `${siguiente.fecha} S${siguiente.sesion_numero}`,
                    solapamiento_minutos: Math.abs(gapMinutos)
                });
            } else if (gapMinutos > 5) {
                // Gap significativo (más de 5 minutos)
                analisis.gaps.push({
                    sesion_antes: `${actual.fecha} S${actual.sesion_numero}`,
                    sesion_despues: `${siguiente.fecha} S${siguiente.sesion_numero}`,
                    gap_minutos: gapMinutos,
                    gap_horas: gapMinutos / 60
                });
            }
        }
    }

    // Analizar patrones horarios y días
    sesionesOrdenadas.forEach(sesion => {
        if (sesion.timestamp_inicio) {
            const hora = sesion.timestamp_inicio.getHours();
            const minuto = sesion.timestamp_inicio.getMinutes();
            analisis.patrones_horarios.inicio_jornada.push({ hora, minuto, fecha: sesion.fecha });
            
            const dia = sesion.fecha;
            analisis.dias_con_datos.add(dia);
            
            if (!analisis.sesiones_por_dia[dia]) {
                analisis.sesiones_por_dia[dia] = 0;
            }
            analisis.sesiones_por_dia[dia]++;
        }

        if (sesion.timestamp_fin) {
            const hora = sesion.timestamp_fin.getHours();
            const minuto = sesion.timestamp_fin.getMinutes();
            analisis.patrones_horarios.fin_jornada.push({ hora, minuto, fecha: sesion.fecha });
        }
    });

    return analisis;
}

// ============================================================================
// ANÁLISIS DE PATRONES DEL DISPOSITIVO
// ============================================================================

function analizarPatronesDispositivo(sesiones, archivosData) {
    const patrones = {
        frecuencia_muestreo: {},
        perdidas_gps: [],
        comportamiento_rotativo: {
            total_cambios_estado: 0,
            secuencias_encendido: [],
            tiempo_total_encendido: 0,
            tiempo_total_apagado: 0
        },
        reinicios_detectados: [],
        correlaciones: []
    };

    // Analizar frecuencia de muestreo
    FILE_TYPES.forEach(tipo => {
        const archivos = archivosData.filter(a => a.tipo === tipo && a.existe);
        const muestras = archivos.map(a => a.lineas_validas);
        const duraciones = archivos.map(a => a.duracion_horas).filter(d => d > 0);
        
        if (muestras.length > 0 && duraciones.length > 0) {
            const totalMuestras = muestras.reduce((a, b) => a + b, 0);
            const totalHoras = duraciones.reduce((a, b) => a + b, 0);
            patrones.frecuencia_muestreo[tipo] = {
                muestras_promedio_por_hora: totalHoras > 0 ? totalMuestras / totalHoras : 0,
                total_muestras: totalMuestras,
                total_horas: totalHoras
            };
        }
    });

    // Analizar pérdidas GPS
    const archivosGPS = archivosData.filter(a => a.tipo === 'GPS' && a.existe);
    archivosGPS.forEach(archivo => {
        if (archivo.estadisticas_campos.sin_gps && archivo.estadisticas_campos.con_gps) {
            const total = archivo.estadisticas_campos.sin_gps + archivo.estadisticas_campos.con_gps;
            const porcentajeSinGPS = (archivo.estadisticas_campos.sin_gps / total) * 100;
            
            if (porcentajeSinGPS > 10) {
                patrones.perdidas_gps.push({
                    archivo: archivo.archivo,
                    fecha: archivo.fecha,
                    sesion: archivo.sesion_numero,
                    porcentaje_sin_gps: porcentajeSinGPS,
                    lineas_sin_gps: archivo.estadisticas_campos.sin_gps,
                    lineas_con_gps: archivo.estadisticas_campos.con_gps
                });
            }
        }
    });

    // Detectar reinicios (sesiones con gap muy largo o cambio abrupto)
    const sesionesOrdenadas = sesiones
        .filter(s => s.timestamp_inicio)
        .sort((a, b) => a.timestamp_inicio - b.timestamp_inicio);

    for (let i = 0; i < sesionesOrdenadas.length - 1; i++) {
        const actual = sesionesOrdenadas[i];
        const siguiente = sesionesOrdenadas[i + 1];

        if (actual.timestamp_fin && siguiente.timestamp_inicio) {
            const gapHoras = getDuracionHoras(actual.timestamp_fin, siguiente.timestamp_inicio);
            
            if (gapHoras > 2 && gapHoras < 24) {
                patrones.reinicios_detectados.push({
                    fecha: siguiente.fecha,
                    sesion_anterior: actual.sesion_numero,
                    sesion_siguiente: siguiente.sesion_numero,
                    gap_horas: gapHoras,
                    tipo: 'gap_largo'
                });
            }
        }
    }

    return patrones;
}

// ============================================================================
// PROCESAMIENTO PRINCIPAL
// ============================================================================

async function procesarVehiculo(vehiculo) {
    console.log(`\n=== Analizando vehículo: ${vehiculo.toUpperCase()} ===`);
    
    const vehiculoData = {
        nombre: vehiculo,
        estadisticas: {
            total_archivos: 0,
            archivos_validos: 0,
            archivos_con_errores: 0,
            total_sesiones: 0,
            sesiones_completas: 0,
            lineas_totales: 0,
            lineas_validas: 0,
            duracion_total_horas: 0
        },
        archivos: [],
        sesiones: [],
        anomalias: [],
        gaps_temporales: [],
        patrones: {}
    };

    const vehiculoPath = path.join(BASE_DIR, vehiculo);

    // Analizar todos los archivos
    for (const tipo of FILE_TYPES) {
        const tipoDir = path.join(vehiculoPath, tipo === 'estabilidad' ? 'estabilidad' : tipo);
        
        if (!fs.existsSync(tipoDir)) {
            vehiculoData.anomalias.push(`Directorio ${tipo} no existe`);
            continue;
        }

        const files = fs.readdirSync(tipoDir).filter(f => f.endsWith('.txt'));
        console.log(`  - Analizando ${files.length} archivos de ${tipo}...`);

        for (const file of files) {
            const filePath = path.join(tipoDir, file);
            const analisis = analizarArchivo(filePath, tipo);
            
            vehiculoData.archivos.push(analisis);
            vehiculoData.estadisticas.total_archivos++;
            
            if (analisis.existe && analisis.errores.length === 0) {
                vehiculoData.estadisticas.archivos_validos++;
            } else {
                vehiculoData.estadisticas.archivos_con_errores++;
            }

            vehiculoData.estadisticas.lineas_totales += analisis.lineas_totales;
            vehiculoData.estadisticas.lineas_validas += analisis.lineas_validas;
            vehiculoData.estadisticas.duracion_total_horas += analisis.duracion_horas;
        }
    }

    // Analizar sesiones
    console.log(`  - Analizando sesiones...`);
    vehiculoData.sesiones = analizarSesionesVehiculo(vehiculo, vehiculoData.archivos);
    vehiculoData.estadisticas.total_sesiones = vehiculoData.sesiones.length;
    vehiculoData.estadisticas.sesiones_completas = vehiculoData.sesiones.filter(s => s.completa).length;

    // Análisis temporal
    console.log(`  - Analizando patrones temporales...`);
    const analisisTemporal = analizarPatronesTemporal(vehiculoData.sesiones);
    vehiculoData.gaps_temporales = analisisTemporal.gaps;
    vehiculoData.solapamientos = analisisTemporal.solapamientos;
    vehiculoData.patrones.temporal = analisisTemporal;

    // Análisis de patrones del dispositivo
    console.log(`  - Analizando patrones del dispositivo...`);
    vehiculoData.patrones.dispositivo = analizarPatronesDispositivo(vehiculoData.sesiones, vehiculoData.archivos);

    // Recopilar anomalías de sesiones
    vehiculoData.sesiones.forEach(sesion => {
        if (sesion.anomalias.length > 0) {
            vehiculoData.anomalias.push({
                sesion: `${sesion.fecha} - Sesión ${sesion.sesion_numero}`,
                anomalias: sesion.anomalias
            });
        }
    });

    return vehiculoData;
}

async function generarReporteMarkdown(analisis) {
    console.log('\n=== Generando reporte Markdown ===');
    
    let md = `# ANÁLISIS EXHAUSTIVO DE ARCHIVOS DOBACK\n\n`;
    md += `**Fecha de análisis:** ${new Date(analisis.metadata.fecha_analisis).toLocaleString()}\n\n`;
    md += `---\n\n`;

    // Resumen ejecutivo
    md += `## 📊 RESUMEN EJECUTIVO\n\n`;
    md += `- **Vehículos analizados:** ${analisis.metadata.vehiculos_analizados}\n`;
    md += `- **Total de archivos procesados:** ${analisis.metadata.total_archivos}\n`;
    md += `- **Total de sesiones identificadas:** ${analisis.metadata.total_sesiones}\n`;
    
    let totalProblemasCriticos = analisis.problemas_criticos.length;
    let totalHallazgos = analisis.hallazgos_globales.length;
    
    md += `- **Problemas críticos detectados:** ${totalProblemasCriticos}\n`;
    md += `- **Hallazgos relevantes:** ${totalHallazgos}\n\n`;

    // Hallazgos globales
    if (analisis.hallazgos_globales.length > 0) {
        md += `## 🔍 HALLAZGOS GLOBALES\n\n`;
        analisis.hallazgos_globales.forEach((hallazgo, i) => {
            md += `${i + 1}. ${hallazgo}\n`;
        });
        md += `\n`;
    }

    // Problemas críticos
    if (analisis.problemas_criticos.length > 0) {
        md += `## 🚨 PROBLEMAS CRÍTICOS\n\n`;
        analisis.problemas_criticos.forEach((problema, i) => {
            md += `${i + 1}. **${problema.tipo}**: ${problema.descripcion}\n`;
            if (problema.afectados) {
                md += `   - Afectados: ${problema.afectados.join(', ')}\n`;
            }
        });
        md += `\n`;
    }

    // Análisis por vehículo
    md += `## 🚗 ANÁLISIS POR VEHÍCULO\n\n`;
    
    for (const [vehiculo, data] of Object.entries(analisis.vehiculos)) {
        md += `### ${vehiculo.toUpperCase()}\n\n`;
        
        // Estadísticas generales
        md += `#### Estadísticas Generales\n\n`;
        md += `| Métrica | Valor |\n`;
        md += `|---------|-------|\n`;
        md += `| Total de archivos | ${data.estadisticas.total_archivos} |\n`;
        md += `| Archivos válidos | ${data.estadisticas.archivos_validos} |\n`;
        md += `| Archivos con errores | ${data.estadisticas.archivos_con_errores} |\n`;
        md += `| Total de sesiones | ${data.estadisticas.total_sesiones} |\n`;
        md += `| Sesiones completas | ${data.estadisticas.sesiones_completas} |\n`;
        md += `| % Sesiones completas | ${((data.estadisticas.sesiones_completas / data.estadisticas.total_sesiones) * 100).toFixed(2)}% |\n`;
        md += `| Líneas totales procesadas | ${data.estadisticas.lineas_totales.toLocaleString()} |\n`;
        md += `| Líneas válidas | ${data.estadisticas.lineas_validas.toLocaleString()} |\n`;
        md += `| % Líneas válidas | ${((data.estadisticas.lineas_validas / data.estadisticas.lineas_totales) * 100).toFixed(2)}% |\n`;
        md += `| Duración total registrada | ${data.estadisticas.duracion_total_horas.toFixed(2)} horas |\n\n`;

        // Sesiones con anomalías
        if (data.anomalias.length > 0) {
            md += `#### ⚠️ Sesiones con Anomalías (${data.anomalias.length})\n\n`;
            data.anomalias.slice(0, 20).forEach(anom => {
                md += `**${anom.sesion}**\n`;
                anom.anomalias.forEach(a => {
                    md += `- ${a}\n`;
                });
                md += `\n`;
            });
            if (data.anomalias.length > 20) {
                md += `_... y ${data.anomalias.length - 20} sesiones más con anomalías_\n\n`;
            }
        }

        // Gaps temporales
        if (data.gaps_temporales.length > 0) {
            md += `#### ⏱️ Gaps Temporales Detectados (${data.gaps_temporales.length})\n\n`;
            md += `| Sesión Anterior | Sesión Posterior | Gap (minutos) | Gap (horas) |\n`;
            md += `|----------------|------------------|---------------|-------------|\n`;
            data.gaps_temporales.slice(0, 15).forEach(gap => {
                md += `| ${gap.sesion_antes} | ${gap.sesion_despues} | ${gap.gap_minutos.toFixed(2)} | ${gap.gap_horas.toFixed(2)} |\n`;
            });
            if (data.gaps_temporales.length > 15) {
                md += `\n_... y ${data.gaps_temporales.length - 15} gaps más_\n`;
            }
            md += `\n`;
        }

        // Solapamientos
        if (data.solapamientos && data.solapamientos.length > 0) {
            md += `#### 🔄 Solapamientos Detectados (${data.solapamientos.length})\n\n`;
            md += `| Sesión 1 | Sesión 2 | Solapamiento (minutos) |\n`;
            md += `|----------|----------|------------------------|\n`;
            data.solapamientos.forEach(sol => {
                md += `| ${sol.sesion1} | ${sol.sesion2} | ${sol.solapamiento_minutos.toFixed(2)} |\n`;
            });
            md += `\n`;
        }

        // Patrones del dispositivo
        if (data.patrones.dispositivo) {
            md += `#### 📡 Patrones del Dispositivo\n\n`;
            
            // Frecuencia de muestreo
            if (data.patrones.dispositivo.frecuencia_muestreo) {
                md += `**Frecuencia de Muestreo:**\n\n`;
                md += `| Tipo | Muestras/Hora | Total Muestras | Total Horas |\n`;
                md += `|------|---------------|----------------|-------------|\n`;
                for (const [tipo, freq] of Object.entries(data.patrones.dispositivo.frecuencia_muestreo)) {
                    md += `| ${tipo} | ${freq.muestras_promedio_por_hora.toFixed(2)} | ${freq.total_muestras.toLocaleString()} | ${freq.total_horas.toFixed(2)} |\n`;
                }
                md += `\n`;
            }

            // Pérdidas GPS
            if (data.patrones.dispositivo.perdidas_gps.length > 0) {
                md += `**Pérdidas de Señal GPS (${data.patrones.dispositivo.perdidas_gps.length} sesiones afectadas):**\n\n`;
                md += `| Archivo | Fecha | Sesión | % Sin GPS | Líneas Sin GPS | Líneas Con GPS |\n`;
                md += `|---------|-------|--------|-----------|----------------|----------------|\n`;
                data.patrones.dispositivo.perdidas_gps.slice(0, 10).forEach(perdida => {
                    md += `| ${perdida.archivo} | ${perdida.fecha} | ${perdida.sesion} | ${perdida.porcentaje_sin_gps.toFixed(2)}% | ${perdida.lineas_sin_gps} | ${perdida.lineas_con_gps} |\n`;
                });
                if (data.patrones.dispositivo.perdidas_gps.length > 10) {
                    md += `\n_... y ${data.patrones.dispositivo.perdidas_gps.length - 10} sesiones más con pérdidas GPS_\n`;
                }
                md += `\n`;
            }

            // Reinicios detectados
            if (data.patrones.dispositivo.reinicios_detectados.length > 0) {
                md += `**Reinicios del Dispositivo Detectados (${data.patrones.dispositivo.reinicios_detectados.length}):**\n\n`;
                md += `| Fecha | Sesión Anterior | Sesión Siguiente | Gap (horas) | Tipo |\n`;
                md += `|-------|-----------------|------------------|-------------|------|\n`;
                data.patrones.dispositivo.reinicios_detectados.forEach(reinicio => {
                    md += `| ${reinicio.fecha} | ${reinicio.sesion_anterior} | ${reinicio.sesion_siguiente} | ${reinicio.gap_horas.toFixed(2)} | ${reinicio.tipo} |\n`;
                });
                md += `\n`;
            }
        }

        // Patrones temporales
        if (data.patrones.temporal) {
            md += `#### 📅 Patrones Temporales\n\n`;
            
            const diasConDatos = Array.from(data.patrones.temporal.dias_con_datos).sort();
            md += `**Días con datos:** ${diasConDatos.length} días\n`;
            md += `- Primer día: ${diasConDatos[0]}\n`;
            md += `- Último día: ${diasConDatos[diasConDatos.length - 1]}\n\n`;

            md += `**Sesiones por día:**\n`;
            md += `| Fecha | Número de Sesiones |\n`;
            md += `|-------|--------------------|\n`;
            for (const [dia, count] of Object.entries(data.patrones.temporal.sesiones_por_dia).sort()) {
                md += `| ${dia} | ${count} |\n`;
            }
            md += `\n`;
        }

        md += `---\n\n`;
    }

    // Conclusiones y recomendaciones
    md += `## 📋 CONCLUSIONES Y RECOMENDACIONES\n\n`;
    md += `### Conclusiones:\n\n`;
    
    // Calcular conclusiones basadas en el análisis
    const totalSesiones = analisis.metadata.total_sesiones;
    const totalSesionesCompletas = Object.values(analisis.vehiculos)
        .reduce((sum, v) => sum + v.estadisticas.sesiones_completas, 0);
    const porcentajeCompletas = (totalSesionesCompletas / totalSesiones) * 100;
    
    md += `1. **Integridad de Datos**: ${porcentajeCompletas.toFixed(2)}% de las sesiones contienen los 3 tipos de archivos (ESTABILIDAD, GPS, ROTATIVO).\n`;
    
    const totalAnomalias = Object.values(analisis.vehiculos)
        .reduce((sum, v) => sum + v.anomalias.length, 0);
    md += `2. **Anomalías Detectadas**: Se identificaron ${totalAnomalias} sesiones con anomalías en total.\n`;
    
    const totalGaps = Object.values(analisis.vehiculos)
        .reduce((sum, v) => sum + v.gaps_temporales.length, 0);
    md += `3. **Continuidad Temporal**: Se detectaron ${totalGaps} gaps temporales significativos entre sesiones.\n`;
    
    md += `\n### Recomendaciones:\n\n`;
    
    if (porcentajeCompletas < 90) {
        md += `1. **Mejorar captura de datos**: Menos del 90% de las sesiones están completas. Revisar el proceso de grabación.\n`;
    }
    
    if (totalGaps > totalSesiones * 0.3) {
        md += `2. **Revisar continuidad**: Hay muchos gaps temporales. Verificar si el dispositivo se apaga/reinicia con frecuencia.\n`;
    }
    
    md += `3. **Verificar sincronización**: Revisar desfases temporales entre archivos de la misma sesión.\n`;
    md += `4. **Monitorizar pérdidas GPS**: Algunas sesiones muestran alto porcentaje de datos sin GPS.\n`;
    
    md += `\n---\n\n`;
    md += `_Reporte generado automáticamente por el sistema de análisis DobackSoft_\n`;

    // Guardar archivo
    const outputPath = path.join(__dirname, 'ANALISIS_EXHAUSTIVO_ARCHIVOS.md');
    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`✅ Reporte Markdown guardado en: ${outputPath}`);
}

async function generarReporteJSON(analisis) {
    console.log('\n=== Generando reporte JSON ===');
    
    const outputPath = path.join(__dirname, 'analisis-exhaustivo-datos.json');
    fs.writeFileSync(outputPath, JSON.stringify(analisis, null, 2), 'utf-8');
    console.log(`✅ Reporte JSON guardado en: ${outputPath}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       ANÁLISIS EXHAUSTIVO DE ARCHIVOS DOBACK                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    try {
        // Procesar cada vehículo
        for (const vehiculo of VEHICLES) {
            const vehiculoData = await procesarVehiculo(vehiculo);
            analisisCompleto.vehiculos[vehiculo] = vehiculoData;
            
            // Actualizar metadata global
            analisisCompleto.metadata.total_archivos += vehiculoData.estadisticas.total_archivos;
            analisisCompleto.metadata.total_sesiones += vehiculoData.estadisticas.total_sesiones;
        }

        // Generar hallazgos globales
        console.log('\n=== Generando hallazgos globales ===');
        
        const totalSesiones = analisisCompleto.metadata.total_sesiones;
        const totalArchivos = analisisCompleto.metadata.total_archivos;
        
        analisisCompleto.hallazgos_globales.push(
            `Se procesaron ${totalArchivos} archivos correspondientes a ${totalSesiones} sesiones de ${VEHICLES.length} vehículos.`
        );

        // Identificar problemas críticos
        for (const [vehiculo, data] of Object.entries(analisisCompleto.vehiculos)) {
            const porcentajeIncompletas = ((data.estadisticas.total_sesiones - data.estadisticas.sesiones_completas) / data.estadisticas.total_sesiones) * 100;
            
            if (porcentajeIncompletas > 20) {
                analisisCompleto.problemas_criticos.push({
                    tipo: 'Sesiones incompletas',
                    descripcion: `${vehiculo.toUpperCase()} tiene ${porcentajeIncompletas.toFixed(2)}% de sesiones incompletas`,
                    afectados: [vehiculo]
                });
            }

            if (data.estadisticas.archivos_con_errores > data.estadisticas.archivos_validos * 0.1) {
                analisisCompleto.problemas_criticos.push({
                    tipo: 'Alta tasa de errores',
                    descripcion: `${vehiculo.toUpperCase()} tiene ${data.estadisticas.archivos_con_errores} archivos con errores`,
                    afectados: [vehiculo]
                });
            }
        }

        // Generar reportes
        await generarReporteMarkdown(analisisCompleto);
        await generarReporteJSON(analisisCompleto);

        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║              ANÁLISIS COMPLETADO CON ÉXITO                   ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');

        // Resumen final en consola
        console.log('📊 RESUMEN:');
        console.log(`   - Archivos procesados: ${analisisCompleto.metadata.total_archivos}`);
        console.log(`   - Sesiones analizadas: ${analisisCompleto.metadata.total_sesiones}`);
        console.log(`   - Problemas críticos: ${analisisCompleto.problemas_criticos.length}`);
        console.log(`   - Hallazgos relevantes: ${analisisCompleto.hallazgos_globales.length}`);
        console.log('\n✅ Reportes generados:');
        console.log('   - ANALISIS_EXHAUSTIVO_ARCHIVOS.md');
        console.log('   - analisis-exhaustivo-datos.json');

    } catch (error) {
        console.error('\n❌ Error durante el análisis:', error);
        throw error;
    }
}

// Ejecutar
main().catch(console.error);

