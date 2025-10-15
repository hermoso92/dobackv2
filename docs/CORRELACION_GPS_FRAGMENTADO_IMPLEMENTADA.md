# 🔗 CORRELACIÓN GPS FRAGMENTADO - IMPLEMENTADA

**Fecha:** 2025-10-12  
**Objetivo:** Detectar las 85 sesiones del análisis real fusionando GPS fragmentado

---

## 🚨 PROBLEMA IDENTIFICADO

### Antes (Correlación Simple):
```
ESTABILIDAD: 7 sesiones detectadas
GPS:         2 sesiones detectadas (fragmentado por pérdida de señal)
ROTATIVO:    9 sesiones detectadas

Correlación: Solo 1-2 sesiones (GPS fragmentado no se correlaciona)
```

### Análisis del Problema:

**GPS se fragmenta por pérdida de señal:**
```
GPS Real:    09:00──09:15 [sin señal 8min] 09:23──10:00
Detector:    └ Sesión 1 ─┘                └ Sesión 2 ──┘

ESTABILIDAD: 09:00 ────────────────────────────── 10:00
             └─────────── Sesión 1 ─────────────────────┘

Correlación Antigua: Solo GPS Sesión 1 correlaciona
Correlación Nueva:   GPS Sesión 1 + GPS Sesión 2 = Fusionados
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Nueva Lógica en `TemporalCorrelator.ts`:

**Algoritmo de Fusión:**

```typescript
Para cada sesión ESTABILIDAD:
  1. Buscar TODOS los fragmentos GPS donde:
     - GPS.inicio está dentro de [EST.inicio -5min, EST.fin +5min]
     - O GPS.fin está dentro del rango
     - O GPS cubre completamente el rango ESTABILIDAD
  
  2. Fusionar todos los fragmentos GPS encontrados:
     - Inicio fusionado: MIN(todos los GPS.inicio)
     - Fin fusionado: MAX(todos los GPS.fin)
     - Mediciones: SUM(GPS.mediciones de cada fragmento)
  
  3. Marcar como sesión GPS virtual con metadata:
     - fusionedFragments: N (número de fragmentos fusionados)
  
  4. Correlacionar ESTABILIDAD con GPS fusionado
  
  5. Mismo proceso para ROTATIVO fragmentado
```

**Código Clave:**
```typescript
// ✅ Buscar TODOS los fragmentos GPS dentro de ESTABILIDAD
const gpsFragmentos: DetectedSession[] = [];

for (const gpsSession of gpsSessions) {
    const gpsStart = gpsSession.startTime.getTime();
    const gpsEnd = gpsSession.endTime.getTime();
    const estStart = estSession.startTime.getTime() - (300 * 1000); // -5min
    const estEnd = estSession.endTime.getTime() + (300 * 1000);     // +5min
    
    const gpsInsideEst = 
        (gpsStart >= estStart && gpsStart <= estEnd) ||  // Inicia dentro
        (gpsEnd >= estStart && gpsEnd <= estEnd) ||      // Termina dentro
        (gpsStart <= estStart && gpsEnd >= estEnd);      // Cubre todo

    if (gpsInsideEst) {
        gpsFragmentos.push(gpsSession);
    }
}

// Fusionar en una sola sesión GPS virtual
if (gpsFragmentos.length > 0) {
    gpsSession = {
        startTime: MIN(todos los fragmentos),
        endTime: MAX(todos los fragmentos),
        measurementCount: SUM(mediciones),
        metadata: { fusionedFragments: N }
    };
}
```

---

## 📈 RESULTADO ESPERADO

### Antes (Correlación Simple):
```
✅ Esperadas: 85 sesiones
❌ Detectadas: 44 sesiones (51.8%)
📉 Faltan: 41 sesiones
```

### Después (Correlación GPS Fragmentado):
```
✅ Esperadas: 85 sesiones
✅ Detectadas: ~78-85 sesiones (92-100%)
📈 Mejora: +34-41 sesiones
```

**Por vehículo:**
- DOBACK024: 12 → ~20-22 sesiones
- DOBACK027: 7 → ~20-23 sesiones
- DOBACK028: 5 → ~35-40 sesiones

---

## 🔍 CASOS DE USO

### Caso 1: GPS Fragmentado Simple
```
ESTABILIDAD: 09:00 ─────────────── 10:00
GPS:         09:00──09:15 [gap] 09:23──10:00
             └ Frag 1 ─┘        └ Frag 2 ──┘

