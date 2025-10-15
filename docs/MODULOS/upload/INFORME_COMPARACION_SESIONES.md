# 📊 INFORME DE COMPARACIÓN - SESIONES GENERADAS VS ANÁLISIS REAL

**Fecha:** 2025-10-11 21:05  
**Basado en:** `resumendoback/Analisis_Sesiones_CMadrid_real.md`  
**Estado:** ANÁLISIS COMPLETO

---

## 🚨 PROBLEMA IDENTIFICADO

El sistema actual **NO está correlacionando correctamente** las sesiones entre tipos de archivos.

---

## 📊 DOBACK024 30/09/2025 - COMPARACIÓN

### **✅ SEGÚN ANÁLISIS REAL (CORRECTO):**

```
Sesión #1: 09:33:37 - 10:38:25 (1h 4m 48s)
├─ ✅ ESTABILIDAD: 09:33:44 - 10:38:20 (id 1, 6,467 mediciones estimadas)
├─ ✅ GPS: 09:33:37 - 09:57:27 (id 1, 1,430 mediciones estimadas)
└─ ✅ ROTATIVO: 09:33:37 - 10:38:25 (id 1, 261 mediciones estimadas)

Sesión #2: 12:41:43 - 14:05:48 (1h 24m 5s)
├─ ✅ ESTABILIDAD: 12:41:48 - 14:05:45 (id 2, 8,397 mediciones estimadas)
├─ ❌ GPS: sin registro (0 mediciones)
└─ ✅ ROTATIVO: 12:41:43 - 14:05:48 (id 2, 336 mediciones estimadas)

TOTAL ESPERADO: 2 sesiones unificadas
```

---

### **❌ LO QUE EL SISTEMA GENERÓ (INCORRECTO):**

```
ESTABILIDAD (archivo procesado por separado):
├─ Sesión #2: 17:34:04 - 19:16:11 (6,127 mediciones)
└─ Sesión #3: 19:01:18 - 19:42:25 (2,467 mediciones)

GPS (archivo procesado por separado):
├─ Sesión #1: 11:35:13 - 11:42:03 (410 mediciones)
├─ Sesión #3: 17:33:44 - 17:43:06 (562 mediciones)
└─ Sesión #4: 19:01:07 - 19:04:53 (226 mediciones)

ROTATIVO (archivo procesado por separado):
├─ Sesión #11: 17:37:47 - 17:38:14 (27 mediciones)
└─ Sesión #12: 19:01:07 - 19:01:25 (18 mediciones)

PROBLEMAS:
❌ Números no coinciden (#2,#3 vs #1,#3,#4 vs #11,#12)
❌ Horas no coinciden (17:34 vs 09:33 del análisis)
❌ Se crearon sesiones separadas sin correlación
❌ Mismo vehículo tiene múltiples sesiones con mismos números
```

---

## 🔍 POR QUÉ ESTÁ PASANDO ESTO

### **Código Actual (Problemático):**

```typescript
// backend/src/routes/upload.ts línea ~976-1016
for (const type of ['estabilidad', 'gps', 'rotativo']) {
    const files = fs.readdirSync(typePath);
    
    for (const file of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // ❌ Procesa cada tipo POR SEPARADO
        let sessions = [];
        if (type === 'estabilidad') {
            sessions = parseStabilityFile(content);
        } else if (type === 'gps') {
            sessions = parseGpsFile(content);
        } else if (type === 'rotativo') {
            sessions = parseRotativoFile(content);
        }
        
        // ❌ Guarda cada sesión individualmente
        for (const session of sessions) {
            await saveSession(session, vehicleId, userId, org);
        }
    }
}

// RESULTADO: Sesiones NO correlacionadas
// - ESTABILIDAD guarda sus sesiones con sus números
// - GPS guarda sus sesiones con sus números
// - ROTATIVO guarda sus sesiones con sus números
// → NO HAY CORRELACIÓN ENTRE TIPOS
```

---

### **Código Correcto (UnifiedFileProcessor):**

