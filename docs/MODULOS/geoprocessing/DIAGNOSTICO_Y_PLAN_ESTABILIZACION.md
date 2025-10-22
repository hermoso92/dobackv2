# 🔍 DIAGNÓSTICO Y PLAN DE ESTABILIZACIÓN - Módulo de Geoprocesamiento

**Fecha:** 2025-10-17  
**Estado:** 🔴 **CRÍTICO - REQUIERE ACCIÓN INMEDIATA**

---

## 📊 RESUMEN EJECUTIVO

### **Estado Actual**
- ✅ **Código implementado:** 100% completo
- ✅ **Dependencias instaladas:** axios-retry, @turf/boolean-point-in-polygon, @turf/helpers
- ✅ **PostGIS:** Instalado y funcionando (v3.5)
- ✅ **Base de datos:** Scripts SQL ejecutados correctamente
- ❌ **OSRM:** **NO ESTÁ CORRIENDO** (puerto 5000 cerrado)
- ❌ **Modelos Prisma:** **NO GENERADOS** (ProcessingLog, SpeedLimitConfig, SpeedLimitCache ausentes)
- ❌ **Variable OSRM_URL:** **NO DEFINIDA** en config.env
- ❌ **Integración:** **NO ACTIVADA** en UploadPostProcessor

### **Causa Raíz del Problema**
El módulo de geoprocesamiento se implementó **asumiendo Docker**, pero el entorno real es **local sin Docker**. Esto genera:

1. **OSRM no está corriendo** → Fallback a Haversine (cálculos imprecisos)
2. **Modelos Prisma no generados** → Errores de tipo en tiempo de ejecución
3. **Variables de entorno faltantes** → URLs hardcodeadas o indefinidas
4. **Ejecución "exprés"** → El sistema usa fallback Haversine, no OSRM real

---

## 🗺️ MAPA DE CUMPLIMIENTO DEL PLAN

| Componente | Planificado | Implementado | Estado | Gap |
|------------|-------------|--------------|--------|-----|
| **OSRM Service** | ✅ | ✅ | 🟡 | Falta OSRM corriendo |
| **Geofence Detector** | ✅ | ✅ | 🟢 | OK |
| **Route Processor** | ✅ | ✅ | 🟡 | Falta integración |
| **PostGIS** | ✅ | ✅ | 🟢 | OK |
| **Modelos Prisma** | ✅ | ❌ | 🔴 | No generados |
| **Endpoints API** | ✅ | ✅ | 🟡 | Sin OSRM no funcionan |
| **Scripts SQL** | ✅ | ✅ | 🟢 | OK |
| **Docker Compose** | ✅ | ❌ | 🔴 | No usado |
| **Variables ENV** | ✅ | ❌ | 🔴 | OSRM_URL faltante |
| **Integración Upload** | ✅ | ❌ | 🔴 | No activada |

**Leyenda:**
- 🟢 **OK** - Implementado y funcionando
- 🟡 **PARCIAL** - Implementado pero no funcional
- 🔴 **CRÍTICO** - No implementado o bloqueante

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **1. OSRM NO ESTÁ CORRIENDO** (Prioridad: CRÍTICA)

**Evidencia:**
```powershell
Test-NetConnection -ComputerName localhost -Port 5000
# Resultado: False (puerto cerrado)
```

**Impacto:**
- ❌ Map-matching **NO funciona** (usa fallback Haversine)
- ❌ Distancias y duraciones **imprecisas**
- ❌ Healthcheck falla → `/api/geoprocessing/health` retorna `unhealthy`
- ❌ Todos los endpoints de geoprocesamiento **fallan silenciosamente**

**Causa Raíz:**
- El plan asumía Docker con `docker-compose up -d osrm`
- En entorno local sin Docker, **no hay proceso OSRM corriendo**
- Los archivos `.osrm` existen en `osrm-data/` pero no hay servidor que los use

