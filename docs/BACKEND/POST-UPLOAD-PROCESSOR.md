# 🔄 POST-UPLOAD PROCESSOR - DOCUMENTACIÓN TÉCNICA

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Componentes](#componentes)
4. [Flujo de Ejecución](#flujo-de-ejecución)
5. [API y Respuestas](#api-y-respuestas)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

El **Post-Upload Processor** es un sistema automático que ejecuta tareas de procesamiento tras la creación de sesiones, cerrando el ciclo completo de:

```
Upload → Sesiones → Eventos → Segmentos → Cache → Dashboard
```

### Problema que Resuelve

**Antes:**
```
1. Usuario sube archivos
2. Sistema crea sesiones ✅
3. Dashboard vacío ❌
4. Usuario debe ir a "Generar Eventos" manualmente ❌
5. Usuario debe refrescar dashboard ❌
```

**Ahora:**
```
1. Usuario sube archivos
2. Sistema crea sesiones ✅
3. Sistema genera eventos automáticamente ✅
4. Sistema calcula segmentos automáticamente ✅
5. Sistema invalida cache ✅
6. Dashboard actualizado inmediatamente ✅
```

---

## 🏗️ Arquitectura

### Diagrama de Flujo

```
┌──────────────────────────────────┐
│  POST /api/upload-unified/unified│
│  - Recibe archivos               │
│  - Valida foreign keys           │
└──────────────────────────────────┘
                 ↓
┌──────────────────────────────────┐
│  UnifiedFileProcessorV2          │
│  - Agrupa archivos               │
│  - Detecta sesiones              │
│  - Correlaciona temporalmente    │
│  - Valida y guarda sesiones      │
└──────────────────────────────────┘
                 ↓
┌──────────────────────────────────┐
│  UploadPostProcessor.process()   │◄─ NUEVO
│  ┌────────────────────────────┐  │
│  │ Para cada sesión:          │  │
│  │ 1. Generar eventos         │  │
│  │ 2. Generar segmentos       │  │
│  │ 3. Invalidar cache         │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
                 ↓
┌──────────────────────────────────┐
│  Respuesta con métricas completas│
│  - Sesiones creadas              │
│  - Eventos generados             │
│  - Segmentos generados           │
│  - Errores (si hay)              │
└──────────────────────────────────┘
```

---

## 🧩 Componentes

### 1. UploadPostProcessor

**Ubicación:** `backend/src/services/upload/UploadPostProcessor.ts`

**Clase Principal:**
```typescript
export class UploadPostProcessor {
    static async process(sessionIds: string[]): Promise<PostProcessingResult>
    private static async processSession(sessionId: string, results: PostProcessingResult): Promise<void>
    private static async invalidateCache(sessionId: string): Promise<void>
}
```

**Responsabilidad:**
- Orquestar el procesamiento de múltiples sesiones
- Gestionar errores sin fallar el proceso completo
- Acumular métricas de procesamiento

---

### 2. OperationalKeyCalculator

**Ubicación:** `backend/src/services/OperationalKeyCalculator.ts`

**Funciones Principales:**
```typescript
export async function generateOperationalSegments(sessionId: string): Promise<OperationalSegment[]>
export async function getSegmentStats(sessionId: string): Promise<SegmentStats>
```

**Responsabilidad:**
- Analizar datos de rotativo
- Detectar cambios de estado
- Generar segmentos por clave operacional (0-5)
- Filtrar segmentos muy cortos

---

### 3. EventDetector (Extendido)

**Ubicación:** `backend/src/services/eventDetector.ts`

**Nueva Función:**
```typescript
export async function generateStabilityEventsForSession(sessionId: string): Promise<EventoDetectado[]>
```

**Responsabilidad:**
- Obtener mediciones de estabilidad
- Ejecutar detectores de eventos
- Correlacionar con GPS
- Guardar eventos en BD

---

## 🔄 Flujo de Ejecución

### Flujo Completo

```typescript
// 1. Upload recibe archivos
POST /api/upload-unified/unified
  ↓
// 2. Procesador unificado crea sesiones
UnifiedFileProcessorV2.procesarArchivos()
  → Retorna: { sesionesCreadas: 5, sessionIds: [...] }
  ↓
// 3. Post-processor automático
if (sesionesCreadas > 0) {
    UploadPostProcessor.process(sessionIds)
      ↓
    // 3.1. Para cada sesión
    for (sessionId of sessionIds) {
        // Generar eventos
        generateStabilityEventsForSession(sessionId)
          → Detecta eventos
          → Correlaciona con GPS
          → Guarda en stability_events
        
        // Generar segmentos
        generateOperationalSegments(sessionId)
          → Analiza rotativo
          → Detecta cambios de estado
          → Guarda en operational_state_segments
    }
      ↓
    // 3.2. Invalidar cache
    kpiCacheService.invalidate(organizationId)
      ↓
    // 3.3. Retornar métricas
    return {
        eventsGenerated: 284,
        segmentsGenerated: 45,
        errors: []
    }
}
  ↓
// 4. Responder al cliente con métricas completas
res.json({
    success: true,
    data: {
        sesionesCreadas: 5,
        postProcessing: { ... }
    }
})
```

---

## 🌐 API y Respuestas

### Endpoint Principal

**POST** `/api/upload-unified/unified`

**Headers:**
```http
Content-Type: multipart/form-data
Cookie: auth_token=<JWT>
```

**Body:**
```
FormData:
- files[]: File[] (archivos .txt)
```

---

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Procesamiento completado: 5 sesiones creadas",
  "data": {
    "sesionesCreadas": 5,
    "sessionIds": [
      "49ea78cf-97f5-4966-824c-4a0b11d2e617",
      "f6c47367-78e2-4289-a39b-e71901ebf3ea",
      "b7f66fa2-7ef6-4ee6-b9c4-551e56e13674",
      "2a71941b-6bfd-49eb-bb43-bea02aa0dc99",
      "ddb07a49-d19f-4692-a03c-ae0ef8fe739f"
    ],
    "archivosValidos": 15,
    "archivosConProblemas": 0,
    "estadisticas": {
      "gpsValido": 63.5,
      "gpsInterpolado": 15.2,
      "gpsSinSenal": 21.3,
      "estabilidadValida": 98.7,
      "rotativoValido": 100.0,
      "totalMediciones": 145023
    },
    "postProcessing": {
      "eventsGenerated": 284,
      "segmentsGenerated": 45,
      "errors": [],
      "duration": 1523
    },
    "problemas": []
  }
}
```

---

### Respuesta con Errores Parciales

```json
{
  "success": true,
  "message": "Procesamiento completado: 3 sesiones creadas",
  "data": {
    "sesionesCreadas": 3,
    "sessionIds": ["uuid1", "uuid2", "uuid3"],
    "postProcessing": {
      "eventsGenerated": 150,
      "segmentsGenerated": 25,
      "errors": [
        "Sesión uuid2: Sin datos de rotativo"
      ],
      "duration": 1234
    },
    "warnings": [
      "Post-procesamiento parcial: Error en sesión uuid2"
    ]
  }
}
```

---

## 🧪 Testing

### Test Manual - Flujo Completo

```bash
# 1. Preparar archivos de prueba
# Tener archivos GPS, ESTABILIDAD y ROTATIVO de un vehículo

# 2. Iniciar sistema
.\iniciar.ps1

# 3. Ir a upload
http://localhost:5174/upload

# 4. Subir archivos
# Arrastrar y soltar archivos .txt

# 5. Observar logs del backend
# Debe mostrar:
✅ Sesiones creadas: X
🔄 Iniciando post-procesamiento automático...
✅ Eventos generados: Y
✅ Segmentos generados: Z
✅ Post-procesamiento completado
✅ Cache de KPIs invalidado

# 6. Verificar BD
npx prisma studio
# Tabla stability_events → Debe tener registros
# Tabla operational_state_segments → Debe tener registros

# 7. Verificar Dashboard
http://localhost:5174/dashboard
# KPIs deben mostrar datos actualizados
# Eventos deben aparecer en mapa/lista
```

---

### Test Unitario

```typescript
import { UploadPostProcessor } from '../services/upload/UploadPostProcessor';
import { generateStabilityEventsForSession } from '../services/eventDetector';
import { generateOperationalSegments } from '../services/OperationalKeyCalculator';

describe('UploadPostProcessor', () => {
    it('should process sessions successfully', async () => {
        const sessionIds = ['uuid1', 'uuid2'];
        
        const result = await UploadPostProcessor.process(sessionIds);
        
        expect(result.eventsGenerated).toBeGreaterThan(0);
        expect(result.segmentsGenerated).toBeGreaterThan(0);
        expect(result.errors).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const sessionIds = ['invalid-uuid'];
        
        const result = await UploadPostProcessor.process(sessionIds);
        
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('invalid-uuid');
    });
});

describe('generateStabilityEventsForSession', () => {
    it('should generate events for valid session', async () => {
        const sessionId = 'valid-uuid';
        
        const events = await generateStabilityEventsForSession(sessionId);
        
        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toHaveProperty('tipo');
        expect(events[0]).toHaveProperty('severidad');
        expect(events[0]).toHaveProperty('timestamp');
    });
});
```

---

## 🐛 Troubleshooting

### Error: "Sin datos de rotativo"

**Causa:** Archivo ROTATIVO no fue subido o está vacío.

**Solución:**
- No es un error crítico
- Los segmentos NO se generan para esa sesión
- Los eventos SÍ se generan (solo dependen de estabilidad)

---

### Error: "Eventos ya existen para esta sesión"

**Causa:** Sesión fue procesada previamente.

**Solución:**
- Es comportamiento esperado (prevención de duplicados)
- Los eventos NO se duplican
- Se retorna la lista de eventos existentes

---

### Error: "Sesión no encontrada"

**Causa:** sessionId inválido o sesión eliminada.

**Solución:**
- Verificar que la sesión existe en BD
- Revisar logs de upload para ver si se creó correctamente

---

### Dashboard no se actualiza

**Causa:** Cache de frontend no invalidado.

**Solución:**
```typescript
// En frontend, tras upload exitoso:
queryClient.invalidateQueries({ queryKey: ['kpis'] });
queryClient.invalidateQueries({ queryKey: ['sessions'] });
queryClient.invalidateQueries({ queryKey: ['events'] });
```

---

## 📊 Métricas y Logging

### Logs Generados

```typescript
// Inicio
logger.info('🔄 Iniciando post-procesamiento automático...', {
    sessionCount: sessionIds.length
});

// Por cada sesión
logger.info('📊 Procesando sesión uuid1');
logger.info('🚨 Generando eventos de estabilidad para sesión', { sessionId });
logger.info('✅ Eventos generados: 28');
logger.info('🔑 Generando segmentos operacionales', { sessionId });
logger.info('✅ Segmentos generados: 9');

// Fin
logger.info('✅ Post-procesamiento completado', {
    eventsGenerated: 284,
    segmentsGenerated: 45,
    duration: 1523
});
```

---

### Métricas de Performance

**Benchmark (5 sesiones):**

| Operación | Tiempo Promedio | Descripción |
|-----------|-----------------|-------------|
| Generar eventos | ~300ms/sesión | Depende de # mediciones |
| Generar segmentos | ~100ms/sesión | Depende de # muestras rotativo |
| Invalidar cache | <10ms | Operación en memoria |
| **Total** | **~2s** | Para 5 sesiones |

---

## 🔐 Seguridad

### Validaciones

1. ✅ **Autenticación:** JWT requerido en upload
2. ✅ **Autorización:** organizationId automático desde JWT
3. ✅ **Duplicados:** Verificación antes de crear eventos/segmentos
4. ✅ **Integridad:** Foreign keys validados antes de procesar

---

### Aislamiento de Datos

```typescript
// Todos los eventos y segmentos incluyen organizationId
await prisma.$executeRaw`
    INSERT INTO stability_events (
        id, session_id, vehicle_id, organization_id, ...
    )
    VALUES (
        gen_random_uuid(),
        ${sessionId}::uuid,
        ${session.vehicleId}::uuid,
        ${session.organizationId}::uuid,  ← Filtro automático
        ...
    )
`;
```

---

## ⚡ Optimizaciones

### 1. Procesamiento Asíncrono

```typescript
// Las sesiones se procesan secuencialmente pero cada operación es async
for (const sessionId of sessionIds) {
    await this.processSession(sessionId, results);
}

// Dentro de processSession, las operaciones son paralelas:
const [events, segments] = await Promise.all([
    generateStabilityEventsForSession(sessionId),
    generateOperationalSegments(sessionId)
]);
```

**Futura optimización (si es necesario):**
```typescript
// Procesar sesiones en paralelo (con límite de concurrencia)
const BATCH_SIZE = 5;
for (let i = 0; i < sessionIds.length; i += BATCH_SIZE) {
    const batch = sessionIds.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(id => this.processSession(id, results)));
}
```

---

### 2. Raw SQL Queries

**Uso de raw queries para evitar problemas con Prisma:**

```typescript
// ✅ Usar $queryRaw para SELECT
const existing = await prisma.$queryRaw`
    SELECT id FROM stability_events 
    WHERE session_id = ${sessionId}::uuid 
    LIMIT 1
`;

// ✅ Usar $executeRaw para INSERT
await prisma.$executeRaw`
    INSERT INTO stability_events (...)
    VALUES (...)
`;
```

**Beneficios:**
- Compatibilidad con schema snake_case
- Casting explícito de tipos (uuid, timestamp)
- Mayor control sobre queries

---

### 3. Cache Invalidation Estratégica

```typescript
// Solo se invalida una vez, al final del procesamiento
// No se invalida por cada sesión individual
await this.invalidateCache(sessionIds[0]);
```

---

## 📚 Referencias

- [Arquitectura Interna](./ARQUITECTURA-INTERNA.md)
- [Sistema de Upload](../MODULOS/upload/SISTEMA-UPLOAD-INTERNO.md)
- [Generación de Eventos](./GENERACION-EVENTOS.md)
- [Sistema de KPIs](./SISTEMA-KPIS.md)
- [Plan de Acción](../DESARROLLO/PLAN-ACCION-POST-AUDITORIA.md)

---

**Última actualización:** 15 Octubre 2025  
**Versión:** DobackSoft StabilSafe V3  
**Estado:** ✅ IMPLEMENTADO Y OPERATIVO

