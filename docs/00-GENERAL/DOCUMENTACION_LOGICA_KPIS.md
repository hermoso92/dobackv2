# 📊 Documentación Completa del Sistema de KPIs - DobackSoft

## 📋 Índice

1. [Visión General](#visión-general)
2. [Lógica de Cálculo de KPIs](#lógica-de-cálculo-de-kpis)
3. [Estados del Rotativo](#estados-del-rotativo)
4. [Detección Inteligente de Operaciones](#detección-inteligente-de-operaciones)
5. [Geocercas y Validación](#geocercas-y-validación)
6. [Filtros y Actualización Frontend](#filtros-y-actualización-frontend)
7. [Ejemplos de Cálculo](#ejemplos-de-cálculo)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

El sistema de KPIs de DobackSoft está diseñado específicamente para vehículos de emergencia (bomberos). Calcula métricas operativas en tiempo real basándose en datos GPS, eventos de estabilidad y mediciones del rotativo.

### Fuentes de Datos

- **GPS**: Coordenadas, velocidad, timestamps
- **Estabilidad**: Eventos de riesgo (vuelcos, derrapes, etc.)
- **Rotativo**: Estados del vehículo (0-5)
- **Geocercas**: Zonas de parques, talleres, operacionales

---

## 📊 Lógica de Cálculo de KPIs

### KPIs Principales

| KPI | Descripción | Cálculo |
|-----|-------------|---------|
| **Kilómetros Totales** | Distancia recorrida | Suma de Haversine entre puntos GPS consecutivos |
| **Horas de Conducción** | Tiempo en operación | Suma de tiempos en estados 2, 3, 4, 5 |
| **Velocidad Promedio** | km/h promedio | km_total / driving_hours |
| **% Rotativo Encendido** | Porcentaje con rotativo activo | (tiempo_rotativo_on / tiempo_total) × 100 |
| **Salidas en Emergencia** | Número de operaciones | Sesiones con >0.5 km de recorrido |
| **Incidencias** | Eventos de estabilidad | Clasificadas en leves/moderadas/graves |

### Endpoint Backend

```javascript
GET /api/kpis/summary
```

**Query Params:**
- `from`: Fecha inicio (YYYY-MM-DD)
- `to`: Fecha fin (YYYY-MM-DD)
- `vehicleIds[]`: Array de IDs de vehículos
- `parkIds[]`: Array de IDs de parques (geocercas)

**Headers:**
- `x-organization-id`: ID de la organización (obligatorio)

---

## 🔑 Estados del Rotativo

| Estado | Nombre | Descripción |
|--------|--------|-------------|
| **0** | Taller | Vehículo en mantenimiento |
| **1** | En Parque | Operativo pero en base |
| **2** | Salida en Emergencia | Camino al siniestro |
| **3** | En Siniestro | Actuando en el incidente |
| **4** | Fin de Actuación | Terminando operación |
| **5** | Regreso al Parque | Retorno a base |

---

## 🚒 Detección Inteligente de Operaciones

### Problema Identificado

Los archivos ROTATIVO reales frecuentemente solo contienen estados 0 y 1, faltando datos operativos (2-5).

### Solución Implementada

El sistema infiere estados operativos basándose en **análisis de trayectoria GPS**:

#### Algoritmo

```javascript
// 1. Calcular distancia de la sesión
sessionKm = Σ haversine(punto_i, punto_i+1)

// 2. Clasificar sesión
if (sessionKm >= 0.5) {
    // ✅ OPERACIÓN REAL
    esOperacion = true
} else {
    // ❌ NO es operación (prueba, parque, taller)
    esOperacion = false
}
```

#### Si es Operación (>0.5 km):

```javascript
// Analizar GPS para detectar estados

// 1. Separar tiempo en movimiento vs parado
for (cada punto GPS) {
    timeDiff = timestamp[i+1] - timestamp[i]
    
    if (speed < 5) {
        tiempoParado += timeDiff  // Estado 3 (Siniestro)
    } else {
        tiempoMovimiento += timeDiff  // Estados 2 y 5
    }
}

// 2. Detectar si vuelve al parque
distanciaInicioFin = haversine(primera_coord, ultima_coord)

if (distanciaInicioFin < 0.2) {
    // ✅ IDA Y VUELTA
    estado[2] += tiempoMovimiento * 0.5  // Ida
    estado[3] += tiempoParado             // Siniestro
    estado[5] += tiempoMovimiento * 0.5  // Regreso
    
    rotativoOn = (tiempoMovimiento * 0.5) + (tiempoParado * 0.5)
} else {
    // ⚠️ SOLO IDA (otra sesión para vuelta)
    estado[2] += tiempoMovimiento         // Solo ida
    estado[3] += tiempoParado             // Siniestro
    
    rotativoOn = tiempoMovimiento + (tiempoParado * 0.7)
}
```

#### Si NO es Operación (<0.5 km):

```javascript
// Usar datos ROTATIVO reales si existen
if (rotativoMeasurements.length > 0) {
    for (medición en rotativoMeasurements) {
        duration = medición[i+1].timestamp - medición[i].timestamp
        estado[medición[i].state] += duration
    }
} else {
    // Sin datos ROTATIVO, asumir en parque
    estado[1] += sessionDuration
}
```

---

## 🗺️ Geocercas y Validación

### Geocercas Disponibles

El sistema utiliza geocercas creadas con **Radar.com**:

- **PARK**: Parques de bomberos (base de operaciones)
- **OPERATIONAL**: Zonas operacionales frecuentes
- **MAINTENANCE**: Talleres de mantenimiento
- **STORAGE**: Zonas de almacenamiento

### Uso en Cálculos

```javascript
// Verificar si punto GPS está en geocerca de parque
function dentroDeParque(lat, lon, geofence) {
    // Depende del tipo de geometría (círculo o polígono)
    if (geofence.type === 'circle') {
        dist = haversine(lat, lon, geofence.center.lat, geofence.center.lon)
        return dist <= geofence.radius
    }
    // ... lógica para polígonos
}

// Validar Estado 1 (En Parque)
if (estado === 1 && !dentroDeParque(lat, lon, parque)) {
    console.warn('Vehículo marcado "En Parque" pero fuera de geocerca')
}
```

### Creación de Geocercas

**Verificar existentes:**
```bash
node verificar-geocercas.js
```

**Detectar automáticamente desde GPS:**
```bash
node detectar-parques-bomberos.js
```

---

## 🔄 Filtros y Actualización Frontend

### Arquitectura de Filtros

```
FiltersContext (Global State)
    ├── filters (objeto memoizado)
    ├── filterVersion (contador)
    └── updateTrigger (timestamp)
            ↓
    useGlobalFilters (Hook)
            ↓
    NewExecutiveKPIDashboard (Componente)
            ↓
    useKPIs (Hook - llamadas API)
```

### Flujo de Actualización

1. Usuario cambia filtro (ej: selecciona vehículo)
2. `FiltersContext.updateFilters()` incrementa `updateTrigger`
3. `useGlobalFilters` retorna nuevo objeto `filters`
4. `NewExecutiveKPIDashboard` detecta cambio en `updateTrigger`
5. Re-render fuerza re-ejecución de `useKPIs`
6. `useKPIs` detecta cambio y llama a `/api/kpis/summary`
7. KPIs se actualizan en UI

### Código Clave

```typescript
// FiltersContext.tsx
const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setState(prev => ({
        ...prev,
        filters: { ...prev.filters, ...newFilters }
    }));
    
    setUpdateTrigger(prev => prev + 1);  // ✅ Forzar actualización
    setFilterVersion(prev => prev + 1);
}, []);

// useKPIs.ts
useEffect(() => {
    console.log('🔄 Cargando KPIs (trigger:', updateTrigger, ')');
    loadKPIs();
}, [updateTrigger]);  // ✅ Depende del trigger
```

---

## 📐 Ejemplos de Cálculo

### Ejemplo 1: Sesión con Operación Real

**Datos de entrada:**
- 3 sesiones del vehículo DOBACK024 el 2025-10-03
- Sesión 1: 43.64 km
- Sesión 2: 35.21 km
- Sesión 3: 31.30 km

**Cálculo:**

```javascript
// Sesión 1
sessionKm = 43.64 km
esOperacion = true (>0.5 km)

// Análisis GPS
tiempoMovimiento = 16 min
tiempoParado = 31 min (velocidad <5 km/h)
distanciaInicioFin = 0.15 km (<0.2 km)

// Estados inferidos
estado[2] = 16 * 0.5 = 8 min (Ida)
estado[3] = 31 min (Siniestro)
estado[5] = 16 * 0.5 = 8 min (Regreso)

rotativoOn = (16 * 0.5) + (31 * 0.5) = 23.5 min

// Repetir para sesiones 2 y 3...

// Totales del día
kmTotal = 110.15 km
horasConduccion = 2h 5min
rotativoPercentage = 70%
```

**Validación:**

```bash
node validar-calculo-manual.js

✅ Kilómetros: 110.15 km (coincidencia 100%)
✅ Incidencias: 213 (coincidencia 100%)
```

### Ejemplo 2: Sesión sin Operación

**Datos de entrada:**
- Sesión de prueba: 0.3 km
- Duración: 15 min
- GPS: velocidad <2 km/h (parado)

**Cálculo:**

```javascript
sessionKm = 0.3 km
esOperacion = false (<0.5 km)

// Usar datos ROTATIVO
if (rotativoMeasurements.length > 0) {
    // Procesar estados reales
} else {
    // Asumir en parque
    estado[1] += 15 min
}
```

---

## 🔧 Troubleshooting

### Problema: KPIs no se actualizan al cambiar filtros

**Diagnóstico:**
```typescript
// Agregar logs en useKPIs.ts
console.log('🔄 USE EFFECT DISPARADO - trigger:', updateTrigger);
console.log('📊 Filtros:', filters);
```

**Solución:**
- Verificar que `FiltersContext` está envolviendo `App`
- Verificar que `updateTrigger` se incrementa
- Verificar que `useKPIs` depende de `updateTrigger`

### Problema: Velocidad imposible (>200 km/h)

**Diagnóstico:**
```bash
node test-kpis-nuevos.js

❌ Velocidad imposible: 248290.76 km/h
❌ 609.14 km en 8 segundos = imposible
```

**Causa:** Backend usando solo datos ROTATIVO (sin lógica inteligente)

**Solución:**
- Verificar que `backend-final.js` tiene la lógica de detección GPS
- Reiniciar backend: `node backend-final.js`

### Problema: Tiempo fuera de parque = 0 segundos

**Diagnóstico:**
```javascript
timeOutsideStation: 0
statesDuration[2,3,4,5]: todos en 0
```

**Causa:** Sesiones no clasificadas como operaciones

**Solución:**
- Verificar umbral: debe ser `sessionKm >= 0.5` (no 0.05)
- Verificar cálculo Haversine en GPS

### Problema: Todas las incidencias son leves

**Diagnóstico:**
```javascript
criticalIncidents: 0
moderateIncidents: 0
lightIncidents: 736 (todas)
```

**Causa:** Clasificación de eventos incorrecta

**Solución:**
```javascript
// backend-final.js
if (eventType.includes('rollover') || eventType.includes('CRITICAL')) {
    criticalIncidents++;
}
else if (eventType.includes('drift') || eventType.includes('MODERATE')) {
    moderateIncidents++;
}
```

---

## ✅ Checklist de Validación

Antes de considerar el sistema funcional, verificar:

- [ ] Backend responde en http://localhost:9998/health
- [ ] Frontend carga en http://localhost:5174
- [ ] Geocercas de parques creadas (verificar con `node verificar-geocercas.js`)
- [ ] KPIs muestran valores realistas:
  - [ ] Velocidad promedio < 100 km/h
  - [ ] Horas de conducción > 1 hora (para múltiples sesiones)
  - [ ] Tiempo fuera de parque > 0
  - [ ] Kilómetros coherentes con tiempo
- [ ] Filtros actualizan KPIs inmediatamente
- [ ] Incidencias clasificadas correctamente (no todas leves)
- [ ] CORS configurado con `x-organization-id` permitido

---

## 📚 Scripts de Utilidad

| Script | Propósito |
|--------|-----------|
| `test-kpis-nuevos.js` | Test completo de KPIs con validaciones |
| `validar-calculo-manual.js` | Comparar cálculo manual vs backend |
| `verificar-geocercas.js` | Listar geocercas existentes |
| `detectar-parques-bomberos.js` | Detectar parques desde GPS |
| `analisis-completo-archivos.js` | Analizar archivos crudos (ROTATIVO, GPS) |

**Ejecutar todos los tests:**
```bash
node test-kpis-nuevos.js
node validar-calculo-manual.js
```

---

## 🎯 Valores Esperados (Referencia)

Basado en datos reales de DOBACK024 (2025-10-03):

```
📊 KPIs Realistas:
   Kilómetros: 110.15 km
   Horas Conducción: 02:05:58
   Velocidad Promedio: 39 km/h
   % Rotativo: 70%
   Salidas en Emergencia: 3

⚠️  Incidencias:
   Total: 213
   Graves: 29
   Moderadas: 184
   Leves: 0

🔑 Estados:
   Taller (0): 00:37:04
   En Parque (1): 25:48:14
   Salida (2): 02:35:11
   Siniestro (3): 12:55:07
   Fin (4): 00:00:06
   Regreso (5): 00:01:15
```

---

## 🚀 Próximos Pasos

1. **Integrar geocercas en detección de estados**: Usar coordenadas de parques para validar Estado 1
2. **Machine Learning**: Detectar patrones de operaciones automáticamente
3. **Optimizar umbral de operación**: 0.5 km puede ajustarse según datos históricos
4. **Dashboard TV Wall**: Visualización en tiempo real con KPIs grandes

---

**Documentación generada**: ${new Date().toISOString()}  
**Versión del Sistema**: StabilSafe V3  
**Autor**: DobackSoft Team

