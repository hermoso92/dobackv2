# 🔍 AUDITORÍA COMPLETA DE KPIs DEL DASHBOARD

## 🚨 PROBLEMAS CRÍTICOS DETECTADOS

### ❌ P001: VALORES COMPLETAMENTE MEZCLADOS EN LA UI

**Backend retorna** (correcto):
```javascript
{
  activity: {
    driving_hours_formatted: "83:56:59",  // Horas de conducción
    km_total: 2193,                        // Kilómetros
    rotativo_on_percentage: 80.3           // % Rotativo
  },
  states: {
    states: [
      { key: 1, duration_formatted: "11:16:00" }, // Tiempo en PARQUE
      // ...
    ]
  },
  stability: {
    total_incidents: 502,    // Total
    critical: 62,            // Graves
    moderate: 132,           // Moderadas
    light: 308               // Leves
  }
}
```

**UI muestra** (INCORRECTO):
```
Horas de Conducción: 11:16:00  ❌ (debería ser 83:56:59)
Tiempo en Parque: 83:56:59     ❌ (debería ser 11:16:00)
Total Incidencias: 62          ❌ (debería ser 502)
```

**Causa**: Los valores están usando las propiedades equivocadas del objeto `activity` y `states`.

---

### ❌ P002: SELECTOR DE VEHÍCULOS NO FUNCIONA

**Prueba realizada**:
- Vehículos disponibles: BRP ALCOBENDAS, ESCALA ALCOBENDAS, BRP LAS ROZAS
- Se seleccionó: BRP ALCOBENDAS
- **Resultado**: Los KPIs NO cambiaron

**Causa**: 
- Frontend envía `vehicleIds[]` 
- Backend leía `vehicleIds` (YA CORREGIDO)
- Necesita probar nuevamente después de corrección

---

### ❌ P003: SUMA DE INCIDENCIAS INCORRECTA

**Backend retorna**:
- Critical: 62
- Moderate: 132
- Light: 308
- **Suma: 502 ✅**

**UI muestra**:
- Graves: 196 (¿de dónde sale?)
- Moderadas: 459 (¿de dónde sale?)
- Leves: 21 (¿de dónde sale?)
- Total: 70 (¿de dónde sale?)

**Causa**: La UI está leyendo valores de otro request o tiene caché antiguo.

---

### ❌ P004: TIEMPO EN TALLER CALCULADO SIN GEOCERCAS

**Valor mostrado**: 73:54:25 (73 horas)

**Problema**: 
- Se calcula "Tiempo en Taller" desde `RotativoMeasurement` estado 0 (Clave 0)
- Pero NO hay geocercas de talleres configuradas para validar que el vehículo realmente esté en un taller
- La Clave 0 puede significar "fuera de servicio" o "mantenimiento" pero no necesariamente "en taller físico"

**Recomendación**: Renombrar a "Tiempo Fuera de Servicio" o "Tiempo en Mantenimiento"

---

### ❌ P005: % ROTATIVO INCORRECTO

**Backend retorna**: 80.3%
**UI muestra**: Valores inconsistentes

**Problema**: El cálculo usa `rotativoOnSeconds / timeOutsideStation` pero:
- Solo cuenta Clave 2 como "rotativo encendido"
- Según documentación, Clave 5 también puede tener rotativo
- El denominador debería ser tiempo de conducción, no tiempo fuera de parque

---

### ❌ P006: KILÓMETROS INCONSISTENTES

**Valores observados**: 2193 km, 2898 km, 3271 km

**Problemas**:
- Con 83 horas de conducción, 2193 km da velocidad promedio de 26 km/h (muy bajo)
- El cálculo con Haversine puede estar sumando distancias incorrectas
- Puede haber puntos GPS duplicados o erróneos

---

## 🔧 CORRECCIONES NECESARIAS

### 1. Corregir Asignación de Valores en UI (CRÍTICO)

**Archivo**: `frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx`

El problema está en que los valores se están intercambiando. Necesito verificar:

```typescript
// VERIFICAR ESTA LÍNEA (aproximadamente línea 518)
<KPICard
    title="Horas de Conducción"
    value={activity?.driving_hours_formatted || '00:00:00'}  // ✅ Correcto
/>

// VERIFICAR ESTA LÍNEA (aproximadamente línea 529)
<KPICard
    title="Tiempo en Parque"
    value={getStateDuration(1)}  // ✅ Debería ser correcto (estado 1)
/>
```

Pero la UI muestra valores invertidos, lo que sugiere que:
- `activity?.driving_hours_formatted` NO contiene 83:56:59
- O hay caché en el navegador
- O el componente está usando datos viejos

---

### 2. Corregir Filtro de Vehículos (CRÍTICO)

**Archivo**: `backend-final.js` (YA CORREGIDO)
- Ahora lee `req.query['vehicleIds[]']`
- Necesita probar si funciona

---

### 3. Corregir Clasificación de Incidencias (CRÍTICO)

**Archivo**: `backend-final.js` líneas 774-792

```javascript
// ❌ ACTUAL - Clasifica por texto del evento
if (eventType.includes('FRENADA_BRUSCA')) criticalIncidents++;
else if (eventType.includes('MODERADO')) moderateIncidents++;
else lightIncidents++; // Todos los demás como leves

// ✅ CORRECTO - Usar campo severity de la base de datos
// La tabla stability_events NO tiene campo severity, solo 'type'
// Necesitas consultar la tabla de definición de eventos
```

**Problema adicional**: La tabla `stability_events` NO tiene campo `severity`. Los eventos se clasifican por el nombre del `type`.

---

### 4. Corregir Cálculo de Kilómetros

**Archivo**: `backend-final.js` líneas 794-821

El cálculo con Haversine está implementado pero puede tener problemas:
- Verificar que `lat` y `lon` sean válidos
- Filtrar puntos GPS duplicados o con error
- Validar que la distancia calculada sea razonable

---

### 5. Revisar Cálculo de % Rotativo

**Archivo**: `backend-final.js` línea 858

```javascript
// ACTUAL
rotativo_on_percentage: timeOutsideStation > 0 ? 
    Math.round((rotativoOnSeconds / timeOutsideStation) * 100) : 0

// PROBLEMA: 
// - Solo cuenta Clave 2 como rotativo encendido (línea 768)
// - Debería contar también otras claves si tienen rotativo
// - El denominador debería ser tiempo total de conducción
```

---

## 🧪 PRÓXIMAS PRUEBAS NECESARIAS

1. ✅ Verificar si selector de vehículos funciona después de corrección backend
2. ✅ Forzar recarga completa del frontend para verificar valores actualizados
3. ✅ Verificar cada KPI individualmente comparando backend vs UI
4. ✅ Auditar la tabla `stability_events` para ver cómo están clasificados los eventos
5. ✅ Revisar datos de `RotativoMeasurement` para validar claves

---

## 📊 ESTADO ACTUAL

- ✅ Filtros temporales FUNCIONAN (100%)
- ❌ Selector de vehículos NO funciona
- ❌ Valores en UI MEZCLADOS/INCORRECTOS
- ❌ Suma de incidencias INCORRECTA
- ⚠️ Cálculos de backend FUNCIONAN pero resultados cuestionables

---

## 🎯 ACCIÓN INMEDIATA REQUERIDA

1. **Forzar recarga del frontend** para ver si los valores se actualizan
2. **Verificar caché del navegador**
3. **Revisar si hay múltiples instancias de useKPIs** ejecutándose
4. **Validar que el componente usa los valores correctos de los hooks**


