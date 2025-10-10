# 🔧 CORRECCIÓN: Backend de Desarrollo - Filtrado GPS y Eventos

## 🚨 **PROBLEMA IDENTIFICADO**

**Usuario**: "estoy utilizando iniciardev.ps1 y solo carga una linea"

**Causa Raíz**:
- ✅ **`iniciardev.ps1`** ejecuta el backend de desarrollo (`backend/src/`)
- ❌ **`backend-final.js`** no se usa en modo desarrollo
- ❌ **Backend de desarrollo** tenía filtrado GPS básico y búsqueda incorrecta de eventos

---

## 🔍 **PROBLEMAS ENCONTRADOS**

### **1. Filtrado GPS Básico**:
```typescript
// ANTES: Filtrado simple por cantidad
const filteredGpsPoints = gpsPoints.length > 1000
    ? gpsPoints.filter((_, index) => index % Math.ceil(gpsPoints.length / 500) === 0)
    : gpsPoints;
```

### **2. Búsqueda de Eventos Incorrecta**:
```typescript
// ANTES: Buscaba en tabla 'event' (incorrecta)
const events = await prisma.event.findMany({
    where: { sessionId: id },
    orderBy: { timestamp: 'asc' }
});
```

### **3. Sin Filtrado de "Callejeado"**:
- ❌ No había validación de distancia entre puntos
- ❌ No había filtrado de velocidades irrealistas
- ❌ No había filtrado de errores GPS masivos

---

## ✅ **CORRECCIONES APLICADAS**

### **1. Filtrado GPS Inteligente**:

```typescript
// NUEVO: Filtrado inteligente con parámetros realistas
const MAX_DISTANCE_BETWEEN_POINTS = 2000; // 2km máximo entre puntos consecutivos
const MIN_POINTS_FOR_VALID_ROUTE = 5; // Mínimo 5 puntos para ruta válida
const MAX_SPEED_KMH = 200; // Máxima velocidad realista (autopista)
const MAX_ABSOLUTE_DISTANCE = 50000; // 50km máximo absoluto (filtra errores masivos)
const hasValidTime = timeDiff <= 600; // Máximo 10 minutos entre puntos

// Validaciones en cascada:
const isMassiveError = distance > MAX_ABSOLUTE_DISTANCE;
const isValidDistance = distance <= MAX_DISTANCE_BETWEEN_POINTS;
const isValidSpeed = speedKmh <= MAX_SPEED_KMH;
const hasValidTime = timeDiff <= 600;
```

### **2. Búsqueda Correcta de Eventos**:

```typescript
// NUEVO: Busca en tabla 'stability_events' (correcta)
const stabilityEvents = await prisma.stability_events.findMany({
    where: { session_id: id },
    orderBy: { timestamp: 'asc' }
});
```

### **3. Mapeo Completo de Eventos**:

```typescript
// NUEVO: Mapeo completo con todos los campos
events: stabilityEvents.map((e: any) => {
    // Determinar severidad según tipo
    let severity = 'medium';
    if (e.type === 'rollover_imminent' || e.type === 'rollover_risk') {
        severity = 'critical';
    } else if (e.type === 'dangerous_drift') {
        severity = 'critical';
    } else if (e.type === 'abrupt_maneuver') {
        severity = 'high';
    }

    return {
        id: e.id,
        lat: e.lat || 0,
        lng: e.lon || 0,
        type: e.type || 'unknown',
        severity: severity,
        timestamp: e.timestamp,
        speed: e.speed || 0,
        rotativoState: e.rotativoState || 0,
        // Detalles del evento desde el JSON
        ...e.details,
        // Para compatibilidad con frontend
        isLTRCritical: e.details?.isRiesgoVuelco || false,
        isDRSHigh: e.details?.isDerivaPeligrosa || false,
        isLateralGForceHigh: e.details?.isManobraBrusca || false,
        // ... todos los campos técnicos
    };
});
```

### **4. Estadísticas Detalladas**:

```typescript
// NUEVO: Estadísticas completas
stats: {
    validRoutePoints: filteredRoutePoints.length,
    validEvents: stabilityEvents.length,
    totalGpsPoints: gpsPoints.length,
    totalEvents: stabilityEvents.length,
    skippedJumps: skippedJumps,
    skippedSpeed: skippedSpeed,
    skippedMassiveErrors: skippedMassiveErrors,
    hasValidRoute: filteredRoutePoints.length > 0,
    maxDistanceBetweenPoints: MAX_DISTANCE_BETWEEN_POINTS,
    minPointsRequired: MIN_POINTS_FOR_VALID_ROUTE
}
```

### **5. Logs Detallados**:

