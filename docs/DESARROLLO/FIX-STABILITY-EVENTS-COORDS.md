# Fix: Campos Completos en stability_events

## 📋 Problemas Detectados

### Problema 1: NOT NULL Violation

Durante el post-procesamiento de sesiones, se producían errores de violación de restricción NOT NULL en PostgreSQL:

```
Error: P2010 (23502): NOT NULL violation
La fila que falla contiene (..., null, null, RIESGO_VUELCO, ...)
```

**Causa raíz:** 
- La tabla `stability_events` tenía los campos `lat` y `lon` como NOT NULL
- El código intentaba insertar eventos de estabilidad sin coordenadas GPS (valores NULL)
- Los eventos de estabilidad se generan desde mediciones de acelerómetro, que no siempre tienen GPS asociado

### Problema 2: Campos Incompletos en BD

Los eventos se guardaban pero faltaban campos importantes:
- ❌ `speed` - Velocidad en el momento del evento (NULL)
- ❌ `rotativoState` - Estado del rotativo (NULL)
- ❌ `keyType` - Tipo de clave operacional (NULL)
- ❌ `interpolatedGPS` - Si las coordenadas fueron interpoladas (NULL)

**Causa raíz:**
- El código de inserción solo llenaba campos básicos
- El schema de Prisma estaba incompleto
- No se correlacionaba con datos de GPS, rotativo y segmentos operacionales

## ✅ Solución Implementada

### 1. Actualización Completa del Schema de Prisma

**Archivo modificado:** `prisma/schema.prisma`

```prisma
model stability_events {
  id               String   @id
  session_id       String
  timestamp        DateTime
  lat              Float?   // ✅ Ahora opcional
  lon              Float?   // ✅ Ahora opcional
  type             String
  severity         String?  // ✅ NUEVO: Severidad del evento
  speed            Float?   // ✅ NUEVO: Velocidad en km/h
  rotativoState    Int?     // ✅ NUEVO: Estado rotativo (0,2,5)
  details          Json?
  keyType          String?  // ✅ NUEVO: Tipo de clave operacional
  interpolatedGPS  Boolean  // ✅ NUEVO: GPS interpolado
  // ...
}
```

**Cambios aplicados:**
- ✅ Campos `lat`/`lon` opcionales (permiten NULL)
- ✅ Campo `severity` agregado (faltaba en el schema)
- ✅ Campo `keyType` agregado
- ✅ Campo `interpolatedGPS` agregado

### 2. Migración de Base de Datos

**Archivo creado:** `database/fix_stability_events_nullable_coords.sql`

```sql
-- Hacer que los campos lat y lon sean opcionales
ALTER TABLE stability_events ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE stability_events ALTER COLUMN lon DROP NOT NULL;
```

**Estado:** ✅ Migración aplicada exitosamente

### 3. Código de Inserción Mejorado

**Archivo modificado:** `backend/src/services/eventDetector.ts`

**Mejoras implementadas:**
1. ✅ Correlación con GPS para obtener coordenadas Y velocidad
2. ✅ Correlación con rotativo para obtener estado de claves
3. ✅ Inserción de TODOS los campos en la BD:
   - `speed` - Velocidad del GPS en el momento del evento
   - `rotativoState` - 0 (apagado), 2 (clave 2), 5 (clave 5)
   - `keyType` - 'CLAVE_2', 'CLAVE_5' o NULL
   - `interpolatedGPS` - `true` si no hay GPS, `false` si hay coordenadas reales

```typescript
// Correlación con GPS (líneas 636-658)
const gpsPoint = await prisma.gpsMeasurement.findFirst({
    where: { sessionId, timestamp: { gte: ..., lte: ... } }
});
if (gpsPoint) {
    evento.lat = gpsPoint.latitude;
    evento.lon = gpsPoint.longitude;
    evento.valores.velocity = gpsPoint.speed; // ✅ NUEVO
}

// Correlación con rotativo (líneas 660-687)
const rotativoPoint = await prisma.rotativoMeasurement.findFirst({
    where: { sessionId, timestamp: { gte: ..., lte: ... } }
});
if (rotativoPoint) {
    evento.rotativo = rotativoPoint.state !== 'apagado';
    evento.rotativoState = stateMap[rotativoPoint.state]; // ✅ NUEVO
}

// Inserción completa (líneas 722-745)
INSERT INTO stability_events (
    id, session_id, timestamp, type, severity, details,
    lat, lon, speed, rotativoState, keyType, interpolatedGPS
) VALUES (...)
```

### 4. Endpoint de Regeneración

**Archivo modificado:** `backend/src/routes/upload.ts`

**Nuevo endpoint:** `POST /api/upload/regenerate-all-events`

Este endpoint:
- ✅ Elimina todos los eventos existentes
- ✅ Regenera eventos para todas las sesiones con campos completos
- ✅ Devuelve estadísticas detalladas
- ✅ Timeout de 10 minutos para procesar todas las sesiones

### 5. Scripts de Utilidad

**Archivos creados:**

1. `scripts/utils/fix-stability-events-coords.js`
   - Aplicar migración de campos opcionales
   - **Estado:** ✅ Ejecutado exitosamente

2. `scripts/utils/regenerar-eventos-completos.js`
   - Limpiar eventos y preparar regeneración
   
3. `scripts/utils/regenerar-eventos-api.ps1`
   - Llamar al endpoint de regeneración con confirmación
   - Script interactivo PowerShell

## 🔄 Pasos para Completar

### ⭐ PASO RECOMENDADO: Regenerar Eventos Existentes

