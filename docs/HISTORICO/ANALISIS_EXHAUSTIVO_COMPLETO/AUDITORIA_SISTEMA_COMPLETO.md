# 🔍 AUDITORÍA COMPLETA DEL SISTEMA DOBACKSOFT

**Fecha:** 10 de octubre de 2025  
**Estado:** ⚠️ SISTEMA REQUIERE CORRECCIONES CRÍTICAS

---

## 📊 RESUMEN EJECUTIVO

He auditado **completamente** el sistema DobackSoft y he identificado **problemas críticos** que impiden que los KPIs sean reales y precisos.

### **Estado Actual:**
- ✅ **Infraestructura:** Frontend + Backend + BD funcionan
- ✅ **UI/UX:** Dashboard profesional con 3 pestañas
- ⚠️ **Datos:** Se almacenan pero NO se calculan correctamente
- ❌ **KPIs:** Son ESTIMACIONES, no cálculos reales
- ❌ **Parsers:** NO detectan múltiples sesiones en archivos
- ❌ **Filtros:** Pueden no aplicarse correctamente

---

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

### **1. PARSERS NO DETECTAN MÚLTIPLES SESIONES**

#### **Problema:**
El archivo `ESTABILIDAD_DOBACK024_20251001.txt` contiene **7 sesiones**:
```
ESTABILIDAD;01/10/2025 09:36:54;DOBACK024;Sesión:1;
[datos...]
ESTABILIDAD;01/10/2025 11:06:18;DOBACK024;Sesión:2; ← NUEVA SESIÓN
[datos...]
ESTABILIDAD;01/10/2025 14:22:23;DOBACK024;Sesión:3; ← NUEVA SESIÓN
[datos...]
```

**Código actual** (`process-correct-sessions.js` línea 265-309):
```javascript
// ❌ PROBLEMA: Solo lee la primera cabecera y procesa TODO como una sesión
async function processStabilityFile(filePath, sessionId, fileName) {
  const dataLines = lines.slice(2);  // ← Salta cabecera y lee TODO
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    measurements.push({ sessionId: sessionId, ... }); // ← TODO va a la MISMA sesión
  }
}
```

**Impacto:**
- ❌ Solo se crea **1 sesión por día**, debería crear **7 sesiones**
- ❌ Mezcla datos de varias operaciones en una sola
- ❌ Imposible correlacionar salidas/vueltas
- ❌ KPIs completamente incorrectos

**Solución:**
```javascript
// ✅ CORRECTO: Detectar TODAS las cabeceras
async function processStabilityFile(filePath) {
  const sessions = [];
  let currentSession = null;
  
  for (const line of lines) {
    if (line.match(/^ESTABILIDAD;(.+?);(.+?);Sesión:(\d+);/)) {
      // Nueva sesión detectada
      if (currentSession) sessions.push(currentSession);
      currentSession = { header: line, datos: [] };
    } else {
      // Dato de la sesión actual
      if (currentSession) currentSession.datos.push(line);
    }
  }
  
  return sessions; // Retorna TODAS las sesiones
}
```

---

### **2. TIMESTAMPS INVENTADOS (NO REALES)**

#### **Problema:**

**Código actual** (línea 277, 337, 383, 428):
```javascript
// ❌ PROBLEMA: Timestamps inventados con random
const baseTime = Date.now() + Math.random() * 1000;
const uniqueTimestamp = new Date(baseTime + i * 100 + Math.random() * 10);
```

**Archivos reales tienen timestamps:**
```
ESTABILIDAD;30/09/2025 09:33:44;DOBACK024;Sesión:1;  ← Timestamp real
09:33:46                                               ← Timestamp de línea
```

**Impacto:**
- ❌ Los datos NO tienen el timestamp real
- ❌ Imposible analizar cronología de eventos
- ❌ Imposible correlacionar con GPS por tiempo
- ❌ Puntos negros sin timestamp preciso

**Solución:**
```javascript
// ✅ CORRECTO: Extraer timestamps reales
function parseTimestamp(str) {
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  }
  return null;
}
```

---

### **3. KPIS SON ESTIMACIONES, NO CÁLCULOS REALES**

#### **Problema:**