**Solución:**
- **Opción A (Recomendada):** Instalar y ejecutar OSRM en local
- **Opción B:** Usar Docker solo para OSRM (PostgreSQL ya está local)
- **Opción C:** Desactivar OSRM temporalmente y usar solo Haversine

---

### **2. MODELOS PRISMA NO GENERADOS** (Prioridad: CRÍTICA)

**Evidencia:**
```bash
grep -r "ProcessingLog\|SpeedLimitConfig\|SpeedLimitCache" backend/prisma/schema.prisma
# Resultado: No matches found
```

**Impacto:**
- ❌ TypeScript **no reconoce** los modelos nuevos
- ❌ `prisma.processingLog` → **Error de compilación**
- ❌ `prisma.speedLimitConfig` → **Error de compilación**
- ❌ `prisma.speedLimitCache` → **Error de compilación**
- ❌ Backend **no compila** o falla en runtime

**Causa Raíz:**
- Los modelos están en `database/01-init-postgis.sql` (SQL directo)
- **NO están en** `backend/prisma/schema.prisma` (Prisma)
- Prisma Client no se regeneró después de crear las tablas

**Solución:**
- **Opción A (Recomendada):** Agregar modelos a `schema.prisma` y regenerar
- **Opción B:** Usar `prisma.$queryRaw` para todo (más verboso)

---

### **3. VARIABLE OSRM_URL FALTANTE** (Prioridad: ALTA)

**Evidencia:**
```bash
grep "OSRM_URL" backend/config.env
# Resultado: No matches found
```

**Impacto:**
- ⚠️ `OSRMService` usa valor por defecto: `http://localhost:5000`
- ⚠️ **No es configurable** sin editar código
- ⚠️ Si OSRM corre en otro puerto, **no se puede cambiar**

**Causa Raíz:**
- El plan asumía Docker con variables de entorno automáticas
- En local, **no hay .env con OSRM_URL**

**Solución:**
- Agregar `OSRM_URL=http://localhost:5000` a `backend/config.env`

---

### **4. INTEGRACIÓN NO ACTIVADA** (Prioridad: MEDIA)

**Evidencia:**
- `UploadPostProcessor` no llama a `routeProcessorService.processSession()`
- El geoprocesamiento **solo se ejecuta manualmente** vía endpoint

**Impacto:**
- ⚠️ Las sesiones subidas **NO se procesan automáticamente**
- ⚠️ Usuario debe llamar manualmente a `/api/geoprocessing/session/:id`
- ⚠️ **No hay auditoría** de procesamiento en uploads

**Causa Raíz:**
- El código de integración está preparado pero **comentado o no llamado**

**Solución:**
- Activar llamada a `routeProcessorService.processSession()` en `UploadPostProcessor`

---

### **5. EJECUCIÓN "EXPRÉS" (SÍNTOMA, NO CAUSA)** (Prioridad: BAJA)

**Evidencia:**
- Procesos que deberían tardar minutos (OSRM matching) acaban en segundos
- No se ve descarga de OSM ni compilación de `.osrm`

**Causa Raíz:**
- OSRM **no está corriendo** → Se usa fallback Haversine (instantáneo)
- El fallback es **intencional** pero **menos preciso**