```typescript
// backend/src/services/UnifiedFileProcessor.ts línea ~124-281
async procesarGrupoArchivos(grupo, organizationId, userId) {
    // 1. Detectar sesiones en cada tipo
    const sesionesEstabilidad = grupo.archivos.estabilidad
        ? detectarSesionesMultiples(grupo.archivos.estabilidad, 'ESTABILIDAD')
        : [];
    
    const sesionesGPS = grupo.archivos.gps
        ? detectarSesionesMultiples(grupo.archivos.gps, 'GPS')
        : [];
    
    const sesionesRotativo = grupo.archivos.rotativo
        ? detectarSesionesMultiples(grupo.archivos.rotativo, 'ROTATIVO')
        : [];
    
    // 2. Tomar el máximo
    const numSesiones = Math.max(
        sesionesEstabilidad.length,
        sesionesGPS.length,
        sesionesRotativo.length
    );
    
    // 3. Para CADA sesión correlacionada
    for (let i = 0; i < numSesiones; i++) {
        const sesionEst = sesionesEstabilidad[i];
        const sesionGPS = sesionesGPS[i];
        const sesionRot = sesionesRotativo[i];
        
        // 4. Parsear datos de ESTA sesión específica
        const gpsData = sesionGPS ? parseGPS(sesionGPS) : null;
        const estData = sesionEst ? parseEstabilidad(sesionEst) : null;
        const rotData = sesionRot ? parseRotativo(sesionRot) : null;
        
        // 5. Crear UNA sesión unificada
        const sessionId = await this.crearSesionEnBD({
            vehicleId,
            sessionNumber: i + 1,  // ✅ Numeración unificada
            startTime: min(estData?.start, gpsData?.start, rotData?.start),
            endTime: max(estData?.end, gpsData?.end, rotData?.end)
        });
        
        // 6. Guardar mediciones de los 3 tipos en ESA sesión
        if (gpsData) await this.guardarGPS(sessionId, gpsData);
        if (estData) await this.guardarEstabilidad(sessionId, estData);
        if (rotData) await this.guardarRotativo(sessionId, rotData);
    }
}

// RESULTADO: Sesiones CORRELACIONADAS
// - Sesión #1 tiene ESTABILIDAD + GPS + ROTATIVO
// - Sesión #2 tiene ESTABILIDAD + ROTATIVO (sin GPS)
// → CORRELACIÓN CORRECTA ✅
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

He creado:

1. ✅ **`SessionVerificationService.ts`** - Servicio para verificar y correlacionar
2. ✅ **`sessionVerification.ts`** - Endpoints de verificación
3. ✅ **`verificar-sesiones-generadas.ps1`** - Script SQL de verificación
4. ✅ **Este documento** - Explicación del problema

---

## 🚀 PRÓXIMO PASO

**Necesito modificar** `backend/src/routes/upload.ts` endpoint `process-all-cmadrid` para:

1. Leer todos los archivos de un vehículo/fecha
2. Agruparlos (ESTABILIDAD + GPS + ROTATIVO del mismo día)
3. Llamar a `unifiedFileProcessor.procesarArchivos()`
4. Devolver resultado correlacionado

**¿Quieres que implemente esta corrección ahora?**

Esto hará que el reporte muestre:
```
✅ DOBACK024 30/09/2025:
   Sesión #1: 09:33-10:38 (ESTABILIDAD + GPS + ROTATIVO)
   Sesión #2: 12:41-14:05 (ESTABILIDAD + ROTATIVO, sin GPS)
   
   TOTAL: 2 sesiones (como en el análisis real)
```

---

## 📋 VERIFICACIÓN ACTUAL

**Ejecuta ahora:**
```powershell
.\verificar-sesiones-generadas.ps1 -Vehicle "DOBACK024" -Date "2025-09-30"
```

Esto te mostrará cuántas sesiones se crearon en BD y de qué tipo.

---

**Estado:** PROBLEMA IDENTIFICADO Y DOCUMENTADO  
**Solución:** Lista para implementar  

**Última actualización:** 2025-10-11 21:05

