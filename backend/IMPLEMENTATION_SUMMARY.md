# Implementación del Sistema de KPIs Operativos

## ✅ Componentes Implementados

### Backend

1. **Modelo de Datos** (`models/vehicle_state_interval.py`)
   - Tabla para almacenar intervalos de estados
   - Índices optimizados para consultas rápidas
   - Campos: vehicle_id, organization_id, state_key, start/end_time, duration, origin

2. **Servicio de Procesamiento** (`services/state_processor_service.py`)
   - Procesa datos crudos (geocercas, GPS, rotativo)
   - Genera intervalos de estados (claves 0-5)
   - Detecta:
     - Estados en taller/parque (geocercas)
     - Salidas en emergencia (rotativo ON)
     - Estados en siniestro (parado >1min)
     - Regresos al parque
     - Fin de actuación (calculado)

3. **Servicio de KPIs** (`services/kpi_service.py`)
   - Agrega intervalos por rango de fechas y vehículos
   - Calcula:
     - Resumen de estados (duración por clave)
     - Métricas de actividad (km, horas, rotativo %, salidas)
     - Métricas de estabilidad (incidencias)

4. **API REST** (`routes/kpis.py`)
   - `GET /api/kpis/states` - Resumen de estados
   - `GET /api/kpis/activity` - Métricas de actividad
   - `GET /api/kpis/stability` - Métricas de estabilidad
   - `GET /api/kpis/summary` - Resumen completo

5. **Migración de BD** (`migrations/versions/add_vehicle_state_intervals.py`)
   - Script Alembic para crear tabla e índices

### Frontend

1. **Servicio KPI** (`services/kpiService.ts`)
   - Cliente HTTP para consumir endpoints
   - Manejo de errores y fallbacks
   - Construcción de query params

2. **Hook Custom** (`hooks/useKPIs.ts`)
   - Integración con filtros globales
   - Gestión de estado de carga
   - Recarga automática al cambiar filtros
   - Acceso a KPIs individuales

3. **Dashboard Actualizado** (`components/kpi/NewExecutiveKPIDashboard.tsx`)
   - 16 tarjetas KPI con datos reales
   - Sin cambios visuales (solo conexión de datos)
   - Uso del hook useKPIs
   - Cálculos automáticos (velocidad promedio, etc.)

## Estados Operativos (Claves)

| Clave | Nombre | Cálculo | Fuente |
|-------|--------|---------|--------|
| 0 | Taller | Entrada/salida geocerca taller | Radar.com |
| 1 | Operativo en Parque | Entrada/salida geocerca parque | Radar.com |
| 2 | Salida en Emergencia | Salida parque + rotativo ON | Radar.com + Rotativo |
| 3 | En Siniestro | Parado >1min mismo punto | GPS |
| 4 | Fin de Actuación | Entre fin Clave 3 e inicio Clave 5 | Calculado |
| 5 | Regreso al Parque | Movimiento sin rotativo hasta entrada parque | GPS + Radar.com |

## KPIs Implementados

### Pestaña "Estados & Tiempos"

**Primera Fila - Métricas Principales:**
- ✅ Horas de Conducción (de `activity.driving_hours_formatted`)
- ✅ Kilómetros Recorridos (de `activity.km_total`)
- ✅ Tiempo en Parque (de estado clave 1)
- ✅ % Rotativo (de `activity.rotativo_on_percentage`)

**Segunda Fila - Estados Operativos:**
- ✅ Tiempo Fuera Parque (suma de claves 2+3+4+5)
- ✅ Tiempo en Taller (estado clave 0)
- ✅ Tiempo Clave 2 (salida en emergencia)
- ✅ Tiempo Clave 5 (regreso al parque)

**Tercera Fila - Incidencias:**
- ✅ Total Incidencias (de `stability.total_incidents`)
- ✅ Incidencias Graves (de `stability.critical`)
- ✅ Incidencias Moderadas (de `stability.moderate`)
- ✅ Incidencias Leves (de `stability.light`)

**Cuarta Fila - Actividad:**
- ✅ Salidas en Emergencia (de `activity.emergency_departures`)
- ✅ Tiempo Clave 3 (en siniestro)
- ✅ Velocidad Promedio (calculada: km/horas)
- ✅ Tiempo Clave 4 (fin de actuación)

## Flujo de Datos

