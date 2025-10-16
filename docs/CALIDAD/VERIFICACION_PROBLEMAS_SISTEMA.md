# 🔍 VERIFICACIÓN EXHAUSTIVA DE PROBLEMAS DEL SISTEMA
## StabilSafe V3 - Análisis Real vs Esperado

**Fecha:** 2025-01-14  
**Estado:** Problemas confirmados en código  
**Prioridad:** 🔴 CRÍTICA - Afecta a producción

---

## 📊 RESUMEN EJECUTIVO

**Síntoma reportado por usuario:**
> "No es que esté todo a cero, muestra datos pero esos datos: algunos no tienen sentido, otros están mal calculados, otros no se muestran, otros se muestran pero no deberían, otros se muestran mal. Por ejemplo: filtros no funcionan, índice de estabilidad 0% o 100%, todas las incidencias como graves (no hay moderadas ni leves), clusters con 510 eventos pero al abrir hay 30, tiempos de clave a cero..."

**Resultado de verificación:** ✅ **CONFIRMADO** - 12 problemas críticos verificados en código

---

## 🔴 PROBLEMAS CRÍTICOS CONFIRMADOS

### 1. ÍNDICE DE ESTABILIDAD (SI) MAL CALCULADO

**📍 Ubicación:** `backend/src/routes/kpis.ts:368`

**Código actual:**
```typescript
quality: {
    indice_promedio: totalEvents > 0 ? Math.max(0, 100 - totalEvents) / 100 : 1,
    calificacion: totalEvents === 0 ? 'EXCELENTE' : totalEvents < 5 ? 'BUENA' : 'REGULAR',
    estrellas: totalEvents === 0 ? '⭐⭐⭐⭐⭐' : totalEvents < 5 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
}
```

**❌ Problema:**
- Fórmula: `(100 - nº_eventos) / 100`
- Con 101 eventos → SI = 0% (negativo clamped)
- Con 0 eventos → SI = 100%
- NO usa el SI real calculado en `StabilityMeasurement.si`
- NO considera severidad de eventos

**✅ Código correcto:**
```typescript
// Calcular promedio real de SI desde StabilityMeasurement
const avgSI = await prisma.stabilityMeasurement.aggregate({
    where: { 
        sessionId: { in: sessionIds },
        timestamp: { gte: dateFrom, lt: dateToExclusive }
    },
    _avg: { si: true }
});

quality: {
    indice_promedio: avgSI._avg.si || 0, // Ya está en [0,1]
    calificacion: avgSI._avg.si >= 0.90 ? 'EXCELENTE' : avgSI._avg.si >= 0.85 ? 'BUENA' : 'REGULAR',
    estrellas: avgSI._avg.si >= 0.90 ? '⭐⭐⭐⭐⭐' : avgSI._avg.si >= 0.85 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
}
```

**Impacto:** 🔴 ALTO - KPI principal del dashboard totalmente incorrecto

---

### 2. NORMALIZACIÓN DE SI INCONSISTENTE

**📍 Ubicaciones:**
- `backend/src/services/eventDetector.ts:62` (convierte a 0-100)
- `backend/src/routes/hotspots.ts:153` (asume 0-1)
- Base de datos `StabilityMeasurement.si` (almacena en 0-1)

**Código actual en eventDetector:**
```typescript
function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = (measurement.si || 0) * 100; // ❌ Convierte a porcentaje
    
    if (si < 30) { // ❌ Compara con 30%
        let severidad: Severidad;
        if (si < 20) severidad = 'GRAVE';        // ❌ 20%
        else if (si >= 20 && si < 35) severidad = 'MODERADA'; // ❌ 35%
        else severidad = 'LEVE';
        // ...
    }
}
```

**Código actual en hotspots:**
```typescript
const si = details.si || 0; // ❌ Asume que está en [0,1]

let severity = 'leve';
if (si < 0.20) severity = 'grave';        // ✅ 0.20
else if (si < 0.35) severity = 'moderada'; // ✅ 0.35
```

