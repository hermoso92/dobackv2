# Sistema de KPIs Operativos - DobackSoft

## Descripción General

Sistema para calcular y mostrar KPIs operativos basados en estados del vehículo (claves 0-5). Procesa datos crudos de geocercas, GPS y rotativo para generar intervalos de estados y métricas agregadas.

## Estados Operativos (Claves)

| Clave | Nombre | Descripción | Fuente de Datos |
|-------|--------|-------------|-----------------|
| 0 | Taller | Vehículo en geocerca de taller | Radar.com (geocercas) |
| 1 | Operativo en Parque | Vehículo en geocerca de parque | Radar.com (geocercas) |
| 2 | Salida en Emergencia | Salida de parque con rotativo ON | Radar.com + Rotativo |
| 3 | En Siniestro | Parado >1min en mismo punto | GPS + Rotativo |
| 4 | Fin de Actuación | Tras terminar en lugar hasta inicio retorno | Calculado (entre 3 y 5) |
| 5 | Regreso al Parque | Retorno sin rotativo hasta entrada parque | Radar.com + GPS |

## Arquitectura

### Backend

#### 1. Modelo de Datos (`vehicle_state_interval.py`)
```python
VehicleStateInterval:
    - vehicle_id: ID del vehículo
    - organization_id: ID de organización
    - state_key: Clave de estado (0-5)
    - start_time: Inicio del intervalo
    - end_time: Fin del intervalo (NULL si activo)
    - duration_seconds: Duración en segundos
    - origin: Origen del dato (radar_geofence, rotativo, gps_parado, calculated)
    - geofence_id: ID de geocerca si aplica
    - session_id: ID de sesión si aplica
    - metadata_json: Datos adicionales en JSON
```

#### 2. Servicio de Procesamiento (`state_processor_service.py`)
Transforma datos crudos en intervalos de estados:
- Procesa eventos de geocercas (Radar.com)
- Detecta salidas en emergencia (rotativo ON)
- Identifica estados en siniestro (parado >1min)
- Calcula regresos al parque
- Genera estados Clave 4 por diferencia

#### 3. Servicio de KPIs (`kpi_service.py`)
Agrega intervalos para generar métricas:
- **Resumen de estados**: Duración por clave, tiempo fuera parque
- **Métricas de actividad**: km, horas, rotativo %, salidas emergencia
- **Métricas de estabilidad**: Incidencias totales, por severidad

#### 4. API REST (`routes/kpis.py`)

```
GET /api/kpis/states?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
  → Resumen de estados (claves 0-5)

GET /api/kpis/activity?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
  → Métricas de actividad

GET /api/kpis/stability?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
  → Métricas de estabilidad

GET /api/kpis/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicleIds[]=X
  → Resumen completo (todos los KPIs)
```

### Frontend

#### 1. Servicio KPI (`kpiService.ts`)
Cliente HTTP para consumir endpoints de KPIs.

#### 2. Hook Custom (`useKPIs.ts`)
Hook React que:
- Integra filtros globales
- Gestiona estado de carga
- Recarga automática al cambiar filtros
- Proporciona acceso a KPIs

#### 3. Dashboard (`NewExecutiveKPIDashboard.tsx`)
Visualización de KPIs con datos reales:
- 16 tarjetas KPI principales
- Actualización automática con filtros
- Exportación a PDF
- Sin cambios en estética (solo conexión de datos)

## KPIs Calculados

### Estados & Tiempos
- **Horas de Conducción**: Tiempo total fuera de parque y taller
- **Kilómetros Recorridos**: Suma de distancias GPS
- **Tiempo en Parque**: Duración de Clave 1
- **% Rotativo**: (tiempo rotativo ON / tiempo activo) × 100
- **Tiempo Fuera Parque**: Suma de Claves 2+3+4+5
- **Tiempo en Taller**: Duración de Clave 0
- **Tiempo por Clave**: Duración de cada clave (0-5)

### Actividad
- **Salidas en Emergencia**: Conteo de inicios de Clave 2
- **Velocidad Promedio**: km / horas
- **Velocidad Máxima**: Máximo en datos GPS

### Incidencias
- **Total**: Suma de todas las incidencias
- **Graves**: Severidad 'G'
- **Moderadas**: Severidad 'M'
- **Leves**: Severidad 'L'

## Flujo de Procesamiento

```
Datos Crudos (Radar.com, GPS, Rotativo)
  ↓
StateProcessorService.process_vehicle_day()
  ↓
VehicleStateInterval (persistido en BD)
  ↓
KPIService.get_states_summary()
KPIService.get_activity_metrics()
KPIService.get_stability_metrics()
  ↓
API REST (/api/kpis/*)
  ↓
Frontend (kpiService + useKPIs)
  ↓
Dashboard con datos reales
```

## Configuración

### Umbrales
```python
STOPPED_THRESHOLD_SECONDS = 60  # 1 minuto para considerar parado
MOVEMENT_THRESHOLD_KMH = 5      # Velocidad mínima para movimiento
```

### Geocercas
- **Parque**: Geocercas con tipo 'parque' o 'park'
- **Taller**: Geocercas con tipo 'taller'

## Migración de Base de Datos

```bash
# Ejecutar migración
alembic upgrade head

# O crear manualmente:
python backend/migrations/versions/add_vehicle_state_intervals.py
```

## Uso

### Backend - Procesar día de vehículo
```python
from backend.services.state_processor_service import StateProcessorService
from datetime import datetime

processor = StateProcessorService(db)
intervals = processor.process_vehicle_day(
    vehicle_id='DOBACK023',
    organization_id=1,
    date=datetime(2025, 1, 15),
    geofence_events=[...],
    gps_data=[...],
    rotativo_data=[...]
)
```

### Frontend - Consumir KPIs
```typescript
import { useKPIs } from '../../hooks/useKPIs';

const MyComponent = () => {
    const { kpis, loading, states, activity, stability } = useKPIs();
    
    return (
        <div>
            <p>Km recorridos: {activity?.km_total}</p>
            <p>Tiempo en parque: {states?.states[1]?.duration_formatted}</p>
        </div>
    );
};
```

## Reglas de Negocio

1. **Transiciones Secuenciales**: Estados siguen orden lógico 0→1→2→3→4→5→1
2. **Clave 3 (Siniestro)**: Solo si parado >1min (evita semáforos)
3. **Clave 2 (Emergencia)**: Requiere rotativo ON al salir de parque
4. **Clave 4**: Se calcula por diferencia entre fin de Clave 3 e inicio de Clave 5
5. **Tiempo Fuera Parque**: Siempre debe ser suma exacta de Claves 2+3+4+5
6. **Gaps de Datos**: Se cierran con último timestamp válido, no se inventa

## Criterios de Aceptación

- ✅ Cambiar filtros actualiza todas las tarjetas con datos reales
- ✅ Taller (0) y Parque (1) basados en geocercas Radar.com
- ✅ Clave 2 depende de salida parque + rotativo ON
- ✅ Clave 3 solo si parado >1min en mismo punto
- ✅ Clave 5 termina exactamente al entrar a parque
- ✅ Tiempo fuera parque = suma 2+3+4+5 (consistencia)
- ✅ Km y horas cambian correctamente con filtros
- ✅ Filtros persisten tras recargar página
- ✅ Sin cambios visuales (solo conexión de datos)

## Próximos Pasos

1. Implementar job automático para procesar datos diarios
2. Añadir caché de agregaciones por rango
3. Implementar endpoint de velocidad máxima
4. Crear dashboard de monitoreo de procesamiento
5. Añadir pruebas con datos de ejemplo

