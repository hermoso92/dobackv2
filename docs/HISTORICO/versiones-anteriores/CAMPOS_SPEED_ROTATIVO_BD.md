# ✅ CAMPOS `speed` y `rotativoState` AÑADIDOS A LA BASE DE DATOS

## 🎯 **PROBLEMA RESUELTO**

**Solicitud del usuario**:
> "pero esos campos son importantes para los reportes por ejemplo y se deben guardar en la bbdd"

**Solución aplicada**: ✅ **Campos dedicados en la tabla `stability_events`**

---

## 📊 **CAMBIOS EN EL ESQUEMA DE PRISMA**

### **Modelo `stability_events` Actualizado**:

```prisma
model stability_events {
  id            String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  session_id    String
  timestamp     DateTime @db.Timestamptz(6)
  lat           Float
  lon           Float
  type          String
  speed         Float?   // ✅ NUEVO: Velocidad en km/h del evento
  rotativoState Int?     // ✅ NUEVO: Estado del rotativo (0=apagado, 1=encendido, 2=clave2, 5=clave5)
  details       Json?
  Session       Session  @relation(fields: [session_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_session")

  @@index([session_id], map: "idx_stability_events_session")
  @@index([session_id, timestamp(sort: Desc)], map: "idx_stability_events_session_time")
  @@index([timestamp], map: "idx_stability_events_time")
  @@index([type], map: "idx_stability_events_type")
  @@index([speed], map: "idx_stability_events_speed")           // ✅ NUEVO: Índice para consultas por velocidad
  @@index([rotativoState], map: "idx_stability_events_rotativo") // ✅ NUEVO: Índice para consultas por estado rotativo
  @@index([session_id], map: "stability_events_session_idx")
  @@index([timestamp], map: "stability_events_time_idx")
}
```

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS**

### **Tabla `stability_events`**:
```sql
-- Columnas existentes:
id         | text (PK)
session_id | text (FK)
timestamp  | timestamptz
lat        | real
lon        | real
type       | text
details    | jsonb

-- ✅ NUEVAS COLUMNAS:
speed         | real    -- Velocidad en km/h (NULLABLE)
rotativoState | integer -- Estado rotativo (NULLABLE)

-- ✅ NUEVOS ÍNDICES:
idx_stability_events_speed     -- Para consultas por velocidad
idx_stability_events_rotativo  -- Para consultas por estado rotativo
```

---

## 💾 **GUARDADO DE DATOS EN BACKEND**

### **Código Backend** (`backend-final.js`):
```javascript
eventsToCreate.push({
    session_id: dbSession.id,
    timestamp: measurementTimestamp,
    lat: nearestGps.latitude,
    lon: nearestGps.longitude,
    type: eventType,
    speed: eventSpeed,           // ✅ Campo directo en BD
    rotativoState: rotativoState, // ✅ Campo directo en BD
    details: {
        si: measurement.si,
        roll: measurement.roll,
        // ... otros datos técnicos
        isLTRCritical,
        isDRSHigh,
        isLateralGForceHigh,
        isVuelcoInminente,
        gpsTimeDiff: Math.floor(minTimeDiff / 1000)
    }
});
```

---

## 📈 **VENTAJAS PARA REPORTES**

### **1. Consultas Optimizadas**:
```sql
-- Eventos por velocidad (usando índice)
SELECT COUNT(*) FROM stability_events 
WHERE speed > 80;

-- Eventos por estado rotativo (usando índice)
SELECT type, COUNT(*) FROM stability_events 
WHERE rotativoState = 1 
GROUP BY type;

-- Eventos críticos con rotativo encendido
SELECT * FROM stability_events 
WHERE type IN ('rollover_risk', 'dangerous_drift') 
  AND rotativoState = 1 
  AND speed > 50;
```

### **2. Agregaciones Rápidas**:
```sql
-- Velocidad promedio por tipo de evento
SELECT type, AVG(speed) as avg_speed 
FROM stability_events 
WHERE speed IS NOT NULL 
GROUP BY type;

-- Distribución de eventos por estado rotativo
SELECT 
    CASE 
        WHEN rotativoState = 0 THEN 'Apagado'
        WHEN rotativoState = 1 THEN 'Encendido'
        WHEN rotativoState = 2 THEN 'Clave 2'
        WHEN rotativoState = 5 THEN 'Clave 5'
        ELSE 'Desconocido'
    END as estado_rotativo,
    COUNT(*) as total_eventos
FROM stability_events 
GROUP BY rotativoState;
```

