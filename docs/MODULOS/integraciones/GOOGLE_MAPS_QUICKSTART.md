# 🗺️ Google Maps Platform - Guía Rápida de Configuración

## 📋 Resumen

Se ha integrado completamente **Google Maps Platform** en DobackSoft con los siguientes servicios:

✅ **Geocoding API** - Conversión coordenadas ↔ direcciones  
✅ **Routes API** - Cálculo de rutas optimizadas  
✅ **Roads API** - Snap-to-road GPS (ajuste a carreteras)  
✅ **Elevation API** - Datos de elevación y perfiles de altitud  
✅ **Places API (New)** - Búsqueda de lugares y POIs  

---

## ⚙️ Configuración

### 1️⃣ Obtener API Key de Google Maps

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto nuevo o seleccionar uno existente
3. Ir a **APIs & Services > Credentials**
4. Clic en **Create Credentials > API Key**
5. Copiar la API Key generada

### 2️⃣ Habilitar APIs Necesarias

En [Google Cloud Console > APIs Library](https://console.cloud.google.com/apis/library), habilitar:

- ✅ **Maps JavaScript API**
- ✅ **Routes API**
- ✅ **Roads API**
- ✅ **Geocoding API**
- ✅ **Elevation API**
- ✅ **Places API (New)**

### 3️⃣ Configurar Variables de Entorno

Editar `config.env` y añadir:

```bash
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSy...tu-api-key-aqui
```

**⚠️ Importante:** En producción, restringir la API Key a tu dominio en Google Cloud Console.

### 4️⃣ Reiniciar Frontend

```powershell
# Usar el script oficial de inicio
.\iniciar.ps1
```

---

## 🚀 Uso Rápido

### Opción 1: Servicios Directos

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Geocoding: coordenadas → dirección
const address = await googleMaps.geocoding.getStreetName(40.4168, -3.7038);

// Routes: calcular ruta
const route = await googleMaps.routes.computeRoute({
    origin: { lat: 40.4168, lng: -3.7038 },
    destination: { lat: 40.4200, lng: -3.7000 },
});

// Roads: snap-to-road GPS
const snapped = await googleMaps.roads.snapToRoads(gpsPoints);

// Elevation: perfil de elevación
const profile = await googleMaps.elevation.getElevationProfile(path);

// Places: lugares cercanos
const places = await googleMaps.places.searchNearby({
    location: { lat: 40.4168, lng: -3.7038 },
    radius: 1000,
});
```

### Opción 2: React Hooks

```typescript
import {
    useGeocodingReverse,
    useRoute,
    useSnapToRoads,
    useElevationProfile,
    useNearbyPlaces,
} from '@/hooks/useGoogleMaps';

function MyComponent() {
    // Geocoding con loading y error automáticos
    const { result, loading, error } = useGeocodingReverse(lat, lng);
    
    // Route con cache
    const { route, loading: routeLoading } = useRoute(
        originLat, originLng,
        destLat, destLng
    );
    
    // Snap-to-road
    const { snappedPoints } = useSnapToRoads(gpsPoints, true);
    
    // Elevation profile
    const { profile } = useElevationProfile(path);
    
    // Nearby places
    const { places } = useNearbyPlaces(lat, lng, 1000, ['restaurant']);
    
    return (
        <div>
            {loading ? 'Cargando...' : result?.formattedAddress}
        </div>
    );
}
```

---

## 📁 Archivos Creados

### Servicios
```
frontend/src/services/googleMaps/
├── index.ts                    # Clase base y utilidades
├── geocodingService.ts         # Geocoding API
├── routesService.ts            # Routes API
├── roadsService.ts             # Roads API
├── elevationService.ts         # Elevation API
├── placesService.ts            # Places API (New)
├── googleMapsService.ts        # Exportación unificada
└── README.md                   # Documentación completa
```

### Hooks
```
frontend/src/hooks/
└── useGoogleMaps.ts            # Hooks de React
```

### Configuración
```
frontend/src/config/
└── api.ts                      # Config actualizada con Google Maps
```

### Ejemplos
```
frontend/src/components/examples/
└── GoogleMapsExample.tsx       # Componente de ejemplo
```

---

## 🎯 Casos de Uso en DobackSoft

### 1. Geocoding de Eventos de Estabilidad

```typescript
// En lugar de mostrar coordenadas, mostrar dirección legible
const event = stabilityEvents[0];
const address = await googleMaps.geocoding.getStreetName(
    event.lat_inicio,
    event.lon_inicio
);

// UI: "Evento en Calle Gran Vía 1, Madrid"
```

### 2. Análisis de Rutas con Snap-to-Road

```typescript
// Ajustar puntos GPS imprecisos a carreteras reales
const gpsPoints = sessionGPSData.map(d => ({
    lat: d.latitude,
    lng: d.longitude,
}));

const { snappedPoints, speedLimits } = await googleMaps.roads.snapWithSpeedLimits(
    gpsPoints
);

// Comparar velocidad real vs límite legal
const violations = detectSpeedViolations(snappedPoints, speedLimits);
```

### 3. Perfil de Elevación para Análisis de Estabilidad

```typescript
// Obtener perfil de elevación de la ruta
const profile = await googleMaps.elevation.getElevationProfile(routePoints);

// Detectar pendientes pronunciadas (críticas para estabilidad)
const steepGrades = await googleMaps.elevation.detectSteepGrades(
    routePoints,
    7 // >7% de pendiente
);

// Correlacionar con eventos de estabilidad
const criticalEvents = correlateEventsWithGrades(
    stabilityEvents,
    steepGrades
);
```

### 4. Búsqueda de Talleres Cercanos

```typescript
// Vehículo con alerta de mantenimiento
const vehicleLocation = { lat: 40.4168, lng: -3.7038 };

const repairShops = await googleMaps.places.findNearbyRepairShops(
    vehicleLocation,
    10000 // 10 km
);

// Mostrar taller más cercano en alerta
const nearest = repairShops.sort((a, b) => 
    calculateDistance(vehicleLocation, a.location) - 
    calculateDistance(vehicleLocation, b.location)
)[0];
```

### 5. Cálculo de Distancias Precisas

```typescript
// Calcular distancia real de sesión usando ruta por carretera
const route = await googleMaps.routes.computeRoute({
    origin: sessionStart,
    destination: sessionEnd,
    travelMode: 'DRIVE',
});

const realDistance = route.distanceMeters / 1000; // km
```

---

## 🔧 Características Implementadas

### ✅ Rate Limiting Automático
Cada servicio respeta los límites de Google Maps:
- Geocoding: 50 req/s
- Routes: 100 req/s
- Roads: 200 req/s
- Elevation: 100 req/s
- Places: 100 req/s

### ✅ Caché Inteligente
Resultados cacheados con TTL optimizado:
- Geocoding: 7 días (direcciones no cambian frecuentemente)
- Routes: 1 día (tráfico cambia)
- Roads: 1 día
- Elevation: 30 días (datos estáticos)
- Places: 7 días

```typescript
// Limpiar todos los caches
googleMaps.clearAllCaches();

// Limpiar caches antiguos (>7 días)
googleMaps.cleanOldCaches(7 * 24 * 60 * 60 * 1000);
```

### ✅ Manejo de Errores Robusto
Todos los servicios usan `logger` (no `console.log`) y retornan valores seguros:
- `null` para resultados únicos
- `[]` para arrays
- Estados de error en hooks

### ✅ TypeScript Completo
Tipos e interfaces para autocompletado IDE.

---

## 💰 Costos y Límites

### Precios (desde 1 de marzo de 2025)

Consultar precios actualizados en: https://cloud.google.com/maps-platform/pricing

**Crédito mensual gratuito:** $200 USD/mes

**Precios aproximados:**
- Geocoding: $5 por 1,000 requests
- Routes API: $5 por 1,000 requests
- Roads API: $10 por 1,000 requests
- Elevation API: $5 por 1,000 requests
- Places API: $17 por 1,000 requests

**💡 Optimización de costos:**
1. Usar caché agresivamente (ya implementado)
2. Batch geocoding para múltiples puntos
3. Limitar requests innecesarios
4. Usar rate limiting (ya implementado)

---

## 📊 Testing

### Componente de Ejemplo

Para probar la integración:

```typescript
import GoogleMapsExample from '@/components/examples/GoogleMapsExample';

// Añadir a una ruta de desarrollo/testing
<GoogleMapsExample />
```

### Test Manual desde Consola

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Test Geocoding
const address = await googleMaps.geocoding.getStreetName(40.4168, -3.7038);
console.log('Dirección:', address);

// Test Routes
const route = await googleMaps.routes.getDistanceAndDuration(
    { lat: 40.4168, lng: -3.7038 },
    { lat: 40.4200, lng: -3.7000 }
);
console.log('Distancia:', route.distance, 'metros');

// Test Places
const parkings = await googleMaps.places.findNearbyParkings(
    { lat: 40.4168, lng: -3.7038 },
    1000
);
console.log('Parkings encontrados:', parkings.length);
```

---

## 🔒 Seguridad

### Restricciones Recomendadas

En **Google Cloud Console > Credentials > API Key**:

1. **Application restrictions:**
   - Restringir a dominios web específicos
   - Producción: `https://tu-dominio.com/*`
   - Desarrollo: `http://localhost:5174/*`

2. **API restrictions:**
   - Restringir solo a las APIs habilitadas
   - No permitir acceso a todas las APIs

---

## 📚 Documentación Completa

Ver: `frontend/src/services/googleMaps/README.md`

---

## ❓ Troubleshooting

### Error: "API Key no configurada"

**Solución:** Añadir `REACT_APP_GOOGLE_MAPS_API_KEY` en `config.env` y reiniciar frontend.

### Error: "API not enabled"

**Solución:** Habilitar la API en Google Cloud Console > APIs Library.

### Error: "REQUEST_DENIED"

**Solución:** Verificar restricciones de la API Key (dominio, IPs).

### Cache desactualizado

**Solución:**
```typescript
googleMaps.clearAllCaches();
```

---

## 🎉 ¡Listo!

La integración de Google Maps Platform está completa y lista para usar en DobackSoft.

**Próximos pasos sugeridos:**
1. Configurar API Key
2. Probar con `GoogleMapsExample.tsx`
3. Integrar en módulos existentes (Estabilidad, Telemetría)
4. Monitorear costos en Google Cloud Console

