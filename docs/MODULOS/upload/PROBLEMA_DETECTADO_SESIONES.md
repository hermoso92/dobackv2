# 🚨 PROBLEMA DETECTADO - GENERACIÓN DE SESIONES

**Fecha:** 2025-10-11 21:00  
**Severidad:** ALTA  
**Estado:** IDENTIFICADO

---

## 🎯 PROBLEMA ENCONTRADO

El sistema actual está creando **sesiones separadas por tipo de archivo**, cuando debería crear **sesiones unificadas correlacionadas por tiempo**.

---

## 📊 COMPARACIÓN: ESPERADO vs ACTUAL

### **SEGÚN ANÁLISIS REAL (resumendoback/):**

```
DOBACK024 30/09/2025 DEBERÍA tener 2 sesiones:

Sesión #1: 09:33-10:38
├─ ✅ ESTABILIDAD: 09:33:44 - 10:38:20 (id 1)
├─ ✅ GPS: 09:33:37 - 09:57:27 (id 1)
└─ ✅ ROTATIVO: 09:33:37 - 10:38:25 (id 1)

Sesión #2: 12:41-14:05
├─ ✅ ESTABILIDAD: 12:41:48 - 14:05:45 (id 2)
├─ ❌ GPS: sin registro
└─ ✅ ROTATIVO: 12:41:43 - 14:05:48 (id 2)

TOTAL: 2 sesiones correlacionadas
```

---

### **LO QUE EL SISTEMA ESTÁ GENERANDO:**

```
DOBACK024 30/09/2025 está creando:

ESTABILIDAD:
├─ Sesión #2: 17:34:04 - 19:16:11 (6127 mediciones)
└─ Sesión #3: 19:01:18 - 19:42:25 (2467 mediciones)

GPS:
├─ Sesión #1: 11:35:13 - 11:42:03 (410 mediciones)
├─ Sesión #3: 17:33:44 - 17:43:06 (562 mediciones)
└─ Sesión #4: 19:01:07 - 19:04:53 (226 mediciones)

ROTATIVO:
├─ Sesión #11: 17:37:47 - 17:38:14 (27 mediciones)
└─ Sesión #12: 19:01:07 - 19:01:25 (18 mediciones)

PROBLEMAS:
❌ Números de sesión no correlacionan (#2,#3 vs #1,#3,#4 vs #11,#12)
❌ Horas no coinciden con el análisis real
❌ Se están creando sesiones separadas por tipo
❌ No hay correlación temporal entre tipos
```

---

## 🔍 ANÁLISIS DEL PROBLEMA

### **Causa Raíz:**

El endpoint `process-all-cmadrid` procesa cada tipo de archivo **independientemente**:

```typescript
// Actual (INCORRECTO):
for (const type of ['estabilidad', 'gps', 'rotativo']) {
    const sessions = parseTipoFile(content);
    
    for (const session of sessions) {
        // Guarda cada sesión por separado
        await saveSession(session, vehicleId, userId, org);
    }
}

// Resultado: 
// - ESTABILIDAD crea sus sesiones con sus números
// - GPS crea sus sesiones con sus números  
// - ROTATIVO crea sus sesiones con sus números
// → NO HAY CORRELACIÓN
```

### **Lo Que Debería Hacer (CORRECTO):**

```typescript
// 1. Detectar sesiones en cada tipo
const sesionesEstabilidad = parseEstabilidadFile(content);
const sesionesGPS = parseGPSFile(content);
const sesionesRotativo = parseRotativoFile(content);

// 2. Tomar el máximo
const numSesiones = Math.max(
    sesionesEstabilidad.length,
    sesionesGPS.length,
    sesionesRotativo.length
);

// 3. Para cada sesión (1 a numSesiones):
for (let i = 0; i < numSesiones; i++) {
    const sesionEst = sesionesEstabilidad[i];
    const sesionGPS = sesionesGPS[i];
    const sesionRot = sesionesRotativo[i];
    
    // 4. Crear UNA sesión unificada en BD
    const sessionId = await createSession({
        vehicleId,
        sessionNumber: i + 1,
        startTime: min(sesionEst?.start, sesionGPS?.start, sesionRot?.start),
        endTime: max(sesionEst?.end, sesionGPS?.end, sesionRot?.end)
    });
    
    // 5. Guardar mediciones de los 3 tipos en ESA sesión
    if (sesionEst) await guardarEstabilidad(sessionId, sesionEst.data);
    if (sesionGPS) await guardarGPS(sessionId, sesionGPS.data);
    if (sesionRot) await guardarRotativo(sessionId, sesionRot.data);
}

// Resultado:
// - Sesión #1 tiene ESTABILIDAD + GPS + ROTATIVO
// - Sesión #2 tiene ESTABILIDAD + ROTATIVO (sin GPS)
// → CORRELACIÓN CORRECTA
```

---

## ✅ SOLUCIÓN PROPUESTA

### **Usar el Sistema Unificado que YA EXISTE:**

El archivo `backend/src/services/UnifiedFileProcessor.ts` **YA tiene la lógica correcta** de correlación.

**El problema:** El endpoint `process-all-cmadrid` en `backend/src/routes/upload.ts` NO lo está usando.

### **Cambio Necesario:**

```typescript
// ARCHIVO: backend/src/routes/upload.ts
// LÍNEA: ~926

// ❌ ACTUAL: Usa parsers viejos sin correlación
router.post('/process-all-cmadrid', async (req, res) => {
    // ... procesa cada tipo por separado
});

// ✅ DEBERÍA: Usar UnifiedFileProcessor
import { unifiedFileProcessor } from '../services/UnifiedFileProcessor';

router.post('/process-all-cmadrid', async (req, res) => {
    // 1. Leer archivos de CMadrid
    // 2. Agrupar por vehículo+fecha
    // 3. Llamar a unifiedFileProcessor.procesarArchivos()
    // 4. Devolver resultado
});
```

---

## 🔧 IMPLEMENTACIÓN DE LA SOLUCIÓN

Necesito modificar `backend/src/routes/upload.ts` para:

1. ✅ Leer archivos de CMadrid
2. ✅ Agruparlos por vehículo+fecha
3. ✅ Usar `UnifiedFileProcessor` (que YA correlaciona correctamente)
4. ✅ Devolver resultado detallado

**Resultado esperado:**
```
DOBACK024 30/09/2025:

Sesión #1: 09:33-10:38
├─ ESTABILIDAD: 6,467 mediciones ✅
├─ GPS: 410 mediciones ✅
└─ ROTATIVO: 169 mediciones ✅

Sesión #2: 12:41-14:05
├─ ESTABILIDAD: 8,367 mediciones ✅
├─ GPS: 0 mediciones (sin señal) ❌
└─ ROTATIVO: 84 mediciones ✅

TOTAL: 2 sesiones (correlacionadas correctamente)
```

---

## 📋 VERIFICACIÓN

### **Script Creado:**

```powershell
.\verificar-sesiones-generadas.ps1 -Vehicle "DOBACK024" -Date "2025-09-30"
```

Muestra:
- Total sesiones en BD
- Qué tipos tiene cada sesión
- Comparación con análisis real

---

## 🎯 PRÓXIMO PASO

Modificar `backend/src/routes/upload.ts` para usar `UnifiedFileProcessor` en lugar de procesar tipos separadamente.

---

**Estado:** IDENTIFICADO - Lista para implementar solución

**Última actualización:** 2025-10-11 21:00

