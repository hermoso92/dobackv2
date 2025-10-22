# 🔍 AUDITORÍA EXHAUSTIVA - DASHBOARD DOBACKSOFT

**Fecha:** 21 de Octubre de 2025  
**Enfoque:** Análisis completo de KPIs, APIs, cálculos, estructura y flujos

---

## 📊 PARTE 1: ANÁLISIS DE KPIs INDIVIDUALES

### Datos Actuales Observados:
```
✅ 61:09:48 - Horas de Conducción (CON DATOS)
✅ 538.4 km - Kilómetros Recorridos (CON DATOS)
✅ 9 km/h - Velocidad Promedio (CON DATOS)
✅ 61.3% - % Rotativo Activo (CON DATOS)
❌ 0.0% - Índice de Estabilidad (SIN DATOS)
```

### Claves Operacionales:
```
❌ 00:00:00 - Clave 0 (Taller) - SIN DATOS
❌ 00:00:00 - Clave 1 (Parque) - SIN DATOS
✅ 37:15:25 - Clave 2 (Emergencia) - CON DATOS
✅ 23:54:23 - Clave 3 (Siniestro) - CON DATOS
❌ 00:00:00 - Clave 4 (Retirada) - SIN DATOS
```

---

## 🔬 ANÁLISIS POR KPI

### KPI 1: Horas de Conducción (61:09:48) ✅

**Valor Actual:** 61:09:48 (61 horas, 9 minutos, 48 segundos)

**¿Cómo se calcula?**
- API Endpoint: `/api/kpis/summary`
- Lógica esperada: Sumar duración de todos los segmentos donde el vehículo está en movimiento
- Fuente de datos: Tabla `Session` → campo `duration` o tabla `Segment`

**Verificación:**
- ✅ Muestra valor > 0
- ✅ Formato correcto (HH:MM:SS)
- ⚠️ **REVISAR:** ¿Son 61 horas razonables para el período mostrado (29/09 - 08/10)?
  - 10 días × 24h = 240h máximo posible
  - 61h / 10 días = 6.1h promedio por día
  - ✅ Parece razonable para una flota

**Backend a Revisar:**
```typescript
// backend/src/routes/kpis.ts o similar
// Buscar: calculateDrivingHours() o similar
```

**Preguntas:**
1. ¿Incluye TODAS las sesiones o solo algunas?
2. ¿Filtra por estado operacional (excluye parque)?
3. ¿Considera gaps entre puntos GPS?

---

### KPI 2: Kilómetros Recorridos (538.4 km) ✅

**Valor Actual:** 538.4 km

**¿Cómo se calcula?**
- Fórmula esperada: Haversine entre puntos GPS consecutivos
- Fuente: Tabla `TelemetryData` → campos `latitude`, `longitude`
- Filtros: Solo puntos válidos (lat/lon != 0)

**Verificación:**
- ✅ Valor >0 y razonable
- ⚠️ **REVISAR:** ¿Es coherente con 61h de conducción?
  - 538.4 km / 61.16h = 8.8 km/h promedio
  - Dashboard muestra 9 km/h → ✅ COHERENTE

**Backend a Revisar:**
```typescript
// backend/src/services/DashboardService.ts
// Función: calculateDistance() usando Haversine
```

**Preguntas:**
1. ¿Se filtran puntos GPS inválidos?
2. ¿Se maneja correctamente distancia cuando hay gaps grandes?
3. ¿Se acumula por sesión o globalmente?

---

### KPI 3: Velocidad Promedio (9 km/h) ✅

**Valor Actual:** 9 km/h

**¿Cómo se calcula?**
- Opción A: Total km / Total horas
  - 538.4 km / 61.16h = 8.8 km/h ✅ COINCIDE
- Opción B: Promedio de velocidades individuales
  - Menos preciso si hay stops

**Verificación:**
- ✅ Coherente con datos anteriores
- ⚠️ **NOTA:** 9 km/h es BAJA para vehículos de bomberos
  - Posible causa: Mucho tiempo parado en siniestros (23:54:23)
  - Posible causa: Tráfico urbano

**Backend a Revisar:**
```typescript
// ¿Se usa campo `speed` de GPS o se calcula?
```

