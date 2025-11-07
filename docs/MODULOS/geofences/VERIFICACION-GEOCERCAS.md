# Verificación de Geocercas - DobackSoft StabilSafe V3

## 📋 Estado Actual de Geocercas

### Geocercas Válidas (Según Auditoría)
✅ **Rozas** - Parque de Bomberos activo  
✅ **Alcobendas** - Parque de Bomberos activo

### Geocercas Inválidas (Pendientes de Eliminar)
❌ 4 geocercas inválidas detectadas  
⚠️ **Acción manual pendiente**: Ejecutar SQL para eliminar

## 🔧 Servicios Implementados

### 1. GeofenceService (`backend/src/services/GeofenceService.ts`)
- ✅ CRUD completo de geocercas
- ✅ Verificación de punto dentro de geocerca
- ✅ Tipos soportados: CIRCLE, POLYGON, RECTANGLE
- ✅ Algoritmos de detección implementados

### 2. RealTimeGeofenceService (`backend/src/services/RealTimeGeofenceService.ts`)
- ✅ Monitoreo en tiempo real
- ✅ Detección de entrada/salida
- ✅ Generación de eventos automáticos

### 3. GeofenceAlertService (`backend/src/services/GeofenceAlertService.ts`)
- ✅ Procesamiento de eventos de geocerca
- ✅ Generación de alertas automáticas
- ✅ Tipos de eventos: ENTER, EXIT

### 4. GeofenceDatabaseService (`backend/src/services/geofenceDatabaseService.ts`)
- ✅ Operaciones de base de datos
- ✅ Estadísticas de geocercas
- ✅ Verificación de vehículos en geocercas

## 🔗 Integración con Claves Operacionales

### Estado Actual
⚠️ **Integración parcial**: Los servicios de geocercas existen pero la integración automática con claves operacionales requiere verificación.

### Lo que SÍ está implementado:
1. **Detección de entrada/salida**: `checkVehicleInGeofences()`
2. **Eventos de geocerca**: Se registran en `GeofenceEvent`
3. **Alertas automáticas**: Se generan al entrar/salir

### Lo que necesita verificación práctica:
1. **¿Se actualiza automáticamente Clave 1 cuando el vehículo entra al parque?**
2. **¿Se detecta automáticamente Clave 2 cuando sale con rotativo?**
3. **¿Funcionan correctamente Rozas y Alcobendas como parques?**

## ✅ Checklist de Verificación Manual

### Paso 1: Verificar Geocercas Activas
```sql
-- Ejecutar en PostgreSQL
SELECT id, name, type, enabled, "organizationId"
FROM geofences
WHERE enabled = true
ORDER BY name;
```

**Resultado esperado**: Solo Rozas y Alcobendas activas

### Paso 2: Eliminar Geocercas Inválidas
```sql
-- SQL pendiente de ejecutar (manual)
-- Ver: scripts/analisis/eliminar-geocercas-invalidas.sql
```

### Paso 3: Verificar Eventos de Geocerca
```sql
-- Verificar eventos recientes
SELECT ge.id, ge.type, ge.timestamp, g.name as geocerca, v.identifier as vehiculo
FROM geofence_events ge
JOIN geofences g ON ge."geofenceId" = g.id
JOIN vehicles v ON ge."vehicleId" = v.id
WHERE ge.timestamp >= NOW() - INTERVAL '7 days'
ORDER BY ge.timestamp DESC
LIMIT 20;
```

**Esperado**: Eventos ENTER/EXIT en Rozas y Alcobendas

### Paso 4: Verificar Integración con Claves
```sql
-- Verificar segmentos operacionales cerca de geocercas
SELECT 
    oss.clave,
    oss."startTime",
    oss."endTime",
    s."vehicleId",
    v.identifier
FROM operational_state_segments oss
JOIN "Session" s ON oss."sessionId" = s.id
JOIN vehicles v ON s."vehicleId" = v.id
WHERE oss."startTime" >= NOW() - INTERVAL '7 days'
ORDER BY oss."startTime" DESC
LIMIT 20;
```

**Verificar**: ¿Clave 1 coincide con tiempos dentro del parque?

## 🧪 Pruebas Recomendadas

