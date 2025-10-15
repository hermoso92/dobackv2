# ⚖️ MANDAMIENTOS STABILSAFE
## Reglas Técnicas Inmutables - StabilSafe V3

**Versión:** 1.0  
**Fecha:** 2025-01-14  
**Autoridad:** Máxima - NUNCA pueden violarse  
**Alcance:** Todo el sistema (Backend + Frontend + BD)

---

## 📜 PREÁMBULO

**Este documento contiene las reglas técnicas absolutas e inmutables de StabilSafe V3.**

- ✅ Si hay conflicto entre código y este documento → **gana este documento**
- ✅ Si Cursor/IA sugiere algo que viola estos mandamientos → **rechazar**
- ✅ Si un desarrollador necesita violar un mandamiento → **consultar primero**
- ✅ Estas reglas están basadas en normativa DGT, física de vehículos y dominio bomberil

---

## M1. ROTATIVO (SIRENA) - ESTADOS BINARIOS

### Definición
El rotativo (sirena) es un indicador digital binario del estado operativo del vehículo.

### Estados Válidos
| Estado | Valor | Significado |
|--------|-------|-------------|
| **OFF** | `0` | Situación no urgente, retorno, estacionado |
| **ON** | `1` | Salida en emergencia, desplazamiento operativo activo |

### Reglas Inmutables

**M1.1** El rotativo **SOLO** puede tener valores `'0'` o `'1'` (string) en `RotativoMeasurement.state`.

**M1.2** El rotativo **NUNCA** se infiere a partir de velocidad, ubicación o eventos.

**M1.3** La fuente de verdad es **SIEMPRE** `RotativoMeasurement` o canal digital equivalente del dataset ROTATIVO.

**M1.4** En ausencia de dato de rotativo para un timestamp:
- Interpolar con último valor conocido (ventana máxima: 30 segundos)
- Si no hay último valor → asumir `'0'` (OFF)

### Uso en el Sistema

```typescript
// ✅ CORRECTO
const rotativoState = rotativoMeasurement.state; // '0' | '1'
const rotativoOn = rotativoState === '1';

// ❌ INCORRECTO
const rotativoOn = speed > 50; // NUNCA inferir rotativo
```

---

## M2. CLAVES OPERACIONALES (0-5) - MÁQUINA DE ESTADOS

### Definición
Las claves son estados mutuamente excluyentes que indican la fase de intervención del vehículo de bomberos.

### Tabla de Claves

| Clave | Nombre | Condición de Entrada | Condición de Salida | Prioridad |
|-------|--------|----------------------|---------------------|-----------|
| **0** | Taller | in_geofence('TALLER') | salir de geocerca taller | 1 (máxima) |
| **1** | Operativo en Parque | in_geofence('PARQUE') AND rotativo='0' | salir de geocerca parque | 2 |
| **2** | Salida en Emergencia | exit_geofence('PARQUE') AND rotativo='1' AND speed>5 | llegar a siniestro (parado >5min) | 3 |
| **3** | En Siniestro | speed<5 AND stationary_time≥300s AND !in_geofence('PARQUE') | inicio retorno (rotativo='0' + movimiento) | 4 |
| **4** | Fin de Actuación | rotativo changing '1'→'0' AND speed_decreasing AND !in_geofence('PARQUE') | entrada a Clave 5 o Clave 1 | 5 |
| **5** | Regreso al Parque | rotativo='0' AND heading_to_park AND speed>5 | entry_geofence('PARQUE') | 6 (mínima) |

### Reglas Inmutables

**M2.1 PRIORIDAD DE CLAVES**

Las claves se evalúan en orden de prioridad (0 > 1 > 2 > 3 > 4 > 5).