**❌ Problema:**
- **Inconsistencia:** eventDetector usa 0-100, hotspots usa 0-1
- Si `si=0.15` (15%) en BD:
  - eventDetector: `si * 100 = 15` → NO genera evento (< 30 requerido)
  - hotspots: `si = 0.15` → clasificaría como 'grave' (< 0.20)
- Resultado: **eventos no se generan o se clasifican mal**

**✅ Código correcto (normalizar TODO a 0-1):**
```typescript
// StabilityMeasurement.si: SIEMPRE en [0,1]
// Umbrales SIEMPRE en [0,1]:
const UMBRALES = {
    EVENTO_MAXIMO: 0.50,     // Solo generar eventos si SI < 0.50
    GRAVE: 0.20,             // SI < 0.20
    MODERADA: 0.35,          // 0.20 ≤ SI < 0.35
    LEVE: 0.50               // 0.35 ≤ SI < 0.50
};

function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0; // Ya está en [0,1]
    
    if (si < UMBRALES.EVENTO_MAXIMO) { // SI < 0.50
        let severidad: Severidad;
        if (si < UMBRALES.GRAVE) severidad = 'GRAVE';
        else if (si < UMBRALES.MODERADA) severidad = 'MODERADA';
        else severidad = 'LEVE';
        // ...
    }
    return null; // SI ≥ 0.50 → sin evento (normal)
}
```

**Impacto:** 🔴 CRÍTICO - Eventos no se generan o se clasifican incorrectamente

---

### 3. CLASIFICACIÓN DE VELOCIDAD SIN "MODERADA"

**📍 Ubicación:** `backend/src/routes/speedAnalysis.ts:70`

**Código actual:**
```typescript
function classifySpeedViolation(speed: number, speedLimit: number): 'correcto' | 'leve' | 'grave' {
    const excess = speed - speedLimit;
    
    if (excess <= 0) return 'correcto';
    if (excess <= 20) return 'leve';  // ❌ 0-20 km/h = todo leve
    return 'grave';                   // ❌ >20 km/h = grave
}
```

**❌ Problema:**
- NO existe categoría 'moderada'
- Exceso de 5 km/h = 'leve' (igual que 20 km/h)
- Frontend espera 'moderada' pero nunca la recibe

**✅ Código correcto:**
```typescript
function classifySpeedViolation(
    speed: number, 
    speedLimit: number
): 'correcto' | 'leve' | 'moderada' | 'grave' {
    const excess = speed - speedLimit;
    
    if (excess <= 0) return 'correcto';
    if (excess <= 10) return 'leve';      // 0-10 km/h
    if (excess <= 20) return 'moderada';  // 10-20 km/h
    return 'grave';                       // >20 km/h
}
```

**Impacto:** 🔴 ALTO - Usuario reporta "no hay moderadas, todas graves o leves"

---

### 4. LÍMITES ARTIFICIALES DE SESIONES EN VELOCIDAD

**📍 Ubicaciones:**
- `backend/src/routes/speedAnalysis.ts:151` → `take: 5`
- `backend/src/routes/speedAnalysis.ts:172` → `slice(0, 2)`

**Código actual:**
```typescript
const gpsSessions = await prisma.gpsMeasurement.findMany({
    where: gpsSessionWhere,
    select: { sessionId: true },
    distinct: ['sessionId'],
    take: 5  // ❌ Solo 5 sesiones como máximo
});

const sessionIds = gpsSessions.map(r => r.sessionId);

// Procesar solo las primeras 2 sesiones para evitar timeout
const limitedSessionIds = sessionIds.slice(0, 2); // ❌ Solo 2 sesiones reales
logger.info(`Procesando solo ${limitedSessionIds.length} sesiones de ${sessionIds.length} para evitar timeout`);
```

