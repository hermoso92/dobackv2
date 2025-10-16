# 🔧 PLAN DE FIXES PARA PRODUCCIÓN
## StabilSafe V3 - Soluciones Verificables

**Fecha:** 2025-01-14  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 48-72 horas  
**Prerequisito:** Leer `MANDAMIENTOS_STABILSAFE.md` y `VERIFICACION_PROBLEMAS_SISTEMA.md`

---

## 📋 ÍNDICE DE FIXES

1. [Fix #1: KPI de Índice de Estabilidad](#fix-1)
2. [Fix #2: Normalización de SI Consistente](#fix-2)
3. [Fix #3: Añadir Categoría "Moderada" en Velocidad](#fix-3)
4. [Fix #4: Eliminar Límites Artificiales de Sesiones](#fix-4)
5. [Fix #5: Clustering sin Doble Conteo](#fix-5)
6. [Fix #6: Validación Estricta de Filtros](#fix-6)
7. [Fix #7: Corregir Umbral de Generación de Eventos](#fix-7)
8. [Fix #8: Persistir Segmentos de Clave (Nueva Tabla)](#fix-8)
9. [Fix #9: Logging de Uso de Radar.com](#fix-9)
10. [Fix #10: Implementar Clave 4](#fix-10)
11. [Fix #11: Persistir details.si en Eventos](#fix-11)
12. [Fix #12: Post-Procesamiento Obligatorio en Upload](#fix-12)

---

## FIX #1: KPI DE ÍNDICE DE ESTABILIDAD {#fix-1}

### Problema
KPI calculado como `(100 - totalEventos) / 100` en lugar de usar el promedio real de `StabilityMeasurement.si`.

### Archivos a Modificar
- `backend/src/routes/kpis.ts`

### Código Actual (líneas 366-371)
```typescript
quality: {
    // Normalizar a 0–1 para que el frontend lo formatee a porcentaje una sola vez
    indice_promedio: totalEvents > 0 ? Math.max(0, 100 - totalEvents) / 100 : 1,
    calificacion: totalEvents === 0 ? 'EXCELENTE' : totalEvents < 5 ? 'BUENA' : 'REGULAR',
    estrellas: totalEvents === 0 ? '⭐⭐⭐⭐⭐' : totalEvents < 5 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
}
```

### Código Nuevo
```typescript
// Calcular SI real desde StabilityMeasurement
const siAggregate = await prisma.stabilityMeasurement.aggregate({
    where: {
        sessionId: { in: sessionIds },
        timestamp: { gte: dateFrom, lt: dateToExclusive }
    },
    _avg: {
        si: true
    }
});

const indicePromedio = siAggregate._avg.si || 0; // Ya en [0,1]

// Calificación basada en SI real
function calificarSI(si: number): { calificacion: string; estrellas: string } {
    if (si >= 0.90) return { calificacion: 'EXCELENTE', estrellas: '⭐⭐⭐⭐⭐' };
    if (si >= 0.85) return { calificacion: 'BUENA', estrellas: '⭐⭐⭐⭐' };
    if (si >= 0.75) return { calificacion: 'REGULAR', estrellas: '⭐⭐⭐' };
    return { calificacion: 'DEFICIENTE', estrellas: '⭐⭐' };
}

const { calificacion, estrellas } = calificarSI(indicePromedio);

// En summary
quality: {
    indice_promedio: indicePromedio, // [0,1]
    calificacion: calificacion,
    estrellas: estrellas,
    distribucion_severidades: {
        grave: eventsByType['CRITICO'] || 0,
        moderada: eventsByType['MODERADO'] || 0,
        leve: eventsByType['LEVE'] || 0
    }
}
```

### Ubicación exacta
Insertar después de la línea 359 (después de calcular `eventsByType`).

### Verificación
```sql
-- Ejecutar antes del fix
SELECT 
    AVG(si) AS si_real_promedio,
    COUNT(*) AS total_mediciones
FROM "StabilityMeasurement"
WHERE "sessionId" IN (
    SELECT id FROM "Session" 
    WHERE "organizationId" = 'default-org'
    AND "startTime" >= '2025-09-29'
    AND "endTime" < '2025-10-09'
);

-- Resultado esperado: si_real_promedio = 0.87 (ejemplo)
-- Comparar con KPI actual (probablemente 0.95 o 0.00)
```

### Test Manual
1. GET `/api/kpis/summary?from=2025-09-29&to=2025-10-08&vehicleIds[]=xxx`
2. Verificar `quality.indice_promedio` coincide con query SQL
3. Verificar `calificacion` correcta según tabla

---

## FIX #2: NORMALIZACIÓN DE SI CONSISTENTE {#fix-2}

### Problema
`eventDetector.ts` convierte SI a 0-100, `hotspots.ts` asume 0-1. Inconsistencia.

### Archivos a Modificar
- `backend/src/services/eventDetector.ts` (múltiples funciones)

### Cambios

#### 1. Constantes Globales (añadir al inicio del archivo)
```typescript
// ============================================================================
// UMBRALES (MANDAMIENTO M3.2)
// ============================================================================

const UMBRALES = {
    EVENTO_MAXIMO: 0.50,    // Solo generar eventos si SI < 0.50
    GRAVE: 0.20,            // SI < 0.20
    MODERADA: 0.35,         // 0.20 ≤ SI < 0.35
    LEVE: 0.50              // 0.35 ≤ SI < 0.50
};

function clasificarSeveridadPorSI(si: number): Severidad | null {
    if (si >= UMBRALES.EVENTO_MAXIMO) return null; // Sin evento
    if (si < UMBRALES.GRAVE) return 'GRAVE';
    if (si < UMBRALES.MODERADA) return 'MODERADA';
    return 'LEVE';
}
```

#### 2. Modificar `detectarRiesgoVuelco` (líneas 61-81)

**Código actual:**
```typescript
function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = (measurement.si || 0) * 100; // ❌ Convierte a porcentaje
    
    // Regla de dominio: si < 30%
    if (si < 30) {
        let severidad: Severidad;
        if (si < 20) severidad = 'GRAVE';
        else if (si >= 20 && si < 35) severidad = 'MODERADA';
        else severidad = 'LEVE';
        // ...
    }
    return null;
}
```

**Código nuevo:**
```typescript
function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0; // ✅ Ya en [0,1]
    
    const severidad = clasificarSeveridadPorSI(si);
    if (!severidad) return null; // SI ≥ 0.50 → sin evento
    
    return {
        tipo: 'RIESGO_VUELCO',
        severidad,
        timestamp: measurement.timestamp,
        valores: { si: measurement.si }, // ✅ Persistir SI original
        descripcion: `Pérdida de estabilidad (SI=${(si*100).toFixed(1)}%)`
    };
}
```

#### 3. Aplicar mismo patrón a TODAS las funciones

- `detectarVuelcoInminente` (líneas 88-100)
- `detectarDerivaLateral` (si existe)
- `detectarManiobraBrusca` (si existe)
- Etc.

**Patrón:**
1. Quitar `* 100`
2. Usar `clasificarSeveridadPorSI(si)`
3. Si retorna `null` → `return null;`
4. Guardar `si` original en `valores.si`

### Verificación
```sql
-- Antes del fix: eventos solo con SI < 0.30
SELECT MIN(details->>'si') AS si_minimo
FROM stability_events
WHERE details->>'si' IS NOT NULL;

-- Resultado actual: ~0.00 - 0.29
-- Después del fix: ~0.00 - 0.49 (más eventos leves)
```

---

## FIX #3: AÑADIR CATEGORÍA "MODERADA" EN VELOCIDAD {#fix-3}

### Problema
Solo existe 'correcto', 'leve', 'grave'. Falta 'moderada'.

### Archivos a Modificar
- `backend/src/routes/speedAnalysis.ts`

### Código Actual (líneas 70-76)
```typescript
function classifySpeedViolation(speed: number, speedLimit: number): 'correcto' | 'leve' | 'grave' {
    const excess = speed - speedLimit;
    
    if (excess <= 0) return 'correcto';
    if (excess <= 20) return 'leve';  // ❌ 0-20 todo leve
    return 'grave';
}
```

### Código Nuevo
```typescript
function classifySpeedViolation(
    speed: number, 
    speedLimit: number
): 'correcto' | 'leve' | 'moderada' | 'grave' {
    const excess = speed - speedLimit;
    
    if (excess <= 0) return 'correcto';
    if (excess <= 10) return 'leve';      // 0-10 km/h
    if (excess <= 20) return 'moderada';  // 10-20 km/h ✅
    return 'grave';                       // >20 km/h
}
```

### Actualizar TypeScript Types

**Archivo:** `backend/src/types/speed.ts` (crear si no existe)
```typescript
export type ViolationType = 'correcto' | 'leve' | 'moderada' | 'grave';
```

**Importar en** `speedAnalysis.ts`:
```typescript
import { ViolationType } from '../types/speed';

function classifySpeedViolation(speed: number, speedLimit: number): ViolationType {
    // ...
}
```

### Verificación
```sql
-- Después del fix
SELECT 
    violationType,
    COUNT(*) AS cantidad,
    ROUND(AVG(excess), 2) AS exceso_promedio
FROM speed_violations
WHERE timestamp >= '2025-09-29' AND timestamp < '2025-10-09'
GROUP BY violationType
ORDER BY 
    CASE violationType
        WHEN 'grave' THEN 1
        WHEN 'moderada' THEN 2
        WHEN 'leve' THEN 3
        WHEN 'correcto' THEN 4
    END;

-- Resultado esperado:
-- grave    | 15  | 25.5
-- moderada | 45  | 15.2  ← DEBE APARECER
-- leve     | 120 | 5.8
-- correcto | 450 | 0.0
```

---

## FIX #4: ELIMINAR LÍMITES ARTIFICIALES DE SESIONES {#fix-4}

### Problema
`take: 5` y `slice(0, 2)` limitan artificialmente el análisis.

### Archivos a Modificar
- `backend/src/routes/speedAnalysis.ts`

### Código Actual (líneas 147-173)
```typescript
const gpsSessions = await prisma.gpsMeasurement.findMany({
    where: gpsSessionWhere,
    select: { sessionId: true },
    distinct: ['sessionId'],
    take: 5  // ❌ Solo 5 sesiones
});

const sessionIds = gpsSessions.map(r => r.sessionId);

// Procesar solo las primeras 2 sesiones para evitar timeout
const limitedSessionIds = sessionIds.slice(0, 2); // ❌ Solo 2
logger.info(`Procesando solo ${limitedSessionIds.length} sesiones de ${sessionIds.length} para evitar timeout`);
```

### Código Nuevo (Opción 1: Batching)
```typescript
const BATCH_SIZE = 50;

// Obtener TODAS las sesiones con GPS en el rango (sin take)
const gpsSessions = await prisma.gpsMeasurement.findMany({
    where: gpsSessionWhere,
    select: { sessionId: true },
    distinct: ['sessionId']
    // ✅ Sin take
});

const sessionIds = gpsSessions.map(r => r.sessionId);
logger.info(`Analizando velocidades en ${sessionIds.length} sesiones (con GPS en rango)`);

// Procesar en lotes de 50
const allViolations: SpeedViolation[] = [];

for (let offset = 0; offset < sessionIds.length; offset += BATCH_SIZE) {
    const batch = sessionIds.slice(offset, offset + BATCH_SIZE);
    logger.info(`📦 Procesando lote ${Math.floor(offset/BATCH_SIZE) + 1}/${Math.ceil(sessionIds.length/BATCH_SIZE)} (${batch.length} sesiones)`);
    
    const batchViolations = await speedAnalyzer.analizarVelocidades(
        batch,
        dateFrom,
        dateTo
    );
    
    allViolations.push(...batchViolations);
}

logger.info(`✅ Total violaciones analizadas: ${allViolations.length}`);

// Continuar con filtros y respuesta usando allViolations
```

### Código Nuevo (Opción 2: Cache)
```typescript
// Nueva tabla para cache (añadir a schema.prisma)
model SpeedViolationCache {
  id            String   @id @default(uuid())
  sessionId     String   @unique
  violationsJson String  // JSON array de violaciones
  createdAt     DateTime @default(now())
  
  @@index([sessionId])
}

// En speedAnalysis.ts
async function getViolationsWithCache(sessionIds: string[], from: Date, to: Date) {
    const cached = await prisma.speedViolationCache.findMany({
        where: { sessionId: { in: sessionIds } }
    });
    
    const cachedSessionIds = new Set(cached.map(c => c.sessionId));
    const uncachedIds = sessionIds.filter(id => !cachedSessionIds.has(id));
    
    logger.info(`💾 Cache: ${cached.length} sesiones, calculando ${uncachedIds.length} nuevas`);
    
    // Calcular solo no cacheadas
    const newViolations = await speedAnalyzer.analizarVelocidades(uncachedIds, from, to);
    
    // Guardar en cache
    for (const sessionId of uncachedIds) {
        const sessionViolations = newViolations.filter(v => v.sessionId === sessionId);
        await prisma.speedViolationCache.create({
            data: {
                sessionId,
                violationsJson: JSON.stringify(sessionViolations)
            }
        });
    }
    
    // Combinar cacheadas + nuevas
    const allViolations = [
        ...cached.flatMap(c => JSON.parse(c.violationsJson)),
        ...newViolations
    ];
    
    return allViolations;
}
```

### Recomendación
**Usar Opción 1 (Batching)** por simplicidad y evitar tabla extra.

### Verificación
```bash
# Logs esperados ANTES del fix:
# "Procesando solo 2 sesiones de 47 para evitar timeout"

# Logs esperados DESPUÉS del fix:
# "Analizando velocidades en 47 sesiones (con GPS en rango)"
# "📦 Procesando lote 1/1 (47 sesiones)"  # o "lote 1/2", "lote 2/2" si >50
# "✅ Total violaciones analizadas: 342"
```

---

## FIX #5: CLUSTERING SIN DOBLE CONTEO {#fix-5}

### Problema
`cluster.frequency++` cuenta eventos, no eventos únicos. Duplicados inflados.

### Archivos a Modificar
- `backend/src/routes/hotspots.ts`

### Código Actual (líneas 31-104)
```typescript
function clusterEvents(events: any[], radiusMeters: number = 20): any[] {
    const clusters: any[] = [];
    const usedEvents = new Set<number>();
    
    events.forEach((event, i) => {
        if (usedEvents.has(i)) return;
        
        const cluster: any = {
            // ...
            frequency: 1,
            // ...
        };
        
        usedEvents.add(i);
        
        events.forEach((otherEvent, j) => {
            if (usedEvents.has(j)) return;
            
            const distance = calculateDistance(event.lat, event.lng, otherEvent.lat, otherEvent.lng);
            
            if (distance <= radiusMeters) {
                cluster.events.push(otherEvent);
                cluster.frequency++; // ❌ Puede contar duplicados
                // ...
                usedEvents.add(j);
            }
        });
        
        // ...
        clusters.push(cluster);
    });
    
    return clusters;
}
```

### Código Nuevo
```typescript
function clusterEvents(events: any[], radiusMeters: number = 20): any[] {
    const clusters: any[] = [];
    const usedEvents = new Set<number>();
    
    events.forEach((event, i) => {
        if (usedEvents.has(i)) return;
        
        // ✅ Usar Set para IDs únicos
        const eventIds = new Set<string>();
        eventIds.add(event.id);
        
        const cluster: any = {
            id: `cluster_${clusters.length}`,
            lat: event.lat,
            lng: event.lng,
            location: event.location || 'Ubicación desconocida',
            events: [event],
            severity_counts: {
                grave: event.severity === 'grave' ? 1 : 0,
                moderada: event.severity === 'moderada' ? 1 : 0,
                leve: event.severity === 'leve' ? 1 : 0
            },
            frequency: 1, // Se actualizará al final
            vehicleIds: [event.vehicleId],
            lastOccurrence: event.timestamp,
            dominantSeverity: event.severity || 'leve'
        };
        
        usedEvents.add(i);
        
        // Buscar eventos cercanos
        events.forEach((otherEvent, j) => {
            if (usedEvents.has(j)) return;
            
            const distance = calculateDistance(
                event.lat,
                event.lng,
                otherEvent.lat,
                otherEvent.lng
            );
            
            if (distance <= radiusMeters) {
                cluster.events.push(otherEvent);
                eventIds.add(otherEvent.id); // ✅ Añadir ID único
                
                const severity = otherEvent.severity || 'leve';
                cluster.severity_counts[severity as keyof typeof cluster.severity_counts] =
                    (cluster.severity_counts[severity as keyof typeof cluster.severity_counts] || 0) + 1;
                
                if (!cluster.vehicleIds.includes(otherEvent.vehicleId)) {
                    cluster.vehicleIds.push(otherEvent.vehicleId);
                }
                
                if (new Date(otherEvent.timestamp) > new Date(cluster.lastOccurrence)) {
                    cluster.lastOccurrence = otherEvent.timestamp;
                    cluster.location = otherEvent.location || cluster.location;
                }
                
                usedEvents.add(j);
            }
        });
        
        // Calcular centro del cluster (promedio de coordenadas)
        cluster.lat = cluster.events.reduce((sum: number, e: any) => sum + e.lat, 0) / cluster.events.length;
        cluster.lng = cluster.events.reduce((sum: number, e: any) => sum + e.lng, 0) / cluster.events.length;
        
        // ✅ Frecuencia = número de IDs únicos
        cluster.frequency = eventIds.size;
        
        // Determinar severidad dominante
        const maxSeverity = Object.entries(cluster.severity_counts)
            .reduce((max, [severity, count]) => (count as number) > max.count ? { severity, count: count as number } : max, { severity: 'leve', count: 0 });
        
        cluster.dominantSeverity = maxSeverity.severity;
        
        clusters.push(cluster);
    });
    
    return clusters;
}
```

### Deduplicación en Query Original (añadir)

**Líneas 118-140 del endpoint `/critical-points`:**

```typescript
// ✅ Añadir DISTINCT para evitar duplicados en origen
const eventosDB = await prisma.stability_events.findMany({
    where: {
        session_id: { in: sessionIds },
        lat: { not: 0 },
        lon: { not: 0 },
        timestamp: {
            gte: dateFrom,
            lt: dateToExclusive
        }
    },
    // ✅ DISTINCT por ID para evitar duplicados
    distinct: ['id'],
    include: {
        Session: {
            include: {
                vehicle: {
                    select: { name: true, identifier: true }
                }
            }
        }
    },
    orderBy: {
        timestamp: 'desc'
    }
});
```

### Verificación
```sql
-- Antes del fix: cluster inflado
SELECT 
    COUNT(*) AS total_eventos,
    COUNT(DISTINCT id) AS eventos_unicos
FROM stability_events
WHERE lat BETWEEN 40.540 AND 40.542
AND lon BETWEEN -3.633 AND -3.631
AND timestamp >= '2025-09-29' AND timestamp < '2025-10-09';

-- Resultado típico ANTES:
-- total_eventos | eventos_unicos
-- 510           | 32

-- Resultado esperado DESPUÉS (con DISTINCT en query):
-- total_eventos | eventos_unicos
-- 32            | 32
```

---

## FIX #6: VALIDACIÓN ESTRICTA DE FILTROS {#fix-6}

### Problema
Sin validación de `from`/`to`, devuelve todas las sesiones si faltan.

### Archivos a Modificar
- `backend/src/routes/kpis.ts`
- `backend/src/routes/hotspots.ts`
- `backend/src/routes/speedAnalysis.ts`
- Otros endpoints con filtros

### Patrón a Aplicar (inicio de cada endpoint)

```typescript
router.get('/api/xxx', async (req, res) => {
    try {
        // 1. Validar organizationId
        const organizationId = req.query.organizationId as string;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId obligatorio'
            });
        }
        
        // 2. Validar rango de fechas
        const from = req.query.from as string;
        const to = req.query.to as string;
        
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                error: 'Rango de fechas obligatorio: from y to (YYYY-MM-DD)'
            });
        }
        
        // 3. Parsear fechas con validación
        const dateFrom = new Date(from + 'T00:00:00Z');
        const dateTo = new Date(to + 'T23:59:59.999Z');
        
        if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Formato de fecha inválido. Usar YYYY-MM-DD'
            });
        }
        
        if (dateFrom > dateTo) {
            return res.status(400).json({
                success: false,
                error: 'Fecha from debe ser anterior o igual a to'
            });
        }
        
        // 4. Validar vehicleIds
        const vehicleIds = req.query.vehicleIds ? 
            (Array.isArray(req.query.vehicleIds) ? req.query.vehicleIds : [req.query.vehicleIds]) 
            : [];
        
        if (vehicleIds.length === 0) {
            return res.status(204).send(); // Sin contenido
        }
        
        // 5. Continuar con lógica del endpoint
        const result = await calcularXXX({
            organizationId,
            from: dateFrom,
            to: dateTo,
            vehicleIds
        });
        
        // 6. Respuesta con metadata
        res.json({
            success: true,
            data: result,
            meta: {
                from: from,
                to: to,
                vehicleIds: vehicleIds,
                timezone: 'UTC',
                totalRows: result.length || 0,
                durationMs: Date.now() - startTime
            }
        });
        
    } catch (error: any) {
        logger.error('Error en endpoint XXX:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

### Archivos Específicos

**`backend/src/routes/kpis.ts`** (líneas 106-141):
- Reemplazar lógica de `dateFrom`/`dateToExclusive` con validación arriba
- Quitar fallback a "todas las sesiones"

**`backend/src/routes/hotspots.ts`** (líneas 111-127):
- Añadir validación de fechas

**`backend/src/routes/speedAnalysis.ts`** (líneas 106-145):
- Añadir validación de fechas
- Ya tiene validación de `organizationId`

### Verificación
```bash
# Test 1: Sin from/to
curl "http://localhost:9998/api/kpis/summary?organizationId=default-org&vehicleIds[]=xxx"

# Respuesta esperada:
# Status: 400
# { "success": false, "error": "Rango de fechas obligatorio: from y to (YYYY-MM-DD)" }

# Test 2: Fecha inválida
curl "http://localhost:9998/api/kpis/summary?organizationId=default-org&from=invalid&to=2025-10-08&vehicleIds[]=xxx"

# Respuesta esperada:
# Status: 400
# { "success": false, "error": "Formato de fecha inválido. Usar YYYY-MM-DD" }

# Test 3: Sin vehículos
curl "http://localhost:9998/api/kpis/summary?organizationId=default-org&from=2025-09-29&to=2025-10-08"

# Respuesta esperada:
# Status: 204 (No Content)
```

---

## FIX #7: CORREGIR UMBRAL DE GENERACIÓN DE EVENTOS {#fix-7}

### Problema
Eventos solo se generan si SI < 0.30 (30%), debería ser SI < 0.50 (50%).

### Archivos a Modificar
- `backend/src/services/eventDetector.ts` (todas las funciones de detección)

### Cambio (ya cubierto en Fix #2, reforzar aquí)

**Añadir al inicio del archivo:**
```typescript
// ============================================================================
// MANDAMIENTO M3: EVENTOS SOLO SI SI < 0.50
// ============================================================================

const EVENTO_MAXIMO_SI = 0.50; // Umbral global

function debeGenerarEvento(si: number): boolean {
    return si < EVENTO_MAXIMO_SI;
}
```

**En cada función de detección:**
```typescript
function detectarXXX(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0;
    
    // ✅ Verificar umbral global primero
    if (!debeGenerarEvento(si)) {
        return null; // SI ≥ 0.50 → condición normal, sin evento
    }
    
    // Continuar con lógica específica del evento
    const severidad = clasificarSeveridadPorSI(si);
    if (!severidad) return null;
    
    // ... resto de la lógica ...
}
```

### Verificación
```sql
-- Antes del fix: solo eventos con SI < 0.30
SELECT 
    COUNT(*) AS total_eventos,
    MIN((details->>'si')::numeric) AS si_minimo,
    MAX((details->>'si')::numeric) AS si_maximo,
    AVG((details->>'si')::numeric) AS si_promedio
FROM stability_events
WHERE details->>'si' IS NOT NULL
AND timestamp >= '2025-09-29' AND timestamp < '2025-10-09';

-- Resultado ANTES:
-- total_eventos | si_minimo | si_maximo | si_promedio
-- 245           | 0.05      | 0.29      | 0.18

-- Resultado esperado DESPUÉS:
-- total_eventos | si_minimo | si_maximo | si_promedio
-- 382           | 0.05      | 0.49      | 0.27
```

---

## FIX #8: PERSISTIR SEGMENTOS DE CLAVE {#fix-8}

### Problema
Claves se calculan on-the-fly, no se persisten. Clave 4 no existe.

### Archivos a Modificar
1. `prisma/schema.prisma` (nueva tabla)
2. `backend/src/services/keyCalculator.ts` (nueva función)
3. `backend/src/routes/upload.ts` (llamar post-proceso)
4. `backend/src/routes/kpis.ts` (leer de tabla)

### Paso 1: Añadir Tabla a Prisma Schema

**Archivo:** `prisma/schema.prisma`

```prisma
model OperationalStateSegment {
  id              String   @id @default(uuid())
  sessionId       String
  clave           Int      // 0, 1, 2, 3, 4, 5
  startTime       DateTime
  endTime         DateTime
  durationSeconds Int
  metadata        Json?    // Info adicional (geocerca, rotativo, etc.)
  createdAt       DateTime @default(now())
  
  Session         Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId])
  @@index([sessionId, clave])
  @@index([sessionId, startTime])
  @@map("operational_state_segments")
}
```

**Actualizar model Session:**
```prisma
model Session {
  // ... campos existentes ...
  
  OperationalStateSegments OperationalStateSegment[]
}
```

**Ejecutar migración:**
```bash
npx prisma migrate dev --name add_operational_state_segments
```

### Paso 2: Función para Calcular y Persistir Segmentos

**Archivo:** `backend/src/services/keyCalculator.ts`

```typescript
export async function calcularYGuardarSegmentos(sessionId: string): Promise<void> {
    const { prisma } = await import('../config/prisma');
    
    logger.info(`🔑 Calculando segmentos de clave para sesión ${sessionId}`);
    
    // 1. Obtener datos GPS y rotativo de la sesión
    const gpsPoints = await prisma.gpsMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });
    
    const rotativoPoints = await prisma.rotativoMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });
    
    if (gpsPoints.length === 0) {
        logger.warn(`No hay puntos GPS para sesión ${sessionId}, no se pueden calcular claves`);
        return;
    }
    
    // 2. Cargar geocercas
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { organizationId: true }
    });
    
    if (!session) return;
    
    const geocercas = await cargarGeocercas(session.organizationId);
    
    // 3. Calcular segmentos (máquina de estados)
    const segmentos = await calcularSegmentosInternos(gpsPoints, rotativoPoints, geocercas);
    
    // 4. Persistir en BD
    await prisma.operationalStateSegment.createMany({
        data: segmentos.map(s => ({
            sessionId,
            clave: s.clave,
            startTime: s.inicio,
            endTime: s.fin,
            durationSeconds: s.duracion,
            metadata: {
                geocerca: s.geocerca,
                rotativoOn: s.rotativoOn,
                velocidadPromedio: s.velocidadPromedio
            }
        }))
    });
    
    logger.info(`✅ ${segmentos.length} segmentos de clave persistidos para sesión ${sessionId}`);
}

// Función interna (máquina de estados determinista)
async function calcularSegmentosInternos(
    gpsPoints: any[],
    rotativoPoints: any[],
    geocercas: Geocerca[]
): Promise<Array<{ clave: number; inicio: Date; fin: Date; duracion: number; geocerca?: string; rotativoOn?: boolean; velocidadPromedio?: number }>> {
    const segmentos = [];
    let claveActual: number | null = null;
    let inicioSegmento: Date | null = null;
    
    for (let i = 0; i < gpsPoints.length; i++) {
        const punto = gpsPoints[i];
        const rotativoState = getRotativoState(punto.timestamp, rotativoPoints);
        
        const clave = determinarClave(punto, rotativoState, geocercas, gpsPoints, i);
        
        // Cambio de clave → cerrar segmento anterior, abrir nuevo
        if (clave !== claveActual) {
            if (claveActual !== null && inicioSegmento !== null) {
                const fin = punto.timestamp;
                const duracion = Math.floor((fin.getTime() - inicioSegmento.getTime()) / 1000);
                
                segmentos.push({
                    clave: claveActual,
                    inicio: inicioSegmento,
                    fin,
                    duracion
                });
            }
            
            claveActual = clave;
            inicioSegmento = punto.timestamp;
        }
    }
    
    // Cerrar último segmento
    if (claveActual !== null && inicioSegmento !== null) {
        const fin = gpsPoints[gpsPoints.length - 1].timestamp;
        const duracion = Math.floor((fin.getTime() - inicioSegmento.getTime()) / 1000);
        
        segmentos.push({
            clave: claveActual,
            inicio: inicioSegmento,
            fin,
            duracion
        });
    }
    
    return segmentos;
}

// Máquina de estados (MANDAMIENTO M2)
function determinarClave(
    punto: any,
    rotativoState: string,
    geocercas: Geocerca[],
    allPoints: any[],
    currentIndex: number
): number {
    const parques = geocercas.filter(g => g.tipo === 'PARQUE');
    const talleres = geocercas.filter(g => g.tipo === 'TALLER');
    
    const enTaller = talleres.some(g => puntoEnGeocerca(punto.latitude, punto.longitude, g));
    const enParque = parques.some(g => puntoEnGeocerca(punto.latitude, punto.longitude, g));
    const speed = punto.speed || 0;
    
    // Prioridad 1: Taller
    if (enTaller) return 0;
    
    // Prioridad 2: En parque
    if (enParque && rotativoState === '0') return 1;
    
    // Prioridad 3: Salida emergencia
    if (!enParque && rotativoState === '1' && speed > CONFIG.VELOCIDAD_PARADO) return 2;
    
    // Prioridad 4: En siniestro (parado ≥5min)
    const tiempoParado = calcularTiempoParado(allPoints, currentIndex);
    if (!enParque && speed < CONFIG.VELOCIDAD_PARADO && tiempoParado >= CONFIG.TIEMPO_MIN_PARADO) return 3;
    
    // Prioridad 5: Fin de actuación (rotativo apagándose)
    if (currentIndex > 0) {
        const puntoAnterior = allPoints[currentIndex - 1];
        const rotativoAnterior = getRotativoState(puntoAnterior.timestamp, rotativoPoints);
        
        if (!enParque && rotativoAnterior === '1' && rotativoState === '0' && speed < puntoAnterior.speed) {
            return 4; // ✅ CLAVE 4
        }
    }
    
    // Prioridad 6: Regreso al parque
    const acercandoParque = calcularAcercamientoParque(allPoints, currentIndex, parques);
    if (!enParque && rotativoState === '0' && speed > CONFIG.VELOCIDAD_PARADO && acercandoParque) return 5;
    
    // Por defecto: mantener clave anterior (o clave 1 si es el inicio)
    return currentIndex === 0 ? 1 : determinarClave(allPoints[currentIndex - 1], /* ... */);
}
```

### Paso 3: Llamar en Post-Proceso de Upload

**Archivo:** `backend/src/services/UnifiedFileProcessor.ts`

```typescript
// Después de crear sesión (línea ~120)
for (const sessionId of resultado.sessionIds) {
    // ... código existente (eventDetector, speedAnalyzer) ...
    
    // ✅ AÑADIR: Calcular y persistir segmentos de clave
    await keyCalculator.calcularYGuardarSegmentos(sessionId);
}
```

### Paso 4: Leer de Tabla en KPI Endpoint

**Archivo:** `backend/src/routes/kpis.ts`

**Reemplazar** `calcularTiemposPorClave()` (líneas ~290-330) por:

```typescript
// Leer segmentos de BD en lugar de recalcular
const segmentos = await prisma.operationalStateSegment.groupBy({
    where: { sessionId: { in: sessionIds } },
    by: ['clave'],
    _sum: {
        durationSeconds: true
    }
});

const tiemposPorClave = {
    clave0_segundos: segmentos.find(s => s.clave === 0)?._sum.durationSeconds || 0,
    clave1_segundos: segmentos.find(s => s.clave === 1)?._sum.durationSeconds || 0,
    clave2_segundos: segmentos.find(s => s.clave === 2)?._sum.durationSeconds || 0,
    clave3_segundos: segmentos.find(s => s.clave === 3)?._sum.durationSeconds || 0,
    clave4_segundos: segmentos.find(s => s.clave === 4)?._sum.durationSeconds || 0, // ✅ CLAVE 4
    clave5_segundos: segmentos.find(s => s.clave === 5)?._sum.durationSeconds || 0,
};

// Formatear tiempos
const states = [
    { key: 0, name: 'Taller', duration_seconds: tiemposPorClave.clave0_segundos, duration_formatted: formatearTiempo(tiemposPorClave.clave0_segundos) },
    { key: 1, name: 'Operativo en Parque', duration_seconds: tiemposPorClave.clave1_segundos, duration_formatted: formatearTiempo(tiemposPorClave.clave1_segundos) },
    { key: 2, name: 'Salida en Emergencia', duration_seconds: tiemposPorClave.clave2_segundos, duration_formatted: formatearTiempo(tiemposPorClave.clave2_segundos) },
    { key: 3, name: 'En Siniestro', duration_seconds: tiemposPorClave.clave3_segundos, duration_formatted: formatearTiempo(tiemposPorClave.clave3_segundos) },
    { key: 4, name: 'Fin de Actuación', duration_seconds: tiemposPorClave.clave4_segundos, duration_formatted: formatearTiempo(tiemposPorClave.clave4_segundos) }, // ✅ AÑADIR
    { key: 5, name: 'Regreso al Parque', duration_seconds: tiemposPorClave.clave5_segundos, duration_formatted: formatearTiempo(tiemposPorClave.clave5_segundos) },
];
```

### Verificación
```sql
-- Después de subir archivos
SELECT 
    clave,
    COUNT(*) AS num_segmentos,
    SUM("durationSeconds") AS total_segundos,
    CONCAT(
        LPAD(FLOOR(SUM("durationSeconds") / 3600)::text, 2, '0'), ':',
        LPAD(FLOOR(MOD(SUM("durationSeconds"), 3600) / 60)::text, 2, '0'), ':',
        LPAD(MOD(SUM("durationSeconds"), 60)::text, 2, '0')
    ) AS total_formateado
FROM operational_state_segments
WHERE "sessionId" IN (
    SELECT id FROM "Session" 
    WHERE "organizationId" = 'default-org'
    AND "startTime" >= '2025-09-29'
)
GROUP BY clave
ORDER BY clave;

-- Resultado esperado:
-- clave | num_segmentos | total_segundos | total_formateado
-- 0     | 12            | 3600           | 01:00:00
-- 1     | 45            | 18000          | 05:00:00
-- 2     | 8             | 2400           | 00:40:00
-- 3     | 5             | 1500           | 00:25:00
-- 4     | 3             | 600            | 00:10:00  ← DEBE EXISTIR
-- 5     | 10            | 3000           | 00:50:00
```

---

## FIX #9: LOGGING DE USO DE RADAR.COM {#fix-9}

### Problema
Sin logging, imposible saber si se usa Radar.com o fallback.

### Archivos a Modificar
1. `prisma/schema.prisma` (nueva tabla)
2. `backend/src/services/keyCalculator.ts`
3. `backend/src/services/radarIntegration.ts` (si existe)

### Paso 1: Añadir Tabla de Logging

**Archivo:** `prisma/schema.prisma`

```prisma
model GeofenceUsageLog {
  id             String   @id @default(uuid())
  timestamp      DateTime @default(now())
  source         String   // 'radar.com' | 'local_db'
  organizationId String
  operation      String   // 'getParks' | 'isInGeofence' | 'getZones'
  success        Boolean
  apiCalls       Int      @default(1)
  errorMessage   String?
  
  @@index([timestamp])
  @@index([source, timestamp])
  @@map("geofence_usage_logs")
}
```

**Migración:**
```bash
npx prisma migrate dev --name add_geofence_usage_log
```

### Paso 2: Modificar cargarGeocercas

**Archivo:** `backend/src/services/keyCalculator.ts`

```typescript
async function cargarGeocercas(organizationId: string): Promise<Geocerca[]> {
    const { prisma } = await import('../config/prisma');
    
    if (USE_RADAR) {
        try {
            logger.info('📡 Intentando cargar geocercas desde Radar.com');
            
            const parksRadar = await radarIntegration.getParks(organizationId);
            const zonesRadar = await radarIntegration.getZones(organizationId, 'TALLER');
            
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
            
            logger.info(`✅ Geocercas cargadas desde Radar.com: ${parksRadar.length} parques, ${zonesRadar.length} talleres`);
            
            return [...parksRadar, ...zonesRadar];
            
        } catch (error: any) {
            logger.error('❌ Error en Radar.com, usando fallback local', { error: error.message });
            
            // ✅ Registrar fallo
            await prisma.geofenceUsageLog.create({
                data: {
                    source: 'radar.com',
                    organizationId,
                    operation: 'getParks',
                    success: false,
                    errorMessage: error.message
                }
            });
            
            // Fallback a BD local (abajo)
        }
    }
    
    // Fallback: cargar desde BD local
    logger.info('📂 Cargando geocercas desde BD local');
    
    const parques = await prisma.park.findMany({
        where: { organizationId }
    });
    
    const talleres = await prisma.zone.findMany({
        where: { organizationId, type: 'TALLER' }
    });
    
    // ✅ Registrar uso de fallback
    await prisma.geofenceUsageLog.create({
        data: {
            source: 'local_db',
            organizationId,
            operation: 'getParks',
            success: true,
            apiCalls: 1
        }
    });
    
    logger.info(`✅ Geocercas cargadas desde BD local: ${parques.length} parques, ${talleres.length} talleres`);
    
    // Convertir a formato Geocerca
    const geocercas: Geocerca[] = [
        ...parques.map(p => ({
            lat: (p.geometry as any).center.lat,
            lon: (p.geometry as any).center.lng,
            radio: (p.geometry as any).radius / 1000, // metros a km
            nombre: p.name,
            tipo: 'PARQUE' as const
        })),
        ...talleres.map(t => ({
            lat: (t.geometry as any).center.lat,
            lon: (t.geometry as any).center.lng,
            radio: ((t.geometry as any).radius || 100) / 1000,
            nombre: t.name,
            tipo: 'TALLER' as const
        }))
    ];
    
    return geocercas;
}
```

### Paso 3: Dashboard de Uso (opcional)

**Archivo:** `backend/src/routes/monitoring.ts` (nuevo)

```typescript
import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// GET /api/monitoring/geofence-usage
router.get('/geofence-usage', async (req, res) => {
    try {
        const logs = await prisma.geofenceUsageLog.groupBy({
            by: ['source'],
            where: {
                timestamp: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
                }
            },
            _count: {
                id: true
            },
            _sum: {
                apiCalls: true
            }
        });
        
        const stats = logs.map(l => ({
            source: l.source,
            totalLlamadas: l._sum.apiCalls || 0,
            totalRegistros: l._count.id
        }));
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
```

### Verificación
```sql
-- Ver uso de últimos 7 días
SELECT 
    DATE(timestamp) AS fecha,
    source,
    operation,
    COUNT(*) AS llamadas,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS exitosas,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS fallidas,
    SUM("apiCalls") AS total_api_calls
FROM geofence_usage_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), source, operation
ORDER BY fecha DESC, source;

-- Resultado esperado:
-- fecha      | source    | operation | llamadas | exitosas | fallidas | total_api_calls
-- 2025-10-14 | radar.com | getParks  | 45       | 42       | 3        | 42
-- 2025-10-14 | local_db  | getParks  | 8        | 8        | 0        | 8
-- ...

-- ✅ Si solo hay local_db → Radar.com no configurado o siempre falla
-- ✅ Si hay ambos → sistema funciona con fallback correcto
```

---

## FIX #11: PERSISTIR details.si EN EVENTOS {#fix-11}

### Problema
Eventos pueden no tener `details.si`, causando errores en hotspots al re-clasificar.

### Archivos a Modificar
- `backend/src/services/eventDetector.ts` (función `guardarEventos` o equivalente)

### Código a Modificar

**Buscar** la función que persiste eventos (probablemente líneas 400-500):

```typescript
// ❌ CÓDIGO ACTUAL (posible)
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
            // ❌ Puede faltar si
        }
    }
});
```

**✅ CÓDIGO NUEVO:**

```typescript
await prisma.stability_events.create({
    data: {
        session_id: evento.sessionId,
        timestamp: evento.timestamp,
        lat: evento.lat || 0,
        lon: evento.lon || 0,
        type: evento.tipo,
        speed: evento.valores.velocity || 0,
        rotativoState: evento.rotativo ? 1 : 0,
        details: {
            si: evento.valores.si,          // ✅ OBLIGATORIO
            ax: evento.valores.ax,
            ay: evento.valores.ay,
            az: evento.valores.az,
            gx: evento.valores.gx,
            gy: evento.valores.gy,
            gz: evento.valores.gz,
            roll: evento.valores.roll,
            pitch: evento.valores.pitch,
            yaw: evento.valores.yaw,
            cambioGx: evento.valores.cambioGx
        }
    }
});

// ✅ Validar que si existe
if (!evento.valores.si) {
    logger.warn(`⚠️ Evento sin SI, no se guardará: ${evento.tipo} en ${evento.timestamp}`);
    return; // No guardar eventos sin SI
}
```

### Verificación
```sql
-- Eventos sin SI
SELECT COUNT(*) AS eventos_sin_si
FROM stability_events
WHERE details->>'si' IS NULL
OR details->>'si' = '';

-- Resultado esperado: 0

-- Muestra de detalles
SELECT 
    type,
    details->>'si' AS si,
    details->>'roll' AS roll,
    details->>'gx' AS gx
FROM stability_events
LIMIT 10;

-- Resultado esperado: todos con si != null
```

---

## FIX #12: POST-PROCESAMIENTO OBLIGATORIO EN UPLOAD {#fix-12}

### Problema
Tras crear sesiones, no se ejecuta post-proceso (eventos, velocidad, claves).

### Archivos a Modificar
- `backend/src/services/UnifiedFileProcessor.ts`

### Código a Modificar (líneas ~115-150)

**Buscar** el final de la función `procesarArchivos`:

```typescript
// ❌ CÓDIGO ACTUAL (posible)
logger.info(`✅ Sesiones creadas: ${resultado.sessionIds.length}`);

return resultado;
```

**✅ CÓDIGO NUEVO:**

```typescript
logger.info(`✅ Sesiones creadas: ${resultado.sessionIds.length}`);

// ============================================================================
// POST-PROCESAMIENTO OBLIGATORIO (MANDAMIENTO M9.2)
// ============================================================================

logger.info('🔄 Iniciando post-procesamiento...');

for (const sessionId of resultado.sessionIds) {
    try {
        // 1. Eventos de estabilidad
        logger.info(`📊 Detectando eventos para sesión ${sessionId}...`);
        await eventDetector.detectarYGuardarEventos(sessionId);
        
        // 2. Violaciones de velocidad
        logger.info(`🚗 Analizando velocidades para sesión ${sessionId}...`);
        await speedAnalyzer.analizarVelocidades([sessionId]);
        
        // 3. Segmentos de clave
        logger.info(`🔑 Calculando segmentos de clave para sesión ${sessionId}...`);
        await keyCalculator.calcularYGuardarSegmentos(sessionId);
        
        logger.info(`✅ Post-procesamiento completado para sesión ${sessionId}`);
        
    } catch (error: any) {
        logger.error(`❌ Error en post-procesamiento de sesión ${sessionId}:`, error);
        resultado.problemas.push({
            tipo: 'error_postproceso',
            descripcion: `Error en post-proceso: ${error.message}`,
            gravedad: 'media'
        });
    }
}

logger.info('🎉 Post-procesamiento completado para todas las sesiones');

return resultado;
```

### Importaciones Necesarias (inicio del archivo)

```typescript
import { eventDetector } from './eventDetector';
import { speedAnalyzer } from './speedAnalyzer';
import * as keyCalculator from './keyCalculator';
```

### Verificación

**Logs esperados tras subir archivos:**

```
✅ Sesiones creadas: 3
🔄 Iniciando post-procesamiento...
📊 Detectando eventos para sesión abc-123...
🚗 Analizando velocidades para sesión abc-123...
🔑 Calculando segmentos de clave para sesión abc-123...
✅ Post-procesamiento completado para sesión abc-123
📊 Detectando eventos para sesión def-456...
...
🎉 Post-procesamiento completado para todas las sesiones
```

**Queries de verificación:**

```sql
-- Después de upload, verificar que se crearon:

-- 1. Eventos de estabilidad
SELECT COUNT(*) FROM stability_events 
WHERE session_id IN (SELECT id FROM "Session" WHERE "createdAt" > NOW() - INTERVAL '5 minutes');

-- 2. Violaciones de velocidad
SELECT COUNT(*) FROM speed_violations 
WHERE "sessionId" IN (SELECT id FROM "Session" WHERE "createdAt" > NOW() - INTERVAL '5 minutes');

-- 3. Segmentos de clave
SELECT COUNT(*) FROM operational_state_segments 
WHERE "sessionId" IN (SELECT id FROM "Session" WHERE "createdAt" > NOW() - INTERVAL '5 minutes');

-- Todos deben devolver > 0 si hay datos válidos
```

---

## 📅 TIMELINE RECOMENDADO (48-72h)

### Día 1 (8 horas)
- [ ] Fix #1: KPI SI real (1h)
- [ ] Fix #2: Normalización SI (2h)
- [ ] Fix #3: Categoría moderada velocidad (30min)
- [ ] Fix #6: Validación filtros (1.5h)
- [ ] Fix #11: Persistir details.si (1h)
- [ ] Testing manual Día 1 (2h)

### Día 2 (8 horas)
- [ ] Fix #8: Tabla segmentos + migración (2h)
- [ ] Fix #8: Función calcular segmentos (3h)
- [ ] Fix #10: Implementar Clave 4 (2h)
- [ ] Testing manual Día 2 (1h)

### Día 3 (8 horas)
- [ ] Fix #4: Eliminar límites sesiones (1.5h)
- [ ] Fix #5: Clustering sin duplicados (1.5h)
- [ ] Fix #7: Umbral eventos 0.50 (1h)
- [ ] Fix #9: Logging Radar.com (1.5h)
- [ ] Fix #12: Post-proceso obligatorio (30min)
- [ ] Testing completo E2E (2h)

---

## ✅ CHECKLIST FINAL DE VERIFICACIÓN

Antes de considerar completos los fixes:

- [ ] **M1:** Rotativo validado (solo '0'/'1')
- [ ] **M2:** Segmentos de clave persistidos, Clave 4 existe
- [ ] **M3:** Eventos solo si SI<0.50, severidad correcta (grave/mod/leve)
- [ ] **M4:** KPI SI = AVG(si), no `(100-eventos)/100`
- [ ] **M5:** Clustering con IDs únicos (Set), radio en metros
- [ ] **M6:** Velocidad con 'moderada', sin límites de sesiones
- [ ] **M7:** Logging de Radar.com funciona
- [ ] **M8:** Filtros validados (400 si faltan)
- [ ] **M9:** Post-proceso se ejecuta tras upload
- [ ] **M10:** Logs info/error en todos los endpoints

---

**FIN DEL PLAN DE FIXES**

**Próximo paso:** Ejecutar fixes en orden del timeline y verificar con checks SQL después de cada uno.