```typescript
// ✅ ALGORITMO DETERMINISTA
function determinarClave(punto: GPSPoint, rotativo: string, geocercas: Geocerca[]): number {
    const enTaller = estaEnGeocerca(punto.lat, punto.lon, geocercas.filter(g => g.tipo === 'TALLER'));
    const enParque = estaEnGeocerca(punto.lat, punto.lon, geocercas.filter(g => g.tipo === 'PARQUE'));
    const speed = punto.speed || 0;
    
    // Prioridad 1: Taller
    if (enTaller) return 0;
    
    // Prioridad 2: En parque
    if (enParque && rotativo === '0') return 1;
    
    // Prioridad 3: Salida emergencia
    if (!enParque && rotativo === '1' && speed > CONFIG.VELOCIDAD_PARADO) return 2;
    
    // Prioridad 4: En siniestro (parado ≥5min fuera de parque)
    if (!enParque && speed < CONFIG.VELOCIDAD_PARADO && tiempoParado >= CONFIG.TIEMPO_MIN_PARADO) return 3;
    
    // Prioridad 5: Fin de actuación (rotativo apagándose)
    if (!enParque && rotativoAnterior === '1' && rotativo === '0' && speed < speedAnterior) return 4;
    
    // Prioridad 6: Regreso
    if (!enParque && rotativo === '0' && speed > CONFIG.VELOCIDAD_PARADO && acercandoParque()) return 5;
    
    // Por defecto: mantener clave anterior
    return claveAnterior;
}
```

**M2.2 TRANSICIONES VÁLIDAS**

Secuencia normal: `1 → 2 → 3 → 5 → 1` o `1 → 2 → 5 → 1` (sin parada prolongada).

Transiciones atípicas permitidas:
- `2 → 4 → 5` (apaga rotativo antes de llegar)
- `3 → 4 → 5` (finaliza actuación)
- Cualquier clave → `0` (entra a taller)

**M2.3 CONSTANTES**

```typescript
const CONFIG = {
    VELOCIDAD_PARADO: 5,        // km/h - umbral de movimiento
    TIEMPO_MIN_PARADO: 300,     // segundos (5 min) - para Clave 3
    GPS_SAMPLE_INTERVAL: 5,     // segundos - muestreo típico
    RADIO_GEOCERCA: 100         // metros - radio por defecto
};
```

**M2.4 PERSISTENCIA OBLIGATORIA**

Los segmentos de clave **DEBEN** persistirse en `OperationalStateSegment`:

```typescript
model OperationalStateSegment {
  id              String   @id @default(uuid())
  sessionId       String
  clave           Int      // 0, 1, 2, 3, 4, 5
  startTime       DateTime
  endTime         DateTime
  durationSeconds Int
  
  Session         Session  @relation(...)
  
  @@index([sessionId, clave])
  @@index([sessionId, startTime])
}
```

**M2.5 NUNCA RECALCULAR ON-THE-FLY**

Los KPIs de tiempos por clave **SIEMPRE** leen de `OperationalStateSegment`, NUNCA recalculan.

---

## M3. EVENTOS DE ESTABILIDAD - DETECCIÓN Y CRITICIDAD

### Definición
Los eventos son situaciones físicas detectadas por sensores de estabilidad (acelerómetros, giróscopos) que indican riesgos o maniobras.

### Regla Fundamental: SI < 0.50

**M3.1 UMBRAL DE GENERACIÓN DE EVENTOS**

```
SOLO se generan eventos de estabilidad si SI < 0.50 (50%)
```

- Si `SI ≥ 0.50` → **condición normal**, sin evento
- Si `SI < 0.50` → **evaluar criticidad**

### Clasificación de Severidad por SI

**M3.2 UMBRALES DE SEVERIDAD**

| Severidad | Rango SI | Color | Descripción |
|-----------|----------|-------|-------------|
| **GRAVE** | SI < 0.20 (20%) | 🔴 Rojo | Pérdida crítica de estabilidad, riesgo inminente |
| **MODERADA** | 0.20 ≤ SI < 0.35 (35%) | 🟠 Naranja | Pérdida moderada de estabilidad, precaución |
| **LEVE** | 0.35 ≤ SI < 0.50 (50%) | 🟡 Amarillo | Pérdida leve de estabilidad, advertencia |
| **NORMAL** | SI ≥ 0.50 (50%) | 🟢 Verde | Condición estable, sin evento |

```typescript
// ✅ FUNCIÓN CANÓNICA DE CLASIFICACIÓN
function clasificarSeveridadPorSI(si: number): 'GRAVE' | 'MODERADA' | 'LEVE' | null {
    if (si >= 0.50) return null; // Sin evento
    if (si < 0.20) return 'GRAVE';
    if (si < 0.35) return 'MODERADA';
    return 'LEVE';
}
```

### Normalización del SI

**M3.3 SI SIEMPRE EN [0, 1]**

- **Base de datos:** `StabilityMeasurement.si` almacena valores en `[0.0, 1.0]` (decimal)
- **Cálculos:** Todos los umbrales y comparaciones usan `[0, 1]`
- **Visualización:** Frontend convierte a porcentaje: `(si * 100).toFixed(1) + '%'`

