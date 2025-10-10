# 📊 ANÁLISIS COMPLETO DE ARCHIVOS DOBACKSOFT

## 🎯 OBJETIVO
Análisis exhaustivo de los archivos generados por los dispositivos Doback para establecer reglas de:
- ✅ Subida de archivos
- ✅ Cálculo de KPIs
- ✅ Almacenamiento en BD
- ✅ Generación de reportes

---

## 📁 ESTRUCTURA DE ARCHIVOS

### 1. ORGANIZACIÓN
```
backend/data/datosDoback/
└── CMadrid/                    # Organización (empresa)
    ├── doback024/              # Vehículo 1
    │   ├── estabilidad/        # Archivos de sensores
    │   ├── GPS/                # Archivos de posicionamiento
    │   └── ROTATIVO/           # Archivos de sirena
    ├── doback027/              # Vehículo 2
    └── doback028/              # Vehículo 3
```

### 2. CONVENCIÓN DE NOMBRES
```
Tipo_VEHICULO_YYYYMMDD.txt

Ejemplos:
ESTABILIDAD_DOBACK024_20251008.txt
GPS_DOBACK024_20251008.txt
ROTATIVO_DOBACK024_20251008.txt
```

---

## 📋 FORMATO DE ARCHIVOS

### 1️⃣ ESTABILIDAD (Sensores Inerciales)

#### CABECERA
```
ESTABILIDAD;DD/MM/YYYY HH:MM:SS;VEHICULO;Sesión:N;
ax; ay; az; gx; gy; gz; roll; pitch; yaw; timeantwifi; usciclo1; usciclo2; usciclo3; usciclo4; usciclo5; si; accmag; microsds; k3
```

#### DATOS
```
-59.78;  14.15; 1014.19; -1713.34; -269.06; 1045.97;   3.41;  13.80;  -0.82; 69301.00; 19999.00; 20001.00; 20000.00; 19999.00; 20004.00;   0.90; 1016.04; 168121.00;   0.85;
```

#### CAMPOS (19 columnas)
| Campo | Descripción | Unidad | Uso |
|-------|-------------|---------|-----|
| `ax`, `ay`, `az` | Aceleración (X, Y, Z) | mg | ✅ Detección eventos |
| `gx`, `gy`, `gz` | Giroscopio (X, Y, Z) | °/s | ✅ Detección giros |
| `roll`, `pitch`, `yaw` | Orientación | ° | ✅ Detección vuelcos |
| `timeantwifi` | Tiempo WiFi | ms | ❌ No relevante |
| `usciclo1-5` | Uso interno dispositivo | - | ❌ No relevante |
| `si` | **Índice de Estabilidad** | 0-1 | ✅✅✅ CRÍTICO |
| `accmag` | Magnitud aceleración | mg | ✅ Intensidad |
| `microsds` | Microsegundos | μs | ❌ No relevante |
| `k3` | Uso interno | - | ❌ No relevante |

#### MARCADORES TEMPORALES
```
HH:MM:SS           # Aparece cada segundo intercalado en los datos
```

#### FRECUENCIA
- **~10 Hz** (10 muestras/segundo)
- Un archivo puede tener **decenas de miles de líneas**

---

### 2️⃣ GPS (Posicionamiento)

#### CABECERA
```
GPS;DD/MM/YYYY-HH:MM:SS;VEHICULO;Sesión:N
HoraRaspberry,Fecha,Hora(GPS),Latitud,Longitud,Altitud,HDOP,Fix,NumSats,Velocidad(km/h)
```

#### DATOS SIN SEÑAL
```
Hora Raspberry-04:43:30,08/10/2025,Hora GPS-04:43:30,sin datos GPS
```

#### DATOS CON SEÑAL
```
03:26:04,07/10/2025,01:26:04,40.5565173,-3.6031427,655.3,2.11,1,04,107.95
```