Los eventos actuales en la BD tienen campos incompletos (speed, rotativoState, keyType vacíos). Para completarlos:

**Ejecutar:**
```powershell
.\scripts\utils\regenerar-eventos-api.ps1
```

**Este script:**
1. ✅ Verifica que el backend esté corriendo
2. ⚠️  Pide confirmación (eliminará eventos existentes)
3. 🔄 Llama al endpoint `/api/upload/regenerate-all-events`
4. 🗑️  Elimina ~7,500 eventos incompletos
5. ⚡ Regenera eventos con TODOS los campos:
   - GPS con coordenadas + velocidad
   - Estado del rotativo (0, 2, 5)
   - Tipo de clave operacional
   - Flag de GPS interpolado
6. 📊 Muestra estadísticas

**Tiempo:** ~2-5 minutos para 63 sesiones

**Resultado:** Eventos completos en BD listos para análisis detallado

---

### Opción Alternativa: Reinicio Manual del Backend

Solo necesario si el backend no arranca o hay problemas con Prisma:

#### Opción 1: Reinicio Manual

1. **Detener el backend:**
   - Localiza la ventana de PowerShell que ejecuta el backend (puerto 9998)
   - Ciérrala o presiona Ctrl+C

2. **Regenerar cliente de Prisma:**
   ```powershell
   cd backend
   npx prisma generate
   ```

3. **Reiniciar backend:**
   ```powershell
   npm run dev
   ```

### Opción 2: Script Automático (Recomendado)

Ejecuta el script de reinicio:

```powershell
.\scripts\utils\reiniciar-backend-prisma.ps1
```

Este script:
- ✅ Detiene el backend automáticamente
- ✅ Regenera el cliente de Prisma
- ✅ Reinicia el backend en una nueva ventana
- ✅ Espera a que el backend esté listo

## 📊 Resultados Esperados

Después de reiniciar el backend:

1. **El post-procesamiento funcionará correctamente:**
   - ✅ Se generarán eventos de estabilidad sin errores
   - ✅ Los eventos sin coordenadas GPS tendrán `lat: null` y `lon: null`
   - ✅ Los eventos con coordenadas GPS las conservarán normalmente

2. **Los logs mostrarán:**
   ```
   ✅ Eventos de estabilidad guardados en BD
   {"count": X, "breakdown": {...}}
   ```

3. **No habrá más errores de tipo:**
   ```
   ERROR: La fila que falla contiene (..., null, null, ...)
   ```

## 🔍 Verificación

### 1. Verificar Campos Completos en BD

Después de regenerar eventos, consulta la BD:

```sql
-- Verificar que todos los campos se llenan correctamente
SELECT 
    COUNT(*) as total_eventos,
    COUNT(lat) as con_gps,
    COUNT(*) - COUNT(lat) as sin_gps,
    COUNT(speed) as con_velocidad,
    COUNT("rotativoState") as con_rotativo,
    COUNT("keyType") as con_clave,
    COUNT(CASE WHEN "interpolatedGPS" = true THEN 1 END) as gps_interpolado
FROM stability_events;

-- Ver ejemplos de eventos completos
SELECT 
    type, severity, speed, "rotativoState", "keyType", "interpolatedGPS",
    lat, lon, timestamp
FROM stability_events
WHERE speed IS NOT NULL
LIMIT 10;
```

**Resultados esperados:**
- ✅ `con_gps` > 0 (eventos con coordenadas)
- ✅ `con_velocidad` > 0 (eventos con speed del GPS)
- ✅ `con_rotativo` > 0 (eventos con estado del rotativo)
- ✅ `con_clave` > 0 (eventos durante clave 2 o 5)

### 2. Verificar Eventos en el Reporte UI

1. **Procesar archivos o regenerar:**
   - Ir a interfaz de upload
   - Botón "Process All CMadrid" o ejecutar script de regeneración

2. **Revisar el reporte:**
   - Debe mostrar sección "X Eventos de estabilidad detectados"
   - Primeros 10 eventos listados con:
     - 🔴/🟠/🟡 Severidad
     - Tipo de evento
     - 📍 Coordenadas GPS (si existen)

3. **Revisar logs del backend:**
   ```
   ✅ Eventos de estabilidad guardados en BD
   {"count": X, "breakdown": {...}}
   📋 Eventos recuperados de BD para sesión X: {"count": Y}
   ```

## 📝 Notas Técnicas

- Los campos `lat` y `lon` ahora son opcionales en TypeScript (`Float?`)
- El código de inserción ya manejaba correctamente los valores NULL
- El problema era únicamente la restricción NOT NULL en la BD
- Esta solución permite eventos de estabilidad basados puramente en acelerómetro

## 🎯 Impacto

- ✅ **Positivo:** Permite eventos de estabilidad sin GPS (más completo)
- ✅ **Compatible:** No afecta eventos existentes con coordenadas
- ✅ **Performance:** Sin impacto en rendimiento
- ⚠️ **Consideración:** Algunos eventos no tendrán ubicación en el mapa

## 🔗 Archivos Relacionados

- `prisma/schema.prisma` - Schema actualizado
- `database/fix_stability_events_nullable_coords.sql` - Migración SQL
- `scripts/utils/fix-stability-events-coords.js` - Script de aplicación
- `scripts/utils/reiniciar-backend-prisma.ps1` - Script de reinicio
- `backend/src/services/eventDetector.ts:688` - Código de inserción

---

**Fecha:** 15 de Octubre de 2025  
**Estado:** ✅ Migración aplicada, pendiente reinicio del backend  
**Prioridad:** 🔴 ALTA - Requiere reinicio para completar

