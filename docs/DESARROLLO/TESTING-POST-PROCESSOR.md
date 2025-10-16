# 🧪 GUÍA DE TESTING - POST-PROCESSOR

**Versión:** 1.0  
**Fecha:** 2025-10-15  
**Objetivo:** Verificar que el sistema genera eventos y segmentos automáticamente

---

## 🎯 QUÉ SE VA A PROBAR

Después de la corrección del Post-Processor, el sistema debe:

1. ✅ Generar eventos de estabilidad automáticamente tras la subida
2. ✅ Generar segmentos operacionales (claves)
3. ✅ Invalidar cache de KPIs
4. ✅ Mostrar eventos en el mapa de sesiones
5. ✅ No crear duplicados al re-procesar

---

## 📋 ESTADO ACTUAL DE LA BASE DE DATOS

### Antes de la Corrección

```
📊 Estado actual:
   - Sesiones: 63
   - Mediciones de estabilidad: 1,211,986
   - Puntos con SI < 0.50: 3,453
   - Eventos generados: 0 ❌
   - Segmentos operacionales: 0 ❌
```

**Problema:** Los eventos NO se generaban porque había dos sistemas de post-procesamiento en conflicto.

---

## 🔧 SOLUCIÓN APLICADA

### Cambios Implementados

1. **Desactivado post-procesamiento antiguo** en `UnifiedFileProcessorV2.ts`
   - Antes: Llamaba a `processAndSaveStabilityEvents()` (con bug)
   - Ahora: Solo usa `UploadPostProcessor` (nuevo y correcto)

2. **Flujo centralizado en `UploadPostProcessor`:**
   ```
   Subida → Procesamiento → UploadPostProcessor.process()
                               ├─> Eventos (generateStabilityEventsForSession)
                               ├─> Segmentos (generateOperationalSegments)
                               └─> Cache invalidado
   ```

---

## 🧪 MÉTODO 1: PROBAR CON ARCHIVOS NUEVOS (Recomendado)

### Pasos

1. **Ir a la UI de Upload:**
   ```
   http://localhost:5174/upload
   ```

2. **Subir archivos de prueba** (cualquiera de CMadrid que aún no esté procesado)

3. **Observar logs del backend:**
   ```
   ✅ Esperar ver:
   
   info: [UnifiedFileProcessor-V2] ✅ Procesamiento completado en XXXXms
   info: [UnifiedFileProcessor-V2]    → N sesiones creadas
   info: 🔄 Iniciando post-procesamiento de N sesiones
   info: 📊 Procesando sesión XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   info: 🚨 Generando eventos de estabilidad para sesión
   info: ✅ Eventos generados para sesión XXXXXXXX: { count: X }
   info: ✅ Segmentos generados para sesión XXXXXXXX: { count: Y }
   info: ✅ Cache de KPIs invalidado
   info: ✅ Post-procesamiento completado en XXXms
   ```

4. **Verificar en la base de datos:**
   ```sql
   SELECT COUNT(*) FROM stability_events;
   SELECT COUNT(*) FROM operational_state_segments;
   ```

5. **Verificar en la UI:**
   - Ir a **Dashboard → Sesiones y Recorridos**
   - Seleccionar la sesión recién subida
   - **Verificar que aparecen:**
     - ✅ Ruta GPS en el mapa
     - ✅ Puntos de eventos (rojos/naranjas/amarillos)
     - ✅ Filtros de eventos funcionan

---

## 🧪 MÉTODO 2: RE-PROCESAR SESIONES EXISTENTES

### Opción A: Script Node.js

**Ejecutar:**
```bash
node reprocesar-sesiones-test.js
```

**Salida esperada:**
```
🔄 Iniciando re-procesamiento de sesiones...

📊 Encontradas 5 sesiones para procesar:

  - ID: b32ca621...
    Inicio: 2025-10-08T14:39:48.000Z
    Duración: 57 min

  ...
```

**Nota:** Este script solo LISTA las sesiones. Para re-procesarlas, necesitas un endpoint.

---

### Opción B: Crear Endpoint Temporal

**Agregar a `backend/src/routes/upload-unified.ts`:**

