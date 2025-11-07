# 🚦 Mejoras de Límites de Velocidad con APIs Externas

## 📋 Estado Actual

### ✅ Sistema Implementado (TomTom)
- **TomTom Traffic Flow API**: Obtiene límites en tiempo real
- **Cache inteligente**: PostgreSQL con validez de 1 hora
- **Fallback a OSM**: OpenStreetMap para áreas sin cobertura
- **Configuración por defecto**: España (50/80/120 km/h)

**Código actual**: `backend/src/services/geoprocessing/TomTomSpeedLimitService.ts`

---

## 🆕 APIs Adicionales Disponibles

### 1️⃣ **Google Roads API** (Recomendado)

#### Ventajas sobre TomTom:
- ✅ **Snap to Roads**: Corrige coordenadas GPS a la carretera más cercana
- ✅ **Speed Limits**: Límites legales actualizados
- ✅ **Cobertura global**: Mejor que TomTom en zonas rurales
- ✅ **Nearest Roads**: Encuentra vías cercanas automáticamente
- ✅ **Integración con Google Maps**: Ya usamos Google OAuth

#### API Endpoints:

```typescript
// 1. Snap to Roads (Corregir GPS)
GET https://roads.googleapis.com/v1/snapToRoads
?path=lat1,lon1|lat2,lon2
&interpolate=true
&key=YOUR_API_KEY

Response:
{
  "snappedPoints": [
    {
      "location": { "latitude": 40.416775, "longitude": -3.703790 },
      "originalIndex": 0,
      "placeId": "ChIJd8BlQ2BZwokRjjR7gU1Y0WU"
    }
  ]
}

// 2. Speed Limits (Obtener límites)
GET https://roads.googleapis.com/v1/speedLimits
?placeId=ChIJd8BlQ2BZwokRjjR7gU1Y0WU
&key=YOUR_API_KEY

Response:
{
  "speedLimits": [
    {
      "placeId": "ChIJd8BlQ2BZwokRjjR7gU1Y0WU",
      "speedLimit": 50,
      "units": "KPH"
    }
  ]
}
```

#### Pricing:
- **Snap to Roads**: $0.01 por request (hasta 100 puntos)
- **Speed Limits**: $0.02 por request (hasta 100 placeIds)
- **Free tier**: $200/mes de crédito gratis

---

### 2️⃣ **HERE Maps API**

#### Ventajas:
- ✅ **Fleet Management Edition**: Diseñado para flotas
- ✅ **Speed Limits en tiempo real**
- ✅ **Truck restrictions**: Límites específicos para camiones
- ✅ **Traffic-aware routing**: Rutas considerando tráfico

#### API Endpoint:

```typescript
GET https://fleet.api.here.com/2/calculateroute.json
?waypoint0=geo!40.4169,-3.7038
&waypoint1=geo!40.4172,-3.7035
&mode=fastest;car;traffic:enabled
&app_id=YOUR_APP_ID
&app_code=YOUR_APP_CODE

Response:
{
  "response": {
    "route": [{
      "leg": [{
        "maneuver": [{
          "position": { "latitude": 40.4169, "longitude": -3.7038 },
          "instruction": "Head north",
          "speedLimit": 50
        }]
      }]
    }]
  }
}
```

#### Pricing:
- **Fleet Telematics**: $4.00 por 1,000 transacciones
- **Speed Limits**: Incluido en Fleet edition

---

### 3️⃣ **Overpass API (OpenStreetMap)** - GRATIS

#### Ventajas:
- ✅ **Totalmente gratuito**
- ✅ **Open source**
- ✅ **Datos actualizados por comunidad**
- ✅ **Sin límites de API key**

#### Desventajas:
- ⚠️ Datos menos precisos
- ⚠️ Actualizaciones lentas
- ⚠️ No siempre tiene límites de velocidad

#### API Query:

```typescript
POST https://overpass-api.de/api/interpreter

[out:json];
way(around:50,40.4169,-3.7038)[highway];
out tags;

Response:
{
  "elements": [
    {
      "type": "way",
      "id": 12345,
      "tags": {
        "highway": "residential",
        "maxspeed": "50",
        "name": "Calle Mayor"
      }
    }
  ]
}
```

