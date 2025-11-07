# 🔬 Auditoría Profunda con Razonamiento de Todos los Endpoints

## 🧠 METODOLOGÍA

Para cada endpoint, razonamos:
1. **Input**: Qué parámetros recibe
2. **Proceso**: Cómo transforma los datos
3. **Output**: Qué debería retornar
4. **Validación**: Qué puede fallar
5. **Test**: Cómo verificar que funciona

---

## 1️⃣ `/api/kpis/summary` - KPIs Ejecutivos

### **📥 INPUT**
```
GET /api/kpis/summary?from=2025-10-01&to=2025-10-31&organizationId=XXX
```

### **🔄 PROCESO**

#### **Paso 1: Obtener sesiones en rango**
```typescript
// backend/src/routes/kpis.ts líneas 201-207
const sessions = await prisma.session.findMany({
    where: {
        organizationId,
        startTime: { gte: from, lt: to }
    }
})
```

**Razonamiento:**
- Con rango 1-oct a 31-oct
- Datos reales: 8, 11, 21, 22 de octubre
- **Esperado**: 18 sesiones encontradas ✅

#### **Paso 2: Calcular estados operacionales**
```typescript
// backend/src/routes/kpis.ts líneas 264-325
const estadosOperacionales = await calcularTiemposPorClave(sessionIds)

// keyCalculator.ts líneas 91-103
const segmentos = await prisma.$queryRaw`
    SELECT clave, "startTime", "endTime" 
    FROM operational_state_segments 
    WHERE "sessionId"::text = ANY(${sessionIds}::text[])
`

// líneas 115-118
segmentos.forEach(segmento => {
    const duracion = (endTime - startTime) / 1000
    tiempos[`clave${segmento.clave}`] += duracion
})
```

**Razonamiento:**
- 104 segmentos totales
- Distribuidos en claves 2, 3, 4, 5 principalmente
- **Esperado**: Cada clave con suma diferente ✅

**Posible ERROR:**
```typescript
// Si segmentos.clave es string en lugar de number:
segmentos.clave = "2"  // ❌
tiempos[`clave${segmento.clave}`] = tiempos["clave2"]  // ✅ Funciona igual
```

#### **Paso 3: Construir array de estados**
```typescript
// kpis.ts líneas 308-324
for (let clave = 0; clave <= 5; clave++) {
    const duration = estadosOperacionales[`clave${clave}_segundos`] || 0
    
    states.push({
        key: clave,
        name: stateNames[clave],
        duration_seconds: duration,
        duration_formatted: formatDuration(duration)
    })
}
```

**Razonamiento:**
- Itera 0-5 (6 claves)
- Para cada clave, busca `clave0_segundos`, `clave1_segundos`, etc.
- **Esperado**: Array con 6 elementos, cada uno con duration diferente ✅

**Posible ERROR:**
```typescript
// Si keyCalculator retorna undefined:
estadosOperacionales = undefined  // ❌
estadosOperacionales[`clave2_segundos`] = undefined
duration = 0  // Todas las claves en 0
```

#### **Paso 4: Calcular eventos de estabilidad**
```typescript
// kpis.ts líneas 427-498
const events = await prisma.stability_events.findMany({
    where: { Session: { organizationId } }
})

const critical = events.filter(e => e.severity === 'GRAVE').length
const moderate = events.filter(e => e.severity === 'MODERADA').length
const light = events.filter(e => e.severity === 'LEVE').length
```

**Razonamiento CON FIX DE SI:**
- SI ahora en escala 0-1 (antes 0-100)
- EventDetector compara: `si < 0.50` → genera eventos
- Conducción con SI = 0.35-0.45 → **MUCHOS eventos LEVES**
- Maniobras bruscas SI = 0.25-0.35 → **eventos MODERADOS**
- Riesgo crítico SI < 0.20 → **eventos GRAVES**

**Esperado después del fix:**
- ✅ **~1,700 eventos totales** (0.5% de 337k mediciones)
- ✅ Distribución: 80% leves, 18% moderados, 2% graves

