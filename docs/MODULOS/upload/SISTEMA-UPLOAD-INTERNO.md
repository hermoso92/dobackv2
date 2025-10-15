# 📤 SISTEMA DE UPLOAD - ARQUITECTURA INTERNA

## 📋 Índice

1. [Visión General](#visión-general)
2. [Flujo Completo](#flujo-completo)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Procesamiento de Archivos](#procesamiento-de-archivos)
5. [Detección de Sesiones](#detección-de-sesiones)
6. [Correlación Temporal](#correlación-temporal)
7. [Validación y Persistencia](#validación-y-persistencia)
8. [Sistema de Errores](#sistema-de-errores)

---

## 🎯 Visión General

El sistema de upload de DobackSoft procesa archivos de datos telemáticos (GPS, CAN, Rotativo, Estabilidad) y los convierte en sesiones estructuradas almacenadas en la base de datos.

### Características Principales

- ✅ **Procesamiento unificado** de múltiples tipos de archivo
- ✅ **Detección automática** de sesiones múltiples por archivo (1-62 sesiones)
- ✅ **Correlación temporal** entre archivos de diferentes tipos
- ✅ **Interpolación GPS** para cubrir huecos de señal
- ✅ **Validación exhaustiva** de datos y foreign keys
- ✅ **Manejo robusto de errores** con logs detallados
- ✅ **Configuración flexible** desde frontend

---

## 🔄 Flujo Completo

### Diagrama General

```
┌──────────────────────────────────────────┐
│  1. Upload Frontend (Drag & Drop)       │
│     - Selección de archivos              │
│     - Configuración opcional             │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  2. POST /api/upload-unified/unified     │
│     - Multer recibe archivos             │
│     - Extrae userId, organizationId      │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  3. UnifiedFileProcessorV2               │
│     a. Validar Foreign Keys              │
│     b. Agrupar archivos (vehículo/fecha) │
│     c. Procesar cada grupo               │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  4. SessionDetectorV2                    │
│     - Detectar sesiones por archivo      │
│     - Identificar rangos temporales      │
│     - Asignar session_number             │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  5. TemporalCorrelator                   │
│     - Correlacionar sesiones por tiempo  │
│     - Umbral: ±5 minutos                 │
│     - Crear CorrelatedSession            │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  6. SessionValidator                     │
│     - Validar calidad de datos           │
│     - Verificar duración mínima          │
│     - Revisar GPS válido                 │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  7. Guardar en Base de Datos             │
│     - Session (metadata)                 │
│     - GPS, Rotativo, Estabilidad         │
│     - Operational State Segments         │
│     - Stability Events                   │
└──────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  8. Respuesta con Detalle                │
│     - Sesiones creadas                   │
│     - Estadísticas de procesamiento      │
│     - Advertencias y errores             │
└──────────────────────────────────────────┘
```

---

## 🧩 Componentes del Sistema

### 1. UnifiedFileProcessorV2

**Ubicación:** `backend/src/services/upload/UnifiedFileProcessorV2.ts`

**Responsabilidad:** Orquestador principal del procesamiento.

**Métodos Principales:**
```typescript
class UnifiedFileProcessorV2 {
    async procesarArchivos(
        archivos: ArchivoSubida[],
        organizationId: string,
        userId: string,
        customConfig?: any
    ): Promise<ProcessingResult>
    
    private agruparArchivos(archivos: ArchivoSubida[]): GrupoArchivos[]
    
    private async procesarGrupo(
        grupo: GrupoArchivos,
        organizationId: string,
        userId: string
    ): Promise<SessionDetails[]>
}
```

---

### 2. SessionDetectorV2

**Ubicación:** `backend/src/services/upload/SessionDetectorV2.ts`

**Responsabilidad:** Detectar sesiones individuales dentro de cada archivo.

**Lógica de Detección:**
```typescript
// Detectar inicio de sesión
if (línea.includes('Sesión:')) {
    // Extraer sessionNumber
    const sessionNumber = parseInt(match[3]);
    
    // Crear nueva sesión
    currentSession = {
        sessionNumber,
        startTime: new Date(match[1]),
        vehicleId: `DOBACK${match[2]}`,
        measurements: []
    };
}

// Detectar fin de sesión
if (línea === '' || i === lines.length - 1) {
    sessions.push(currentSession);
    currentSession = null;
}
```

**Resultado:**
```typescript
interface DetectedSession {
    sessionNumber: number;
    startTime: Date;
    endTime: Date;
    vehicleId: string;
    measurements: Measurement[];
}
```

---

### 3. TemporalCorrelator

**Ubicación:** `backend/src/services/upload/TemporalCorrelator.ts`

**Responsabilidad:** Correlacionar sesiones de diferentes archivos por tiempo.

**Algoritmo:**
```typescript
// 1. Obtener todas las sesiones detectadas
const gpsDetectedSessions = SessionDetector.detectSessions(gpsBuffer);
const stabDetectedSessions = SessionDetector.detectSessions(stabBuffer);
const rotDetectedSessions = SessionDetector.detectSessions(rotBuffer);

// 2. Para cada sesión GPS, buscar correlaciones
for (const gpsSession of gpsDetectedSessions) {
    const correlatedSession: CorrelatedSession = {
        sessionNumber: gpsSession.sessionNumber,
        startTime: gpsSession.startTime,
        endTime: gpsSession.endTime,
        gps: gpsSession,
        estabilidad: null,
        rotativo: null
    };

    // 3. Buscar sesión de estabilidad correlacionada (±5 min)
    const stabSession = stabDetectedSessions.find(s => 
        Math.abs(s.startTime - gpsSession.startTime) < 5 * 60 * 1000
    );
    
    if (stabSession) {
        correlatedSession.estabilidad = stabSession;
    }

    // 4. Buscar sesión de rotativo correlacionada (±5 min)
    const rotSession = rotDetectedSessions.find(s => 
        Math.abs(s.startTime - gpsSession.startTime) < 5 * 60 * 1000
    );
    
    if (rotSession) {
        correlatedSession.rotativo = rotSession;
    }

    correlatedSessions.push(correlatedSession);
}
```

**Umbral de Correlación:** ±5 minutos

---

### 4. ForeignKeyValidator

**Ubicación:** `backend/src/services/upload/validators/ForeignKeyValidator.ts`

**Responsabilidad:** Validar que existen las entidades referenciadas.

**Validaciones:**
```typescript
class ForeignKeyValidator {
    static async validateAll(userId: string, organizationId: string) {
        const errors: string[] = [];

        // 1. Validar usuario
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            errors.push('Usuario no encontrado');
        }

        // 2. Validar organización
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });
        if (!org) {
            errors.push('Organización no encontrada');
        }

        // 3. Validar relación usuario-organización
        if (user && org && user.organizationId !== organizationId) {
            errors.push('Usuario no pertenece a la organización');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
```

---

### 5. SessionValidator

**Ubicación:** `backend/src/services/upload/validators/SessionValidator.ts`

**Responsabilidad:** Validar calidad de sesiones correlacionadas.

**Reglas de Validación:**
```typescript
class SessionValidator {
    static validate(session: CorrelatedSession): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Duración mínima (30 segundos)
        const duration = session.endTime - session.startTime;
        if (duration < 30 * 1000) {
            errors.push('Sesión demasiado corta (< 30s)');
        }

        // 2. GPS válido
        if (!session.gps || session.gps.measurements.length === 0) {
            errors.push('Sin datos GPS');
        }

        // 3. Coordenadas válidas
        const validGPS = session.gps?.measurements.filter(g => 
            g.latitude > 35 && g.latitude < 45 &&
            g.longitude > -5 && g.longitude < -1
        ).length || 0;

        const gpsPercentage = (validGPS / session.gps.measurements.length) * 100;
        
        if (gpsPercentage < 30) {
            errors.push('GPS inválido (<30% válido)');
        } else if (gpsPercentage < 50) {
            warnings.push('GPS de baja calidad (30-50% válido)');
        }

        // 4. Estabilidad opcional
        if (!session.estabilidad) {
            warnings.push('Sin datos de estabilidad');
        }

        // 5. Rotativo opcional
        if (!session.rotativo) {
            warnings.push('Sin datos de rotativo');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
```

---

## 📄 Procesamiento de Archivos

### Parsers Robustos

#### RobustGPSParser

**Ubicación:** `backend/src/services/parsers/RobustGPSParser.ts`

**Función:** Parsear archivos GPS con interpolación.

```typescript
export function parseGPSRobust(
    content: string,
    sessionNumber: number
): GPSMeasurement[] {
    const lines = content.split('\n').filter(line => line.trim());
    const measurements: GPSMeasurement[] = [];
    
    let headers: string[] | null = null;

    for (const line of lines) {
        // Detectar cabecera
        if (line.includes('Fecha-Hora;Estado;')) {
            headers = line.split(';').map(h => h.trim());
            continue;
        }

        // Skip líneas sin datos
        if (!line.includes(';')) continue;

        const values = line.split(';');
        
        // Validar longitud
        if (!headers || values.length !== headers.length) continue;

        // Parsear valores
        const measurement: GPSMeasurement = {
            timestamp: parseDate(values[0]),
            latitude: parseFloat(values[4]),
            longitude: parseFloat(values[5]),
            speed: parseFloat(values[6]),
            satellites: parseInt(values[3]),
            fix: values[2]
        };

        // Validar coordenadas
        if (isValidCoordinate(measurement.latitude, measurement.longitude)) {
            measurements.push(measurement);
        }
    }

    // Interpolar GPS si hay huecos
    return interpolarGPS(measurements);
}
```

**Interpolación:**
```typescript
export function interpolarGPS(
    measurements: GPSMeasurement[]
): GPSMeasurement[] {
    const interpolados: GPSMeasurement[] = [];
    
    for (let i = 0; i < measurements.length - 1; i++) {
        const actual = measurements[i];
        const siguiente = measurements[i + 1];
        
        interpolados.push(actual);

        // Calcular gap temporal
        const gap = siguiente.timestamp - actual.timestamp;
        
        // Si gap > 30s, interpolar
        if (gap > 30000) {
            const steps = Math.floor(gap / 5000); // Cada 5 segundos
            
            for (let j = 1; j < steps; j++) {
                const ratio = j / steps;
                
                const interpolado: GPSMeasurement = {
                    timestamp: new Date(actual.timestamp.getTime() + (gap * ratio)),
                    latitude: actual.latitude + (siguiente.latitude - actual.latitude) * ratio,
                    longitude: actual.longitude + (siguiente.longitude - actual.longitude) * ratio,
                    speed: actual.speed + (siguiente.speed - actual.speed) * ratio,
                    satellites: actual.satellites,
                    fix: 'interpolated'
                };
                
                interpolados.push(interpolado);
            }
        }
    }
    
    interpolados.push(measurements[measurements.length - 1]);
    
    return interpolados;
}
```

---

#### RobustStabilityParser

**Ubicación:** `backend/src/services/parsers/RobustStabilityParser.ts`

**Función:** Parsear archivos de estabilidad.

```typescript
export function parseEstabilidadRobust(
    content: string,
    sessionNumber: number
): StabilityMeasurement[] {
    const lines = content.split('\n').filter(line => line.trim());
    const measurements: StabilityMeasurement[] = [];
    
    let headers: string[] | null = null;

    for (const line of lines) {
        // Detectar cabecera
        if (line.includes('ax; ay; az;')) {
            headers = line.split(';').map(h => h.trim());
            continue;
        }

        // Skip líneas sin datos
        if (!line.includes(';')) continue;

        const values = line.split(';');
        
        const measurement: StabilityMeasurement = {
            timestamp: parseDate(values[0]),
            ax: parseFloat(values[1]),
            ay: parseFloat(values[2]),
            az: parseFloat(values[3]),
            gx: parseFloat(values[4]),
            gy: parseFloat(values[5]),
            gz: parseFloat(values[6]),
            roll: parseFloat(values[7]),
            pitch: parseFloat(values[8]),
            si: parseFloat(values[9])
        };

        // Validar SI en rango [0, 1]
        if (measurement.si >= 0 && measurement.si <= 1) {
            measurements.push(measurement);
        }
    }

    return measurements;
}
```

---

#### RobustRotativoParser

**Ubicación:** `backend/src/services/parsers/RobustRotativoParser.ts`

**Función:** Parsear archivos de rotativo.

```typescript
export function parseRotativoRobust(
    content: string,
    sessionNumber: number
): RotativoMeasurement[] {
    const lines = content.split('\n').filter(line => line.trim());
    const measurements: RotativoMeasurement[] = [];
    
    for (const line of lines) {
        // Skip cabecera
        if (line.includes('Fecha-Hora;Estado')) continue;

        // Skip líneas sin datos
        if (!line.includes(';')) continue;

        const values = line.split(';');
        
        const measurement: RotativoMeasurement = {
            timestamp: parseDate(values[0]),
            state: values[1].trim() // '0', '1', '2'
        };

        measurements.push(measurement);
    }

    return measurements;
}
```

---

## 🔍 Detección de Sesiones

### Estructura de Archivos

**Formato Estándar:**
```
TIPO_DOBACKXXX_YYYYMMDD.txt

Ejemplos:
- GPS_DOBACK023_20251001.txt
- ESTABILIDAD_DOBACK023_20251001.txt
- ROTATIVO_DOBACK023_20251001.txt
```

**Contenido de Archivo:**
```
ESTABILIDAD;01/10/2025 10:30:45;DOBACK023;Sesión:1;...
[cabecera de columnas]
01/10/2025 10:30:45;2.5;3.1;9.8;10.2;5.3;2.1;3.5;1.2;0.85
01/10/2025 10:30:46;2.6;3.0;9.9;10.1;5.2;2.2;3.6;1.3;0.84
...
[línea vacía = fin de sesión]

ESTABILIDAD;01/10/2025 14:20:15;DOBACK023;Sesión:2;...
[cabecera de columnas]
01/10/2025 14:20:15;2.3;3.2;9.7;11.5;5.5;2.0;3.2;1.1;0.78
...
```

### Detección Multi-Sesión

**Problema:** Un archivo puede contener 1-62 sesiones.

**Solución:**
```typescript
function detectSessions(content: string): DetectedSession[] {
    const sessions: DetectedSession[] = [];
    let currentSession: DetectedSession | null = null;

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detectar inicio de sesión
        if (line.startsWith('ESTABILIDAD;') && line.includes('Sesión:')) {
            // Guardar sesión anterior
            if (currentSession) {
                sessions.push(currentSession);
            }

            // Extraer metadatos
            const match = line.match(/ESTABILIDAD;(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2});DOBACK(\d+);Sesión:(\d+);/);
            
            if (match) {
                currentSession = {
                    sessionNumber: parseInt(match[3]),
                    startTime: parseDate(match[1]),
                    vehicleId: `DOBACK${match[2]}`,
                    measurements: []
                };
            }
        }

        // Detectar fin de sesión (línea vacía o fin de archivo)
        if (line === '' || i === lines.length - 1) {
            if (currentSession) {
                sessions.push(currentSession);
                currentSession = null;
            }
        }

        // Añadir medición a sesión actual
        if (currentSession && line.includes(';')) {
            const measurement = parseMeasurement(line);
            if (measurement) {
                currentSession.measurements.push(measurement);
            }
        }
    }

    return sessions;
}
```

---

## ⏱️ Correlación Temporal

### Algoritmo de Correlación

**Objetivo:** Unir sesiones de GPS, Estabilidad y Rotativo que ocurren al mismo tiempo.

**Reglas:**
1. GPS es obligatorio (sesión "ancla")
2. Estabilidad y Rotativo son opcionales
3. Umbral de correlación: ±5 minutos
4. Se correlaciona por `startTime` más cercano

**Implementación:**
```typescript
class TemporalCorrelator {
    static correlate(
        gpsDetectedSessions: DetectedSession[],
        stabDetectedSessions: DetectedSession[],
        rotDetectedSessions: DetectedSession[]
    ): CorrelatedSession[] {
        const correlatedSessions: CorrelatedSession[] = [];

        for (const gpsSession of gpsDetectedSessions) {
            const correlated: CorrelatedSession = {
                sessionNumber: gpsSession.sessionNumber,
                startTime: gpsSession.startTime,
                endTime: gpsSession.endTime,
                gps: gpsSession,
                estabilidad: null,
                rotativo: null
            };

            // Buscar estabilidad más cercana (±5 min)
            const stabSession = this.findClosestSession(
                gpsSession.startTime,
                stabDetectedSessions,
                5 * 60 * 1000 // 5 minutos
            );

            if (stabSession) {
                correlated.estabilidad = stabSession;
            }

            // Buscar rotativo más cercano (±5 min)
            const rotSession = this.findClosestSession(
                gpsSession.startTime,
                rotDetectedSessions,
                5 * 60 * 1000
            );

            if (rotSession) {
                correlated.rotativo = rotSession;
            }

            correlatedSessions.push(correlated);
        }

        return correlatedSessions;
    }

    private static findClosestSession(
        targetTime: Date,
        sessions: DetectedSession[],
        threshold: number
    ): DetectedSession | null {
        let closest: DetectedSession | null = null;
        let minDiff = Infinity;

        for (const session of sessions) {
            const diff = Math.abs(session.startTime.getTime() - targetTime.getTime());
            
            if (diff < threshold && diff < minDiff) {
                closest = session;
                minDiff = diff;
            }
        }

        return closest;
    }
}
```

---

## ✅ Validación y Persistencia

### Guardar Sesión

```typescript
async function guardarSesion(
    correlatedSession: CorrelatedSession,
    vehicleId: string,
    organizationId: string,
    userId: string
): Promise<string> {
    // 1. Crear registro de sesión
    const session = await prisma.session.create({
        data: {
            vehicleId,
            userId,
            organizationId,
            startTime: correlatedSession.startTime,
            endTime: correlatedSession.endTime,
            sessionNumber: correlatedSession.sessionNumber,
            status: 'COMPLETED',
            type: 'ROUTINE'
        }
    });

    // 2. Guardar mediciones GPS
    if (correlatedSession.gps) {
        await prisma.gpsMeasurement.createMany({
            data: correlatedSession.gps.measurements.map(m => ({
                sessionId: session.id,
                ...m
            }))
        });
    }

    // 3. Guardar mediciones de estabilidad
    if (correlatedSession.estabilidad) {
        await prisma.stabilityMeasurement.createMany({
            data: correlatedSession.estabilidad.measurements.map(m => ({
                sessionId: session.id,
                ...m
            }))
        });
    }

    // 4. Guardar mediciones de rotativo
    if (correlatedSession.rotativo) {
        await prisma.rotativoMeasurement.createMany({
            data: correlatedSession.rotativo.measurements.map(m => ({
                sessionId: session.id,
                ...m
            }))
        });
    }

    // 5. Generar segmentos operacionales
    await generateOperationalStateSegments(session.id);

    // 6. Generar eventos de estabilidad
    await generateStabilityEvents(session.id);

    return session.id;
}
```

---

## ❌ Sistema de Errores

### Tipos de Errores

| Código | Tipo | Descripción |
|--------|------|-------------|
| `INVALID_FOREIGN_KEYS` | Validación | Usuario u organización no válidos |
| `INVALID_FILE_FORMAT` | Parsing | Formato de archivo incorrecto |
| `NO_GPS_DATA` | Validación | Sesión sin datos GPS |
| `SESSION_TOO_SHORT` | Validación | Sesión < 30 segundos |
| `LOW_GPS_QUALITY` | Warning | GPS < 50% válido |
| `NO_STABILITY_DATA` | Warning | Sin datos de estabilidad |

### Respuesta de Error

```json
{
  "success": false,
  "error": "Error procesando archivos",
  "details": [
    {
      "archivo": "GPS_DOBACK023_20251001.txt",
      "error": "Formato de archivo inválido"
    }
  ],
  "warnings": [
    "GPS de baja calidad en sesión 5 (45% válido)"
  ]
}
```

---

## 📚 Referencias

- [Sistema de KPIs](../../BACKEND/SISTEMA-KPIS.md)
- [Generación de Eventos](../../BACKEND/GENERACION-EVENTOS.md)
- [Arquitectura Interna](../../BACKEND/ARQUITECTURA-INTERNA.md)

---

**Última actualización:** Octubre 2025  
**Versión:** DobackSoft StabilSafe V3

