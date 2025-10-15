# 🔧 SISTEMA DE SUBIDA - ESTRUCTURA ROBUSTA

## 📋 ÍNDICE
1. [Archivos y Estructura](#1-archivos-y-estructura)
2. [Reglas de Detección de Sesiones](#2-reglas-de-detección-de-sesiones)
3. [Reglas de Correlación](#3-reglas-de-correlación)
4. [Reglas de Validación](#4-reglas-de-validación)
5. [Proceso de Guardado](#5-proceso-de-guardado)
6. [Casos Especiales](#6-casos-especiales)

---

## 1. ARCHIVOS Y ESTRUCTURA

### 1.1. Ubicación de archivos reales
```
backend/data/CMadrid/
├── doback024/
│   ├── estabilidad/
│   │   └── ESTABILIDAD_DOBACK024_YYYYMMDD.txt
│   ├── GPS/
│   │   └── GPS_DOBACK024_YYYYMMDD.txt
│   └── ROTATIVO/
│       └── ROTATIVO_DOBACK024_YYYYMMDD.txt
├── doback026/
├── doback027/
└── doback028/
```

### 1.2. Convención de nombres
```
TIPO_VEHICULO_FECHA.txt

Donde:
- TIPO: ESTABILIDAD, GPS, ROTATIVO
- VEHICULO: DOBACK024, DOBACK026, etc.
- FECHA: YYYYMMDD (20250930, 20251001, etc.)
```

### 1.3. Agrupación de archivos
**REGLA 1.3.A:** Los archivos se agrupan por:
- **Vehículo:** Extraído del nombre (DOBACK0XX)
- **Fecha:** Extraída del nombre (YYYYMMDD)

**REGLA 1.3.B:** Un grupo válido puede contener:
- ✅ ESTABILIDAD + GPS + ROTATIVO (ideal, sesión completa)
- ⚠️ ESTABILIDAD + ROTATIVO (aceptable, sin GPS)
- ❌ Solo ESTABILIDAD (insuficiente)
- ❌ Solo GPS (insuficiente)
- ❌ Solo ROTATIVO (insuficiente)

---

## 2. REGLAS DE DETECCIÓN DE SESIONES

### 2.1. Definición de sesión
Una **sesión** es un período operativo continuo del vehículo, detectado por:
- Secuencia de mediciones sin gaps temporales grandes
- Gap > 5 minutos (300s) = Nueva sesión

### 2.2. Detección en cada archivo

**REGLA 2.2.A - ESTABILIDAD:**
```typescript
1. Parsear archivo con parseEstabilidadRobust()
2. Ordenar mediciones por timestamp
3. Agrupar por gaps de 300s:
   - Si (medición[i+1].timestamp - medición[i].timestamp) > 300s:
     → Cerrar sesión actual
     → Iniciar sesión nueva
4. Numerar sesiones secuencialmente desde 1
5. Calcular startTime = primera medición, endTime = última medición
```

**REGLA 2.2.B - GPS:**
```typescript
1. Parsear archivo con parseGPSRobust()
2. Validar coordenadas (rechazar 0,0 y fuera de rango global)
3. Interpolar puntos faltantes si es necesario
4. Agrupar por gaps de 300s (igual que ESTABILIDAD)
5. Numerar sesiones desde 1
```

**REGLA 2.2.C - ROTATIVO:**
```typescript
1. Parsear archivo con parseRotativoRobust()
2. Filtrar por estado válido (ON, APAGADO, etc.)
3. Agrupar por gaps de 300s
4. Numerar sesiones desde 1
```

### 2.3. Numeración por archivo
- Cada tipo de archivo numera sus sesiones de forma independiente
- La numeración **reinicia cada día** (sesión 1, 2, 3...)
- Ejemplo:
  ```
  ESTABILIDAD_DOBACK024_20250930.txt → Sesión 1, Sesión 2
  GPS_DOBACK024_20250930.txt → Sesión 1, Sesión 2
  ROTATIVO_DOBACK024_20250930.txt → Sesión 1, Sesión 2
  ```

---

## 3. REGLAS DE CORRELACIÓN

### 3.1. Objetivo
Unir sesiones de diferentes tipos (ESTABILIDAD, GPS, ROTATIVO) que corresponden a la **misma operación real**.

### 3.2. Umbral de correlación
**REGLA 3.2:** Dos sesiones se correlacionan si:
```
|startTime_sesion1 - startTime_sesion2| ≤ 300 segundos (5 minutos)
```

**Justificación del umbral (300s):**
- GPS puede tardar hasta 2-3 min en obtener señal inicial
- Desfases de reloj entre sistemas
- Arranques rápidos en vehículos de emergencia
- Análisis real usaba 120s, pero era demasiado estricto

### 3.3. Proceso de correlación

**REGLA 3.3.A - Estrategia:**
```typescript
Para cada sesión ESTABILIDAD:
1. Buscar sesión GPS con |inicio_diff| ≤ 300s
2. Buscar sesión ROTATIVO con |inicio_diff| ≤ 300s
3. Si se encuentra al menos GPS o ROTATIVO:
   → Crear sesión correlacionada
4. Si no se encuentra ninguno:
   → Marcar ESTABILIDAD como sesión independiente
```

**REGLA 3.3.B - Prioridad:**
- ESTABILIDAD es el **ancla** (tipo principal)
- Se intenta correlacionar GPS y ROTATIVO con cada sesión ESTABILIDAD
- Si una sesión GPS o ROTATIVO no tiene ESTABILIDAD correspondiente:
  → No se procesa (ESTABILIDAD es obligatorio)

**REGLA 3.3.C - Timestamps de sesión correlacionada:**
```typescript
startTime = MIN(estabilidad.start, gps?.start, rotativo?.start)
endTime   = MAX(estabilidad.end, gps?.end, rotativo?.end)
duration  = endTime - startTime
```

### 3.4. Ejemplo real (DOBACK024 - 30/09/2025 - Sesión 1)
```
ESTABILIDAD: inicio 09:33:44
GPS:         inicio 09:33:37  → |09:33:44 - 09:33:37| = 7s ≤ 300s ✅ 
ROTATIVO:    inicio 09:33:37  → |09:33:44 - 09:33:37| = 7s ≤ 300s ✅

Sesión correlacionada:
  startTime = 09:33:37 (el más temprano)
  endTime   = 10:38:25 (el más tardío)
  duration  = 1h 4m 48s
```

---

## 4. REGLAS DE VALIDACIÓN

### 4.1. Sesión válida vs. sesión incompleta

**REGLA 4.1.A - Sesión ✅ VÁLIDA (completa):**
```
✅ Tiene ESTABILIDAD
✅ Tiene GPS
✅ Tiene ROTATIVO
✅ Duración > 0 segundos
```

**REGLA 4.1.B - Sesión ⚠️ INCOMPLETA (pero guardable):**
```
✅ Tiene ESTABILIDAD
✅ Tiene ROTATIVO
❌ NO tiene GPS (común en túneles, zonas sin cobertura)
✅ Duración > 0 segundos
→ Se guarda con observación "sin gps"
```

**REGLA 4.1.C - Sesión ❌ INVÁLIDA (no guardar):**
```
❌ Falta ESTABILIDAD → RECHAZAR
❌ Falta ROTATIVO → RECHAZAR
❌ Duración = 0 → RECHAZAR
❌ Duración < umbral mínimo configurado → RECHAZAR (si está activado)
```

### 4.2. Validación de Foreign Keys

**REGLA 4.2:** ANTES de procesar archivos:
```typescript
1. Validar que existe organizationId en tabla Organization
2. Validar que existe userId en tabla User
3. Si vehicleId no existe:
   → Crearlo automáticamente con organizationId
4. Si falla alguna validación:
   → DETENER procesamiento
   → Retornar error claro
```

### 4.3. Prevención de duplicados

**REGLA 4.3:** Antes de guardar una sesión:
```typescript
1. Buscar sesión existente con:
   - Mismo vehicleId
   - Mismo startTime (±5 segundos)
   - Misma organizationId
2. Si existe:
   → NO guardar
   → Marcar como "Sesión ya existía"
   → Contabilizar como "omitida"
3. Si no existe:
   → Guardar en BD
   → Contabilizar como "creada"
```

---

## 5. PROCESO DE GUARDADO

### 5.1. Orden de operaciones

**REGLA 5.1 - Secuencia OBLIGATORIA:**
```typescript
1. Validar Foreign Keys (Organization, User)
2. Obtener o crear Vehicle
3. Verificar duplicado
4. Si NO es duplicado:
   4.1. Crear registro Session en BD
   4.2. Guardar mediciones ESTABILIDAD (si existen)
   4.3. Guardar mediciones GPS (si existen)
   4.4. Guardar mediciones ROTATIVO (si existen)
5. Retornar sessionId + created (boolean)
```

### 5.2. Parseo y filtrado de mediciones

**REGLA 5.2.A - Parseo COMPLETO del archivo:**
```typescript
// ❌ INCORRECTO: Parsear solo rango de sesión
const content = buffer.slice(session.startByte, session.endByte);

// ✅ CORRECTO: Parsear archivo completo, luego filtrar
const allMediciones = parseEstabilidadRobust(fullBuffer, baseDate);
const medicionesSesion = allMediciones.filter(m => 
  m.timestamp >= session.startTime && 
  m.timestamp <= session.endTime
);
```

**REGLA 5.2.B - Guardado en BD:**
```typescript
// Guardar en batch, no 1 por 1
await prisma.stabilityMeasurement.createMany({
  data: medicionesSesion.map(m => ({
    sessionId,
    timestamp: m.timestamp,
    ...m.data
  }))
});
```

### 5.3. Gestión de transacciones

**REGLA 5.3:** NO usar transacciones para operaciones masivas:
```typescript
// ❌ INCORRECTO: Transacción por cada sesión
await prisma.$transaction(async (tx) => {
  // guardar sesión + mediciones
});

// ✅ CORRECTO: Operaciones individuales con manejo de errores
try {
  const session = await prisma.session.create({...});
  await prisma.stabilityMeasurement.createMany({...});
  // ...
} catch (error) {
  logger.error('Error guardando sesión:', error);
  // Continuar con siguiente sesión
}
```

---

## 6. CASOS ESPECIALES

### 6.1. Sesiones sin GPS
**REGLA 6.1:**
- ✅ Aceptar y guardar
- ⚠️ Añadir observación "sin gps"
- ⚠️ Marcar como incompleta pero válida
- 📊 Incluir en reportes con indicador visual

### 6.2. Sesiones muy cortas (< 2 minutos)
**REGLA 6.2:**
- ✅ Aceptar si tienen ESTABILIDAD + ROTATIVO
- ⚠️ Pueden ser pruebas o arranques
- 📊 Incluir en reportes con duración real

### 6.3. Sesiones nocturnas (00:00 - 06:00)
**REGLA 6.3:**
- ✅ Totalmente válidas
- 🚒 Vehículos de emergencia operan 24/7
- 📅 Pueden aparecer en fecha D o D+1 según hora

### 6.4. Archivos con múltiples sesiones
**REGLA 6.4:**
- ✅ Normal y esperado
- 📊 Un archivo puede tener 1-10+ sesiones
- 🔢 Cada sesión se numera secuencialmente dentro del archivo

### 6.5. GPS con interpolación
**REGLA 6.5:**
- ✅ Usar interpolación lineal cuando faltan puntos
- 📊 Reportar cuántos puntos fueron interpolados
- ⚠️ No interpolar si gap > 5 minutos

### 6.6. Coordenadas GPS inválidas
**REGLA 6.6 - Niveles de validación:**
```typescript
Nivel 1: Rechazar (0, 0)
Nivel 2: Rechazar lat fuera de [-90, 90]
Nivel 3: Rechazar lon fuera de [-180, 180]
Nivel 4: Warning si fuera de España [36-44, -10-5]
Nivel 5: Warning si salto > 1km entre puntos
```

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

### Antes de procesar:
- [ ] ✅ Foreign Keys válidas (User, Organization)
- [ ] ✅ Directorio CMadrid existe
- [ ] ✅ Archivos tienen formato correcto

### Durante detección:
- [ ] ✅ Parsers robustos (RobustGPSParser, etc.)
- [ ] ✅ Gaps de 300s para nueva sesión
- [ ] ✅ Numeración secuencial por archivo

### Durante correlación:
- [ ] ✅ Umbral 300s (no 120s)
- [ ] ✅ ESTABILIDAD como ancla
- [ ] ✅ startTime = MIN, endTime = MAX

### Durante validación:
- [ ] ✅ ESTABILIDAD obligatorio
- [ ] ✅ ROTATIVO obligatorio  
- [ ] ✅ GPS opcional
- [ ] ✅ Duración > 0

### Durante guardado:
- [ ] ✅ Verificar duplicados
- [ ] ✅ Parseo completo + filtrado temporal
- [ ] ✅ createMany para mediciones
- [ ] ✅ Manejo de errores individual

### En reporte:
- [ ] ✅ Sesiones creadas vs. omitidas
- [ ] ✅ Razón de omisión clara
- [ ] ✅ Nombres de archivos asociados
- [ ] ✅ Duración y mediciones por sesión

---

## 📚 REFERENCIAS

- **Análisis real:** `resumendoback/Analisis_Sesiones_CMadrid_real.md`
- **Reglas de correlación:** `backend/src/services/upload/SessionCorrelationRules.ts`
- **Parsers robustos:** `backend/src/services/parsers/Robust*Parser.ts`
- **Validadores:** `backend/src/services/upload/validators/`
- **Detector:** `backend/src/services/upload/SessionDetectorV2.ts`
- **Correlador:** `backend/src/services/upload/TemporalCorrelator.ts`
- **Procesador:** `backend/src/services/upload/UnifiedFileProcessorV2.ts`

---

**Última actualización:** 2025-10-12
**Versión:** 1.0
**Estado:** ✅ DEFINIDO - PENDIENTE VALIDACIÓN

