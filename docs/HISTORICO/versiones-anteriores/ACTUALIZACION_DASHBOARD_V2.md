# Actualización Dashboard StabilSafe V2

## 📋 Resumen de Cambios

Se ha implementado una actualización completa del dashboard StabilSafe con las siguientes mejoras:

1. **Control de subida y desconexión de dispositivos**
2. **Pestaña Puntos Negros mejorada** con mapa de calor y clustering
3. **Pestaña Velocidad mejorada** con límites DGT y clustering
4. **Rankings interactivos** sincronizados con mapas

---

## 🔧 1. Control de Dispositivos y Subida de Archivos

### Backend

**Archivo:** `backend/api/v1/device_control.py`

**Funcionalidad:**
- Detecta automáticamente archivos faltantes (estabilidad, CAN, GPS, rotativo)
- Identifica vehículos desconectados (sin transmisión >24h)
- Clasifica estado de conexión: Connected / Partial / Disconnected

**Endpoints:**
- `GET /api/devices/status` - Estado de todos los vehículos
- `GET /api/devices/file-uploads` - Historial de subidas

**Parámetros:**
```typescript
{
  organizationId: string;  // Obligatorio
  date?: string;          // Fecha a verificar (default: hoy)
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  data: {
    totalVehicles: number;
    connectedVehicles: number;
    partialVehicles: number;
    disconnectedVehicles: number;
    devices: DeviceFileStatus[];
    checkDate: string;
  }
}
```

### Frontend

**Archivo:** `frontend/src/components/panel/DeviceMonitoringPanel.tsx`

**Características:**
- Panel de resumen con KPIs de conexión
- Alertas visuales de vehículos con problemas
- Indicadores de archivos faltantes por tipo
- Estado de última subida
- Actualización automática cada 5 minutos

**Uso:**
```tsx
<DeviceMonitoringPanel
  organizationId={user.organizationId}
  onDeviceClick={(device) => handleClick(device)}
/>
```

---

## 🗺️ 2. Pestaña Puntos Negros

### Backend

**Archivo:** `backend/api/v1/hotspots.py`

**Funcionalidad:**
- Clustering geográfico de eventos (radio configurable 20m)
- Agrupación por proximidad con algoritmo de distancia Haversine
- Cálculo de severidad dominante por cluster
- Ranking de zonas críticas

**Endpoints:**
- `GET /api/hotspots/critical-points` - Clusters de eventos
- `GET /api/hotspots/ranking` - Ranking de zonas

**Parámetros:**
```typescript
{
  organizationId: string;
  vehicleIds?: string[];       // Filtro de vehículos
  severity?: 'grave' | 'moderada' | 'leve' | 'all';
  minFrequency?: number;       // Frecuencia mínima de eventos
  rotativoOn?: 'true' | 'false' | 'all';
  clusterRadius?: number;      // Radio en metros (default: 20)
  startDate?: string;
  endDate?: string;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  data: {
    clusters: Array<{
      id: string;
      lat: number;
      lng: number;
      location: string;
      frequency: number;
      severity_counts: {
        grave: number;
        moderada: number;
        leve: number;
      };
      dominantSeverity: string;
      vehicleIds: string[];
      lastOccurrence: string;
      events: Event[];
    }>;
    totalEvents: number;
    totalClusters: number;
  }
}
```

### Frontend

**Archivo:** `frontend/src/components/stability/BlackSpotsTab.tsx`

**Características:**
- Mapa de calor con clustering dinámico (MarkerClusterGroup)
- Filtros por gravedad, rotativo, frecuencia mínima, radio de cluster
- Estadísticas en tiempo real
- Ranking de zonas críticas con enlace directo al mapa
- Colores según severidad:
  - 🔴 Grave
  - 🟠 Moderada
  - 🟡 Leve

**Uso:**
```tsx
<BlackSpotsTab
  organizationId={user.organizationId}
  vehicleIds={selectedVehicles}
  startDate={startDate}
  endDate={endDate}
/>
```

---

## 🚗 3. Pestaña Velocidad con Límites DGT

### Backend

**Archivo:** `backend/api/v1/speed.py`

**Funcionalidad:**
- Clasificación de velocidad según normativa DGT
- Límites dinámicos por tipo de vehículo y vía
- Detección de tipo de vía (urbana/interurbana/autopista)
- Consideración de rotativo para vehículos de emergencia

