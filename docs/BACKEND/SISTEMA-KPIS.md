# 📊 SISTEMA DE KPIS - DOCUMENTACIÓN COMPLETA

## 📋 Índice

1. [Visión General](#visión-general)
2. [Endpoints de KPIs](#endpoints-de-kpis)
3. [Cálculo de KPIs](#cálculo-de-kpis)
4. [Sistema de Cache](#sistema-de-cache)
5. [Filtros y Parámetros](#filtros-y-parámetros)
6. [Estructura de Respuesta](#estructura-de-respuesta)
7. [Optimizaciones](#optimizaciones)

---

## 🎯 Visión General

El sistema de KPIs de DobackSoft calcula métricas operativas en tiempo real basadas en datos de:
- **GPS** (ubicación, distancia, velocidad)
- **CAN** (datos del vehículo)
- **Rotativo** (estado del rotativo/sirena)
- **Estabilidad** (aceleraciones, giros, índice SI)

### Flujo de Cálculo

```
1. Request API → /api/kpis/summary
2. Autenticación + Organización
3. Validación de filtros (from, to, vehicleIds)
4. Verificación de cache
5. Si NO está en cache:
   a. Obtener sesiones filtradas
   b. Calcular KPIs desde datos raw
   c. Guardar en cache
6. Retornar respuesta JSON
```

---

## 🌐 Endpoints de KPIs

### 1. GET `/api/kpis/summary`

**Descripción:** Retorna resumen completo con todos los KPIs calculados.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Cookie: auth_token=<TOKEN>
```

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `from` | string | ✅ | Fecha inicio (YYYY-MM-DD) |
| `to` | string | ✅ | Fecha fin (YYYY-MM-DD) |
| `vehicleIds[]` | string[] | ❌ | IDs de vehículos (filtro) |
| `force` | boolean | ❌ | Forzar recalculo (ignora cache) |

**Aliases compatibles:**
- `startDate` → `from`
- `endDate` → `to`
- `vehicles` → `vehicleIds`

**Ejemplo Request:**
```bash
GET /api/kpis/summary?from=2025-10-01&to=2025-10-08&vehicleIds[]=uuid1&vehicleIds[]=uuid2
```

**Ejemplo Response:**
```json
{
  "success": true,
  "data": {
    "operational_states": {
      "clave0_segundos": 11,
      "clave0_formateado": "00:00:11",
      "clave1_segundos": 62334,
      "clave1_formateado": "17:18:54",
      "clave2_segundos": 37848,
      "clave2_formateado": "10:30:48",
      "clave3_segundos": 626,
      "clave3_formateado": "00:10:26",
      "clave4_segundos": 0,
      "clave4_formateado": "00:00:00",
      "clave5_segundos": 0,
      "clave5_formateado": "00:00:00",
      "total_segundos": 100819,
      "total_formateado": "28:00:19",
      "tiempo_fuera_del_parque": "27:56:48"
    },
    "activity_metrics": {
      "distancia_total_km": 541.66,
      "tiempo_rotativo_encendido": "17:18:54",
      "porcentaje_rotativo": 61.83,
      "velocidad_promedio_kmh": 12.38
    },
    "stability": {
      "total_incidents": 284,
      "critical": 2,
      "moderate": 22,
      "light": 260
    },
    "session_count": 63
  },
  "metadata": {
    "from": "2025-10-01",
    "to": "2025-10-08",
    "vehicleIds": ["uuid1", "uuid2"],
    "organizationId": "org-uuid",
    "cached": false,
    "calculatedAt": "2025-10-15T07:11:53.000Z"
  }
}
```

---

### 2. GET `/api/v1/kpis/summary`

**Alias:** Versión alternativa con misma funcionalidad.

**Ruta:** `/api/v1/kpis/summary`

**Mismo comportamiento que** `/api/kpis/summary`

---

### 3. GET `/api/kpis/test`

**Descripción:** Endpoint de prueba para verificar conectividad.

**Response:**
```json
{
  "success": true,
  "message": "Endpoint de prueba funcionando",
  "timestamp": "2025-10-15T07:11:53.000Z"
}
```

---

## 🧮 Cálculo de KPIs

### Arquitectura de Cálculo

```
┌─────────────────────────────────────┐
│     kpiCalculator.ts (Orquestador)  │
└─────────────────────────────────────┘
                  │
                  ├─→ calcularTiemposPorClave()     [keyCalculator.ts]
                  ├─→ calcularTiempoRotativo()      [kpiCalculator.ts]
                  ├─→ calcularKilometrosRecorridos() [kpiCalculator.ts]
                  ├─→ calcularVelocidadPromedio()   [kpiCalculator.ts]
                  └─→ calcularEventosEstabilidad()  [kpiCalculator.ts]
```

---

### 1. Estados Operacionales (Tiempos por Clave)

**Servicio:** `keyCalculator.ts`  
**Función:** `calcularTiemposPorClave(sessionIds, from?, to?)`

**Claves Operacionales:**

| Clave | Descripción | Significado |
|-------|-------------|-------------|
| **Clave 0** | Parado con motor apagado | Vehículo estacionado, sin actividad |
| **Clave 1** | Motor encendido, parado | Vehículo en espera o preparación |
| **Clave 2** | En movimiento con rotativo ON | **Actividad operativa principal** |
| **Clave 3** | En movimiento con rotativo OFF | Traslado sin emergencia |
| **Clave 4** | Reservado | (No usado actualmente) |
| **Clave 5** | Reservado | (No usado actualmente) |

**Lógica:**
```sql
SELECT clave, "startTime", "endTime" 
FROM operational_state_segments 
WHERE "sessionId"::text = ANY(${sessionIds}::text[])
  AND "startTime" >= ${dateFrom}::timestamp
  AND "startTime" <= ${dateTo}::timestamp
```

**Cálculo:**
```typescript
segmentos.forEach(segmento => {
    const duracionSegundos = (segmento.endTime - segmento.startTime) / 1000;
    tiempos[`clave${segmento.clave}`] += duracionSegundos;
});
```

**Resultado:**
```json
{
  "clave0_segundos": 11,
  "clave0_formateado": "00:00:11",
  "clave1_segundos": 62334,
  "clave1_formateado": "17:18:54",
  "clave2_segundos": 37848,
  "clave2_formateado": "10:30:48",
  "clave3_segundos": 626,
  "clave3_formateado": "00:10:26",
  "total_segundos": 100819,
  "total_formateado": "28:00:19"
}
```

---

### 2. Tiempo con Rotativo Encendido

**Servicio:** `kpiCalculator.ts`  
**Función:** `calcularTiempoRotativo(sessionIds)`

**Lógica:**
```typescript
// 1. Obtener mediciones de rotativo
const rotativoData = await prisma.rotativoMeasurement.findMany({
    where: { sessionId: { in: sessionIds } }
});

// 2. Contar muestras ON (state = '1' o '2')
const muestrasON = rotativoData.filter(r => 
    r.state === '1' || r.state === '2'
).length;

// 3. Calcular tiempo (cada muestra = 15 segundos)
const tiempoMinutos = (muestrasON * 15) / 60;
const tiempoHoras = tiempoMinutos / 60;
const porcentajeON = (muestrasON / totalMuestras) * 100;
```

**Estados del Rotativo:**
- `0` = Apagado
- `1` = Encendido (modo normal)
- `2` = Encendido (modo emergencia)

**Resultado:**
```json
{
  "tiempo_minutos": 1038.9,
  "tiempo_horas": 17.32,
  "tiempo_formateado": "17:18:54",
  "muestras_on": 4156,
  "muestras_off": 2566,
  "porcentaje_on": 61.83
}
```

---

### 3. Kilómetros Recorridos

**Servicio:** `kpiCalculator.ts`  
**Función:** `calcularKilometrosRecorridos(sessionIds)`

**Lógica:**

```typescript
// 1. Obtener puntos GPS ordenados
const gpsData = await prisma.gpsMeasurement.findMany({
    where: { sessionId: { in: sessionIds } },
    orderBy: { timestamp: 'asc' }
});

// 2. Filtrar GPS válidos
const gpsValidos = gpsData.filter(g => {
    // Coordenadas válidas en rango España
    const coordenadasValidas = 
        g.latitude > 35 && g.latitude < 45 &&
        g.longitude > -5 && g.longitude < -1;
    
    // Mínimo 4 satélites para precisión
    const satelitesSuficientes = g.satellites >= 4;
    
    return coordenadasValidas && satelitesSuficientes;
});

// 3. Calcular distancia Haversine
let kmTotal = 0;
for (let i = 1; i < gpsValidos.length; i++) {
    const anterior = gpsValidos[i - 1];
    const actual = gpsValidos[i];
    
    const distancia = haversineDistance(
        anterior.latitude, anterior.longitude,
        actual.latitude, actual.longitude
    );
    
    // Filtrar saltos imposibles (>100m en 5 segundos)
    if (distancia < 100) {
        kmTotal += distancia / 1000;
    }
}
```

**Fórmula Haversine:**
```typescript
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * 
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en metros
}
```

**Resultado:**
```json
{
  "km_total": 541.66,
  "km_con_gps": 541.66,
  "km_estimados": 0,
  "puntos_gps_validos": 56205,
  "puntos_gps_invalidos": 31697,
  "porcentaje_cobertura": 63.93
}
```

---

### 4. Velocidad Promedio

**Servicio:** `kpiCalculator.ts` + `speedAnalyzer.ts`  
**Función:** `calcularVelocidadPromedio(sessionIds)`

**Lógica:**
```typescript
// 1. Obtener puntos GPS con velocidad
const gpsData = await prisma.gpsMeasurement.findMany({
    where: { sessionId: { in: sessionIds } },
    select: { speed: true }
});

// 2. Filtrar velocidades válidas (0-200 km/h)
const velocidadesValidas = gpsData
    .map(g => g.speed)
    .filter(v => v > 0 && v < 200);

// 3. Calcular promedio
const velocidadPromedio = velocidadesValidas.reduce((sum, v) => sum + v, 0) 
                        / velocidadesValidas.length;
```

**Resultado:**
```json
{
  "velocidad_promedio_kmh": 12.38,
  "velocidad_maxima_kmh": 87.5,
  "puntos_validos": 58844,
  "puntos_invalidos": 29058
}
```

---

### 5. Eventos de Estabilidad

**Servicio:** `kpiCalculator.ts`  
**Función:** Consulta directa a `stability_events`

**Lógica:**
```sql
SELECT details, session_id
FROM stability_events
WHERE session_id::text = ANY(${sessionIds}::text[])
```

**Clasificación por Severidad (SI):**

| Severidad | Rango SI | Color | Descripción |
|-----------|----------|-------|-------------|
| **Crítica** | SI < 0.20 | 🔴 | Evento grave, vuelco inminente |
| **Moderada** | 0.20 ≤ SI < 0.35 | 🟠 | Evento significativo |
| **Leve** | 0.35 ≤ SI < 0.50 | 🟡 | Evento menor |
| **Normal** | SI ≥ 0.50 | 🟢 | Sin evento |

**Procesamiento:**
```typescript
stabilityEvents.forEach(event => {
    const si = event.details?.si || 0;
    
    if (si < 0.20) {
        critical++;
    } else if (si < 0.35) {
        moderate++;
    } else if (si < 0.50) {
        light++;
    }
    
    totalIncidents++;
});
```

**Resultado:**
```json
{
  "total_incidents": 284,
  "critical": 2,
  "moderate": 22,
  "light": 260
}
```

---

## 💾 Sistema de Cache

### KPICacheService

**Ubicación:** `backend/src/services/KPICacheService.ts`

**Características:**
- Cache en memoria (Map)
- TTL configurable (default: 5 minutos)
- Invalidación por organización
- Forzar recalculo con `?force=true`

**Implementación:**
```typescript
class KPICacheService {
    private cache = new Map<string, CacheEntry>();
    private ttl = 5 * 60 * 1000; // 5 minutos

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data;
    }

    set(key: string, data: any): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + this.ttl
        });
    }

    invalidate(organizationId: string): number {
        let deleted = 0;
        for (const [key, _] of this.cache.entries()) {
            if (key.includes(organizationId)) {
                this.cache.delete(key);
                deleted++;
            }
        }
        return deleted;
    }
}
```

**Clave de Cache:**
```typescript
const cacheKey = `kpis:${organizationId}:${from}:${to}:${vehicleIds.sort().join(',')}`;
```

**Ejemplo:**
```
kpis:a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26:2025-10-01:2025-10-08:uuid1,uuid2
```

---

## 🔍 Filtros y Parámetros

### 1. Filtro de Fechas

**Obligatorio:** ✅

**Formato:** YYYY-MM-DD

**Validación:**
```typescript
if (!from || !to) {
    return res.status(400).json({
        error: 'Rango de fechas obligatorio: from y to (YYYY-MM-DD)'
    });
}
```

**Conversión:**
```typescript
const dateFrom = new Date(from);
const dateTo = new Date(to);
dateTo.setDate(dateTo.getDate() + 1); // Hacer 'to' inclusivo
```

---

### 2. Filtro de Vehículos

**Opcional:** ❌

**Formato:** Array de UUIDs

**Variantes aceptadas:**
```
?vehicleIds[]=uuid1&vehicleIds[]=uuid2
?vehicleIds=uuid1,uuid2
?vehicles=uuid1
```

**Parsing:**
```typescript
let vehicleIds: string[] | undefined;

const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;

if (vehicleIdsRaw) {
    if (Array.isArray(vehicleIdsRaw)) {
        vehicleIds = vehicleIdsRaw;
    } else {
        vehicleIds = vehicleIdsRaw.includes(',')
            ? vehicleIdsRaw.split(',').map(id => id.trim())
            : [vehicleIdsRaw];
    }
}
```

---

### 3. Filtro de Organización

**Automático:** ✅ (desde JWT)

**Extracción:**
```typescript
const organizationId = req.user?.organizationId;
```

**Aplicación:**
```typescript
const sessions = await prisma.session.findMany({
    where: {
        organizationId,  // ✅ Siempre presente
        vehicleId: vehicleIds ? { in: vehicleIds } : undefined,
        startTime: { gte: dateFrom, lt: dateTo }
    }
});
```

---

### 4. Force Recalculate

**Opcional:** ❌

**Formato:** `?force=true`

**Comportamiento:**
```typescript
const force = req.query.force === 'true';

if (force) {
    kpiCacheService.invalidate(organizationId);
    logger.info('Cache invalidado por force=true');
}
```

---

## 📦 Estructura de Respuesta

### Respuesta Exitosa

```typescript
interface KPIResponse {
    success: true;
    data: {
        operational_states: OperationalStates;
        activity_metrics: ActivityMetrics;
        stability: StabilityMetrics;
        session_count: number;
    };
    metadata: {
        from: string;
        to: string;
        vehicleIds?: string[];
        organizationId: string;
        cached: boolean;
        calculatedAt: string;
    };
}
```

### Respuesta de Error

```typescript
interface KPIErrorResponse {
    success: false;
    error: string;
    code?: string;
}
```

**Ejemplos:**
```json
// 400 Bad Request
{
  "success": false,
  "error": "Rango de fechas obligatorio: from y to (YYYY-MM-DD)"
}

// 401 Unauthorized
{
  "success": false,
  "error": "No autorizado"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Error calculando KPIs",
  "code": "CALCULATION_ERROR"
}
```

---

## ⚡ Optimizaciones

### 1. Select Específico

```typescript
// ✅ Bueno
const sessions = await prisma.session.findMany({
    where: { ... },
    select: {
        id: true,
        startTime: true,
        endTime: true,
        vehicleId: true
    }
});

// ❌ Malo
const sessions = await prisma.session.findMany({
    where: { ... }
});
```

---

### 2. Queries en Paralelo

```typescript
const [
    tiemposPorClave,
    tiempoRotativo,
    kilometros,
    velocidadPromedio,
    eventos
] = await Promise.all([
    calcularTiemposPorClave(sessionIds, from, to),
    calcularTiempoRotativo(sessionIds),
    calcularKilometrosRecorridos(sessionIds),
    calcularVelocidadPromedio(sessionIds),
    obtenerEventosEstabilidad(sessionIds)
]);
```

---

### 3. Índices de Base de Datos

```sql
-- Índices en sessions
CREATE INDEX idx_sessions_org_date ON sessions(organization_id, start_time);
CREATE INDEX idx_sessions_vehicle ON sessions(vehicle_id);

-- Índices en measurements
CREATE INDEX idx_gps_session ON gps_measurements(session_id);
CREATE INDEX idx_rotativo_session ON rotativo_measurements(session_id);
CREATE INDEX idx_stability_session ON stability_events(session_id);
```

---

### 4. Cache Estratégico

**Estrategia:**
- Cache de 5 minutos para consultas recientes
- Invalidación por organización
- Forzar recalculo cuando sea necesario

**Beneficio:**
- Reduce carga en BD
- Respuestas más rápidas (< 50ms vs 2000ms)

---

## 🧪 Testing

### Ejemplo de Test

```typescript
describe('KPI Calculation', () => {
    it('should calculate KPIs for valid date range', async () => {
        const response = await request(app)
            .get('/api/kpis/summary')
            .query({
                from: '2025-10-01',
                to: '2025-10-08'
            })
            .set('Cookie', authToken);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('operational_states');
        expect(response.body.data).toHaveProperty('activity_metrics');
        expect(response.body.data).toHaveProperty('stability');
    });

    it('should return error for missing date range', async () => {
        const response = await request(app)
            .get('/api/kpis/summary')
            .set('Cookie', authToken);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Rango de fechas obligatorio');
    });
});
```

---

## 📚 Referencias

- [Arquitectura Interna](./ARQUITECTURA-INTERNA.md)
- [Sistema de Eventos](./GENERACION-EVENTOS.md)
- [Endpoints Completos](../API/ENDPOINTS-COMPLETOS.md)

---

**Última actualización:** Octubre 2025  
**Versión:** DobackSoft StabilSafe V3

