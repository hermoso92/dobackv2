# 🔄 Regeneración de Eventos de Estabilidad

## 📋 Resumen Ejecutivo

**Estado actual:** Los eventos de estabilidad se generan y guardan correctamente, pero les faltan campos importantes.

**Campos faltantes en BD:**
- `speed` - Velocidad en el momento del evento
- `rotativoState` - Estado del rotativo (0, 2, 5)
- `keyType` - Tipo de clave operacional (CLAVE_2, CLAVE_5)
- `interpolatedGPS` - Si las coordenadas GPS fueron interpoladas

**Solución:** Regenerar todos los eventos existentes con el nuevo código mejorado.

## ✅ Código Actualizado

### 1. Correlación con GPS y Rotativo

**Archivo:** `backend/src/services/eventDetector.ts`

```typescript
// Correlación GPS → obtiene coordenadas + velocidad
const gpsPoint = await prisma.gpsMeasurement.findFirst({
    where: { sessionId, timestamp: { gte: ..., lte: ... } }
});
if (gpsPoint) {
    evento.lat = gpsPoint.latitude;
    evento.lon = gpsPoint.longitude;
    evento.valores.velocity = gpsPoint.speed; // ✅ NUEVO
}

// Correlación Rotativo → obtiene estado de claves
const rotativoPoint = await prisma.rotativoMeasurement.findFirst({
    where: { sessionId, timestamp: { gte: ..., lte: ... } }
});
if (rotativoPoint) {
    evento.rotativo = rotativoPoint.state !== 'apagado';
    evento.rotativoState = stateMap[rotativoPoint.state]; // ✅ NUEVO
}
```

### 2. Inserción Completa en BD

```typescript
INSERT INTO stability_events (
    id, session_id, timestamp, type, severity, details,
    lat, lon, speed, rotativoState, keyType, interpolatedGPS
) VALUES (
    ...,
    ${speed},                    // ✅ Velocidad del GPS
    ${rotativoState},            // ✅ 0, 2 o 5
    ${keyType},                  // ✅ 'CLAVE_2', 'CLAVE_5' o NULL
    ${interpolatedGPS}           // ✅ true/false
)
```

## 🚀 Uso del Endpoint de Regeneración

### Método 1: PowerShell Script (RECOMENDADO)

```powershell
.\scripts\utils\regenerar-eventos-api.ps1
```

**Proceso:**
1. Verifica backend corriendo en puerto 9998
2. Pide confirmación del usuario
3. Llama al endpoint REST
4. Muestra progreso y estadísticas
5. Confirma éxito/error

### Método 2: Llamada Directa al Endpoint

```bash
curl -X POST http://localhost:9998/api/upload/regenerate-all-events
```

```powershell
Invoke-RestMethod -Uri "http://localhost:9998/api/upload/regenerate-all-events" -Method POST
```

### Método 3: Desde código TypeScript/JavaScript

```typescript
import { apiService } from './config/api';

const result = await apiService.post('/api/upload/regenerate-all-events');
console.log(result.data);
```

## 📊 Respuesta del Endpoint

```json
{
  "success": true,
  "data": {
    "totalSessions": 63,
    "eventsGenerated": 7481,
    "segmentsGenerated": 125,
    "duration": 124738,
    "errors": []
  }
}
```

## ⏱️ Tiempos Estimados

| Sesiones | Eventos | Tiempo Estimado |
|----------|---------|----------------|
| 10       | ~1,000  | ~30 segundos   |
| 50       | ~5,000  | ~2 minutos     |
| 100      | ~10,000 | ~4 minutos     |
| 500      | ~50,000 | ~20 minutos    |

**Nota:** El endpoint tiene timeout de 10 minutos configurado.

## 🔍 Verificación Post-Regeneración

### Query SQL de Verificación

