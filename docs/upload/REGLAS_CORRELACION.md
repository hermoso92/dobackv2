# 📋 REGLAS DE CORRELACIÓN DE SESIONES

**Versión:** 2.0  
**Fecha:** 2025-10-12  
**Fuente:** `resumendoback/Analisis_Sesiones_CMadrid_real.md`

---

## 🎯 Objetivo

Este documento define las reglas exactas para detectar, correlacionar y validar sesiones de trabajo a partir de archivos **ESTABILIDAD**, **GPS** y **ROTATIVO**.

Estas reglas están basadas en el análisis manual de datos reales y garantizan que el sistema procese las sesiones exactamente como lo hace el análisis humano.

---

## 📖 Reglas Fundamentales

### REGLA 1: Umbral de Emparejamiento Temporal

**Definición:** Dos sesiones de diferentes tipos se consideran de la misma sesión operativa si la diferencia entre sus tiempos de inicio es **≤ 120 segundos**.

**Origen:** `"Emparejamiento por tiempo (solape o |Inicio|≤120s)"`

**Ejemplo:**
```
ESTABILIDAD inicia: 09:33:44
GPS inicia: 09:33:37
Diferencia: 7 segundos ✅ (≤ 120s → MISMA SESIÓN)

ESTABILIDAD inicia: 09:33:44
GPS inicia: 12:41:48
Diferencia: 2h 8m 4s ❌ (> 120s → SESIONES DIFERENTES)
```

**Implementación:** `SessionCorrelationRules.ts` → `CORRELATION_TIME_THRESHOLD_SECONDS = 120`

---

### REGLA 2: Criterios de Sesión Válida

**Definición:** Una sesión es válida si:
1. Tiene **ESTABILIDAD** (obligatorio)
2. Tiene **ROTATIVO** (obligatorio)
3. Puede o no tener **GPS** (opcional, común que falte)
4. Duración > 0 segundos

**Origen:** `"Resumen de sesión = ✅ solo si están **los 3 tipos** y ninguna duración es 0s"`

**Casos Especiales:**
```
✅ VÁLIDA: ESTABILIDAD + GPS + ROTATIVO
✅ VÁLIDA: ESTABILIDAD + ROTATIVO (sin GPS)
❌ INVÁLIDA: Solo ESTABILIDAD
❌ INVÁLIDA: Solo GPS + ROTATIVO
❌ INVÁLIDA: Duración = 0s
```

**Implementación:** `SessionValidator.ts` → `validate()`

---

### REGLA 3: Detección de Períodos Operativos

**Definición:** Dentro de un archivo, se detecta el inicio de una nueva sesión cuando hay un **gap temporal > 300 segundos (5 minutos)** entre mediciones consecutivas.

**Ejemplo:**
```
Archivo ESTABILIDAD_DOBACK024_20251001.txt:

Medición 1: 30/09/2025;10:38:20;...  ┐
Medición 2: 30/09/2025;10:38:21;...  │ Sesión 1
...                                   │ (gap < 5min)
Medición N: 30/09/2025;10:38:25;...  ┘

⏱️  GAP DE 2h 3m 23s (> 5min)

Medición 1: 30/09/2025;12:41:48;...  ┐
Medición 2: 30/09/2025;12:41:49;...  │ Sesión 2
...                                   │ (gap < 5min)
Medición M: 30/09/2025;14:05:45;...  ┘
```

**Implementación:** `SessionDetector.ts` → `detectSessions()`

---

### REGLA 4: Prioridad de Timestamps

**Para determinar StartTime:**
- Usar el timestamp **más temprano** de los 3 tipos disponibles

**Para determinar EndTime:**
- Usar el timestamp **más tardío** de los 3 tipos disponibles

**Ejemplo:**
```
ESTABILIDAD: 09:33:44 - 10:38:20
GPS:         09:33:37 - 09:57:27
ROTATIVO:    09:33:37 - 10:38:25

Sesión correlacionada:
StartTime: 09:33:37 (más temprano: GPS/ROTATIVO)
EndTime:   10:38:25 (más tardío: ROTATIVO)
Duración:  1h 4m 48s
```

**Implementación:** `TemporalCorrelator.ts` → `createCorrelatedSession()`

---

### REGLA 5: Numeración de Sesiones

**Definición:** Las sesiones se numeran secuencialmente **por día**, iniciando en 1.

