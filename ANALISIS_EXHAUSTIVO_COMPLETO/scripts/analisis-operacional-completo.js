const fs = require('fs');
const path = require('path');

// ============================================================================
// ANÁLISIS OPERACIONAL COMPLETO DOBACKSOFT
// Enfocado en: Emergencias, KPIs, Puntos Negros, Velocidades
// ============================================================================

const BASE_DIR = path.join(__dirname, 'backend', 'data', 'datosDoback', 'CMadrid');
const VEHICLES = ['doback024', 'doback027', 'doback028'];

// Estructura de resultados
const analisisOperacional = {
    metadata: {
        fecha_analisis: new Date().toISOString(),
        version: '2.0 - Análisis Operacional'
    },
    vehiculos: {},
    analisis_global: {
        emergencias_detectadas: [],
        puntos_negros: [],
        velocidades_excesivas: [],
        patrones_operacionales: {},
        estadisticas_kpis: {}
    }
};

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    // Umbrales para detección de eventos de estabilidad
    UMBRAL_FRENAZO_BRUSCO: -300,  // mg
    UMBRAL_ACELERACION_BRUSCA: 300,  // mg
    UMBRAL_GIRO_BRUSCO: 100,  // °/s
    UMBRAL_VUELCO: 30,  // grados roll/pitch
    
    // Configuración GPS
    RADIO_PARQUE_METROS: 100,  // Radio para considerar que está en el parque
    VELOCIDAD_MAXIMA_CIUDAD: 50,  // km/h (se comparará con TomTom)
    VELOCIDAD_MAXIMA_CARRETERA: 90,  // km/h
    
    // Configuración temporal
    GAP_MAX_MISMA_EMERGENCIA: 30,  // minutos (para correlacionar ida/vuelta)
    DURACION_MIN_EMERGENCIA: 2,  // minutos (mínimo para considerar emergencia)
    
    // Estados rotativo
    ROTATIVO_APAGADO: '0',
    ROTATIVO_CLAVE_2: '1',  // Emergencia
    ROTATIVO_CLAVE_5: '2',  // Otra clave (por determinar)
    ROTATIVO_ESPECIAL: '5'
};

// ============================================================================
// PARSEO DE ARCHIVOS
// ============================================================================

function parseTimestamp(str) {
    if (!str) return null;
    const cleaned = str.replace(/-/g, ' ');
    const match = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
        const [, day, month, year, hour, minute, second] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    return null;
}

function parseGPSLine(line) {
    // Formato: 09:40:10,01/10/2025,07:40:10,40.5343190,-3.6179127,715.9,6.03,1,05,0.43
    if (line.includes('sin datos GPS') || line.includes('HoraRaspberry')) {
        return null;
    }
    
    const parts = line.split(',');
    if (parts.length < 10) return null;
    
    try {
        const horaRaspberry = parts[0].trim();
        const fecha = parts[1].trim();
        const horaGPS = parts[2].trim();
        const lat = parseFloat(parts[3]);
        const lon = parseFloat(parts[4]);
        const altitud = parseFloat(parts[5]);
        const hdop = parseFloat(parts[6]);
        const fix = parseInt(parts[7]);
        const numSats = parseInt(parts[8]);
        const velocidad = parts[9] ? parseFloat(parts[9]) : 0;
        
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return null;
        }
        
        const timestamp = parseTimestamp(`${fecha} ${horaRaspberry}`);
        
        return {
            timestamp,
            lat,
            lon,
            altitud,
            hdop,
            fix,
            numSats,
            velocidad,
            valida: fix === 1 && numSats >= 4
        };
    } catch (e) {
        return null;
    }
}

function parseRotativoLine(line) {
    // Formato: 30/09/2025-09:33:37;0
    const parts = line.split(';');
    if (parts.length !== 2) return null;
    
    const timestamp = parseTimestamp(parts[0]);
    const estado = parts[1].trim();
    
    if (!timestamp || !['0', '1', '2', '5'].includes(estado)) {
        return null;
    }
    
    return { timestamp, estado };
}