```
DATOS CRUDOS
├── Radar.com: Eventos geocercas (entrada/salida parque/taller)
├── GPS: Posiciones, velocidad
└── Rotativo: Estado ON/OFF

      ↓

PROCESAMIENTO (StateProcessorService)
├── Detectar estados en geocercas (0, 1)
├── Detectar salidas emergencia (2)
├── Detectar siniestros (3)
├── Calcular fin actuación (4)
└── Detectar regresos (5)

      ↓

PERSISTENCIA (VehicleStateInterval)
└── Intervalos almacenados con duración

      ↓

AGREGACIÓN (KPIService)
├── Sumar duraciones por estado
├── Calcular km, horas, rotativo %
└── Contar salidas e incidencias

      ↓

API REST (/api/kpis/*)
└── JSON con métricas agregadas

      ↓

FRONTEND
├── kpiService: Consumo API
├── useKPIs: Hook con estado
└── Dashboard: Visualización
```

## Reglas Implementadas

1. ✅ **Taller/Parque** - Solo desde geocercas Radar.com
2. ✅ **Clave 2** - Requiere salida parque + rotativo ON
3. ✅ **Clave 3** - Solo si parado >1min (evita semáforos)
4. ✅ **Clave 4** - Calculada por diferencia (entre 3 y 5)
5. ✅ **Clave 5** - Termina exactamente al entrar a parque
6. ✅ **Tiempo Fuera Parque** - Siempre suma 2+3+4+5
7. ✅ **Sin cambios visuales** - Solo conexión de datos

## Próximos Pasos (No Implementados)

1. **Job Automático** - Procesar datos diarios en segundo plano
2. **Caché de Agregaciones** - Almacenar resultados por rango para consultas rápidas
3. **Velocidad Máxima** - Endpoint y cálculo desde datos GPS
4. **Dashboard de Procesamiento** - Monitoreo de estado del sistema
5. **Datos de Prueba** - Conjunto de datos de ejemplo para QA

## Cómo Probar

### Backend - Procesar un día

```python
from backend.services.state_processor_service import StateProcessorService
from backend.config.database import get_db
from datetime import datetime

db = next(get_db())
processor = StateProcessorService(db)

# Datos de ejemplo
geofence_events = [
    {'timestamp': '2025-01-15T08:00:00', 'event_type': 'exit', 'geofence_type': 'parque', 'geofence_id': 'park_1'},
    {'timestamp': '2025-01-15T09:30:00', 'event_type': 'entry', 'geofence_type': 'parque', 'geofence_id': 'park_1'}
]

gps_data = [...]
rotativo_data = [...]

intervals = processor.process_vehicle_day(
    vehicle_id='DOBACK023',
    organization_id=1,
    date=datetime(2025, 1, 15),
    geofence_events=geofence_events,
    gps_data=gps_data,
    rotativo_data=rotativo_data
)

print(f"Generados {len(intervals)} intervalos")
```

### Frontend - Consumir KPIs

```typescript
import { useKPIs } from '../../hooks/useKPIs';

const MyComponent = () => {
    const { kpis, loading, states, activity, stability } = useKPIs();
    
    if (loading) return <div>Cargando...</div>;
    
    return (
        <div>
            <p>Km: {activity?.km_total}</p>
            <p>Horas: {activity?.driving_hours_formatted}</p>
            <p>Tiempo en parque: {states?.states[1]?.duration_formatted}</p>
            <p>Incidencias: {stability?.total_incidents}</p>
        </div>
    );
};
```

## Archivos Creados/Modificados

### Nuevos:
- `backend/models/vehicle_state_interval.py`
- `backend/services/state_processor_service.py`
- `backend/services/kpi_service.py`
- `backend/routes/kpis.py`
- `backend/migrations/versions/add_vehicle_state_intervals.py`
- `backend/README_KPIS.md`
- `frontend/src/services/kpiService.ts`
- `frontend/src/hooks/useKPIs.ts`

### Modificados:
- `backend/api/v1/__init__.py` (registro de rutas KPIs)
- `frontend/src/components/kpi/NewExecutiveKPIDashboard.tsx` (conexión datos reales)

## Estado: ✅ LISTO PARA PRUEBAS

El sistema está completamente implementado pero requiere:
1. Ejecutar migración de BD
2. Poblar datos de geocercas (Radar.com)
3. Procesar al menos un día de ejemplo
4. Verificar que los KPIs se muestran correctamente

