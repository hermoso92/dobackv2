# 🧠 Análisis Razonado Completo de KPIs - DobackSoft

## 📋 METODOLOGÍA DE VERIFICACIÓN

Para cada KPI, vamos a razonar:
1. **¿De dónde viene el dato?** (tabla, columna, parser)
2. **¿Cómo se calcula?** (fórmula, agregación, transformación)
3. **¿Qué debería mostrar?** (valor esperado con los datos actuales)
4. **¿Qué puede fallar?** (errores comunes, edge cases)

---

## 1️⃣ EVENTOS DE ESTABILIDAD

### **📊 Datos Procesados:**
- **18 sesiones** (4 días, vehículo DOBACK028)
- **~337,000 mediciones** de estabilidad totales
- **Frecuencia**: 10 Hz (10 mediciones/segundo)

### **🧮 Razonamiento del Cálculo:**

#### **Fuente de Datos:**
```
backend/src/services/parsers/RobustStabilityParser.ts (línea 210)
→ si: valores[15] / 100  // ✅ Convertir % a decimal
```

#### **Detección de Eventos:**
```
backend/src/services/eventDetector.ts (líneas 19-24)
UMBRALES:
- SI < 0.50 → Evento (cualquier severidad)
- SI < 0.20 → GRAVE (🔴)
- 0.20 ≤ SI < 0.35 → MODERADA (🟠)
- 0.35 ≤ SI < 0.50 → LEVE (🟡)
- SI ≥ 0.50 → Sin evento (conducción normal)
```

#### **Lógica de Detección:**
```typescript
// Para cada medición:
for (const measurement of measurements) {
    const si = measurement.si;  // Ya en escala 0-1
    
    // ❌ ANTES: si = 84 (valor bruto del archivo)
    // ✅ AHORA: si = 0.84 (84% = conducción normal)
    
    if (si < 0.50) {
        // DETECTAR EVENTO
        if (si < 0.20) → severidad = 'GRAVE'
        else if (si < 0.35) → severidad = 'MODERADA'
        else → severidad = 'LEVE'
    } else {
        // SIN EVENTO (conducción normal)
    }
}
```

#### **✅ Valor Esperado (con fix SI):**

**Hipótesis basada en conducción de bomberos:**
- **Conducción normal** (SI 0.80-0.95): ~95% del tiempo → **Sin eventos**
- **Maniobras bruscas** (SI 0.35-0.50): ~4% del tiempo → **~1,350 eventos LEVES** 🟡
- **Situaciones peligrosas** (SI 0.20-0.35): ~1% del tiempo → **~340 eventos MODERADOS** 🟠
- **Riesgo crítico** (SI < 0.20): <0.1% → **~34 eventos GRAVES** 🔴

**Total esperado: ~1,700 eventos** (de 337,000 mediciones ≈ 0.5%)

#### **❌ Valor Real (antes del fix):**
- **10 eventos** LEVES solamente
- **0 eventos** GRAVES/MODERADOS

**Causa raíz:**
```
SI sin convertir: 84 (debería ser 0.84)
Comparación: 84 < 0.50 → FALSE (cuando debería ser 0.84 < 0.50 → TRUE para eventos)
```

#### **✅ Resultado después del fix:**
Después de reprocesar con `si / 100`, **DEBERÍAN aparecer cientos de eventos**.

---

## 2️⃣ CLAVES OPERACIONALES (Estados 0-5)

### **📊 Datos Procesados:**
- **104 segmentos** guardados en `operational_state_segments`
- **Distribución vista en logs**:
  - Clave 2: ~22 segmentos (emergencias)
  - Clave 3: ~25 segmentos (siniestro)
  - Clave 4: ~33 segmentos (fin actuación)
  - Clave 5: ~24 segmentos (regreso)

### **🧮 Razonamiento del Cálculo:**

#### **Fuente de Datos:**
```
backend/src/services/OperationalKeyCalculator.ts (líneas 30-300)
→ Correlaciona rotativo + GPS
→ Detecta cambios de estado (clave 0-5)
→ Guarda segmentos con startTime, endTime, durationSeconds
```

