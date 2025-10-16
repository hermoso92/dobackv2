# 📂 Archivos Responsables: Sesiones, Filtros, Rutas y Eventos

## 🎯 ARCHIVOS PRINCIPALES

### 1. PESTAÑA DE SESIONES
```
frontend/src/components/sessions/SessionsAndRoutesView.tsx          ⭐ PRINCIPAL
frontend/src/components/selectors/VehicleSessionSelector.tsx        ⭐ SELECTORES
frontend/src/components/maps/RouteMapComponent.tsx                  ⭐ MAPA
frontend/src/hooks/useTelemetryData.ts                              ⭐ DATOS
```

### 2. SISTEMA DE FILTROS
```
frontend/src/components/filters/GlobalFiltersBar.tsx                ⭐ BARRA FILTROS
frontend/src/components/filters/FilteredPageWrapper.tsx             Wrapper
frontend/src/hooks/useGlobalFilters.ts                              ⭐ LÓGICA FILTROS
```

### 3. DASHBOARD PRINCIPAL
```
frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx            ⭐ DASHBOARD
```

---

## 📋 FUNCIONALIDAD POR ARCHIVO

### `SessionsAndRoutesView.tsx` (Componente Principal Sesiones)
**Responsabilidades:**
- ✅ Renderiza la pestaña completa de sesiones
- ✅ Gestiona estado de vehículo seleccionado
- ✅ Gestiona estado de sesión seleccionada
- ✅ Carga datos de ruta desde API
- ✅ Integra VehicleSessionSelector
- ✅ Integra RouteMapComponent
- ✅ Procesa sesiones del hook useSessions()

**Estados Principales:**
```typescript
const [sessions, setSessions] = useState<Session[]>([]);
const [selectedSession, setSelectedSession] = useState<Session | null>(null);
const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
const [selectedSessionId, setSelectedSessionId] = useState<string>('');
const [routeData, setRouteData] = useState<RouteData | null>(null);
```

**Flujo de Datos:**
1. Usuario selecciona vehículo → `setSelectedVehicleId()`
2. `useSessions({ vehicleId })` carga sesiones del vehículo
3. Usuario selecciona sesión → `setSelectedSessionId()`
4. `loadRouteData()` carga puntos GPS de la sesión
5. `RouteMapComponent` renderiza el mapa con la ruta

---

### `VehicleSessionSelector.tsx` (Selectores)
**Responsabilidades:**
- ✅ Dropdown de vehículos
- ✅ Dropdown de sesiones (filtradas por vehículo)
- ✅ Carga vehículos desde `/api/vehicles`
- ✅ Carga sesiones desde `/api/sessions?vehicleId={id}`
- ✅ Filtra sesiones con puntos GPS (pointsCount > 0)

**Props:**
```typescript
interface Props {
    selectedVehicleId: string;
    selectedSessionId: string;
    onVehicleChange: (vehicleId: string) => void;
    onSessionChange: (sessionId: string) => void;
    showSessionSelector?: boolean;
}
```

---

### `RouteMapComponent.tsx` (Mapa de Rutas)
**Responsabilidades:**
- ✅ Inicializa mapa Leaflet
- ✅ Dibuja polyline de la ruta GPS
- ✅ Añade marcador de inicio (verde)
- ✅ Añade marcador de fin (rojo)
- ✅ Renderiza eventos de estabilidad
- ✅ Ajusta vista automáticamente (fitBounds)
- ✅ Tiles de OpenStreetMap

**Props:**
```typescript
interface RouteMapComponentProps {
    center: [number, number];
    zoom: number;
    height: string;
    route: Array<{
        lat: number;
        lng: number;
        speed: number;
        timestamp: Date;
    }>;
    events: Array<{
        id: string;
        lat: number;
        lng: number;
        type: string;
        severity: string;
        timestamp: Date;
    }>;
    vehicleName: string;
}
```

---

### `GlobalFiltersBar.tsx` (Barra de Filtros)
**Responsabilidades:**
- ✅ Selector múltiple de vehículos
- ✅ DatePicker de fecha inicio
- ✅ DatePicker de fecha fin
- ✅ Selector de parque de bomberos
- ✅ Selector de severidad
- ✅ Selector de tipos de vía
- ✅ Botón "Guardar Preset"
- ✅ Botón "Aplicar Filtros"
- ✅ Chips de filtros activos