```typescript
// NUEVO: Logs informativos
console.log(`🔍 Encontrados ${stabilityEvents.length} eventos de estabilidad para sesión ${id}`);
console.log(`🔍 Coordenadas válidas por rango: ${validGpsPoints.length} de ${gpsPoints.length}`);
console.log(`🔍 Puntos GPS filtrados: ${filteredRoutePoints.length} de ${gpsPoints.length}`);
console.log(`🔍 Saltos GPS filtrados: ${skippedJumps}`);
console.log(`🔍 Velocidades irrealistas filtradas: ${skippedSpeed}`);
console.log(`🔍 Errores GPS masivos filtrados: ${skippedMassiveErrors}`);
```

---

## 📊 **RESULTADOS ESPERADOS**

### **Antes (Problema)**:
```
❌ Una línea recta artificial cruzando el mapa mundial
❌ 0 eventos visibles
❌ Filtrado GPS básico (solo por cantidad)
❌ Búsqueda incorrecta de eventos
```

### **Después (Corregido)**:
```
✅ Ruta realista y detallada
✅ Eventos visibles en el mapa
✅ Filtrado GPS inteligente con parámetros realistas
✅ Búsqueda correcta en tabla stability_events
✅ Estadísticas detalladas de filtrado
```

---

## 🧪 **PASOS PARA VERIFICAR**

### **1. El Backend de Desarrollo Ya Está Corregido**:
```
✅ Archivo: backend/src/routes/index.ts
✅ Endpoint: /session-route/:id
✅ Filtrado GPS inteligente implementado
✅ Búsqueda correcta de eventos
```

### **2. Verificar Hot-Reload**:
```
1. El backend de desarrollo tiene hot-reload automático
2. Los cambios se aplicarán automáticamente
3. No necesitas reiniciar el backend
```

### **3. Refrescar Frontend**:
```
1. Hard Reload (Ctrl+Shift+R) en el navegador
2. Ir a Dashboard → Sesiones & Recorridos
3. Seleccionar vehículo y sesión
4. Verificar nueva ruta y eventos
```

### **4. Verificar Logs del Backend**:
```
🔍 Encontrados X eventos de estabilidad para sesión xxx
🔍 Coordenadas válidas por rango: XXXX de XXXX
🔍 Puntos GPS filtrados: XXXX de XXXX
🔍 Saltos GPS filtrados: XXX
🔍 Velocidades irrealistas filtradas: XXX
🔍 Errores GPS masivos filtrados: XXX
```

---

## 📁 **ARCHIVOS MODIFICADOS**

1. ✅ **`backend/src/routes/index.ts`**:
   - Línea ~137: Búsqueda correcta en `stability_events`
   - Línea ~146: Función `calculateDistance` (Haversine)
   - Línea ~158: Filtrado por rango geográfico
   - Línea ~182: Filtrado GPS inteligente con parámetros realistas
   - Línea ~284: Mapeo completo de eventos con todos los campos
   - Línea ~326: Estadísticas detalladas

2. ✅ **`CORRECCION_BACKEND_DESARROLLO.md`**: Este documento

---

## 🎯 **DIFERENCIAS CON BACKEND-FINAL.JS**

| Aspecto | Backend Final | Backend Desarrollo |
|---------|---------------|-------------------|
| **Archivo** | `backend-final.js` | `backend/src/routes/index.ts` |
| **Inicio** | `iniciar.ps1` | `iniciardev.ps1` |
| **Hot-Reload** | ❌ Requiere reinicio | ✅ Automático |
| **TypeScript** | ❌ JavaScript | ✅ TypeScript |
| **Debugging** | ❌ Básico | ✅ Avanzado |
| **Performance** | ✅ Rápido | ⚠️ Más lento |

---

## 🚀 **ACCIÓN REQUERIDA**

### **CRÍTICO: Refrescar Frontend**
```
1. Hard Reload (Ctrl+Shift+R) en el navegador
2. Ir a Dashboard → Sesiones & Recorridos
3. Seleccionar vehículo DOBACK024
4. Seleccionar sesión
5. Verificar que la ruta sea realista (no una línea recta)
6. Verificar que aparezcan eventos en el mapa
```

### **Verificación de Logs**:
```
Los logs del backend de desarrollo mostrarán:
- Eventos encontrados
- Puntos GPS filtrados
- Saltos GPS filtrados
- Velocidades irrealistas filtradas
- Errores GPS masivos filtrados
```

---

**Fecha**: 7 de Octubre de 2025  
**Versión**: 7.3 - Backend Desarrollo Corregido  
**Estado**: ✅ **CORRECCIONES APLICADAS - HOT-RELOAD ACTIVO**

🎯 **El backend de desarrollo ya está corregido. Solo necesitas refrescar el frontend para ver los cambios.**