### **3. Reportes Específicos**:
```sql
-- Eventos de velocidad con rotativo
SELECT 
    DATE(timestamp) as fecha,
    COUNT(*) as eventos_velocidad,
    AVG(speed) as velocidad_promedio,
    COUNT(CASE WHEN rotativoState > 0 THEN 1 END) as con_rotativo
FROM stability_events 
WHERE speed > 60 
GROUP BY DATE(timestamp)
ORDER BY fecha;

-- Análisis de correlación velocidad-rotativo
SELECT 
    speed_range,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN rotativoState > 0 THEN 1 END) as con_rotativo,
    ROUND(COUNT(CASE WHEN rotativoState > 0 THEN 1 END) * 100.0 / COUNT(*), 2) as porcentaje_rotativo
FROM (
    SELECT 
        CASE 
            WHEN speed <= 30 THEN '0-30 km/h'
            WHEN speed <= 60 THEN '31-60 km/h'
            WHEN speed <= 90 THEN '61-90 km/h'
            ELSE '90+ km/h'
        END as speed_range,
        rotativoState
    FROM stability_events 
    WHERE speed IS NOT NULL
) subq
GROUP BY speed_range;
```

---

## 🔍 **VALIDACIÓN EN FRONTEND**

### **Endpoint `/api/session-route/:sessionId`**:
```javascript
return {
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    severity: severity,
    lat: event.lat,
    lng: event.lon,
    speed: event.speed || 0,           // ✅ Campo directo desde BD
    rotativoState: event.rotativoState || 0, // ✅ Campo directo desde BD
    // Detalles del evento desde el JSON
    ...event.details,
    // ...
};
```

### **Popup en Mapa**:
```html
<!-- Velocidad -->
<div style="background: #4caf5020; padding: 8px; border-radius: 4px;">
    <div>VELOCIDAD</div>
    <div style="font-size: 18px; font-weight: bold;">
        65.3 km/h
    </div>
</div>

<!-- Estado Rotativo -->
<div style="background: #4caf5020; padding: 8px; border-radius: 4px;">
    <div>ROTATIVO</div>
    <div style="font-size: 18px; font-weight: bold;">
        🔴 ENCENDIDO
    </div>
</div>
```

---

## 🚀 **COMANDOS EJECUTADOS**

### **1. Actualización del Esquema**:
```bash
# Modificado: prisma/schema.prisma
# - Añadidos campos speed y rotativoState
# - Añadidos índices para optimización
```

### **2. Aplicación a Base de Datos**:
```bash
npx prisma db push
# ✅ Your database is now in sync with your Prisma schema. Done in 210ms
# ✅ Generated Prisma Client (v6.16.2)
```

### **3. Actualización del Backend**:
```bash
# Modificado: backend-final.js
# - Revertido uso de campos directos en lugar de JSON
# - Actualizado endpoint de lectura
```

---

## 📊 **EJEMPLO DE DATOS EN BD**

### **Registro de Evento**:
```json
{
    "id": "uuid-here",
    "session_id": "session-uuid",
    "timestamp": "2025-09-30T07:33:44.000Z",
    "lat": 40.5351463,
    "lon": -3.618084,
    "type": "rollover_risk",
    "speed": 65.3,              // ✅ Campo dedicado
    "rotativoState": 1,         // ✅ Campo dedicado
    "details": {
        "si": 0.15,
        "roll": 15.2,
        "isLTRCritical": true,
        "gpsTimeDiff": 2
    }
}
```

---

## 🎯 **BENEFICIOS PARA REPORTES**

### **✅ Ventajas**:
1. **Consultas rápidas**: Índices dedicados para `speed` y `rotativoState`
2. **Agregaciones eficientes**: SUM, AVG, COUNT sobre campos nativos
3. **Filtros optimizados**: WHERE clauses sin parsing JSON
4. **Joins simples**: Relaciones directas sin JSON operations
5. **Reportes complejos**: Análisis multi-dimensional fácil

### **📈 Casos de Uso**:
- **Reporte de velocidad**: Eventos por rangos de velocidad
- **Análisis rotativo**: Correlación entre eventos y estado del rotativo
- **KPIs avanzados**: Métricas combinando velocidad + rotativo + tipo de evento
- **Dashboards**: Visualizaciones en tiempo real con datos estructurados

---

## 📁 **ARCHIVOS MODIFICADOS**

1. ✅ **`prisma/schema.prisma`**:
   - Añadidos campos `speed` y `rotativoState`
   - Añadidos índices para optimización

2. ✅ **`backend-final.js`**:
   - Revertido uso de campos directos
   - Actualizado endpoint de lectura

3. ✅ **`CAMPOS_SPEED_ROTATIVO_BD.md`**: Este documento

---

**Fecha de Implementación**: 7 de Octubre de 2025  
**Versión**: 6.2 - Campos Speed y Rotativo en BD  
**Estado**: ✅ **COMPLETADO Y SINCRONIZADO CON BD**

🎯 **Los campos `speed` y `rotativoState` ahora están disponibles como columnas dedicadas en la base de datos, optimizadas para reportes y consultas avanzadas.**
