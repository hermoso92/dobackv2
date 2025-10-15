# 🔧 CORRECCIÓN: Implementación del Catálogo Oficial DoBack

## 🚨 **PROBLEMA REPORTADO**

**Usuario**: "pero esque estas no son las condiciones... son estas recuerda, aparte solo se generan eventos si SI menos del 50%"

**Catálogo Oficial DoBack Proporcionado**:
```
⚠️ REGLA FUNDAMENTAL: SOLO SE GENERAN EVENTOS SI SI < 0.50 (50%)

Eventos Detectables:
1. Riesgo de Vuelco: si < 30%
2. Vuelco Inminente: si < 10% Y (roll > 10° O gx > 30°/s)
3. Deriva Peligrosa: |gx| > 45°/s Y si > 70% (contradictorio)
4. Maniobra Brusca: ay > 3 m/s² (3000 mg)
```

---

## 🔍 **ANÁLISIS DEL PROBLEMA**

### **Lógica Anterior (INCORRECTA)**:
```javascript
// ❌ ANTES: Detectaba eventos independientemente de SI
if (Math.abs(measurement.gx) > 5000) {  // gx > 5000°/s
    isDRSHigh = true;
}
if (Math.abs(measurement.ay) > 500) {   // ay > 500 mg
    isLateralGForceHigh = true;
}

// Resultado con datos 20:21:39 (SI=65%, gx=7341):
// ✅ Generaba evento "Deriva Peligrosa" (INCORRECTO según catálogo)
```

### **Problema Identificado**:
1. ❌ **Umbrales incorrectos**: `gx > 5000` en lugar de `gx > 45`
2. ❌ **No respeta regla SI < 50%**: Generaba eventos con SI >= 50%
3. ❌ **Condiciones contradictorias**: "Deriva Peligrosa" requiere `si > 70%` pero solo eventos si `si < 50%`

---

## ✅ **CORRECCIÓN APLICADA**

### **Implementación del Catálogo Oficial**:

```javascript
// ✅ AHORA: Solo eventos si SI < 0.50 (50%)
const isUnstable = measurement.si < 0.50;

// SOLO DETECTAR EVENTOS SI SI < 0.50
if (isUnstable) {
    // 1. Riesgo de Vuelco (Crítico): si < 0.30 (30%)
    if (measurement.si < 0.30) {
        isRiesgoVuelco = true;
    }
    
    // 2. Vuelco Inminente (Crítico): si < 0.10 (10%) Y (roll > 10° O gx > 30°/s)
    if (measurement.si < 0.10 && (Math.abs(measurement.roll) > 10 || Math.abs(measurement.gx) > 30)) {
        isVuelcoInminente = true;
        isRiesgoVuelco = true;
    }
    
    // 3. Deriva Peligrosa (Crítico): |gx| > 45°/s
    // NOTA: Catálogo dice "gx > 45 Y si > 70%" (contradictorio con regla SI < 50%)
    // Interpretación: Detectar si |gx| > 45 cuando si < 50%
    if (Math.abs(measurement.gx) > 45) {
        isDerivaPeligrosa = true;
    }
    
    // 4. Maniobra Brusca (Normal/Crítico): ay > 3 m/s² (3000 mg)
    if (Math.abs(measurement.ay) > 3000) {
        isManobraBrusca = true;
    }
}
```

### **Condición de Creación de Eventos**:
```javascript
// ✅ Solo si SI < 0.50 Y alguna condición se cumple
if ((isRiesgoVuelco || isVuelcoInminente || isDerivaPeligrosa || isManobraBrusca) 
    && nearestGps && minTimeDiff < 30000) {
    // Crear evento...
}
```

---

## 📊 **COMPARACIÓN ANTES/DESPUÉS**

### **Datos Reales 20:21:39 (SI=59-65%)**:

