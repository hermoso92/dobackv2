# 🚨 Configuración de Precisión Máxima - Bomberos Madrid

## 📋 CONTEXTO

**Cliente:** Bomberos Madrid  
**Vehículos:** 6 vehículos de emergencia  
**Organización:** 1 única organización  
**Prioridad:** **PRECISIÓN MÁXIMA EN TODO**  
**Crédito Google Maps:** $200 USD/mes  

---

## 💰 PRESUPUESTO OPTIMIZADO PARA 6 VEHÍCULOS

Con solo 6 vehículos, puedes usar las APIs **SIN LÍMITES** prácticos:

### **Uso Mensual Estimado (6 vehículos activos)**

| API | Requests/día | Requests/mes | Costo/mes | Detalle |
|-----|--------------|--------------|-----------|---------|
| **Geocoding** | 50 | 1,500 | $7.50 | Cada evento geocodificado |
| **Routes** | 30 | 900 | $4.50 | Rutas de despacho |
| **Roads** | 40 | 1,200 | $12 | Snap-to-road + límites |
| **Elevation** | 30 | 900 | $4.50 | Perfiles de ruta |
| **Places** | 10 | 300 | $5.10 | Hospitales, talleres |
| **Distance Matrix** | 20 | 600 | $3 | Despacho óptimo |
| **Time Zone** | 50 | 1,500 | $7.50 | Todos los eventos |
| **Weather** | 30 | 900 | $0.45 | Correlación clima |
| **TOTAL** | **260** | **7,800** | **$44.55** | **22% del crédito** |

**Crédito restante:** $155.45/mes (77%)  
**Margen:** ✅ **ENORME** - Puedes usar las APIs 4x más sin problema

---

## 🎯 CONFIGURACIÓN DE PRECISIÓN MÁXIMA

### **1. Geocoding - Precisión de Ubicación**

```typescript
// Configuración para máxima precisión
const GEOCODING_CONFIG = {
    // Usar SIEMPRE result_type más preciso
    resultType: ['rooftop', 'range_interpolated', 'geometric_center'],
    
    // Language español para Madrid
    language: 'es',
    region: 'ES',
    
    // Cache MÁS CORTO para emergencias (datos recientes)
    cacheTTL: 24 * 60 * 60 * 1000, // 1 día (no 7)
};

// En cada emergencia
async function geocodeEmergencyLocation(lat, lng) {
    const result = await googleMaps.geocoding.reverseGeocode(lat, lng, {
        resultType: ['street_address', 'premise'],  // Máxima precisión
        locationType: ['ROOFTOP', 'RANGE_INTERPOLATED']
    });
    
    return {
        direccion: result.formattedAddress,
        calle: result.street,
        numero: result.streetNumber,
        ciudad: result.city,
        codigoPostal: result.postalCode,
        precision: result.geometry?.locationType // ROOFTOP = máxima
    };
}
```

---

### **2. Routes - Rutas de Emergencia con Tráfico en Tiempo Real**

```typescript
// Configuración para emergencias
const EMERGENCY_ROUTE_CONFIG = {
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE_OPTIMAL', // Con tráfico SIEMPRE
    departureTime: new Date(), // Ahora mismo
    avoidTolls: false,  // Emergencias pueden usar peajes
    avoidHighways: false, // Autopistas permitidas
    avoidFerries: true,
    computeAlternativeRoutes: true, // Calcular alternativas
};

// Despacho de emergencia
async function calculateEmergencyRoute(vehicleLocation, emergencyLocation) {
    const route = await googleMaps.routes.computeRoute({
        origin: vehicleLocation,
        destination: emergencyLocation,
        ...EMERGENCY_ROUTE_CONFIG
    });
    
    // Decodificar polyline para mapa
    const routePoints = googleMaps.routes.decodePolyline(route.polyline);
    
    return {
        distanciaKm: (route.distanceMeters / 1000).toFixed(2),
        duracionMin: Math.round(route.durationSeconds / 60),
        eta: new Date(Date.now() + route.durationSeconds * 1000),
        puntos: routePoints,
        warnings: route.warnings || [],
        // MUY IMPORTANTE para bomberos
        estimacionTrafico: route.legs[0]?.trafficSpeedEntry || null
    };
}
```

---

### **3. Distance Matrix - Despacho Óptimo Automático**