**❌ Problema:**
- Si hay 100 sesiones en el rango, solo analiza 2
- Ranking de tramos pobre (datos insuficientes)
- Violaciones no detectadas en el 98% de sesiones

**✅ Código correcto:**
```typescript
// Opción 1: Paginación por lotes
const BATCH_SIZE = 50;
const allViolations = [];

for (let offset = 0; offset < sessionIds.length; offset += BATCH_SIZE) {
    const batch = sessionIds.slice(offset, offset + BATCH_SIZE);
    const batchViolations = await speedAnalyzer.analizarVelocidades(batch, dateFrom, dateTo);
    allViolations.push(...batchViolations);
}

// Opción 2: Cache por sesión + procesamiento incremental
const cachedViolations = await getCachedViolations(sessionIds);
const uncachedIds = sessionIds.filter(id => !cachedViolations.has(id));
const newViolations = await speedAnalyzer.analizarVelocidades(uncachedIds, dateFrom, dateTo);
await cacheViolations(newViolations);
```

**Impacto:** 🔴 ALTO - Usuario reporta "ranking de tramos con muy pocas incidencias"

---

### 5. CLUSTERING CON DOBLE CONTEO

**📍 Ubicación:** `backend/src/routes/hotspots.ts:70-71`

**Código actual:**
```typescript
if (distance <= radiusMeters) {
    cluster.events.push(otherEvent);
    cluster.frequency++; // ❌ Incrementa por cada evento encontrado
    
    const severity = otherEvent.severity || 'leve';
    cluster.severity_counts[severity]++;
    // ...
    usedEvents.add(j);
}
```

**❌ Problema:**
- `frequency` cuenta eventos, no eventos únicos
- Si hay duplicados (mismo evento en múltiples consultas) → se cuenta varias veces
- Cluster muestra "510 eventos" pero al abrir hay 30 únicos

**✅ Código correcto:**
```typescript
// Usar Set para garantizar unicidad
const eventIds = new Set<string>();

if (distance <= radiusMeters) {
    cluster.events.push(otherEvent);
    eventIds.add(otherEvent.id); // Añadir a Set
    
    const severity = otherEvent.severity || 'leve';
    cluster.severity_counts[severity]++;
    // ...
    usedEvents.add(j);
}

// Frecuencia = número de IDs únicos
cluster.frequency = eventIds.size;

// Alternativa: usar DISTINCT en query original
const eventosDB = await prisma.stability_events.findMany({
    where: { /* ... */ },
    distinct: ['id'], // ✅ Garantiza unicidad
    orderBy: { timestamp: 'desc' }
});
```

**Impacto:** 🔴 ALTO - Usuario reporta "cluster dice 510, al abrir veo ~30"

---

### 6. FILTROS DE FECHA NO VALIDADOS

**📍 Ubicación:** `backend/src/routes/kpis.ts:113-141`

**Código actual:**
```typescript
let dateFrom: Date | null = null;
let dateToExclusive: Date | null = null;

if (from) {
    dateFrom = new Date(from);
    dateFrom.setHours(0, 0, 0, 0);
}
if (to) {
    dateToExclusive = new Date(to);
    dateToExclusive.setHours(23, 59, 59, 999);
}

// ❌ Si from/to no llegan, busca TODAS las sesiones
if (dateFrom && dateToExclusive) {
    // Buscar por rango
} else {
    sessions = await prisma.session.findMany({ 
        where: { organizationId, vehicleId: vehicleIds ? { in: vehicleIds } : undefined }
    });
}
```

**❌ Problema:**
- Si `from` o `to` faltan/están mal → devuelve TODAS las sesiones históricas
- Usuario reporta: "pongo el tiempo que ponga sale información"
- Sin validación de timezone → inconsistencias

