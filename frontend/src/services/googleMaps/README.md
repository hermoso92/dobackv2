# 🗺️ Google Maps Platform - Servicios Integrados

Integración completa de Google Maps Platform APIs para DobackSoft.

## 📦 Servicios Disponibles

### 1. **Geocoding API** - Conversión de coordenadas ↔ direcciones

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Reverse Geocoding: Coordenadas → Dirección
const result = await googleMaps.geocoding.reverseGeocode(40.4168, -3.7038);
console.log(result.formattedAddress); // "Plaza Mayor, Madrid, España"
console.log(result.street); // "Plaza Mayor"
console.log(result.city); // "Madrid"

// Forward Geocoding: Dirección → Coordenadas
const location = await googleMaps.geocoding.geocode("Calle Gran Vía 1, Madrid");
console.log(location.location); // { lat: 40.4198, lng: -3.7069 }

// Obtener solo nombre de calle (optimizado para UI)
const streetName = await googleMaps.geocoding.getStreetName(40.4168, -3.7038);
console.log(streetName); // "Plaza Mayor, Madrid"

// Batch Geocoding (múltiples coordenadas)
const results = await googleMaps.geocoding.batchReverseGeocode([
    { lat: 40.4168, lng: -3.7038 },
    { lat: 40.4165, lng: -3.7037 },
]);
```

### 2. **Routes API** - Rutas optimizadas

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Calcular ruta entre dos puntos
const route = await googleMaps.routes.computeRoute({
    origin: { lat: 40.4168, lng: -3.7038 },
    destination: { lat: 40.4200, lng: -3.7000 },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
    avoidTolls: false,
    avoidHighways: false,
});

console.log(`Distancia: ${route.distanceMeters / 1000} km`);
console.log(`Duración: ${route.durationSeconds / 60} minutos`);

// Decodificar polyline a coordenadas
const points = googleMaps.routes.decodePolyline(route.polyline);

// Calcular distancia y tiempo (simplificado)
const { distance, duration } = await googleMaps.routes.getDistanceAndDuration(
    { lat: 40.4168, lng: -3.7038 },
    { lat: 40.4200, lng: -3.7000 },
    'DRIVE'
);
```

### 3. **Roads API** - Snap-to-road GPS

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Ajustar puntos GPS a carreteras reales
const gpsPoints = [
    { lat: 40.4168, lng: -3.7038 },
    { lat: 40.4170, lng: -3.7040 },
    { lat: 40.4172, lng: -3.7042 },
];

const snapped = await googleMaps.roads.snapToRoads(gpsPoints, true); // interpolate = true

// Obtener límites de velocidad
const placeIds = snapped.map(p => p.placeId);
const speedLimits = await googleMaps.roads.getSpeedLimits(placeIds);

console.log(`Límite: ${speedLimits[0].speedLimit} km/h`);

// Snap + Límites en una sola llamada
const { snappedPoints, speedLimits: limits } = await googleMaps.roads.snapWithSpeedLimits(gpsPoints);

// Calcular distancia total de ruta ajustada
const distance = googleMaps.roads.calculateRouteDistance(snappedPoints);
```

### 4. **Elevation API** - Datos de elevación

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Obtener elevación para un punto
const elevation = await googleMaps.elevation.getSingleElevation(40.4168, -3.7038);
console.log(`Altitud: ${elevation} metros`);

// Obtener perfil de elevación para una ruta
const profile = await googleMaps.elevation.getElevationProfile(gpsPoints);

console.log(`Elevación mínima: ${profile.minElevation} m`);
console.log(`Elevación máxima: ${profile.maxElevation} m`);
console.log(`Desnivel positivo: ${profile.totalGain} m`);
console.log(`Desnivel negativo: ${profile.totalLoss} m`);
console.log(`Pendiente máxima: ${profile.maxGrade}%`);

// Detectar pendientes pronunciadas (>5%)
const steepGrades = await googleMaps.elevation.detectSteepGrades(gpsPoints, 5);
steepGrades.forEach(({ location, grade, elevation }) => {
    console.log(`Pendiente de ${grade.toFixed(1)}% en ${location.lat}, ${location.lng}`);
});
```

### 5. **Places API** - Lugares y POIs

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Buscar lugares cercanos
const places = await googleMaps.places.searchNearby({
    location: { lat: 40.4168, lng: -3.7038 },
    radius: 1000, // 1 km
    types: ['restaurant', 'cafe'],
    maxResultCount: 20,
});

// Buscar por texto
const results = await googleMaps.places.searchText(
    "parkings en Madrid",
    { lat: 40.4168, lng: -3.7038 },
    5000
);

// Funciones específicas para flota
const parkings = await googleMaps.places.findNearbyParkings(
    { lat: 40.4168, lng: -3.7038 },
    1000
);

const gasStations = await googleMaps.places.findNearbyGasStations(
    { lat: 40.4168, lng: -3.7038 },
    5000
);

const repairShops = await googleMaps.places.findNearbyRepairShops(
    { lat: 40.4168, lng: -3.7038 },
    5000
);