```typescript
// Sistema de despacho automático para 6 vehículos
async function dispatchClosestFireTruck(emergency) {
    // Obtener vehículos disponibles
    const availableVehicles = await getAvailableVehicles(); // Max 6
    
    if (availableVehicles.length === 0) {
        throw new Error('No hay vehículos disponibles');
    }
    
    // Calcular matriz de distancias CON TRÁFICO
    const closest = await googleMaps.distanceMatrix.findClosestVehicle(
        availableVehicles.map(v => ({
            id: v.id,
            location: v.currentLocation
        })),
        emergency.location,
        true // SIEMPRE con tráfico
    );
    
    // Calcular ruta detallada
    const route = await calculateEmergencyRoute(
        closest.origin,
        closest.destination
    );
    
    return {
        vehiculo: {
            id: closest.vehicleId,
            nombre: availableVehicles.find(v => v.id === closest.vehicleId)?.name,
            ubicacionActual: closest.origin
        },
        emergencia: {
            ubicacion: emergency.location,
            tipo: emergency.type,
            prioridad: emergency.priority
        },
        despacho: {
            distancia: `${(closest.distance / 1000).toFixed(2)} km`,
            duracion: `${Math.round(closest.duration / 60)} minutos`,
            eta: closest.eta.toLocaleString('es-ES'),
            confianza: 'ALTA' // Con tráfico en tiempo real
        },
        ruta: route
    };
}
```

---

### **4. Roads API - Validación de Rutas GPS**

```typescript
// Para reportes post-emergencia con precisión forense
async function validateEmergencyRoute(gpsPoints) {
    // Snap-to-road con interpolación
    const { snappedPoints, speedLimits } = await googleMaps.roads.snapWithSpeedLimits(
        gpsPoints,
        true // Interpolate para ruta completa
    );
    
    // Calcular distancia REAL (no Haversine)
    const realDistance = googleMaps.roads.calculateRouteDistance(snappedPoints);
    
    // Detectar infracciones (aunque sean emergencias, para reportes)
    const speedAnalysis = gpsPoints.map((point, i) => {
        const snapped = snappedPoints[i];
        const limit = speedLimits.find(l => l.placeId === snapped?.placeId);
        
        return {
            timestamp: point.timestamp,
            location: snapped?.location || point,
            speedActual: point.speed,
            speedLimit: limit?.speedLimit || null,
            isEmergencySpeed: point.speed > (limit?.speedLimit || 50),
            justificado: true // Siempre justificado en emergencias
        };
    });
    
    return {
        distanciaReal: (realDistance / 1000).toFixed(3) + ' km', // 3 decimales
        puntosOriginales: gpsPoints.length,
        puntosAjustados: snappedPoints.length,
        precisionMedia: calculatePrecision(gpsPoints, snappedPoints),
        analisisVelocidad: speedAnalysis
    };
}
```

---

### **5. Elevation - Análisis de Terreno**

```typescript
// Para planificación y análisis post-emergencia
async function analyzeEmergencyTerrain(route) {
    const profile = await googleMaps.elevation.getElevationProfile(route, 200); // 200 samples
    
    // Detectar pendientes críticas para vehículos pesados
    const criticalGrades = await googleMaps.elevation.detectSteepGrades(route, 5); // >5%
    
    return {
        elevacion: {
            minima: profile.minElevation.toFixed(1) + 'm',
            maxima: profile.maxElevation.toFixed(1) + 'm',
            desnivelPositivo: profile.totalGain.toFixed(1) + 'm',
            desnivelNegativo: profile.totalLoss.toFixed(1) + 'm',
            pendienteMaxima: profile.maxGrade.toFixed(2) + '%'
        },
        pendientesCriticas: criticalGrades.length,
        advertencias: criticalGrades.length > 3 ? 
            'CUIDADO: Ruta con múltiples pendientes' : 
            'Ruta sin pendientes significativas'
    };
}
```

---

### **6. Time Zone - Timestamps Precisos para Reportes**

```typescript
// TODOS los eventos con hora local precisa
async function logEmergencyEvent(event) {
    const localTime = await googleMaps.timeZone.convertToLocalTime(
        event.lat,
        event.lng,
        event.timestamp
    );
    
    return {
        eventoId: event.id,
        tipo: event.tipo,
        timestamp: {
            utc: event.timestamp.toISOString(),
            local: localTime.local.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            zonaHoraria: localTime.timeZone,
            offset: localTime.offset,
            horarioVerano: localTime.isDST
        },
        ubicacion: {
            lat: event.lat,
            lng: event.lng
        }
    };
}
```

---

### **7. Weather - Correlación con Condiciones Climáticas**

```typescript
// Para análisis de causas y reportes
async function analyzeWeatherImpact(emergencies) {
    const weatherData = await googleMaps.weather.correlateEventsWithWeather(
        emergencies.map(e => ({
            lat: e.lat,
            lng: e.lng,
            timestamp: e.timestamp
        }))
    );
    
    const analysis = emergencies.map((emergency, i) => {
        const key = `${emergency.lat.toFixed(6)},${emergency.lng.toFixed(6)},${emergency.timestamp.getTime()}`;
        const weather = weatherData.get(key);
        
        return {
            emergencia: emergency,
            clima: weather ? {
                temperatura: weather.temperature + '°C',
                precipitacion: weather.precipitation + 'mm',
                viento: weather.windSpeed + ' km/h',
                visibilidad: weather.visibility + 'm',
                condicion: weather.description,
                peligroso: googleMaps.weather.isDangerousWeather(weather)
            } : null,
            impacto: weather && googleMaps.weather.isDangerousWeather(weather) ?
                'ALTO - Condiciones adversas' :
                'BAJO - Condiciones normales'
        };
    });
    
    return analysis;
}
```