```typescript
/**
 * ⚠️ ENDPOINT TEMPORAL - Solo para testing
 * Re-procesa una sesión existente
 */
router.post('/reprocess/:sessionId', 
    authenticateJWT,
    async (req: Request, res: Response) => {
        const { sessionId } = req.params;
        
        try {
            logger.info(`🔄 Re-procesando sesión: ${sessionId}`);
            
            const { UploadPostProcessor } = await import('../services/upload/UploadPostProcessor');
            const result = await UploadPostProcessor.process([sessionId]);
            
            res.json({
                success: true,
                sessionId,
                eventsGenerated: result.eventsGenerated,
                segmentsGenerated: result.segmentsGenerated,
                duration: result.duration,
                errors: result.errors
            });
        } catch (error: any) {
            logger.error(`❌ Error re-procesando sesión ${sessionId}:`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * ⚠️ ENDPOINT TEMPORAL - Solo para testing
 * Re-procesa TODAS las sesiones (cuidado en producción)
 */
router.post('/reprocess-all',
    authenticateJWT,
    async (req: Request, res: Response) => {
        try {
            const organizationId = (req as any).user?.organizationId;
            
            const sesiones = await prisma.session.findMany({
                where: { organizationId },
                select: { id: true },
                orderBy: { startTime: 'desc' },
                take: 10 // Limitar a 10 para no saturar
            });
            
            logger.info(`🔄 Re-procesando ${sesiones.length} sesiones...`);
            
            const sessionIds = sesiones.map(s => s.id);
            
            const { UploadPostProcessor } = await import('../services/upload/UploadPostProcessor');
            const result = await UploadPostProcessor.process(sessionIds);
            
            res.json({
                success: true,
                sessionsProcessed: sesiones.length,
                eventsGenerated: result.eventsGenerated,
                segmentsGenerated: result.segmentsGenerated,
                duration: result.duration,
                errors: result.errors
            });
        } catch (error: any) {
            logger.error('❌ Error re-procesando sesiones:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);
```

**Uso con cURL:**

```bash
# Re-procesar una sesión específica
curl -X POST http://localhost:9998/api/upload-unified/reprocess/SESSION_ID_AQUI \
     -H "Authorization: Bearer TU_TOKEN_JWT" \
     -H "Content-Type: application/json"

# Re-procesar todas las sesiones (últimas 10)
curl -X POST http://localhost:9998/api/upload-unified/reprocess-all \
     -H "Authorization: Bearer TU_TOKEN_JWT" \
     -H "Content-Type: application/json"
```

---

### Opción C: Crear Script TypeScript Completo

**Crear `scripts/testing/reprocesar-completo.ts`:**

```typescript
import { PrismaClient } from '@prisma/client';
import { UploadPostProcessor } from '../../backend/src/services/upload/UploadPostProcessor';
import { createLogger } from '../../backend/src/utils/logger';

const prisma = new PrismaClient();
const logger = createLogger('ReprocesarScript');

async function reprocesarTodo() {
    console.log('🔄 Iniciando re-procesamiento completo...\n');

    try {
        // Obtener todas las sesiones
        const sesiones = await prisma.session.findMany({
            select: { id: true },
            orderBy: { startTime: 'desc' }
        });

        console.log(`📊 Total sesiones encontradas: ${sesiones.length}\n`);

        // Procesar en lotes de 5
        const loteSize = 5;
        let totalEventos = 0;
        let totalSegmentos = 0;

        for (let i = 0; i < sesiones.length; i += loteSize) {
            const lote = sesiones.slice(i, i + loteSize);
            const sessionIds = lote.map(s => s.id);

            console.log(`🔄 Procesando lote ${Math.floor(i / loteSize) + 1} (sesiones ${i + 1}-${i + lote.length})...`);

            const result = await UploadPostProcessor.process(sessionIds);

            totalEventos += result.eventsGenerated;
            totalSegmentos += result.segmentsGenerated;

            console.log(`   ✅ Eventos: ${result.eventsGenerated}, Segmentos: ${result.segmentsGenerated}\n`);

            // Pausa de 1 segundo entre lotes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('─'.repeat(60));
        console.log('\n✅ RE-PROCESAMIENTO COMPLETADO\n');
        console.log(`📊 Resultados finales:`);
        console.log(`   - Sesiones procesadas: ${sesiones.length}`);
        console.log(`   - Eventos generados: ${totalEventos}`);
        console.log(`   - Segmentos generados: ${totalSegmentos}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reprocesarTodo();
```

**Ejecutar:**
```bash
npx ts-node scripts/testing/reprocesar-completo.ts
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Logs Backend

- [ ] Se ve "🔄 Iniciando post-procesamiento de X sesiones"
- [ ] Se ve "🚨 Generando eventos de estabilidad para sesión"
- [ ] Se ve "✅ Eventos generados para sesión XXX: { count: N }"
- [ ] Se ve "✅ Segmentos generados para sesión XXX: { count: M }"
- [ ] Se ve "✅ Cache de KPIs invalidado"
- [ ] NO se ve "Iniciando generación de eventos de estabilidad optimizada" (antiguo)