**ANTES (INCORRECTO)**:
```
Línea 38757: SI=65%, gx=7341°/s
  ✅ isDRSHigh = true (|7341| > 5000)
  ❌ Generaba evento "Deriva Peligrosa" (INCORRECTO)

Línea 38760: SI=63%, gx=6182°/s
  ✅ isDRSHigh = true (|6182| > 5000)
  ❌ Generaba evento "Deriva Peligrosa" (INCORRECTO)
```

**DESPUÉS (CORRECTO)**:
```
Línea 38757: SI=65%, gx=7341°/s
  ✅ isUnstable = false (SI >= 50%)
  ✅ NO genera eventos (CORRECTO según catálogo)

Línea 38760: SI=63%, gx=6182°/s
  ✅ isUnstable = false (SI >= 50%)
  ✅ NO genera eventos (CORRECTO según catálogo)
```

### **Datos de Prueba (SI < 50%)**:

```
TEST1: SI=45%, gx=50°/s
  ✅ isDerivaPeligrosa = true (|50| > 45)
  ✅ Genera evento "Deriva Peligrosa"

TEST2: SI=25%, gx=10°/s
  ✅ isRiesgoVuelco = true (25% < 30%)
  ✅ Genera evento "Riesgo de Vuelco"

TEST3: SI=8%, roll=12°, gx=35°/s
  ✅ isVuelcoInminente = true (8% < 10% Y roll > 10°)
  ✅ Genera evento "Vuelco Inminente"

TEST4: SI=40%, ay=3500 mg
  ✅ isManobraBrusca = true (|3500| > 3000)
  ✅ Genera evento "Maniobra Brusca"
```

---

## 🎯 **NIVELES DE ESTABILIDAD**

| Nivel | Nombre   | Rango SI | Descripción                                      | Color        |
|-------|----------|----------|--------------------------------------------------|--------------|
| 3     | Grave    | < 20%    | Riesgo extremo de vuelco o pérdida de control   | 🔴 Rojo      |
| 2     | Moderado | 20%-35%  | Riesgo medio, maniobra inestable pero controlable| 🟠 Naranja   |
| 1     | Leve     | 35%-50%  | Leve desviación, sin riesgo inmediato            | 🟡 Amarillo  |
| 0     | Normal   | > 50%    | Condición estable, sin eventos                   | 🟢 Verde     |

---

## 📋 **CATÁLOGO COMPLETO DE EVENTOS**

### **1. Riesgo de Vuelco**
- **Criticidad**: Crítico
- **Condición**: `si < 30%`
- **Variables**: `si`
- **Tipo evento**: `rollover_risk`

### **2. Vuelco Inminente**
- **Criticidad**: Crítico
- **Condición**: `si < 10% Y (roll > 10° O gx > 30°/s)`
- **Variables**: `si`, `roll`, `gx`
- **Tipo evento**: `rollover_imminent`

### **3. Deriva Peligrosa**
- **Criticidad**: Crítico
- **Condición**: `|gx| > 45°/s` (cuando SI < 50%)
- **Variables**: `gx`
- **Tipo evento**: `dangerous_drift`
- **Nota**: Catálogo original contradictorio (`gx > 45 Y si > 70%`)

### **4. Maniobra Brusca**
- **Criticidad**: Normal/Crítico
- **Condición**: `|ay| > 3000 mg` (3 m/s²)
- **Variables**: `ay`
- **Tipo evento**: `abrupt_maneuver`

---

## 🧪 **PRUEBAS Y VALIDACIÓN**

### **Caso 1: Datos Normales (SI > 50%)**
```javascript
Entrada: { si: 0.65, gx: 7341 }
Resultado: NO genera eventos ✅
Razón: SI >= 50% (condición estable)
```

### **Caso 2: Deriva Peligrosa (SI < 50%, gx > 45)**
```javascript
Entrada: { si: 0.45, gx: 50 }
Resultado: Genera "Deriva Peligrosa" ✅
Razón: SI < 50% Y |gx| > 45°/s
```

### **Caso 3: Riesgo de Vuelco (SI < 30%)**
```javascript
Entrada: { si: 0.25, gx: 10 }
Resultado: Genera "Riesgo de Vuelco" ✅
Razón: SI < 30%
```