```typescript
// ✅ CORRECTO
const si = measurement.si; // 0.27 (ya en [0,1])
if (si < 0.50) {
    const severidad = clasificarSeveridadPorSI(si);
    // ...
}

// ❌ INCORRECTO
const si = measurement.si * 100; // 27 (en [0,100]) - NUNCA HACER
if (si < 30) { // Umbral inconsistente
    // ...
}
```

### Tipos de Eventos

**M3.4 EVENTOS ESTÁNDAR**

| Evento | Variable Clave | Condición Física | Severidad | Descripción |
|--------|----------------|------------------|-----------|-------------|
| `RIESGO_VUELCO` | si | si < 0.50 | Por SI | Pérdida general de estabilidad |
| `VUELCO_INMINENTE` | si, roll, gx | si<0.10 AND (roll>10° OR abs(gx)>30°/s) | GRAVE (forzado) | Combinación crítica |
| `DERIVA_LATERAL_SIGNIFICATIVA` | ay, yaw, gx | abs(yaw_rate - ay/v) > 0.15 rad/s | Por SI | Deslizamiento lateral |
| `DERIVA_PELIGROSA` | gx, yaw | abs(gx)>45 AND si>0.70 | MODERADA/GRAVE | Sobreviraje |
| `MANIOBRA_BRUSCA` | gx, ay | d(gx)/dt>100 OR abs(ay)>3 m/s² | Por SI | Frenazo/cambio brusco |
| `CURVA_ESTABLE` | ay, roll, si | ay>2 AND si>0.60 AND roll<8° | NORMAL (sin guardar) | Maniobra controlada |
| `CAMBIO_CARGA` | roll, ay, si | Δroll>10% AND Δsi>10% | LEVE/MODERADA | Modificación centro de gravedad |
| `ZONA_INESTABLE` | gz, gx | variaciones rápidas en gz y picos en gx | LEVE | Terreno irregular |

**M3.5 REGLAS COMPUESTAS**

Algunos eventos fuerzan severidad independientemente del SI:

```typescript
// Vuelco inminente → SIEMPRE GRAVE
if (si < 0.10 && (Math.abs(roll) > 10 || Math.abs(gx) > 30)) {
    return {
        tipo: 'VUELCO_INMINENTE',
        severidad: 'GRAVE', // Forzado
        // ...
    };
}

// Deriva peligrosa sostenida → GRAVE si dura >2s
if (Math.abs(gx) > 45 && si > 0.70 && duracion > 2000) {
    return {
        tipo: 'DERIVA_PELIGROSA',
        severidad: 'GRAVE', // Forzado
        // ...
    };
}
```

### Persistencia de Eventos

**M3.6 ESTRUCTURA OBLIGATORIA**

```typescript
// stability_events
{
    id: "uuid",
    session_id: "uuid",
    timestamp: DateTime,
    lat: float,
    lon: float,
    type: string,              // Nombre del evento
    speed: float | null,
    rotativoState: int | null, // 0 | 1
    details: {                 // ✅ OBLIGATORIO
        si: number,            // ✅ SIEMPRE incluir SI original
        ax: number,
        ay: number,
        az: number,
        gx: number,
        gy: number,
        gz: number,
        roll: number,
        pitch: number,
        yaw: number
    }
}
```

**M3.7 COEXISTENCIA DE EVENTOS**

Varios eventos pueden coexistir en el mismo timestamp si cumplen condiciones distintas:
- Un punto puede tener `RIESGO_VUELCO` + `MANIOBRA_BRUSCA` simultáneamente
- **NO** duplicar el mismo tipo de evento en el mismo segundo

---

## M4. ÍNDICE DE ESTABILIDAD (SI) - KPI

### Definición
El Índice de Estabilidad (SI) es el KPI principal que mide la seguridad operativa del vehículo.

### Regla Fundamental

**M4.1 KPI SI = PROMEDIO REAL DE StabilityMeasurement.si**

```typescript
// ✅ ÚNICO CÁLCULO VÁLIDO
const siKPI = await prisma.stabilityMeasurement.aggregate({
    where: { 
        sessionId: { in: sessionIds },
        timestamp: { gte: from, lt: to }
    },
    _avg: { si: true }
});

const indiceEstabilidad = siKPI._avg.si || 0; // Ya en [0,1]
```