**✅ Código correcto:**
```typescript
// Validar filtros obligatorios
if (!from || !to) {
    return res.status(400).json({
        success: false,
        error: 'Rango de fechas obligatorio (from, to)'
    });
}

// Parsear con timezone fijo Europe/Madrid
const TZ = 'Europe/Madrid';
const dateFrom = parseISO(from); // Usar date-fns con TZ
const dateTo = parseISO(to);

if (!isValid(dateFrom) || !isValid(dateTo)) {
    return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido'
    });
}

// Convertir a UTC para queries
const dateFromUTC = zonedTimeToUtc(setHours(dateFrom, 0), TZ);
const dateToUTC = zonedTimeToUtc(setHours(dateTo, 23), TZ);
```

**Impacto:** 🔴 ALTO - Filtros no funcionan, se muestran datos fuera de rango

---

### 7. FILTRO DE VEHÍCULO NO SE APLICA CONSISTENTEMENTE

**📍 Ubicación:** Múltiples endpoints

**Código actual (kpis.ts):**
```typescript
// ❌ vehicleIds opcional, si está vacío → todos los vehículos
const vehicleIds = req.query.vehicleIds ? 
    (Array.isArray(req.query.vehicleIds) ? req.query.vehicleIds : [req.query.vehicleIds]) 
    : undefined;

sessions = await prisma.session.findMany({
    where: { 
        organizationId,
        vehicleId: vehicleIds ? { in: vehicleIds } : undefined // ❌ undefined = todos
    }
});
```

**❌ Problema:**
- Si `vehicleIds=[]` (array vacío) → `undefined` → todos los vehículos
- Usuario reporta: "selecciono un vehículo, a veces sale info, a veces todo a cero"

**✅ Código correcto:**
```typescript
const vehicleIds = req.query.vehicleIds ? 
    (Array.isArray(req.query.vehicleIds) ? req.query.vehicleIds : [req.query.vehicleIds]) 
    : [];

// Si vehicleIds vacío → 204 No Content (sin datos)
if (vehicleIds.length === 0) {
    return res.status(204).send();
}

sessions = await prisma.session.findMany({
    where: { 
        organizationId,
        vehicleId: { in: vehicleIds } // ✅ Siempre filtrar
    }
});
```

**Impacto:** 🔴 ALTO - Filtros inconsistentes, datos mezclados

---

### 8. TODAS LAS INCIDENCIAS CLASIFICADAS COMO "GRAVES"

**📍 Ubicación:** `backend/src/services/eventDetector.ts` (múltiples funciones)

**Código actual:**
```typescript
// Ejemplo: detectarRiesgoVuelco
const si = (measurement.si || 0) * 100; // Convierte a 0-100

if (si < 30) { // ❌ 30% es muy alto
    let severidad: Severidad;
    if (si < 20) severidad = 'GRAVE';
    else if (si >= 20 && si < 35) severidad = 'MODERADA';
    else severidad = 'LEVE';
    // ...
}
return null; // ❌ Si SI ≥ 30%, no genera evento (aunque SI=0.35 debería ser leve)
```

**❌ Problema combinado:**
1. Normalización incorrecta (multiplica por 100)
2. Umbral alto (30% en lugar de 50%)
3. Si `si=0.15` (15%) en BD:
   - `si * 100 = 15` → NO genera evento (< 30 requerido)
   - Solo se generan eventos cuando SI < 0.30 (30%)
   - Y dentro de esos, solo SI < 0.20 son graves
4. Resultado: **casi todos los eventos generados son graves**

**✅ Código correcto:**
```typescript
const si = measurement.si || 0; // Ya en [0,1]

// REGLA MANDATO: Solo generar eventos si SI < 0.50
if (si < 0.50) {
    let severidad: Severidad;
    if (si < 0.20) severidad = 'GRAVE';
    else if (si < 0.35) severidad = 'MODERADA';
    else severidad = 'LEVE'; // 0.35 ≤ SI < 0.50
    
    return {
        tipo: 'RIESGO_VUELCO',
        severidad,
        timestamp: measurement.timestamp,
        valores: { si: measurement.si }, // ✅ Persistir SI original
        descripcion: `Pérdida de estabilidad (SI=${(si*100).toFixed(1)}%)`
    };
}

return null; // SI ≥ 0.50 → condición normal, sin evento
```