### Test 1: Vehículo entra al parque
1. **Acción**: Vehículo GPS muestra que entra a Rozas
2. **Esperado**: Se genera evento `ENTER` en `GeofenceEvent`
3. **Esperado**: Clave cambia a **Clave 1** (Operativo en Parque)
4. **Verificar**: Log del sistema confirma detección

### Test 2: Vehículo sale en emergencia
1. **Acción**: Vehículo sale de Rozas con rotativo ON
2. **Esperado**: Se genera evento `EXIT` en `GeofenceEvent`
3. **Esperado**: Clave cambia a **Clave 2** (Salida en Emergencia)
4. **Verificar**: Tiempo de salida registrado correctamente

### Test 3: Vehículo regresa sin rotativo
1. **Acción**: Vehículo regresa a Rozas con rotativo OFF
2. **Esperado**: Clave cambia a **Clave 5** (Regreso sin Rotativo)
3. **Esperado**: Al entrar al parque, cambia a **Clave 1**
4. **Verificar**: Evento ENTER registrado

## 📊 Endpoints para Verificación

### GET /api/geofences/stats
```bash
curl -X GET "http://localhost:9998/api/geofences/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado**: Estadísticas de Rozas y Alcobendas

### POST /api/geofences/:id/check-point
```bash
curl -X POST "http://localhost:9998/api/geofences/GEOFENCE_ID/check-point" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lon": -3.5,
    "lat": 40.5
  }'
```

**Esperado**: `isInside: true/false` según coordenadas

### GET /api/vehicles/:id/current-geofence
```bash
curl -X GET "http://localhost:9998/api/vehicles/VEHICLE_ID/current-geofence" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperado**: Geocerca actual del vehículo (si está dentro)

## 🚨 Problemas Conocidos

### 1. Geocercas Inválidas Pendientes
- **Estado**: 4 geocercas inválidas detectadas
- **Acción**: SQL manual pendiente de ejecutar
- **Prioridad**: ALTA

### 2. Integración Automática no Verificada
- **Estado**: Código existe pero no hay pruebas confirmadas
- **Acción**: Ejecutar tests manuales con datos reales
- **Prioridad**: MEDIA

### 3. Detección de Clave 1 vs Clave 5
- **Desafío**: Distinguir "llegada al parque" de "regreso al parque"
- **Solución actual**: Usar estado previo + rotativo
- **Verificar**: ¿Funciona correctamente en producción?

## 📝 Recomendaciones

### Corto Plazo (Inmediato)
1. ✅ Eliminar geocercas inválidas con SQL manual
2. ✅ Verificar que solo Rozas y Alcobendas estén activas
3. ✅ Hacer prueba manual de entrada/salida con un vehículo

### Medio Plazo (1-2 semanas)
1. ⚠️ Implementar logging detallado de transiciones de clave
2. ⚠️ Crear dashboard de monitoreo de eventos de geocerca
3. ⚠️ Agregar validación automática de geocercas válidas

### Largo Plazo (1-3 meses)
1. 🔄 Sistema automático de detección de anomalías en geocercas
2. 🔄 Machine Learning para predecir patrones de entrada/salida
3. 🔄 Integración con alertas push cuando vehículo sale del parque

## 🔍 Comandos de Debugging

### Ver eventos recientes
```typescript
// En consola del backend
const eventos = await prisma.geofenceEvent.findMany({
    where: { timestamp: { gte: new Date(Date.now() - 24*60*60*1000) } },
    include: { geofence: true, vehicle: true },
    orderBy: { timestamp: 'desc' },
    take: 10
});
console.log(eventos);
```

### Ver segmentos operacionales recientes
```typescript
const segmentos = await prisma.operationalStateSegment.findMany({
    where: { startTime: { gte: new Date(Date.now() - 24*60*60*1000) } },
    orderBy: { startTime: 'desc' },
    take: 20
});
console.log(segmentos);
```

## 📚 Referencias

- **Servicios**: `backend/src/services/GeofenceService.ts`
- **Controlador**: `backend/src/controllers/realTimeGeofenceController.ts`
- **Rutas**: `backend/src/routes/geofencesAPI.ts`
- **Claves**: `backend/src/services/keyCalculator.ts`
- **Documentación**: `docs/MODULOS/operaciones/LOGICA-TRAYECTOS.md`

---

**Última actualización**: 2025-11-05  
**Versión**: 1.0.0  
**Estado**: ⚠️ VERIFICACIÓN PENDIENTE


