# 🚨 SISTEMA DE GENERACIÓN DE EVENTOS DE ESTABILIDAD

## 📋 Índice

1. [Visión General](#visión-general)
2. [Tipos de Eventos](#tipos-de-eventos)
3. [Detección de Eventos](#detección-de-eventos)
4. [Índice de Estabilidad (SI)](#índice-de-estabilidad-si)
5. [Clasificación de Severidad](#clasificación-de-severidad)
6. [Correlación GPS](#correlación-gps)
7. [Persistencia de Eventos](#persistencia-de-eventos)
8. [API de Eventos](#api-de-eventos)

---

## 🎯 Visión General

El sistema de eventos de estabilidad analiza datos de acelerómetros y giróscopos en tiempo real para detectar situaciones de riesgo durante la operación de vehículos de emergencia.

### Fuentes de Datos

```
┌─────────────────────────┐
│  stability_measurements │
│  - timestamp            │
│  - ax, ay, az (m/s²)    │
│  - gx, gy, gz (°/s)     │
│  - roll, pitch (°)      │
│  - si (Índice 0-1)      │
└─────────────────────────┘
            │
            ↓
┌─────────────────────────┐
│    eventDetector.ts     │
│  - Análisis en tiempo   │
│    real de mediciones   │
│  - Detección de patrones│
│  - Clasificación        │
└─────────────────────────┘
            │
            ↓
┌─────────────────────────┐
│    stability_events     │
│  - Eventos persistidos  │
│  - Con GPS (lat/lon)    │
│  - Severidad calculada  │
└─────────────────────────┘
```

---

## 📊 Tipos de Eventos

### Catálogo de Eventos

| Tipo | Condición | Prioridad | Descripción |
|------|-----------|-----------|-------------|
| **RIESGO_VUELCO** | SI < 0.50 | Variable | Pérdida general de estabilidad |
| **VUELCO_INMINENTE** | SI < 0.10 AND (roll > 10° OR gx > 30°/s) | 🔴 Crítica | Vuelco inminente detectado |
| **DERIVA_PELIGROSA** | abs(gx) > 45°/s AND SI < 0.50 | Variable | Sobreviraje o pérdida de tracción |
| **DERIVA_LATERAL_SIGNIFICATIVA** | abs(gx) > 30°/s AND SI < 0.50 | Variable | Giro lateral pronunciado |
| **MANIOBRA_BRUSCA** | ay > 0.6g OR az > 1.5g | Variable | Frenada o aceleración brusca |
| **CURVA_ESTABLE** | gx sostenido > 15°/s, SI estable | 🟢 Normal | Curva controlada |
| **CAMBIO_CARGA** | Δgx > 15°/s en < 1s | Variable | Cambio brusco de dirección |
| **ZONA_INESTABLE** | Múltiples eventos en área | 🟠 Moderada | Zona con patrones recurrentes |

---

## 🔍 Detección de Eventos

### Servicio Principal

**Ubicación:** `backend/src/services/eventDetector.ts`

**Función Principal:**
```typescript
export async function detectarEventos(
    sessionId: string,
    measurements: StabilityMeasurement[]
): Promise<EventoDetectado[]>
```

---

### 1. Riesgo de Vuelco

**Condición:** SI < 0.50 (pérdida general de estabilidad)

**Código:**
```typescript
function detectarRiesgoVuelco(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0; // Ya en [0,1]

    const severidad = clasificarSeveridadPorSI(si);
    if (!severidad) return null; // SI ≥ 0.50 → sin evento

    return {
        tipo: 'RIESGO_VUELCO',
        severidad,
        timestamp: measurement.timestamp,
        valores: { si: measurement.si },
        descripcion: `Pérdida general de estabilidad (SI=${(si * 100).toFixed(1)}%)`
    };
}
```

**Clasificación:**
- 🔴 **Crítica:** SI < 0.20
- 🟠 **Moderada:** 0.20 ≤ SI < 0.35
- 🟡 **Leve:** 0.35 ≤ SI < 0.50

**Ejemplo:**
```json
{
  "tipo": "RIESGO_VUELCO",
  "severidad": "GRAVE",
  "timestamp": "2025-10-01T10:30:45.000Z",
  "valores": { "si": 0.15 },
  "descripcion": "Pérdida general de estabilidad (SI=15.0%)"
}
```

---

### 2. Vuelco Inminente

**Condición:** SI < 0.10 AND (roll > 10° OR gx > 30°/s)

**Código:**
```typescript
function detectarVuelcoInminente(measurement: any): EventoDetectado | null {
    const si = measurement.si || 0;
    const roll = measurement.roll || 0;
    const gx = measurement.gx || 0;

    if (si < 0.10 && (Math.abs(roll) > 10 || Math.abs(gx) > 30)) {
        return {
            tipo: 'VUELCO_INMINENTE',
            severidad: 'GRAVE', // Forzado a GRAVE
            timestamp: measurement.timestamp,
            valores: { si, roll, gx },
            descripcion: `⚠️ VUELCO INMINENTE: SI=${(si * 100).toFixed(1)}%, Roll=${roll.toFixed(1)}°, gx=${gx.toFixed(1)}°/s`
        };
    }

    return null;
}
```

**Severidad:** Siempre 🔴 **GRAVE** (independiente de SI)

**Ejemplo:**
```json
{
  "tipo": "VUELCO_INMINENTE",
  "severidad": "GRAVE",
  "timestamp": "2025-10-01T10:35:12.000Z",
  "valores": { "si": 0.08, "roll": 12.5, "gx": 35.2 },
  "descripcion": "⚠️ VUELCO INMINENTE: SI=8.0%, Roll=12.5°, gx=35.2°/s"
}
```

---

### 3. Deriva Peligrosa

**Condición:** abs(gx) > 45°/s AND SI < 0.50

**Código:**
```typescript
function detectarDerivaPeligrosa(
    measurement: any, 
    sostenido: boolean = false
): EventoDetectado | null {
    const gx = measurement.gx || 0;
    const si = measurement.si || 0;

    if (Math.abs(gx) > 45) {
        // Clasificar por SI, pero forzar GRAVE si sostenido
        let severidad = sostenido ? 'GRAVE' : clasificarSeveridadPorSI(si);
        if (!severidad) return null;

        return {
            tipo: 'DERIVA_PELIGROSA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { gx, si },
            descripcion: `Sobreviraje o pérdida de tracción: gx=${gx.toFixed(1)}°/s, SI=${(si * 100).toFixed(1)}%`
        };
    }

    return null;
}
```

**Severidad:**
- 🔴 **GRAVE:** Si sostenido > 2s
- Variable por SI si no sostenido

**Ejemplo:**
```json
{
  "tipo": "DERIVA_PELIGROSA",
  "severidad": "MODERADA",
  "timestamp": "2025-10-01T10:40:23.000Z",
  "valores": { "gx": 48.3, "si": 0.25 },
  "descripcion": "Sobreviraje o pérdida de tracción: gx=48.3°/s, SI=25.0%"
}
```

---

### 4. Maniobra Brusca

**Condición:** ay > 0.6g OR az > 1.5g

**Código:**
```typescript
function detectarManiobraBrusca(measurement: any): EventoDetectado | null {
    const ay = measurement.ay || 0;
    const az = measurement.az || 0;
    const si = measurement.si || 0;

    const ayG = Math.abs(ay) / 9.81;
    const azG = Math.abs(az) / 9.81;

    if (ayG > 0.6 || azG > 1.5) {
        const severidad = clasificarSeveridadPorSI(si);
        if (!severidad) return null;

        const tipo = ayG > 0.6 ? 'frenada' : 'aceleración';
        const valor = ayG > 0.6 ? ayG : azG;

        return {
            tipo: 'MANIOBRA_BRUSCA',
            severidad,
            timestamp: measurement.timestamp,
            valores: { ay, az, si },
            descripcion: `${tipo} brusca: ${valor.toFixed(2)}g`
        };
    }

    return null;
}
```

**Clasificación:**
- `ay > 0.6g` → Frenada brusca
- `az > 1.5g` → Aceleración brusca

**Ejemplo:**
```json
{
  "tipo": "MANIOBRA_BRUSCA",
  "severidad": "LEVE",
  "timestamp": "2025-10-01T10:45:34.000Z",
  "valores": { "ay": 6.5, "az": 10.2, "si": 0.42 },
  "descripcion": "frenada brusca: 0.66g"
}
```

---

## 📐 Índice de Estabilidad (SI)

### ¿Qué es el SI?

El **Stability Index (SI)** es un valor normalizado en el rango **[0, 1]** que indica el grado de estabilidad del vehículo.

- **SI = 1.00** → Estabilidad perfecta
- **SI = 0.50** → Umbral de evento (inicio de inestabilidad)
- **SI = 0.00** → Inestabilidad crítica

### Cálculo del SI

**Fórmula (aproximada):**
```typescript
SI = 1 - (
    α * |ax/g_max| + 
    β * |ay/g_max| + 
    γ * |az/g_max| + 
    δ * |gx/gx_max| + 
    ε * |gy/gy_max| + 
    ζ * |gz/gz_max|
)
```

**Donde:**
- `α, β, γ, δ, ε, ζ` = Pesos de cada eje
- `g_max` = Aceleración máxima esperada (9.81 m/s²)
- `gx_max, gy_max, gz_max` = Velocidades angulares máximas (90°/s)

**Valores típicos:**
```
SI ≥ 0.80 → Vehículo estable
SI ≥ 0.50 → Operación normal
SI < 0.50 → Evento detectado
SI < 0.35 → Evento moderado
SI < 0.20 → Evento crítico
```

---

## 🎨 Clasificación de Severidad

### Umbrales de Severidad

**Configuración:**
```typescript
const UMBRALES = {
    EVENTO_MAXIMO: 0.50,    // Solo generar eventos si SI < 0.50
    GRAVE: 0.20,            // SI < 0.20
    MODERADA: 0.35,         // 0.20 ≤ SI < 0.35
    LEVE: 0.50              // 0.35 ≤ SI < 0.50
};
```

### Función de Clasificación

```typescript
function clasificarSeveridadPorSI(si: number): Severidad | null {
    if (si >= UMBRALES.EVENTO_MAXIMO) return null; // Sin evento
    if (si < UMBRALES.GRAVE) return 'GRAVE';
    if (si < UMBRALES.MODERADA) return 'MODERADA';
    return 'LEVE';
}
```

### Tabla de Clasificación

| Rango SI | Severidad | Color | Acción |
|----------|-----------|-------|--------|
| SI ≥ 0.50 | Normal | 🟢 | Sin acción |
| 0.35 ≤ SI < 0.50 | Leve | 🟡 | Monitorear |
| 0.20 ≤ SI < 0.35 | Moderada | 🟠 | Alertar |
| SI < 0.20 | Grave | 🔴 | **Alertar inmediatamente** |

---

## 🗺️ Correlación GPS

### Asociación Temporal

Cada evento de estabilidad se correlaciona con el punto GPS más cercano en el tiempo.

**Proceso:**
```typescript
async function correlacionarConGPS(
    evento: EventoDetectado,
    sessionId: string
): Promise<EventoDetectado> {
    // 1. Buscar punto GPS más cercano (±5 segundos)
    const gpsPoint = await prisma.gpsMeasurement.findFirst({
        where: {
            sessionId,
            timestamp: {
                gte: new Date(evento.timestamp.getTime() - 5000),
                lte: new Date(evento.timestamp.getTime() + 5000)
            }
        },
        orderBy: {
            timestamp: 'asc'
        }
    });

    // 2. Asociar coordenadas
    if (gpsPoint) {
        evento.lat = gpsPoint.latitude;
        evento.lon = gpsPoint.longitude;
    }

    return evento;
}
```

**Ventana temporal:** ±5 segundos

**Beneficios:**
- Localización geográfica del evento
- Análisis de puntos negros
- Mapas de calor de eventos

---

## 💾 Persistencia de Eventos

### Modelo de Datos

**Tabla:** `stability_events`

```sql
CREATE TABLE stability_events (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    details JSONB NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stability_events_session ON stability_events(session_id);
CREATE INDEX idx_stability_events_org ON stability_events(organization_id);
CREATE INDEX idx_stability_events_type ON stability_events(type);
CREATE INDEX idx_stability_events_location ON stability_events(latitude, longitude);
```

### Estructura del Campo `details`

```typescript
{
  si: number;           // Índice de estabilidad [0-1]
  ax?: number;          // Aceleración X (m/s²)
  ay?: number;          // Aceleración Y (m/s²)
  az?: number;          // Aceleración Z (m/s²)
  gx?: number;          // Giro X (°/s)
  gy?: number;          // Giro Y (°/s)
  gz?: number;          // Giro Z (°/s)
  roll?: number;        // Ángulo de balanceo (°)
  pitch?: number;       // Ángulo de cabeceo (°)
  velocity?: number;    // Velocidad GPS (km/h)
  description: string;  // Descripción del evento
  rotativo?: boolean;   // Estado del rotativo
}
```

### Guardar Evento

```typescript
async function guardarEvento(evento: EventoDetectado, sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { vehicleId: true, organizationId: true }
    });

    await prisma.stabilityEvent.create({
        data: {
            sessionId,
            vehicleId: session.vehicleId,
            organizationId: session.organizationId,
            timestamp: evento.timestamp,
            type: evento.tipo,
            severity: evento.severidad,
            details: {
                ...evento.valores,
                description: evento.descripcion,
                rotativo: evento.rotativo
            },
            latitude: evento.lat,
            longitude: evento.lon
        }
    });
}
```

---

## 🌐 API de Eventos

### 1. GET `/api/stability-events`

**Descripción:** Obtener eventos de estabilidad con filtros.

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `sessionId` | UUID | Filtrar por sesión |
| `vehicleId` | UUID | Filtrar por vehículo |
| `from` | Date | Fecha inicio |
| `to` | Date | Fecha fin |
| `severity` | string | Filtrar por severidad (GRAVE, MODERADA, LEVE) |
| `type` | string | Filtrar por tipo de evento |

**Ejemplo:**
```bash
GET /api/stability-events?sessionId=uuid&severity=GRAVE
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "sessionId": "session-uuid",
      "vehicleId": "vehicle-uuid",
      "timestamp": "2025-10-01T10:30:45.000Z",
      "type": "RIESGO_VUELCO",
      "severity": "GRAVE",
      "details": {
        "si": 0.15,
        "description": "Pérdida general de estabilidad (SI=15.0%)"
      },
      "latitude": 40.4168,
      "longitude": -3.7038
    }
  ],
  "count": 1
}
```

---

### 2. POST `/api/generate-events`

**Descripción:** Generar eventos de estabilidad para una sesión.

**Body:**
```json
{
  "sessionId": "uuid"
}
```

**Proceso:**
1. Obtener todas las mediciones de estabilidad de la sesión
2. Ejecutar detectores de eventos
3. Correlacionar con GPS
4. Guardar eventos en BD
5. Retornar resumen

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "totalMeasurements": 1523,
    "eventsGenerated": 28,
    "breakdown": {
      "GRAVE": 2,
      "MODERADA": 7,
      "LEVE": 19
    }
  }
}
```

---

### 3. GET `/api/events/hotspots`

**Descripción:** Obtener puntos negros (zonas con eventos recurrentes).

**Query Parameters:**
- `organizationId` (automático desde JWT)
- `radius` (metros, default: 50)
- `minEvents` (mínimo eventos para considerar hotspot, default: 3)

**Algoritmo:**
```typescript
1. Obtener todos los eventos con GPS
2. Agrupar eventos cercanos (< radius metros)
3. Filtrar clusters con >= minEvents
4. Calcular centroide y severidad promedio
5. Retornar hotspots ordenados por severidad
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "latitude": 40.4168,
      "longitude": -3.7038,
      "eventCount": 12,
      "avgSeverity": "MODERADA",
      "radius": 50,
      "types": {
        "RIESGO_VUELCO": 8,
        "MANIOBRA_BRUSCA": 4
      }
    }
  ]
}
```

---

## 🧪 Testing

### Test de Detección

```typescript
describe('Event Detection', () => {
    it('should detect RIESGO_VUELCO when SI < 0.50', () => {
        const measurement = {
            timestamp: new Date(),
            si: 0.45,
            ax: 2.5,
            ay: 3.1,
            az: 9.8,
            gx: 10,
            gy: 5,
            gz: 2
        };

        const evento = detectarRiesgoVuelco(measurement);

        expect(evento).not.toBeNull();
        expect(evento.tipo).toBe('RIESGO_VUELCO');
        expect(evento.severidad).toBe('LEVE');
    });

    it('should detect VUELCO_INMINENTE with critical conditions', () => {
        const measurement = {
            timestamp: new Date(),
            si: 0.08,
            roll: 12.5,
            gx: 35.2
        };

        const evento = detectarVuelcoInminente(measurement);

        expect(evento).not.toBeNull();
        expect(evento.tipo).toBe('VUELCO_INMINENTE');
        expect(evento.severidad).toBe('GRAVE');
    });
});
```

---

## 📚 Referencias

- [Sistema de KPIs](./SISTEMA-KPIS.md)
- [Arquitectura Interna](./ARQUITECTURA-INTERNA.md)
- [Sistema de Filtros](./SISTEMA-FILTROS.md)

---

**Última actualización:** Octubre 2025  
**Versión:** DobackSoft StabilSafe V3