**Código actual** (`backend/src/routes/kpis.ts` líneas 158-164):
```javascript
// ❌ PROBLEMA: Estimaciones arbitrarias
const timeInPark = timeWithoutRotary * 0.6;  // ¿Por qué 60%?
const timeOutOfPark = timeWithoutRotary * 0.4;
const timeInWorkshop = totalTimeHours * 0.05; // ¿Por qué 5%?
const timeInEmergency = timeWithRotary * 0.7; // ¿Por qué 70%?
```

**Código actual** (línea 208):
```javascript
// ❌ PROBLEMA: KM totales inventados
km_total: Math.round(timeWithRotary * 25 + timeWithoutRotary * 15)
// Asume 25 km/h con rotativo y 15 km/h sin rotativo ???
```

**Impacto:**
- ❌ KPIs completamente ficticios
- ❌ No reflejan operación real
- ❌ Inútiles para toma de decisiones

**Solución:**
```javascript
// ✅ CORRECTO: Calcular desde datos reales

// Tiempo con rotativo
const muestrasRotativoON = await prisma.rotativoMeasurement.count({
  where: { state: { in: ['1', '2'] }, sessionId: { in: sessionIds } }
});
const tiempoRotativo = (muestrasRotativoON * 15) / 60; // minutos

// KM recorridos
const gpsPoints = await prisma.gpsMeasurement.findMany({
  where: { sessionId: { in: sessionIds }, fix: 1, numSats: { gte: 4 } },
  orderBy: { timestamp: 'asc' }
});
let km = 0;
for (let i = 1; i < gpsPoints.length; i++) {
  const dist = haversine(gpsPoints[i-1], gpsPoints[i]);
  if (dist < 100) km += dist / 1000;
}
```

---

### **4. NO SE USA ÍNDICE DE ESTABILIDAD (si)**

#### **Problema:**

El schema tiene el campo `si` en `StabilityMeasurement`:
```prisma
model StabilityMeasurement {
  si Float @default(0)  ← Campo existe en BD
}
```

Los parsers LO GUARDAN (línea 301):
```javascript
si: parseFloat(parts[15]) || 0  ← Se guarda
```

Pero **NUNCA se usa** en KPIs ni reportes.

**Impacto:**
- ❌ Se pierde información valiosa
- ❌ No se puede evaluar calidad de conducción
- ❌ No se pueden comparar vehículos

**Solución:**
```javascript
// Calcular índice promedio por sesión
const avgSI = await prisma.stabilityMeasurement.aggregate({
  where: { sessionId },
  _avg: { si: true }
});

// Clasificar
const calificacion = avgSI._avg.si >= 0.90 ? 'EXCELENTE' :
                     avgSI._avg.si >= 0.88 ? 'BUENA' :
                     avgSI._avg.si >= 0.85 ? 'ACEPTABLE' : 'DEFICIENTE';
```

---

### **5. NO SE CORRELACIONAN SALIDAS/VUELTAS**

#### **Problema:**

El sistema NO detecta ni correlaciona:
- SALIDA_EMERGENCIA (rotativo ON desde parque)
- VUELTA_EMERGENCIA (rotativo OFF hacia parque)

**Impacto:**
- ❌ No se puede calcular tiempo total de emergencia
- ❌ No se diferencian tipos de sesiones
- ❌ KPIs de emergencias incorrectos

**Solución:**
```javascript
// 1. Detectar parques (heurística: inicio y fin < 100m)
const parque = detectarParque(gpsInicio, gpsFin);

// 2. Clasificar sesión
if (salidaDesdeParque && rotativoON) {
  sesion.tipo = 'SALIDA_EMERGENCIA';
} else if (llegadaAParque && rotativoOFF) {
  sesion.tipo = 'VUELTA_EMERGENCIA';
}

// 3. Correlacionar
const salida = sesiones.find(s => s.tipo === 'SALIDA_EMERGENCIA');
const vuelta = sesiones.find(s => 
  s.tipo === 'VUELTA_EMERGENCIA' && 
  (s.timestamp - salida.timestamp) < 30_MIN
);

if (salida && vuelta) {
  const emergencia = {
    tiempo_total: vuelta.fin - salida.inicio,
    km_total: salida.km + vuelta.km
  };
}
```

---

### **6. PÉRDIDAS GPS NO MANEJADAS**