**❌ FÓRMULAS PROHIBIDAS:**

```typescript
// ❌ NUNCA USAR
indice_promedio = (100 - totalEventos) / 100;
indice_promedio = 1 - (eventosGraves / totalEventos);
indice_promedio = calculoInventado();
```

**M4.2 CALIFICACIÓN POR SI**

| SI | Calificación | Estrellas |
|----|--------------|-----------|
| ≥ 0.90 | EXCELENTE | ⭐⭐⭐⭐⭐ |
| 0.85 - 0.90 | BUENA | ⭐⭐⭐⭐ |
| 0.75 - 0.85 | REGULAR | ⭐⭐⭐ |
| < 0.75 | DEFICIENTE | ⭐⭐ |

```typescript
function calificarSI(si: number): { calificacion: string; estrellas: string } {
    if (si >= 0.90) return { calificacion: 'EXCELENTE', estrellas: '⭐⭐⭐⭐⭐' };
    if (si >= 0.85) return { calificacion: 'BUENA', estrellas: '⭐⭐⭐⭐' };
    if (si >= 0.75) return { calificacion: 'REGULAR', estrellas: '⭐⭐⭐' };
    return { calificacion: 'DEFICIENTE', estrellas: '⭐⭐' };
}
```

**M4.3 MÉTRICAS COMPLEMENTARIAS**

Además del SI promedio, mostrar:
- Distribución de severidades: `{ grave: X, moderada: Y, leve: Z }`
- Total de incidencias: suma de eventos
- Tendencia temporal: SI por día/hora

---

## M5. PUNTOS NEGROS (HOTSPOTS) - CLUSTERING

### Definición
Los puntos negros son zonas geográficas con alta concentración de eventos de estabilidad.

### Reglas de Clustering

**M5.1 RADIO EN METROS**

```typescript
const RADIUS_METERS = 30; // Default, configurable 10-100m

// ✅ Haversine en metros
function haversineDistance(lat1, lon1, lat2, lon2): number {
    const R = 6371; // km
    // ... cálculo estándar ...
    return R * c; // Resultado en km
}

if (haversineDistance(e1.lat, e1.lng, e2.lat, e2.lng) * 1000 <= RADIUS_METERS) {
    // Eventos cercanos
}
```

**M5.2 FRECUENCIA = EVENTOS ÚNICOS**

```typescript
// ✅ CORRECTO - usar Set para IDs únicos
const eventIds = new Set<string>();

eventos.forEach(e => {
    if (distance <= radius) {
        cluster.events.push(e);
        eventIds.add(e.id); // ✅ Solo IDs únicos
    }
});

cluster.frequency = eventIds.size; // ✅ Número de eventos distintos
```

**❌ PROHIBIDO:**

```typescript
// ❌ NO incrementar contador directamente
cluster.frequency++; // Puede contar duplicados
```

**M5.3 DEDUPLICACIÓN EN ORIGEN**

```sql
-- ✅ Query con DISTINCT
SELECT DISTINCT ON (id)
    id, lat, lon, timestamp, type, session_id
FROM stability_events
WHERE timestamp >= :from AND timestamp < :to
ORDER BY id, timestamp DESC;
```

**M5.4 SEVERIDAD DOMINANTE**

```typescript
// Calcular severidad del cluster por mayoría
const counts = cluster.severity_counts; // { grave: 5, moderada: 20, leve: 8 }

const dominantSeverity = Object.entries(counts)
    .reduce((max, [sev, count]) => 
        count > max.count ? { severity: sev, count } : max
    , { severity: 'leve', count: 0 })
    .severity;

cluster.dominantSeverity = dominantSeverity;
```

**M5.5 NO RECALCULAR AL ABRIR**

Al expandir un cluster, **SIEMPRE** mostrar los `cluster.events` ya calculados, **NUNCA** recalcular en el backend.

---

## M6. VELOCIDAD - LÍMITES Y VIOLACIONES

### Límites de Velocidad DGT (Camiones Pesados + Emergencia)

**M6.1 TABLA DE LÍMITES**

| Tipo de Vía | Límite Normal | Límite con Rotativo ON |
|-------------|---------------|------------------------|
| Autopista/Autovía | 90 km/h | 120 km/h |
| Carretera arcén ≥1.5m | 80 km/h | 110 km/h |
| Resto vías fuera poblado | 70 km/h | 100 km/h |
| Urbana | 50 km/h | 80 km/h |
| Parque (interno) | 20 km/h | 20 km/h (sin excepción) |