---

## 🎯 Propuesta: Sistema Híbrido Multi-API

### Arquitectura Recomendada:

```
📍 Punto GPS
    ↓
┌─────────────────────────────────────────────┐
│  1️⃣ CACHE LOCAL (PostgreSQL)               │
│     • Respuesta: <10ms                      │
│     • TTL: 1 hora                           │
│     • ±100 metros                           │
└─────────────────────────────────────────────┘
    ↓ (si no hay cache)
┌─────────────────────────────────────────────┐
│  2️⃣ GOOGLE ROADS API (Snap + Speed Limit)  │
│     • Corrige GPS a vía más cercana         │
│     • Límites oficiales                     │
│     • Cobertura global                      │
└─────────────────────────────────────────────┘
    ↓ (fallback si falla)
┌─────────────────────────────────────────────┐
│  3️⃣ TOMTOM API (Traffic Flow)              │
│     • Límites en tiempo real                │
│     • Tipo de vía (FRC)                     │
│     • Ya implementado                       │
└─────────────────────────────────────────────┘
    ↓ (fallback si falla)
┌─────────────────────────────────────────────┐
│  4️⃣ OVERPASS OSM (Gratuito)                │
│     • Datos estáticos                       │
│     • Sin coste                             │
└─────────────────────────────────────────────┘
    ↓ (último recurso)
┌─────────────────────────────────────────────┐
│  5️⃣ CONFIGURACIÓN POR DEFECTO              │
│     • Urbano: 50 km/h                       │
│     • Interurbano: 80 km/h                  │
│     • Autopista: 120 km/h                   │
└─────────────────────────────────────────────┘
```

---

## 💡 Implementación Propuesta

### Código Backend:

```typescript
// backend/src/services/geoprocessing/HybridSpeedLimitService.ts

import { googleRoadsService } from './GoogleRoadsService';
import { tomTomSpeedLimitService } from './TomTomSpeedLimitService';
import { overpassService } from './OverpassService';

export class HybridSpeedLimitService {
    async getSpeedLimit(lat: number, lon: number): Promise<SpeedLimitResult> {
        // 1. Intentar cache
        const cached = await this.getFromCache(lat, lon);
        if (cached) return cached;

        // 2. Intentar Google Roads API
        try {
            const googleResult = await googleRoadsService.getSpeedLimit(lat, lon);
            if (googleResult.confidence === 'high') {
                await this.saveToCache(lat, lon, googleResult);
                return googleResult;
            }
        } catch (error) {
            logger.warn('Google Roads API falló', { error });
        }

        // 3. Intentar TomTom API
        try {
            const tomtomResult = await tomTomSpeedLimitService.getSpeedLimit(lat, lon, 'emergencia');
            if (tomtomResult.source === 'tomtom') {
                await this.saveToCache(lat, lon, tomtomResult);
                return tomtomResult;
            }
        } catch (error) {
            logger.warn('TomTom API falló', { error });
        }

        // 4. Intentar Overpass OSM (gratis)
        try {
            const osmResult = await overpassService.getSpeedLimit(lat, lon);
            if (osmResult) {
                await this.saveToCache(lat, lon, osmResult);
                return osmResult;
            }
        } catch (error) {
            logger.warn('Overpass OSM falló', { error });
        }

        // 5. Fallback por defecto
        return this.getDefaultSpeedLimit();
    }

    /**
     * Batch processing: Obtener límites para múltiples puntos de una vez
     * (Optimización para reducir costes de API)
     */
    async getBatchSpeedLimits(points: Array<{lat: number, lon: number}>): Promise<SpeedLimitResult[]> {
        // Usar Google Roads API con hasta 100 puntos por request
        const snappedPoints = await googleRoadsService.snapToRoads(points);
        const placeIds = snappedPoints.map(p => p.placeId);
        const speedLimits = await googleRoadsService.getSpeedLimits(placeIds);

        // Guardar todos en cache
        for (let i = 0; i < points.length; i++) {
            await this.saveToCache(points[i].lat, points[i].lon, speedLimits[i]);
        }

        return speedLimits;
    }
}
```