---

### **8. Places - Búsqueda de Recursos Críticos**

```typescript
// Buscar recursos cercanos en emergencias
async function findEmergencyResources(location) {
    // Búsquedas en paralelo
    const [hospitals, fireStations, policeStations, pharmacies] = await Promise.all([
        googleMaps.places.searchNearby({
            location,
            radius: 5000,
            types: ['hospital'],
            maxResultCount: 10,
            rankPreference: 'DISTANCE'
        }),
        googleMaps.places.searchNearby({
            location,
            radius: 10000,
            types: ['fire_station'],
            maxResultCount: 5,
            rankPreference: 'DISTANCE'
        }),
        googleMaps.places.searchNearby({
            location,
            radius: 5000,
            types: ['police'],
            maxResultCount: 5,
            rankPreference: 'DISTANCE'
        }),
        googleMaps.places.searchNearby({
            location,
            radius: 2000,
            types: ['pharmacy'],
            maxResultCount: 5,
            rankPreference: 'DISTANCE'
        })
    ]);
    
    return {
        hospitales: hospitals.map(h => ({
            nombre: h.displayName,
            direccion: h.formattedAddress,
            distancia: calculateDistance(location, h.location),
            telefono: h.phoneNumber,
            abierto: h.openingHours?.openNow
        })),
        parquesBomberos: fireStations.map(f => ({
            nombre: f.displayName,
            distancia: calculateDistance(location, f.location)
        })),
        comisarias: policeStations.map(p => ({
            nombre: p.displayName,
            distancia: calculateDistance(location, p.location)
        })),
        farmacias: pharmacies.filter(p => p.openingHours?.openNow).slice(0, 3)
    };
}
```

---

## 📊 REPORTES DE PRECISIÓN MÁXIMA

### **Reporte Post-Emergencia Completo**

```typescript
async function generateEmergencyReport(emergencyId) {
    const emergency = await getEmergency(emergencyId);
    const route = await getEmergencyRoute(emergencyId);
    const events = await getEmergencyEvents(emergencyId);
    
    // 1. Geocoding preciso de ubicación
    const location = await geocodeEmergencyLocation(
        emergency.lat,
        emergency.lng
    );
    
    // 2. Validación de ruta GPS
    const routeValidation = await validateEmergencyRoute(route.gpsPoints);
    
    // 3. Análisis de terreno
    const terrain = await analyzeEmergencyTerrain(route.points);
    
    // 4. Timestamps precisos
    const timeline = await Promise.all(
        events.map(e => logEmergencyEvent(e))
    );
    
    // 5. Análisis climático
    const weatherImpact = await analyzeWeatherImpact(events);
    
    // 6. Recursos utilizados
    const resources = await findEmergencyResources(emergency.location);
    
    return {
        emergencia: {
            id: emergency.id,
            tipo: emergency.type,
            prioridad: emergency.priority,
            ubicacion: location,
            coordenadasPrecisas: {
                lat: emergency.lat.toFixed(7), // 7 decimales = ~1cm
                lng: emergency.lng.toFixed(7)
            }
        },
        despacho: {
            vehiculo: emergency.assignedVehicle,
            tiempoRespuesta: calculateResponseTime(emergency),
            distanciaRecorrida: routeValidation.distanciaReal,
            velocidadMedia: calculateAverageSpeed(route),
            precisionGPS: routeValidation.precisionMedia
        },
        ruta: {
            validacion: routeValidation,
            terreno: terrain,
            warnings: route.warnings
        },
        timeline: timeline,
        clima: weatherImpact,
        recursos: resources,
        metadatos: {
            generadoEn: new Date().toISOString(),
            precision: 'MAXIMA',
            fuenteDatos: 'Google Maps Platform + GPS Bomberos Madrid',
            version: '3.0.0'
        }
    };
}
```

---

## 👥 ROLES: ADMIN Y MANAGER

### **ADMIN (Administración Completa)**