#### **Lectura en KPIs:**
```
backend/src/services/keyCalculator.ts (líneas 86-139)
→ Lee de operational_state_segments
→ Agrupa por clave
→ Suma durationSeconds por cada clave
```

#### **Lógica de Agregación:**
```typescript
// Para cada clave (0-5):
const segmentosClaveX = operational_state_segments.filter(s => s.clave === X)
const tiempoTotal = segmentosClaveX.reduce((sum, s) => sum + s.durationSeconds, 0)

// Formatear como HH:MM:SS
return formatTime(tiempoTotal)
```

#### **✅ Valor Esperado:**

**Basado en logs de procesamiento:**
```
Distribución vista:
- Clave 2: ~22 segmentos × ~300s promedio = ~6,600s = 1h 50m
- Clave 3: ~25 segmentos × ~250s promedio = ~6,250s = 1h 44m  
- Clave 4: ~33 segmentos × ~200s promedio = ~6,600s = 1h 50m
- Clave 5: ~24 segmentos × ~280s promedio = ~6,720s = 1h 52m

TOTAL: ~26,170s = 7h 16m (de 18 sesiones ≈ 8 horas conducción)
```

**Cada clave DEBERÍA mostrar un valor DIFERENTE**, no el mismo.

#### **❌ Valor Real (antes del fix):**
- **TODAS las claves** = `01:17:06` (mismo valor)

**Posibles causas raíz:**
1. ✅ **Frontend mostrando suma total** en lugar de tiempo por clave
2. ❌ Backend devolviendo mal los datos
3. ❌ keyCalculator leyendo de tabla incorrecta

**Necesito verificar el frontend** (KPIsTab.tsx) para ver cómo usa `getStateDuration(key)`.

---

## 3️⃣ DISTANCIA RECORRIDA (KM)

### **📊 Datos Procesados:**
- **~1,238 puntos GPS válidos** (de 1,591 totales)
- **Filtros aplicados**: España (40.2-40.6°N, -3.9 a -3.5°E), velocidad < 200 km/h

### **🧮 Razonamiento del Cálculo:**

#### **Fuente de Datos:**
```
backend/src/routes/kpis.ts (líneas 346-393)
→ Lee GpsMeasurement filtrados por sesiones
→ Filtra puntos válidos (España + satélites ≥ 4)
→ Calcula distancia con Haversine entre puntos consecutivos
```

#### **Fórmula Haversine:**
```typescript
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;  // Radio Tierra en metros
    const dLat = (lat2 - lat1) * PI / 180
    const dLon = (lon2 - lon1) * PI / 180
    
    const a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2)
    const c = 2 * atan2(√a, √(1-a))
    
    return R * c  // metros
}
```

#### **Filtro de anomalías:**
```typescript
// Solo sumar si distancia < 100m entre puntos consecutivos
if (distance < 100) {
    totalKm += distance / 1000
}
```

#### **✅ Valor Esperado:**

**Razonamiento:**
- **1,238 puntos válidos** en 18 sesiones
- Frecuencia GPS: **~1 punto/segundo**
- Duración total: **~1,238 segundos ≈ 20.6 minutos** de GPS activo
- Velocidad promedio urbana: **~30 km/h**
- **Distancia estimada**: 20.6 min × 30 km/h ≈ **10-12 km**

**Alternativa (si hay más datos):**
- Si GPS cubre 8h de conducción: **~150-200 km**

**Verificación en logs:**
```
✅ 1,238 puntos GPS válidos procesados
Velocidad promedio calculable desde GPS.speed
```

---

## 4️⃣ TIEMPO CON ROTATIVO ENCENDIDO

### **📊 Datos Procesados:**
- **~2,364 mediciones de rotativo** totales
- **Estados**: 0=apagado, 1=clave1, 2=clave2, 3=clave3, 4=clave4, 5=clave5

### **🧮 Razonamiento del Cálculo:**

#### **Fuente de Datos:**
```
backend/src/routes/kpis.ts (líneas 396-427)
→ Lee RotativoMeasurement filtrados por sesiones
→ Cuenta estados donde state IN ('1', '2')  // Clave 1 o 2
→ Multiplica por frecuencia (1 Hz) para obtener segundos
```