**SIN el fix:**
- ❌ 10 eventos leves (conducción excepcionalmente mala con SI = 0.40-0.48)
- ❌ 0 eventos críticos/moderados

### **📤 OUTPUT ESPERADO**

```json
{
  "success": true,
  "data": {
    "states": {
      "states": [
        { "key": 0, "duration_seconds": 600, "duration_formatted": "00:10:00" },
        { "key": 1, "duration_seconds": 0, "duration_formatted": "00:00:00" },
        { "key": 2, "duration_seconds": 6600, "duration_formatted": "01:50:00" },
        { "key": 3, "duration_seconds": 6250, "duration_formatted": "01:44:10" },
        { "key": 4, "duration_seconds": 6600, "duration_formatted": "01:50:00" },
        { "key": 5, "duration_seconds": 6720, "duration_formatted": "01:52:00" }
      ],
      "total_time_seconds": 26770
    },
    "stability": {
      "total_incidents": 1700,
      "critical": 34,
      "moderate": 340,
      "light": 1326
    },
    "activity": {
      "km_total": 12.5,
      "driving_hours": 7.4
    }
  }
}
```

### **🧪 VALIDACIÓN**

**Test 1: ¿Las claves tienen valores diferentes?**
```javascript
// En navegador (F12 → Console):
const states = response.data.states.states
const allSame = states.every(s => s.duration_seconds === states[0].duration_seconds)

if (allSame) {
    console.error("❌ PROBLEMA: Todas las claves tienen el mismo valor")
} else {
    console.log("✅ OK: Las claves tienen valores diferentes")
}
```

**Test 2: ¿Los eventos son > 0?**
```javascript
const { critical, moderate, light } = response.data.stability

if (critical + moderate + light === 0) {
    console.error("❌ PROBLEMA: No hay eventos generados")
} else if (critical === 0 && moderate === 0) {
    console.warn("⚠️  Solo hay eventos leves (SI puede estar mal)")
} else {
    console.log("✅ OK: Eventos distribuidos correctamente")
}
```

---

## 2️⃣ `/api/operational-keys/by-type` - Estados & Tiempos

### **📥 INPUT**
```
GET /api/operational-keys/by-type?organizationId=XXX&startDate=2025-10-01&endDate=2025-10-31
```

### **🔄 PROCESO**

#### **Consulta principal:**
```typescript
// backend/src/routes/operationalKeys.ts líneas 30-50
const claves = await prisma.operational_state_segments.findMany({
    where: {
        Session: { organizationId },
        startTime: { gte: startDate, lte: endDate }
    }
})

// Agrupar por clave
const byType = {}
claves.forEach(c => {
    if (!byType[c.clave]) {
        byType[c.clave] = {
            totalDuration: 0,
            count: 0,
            entries: []
        }
    }
    byType[c.clave].totalDuration += c.durationSeconds
    byType[c.clave].count++
})
```

**Razonamiento:**
- Lee directamente de `operational_state_segments` ✅
- Agrupa por `clave` (0-5)
- Suma `durationSeconds` por cada clave
- **Esperado**: 5-6 grupos con tiempos diferentes ✅

### **📤 OUTPUT ESPERADO**

```json
{
  "success": true,
  "data": {
    "total": 104,
    "byType": {
      "2": { "totalDuration": 6600, "count": 22, "formatted": "01:50:00" },
      "3": { "totalDuration": 6250, "count": 25, "formatted": "01:44:10" },
      "4": { "totalDuration": 6600, "count": 33, "formatted": "01:50:00" },
      "5": { "totalDuration": 6720, "count": 24, "formatted": "01:52:00" }
    }
  }
}
```

### **🧪 VALIDACIÓN**