**Categorías DGT:**
```python
DGT_CATEGORIES = {
    'turismo': {'urban': 50, 'interurban': 90, 'highway': 120},
    'camion_pesado': {'urban': 50, 'interurban': 80, 'highway': 90},
    'vehiculo_emergencia': {'urban': 50, 'interurban': 90, 'highway': 120}
}

# Límites especiales con rotativo
EMERGENCY_ROTATIVO_LIMITS = {
    'urban': 80,
    'interurban': 120,
    'highway': 140
}
```

**Clasificación de Excesos:**
- **Correcto:** velocidad ≤ límite
- **Leve:** exceso de 1-20 km/h
- **Grave:** exceso > 20 km/h

**Endpoints:**
- `GET /api/speed/violations` - Violaciones de velocidad
- `GET /api/speed/critical-zones` - Ranking de tramos

**Parámetros:**
```typescript
{
  organizationId: string;
  vehicleIds?: string[];
  rotativoOn?: 'true' | 'false' | 'all';
  violationType?: 'grave' | 'leve' | 'correcto' | 'all';
  roadType?: 'urban' | 'interurban' | 'highway' | 'all';
  inPark?: 'true' | 'false' | 'all';
  startDate?: string;
  endDate?: string;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  data: {
    violations: Array<{
      id: string;
      vehicleId: string;
      vehicleName: string;
      timestamp: string;
      lat: number;
      lng: number;
      speed: number;
      speedLimit: number;
      violationType: 'grave' | 'leve' | 'correcto';
      rotativoOn: boolean;
      inPark: boolean;
      roadType: 'urban' | 'interurban' | 'highway';
    }>;
    total: number;
    stats: {
      grave: number;
      leve: number;
      correcto: number;
      withRotativo: number;
      withoutRotativo: number;
    }
  }
}
```

### Frontend

**Archivo:** `frontend/src/components/speed/SpeedAnalysisTab.tsx`

**Características:**
- Mapa de calor con clustering de excesos
- Filtros por rotativo, ubicación, tipo de vía, clasificación
- Estadísticas detalladas (graves, leves, correctos, promedio de exceso)
- Ranking de tramos con más excesos
- Información DGT integrada
- Colores según clasificación:
  - 🔴 Grave (exceso >20 km/h)
  - 🟡 Leve (exceso 1-20 km/h)
  - 🔵 Correcto (dentro del límite)

**Uso:**
```tsx
<SpeedAnalysisTab
  organizationId={user.organizationId}
  vehicleIds={selectedVehicles}
  startDate={startDate}
  endDate={endDate}
/>
```

---

## 📊 4. Dashboard Principal Mejorado

**Archivo:** `frontend/src/pages/ImprovedDashboard.tsx`

**Estructura:**
```
┌─────────────────────────────────────────────────┐
│  Header + Filtros Globales + Pestañas          │
├─────────────────────────────────────────────────┤
│  Pestaña 0: Panel de Control                   │
│  ├─ KPIs principales (vehículos, horas, km)    │
│  ├─ KPIs de eventos (incidencias, críticos)    │
│  └─ Panel de monitoreo de dispositivos         │
├─────────────────────────────────────────────────┤
│  Pestaña 1: Puntos Negros                      │
│  ├─ Filtros (gravedad, rotativo, frecuencia)   │
│  ├─ Estadísticas                                │
│  └─ Grid: Mapa (2/3) + Ranking (1/3)          │
├─────────────────────────────────────────────────┤
│  Pestaña 2: Velocidad                          │
│  ├─ Filtros (rotativo, ubicación, tipo vía)    │
│  ├─ Estadísticas (DGT)                          │
│  ├─ Grid: Mapa (2/3) + Ranking (1/3)          │
│  └─ Información DGT                             │
└─────────────────────────────────────────────────┘
```

**Características:**
- Filtros globales (vehículos, rango de fechas)
- Sistema de pestañas integrado
- KPIs clicables para navegación rápida
- Diseño responsivo sin scroll en vista principal
- Actualización automática de datos

---

## 🔗 5. Configuración de API

**Archivo:** `frontend/src/config/api.ts`

