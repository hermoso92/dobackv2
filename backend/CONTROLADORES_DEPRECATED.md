# ⚠️ CONTROLADORES DEPRECATED - NO USAR

**Fecha de depreciación:** 2025-10-10  
**Razón:** Sistema unificado implementado con mejoras

---

## ❌ CONTROLADORES ANTIGUOS (DEPRECATED)

### 1. Upload Controllers Antiguos

#### `src/controllers/UploadController.ts`
**Deprecado en favor de:** `UnifiedFileProcessor.ts`

**Problemas:**
- No detecta sesiones múltiples
- No valida calidad de datos
- No interpola GPS
- No guarda métricas

**Usar ahora:**
```
POST /api/upload-unified/unified
```

---

#### `src/controllers/upload_validation.ts`
**Deprecado en favor de:** Parsers robustos individuales

**Problemas:**
- Validación básica
- No maneja formato dual GPS
- No interpola timestamps ESTABILIDAD

**Usar ahora:**
- `RobustGPSParser.ts`
- `RobustStabilityParser.ts`
- `RobustRotativoParser.ts`

---

#### `src/routes/upload.ts`
**Deprecado parcialmente**

**Usar para:** Uploads simples sin procesamiento
**NO usar para:** Procesamiento multi-sesión

**Usar ahora:**
```
POST /api/upload-unified/unified
```

---

#### `src/routes/upload-simple.ts`
**Deprecado en favor de:** `upload-unified.ts`

**Problemas:**
- Solo parsea, no guarda
- No detecta sesiones
- No valida calidad

---

### 2. Event Detection Antiguo

#### `src/services/eventDetector.ts`
**Deprecado en favor de:** `EventDetectorWithGPS.ts`

**Problemas:**
- No guarda eventos en BD
- No correlaciona con GPS
- Umbrales incorrectos (generaba 784K eventos falsos)

**Usar ahora:**
```typescript
import { eventDetectorWithGPS } from './services/EventDetectorWithGPS';

const resultado = await eventDetectorWithGPS.detectarYGuardarEventos(sessionId);
// Guarda automáticamente en stability_events con GPS
```

---

### 3. Key Calculator Antiguo

#### `src/services/keyCalculator.ts`
**Mantener para cálculos básicos**
**Usar además:** `OperationalKeyCalculator.ts` para claves reales

**keyCalculator.ts:**
- ✅ Calcular tiempos por clave (básico)
- ✅ Formateo de tiempos

**OperationalKeyCalculator.ts:**
- ✅ Detectar claves reales con geocercas
- ✅ Guardar en BD
- ✅ Integración Radar.com

---

## ✅ SISTEMA NUEVO (USAR ESTE)

### Endpoints API Unificados:

```
📤 SUBIDA:
POST /api/upload-unified/unified
  → Detecta sesiones múltiples
  → Valida calidad
  → Interpola GPS
  → Guarda métricas

📊 KPIs:
GET /api/kpis/summary
  → Incluye operationalKeys, events, quality

⚠️  EVENTOS:
GET /api/hotspots/critical-points
  → Eventos con GPS desde BD
GET /api/hotspots/ranking
  → Top sesiones por eventos

🔑 CLAVES:
GET /api/operational-keys/:sessionId
GET /api/operational-keys/summary
GET /api/operational-keys/timeline

🚗 VELOCIDAD:
GET /api/speed/critical-zones
  → Con límites TomTom
```

---

### Servicios Nuevos:

```typescript
// Subida y procesamiento
import { unifiedFileProcessor } from './services/UnifiedFileProcessor';

// Correlación
import { dataCorrelationService } from './services/DataCorrelationService';
import { temporalCorrelationService } from './services/TemporalCorrelationService';

// Eventos
import { eventDetectorWithGPS } from './services/EventDetectorWithGPS';

// Claves operacionales
import { operationalKeyCalculator } from './services/OperationalKeyCalculator';

// APIs externas
import { radarIntegration } from './services/radarIntegration';
import { tomtomSpeedService } from './services/TomTomSpeedLimitsService';
```

