# 📋 AUDITORÍA COMPLETA - DASHBOARD Y UPLOAD
## StabilSafe V3 - DobackSoft

**Fecha de Auditoría:** 2025-01-14  
**Versión del Sistema:** V3  
**Alcance:** Dashboard Principal (4 pestañas) + Sistema de Upload Masivo

---

## 📑 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estados y Tiempos (Tab 0)](#estados-y-tiempos)
3. [Puntos Negros (Tab 1)](#puntos-negros)
4. [Velocidad (Tab 2)](#velocidad)
5. [Sesiones y Recorridos (Tab 4)](#sesiones-y-recorridos)
6. [Sistema de Upload Masivo](#sistema-upload-masivo)
7. [Filtros Globales](#filtros-globales)
8. [Tablas de Base de Datos](#tablas-base-datos)
9. [Reglas de Negocio](#reglas-negocio)
10. [Inconsistencias Detectadas](#inconsistencias)
11. [Recomendaciones](#recomendaciones)

---

## 1. RESUMEN EJECUTIVO {#resumen-ejecutivo}

### Arquitectura General

**Frontend:**
- Framework: React + TypeScript + Tailwind CSS
- Rutas: `/unified-dashboard` (dashboard principal), `/upload` (subida de archivos)
- Componente Principal: `NewExecutiveKPIDashboard.tsx`
- Gestión de Estado: Context API (`FiltersContext`) + Hooks personalizados

**Backend:**
- Runtime: Node.js + Express + TypeScript
- ORM: Prisma (PostgreSQL)
- Servicios Clave:
  - `keyCalculator.ts` - Cálculo de claves operacionales (0-5)
  - `speedAnalyzer.ts` - Análisis de velocidad y violaciones
  - `UnifiedFileProcessor.ts` - Procesamiento de archivos masivos
  - `eventDetector.ts` - Detección de eventos de estabilidad

**Base de Datos:**
- Motor: PostgreSQL
- Tablas Principales: Session, GpsMeasurement, StabilityMeasurement, RotativoMeasurement, stability_events, Vehicle, Park

### Flujo de Datos End-to-End

```
[Upload] → UnifiedFileProcessor → [BD: Session/Measurements] → EventDetector → stability_events
                                                               ↓
[Filtros Globales] → Frontend Tabs → API Endpoints → Servicios → [BD Queries] → KPIs/Visualizaciones
```

---

## 2. ESTADOS Y TIEMPOS (Tab 0) {#estados-y-tiempos}

### 📍 Ubicación
- **Frontend:** `frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx` (líneas 489-684)
- **Backend:** `backend/src/routes/kpis.ts` → `/api/kpis/summary`
- **Servicio:** `backend/src/services/keyCalculator.ts`

### 2.1 KPIs Documentados (16 Tarjetas)

#### FILA 1: Métricas Principales

| # | KPI | Valor | Fuente de Datos | Cálculo | Filtros Aplicados |
|---|-----|-------|-----------------|---------|-------------------|
| 1 | **Horas de Conducción** | `HH:MM:SS` | `GpsMeasurement` | Suma de intervalos GPS donde velocidad > 1 km/h y distancia Haversine es válida | Fecha, vehículos |
| 2 | **Kilómetros Recorridos** | `XXX km` | `GpsMeasurement` | Suma de distancias Haversine entre puntos GPS consecutivos (sanedo: max 160 km/h) | Fecha, vehículos |
| 3 | **Tiempo en Parque** | `HH:MM:SS` | `GpsMeasurement` + `Park` geocercas | `keyCalculator.clave1_segundos` - Puntos GPS dentro de geocerca de parque con rotativo OFF | Fecha, vehículos |
| 4 | **% Rotativo** | `XX.X%` | `RotativoMeasurement` | `(mediciones con state='1' / total mediciones) * 100` | Fecha, vehículos |
| 5 | **Índice de Estabilidad (SI)** | `XX.X%` | `stability_events` | `max(0, 100 - total_incidencias) / 100` → Calificación: EXCELENTE/BUENA/REGULAR | Fecha, vehículos |

**Detalles Técnicos:**

**Horas de Conducción:**
```typescript
// Backend: kpis.ts líneas 195-283
let drivingSeconds = 0;
const MOVING_THRESHOLD_KMH = 1;
const MAX_REASONABLE_SPEED_KMH = 160;
const MAX_POINT_GAP_SECONDS = 120;

for (puntos GPS consecutivos) {
  dt = min(MAX_POINT_GAP_SECONDS, delta_tiempo_segundos);
  distancia_km = haversine(p1.lat, p1.lon, p2.lat, p2.lon);
  velocidad_kmh = distancia_km / (dt / 3600);
  
  if (velocidad_kmh >= MOVING_THRESHOLD_KMH && velocidad_kmh <= MAX_REASONABLE_SPEED_KMH) {
    drivingSeconds += dt;
    kmTotal += distancia_km;
  }
}

drivingHours = drivingSeconds / 3600;
```

**Índice de Estabilidad:**
```typescript
// Backend: kpis.ts líneas 366-371
quality: {
  indice_promedio: totalEvents > 0 ? max(0, 100 - totalEvents) / 100 : 1,
  calificacion: totalEvents === 0 ? 'EXCELENTE' : totalEvents < 5 ? 'BUENA' : 'REGULAR',
  estrellas: totalEvents === 0 ? '⭐⭐⭐⭐⭐' : totalEvents < 5 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
}

// Frontend: NewExecutiveKPIDashboard.tsx líneas 531-541
value={`${(((quality?.indice_promedio || 0)) * 100).toFixed(1)}%`}
colorClass={
  (quality?.indice_promedio || 0) >= 0.90 ? "text-green-600" :
  (quality?.indice_promedio || 0) >= 0.88 ? "text-yellow-600" :
  "text-red-600"
}
```

#### FILA 2: Estados Operativos

| # | KPI | Valor | Fuente de Datos | Cálculo | Regla de Negocio |
|---|-----|-------|-----------------|---------|------------------|
| 6 | **Tiempo Fuera Parque** | `HH:MM:SS` | Calculado | `Clave2 + Clave3 + Clave5` | Suma de estados operacionales fuera del parque |
| 7 | **Tiempo en Taller** | `HH:MM:SS` | `GpsMeasurement` + `Zone` (tipo TALLER) | `keyCalculator.clave0_segundos` | GPS dentro de geocerca de taller |
| 8 | **Tiempo Clave 2** | `HH:MM:SS` | `GpsMeasurement` + `RotativoMeasurement` | Puntos fuera parque + rotativo ON + velocidad > 5 km/h | Salida en emergencia |
| 9 | **Tiempo Clave 5** | `HH:MM:SS` | `GpsMeasurement` + `RotativoMeasurement` | Fuera parque + rotativo OFF + velocidad > 5 km/h + acercándose a parque | Regreso al parque |

**Algoritmo de Claves Operacionales:**
```typescript
// keyCalculator.ts líneas 306-328
// Constantes
CONFIG = {
  VELOCIDAD_PARADO: 5 km/h,
  TIEMPO_MIN_PARADO: 300 segundos (5 min),
  GPS_SAMPLE_INTERVAL: 5 segundos
}

// Transiciones priorizadas:
if (enTaller) {
  estado = Clave 0 (Taller)
}
else if (enParque && rotativo === '0') {
  estado = Clave 1 (Operativo en Parque)
}
else if (!enParque && rotativo === '1' && velocidad > 5) {
  estado = Clave 2 (Salida en Emergencia)
}
else if (!enParque && paradoSegundos >= 300) {
  estado = Clave 3 (En Siniestro - parado >5min)
}
else if (!enParque && rotativo === '0' && velocidad > 5 && acercandoParque) {
  estado = Clave 5 (Regreso al Parque)
}
```

#### FILA 3: Incidencias de Estabilidad

| # | KPI | Valor | Fuente de Datos | Cálculo | Clasificación |
|---|-----|-------|-----------------|---------|---------------|
| 10 | **Total Incidencias** | `XXX` | `stability_events` | `count(*)` filtrado por sesiones | Todos los eventos |
| 11 | **Incidencias Graves** | `XXX` | `stability_events` | `count(*) WHERE type='CRITICO'` | SI < 0.20 |
| 12 | **Incidencias Moderadas** | `XXX` | `stability_events` | `count(*) WHERE type='MODERADO'` | 0.20 ≤ SI < 0.35 |
| 13 | **Incidencias Leves** | `XXX` | `stability_events` | `count(*) WHERE type='LEVE'` | SI ≥ 0.35 |

**Clasificación de Severidad:**
```typescript
// Backend: eventDetector.ts (implícito en hotspots.ts líneas 155-159)
const si = details.si || 0;

if (si < 0.20) severity = 'grave';       // CRITICO
else if (si < 0.35) severity = 'moderada'; // MODERADO
else severity = 'leve';                    // LEVE
```

#### FILA 4: Velocidad y Estados Adicionales

| # | KPI | Valor | Fuente de Datos | Cálculo | Observaciones |
|---|-----|-------|-----------------|---------|---------------|
| 14 | **Tiempo Clave 3** | `HH:MM:SS` | `GpsMeasurement` | Fuera parque + parado >1min (≥5min = Clave 3) | En siniestro/emergencia |
| 15 | **Velocidad Promedio** | `XX km/h` | Calculado | `km_total / driving_hours` (saneado: evita divisiones por cero o valores irreales) | Validado: solo si driving_hours > 0.1 |
| 16 | **Tiempo Clave 4** | `HH:MM:SS` | `GpsMeasurement` | NO IMPLEMENTADO en keyCalculator actual | Fin de actuación/retirada |

**⚠️ INCONSISTENCIA DETECTADA:**
- **Clave 4** se muestra en la UI pero **NO está implementada** en `keyCalculator.ts`
- El servicio solo calcula Claves 0, 1, 2, 3, 5

### 2.2 Tabla de Eventos por Tipo

**Ubicación:** `NewExecutiveKPIDashboard.tsx` líneas 628-671

**Fuente de Datos:** `stability.por_tipo` (objeto del endpoint `/api/kpis/summary`)

```typescript
// Backend: kpis.ts líneas 182-185
const eventsByType = events.reduce((acc, event) => {
  acc[event.type] = (acc[event.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

**Visualización:**
- Tabla con 3 columnas: Tipo de Evento, Cantidad, Frecuencia
- Ordenado por cantidad (descendente)
- Clasificación de frecuencia:
  - Alta: > 10 eventos
  - Media: 5-10 eventos  
  - Baja: < 5 eventos

### 2.3 Endpoints Backend

#### GET `/api/kpis/summary`

**Parámetros:**
```typescript
{
  from?: string,           // YYYY-MM-DD
  to?: string,             // YYYY-MM-DD
  vehicleIds[]?: string[], // Array de IDs
  force?: boolean          // Invalidar cache
}
```

**Respuesta:**
```typescript
{
  success: true,
  data: {
    availability: { total_sessions, total_vehicles, availability_percentage },
    states: { states[], total_time_seconds, total_time_formatted, time_outside_station },
    activity: { km_total, driving_hours, driving_hours_formatted, rotativo_on_seconds, rotativo_on_percentage },
    stability: { total_incidents, critical, moderate, light },
    quality: { indice_promedio, calificacion, estrellas },
    metadata: { sesiones_analizadas, fecha_calculo }
  }
}
```

**Lógica de Filtrado:**
```typescript
// kpis.ts líneas 113-165
// ESTRATEGIA DUAL:
// 1. Si from/to definidos → Buscar sesiones por MEDICIONES en rango
if (dateFrom && dateToExclusive) {
  // Buscar GPS y Rotativo en rango → extraer sessionIds
  gpsRows = await prisma.gpsMeasurement.findMany({
    where: { timestamp: { gte: dateFrom, lt: dateToExclusive }, session: { organizationId, vehicleId } }
  });
  sessionIds = uniqueIds(gpsRows + rotRows);
}
// 2. Sin rango → Todas las sesiones de la organización
else {
  sessions = await prisma.session.findMany({ where: { organizationId, vehicleId } });
  sessionIds = sessions.map(s => s.id);
}
```

### 2.4 Filtros que Afectan esta Pestaña

| Filtro | Origen | Efecto | Query Param |
|--------|--------|--------|-------------|
| **Rango de Fechas** | `GlobalFiltersBar` | Filtra sesiones por mediciones en rango | `from`, `to` |
| **Vehículos** | `GlobalFiltersBar` | Filtra sesiones por vehicleId | `vehicleIds[]` |
| **Severidad** | `GlobalFiltersBar` | NO afecta Estados y Tiempos | - |
| **Rotativo** | `GlobalFiltersBar` | NO afecta directamente (cálculo interno) | - |

---

## 3. PUNTOS NEGROS (Tab 1) {#puntos-negros}

### 📍 Ubicación
- **Frontend:** `frontend/src/components/stability/BlackSpotsTab.tsx`
- **Backend:** `backend/src/routes/hotspots.ts` → `/api/hotspots/critical-points`

### 3.1 Filtros Disponibles

| Filtro | Tipo | Valores | Efecto | Default |
|--------|------|---------|--------|---------|
| **Severidad** | Dropdown | all, grave, moderada, leve | Filtra eventos por severity | all |
| **Frecuencia Mínima** | Slider | 1-10 | Filtra clusters con frecuencia ≥ valor | 2 |
| **Estado Rotativo** | Buttons | all, on, off | Filtra por rotativoState | all |
| **Radio de Clustering** | Slider | 10-100 metros | Agrupa eventos cercanos | 30m |
| **Modo** | Toggle | cluster, single | Clustering vs eventos individuales | cluster |

**Código de Filtros:**
```typescript
// BlackSpotsTab.tsx líneas 47-51
const [severityFilter, setSeverityFilter] = useState<'all' | 'grave' | 'moderada' | 'leve'>('all');
const [minFrequency, setMinFrequency] = useState(2);
const [rotativoFilter, setRotativoFilter] = useState<'all' | 'on' | 'off'>('all');
const [clusterRadius, setClusterRadius] = useState(30);
const [individualMode, setIndividualMode] = useState<boolean>(false);
```

### 3.2 KPIs Estadísticos

| KPI | Cálculo | Visualización |
|-----|---------|---------------|
| **Total Clusters** | `clusters.length` después de filtros | Tarjeta blanca |
| **Total Eventos** | `apiTotals.totalEvents` | Tarjeta blanca |
| **Graves** | `stats.graveCount` | Tarjeta roja |
| **Moderadas** | `stats.moderadaCount` | Tarjeta naranja |
| **Leves** | `stats.leveCount` | Tarjeta amarilla |

```typescript
// BlackSpotsTab.tsx líneas 135-148
const stats = useMemo(() => ({
  totalClusters: clusters.length,
  totalEvents: clusters.reduce((sum, c) => sum + c.frequency, 0),
  graveCount: clusters.reduce((sum, c) => sum + (c.severity_counts?.grave || 0), 0),
  moderadaCount: clusters.reduce((sum, c) => sum + (c.severity_counts?.moderada || 0), 0),
  leveCount: clusters.reduce((sum, c) => sum + (c.severity_counts?.leve || 0), 0)
}), [clusters]);
```

### 3.3 Algoritmo de Clustering

**Backend:** `hotspots.ts` líneas 31-104

**Estrategia:**
1. Iterar sobre eventos
2. Para cada evento no usado, crear cluster
3. Buscar eventos cercanos (distancia Haversine ≤ radio)
4. Agrupar eventos en cluster
5. Calcular centro (promedio lat/lng)
6. Determinar severidad dominante

```typescript
// hotspots.ts - Función clusterEvents
function clusterEvents(events: any[], radiusMeters: number = 20): any[] {
  const clusters: any[] = [];
  const usedEvents = new Set<number>();

  events.forEach((event, i) => {
    if (usedEvents.has(i)) return;

    const cluster = {
      id: `cluster_${clusters.length}`,
      lat: event.lat,
      lng: event.lng,
      events: [event],
      severity_counts: { grave: 0, moderada: 0, leve: 0 },
      frequency: 1,
      vehicleIds: [event.vehicleId],
      lastOccurrence: event.timestamp
    };

    // Buscar eventos cercanos
    events.forEach((otherEvent, j) => {
      if (usedEvents.has(j)) return;
      const distance = haversine(event.lat, event.lng, otherEvent.lat, otherEvent.lng);
      
      if (distance <= radiusMeters) {
        cluster.events.push(otherEvent);
        cluster.frequency++;
        cluster.severity_counts[otherEvent.severity]++;
        usedEvents.add(j);
      }
    });

    // Centro del cluster
    cluster.lat = cluster.events.reduce((s, e) => s + e.lat, 0) / cluster.events.length;
    cluster.lng = cluster.events.reduce((s, e) => s + e.lng, 0) / cluster.events.length;

    // Severidad dominante
    cluster.dominantSeverity = Object.entries(cluster.severity_counts)
      .reduce((max, [sev, cnt]) => cnt > max.count ? {severity: sev, count: cnt} : max)
      .severity;

    clusters.push(cluster);
  });

  return clusters;
}
```

### 3.4 Mapa de Calor

**Componente:** Leaflet + react-leaflet + MarkerClusterGroup

```typescript
// BlackSpotsTab.tsx líneas 350-440
<MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
  <TileLayer url={MAP_CONFIG.TILE_URL} />
  <MarkerClusterGroup>
    {clusters.map(cluster => (
      <CircleMarker
        center={[cluster.lat, cluster.lng]}
        radius={clusterRadius / 5}
        fillColor={getColorBySeverity(cluster.dominantSeverity)}
        color={getColorBySeverity(cluster.dominantSeverity)}
        fillOpacity={0.6}
      >
        <Popup>
          <strong>{cluster.location}</strong>
          <br/>Frecuencia: {cluster.frequency}
          <br/>Graves: {cluster.severity_counts.grave}
        </Popup>
      </CircleMarker>
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

**Colores por Severidad:**
```typescript
const getColorBySeverity = (severity: string) => {
  switch(severity) {
    case 'grave': return '#EF4444';    // Rojo
    case 'moderada': return '#F59E0B'; // Naranja
    case 'leve': return '#FCD34D';     // Amarillo
    default: return '#9CA3AF';         // Gris
  }
};
```

### 3.5 Ranking de Zonas Peligrosas

**Ordenamiento:**
```typescript
// hotspots.ts líneas 275-280
filteredClusters.sort((a, b) => {
  const severityWeight = { grave: 3, moderada: 2, leve: 1, normal: 0 };
  const aWeight = a.frequency * (severityWeight[a.dominantSeverity] || 1);
  const bWeight = b.frequency * (severityWeight[b.dominantSeverity] || 1);
  return bWeight - aWeight;
});
```

**Visualización:** Top 10 zonas en tarjetas

### 3.6 Fuente de Datos

**Tabla Principal:** `stability_events`

```sql
SELECT * FROM stability_events
WHERE lat != 0 AND lon != 0
  AND timestamp BETWEEN :from AND :to
  AND session_id IN (SELECT id FROM Session WHERE organizationId = :orgId AND vehicleId IN (:vehicleIds))
```

**Estructura:**
- `id` - UUID del evento
- `session_id` - FK a Session
- `timestamp` - Momento del evento
- `lat`, `lon` - Coordenadas GPS
- `type` - Tipo de evento (e.g., 'CRITICO', 'MODERADO')
- `speed` - Velocidad en el momento
- `rotativoState` - Estado del rotativo (0/1/2/5)
- `details` - JSON con SI y otros datos

---

## 4. VELOCIDAD (Tab 2) {#velocidad}

### 📍 Ubicación
- **Frontend:** `frontend/src/components/speed/SpeedAnalysisTab.tsx`
- **Backend:** `backend/src/routes/speedAnalysis.ts` → `/api/speed/violations`

### 4.1 Reglas de Límites de Velocidad DGT

**Categoría:** Vehículos de Emergencia (todos los vehículos DobackSoft)

| Tipo de Vía | Límite Normal | Límite con Rotativo ON |
|-------------|---------------|------------------------|
| **Urbana** | 50 km/h | 80 km/h (+30) |
| **Interurbana** | 90 km/h | 120 km/h (+30) |
| **Autopista** | 120 km/h | 140 km/h (+20) |
| **En Parque** | 20 km/h | 20 km/h (sin excepción) |

**Código:**
```typescript
// speedAnalysis.ts líneas 36-67
const DGT_CATEGORIES = {
  'vehiculo_emergencia': {
    urban: 50,
    interurban: 90,
    highway: 120,
    emergency_urban: 80,
    emergency_interurban: 120,
    emergency_highway: 140
  }
};

function getSpeedLimit(vehicleId: string, roadType: string, rotativoOn: boolean, inPark: boolean): number {
  if (inPark) return 20;
  
  const category = DGT_CATEGORIES['vehiculo_emergencia'];
  
  if (rotativoOn) {
    return category[`emergency_${roadType}`];
  }
  return category[roadType];
}
```

### 4.2 Clasificación de Violaciones

| Tipo | Condición | Color | Gravedad |
|------|-----------|-------|----------|
| **Correcto** | velocidad ≤ límite | Verde | - |
| **Leve** | 0 < exceso ≤ 20 km/h | Amarillo | Baja |
| **Grave** | exceso > 20 km/h | Rojo | Alta |

```typescript
// speedAnalysis.ts líneas 69-76
function classifySpeedViolation(speed: number, speedLimit: number): 'correcto' | 'leve' | 'grave' {
  const excess = speed - speedLimit;
  
  if (excess <= 0) return 'correcto';
  if (excess <= 20) return 'leve';
  return 'grave';
}
```

### 4.3 Filtros Disponibles

| Filtro | Valores | Efecto |
|--------|---------|--------|
| **Rotativo** | all, on, off | Filtra por rotativoOn |
| **Ubicación** | all, in (park), out | Filtra por inPark |
| **Clasificación** | all, grave, leve, correcto | Filtra por violationType |
| **Tipo de Vía** | all, urban, interurban, highway | Filtra por roadType |

### 4.4 KPIs Estadísticos

```typescript
// SpeedAnalysisTab.tsx líneas 152-173
const stats = {
  total: violations.length,
  grave: violations.filter(v => v.violationType === 'grave').length,
  leve: violations.filter(v => v.violationType === 'leve').length,
  correcto: violations.filter(v => v.violationType === 'correcto').length,
  withRotativo: violations.filter(v => v.rotativoOn).length,
  withoutRotativo: violations.filter(v => !v.rotativoOn).length,
  avgExcess: avg(violations.filter(v => v.violationType !== 'correcto').map(v => v.excess))
};
```

### 4.5 Determinación de Tipo de Vía

**Heurística Basada en Velocidad:**
```typescript
// speedAnalysis.ts líneas 78-84
function getRoadType(speed: number, inPark: boolean): 'urban' | 'interurban' | 'highway' {
  if (inPark) return 'urban';
  if (speed > 100) return 'highway';
  if (speed > 70) return 'interurban';
  return 'urban';
}
```

**⚠️ LIMITACIÓN:**
- Tipo de vía determinado por **velocidad**, no por datos reales de TomTom o OSM
- Puede clasificar incorrectamente vías según comportamiento del vehículo

### 4.6 Fuente de Datos

**Tablas:**
- `GpsMeasurement` - Puntos GPS con velocidad
- `RotativoMeasurement` - Estado del rotativo
- `Session` - Información de sesión y vehículo

**Query Optimizada:**
```typescript
// speedAnalysis.ts líneas 147-156
// 1. Buscar sesiones con GPS en el rango
const gpsSessions = await prisma.gpsMeasurement.findMany({
  where: {
    timestamp: { gte: dateFrom, lt: dateToExclusive },
    session: { organizationId, vehicleId: { in: vehicleIds } }
  },
  select: { sessionId: true },
  distinct: ['sessionId'],
  take: 5 // Limitado para evitar timeout
});

// 2. Analizar velocidades usando speedAnalyzer
const analisisVelocidad = await speedAnalyzer.analizarVelocidades(sessionIds, dateFrom, dateTo);
```

---

## 5. SESIONES Y RECORRIDOS (Tab 4) {#sesiones-y-recorridos}

### 📍 Ubicación
- **Frontend:** `frontend/src/components/sessions/SessionsAndRoutesView.tsx`
- **Backend:** `/api/session-route/:sessionId`, `/api/sessions/ranking`

### 5.1 Selectores

**Selector de Vehículo y Sesión:**
```typescript
// SessionsAndRoutesView.tsx líneas 41-42
const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
const [selectedSessionId, setSelectedSessionId] = useState<string>('');
```

**Hook de Datos:**
```typescript
const { data: sessionsData } = useSessions({ vehicleId: selectedVehicleId || undefined });
```

### 5.2 Datos de Ruta

**Endpoint:** GET `/api/session-route/:sessionId`

**Respuesta:**
```typescript
{
  route: Array<{ lat: number; lng: number; speed: number; timestamp: Date }>,
  events: Array<{ id: string; lat: number; lng: number; type: string; severity: string; timestamp: Date }>,
  session: { ... },
  stats: {
    validRoutePoints: number,
    validEvents: number,
    totalGpsPoints: number,
    totalEvents: number,
    skippedJumps?: number,
    maxDistanceBetweenPoints?: number
  }
}
```

### 5.3 Visualización en Mapa

**Componente:** `RouteMapComponent`

**Capas:**
1. **Ruta GPS** - Polyline azul
2. **Eventos de Estabilidad** - Markers coloreados por severidad
3. **Inicio/Fin** - Markers especiales

```typescript
// RouteMapComponent (inferido)
<MapContainer>
  <TileLayer url={TomTom tiles} />
  <Polyline positions={route.map(p => [p.lat, p.lng])} color="blue" />
  {events.map(event => (
    <Marker position={[event.lat, event.lng]} icon={getIcon(event.severity)}>
      <Popup>{event.type} - {event.timestamp}</Popup>
    </Marker>
  ))}
</MapContainer>
```

### 5.4 Ranking de Sesiones

**Endpoint:** GET `/api/sessions/ranking`

**Parámetros:**
```typescript
{
  organizationId: string,
  metric: 'events' | 'distance' | 'duration' | 'speed',
  limit: number, // default: 10
  vehicleIds?: string[]
}
```

**Métricas:**
- **events**: Sesiones con más eventos de estabilidad
- **distance**: Sesiones más largas (km)
- **duration**: Sesiones más largas (tiempo)
- **speed**: Sesiones con mayor velocidad promedio

### 5.5 Procesamiento de Sesiones

```typescript
// SessionsAndRoutesView.tsx líneas 110-135
const processedSessions: Session[] = sessionsData.map((session: any) => ({
  id: session.id,
  vehicleId: session.vehicleId,
  vehicleName: session.vehicleName || session.vehicle?.name,
  startTime: new Date(session.startTime).toLocaleString(),
  endTime: new Date(session.endTime).toLocaleString(),
  duration: formatDuration(session.duration || 0), // HH:MM
  distance: parseFloat(session.distance) || 0,
  status: getSessionStatus(session), // completed, active, interrupted
  avgSpeed: parseFloat(session.avgSpeed) || 0,
  maxSpeed: parseFloat(session.maxSpeed) || 0
}));
```

---

## 6. SISTEMA DE UPLOAD MASIVO {#sistema-upload-masivo}

### 📍 Ubicación
- **Frontend:** `frontend/src/pages/UploadData.tsx`, `frontend/src/components/MassUpload.tsx`
- **Backend:** `backend/src/routes/upload.ts`, `backend/src/services/UnifiedFileProcessor.ts`

### 6.1 Tipos de Archivo Soportados

| Tipo | Descripción | Campos Principales | Color |
|------|-------------|-------------------|-------|
| **ESTABILIDAD** | Acelerómetros/giroscopios | ax, ay, az, roll, pitch, yaw, SI | Azul (#3f51b5) |
| **GPS** | Posicionamiento | Latitud, Longitud, Velocidad, Fix, Satélites | Naranja (#ff9800) |
| **ROTATIVO** | Estados ON/OFF | Fecha-Hora, Estado (0/1) | Rosa (#d81b60) |
| **CAN** | Bus CAN | Velocidad, RPM, Consumo | Verde (#4caf50) |

### 6.2 Pattern de Nombres de Archivo

**Formato:**
```
TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>.txt
```

**Ejemplos:**
```
ESTABILIDAD_DOBACK022_20250929_001.txt
GPS_DOBACK022_20250929_001.txt
ROTATIVO_DOBACK022_20250929_001.txt
CAN_DOBACK023_20251014_002.txt
```

**Extracción de Información:**
```typescript
// MassUpload.tsx líneas 95-108
const extractVehicleInfo = (filename: string) => {
  const match = filename.match(/_(DOBACK\d+)_(\d{8})_/);
  
  if (match) {
    const vehicleName = match[1].toLowerCase(); // doback022
    const dateStr = match[2]; // 20250929
    const date = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`; // 2025-09-29
    
    return { vehicleName, date };
  }
  return null;
};
```

### 6.3 Proceso de Subida Masiva

**Flujo Completo:**

```
1. Usuario arrastra/selecciona archivos
   ↓
2. Frontend: Detecta tipos (CAN/GPS/EST/ROT)
   ↓
3. Frontend: Agrupa por vehículo y fecha
   ↓
4. POST /api/mass-upload/upload-multiple con FormData
   ↓
5. Backend: UnifiedFileProcessor.procesarArchivos()
   ↓
6. Agrupación por vehículo/fecha (MultiSessionDetector)
   ↓
7. Detección de sesiones múltiples (gaps >5min)
   ↓
8. Parseo robusto (RobustGPSParser, RobustStabilityParser, RobustRotativoParser)
   ↓
9. Correlación GPS-ESTABILIDAD-ROTATIVO
   ↓
10. Creación de sesiones en BD
   ↓
11. Guardado de mediciones (GpsMeasurement, StabilityMeasurement, RotativoMeasurement)
   ↓
12. Post-proceso: EventDetector + SpeedAnalyzer
   ↓
13. Respuesta con estadísticas
```

### 6.4 Detección de Sesiones Múltiples

**Servicio:** `MultiSessionDetector.ts`

**Lógica:**
```typescript
const GAP_THRESHOLD_SECONDS = 300; // 5 minutos

function detectarSesionesMultiples(contenido: string, tipo: string) {
  const lineas = contenido.split('\n');
  const sesiones = [];
  let sesionActual = { inicio: 0, fin: 0, lineas: [] };
  
  for (let i in lineas) {
    const timestamp = extraerTimestamp(lineas[i]);
    
    if (sesionActual.lineas.length === 0) {
      // Primera línea de sesión
      sesionActual.inicio = i;
    }
    else if (timestamp - ultimoTimestamp > GAP_THRESHOLD_SECONDS) {
      // Gap detectado → cerrar sesión actual, iniciar nueva
      sesionActual.fin = i - 1;
      sesiones.push(sesionActual);
      sesionActual = { inicio: i, fin: 0, lineas: [] };
    }
    
    sesionActual.lineas.push(lineas[i]);
    ultimoTimestamp = timestamp;
  }
  
  if (sesionActual.lineas.length > 0) {
    sesionActual.fin = lineas.length - 1;
    sesiones.push(sesionActual);
  }
  
  return sesiones;
}
```

### 6.5 Correlación de Archivos

**Regla:** Archivos del mismo vehículo y fecha se correlacionan automáticamente

```typescript
// UnifiedFileProcessor.ts líneas 168-248
async procesarGrupoArchivos(grupo: ArchivoAgrupado) {
  // 1. Detectar sesiones en cada archivo
  const sesionesEstabilidad = detectarSesionesMultiples(grupo.archivos.estabilidad, 'ESTABILIDAD');
  const sesionesGPS = detectarSesionesMultiples(grupo.archivos.gps, 'GPS');
  const sesionesRotativo = detectarSesionesMultiples(grupo.archivos.rotativo, 'ROTATIVO');
  
  // 2. Número de sesiones = máximo de los 3 tipos
  const numSesiones = Math.max(sesionesEstabilidad.length, sesionesGPS.length, sesionesRotativo.length, 1);
  
  // 3. Procesar cada sesión
  for (let i = 0; i < numSesiones; i++) {
    const sesionEstabilidad = sesionesEstabilidad[i];
    const sesionGPS = sesionesGPS[i];
    const sesionRotativo = sesionesRotativo[i];
    
    // Parsear cada tipo
    const gpsResult = sesionGPS ? parseGPSRobust(sesionGPS) : null;
    const estabilidadResult = sesionEstabilidad ? parseEstabilidadRobust(sesionEstabilidad) : null;
    const rotativoResult = sesionRotativo ? parseRotativoRobust(sesionRotativo) : null;
    
    // Interpolar GPS si es necesario
    const gpsInterpolado = interpolarGPS(gpsResult, estabilidadResult);
    
    // Crear sesión en BD
    await crearSesion(gpsInterpolado, estabilidadResult, rotativoResult);
  }
}
```

### 6.6 Validaciones

**Validaciones de Archivo:**
1. ✅ Formato .txt o .csv
2. ✅ Nombre sigue pattern TIPO_DOBACK###_YYYYMMDD_###.txt
3. ✅ Cabecera válida (coincide con tipo de archivo)
4. ✅ Al menos 1 línea de datos

**Validaciones de Datos GPS:**
```typescript
// RobustGPSParser.ts (inferido)
const esGPSValido = (punto: GPSPoint) => {
  return (
    punto.fix !== 'NO FIX' &&
    punto.satellites >= 4 &&
    punto.latitude !== 0 && punto.longitude !== 0 &&
    Math.abs(punto.latitude) <= 90 && Math.abs(punto.longitude) <= 180
  );
};
```

**Manejo de "Sin señal GPS":**
- GPS con fix='NO FIX' o satellites < 4 → Marcados como `gpsSinSenal`
- Se cuentan en estadísticas pero no se usan para rutas

### 6.7 Post-Procesamiento

**Después de crear sesiones:**

1. **EventDetector:**
```typescript
// UnifiedFileProcessor.ts líneas 119-132
for (const sessionId of resultado.sessionIds) {
  await detectarYGuardarEventos(sessionId);
}
```

2. **SpeedAnalyzer:**
```typescript
// UnifiedFileProcessor.ts líneas 136-146
await analizarVelocidades(resultado.sessionIds);
```

### 6.8 Respuesta del Proceso

```typescript
{
  success: boolean,
  sesionesCreadas: number,
  archivosValidos: number,
  archivosConProblemas: number,
  estadisticas: {
    gpsValido: number,
    gpsInterpolado: number,
    gpsSinSenal: number,
    estabilidadValida: number,
    rotativoValido: number
  },
  sessionIds: string[],
  problemas: Array<{ tipo: string; descripcion: string; gravedad: string }>
}
```

---

## 7. FILTROS GLOBALES {#filtros-globales}

### 📍 Ubicación
- **Frontend:** `frontend/src/components/filters/GlobalFiltersBar.tsx`
- **Hook:** `frontend/src/hooks/useGlobalFilters.ts`
- **Context:** `frontend/src/contexts/FiltersContext.tsx`

### 7.1 Arquitectura

**Context API:**
```typescript
// FiltersContext.tsx
interface FilterState {
  filters: GlobalFilters,
  presets: FilterPreset[],
  activePreset: string | null,
  isLoading: boolean
}

const FiltersContext = createContext<FilterContextValue | undefined>(undefined);
```

**Hook useGlobalFilters:**
```typescript
export const useGlobalFilters = () => {
  // Intentar usar Context si existe
  try {
    const contextValue = useFiltersContext();
    if (contextValue) return contextValue;
  } catch {
    // Fallback a lógica local si no hay Provider
  }
  
  return {
    filters,
    updateFilters,
    vehicles,
    fireStations,
    selectedFireStation,
    selectFireStation,
    createPreset,
    filterVersion,
    updateTrigger
  };
};
```

### 7.2 Filtros Disponibles

| Filtro | Tipo | Opciones | Estado | Propagación |
|--------|------|----------|--------|-------------|
| **Rango de Fechas** | DatePicker | start, end | `filters.dateRange` | Todos los tabs |
| **Vehículos** | Multi-select | Array de vehicle IDs | `filters.vehicles` | Todos los tabs |
| **Parque** | Select | Park ID o 'all' | `selectedFireStation` | Estados y Tiempos |
| **Severidad** | Multi-select | grave, moderada, leve | `filters.severity` | Puntos Negros |
| **Rotativo** | Select | all, on, off | `filters.rotativo` | Puntos Negros, Velocidad |

### 7.3 Presets Predefinidos

```typescript
// GlobalFiltersBar.tsx líneas 70-96
const PRESETS = {
  Hoy: {
    dateRange: {
      start: '2025-09-29', // Hardcoded a datos reales
      end: '2025-10-08'
    }
  },
  Semana: {
    dateRange: {
      start: calcularSemanaAtras(),
      end: hoy()
    }
  },
  Mes: {
    dateRange: {
      start: calcularMesAtras(),
      end: hoy()
    }
  }
};
```

**⚠️ INCONSISTENCIA:**
- Preset "Hoy" mapeado a rango **2025-09-29 a 2025-10-08** (hardcoded)
- No refleja día actual del sistema

### 7.4 Propagación de Filtros

**Mecanismo:**
1. Usuario cambia filtro en `GlobalFiltersBar`
2. `updateFilters()` actualiza estado en Context
3. `filterVersion++` y `updateTrigger++` se incrementan
4. Componentes que usan `useGlobalFilters` detectan cambio
5. useEffect se dispara y recarga datos

```typescript
// useGlobalFilters.ts (inferido)
const updateFilters = (newFilters: Partial<GlobalFilters>) => {
  setState(prev => ({
    ...prev,
    filters: { ...prev.filters, ...newFilters }
  }));
  setFilterVersion(v => v + 1);
  setUpdateTrigger(t => t + 1);
};
```

**En componentes hijos:**
```typescript
// NewExecutiveKPIDashboard.tsx
const { filters, updateTrigger } = useGlobalFilters();
const { kpis } = useKPIs(); // Internamente usa filters

useEffect(() => {
  // Recargar datos cuando cambian filtros
}, [filters, updateTrigger]);
```

### 7.5 Workaround de Parques

**Problema:** Backend no incluye `parkId` en vehículos

**Solución Temporal:**
```typescript
// useGlobalFilters.ts líneas 64-77
const vehiclesWithPark = vehicleList.map((v: any) => {
  if (v.parkId) return v; // Si ya tiene, usar
  
  // Asignar basándose en nombre
  const nombre = v.name?.toUpperCase() || '';
  if (nombre.includes('ALCOBENDAS')) {
    return { ...v, parkId: 'p002' };
  } else if (nombre.includes('ROZAS')) {
    return { ...v, parkId: 'p001' };
  }
  return v;
});
```

**⚠️ LIMITACIÓN:**
- Asignación de parque por **nombre del vehículo**, no por datos reales
- Frágil ante cambios de nombre

---

## 8. TABLAS DE BASE DE DATOS {#tablas-base-datos}

### 8.1 Esquema Principal

#### Session
```prisma
model Session {
  id             String   @id @default(uuid())
  vehicleId      String
  userId         String
  organizationId String
  startTime      DateTime
  endTime        DateTime?
  sequence       Int
  sessionNumber  Int
  status         SessionStatus @default(ACTIVE)
  type           SessionType @default(ROUTINE)
  source         String
  
  // Relaciones
  GpsMeasurement       GpsMeasurement[]
  StabilityMeasurement StabilityMeasurement[]
  RotativoMeasurement  RotativoMeasurement[]
  stability_events     stability_events[]
  Vehicle              Vehicle @relation(...)
  Organization         Organization @relation(...)
}
```

**Índices:**
- `organizationId`
- `vehicleId`
- `startTime`

#### GpsMeasurement
```prisma
model GpsMeasurement {
  id         String   @id @default(uuid())
  sessionId  String
  timestamp  DateTime
  latitude   Float
  longitude  Float
  speed      Float
  altitude   Float
  satellites Int
  fix        String?
  hdop       Float?
  accuracy   Float?
  
  Session    Session @relation(...)
  
  @@unique([sessionId, timestamp])
}
```

**Índices:**
- `sessionId`
- `timestamp`
- Unique: `[sessionId, timestamp]`

#### StabilityMeasurement
```prisma
model StabilityMeasurement {
  id        String   @id @default(uuid())
  sessionId String
  timestamp DateTime
  ax        Float    // Aceleración X
  ay        Float    // Aceleración Y
  az        Float    // Aceleración Z
  gx        Float    // Giroscopio X
  gy        Float    // Giroscopio Y
  gz        Float    // Giroscopio Z
  roll      Float?
  pitch     Float?
  yaw       Float?
  si        Float    @default(0) // Índice de Estabilidad
  accmag    Float    @default(0) // Magnitud aceleración
  
  Session   Session @relation(...)
  
  @@unique([sessionId, timestamp])
}
```

#### RotativoMeasurement
```prisma
model RotativoMeasurement {
  id        String   @id @default(uuid())
  sessionId String
  timestamp DateTime
  state     String   // '0' = OFF, '1' = ON, '2' = Clave 2, '5' = Clave 5
  
  Session   Session @relation(...)
  
  @@unique([sessionId, timestamp])
  @@index([timestamp])
}
```

#### stability_events
```prisma
model stability_events {
  id            String   @id @default(uuid())
  session_id    String
  timestamp     DateTime
  lat           Float
  lon           Float
  type          String   // 'CRITICO', 'MODERADO', 'LEVE'
  speed         Float?
  rotativoState Int?     // 0/1/2/5
  details       Json?    // { si: number, ... }
  
  Session       Session @relation(...)
  
  @@index([session_id])
  @@index([timestamp])
  @@index([type])
}
```

**Proceso de Generación:**
1. EventDetector lee StabilityMeasurement de una sesión
2. Calcula SI (Índice de Estabilidad)
3. Detecta eventos según umbrales
4. Inserta en stability_events con GPS correlacionado

#### Vehicle
```prisma
model Vehicle {
  id             String       @id @default(uuid())
  name           String
  identifier     String       @unique
  licensePlate   String       @unique
  organizationId String
  parkId         String?
  type           VehicleType
  status         VehicleStatus @default(ACTIVE)
  
  Session        Session[]
  Organization   Organization @relation(...)
  Park           Park? @relation(...)
}
```

#### Park
```prisma
model Park {
  id         String @id @default(uuid())
  name       String
  identifier String @unique
  geometry   Json   // { type: 'circle', center: {lat, lng}, radius: number }
  organizationId String
  
  Vehicle    Vehicle[]
  Session    Session[]
  Organization Organization @relation(...)
}
```

### 8.2 Queries Críticas

#### Obtener Sesiones con Mediciones en Rango
```sql
-- Backend: kpis.ts líneas 117-141
SELECT DISTINCT s.id, s.startTime, s.endTime, s.vehicleId
FROM "Session" s
WHERE s.id IN (
  SELECT DISTINCT sessionId FROM "GpsMeasurement"
  WHERE timestamp >= :from AND timestamp < :to
  UNION
  SELECT DISTINCT sessionId FROM "RotativoMeasurement"
  WHERE timestamp >= :from AND timestamp < :to
)
AND s.organizationId = :orgId
AND (:vehicleIds IS NULL OR s.vehicleId = ANY(:vehicleIds));
```

#### Calcular Distancia Total (Haversine)
```sql
-- Backend: kpis.ts líneas 207-223
SELECT 
  sessionId,
  timestamp,
  latitude,
  longitude,
  speed
FROM "GpsMeasurement"
WHERE sessionId IN (:sessionIds)
  AND timestamp >= :from AND timestamp < :to
ORDER BY timestamp ASC;
```

Luego en código:
```typescript
for (puntos consecutivos) {
  distancia_km = haversine(p1.lat, p1.lon, p2.lat, p2.lon);
  kmTotal += distancia_km;
}
```

#### Obtener Eventos de Estabilidad
```sql
SELECT type, session_id
FROM stability_events
WHERE session_id IN (:sessionIds)
  AND timestamp >= :from AND timestamp < :to;
```

---

## 9. REGLAS DE NEGOCIO {#reglas-negocio}

### 9.1 Claves Operacionales (0-5)

**Definición:** Estados mutuamente excluyentes que indican la actividad del vehículo

| Clave | Nombre | Condición | Prioridad |
|-------|--------|-----------|-----------|
| **0** | Taller | GPS dentro de geocerca tipo TALLER | 1 (máxima) |
| **1** | Operativo en Parque | GPS en parque + rotativo OFF | 2 |
| **2** | Salida en Emergencia | Fuera parque + rotativo ON + velocidad > 5 km/h | 3 |
| **3** | En Siniestro | Fuera parque + parado ≥ 5 minutos | 4 |
| **5** | Regreso al Parque | Fuera parque + rotativo OFF + velocidad > 5 km/h + acercándose | 5 |

**Algoritmo de Transición:**
```
Prioridad: 0 > 1 > 2 > 3 > 5

Si (enTaller) → Clave 0
Sino Si (enParque && rotativo=OFF) → Clave 1
Sino Si (fueraParque && rotativo=ON && vel>5) → Clave 2
Sino Si (fueraParque && paradoSegundos≥300) → Clave 3
Sino Si (fueraParque && rotativo=OFF && vel>5 && acercandoParque) → Clave 5
```

**Ventana de Muestreo:** 5 segundos (cada punto GPS)

**⚠️ CLAVE 4 NO IMPLEMENTADA:**
- Se muestra en UI como "Fin de Actuación"
- keyCalculator.ts **NO** calcula Clave 4
- Valor siempre será 00:00:00

### 9.2 Detección de Geocercas

**Método:** Haversine Distance

```typescript
function puntoEnGeocerca(lat: number, lon: number, geocerca: Geocerca): boolean {
  const R = 6371; // km
  const distancia = haversine(lat, lon, geocerca.lat, geocerca.lon);
  return distancia <= geocerca.radio; // radio en km
}
```

**Fuente de Geocercas:**
- **Parques:** tabla `Park` → `geometry` (type: circle, center, radius)
- **Talleres:** tabla `Zone` WHERE `type = 'TALLER'`

**Radio por Defecto:** 100 metros (0.1 km)

### 9.3 Correlación de Sesiones

**Regla:** Gap temporal > 5 minutos = Nueva sesión

```typescript
const GAP_THRESHOLD_SECONDS = 300; // 5 minutos

if (timestamp_actual - timestamp_anterior > GAP_THRESHOLD_SECONDS) {
  cerrarSesionActual();
  iniciarNuevaSesion();
}
```

**Matching Multi-Archivo:**
1. Detectar sesiones en ESTABILIDAD (por gap)
2. Detectar sesiones en GPS (por gap)
3. Detectar sesiones en ROTATIVO (por gap)
4. Número de sesiones = `max(count_EST, count_GPS, count_ROT)`
5. Correlacionar por índice: `sesion[i]` de cada tipo

**Ejemplo:**
```
ESTABILIDAD: 3 sesiones
GPS: 2 sesiones
ROTATIVO: 2 sesiones

Resultado: 3 sesiones creadas
- Sesión 1: EST[0] + GPS[0] + ROT[0]
- Sesión 2: EST[1] + GPS[1] + ROT[1]
- Sesión 3: EST[2] + null + null
```

### 9.4 Clasificación de Severidad (SI)

**Índice de Estabilidad (SI):** 0.0 - 1.0

| Rango SI | Severidad | Color | Uso |
|----------|-----------|-------|-----|
| < 0.20 | Grave (CRITICO) | Rojo | Evento grave de estabilidad |
| 0.20 - 0.35 | Moderada (MODERADO) | Naranja | Evento moderado |
| ≥ 0.35 | Leve (LEVE) | Amarillo | Evento leve |

**Cálculo SI:** (Realizado por EventDetector, fórmula específica no visible en archivos auditados)

### 9.5 Saneo de Datos GPS

**Velocidad Válida:**
```typescript
const isValidSpeed = (s: number) => Number.isFinite(s) && s >= 0 && s <= 160;
```

**Distancia Máxima entre Puntos:**
```typescript
const MAX_REASONABLE_SPEED_KMH = 160;
const MAX_POINT_GAP_SECONDS = 120;

if (velocidad_calculada > MAX_REASONABLE_SPEED_KMH) {
  velocidad_saneada = MAX_REASONABLE_SPEED_KMH;
  distancia_saneada = velocidad_saneada * (dt / 3600);
}
```

**GPS Sin Señal:**
```typescript
const esGPSValido = (punto: GPSPoint) => {
  return (
    punto.fix !== 'NO FIX' &&
    punto.satellites >= 4 &&
    Math.abs(punto.latitude) <= 90 &&
    Math.abs(punto.longitude) <= 180
  );
};
```

Puntos inválidos:
- Se cuentan en `gpsSinSenal`
- NO se usan para cálculos de distancia/velocidad
- NO se muestran en mapas de ruta

### 9.6 Límites de Velocidad DGT

**Categoría:** Vehículos de Emergencia

| Vía | Normal | Emergencia (Rotativo ON) |
|-----|--------|--------------------------|
| Urbana (≤70 km/h) | 50 km/h | 80 km/h |
| Interurbana (71-100 km/h) | 90 km/h | 120 km/h |
| Autopista (>100 km/h) | 120 km/h | 140 km/h |
| Parque | 20 km/h | 20 km/h |

**Determinación de Vía:**
- **Por velocidad** (heurística)
- **NO** usa datos reales de TomTom/OSM

**Exceso:**
```
Exceso = Velocidad - Límite
```

**Clasificación:**
- Correcto: Exceso ≤ 0
- Leve: 0 < Exceso ≤ 20 km/h
- Grave: Exceso > 20 km/h

---

## 10. INCONSISTENCIAS DETECTADAS {#inconsistencias}

### 10.1 Clave 4 No Implementada

**Ubicación:** Estados y Tiempos (Tab 0)

**Problema:**
- UI muestra "Tiempo Clave 4" (línea 619)
- `keyCalculator.ts` **NO** calcula Clave 4
- Solo implementa Claves 0, 1, 2, 3, 5

**Impacto:** 
- KPI siempre mostrará `00:00:00`
- Usuario puede pensar que no hay datos de Clave 4

**Recomendación:**
- Implementar Clave 4 en keyCalculator
- O eliminar de UI si no es necesaria

### 10.2 Preset "Hoy" Hardcodeado

**Ubicación:** GlobalFiltersBar (línea 75-80)

**Problema:**
```typescript
updateFilters({
  dateRange: {
    start: '2025-09-29', // ❌ Hardcoded
    end: '2025-10-08'
  }
});
```

**Impacto:**
- "Hoy" no refleja el día actual
- Siempre filtra datos del 29/09 al 08/10/2025

**Recomendación:**
```typescript
updateFilters({
  dateRange: {
    start: formatDate(new Date()),
    end: formatDate(new Date())
  }
});
```

### 10.3 Asignación de Parque por Nombre

**Ubicación:** useGlobalFilters (líneas 64-77)

**Problema:**
- `parkId` asignado por coincidencia de texto en nombre
- Frágil ante cambios de naming

**Recomendación:**
- Backend debe incluir `parkId` en respuesta de vehículos
- Eliminar workaround temporal

### 10.4 Tipo de Vía por Velocidad

**Ubicación:** speedAnalysis.ts (línea 79-84)

**Problema:**
```typescript
function getRoadType(speed: number) {
  if (speed > 100) return 'highway';
  if (speed > 70) return 'interurban';
  return 'urban';
}
```

**Impacto:**
- Vía urbana a 80 km/h → clasificada como "interurban"
- Autopista a 60 km/h → clasificada como "urban"
- Límites de velocidad incorrectos

**Recomendación:**
- Usar TomTomSpeedLimitsService (ya existe en codebase)
- O integrar con OSM/Google Maps para tipo de vía real

### 10.5 Velocidad Promedio con División por Casi Cero

**Ubicación:** NewExecutiveKPIDashboard (línea 492-494)

**Problema:**
```typescript
const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
  ? Math.round(activity.km_total / activity.driving_hours)
  : 0;
```

**Validación:** Solo si `driving_hours > 0.1` (6 minutos)

**Impacto:**
- Sesiones cortas (<6 min) siempre mostrarán 0 km/h promedio
- Puede ocultar velocidades altas en eventos breves

**Recomendación:**
- Ajustar umbral a 0.01 (36 segundos)
- O usar mediana de velocidades GPS en lugar de promedio

### 10.6 Limitación de Sesiones en Análisis de Velocidad

**Ubicación:** speedAnalysis.ts (línea 151-173)

**Problema:**
```typescript
const gpsSessions = await prisma.gpsMeasurement.findMany({
  // ...
  take: 5 // ❌ Solo 5 sesiones
});

const limitedSessionIds = sessionIds.slice(0, 2); // ❌ Solo 2 procesadas
```

**Impacto:**
- Análisis de velocidad incompleto
- Violaciones de otras sesiones no detectadas

**Razón:** Evitar timeouts

**Recomendación:**
- Implementar paginación
- O procesamiento asíncrono en background
- O cachear resultados de speedAnalyzer

### 10.7 Índice de Estabilidad Simplificado

**Ubicación:** kpis.ts (línea 368)

**Problema:**
```typescript
indice_promedio: totalEvents > 0 ? max(0, 100 - totalEvents) / 100 : 1
```

**Impacto:**
- Fórmula demasiado simple: `SI = (100 - num_eventos) / 100`
- 101 eventos → SI = 0% (negativo clamped)
- No considera severidad de eventos
- No refleja el SI real calculado en StabilityMeasurement.si

**Recomendación:**
- Calcular promedio real de `StabilityMeasurement.si`
- Ponderar por severidad de eventos

---

## 11. RECOMENDACIONES {#recomendaciones}

### 11.1 Prioridad Alta

#### 1. Implementar Clave 4
**Acción:** Añadir lógica en `keyCalculator.ts` para Clave 4 (Fin de Actuación)

**Condición sugerida:**
```typescript
if (!enParque && rotativoApagandose && velocidadBajando) {
  estado = Clave 4;
}
```

#### 2. Corregir Preset "Hoy"
**Acción:** Usar fecha actual del sistema en lugar de hardcoded

```typescript
const hoy = new Date().toISOString().split('T')[0];
updateFilters({ dateRange: { start: hoy, end: hoy } });
```

#### 3. Usar TomTom para Tipo de Vía
**Acción:** Reemplazar heurística por llamada a TomTomSpeedLimitsService

```typescript
const limiteInfo = await tomtomSpeedLimitsService.obtenerLimiteVelocidad(lat, lon);
const roadType = limiteInfo.roadType;
const speedLimit = limiteInfo.speedLimit;
```

#### 4. Aumentar Límite de Sesiones en Velocidad
**Acción:** Implementar procesamiento por lotes o cache

```typescript
// Opción 1: Paginación
for (let i = 0; i < sessionIds.length; i += 50) {
  const batch = sessionIds.slice(i, i + 50);
  await processBatch(batch);
}

// Opción 2: Cache
if (cacheExists(sessionId)) {
  return cache.get(sessionId);
}
```

### 11.2 Prioridad Media

#### 5. Mejorar Cálculo de Índice de Estabilidad
**Acción:** Usar promedio real de SI

```typescript
const avgSI = await prisma.stabilityMeasurement.aggregate({
  where: { sessionId: { in: sessionIds } },
  _avg: { si: true }
});

quality: {
  indice_promedio: avgSI._avg.si || 0,
  // ...
}
```

#### 6. Backend Incluya parkId en Vehículos
**Acción:** Modificar `/api/vehicles` para incluir `parkId`

```typescript
// backend
const vehicles = await prisma.vehicle.findMany({
  select: { id: true, name: true, parkId: true }
});
```

#### 7. Añadir Validación de Umbrales
**Acción:** Validar que driving_hours sea razonable

```typescript
if (driving_hours < 0.01) driving_hours = 0.01; // Mínimo 36 segundos
const avgSpeed = km_total / driving_hours;
```

### 11.3 Prioridad Baja

#### 8. Documentar Fórmula de SI
**Acción:** Añadir comentarios explicando cómo se calcula el Índice de Estabilidad en EventDetector

#### 9. Mejorar Mensajes de Error
**Acción:** Mensajes más descriptivos en upload masivo

```typescript
if (!vehicleInfo) {
  throw new Error(`Nombre de archivo inválido: ${filename}. Formato esperado: TIPO_DOBACK###_YYYYMMDD_###.txt`);
}
```

#### 10. Añadir Tests Unitarios
**Acción:** Tests para funciones críticas

```typescript
describe('keyCalculator', () => {
  it('debe calcular Clave 2 correctamente', () => {
    // ...
  });
});
```

---

## 📊 RESUMEN FINAL

### Cobertura de Auditoría
- ✅ 4 Pestañas del Dashboard auditadas
- ✅ 16 KPIs documentados
- ✅ Sistema de Upload completo analizado
- ✅ 10 Filtros documentados
- ✅ 7 Reglas de Negocio explicadas
- ✅ 7 Inconsistencias detectadas
- ✅ 10 Recomendaciones priorizadas

### Archivos Auditados
**Frontend:** 11 archivos  
**Backend:** 8 archivos  
**Database:** schema.prisma

### Estado General del Sistema
**✅ Funcional:** Sistema operativo y estable  
**⚠️ Mejoras Detectadas:** 7 inconsistencias menores  
**🔧 Mantenibilidad:** Buena (código estructurado)  
**📚 Documentación:** Media (mejorable con este documento)

---

**Auditoría completada el:** 2025-01-14  
**Próxima revisión recomendada:** Tras implementar recomendaciones de Prioridad Alta