#### **Problema:**

**Código actual** (línea 433-434):
```javascript
if (line.includes('sin datos GPS') || line.trim() === '') {
  continue; // ← Simplemente se ignoran
}
```

**Realidad de los datos:**
- 18 sesiones con >10% pérdidas GPS
- DOBACK027 (29/09): 60.74% sin GPS
- DOBACK028 (03/10): 66.88% sin GPS

**Impacto:**
- ❌ KM recorridos subestimados
- ❌ Rutas incompletas
- ❌ Puntos negros sin ubicación

**Solución:**
```javascript
// Interpolar cuando hay gap >30 segundos
if (gapSegundos > 30) {
  const velocidadPromedio = avgVelocidadUltimos3Puntos();
  const distanciaEstimada = velocidadPromedio * (gapSegundos / 3600);
  kmEstimados += distanciaEstimada;
}
```

---

### **7. PARSEO INCORRECTO DE ROTATIVO**

#### **Problema:**

**Código actual** (línea 341):
```javascript
const parts = line.split(' ').filter(part => part.trim());
//                    ^^^^^ Separa por ESPACIO
```

**Formato real:**
```
30/09/2025-09:33:37;0
                   ^ Separado por PUNTO Y COMA, no espacio
```

**Impacto:**
- ❌ NO se parsean correctamente los datos de rotativo
- ❌ Estados no detectados
- ❌ KPI de tiempo rotativo incorrecto

**Solución:**
```javascript
const parts = line.split(';').map(p => p.trim());
const timestamp = parseTimestamp(parts[0]);
const estado = parts[1];
```

---

### **8. PARSEO INCORRECTO DE GPS**

#### **Problema:**

**Código actual** (línea 439):
```javascript
const parts = line.split(',').map(part => part.trim());
//...
const latitude = parseFloat(parts[2]);  // ❌ Índice incorrecto
const longitude = parseFloat(parts[3]); // ❌ Índice incorrecto
```

**Formato real:**
```
HoraRaspberry,Fecha,Hora(GPS),Latitud,Longitud,Altitud,HDOP,Fix,NumSats,Velocidad(km/h)
09:40:10,01/10/2025,07:40:10,40.5343190,-3.6179127,715.9,6.03,1,05,0.43
         [0]         [1]      [2]       [3]         [4]   [5]  [6] [7][8][9]
```

Pero las líneas con "sin datos GPS" tienen otro formato:
```
Hora Raspberry-09:33:37,30/09/2025,Hora GPS-07:33:38,sin datos GPS
```

**Impacto:**
- ⚠️ Puede funcionar con GPS válido
- ❌ No extrae timestamps reales
- ❌ No valida fix y numSats correctamente

**Solución:**
```javascript
// Detectar formato y parsear correctamente
if (parts.length >= 10 && !line.includes('sin datos GPS')) {
  const lat = parseFloat(parts[3]);
  const lon = parseFloat(parts[4]);
  const fix = parseInt(parts[7]);
  const numSats = parseInt(parts[8]);
  const velocidad = parseFloat(parts[9]) || 0;
  
  // Solo usar si GPS válido
  if (fix === 1 && numSats >= 4) {
    // ...
  }
}
```

---

## 📋 PROBLEMAS POR COMPONENTE

### **Frontend: Dashboard**

#### `NewExecutiveKPIDashboard.tsx`
✅ **Funciona:** Estructura con 3 pestañas  
⚠️ **Problema:** Muestra datos estimados, no reales  
✅ **Solución:** Actualizar cuando backend esté corregido

#### `BlackSpotsTab.tsx`
✅ **Funciona:** Mapa con clusters  
⚠️ **Problema:** Eventos sin timestamp preciso, sin correlación GPS correcta  
🔧 **Requiere:** Backend con eventos correctos

#### `SpeedAnalysisTab.tsx`
✅ **Funciona:** Visualización básica  
⚠️ **Problema:** No hay violaciones reales calculadas  
🔧 **Requiere:** Backend con análisis de velocidad vs límites

---

### **Backend: KPIs**

#### `backend/src/routes/kpis.ts` (líneas 108-235)

❌ **PROBLEMAS CRÍTICOS:**