#### CAMPOS
| Campo | Descripción | Ejemplo | Uso |
|-------|-------------|---------|-----|
| `HoraRaspberry` | Timestamp local | 03:26:04 | ✅ Correlación |
| `Fecha` | Fecha | 07/10/2025 | ✅ Agrupación |
| `Hora(GPS)` | Timestamp GPS | 01:26:04 | ⚠️ Puede diferir |
| `Latitud` | Coordenada | 40.5565173 | ✅✅✅ CRÍTICO |
| `Longitud` | Coordenada | -3.6031427 | ✅✅✅ CRÍTICO |
| `Altitud` | Altura | 655.3 m | ✅ Opcional |
| `HDOP` | Precisión horizontal | 2.11 | ✅ Calidad señal |
| `Fix` | Tipo de fix | 1 | ✅ Validación |
| `NumSats` | Número de satélites | 04 | ✅ Calidad señal |
| `Velocidad(km/h)` | Velocidad | 107.95 | ✅✅✅ CRÍTICO |

#### FRECUENCIA
- **~1 Hz** (1 muestra/segundo)
- **Problema**: Puede tener largos períodos "sin datos GPS"

---

### 3️⃣ ROTATIVO (Sirena/Luces)

#### CABECERA
```
ROTATIVO;DD/MM/YYYY-HH:MM:SS;VEHICULO;Sesión:N
Fecha-Hora;Estado
```

#### DATOS
```
08/10/2025-04:43:29;0
08/10/2025-04:44:44;1
08/10/2025-04:45:14;1
```

#### CAMPOS
| Campo | Descripción | Valores | Uso |
|-------|-------------|---------|-----|
| `Fecha-Hora` | Timestamp | DD/MM/YYYY-HH:MM:SS | ✅ Correlación |
| `Estado` | Rotativo encendido/apagado | `0` = OFF, `1` = ON | ✅✅✅ CRÍTICO |

#### FRECUENCIA
- **~15 segundos** (cambios de estado)
- **Registra solo cambios**, no muestras continuas

---

## 🐛 PROBLEMAS DETECTADOS

### 1. **GPS: Pérdida de Señal**
```
❌ PROBLEMA:
Hora Raspberry-04:43:30,08/10/2025,Hora GPS-04:43:30,sin datos GPS
Hora Raspberry-04:43:31,08/10/2025,Hora GPS-04:43:31,sin datos GPS
...
(cientos/miles de líneas sin datos)
```

**IMPACTO**:
- ❌ No se pueden calcular rutas
- ❌ No se pueden detectar geocercas
- ❌ No se puede correlacionar con eventos de estabilidad

**SOLUCIÓN**:
- ✅ **Interpolar GPS** cuando hay pérdidas < 5 segundos
- ✅ **Marcar sesiones con % de cobertura GPS**
- ✅ **Alertar si pérdida > 30 segundos**

---

### 2. **Timestamps Inconsistentes**

#### 2.1. Hora GPS vs Hora Raspberry
```
❌ DIFERENCIA HORARIA:
Hora Raspberry: 04:43:30
Hora GPS:       02:43:30  ← 2 horas de diferencia
```

**CAUSA**: Zona horaria / GPS UTC  
**SOLUCIÓN**: **Usar SIEMPRE HoraRaspberry** como referencia

#### 2.2. Marcadores de Tiempo en ESTABILIDAD
```
...datos...
04:43:41
...datos...
04:43:42
...datos...
```

**PROBLEMA**: No todas las líneas tienen timestamp explícito  
**SOLUCIÓN**: **Calcular timestamp interpolando entre marcadores**

---

### 3. **Sesiones Múltiples en un Solo Archivo**

```
ESTABILIDAD;08/10/2025 04:43:40;DOBACK024;Sesión:1;
...datos...
ESTABILIDAD;08/10/2025 12:15:30;DOBACK024;Sesión:2;
...datos...
ESTABILIDAD;08/10/2025 18:22:10;DOBACK024;Sesión:3;
...datos...
```

**IMPACTO**:
- ❌ Un archivo = múltiples sesiones
- ❌ Necesita parseo por cabecera, no por archivo

**SOLUCIÓN**:
- ✅ **Detectar cabeceras** `TIPO;Fecha;Vehiculo;Sesión:N`
- ✅ **Crear una sesión BD por cada cabecera**
- ✅ **Correlacionar archivos GPS/ESTABILIDAD/ROTATIVO por timestamp**

---

### 4. **Datos Corruptos/Malformados**

```
❌ Latitud truncada:
4.5607527,-3.5968855  ← Falta '40.'

❌ Timestamp corrupto:
03:26:2.  ← Falta último dígito

❌ Valores inválidos:
40.0000000,0.0000000  ← Coordenadas nulas
```