```sql
-- Estadísticas generales
SELECT 
    COUNT(*) as total_eventos,
    COUNT(lat) as con_gps,
    COUNT(speed) as con_velocidad,
    COUNT("rotativoState") as con_rotativo_state,
    COUNT("keyType") as con_tipo_clave,
    COUNT(CASE WHEN "interpolatedGPS" = false THEN 1 END) as gps_real,
    COUNT(CASE WHEN "interpolatedGPS" = true THEN 1 END) as gps_interpolado
FROM stability_events;

-- Desglose por severidad
SELECT 
    severity,
    COUNT(*) as cantidad,
    ROUND(AVG(speed), 2) as velocidad_promedio,
    COUNT(CASE WHEN "rotativoState" = 2 THEN 1 END) as en_clave2,
    COUNT(CASE WHEN "rotativoState" = 5 THEN 1 END) as en_clave5
FROM stability_events
WHERE severity IS NOT NULL
GROUP BY severity
ORDER BY 
    CASE severity 
        WHEN 'GRAVE' THEN 1 
        WHEN 'MODERADA' THEN 2 
        WHEN 'LEVE' THEN 3 
    END;

-- Eventos con datos completos
SELECT 
    id, type, severity, speed, "rotativoState", "keyType",
    lat, lon, "interpolatedGPS", timestamp
FROM stability_events
WHERE speed IS NOT NULL AND "rotativoState" IS NOT NULL
ORDER BY timestamp DESC
LIMIT 20;
```

### Logs del Backend

Buscar en la consola del backend:

```
🔄 Iniciando regeneración completa de eventos...
🗑️ Eventos eliminados: 7481
📋 Regenerando eventos para 63 sesiones...
✅ Regeneración completada {
  totalSessions: 63,
  eventsGenerated: 7481,
  segmentsGenerated: 125,
  duration: 124738,
  errors: 0
}
```

### Reporte UI

En el reporte de procesamiento deberías ver:

```
📊 874 Eventos de estabilidad detectados

Primeros 10 eventos:
🔴 GRAVE - DERIVA PELIGROSA         📍 40.5345, -3.6181
🟠 MODERADA - MANIOBRA BRUSCA       📍 40.5204, -3.8871
🟡 LEVE - RIESGO VUELCO             📍 40.5432, -3.5385
... y 864 eventos más (total: 874)
```

## ⚠️ Consideraciones Importantes

### Cuándo Regenerar

Regenera eventos cuando:
- ✅ Actualizaste umbrales de detección
- ✅ Cambiaste lógica de clasificación de severidad
- ✅ Agregaste nuevos tipos de eventos
- ✅ Corregiste bugs en correlación GPS/Rotativo
- ✅ Actualizaste campos de la tabla stability_events

### Cuándo NO Regenerar

No es necesario regenerar si:
- ❌ Solo subiste nuevos archivos
- ❌ Cambiaste configuración de UI
- ❌ Modificaste otros módulos (GPS, CAN, etc.)

### Impacto

- ⚠️  **Destructivo:** Elimina eventos existentes antes de regenerar
- ⏱️  **Tiempo:** Puede tardar varios minutos con muchas sesiones
- 🔒 **Bloqueante:** No procesar archivos mientras regenera
- ✅ **Seguro:** Usa transacciones, no afecta mediciones originales

## 🛠️ Troubleshooting

### Error: "Backend no está ejecutándose"

**Solución:**
```powershell
.\iniciar.ps1
```

### Error: "Timeout"

**Causa:** Demasiadas sesiones para procesar

**Solución:** Aumentar timeout en el endpoint o regenerar por lotes

### Error: "Prisma client outdated"

**Solución:**
```powershell
cd backend
npx prisma generate
```

Luego reiniciar backend.

### Error: "Column does not exist"

**Causa:** El schema de Prisma no coincide con la BD

**Solución:**
```powershell
node scripts/utils/fix-stability-events-coords.js
```

Luego regenerar cliente de Prisma.

## 📁 Archivos Relacionados

- `backend/src/services/eventDetector.ts` - Lógica de detección y correlación
- `backend/src/services/upload/UploadPostProcessor.ts` - Post-procesamiento de sesiones
- `backend/src/routes/upload.ts` - Endpoint de regeneración
- `scripts/utils/regenerar-eventos-api.ps1` - Script de regeneración
- `prisma/schema.prisma` - Schema completo de BD
- `database/fix_stability_events_nullable_coords.sql` - Migración SQL

## 🎯 Próximos Pasos

1. ✅ **Ejecutar regeneración:**
   ```powershell
   .\scripts\utils\regenerar-eventos-api.ps1
   ```

2. ✅ **Verificar resultados:**
   - Revisar logs del backend
   - Consultar BD con queries de verificación
   - Procesar archivos de prueba y revisar reporte

3. ✅ **Validar en producción:**
   - Eventos muestran velocidad real
   - Estado del rotativo se correlaciona correctamente
   - Tipo de clave se detecta
   - GPS interpolado se marca

---

**Fecha:** 15 de Octubre de 2025  
**Estado:** ✅ Código actualizado, pendiente regeneración  
**Prioridad:** 🟡 MEDIA - Mejora, no bloqueante