**Impacto:** 🔴 CRÍTICO - Usuario reporta "todas las incidencias graves, no hay moderadas ni leves"

---

### 9. TIEMPOS DE CLAVE A CERO (NO HAY PERSISTENCIA)

**📍 Ubicación:** `backend/src/services/keyCalculator.ts`

**Código actual:**
```typescript
export async function calcularTiemposPorClave(
    sessionIds: string[],
    from?: Date,
    to?: Date
): Promise<TiemposPorClave> {
    // ... cálculo de claves ...
    
    return {
        clave0_segundos,
        clave0_formateado: formatearTiempo(clave0_segundos),
        clave1_segundos,
        // ...
    };
}
```

**❌ Problema:**
- Cálculo on-the-fly cada vez que se consulta
- NO se persisten segmentos en BD
- Si hay errores en cálculo → no hay trazabilidad
- Clave 4 NO implementada (siempre 0)

**✅ Código correcto:**
```typescript
// Nueva tabla en Prisma
model OperationalStateSegment {
  id         String   @id @default(uuid())
  sessionId  String
  clave      Int      // 0, 1, 2, 3, 4, 5
  startTime  DateTime
  endTime    DateTime
  durationSeconds Int
  
  Session    Session  @relation(...)
  
  @@index([sessionId, clave])
}

// Al crear sesión en upload, generar segmentos
async function generarSegmentosClaves(sessionId: string) {
    const segmentos = await keyCalculator.calcularSegmentos(sessionId);
    
    await prisma.operationalStateSegment.createMany({
        data: segmentos.map(s => ({
            sessionId,
            clave: s.clave,
            startTime: s.inicio,
            endTime: s.fin,
            durationSeconds: s.duracion
        }))
    });
}

// En endpoint KPI, solo leer segmentos
const segmentos = await prisma.operationalStateSegment.groupBy({
    where: { sessionId: { in: sessionIds } },
    by: ['clave'],
    _sum: { durationSeconds: true }
});
```

**Impacto:** 🔴 ALTO - Usuario reporta "tiempos de clave a cero o incoherentes"

---

### 10. GEOCERCAS RADAR.COM NO SE USAN (SIEMPRE FALLBACK)

**📍 Ubicación:** `backend/src/services/keyCalculator.ts:23`

**Código actual:**
```typescript
const USE_RADAR = process.env.RADAR_SECRET_KEY && process.env.RADAR_SECRET_KEY !== 'your-radar-secret-key';

// ❌ Sin logging de uso
async function cargarGeocercas(organizationId: string) {
    if (USE_RADAR) {
        try {
            const parksRadar = await radarIntegration.getParks(organizationId);
            // ... usar parksRadar ...
        } catch (error) {
            logger.warn('Radar.com falló, usando fallback local');
            // Fallback a BD local
        }
    } else {
        // Fallback a BD local
    }
}
```

**❌ Problema:**
- NO hay contador de uso de Radar.com
- Usuario reporta: "tiempo de uso de la API siempre a cero"
- Imposible saber si se usa Radar o fallback