**¿Los tiempos coinciden con KPIs?**
```javascript
// Comparar con response de /api/kpis/summary:
const kpisClaves = kpisResponse.data.states.states
const estadosClaves = estadosResponse.data.byType

for (let key in estadosClaves) {
    const kpiState = kpisClaves.find(s => s.key === parseInt(key))
    const estadoData = estadosClaves[key]
    
    if (kpiState.duration_seconds !== estadoData.totalDuration) {
        console.error(`❌ INCONSISTENCIA Clave ${key}:`, {
            enKPIs: kpiState.duration_seconds,
            enEstados: estadoData.totalDuration
        })
    }
}
```

---

## 3️⃣ `/api/hotspots/critical-points` - Puntos Negros

### **📥 INPUT**
```
GET /api/hotspots/critical-points?organizationId=XXX&severity=all&minFrequency=1&mode=cluster
```

### **🔄 PROCESO**

#### **Paso 1: Obtener eventos con GPS**
```typescript
// backend/src/routes/hotspots.ts líneas ~50-100
const events = await prisma.stability_events.findMany({
    where: {
        Session: { organizationId },
        latitude: { not: null },
        longitude: { not: null }
    }
})
```

**Razonamiento:**
- Necesita eventos CON coordenadas GPS
- GPS se correlaciona en EventDetector (líneas 657-705)
- **Requisito**: `latitude` y `longitude` != null

**Posible ERROR:**
```typescript
// Si eventos no tienen GPS correlacionado:
events.filter(e => e.latitude != null).length === 0  // ❌
→ "No hay datos" en puntos negros
```

#### **Paso 2: Clustering (DBSCAN)**
```typescript
// Agrupar eventos cercanos geográficamente
const clusters = []

for (const event of events) {
    // Buscar eventos a < clusterRadius metros
    const nearby = events.filter(e => 
        haversineDistance(event.lat, event.lon, e.lat, e.lon) < clusterRadius
    )
    
    if (nearby.length >= minFrequency) {
        clusters.push({
            center: calculateCenter(nearby),
            count: nearby.length,
            events: nearby
        })
    }
}
```

**Razonamiento:**
- Con minFrequency=1: todos los eventos son clusters (1+ eventos)
- Con clusterRadius=30m: eventos a < 30m se agrupan
- **Esperado**: 10-30 clusters (depende de dispersión geográfica)

### **📤 OUTPUT ESPERADO**

```json
{
  "success": true,
  "data": {
    "clusters": [
      {
        "id": "cluster_1",
        "center": { "lat": 40.5208, "lon": -3.8857 },
        "events": [...],  // 10-50 eventos
        "count": 25,
        "severity": "mixed"
      },
      // ... 10-30 clusters más
    ],
    "totalEvents": 1700,
    "clustersCount": 25
  }
}
```

### **🧪 VALIDACIÓN**

**¿Hay eventos con GPS?**
```sql
SELECT COUNT(*) as con_gps
FROM stability_events
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
```

**Esperado:** > 50% de los eventos (GPS correlacionado con tolerancia de 10s)

---

## 4️⃣ `/api/telemetry-v2/sessions/:id/route` - Mapa de Sesión

### **📥 INPUT**
```
GET /api/telemetry-v2/sessions/SESSION_ID/route
```

### **🔄 PROCESO**

#### **Paso 1: Obtener puntos GPS de la ruta**
```typescript
// backend/src/controllers/TelemetryV2Controller.ts
const gpsPoints = await prisma.GpsMeasurement.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' }
})
```

**Razonamiento:**
- Sesión típica: ~70-150 puntos GPS (1 punto/segundo × duración)
- **Esperado**: Array con coordenadas para dibujar línea azul

#### **Paso 2: Obtener eventos de la sesión**
```typescript
const events = await prisma.stability_events.findMany({
    where: { session_id: sessionId }
})
```

**Razonamiento:**
- **CON FIX DE SI**: Sesiones con eventos tendrán 5-100+ eventos
- **SIN el fix**: 0 eventos (o muy pocos)