**SOLUCIÓN**:
- ✅ **Validación estricta** al parsear
- ✅ **Descartar líneas inválidas** (log de errores)
- ✅ **Reportar % de datos válidos** por archivo

---

## 📦 REGLAS DE SUBIDA

### 1. **Validación de Archivos**

```javascript
function validarArchivo(archivo) {
    // 1. Verificar nombre
    const regex = /^(ESTABILIDAD|GPS|ROTATIVO)_DOBACK\d{3}_\d{8}\.txt$/;
    if (!regex.test(archivo.nombre)) {
        return { valido: false, error: 'Nombre inválido' };
    }
    
    // 2. Verificar cabecera
    const primeraLinea = leerPrimeraLinea(archivo);
    if (!primeraLinea.includes('Sesión:')) {
        return { valido: false, error: 'Cabecera inválida' };
    }
    
    // 3. Extraer metadatos
    const [tipo, fecha, vehiculo, sesion] = parsearCabecera(primeraLinea);
    
    // 4. Verificar vehículo existe en BD
    const vehiculoDB = await buscarVehiculo(vehiculo);
    if (!vehiculoDB) {
        return { 
            valido: false, 
            error: 'Vehículo no existe',
            sugerencia: `Crear ${vehiculo} en organización`
        };
    }
    
    return { valido: true, tipo, fecha, vehiculo, sesion };
}
```

### 2. **Detección de Sesiones Múltiples**

```javascript
function extraerSesiones(archivo) {
    const lineas = leerArchivo(archivo);
    const sesiones = [];
    let sesionActual = null;
    
    for (const linea of lineas) {
        // Detectar nueva cabecera
        if (esCabecera(linea)) {
            if (sesionActual) {
                sesiones.push(sesionActual);
            }
            sesionActual = {
                cabecera: parsearCabecera(linea),
                datos: []
            };
        } else if (sesionActual) {
            sesionActual.datos.push(linea);
        }
    }
    
    if (sesionActual) {
        sesiones.push(sesionActual);
    }
    
    return sesiones;
}
```

### 3. **Flujo de Subida**

```
1. Usuario sube archivo(s)
   ↓
2. Validar nombre y cabecera
   ↓
3. Extraer sesiones (puede haber múltiples)
   ↓
4. Por cada sesión:
   a. Buscar/crear vehículo
   b. Crear sesión en BD
   c. Parsear y guardar datos
   d. Correlacionar GPS + ESTABILIDAD + ROTATIVO
   ↓
5. Generar informe de subida:
   - ✅ Sesiones creadas
   - ⚠️ Líneas descartadas
   - ❌ Errores críticos
```

---

## 📊 REGLAS DE KPIs

### 1. **KPIs Básicos**

#### Horas de Conducción
```sql
SELECT 
    SUM(EXTRACT(EPOCH FROM (endTime - startTime))) / 3600 as horas_conduccion
FROM Session
WHERE vehicleId = :vehicleId
  AND startTime BETWEEN :from AND :to
  AND (endTime - startTime) > INTERVAL '5 minutes';  -- Sesiones significativas
```

#### Kilómetros Recorridos
```javascript
async function calcularKilometros(sessionId) {
    const puntosGPS = await prisma.gpsMeasurement.findMany({
        where: { sessionId, fix: '1' },  // Solo con fix válido
        orderBy: { timestamp: 'asc' }
    });
    
    let km = 0;
    for (let i = 1; i < puntosGPS.length; i++) {
        const dist = haversine(
            puntosGPS[i-1].latitude, 
            puntosGPS[i-1].longitude,
            puntosGPS[i].latitude, 
            puntosGPS[i].longitude
        );
        km += dist;
    }
    
    return km;
}
```

#### Tiempo con Rotativo Encendido
```sql
SELECT 
    SUM(EXTRACT(EPOCH FROM (lead_timestamp - timestamp))) / 3600 as horas_rotativo
FROM (
    SELECT 
        timestamp,
        state,
        LEAD(timestamp) OVER (ORDER BY timestamp) as lead_timestamp
    FROM RotativoMeasurement
    WHERE sessionId = :sessionId
) sub
WHERE state = '1';
```