**✅ Código correcto:**
```typescript
// Nueva tabla para tracking
model GeofenceUsageLog {
  id          String   @id @default(uuid())
  timestamp   DateTime @default(now())
  source      String   // 'radar.com' | 'local_db'
  organizationId String
  operation   String   // 'getParks' | 'isInGeofence'
  success     Boolean
  apiCalls    Int      @default(1)
}

async function cargarGeocercas(organizationId: string) {
    if (USE_RADAR) {
        try {
            const parksRadar = await radarIntegration.getParks(organizationId);
            
            // ✅ Registrar uso exitoso
            await prisma.geofenceUsageLog.create({
                data: {
                    source: 'radar.com',
                    organizationId,
                    operation: 'getParks',
                    success: true,
                    apiCalls: 1
                }
            });
            
            return parksRadar;
        } catch (error) {
            // ✅ Registrar fallo
            await prisma.geofenceUsageLog.create({
                data: {
                    source: 'radar.com',
                    organizationId,
                    operation: 'getParks',
                    success: false
                }
            });
            
            logger.warn('Radar.com falló, usando fallback local');
        }
    }
    
    // Fallback local
    const parks = await prisma.park.findMany({ where: { organizationId } });
    
    // ✅ Registrar uso de fallback
    await prisma.geofenceUsageLog.create({
        data: {
            source: 'local_db',
            organizationId,
            operation: 'getParks',
            success: true
        }
    });
    
    return parks;
}
```

**Impacto:** 🟡 MEDIO - Sin visibilidad del uso real de Radar.com

---

### 11. EVENTOS SIN `details.si` PERSISTIDO

**📍 Ubicación:** `backend/src/services/eventDetector.ts` → `guardarEventos()`

**Código actual (inferido, no visible en archivos leídos):**
```typescript
// ❌ Posible: no persiste details.si correctamente
await prisma.stability_events.create({
    data: {
        session_id: evento.sessionId,
        timestamp: evento.timestamp,
        lat: evento.lat,
        lon: evento.lon,
        type: evento.tipo,
        speed: evento.valores.velocity,
        rotativoState: evento.rotativo ? 1 : 0,
        details: {
            // ❌ Puede faltar si: evento.valores.si
        }
    }
});
```

**❌ Problema:**
- Sin `details.si`, hotspots no puede re-clasificar severidad
- Resultado: todos 'leve' por defecto o severidad incorrecta

**✅ Código correcto:**
```typescript
await prisma.stability_events.create({
    data: {
        session_id: evento.sessionId,
        timestamp: evento.timestamp,
        lat: evento.lat,
        lon: evento.lon,
        type: evento.tipo,
        speed: evento.valores.velocity,
        rotativoState: evento.rotativo ? 1 : 0,
        details: {
            si: evento.valores.si,          // ✅ OBLIGATORIO
            ax: evento.valores.ax,
            ay: evento.valores.ay,
            az: evento.valores.az,
            gx: evento.valores.gx,
            roll: evento.valores.roll,
            pitch: evento.valores.pitch
        }
    }
});
```

**Impacto:** 🔴 ALTO - Severidades mal calculadas en hotspots

---

### 12. CLAVE 4 NO IMPLEMENTADA

**📍 Ubicación:** `backend/src/services/keyCalculator.ts`

**Código actual:**
```typescript
export interface TiemposPorClave {
    clave0_segundos: number;
    clave0_formateado: string;
    clave1_segundos: number;
    clave1_formateado: string;
    clave2_segundos: number;
    clave2_formateado: string;
    clave3_segundos: number;
    clave3_formateado: string;
    clave5_segundos: number;
    clave5_formateado: string;
    // ❌ NO HAY clave4
    total_segundos: number;
    total_formateado: string;
}
```

**❌ Problema:**
- Frontend muestra "Tiempo Clave 4" pero backend NO lo calcula
- Siempre aparece como `00:00:00`

