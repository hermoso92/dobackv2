# 🎯 PLAN DE ACCIÓN POST-AUDITORÍA

> **Plan técnico priorizado para cerrar gaps críticos**  
> **Tiempo estimado:** 3-4 días  
> **Prioridad:** CRÍTICA

---

## 📋 Resumen Ejecutivo

Tras revisar la auditoría externa y el estado actual del sistema, se identificaron **2 gaps críticos** que afectan la experiencia del usuario:

1. 🔴 **Eventos no se generan automáticamente tras upload**
2. 🟠 **Sesiones duplicadas pueden crearse**

Todo lo demás (IA, Data Quality, vistas materializadas) son **features futuras**, no bugs.

---

## 🔴 TAREA 1: Post-Upload Processor (CRÍTICO)

### Problema Actual

```typescript
// ❌ FLUJO ACTUAL
1. Usuario sube archivos → ✅ OK
2. Sistema crea sesiones → ✅ OK
3. Sistema guarda mediciones → ✅ OK
4. Sistema genera eventos → ❌ NO AUTOMÁTICO
5. Sistema recalcula KPIs → ❌ NO AUTOMÁTICO
6. Dashboard se actualiza → ❌ REQUIERE REFRESH MANUAL
```

### Solución

```typescript
// ✅ FLUJO DESEADO
1. Usuario sube archivos → ✅ OK
2. Sistema crea sesiones → ✅ OK
3. Sistema guarda mediciones → ✅ OK
4. Sistema genera eventos → ✅ AUTOMÁTICO (NUEVO)
5. Sistema recalcula segmentos → ✅ AUTOMÁTICO (NUEVO)
6. Sistema invalida cache → ✅ AUTOMÁTICO (YA EXISTE)
7. Dashboard se actualiza → ✅ AUTOMÁTICO (NUEVO)
```

---

### Implementación

#### Archivo 1: `backend/src/services/upload/UploadPostProcessor.ts`

```typescript
/**
 * POST-PROCESSOR DE UPLOAD
 * Ejecuta tareas automáticas tras crear sesiones
 */

import { logger } from '../../utils/logger';
import { generateStabilityEventsForSession } from '../eventDetector';
import { generateOperationalSegments } from '../OperationalKeyCalculator';
import { kpiCacheService } from '../KPICacheService';
import { prisma } from '../../config/prisma';

export class UploadPostProcessor {
    /**
     * Procesa una lista de sesiones recién creadas
     */
    static async process(sessionIds: string[]): Promise<ProcessingResult> {
        const startTime = Date.now();
        const results = {
            sessionIds,
            eventsGenerated: 0,
            segmentsGenerated: 0,
            errors: [] as string[]
        };

        logger.info(`🔄 Iniciando post-procesamiento de ${sessionIds.length} sesiones`);

        for (const sessionId of sessionIds) {
            try {
                // 1. Generar eventos de estabilidad
                const events = await generateStabilityEventsForSession(sessionId);
                results.eventsGenerated += events.length;
                logger.info(`✅ Eventos generados para sesión ${sessionId}:`, { count: events.length });

                // 2. Generar segmentos operacionales
                const segments = await generateOperationalSegments(sessionId);
                results.segmentsGenerated += segments.length;
                logger.info(`✅ Segmentos generados para sesión ${sessionId}:`, { count: segments.length });

            } catch (error: any) {
                logger.error(`❌ Error procesando sesión ${sessionId}:`, error);
                results.errors.push(`Sesión ${sessionId}: ${error.message}`);
            }
        }

        // 3. Invalidar cache de KPIs
        if (sessionIds.length > 0) {
            const session = await prisma.session.findUnique({
                where: { id: sessionIds[0] },
                select: { organizationId: true }
            });

            if (session) {
                kpiCacheService.invalidate(session.organizationId);
                logger.info('✅ Cache de KPIs invalidado', { organizationId: session.organizationId });
            }
        }

        const duration = Date.now() - startTime;
        logger.info(`✅ Post-procesamiento completado en ${duration}ms`, results);

        return results;
    }
}

interface ProcessingResult {
    sessionIds: string[];
    eventsGenerated: number;
    segmentsGenerated: number;
    errors: string[];
}
```

---

#### Archivo 2: Modificar `backend/src/routes/upload-unified.ts`

