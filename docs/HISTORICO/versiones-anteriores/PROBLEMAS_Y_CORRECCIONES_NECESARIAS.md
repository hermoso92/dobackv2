# 🔧 PROBLEMAS DETECTADOS Y CORRECCIONES NECESARIAS

## 🎯 RESUMEN EJECUTIVO

Después de analizar los archivos reales de DobackSoft, se han identificado **problemas críticos** que explican por qué:
- ❌ Las sesiones no se suben correctamente
- ❌ Los KPIs no son precisos
- ❌ Los filtros no aplican bien
- ❌ Faltan datos en los reportes

---

## 🐛 PROBLEMAS IDENTIFICADOS

### 1. **SISTEMA DE SUBIDA: NO MANEJA SESIONES MÚLTIPLES**

#### PROBLEMA
```
Un archivo puede contener MÚLTIPLES SESIONES:

ESTABILIDAD;08/10/2025 04:43:40;DOBACK024;Sesión:1;
...datos de sesión 1...
ESTABILIDAD;08/10/2025 12:15:30;DOBACK024;Sesión:2;
...datos de sesión 2...
ESTABILIDAD;08/10/2025 18:22:10;DOBACK024;Sesión:3;
...datos de sesión 3...
```

#### SISTEMA ACTUAL
```javascript
// backend/src/routes/upload-simple.ts
// ❌ SOLO parsea el archivo, NO guarda en BD
// ❌ NO detecta sesiones múltiples
// ❌ NO correlaciona GPS + ESTABILIDAD + ROTATIVO
```

#### CORRECCIÓN NECESARIA
```javascript
async function procesarArchivoConSesionesMultiples(archivo) {
    const lineas = leerArchivo(archivo);
    const sesiones = [];
    let sesionActual = null;
    
    for (const linea of lineas) {
        // Detectar cabecera de nueva sesión
        if (linea.match(/^(ESTABILIDAD|GPS|ROTATIVO);/)) {
            if (sesionActual) {
                // Guardar sesión anterior en BD
                await guardarSesionEnBD(sesionActual);
                sesiones.push(sesionActual);
            }
            
            // Iniciar nueva sesión
            const [tipo, fecha, vehiculo, sesionNum] = parsearCabecera(linea);
            sesionActual = {
                tipo,
                fecha,
                vehiculo,
                sesionNum,
                datos: []
            };
        } else if (sesionActual) {
            sesionActual.datos.push(parsearLinea(linea));
        }
    }
    
    // Guardar última sesión
    if (sesionActual) {
        await guardarSesionEnBD(sesionActual);
        sesiones.push(sesionActual);
    }
    
    return sesiones;
}
```

---

### 2. **GPS: PÉRDIDA MASIVA DE SEÑAL**

#### PROBLEMA
```
GPS_DOBACK024_20251008.txt:
Hora Raspberry-04:43:30,08/10/2025,Hora GPS-04:43:30,sin datos GPS
Hora Raspberry-04:43:31,08/10/2025,Hora GPS-04:43:31,sin datos GPS
...
(8000+ líneas con "sin datos GPS")
```

**IMPACTO**:
- ❌ No hay coordenadas para calcular KM recorridos
- ❌ No hay velocidades para detectar excesos
- ❌ No se pueden correlacionar eventos de estabilidad con ubicación
- ❌ No se pueden calcular claves operacionales (parque, taller, emergencia)

#### SISTEMA ACTUAL
```javascript
// backend/src/services/kpiCalculator.ts
// ❌ NO maneja líneas "sin datos GPS"
// ❌ Asume que TODAS las líneas tienen coordenadas
```