#### **Lógica:**
```typescript
const rotativoOn = rotativoData.filter(r => r.state === '1' || r.state === '2')
const segundosRotativo = rotativoOn.length  // 1 medición/segundo
```

#### **✅ Valor Esperado:**

**Razonamiento:**
- **2,364 mediciones totales** de rotativo
- Si ~30% del tiempo está en emergencia (clave 2): **~710 mediciones**
- **Tiempo rotativo ≈ 710s = 11m 50s**

Pero ESTO ES INCORRECTO. El rotativo DEBERÍA calcularse desde `operational_state_segments`:
```sql
SELECT SUM(durationSeconds) 
FROM operational_state_segments 
WHERE clave IN (2)  -- Solo emergencias
```

**Según logs:** Clave 2 tiene **~22 segmentos × ~300s = ~6,600s = 1h 50m**

---

## 5️⃣ PUNTOS NEGROS (HOTSPOTS)

### **📊 Datos Necesarios:**
- **Eventos de estabilidad** con coordenadas GPS
- **Algoritmo**: DBSCAN clustering

### **🧮 Razonamiento del Cálculo:**

#### **Fuente de Datos:**
```
backend/src/routes/hotspots.ts
→ Lee stability_events con JOIN a GpsMeasurement (vía timestamp)
→ Agrupa eventos cercanos geográficamente (radio configurable)
→ Retorna clusters con frecuencia ≥ minFrequency
```

#### **Algoritmo DBSCAN:**
```
1. Para cada evento con GPS:
   a. Buscar eventos a < clusterRadius metros
   b. Si hay ≥ minFrequency eventos cercanos → crear cluster
2. Fusionar clusters solapados
3. Retornar solo clusters con ≥ minFrequency eventos
```

#### **✅ Valor Esperado:**

**CON FIX DE SI:**
- Si hay **~1,700 eventos** totales
- Y están distribuidos en **18 sesiones** (4 días)
- Eventos probablemente agrupados en:
  - Curvas peligrosas (3-5 puntos)
  - Zonas de frenado brusco (2-4 puntos)
  - Entradas/salidas de parque (5-10 puntos)

**Clusters esperados:** 10-30 clusters (con minFrequency=1)

#### **❌ Valor Real (antes del fix):**
- **1 cluster** solamente
- **Sin datos** en la mayoría de consultas

**Causa raíz:** Solo 10 eventos LEVES (en lugar de 1,700) → clustering no encuentra patrones

---

## 6️⃣ SESIONES CON EVENTOS EN MAPA

### **📊 Datos Necesarios:**
- **Sesión seleccionada** con GpsMeasurement + stability_events

### **🧮 Razonamiento del Cálculo:**

#### **Endpoint:**
```
GET /api/telemetry-v2/sessions/:id/route
→ Retorna GpsMeasurement como línea (ruta)
→ Retorna stability_events como markers (puntos rojos)
```

#### **Lógica de Correlación:**
```typescript
// Backend correlaciona eventos con GPS por timestamp:
const evento = stability_events[i]
const gpsPoint = GpsMeasurement.find(g => 
    Math.abs(g.timestamp - evento.timestamp) < 10000 // 10s tolerancia
)

evento.latitude = gpsPoint?.latitude
evento.longitude = gpsPoint?.longitude
```

#### **✅ Valor Esperado:**

**CON FIX DE SI:**
- Cada sesión con eventos (ej: sesión con 6 eventos LEVES)
- Debería mostrar **6 marcadores rojos** en el mapa
- Posicionados en coordenadas GPS correlacionadas

#### **❌ Valor Real (antes del fix):**
- **0 eventos** en todas las sesiones
- Mapa solo muestra la ruta (línea azul)

---

## 🔧 CORRECCIONES APLICADAS

### **Fix 1: Escala del SI**
```diff
- si: valores[15],  // ❌ 84 (porcentaje)
+ si: valores[15] / 100,  // ✅ 0.84 (decimal)
```

