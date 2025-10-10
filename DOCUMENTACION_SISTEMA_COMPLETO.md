# 📚 DOCUMENTACIÓN COMPLETA DEL SISTEMA DOBACKSOFT

## 🎯 **ÍNDICE**

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Subida de Archivos](#flujo-de-subida-de-archivos)
3. [Procesamiento de Datos](#procesamiento-de-datos)
4. [Detección de Eventos](#detección-de-eventos)
5. [Almacenamiento en Base de Datos](#almacenamiento-en-base-de-datos)
6. [API y Endpoints](#api-y-endpoints)
7. [Frontend y Visualización](#frontend-y-visualización)
8. [Configuración y Mantenimiento](#configuración-y-mantenimiento)

---

## 🏗️ **ARQUITECTURA GENERAL**

### **Stack Tecnológico**:
```
Frontend:  React + TypeScript + Tailwind CSS + Leaflet
Backend:   Node.js + Express + Prisma ORM
Database:  PostgreSQL
Maps:      OpenStreetMap + Leaflet
Files:     Sistema de archivos local + Procesamiento en memoria
```

### **Puertos**:
- **Backend**: `9998` (fijo, no cambiar)
- **Frontend**: `5174` (fijo, no cambiar)

### **Estructura de Directorios**:
```
DobackSoft/
├── backend-final.js           # Backend principal (Node.js/Express)
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
├── backend/data/
│   └── CMadrid/              # Datos de la organización
│       └── doback0XX/        # Por vehículo
│           ├── GPS/          # Archivos GPS
│           ├── ESTABILIDAD/  # Archivos de estabilidad
│           ├── ROTATIVO/     # Archivos de rotativo
│           └── CAN/          # Archivos CAN (opcional)
└── frontend/
    └── src/
        ├── components/       # Componentes React
        ├── pages/           # Páginas
        └── services/        # Servicios API
```

---

## 📤 **FLUJO DE SUBIDA DE ARCHIVOS**

### **1. Métodos de Subida**:

#### **A) Subida Manual Individual**:
```
Frontend → "Gestión de Datos" → "Subir Archivos"
- Seleccionar archivos (GPS, ESTABILIDAD, ROTATIVO, CAN)
- Click "Subir Archivos"
- Sistema procesa y guarda en BD
```

#### **B) Procesamiento Automático**:
```
Frontend → "Gestión de Datos" → "Procesamiento Automático"
- Procesa TODOS los vehículos en backend/data/CMadrid/
- Automático, sin selección de archivos
- Ideal para carga masiva inicial
```

### **2. Formato de Archivos**:

#### **Archivo de ESTABILIDAD**:
```
ESTABILIDAD;03/10/2025 09:46:59;DOBACK024;Sesión:1;
ax; ay; az; gx; gy; gz; roll; pitch; yaw; timeantwifi; usciclo1; usciclo2; usciclo3; usciclo4; usciclo5; si; accmag; microsds; k3
61.37; 359.66; 939.40; -74.64; 702.10; -457.62; -0.98; 11.66; -0.32; 691222.00; ...
09:47:00
62.15; 358.23; 940.12; -75.21; 703.45; -458.33; -0.97; 11.67; -0.31; ...
...
```

**Campos clave**:
- `si`: Índice de estabilidad (0-1, ej: 0.90 = 90%)
- `roll`, `pitch`, `yaw`: Ángulos de orientación
- `ax`, `ay`, `az`: Aceleraciones (mg)
- `gx`, `gy`, `gz`: Velocidades angulares (°/s)

#### **Archivo GPS**:
```
GPS;03/10/2025-09:46:49;DOBACK024;Sesión:1
HoraRaspberry,Fecha,Hora(GPS),Latitud,Longitud,Altitud,HDOP,Fix,NumSats,Velocidad(km/h)
Hora Raspberry-09:51:39,03/10/2025,Hora GPS-09:51:39,40.5352907,-3.6181127,691.3,2.02,1,05,0.09
...
```

#### **Archivo ROTATIVO**:
```
ROTATIVO;06/10/2025-05:35:04;DOBACK028;Sesión:1;
Fecha-Hora;Estado
06/10/2025-05:39:43;0
06/10/2025-05:39:44;0
06/10/2025-05:39:45;1
...
```

**Estados rotativo**:
- `0`: Apagado
- `1`: Encendido
- `2`: Clave 2
- `5`: Clave 5

---

## ⚙️ **PROCESAMIENTO DE DATOS**

### **Paso 1: Lectura y Parseo de Archivos**

#### **Parser de ESTABILIDAD** (`parseStabilityFile`):
```javascript
// 1. Detectar cabecera de sesión
ESTABILIDAD;03/10/2025 09:46:59;DOBACK024;Sesión:1;

// 2. Detectar timestamps reales
09:47:00  ← Timestamp en formato HH:MM:SS

// 3. Parsear datos
-57.22; 14.15; 1010.40; -24.76; -47.69; -16.01; 2.54; 0.22; -8.57; ...

// 4. Asignar timestamp real + milisegundos únicos
measurement.timestamp = new Date('2025-10-03T09:47:00.000Z')
measurement.timestamp = new Date('2025-10-03T09:47:00.001Z')  // +1ms para evitar duplicados
```

**Características**:
- ✅ Usa timestamps reales del archivo
- ✅ Añade milisegundos para evitar duplicados
- ✅ Agrupa por número de sesión

#### **Parser de GPS** (`parseGpsFile`):
```javascript
// Parsea líneas con formato:
Hora Raspberry-09:51:39,03/10/2025,Hora GPS-09:51:39,40.5352907,-3.6181127,691.3,2.02,1,05,0.09

// Extrae:
- timestamp: Date
- latitude: 40.5352907
- longitude: -3.6181127
- altitude: 691.3
- speed: 0.09 km/h
- satellites: 5
```

**Filtrado GPS**:
```javascript
// Eliminar coordenadas inválidas
if (lat === 0 && lon === 0) → RECHAZAR
if (lat < -90 || lat > 90) → RECHAZAR
if (lon < -180 || lon > 180) → RECHAZAR

// Filtrar rutas con "callejeado" (route validation)
MAX_DISTANCE_BETWEEN_POINTS = 500m  // Máximo 500m entre puntos consecutivos
MAX_ABSOLUTE_DISTANCE = 10000m      // Filtra errores GPS masivos (>10km)
MAX_SPEED_KMH = 120 km/h            // Velocidad máxima realista
MIN_POINTS_FOR_VALID_ROUTE = 10     // Mínimo 10 puntos para ruta válida
```

#### **Parser de ROTATIVO** (`parseRotativoFile`):
```javascript
// Parsea líneas con formato:
06/10/2025-05:39:43;0

// Extrae:
- timestamp: Date (DD/MM/YYYY-HH:MM:SS)
- estado: 0, 1, 2, o 5
```

### **Paso 2: Unificación de Sesiones**

```javascript
// Agrupar archivos por número de sesión
Session 1: {
    estabilidad: [...],  // N mediciones de estabilidad
    gps: [...],          // M mediciones GPS
    rotativo: [...],     // P mediciones rotativo
    can: [...]          // Q mediciones CAN (opcional)
}

// Calcular duración
duration = endTime - startTime

// Filtrar sesiones cortas
if (duration < 300 segundos) → DESCARTAR ❌

// Validar datos mínimos
if (gps.length < 10) → DESCARTAR ❌
```

---

## 🚨 **DETECCIÓN DE EVENTOS**

### **Catálogo Oficial DoBack**:

#### **Regla Fundamental**:
```javascript
⚠️ SOLO SE GENERAN EVENTOS SI SI < 0.50 (50%)
```

#### **Eventos Detectables**:

| Evento | Condición | Severidad | Variables |
|--------|-----------|-----------|-----------|
| **Riesgo de Vuelco** | `si < 0.30` | CRITICAL | `si` |
| **Vuelco Inminente** | `si < 0.10 Y (roll > 10° O gx > 30°/s)` | CRITICAL | `si`, `roll`, `gx` |
| **Deriva Peligrosa** | `\|gx\| > 45°/s` | CRITICAL | `gx` |
| **Maniobra Brusca** | `\|ay\| > 3000 mg` | HIGH | `ay` |

### **Niveles de Estabilidad**:

| Nivel | Nombre | Rango SI | Color |
|-------|--------|----------|-------|
| 3 | Grave | < 20% | 🔴 Rojo |
| 2 | Moderado | 20-35% | 🟠 Naranja |
| 1 | Leve | 35-50% | 🟡 Amarillo |
| 0 | Normal | > 50% | 🟢 Verde |

### **Algoritmo de Detección**:

```javascript
// Para cada medición de estabilidad:
for (measurement of estabilidad) {
    const isUnstable = measurement.si < 0.50;
    
    // SOLO si SI < 50%
    if (isUnstable) {
        // 1. Riesgo de Vuelco
        if (measurement.si < 0.30) {
            eventType = 'rollover_risk';
        }
        
        // 2. Vuelco Inminente
        if (measurement.si < 0.10 && 
            (Math.abs(measurement.roll) > 10 || Math.abs(measurement.gx) > 30)) {
            eventType = 'rollover_imminent';
        }
        
        // 3. Deriva Peligrosa
        if (Math.abs(measurement.gx) > 45) {
            eventType = 'dangerous_drift';
        }
        
        // 4. Maniobra Brusca
        if (Math.abs(measurement.ay) > 3000) {
            eventType = 'abrupt_maneuver';
        }
        
        // Buscar GPS más cercano (< 30 segundos)
        nearestGps = findClosestGPS(measurement.timestamp, gpsData);
        
        // Buscar rotativo más cercano
        rotativoState = findClosestRotativo(measurement.timestamp, rotativoData);
        
        // Crear evento
        if (nearestGps && timeDiff < 30000) {
            createEvent({
                session_id: sessionId,
                timestamp: measurement.timestamp,
                type: eventType,
                lat: nearestGps.latitude,
                lon: nearestGps.longitude,
                speed: nearestGps.speed,
                rotativoState: rotativoState,
                details: {
                    si, roll, pitch, yaw,
                    ax, ay, az,
                    gx, gy, gz,
                    flags...
                }
            });
        }
    }
}
```

### **Correlación Temporal**:

```javascript
// Buscar GPS más cercano
function findClosestGPS(timestamp, gpsData) {
    let minDiff = Infinity;
    let nearest = null;
    
    for (gps of gpsData) {
        diff = Math.abs(gps.timestamp - timestamp);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = gps;
        }
    }
    
    // Solo aceptar si < 30 segundos
    return minDiff < 30000 ? nearest : null;
}
```

---

## 💾 **ALMACENAMIENTO EN BASE DE DATOS**

### **Esquema de Base de Datos (Prisma)**:

```prisma
// Sesión principal
model Session {
  id            String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  vehicleId     String
  startTime     DateTime
  endTime       DateTime
  sessionNumber Int
  status        String   // 'COMPLETED', 'INTERRUPTED'
  
  // Relaciones
  GpsMeasurement          GpsMeasurement[]
  StabilityMeasurement    StabilityMeasurement[]
  RotativoMeasurement     RotativoMeasurement[]
  stability_events        stability_events[]
}

// Mediciones GPS
model GpsMeasurement {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  sessionId   String
  timestamp   DateTime @db.Timestamptz(6)
  latitude    Float
  longitude   Float
  altitude    Float?
  speed       Float?
  satellites  Int?
  
  @@index([sessionId, timestamp])
  @@unique([sessionId, timestamp])  // ← Clave única
}

// Mediciones de Estabilidad
model StabilityMeasurement {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  sessionId   String
  timestamp   DateTime @db.Timestamptz(6)
  
  // Datos de estabilidad
  ax          Float
  ay          Float
  az          Float
  gx          Float
  gy          Float
  gz          Float
  roll        Float
  pitch       Float
  yaw         Float
  si          Float
  
  // Flags de eventos
  isLTRCritical        Boolean  @default(false)
  isDRSHigh            Boolean  @default(false)
  isLateralGForceHigh  Boolean  @default(false)
  
  @@index([sessionId, timestamp])
  @@unique([sessionId, timestamp])  // ← Clave única
}

// Mediciones de Rotativo
model RotativoMeasurement {
  id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  sessionId   String
  timestamp   DateTime @db.Timestamptz(6)
  state       String   // "0", "1", "2", "5"
  
  @@index([sessionId, timestamp])
  @@unique([sessionId, timestamp])  // ← Clave única
}

// Eventos de Estabilidad
model stability_events {
  id            String   @id @default(dbgenerated("(gen_random_uuid())::text"))
  session_id    String
  timestamp     DateTime @db.Timestamptz(6)
  
  // Ubicación (correlacionada con GPS)
  lat           Float
  lon           Float
  
  // Tipo de evento
  type          String   // 'rollover_risk', 'dangerous_drift', etc.
  
  // Datos correlacionados
  speed         Float?   // Velocidad del GPS
  rotativoState Int?     // Estado del rotativo
  
  // Detalles (JSON)
  details       Json?    // Todos los datos de estabilidad + flags
  
  @@index([session_id])
  @@index([session_id, timestamp])
  @@index([type])
  @@index([speed])
  @@index([rotativoState])
}
```

### **Proceso de Guardado**:

```javascript
// 1. Crear o encontrar vehículo
vehicle = await prisma.vehicle.upsert({
    where: { dobackId: 'DOBACK024' },
    create: { dobackId: 'DOBACK024', licensePlate: 'DOBACK024' },
    update: {}
});

// 2. Crear sesión
session = await prisma.session.create({
    data: {
        vehicleId: vehicle.id,
        startTime: sessionStart,
        endTime: sessionEnd,
        sessionNumber: 1,
        status: 'COMPLETED'
    }
});

// 3. Guardar mediciones de estabilidad (con manejo de duplicados)
const timestampCounters = new Map();

const stabilityData = measurements.map((m, index) => {
    // Timestamp base (redondeado a segundos)
    const baseTimestamp = Math.floor(m.timestamp.getTime() / 1000) * 1000;
    
    // Contador por timestamp
    const count = timestampCounters.get(baseTimestamp) || 0;
    timestampCounters.set(baseTimestamp, count + 1);
    
    // Añadir milisegundos únicos
    const uniqueTimestamp = new Date(baseTimestamp + count);
    
    return {
        sessionId: session.id,
        timestamp: uniqueTimestamp,  // ← Timestamp único
        ax: m.ax,
        ay: m.ay,
        // ... más datos
    };
});

await prisma.stabilityMeasurement.createMany({ data: stabilityData });

// 4. Guardar eventos
await prisma.stability_events.createMany({ data: eventsToCreate });

// 5. Guardar GPS
await prisma.gpsMeasurement.createMany({ data: gpsData });

// 6. Guardar rotativo
await prisma.rotativoMeasurement.createMany({ data: rotativoData });
```

### **Manejo de Timestamps Únicos**:

**Problema**: Múltiples mediciones con el mismo timestamp causan violación de restricción única.

**Solución**: Añadir milisegundos incrementales por timestamp:

```javascript
// Archivo original:
20:21:31
dato1  ← timestamp: 20:21:31
dato2  ← timestamp: 20:21:31 (DUPLICADO)
dato3  ← timestamp: 20:21:31 (DUPLICADO)
20:21:32
dato1  ← timestamp: 20:21:32

// Después del procesamiento:
dato1 → 20:21:31.000 (base + 0ms)
dato2 → 20:21:31.001 (base + 1ms)
dato3 → 20:21:31.002 (base + 2ms)
dato1 → 20:21:32.000 (base + 0ms, contador resetea)
```

**Ventajas**:
- ✅ Timestamps reales preservados (segundos exactos)
- ✅ Sin duplicados en BD
- ✅ Precisión de milisegundos (aceptable)
- ✅ Contador se resetea por cada segundo

---

## 🌐 **API Y ENDPOINTS**

### **Endpoints Principales**:

#### **1. Subida de Archivos**:
```
POST /api/upload-files
Content-Type: multipart/form-data

Body:
- files: File[] (archivos GPS, ESTABILIDAD, ROTATIVO, CAN)
- vehicleId: string
- organizationId: string

Response:
{
  success: true,
  message: "X sesiones guardadas exitosamente",
  data: {
    vehicleId: "...",
    sessions: [...]
  }
}
```

#### **2. Procesamiento Automático**:
```
POST /api/process-cmadrid-automatic

Response:
{
  success: true,
  totalProcessed: 21,
  totalSaved: 67,
  totalDiscarded: 159,
  totalErrors: 0,
  vehicles: {
    "DOBACK024": { saved: 7, discarded: 0 },
    "DOBACK027": { saved: 18, discarded: 42 },
    ...
  }
}
```

#### **3. Limpieza de Base de Datos**:
```
POST /api/clean-all-sessions

Response:
{
  success: true,
  message: "Base de datos limpiada completamente",
  data: {
    deletedGps: 1234,
    deletedStability: 5678,
    deletedRotativo: 910,
    deletedCan: 0,
    deletedEvents: 42,
    deletedSessions: 20
  }
}
```

#### **4. Obtener Vehículos**:
```
GET /api/dashboard/vehicles

Response:
[
  {
    id: "...",
    dobackId: "DOBACK024",
    licensePlate: "DOBACK024",
    status: "active"
  },
  ...
]
```

#### **5. Obtener Sesiones**:
```
GET /api/sessions?vehicleId=xxx

Response:
[
  {
    id: "...",
    vehicleId: "...",
    startTime: "2025-10-03T20:21:31Z",
    endTime: "2025-10-03T22:45:12Z",
    sessionNumber: 1,
    status: "COMPLETED",
    _count: {
      GpsMeasurement: 1234,
      StabilityMeasurement: 5678,
      stability_events: 12
    }
  },
  ...
]
```

#### **6. Obtener Ruta y Eventos de Sesión**:
```
GET /api/session-route/:sessionId

Response:
{
  success: true,
  session: {
    id: "...",
    vehicleId: "...",
    startTime: "...",
    endTime: "...",
    status: "COMPLETED"
  },
  route: [
    { lat: 40.123, lng: -3.456, speed: 12.5, timestamp: "..." },
    ...
  ],
  events: [
    {
      id: "...",
      timestamp: "2025-10-03T20:21:31Z",
      type: "dangerous_drift",
      severity: "critical",
      lat: 40.123,
      lng: -3.456,
      speed: 38.9,
      rotativoState: 1,
      si: 0.31,
      roll: -8.7,
      ay: 214.6,
      gx: 3172.1,
      ...
    },
    ...
  ],
  stats: {
    totalGpsPoints: 1234,
    validRoutePoints: 890,
    validEvents: 12,
    maxDistanceBetweenPoints: 500,
    minPointsRequired: 10
  }
}
```

---

## 🎨 **FRONTEND Y VISUALIZACIÓN**

### **Páginas Principales**:

#### **1. Gestión de Datos**:
```
/data-management

Componentes:
- FileUploadForm: Subida manual de archivos
- ProcessingProgress: Barra de progreso
- SessionsList: Lista de sesiones subidas
```

#### **2. Sesiones & Recorridos**:
```
/sessions-and-routes

Componentes:
- VehicleSessionSelector: Selectores de vehículo y sesión
- RouteMapComponent: Mapa con ruta y eventos
  - Inicio: 🟢 Marcador verde
  - Fin: 🔴 Marcador rojo
  - Eventos: Iconos según tipo
    - 🚨 Riesgo de Vuelco: Rojo
    - 🚨 Deriva Peligrosa: Naranja
    - ⚠️ Maniobra Brusca: Amarillo
```

#### **3. Procesamiento Automático**:
```
/automatic-processing

Componentes:
- CleanDatabaseButton: Limpiar BD
- AutoProcessButton: Procesar todos los vehículos
- ProcessingLog: Log en tiempo real
- ResultsSummary: Resumen de resultados
```

### **Componentes de Mapa**:

```typescript
// RouteMapComponent.tsx
<MapContainer center={center} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  
  {/* Ruta */}
  <Polyline positions={route} color="blue" weight={3} />
  
  {/* Inicio */}
  <Marker position={start} icon={greenIcon}>
    <Popup>Inicio: {startTime}</Popup>
  </Marker>
  
  {/* Fin */}
  <Marker position={end} icon={redIcon}>
    <Popup>Fin: {endTime}</Popup>
  </Marker>
  
  {/* Eventos */}
  {events.map(event => (
    <Marker position={[event.lat, event.lng]} icon={eventIcon}>
      <Popup>
        <EventPopup event={event} />
      </Popup>
    </Marker>
  ))}
</MapContainer>
```

### **Popup de Eventos**:

```html
<div style="min-width: 320px;">
  <!-- Header -->
  <div style="background: gradient; color: white; padding: 12px;">
    <h3>🚨 Deriva Peligrosa</h3>
  </div>
  
  <!-- Severidad -->
  <div style="background: #ffebee; padding: 8px;">
    <strong style="color: #d32f2f;">Severidad: CRITICAL</strong>
  </div>
  
  <!-- Hora -->
  <div>
    🕐 Hora: 03/10/2025, 20:21:31
  </div>
  
  <!-- Datos técnicos -->
  <div style="display: grid; grid-template-columns: 1fr 1fr;">
    <div>ÍNDICE ESTABILIDAD<br/>31.0%</div>
    <div>ROLL<br/>-8.7°</div>
    <div>ACEL. LATERAL<br/>0.21 m/s²</div>
    <div>GIRO (gx)<br/>3172.1°/s</div>
  </div>
  
  <!-- Velocidad -->
  <div>
    🚗 VELOCIDAD<br/>38.9 km/h
  </div>
  
  <!-- Rotativo -->
  <div>
    💡 ROTATIVO<br/>🔴 ENCENDIDO
  </div>
</div>
```

---

## 🔧 **CONFIGURACIÓN Y MANTENIMIENTO**

### **Inicialización del Sistema**:

```powershell
# Script único de inicio (usa SIEMPRE este)
.\iniciar.ps1

# Acciones del script:
1. Libera puertos 9998 y 5174
2. Verifica archivos necesarios
3. Inicia backend en ventana separada
4. Inicia frontend en ventana separada
5. Verifica servicios
6. Abre navegador en http://localhost:5174
7. Muestra credenciales de login
```

### **Variables de Entorno**:

```env
# Backend
PORT=9998
DATABASE_URL=postgresql://user:pass@localhost:5432/stabilsafe_dev
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:9998
VITE_PORT=5174
```

### **Configuración de API** (`frontend/src/config/api.ts`):

```typescript
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:9998',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'organizationId': getOrganizationId()
  }
};
```

### **Limpieza de Base de Datos**:

```sql
-- Orden de eliminación (respeta relaciones)
DELETE FROM stability_events;  -- 1. Eventos
DELETE FROM GpsMeasurement;    -- 2. GPS
DELETE FROM StabilityMeasurement;  -- 3. Estabilidad
DELETE FROM RotativoMeasurement;   -- 4. Rotativo
DELETE FROM CanMeasurement;        -- 5. CAN
DELETE FROM Session;               -- 6. Sesiones (último)
```

### **Mantenimiento**:

#### **Reiniciar Sistema**:
```powershell
# Detener procesos (Ctrl+C en cada ventana)
# Ejecutar script de inicio
.\iniciar.ps1
```

#### **Limpiar BD antes de Reprocesar**:
```
Frontend → "Procesamiento Automático" → "Limpiar Base de Datos"
```

#### **Ver Logs**:
```powershell
# Backend logs (en ventana de backend)
# Frontend logs (en ventana de frontend o consola del navegador)
```

---

## 📊 **RESUMEN DE FLUJO COMPLETO**

```
1. SUBIDA
   ↓
   Usuario selecciona archivos O usa procesamiento automático
   ↓
2. PARSEO
   ↓
   parseStabilityFile() → timestamps reales + datos
   parseGpsFile() → coordenadas + velocidad
   parseRotativoFile() → estado rotativo
   ↓
3. UNIFICACIÓN
   ↓
   Agrupar por número de sesión
   Calcular duración
   Filtrar sesiones cortas (< 5 min)
   ↓
4. DETECCIÓN DE EVENTOS
   ↓
   Para cada medición con SI < 50%:
   - Verificar umbrales (si, roll, gx, ay)
   - Correlacionar con GPS (< 30s)
   - Correlacionar con rotativo
   - Crear evento con todos los datos
   ↓
5. ALMACENAMIENTO
   ↓
   Crear sesión en BD
   Guardar mediciones (con timestamps únicos)
   Guardar eventos
   ↓
6. VISUALIZACIÓN
   ↓
   Frontend solicita sesiones y eventos
   Mapa muestra ruta + eventos
   Popups muestran datos detallados
```

---

## 🎯 **CARACTERÍSTICAS CLAVE**

### **✅ Implementadas**:
- ✅ Subida manual y automática de archivos
- ✅ Parseo con timestamps reales del archivo
- ✅ Filtrado GPS riguroso (callejeado 500m, 10 puntos mínimos)
- ✅ Detección de eventos según catálogo oficial DoBack
- ✅ Solo eventos si SI < 50%
- ✅ Correlación temporal GPS + Rotativo
- ✅ Timestamps únicos (milisegundos incrementales)
- ✅ Almacenamiento completo de datos
- ✅ Limpieza de BD (incluye eventos)
- ✅ Visualización en mapa con Leaflet
- ✅ Popups detallados y visuales
- ✅ Filtrado de sesiones cortas (< 5 min)

### **📋 Reglas de Negocio**:
- ⚠️ Solo eventos si SI < 0.50 (50%)
- ⚠️ Sesiones < 300s se descartan
- ⚠️ GPS con < 10 puntos se descartan
- ⚠️ Correlación GPS < 30s
- ⚠️ Distancia máxima entre puntos: 500m
- ⚠️ Velocidad máxima realista: 120 km/h

---

## 📝 **HISTORIAL DE VERSIONES**

| Versión | Descripción | Fecha |
|---------|-------------|-------|
| v6.1 | Sistema base con subida y procesamiento | 2025-10-07 |
| v6.2 | Corrección de errores de parsing | 2025-10-07 |
| v6.3 | Filtrado GPS optimizado (500m, 10 puntos) | 2025-10-07 |
| v6.4 | Parser con timestamps reales del archivo | 2025-10-07 |
| v6.5 | Limpieza BD incluye eventos | 2025-10-07 |
| v6.6 | Implementación catálogo oficial DoBack | 2025-10-07 |
| v6.7 | Fix variables de eventos (isRiesgoVuelco) | 2025-10-07 |
| v6.8 | Timestamps exactos en eventos | 2025-10-07 |
| v6.9 | Timestamps únicos con contador por segundo | 2025-10-07 |
| v7.0 | **Sistema completo y funcional** ✅ | 2025-10-07 |

---

**Fecha de Documentación**: 7 de Octubre de 2025  
**Versión**: 7.0 - Sistema Completo y Funcional  
**Estado**: ✅ **PRODUCCIÓN**

🎯 **Sistema DoBackSoft completamente documentado, funcional y listo para uso en producción.**