**Preguntas:**
1. ¿Se usa velocidad del GPS directamente?
2. ¿Se calcula distancia/tiempo?
3. ¿Se filtran velocidades = 0 (parado)?

---

### KPI 4: % Rotativo Activo (61.3%) ✅

**Valor Actual:** 61.3%

**¿Cómo se calcula?**
- Fórmula: (Tiempo con clave 2 o 5) / (Tiempo total fuera del parque) × 100
- Fuente: Archivo ROTATIVO o campo `clave` en segmentos

**Verificación:**
- ✅ Valor razonable (>50% es alto pero posible en bomberos)
- ⚠️ **COMPARAR CON CLAVES:**
  - Clave 2 (Emergencia): 37:15:25
  - Clave 3 (Siniestro): 23:54:23
  - Total: 61:09:48
  - (37:15:25 / 61:09:48) × 100 = 60.9% ≈ 61.3% ✅ COHERENTE

**Backend a Revisar:**
```typescript
// Tabla Segment → campo `operational_state` o `clave`
```

**Preguntas:**
1. ¿Clave 5 también cuenta como rotativo?
2. ¿Se excluye tiempo en parque del denominador?

---

### KPI 5: Índice de Estabilidad (0.0%) ❌

**Valor Actual:** 0.0% - **N/A**

**PROBLEMA CRÍTICO:** No hay datos

**¿Cómo DEBERÍA calcularse?**
- Fórmula esperada: 
  - Opción A: (Eventos críticos / Total eventos) × 100
  - Opción B: Score basado en SI (Stability Index)
  - Opción C: % de tiempo sin incidencias

**Posibles Causas del 0%:**
1. ❌ No hay eventos de estabilidad en BD
2. ❌ Query incorrecta (tabla vacía)
3. ❌ Filtro demasiado restrictivo
4. ❌ Campo `SI` (Stability Index) no calculado

**Backend a Revisar - PRIORIDAD ALTA:**
```typescript
// backend/src/routes/stability-events.ts
// backend/src/services/StabilityAnalyzer.ts
// Verificar: ¿Eventos se generan al procesar archivos ESTABILIDAD?
```

**Acción Requerida:**
```sql
-- Verificar si hay eventos
SELECT COUNT(*) FROM "StabilityEvent";
SELECT * FROM "StabilityEvent" LIMIT 5;

-- Si hay eventos, verificar SI
SELECT AVG("stabilityIndex"), MIN("stabilityIndex"), MAX("stabilityIndex") 
FROM "StabilityEvent" 
WHERE "stabilityIndex" IS NOT NULL;
```

---

### KPI 6: Clave 0 - Taller (00:00:00) ❌

**PROBLEMA:** Sin datos

**¿Por qué está a 0?**
- Posibilidad 1: No hubo mantenimiento en el período
- Posibilidad 2: Archivos ROTATIVO no tienen eventos con clave=0
- Posibilidad 3: Lógica no reconoce clave 0

**Verificación Recomendada:**
```sql
-- Ver distribución de claves
SELECT "operational_state", COUNT(*), SUM("duration") 
FROM "Segment" 
GROUP BY "operational_state";
```

---

### KPI 7: Clave 1 - Parque (00:00:00) ❌

**PROBLEMA CRÍTICO:** Sin datos

**¿Por qué está a 0?**
- ⚠️ **SOSPECHOSO:** TODOS los vehículos deben estar en parque ALGÚN tiempo
- Posibilidad 1: Lógica no identifica "EN_PARQUE"
- Posibilidad 2: Estados mal parseados de archivos ROTATIVO

**Acción Requerida:**
```typescript
// Verificar parser de ROTATIVO
// ¿Reconoce estados: 0, 1, 2, 3, 4, 5?
```

---

### KPI 8: Clave 2 - Emergencia (37:15:25) ✅

**Valor Actual:** 37:15:25 (37 horas con rotativo)

**Verificación:**
- ✅ Coherente con "61.3% rotativo activo"
- ✅ Valor razonable para bomberos

---

### KPI 9: Clave 3 - Siniestro (23:54:23) ✅

**Valor Actual:** 23:54:23 (casi 24 horas)

