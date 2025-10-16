# 🔧 CORRECCIÓN: Campos `speed` y `rotativoState` en stability_events

## 🚨 **ERROR REPORTADO**

```
Unknown argument `speed`. Available options are marked with ?.
Unknown argument `rotativoState`. Available options are marked with ?.
```

**Contexto**:
```
🚨 Guardando 1 eventos de estabilidad...
❌ Error guardando sesión unificada: PrismaClientValidationError
```

---

## 📋 **ANÁLISIS DEL PROBLEMA**

### **Esquema Prisma** (`prisma/schema.prisma`):
```prisma
model stability_events {
  id         String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  session_id String
  timestamp  DateTime @db.Timestamptz(6)
  lat        Float
  lon        Float
  type       String
  details    Json?    // ← Solo este campo acepta datos adicionales
  Session    Session  @relation(...)
}
```

### **Código Backend** (INCORRECTO):
```javascript
eventsToCreate.push({
    session_id: dbSession.id,
    timestamp: measurementTimestamp,
    lat: nearestGps.latitude,
    lon: nearestGps.longitude,
    type: eventType,
    speed: eventSpeed,           // ❌ Campo no existe en schema
    rotativoState: rotativoState, // ❌ Campo no existe en schema
    details: {
        si: measurement.si,
        // ... otros campos
    }
});
```

**Problema**: Los campos `speed` y `rotativoState` no están definidos en el modelo `stability_events` de Prisma.

---

## ✅ **CORRECCIÓN APLICADA**

### **Corrección 1: Mover campos al JSON `details`** (Línea ~5398)

**Antes**:
```javascript
eventsToCreate.push({
    session_id: dbSession.id,
    timestamp: measurementTimestamp,
    lat: nearestGps.latitude,
    lon: nearestGps.longitude,
    type: eventType,
    speed: eventSpeed,           // ❌ Campo no existe
    rotativoState: rotativoState, // ❌ Campo no existe
    details: {
        si: measurement.si,
        // ... otros campos
    }
});
```

**Después**:
```javascript
eventsToCreate.push({
    session_id: dbSession.id,
    timestamp: measurementTimestamp,
    lat: nearestGps.latitude,
    lon: nearestGps.longitude,
    type: eventType,
    details: {
        si: measurement.si,
        roll: measurement.roll,
        pitch: measurement.pitch,
        yaw: measurement.yaw,
        ax: measurement.ax,
        ay: measurement.ay,
        az: measurement.az,
        gx: measurement.gx,
        gy: measurement.gy,
        gz: measurement.gz,
        speed: eventSpeed,           // ✅ Ahora en details JSON
        rotativoState: rotativoState, // ✅ Ahora en details JSON
        isLTRCritical,
        isDRSHigh,
        isLateralGForceHigh,
        isVuelcoInminente,
        gpsTimeDiff: Math.floor(minTimeDiff / 1000)
    }
});
```

### **Corrección 2: Actualizar endpoint de lectura** (Línea ~1044)

**Antes**:
```javascript
return {
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    severity: severity,
    lat: event.lat,
    lng: event.lon,
    speed: event.speed || 0,           // ❌ Campo no existe
    rotativoState: event.rotativoState || 0, // ❌ Campo no existe
    // Detalles del evento desde el JSON
    ...event.details,
    // ...
};
```

**Después**:
```javascript
return {
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    severity: severity,
    lat: event.lat,
    lng: event.lon,
    speed: event.details?.speed || 0,           // ✅ Extraído de details
    rotativoState: event.details?.rotativoState || 0, // ✅ Extraído de details
    // Detalles del evento desde el JSON
    ...event.details,
    // ...
};
```

---

## 📊 **ESTRUCTURA DE DATOS FINAL**

### **En Base de Datos**:
```sql
-- Tabla stability_events
{
    "id": "uuid-here",
    "session_id": "session-uuid",
    "timestamp": "2025-09-30T07:33:44.000Z",
    "lat": 40.5351463,
    "lon": -3.618084,
    "type": "rollover_risk",
    "details": {
        "si": 0.15,
        "roll": 15.2,
        "speed": 65.3,           // ← Ahora en JSON
        "rotativoState": 1,      // ← Ahora en JSON
        "isLTRCritical": true,
        "gpsTimeDiff": 2
    }
}
```

### **En Frontend**:
```javascript
// El endpoint /api/session-route/:sessionId devuelve:
{
    "id": "uuid-here",
    "timestamp": "2025-09-30T07:33:44.000Z",
    "type": "rollover_risk",
    "severity": "critical",
    "lat": 40.5351463,
    "lng": -3.618084,
    "speed": 65.3,               // ← Extraído de details
    "rotativoState": 1,          // ← Extraído de details
    "si": 0.15,
    "roll": 15.2,
    // ... resto de campos
}
```

---

## 🧪 **VALIDACIÓN**

### **Logs Esperados**:
```
🚨 Guardando 1 eventos de estabilidad...
✅ 1 eventos de estabilidad guardados
✅ Sesión unificada guardada completamente
```

### **Verificación en BD**:
```sql
SELECT 
    type,
    details->>'speed' as speed,
    details->>'rotativoState' as rotativo_state
FROM stability_events 
WHERE session_id = 'session-uuid';

-- Resultado esperado:
-- type          | speed | rotativo_state
-- --------------+-------+---------------
-- rollover_risk | 65.3  | 1
```

---

## 📁 **ARCHIVOS MODIFICADOS**

1. ✅ **`backend-final.js`** (línea ~5398):
   - Movido `speed` y `rotativoState` al campo `details` JSON
   - Actualizado endpoint de lectura para extraer desde `details`

2. ✅ **`CORRECCION_CAMPOS_EVENTOS.md`**: Este documento

---

## 🚀 **PRÓXIMOS PASOS**

1. **Re-procesar archivos** con la corrección aplicada
2. **Verificar que los eventos se guarden** correctamente
3. **Confirmar que velocidad y rotativo** aparezcan en el frontend

### **Comando**:
```powershell
# Frontend: Pestaña "Procesamiento Automático"
# 1. Limpiar Base de Datos
# 2. Iniciar Procesamiento Automático
```

---

## 📝 **NOTAS TÉCNICAS**

### **¿Por qué usar JSON `details`?**

**Ventajas**:
- ✅ **Flexibilidad**: Permite añadir campos sin modificar schema
- ✅ **Compatibilidad**: No requiere migraciones de BD
- ✅ **Escalabilidad**: Fácil añadir nuevos campos en el futuro

**Desventajas**:
- ❌ **Queries**: No se puede hacer WHERE sobre campos JSON directamente
- ❌ **Índices**: No se pueden crear índices en campos JSON específicos

**Alternativa (No Implementada)**:
Si quisiéramos campos dedicados:
```prisma
model stability_events {
  // ... campos existentes
  speed        Float?  // Campo dedicado
  rotativoState Int?   // Campo dedicado
}
```

Requeriría:
1. Migración de Prisma
2. Actualizar BD PostgreSQL
3. Migrar datos existentes

**Decisión**: Mantener en JSON para flexibilidad

---

**Fecha de Corrección**: 7 de Octubre de 2025  
**Versión**: 6.1 - Campos de Eventos Corregidos  
**Estado**: ✅ **COMPLETADO Y LISTO PARA PROCESAR**

🎯 **Ahora los eventos se guardarán correctamente con velocidad y estado rotativo en el campo JSON `details`.**