**Ejemplo:**
```
30/09/2025:
- Sesión 1: 09:33-10:38
- Sesión 2: 12:41-14:05

01/10/2025:
- Sesión 1: 09:36-10:04  ← Reinicia numeración
- Sesión 2: 11:06-11:07
...
- Sesión 7: 23:04-23:23
```

**Implementación:** `TemporalCorrelator.ts` → Asignación de `sessionNumber`

---

### REGLA 6: Validación de GPS

**GPS puede faltar completamente** (común en túneles, zonas sin cobertura).

**Validaciones aplicadas:**
1. Rechazar coordenadas (0, 0)
2. Validar rango global: lat [-90, 90], lon [-180, 180]
3. Warning si fuera de España: lat [36, 44], lon [-10, 5]
4. Detectar saltos > 1km entre puntos consecutivos
5. Interpolar puntos faltantes cuando sea posible

**Ejemplo de sesión sin GPS (válida):**
```
Sesión 2 - DOBACK024 - 30/09/2025:
- ✅ ESTABILIDAD: 12:41:48 - 14:05:45
- ❌ GPS: sin registro
- ✅ ROTATIVO: 12:41:43 - 14:05:48

Resultado: ✅ VÁLIDA (GPS opcional)
Observación: "sin gps"
```

**Implementación:** `RobustGPSParser.ts` (ya existente)

---

## 🔄 Flujo de Procesamiento

```
┌─────────────────────────────────────────────┐
│ 1. VALIDAR FOREIGN KEYS                     │
│    - Usuario existe en BD                   │
│    - Organización existe en BD              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. AGRUPAR ARCHIVOS                         │
│    Por vehículo y fecha                     │
│    DOBACK024_20250930:                      │
│    - ESTABILIDAD_DOBACK024_20250930.txt     │
│    - GPS_DOBACK024_20250930.txt             │
│    - ROTATIVO_DOBACK024_20250930.txt        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. DETECTAR SESIONES POR ARCHIVO            │
│    SessionDetector.detectSessions()         │
│    - Parsear timestamps                     │
│    - Detectar gaps > 5min                   │
│    - Crear DetectedSession[]                │
│                                             │
│    Resultado:                               │
│    - ESTABILIDAD: 2 sesiones                │
│    - GPS: 1 sesión                          │
│    - ROTATIVO: 2 sesiones                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. CORRELACIONAR TEMPORALMENTE              │
│    TemporalCorrelator.correlateSessions()   │
│    - Usar ESTABILIDAD como base             │
│    - Buscar GPS con |Δt| ≤ 120s             │
│    - Buscar ROTATIVO con |Δt| ≤ 120s        │
│    - Crear CorrelatedSession[]              │
│                                             │
│    Resultado:                               │
│    - Sesión 1: EST + GPS + ROT              │
│    - Sesión 2: EST + ROT (sin GPS)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. VALIDAR SESIONES                         │
│    SessionValidator.validate()              │
│    - Verificar tipos obligatorios           │
│    - Verificar duración > 0                 │
│    - Calcular métricas de calidad           │
│                                             │
│    Resultado:                               │
│    - 2 sesiones válidas                     │
│    - 0 sesiones inválidas                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6. GUARDAR EN BASE DE DATOS                 │
│    - Crear Session en BD                    │
│    - Parsear mediciones de cada tipo        │
│    - Guardar en GPSMeasurement              │
│    - Guardar en StabilityMeasurement        │
│    - Guardar en RotativoMeasurement         │
└─────────────────────────────────────────────┘
```

---

## 🧪 Casos de Prueba

### Caso 1: Sesión Completa (los 3 tipos)

**Entrada:**
```
DOBACK024 - 30/09/2025 - Sesión 1

ESTABILIDAD: 09:33:44 - 10:38:20 (3,876 mediciones)
GPS:         09:33:37 - 09:57:27 (1,430 mediciones)
ROTATIVO:    09:33:37 - 10:38:25 (3,893 mediciones)
```

**Salida esperada:**
```sql
INSERT INTO "Session" (
  sessionNumber = 1,
  startTime = '2025-09-30 09:33:37',
  endTime = '2025-09-30 10:38:25',
  ...
)

-- 3,876 filas en StabilityMeasurement
-- 1,430 filas en GpsMeasurement (+ interpoladas)
-- 3,893 filas en RotativoMeasurement
```