```typescript
const ADMIN_PERMISSIONS = {
    // Gestión de vehículos
    vehicles: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        assignDrivers: true
    },
    
    // Gestión de usuarios
    users: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        changeRoles: true
    },
    
    // Configuración del sistema
    system: {
        viewConfig: true,
        editConfig: true,
        viewAPIs: true,
        viewCosts: true, // Ver costos de Google Maps
        exportData: true,
        manageBackups: true
    },
    
    // Emergencias
    emergencies: {
        viewAll: true,
        dispatch: true,
        closeEmergencies: true,
        deleteEmergencies: true,
        generateReports: true
    },
    
    // Reportes
    reports: {
        viewAll: true,
        generateAll: true,
        exportPDF: true,
        shareExternal: true
    }
};
```

### **MANAGER (Gestión Operativa)**

```typescript
const MANAGER_PERMISSIONS = {
    // Gestión de vehículos (limitada)
    vehicles: {
        view: true,
        create: false,
        edit: true, // Solo estado, no eliminar
        delete: false,
        assignDrivers: true
    },
    
    // Gestión de usuarios (limitada)
    users: {
        view: true,
        create: true, // Solo DRIVER role
        edit: true, // Solo info básica
        delete: false,
        changeRoles: false
    },
    
    // Configuración del sistema (solo lectura)
    system: {
        viewConfig: true,
        editConfig: false,
        viewAPIs: false,
        viewCosts: false,
        exportData: true,
        manageBackups: false
    },
    
    // Emergencias (operativas)
    emergencies: {
        viewAll: true,
        dispatch: true,
        closeEmergencies: true,
        deleteEmergencies: false,
        generateReports: true
    },
    
    // Reportes (operativos)
    reports: {
        viewAll: true,
        generateAll: true,
        exportPDF: true,
        shareExternal: false // Solo admin puede compartir fuera
    }
};
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### **Google Maps APIs**
- [x] ✅ Geocoding con máxima precisión (ROOFTOP)
- [x] ✅ Routes con tráfico en tiempo real
- [x] ✅ Roads para validación forense de rutas
- [x] ✅ Elevation para análisis de terreno
- [x] ✅ Places para recursos de emergencia
- [x] ✅ Distance Matrix para despacho óptimo
- [x] ✅ Time Zone para timestamps precisos
- [x] ✅ Weather para correlación climática

### **Funcionalidad Bomberos**
- [ ] ⏳ Despacho automático de vehículo más cercano
- [ ] ⏳ Dashboard en tiempo real (6 vehículos)
- [ ] ⏳ Mapa con ubicación de vehículos
- [ ] ⏳ Historial de emergencias
- [ ] ⏳ Reportes post-emergencia
- [ ] ⏳ Análisis de tiempos de respuesta
- [ ] ⏳ Alertas automáticas

### **Roles y Permisos**
- [ ] ⏳ ADMIN: Acceso total al sistema
- [ ] ⏳ MANAGER: Gestión operativa
- [ ] ⏳ Restricciones por rol implementadas
- [ ] ⏳ Logs de auditoría

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### **1. Verificar Roles**
```sql
-- En PostgreSQL
SELECT email, role, "organizationId", "isActive" 
FROM "User" 
WHERE "organizationId" = 'org-001';

-- Debe haber:
-- 1 ADMIN (antoniohermoso92@manager.com)
-- Managers y Drivers según necesidad
```

### **2. Probar Despacho**
```typescript
// En consola del navegador
const emergency = {
    type: 'INCENDIO',
    priority: 'ALTA',
    location: { lat: 40.4168, lng: -3.7038 },
    description: 'Incendio en edificio'
};

const dispatch = await dispatchClosestFireTruck(emergency);
console.log(dispatch);
```

### **3. Generar Reporte de Prueba**
```typescript
const report = await generateEmergencyReport(emergencyId);
// Debe incluir: ubicación precisa, ruta validada, clima, timeline
```

---

## 💡 OPTIMIZACIONES PARA 6 VEHÍCULOS

Con solo 6 vehículos, puedes:

1. **Actualizar ubicación cada 10 segundos** (en lugar de 30s)
2. **Geocodificar TODOS los eventos** (sin límites)
3. **Validar TODAS las rutas con Roads API** (precisión forense)
4. **Generar reportes con MÁXIMO detalle** (sin restricciones)
5. **Mantener historial completo** (sin necesidad de borrar)

**Costo incluso con uso intensivo:** $80-100/mes (40-50% del crédito)  
**Margen restante:** $100-120/mes

---

## 📞 SOPORTE Y DOCUMENTACIÓN

- **Guía completa APIs:** `docs/MODULOS/integraciones/GOOGLE_MAPS_APIS_COMPLETAS.md`
- **Ejemplos prácticos:** `docs/MODULOS/integraciones/GOOGLE_MAPS_EJEMPLOS.md`
- **Testing:** `scripts/testing/test-sistema-completo.js`

---

**🚨 CONFIGURACIÓN OPTIMIZADA PARA PRECISIÓN MÁXIMA EN EMERGENCIAS**

**Bomberos Madrid - 6 Vehículos - 1 Organización**