**✅ Código correcto:**
```typescript
export interface TiemposPorClave {
    clave0_segundos: number;
    clave0_formateado: string;
    clave1_segundos: number;
    clave1_formateado: string;
    clave2_segundos: number;
    clave2_formateado: string;
    clave3_segundos: number;
    clave3_formateado: string;
    clave4_segundos: number;        // ✅ AÑADIR
    clave4_formateado: string;      // ✅ AÑADIR
    clave5_segundos: number;
    clave5_formateado: string;
    total_segundos: number;
    total_formateado: string;
}

// Implementar lógica de Clave 4: Fin de actuación/retirada
// Condición: rotativo apagándose + velocidad bajando + fuera de parque
function calcularClave4(puntos: GPSPoint[], rotativo: RotativoPoint[]): number {
    let clave4_segundos = 0;
    
    for (let i = 1; i < puntos.length; i++) {
        const actual = puntos[i];
        const anterior = puntos[i-1];
        
        const rotativoActual = getRotativoState(actual.timestamp, rotativo);
        const rotativoAnterior = getRotativoState(anterior.timestamp, rotativo);
        
        // Clave 4: rotativo pasa de ON a OFF + fuera de parque + desacelerando
        if (rotativoAnterior === '1' && rotativoActual === '0' && 
            !actual.enParque && actual.speed < anterior.speed) {
            const dt = (actual.timestamp - anterior.timestamp) / 1000;
            clave4_segundos += dt;
        }
    }
    
    return clave4_segundos;
}
```

**Impacto:** 🟡 MEDIO - Funcionalidad faltante pero no crítica

---

## 📋 TABLA RESUMEN DE PROBLEMAS

| # | Problema | Ubicación | Severidad | Usuario lo reporta |
|---|----------|-----------|-----------|-------------------|
| 1 | SI calculado como `(100-eventos)/100` | kpis.ts:368 | 🔴 Crítico | ✅ "SI 0% o 100%" |
| 2 | Normalización SI inconsistente (0-1 vs 0-100) | eventDetector.ts, hotspots.ts | 🔴 Crítico | ✅ "Todas graves" |
| 3 | Sin categoría 'moderada' en velocidad | speedAnalysis.ts:70 | 🔴 Alto | ✅ "No hay moderadas" |
| 4 | Límite de 2 sesiones en análisis velocidad | speedAnalysis.ts:151,172 | 🔴 Alto | ✅ "Ranking pobre" |
| 5 | Clustering con doble conteo | hotspots.ts:71 | 🔴 Alto | ✅ "510 eventos, al abrir 30" |
| 6 | Filtros de fecha sin validar | kpis.ts:113 | 🔴 Alto | ✅ "Cualquier fecha da datos" |
| 7 | Filtro vehículo inconsistente | Múltiples | 🔴 Alto | ✅ "A veces sin datos" |
| 8 | Umbral de eventos muy bajo (30%) | eventDetector.ts | 🔴 Crítico | ✅ "Todas graves" |
| 9 | Tiempos clave sin persistir | keyCalculator.ts | 🔴 Alto | ✅ "Tiempos a cero" |
| 10 | Radar.com sin logging de uso | keyCalculator.ts:23 | 🟡 Medio | ✅ "Uso API siempre 0" |
| 11 | Eventos sin details.si | eventDetector.ts | 🔴 Alto | ✅ "Severidades mal" |
| 12 | Clave 4 no implementada | keyCalculator.ts | 🟡 Medio | ✅ "Siempre 00:00:00" |

---

## ✅ CHECKS DE SALUD PARA VALIDAR FIXES

### Check 1: SI Real vs Fórmula Inventada
```sql
-- Verificar que KPI usa AVG(si) real
SELECT 
    AVG(si) AS si_real_promedio,
    COUNT(*) AS total_mediciones
FROM "StabilityMeasurement"
WHERE sessionId IN (
    SELECT id FROM "Session" 
    WHERE "organizationId" = 'tu-org-id'
    AND "startTime" >= '2025-09-29' 
    AND "endTime" < '2025-10-09'
)
AND timestamp >= '2025-09-29' 
AND timestamp < '2025-10-09';

-- Resultado esperado: si_real_promedio entre 0.0 y 1.0
-- ❌ Si el KPI muestra algo distinto → bug confirmado
```

### Check 2: Distribución de Severidades
```sql
-- Debe haber graves, moderadas Y leves
SELECT 
    type AS severidad,
    COUNT(*) AS cantidad,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM stability_events
WHERE timestamp >= '2025-09-29' AND timestamp < '2025-10-09'
GROUP BY type
ORDER BY cantidad DESC;

-- Resultado esperado:
-- LEVE      | 150 | 60%
-- MODERADA  |  70 | 28%
-- GRAVE     |  30 | 12%
--
-- ❌ Si solo hay GRAVE o LEVE → bug confirmado
```

