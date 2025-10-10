# 🔍 AUDITORÍA COMPLETA: SISTEMA DE SUBIDA DOBACKSOFT

## 📋 RESUMEN EJECUTIVO

Se han identificado **4 controladores de subida diferentes** compitiendo entre sí, lo que genera:
- ❌ Duplicación de código
- ❌ Inconsistencias en el procesamiento
- ❌ Mantenimiento complejo
- ❌ Bugs difíciles de rastrear

---

## 🔧 CONTROLADORES IDENTIFICADOS

### 1. **MassUploadController.ts**
**Ubicación:** `backend/src/controllers/MassUploadController.ts`

**Funcionalidad:**
- Subida masiva de múltiples archivos
- Parseo de CAN, GPS, ESTABILIDAD, ROTATIVO
- Uso de parsers helpers (`parseCANFile`, `parseGPSFile`, etc.)

**Problemas Detectados:**
- ❌ NO detecta sesiones múltiples en un archivo
- ❌ Asume un archivo = una sesión
- ❌ NO maneja "sin datos GPS"
- ❌ NO guarda estadísticas de calidad
- ❌ NO correlaciona GPS-ESTABILIDAD-ROTATIVO

**Veredicto:** ⚠️ Parcialmente funcional, necesita refactorización completa

---

### 2. **SessionsUploadController.ts**
**Ubicación:** `backend/src/controllers/SessionsUploadController.ts`

**Funcionalidad:**
- Subida de sesiones completas
- Usa parsers del fixed processor
- Logging detallado

**Problemas Detectados:**
- ❌ NO detecta sesiones múltiples
- ❌ Parsers no validan coordenadas (0,0)
- ❌ NO interpola timestamps de ESTABILIDAD
- ❌ Usa "Hora GPS" en lugar de "Hora Raspberry"
- ❌ NO guarda problemas detectados

**Veredicto:** ⚠️ Mejor que MassUpload pero incompleto

---

### 3. **upload.ts**
**Ubicación:** `backend/src/routes/upload.ts`

**Funcionalidad:**
- Endpoint `/api/upload`
- Subida de archivo individual
- Parseo por tipo de archivo

**Problemas Detectados:**
- ❌ Código duplicado con SessionsUploadController
- ❌ NO detecta sesiones múltiples
- ❌ NO valida calidad de datos
- ❌ Solo registra archivo, no guarda estadísticas

**Veredicto:** ⚠️ Básico, sin validaciones robustas

---

### 4. **upload-simple.ts**
**Ubicación:** `backend/src/routes/upload-simple.ts`

**Funcionalidad:**
- Parseo simple de archivos
- Extracción de metadatos

**Problemas Detectados:**
- ❌ **NO GUARDA NADA EN BD** (solo parsea)
- ❌ Solo retorna información del archivo
- ❌ Es un placeholder sin funcionalidad real

**Veredicto:** ❌ Inútil, debe ser reemplazado

---

### 5. **upload-server.js** (Servidor Legacy)
**Ubicación:** `backend/upload-server.js`

**Funcionalidad:**
- Servidor Express separado
- Puerto 9999
- Endpoints /api/upload y /api/upload/mass

**Problemas Detectados:**
- ❌ Servidor completamente SEPARADO del backend principal
- ❌ NO usa Prisma (SQL directo)
- ❌ Código desactualizado
- ❌ Duplica funcionalidad

**Veredicto:** ❌ Debe ser DEPRECADO completamente

---

## 🐛 PROBLEMAS CRÍTICOS IDENTIFICADOS

### Problema 1: Sesiones Múltiples NO Detectadas
```
Archivo: ESTABILIDAD_DOBACK024_20251008.txt

ESTABILIDAD;08/10/2025 04:43:40;DOBACK024;Sesión:1;
...datos...
ESTABILIDAD;08/10/2025 12:15:30;DOBACK024;Sesión:2;
...datos...

❌ SISTEMA ACTUAL: Crea 1 sesión con TODOS los datos mezclados
✅ SISTEMA CORRECTO: Debe crear 2 sesiones separadas
```

### Problema 2: GPS "sin datos GPS" NO Manejado
```
Archivo: GPS_DOBACK024_20251008.txt

Hora Raspberry-04:43:30,08/10/2025,Hora GPS-04:43:30,sin datos GPS
Hora Raspberry-04:43:31,08/10/2025,Hora GPS-04:43:31,sin datos GPS
(8000+ líneas)

❌ SISTEMA ACTUAL: Falla o ignora todas las líneas
✅ SISTEMA CORRECTO: Debe validar y reportar % de datos válidos
```