**Verificación:**
- ✅ Suma coherente: 37h + 24h ≈ 61h total
- ✅ Indica que pasan tiempo significativo en siniestros

---

### KPI 10: Clave 4 - Retirada (00:00:00) ❌

**PROBLEMA:** Sin datos

**¿Por qué está a 0?**
- Posibilidad 1: No hubo retiradas en el período (normal)
- Posibilidad 2: Lógica no reconoce clave 4

---

## 🔍 PARTE 2: ANÁLISIS DE APIs

### API Principal: `/api/kpis/summary`

**Request:**
```
GET /api/kpis/summary?startDate=2025-09-29&endDate=2025-10-08&organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26
```

**Archivo Backend:**
```
backend/src/routes/kpis.ts
```

**Revisar:**
1. ¿Consulta correcta de sesiones?
2. ¿Joins con tablas relacionadas?
3. ¿Agregaciones correctas?
4. ¿Filtros por organización?
5. ¿Manejo de fechas correcto?

---

## 🎯 PARTE 3: PRIORIDADES DE REVISIÓN

### 🔴 CRÍTICAS (Datos a 0 sospechosos):

1. **Índice de Estabilidad = 0%**
   - Archivo: `backend/src/services/StabilityAnalyzer.ts`
   - Verificar: ¿Se generan eventos al procesar ESTABILIDAD?
   - Query BD: `SELECT COUNT(*) FROM "StabilityEvent"`

2. **Clave 1 (Parque) = 0**
   - Archivo: `backend/src/services/upload/RotativoParser.ts`
   - Verificar: ¿Se parsea clave=1 correctamente?
   - Query BD: `SELECT * FROM "Segment" WHERE "operational_state" = 'EN_PARQUE'`

3. **Clave 0 (Taller) = 0**
   - Similar a Clave 1
   - Puede ser normal si no hubo mantenimiento

### 🟠 ALTAS (Verificar cálculos):

4. **Velocidad Promedio (9 km/h)**
   - ¿Es demasiado baja?
   - Archivo: `backend/src/services/speedAnalyzer.ts`
   - Verificar: Lógica de cálculo

5. **% Rotativo Activo (61.3%)**
   - ¿Incluye clave 5?
   - Archivo: `backend/src/services/DashboardService.ts`
   - Verificar: Fórmula

### 🟡 MEDIAS (Validar coherencia):

6. **Horas de Conducción vs Km**
   - Relación: 538km / 61h = 8.8 km/h
   - ✅ Coherente pero revisar si es realista

---

## 📊 PARTE 4: PLAN DE AUDITORÍA DETALLADA

### Paso 1: Verificar Base de Datos
```sql
-- 1.1 Contar sesiones
SELECT COUNT(*) as total_sessions FROM "Session" 
WHERE "organizationId" = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

-- 1.2 Contar eventos de estabilidad
SELECT COUNT(*) as total_events FROM "StabilityEvent";

-- 1.3 Ver distribución de claves
SELECT "operational_state", COUNT(*), 
       ROUND(SUM("duration")::numeric/3600, 2) as hours
FROM "Segment"
GROUP BY "operational_state"
ORDER BY hours DESC;

-- 1.4 Verificar puntos GPS
SELECT COUNT(*) as gps_points FROM "TelemetryData"
WHERE "latitude" != 0 AND "longitude" != 0;

-- 1.5 Ver sesiones con detalles
SELECT 
  s.id, 
  s."vehicleId", 
  s."sessionDate",
  s.duration,
  s."totalDistance",
  COUNT(se.id) as segment_count,
  COUNT(t.id) as gps_points
FROM "Session" s
LEFT JOIN "Segment" se ON se."sessionId" = s.id
LEFT JOIN "TelemetryData" t ON t."sessionId" = s.id
GROUP BY s.id
ORDER BY s."sessionDate" DESC
LIMIT 10;
```

### Paso 2: Rastrear Cálculo de cada KPI

**KPI por KPI:**