```typescript
// Línea 82-93 (MODIFICAR)

// Procesar con el procesador unificado
const resultado = await unifiedFileProcessor.procesarArchivos(
    archivos,
    organizationId,
    userId
);

// ✅ NUEVO: Post-procesamiento automático
if (resultado.sesionesCreadas > 0 && resultado.sessionIds) {
    logger.info('🔄 Iniciando post-procesamiento automático...');
    
    try {
        const postProcessResult = await UploadPostProcessor.process(resultado.sessionIds);
        
        // Añadir resultados al response
        resultado.postProcessing = {
            eventsGenerated: postProcessResult.eventsGenerated,
            segmentsGenerated: postProcessResult.segmentsGenerated,
            errors: postProcessResult.errors
        };
        
        logger.info('✅ Post-procesamiento completado', postProcessResult);
    } catch (error: any) {
        logger.error('❌ Error en post-procesamiento:', error);
        // No fallar la respuesta completa, solo advertir
        resultado.warnings = resultado.warnings || [];
        resultado.warnings.push(`Post-procesamiento parcial: ${error.message}`);
    }
}

// ✅ YA EXISTE: Invalidar cache de KPIs
if (resultado.sesionesCreadas > 0) {
    kpiCacheService.invalidate(organizationId);
    logger.info('Cache de KPIs invalidado después de upload', { organizationId });
}

// Responder con resultado detallado
const statusCode = resultado.success ? 200 : 207;

res.status(statusCode).json(resultado);
```

---

#### Archivo 3: Crear `backend/src/services/OperationalKeyCalculator.ts`

```typescript
/**
 * Generador de Segmentos Operacionales
 * Analiza datos CAN/Rotativo y genera segmentos por clave
 */

import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export async function generateOperationalSegments(sessionId: string): Promise<Segment[]> {
    logger.info('Generando segmentos operacionales', { sessionId });

    // 1. Obtener mediciones de rotativo
    const rotativoData = await prisma.rotativoMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });

    if (rotativoData.length === 0) {
        logger.warn('Sin datos de rotativo para generar segmentos', { sessionId });
        return [];
    }

    // 2. Generar segmentos basados en cambios de estado
    const segments: Segment[] = [];
    let currentSegment: Segment | null = null;

    for (const measurement of rotativoData) {
        const clave = determinarClave(measurement.state);

        if (!currentSegment || currentSegment.clave !== clave) {
            // Cerrar segmento anterior
            if (currentSegment) {
                currentSegment.endTime = measurement.timestamp;
                segments.push(currentSegment);
            }

            // Iniciar nuevo segmento
            currentSegment = {
                sessionId,
                clave,
                startTime: measurement.timestamp,
                endTime: measurement.timestamp
            };
        } else {
            // Extender segmento actual
            currentSegment.endTime = measurement.timestamp;
        }
    }

    // Cerrar último segmento
    if (currentSegment) {
        segments.push(currentSegment);
    }

    // 3. Guardar en BD
    await prisma.operationalStateSegment.createMany({
        data: segments.map(s => ({
            sessionId: s.sessionId,
            clave: s.clave,
            startTime: s.startTime,
            endTime: s.endTime
        }))
    });

    logger.info('✅ Segmentos operacionales generados', { 
        sessionId, 
        count: segments.length 
    });

    return segments;
}

function determinarClave(rotativoState: string): number {
    // Lógica de determinación de clave
    // Simplificada: rotativo ON → clave 2, OFF → clave 3
    if (rotativoState === '1' || rotativoState === '2') {
        return 2; // En movimiento con rotativo
    }
    return 3; // En movimiento sin rotativo
}

interface Segment {
    sessionId: string;
    clave: number;
    startTime: Date;
    endTime: Date;
}
```

---

#### Archivo 4: Refactorizar `backend/src/services/eventDetector.ts`

```typescript
// Añadir función wrapper para procesar sesión completa

export async function generateStabilityEventsForSession(sessionId: string): Promise<EventoDetectado[]> {
    logger.info('Generando eventos de estabilidad para sesión', { sessionId });

    // 1. Obtener mediciones de estabilidad
    const measurements = await prisma.stabilityMeasurement.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
    });

    if (measurements.length === 0) {
        logger.warn('Sin mediciones de estabilidad', { sessionId });
        return [];
    }

    // 2. Detectar eventos
    const eventos: EventoDetectado[] = [];

    for (const measurement of measurements) {
        // Ejecutar detectores
        const riesgoVuelco = detectarRiesgoVuelco(measurement);
        if (riesgoVuelco) eventos.push(riesgoVuelco);

        const vuelcoInminente = detectarVuelcoInminente(measurement);
        if (vuelcoInminente) eventos.push(vuelcoInminente);

        const derivaPeligrosa = detectarDerivaPeligrosa(measurement);
        if (derivaPeligrosa) eventos.push(derivaPeligrosa);

        const maniobraBrusca = detectarManiobraBrusca(measurement);
        if (maniobraBrusca) eventos.push(maniobraBrusca);
    }

    // 3. Correlacionar con GPS
    for (const evento of eventos) {
        const gpsPoint = await prisma.gpsMeasurement.findFirst({
            where: {
                sessionId,
                timestamp: {
                    gte: new Date(evento.timestamp.getTime() - 5000),
                    lte: new Date(evento.timestamp.getTime() + 5000)
                }
            },
            orderBy: { timestamp: 'asc' }
        });

        if (gpsPoint) {
            evento.lat = gpsPoint.latitude;
            evento.lon = gpsPoint.longitude;
        }
    }

    // 4. Guardar eventos
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { vehicleId: true, organizationId: true }
    });

    if (!session) {
        throw new Error(`Sesión no encontrada: ${sessionId}`);
    }

    await prisma.stabilityEvent.createMany({
        data: eventos.map(e => ({
            sessionId,
            vehicleId: session.vehicleId,
            organizationId: session.organizationId,
            timestamp: e.timestamp,
            type: e.tipo,
            severity: e.severidad,
            details: {
                ...e.valores,
                description: e.descripcion
            },
            latitude: e.lat,
            longitude: e.lon
        }))
    });

    logger.info('✅ Eventos de estabilidad guardados', { 
        sessionId, 
        count: eventos.length 
    });

    return eventos;
}
```