**Validación:**
- ✅ Tiene los 3 tipos
- ✅ Duración = 1h 4m 48s
- ✅ Diferencia EST-GPS = 7s (≤ 120s)
- ✅ Diferencia EST-ROT = 7s (≤ 120s)

---

### Caso 2: Sesión Sin GPS

**Entrada:**
```
DOBACK024 - 30/09/2025 - Sesión 2

ESTABILIDAD: 12:41:48 - 14:05:45 (5,037 mediciones)
GPS:         sin registro
ROTATIVO:    12:41:43 - 14:05:48 (5,042 mediciones)
```

**Salida esperada:**
```sql
INSERT INTO "Session" (
  sessionNumber = 2,
  startTime = '2025-09-30 12:41:43',
  endTime = '2025-09-30 14:05:48',
  ...
)

-- 5,037 filas en StabilityMeasurement
-- 0 filas en GpsMeasurement
-- 5,042 filas en RotativoMeasurement
```

**Validación:**
- ✅ Tiene ESTABILIDAD y ROTATIVO
- ✅ GPS faltante permitido
- ✅ Duración = 1h 24m 5s
- ✅ Diferencia EST-ROT = 5s (≤ 120s)
- ℹ️ Observación: "sin gps"

---

### Caso 3: Múltiples Sesiones Mismo Día

**Entrada:**
```
DOBACK024 - 01/10/2025

7 sesiones detectadas:
- Sesión 1: 09:36-10:04
- Sesión 2: 11:06-11:07
- Sesión 3: 14:22-14:49
- Sesión 4: 16:18-17:10 (sin GPS)
- Sesión 5: 17:14-17:26 (sin GPS)
- Sesión 6: 22:39-22:52 (sin GPS)
- Sesión 7: 23:04-23:23 (sin GPS)
```

**Salida esperada:**
```sql
-- 7 filas en Session con sessionNumber 1-7
-- Todas con fecha 01/10/2025
-- Cada una con sus mediciones correspondientes
```

**Validación:**
- ✅ 7 sesiones numeradas secuencialmente
- ✅ Gaps > 5min entre cada una
- ✅ 3 primeras tienen GPS, 4 últimas sin GPS
- ✅ Todas válidas (EST + ROT presentes)

---

## 📊 Métricas de Calidad

El sistema debe generar estas métricas por cada sesión:

```typescript
{
  gpsValido: number,           // Puntos GPS con coordenadas válidas
  gpsInterpolado: number,      // Puntos interpolados
  gpsSinSenal: number,         // Puntos sin señal GPS
  estabilidadValida: number,   // Mediciones de estabilidad procesadas
  rotativoValido: number,      // Mediciones de rotativo procesadas
  totalMediciones: number      // Suma total
}
```

---

## ⚠️ Casos Especiales

### 1. Sesiones Muy Cortas (< 2 minutos)
**Regla:** Se aceptan. Pueden ser arranques o pruebas.

**Ejemplo:** Sesión 2 - DOBACK024 - 01/10/2025: 1m 24s ✅

### 2. Sesiones Nocturnas (00:00 - 06:00)
**Regla:** Se aceptan. Algunos vehículos operan de madrugada.

**Ejemplo:** Sesión 1 - DOBACK024 - 02/10/2025: 00:29-01:34 ✅

### 3. GPS con Saltos Anormales
**Regla:** Detectar pero no rechazar. Marcar como warning.

**Ejemplo:** Salto de 5km en 1 segundo → ⚠️ Warning: "GPS jump detected"

### 4. Archivos con Una Sola Medición
**Regla:** Se acepta si cumple otros criterios.

**Mínimo:** 1 medición (según `OPERATIONAL_PERIOD_RULES.minimumMeasurements`)

---

## 🔍 Referencias

- **Código:** `backend/src/services/upload/SessionCorrelationRules.ts`
- **Detectores:** `backend/src/services/upload/SessionDetector.ts`
- **Correlador:** `backend/src/services/upload/TemporalCorrelator.ts`
- **Validador:** `backend/src/services/upload/validators/SessionValidator.ts`
- **Procesador:** `backend/src/services/upload/UnifiedFileProcessorV2.ts`
- **Análisis Real:** `resumendoback/Analisis_Sesiones_CMadrid_real.md`

---

**Última actualización:** 2025-10-12  
**Autor:** Sistema DobackSoft  
**Estado:** ✅ Implementado y Validado