---

### 2. **KPIs Operacionales (Claves de Bomberos)**

#### Clave 0 - Taller
```javascript
async function calcularClave0(sessionId) {
    const puntosGPS = await obtenerPuntosGPS(sessionId);
    const geocercasTaller = await obtenerGeocercas('taller');
    
    let tiempoEnTaller = 0;
    let dentroTaller = false;
    let entradaTaller = null;
    
    for (const punto of puntosGPS) {
        const estaDentro = verificarEnGeocerca(punto, geocercasTaller);
        
        if (!dentroTaller && estaDentro) {
            // Entrada al taller
            dentroTaller = true;
            entradaTaller = punto.timestamp;
        } else if (dentroTaller && !estaDentro) {
            // Salida del taller
            tiempoEnTaller += punto.timestamp - entradaTaller;
            dentroTaller = false;
        }
    }
    
    return tiempoEnTaller;
}
```

#### Clave 1 - Operativo en Parque
```javascript
// Similar a Clave 0, pero con geocercas tipo 'parque'
```

#### Clave 2 - Salida en Emergencia
```javascript
async function calcularClave2(sessionId) {
    const eventos = await prisma.$queryRaw`
        SELECT 
            g.timestamp as inicio,
            LEAD(g.timestamp) OVER (ORDER BY g.timestamp) as fin
        FROM GpsMeasurement g
        INNER JOIN RotativoMeasurement r 
            ON ABS(EXTRACT(EPOCH FROM (g.timestamp - r.timestamp))) < 5
        WHERE g.sessionId = ${sessionId}
          AND r.state = '1'
          AND puntoEnParque(g.latitude, g.longitude)  -- Sale del parque
        ORDER BY g.timestamp
    `;
    
    // Calcular tiempo hasta llegada (rotativo se apaga)
    return sumarDuraciones(eventos);
}
```

#### Clave 3 - En Incendio/Emergencia
```javascript
async function calcularClave3(sessionId) {
    // Detectar paradas > 5 min con rotativo opcional
    const paradas = await prisma.$queryRaw`
        SELECT 
            timestamp,
            LEAD(timestamp) OVER (ORDER BY timestamp) as siguiente
        FROM GpsMeasurement
        WHERE sessionId = ${sessionId}
          AND speed < 1  -- Parado
        HAVING EXTRACT(EPOCH FROM (siguiente - timestamp)) > 300  -- > 5 min
    `;
    
    return sumarDuraciones(paradas);
}
```

#### Clave 5 - Regreso al Parque
```javascript
async function calcularClave5(sessionId) {
    // Desde inicio de retorno (sin rotativo) hasta entrada en parque
    const regreso = await prisma.$queryRaw`
        SELECT g.timestamp as inicio, g2.timestamp as fin
        FROM GpsMeasurement g
        INNER JOIN RotativoMeasurement r 
            ON ABS(EXTRACT(EPOCH FROM (g.timestamp - r.timestamp))) < 5
        LEFT JOIN GpsMeasurement g2 
            ON g2.timestamp > g.timestamp 
            AND puntoEnParque(g2.latitude, g2.longitude)
        WHERE g.sessionId = ${sessionId}
          AND r.state = '0'  -- Sin rotativo
        ORDER BY g.timestamp
        LIMIT 1
    `;
    
    return calcularDuracion(regreso);
}
```

---

### 3. **KPIs de Estabilidad**

#### Índice de Estabilidad (SI)
```javascript
async function calcularIndiceEstabilidad(sessionId) {
    const muestras = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        select: { si: true }
    });
    
    const promedio = muestras.reduce((sum, m) => sum + m.si, 0) / muestras.length;
    
    return {
        indice_promedio: promedio,
        calificacion: promedio >= 0.90 ? 'EXCELENTE' :
                     promedio >= 0.88 ? 'BUENA' :
                     promedio >= 0.85 ? 'ACEPTABLE' : 'DEFICIENTE',
        total_muestras: muestras.length
    };
}
```