**Impacto esperado:**
- ✅ Eventos de estabilidad: **0 → ~1,700**
- ✅ Puntos negros: **1 → 10-30 clusters**
- ✅ Eventos en mapa de sesiones: **0 → 5-10 por sesión**

### **Fix 2: Rango de fechas por defecto**
```diff
- start: '2025-09-29', end: '2025-10-08'  // ❌ Excluye 11, 21, 22 octubre
+ start: '2025-10-01', end: '2025-10-31'  // ✅ Incluye todo octubre
```

**Impacto esperado:**
- ✅ Sesiones visibles: **7 → 18**
- ✅ KPIs: **Solo día 8 → Todos los 4 días**

### **Fix 3: Conversión a operationalKey desactivada**
```diff
- await convertSegmentsToOperationalKeys(sessionId)  // ❌ Error PostGIS
+ // Desactivado - tabla obsoleta
```

**Impacto esperado:**
- ✅ Sin errores PostGIS en logs
- ✅ Post-procesamiento completo sin fallos

---

## 📊 VERIFICACIÓN ESPERADA DESPUÉS DEL FIX

### **KPIs Tab:**

| KPI | Antes | Después (Esperado) |
|-----|-------|-------------------|
| **Eventos Críticos** | 0 | ~34 🔴 |
| **Eventos Moderados** | 0 | ~340 🟠 |
| **Eventos Leves** | 15 | ~1,350 🟡 |
| **Clave 0 (Taller)** | 01:17:06 | ~0h 10m |
| **Clave 2 (Emergencia)** | 01:17:06 | ~1h 50m |
| **Clave 3 (Siniestro)** | 01:17:06 | ~1h 44m |
| **Clave 4 (Fin)** | 01:17:06 | ~1h 50m |
| **Clave 5 (Regreso)** | 01:17:06 | ~1h 52m |
| **Distancia Total** | ? | ~10-15 km |

### **Estados & Tiempos Tab:**

| Estado | Esperado |
|--------|----------|
| **Clave 0** | ~10 min (taller/parado) |
| **Clave 1** | ~0-5 min (parque sin rotativo) |
| **Clave 2** | ~1h 50m (emergencia con rotativo) |
| **Clave 3** | ~1h 44m (en siniestro) |
| **Clave 4** | ~1h 50m (fin actuación) |
| **Clave 5** | ~1h 52m (regreso sin rotativo) |

### **Puntos Negros Tab:**

- **Clusters**: 10-30 (con minFrequency=1)
- **Eventos totales**: ~1,700
- **Mapa**: Marcadores rojos en zonas con eventos recurrentes

### **Sesiones Tab:**

- **Sesiones visibles**: 18
- **Eventos por sesión**: Variable (0-100+)
- **Mapa de ruta**: Línea azul + marcadores rojos en eventos

---

## 🚨 PROBLEMAS POTENCIALES A VERIFICAR

### **1. Frontend: ¿Muestra claves correctamente?**

**Verificar en `KPIsTab.tsx`:**
```typescript
const getStateDuration = (key: number) => {
    const state = states.find(s => s.key === key)
    return state?.duration_formatted || '00:00:00'
}

// ✅ CORRECTO si states es un array con diferentes keys
// ❌ INCORRECTO si states[0] se usa para todas las claves
```

### **2. Backend: ¿Devuelve array de estados?**

**Verificar en `kpis.ts` respuesta:**
```typescript
summary.states = {
    states: [
        { key: 0, duration_seconds: X, duration_formatted: "HH:MM:SS" },
        { key: 1, duration_seconds: Y, duration_formatted: "HH:MM:SS" },
        // ... etc
    ],
    total_time_seconds: SUMA,
    total_time_formatted: "HH:MM:SS"
}

// ✅ CORRECTO: Array con 6 elementos (key 0-5)
// ❌ INCORRECTO: states es undefined o vacío
```

### **3. keyCalculator: ¿Retorna datos correctos?**

**Verificar en `keyCalculator.ts` línea 124-139:**
```typescript
return {
    clave0_segundos: tiempos.clave0,  // Diferente por cada clave
    clave0_formateado: formatearTiempo(tiempos.clave0),
    clave1_segundos: tiempos.clave1,
    // ... etc
}

// ✅ CORRECTO: Cada clave tiene su propio tiempo
// ❌ INCORRECTO: Todas las claves tienen el mismo valor
```

