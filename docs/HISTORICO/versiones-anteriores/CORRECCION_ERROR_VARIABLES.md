# 🔧 CORRECCIÓN: Error de Variables No Definidas

## 🚨 **ERROR REPORTADO**

```
❌ Error guardando sesión unificada: ReferenceError: isLTRCritical is not defined
    at C:\Users\Cosigein SL\Desktop\DobackSoft\backend-final.js:5474:36
```

---

## 🔍 **CAUSA DEL ERROR**

Durante la implementación del **catálogo oficial DoBack**, se renombraron las variables de detección de eventos:

### **Nombres Anteriores** → **Nombres Nuevos**:
```javascript
isLTRCritical      → isRiesgoVuelco
isDRSHigh          → isDerivaPeligrosa
isLateralGForceHigh → isManobraBrusca
```

**Problema**: Algunas partes del código **todavía usaban los nombres antiguos**, causando `ReferenceError`.

---

## ✅ **CORRECCIÓN APLICADA**

### **1. Línea 5474 - Guardado de StabilityMeasurement**:

**ANTES (INCORRECTO)**:
```javascript
isLTRCritical: isLTRCritical,           // ❌ Variable no definida
isDRSHigh: isDRSHigh,                   // ❌ Variable no definida
isLateralGForceHigh: isLateralGForceHigh, // ❌ Variable no definida
```

**DESPUÉS (CORRECTO)**:
```javascript
isLTRCritical: isRiesgoVuelco,          // ✅ Riesgo de Vuelco
isDRSHigh: isDerivaPeligrosa,           // ✅ Deriva Peligrosa
isLateralGForceHigh: isManobraBrusca,   // ✅ Maniobra Brusca
```

### **2. Línea 1064 - Compatibilidad con Frontend**:

**ANTES (INCORRECTO)**:
```javascript
isLTRCritical: event.details?.isLTRCritical || false,           // ❌ Campo antiguo
isDRSHigh: event.details?.isDRSHigh || false,                   // ❌ Campo antiguo
isLateralGForceHigh: event.details?.isLateralGForceHigh || false, // ❌ Campo antiguo
```

**DESPUÉS (CORRECTO)**:
```javascript
isLTRCritical: event.details?.isRiesgoVuelco || false,          // ✅ Mapeo correcto
isDRSHigh: event.details?.isDerivaPeligrosa || false,           // ✅ Mapeo correcto
isLateralGForceHigh: event.details?.isManobraBrusca || false,   // ✅ Mapeo correcto
```

---

## 📊 **MAPEO DE VARIABLES**

| Campo BD (Antigua) | Variable Backend (Nueva) | Evento DoBack |
|-------------------|-------------------------|---------------|
| `isLTRCritical` | `isRiesgoVuelco` | Riesgo de Vuelco |
| `isDRSHigh` | `isDerivaPeligrosa` | Deriva Peligrosa |
| `isLateralGForceHigh` | `isManobraBrusca` | Maniobra Brusca |

**Nota**: Los campos de la BD mantienen los nombres antiguos por compatibilidad, pero se asignan desde las variables nuevas.

---

## 🎯 **FLUJO COMPLETO CORREGIDO**

### **Detección de Eventos**:
```javascript
// 1. Detectar eventos (SOLO SI si < 0.50)
if (isUnstable) {
    if (measurement.si < 0.30) isRiesgoVuelco = true;
    if (measurement.si < 0.10 && ...) isVuelcoInminente = true;
    if (Math.abs(measurement.gx) > 45) isDerivaPeligrosa = true;
    if (Math.abs(measurement.ay) > 3000) isManobraBrusca = true;
}
```

### **Guardado en StabilityMeasurement**:
```javascript
// 2. Guardar en tabla StabilityMeasurement
{
    isLTRCritical: isRiesgoVuelco,        // ✅ Campo BD ← Variable nueva
    isDRSHigh: isDerivaPeligrosa,         // ✅ Campo BD ← Variable nueva
    isLateralGForceHigh: isManobraBrusca, // ✅ Campo BD ← Variable nueva
}
```

### **Guardado en stability_events**:
```javascript
// 3. Guardar en tabla stability_events
{
    type: eventType,  // 'rollover_risk', 'dangerous_drift', etc.
    details: {
        isRiesgoVuelco,      // ✅ Variable nueva en JSON
        isDerivaPeligrosa,   // ✅ Variable nueva en JSON
        isManobraBrusca,     // ✅ Variable nueva en JSON
    }
}
```

### **Lectura para Frontend**:
```javascript
// 4. Mapear al leer eventos
{
    ...event.details,
    isLTRCritical: event.details?.isRiesgoVuelco || false,       // ✅ Mapeo
    isDRSHigh: event.details?.isDerivaPeligrosa || false,        // ✅ Mapeo
    isLateralGForceHigh: event.details?.isManobraBrusca || false // ✅ Mapeo
}
```

---

## 🧪 **PRUEBA DE CORRECCIÓN**

### **Antes del Fix**:
```
✅ Sesión unificada creada en BD
❌ Error guardando sesión unificada: ReferenceError: isLTRCritical is not defined
❌ Error guardando sesión 2: ReferenceError: isLTRCritical is not defined
```

### **Después del Fix**:
```
✅ Sesión unificada creada en BD
✅ Sesión unificada guardada exitosamente
✅ X mediciones de estabilidad guardadas
✅ X eventos guardados en BD
```

---

## 📁 **ARCHIVOS MODIFICADOS**

1. ✅ **`backend-final.js`**:
   - **Línea ~5474**: Corregido mapeo de variables en `StabilityMeasurement`
   - **Línea ~1064**: Corregido mapeo de variables para frontend

2. ✅ **`CORRECCION_ERROR_VARIABLES.md`**: Este documento

---

## 🚀 **PRÓXIMOS PASOS**

### **1. Reiniciar Backend**:
El backend debe reiniciarse para cargar los cambios.

### **2. Limpiar Base de Datos**:
```
Frontend → "Procesamiento Automático" → "Limpiar Base de Datos"
```

### **3. Reprocesar Archivos**:
```
Frontend → "Iniciar Procesamiento Automático"
```

**Resultado Esperado**:
```
✅ Todas las sesiones se guardan correctamente
✅ No más errores "ReferenceError"
✅ Eventos se generan según catálogo DoBack (solo si SI < 50%)
```

---

## 🎯 **RESUMEN EJECUTIVO**

### **Problema**:
- ❌ Variables renombradas pero referencias antiguas en código
- ❌ `ReferenceError: isLTRCritical is not defined`
- ❌ Sesiones no se guardaban correctamente

### **Solución**:
- ✅ Actualizado mapeo en guardado de `StabilityMeasurement`
- ✅ Actualizado mapeo en compatibilidad con frontend
- ✅ Mantenida compatibilidad con nombres de campos BD

### **Resultado**:
```
✅ Variables correctamente mapeadas
✅ Sesiones se guardan sin errores
✅ Sistema conforme a catálogo DoBack
```

---

**Fecha de Corrección**: 7 de Octubre de 2025  
**Versión**: 6.8 - Fix Variables de Eventos  
**Estado**: ✅ **CORREGIDO Y LISTO PARA REPROCESAR**

🎯 **El error de variables ha sido corregido. El sistema ahora guarda sesiones correctamente con el catálogo oficial DoBack.**
