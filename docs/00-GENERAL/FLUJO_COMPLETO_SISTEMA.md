# 🔄 FLUJO COMPLETO DEL SISTEMA DOBACKSOFT - REVISADO Y CORREGIDO

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura)
2. [Flujo de Subida de Archivos](#flujo-subida)
3. [Detección y Almacenamiento de Eventos](#eventos)
4. [Consulta y Visualización](#consulta)
5. [Cómo Probar el Sistema](#pruebas)
6. [Logs Esperados](#logs)

---

## 🏗️ Arquitectura del Sistema <a name="arquitectura"></a>

### Base de Datos (PostgreSQL + Prisma)

#### Tabla Principal: `Session`
- Almacena información de cada sesión de conducción
- Relaciona vehículo, usuario, organización
- Contiene timestamps de inicio/fin

#### Tablas de Mediciones:
1. **`StabilityMeasurement`**
   - Datos de acelerómetro y giroscopio
   - Campos calculados: `si` (índice de estabilidad)
   - **Flags de eventos**: `isLTRCritical`, `isDRSHigh`, `isLateralGForceHigh`

2. **`GpsMeasurement`**
   - Coordenadas GPS (lat, lng)
   - Velocidad, altitud, satélites

3. **`RotativoMeasurement`**
   - Estado del rotativo (0 = apagado, 1 = encendido)

#### Tabla de Eventos: `stability_events`
- **Almacena eventos detectados con coordenadas GPS ya correlacionadas**
- Campos:
  - `session_id`: Referencia a la sesión
  - `timestamp`: Momento del evento
  - `lat`, `lon`: Coordenadas GPS correlacionadas
  - `type`: Tipo de evento (rollover_risk, dangerous_drift, etc.)
  - `details`: JSON con toda la información del evento

---

## 📤 Flujo de Subida de Archivos <a name="flujo-subida"></a>

### PASO 1: Usuario Sube Archivos
**Endpoint**: `POST /api/upload/multiple`

**Archivos esperados**:
- `ESTABILIDAD_DOBACK028_20251001.txt`
- `GPS_DOBACK028_20251001.txt`
- `ROTATIVO_DOBACK028_20251001.txt`

### PASO 2: Backend Procesa Archivos
**Función**: `processFiles()` → `saveUnifiedSessionToDatabase()`

**Ubicación en código**: `backend-final.js` líneas 5101-5400

#### 2.1 Lectura de Archivos
```javascript
// Lee y parsea cada tipo de archivo
- Estabilidad: parseEstabilidadFile()
- GPS: parseGpsFile()
- Rotativo: parseRotativoFile()
```

#### 2.2 Unificación de Sesiones
```javascript
// Correlaciona datos de ESTABILIDAD + GPS + ROTATIVO por timestamp
unifiedSession = {
    sessionNumber: 1,
    startTime: Date,
    measurements: {
        estabilidad: [...],
        gps: [...],
        rotativo: [...]
    }
}
```

#### 2.3 Creación de Sesión en BD
```javascript
const dbSession = await prisma.session.create({...});
```

### PASO 3: Guardado de Mediciones + Detección de Eventos

#### 3.1 Guardar Mediciones de Estabilidad
**Líneas 5201-5321**

Para cada medición de estabilidad:

1. **Calcular flags de eventos**:
   ```javascript
   isLTRCritical = measurement.si < 30
   isDRSHigh = Math.abs(measurement.gx) > 45 && measurement.si > 70
   isLateralGForceHigh = Math.abs(measurement.ay) > 3000
   ```

2. **Buscar GPS más cercano** (< 30 segundos):
   ```javascript
   for (const gps of unifiedSession.measurements.gps) {
       const timeDiff = Math.abs(gps.timestamp - measurement.timestamp)
       if (timeDiff < minTimeDiff) {
           minTimeDiff = timeDiff
           nearestGps = gps
       }
   }
   ```

3. **Crear evento en `stability_events`** (si hay GPS válido):
   ```javascript
   if ((isLTRCritical || isDRSHigh || isLateralGForceHigh) && 
       nearestGps && minTimeDiff < 30000) {
       eventsToCreate.push({
           session_id: dbSession.id,
           timestamp: measurementTimestamp,
           lat: nearestGps.latitude,
           lon: nearestGps.longitude,
           type: eventType,  // 'rollover_risk', 'dangerous_drift', etc.
           details: { si, roll, gx, ay, ... }
       })
   }
   ```

4. **Guardar mediciones**:
   ```javascript
   await prisma.stabilityMeasurement.createMany({ data: stabilityData })
   ```

5. **Guardar eventos**:
   ```javascript
   await prisma.stability_events.createMany({ data: eventsToCreate })
   ```

#### 3.2 Guardar Mediciones GPS
**Líneas 5323-5340**
```javascript
await prisma.gpsMeasurement.createMany({ data: gpsData })
```

#### 3.3 Guardar Mediciones Rotativo
**Líneas 5342-5359**
```javascript
await prisma.rotativoMeasurement.createMany({ data: rotativoData })
```

---

## 🚨 Detección y Almacenamiento de Eventos <a name="eventos"></a>

### Catálogo de Eventos Implementado

| Evento | Condición | Tipo en BD | Severidad |
|--------|-----------|------------|-----------|
| **Riesgo de Vuelco** | `si < 30%` | `rollover_risk` | CRITICAL |
| **Vuelco Inminente** | `si < 10% Y (roll > 10 O gx > 30)` | `rollover_imminent` | CRITICAL |
| **Deriva Peligrosa** | `abs(gx) > 45 Y si > 70` | `dangerous_drift` | CRITICAL |
| **Maniobra Brusca** | `abs(ay) > 3000 mg` | `abrupt_maneuver` | HIGH |

### Estructura del Evento en BD

```javascript
{
    id: UUID,
    session_id: UUID,
    timestamp: DateTime,
    lat: 40.5213512,
    lon: -3.8838247,
    type: 'rollover_risk',
    details: {
        si: 24.5,
        roll: 12.3,
        gx: 45.6,
        ay: 3500,
        isLTRCritical: true,
        isDRSHigh: false,
        isLateralGForceHigh: false,
        gpsTimeDiff: 2  // segundos
    }
}
```

---

## 🔍 Consulta y Visualización <a name="consulta"></a>

### Endpoint de Consulta de Ruta
**Endpoint**: `GET /api/session-route/:sessionId`

**Ubicación**: `backend-final.js` líneas 825-1055

#### Proceso:

1. **Obtener sesión con mediciones**:
   ```javascript
   const session = await prisma.session.findUnique({
       include: {
           GpsMeasurement: true,
           StabilityMeasurement: true
       }
   })
   ```

2. **Filtrar GPS con validación de callejeado** (300m):
   ```javascript
   // Solo aceptar puntos GPS con distancia < 300m del anterior
   if (distance <= 300) {
       filteredRoutePoints.push(currentPoint)
   }
   ```

3. **Obtener eventos de `stability_events`**:
   ```javascript
   const stabilityEvents = await prisma.stability_events.findMany({
       where: { session_id: sessionId }
   })
   ```

4. **Devolver respuesta**:
   ```javascript
   {
       success: true,
       data: {
           session: {...},
           route: [ { lat, lng, speed, timestamp } ],
           events: [ { id, lat, lng, type, severity, details } ],
           stats: {
               validRoutePoints: 6503,
               validEvents: 156,
               skippedJumps: 1357,
               maxDistanceBetweenPoints: 300
           }
       }
   }
   ```

### Frontend: Visualización en Mapa
**Componente**: `RouteMapComponent.tsx`

#### Renderizado:
1. **Ruta azul** siguiendo calles (validada con 300m)
2. **Marcadores de inicio/fin** (🟢/🔴)
3. **Marcadores de eventos**:
   - 🚨 Riesgo de Vuelco (rojo)
   - ⚡ Deriva Peligrosa (naranja oscuro)
   - 💨 Maniobra Brusca (naranja)
4. **Popup con detalles** al hacer click

---

## ✅ Cómo Probar el Sistema <a name="pruebas"></a>

### PRUEBA COMPLETA END-TO-END

#### 1. Limpiar Base de Datos
```http
POST http://localhost:9998/api/clean-all-sessions
```

**Resultado esperado**:
```json
{
    "success": true,
    "data": {
        "deletedGps": 7860,
        "deletedStability": 98196,
        "deletedRotativo": 670,
        "deletedSessions": 14
    }
}
```

#### 2. Subir Archivos
**Ubicación**: `backend\data\CMadrid\doback028\Nueva carpeta`

**Archivos**:
- `ESTABILIDAD_DOBACK028_20251001.txt` (16.9 MB, 10 sesiones)
- `GPS_DOBACK028_20251001.txt` (618 KB, 14 sesiones)
- `ROTATIVO_DOBACK028_20251001.txt` (16 KB, 14 sesiones)

**Método**: Usar componente `FileUploadManager` en el frontend

#### 3. Verificar Logs del Backend

**Durante procesamiento**:
```
💾 Guardando 98196 mediciones de estabilidad...
✅ 98196 mediciones de estabilidad guardadas
🚨 Guardando 156 eventos de estabilidad...
✅ 156 eventos guardados en BD

💾 Guardando 7860 mediciones GPS...
✅ 7860 mediciones GPS guardadas

💾 Guardando 670 mediciones rotativo...
✅ 670 mediciones rotativo guardadas
```

#### 4. Consultar Sesión

**En el frontend**:
1. Ir a "Sesiones & Recorridos"
2. Seleccionar vehículo: DOBACK028
3. Seleccionar sesión (cualquiera de las 10-14 disponibles)

**Logs esperados**:
```
🗺️ Obteniendo datos de ruta para sesión: abc-123-xyz
🔍 Total mediciones GPS: 7860
🔍 Coordenadas válidas por rango: 7860 de 7860
⚠️ Salto GPS detectado: 654026m entre puntos
🔍 Puntos después de validación de callejeado: 6503 de 7860
⚠️ Saltos GPS filtrados: 1357
🚨 Eventos de estabilidad encontrados: 156
✅ Ruta obtenida: 6503 puntos GPS, 156 eventos
```

#### 5. Verificar Visualización

**En el mapa deberías ver**:
- ✅ Ruta azul siguiendo calles de Madrid
- ✅ Marcador verde (🟢) en inicio
- ✅ Marcador rojo (🔴) en fin
- ✅ ~156 marcadores de eventos (🚨⚡💨)
- ✅ Panel de estadísticas mostrando:
  - Puntos GPS válidos: 6503
  - Eventos: 156
  - Saltos GPS filtrados: 1357
  - Dist. máx: 300m

#### 6. Verificar Detalles de Eventos

**Click en un marcador de evento**:
```
🚨 Riesgo de Vuelco
Severidad: CRITICAL
Hora: 01/10/2025 14:13:55
Índice Estabilidad: 24.5%
Roll: 12.3°
Aceleración Lateral: 3.5 m/s²
Giro (gx): 45.6°/s
GPS correlacionado: ±2s
```

---

## 📊 Logs Esperados <a name="logs"></a>

### Durante Subida de Archivos

```
📁 Procesando archivos...
📖 Leyendo archivo estabilidad: ESTABILIDAD_DOBACK028_20251001.txt
✅ ESTABILIDAD: 10 sesiones procesadas
📖 Leyendo archivo GPS: GPS_DOBACK028_20251001.txt
✅ GPS real procesado: 40.5014025, -3.896453
✅ GPS: 14 sesiones procesadas
📖 Leyendo archivo rotativo: ROTATIVO_DOBACK028_20251001.txt
✅ ROTATIVO: 14 sesiones procesadas

🔄 Creando sesión unificada 1...
✅ Sesión 1 unificada: 4348 mediciones totales
... (repetir para sesiones 2-10)

💾 Guardando 10 sesiones unificadas...

🔍 Guardando sesión unificada: DOBACK028 - Sesión 1 - 4348 mediciones totales
✅ Sesión unificada creada en BD con ID: abc-123-xyz

💾 Guardando 4348 mediciones de estabilidad...
✅ 4348 mediciones de estabilidad guardadas
🚨 Guardando 12 eventos de estabilidad...
✅ 12 eventos guardados en BD

💾 Guardando 313 mediciones GPS...
✅ 313 mediciones GPS guardadas

💾 Guardando 30 mediciones rotativo...
✅ 30 mediciones rotativo guardadas

✅ Sesión unificada 1 guardada completamente
... (repetir para sesiones 2-10)
```

### Durante Consulta de Ruta

```
🗺️ Obteniendo datos de ruta para sesión: abc-123-xyz
🔍 Total mediciones GPS: 313
🔍 Total mediciones estabilidad: 4348
🔍 Coordenadas válidas por rango: 313 de 313
🔍 Puntos después de validación de callejeado: 295 de 313
⚠️ Saltos GPS filtrados: 18
🚨 Eventos de estabilidad encontrados: 12
✅ Ruta obtenida: 295 puntos GPS, 12 eventos
```

---

## 🎯 Verificación de Éxito

### ✅ Sistema Funcionando Correctamente Si:

1. **Backend**:
   - Archivos procesados sin errores
   - Mediciones guardadas en BD
   - Eventos creados en `stability_events`
   - Logs muestran cantidad de eventos >0

2. **Frontend**:
   - Sesiones aparecen en selector
   - Mapa muestra ruta azul
   - Marcadores de eventos visibles
   - Popups muestran detalles completos

3. **Base de Datos**:
   ```sql
   SELECT COUNT(*) FROM stability_events WHERE session_id = 'abc-123-xyz';
   -- Debería devolver >0 (ej: 12, 156, etc.)
   ```

### ❌ Problemas Comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| No se ven eventos en mapa | GPS no correlacionado | Verificar que archivos GPS y ESTABILIDAD tengan timestamps similares |
| 0 eventos guardados | Valores de `si`, `gx`, `ay` fuera de umbrales | Normal si la sesión fue estable |
| Ruta no realista | Coordenadas GPS erróneas | Validación de 300m las filtra automáticamente |
| Sesiones vacías | Archivos no procesados correctamente | Verificar formato de archivos |

---

## 🚀 Resumen del Flujo Completo

```
1. Usuario sube archivos
   ↓
2. Backend procesa y parsea archivos
   ↓
3. Backend unifica sesiones (ESTABILIDAD + GPS + ROTATIVO)
   ↓
4. Backend crea sesión en BD
   ↓
5. Para cada medición de estabilidad:
   - Calcula flags (isLTRCritical, isDRSHigh, isLateralGForceHigh)
   - Busca GPS más cercano (<30s)
   - Si hay evento + GPS válido → Crear en stability_events
   ↓
6. Guarda mediciones en BD
   ↓
7. Frontend consulta sesión
   ↓
8. Backend obtiene:
   - Mediciones GPS (filtradas por callejeado 300m)
   - Eventos de stability_events (ya con coordenadas)
   ↓
9. Frontend renderiza mapa con ruta + eventos
   ↓
10. Usuario ve:
    - Ruta realista en mapa
    - Marcadores de eventos
    - Estadísticas completas
```

---

**Fecha de Implementación**: 7 de Octubre de 2025  
**Versión**: 3.0 - Sistema Completo Revisado  
**Estado**: ✅ Implementado y Documentado

---

## 📝 Notas Adicionales

- **Umbrales configurables**: Los valores (si < 30, gx > 45, etc.) están en líneas 5211-5220 de `backend-final.js`
- **Distancia de callejeado**: 300m configurable en línea 930 de `backend-final.js`
- **Correlación GPS-Eventos**: Máximo 30 segundos de diferencia (línea 5236)
- **Tipos de eventos**: Extensibles en el código (añadir nuevos tipos en líneas 5237-5247)