**Filtros Disponibles:**
```typescript
interface Filters {
    vehicles: string[];          // IDs de vehículos
    startDate: Date | null;      // Fecha inicio
    endDate: Date | null;        // Fecha fin
    severity: string[];          // ['critical', 'high', 'medium', 'low']
    roadType: string[];          // ['autopista', 'urbana', 'rural', 'túnel']
    park: string | null;         // ID del parque
}
```

---

### `useGlobalFilters.ts` (Hook de Filtros)
**Responsabilidades:**
- ✅ Gestiona estado global de filtros
- ✅ Carga vehículos desde `/api/dashboard/vehicles`
- ✅ Carga parques desde `/api/parks`
- ✅ Carga tipos de vía desde `/api/road-types`
- ✅ Persiste filtros en localStorage
- ✅ Carga/guarda presets de filtros
- ✅ Proporciona funciones de actualización

**API del Hook:**
```typescript
const {
    filters,                    // Estado actual de filtros
    vehicles,                   // Lista de vehículos
    fireStations,              // Lista de parques
    roadTypes,                 // Tipos de vía
    presets,                   // Presets guardados
    updateFilters,             // (partial: Partial<Filters>) => void
    clearFilters,              // () => void
    createPreset,              // (name: string, filters: Filters) => void
    loadPreset,                // (presetId: string) => void
    deletePreset,              // (presetId: string) => void
    selectFireStation          // (stationId: string) => void
} = useGlobalFilters();
```

---

### `useTelemetryData.ts` (Hook de Telemetría)
**Responsabilidades:**
- ✅ Proporciona `useSessions()` para obtener sesiones
- ✅ Proporciona `useSessionDetails()` para detalles
- ✅ Proporciona `useGPSData()` para puntos GPS
- ✅ React Query para caché y optimización
- ✅ Conecta con endpoints de telemetría

**API del Hook:**
```typescript
const { useSessions, useSessionDetails, useGPSData } = useTelemetryData();

// Usar sesiones
const { 
    data: sessions,        // Array de sesiones
    isLoading,            // Cargando
    error,                // Error
    refetch               // Refrescar
} = useSessions({ 
    vehicleId: '...',     // Opcional
    limit: 20             // Opcional
});

// Detalles de sesión
const { data: sessionDetails } = useSessionDetails(sessionId);

// Puntos GPS
const { data: gpsPoints } = useGPSData(sessionId);
```

---

## 🔄 FLUJO COMPLETO DE DATOS

### Flujo: Usuario selecciona sesión y ve ruta

```
1. Usuario abre Dashboard
   ↓
2. NewExecutiveKPIDashboard renderiza
   ↓
3. Usuario hace clic en Tab 3 "Sesiones y Rutas"
   ↓
4. SessionsAndRoutesView se monta
   ↓
5. useSessions() carga todas las sesiones (sin filtro)
   ↓
6. VehicleSessionSelector muestra dropdowns
   ↓
7. Usuario selecciona vehículo "BRP ALCOBENDAS"
   ↓
8. setSelectedVehicleId('0d0c4f74-...')
   ↓
9. useSessions({ vehicleId: '0d0c4f74-...' }) recarga
   ↓
10. VehicleSessionSelector carga sesiones del vehículo
    GET /api/sessions?vehicleId=0d0c4f74-...&limit=20
    ↓
11. Filtra sesiones con pointsCount > 0
    ↓
12. Usuario selecciona sesión "3/10/2025 9:47-12:43"
    ↓
13. setSelectedSessionId('5e6122c1-...')
    ↓
14. useEffect detecta cambio de selectedSessionId
    ↓
15. loadRouteData() ejecuta:
    GET /api/sessions/5e6122c1-.../points
    ↓
16. Backend (TelemetryV2Controller) retorna:
    {
      success: true,
      data: [
        { id, latitude, longitude, speed, timestamp, ... },
        { ... },
        ... (145 puntos)
      ]
    }
    ↓
17. Frontend procesa respuesta:
    setRouteData({
      route: [...145 puntos...],
      events: [],
      session: { vehicleName, startTime, endTime },
      stats: { validRoutePoints: 145, ... }
    })
    ↓
18. RouteMapComponent recibe routeData
    ↓
19. useEffect en RouteMapComponent ejecuta:
    - Limpia mapa anterior
    - Crea nuevo mapa Leaflet
    - Añade tiles de OpenStreetMap
    - Dibuja polyline con 145 puntos
    - Añade marcador verde (inicio)
    - Añade marcador rojo (fin)
    - Ajusta vista con fitBounds()
    ↓
20. Usuario ve el mapa con la ruta completa ✅
```

---

## 🛠️ ENDPOINTS BACKEND UTILIZADOS

