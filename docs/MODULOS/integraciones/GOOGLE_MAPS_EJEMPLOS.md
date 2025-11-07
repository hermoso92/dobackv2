# 🗺️ Google Maps Platform - Ejemplos Prácticos para DobackSoft

## 📋 Ejemplos por Módulo

### 🏠 Panel de Control (Dashboard)

#### Ejemplo 1: Geocoding de KPIs de Ubicación

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

// Mostrar última ubicación de vehículo con dirección
async function showVehicleLocation(vehicle: Vehicle) {
    const lastGPS = await getLastGPSPoint(vehicle.id);
    
    const address = await googleMaps.geocoding.getStreetName(
        lastGPS.latitude,
        lastGPS.longitude
    );
    
    return {
        vehicleId: vehicle.id,
        location: address, // "Calle Gran Vía 1, Madrid"
        coordinates: { lat: lastGPS.latitude, lng: lastGPS.longitude },
    };
}
```

#### Ejemplo 2: Distancia Total Recorrida (Precisa)

```typescript
// En lugar de Haversine simple, usar Routes API para distancia real
async function calculateRealDistance(session: Session) {
    const gpsPoints = await getSessionGPSPoints(session.id);
    
    // Snap-to-road para puntos GPS reales
    const snapped = await googleMaps.roads.snapToRoads(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude })),
        true // interpolate
    );
    
    // Calcular distancia de ruta ajustada
    const distance = googleMaps.roads.calculateRouteDistance(snapped);
    
    return {
        sessionId: session.id,
        distanceKm: (distance / 1000).toFixed(2),
        method: 'Google Roads API (snap-to-road)',
    };
}
```

---

### 📊 Estabilidad

#### Ejemplo 3: Geocoding de Eventos de Estabilidad

```typescript
import { useGeocodingReverse } from '@/hooks/useGoogleMaps';

function StabilityEventCard({ event }: { event: StabilityEvent }) {
    // Hook automático con cache
    const { result: address, loading } = useGeocodingReverse(
        event.lat_inicio,
        event.lon_inicio
    );
    
    return (
        <div className="event-card">
            <h3>{event.tipo_evento}</h3>
            <p className="severity">{event.severidad}</p>
            <p className="location">
                {loading ? 'Obteniendo ubicación...' : address?.formattedAddress}
            </p>
            <p className="time">{formatTime(event.timestamp_inicio)}</p>
        </div>
    );
}
```

#### Ejemplo 4: Detección de Pendientes Críticas

```typescript
// Correlacionar eventos de estabilidad con pendientes pronunciadas
async function analyzeStabilityWithElevation(session: Session) {
    const gpsPoints = await getSessionGPSPoints(session.id);
    const events = await getSessionStabilityEvents(session.id);
    
    // Obtener perfil de elevación
    const profile = await googleMaps.elevation.getElevationProfile(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude })),
        200 // 200 samples
    );
    
    // Detectar pendientes >7%
    const steepGrades = await googleMaps.elevation.detectSteepGrades(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude })),
        7 // >7% de pendiente
    );
    
    // Correlacionar eventos con pendientes
    const eventsInSteepGrades = events.filter(event => {
        return steepGrades.some(grade => 
            haversineDistance(
                event.lat_inicio,
                event.lon_inicio,
                grade.location.lat,
                grade.location.lng
            ) < 50 // <50 metros
        );
    });
    
    return {
        totalEvents: events.length,
        eventsInSteepGrades: eventsInSteepGrades.length,
        steepGradesCount: steepGrades.length,
        maxGrade: profile?.maxGrade,
        profile,
    };
}
```

#### Ejemplo 5: Exportar Mapa de Eventos a PDF

```typescript
import { googleMaps } from '@/services/googleMaps/googleMapsService';

async function exportStabilityMapToPDF(session: Session) {
    const events = await getSessionStabilityEvents(session.id);
    
    // Geocodificar todos los eventos en batch
    const geocoded = await googleMaps.geocoding.batchReverseGeocode(
        events.map(e => ({ lat: e.lat_inicio, lng: e.lon_inicio }))
    );
    
    // Preparar datos para PDF
    const mapData = events.map(event => {
        const key = `${event.lat_inicio.toFixed(6)},${event.lon_inicio.toFixed(6)}`;
        const address = geocoded.get(key);
        
        return {
            type: event.tipo_evento,
            severity: event.severidad,
            location: address?.formattedAddress || `${event.lat_inicio}, ${event.lon_inicio}`,
            street: address?.street,
            city: address?.city,
            timestamp: event.timestamp_inicio,
        };
    });
    
    // Generar PDF con mapa y tabla de eventos
    return generatePDFWithMap(session, mapData);
}
```

---

### 📡 Telemetría (CAN/GPS)

#### Ejemplo 6: Snap-to-Road para Rutas GPS

```typescript
import { useSnapToRoads } from '@/hooks/useGoogleMaps';