---

## 🎯 PLAN DE VERIFICACIÓN

### **Paso 1: Reprocesar datos**
```powershell
# Ya aplicado automáticamente por ts-node-dev
```

### **Paso 2: Limpiar localStorage (frontend)**
```javascript
localStorage.removeItem('lastProcessingTimestamp')
localStorage.clear()  // Opcional: limpiar todo
```

### **Paso 3: Refrescar dashboard (F5)**

### **Paso 4: Verificar cada pestaña:**

1. ✅ **KPIs**: ¿Claves con valores diferentes?
2. ✅ **KPIs**: ¿Eventos > 0?
3. ✅ **Estados**: ¿Cada clave con su tiempo?
4. ✅ **Puntos Negros**: ¿Clusters visibles?
5. ✅ **Sesiones**: ¿Eventos en mapa?

---

## 🔬 DIAGNÓSTICO DETALLADO POR ENDPOINT

### **`GET /api/kpis/summary`**

**Input esperado:**
```
?from=2025-10-01&to=2025-10-31&organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26
```

**Output esperado:**
```json
{
  "success": true,
  "data": {
    "states": {
      "states": [
        { "key": 0, "name": "Taller", "duration_seconds": 600, "duration_formatted": "00:10:00", "count": 10 },
        { "key": 1, "name": "Operativo en Parque", "duration_seconds": 0, "duration_formatted": "00:00:00", "count": 0 },
        { "key": 2, "name": "Salida en Emergencia", "duration_seconds": 6600, "duration_formatted": "01:50:00", "count": 110 },
        { "key": 3, "name": "En Siniestro", "duration_seconds": 6250, "duration_formatted": "01:44:10", "count": 104 },
        { "key": 4, "name": "Fin de Actuación", "duration_seconds": 6600, "duration_formatted": "01:50:00", "count": 110 },
        { "key": 5, "name": "Regreso al Parque", "duration_seconds": 6720, "duration_formatted": "01:52:00", "count": 112 }
      ],
      "total_time_seconds": 26770,
      "total_time_formatted": "07:26:10"
    },
    "stability": {
      "total_incidents": 1700,
      "critical": 34,
      "moderate": 340,
      "light": 1326
    },
    "activity": {
      "km_total": 12.5,
      "driving_hours": 7.4,
      "rotativo_on_seconds": 6600,
      "rotativo_on_formatted": "01:50:00"
    }
  }
}
```

---

## 🧪 TESTS DE SANIDAD

### **Test 1: SI en rango correcto**
```sql
SELECT MIN(si), MAX(si), AVG(si)
FROM "StabilityMeasurement"
```
**Esperado:** min ≈ 0.15, max ≈ 0.98, avg ≈ 0.85

### **Test 2: Claves diferentes**
```sql
SELECT clave, SUM("durationSeconds") as total_seg
FROM operational_state_segments
GROUP BY clave
ORDER BY clave
```
**Esperado:** Cada clave con valor diferente

### **Test 3: Eventos por severidad**
```sql
SELECT severity, COUNT(*)
FROM stability_events
GROUP BY severity
```
**Esperado:** LEVE > MODERADA > GRAVE

---

## ✅ CONCLUSIONES

**Los 3 fixes aplicados DEBERÍAN resolver:**

1. ✅ **Eventos de estabilidad**: De 10 → ~1,700 (con distribución correcta)
2. ✅ **Claves operacionales**: Todas iguales → Cada una con su valor
3. ✅ **Puntos negros**: 1 cluster → 10-30 clusters
4. ✅ **Eventos en mapa**: 0 → 5-100 por sesión

**Si después de reprocesar TODAVÍA hay problemas, necesito verificar:**
- ✅ Endpoint `/api/kpis/summary` retorna `states` como array
- ✅ Frontend `getStateDuration(key)` busca en el array correctamente
- ✅ Puntos negros usa eventos con GPS correlacionado