```typescript
const DGT_LIMITS = {
    vehiculo_emergencia: {
        highway: { normal: 90, emergency: 120 },
        interurban: { normal: 80, emergency: 110 },
        urban: { normal: 50, emergency: 80 },
        park: { normal: 20, emergency: 20 }
    }
};

function getSpeedLimit(roadType: string, rotativoOn: boolean, inPark: boolean): number {
    if (inPark) return 20; // Sin excepción
    
    const limits = DGT_LIMITS.vehiculo_emergencia[roadType];
    return rotativoOn ? limits.emergency : limits.normal;
}
```

**M6.2 CLASIFICACIÓN DE VIOLACIONES**

| Tipo | Condición | Descripción |
|------|-----------|-------------|
| `correcto` | velocidad ≤ límite | Sin exceso |
| `leve` | 0 < exceso ≤ 10 km/h | Exceso leve |
| `moderada` | 10 < exceso ≤ 20 km/h | Exceso moderado |
| `grave` | exceso > 20 km/h | Exceso grave |

```typescript
// ✅ FUNCIÓN CANÓNICA
function classifySpeedViolation(
    speed: number, 
    speedLimit: number
): 'correcto' | 'leve' | 'moderada' | 'grave' {
    const excess = speed - speedLimit;
    
    if (excess <= 0) return 'correcto';
    if (excess <= 10) return 'leve';
    if (excess <= 20) return 'moderada'; // ✅ OBLIGATORIO
    return 'grave';
}
```

**M6.3 TIPO DE VÍA**

**Preferencia:** Usar TomTom Speed Limits API o Radar.com.

**Fallback (temporal):** Heurística por velocidad:

```typescript
function getRoadType(speed: number, inPark: boolean): 'urban' | 'interurban' | 'highway' {
    if (inPark) return 'urban';
    if (speed > 100) return 'highway';
    if (speed > 70) return 'interurban';
    return 'urban';
}
```

**M6.4 PERSISTENCIA**

```typescript
model SpeedViolation {
  id            String   @id @default(uuid())
  sessionId     String
  timestamp     DateTime
  lat           Float
  lon           Float
  speed         Float
  speedLimit    Float
  excess        Float
  violationType String   // 'correcto' | 'leve' | 'moderada' | 'grave'
  roadType      String
  rotativoOn    Boolean
  inPark        Boolean
  
  Session       Session  @relation(...)
  
  @@index([sessionId, violationType])
  @@index([timestamp])
}
```

**M6.5 SIN LÍMITES ARTIFICIALES**

❌ **PROHIBIDO:**
```typescript
const sessions = await prisma.session.findMany({ take: 5 }); // ❌
const limitedIds = sessionIds.slice(0, 2); // ❌
```

✅ **OBLIGATORIO:** Procesar TODAS las sesiones en el rango (con paginación/batching si es necesario).

---

## M7. GEOCERCAS - RADAR.COM Y FALLBACK

### Fuentes de Geocercas

**M7.1 JERARQUÍA DE FUENTES**

1. **Radar.com** (preferente)
2. **Base de datos local** (fallback)

```typescript
const USE_RADAR = process.env.RADAR_SECRET_KEY && 
                  process.env.RADAR_SECRET_KEY !== 'your-radar-secret-key';
```

**M7.2 LOGGING OBLIGATORIO DE USO**

```typescript
model GeofenceUsageLog {
  id             String   @id @default(uuid())
  timestamp      DateTime @default(now())
  source         String   // 'radar.com' | 'local_db'
  organizationId String
  operation      String   // 'getParks' | 'isInGeofence'
  success        Boolean
  apiCalls       Int      @default(1)
  
  @@index([timestamp, source])
}

// ✅ Registrar cada uso
async function getParks(orgId: string) {
    if (USE_RADAR) {
        try {
            const parks = await radar.getParks(orgId);
            
            await prisma.geofenceUsageLog.create({
                data: { source: 'radar.com', organizationId: orgId, operation: 'getParks', success: true }
            });
            
            return parks;
        } catch (error) {
            await prisma.geofenceUsageLog.create({
                data: { source: 'radar.com', organizationId: orgId, operation: 'getParks', success: false }
            });
        }
    }
    
    // Fallback local
    const parks = await prisma.park.findMany({ where: { organizationId: orgId } });
    
    await prisma.geofenceUsageLog.create({
        data: { source: 'local_db', organizationId: orgId, operation: 'getParks', success: true }
    });
    
    return parks;
}
```