function TelemetryMap({ sessionId }: { sessionId: string }) {
    const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
    
    // Cargar puntos GPS
    useEffect(() => {
        loadGPSPoints(sessionId).then(setGpsPoints);
    }, [sessionId]);
    
    // Snap-to-road automático
    const { snappedPoints, loading } = useSnapToRoads(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude })),
        true // interpolate
    );
    
    return (
        <MapContainer>
            {loading ? (
                <div>Ajustando ruta a carreteras...</div>
            ) : (
                <>
                    {/* Línea original GPS (roja) */}
                    <Polyline
                        positions={gpsPoints.map(p => [p.latitude, p.longitude])}
                        color="red"
                        opacity={0.5}
                    />
                    
                    {/* Línea ajustada (azul) */}
                    <Polyline
                        positions={snappedPoints.map(p => [p.location.lat, p.location.lng])}
                        color="blue"
                        weight={3}
                    />
                </>
            )}
        </MapContainer>
    );
}
```

#### Ejemplo 7: Detección de Infracciones de Velocidad

```typescript
// Comparar velocidad real con límites legales
async function detectSpeedViolations(session: Session) {
    const gpsPoints = await getSessionGPSPoints(session.id);
    
    // Snap-to-road + límites de velocidad
    const { snappedPoints, speedLimits } = await googleMaps.roads.snapWithSpeedLimits(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude }))
    );
    
    // Correlacionar con velocidades reales
    const violations = gpsPoints
        .map((point, i) => {
            const snapped = snappedPoints[i];
            const limit = speedLimits.find(l => l.placeId === snapped?.placeId);
            
            return {
                timestamp: point.timestamp,
                location: { lat: point.latitude, lng: point.longitude },
                actualSpeed: point.speed_kmh,
                speedLimit: limit?.speedLimit || null,
                isViolation: limit ? point.speed_kmh > limit.speedLimit : false,
                excess: limit ? point.speed_kmh - limit.speedLimit : 0,
            };
        })
        .filter(v => v.isViolation);
    
    return {
        totalPoints: gpsPoints.length,
        violations: violations.length,
        maxExcess: Math.max(...violations.map(v => v.excess)),
        violationsList: violations,
    };
}
```

---

### 🤖 Inteligencia Artificial

#### Ejemplo 8: Análisis IA con Contexto Geográfico

```typescript
// Enriquecer análisis IA con datos geográficos
async function aiAnalysisWithGeoContext(session: Session) {
    const events = await getSessionStabilityEvents(session.id);
    const gpsPoints = await getSessionGPSPoints(session.id);
    
    // Geocodificar eventos
    const geocoded = await googleMaps.geocoding.batchReverseGeocode(
        events.map(e => ({ lat: e.lat_inicio, lng: e.lon_inicio }))
    );
    
    // Obtener perfil de elevación
    const elevationProfile = await googleMaps.elevation.getElevationProfile(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude }))
    );
    
    // Detectar zonas urbanas vs rurales
    const urbanZones = await detectUrbanZones(events, geocoded);
    
    // Prompt enriquecido para IA
    const prompt = `
    Analiza los siguientes datos de estabilidad del vehículo:
    
    Eventos: ${events.length}
    Eventos en zona urbana: ${urbanZones.urban}
    Eventos en zona rural: ${urbanZones.rural}
    
    Pendiente máxima: ${elevationProfile?.maxGrade.toFixed(1)}%
    Desnivel total: ${elevationProfile?.totalGain.toFixed(0)} m
    
    Eventos por ubicación:
    ${events.slice(0, 5).map((e, i) => {
        const key = `${e.lat_inicio.toFixed(6)},${e.lon_inicio.toFixed(6)}`;
        const addr = geocoded.get(key);
        return `- ${e.tipo_evento} en ${addr?.street || 'ubicación desconocida'}`;
    }).join('\n')}
    
    Proporciona análisis detallado considerando el contexto geográfico.
    `;
    
    return sendToAI(prompt);
}
```

---

### 🗺️ Geofences

#### Ejemplo 9: Buscar Lugares de Interés en Geocercas

```typescript
// Añadir contexto a geocercas (qué hay cerca)
async function enrichGeofence(geofence: Geofence) {
    const center = {
        lat: geofence.center_lat,
        lng: geofence.center_lng,
    };
    
    // Buscar lugares cercanos
    const [parkings, gasStations, repairShops] = await Promise.all([
        googleMaps.places.findNearbyParkings(center, geofence.radius),
        googleMaps.places.findNearbyGasStations(center, geofence.radius),
        googleMaps.places.findNearbyRepairShops(center, geofence.radius),
    ]);
    
    return {
        ...geofence,
        nearby: {
            parkings: parkings.length,
            gasStations: gasStations.length,
            repairShops: repairShops.length,
        },
        services: [
            ...parkings.map(p => ({ type: 'parking', name: p.displayName, location: p.location })),
            ...gasStations.map(g => ({ type: 'gas', name: g.displayName, location: g.location })),
            ...repairShops.map(r => ({ type: 'repair', name: r.displayName, location: r.location })),
        ],
    };
}
```

---

### 🔧 Operaciones (Alertas + Mantenimiento)

#### Ejemplo 10: Alerta con Taller Más Cercano

```typescript
// Alerta de mantenimiento con taller recomendado
async function createMaintenanceAlertWithShop(vehicle: Vehicle, alertType: string) {
    const lastLocation = await getVehicleLastLocation(vehicle.id);
    
    // Buscar talleres cercanos
    const repairShops = await googleMaps.places.findNearbyRepairShops(
        { lat: lastLocation.latitude, lng: lastLocation.longitude },
        10000 // 10 km
    );
    
    // Ordenar por distancia
    const nearest = repairShops
        .map(shop => ({
            ...shop,
            distance: haversineDistance(
                lastLocation.latitude,
                lastLocation.longitude,
                shop.location.lat,
                shop.location.lng
            ),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
    
    // Crear alerta con recomendación
    return createAlert({
        vehicleId: vehicle.id,
        type: alertType,
        location: {
            lat: lastLocation.latitude,
            lng: lastLocation.longitude,
        },
        recommendation: nearest ? {
            shopName: nearest.displayName,
            shopAddress: nearest.formattedAddress,
            shopPhone: nearest.phoneNumber,
            distance: `${(nearest.distance / 1000).toFixed(1)} km`,
            rating: nearest.rating,
        } : null,
    });
}
```

#### Ejemplo 11: Calcular Tiempo de Llegada a Destino

```typescript
// Calcular ETA para vehículo en ruta
async function calculateETA(vehicle: Vehicle, destinationLat: number, destinationLng: number) {
    const currentLocation = await getVehicleLastLocation(vehicle.id);
    
    // Calcular ruta con tráfico en tiempo real
    const route = await googleMaps.routes.computeRoute({
        origin: {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
        },
        destination: {
            lat: destinationLat,
            lng: destinationLng,
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        departureTime: new Date(), // Ahora
    });
    
    if (!route) {
        return null;
    }
    
    const etaMinutes = route.durationSeconds / 60;
    const eta = new Date(Date.now() + route.durationSeconds * 1000);
    
    return {
        vehicleId: vehicle.id,
        currentLocation: {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
        },
        destination: {
            lat: destinationLat,
            lng: destinationLng,
        },
        distanceKm: (route.distanceMeters / 1000).toFixed(1),
        durationMinutes: Math.round(etaMinutes),
        eta: eta.toISOString(),
        etaFormatted: formatDateTime(eta),
    };
}
```

---

### 📈 Reportes

#### Ejemplo 12: Reporte PDF con Mapa Enriquecido

```typescript
// Generar reporte con mapas y direcciones
async function generateEnrichedReport(session: Session) {
    const events = await getSessionStabilityEvents(session.id);
    const gpsPoints = await getSessionGPSPoints(session.id);
    
    // Snap-to-road para ruta precisa
    const snappedRoute = await googleMaps.roads.snapToRoads(
        gpsPoints.map(p => ({ lat: p.latitude, lng: p.longitude })),
        true
    );
    
    // Perfil de elevación
    const elevationProfile = await googleMaps.elevation.getElevationProfile(
        snappedRoute.map(p => p.location)
    );
    
    // Geocodificar eventos
    const geocodedEvents = await googleMaps.geocoding.batchReverseGeocode(
        events.map(e => ({ lat: e.lat_inicio, lng: e.lon_inicio }))
    );
    
    // Preparar datos para PDF
    const reportData = {
        session,
        route: {
            original: gpsPoints,
            snapped: snappedRoute,
            distanceKm: (googleMaps.roads.calculateRouteDistance(snappedRoute) / 1000).toFixed(2),
        },
        elevation: {
            min: elevationProfile?.minElevation,
            max: elevationProfile?.maxElevation,
            gain: elevationProfile?.totalGain,
            maxGrade: elevationProfile?.maxGrade,
            profile: elevationProfile?.points,
        },
        events: events.map(event => {
            const key = `${event.lat_inicio.toFixed(6)},${event.lon_inicio.toFixed(6)}`;
            const address = geocodedEvents.get(key);
            
            return {
                ...event,
                location: address?.formattedAddress,
                street: address?.street,
                city: address?.city,
            };
        }),
    };
    
    return generatePDF(reportData);
}
```

---

## 🎯 Patrones Comunes

### Pattern 1: Batch Geocoding

```typescript
// ❌ NO HACER (lento y costoso)
for (const event of events) {
    const address = await googleMaps.geocoding.reverseGeocode(event.lat, event.lng);
    event.address = address?.formattedAddress;
}

// ✅ HACER (rápido y eficiente)
const results = await googleMaps.geocoding.batchReverseGeocode(
    events.map(e => ({ lat: e.lat, lng: e.lng }))
);

events.forEach(event => {
    const key = `${event.lat.toFixed(6)},${event.lng.toFixed(6)}`;
    const address = results.get(key);
    event.address = address?.formattedAddress;
});
```

### Pattern 2: Cache Manual

```typescript
// Limpiar cache viejo periódicamente
setInterval(() => {
    googleMaps.cleanOldCaches(7 * 24 * 60 * 60 * 1000); // >7 días
}, 24 * 60 * 60 * 1000); // Cada 24 horas
```

### Pattern 3: Error Handling

```typescript
// Siempre manejar errores
try {
    const address = await googleMaps.geocoding.getStreetName(lat, lng);
    return address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // Fallback
} catch (error) {
    logger.error('Error en geocoding', { lat, lng, error });
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // Fallback
}
```

---

## 🚀 Optimizaciones

### Optimización 1: Lazy Loading de Direcciones

```typescript
// Cargar direcciones solo cuando se expande la tarjeta
function EventCard({ event }: { event: Event }) {
    const [expanded, setExpanded] = useState(false);
    
    const { result: address } = useGeocodingReverse(
        event.lat,
        event.lng,
        { enabled: expanded } // Solo geocodificar si expanded=true
    );
    
    return (
        <div onClick={() => setExpanded(!expanded)}>
            <h3>{event.type}</h3>
            {expanded && <p>{address?.formattedAddress}</p>}
        </div>
    );
}
```

### Optimización 2: Debouncing de Búsquedas

```typescript
import { useDebouncedValue } from '@/hooks/useDebounce';

function PlaceSearch() {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedValue(query, 500); // 500ms debounce
    
    const { places, loading } = usePlacesSearch(debouncedQuery);
    
    return (
        <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lugares..."
        />
    );
}
```

---

## 📝 Notas Importantes

1. **API Key:** Siempre verificar que `REACT_APP_GOOGLE_MAPS_API_KEY` está configurada
2. **Rate Limits:** Los servicios ya implementan rate limiting automático
3. **Cache:** Usar cache agresivamente para reducir costos
4. **Batch:** Preferir batch operations para múltiples puntos
5. **Fallbacks:** Siempre proporcionar valores fallback para errores

---

## 🔗 Referencias

- [Documentación Completa](../../../frontend/src/services/googleMaps/README.md)
- [Guía Rápida](./GOOGLE_MAPS_QUICKSTART.md)
- [Implementación](../../../GOOGLE_MAPS_IMPLEMENTACION_COMPLETA.md)

---

**🎉 ¡Ejemplos listos para usar en DobackSoft!**