```typescript
// 2.1 Horas de Conducción
// Archivo: backend/src/services/DashboardService.ts
async function calculateDrivingHours(sessions) {
  // TODO: Verificar implementación real
}

// 2.2 Kilómetros
// Archivo: backend/src/services/DashboardService.ts  
async function calculateTotalDistance(sessions) {
  // TODO: Verificar Haversine implementation
}

// 2.3 Velocidad Promedio
// ¿Se calcula o se obtiene de GPS?

// 2.4 % Rotativo
// ¿De dónde sale? ¿Tabla Segment?

// 2.5 Índice Estabilidad
// CRÍTICO: Encontrar por qué es 0
```

### Paso 3: Validar Parsers de Archivos

```typescript
// 3.1 Parser ESTABILIDAD
// Archivo: backend/src/services/upload/EstabilidadParser.ts
// Verificar: ¿Genera eventos en StabilityEvent?

// 3.2 Parser ROTATIVO  
// Archivo: backend/src/services/upload/RotativoParser.ts
// Verificar: ¿Reconoce claves 0-5?

// 3.3 Parser GPS
// Archivo: backend/src/services/upload/GPSParser.ts
// Verificar: ¿Valida coordenadas?

// 3.4 Post-Processor
// Archivo: backend/src/services/upload/UploadPostProcessor.ts
// Verificar: ¿Calcula métricas agregadas?
```

### Paso 4: Probar Flujo Completo

1. Subir archivo ESTABILIDAD real
2. Verificar que genera eventos en BD
3. Verificar que KPI se actualiza
4. Repetir con ROTATIVO (claves)
5. Repetir con GPS (distancia)

---

## 🎨 PARTE 5: ANÁLISIS VISUAL Y ESTRUCTURA

### Elementos Visibles en Dashboard:

```
✅ Menú lateral (12 opciones)
✅ Filtros de fecha (Inicio/Fin)
✅ Selectores de vehículo/parque
✅ 8 Tabs de navegación
✅ 4 Botones de período rápido (HOY, SEMANA, MES, TODO)
✅ Botón "EXPORTAR REPORTE DETALLADO"
✅ 5 KPIs generales
✅ 5 KPIs de claves operacionales
```

### Estructura HTML:
```html
<div class="app-layout">
  <!-- Sidebar con menú -->
  <!-- Main content -->
  <div class="dashboard-content">
    <!-- Filtros globales -->
    <!-- Tabs -->
    <TabContent>
      <!-- KPIs -->
      <!-- Gráficas -->
      <!-- Tablas -->
    </TabContent>
  </div>
</div>
```

---

## 🔄 PARTE 6: FLUJOS A VALIDAR

### Flujo 1: Carga Inicial
1. Usuario hace login → Dashboard
2. API `/api/kpis/summary` se llama automáticamente
3. KPIs se pintan en UI
4. ¿Spinner/loading mientras carga?
5. ¿Manejo de errores si API falla?

### Flujo 2: Cambio de Filtros
1. Usuario selecciona fechas diferentes
2. ¿Se dispara nueva petición API?
3. ¿KPIs se actualizan?
4. ¿Loading state?

### Flujo 3: Cambio de Tab
1. Click en "Puntos Negros"
2. ¿Nueva API call?
3. ¿Mapa se carga con puntos?
4. ¿Datos filtrados por fechas seleccionadas?

### Flujo 4: Exportar PDF
1. Click en "EXPORTAR REPORTE DETALLADO"
2. ¿API `/api/reports/generate`?
3. ¿PDF se descarga?
4. ¿Incluye datos actuales o genérico?

---

## ✅ PRÓXIMOS PASOS CONCRETOS

### Inmediato (Ahora):
1. ✅ **Conectar a BD y ejecutar queries de verificación**
2. ✅ **Leer código de `/api/kpis/summary`**
3. ✅ **Identificar por qué Índice Estabilidad = 0**
4. ✅ **Identificar por qué Clave 1 (Parque) = 0**

### Corto Plazo (1-2h):
5. **Auditar cada parser de archivos**
6. **Probar upload de archivo real**
7. **Verificar actualización de KPIs**
8. **Documentar cálculos reales vs esperados**

### Medio Plazo (2-4h):
9. **Auditar cada tab individualmente**
10. **Probar todos los flujos de usuario**
11. **Validar exportación PDF**
12. **Generar reporte final exhaustivo**

---

**FIN DE DOCUMENTO - CONTINUAMOS CON EJECUCIÓN**