#### CORRECCIÓN NECESARIA
```javascript
async function parsearGPSConValidacion(archivo) {
    const lineas = leerArchivo(archivo);
    const puntosValidos = [];
    let lineasInvalidas = 0;
    
    for (const linea of lineas) {
        if (linea.includes('sin datos GPS')) {
            lineasInvalidas++;
            continue;
        }
        
        const partes = linea.split(',');
        
        // Validar coordenadas
        const lat = parseFloat(partes[3]);
        const lon = parseFloat(partes[4]);
        
        if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
            lineasInvalidas++;
            continue;
        }
        
        puntosValidos.push({
            timestamp: parsearTimestamp(partes[0], partes[1]),
            lat,
            lon,
            altitude: parseFloat(partes[5]),
            hdop: parseFloat(partes[6]),
            fix: partes[7],
            numSats: parseInt(partes[8]),
            speed: parseFloat(partes[9])
        });
    }
    
    const porcentajeValido = (puntosValidos.length / lineas.length) * 100;
    
    if (porcentajeValido < 10) {
        throw new Error(`Archivo GPS inválido: solo ${porcentajeValido.toFixed(1)}% de datos válidos`);
    }
    
    return {
        puntos: puntosValidos,
        estadisticas: {
            total: lineas.length,
            validas: puntosValidos.length,
            invalidas: lineasInvalidas,
            porcentajeValido
        }
    };
}
```

#### INTERPOLACIÓN GPS
```javascript
function interpolarGPSFaltante(puntos) {
    const puntosCompletos = [];
    
    for (let i = 0; i < puntos.length - 1; i++) {
        puntosCompletos.push(puntos[i]);
        
        const siguiente = puntos[i + 1];
        const diffSegundos = (siguiente.timestamp - puntos[i].timestamp) / 1000;
        
        // Si hay gap < 10 segundos, interpolar
        if (diffSegundos > 1 && diffSegundos <= 10) {
            const puntosInterpolados = Math.floor(diffSegundos) - 1;
            
            for (let j = 1; j <= puntosInterpolados; j++) {
                const ratio = j / (puntosInterpolados + 1);
                puntosCompletos.push({
                    timestamp: new Date(puntos[i].timestamp.getTime() + (diffSegundos * 1000 * ratio)),
                    lat: puntos[i].lat + (siguiente.lat - puntos[i].lat) * ratio,
                    lon: puntos[i].lon + (siguiente.lon - puntos[i].lon) * ratio,
                    interpolado: true
                });
            }
        }
    }
    
    puntosCompletos.push(puntos[puntos.length - 1]);
    return puntosCompletos;
}
```

---

### 3. **TIMESTAMPS: ZONA HORARIA INCORRECTA**

#### PROBLEMA
```
GPS_DOBACK024_20251007.txt:
Hora Raspberry: 03:26:04
Hora GPS:       01:26:04  ← 2 horas de diferencia
```

**CAUSA**: GPS usa UTC, Raspberry usa hora local (UTC+2)

#### SISTEMA ACTUAL
```javascript
// ❌ Usa "Hora GPS" que está en UTC
// ❌ Genera timestamps incorrectos
// ❌ Correlación GPS ↔ ESTABILIDAD ↔ ROTATIVO falla
```

#### CORRECCIÓN NECESARIA
```javascript
function parsearTimestampGPS(horaRaspberry, fecha) {
    // ✅ USAR SIEMPRE HORA RASPBERRY (hora local)
    const [horas, minutos, segundos] = horaRaspberry.split(':');
    const [dia, mes, año] = fecha.split('/');
    
    return new Date(
        parseInt(año),
        parseInt(mes) - 1,
        parseInt(dia),
        parseInt(horas),
        parseInt(minutos),
        parseInt(segundos)
    );
}
```

---

### 4. **ESTABILIDAD: TIMESTAMPS IMPLÍCITOS**

#### PROBLEMA
```
ESTABILIDAD_DOBACK024_20251008.txt:
-59.78;  14.15; 1014.19; ...
-57.83;  16.59; 1011.62; ...
-59.54;  14.03; 1016.02; ...
04:43:41                    ← Marcador temporal
-58.07;  14.03; 1010.28; ...
-62.22;  15.86; 1018.46; ...
04:43:42                    ← Marcador temporal
-54.53;  18.79; 1016.87; ...
```

**PROBLEMA**: Las líneas de datos NO tienen timestamp explícito

#### SISTEMA ACTUAL
```javascript
// ❌ Asume que cada línea tiene timestamp
// ❌ No interpola entre marcadores
```