---

## 📊 Comparativa de APIs

| Característica | Google Roads | TomTom | HERE | Overpass OSM |
|----------------|--------------|--------|------|--------------|
| **Precio** | $0.02/request | $0.03/request | $4/1000 | GRATIS |
| **Precisión** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cobertura España** | Excelente | Muy buena | Excelente | Buena |
| **Snap to Roads** | ✅ | ❌ | ✅ | ❌ |
| **Tiempo real** | ✅ | ✅ | ✅ | ❌ |
| **Rate limits** | 50 req/s | 5 req/s | 10 req/s | 2 req/s |
| **Free tier** | $200/mes | $0 | $0 | Ilimitado |

---

## 🚀 Plan de Implementación

### Fase 1: Google Roads API (Semana 1)
- [ ] Crear cuenta Google Cloud Platform
- [ ] Habilitar Roads API
- [ ] Implementar `GoogleRoadsService.ts`
- [ ] Integrar en sistema híbrido
- [ ] Testing con datos reales

### Fase 2: Optimización de Cache (Semana 2)
- [ ] Implementar batch processing (100 puntos/request)
- [ ] Optimizar queries de cache PostgreSQL
- [ ] Añadir índices geoespaciales (PostGIS)
- [ ] Cron job para limpieza de cache

### Fase 3: Overpass OSM Fallback (Semana 3)
- [ ] Implementar `OverpassService.ts`
- [ ] Integrar en cascada de fallbacks
- [ ] Testing de rendimiento

### Fase 4: Dashboard y Métricas (Semana 4)
- [ ] Panel de control de APIs usadas
- [ ] Métricas de cache hit rate
- [ ] Costes por API
- [ ] Alertas de límites de API

---

## 💰 Estimación de Costes

### Escenario: 10 vehículos, 8h/día, 1 punto GPS/segundo

```
Cálculo:
- 10 vehículos × 8 horas × 3600 segundos = 288,000 puntos/día
- 288,000 puntos/día × 30 días = 8,640,000 puntos/mes

Con cache (90% hit rate):
- Requests a APIs: 8,640,000 × 0.10 = 864,000 requests/mes
- Google Roads: 864,000 × $0.02 = $17.28/mes
- TomTom fallback: 86,400 × $0.03 = $2.59/mes
- Total: ~$20/mes

Sin cache (100% API):
- Google Roads: 8,640,000 × $0.02 = $172,800/mes ❌
```

**Conclusión: El cache es CRÍTICO para rentabilidad.**

---

## ✅ Ventajas del Sistema Híbrido

1. **Redundancia**: Si una API falla, hay 3 más de respaldo
2. **Coste optimizado**: Cache reduce costes en 90%
3. **Precisión máxima**: Google Roads corrige GPS automáticamente
4. **Cobertura total**: Overpass OSM cubre áreas remotas gratis
5. **Escalabilidad**: Batch processing reduce requests

---

## 🔧 Configuración Necesaria

### Variables de Entorno:

```env
# Google Roads API
GOOGLE_ROADS_API_KEY=AIza...
GOOGLE_ROADS_ENABLED=true

# TomTom API (ya existe)
TOMTOM_API_KEY=xyz...
TOMTOM_ENABLED=true

# Overpass OSM
OVERPASS_ENABLED=true
OVERPASS_URL=https://overpass-api.de/api/interpreter

# Cache
SPEED_LIMIT_CACHE_TTL=3600 # 1 hora
SPEED_LIMIT_CACHE_RADIUS=100 # metros
```

---

## 📚 Referencias

- [Google Roads API](https://developers.google.com/maps/documentation/roads)
- [TomTom Traffic Flow](https://developer.tomtom.com/traffic-api)
- [HERE Fleet API](https://developer.here.com/documentation/fleet-telematics)
- [Overpass OSM](https://wiki.openstreetmap.org/wiki/Overpass_API)

---

**Estado**: 📋 Propuesta  
**Prioridad**: ⭐⭐⭐ Alta (mejora precisión GPS)  
**Esfuerzo estimado**: 2-3 semanas  
**ROI**: Alto (mejor detección de violaciones)