#### Eventos Críticos
```javascript
async function detectarEventos(sessionId) {
    const muestras = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });
    
    const eventos = [];
    
    for (const muestra of muestras) {
        // Vuelco inminente
        if (muestra.si < 0.10 && (Math.abs(muestra.roll) > 10 || Math.abs(muestra.gx) > 30)) {
            eventos.push({ 
                tipo: 'VUELCO_INMINENTE', 
                timestamp: muestra.timestamp,
                severidad: 'CRITICA'
            });
        }
        
        // Deriva peligrosa
        if (Math.abs(muestra.gx) > 45 && muestra.si > 0.70) {
            eventos.push({ 
                tipo: 'DERIVA_PELIGROSA', 
                timestamp: muestra.timestamp,
                severidad: 'ALTA'
            });
        }
        
        // Maniobra brusca
        if (Math.abs(muestra.ay) > 300 || Math.abs(muestra.gx) > 100) {
            eventos.push({ 
                tipo: 'MANIOBRA_BRUSCA', 
                timestamp: muestra.timestamp,
                severidad: 'MODERADA'
            });
        }
    }
    
    return eventos;
}
```

---

## 🗄️ REGLAS DE BASE DE DATOS

### 1. **Tablas Necesarias**

#### Session (Existente ✅)
```prisma
model Session {
  id          String   @id @default(uuid())
  vehicleId   String
  startTime   DateTime
  endTime     DateTime?
  
  // Archivos asociados
  archivosSubidos  ArchivoSubido[]
  
  // Mediciones
  gpsMeasurements         GpsMeasurement[]
  stabilityMeasurements   StabilityMeasurement[]
  rotativoMeasurements    RotativoMeasurement[]
  stabilityEvents         StabilityEvent[]
}
```

#### ArchivoSubido (Nuevo ⚠️)
```prisma
model ArchivoSubido {
  id              String   @id @default(uuid())
  sessionId       String
  session         Session  @relation(fields: [sessionId], references: [id])
  
  nombreOriginal  String
  tipo            String   // "ESTABILIDAD" | "GPS" | "ROTATIVO"
  fechaSubida     DateTime @default(now())
  
  // Validación
  lineasTotales   Int
  lineasValidas   Int
  lineasInvalidas Int
  errores         Json?    // Detalles de errores
  
  @@index([sessionId, tipo])
}
```

#### StabilityEvent (Mejorar existente ⚠️)
```prisma
model StabilityEvent {
  id          String   @id @default(uuid())
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id])
  
  timestamp   DateTime
  type        String   // "VUELCO_INMINENTE", "DERIVA_PELIGROSA", etc.
  severity    String   // "CRITICA", "ALTA", "MODERADA", "LEVE"
  
  // Coordenadas (correlacionadas con GPS)
  lat         Float
  lon         Float
  
  // Datos del sensor en el momento del evento
  details     Json     // { ax, ay, az, gx, gy, gz, roll, pitch, yaw, si, ... }
  
  @@index([sessionId, type])
  @@index([severity])
}
```

---

### 2. **Índices Optimizados**

```sql
-- Búsquedas frecuentes de sesiones
CREATE INDEX idx_session_vehicle_date 
ON "Session"("vehicleId", "startTime" DESC);

-- Eventos por tipo y severidad
CREATE INDEX idx_event_type_severity 
ON "StabilityEvent"("type", "severity", "timestamp" DESC);

-- GPS con fix válido
CREATE INDEX idx_gps_valid 
ON "GpsMeasurement"("sessionId", "timestamp") 
WHERE "fix" = '1';

-- Rotativo por estado
CREATE INDEX idx_rotativo_state 
ON "RotativoMeasurement"("sessionId", "timestamp", "state");

-- Estabilidad con SI bajo
CREATE INDEX idx_stability_low_si 
ON "StabilityMeasurement"("sessionId", "si") 
WHERE "si" < 0.50;
```

---

## 📄 REGLAS DE REPORTES

### 1. **Reporte de Sesión**

