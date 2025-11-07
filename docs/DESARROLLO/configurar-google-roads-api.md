# 🗺️ Configuración de Google Roads API - Límites de Velocidad

## 📋 Resumen

Google Roads API proporciona:
- ✅ **Snap to Roads**: Corrige coordenadas GPS a la carretera más cercana
- ✅ **Speed Limits**: Límites de velocidad oficiales y actualizados
- ✅ **Mejor cobertura** que TomTom en España
- ✅ **Batch processing**: Hasta 100 puntos por request

**Reemplaza**: TomTom API (que actualmente no funciona)

---

## 🚀 Configuración Rápida (10 minutos)

### Paso 1: Habilitar Google Roads API en Google Cloud

1. **Ir a Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **Seleccionar o crear proyecto**:
   - Si ya tienes el proyecto "DobackSoft OAuth" (del login con Google), úsalo
   - Si no, crear nuevo proyecto: "DobackSoft"

3. **Habilitar Roads API**:
   ```
   APIs & Services > Library > Buscar "Roads API" > ENABLE
   ```

4. **Crear API Key** (o usar la existente):
   ```
   APIs & Services > Credentials > CREATE CREDENTIALS > API Key
   ```

5. **Restringir API Key** (recomendado para seguridad):
   - Click en la API key creada
   - **Application restrictions**: None (o IP addresses si está en servidor)
   - **API restrictions**: 
     - ✅ Roads API
     - ✅ (Opcional) Geocoding API
   - **Save**

---

### Paso 2: Configurar Variables de Entorno

Añadir al archivo `backend/.env`:

```env
# ============================================================
# GOOGLE ROADS API - Límites de Velocidad
# ============================================================
GOOGLE_ROADS_API_KEY=AIzaSy...tu-api-key-aqui
GOOGLE_ROADS_ENABLED=true

# Opcional: Fallback a TomTom si Google falla
TOMTOM_FALLBACK_ENABLED=false
TOMTOM_API_KEY=

# Opcional: Si usas la misma key para otras APIs de Google
GOOGLE_API_KEY=AIzaSy...tu-api-key-aqui
```

**Nota**: Si configuras `GOOGLE_API_KEY`, se usará automáticamente para Roads API si `GOOGLE_ROADS_API_KEY` no está definida.

---

### Paso 3: Aplicar Migración de Base de Datos

```powershell
# Aplicar migración SQL
psql -U postgres -d dobacksoft -f database\migrations\add_google_roads_support.sql
```

Esta migración añade:
- Campo `place_id` (VARCHAR 255) - Para almacenar el placeId de Google
- Campo `source` (VARCHAR 50) - Para identificar la fuente (google, tomtom, osm, default)
- Índices optimizados para búsquedas geoespaciales

---

### Paso 4: Reiniciar Backend

```powershell
.\iniciar.ps1
```

O si solo quieres reiniciar el backend:

```powershell
cd backend
npm run dev
```

---

## ✅ Verificación

### 1. Verificar que la API Key funciona

```bash
# Test manual con curl
curl "https://roads.googleapis.com/v1/snapToRoads?path=40.4169,-3.7038&key=AIzaSy...tu-api-key"
```

**Respuesta esperada**:
```json
{
  "snappedPoints": [
    {
      "location": {
        "latitude": 40.416775,
        "longitude": -3.703790
      },
      "originalIndex": 0,
      "placeId": "ChIJd8BlQ2BZwokRjjR7gU1Y0WU"
    }
  ]
}
```

### 2. Verificar logs del backend

```powershell
# Ver logs en tiempo real
tail -f backend\logs\combined.log | grep "Google"
```

Deberías ver:
```
✅ [Google] Límite obtenido: 50 km/h (urban)
📍 [Google] Punto corregido: 40.416775,-3.703790 (placeId: ChIJ...)
💾 [Google] Guardado en caché: 50 km/h
```

### 3. Verificar datos en base de datos

```sql
-- Ver límites obtenidos de Google
SELECT 
    lat, 
    lon, 
    speed_limit, 
    road_type, 
    source, 
    place_id,
    cached_at
FROM speed_limits_cache
WHERE source = 'google'
ORDER BY cached_at DESC
LIMIT 10;
```