**M7.3 GEOMETRÍA**

```typescript
// Estructura obligatoria
interface Geofence {
    type: 'circle' | 'polygon';
    center?: { lat: number; lng: number }; // para circle
    radius?: number;                        // metros, para circle
    coordinates?: Array<{lat: number; lng: number}>; // para polygon
}
```

**M7.4 DETECCIÓN**

```typescript
function isInCircleGeofence(lat: number, lon: number, geofence: Geofence): boolean {
    const distanceKm = haversineDistance(lat, lon, geofence.center.lat, geofence.center.lng);
    const distanceM = distanceKm * 1000;
    return distanceM <= geofence.radius;
}
```

---

## M8. FILTROS GLOBALES - VALIDACIÓN Y TIMEZONE

### Filtros Obligatorios

**M8.1 VALIDACIÓN DE RANGO DE FECHAS**

```typescript
// ✅ OBLIGATORIO
if (!from || !to) {
    return res.status(400).json({
        success: false,
        error: 'Rango de fechas obligatorio: from, to (YYYY-MM-DD)'
    });
}

const dateFrom = new Date(from);
const dateTo = new Date(to);

if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido'
    });
}
```

**M8.2 TIMEZONE ÚNICO: Europe/Madrid**

```typescript
import { parseISO, setHours, setMinutes, setSeconds, zonedTimeToUtc } from 'date-fns-tz';

const TZ = 'Europe/Madrid';

// Convertir from a 00:00:00 Madrid → UTC
const dateFromLocal = setSeconds(setMinutes(setHours(parseISO(from), 0), 0), 0);
const dateFromUTC = zonedTimeToUtc(dateFromLocal, TZ);

// Convertir to a 23:59:59.999 Madrid → UTC
const dateToLocal = setSeconds(setMinutes(setHours(parseISO(to), 23), 59), 59);
const dateToUTC = zonedTimeToUtc(dateToLocal, TZ);
```

**M8.3 FILTRO DE VEHÍCULOS**

```typescript
const vehicleIds = req.query.vehicleIds ? 
    (Array.isArray(req.query.vehicleIds) ? req.query.vehicleIds : [req.query.vehicleIds]) 
    : [];

// ✅ Si vehicleIds vacío → 204 No Content
if (vehicleIds.length === 0) {
    return res.status(204).send();
}

// ✅ Siempre filtrar
const sessions = await prisma.session.findMany({
    where: {
        organizationId,
        vehicleId: { in: vehicleIds } // ✅ NUNCA undefined
    }
});
```

**M8.4 METADATA EN RESPUESTAS**

```typescript
// ✅ Todas las respuestas incluyen metadata
res.json({
    success: true,
    data: { /* ... */ },
    meta: {
        from: from,
        to: to,
        vehicleIds: vehicleIds,
        timezone: 'Europe/Madrid',
        totalRows: data.length,
        durationMs: Date.now() - startTime,
        geofenceSource: 'radar.com' // o 'local_db'
    }
});
```

---

## M9. UPLOAD Y POST-PROCESAMIENTO

### Flujo Obligatorio

**M9.1 PIPELINE DE UPLOAD**

```
1. Upload archivos (FormData)
   ↓
2. Validar nombres y cabeceras
   ↓
3. Agrupar por vehículo y fecha
   ↓
4. Detectar sesiones múltiples (gaps >5min)
   ↓
5. Parsear archivos (GPS, ESTABILIDAD, ROTATIVO, CAN)
   ↓
6. Interpolar GPS si es necesario
   ↓
7. Crear Session en BD
   ↓
8. Guardar Measurements (GPS, Stability, Rotativo)
   ↓
9. POST-PROCESO (obligatorio):
   9a. detectarYGuardarEventos(sessionId)
   9b. analizarVelocidades(sessionId) → guardar SpeedViolations
   9c. calcularSegmentosClaves(sessionId) → guardar OperationalStateSegment
   ↓
10. Respuesta con estadísticas
```

**M9.2 POST-PROCESO OBLIGATORIO**