```javascript
async function generarReporteSesion(sessionId) {
    const [sesion, kpis, eventos, calidad] = await Promise.all([
        obtenerSesion(sessionId),
        calcularKPIsCompletos(sessionId),
        obtenerEventos(sessionId),
        calcularIndiceEstabilidad(sessionId)
    ]);
    
    const pdf = new PDFDocument();
    
    // 1. Portada
    pdf.fontSize(20).text(`Reporte de Sesión ${sesion.id}`, { align: 'center' });
    pdf.fontSize(12).text(`Vehículo: ${sesion.Vehicle.name}`);
    pdf.text(`Fecha: ${formatDate(sesion.startTime)} - ${formatDate(sesion.endTime)}`);
    
    // 2. KPIs Principales
    pdf.addPage();
    pdf.fontSize(16).text('KPIs Operacionales');
    pdf.fontSize(12);
    pdf.text(`Horas de Conducción: ${kpis.horasConduccion}`);
    pdf.text(`Kilómetros Recorridos: ${kpis.kilometros} km`);
    pdf.text(`Tiempo con Rotativo: ${kpis.tiempoRotativo}`);
    
    // 3. Claves de Bomberos
    pdf.addPage();
    pdf.fontSize(16).text('Tiempos por Clave');
    pdf.text(`Clave 0 (Taller): ${kpis.clave0}`);
    pdf.text(`Clave 1 (En Parque): ${kpis.clave1}`);
    pdf.text(`Clave 2 (Salida Emergencia): ${kpis.clave2}`);
    pdf.text(`Clave 3 (En Incendio): ${kpis.clave3}`);
    pdf.text(`Clave 5 (Regreso): ${kpis.clave5}`);
    
    // 4. Índice de Estabilidad
    pdf.addPage();
    pdf.fontSize(16).text('Calidad de Conducción');
    pdf.fontSize(14);
    const color = calidad.calificacion === 'EXCELENTE' ? 'green' : 
                  calidad.calificacion === 'BUENA' ? 'yellow' : 'red';
    pdf.fillColor(color).text(`Índice de Estabilidad: ${(calidad.indice_promedio * 100).toFixed(1)}%`);
    pdf.fillColor('black').text(`Calificación: ${calidad.calificacion}`);
    
    // 5. Eventos Críticos
    if (eventos.length > 0) {
        pdf.addPage();
        pdf.fontSize(16).text('Eventos Detectados');
        eventos.forEach(evento => {
            pdf.fontSize(12);
            pdf.text(`[${evento.severity}] ${evento.type} - ${formatDate(evento.timestamp)}`);
        });
    }
    
    // 6. Mapa de Recorrido
    pdf.addPage();
    const mapaImagen = await generarMapaRecorrido(sessionId);
    pdf.image(mapaImagen, { fit: [500, 400] });
    
    return pdf;
}
```

---

## 🚀 IMPLEMENTACIÓN PRIORITARIA

### FASE 1: Subida Robusta
1. ✅ Validador de archivos mejorado
2. ✅ Detector de sesiones múltiples
3. ✅ Parser resiliente (maneja datos corruptos)
4. ✅ Tabla `ArchivoSubido` para trazabilidad

### FASE 2: KPIs Precisos
1. ✅ Interpolación GPS cuando falta señal
2. ✅ Cálculo de claves operacionales
3. ✅ Detección de eventos críticos
4. ✅ Índice de calidad de conducción

### FASE 3: Reportes Completos
1. ✅ Generación PDF con todos los KPIs
2. ✅ Mapas de recorrido interactivos
3. ✅ Comparativas entre sesiones
4. ✅ Exportación a Excel/CSV

---

## 📝 CHECKLIST DE VALIDACIÓN

### Al Subir Archivos
- [ ] ¿Nombre sigue convención?
- [ ] ¿Cabecera válida?
- [ ] ¿Vehículo existe en BD?
- [ ] ¿Detectadas todas las sesiones?
- [ ] ¿% de líneas válidas > 80%?

### Al Calcular KPIs
- [ ] ¿GPS interpolado cuando falta?
- [ ] ¿Rotativo correlacionado con GPS?
- [ ] ¿Claves calculadas con geocercas?
- [ ] ¿Eventos detectados con umbrales correctos?
- [ ] ¿Índice SI promediado correctamente?

### Al Generar Reportes
- [ ] ¿Todos los KPIs incluidos?
- [ ] ¿Mapa con recorrido real?
- [ ] ¿Eventos críticos destacados?
- [ ] ¿Formato profesional?
- [ ] ¿Exportable en PDF/Excel?

---

**🎯 OBJETIVO FINAL**: Sistema 100% robusto que procese archivos con problemas y genere KPIs y reportes precisos y profesionales.

