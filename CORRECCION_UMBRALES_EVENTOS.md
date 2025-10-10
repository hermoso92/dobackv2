# 🔧 CORRECCIÓN CRÍTICA: Umbrales de Eventos y Display de SI

## 🚨 PROBLEMAS DETECTADOS

### **1. Display Incorrecto de SI en Frontend**
**Problema**: El valor `si` se muestra como "0.6%" cuando debería ser "60%"

**Ejemplo del usuario**:
```
Archivo: si = 0.60 (columna 15) → 60% de estabilidad
Frontend muestra: "Índice Estabilidad: 0.6%"
Frontend debería mostrar: "Índice Estabilidad: 60.0%"
```

**Causa**: El frontend muestra `event.si.toFixed(1)%` sin multiplicar por 100

**Solución**: ✅ **APLICADA**
```typescript
// Antes:
popupContent += `<p><strong>Índice Estabilidad:</strong> ${event.si.toFixed(1)}%</p>`;

// Después:
popupContent += `<p><strong>Índice Estabilidad:</strong> ${(event.si * 100).toFixed(1)}%</p>`;
```

---

### **2. Umbrales de gx Completamente Incorrectos**
**Problema**: Se detectan eventos de "Deriva Peligrosa" cuando NO debería

**Datos del Archivo (DOBACK024 - 20:23:35)**:
```
si = 0.62 (62%) → ESTABLE
gx = -2389.27°/s
ay = -90.40 mg
```

**Lógica Actual INCORRECTA**:
```javascript
// 3. Deriva Peligrosa (Crítico): |gx| > 45°/s
if (Math.abs(measurement.gx) > 45) {
    isDRSHigh = true;
}
```

**Por qué está mal**:
- El umbral de `gx > 45°/s` es **ridículamente bajo**
- Valores normales en los archivos: **500 - 7000°/s**
- Con `si = 0.62` (62% estable), **NO debería generar ningún evento**

---

### **3. Umbrales de ay También Incorrectos**
**Lógica Actual**:
```javascript
// 4. Maniobra Brusca: |ay| > 300 mg
if (Math.abs(measurement.ay) > 300) {
    isLateralGForceHigh = true;
}
```

**Datos del Archivo**:
- Valores típicos de `ay`: **-300 a +300 mg** (rango normal)
- El umbral de 300 mg es el **máximo del rango**, no un umbral de evento

---

## ✅ SOLUCIÓN COMPLETA

### **Corrección 1: Lógica de Eventos Basada SOLO en SI**

**Regla Principal**: Si `si >= 0.60` (60%+ estable), **NO generar ningún evento**, sin importar `gx` o `ay`.

```javascript
// CORRECCIÓN: NO evaluar gx/ay si si >= 0.60
if (isStable) {
    // Conducción estable: NO eventos
    // Incluso si gx o ay son altos, si el vehículo está estable, no es peligroso
} else if (isCorrect) {
    // Conducción correcta: solo evento informativo
    isCorrectDriving = true;
} else if (isUnstable) {
    // Conducción inestable: evaluar eventos críticos
    
    // Riesgo de Vuelco: si < 0.30 (30%)
    if (measurement.si < 0.30) {
        isLTRCritical = true;
    }
    
    // Vuelco Inminente: si < 0.10 (10%) Y condiciones críticas
    if (measurement.si < 0.10 && (Math.abs(measurement.roll) > 10 || Math.abs(measurement.gx) > 5000)) {
        isVuelcoInminente = true;
        isLTRCritical = true;
    }
    
    // Deriva Peligrosa: si < 0.50 Y |gx| > 5000°/s
    if (Math.abs(measurement.gx) > 5000) {
        isDRSHigh = true;
    }
    
    // Maniobra Brusca: si < 0.50 Y |ay| > 500 mg
    if (Math.abs(measurement.ay) > 500) {
        isLateralGForceHigh = true;
    }
}
```

---

### **Corrección 2: Umbrales Ajustados a la Realidad**

| Parámetro | Umbral Anterior | Umbral Correcto | Rango Típico en Archivos |
|-----------|----------------|-----------------|--------------------------|
| **SI estable** | N/A | **>= 0.60** | 0.55 - 1.60 |
| **SI correcta** | N/A | **0.50 - 0.59** | 0.50 - 0.59 |
| **SI inestable** | **< 0.50** | **< 0.50** | < 0.50 |
| **gx deriva** | ~~> 45°/s~~ | **> 5000°/s** | 500 - 7000°/s |
| **ay maniobra** | ~~> 300 mg~~ | **> 500 mg** | -400 a +400 mg |
| **roll crítico** | > 10° | **> 15°** | -5° a +5° |

---

### **Corrección 3: Prioridad de SI sobre Todo**

**Filosofía del Sistema DoBack**:
1. **SI es el indicador principal** de estabilidad del vehículo
2. Si `si >= 0.60` → Vehículo **estable**, aunque haga giros rápidos
3. Si `si < 0.50` → Vehículo **inestable**, evaluar eventos críticos
4. `gx`, `ay`, `roll` son **indicadores secundarios** que solo importan cuando `si` es bajo

---

## 🔧 CAMBIOS A IMPLEMENTAR

### **Archivo: `backend-final.js`**

```javascript
// Línea ~5259-5267: Actualizar umbrales

// 3. Deriva Peligrosa (Crítico): |gx| > 5000°/s
if (Math.abs(measurement.gx) > 5000) {
    isDRSHigh = true;
}

// 4. Maniobra Brusca / Fuerza Lateral Alta (Alto): |ay| > 500 mg
if (Math.abs(measurement.ay) > 500) {
    isLateralGForceHigh = true;
}
```

---

## 📊 RESULTADOS ESPERADOS

### **Antes de la Corrección**:
```
DOBACK024 - 20:23:35
si = 0.62 (62% estable)
gx = -2389.27°/s
→ Genera evento: "Deriva Peligrosa" ❌ INCORRECTO
→ Muestra: "Índice Estabilidad: 0.6%" ❌ INCORRECTO
```

### **Después de la Corrección**:
```
DOBACK024 - 20:23:35
si = 0.62 (62% estable)
gx = -2389.27°/s
→ NO genera evento (si >= 0.60) ✅ CORRECTO
→ Muestra: "Índice Estabilidad: 62.0%" ✅ CORRECTO
```

---

## 🎯 VALIDACIÓN

Para validar la corrección:

1. **Procesar archivos** de nuevo
2. **Verificar eventos** en sesiones con `si >= 0.60`
3. **Confirmar** que NO se generan eventos en condiciones estables
4. **Verificar** que solo sesiones con `si < 0.60` generan eventos

---

**Fecha**: 7 de Octubre de 2025  
**Estado**: 🔄 **CORRECCIÓN EN PROCESO**  
**Prioridad**: 🚨 **CRÍTICA**