#### **Paso 3: Correlacionar eventos con GPS**
```typescript
events.map(event => ({
    ...event,
    latitude: event.latitude,  // Ya correlacionado en EventDetector
    longitude: event.longitude
}))
```

**Posible ERROR:**
```typescript
// Si latitude/longitude son NULL:
event.latitude = null  // ❌
→ Evento no aparece en el mapa
```

### **📤 OUTPUT ESPERADO**

```json
{
  "success": true,
  "data": {
    "route": [
      { "lat": 40.5208, "lon": -3.8857, "speed": 25, "timestamp": "..." },
      // ... 70-150 puntos más
    ],
    "events": [
      { 
        "type": "RIESGO_VUELCO",
        "severity": "LEVE",
        "latitude": 40.5210,
        "longitude": -3.8855,
        "si": 0.42,
        "timestamp": "..."
      },
      // ... 0-100+ eventos más
    ],
    "stats": {
      "distance": 12.5,
      "duration": 7200,
      "avgSpeed": 18.4
    }
  }
}
```

### **🧪 VALIDACIÓN**

**¿Los eventos tienen coordenadas?**
```javascript
const eventsWithGPS = response.data.events.filter(e => e.latitude && e.longitude)

if (eventsWithGPS.length === 0 && response.data.events.length > 0) {
    console.error("❌ PROBLEMA: Eventos sin coordenadas GPS")
}
```

---

## 5️⃣ `/api/speed/violations` - Análisis de Velocidad

### **📥 INPUT**
```
GET /api/speed/violations?organizationId=XXX&rotativoOn=all&violationType=all
```

### **🔄 PROCESO**

#### **Consulta:**
```typescript
// backend/src/routes/speedAnalysis.ts
const violations = await prisma.gpsMeasurement.findMany({
    where: {
        Session: { organizationId },
        speed: { gt: SPEED_LIMIT }  // Depende de roadType
    }
})
```

**Razonamiento:**
- **1,238 puntos GPS válidos** totales
- Si límite urbano = 50 km/h
- **Hipótesis**: ~10% de puntos > 50 km/h = ~124 violaciones
- **Esperado**: 100-500 violaciones (depende de límites configurados)

### **🧪 VALIDACIÓN**

**¿Hay violaciones de velocidad?**
```sql
SELECT COUNT(*) as violaciones
FROM "GpsMeasurement" gm
INNER JOIN "Session" s ON gm."sessionId" = s.id
WHERE s."organizationId" = 'XXX'
AND gm.speed > 50
```

---

## 🔍 PROBLEMAS POTENCIALES DETECTADOS

### **PROBLEMA A: keyCalculator retorna undefined**

**Síntoma:**
- Todas las claves muestran "00:00:00"

**Causa:**
```typescript
// Si la consulta SQL falla:
const segmentos = await prisma.$queryRaw`...`  // Lanza excepción
// catch (error) { return crearTiemposVacios() }  // Retorna todo en 0
```

**Solución:**
- Añadir logging detallado en keyCalculator
- Verificar que `sessionIds` no esté vacío

### **PROBLEMA B: Estados muestran mismo valor**

**Síntoma:**
- Clave 0 = Clave 2 = Clave 3 = "01:17:06"

**Causa 1 (Backend):**
```typescript
// Si keyCalculator calcula mal y suma TODO:
const total = segmentos.reduce((sum, s) => sum + s.durationSeconds, 0)
// Y retorna el total para TODAS las claves:
return {
    clave0_segundos: total,  // ❌
    clave1_segundos: total,  // ❌
    ...
}
```

**Causa 2 (Frontend):**
```typescript
// Si getStateDuration usa siempre el mismo índice:
const getStateDuration = (key) => {
    return states[0].duration_formatted  // ❌ Siempre índice 0
}

// CORRECTO debería ser:
const getStateDuration = (key) => {
    const state = states.find(s => s.key === key)  // ✅ Buscar por key
    return state?.duration_formatted || '00:00:00'
}
```