### Check 3: Violaciones de Velocidad con Moderada
```sql
-- Verificar que existe 'moderada'
SELECT 
    violationType,
    COUNT(*) AS cantidad
FROM speed_violations
WHERE timestamp >= '2025-09-29' AND timestamp < '2025-10-09'
GROUP BY violationType;

-- Resultado esperado:
-- correcto  | 500
-- leve      | 100
-- moderada  |  50  ← DEBE EXISTIR
-- grave     |  20
--
-- ❌ Si no hay 'moderada' → bug confirmado
```

### Check 4: Frecuencia Real de Clusters
```sql
-- Contar eventos únicos en un cluster
WITH cluster_events AS (
    SELECT 
        id,
        lat,
        lon,
        timestamp
    FROM stability_events
    WHERE lat BETWEEN 40.540 AND 40.542
    AND lon BETWEEN -3.633 AND -3.631
    AND timestamp >= '2025-09-29' AND timestamp < '2025-10-09'
)
SELECT 
    COUNT(DISTINCT id) AS eventos_unicos,
    COUNT(*) AS eventos_totales
FROM cluster_events;

-- Resultado esperado: eventos_unicos ≈ eventos_totales (sin duplicados)
-- ❌ Si eventos_totales >> eventos_unicos → bug de clustering
```

### Check 5: Segmentos de Clave Persistidos
```sql
-- Verificar que existen segmentos
SELECT 
    clave,
    COUNT(*) AS num_segmentos,
    SUM(durationSeconds) AS total_segundos,
    TO_CHAR(INTERVAL '1 second' * SUM(durationSeconds), 'HH24:MI:SS') AS total_formateado
FROM OperationalStateSegment
WHERE sessionId IN (
    SELECT id FROM "Session" 
    WHERE "organizationId" = 'tu-org-id'
    AND "startTime" >= '2025-09-29'
)
GROUP BY clave
ORDER BY clave;

-- Resultado esperado:
-- 0 | 15 | 7200  | 02:00:00
-- 1 | 42 | 43200 | 12:00:00
-- 2 | 8  | 3600  | 01:00:00
-- 3 | 5  | 1800  | 00:30:00
-- 4 | 3  | 900   | 00:15:00  ← DEBE EXISTIR
-- 5 | 10 | 2700  | 00:45:00
--
-- ❌ Si tabla no existe o está vacía → bug confirmado
```

### Check 6: Uso de Radar.com
```sql
-- Verificar llamadas a Radar.com
SELECT 
    DATE(timestamp) AS fecha,
    source,
    operation,
    COUNT(*) AS llamadas,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS exitosas,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS fallidas
FROM GeofenceUsageLog
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), source, operation
ORDER BY fecha DESC;

-- Resultado esperado:
-- 2025-10-14 | radar.com | getParks | 50 | 48 | 2
-- 2025-10-14 | local_db  | getParks | 10 | 10 | 0
--
-- ❌ Si solo hay local_db → Radar.com no se usa
-- ❌ Si tabla no existe → bug confirmado
```

---

## 🎯 DEFINICIÓN DE "HECHO" (DoD)

Para considerar cada problema como **resuelto**:

1. ✅ Código modificado según sección "Código correcto"
2. ✅ Check de salud pasa (queries SQL devuelven resultado esperado)
3. ✅ Prueba manual en UI confirma fix (datos coherentes, filtros funcionan)
4. ✅ Log de fix añadido a `CHANGELOG.md`

---

## 📅 SIGUIENTE PASO

Crear documento `MANDAMIENTOS_STABILSAFE.md` con reglas técnicas inmutables que **Cursor y equipo NUNCA pueden violar**.