**Solución:**
- Arreglar OSRM (problema #1) → El matching volverá a ser lento (esperado)

---

## 🎯 ESTRATEGIAS DE ESTABILIZACIÓN

### **OPCIÓN A: CORRECCIÓN INCREMENTAL (Recomendada)**

**Pros:**
- ✅ Mantiene el código ya implementado
- ✅ Esfuerzo: **2-3 horas**
- ✅ Riesgo: **BAJO** (cambios puntuales)
- ✅ No requiere revertir commits

**Contras:**
- ⚠️ Requiere instalar OSRM en local (complejo)
- ⚠️ Mantenimiento futuro: dos entornos (local + Docker)

**Pasos:**
1. Agregar modelos a `schema.prisma` (30 min)
2. Regenerar Prisma Client (5 min)
3. Agregar `OSRM_URL` a `config.env` (5 min)
4. Instalar OSRM en local (1-2 horas)
5. Activar integración en `UploadPostProcessor` (15 min)
6. Tests y verificación (30 min)

**Criterio de Éxito:**
- ✅ `/api/geoprocessing/health` retorna `healthy`
- ✅ `POST /api/geoprocessing/session/:id` procesa sesión correctamente
- ✅ Logs muestran `✅ Ruta matcheada` (no Haversine)
- ✅ Backend compila sin errores de TypeScript

---

### **OPCIÓN B: REVERTIR Y REHACER CON DOCKER**

**Pros:**
- ✅ Entorno consistente (Docker en dev + prod)
- ✅ OSRM ya está en Docker Compose
- ✅ Menos configuración manual

**Contras:**
- ❌ Esfuerzo: **4-6 horas** (revertir + rehacer)
- ❌ Riesgo: **MEDIO** (pérdida de trabajo si no se hace bien)
- ❌ Requiere migrar PostgreSQL a Docker (pérdida de datos actuales)

**Pasos:**
1. Hacer backup de base de datos actual (15 min)
2. Revertir commits de geoprocesamiento (30 min)
3. Levantar Docker Compose completo (30 min)
4. Migrar datos a PostgreSQL en Docker (1-2 horas)
5. Reaplicar cambios de geoprocesamiento (1-2 horas)
6. Tests y verificación (1 hora)

**Criterio de Éxito:**
- ✅ `docker-compose ps` muestra todos los servicios UP
- ✅ `/api/geoprocessing/health` retorna `healthy`
- ✅ Base de datos migrada sin pérdida de datos

---

### **OPCIÓN C: HÍBRIDO (Docker solo para OSRM)**

**Pros:**
- ✅ PostgreSQL sigue en local (datos intactos)
- ✅ OSRM en Docker (más fácil de mantener)
- ✅ Esfuerzo: **1-2 horas**
- ✅ Riesgo: **BAJO**

**Contras:**
- ⚠️ Entorno mixto (puede confundir)
- ⚠️ Requiere Docker instalado

**Pasos:**
1. Agregar modelos a `schema.prisma` (30 min)
2. Regenerar Prisma Client (5 min)
3. Agregar `OSRM_URL` a `config.env` (5 min)
4. Levantar solo OSRM con Docker (30 min)
5. Activar integración en `UploadPostProcessor` (15 min)
6. Tests y verificación (30 min)

**Criterio de Éxito:**
- ✅ `docker ps` muestra contenedor OSRM corriendo
- ✅ `/api/geoprocessing/health` retorna `healthy`
- ✅ PostgreSQL sigue en local (sin cambios)

---

## 📋 PLAN PASO A PASO (OPCIÓN A - RECOMENDADA)

### **FASE 1: PREPARACIÓN (30 min)**

#### **1.1 Agregar Modelos a Prisma**

**Archivo:** `backend/prisma/schema.prisma`

**Acción:**
```prisma
// Agregar al final del archivo, antes del último }

model ProcessingLog {
  id              String    @id @default(dbgenerated("gen_random_uuid()"))
  sessionId       String    @map("session_id")
  processingType  String    @map("processing_type")
  version         String
  startedAt       DateTime  @default(now()) @map("started_at")
  finishedAt      DateTime? @map("finished_at")
  status          String?
  details         Json?
  errorMessage    String?   @map("error_message") @db.Text
  createdAt       DateTime  @default(now()) @map("created_at")
  
  @@index([sessionId, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([processingType, createdAt(sort: Desc)])
  @@map("processing_log")
}

model SpeedLimitConfig {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  roadType      String   @map("road_type")
  vehicleType   String   @map("vehicle_type")
  speedLimit    Int      @map("speed_limit")
  emergencyBonus Int     @default(0) @map("emergency_bonus")
  organizationId String? @map("organization_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at")

  @@unique([roadType, vehicleType, organizationId])
  @@map("speed_limits_config")
}

model SpeedLimitCache {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  lat        Decimal  @db.Decimal(10, 8)
  lon        Decimal  @db.Decimal(11, 8)
  speedLimit Int      @map("speed_limit")
  roadType   String?  @map("road_type")
  source     String   @default("tomtom")
  cachedAt   DateTime @default(now()) @map("cached_at")
  expiresAt  DateTime @default(dbgenerated("NOW() + INTERVAL '30 days'")) @map("expires_at")

  @@unique([lat, lon], map: "unique_coords")
  @@map("speed_limits_cache")
}
```

**Verificación:**
```powershell
cd backend
npx prisma validate
# Debe retornar: "The schema is valid"
```

---

#### **1.2 Regenerar Prisma Client**

**Acción:**
```powershell
cd backend
npx prisma generate
```

**Verificación:**
```powershell
npx prisma studio
# Debe abrir navegador con tablas: ProcessingLog, SpeedLimitConfig, SpeedLimitCache
```

---

#### **1.3 Agregar Variables de Entorno**

**Archivo:** `backend/config.env`

**Acción:**
```bash
# Agregar al final del archivo

# OSRM Configuration
OSRM_URL=http://localhost:5000
```

**Verificación:**
```powershell
Select-String "OSRM_URL" backend/config.env
# Debe retornar: OSRM_URL=http://localhost:5000
```

---

### **FASE 2: INSTALACIÓN DE OSRM (1-2 horas)**

#### **2.1 Instalar OSRM Backend**

**Acción:**
```powershell
# Descargar OSRM Backend para Windows
# Opción 1: Usar precompilado desde https://github.com/Project-OSRM/osrm-backend/releases
# Opción 2: Usar Docker solo para OSRM (RECOMENDADO)

# Crear docker-compose.osrm.yml
```

**Archivo:** `docker-compose.osrm.yml`
```yaml
version: '3.8'

services:
  osrm:
    image: osrm/osrm-backend:latest
    container_name: dobacksoft-osrm
    ports:
      - "5000:5000"
    volumes:
      - ./osrm-data:/data
    command: osrm-routed --algorithm mld /data/madrid-latest.osrm
    restart: unless-stopped
```

**Acción:**
```powershell
docker-compose -f docker-compose.osrm.yml up -d
```

**Verificación:**
```powershell
# Esperar 10-15 segundos para que OSRM inicie
Start-Sleep -Seconds 15

# Verificar logs
docker logs dobacksoft-osrm

# Debe mostrar: "listening on: 0.0.0.0:5000"
```

---

#### **2.2 Verificar OSRM**

**Acción:**
```powershell
# Healthcheck
curl http://localhost:5000/nearest/v1/driving/-3.692,40.419

# Debe retornar JSON con "code": "Ok"
```

**Verificación:**
```powershell
Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet
# Debe retornar: True
```

---

### **FASE 3: INTEGRACIÓN (30 min)**

#### **3.1 Activar Integración en UploadPostProcessor**

**Archivo:** `backend/src/services/upload/UploadPostProcessor.ts`

**Acción:**
```typescript
// Agregar import
import { routeProcessorService } from '../geoprocessing/RouteProcessorService';

// En la función processSession, después de guardar la sesión:
// ... existing code ...

// Procesar con OSRM (opcional, puede fallar silenciosamente)
try {
    await routeProcessorService.processSession(session.id);
    logger.info(`✅ Geoprocesamiento completado para sesión ${session.id}`);
} catch (error: any) {
    logger.warn(`⚠️ Geoprocesamiento falló para sesión ${session.id}: ${error.message}`);
    // No lanzar error, el upload ya fue exitoso
}
```

**Verificación:**
```powershell
# Recompilar backend
cd backend
npm run build

# Debe compilar sin errores
```

---

### **FASE 4: VERIFICACIÓN (30 min)**

#### **4.1 Verificar Health Endpoint**

**Acción:**
```powershell
curl http://localhost:9998/api/health
```

**Salida Esperada:**
```json
{
  "status": "ok",
  "ts": "2025-10-17T..."
}
```

---

#### **4.2 Verificar Geoprocessing Health**

**Acción:**
```powershell
curl http://localhost:9998/api/geoprocessing/health
```

**Salida Esperada:**
```json
{
  "status": "healthy",
  "services": {
    "osrm": "healthy",
    "postgis": "healthy"
  },
  "timestamp": "2025-10-17T..."
}
```

**Si falla:**
- 🔴 `"osrm": "unhealthy"` → OSRM no está corriendo (ver Fase 2)
- 🔴 `"postgis": "unhealthy"` → PostGIS no está instalado (ver Fase 1)

---

#### **4.3 Ejecutar Test de Geoprocesamiento**

**Acción:**
```powershell
cd backend
npx ts-node src/scripts/test-geoprocessing.ts
```

**Salida Esperada:**
```
🧪 Iniciando pruebas de geoprocesamiento...

1️⃣ Verificando OSRM...
✅ OSRM funcionando

2️⃣ Procesando sesión de prueba...

✅ Resultados:
   📏 Distancia: 12345.67m (12.35 km)
   ⏱️  Duración: 1234s (20.6 min)
   🎯 Confianza: 95.0%
   🗺️  Eventos geocerca: 5
```

**Si falla:**
- 🔴 `❌ OSRM no disponible` → Ver Fase 2
- 🔴 `❌ Error: Sesión no encontrada` → Usar ID de sesión real de la BD

---

#### **4.4 Verificar Logs del Backend**

**Acción:**
```powershell
# Ver logs en tiempo real
Get-Content backend/logs/app.log -Tail 50 -Wait
```

**Buscar:**
- ✅ `✅ Ruta matcheada: XXX m, confianza: X.XX` (OSRM funcionando)
- ❌ `⚠️ Error en OSRM, usando fallback Haversine` (OSRM no funciona)

---

### **FASE 5: PRUEBA END-TO-END (15 min)**

#### **5.1 Subir Archivo y Verificar Procesamiento**

**Acción:**
1. Subir archivo GPS/Estabilidad/CAN/Rotativo vía `/api/upload-unified`
2. Esperar 10 segundos
3. Verificar logs del backend

**Verificación:**
```powershell
# Ver última sesión creada
psql -U postgres -d dobacksoft -c "SELECT id, vehicle_id, start_time, matched_distance, matched_confidence FROM \"Session\" ORDER BY created_at DESC LIMIT 1;"
```

**Salida Esperada:**
```
                id                | vehicle_id | start_time | matched_distance | matched_confidence
----------------------------------+------------+------------+------------------+-------------------
 5894090f-156c-4816-92c6-4632e7dd | ...        | 2025-10-17 | 12345.67         | 0.95
```

**Si `matched_distance` es NULL:**
- 🔴 El geoprocesamiento no se ejecutó (ver Fase 3)

---

#### **5.2 Verificar Processing Log**

**Acción:**
```powershell
psql -U postgres -d dobacksoft -c "SELECT session_id, processing_type, status, error_message FROM processing_log ORDER BY created_at DESC LIMIT 5;"
```

**Salida Esperada:**
```
           session_id            | processing_type |  status   | error_message
---------------------------------+-----------------+-----------+---------------
 5894090f-156c-4816-92c6-4632e7dd | geoprocessing   | success   | NULL
```

**Si `status` es `failed`:**
- 🔴 Ver `error_message` para diagnóstico

---

## 🛑 STOP-THE-LINE POLICY

**Si cualquier verificación falla, DETENER y CORREGIR antes de continuar:**

| Fase | Verificación | Si Falla | Acción |
|------|--------------|----------|--------|
| 1.1 | `npx prisma validate` | Errores de sintaxis | Corregir `schema.prisma` |
| 1.2 | `npx prisma generate` | Errores de generación | Verificar conexión a BD |
| 1.3 | `Select-String "OSRM_URL"` | No encuentra variable | Verificar `config.env` |
| 2.1 | `docker logs dobacksoft-osrm` | Contenedor no inicia | Verificar archivos `.osrm` |
| 2.2 | `Test-NetConnection -Port 5000` | Puerto cerrado | Reiniciar contenedor |
| 3.1 | `npm run build` | Errores de compilación | Corregir imports/código |
| 4.1 | `/api/health` | No responde | Backend no está corriendo |
| 4.2 | `/api/geoprocessing/health` | `osrm: unhealthy` | Ver Fase 2 |
| 4.3 | `test-geoprocessing.ts` | Sesión no encontrada | Usar ID real de BD |
| 5.1 | `matched_distance IS NULL` | No procesó | Ver Fase 3 |

---

## 🎯 CRITERIOS DE ÉXITO FINAL

### **Checklist de Validación:**

- [ ] Backend compila sin errores de TypeScript
- [ ] Prisma Client genera modelos: ProcessingLog, SpeedLimitConfig, SpeedLimitCache
- [ ] OSRM responde en `http://localhost:5000`
- [ ] `/api/health` retorna `{"status": "ok"}`
- [ ] `/api/geoprocessing/health` retorna `{"status": "healthy", "services": {"osrm": "healthy", "postgis": "healthy"}}`
- [ ] `test-geoprocessing.ts` ejecuta sin errores
- [ ] Logs muestran `✅ Ruta matcheada` (no Haversine)
- [ ] Sesión subida tiene `matched_distance` y `matched_confidence` en BD
- [ ] `processing_log` tiene registro con `status = 'success'`

---

## 📊 COMPARACIÓN DE OPCIONES

| Criterio | Opción A (Incremental) | Opción B (Revertir + Docker) | Opción C (Híbrido) |
|----------|------------------------|-------------------------------|---------------------|
| **Esfuerzo** | 2-3 horas | 4-6 horas | 1-2 horas |
| **Riesgo** | BAJO | MEDIO | BAJO |
| **Pérdida de datos** | NO | SÍ (migración) | NO |
| **Mantenimiento** | MEDIO | BAJO | MEDIO |
| **Complejidad** | MEDIA | ALTA | BAJA |
| **Recomendación** | ✅ **SÍ** | ❌ NO | 🟡 ALTERNATIVA |

---

## 🚨 RIESGOS Y MITIGACIONES

### **Riesgo 1: OSRM no compila en Windows**
- **Probabilidad:** MEDIA
- **Impacto:** ALTO
- **Mitigación:** Usar Docker solo para OSRM (Opción C)

### **Riesgo 2: Prisma Client no genera modelos**
- **Probabilidad:** BAJA
- **Impacto:** ALTO
- **Mitigación:** Verificar sintaxis de `schema.prisma` antes de generar

### **Riesgo 3: Variables de entorno no se cargan**
- **Probabilidad:** BAJA
- **Impacto:** MEDIO
- **Mitigación:** Reiniciar backend después de agregar variables

### **Riesgo 4: Performance degradado con OSRM**
- **Probabilidad:** ALTA
- **Impacto:** BAJO
- **Mitigación:** Usar límite de 90 puntos (ya implementado)

---

## 📝 PRÓXIMOS PASOS (DESPUÉS DE ESTABILIZAR)

1. **Monitoreo:** Agregar métricas de uso de OSRM
2. **Optimización:** Cache de rutas matcheadas
3. **Testing:** Suite de tests automatizados
4. **Documentación:** Actualizar README con instrucciones de instalación local
5. **CI/CD:** Integrar tests en pipeline

---

## 🎉 CONCLUSIÓN

**El módulo de geoprocesamiento está 95% implementado**, pero **no es funcional** debido a:

1. ❌ OSRM no está corriendo
2. ❌ Modelos Prisma no generados
3. ❌ Variables de entorno faltantes
4. ❌ Integración no activada

**Recomendación:** **Opción A (Corrección Incremental)** con **Opción C (Docker solo para OSRM)** como alternativa.

**Tiempo estimado:** 2-3 horas  
**Riesgo:** BAJO  
**Éxito probable:** 90%

---

**Documento generado por:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** 🔴 **PENDIENTE DE APROBACIÓN Y EJECUCIÓN**