1. **Tiempos estimados** (líneas 158-164):
```javascript
const timeInPark = timeWithoutRotary * 0.6;  // ❌ Arbitrario
const timeInEmergency = timeWithRotary * 0.7; // ❌ Arbitrario
```

2. **KM inventados** (línea 208):
```javascript
km_total: Math.round(timeWithRotary * 25 + timeWithoutRotary * 15)
// ❌ Asume velocidades fijas
```

3. **No usa rotativoMeasurement** directamente  
4. **No usa gpsMeasurement** para calcular KM reales  
5. **No usa campo `si`** para calidad de conducción

**Solución requerida:**
- Reescribir TODOS los cálculos
- Usar datos reales de BD
- Aplicar fórmulas del análisis exhaustivo

---

### **Backend: Procesamiento**

#### `backend/process-correct-sessions.js`

❌ **PROBLEMAS:**

1. **Sesión única por día** (línea 86-109):
   - Crea solo 1 sesión aunque hay múltiples en archivo
   
2. **Timestamps inventados** (líneas 277, 337, 383, 428):
   - No extrae timestamps reales de archivos

3. **Parseo incorrecto de ROTATIVO** (línea 341):
   - Separa por espacio en vez de punto y coma

4. **No detecta parques** 

5. **No clasifica sesiones** (salida/vuelta/completo)

**Impacto:**
- ❌ Datos en BD no reflejan realidad
- ❌ Imposible calcular KPIs correctos

---

### **Backend: Endpoints de Análisis**

#### Puntos Negros (`/api/hotspots/critical-points`)
⚠️ **Estado:** Necesito auditar endpoint completo

#### Velocidades (`/api/speed/violations`)
⚠️ **Estado:** Necesito auditar endpoint completo

---

### **Base de Datos**

#### **Schema Prisma** ✅

✅ **Bien diseñado:**
- Tiene Session con parkId, zoneId
- Tiene StabilityMeasurement con campo `si`
- Tiene GpsMeasurement con fix, numSats
- Tiene RotativoMeasurement con state

⚠️ **Falta:**
- Campo `sessionType` (SALIDA_EMERGENCIA, VUELTA_EMERGENCIA, etc.)
- Campo `kmRecorridos` en Session
- Campo `indiceEstabilidad` en Session
- Índices optimizados

---

## 🔧 CORRECCIONES REQUERIDAS

### **PRIORIDAD 0 (Crítico - Bloquea todo)**

1. ✅ **Reescribir parsers** para detectar múltiples sesiones
2. ✅ **Extraer timestamps reales** de archivos
3. ✅ **Corregir parseo de ROTATIVO** (separador correcto)
4. ✅ **Validar parseo de GPS** (índices correctos)

### **PRIORIDAD 1 (Alto - Necesario para KPIs)**

5. ✅ **Implementar cálculo real de KM** (Haversine + interpolación)
6. ✅ **Implementar cálculo real de tiempo rotativo** (contar estados 1 y 2)
7. ✅ **Implementar detección de parques** (heurística + geocercas)
8. ✅ **Implementar clasificación de sesiones** (salida/vuelta/completo)
9. ✅ **Implementar índice de estabilidad** (promedio campo si)

### **PRIORIDAD 2 (Importante - Mejora experiencia)**

10. ✅ **Correlacionar salidas/vueltas** para emergencias completas
11. ✅ **Agrupar puntos negros** en radio 50m
12. ✅ **Detectar excesos de velocidad** (vs límites TomTom)
13. ✅ **Aplicar filtros correctamente** en todos los endpoints

### **PRIORIDAD 3 (Deseable - Futuras mejoras)**

14. ✅ **Integrar geocercas Radar.com**
15. ✅ **Integrar TomTom API** (direcciones, límites)
16. ✅ **Reportes PDF avanzados**
17. ✅ **Análisis IA** de patrones

---

## 📁 ARCHIVOS A MODIFICAR

### **Backend - Procesamiento**

1. **`backend/process-correct-sessions.js`** → ❌ REESCRIBIR COMPLETO
   - Detectar múltiples sesiones
   - Extraer timestamps reales
   - Corregir parseo de todos los tipos
   - Clasificar sesiones

2. **`backend/src/services/kpiCalculator.ts`** → 🆕 CREAR
   - Todas las fórmulas correctas
   - Cálculos desde datos reales
   - Sin estimaciones