```typescript
// ✅ DESPUÉS de crear cada sesión
for (const sessionId of createdSessionIds) {
    // 1. Eventos de estabilidad
    await eventDetector.detectarYGuardarEventos(sessionId);
    
    // 2. Violaciones de velocidad
    await speedAnalyzer.analizarVelocidades([sessionId]);
    
    // 3. Segmentos de clave
    await keyCalculator.calcularYGuardarSegmentos(sessionId);
}
```

**M9.3 VALIDACIONES DE ARCHIVOS**

```typescript
// Pattern de nombres
const FILE_PATTERN = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d+)_(\d{8})_(\d{3})\.txt$/;

function validateFileName(filename: string): { tipo: string; vehiculo: string; fecha: string } | null {
    const match = filename.match(FILE_PATTERN);
    if (!match) return null;
    
    return {
        tipo: match[1],
        vehiculo: `doback${match[2]}`,
        fecha: `${match[3].slice(0,4)}-${match[3].slice(4,6)}-${match[3].slice(6,8)}`
    };
}
```

**M9.4 NO INVENTAR DATOS**

Si falta un tipo de archivo (por ejemplo, solo hay GPS pero no ESTABILIDAD):
- ✅ Crear sesión parcial
- ✅ Marcar en BD: `partial: true`, `missingFiles: ['ESTABILIDAD']`
- ❌ **NUNCA** generar eventos sin datos de estabilidad
- ❌ **NUNCA** interpolar datos de estabilidad

---

## M10. OBSERVABILIDAD Y LOGS

### Logging Mínimo

**M10.1 NIVELES DE LOG**

```typescript
logger.info('Operación normal', { contexto });
logger.warn('Advertencia', { contexto });
logger.error('Error recuperable', { error, contexto });
logger.fatal('Error crítico', { error, contexto });
```

**M10.2 LOGS OBLIGATORIOS POR ENDPOINT**

```typescript
router.get('/api/kpis/summary', async (req, res) => {
    const startTime = Date.now();
    
    logger.info('📊 Calculando KPIs', { 
        from: req.query.from, 
        to: req.query.to, 
        vehicleIds: req.query.vehicleIds 
    });
    
    try {
        // ... lógica ...
        
        logger.info('✅ KPIs calculados', { 
            sesiones: result.sesiones_analizadas,
            km: result.km_total,
            durationMs: Date.now() - startTime
        });
        
        res.json({ success: true, data: result, meta: { /* ... */ } });
    } catch (error) {
        logger.error('❌ Error calculando KPIs', { error });
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**M10.3 TELEMETRÍA DE QUERIES**

```typescript
// Log de queries pesadas
logger.info('🔍 Query: stability_events', {
    where: { timestamp: { gte, lt }, sessionId: { in: ids } },
    resultCount: events.length,
    durationMs: queryDuration
});
```

---

## 📋 CHECKLIST DE CUMPLIMIENTO

Antes de deploy/merge, verificar:

- [ ] **M1:** Rotativo solo '0' | '1', nunca inferido
- [ ] **M2:** Claves con prioridad correcta, segmentos persistidos, Clave 4 implementada
- [ ] **M3:** Eventos solo si SI<0.50, severidad por umbrales 0.20/0.35, SI en [0,1]
- [ ] **M4:** KPI SI = AVG(si), nunca `(100-eventos)/100`
- [ ] **M5:** Clustering con radio en metros, frecuencia=eventos únicos (Set)
- [ ] **M6:** Velocidad con 'moderada' (10-20 km/h), sin límites artificiales de sesiones
- [ ] **M7:** Logging de uso de Radar.com, fallback a BD local
- [ ] **M8:** Filtros validados (400 si faltan), TZ Europe/Madrid, metadata en respuestas
- [ ] **M9:** Post-proceso obligatorio (eventos + velocidad + claves) tras upload
- [ ] **M10:** Logs info/warn/error, telemetría de queries pesadas

---

## ⚠️ VIOLACIONES Y EXCEPCIONES

**Si necesitas violar un mandamiento:**
1. Documentar razón técnica
2. Obtener aprobación explícita
3. Añadir comentario en código: `// VIOLACIÓN AUTORIZADA M3.2: razón`
4. Registrar en changelog

**Violaciones NO permitidas:**
- Cambiar normalización de SI
- Eliminar persistencia de segmentos
- Quitar post-procesamiento
- Cambiar umbrales de severidad sin justificación técnica

---

**FIN DE MANDAMIENTOS - Versión 1.0**