### Problema 3: Timestamps ESTABILIDAD NO Interpolados
```
Archivo: ESTABILIDAD_DOBACK024_20251008.txt

-59.78;  14.15; 1014.19; ...  ← Sin timestamp
-57.83;  16.59; 1011.62; ...  ← Sin timestamp
04:43:41                      ← Marcador temporal
-58.07;  14.03; 1010.28; ...  ← Sin timestamp

❌ SISTEMA ACTUAL: Timestamp incorrecto o nulo
✅ SISTEMA CORRECTO: Interpolar basándose en frecuencia 10 Hz
```

### Problema 4: Hora GPS vs Hora Raspberry
```
GPS File:
Hora Raspberry: 03:26:04
Hora GPS:       01:26:04  ← 2 horas de diferencia (UTC)

❌ SISTEMA ACTUAL: Usa Hora GPS (incorrecta)
✅ SISTEMA CORRECTO: SIEMPRE usar Hora Raspberry
```

### Problema 5: Sin Correlación GPS-ESTABILIDAD-ROTATIVO
```
❌ SISTEMA ACTUAL:
- GPS se procesa independiente
- ESTABILIDAD se procesa independiente
- ROTATIVO se procesa independiente
- NO se correlacionan

✅ SISTEMA CORRECTO:
- Eventos de ESTABILIDAD DEBEN tener coordenadas GPS
- Puntos GPS DEBEN tener estado ROTATIVO
- Todo correlacionado por timestamp
```

### Problema 6: Sin Estadísticas de Calidad
```
❌ SISTEMA ACTUAL:
- No sabe cuántas líneas son válidas
- No detecta datos corruptos
- No reporta problemas

✅ SISTEMA CORRECTO:
- Guardar % de datos válidos
- Listar problemas detectados
- Alertar si calidad < 80%
```

---

## 📊 ESTADÍSTICAS DE CÓDIGO

| Controlador | Líneas | Duplicación | Funcional | Veredicto |
|-------------|---------|-------------|-----------|-----------|
| MassUploadController | ~400 | 70% | Parcial | Refactorizar |
| SessionsUploadController | ~600 | 60% | Parcial | Refactorizar |
| upload.ts | ~400 | 80% | Básico | Deprecar |
| upload-simple.ts | ~200 | 50% | No | Eliminar |
| upload-server.js | ~500 | 100% | Legacy | Eliminar |
| **TOTAL** | **~2100** | **72%** | **Bajo** | **Consolidar** |

---

## 🎯 RECOMENDACIONES

### 1. CONSOLIDAR TODO EN UN SOLO PROCESADOR
- ✅ Crear `UnifiedFileProcessor.ts`
- ✅ Un endpoint único `/api/upload/unified`
- ✅ Deprecar todos los controladores antiguos

### 2. IMPLEMENTAR VALIDACIONES ROBUSTAS
- ✅ Detección de sesiones múltiples
- ✅ Validación de GPS (manejo de "sin datos GPS")
- ✅ Interpolación de timestamps
- ✅ Corrección de zona horaria

### 3. CORRELACIÓN AUTOMÁTICA
- ✅ GPS ↔ ROTATIVO (estado en cada punto)
- ✅ ESTABILIDAD ↔ GPS (ubicación de eventos)
- ✅ Todo guardado de forma correlacionada

### 4. ESTADÍSTICAS DE CALIDAD
- ✅ Nueva tabla `DataQualityMetrics`
- ✅ Reportar problemas detectados
- ✅ Alertar si calidad < 80%

---

## 📋 PLAN DE MIGRACIÓN

### Fase 1: Crear Sistema Nuevo
1. Implementar `UnifiedFileProcessor.ts`
2. Crear parsers robustos
3. Crear endpoint `/api/upload/unified`
4. Testing exhaustivo

### Fase 2: Migrar Gradualmente
1. Frontend usa nuevo endpoint
2. Mantener endpoints viejos temporalmente
3. Migrar datos existentes (opcional)

### Fase 3: Deprecar Sistema Viejo
1. Eliminar `upload-server.js`
2. Eliminar `upload-simple.ts`
3. Marcar como deprecated `MassUploadController`
4. Consolidar en `UnifiedFileProcessor`

---

## ✅ CONCLUSIONES

**El sistema actual de subida es fragmentado, inconsistente y no maneja correctamente:**
- ❌ Sesiones múltiples
- ❌ GPS sin señal
- ❌ Timestamps en ESTABILIDAD
- ❌ Correlación de datos
- ❌ Calidad de datos

**Se requiere una refactorización completa hacia un sistema unificado y robusto.**

---

**Próximo paso:** Implementar `UnifiedFileProcessor.ts` con todas las validaciones y funcionalidades descritas en el plan.