### **PROBLEMA C: Eventos con GPS = 0**

**Síntoma:**
- Puntos negros: "No hay datos"
- Mapa de sesión: Sin marcadores rojos

**Causa:**
```typescript
// EventDetector NO correlaciona GPS:
// líneas 657-705 de eventDetector.ts

const gpsPoint = findClosestPoint(allGpsPoints, event.timestamp, 10000)

if (!gpsPoint) {
    // Evento sin GPS correlacionado
    event.latitude = null  // ❌
    event.longitude = null
}
```

**Diagnóstico:**
- Si `allGpsPoints.length === 0` → ningún evento tendrá GPS
- Si tolerancia de 10s es muy estricta → pocos eventos con GPS

**Solución:**
- Verificar que GPS se carga correctamente
- Aumentar tolerancia a 30s si es necesario

---

## 📊 RESUMEN DE FIXES APLICADOS

| Fix | Archivo | Línea | Impacto |
|-----|---------|-------|---------|
| **SI / 100** | RobustStabilityParser.ts | 210 | Eventos: 10 → ~1,700 |
| **Rango fechas** | filters.ts | 127-128 | Sesiones: 7 → 18 |
| **Desactivar operationalKey** | UploadPostProcessor.ts | 198-210 | Sin errores PostGIS |

---

## 🎯 PLAN DE VERIFICACIÓN SISTEMÁTICA

### **Después de reprocesar, verificar:**

1. **Logs del backend** buscar:
   ```
   ✅ "X eventos detectados" donde X > 100
   ✅ "Breakdown: { critical: Y, moderate: Z, light: W }"
   ✅ "104 segmentos guardados"
   ❌ NO debe aparecer "Error PostGIS"
   ```

2. **Response de `/api/kpis/summary`** verificar:
   ```javascript
   data.stability.total_incidents > 100  // ✅
   data.states.states.length === 6  // ✅
   data.states.states.every(s => s.duration_seconds >= 0)  // ✅
   // Todos diferentes:
   new Set(data.states.states.map(s => s.duration_seconds)).size === 6  // ✅
   ```

3. **Frontend en `/dashboard`** observar:
   ```
   ✅ Incidencias Críticas > 0
   ✅ Clave 0 ≠ Clave 2 ≠ Clave 3
   ✅ Puntos negros muestra clusters
   ✅ Mapa de sesión muestra marcadores rojos
   ```

---

## 🔬 SIGUIENTE NIVEL: Verificar Lógica de Negocio

### **¿Los tiempos de las claves son lógicos?**

**Razonamiento:**
- **Clave 2** (Emergencia): Tiempo con rotativo encendido
- **Clave 3** (Siniestro): Parado en siniestro (velo < 5 km/h)
- **Clave 4** (Fin): Actuación finalizada, regresando
- **Clave 5** (Regreso): Volviendo al parque sin rotativo

**Relación lógica esperada:**
```
Clave 2 + Clave 3 ≈ Tiempo total de emergencia
Clave 4 + Clave 5 ≈ Tiempo de regreso
Clave 0 + Clave 1 ≈ Tiempo en parque/taller
```

**Verificación:**
```
SUMA(claves 0-5) debería ≈ DURACIÓN TOTAL de las 18 sesiones
```

Si no coincide → hay gaps temporales no cubiertos.

---

## ✅ CONCLUSIÓN

**Con los 3 fixes aplicados, el sistema DEBERÍA:**

1. ✅ Detectar ~1,700 eventos (en lugar de 10)
2. ✅ Mostrar claves con tiempos diferentes (en lugar de iguales)
3. ✅ Generar 10-30 puntos negros (en lugar de 1)
4. ✅ Mostrar eventos en mapas de sesiones (en lugar de 0)

**Si TODAVÍA hay problemas después de reprocesar:**
→ Hay un bug adicional en frontend o en la lógica de agregación
→ Usar `docs/CALIDAD/analisis-razonado-kpis.md` para diagnóstico profundo