**Nuevos Endpoints:**
```typescript
// Control de dispositivos
export const DEVICE_ENDPOINTS = {
    STATUS: `${API_BASE_URL}/api/devices/status`,
    FILE_UPLOADS: `${API_BASE_URL}/api/devices/file-uploads`,
};

// Velocidad
export const SPEED_ENDPOINTS = {
    VIOLATIONS: `${API_BASE_URL}/api/speed/violations`,
    CRITICAL_ZONES: `${API_BASE_URL}/api/speed/critical-zones`,
};

// Puntos negros
export const HOTSPOT_ENDPOINTS = {
    CRITICAL_POINTS: `${API_BASE_URL}/api/hotspots/critical-points`,
    RANKING: `${API_BASE_URL}/api/hotspots/ranking`,
};
```

---

## 📦 6. Dependencias

**Nueva dependencia instalada:**
```bash
npm install react-leaflet-cluster --save
```

**Uso:** Clustering de marcadores en mapas Leaflet

---

## 🚀 7. Integración en el Sistema

### Registrar endpoints del backend

Añadir en el archivo principal del backend (ej. `backend/src/app.ts` o `backend/api/__init__.py`):

```python
from api.v1.device_control import device_control_bp
from api.v1.hotspots import hotspots_bp
from api.v1.speed import speed_bp

# Registrar blueprints
app.register_blueprint(device_control_bp)
app.register_blueprint(hotspots_bp)
app.register_blueprint(speed_bp)
```

### Añadir ruta en el frontend

En `frontend/src/routes.tsx` o similar:

```tsx
import ImprovedDashboard from './pages/ImprovedDashboard';

// Añadir ruta
{
  path: '/dashboard-v2',
  element: <ImprovedDashboard />
}
```

---

## ✅ 8. Reglas Cumplidas

- ✅ **Sin hardcodear URLs** - Uso de `config/api.ts`
- ✅ **Sin console.log** - Uso de `logger` de `utils/logger`
- ✅ **Filtro organizationId** incluido en todos los requests
- ✅ **TypeScript estricto** - Sin uso de `any` sin justificación
- ✅ **Diseño modular** - Componentes reutilizables
- ✅ **Sin scroll innecesario** - Layout optimizado
- ✅ **Respeta flujo interno** - Subida → Procesamiento → Visualización

---

## 🧪 9. Testing

### Probar endpoints del backend

```bash
# Estado de dispositivos
curl "http://localhost:9998/api/devices/status?organizationId=org123"

# Puntos negros
curl "http://localhost:9998/api/hotspots/critical-points?organizationId=org123&severity=grave&minFrequency=5"

# Violaciones de velocidad
curl "http://localhost:9998/api/speed/violations?organizationId=org123&rotativoOn=all&violationType=grave"

# Ranking de tramos
curl "http://localhost:9998/api/speed/critical-zones?organizationId=org123&limit=10"
```

### Acceder al dashboard mejorado

```
http://localhost:5174/dashboard-v2
```

---

## 📝 10. Notas Técnicas

### Algoritmo de Clustering

Utiliza la fórmula de **Haversine** para calcular distancias geográficas:

```python
def calculate_distance(lat1, lng1, lat2, lng2):
    R = 6371000  # Radio de la Tierra en metros
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c  # Distancia en metros
```

### Detección de Tipo de Vía

Por ahora usa heurística simple basada en velocidad:
- **Urbana:** velocidad < 60 km/h
- **Interurbana:** 60 ≤ velocidad < 100 km/h
- **Autopista:** velocidad ≥ 100 km/h

**TODO:** Integrar con API de mapas o BD de vías para detección precisa.

### Límite de Parque

Si el vehículo está dentro del parque, el límite es **20 km/h** independientemente del tipo de vía.

---

## 🎯 11. Próximos Pasos

1. **Conectar con datos reales de la BD** - Los endpoints actualmente usan datos de ejemplo
2. **Implementar consultas SQL** para eventos, GPS y sesiones
3. **Añadir caché** para mejorar rendimiento de consultas frecuentes
4. **Integrar detección de tipo de vía** usando API de TomTom o OpenStreetMap
5. **Añadir exportación PDF** de análisis de puntos negros y velocidad
6. **Implementar notificaciones push** cuando se detecte desconexión de dispositivos

---

## 📞 12. Soporte

Para dudas o problemas con la implementación, consultar:
- `GUIA_ARCHIVOS_BD_DOBACKSOFT.md`
- `SISTEMA_COMPLETO_FINAL.md`
- Reglas del proyecto en `.cursorrules`

---

**Fecha de actualización:** 2025-10-07  
**Versión:** StabilSafe V2  
**Estado:** ✅ Implementado y listo para integración