// Obtener detalles de un lugar
const placeDetails = await googleMaps.places.getPlaceDetails(places[0].id);
console.log(placeDetails.phoneNumber);
console.log(placeDetails.websiteUri);
console.log(placeDetails.openingHours);
```

## ⚙️ Configuración

### Variables de Entorno

Añadir en `.env` o `config.env`:

```bash
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSy...tu-api-key
```

### Habilitar APIs en Google Cloud Console

1. Ir a: https://console.cloud.google.com/apis/library
2. Habilitar las siguientes APIs:
   - ✅ Maps JavaScript API
   - ✅ Routes API
   - ✅ Roads API
   - ✅ Geocoding API
   - ✅ Elevation API
   - ✅ Places API (New)

## 🔧 Características

### ✅ Rate Limiting
Cada servicio implementa rate limiting automático según los límites de Google Maps.

### ✅ Caché Inteligente
Resultados cacheados con TTL personalizado por tipo de datos:
- Geocoding: 7 días
- Routes: 1 día
- Roads: 1 día
- Elevation: 30 días (datos estáticos)
- Places: 7 días

```typescript
// Limpiar todos los caches
googleMaps.clearAllCaches();

// Limpiar caches antiguos (>24 horas)
googleMaps.cleanOldCaches(24 * 60 * 60 * 1000);
```

### ✅ Manejo de Errores
Todos los servicios tienen manejo robusto de errores con logging.

### ✅ TypeScript Completo
Tipos e interfaces completos para autocompletado IDE.

## 📊 Casos de Uso en DobackSoft

### 1. **Análisis de Rutas de Vehículos**

```typescript
// Obtener ruta real de vehículo desde puntos GPS
const snappedRoute = await googleMaps.roads.snapToRoads(gpsPoints, true);

// Calcular perfil de elevación
const elevationProfile = await googleMaps.elevation.getElevationProfile(
    snappedRoute.map(p => p.location)
);

// Detectar pendientes peligrosas
const steepGrades = await googleMaps.elevation.detectSteepGrades(
    snappedRoute.map(p => p.location),
    7 // >7% de pendiente
);
```

### 2. **Geocoding de Eventos**

```typescript
// Convertir evento GPS a dirección legible
const event = { lat: 40.4168, lng: -3.7038 };
const address = await googleMaps.geocoding.getStreetName(event.lat, event.lng);

// Mostrar en UI: "Evento en Plaza Mayor, Madrid"
```

### 3. **Detección de Infracciones de Velocidad**

```typescript
// Snap-to-road + límites de velocidad
const { snappedPoints, speedLimits } = await googleMaps.roads.snapWithSpeedLimits(
    vehicleGpsPoints
);

// Comparar velocidad real con límite
const violations = vehicleGpsPoints
    .map((point, i) => {
        const limit = speedLimits.find(l => l.placeId === snappedPoints[i]?.placeId);
        return {
            location: point,
            actualSpeed: point.speed,
            speedLimit: limit?.speedLimit,
            isViolation: point.speed > (limit?.speedLimit || Infinity),
        };
    })
    .filter(v => v.isViolation);
```

### 4. **Búsqueda de Servicios Cercanos**

```typescript
// Encontrar taller más cercano a vehículo averiado
const repairShops = await googleMaps.places.findNearbyRepairShops(
    vehicleLocation,
    10000 // 10 km
);

// Ordenar por distancia
const nearest = repairShops.sort((a, b) => {
    const distA = haversineDistance(vehicleLocation.lat, vehicleLocation.lng, a.location.lat, a.location.lng);
    const distB = haversineDistance(vehicleLocation.lat, vehicleLocation.lng, b.location.lat, b.location.lng);
    return distA - distB;
})[0];
```

## 🚀 Optimización de Rendimiento

### Batch Geocoding
Para múltiples puntos, usar batch:

```typescript
// ❌ NO HACER (lento)
for (const point of points) {
    const address = await googleMaps.geocoding.reverseGeocode(point.lat, point.lng);
}

// ✅ HACER (rápido)
const results = await googleMaps.geocoding.batchReverseGeocode(points);
```

### Cache Manual
Para puntos que no cambian:

```typescript
// Los servicios cachean automáticamente
// Pero puedes verificar si necesitas limpiar cache viejo
googleMaps.cleanOldCaches(7 * 24 * 60 * 60 * 1000); // >7 días
```

## 📝 Notas

- **API Key**: Asegúrate de restringir la API key a tus dominios en producción
- **Costos**: Google Maps cobra por uso. Revisa: https://cloud.google.com/maps-platform/pricing
- **Límites**: Respeta los límites de rate limiting para evitar errores
- **Fallbacks**: Los servicios retornan `null` o arrays vacíos en caso de error

## 🔗 Enlaces Útiles

- [Google Maps Platform Docs](https://developers.google.com/maps/documentation)
- [Routes API](https://developers.google.com/maps/documentation/routes)
- [Roads API](https://developers.google.com/maps/documentation/roads)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Elevation API](https://developers.google.com/maps/documentation/elevation)
- [Places API (New)](https://developers.google.com/maps/documentation/places/web-service/place-id)