---

### Base de Datos

```sql
-- Verificar eventos generados
SELECT COUNT(*) as total_eventos FROM stability_events;
-- Debe ser > 0

-- Verificar segmentos generados
SELECT COUNT(*) as total_segmentos FROM operational_state_segments;
-- Debe ser > 0

-- Ver últimos eventos generados
SELECT id, session_id, type, severity, timestamp, lat, lon
FROM stability_events
ORDER BY timestamp DESC
LIMIT 10;

-- Ver distribución de severidades
SELECT severity, COUNT(*) as count
FROM stability_events
GROUP BY severity
ORDER BY count DESC;
```

---

### UI Frontend

1. **Ir a Dashboard → Sesiones y Recorridos**
2. **Seleccionar una sesión con eventos**
3. **Verificar:**
   - [ ] Mapa muestra ruta GPS (línea azul)
   - [ ] Puntos de eventos visibles (rojos/naranjas/amarillos)
   - [ ] Al hacer clic en un evento, muestra detalles
   - [ ] Filtros de eventos funcionan (por tipo, severidad)
   - [ ] Estadísticas de la sesión muestran eventos

---

## 🐛 PROBLEMAS COMUNES

### Problema 1: No se generan eventos

**Síntomas:**
```
info: ✅ Eventos generados para sesión XXX: { count: 0 }
```

**Diagnóstico:**
```sql
-- Verificar si hay mediciones de estabilidad
SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = 'SESSION_ID_AQUI';

-- Verificar si hay puntos críticos (SI < 0.50)
SELECT COUNT(*) FROM "StabilityMeasurement" 
WHERE "sessionId" = 'SESSION_ID_AQUI' AND si < 0.50;
```

**Posibles causas:**
- ✅ Normal: La sesión no tiene puntos críticos (conducción estable, SI >= 0.50)
- ❌ Bug: No hay mediciones de estabilidad en la BD

---

### Problema 2: Error "Session not found"

**Síntomas:**
```
warn: ⚠️ Sesión no encontrada para invalidar cache: SESSION_ID
```

**Solución:**
- Verificar que el sessionId es correcto
- Verificar que la sesión existe en la BD

---

### Problema 3: Eventos duplicados

**Síntomas:**
```
warn: ⚠️ Eventos ya existen para esta sesión, saltando creación
```

**Diagnóstico:**
```sql
SELECT COUNT(*) FROM stability_events WHERE session_id = 'SESSION_ID_AQUI';
```

**Solución:**
- ✅ Normal: El sistema evita duplicados automáticamente
- Si necesitas regenerar eventos, elimina los antiguos:
  ```sql
  DELETE FROM stability_events WHERE session_id = 'SESSION_ID_AQUI';
  ```

---

## 📊 MÉTRICAS ESPERADAS

### Ejemplo: 63 sesiones con 1,211,986 mediciones

```
📊 Estimaciones (basado en datos reales):
   
   Mediciones totales:          1,211,986
   Puntos con SI < 0.50:        3,453 (0.28%)
   
   Eventos esperados:           ~2,500 - 3,500
   ├─ GRAVE:                    ~500 (SI < 0.20)
   ├─ MODERADA:                 ~1,000 (0.20 ≤ SI < 0.35)
   └─ LEVE:                     ~1,500 (0.35 ≤ SI < 0.50)
   
   Segmentos esperados:         ~500 - 1,000
   ├─ Clave 0 (motor apagado):  ~20%
   ├─ Clave 2 (rotativo bajo):  ~30%
   └─ Clave 5 (rotativo alto):  ~50%
```

---

## 🎯 RESULTADO ESPERADO

### ✅ Todo Funciona Correctamente

```
📊 Resultado de Testing:
   
   ✅ Subida de archivos:
      - Sesiones creadas: 63
      - Post-procesamiento automático: ✅
      - Logs claros y sin duplicados: ✅
   
   ✅ Base de datos:
      - Eventos generados: 3,241
      - Segmentos generados: 847
      - Sin duplicados: ✅
   
   ✅ UI Frontend:
      - Eventos visibles en mapa: ✅
      - Filtros funcionan: ✅
      - KPIs actualizados: ✅
```

---

## 📝 SIGUIENTE PASO

Una vez verificado que todo funciona:

1. ✅ **Marcar ETAPA 1 como completada**
2. 🔄 **Proceder con ETAPA 2 - Validación de Datos Extendida**
3. 🔄 **ETAPA 3 - AI Engine y Reportes**

---

**FIN DE LA GUÍA**