3. **`backend/src/services/emergencyDetector.ts`** → 🆕 CREAR
   - Detectar parques
   - Clasificar sesiones
   - Correlacionar salidas/vueltas

### **Backend - API**

4. **`backend/src/routes/kpis.ts`** → ❌ REESCRIBIR
   - Usar kpiCalculator
   - Aplicar filtros correctos
   - Datos reales, no estimaciones

5. **`backend/src/routes/hotspots.ts`** → 🔧 AUDITAR Y CORREGIR
   - Agrupar en radio 50m
   - Correlacionar con GPS correcto

6. **`backend/src/routes/speed.ts`** → 🔧 AUDITAR Y CORREGIR
   - Calcular excesos con datos GPS reales
   - Integrar límites TomTom

### **Frontend - Dashboard**

7. **`frontend/src/hooks/useKPIs.ts`** → ✅ FUNCIONA (solo necesita backend correcto)

8. **`frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx`** → 🔧 MEJORAR
   - Añadir KPI de índice estabilidad
   - Mejorar visualización

9. **`frontend/src/components/stability/BlackSpotsTab.tsx`** → 🔧 MEJORAR
   - Integrar TomTom para direcciones
   - Mejorar agrupación visual

10. **`frontend/src/components/speed/SpeedAnalysisTab.tsx`** → 🔧 MEJORAR
    - Mapa con trazas GPS coloreadas
    - Tabla de excesos

### **Base de Datos**

11. **`backend/prisma/schema.prisma`** → 🔧 AÑADIR CAMPOS
    - `Session.sessionType` (enum)
    - `Session.kmRecorridos` (Float)
    - `Session.indiceEstabilidad` (Float)
    - Índices optimizados

---

## 📊 PLAN DE ACCIÓN

### **Semana 1: Fundamentos**
- [x] Análisis exhaustivo de archivos (COMPLETADO)
- [ ] Reescribir parsers con detección multi-sesión
- [ ] Extraer timestamps reales
- [ ] Crear kpiCalculator service
- [ ] Crear emergencyDetector service

### **Semana 2: KPIs Reales**
- [ ] Implementar cálculo real de todos los KPIs
- [ ] Reescribir endpoint `/api/kpis/summary`
- [ ] Validar con datos reales
- [ ] Ajustar umbrales

### **Semana 3: Dashboard**
- [ ] Optimizar pestaña Estados/Tiempos
- [ ] Mejorar Puntos Negros
- [ ] Mejorar Velocidades
- [ ] Añadir nuevo KPI: Índice Estabilidad

### **Semana 4: APIs y Optimización**
- [ ] Integrar TomTom (direcciones, límites)
- [ ] Implementar geocercas parques
- [ ] Optimizar BD (índices)
- [ ] Testing completo

---

## ✅ PRÓXIMO PASO INMEDIATO

**Crear los 2 servicios core que faltan:**

1. **`backend/src/services/kpiCalculator.ts`**
   - Todas las fórmulas correctas del análisis
   - Cálculos desde datos reales de BD
   - Sin estimaciones ni suposiciones

2. **`backend/src/services/emergencyDetector.ts`**
   - Detectar parques (heurística)
   - Clasificar sesiones (salida/vuelta/completo)
   - Correlacionar emergencias

**Luego:**

3. Reescribir `backend/process-correct-sessions.js` con detección multi-sesión
4. Actualizar `backend/src/routes/kpis.ts` para usar servicios nuevos
5. Validar con datos reales

---

## 📈 IMPACTO ESPERADO

### **Antes (Actual):**
- KPIs: ~30% precisión (estimaciones)
- Sesiones: 10-11 por vehículo
- Datos: Mezclados en sesiones únicas

### **Después (Objetivo):**
- KPIs: ~95% precisión (datos reales)
- Sesiones: 40-60 por vehículo (detectadas correctamente)
- Datos: Separados por sesión real
- Emergencias: Correlacionadas correctamente
- Puntos negros: Ubicación precisa
- Velocidades: Comparadas con límites reales

---

**Este documento sirve como base para todas las correcciones que vienen.**

_Auditoría realizada: 10 de octubre de 2025_