### Sesiones y Rutas
```
GET /api/sessions                           # Todas las sesiones
GET /api/sessions?vehicleId={id}           # Sesiones de un vehículo
GET /api/sessions?vehicleId={id}&limit=20  # Con límite
GET /api/sessions/:id                       # Detalles de sesión
GET /api/sessions/:id/points                # Puntos GPS de sesión
```

### Vehículos
```
GET /api/dashboard/vehicles                 # Vehículos con estadísticas
GET /api/vehicles                           # Lista simple de vehículos
```

### Filtros
```
GET /api/parks                              # Parques de bomberos
GET /api/road-types                         # Tipos de vía
```

### Eventos
```
GET /api/stability-events                   # Eventos de estabilidad
GET /api/hotspots/critical-points           # Puntos críticos
GET /api/hotspots/ranking                   # Ranking de zonas
GET /api/speed/violations                   # Excesos de velocidad
GET /api/speed/critical-zones               # Zonas críticas velocidad
```

### KPIs y Dashboard
```
GET /api/kpi/dashboard                      # KPIs del dashboard
GET /api/dashboard/stats                    # Estadísticas generales
```

---

## 🎨 ESTRUCTURA DE COMPONENTES

```
NewExecutiveKPIDashboard
├── GlobalFiltersBar (filtros globales)
├── Tab 0: Estados y Tiempos
├── Tab 1: BlackSpotsTab
├── Tab 2: SpeedAnalysisTab
├── Tab 3: SessionsAndRoutesView ⭐
│   ├── VehicleSessionSelector
│   │   ├── Select Vehículo
│   │   └── Select Sesión
│   └── Card con RouteMapComponent
│       ├── Mapa Leaflet
│       ├── Tiles OpenStreetMap
│       ├── Polyline de ruta
│       ├── Marcadores inicio/fin
│       └── Eventos de estabilidad
├── Tab 4: AlertSystemManager
├── Tab 5: ProcessingTrackingDashboard
└── Tab 6: DashboardReportsTab
```

---

## 📦 DEPENDENCIAS CLAVE

### Librerías de Mapas
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0"
}
```

### Gestión de Estado
```json
{
  "@tanstack/react-query": "React Query para caché",
  "zustand": "Estado global (si se usa)"
}
```

### UI
```json
{
  "@mui/material": "^7.0.2",
  "@mui/icons-material": "^7.0.2",
  "@mui/x-date-pickers": "DatePickers"
}
```

---

## 🔧 MODIFICAR COMPORTAMIENTO

### Para añadir un nuevo filtro:
1. Actualizar `useGlobalFilters.ts` → añadir propiedad a `Filters`
2. Actualizar `GlobalFiltersBar.tsx` → añadir selector UI
3. Actualizar backend endpoints para soportar nuevo filtro

### Para cambiar cómo se muestran las sesiones:
1. Modificar `VehicleSessionSelector.tsx` → cambiar formato de display
2. Modificar `SessionsAndRoutesView.tsx` → cambiar procesamiento

### Para personalizar el mapa:
1. Modificar `RouteMapComponent.tsx` → cambiar estilos, colores, iconos
2. Cambiar tiles: modificar URL en `L.tileLayer()`

---

## 📊 ARCHIVOS BACKEND CORRESPONDIENTES

```
backend/src/controllers/TelemetryV2Controller.ts    # Sesiones y puntos GPS
backend/src/controllers/vehiclesController.ts       # Vehículos
backend/src/controllers/executiveDashboardController.ts  # Dashboard
backend/src/routes/index.ts                         # Rutas principales
backend/src/routes/stabilityEvents.ts               # Eventos
backend/src/routes/hotspots.ts                      # Puntos críticos
backend/src/routes/speedAnalysis.ts                 # Análisis velocidad
```

---

## ✅ CHECKLIST DE ARCHIVOS IMPORTANTES

### Frontend - Sesiones
- [x] `SessionsAndRoutesView.tsx`
- [x] `VehicleSessionSelector.tsx`
- [x] `RouteMapComponent.tsx`
- [x] `useTelemetryData.ts`

### Frontend - Filtros
- [x] `GlobalFiltersBar.tsx`
- [x] `useGlobalFilters.ts`
- [x] `FilteredPageWrapper.tsx`

### Frontend - Dashboard
- [x] `NewExecutiveKPIDashboard.tsx`
- [x] `useKPIs.ts`

### Backend - API
- [x] `TelemetryV2Controller.ts`
- [x] `vehiclesController.ts`
- [x] `routes/index.ts`

---

**Última actualización:** 8 de octubre de 2025