#### CORRECCIÓN NECESARIA
```javascript
function parsearEstabilidadConTimestamps(archivo, fechaSesion) {
    const lineas = leerArchivo(archivo);
    const datos = [];
    let ultimoTimestamp = null;
    let lineasDesdeMarcador = 0;
    
    for (const linea of lineas) {
        // Detectar marcador temporal (formato: HH:MM:SS)
        if (linea.match(/^\d{2}:\d{2}:\d{2}$/)) {
            const [h, m, s] = linea.split(':');
            ultimoTimestamp = new Date(
                fechaSesion.getFullYear(),
                fechaSesion.getMonth(),
                fechaSesion.getDate(),
                parseInt(h),
                parseInt(m),
                parseInt(s)
            );
            lineasDesdeMarcador = 0;
            continue;
        }
        
        // Parsear datos
        if (linea.includes(';') && ultimoTimestamp) {
            const valores = linea.split(';').map(v => parseFloat(v.trim()));
            
            // Interpolar timestamp (frecuencia ~10 Hz)
            const timestamp = new Date(
                ultimoTimestamp.getTime() + (lineasDesdeMarcador * 100)  // +100ms por línea
            );
            
            datos.push({
                timestamp,
                ax: valores[0],
                ay: valores[1],
                az: valores[2],
                gx: valores[3],
                gy: valores[4],
                gz: valores[5],
                roll: valores[6],
                pitch: valores[7],
                yaw: valores[8],
                si: valores[16],  // Índice de estabilidad
                accmag: valores[17]
            });
            
            lineasDesdeMarcador++;
        }
    }
    
    return datos;
}
```

---

### 5. **CORRELACIÓN GPS ↔ ESTABILIDAD ↔ ROTATIVO**

#### PROBLEMA ACTUAL
```javascript
// backend/src/services/kpiCalculator.ts
// ❌ NO correlaciona los 3 tipos de datos
// ❌ GPS, ESTABILIDAD y ROTATIVO se procesan por separado
// ❌ No se puede saber la ubicación de un evento de estabilidad
// ❌ No se puede saber si había rotativo encendido en un punto GPS
```

#### CORRECCIÓN NECESARIA
```javascript
async function correlacionarDatosSesion(sessionId) {
    const [gps, estabilidad, rotativo] = await Promise.all([
        prisma.gpsMeasurement.findMany({ 
            where: { sessionId }, 
            orderBy: { timestamp: 'asc' } 
        }),
        prisma.stabilityMeasurement.findMany({ 
            where: { sessionId }, 
            orderBy: { timestamp: 'asc' } 
        }),
        prisma.rotativoMeasurement.findMany({ 
            where: { sessionId }, 
            orderBy: { timestamp: 'asc' } 
        })
    ]);
    
    // Crear mapa de rotativo por timestamp (estado más cercano en ±5s)
    const rotativoMap = new Map();
    rotativo.forEach(r => {
        rotativoMap.set(r.timestamp.getTime(), r.state);
    });
    
    // Correlacionar GPS con Rotativo
    const gpsConRotativo = gps.map(g => {
        const rotativoState = encontrarEstadoMasCercano(
            g.timestamp, 
            rotativoMap, 
            5000  // ±5 segundos
        );
        
        return {
            ...g,
            rotativoEncendido: rotativoState === '1'
        };
    });
    
    // Correlacionar Estabilidad con GPS (ubicación del evento)
    const estabilidadConGPS = estabilidad.map(e => {
        const gpsMasCercano = encontrarPuntoMasCercano(
            e.timestamp,
            gps,
            5000  // ±5 segundos
        );
        
        return {
            ...e,
            lat: gpsMasCercano?.latitude || 0,
            lon: gpsMasCercano?.longitude || 0,
            speed: gpsMasCercano?.speed || 0
        };
    });
    
    return {
        gpsConRotativo,
        estabilidadConGPS,
        estadisticas: {
            puntosGPS: gps.length,
            puntosGPSValidos: gps.filter(g => g.fix === '1').length,
            muestrasEstabilidad: estabilidad.length,
            cambiosRotativo: rotativo.length
        }
    };
}
```

---

### 6. **EVENTOS DE ESTABILIDAD: FALTA GPS**

#### PROBLEMA ACTUAL
```javascript
// backend/src/services/eventDetector.ts
// ❌ Detecta eventos pero NO tiene lat/lon
// ❌ No se pueden mostrar en mapas
// ❌ No se pueden correlacionar con geocercas
```