function parseEstabilidadLine(line, currentTimestamp) {
    // Detectar líneas de timestamp
    if (/^\d{2}:\d{2}:\d{2}$/.test(line)) {
        return { esTimestamp: true, timestamp: line };
    }
    
    // Línea de datos de acelerómetro
    const parts = line.split(';').map(p => p.trim());
    if (parts.length < 15) return null;
    
    try {
        const ax = parseFloat(parts[0]);
        const ay = parseFloat(parts[1]);
        const az = parseFloat(parts[2]);
        const gx = parseFloat(parts[3]);
        const gy = parseFloat(parts[4]);
        const gz = parseFloat(parts[5]);
        const roll = parseFloat(parts[6]);
        const pitch = parseFloat(parts[7]);
        const yaw = parseFloat(parts[8]);
        
        if (isNaN(ax)) return null;
        
        return {
            timestamp: currentTimestamp,
            ax, ay, az,
            gx, gy, gz,
            roll, pitch, yaw,
            accMagnitud: Math.sqrt(ax*ax + ay*ay + az*az)
        };
    } catch (e) {
        return null;
    }
}

// ============================================================================
// CARGA DE DATOS DE SESIÓN
// ============================================================================

function cargarDatosSesion(vehiculo, fecha, tipo) {
    const vehiculoPath = path.join(BASE_DIR, vehiculo);
    const tipoDir = tipo === 'estabilidad' ? 'estabilidad' : tipo;
    const dirPath = path.join(vehiculoPath, tipoDir);
    
    if (!fs.existsSync(dirPath)) return [];
    
    const files = fs.readdirSync(dirPath)
        .filter(f => f.includes(fecha.replace(/\//g, '')) && f.endsWith('.txt'));
    
    if (files.length === 0) return [];
    
    const filePath = path.join(dirPath, files[0]);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const datos = [];
    let currentTimestamp = null;
    
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (tipo === 'GPS') {
            const gpsData = parseGPSLine(line);
            if (gpsData) datos.push(gpsData);
        } else if (tipo === 'ROTATIVO') {
            const rotData = parseRotativoLine(line);
            if (rotData) datos.push(rotData);
        } else if (tipo === 'estabilidad') {
            const estData = parseEstabilidadLine(line, currentTimestamp);
            if (estData) {
                if (estData.esTimestamp) {
                    currentTimestamp = estData.timestamp;
                } else {
                    datos.push(estData);
                }
            }
        }
    }
    
    return datos;
}

// ============================================================================
// ANÁLISIS DE EMERGENCIAS
// ============================================================================

function calcularDistancia(lat1, lon1, lat2, lon2) {
    // Fórmula de Haversine para calcular distancia en metros
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function detectarParqueBomberos(datosGPS) {
    // Detectar ubicación más frecuente (probablemente el parque)
    if (datosGPS.length === 0) return null;
    
    // Buscar primera y última posición válida
    const primeraPos = datosGPS.find(d => d.valida);
    const ultimaPos = [...datosGPS].reverse().find(d => d.valida);
    
    if (!primeraPos || !ultimaPos) return null;
    
    // Si inicio y fin están cerca, probablemente es el parque
    const distancia = calcularDistancia(
        primeraPos.lat, primeraPos.lon,
        ultimaPos.lat, ultimaPos.lon
    );
    
    if (distancia < CONFIG.RADIO_PARQUE_METROS * 2) {
        return {
            lat: (primeraPos.lat + ultimaPos.lat) / 2,
            lon: (primeraPos.lon + ultimaPos.lon) / 2,
            confianza: distancia < CONFIG.RADIO_PARQUE_METROS ? 'alta' : 'media'
        };
    }
    
    return primeraPos;
}

function analizarEmergencia(sesion, datosGPS, datosRotativo) {
    const analisis = {
        tipo: 'desconocido',
        origen: null,
        destino: null,
        distanciaRecorrida: 0,
        tiempoRotativoEncendido: 0,
        velocidadMaxima: 0,
        velocidadPromedio: 0,
        esEmergencia: false,
        salidaDesdeParque: false,
        regresoAParque: false
    };
    
    // Detectar parque de bomberos
    const parque = detectarParqueBomberos(datosGPS);
    
    // Analizar datos GPS
    const gpsValidos = datosGPS.filter(d => d.valida);
    if (gpsValidos.length < 2) {
        return analisis;
    }
    
    analisis.origen = { lat: gpsValidos[0].lat, lon: gpsValidos[0].lon };
    analisis.destino = { lat: gpsValidos[gpsValidos.length-1].lat, lon: gpsValidos[gpsValidos.length-1].lon };
    
    // Calcular distancia recorrida
    for (let i = 1; i < gpsValidos.length; i++) {
        const dist = calcularDistancia(
            gpsValidos[i-1].lat, gpsValidos[i-1].lon,
            gpsValidos[i].lat, gpsValidos[i].lon
        );
        analisis.distanciaRecorrida += dist;
    }
    analisis.distanciaRecorrida /= 1000; // Convertir a km
    
    // Velocidades
    const velocidades = gpsValidos.map(d => d.velocidad).filter(v => v > 0);
    if (velocidades.length > 0) {
        analisis.velocidadMaxima = Math.max(...velocidades);
        analisis.velocidadPromedio = velocidades.reduce((a,b) => a+b, 0) / velocidades.length;
    }
    
    // Analizar rotativo
    const rotativoEncendido = datosRotativo.filter(r => r.estado !== '0');
    analisis.tiempoRotativoEncendido = rotativoEncendido.length * 15 / 60; // Convertir a minutos
    analisis.esEmergencia = rotativoEncendido.length > 0;
    
    // Detectar si sale/regresa del parque
    if (parque) {
        const distOrigen = calcularDistancia(
            analisis.origen.lat, analisis.origen.lon,
            parque.lat, parque.lon
        );
        const distDestino = calcularDistancia(
            analisis.destino.lat, analisis.destino.lon,
            parque.lat, parque.lon
        );
        
        analisis.salidaDesdeParque = distOrigen < CONFIG.RADIO_PARQUE_METROS;
        analisis.regresoAParque = distDestino < CONFIG.RADIO_PARQUE_METROS;
        
        // Determinar tipo de sesión
        if (analisis.salidaDesdeParque && analisis.esEmergencia) {
            analisis.tipo = 'SALIDA_EMERGENCIA';
        } else if (analisis.regresoAParque && !analisis.esEmergencia) {
            analisis.tipo = 'VUELTA_EMERGENCIA';
        } else if (analisis.salidaDesdeParque && analisis.regresoAParque) {
            analisis.tipo = 'RECORRIDO_COMPLETO';
        } else {
            analisis.tipo = 'RECORRIDO_PARCIAL';
        }
    }
    
    return analisis;
}

// ============================================================================
// DETECCIÓN DE PUNTOS NEGROS
// ============================================================================

function detectarEventosEstabilidad(datosEstabilidad) {
    const eventos = [];
    
    datosEstabilidad.forEach((dato, idx) => {
        const eventosDetectados = [];
        
        // Frenazo brusco
        if (dato.ay < CONFIG.UMBRAL_FRENAZO_BRUSCO) {
            eventosDetectados.push({
                tipo: 'FRENAZO_BRUSCO',
                severidad: Math.abs(dato.ay) > 500 ? 'alta' : 'media',
                valor: dato.ay
            });
        }
        
        // Aceleración brusca
        if (dato.ay > CONFIG.UMBRAL_ACELERACION_BRUSCA) {
            eventosDetectados.push({
                tipo: 'ACELERACION_BRUSCA',
                severidad: dato.ay > 500 ? 'alta' : 'media',
                valor: dato.ay
            });
        }
        
        // Giro brusco
        if (Math.abs(dato.gz) > CONFIG.UMBRAL_GIRO_BRUSCO) {
            eventosDetectados.push({
                tipo: 'GIRO_BRUSCO',
                severidad: Math.abs(dato.gz) > 200 ? 'alta' : 'media',
                valor: dato.gz
            });
        }
        
        // Posible vuelco
        if (Math.abs(dato.roll) > CONFIG.UMBRAL_VUELCO || Math.abs(dato.pitch) > CONFIG.UMBRAL_VUELCO) {
            eventosDetectados.push({
                tipo: 'ALERTA_VUELCO',
                severidad: 'critica',
                roll: dato.roll,
                pitch: dato.pitch
            });
        }
        
        if (eventosDetectados.length > 0) {
            eventos.push({
                timestamp: dato.timestamp,
                eventos: eventosDetectados
            });
        }
    });
    
    return eventos;
}

function agruparPuntosNegros(eventosConUbicacion, radioMetros = 50) {
    // Agrupar eventos cercanos geográficamente
    const grupos = [];
    
    eventosConUbicacion.forEach(evento => {
        let grupoEncontrado = false;
        
        for (const grupo of grupos) {
            const dist = calcularDistancia(
                evento.lat, evento.lon,
                grupo.lat, grupo.lon
            );
            
            if (dist < radioMetros) {
                grupo.eventos.push(evento);
                grupo.count++;
                // Recalcular centro
                grupo.lat = grupo.eventos.reduce((sum, e) => sum + e.lat, 0) / grupo.count;
                grupo.lon = grupo.eventos.reduce((sum, e) => sum + e.lon, 0) / grupo.count;
                grupoEncontrado = true;
                break;
            }
        }
        
        if (!grupoEncontrado) {
            grupos.push({
                lat: evento.lat,
                lon: evento.lon,
                count: 1,
                eventos: [evento],
                tipos: {}
            });
        }
    });
    
    // Clasificar por tipos de eventos
    grupos.forEach(grupo => {
        grupo.eventos.forEach(ev => {
            ev.eventos.forEach(e => {
                if (!grupo.tipos[e.tipo]) {
                    grupo.tipos[e.tipo] = 0;
                }
                grupo.tipos[e.tipo]++;
            });
        });
    });
    
    // Ordenar por cantidad de eventos
    return grupos.sort((a, b) => b.count - a.count);
}

// ============================================================================
// ANÁLISIS DE VELOCIDADES
// ============================================================================

function analizarVelocidades(datosGPS) {
    const analisis = {
        excesos_detectados: [],
        velocidad_maxima: 0,
        velocidad_promedio: 0,
        tiempo_exceso_ciudad: 0,
        tiempo_exceso_carretera: 0
    };
    
    const velocidades = datosGPS
        .filter(d => d.valida && d.velocidad > 0)
        .map(d => ({ velocidad: d.velocidad, lat: d.lat, lon: d.lon, timestamp: d.timestamp }));
    
    if (velocidades.length === 0) return analisis;
    
    analisis.velocidad_maxima = Math.max(...velocidades.map(v => v.velocidad));
    analisis.velocidad_promedio = velocidades.reduce((sum, v) => sum + v.velocidad, 0) / velocidades.length;
    
    // Detectar excesos (asumiendo ciudad por defecto, TomTom refinará)
    velocidades.forEach(v => {
        if (v.velocidad > CONFIG.VELOCIDAD_MAXIMA_CIUDAD) {
            analisis.excesos_detectados.push({
                timestamp: v.timestamp,
                lat: v.lat,
                lon: v.lon,
                velocidad: v.velocidad,
                exceso: v.velocidad - CONFIG.VELOCIDAD_MAXIMA_CIUDAD
            });
        }
    });
    
    // Tiempo en exceso (asumiendo 1 muestra cada 5 segundos)
    analisis.tiempo_exceso_ciudad = analisis.excesos_detectados.length * 5 / 60; // minutos
    
    return analisis;
}

// ============================================================================
// CÁLCULO DE KPIS
// ============================================================================

function calcularKPIsVehiculo(sesiones) {
    const kpis = {
        total_emergencias: 0,
        total_salidas: 0,
        total_vueltas: 0,
        tiempo_total_emergencia: 0, // minutos
        distancia_total_emergencias: 0, // km
        horas_conduccion: 0,
        km_recorridos: 0,
        numero_incidencias: 0,
        velocidad_maxima: 0,
        velocidad_promedio: 0,
        eventos_por_tipo: {},
        disponibilidad: 0
    };
    
    sesiones.forEach(sesion => {
        if (!sesion.analisisOperacional) return;
        
        const ao = sesion.analisisOperacional;
        
        // Contar emergencias
        if (ao.esEmergencia) {
            kpis.total_emergencias++;
            kpis.tiempo_total_emergencia += ao.tiempoRotativoEncendido;
            kpis.distancia_total_emergencias += ao.distanciaRecorrida;
        }
        
        if (ao.tipo === 'SALIDA_EMERGENCIA') kpis.total_salidas++;
        if (ao.tipo === 'VUELTA_EMERGENCIA') kpis.total_vueltas++;
        
        // Acumular generales
        kpis.km_recorridos += ao.distanciaRecorrida;
        if (ao.velocidadMaxima > kpis.velocidad_maxima) {
            kpis.velocidad_maxima = ao.velocidadMaxima;
        }
        
        // Incidencias
        if (sesion.eventosEstabilidad) {
            kpis.numero_incidencias += sesion.eventosEstabilidad.length;
            
            sesion.eventosEstabilidad.forEach(ev => {
                ev.eventos.forEach(e => {
                    if (!kpis.eventos_por_tipo[e.tipo]) {
                        kpis.eventos_por_tipo[e.tipo] = 0;
                    }
                    kpis.eventos_por_tipo[e.tipo]++;
                });
            });
        }
        
        // Horas de conducción (sesiones con rotativo encendido o movimiento)
        if (sesion.duracion) {
            kpis.horas_conduccion += sesion.duracion / 60; // convertir minutos a horas
        }
    });
    
    // Velocidad promedio
    const sesionesConVelocidad = sesiones.filter(s => s.analisisOperacional?.velocidadPromedio > 0);
    if (sesionesConVelocidad.length > 0) {
        kpis.velocidad_promedio = sesionesConVelocidad.reduce((sum, s) => 
            sum + s.analisisOperacional.velocidadPromedio, 0) / sesionesConVelocidad.length;
    }
    
    // Disponibilidad (% de sesiones completas y válidas)
    const sesionesValidas = sesiones.filter(s => s.completa && s.analisisOperacional);
    kpis.disponibilidad = (sesionesValidas.length / sesiones.length) * 100;
    
    return kpis;
}

// ============================================================================
// PROCESAMIENTO PRINCIPAL
// ============================================================================

async function procesarVehiculo(vehiculo) {
    console.log(`\n📊 Analizando ${vehiculo.toUpperCase()}...`);
    
    const vehiculoData = {
        nombre: vehiculo,
        sesiones: [],
        kpis: {},
        puntos_negros: [],
        velocidades_excesivas: []
    };
    
    // Cargar análisis previo para obtener sesiones
    const analisisPrevioPath = path.join(__dirname, 'analisis-exhaustivo-datos.json');
    if (!fs.existsSync(analisisPrevioPath)) {
        console.log(`⚠️ Ejecuta primero analisis-exhaustivo-completo.js`);
        return vehiculoData;
    }
    
    const analisisPrevio = JSON.parse(fs.readFileSync(analisisPrevioPath, 'utf-8'));
    const sesionesBase = analisisPrevio.vehiculos[vehiculo]?.sesiones || [];
    
    console.log(`  Procesando ${sesionesBase.length} sesiones...`);
    
    const eventosConUbicacion = [];
    
    for (const sesionBase of sesionesBase) {
        if (!sesionBase.completa) continue;
        
        const fecha = sesionBase.fecha;
        
        // Cargar datos completos
        const datosGPS = cargarDatosSesion(vehiculo, fecha, 'GPS');
        const datosRotativo = cargarDatosSesion(vehiculo, fecha, 'ROTATIVO');
        const datosEstabilidad = cargarDatosSesion(vehiculo, fecha, 'estabilidad');
        
        // Análisis operacional
        const analisisOp = analizarEmergencia(sesionBase, datosGPS, datosRotativo);
        
        // Detectar eventos de estabilidad
        const eventos = detectarEventosEstabilidad(datosEstabilidad);
        
        // Correlacionar eventos con ubicación GPS
        eventos.forEach(evento => {
            // Buscar GPS más cercano en tiempo
            const gpsData = datosGPS.find(g => 
                g.valida && Math.abs(g.timestamp - evento.timestamp) < 5000
            );
            
            if (gpsData) {
                eventosConUbicacion.push({
                    ...evento,
                    lat: gpsData.lat,
                    lon: gpsData.lon,
                    vehiculo,
                    fecha
                });
            }
        });
        
        // Análisis de velocidades
        const analisisVelocidad = analizarVelocidades(datosGPS);
        
        vehiculoData.sesiones.push({
            ...sesionBase,
            analisisOperacional: analisisOp,
            eventosEstabilidad: eventos,
            analisisVelocidad
        });
        
        // Acumular excesos de velocidad
        vehiculoData.velocidades_excesivas.push(...analisisVelocidad.excesos_detectados.map(e => ({
            ...e,
            vehiculo,
            fecha,
            sesion: sesionBase.sesion_numero
        })));
    }
    
    // Agrupar puntos negros
    vehiculoData.puntos_negros = agruparPuntosNegros(eventosConUbicacion);
    
    // Calcular KPIs
    vehiculoData.kpis = calcularKPIsVehiculo(vehiculoData.sesiones);
    
    console.log(`  ✅ ${vehiculo.toUpperCase()} completado`);
    console.log(`     - Emergencias detectadas: ${vehiculoData.kpis.total_emergencias}`);
    console.log(`     - Puntos negros: ${vehiculoData.puntos_negros.length}`);
    console.log(`     - KM recorridos: ${vehiculoData.kpis.km_recorridos.toFixed(2)}`);
    
    return vehiculoData;
}

// ============================================================================
// GENERACIÓN DE REPORTES
// ============================================================================

async function generarReporteOperacional(analisis) {
    let md = `# 🚒 ANÁLISIS OPERACIONAL COMPLETO - DOBACKSOFT\n\n`;
    md += `**Fecha:** ${new Date(analisis.metadata.fecha_analisis).toLocaleString()}\n`;
    md += `**Versión:** ${analisis.metadata.version}\n\n`;
    md += `---\n\n`;
    
    md += `## 📊 RESUMEN EJECUTIVO\n\n`;
    
    // Calcular totales
    let totalEmergencias = 0;
    let totalKm = 0;
    let totalIncidencias = 0;
    let totalPuntosNegros = 0;
    
    Object.values(analisis.vehiculos).forEach(v => {
        totalEmergencias += v.kpis.total_emergencias || 0;
        totalKm += v.kpis.km_recorridos || 0;
        totalIncidencias += v.kpis.numero_incidencias || 0;
        totalPuntosNegros += v.puntos_negros.length || 0;
    });
    
    md += `- **Total emergencias detectadas:** ${totalEmergencias}\n`;
    md += `- **Kilómetros totales recorridos:** ${totalKm.toFixed(2)} km\n`;
    md += `- **Total incidencias detectadas:** ${totalIncidencias}\n`;
    md += `- **Puntos negros identificados:** ${totalPuntosNegros}\n\n`;
    
    // KPIs por vehículo
    md += `## 🚗 KPIs POR VEHÍCULO\n\n`;
    
    for (const [vehiculo, data] of Object.entries(analisis.vehiculos)) {
        md += `### ${vehiculo.toUpperCase()}\n\n`;
        md += `| KPI | Valor |\n`;
        md += `|-----|-------|\n`;
        md += `| **Emergencias totales** | ${data.kpis.total_emergencias || 0} |\n`;
        md += `| **Salidas registradas** | ${data.kpis.total_salidas || 0} |\n`;
        md += `| **Vueltas registradas** | ${data.kpis.total_vueltas || 0} |\n`;
        md += `| **Tiempo total emergencia** | ${(data.kpis.tiempo_total_emergencia || 0).toFixed(2)} min |\n`;
        md += `| **Distancia emergencias** | ${(data.kpis.distancia_total_emergencias || 0).toFixed(2)} km |\n`;
        md += `| **KM totales recorridos** | ${(data.kpis.km_recorridos || 0).toFixed(2)} km |\n`;
        md += `| **Horas de conducción** | ${(data.kpis.horas_conduccion || 0).toFixed(2)} h |\n`;
        md += `| **Número de incidencias** | ${data.kpis.numero_incidencias || 0} |\n`;
        md += `| **Velocidad máxima** | ${(data.kpis.velocidad_maxima || 0).toFixed(2)} km/h |\n`;
        md += `| **Velocidad promedio** | ${(data.kpis.velocidad_promedio || 0).toFixed(2)} km/h |\n`;
        md += `| **Disponibilidad** | ${(data.kpis.disponibilidad || 0).toFixed(2)}% |\n\n`;
        
        // Eventos por tipo
        if (Object.keys(data.kpis.eventos_por_tipo || {}).length > 0) {
            md += `#### Incidencias por Tipo:\n\n`;
            md += `| Tipo | Cantidad |\n`;
            md += `|------|----------|\n`;
            for (const [tipo, count] of Object.entries(data.kpis.eventos_por_tipo)) {
                md += `| ${tipo} | ${count} |\n`;
            }
            md += `\n`;
        }
        
        // Top 5 Puntos Negros
        if (data.puntos_negros.length > 0) {
            md += `#### 🔴 Top 5 Puntos Negros:\n\n`;
            md += `| # | Coordenadas | Incidencias | Tipos |\n`;
            md += `|---|-------------|-------------|-------|\n`;
            data.puntos_negros.slice(0, 5).forEach((punto, idx) => {
                const tiposStr = Object.entries(punto.tipos)
                    .map(([t, c]) => `${t}(${c})`)
                    .join(', ');
                md += `| ${idx+1} | ${punto.lat.toFixed(6)}, ${punto.lon.toFixed(6)} | ${punto.count} | ${tiposStr} |\n`;
            });
            md += `\n`;
        }
        
        md += `---\n\n`;
    }
    
    // Análisis global de puntos negros
    md += `## 🗺️ MAPA DE PUNTOS NEGROS GLOBAL\n\n`;
    md += `### Todos los vehículos combinados:\n\n`;
    
    const todosPuntosNegros = [];
    Object.values(analisis.vehiculos).forEach(v => {
        todosPuntosNegros.push(...v.puntos_negros.map(p => ({ ...p, vehiculo: v.nombre })));
    });
    
    const puntosOrdenados = todosPuntosNegros.sort((a, b) => b.count - a.count);
    
    md += `| # | Coordenadas | Incidencias | Vehículo | Tipos Principales |\n`;
    md += `|---|-------------|-------------|----------|-------------------|\n`;
    puntosOrdenados.slice(0, 20).forEach((punto, idx) => {
        const tiposStr = Object.entries(punto.tipos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([t, c]) => `${t}(${c})`)
            .join(', ');
        md += `| ${idx+1} | ${punto.lat.toFixed(6)}, ${punto.lon.toFixed(6)} | ${punto.count} | ${punto.vehiculo} | ${tiposStr} |\n`;
    });
    md += `\n`;
    
    md += `> **Nota:** Estas coordenadas se pueden usar con la API de TomTom para obtener direcciones exactas y límites de velocidad.\n\n`;
    
    // Recomendaciones
    md += `## 💡 RECOMENDACIONES\n\n`;
    md += `### Para Cálculo de KPIs:\n\n`;
    md += `1. **Tiempo de Emergencia Real:**\n`;
    md += `   - Correlacionar sesiones de SALIDA + VUELTA para calcular tiempo total\n`;
    md += `   - Usar rotativo encendido como indicador principal\n`;
    md += `   - Gap máximo ${CONFIG.GAP_MAX_MISMA_EMERGENCIA} min entre ida/vuelta\n\n`;
    
    md += `2. **Kilómetros Recorridos:**\n`;
    md += `   - Usar integración GPS cuando disponible\n`;
    md += `   - Compensar pérdidas GPS con acelerómetro\n`;
    md += `   - Filtrar posiciones inválidas (fix=0 o numSats<4)\n\n`;
    
    md += `3. **Puntos Negros:**\n`;
    md += `   - Agrupar eventos en radio de ${50}m\n`;
    md += `   - Priorizar por cantidad y severidad\n`;
    md += `   - Usar TomTom para contexto (tipo vía, límite velocidad)\n\n`;
    
    md += `4. **Velocidades:**\n`;
    md += `   - Comparar con límites TomTom por tipo de vía\n`;
    md += `   - Considerar excepciones en emergencias\n`;
    md += `   - Alertar excesos >20 km/h sobre límite\n\n`;
    
    md += `### Integración con APIs Externas:\n\n`;
    md += `1. **Radar.com (Geocercas):**\n`;
    md += `   - Definir polígonos de parques de bomberos\n`;
    md += `   - Detectar entrada/salida automáticamente\n`;
    md += `   - Clasificar sesiones: SALIDA / VUELTA / TRASLADO\n\n`;
    
    md += `2. **TomTom (Límites y Direcciones):**\n`;
    md += `   - Obtener límite de velocidad en cada punto\n`;
    md += `   - Direcciones exactas de puntos negros\n`;
    md += `   - Tipo de vía para análisis de riesgo\n\n`;
    
    md += `---\n\n`;
    md += `_Análisis generado por DobackSoft - Sistema Operacional v2.0_\n`;
    
    const outputPath = path.join(__dirname, 'ANALISIS_OPERACIONAL_COMPLETO.md');
    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`\n✅ Reporte Markdown guardado: ${outputPath}`);
}

async function generarJSON(analisis) {
    const outputPath = path.join(__dirname, 'analisis-operacional-datos.json');
    fs.writeFileSync(outputPath, JSON.stringify(analisis, null, 2), 'utf-8');
    console.log(`✅ Datos JSON guardados: ${outputPath}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║      ANÁLISIS OPERACIONAL COMPLETO - DOBACKSOFT             ║');
    console.log('║      Emergencias | KPIs | Puntos Negros | Velocidades      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    try {
        for (const vehiculo of VEHICLES) {
            const vehiculoData = await procesarVehiculo(vehiculo);
            analisisOperacional.vehiculos[vehiculo] = vehiculoData;
        }
        
        await generarReporteOperacional(analisisOperacional);
        await generarJSON(analisisOperacional);
        
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║         ANÁLISIS OPERACIONAL COMPLETADO CON ÉXITO           ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    }
}

main().catch(console.error);