---

## 🧪 Testing

### Test 1: Punto GPS en Madrid (Calle Gran Vía)

```typescript
// Test manual en el código
const result = await googleRoadsService.getSpeedLimit(40.4200, -3.7037, 'emergencia');

console.log(result);
// Esperado:
// {
//   speedLimit: 50,
//   confidence: 'high',
//   source: 'google',
//   roadType: 'urban',
//   placeId: 'ChIJ...',
//   snappedLat: 40.420012,
//   snappedLon: -3.703698
// }
```

### Test 2: Batch Processing (múltiples puntos)

```typescript
const points = [
    { lat: 40.4200, lon: -3.7037 }, // Madrid
    { lat: 40.4169, lon: -3.7038 }, // Madrid
    { lat: 41.3851, lon: 2.1734 },  // Barcelona
];

const results = await googleRoadsService.getBatchSpeedLimits(points, 'emergencia');

console.log(results.length); // 3
```

---

## 💰 Costes y Optimización

### Pricing de Google Roads API

| Servicio | Precio | Gratis por mes |
|----------|--------|----------------|
| **Snap to Roads** | $0.01 por request (hasta 100 puntos) | $200 crédito |
| **Speed Limits** | $0.02 por request (hasta 100 placeIds) | $200 crédito |

### Cálculo de Costes Estimados

**Escenario**: 10 vehículos, 8h/día, 1 punto GPS/segundo

```
Sin cache:
- 10 vehículos × 8h × 3600s = 288,000 puntos/día
- 288,000 × 30 días = 8,640,000 puntos/mes
- 8,640,000 × $0.02 = $172,800/mes ❌ INVIABLE

Con cache (90% hit rate):
- API requests: 8,640,000 × 0.10 = 864,000/mes
- Batch de 100 puntos: 864,000 / 100 = 8,640 requests
- Coste: 8,640 × $0.02 = $172.80/mes ✅ VIABLE

Con cache (95% hit rate):
- API requests: 8,640,000 × 0.05 = 432,000/mes
- Batch de 100 puntos: 432,000 / 100 = 4,320 requests
- Coste: 4,320 × $0.02 = $86.40/mes ✅ ÓPTIMO

Crédito gratuito: $200/mes
Resultado: GRATIS hasta ~23 vehículos
```

**Conclusión**: El sistema de cache es CRÍTICO para mantener costes bajos.

### Optimizaciones Implementadas

1. **Cache en PostgreSQL**:
   - TTL: 1 hora
   - Búsqueda por proximidad: ±100 metros
   - Hit rate esperado: 90-95%

2. **Batch Processing**:
   - Hasta 100 puntos por request
   - Reduce costes en 100x
   - Usado en `RouteProcessorService`

3. **Fallback inteligente**:
   ```
   Google Cache (10ms) → Google API (500ms) → TomTom (si habilitado) → Default
   ```

---

## 🔧 Configuración Avanzada

### Variables de Entorno Completas

```env
# Google Roads API
GOOGLE_ROADS_API_KEY=AIzaSy...
GOOGLE_ROADS_ENABLED=true          # true/false (default: true)

# Fallback a TomTom
TOMTOM_FALLBACK_ENABLED=false      # true/false (default: false)
TOMTOM_API_KEY=                    # Solo si fallback habilitado

# Cache
SPEED_LIMIT_CACHE_TTL=3600         # Segundos (default: 3600 = 1 hora)
SPEED_LIMIT_CACHE_RADIUS=100       # Metros (default: 100)

# Batch Processing
GOOGLE_ROADS_BATCH_SIZE=100        # Puntos por request (max: 100)
GOOGLE_ROADS_TIMEOUT=5000          # Milisegundos (default: 5000)

# Rate Limiting
GOOGLE_ROADS_MAX_REQUESTS_PER_SECOND=50  # Default: 50 (límite de Google)
```

### Modo Híbrido (Google + TomTom)

Si quieres usar Google como principal y TomTom como fallback:

```env
GOOGLE_ROADS_ENABLED=true
TOMTOM_FALLBACK_ENABLED=true
TOMTOM_API_KEY=tu-tomtom-key
```

Comportamiento:
1. Intenta Google Roads API
2. Si falla → intenta TomTom API
3. Si falla → usa valores por defecto

---

## 🐛 Troubleshooting

### Error: "API key inválida o sin permisos"

**Causa**: La API key no tiene permisos para Roads API

**Solución**:
1. Ir a Google Cloud Console
2. APIs & Services > Credentials
3. Seleccionar la API key
4. En "API restrictions", asegurarse de que **Roads API** está marcada
5. Save y esperar 1-2 minutos

### Error: "Rate limit excedido"

**Causa**: Demasiadas requests en poco tiempo (límite: 50 req/s)

**Solución**:
1. Verificar que el cache está funcionando
2. Usar batch processing en lugar de requests individuales
3. Reducir frecuencia de muestreo GPS (de 1 seg a 5 seg)

### Error: "No se pudo hacer snap to road"

**Causa**: Punto GPS demasiado lejos de una carretera

**Solución**:
- Es normal en zonas sin carreteras (campo abierto, montaña)
- El sistema automáticamente usa valores por defecto
- Verificar que las coordenadas GPS son válidas

### Cache no está funcionando

```sql
-- Verificar registros en cache
SELECT COUNT(*), source, road_type
FROM speed_limits_cache
GROUP BY source, road_type;

-- Si está vacío, verificar logs:
-- "No se pudo guardar en caché" indica problema de BD
```

---

## 📊 Monitoreo

### Métricas Recomendadas

```sql
-- Hit rate del cache (últimas 24h)
SELECT 
    COUNT(*) FILTER (WHERE source = 'cache') * 100.0 / COUNT(*) as cache_hit_rate_percent
FROM speed_limits_cache
WHERE cached_at > NOW() - INTERVAL '24 hours';

-- Distribución por fuente
SELECT 
    source,
    COUNT(*) as total,
    ROUND(AVG(speed_limit), 2) as avg_speed,
    MIN(cached_at) as oldest,
    MAX(cached_at) as newest
FROM speed_limits_cache
GROUP BY source
ORDER BY total DESC;

-- Límites más comunes
SELECT 
    speed_limit,
    road_type,
    COUNT(*) as occurrences
FROM speed_limits_cache
GROUP BY speed_limit, road_type
ORDER BY occurrences DESC
LIMIT 10;
```

### Cron Job para Limpieza de Cache

```typescript
// backend/src/services/cron/cleanSpeedLimitCache.ts
import cron from 'node-cron';
import { speedLimitService } from '../geoprocessing/SpeedLimitService';

// Ejecutar cada día a las 3 AM
cron.schedule('0 3 * * *', async () => {
    logger.info('🗑️ Iniciando limpieza de cache de límites de velocidad...');
    await speedLimitService.cleanOldCache();
});
```

---

## 🔮 Próximas Mejoras

### Fase 2: Índices Geoespaciales (PostGIS)

```sql
-- Mejorar búsquedas por proximidad con índices geoespaciales
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE speed_limits_cache
ADD COLUMN geom geometry(Point, 4326);

UPDATE speed_limits_cache
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);

CREATE INDEX idx_speed_limits_cache_geom 
ON speed_limits_cache USING GIST(geom);

-- Consulta optimizada:
SELECT * FROM speed_limits_cache
WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(-3.7038, 40.4169), 4326), 0.001);
```

### Fase 3: Machine Learning para Predicción

- Predecir límites de velocidad basándose en patrones históricos
- Reducir aún más las llamadas a API
- Mejorar precisión en zonas con poca cobertura

---

## 📚 Referencias

- [Google Roads API Documentation](https://developers.google.com/maps/documentation/roads)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)
- [Roads API Rate Limits](https://developers.google.com/maps/documentation/roads/usage-and-billing)

---

**Estado**: ✅ Implementado  
**Última actualización**: 2025-11-06  
**Versión**: 1.0