#### CORRECCIÓN NECESARIA
```javascript
async function detectarYGuardarEventosConGPS(sessionId) {
    const [muestras, puntosGPS] = await Promise.all([
        prisma.stabilityMeasurement.findMany({ 
            where: { sessionId }, 
            orderBy: { timestamp: 'asc' } 
        }),
        prisma.gpsMeasurement.findMany({ 
            where: { sessionId, fix: '1' }, 
            orderBy: { timestamp: 'asc' } 
        })
    ]);
    
    const eventos = [];
    
    for (const muestra of muestras) {
        // Solo detectar si SI < 50%
        if (muestra.si >= 0.50) continue;
        
        // Detectar tipo de evento
        let tipoEvento = null;
        let severidad = 'LEVE';
        
        if (muestra.si < 0.10 && (Math.abs(muestra.roll) > 10 || Math.abs(muestra.gx) > 30)) {
            tipoEvento = 'VUELCO_INMINENTE';
            severidad = 'CRITICA';
        } else if (Math.abs(muestra.gx) > 45 && muestra.si > 0.70) {
            tipoEvento = 'DERIVA_PELIGROSA';
            severidad = 'ALTA';
        } else if (Math.abs(muestra.ay) > 300) {
            tipoEvento = 'MANIOBRA_BRUSCA';
            severidad = 'MODERADA';
        }
        
        if (!tipoEvento) continue;
        
        // ✅ CORRELACIONAR CON GPS
        const gpsMasCercano = encontrarPuntoMasCercano(
            muestra.timestamp,
            puntosGPS,
            5000
        );
        
        // ✅ GUARDAR EVENTO CON COORDENADAS
        await prisma.stabilityEvent.create({
            data: {
                sessionId,
                timestamp: muestra.timestamp,
                type: tipoEvento,
                severity: severidad,
                lat: gpsMasCercano?.latitude || 0,
                lon: gpsMasCercano?.longitude || 0,
                speed: gpsMasCercano?.speed || 0,
                details: {
                    ax: muestra.ax,
                    ay: muestra.ay,
                    az: muestra.az,
                    gx: muestra.gx,
                    gy: muestra.gy,
                    gz: muestra.gz,
                    roll: muestra.roll,
                    pitch: muestra.pitch,
                    yaw: muestra.yaw,
                    si: muestra.si,
                    accmag: muestra.accmag
                }
            }
        });
        
        eventos.push(tipoEvento);
    }
    
    return eventos;
}
```

---

## 🚀 PLAN DE CORRECCIÓN

### FASE 1: SUBIDA ROBUSTA (URGENTE ⚠️)
```bash
1. Crear procesador de sesiones múltiples
2. Implementar validación de GPS con "sin datos GPS"
3. Corregir timestamps (usar Hora Raspberry)
4. Implementar interpolación de timestamps en ESTABILIDAD
5. Guardar estadísticas de calidad de datos
```

### FASE 2: CORRELACIÓN DE DATOS (URGENTE ⚠️)
```bash
1. Correlacionar GPS ↔ ROTATIVO (estado en cada punto)
2. Correlacionar ESTABILIDAD ↔ GPS (ubicación de eventos)
3. Actualizar tabla StabilityEvent con lat/lon
4. Interpolar GPS cuando falta señal (gaps < 10s)
```

### FASE 3: KPIS PRECISOS (IMPORTANTE 📊)
```bash
1. Recalcular KM con GPS interpolado
2. Calcular claves operacionales con geocercas reales
3. Detectar eventos con umbrales correctos
4. Calcular índice de calidad de datos
```

### FASE 4: REPORTES COMPLETOS (MEJORA 📈)
```bash
1. PDF con todos los KPIs
2. Mapas con recorrido real y eventos
3. Gráficas de estabilidad y velocidad
4. Exportación a Excel/CSV
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de aplicar las correcciones:

- [ ] ¿Se detectan todas las sesiones en un archivo?
- [ ] ¿GPS válido > 80% o se interpola?
- [ ] ¿Timestamps correctos (zona horaria)?
- [ ] ¿Eventos tienen coordenadas GPS?
- [ ] ¿KPIs calculados con datos correlacionados?
- [ ] ¿Reportes muestran información completa?

---

**🎯 PRÓXIMO PASO**: Implementar procesador robusto de archivos que maneje todos estos casos.