---

## 📋 PLAN DE MIGRACIÓN

### PASO 1: Actualizar Referencias (Inmediato)

En cualquier código que use los controladores antiguos:

```typescript
// ❌ ANTES:
import { UploadController } from './controllers/UploadController';
const resultado = await UploadController.procesarArchivo(file);

// ✅ AHORA:
import { unifiedFileProcessor } from './services/UnifiedFileProcessor';
const resultado = await unifiedFileProcessor.procesarArchivos([file], orgId, userId);
```

---

### PASO 2: Eliminar Rutas Antiguas (Opcional)

**Comentar en `src/routes/index.ts`:**

```typescript
// ❌ DEPRECATED:
// router.use('/upload', uploadRoutes); // Usar /upload-unified en su lugar
```

**Mantener por compatibilidad (por ahora):**
```typescript
// ✅ MANTENER (uploads simples):
router.use('/upload', uploadRoutes);

// ✅ NUEVO (sistema robusto):
router.use('/upload-unified', uploadUnifiedRoutes);
```

---

### PASO 3: Documentar en Código (Opcional)

Añadir comentarios de deprecación:

```typescript
/**
 * @deprecated Usar UnifiedFileProcessor en su lugar
 * Este controlador no detecta sesiones múltiples
 */
export class UploadController {
    // ...
}
```

---

## ⚠️ ARCHIVOS A NO MODIFICAR

**Estos controladores son antiguos pero NO tocar hasta validar que todo funciona:**

- `src/controllers/UploadController.ts`
- `src/controllers/upload_validation.ts`
- `src/routes/upload.ts`
- `src/routes/upload-simple.ts`

**Razón:** Pueden estar siendo usados por frontend actual

---

## ✅ ARCHIVOS NUEVOS (USAR ESTOS)

**Sistema de subida:**
- `src/services/UnifiedFileProcessor.ts` ⭐
- `src/services/parsers/RobustGPSParser.ts`
- `src/services/parsers/RobustStabilityParser.ts`
- `src/services/parsers/RobustRotativoParser.ts`
- `src/services/parsers/MultiSessionDetector.ts`
- `src/routes/upload-unified.ts`

**Eventos y correlación:**
- `src/services/EventDetectorWithGPS.ts` ⭐
- `src/services/DataCorrelationService.ts`
- `src/services/TemporalCorrelationService.ts`

**Claves operacionales:**
- `src/services/OperationalKeyCalculator.ts` ⭐
- `src/routes/operationalKeys.ts`

---

## 📊 COMPARATIVA

| Característica | Sistema Antiguo | Sistema Nuevo |
|----------------|----------------|---------------|
| **Sesiones múltiples** | ❌ No detecta | ✅ Detecta 1-62 |
| **Validación GPS** | ❌ Básica | ✅ Robusta (formato dual) |
| **Interpolación** | ❌ No | ✅ GPS + timestamps |
| **Métricas calidad** | ❌ No | ✅ Por sesión |
| **Eventos con GPS** | ❌ No | ✅ 60% con coordenadas |
| **Claves reales** | ❌ Estimadas | ✅ Con geocercas |
| **Performance** | ⚠️ Lento | ✅ 16K muestras/s |

---

## 🎯 RECOMENDACIÓN

**USAR EXCLUSIVAMENTE EL SISTEMA NUEVO** para nuevos desarrollos.

**Mantener el antiguo** solo para compatibilidad temporal hasta validar que todo el frontend usa el nuevo.

**Eliminar el antiguo** una vez confirmado que no se usa (FASE 9 del plan).

---

**Estado:** ⚠️ Deprecated pero no eliminado  
**Usar:** Sistema unificado (UnifiedFileProcessor + servicios nuevos)  
**Performance:** 10-20x más rápido