---

### Testing

```bash
# 1. Reiniciar backend
cd backend
npm run dev

# 2. Subir archivos de prueba
# Frontend: http://localhost:5174/upload

# 3. Verificar en logs:
# ✅ "🔄 Iniciando post-procesamiento automático..."
# ✅ "✅ Eventos generados para sesión..."
# ✅ "✅ Segmentos generados para sesión..."
# ✅ "✅ Cache de KPIs invalidado"

# 4. Verificar en BD
npx prisma studio
# Tabla stability_events → debe tener registros
# Tabla operational_state_segments → debe tener registros
```

---

## 🟠 TAREA 2: Validación de Duplicados

### Implementación

#### Modificar `backend/src/services/upload/UnifiedFileProcessorV2.ts`

```typescript
// En método guardarSesion (línea ~250)

private async guardarSesion(
    correlatedSession: CorrelatedSession,
    vehicleId: string,
    userId: string,
    organizationId: string
): Promise<{ id: string; created: boolean }> {
    // ✅ NUEVO: Verificar duplicado
    const existing = await prisma.session.findFirst({
        where: {
            vehicleId,
            organizationId,
            startTime: correlatedSession.startTime
        }
    });

    if (existing) {
        logger.warn('⚠️ Sesión duplicada detectada, usando existente', {
            sessionId: existing.id,
            vehicleId,
            startTime: correlatedSession.startTime
        });
        
        return { id: existing.id, created: false };
    }

    // Crear sesión nueva
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

    return { id: session.id, created: true };
}
```

---

## 📊 Resultado Esperado

### Antes
```
Usuario sube archivos
↓
Sesiones creadas ✅
↓
Dashboard vacío ❌
↓
Usuario debe ir a "Generar Eventos" ❌
↓
Usuario debe refrescar dashboard ❌
```

### Después
```
Usuario sube archivos
↓
Sesiones creadas ✅
↓
Eventos generados automáticamente ✅
↓
Segmentos calculados automáticamente ✅
↓
Dashboard actualizado automáticamente ✅
```

---

## ⏱️ Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Crear `UploadPostProcessor.ts` | 2 horas |
| Modificar `upload-unified.ts` | 1 hora |
| Crear `OperationalKeyCalculator.ts` | 2 horas |
| Refactorizar `eventDetector.ts` | 1 hora |
| Validación de duplicados | 1 hora |
| Testing completo | 2 horas |
| Documentación | 1 hora |
| **TOTAL** | **10 horas (1-2 días)** |

---

## ✅ Checklist de Implementación

- [ ] Crear `UploadPostProcessor.ts`
- [ ] Modificar `upload-unified.ts` (post-processing)
- [ ] Crear `OperationalKeyCalculator.ts`
- [ ] Refactorizar `eventDetector.ts` (wrapper)
- [ ] Añadir validación de duplicados
- [ ] Testing: Upload → Eventos automáticos
- [ ] Testing: Upload → Segmentos automáticos
- [ ] Testing: Upload → Cache invalidado
- [ ] Testing: Upload → Dashboard actualizado
- [ ] Documentar cambios

---

## 📚 Referencias

- [Sistema de Upload](../MODULOS/upload/SISTEMA-UPLOAD-INTERNO.md)
- [Generación de Eventos](../BACKEND/GENERACION-EVENTOS.md)
- [Sistema de KPIs](../BACKEND/SISTEMA-KPIS.md)
- [Auditoría Externa](../CALIDAD/AUDITORIA_EXTERNA_VALORACION.md)

---

**Última actualización:** Octubre 2025  
**Estado:** Pendiente de Implementación  
**Prioridad:** 🔴 CRÍTICA