Resultado: GPS fusionado = 09:00──10:00
```

### Caso 2: GPS con Múltiples Gaps (Túneles)
```
ESTABILIDAD: 10:00 ────────────────────────── 11:00
GPS:         10:00─10:10 [túnel] 10:20─10:30 [túnel] 10:40─11:00
             └ F1 ──┘            └ F2 ──┘            └ F3 ───┘

Resultado: 3 fragmentos fusionados en 1 sesión GPS
```

### Caso 3: GPS Parcial (solo al inicio)
```
ESTABILIDAD: 09:00 ─────────────── 10:00
GPS:         09:00──09:20 [sin señal resto]

Resultado: GPS 09:00-09:20 correlacionado con ESTABILIDAD completa
```

---

## ⚙️ PARÁMETROS DE FUSIÓN

**Tolerancia Temporal:**
- **-5 minutos antes** del inicio ESTABILIDAD
- **+5 minutos después** del fin ESTABILIDAD

**Razón:**
- GPS puede arrancar antes que ESTABILIDAD (vehículo ya en movimiento)
- GPS puede seguir después que ESTABILIDAD termina (guardado retrasado)

---

## 🔧 ARCHIVOS MODIFICADOS

- `backend/src/services/upload/TemporalCorrelator.ts`
  - Nueva lógica de fusión GPS (líneas 46-107)
  - Nueva lógica de fusión ROTATIVO (líneas 109-166)
  - Logging de fragmentos fusionados
- `backend/dist/services/upload/TemporalCorrelator.js` (recompilado)

---

## 🎯 PARA VERIFICAR

### 1. Procesar desde frontend:
```
http://localhost:5174/upload
→ Perfil "Testing"
→ Procesar
```

### 2. Ver logs del backend:
Buscar líneas como:
```
🔗 GPS fragmentado: 3 fragmentos fusionados para sesión 1
🔗 ROTATIVO fragmentado: 2 fragmentos fusionados para sesión 2
```

### 3. Verificar resultado:
```bash
node comparacion-final.js
```

Debería mostrar:
```
✅ Detectadas: ~78-85 sesiones (92-100%)
```

---

## 💡 VENTAJAS DE ESTA IMPLEMENTACIÓN

1. **✅ Más realista:** Refleja el comportamiento real del GPS (señal intermitente)
2. **✅ Más sesiones:** Captura sesiones que antes se rechazaban
3. **✅ Mantiene GPS obligatorio:** Solo acepta sesiones con al menos 1 fragmento GPS
4. **✅ Transparente:** Metadata indica cuántos fragmentos se fusionaron
5. **✅ Robusto:** Maneja casos edge (GPS antes/después de ESTABILIDAD)

---

## 📊 EJEMPLO REAL

**DOBACK028 - 08/10/2025:**

**Antes:**
```
EST: 7 sesiones → GPS: 2 sesiones → Solo 1-2 correlacionan
Resultado: 1-2 sesiones creadas
```

**Ahora:**
```
EST: 7 sesiones → GPS: 2 fragmentos → Fusionados por sesión EST
Resultado: 7 sesiones creadas (si cada EST tiene GPS dentro)
```

**Mejora:** +5-6 sesiones para este día

---

## ⚠️ NOTAS

1. **GPS Obligatorio se mantiene:** Si una sesión ESTABILIDAD no tiene ningún fragmento GPS dentro de su rango (+/- 5min), se rechaza.

2. **Metadata de fusión:** Cada sesión tiene `metadata.fusionedFragments` que indica si es fusión:
   - `1`: GPS continuo (no fragmentado)
   - `2+`: GPS fragmentado fusionado

3. **Logs informativos:** El backend logueará cada fusión para depuración.

---

## 🎉 ESTADO ACTUAL

- [x] Lógica de fusión GPS implementada
- [x] Lógica de fusión ROTATIVO implementada
- [x] Backend recompilado
- [x] BD limpia
- [ ] **Pendiente: Procesar desde frontend**
- [ ] **Pendiente: Verificar cobertura final**

---

**Ve al frontend, selecciona perfil "Testing" y procesa los archivos. La nueva lógica debería detectar ~78-85 sesiones en lugar de 44.**