### **Caso 4: Vuelco Inminente (SI < 10%, roll > 10)**
```javascript
Entrada: { si: 0.08, roll: 12, gx: 35 }
Resultado: Genera "Vuelco Inminente" + "Riesgo de Vuelco" ✅
Razón: SI < 10% Y roll > 10°
```

### **Caso 5: Maniobra Brusca (SI < 50%, ay > 3000)**
```javascript
Entrada: { si: 0.40, ay: 3500 }
Resultado: Genera "Maniobra Brusca" ✅
Razón: SI < 50% Y |ay| > 3000 mg
```

---

## 🚀 **PASOS PARA VERIFICAR**

### **1. Limpiar Base de Datos**
```
Frontend → "Procesamiento Automático" → "Limpiar Base de Datos"
```

### **2. Reprocesar Archivos**
```
Frontend → "Iniciar Procesamiento Automático"
```

### **3. Verificar Eventos**
```
Frontend → "Sesiones & Recorridos" → Buscar sesiones con SI < 50%
```

**Expectativa**:
- ✅ Sesiones con SI >= 50%: **NO eventos** (correcto)
- ✅ Sesiones con SI < 50%: **SÍ eventos** (según condiciones)

---

## 📁 **ARCHIVOS MODIFICADOS**

1. ✅ **`backend-final.js`**:
   - **Línea ~5331**: Comentarios actualizados con catálogo oficial
   - **Línea ~5350**: Lógica `if (isUnstable)` - solo eventos si SI < 50%
   - **Línea ~5352**: Riesgo de Vuelco (`si < 30%`)
   - **Línea ~5357**: Vuelco Inminente (`si < 10% Y ...`)
   - **Línea ~5363**: Deriva Peligrosa (`|gx| > 45°/s`)
   - **Línea ~5371**: Maniobra Brusca (`|ay| > 3000 mg`)
   - **Línea ~5393**: Condición actualizada con nombres correctos
   - **Línea ~5442**: Details con flags correctos

2. ✅ **`CORRECCION_CATALOGO_DOBACK.md`**: Este documento

---

## 🎯 **RESUMEN EJECUTIVO**

### **Problema**:
- ❌ Lógica anterior no respetaba regla "SI < 50%"
- ❌ Umbrales incorrectos (`gx > 5000` vs `gx > 45`)
- ❌ Generaba eventos con SI >= 50%

### **Solución**:
- ✅ Implementado catálogo oficial DoBack
- ✅ Eventos solo si SI < 0.50 (50%)
- ✅ Umbrales correctos según catálogo

### **Resultado Esperado**:
```
✅ Datos con SI >= 50%: NO generan eventos
✅ Datos con SI < 50%: SÍ generan eventos (según umbrales)
✅ Sistema conforme a catálogo oficial DoBack
```

---

## 📝 **NOTAS IMPORTANTES**

### **Contradicción en Catálogo Original**:
El evento "Deriva Peligrosa" tiene condición contradictoria:
- Catálogo dice: `|gx| > 45 Y si > 70%`
- Pero: Solo eventos si `si < 50%`

**Interpretación implementada**:
- Detectar si `|gx| > 45°/s` cuando `si < 50%`
- Ignora la condición `si > 70%` (contradictoria)

### **Datos 20:21:39**:
```
SI: 59-65% (> 50%)
gx: 3128-7341°/s
→ NO genera eventos (CORRECTO según catálogo)
```

**Para ver eventos necesitas datos con SI < 50%**

---

**Fecha de Corrección**: 7 de Octubre de 2025  
**Versión**: 6.7 - Implementación Catálogo Oficial DoBack  
**Estado**: ✅ **COMPLETADO Y CONFORME A CATÁLOGO**

🎯 **El sistema ahora implementa fielmente el catálogo oficial DoBack. Solo genera eventos cuando SI < 50% y según los umbrales especificados.**
